import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLANS } from '@/lib/stripe'
import { sendPaymentFailedEmail, sendSubscriptionCanceledEmail, sendSubscriptionReceiptEmail } from '@/lib/email'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Use service role so webhook can write without user session
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CARD_BRANDS: Record<string, string> = {
  amex: 'American Express',
  diners: 'Diners Club',
  discover: 'Discover',
  jcb: 'JCB',
  mastercard: 'Mastercard',
  unionpay: 'UnionPay',
  visa: 'Visa',
}

function describePaymentMethod(pm: string | Stripe.PaymentMethod | null | undefined): string | null {
  if (!pm || typeof pm === 'string' || !pm.card) return null
  const brand = CARD_BRANDS[pm.card.brand] ?? (pm.card.brand.charAt(0).toUpperCase() + pm.card.brand.slice(1))
  return pm.card.last4 ? `${brand} •••• ${pm.card.last4}` : brand
}

/**
 * Resolve everything the billing emails need from a subscription invoice:
 * the recipient, plan, subscription, and a human-readable payment method.
 * Returns null when the invoice is not tied to a subscription or no recipient
 * can be determined.
 */
async function resolveInvoiceContext(invoice: Stripe.Invoice) {
  const subscriptionRef = invoice.parent?.subscription_details?.subscription
  if (!subscriptionRef) return null
  const subscriptionId = typeof subscriptionRef === 'string' ? subscriptionRef : subscriptionRef.id

  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
  if (!customerId) return null

  const customer = await stripe.customers.retrieve(customerId, {
    expand: ['invoice_settings.default_payment_method'],
  })
  if (customer.deleted) return null

  const userId = customer.metadata?.supabase_user_id
  const { data: profile } = userId
    ? await supabase.from('profiles').select('email, full_name, plan').eq('id', userId).single()
    : { data: null }

  // A pre-signup checkout is linked to the account when the user confirms
  // their email. If that has not happened yet, fall back to the billing email.
  const to = profile?.email ?? invoice.customer_email ?? customer.email
  if (!to) {
    console.warn('[stripe webhook] no recipient for billing email', { invoice: invoice.id })
    return null
  }
  const firstName = profile?.full_name?.split(' ')[0] || customer.name?.split(' ')[0] || 'there'

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method'],
  })
  const item = subscription.items.data[0]
  const priceId = item?.price.id
  const plan = priceId === PLANS.teams.priceId ? 'teams'
    : priceId === PLANS.pro.priceId ? 'pro'
    : (profile?.plan as 'pro' | 'teams' | null) ?? 'pro'

  const paymentMethodLabel =
    describePaymentMethod(invoice.default_payment_method) ??
    describePaymentMethod(subscription.default_payment_method) ??
    describePaymentMethod(customer.invoice_settings?.default_payment_method)

  return { to, firstName, userId, subscription, item, plan, paymentMethodLabel }
}

/**
 * Send a branded billing receipt when a subscription invoice is charged.
 * This covers the first charge on day 8 (end of the free trial) and every
 * renewal after it. The $0 invoice created when a trial starts is skipped.
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (invoice.amount_paid <= 0) return

  const ctx = await resolveInvoiceContext(invoice)
  if (!ctx) return
  const { to, firstName, userId, subscription, item, plan, paymentMethodLabel } = ctx

  // The trial-ending charge is the first paid invoice on this subscription.
  const { data: paidInvoices } = await stripe.invoices.list({
    subscription: subscription.id,
    status: 'paid',
    limit: 100,
  })
  const isFirstPayment = !paidInvoices.some(i => i.id !== invoice.id && i.amount_paid > 0)

  const nextBillingDate = subscription.cancel_at_period_end || !item?.current_period_end
    ? null
    : new Date(item.current_period_end * 1000)

  const paidAtSeconds = invoice.status_transitions?.paid_at ?? invoice.created
  const { error } = await sendSubscriptionReceiptEmail({
    to,
    firstName,
    planName: PLANS[plan].name,
    amountPaid: invoice.amount_paid,
    currency: invoice.currency,
    paymentMethodLabel,
    invoiceNumber: invoice.number,
    paidAt: new Date(paidAtSeconds * 1000),
    nextBillingDate,
    billingInterval: item?.price.recurring?.interval ?? 'month',
    quantity: item?.quantity ?? 1,
    invoiceUrl: invoice.hosted_invoice_url ?? null,
    isFirstPayment,
  })
  if (error) throw error

  if (userId) {
    await supabase.from('profiles').update({
      subscription_status: subscription.status,
      subscription_id: subscription.id,
      plan,
    }).eq('id', userId)
  }
}

/**
 * Ask the customer to update their card when a subscription charge is
 * declined. Stripe keeps retrying on its own schedule; `next_payment_attempt`
 * is null once those retries are exhausted.
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (invoice.amount_due <= 0) return

  const ctx = await resolveInvoiceContext(invoice)
  if (!ctx) return
  const { to, firstName, userId, subscription, plan, paymentMethodLabel } = ctx

  // The decline message lives on the PaymentIntent behind the invoice.
  let failureReason: string | null = null
  try {
    const expanded = await stripe.invoices.retrieve(invoice.id, {
      expand: ['payments.data.payment.payment_intent'],
    })
    const latest = expanded.payments?.data.at(-1)?.payment.payment_intent
    if (latest && typeof latest !== 'string') {
      failureReason = latest.last_payment_error?.message ?? null
    }
  } catch (error) {
    console.warn('[stripe webhook] could not read decline reason', { invoice: invoice.id, error })
  }

  const { error } = await sendPaymentFailedEmail({
    to,
    firstName,
    planName: PLANS[plan].name,
    amountDue: invoice.amount_due,
    currency: invoice.currency,
    paymentMethodLabel,
    failureReason,
    nextAttemptDate: invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000) : null,
    attemptCount: invoice.attempt_count,
    invoiceUrl: invoice.hosted_invoice_url ?? null,
  })
  if (error) throw error

  if (userId) {
    await supabase.from('profiles').update({
      subscription_status: subscription.status,
    }).eq('id', userId)
  }
}

/**
 * Send the cancellation confirmation for a subscription. `accessEndsAt` is
 * the end of the already-paid period for a scheduled cancellation, or null
 * when the subscription has ended immediately.
 */
async function sendCancellationEmail(sub: Stripe.Subscription, customer: Stripe.Customer, accessEndsAt: Date | null) {
  const userId = customer.metadata?.supabase_user_id
  const { data: profile } = userId
    ? await supabase.from('profiles').select('email, full_name, plan').eq('id', userId).single()
    : { data: null }

  const to = profile?.email ?? customer.email
  if (!to) return
  const firstName = profile?.full_name?.split(' ')[0] || customer.name?.split(' ')[0] || 'there'

  const priceId = sub.items.data[0]?.price.id
  const plan = priceId === PLANS.teams.priceId ? 'teams'
    : priceId === PLANS.pro.priceId ? 'pro'
    : (profile?.plan as 'pro' | 'teams' | null) ?? 'pro'

  const { error } = await sendSubscriptionCanceledEmail({
    to, firstName, planName: PLANS[plan].name, accessEndsAt,
  })
  if (error) {
    console.error('[stripe webhook] could not send cancellation email', { subscription: sub.id, error })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      const plan = session.metadata?.plan
      if (!userId) break

      let trialEnd: string | null = null
      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string)
        if (sub.trial_end) trialEnd = new Date(sub.trial_end * 1000).toISOString()
      }

      await supabase.from('profiles').update({
        stripe_customer_id: session.customer as string,
        subscription_id: session.subscription as string,
        subscription_status: 'trialing',
        plan: plan ?? 'pro',
        trial_end: trialEnd,
      }).eq('id', userId)
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      try {
        await handleInvoicePaid(invoice)
      } catch (error) {
        // Log and acknowledge. Returning an error would make Stripe retry the
        // event, which risks sending the same receipt more than once.
        console.error('[stripe webhook] invoice.paid: could not send receipt', {
          invoice: invoice.id,
          error: error instanceof Error ? error.message : error,
        })
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      try {
        await handleInvoicePaymentFailed(invoice)
      } catch (error) {
        console.error('[stripe webhook] invoice.payment_failed: could not send email', {
          invoice: invoice.id,
          error: error instanceof Error ? error.message : error,
        })
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customer = await stripe.customers.retrieve(sub.customer as string)
      if (customer.deleted) break

      // Cancelling from the billing portal schedules the cancellation for the
      // end of the paid period. Confirm it once, when the flag flips on.
      const previous = event.data.previous_attributes as Partial<Stripe.Subscription> | undefined
      if (sub.cancel_at_period_end && previous?.cancel_at_period_end === false) {
        const endsAt = sub.cancel_at ?? sub.items.data[0]?.current_period_end ?? null
        await sendCancellationEmail(sub, customer, endsAt ? new Date(endsAt * 1000) : null)
      }

      const userId = customer.metadata?.supabase_user_id
      if (!userId) break

      await supabase.from('profiles').update({
        subscription_status: sub.status,
        subscription_id: sub.id,
      }).eq('id', userId)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const customer = await stripe.customers.retrieve(sub.customer as string)
      if (customer.deleted) break

      // A scheduled cancellation was already confirmed when it was requested.
      // Only an immediate cancellation needs an email here.
      if (!sub.cancel_at_period_end) {
        await sendCancellationEmail(sub, customer, null)
      }

      const userId = customer.metadata?.supabase_user_id
      if (!userId) break

      await supabase.from('profiles').update({
        subscription_status: 'canceled',
        subscription_id: null,
      }).eq('id', userId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
