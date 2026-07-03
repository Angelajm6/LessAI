import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateRecommendation } from '@/lib/claude'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { task, role, tools, toolLevels, company } = await req.json()

  if (!task?.trim()) return NextResponse.json({ error: 'Task required' }, { status: 400 })
  if (!tools?.length) return NextResponse.json({ error: 'No tools in stack' }, { status: 400 })

  try {
    const recommendation = await generateRecommendation(
      task.trim(),
      role ?? 'professional',
      tools,
      toolLevels ?? {},
      company ?? null
    )
    return NextResponse.json(recommendation)
  } catch (err) {
    console.error('Recommendation error:', err)
    return NextResponse.json({ error: 'Failed to generate recommendation' }, { status: 500 })
  }
}
