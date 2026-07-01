import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendTrialDay4Email, sendTrialDay7Email } from '@/lib/email'

export async function GET(req: NextRequest) {
  // Protect with a secret so only Vercel Cron can call this
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

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

  const [{ data: day4Users }, { data: day7Users }] = await Promise.all([
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

  const results = { day4: 0, day7: 0, errors: 0 }

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
