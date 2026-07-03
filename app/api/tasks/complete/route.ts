import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const LEVELS = [
  { name: 'Novice', min: 0 },
  { name: 'Explorer', min: 100 },
  { name: 'Practitioner', min: 250 },
  { name: 'Pro', min: 500 },
  { name: 'Expert', min: 1000 },
]

function getLevelName(xp: number) {
  let name = LEVELS[0].name
  for (const l of LEVELS) { if (xp >= l.min) name = l.name }
  return name
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tool, day } = await req.json()
  if (!tool || day == null) return NextResponse.json({ error: 'Missing tool or day' }, { status: 400 })

  // Idempotent — skip if already completed
  const { data: existing } = await supabase
    .from('task_completions')
    .select('id')
    .eq('user_id', user.id)
    .eq('tool', tool)
    .eq('day', day)
    .maybeSingle()

  if (existing) return NextResponse.json({ skipped: true })

  await supabase.from('task_completions').insert({ user_id: user.id, tool, day })

  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, streak, streak_last_date')
    .eq('id', user.id)
    .single()

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]

  const currentXp = profile?.xp ?? 0
  const currentStreak = profile?.streak ?? 0
  const lastDate = profile?.streak_last_date ?? null

  const newXp = currentXp + 10
  let newStreak = currentStreak

  if (lastDate === today) {
    // already acted today — streak unchanged
  } else if (lastDate === yesterday) {
    newStreak = currentStreak + 1
  } else {
    newStreak = 1
  }

  const levelUp = getLevelName(newXp) !== getLevelName(currentXp)

  await supabase
    .from('profiles')
    .update({ xp: newXp, streak: newStreak, streak_last_date: today })
    .eq('id', user.id)

  return NextResponse.json({ xp: newXp, streak: newStreak, levelUp, levelName: getLevelName(newXp) })
}
