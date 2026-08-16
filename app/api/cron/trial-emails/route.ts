import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendDayOneSupportEmail, sendTrialDay4Email, sendTrialDay7Email } from '@/lib/email'

// Cron jobs have no user session. Use the service role so RLS does not prevent
// scheduled email jobs from finding the profiles they need to process.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

  // Find users whose trial started 4 days ago (send day 4 reminder)
  const day4Cutoff = new Date()
  day4Cutoff.setDate(day4Cutoff.getDate() - 4)
  const day4Start = day4Cutoff.toISOString().split('T')[0] + 'T00:00:00.000Z'
  const day4End = day4Cutoff.toISOString().split('T')[0] + 'T23:59:59.999Z'

  // Find users whose trial started 7 days ago (send day 7 final notice)
  const day7Cutoff = new Date()
  day7Cutoff.setDate(day7Cutoff.getDate() - 7)
  const day7Start = day7Cutoff.toISOString().split('T')[0] + 'T00:00:00.000Z'
  const day7End = day7Cutoff.toISOString().split('T')[0] + 'T23:59:59.999Z'

  const [{ data: day1Users }, { data: day4Users }, { data: day7Users }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, full_name')
      .gte('created_at', day1Start)
      .lte('created_at', day1End),
    supabase
      .from('profiles')
      .select('id, email, full_name, tools')
      .gte('created_at', day4Start)
      .lte('created_at', day4End)
      .eq('onboarded', true),
    supabase
      .from('profiles')
      .select('id, email, full_name')
      .gte('created_at', day7Start)
      .lte('created_at', day7End)
      .eq('onboarded', true),
  ])

  const results = { day1: 0, day4: 0, day7: 0, errors: 0 }

  // Day-one welcome/support survey. This route runs once per day, so users in
  // the prior-day window receive one check-in alongside the existing trial flow.
  for (const user of day1Users ?? []) {
    const firstName = user.full_name?.split(' ')[0] ?? 'there'
    const { error } = await sendDayOneSupportEmail({ to: user.email, firstName })
    if (error) {
      results.errors++
    } else {
      results.day1++
    }
  }

  // Day 4 emails
  for (const user of day4Users ?? []) {
    const firstName = user.full_name?.split(' ')[0] ?? 'there'
    const toolCount = (user.tools ?? []).length

    const { data: completions } = await supabase
      .from('task_completions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const tasksCompleted = (completions as unknown as { count: number } | null)?.count ?? 0

    const { error } = await sendTrialDay4Email({
      to: user.email, firstName, tasksCompleted, toolCount,
    })
    if (error) results.errors++ ; else results.day4++
  }

  // Day 7 emails
  for (const user of day7Users ?? []) {
    const firstName = user.full_name?.split(' ')[0] ?? 'there'
    const { error } = await sendTrialDay7Email({ to: user.email, firstName })
    if (error) results.errors++ ; else results.day7++
  }

  return NextResponse.json({ ok: true, ...results })
}
