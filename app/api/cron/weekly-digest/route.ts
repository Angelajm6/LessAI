import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWeeklyDigestEmail } from '@/lib/email'

export const maxDuration = 60

const XP_LEVELS = [
  { name: 'Novice', min: 0 },
  { name: 'Explorer', min: 100 },
  { name: 'Practitioner', min: 250 },
  { name: 'Pro', min: 500 },
  { name: 'Expert', min: 1000 },
]
function getLevelName(xp: number) {
  let name = XP_LEVELS[0].name
  for (const l of XP_LEVELS) { if (xp >= l.min) name = l.name }
  return name
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  weekAgo.setHours(0, 0, 0, 0)

  // All onboarded non-admin users
  const { data: users } = await supabase
    .from('profiles')
    .select('id, email, full_name, tools, xp, streak')
    .eq('onboarded', true)
    .eq('is_admin', false)

  if (!users?.length) return NextResponse.json({ ok: true, sent: 0 })

  // All task completions in the last 7 days
  const { data: recentCompletions } = await supabase
    .from('task_completions')
    .select('user_id, tool, created_at')
    .gte('created_at', weekAgo.toISOString())

  // All task completions ever (for totals + next-task lookup)
  const { data: allCompletions } = await supabase
    .from('task_completions')
    .select('user_id, tool, day')

  // All stack maps for next-task lookup
  const { data: aiPaths } = await supabase
    .from('ai_paths')
    .select('user_id, use_cases')

  const results = { sent: 0, skipped: 0, errors: 0 }

  for (const user of users) {
    if (!user.email) { results.skipped++; continue }

    const thisWeek = (recentCompletions ?? []).filter(c => c.user_id === user.id)
    const allDone = (allCompletions ?? []).filter(c => c.user_id === user.id)

    // Skip users who have never engaged at all
    if (allDone.length === 0 && !user.xp) { results.skipped++; continue }

    // Top tool this week (or all time if no activity this week)
    const toolCounts: Record<string, number> = {}
    const sourceForTop = thisWeek.length > 0 ? thisWeek : allDone
    sourceForTop.forEach(c => { toolCounts[c.tool] = (toolCounts[c.tool] ?? 0) + 1 })
    const topTool = Object.entries(toolCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    // Find next uncompleted task from their stack map
    const stackMap = (aiPaths ?? []).find(p => p.user_id === user.id)?.use_cases
    let nextTask: { tool: string; title: string; task: string } | null = null
    if (stackMap?.tool_tracks) {
      const completedKeys = new Set(allDone.map(c => `${c.tool}-${c.day ?? 0}`))
      outer: for (const track of stackMap.tool_tracks) {
        for (const t of track.daily_tasks) {
          if (!completedKeys.has(`${track.tool}-${t.day}`)) {
            nextTask = { tool: track.tool, title: t.title, task: t.task }
            break outer
          }
        }
      }
    }

    const firstName = user.full_name?.split(' ')[0] ?? 'there'

    const { error } = await sendWeeklyDigestEmail({
      to: user.email,
      firstName,
      tasksThisWeek: thisWeek.length,
      totalTasks: allDone.length,
      streak: user.streak ?? 0,
      xp: user.xp ?? 0,
      levelName: getLevelName(user.xp ?? 0),
      topTool,
      nextTask,
    })

    if (error) results.errors++; else results.sent++
  }

  return NextResponse.json({ ok: true, ...results })
}
