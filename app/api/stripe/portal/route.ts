import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'Your billing account is still being linked. Please try again in a moment.' }, { status: 404 })
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      console.error('[stripe portal] STRIPE_SECRET_KEY is missing')
      return NextResponse.json({ error: 'Billing is temporarily unavailable. Please contact hello@lessai.io.' }, { status: 503 })
    }

    // Use Vercel's native fetch rather than the Stripe SDK connection used by
    // the former checkout route. This is the same Stripe API endpoint, but it
    // avoids the connection issue that prevented the portal from opening.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.lessai.io'
    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${stripeSecretKey}:`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: profile.stripe_customer_id,
        return_url: `${appUrl}/settings`,
      }),
      cache: 'no-store',
    })

    const result = await response.json() as { url?: string; error?: { message?: string; type?: string } }
    if (!response.ok || !result.url) {
      console.error('[stripe portal] Could not create portal session', {
        status: response.status,
        type: result.error?.type,
        message: result.error?.message,
      })
      return NextResponse.json({ error: 'We could not open billing right now. Please try again shortly.' }, { status: 502 })
    }

    return NextResponse.json({ url: result.url })
  } catch (error) {
    console.error('[stripe portal] Unexpected billing portal error', error)
    return NextResponse.json({ error: 'We could not open billing right now. Please try again shortly.' }, { status: 502 })
  }
}
