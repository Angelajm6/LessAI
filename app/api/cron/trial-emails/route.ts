import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendDayOneSupportEmail } from '@/lib/email'

// Cron jobs have no user session. Use the service role so RLS does not prevent
// scheduled email jobs from finding the profiles they need to process.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Trial-ending reminders are no longer sent from this cron. Stripe's
// `customer.subscription.trial_will_end` webhook sends a single "3 days left"
// email with the exact end date and charge (see app/api/stripe/webhook).
export async function GET(req: NextRequest) {
  // Protect with a secret so only Vercel Cron can call this
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // The daily job runs at 09:00 UTC. This calendar-day window reaches everyone
  // who signed up the prior day, regardless of their signup hour.
  const day1Cutoff = new Date()
  day1Cutoff.setDate(day1Cutoff.getDate() - 1)
  const day1Start = day1Cutoff.toISOString().split('T')[0] + 'T00:00:00.000Z'
  const day1End = day1Cutoff.toISOString().split('T')[0] + 'T23:59:59.999Z'

  const { data: day1Users } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .gte('created_at', day1Start)
    .lte('created_at', day1End)

  const results = { day1: 0, errors: 0 }

  // Day-one welcome/support survey. This route runs once per day, so users in
  // the prior-day window receive exactly one check-in.
  for (const user of day1Users ?? []) {
    const firstName = user.full_name?.split(' ')[0] ?? 'there'
    const { error } = await sendDayOneSupportEmail({ to: user.email, firstName })
    if (error) {
      results.errors++
    } else {
      results.day1++
    }
  }

  return NextResponse.json({ ok: true, ...results })
}
