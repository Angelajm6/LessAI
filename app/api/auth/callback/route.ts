import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSignupWelcomeEmail } from '@/lib/email'

type StripeCheckoutSession = {
  status: string | null
  mode: string | null
  customer: string | null
  subscription: string | null
  customer_details?: { email?: string | null } | null
  customer_email?: string | null
  metadata?: Record<string, string> | null
}

type StripeSubscription = {
  id: string
  status: string
  trial_end: number | null
  items?: { data?: Array<{ price?: { id?: string | null } | null }> }
}

/**
 * Stripe's SDK has intermittently failed to establish a connection from the
 * signup callback in production. Use the same native Stripe API request used
 * by the billing-portal route so a completed Payment Link is always linked to
 * the newly confirmed LessAI account.
 */
async function stripeRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is missing')

  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
      ...init.headers,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const detail = await response.text()
    console.error('[signup checkout] Stripe API request failed', { path, status: response.status, detail })
    throw new Error(`Stripe API request failed (${response.status})`)
  }

  return response.json() as Promise<T>
}

async function attachPreSignupCheckout({
  sessionId,
  userId,
  email,
}: {
  sessionId: string
  userId: string
  email: string
}): Promise<'pro' | 'teams' | null> {
  const session = await stripeRequest<StripeCheckoutSession>(`/checkout/sessions/${sessionId}`)
  const checkoutEmail = (session.customer_details?.email ?? session.customer_email ?? '').toLowerCase()

  if (
    session.status !== 'complete' ||
    session.mode !== 'subscription' ||
    !session.customer ||
    !session.subscription ||
    checkoutEmail !== email.toLowerCase()
  ) {
    console.warn('[signup checkout] Checkout Session could not be attached', { sessionId, userId })
    return null
  }

  const customerId = session.customer
  const subscription = await stripeRequest<StripeSubscription>(`/subscriptions/${session.subscription}`)
  const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null

  await stripeRequest(`/customers/${customerId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ 'metadata[supabase_user_id]': userId }),
  })

  const priceId = subscription.items?.data?.[0]?.price?.id
  const plan = session.metadata?.plan ?? (priceId === process.env.STRIPE_TEAMS_PRICE_ID ? 'teams' : 'pro')
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({
    stripe_customer_id: customerId,
    subscription_id: subscription.id,
    subscription_status: subscription.status,
    plan,
    trial_end: trialEnd,
    // Only Teams customers get the company Admin Dashboard. A Pro customer is
    // an individual user, even if they supplied a company name at signup.
    is_admin: plan === 'teams',
  }).eq('id', userId)

  if (error) throw new Error(`Could not link Stripe billing account: ${error.message}`)
  return plan === 'teams' ? 'teams' : 'pro'
}

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const checkoutSessionId = new URL(next, origin).searchParams.get('checkout_session_id')

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(`${origin}/reset-password?error=invalid_or_expired_link`)
    }

    if (user) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existing) {
        const meta = user.user_metadata ?? {}
        const companyName = (meta.company_name as string) ?? ''

        const { data: company } = await supabase
          .from('companies')
          .insert({ name: companyName, admin_id: user.id })
          .select()
          .single()

        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email ?? '',
          full_name: (meta.full_name as string) ?? '',
          company_id: company?.id ?? null,
          // A checkout confirmation will promote this to a Teams admin only
          // after we verify that its Stripe subscription is actually Teams.
          is_admin: false,
          onboarded: false,
        })

        // Send welcome email (fire-and-forget)
        const firstName = ((meta.full_name as string) ?? '').split(' ')[0] || 'there'
        sendSignupWelcomeEmail({ to: user.email ?? '', firstName }).catch(() => {})
      }

      if (checkoutSessionId && user.email) {
        try {
          await attachPreSignupCheckout({ sessionId: checkoutSessionId, userId: user.id, email: user.email })
        } catch (error) {
          console.error('[signup checkout] Failed to attach Checkout Session', error)
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
