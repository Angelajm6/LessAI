import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { PLANS, Plan } from '@/lib/stripe'

// This route deliberately does not require a LessAI account. It is the first
// step for a new customer: card + trial in Stripe, then account creation.
export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json() as { plan: Plan }
    if (!PLANS[plan]) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    const priceId = PLANS[plan].priceId

    if (!stripeSecretKey) {
      console.error('[public checkout] STRIPE_SECRET_KEY is missing')
      return NextResponse.json({ error: 'Live payments are not configured yet. Please contact support.' }, { status: 503 })
    }
    if (!priceId) {
      console.error('[public checkout] Stripe price ID is missing', { plan })
      return NextResponse.json({ error: 'This plan is not configured for checkout yet. Please contact support.' }, { status: 503 })
    }
    if (process.env.VERCEL_ENV === 'production' && !stripeSecretKey.startsWith('sk_live_')) {
      console.error('[public checkout] A non-live Stripe secret key is configured in production')
      return NextResponse.json({ error: 'Live Stripe payments are not configured yet. Please contact support.' }, { status: 503 })
    }

    // Instantiate inside the request handler so a missing/invalid Vercel
    // variable results in a clear response instead of a blank route failure.
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2026-06-24.dahlia' })
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.lessai.io'
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { plan, checkout_flow: 'pre_signup' },
      },
      success_url: `${appUrl}/signup?checkout_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      metadata: { plan, checkout_flow: 'pre_signup' },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const stripeError = error as { type?: string; code?: string; message?: string; requestId?: string }
    console.error('[public checkout] Could not create Checkout Session', {
      type: stripeError.type,
      code: stripeError.code,
      message: stripeError.message,
      requestId: stripeError.requestId,
    })

    const configurationError = stripeError.type === 'StripeInvalidRequestError'
      ? 'The live Stripe Price ID for this plan is invalid. Please contact support.'
      : stripeError.type === 'StripeAuthenticationError'
        ? 'The live Stripe secret key was rejected. Please contact support.'
        : stripeError.type === 'StripePermissionError'
          ? 'The Stripe account is not yet able to accept card payments. Please contact support.'
          : 'We could not start checkout. Please try again or contact hello@lessai.io.'

    return NextResponse.json({ error: configurationError }, { status: 500 })
  }
}
