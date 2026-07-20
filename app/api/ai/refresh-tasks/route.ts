import { NextResponse } from 'next/server'

export const runtime = 'edge'
export const maxDuration = 60

import { createClient } from '@/lib/supabase/server'
import { generateStackMap } from '@/lib/claude'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tools, tool_levels, company_name, company_summary')
    .eq('id', user.id)
    .single()

  if (!profile?.role || !profile?.tools?.length) {
    return NextResponse.json({ error: 'Profile incomplete' }, { status: 400 })
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  let stackMap
  try {
    stackMap = await generateStackMap(
      profile.role,
      profile.tools,
      profile.tool_levels ?? {},
      profile.company_name ?? null,
      profile.company_summary ?? null,
    )
  } catch (err) {
    console.error('refresh-tasks generation error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'AI generation failed' }, { status: 500 })
  }

  await supabase.from('ai_paths').delete().eq('user_id', user.id)
  const { error: insertError } = await supabase
    .from('ai_paths')
    .insert({ user_id: user.id, use_cases: stackMap })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  await supabase.from('task_completions').delete().eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
