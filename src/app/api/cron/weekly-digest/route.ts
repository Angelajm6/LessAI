import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import type { StackMap, DailyTask } from '@/lib/claude'

function serviceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface FlatTask {
  tool: string
  title: string
  task: string
  day: number
  time_minutes: number
}

function flattenTasks(stackMap: StackMap): FlatTask[] {
  const out: FlatTask[] = []
  for (const track of stackMap.tool_tracks ?? []) {
    for (const dt of track.daily_tasks ?? []) {
      out.push({
        tool: track.tool,
        title: dt.title,
        task: dt.task,
        day: dt.day,
        time_minutes: dt.time_minutes,
      })
    }
  }
  return out
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = serviceClient()

  // Fetch all onboarded, non-admin users
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('onboarded', true)
    .eq('is_admin', false)

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 })
  }

  const results: { userId: string; status: string; skill?: string }[] = []

  for (const user of users ?? []) {
    try {
      // Get their latest ai_path (StackMap)
      const { data: aiPath } = await supabase
        .from('ai_paths')
        .select('use_cases')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!aiPath?.use_cases) {
        results.push({ userId: user.id, status: 'skipped — no ai_path' })
        continue
      }

      // Count existing skills to determine next week number
      const { count } = await supabase
        .from('skills')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const weekNumber = (count ?? 0) + 1

      // Pick the next task from the flattened StackMap task list
      const tasks = flattenTasks(aiPath.use_cases as unknown as StackMap)
      if (tasks.length === 0) {
        results.push({ userId: user.id, status: 'skipped — no tasks in stack map' })
        continue
      }

      const task = tasks[(weekNumber - 1) % tasks.length]

      const { error: insertError } = await supabase.from('skills').insert({
        user_id: user.id,
        week_number: weekNumber,
        title: task.title,
        description: `Day ${task.day} with ${task.tool} — ${task.time_minutes} min`,
        task: task.task,
        tool: task.tool,
        status: 'pending',
      })

      if (insertError) {
        results.push({ userId: user.id, status: `error: ${insertError.message}` })
      } else {
        results.push({ userId: user.id, status: 'ok', skill: task.title })
      }
    } catch (err) {
      results.push({ userId: user.id, status: `exception: ${String(err)}` })
    }
  }

  const ok = results.filter(r => r.status === 'ok').length
  return NextResponse.json({
    processed: results.length,
    delivered: ok,
    skipped: results.filter(r => r.status.startsWith('skipped')).length,
    errors: results.filter(r => r.status.startsWith('error') || r.status.startsWith('exception')).length,
    results,
  })
}
