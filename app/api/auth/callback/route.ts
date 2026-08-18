import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSignupWelcomeEmail } from '@/lib/email'
import { stripe } from '@/lib/stripe'

async function attachPreSignupCheckout({
  sessionId,
  userId,
  email,
}: {
  sessionId: string
  userId: string
  email: string
}) {
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  const checkoutEmail = (session.customer_details?.email ?? session.customer_email ?? '').toLowerCase()

  if (
    session.status !== 'complete' ||
    session.mode !== 'subscription' ||
    !session.customer ||
    !session.subscription ||
    checkoutEmail !== email.toLowerCase()
  ) {
    console.warn('[signup checkout] Checkout Session could not be attached', { sessionId, userId })
    return
  }

  const customerId = session.customer as string
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
  const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null

  await stripe.customers.update(customerId, { metadata: { supabase_user_id: userId } })
  const supabase = await createClient()
  await supabase.from('profiles').update({
    stripe_customer_id: customerId,
    subscription_id: subscription.id,
    subscription_status: subscription.status,
    plan: session.metadata?.plan ?? 'pro',
    trial_end: trialEnd,
  }).eq('id', userId)
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
          is_admin: true,
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
