import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLANS } from '@/lib/stripe'
import { sendSubscriptionReceiptEmail } from '@/lib/email'
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
 * Send a branded billing receipt when a subscription invoice is charged.
 * This covers the first charge on day 8 (end of the free trial) and every
 * renewal after it. The $0 invoice created when a trial starts is skipped.
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (invoice.amount_paid <= 0) return

  const subscriptionRef = invoice.parent?.subscription_details?.subscription
  if (!subscriptionRef) return
  const subscriptionId = typeof subscriptionRef === 'string' ? subscriptionRef : subscriptionRef.id

  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
  if (!customerId) return

  const customer = await stripe.customers.retrieve(customerId, {
    expand: ['invoice_settings.default_payment_method'],
  })
  if (customer.deleted) return

  const userId = customer.metadata?.supabase_user_id
  const { data: profile } = userId
    ? await supabase.from('profiles').select('email, full_name, plan').eq('id', userId).single()
    : { data: null }

  // A pre-signup checkout is linked to the account when the user confirms
  // their email. If that has not happened yet, fall back to the billing email.
  const to = profile?.email ?? invoice.customer_email ?? customer.email
  if (!to) {
    console.warn('[stripe webhook] invoice.paid: no recipient for receipt', { invoice: invoice.id })
    return
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

  // The trial-ending charge is the first paid invoice on this subscription.
  const { data: paidInvoices } = await stripe.invoices.list({
    subscription: subscriptionId,
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

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customer = await stripe.customers.retrieve(sub.customer as string)
      if (customer.deleted) break
      const userId = (customer as Stripe.Customer).metadata?.supabase_user_id
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
      const userId = (customer as Stripe.Customer).metadata?.supabase_user_id
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
