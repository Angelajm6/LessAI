import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAlternativeTask } from '@/lib/claude'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { skillId, originalTask, feedback, role, tool } = await req.json()

  const alternativeTask = await generateAlternativeTask(originalTask, feedback, role, tool)

  await supabase.from('checkins').insert({
    skill_id: skillId,
    user_id: user.id,
    completed: false,
    feedback,
    alternative_task: alternativeTask,
  })

  await supabase.from('skills').update({ status: 'flagged' }).eq('id', skillId)

  return NextResponse.json({ alternativeTask })
}
