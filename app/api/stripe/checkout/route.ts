import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLANS, Plan } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await req.json() as { plan: Plan }
  if (!PLANS[plan]) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, full_name')
    .eq('id', user.id)
    .single()

  // Reuse existing Stripe customer or create one
  let customerId = profile?.stripe_customer_id as string | undefined
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: profile?.full_name ?? undefined,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://lessai.io'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
    subscription_data: { trial_period_days: 7 },
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing`,
    metadata: { supabase_user_id: user.id, plan },
  })

  return NextResponse.json({ url: session.url })
}
