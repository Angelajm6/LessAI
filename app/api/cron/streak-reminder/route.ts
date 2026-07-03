import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendStreakReminderEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // Get all onboarded users
  const { data: users } = await supabase
    .from('profiles')
    .select('id, email, full_name, tools, xp, streak')
    .eq('onboarded', true)
    .eq('is_admin', false)

  if (!users?.length) return NextResponse.json({ ok: true, sent: 0 })

  // Get user IDs that already completed a task today
  const { data: todayCompletions } = await supabase
    .from('task_completions')
    .select('user_id')
    .gte('created_at', todayStart.toISOString())

  const doneToday = new Set((todayCompletions ?? []).map(c => c.user_id))

  const results = { sent: 0, skipped: 0, errors: 0 }

  for (const user of users) {
    // Skip users who've already done a task today
    if (doneToday.has(user.id)) { results.skipped++; continue }
    // Skip users who have never completed any task (no streak to protect, not yet engaged)
    if (!user.xp || user.xp === 0) { results.skipped++; continue }

    const firstName = user.full_name?.split(' ')[0] ?? 'there'
    const toolCount = (user.tools ?? []).length

    const { error } = await sendStreakReminderEmail({
      to: user.email,
      firstName,
      streak: user.streak ?? 0,
      toolCount,
    })

    if (error) results.errors++; else results.sent++
  }

  return NextResponse.json({ ok: true, ...results })
}
