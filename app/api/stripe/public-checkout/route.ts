import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLANS, Plan } from '@/lib/stripe'

// This route deliberately does not require a LessAI account. It is the first
// step for a new customer: card + trial in Stripe, then account creation.
export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json() as { plan: Plan }
    if (!PLANS[plan]) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    if (process.env.VERCEL_ENV === 'production' && process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
      console.error('[public checkout] Test Stripe secret key is configured in production')
      return NextResponse.json({ error: 'Payments are not configured for live checkout yet. Please contact support.' }, { status: 503 })
    }

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

    return NextResponse.json({
      error: 'We could not start checkout. Please try again or contact hello@lessai.io.',
    }, { status: 500 })
  }
}
