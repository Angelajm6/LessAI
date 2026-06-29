import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWeeklySkill } from '@/lib/claude'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role, tools, weekNumber, previousSkills } = await req.json()

  const skill = await generateWeeklySkill(role, tools, weekNumber, previousSkills)

  const { data, error } = await supabase
    .from('skills')
    .insert({
      user_id: user.id,
      week_number: weekNumber,
      title: skill.title,
      description: skill.description,
      task: skill.task,
      tool: skill.tool,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
