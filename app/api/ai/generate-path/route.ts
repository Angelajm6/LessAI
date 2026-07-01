import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateStackMap } from '@/lib/claude'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role, tools, toolLevels, company } = await req.json()

  if (!tools || tools.length === 0) {
    return NextResponse.json({ error: 'No tools provided' }, { status: 400 })
  }

  let stackMap
  try {
    stackMap = await generateStackMap(role, tools, toolLevels ?? {}, company ?? null)
  } catch (err) {
    console.error('Stack map generation error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'AI generation failed' }, { status: 500 })
  }

  // Delete any existing path for this user first
  await supabase.from('ai_paths').delete().eq('user_id', user.id)

  const { data, error } = await supabase
    .from('ai_paths')
    .insert({ user_id: user.id, use_cases: stackMap })
    .select()
    .single()

  if (error) {
    console.error('DB insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fire welcome email (non-blocking — don't fail the request if email fails)
  if (user.email) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
    sendWelcomeEmail({
      to: user.email,
      firstName,
      role,
      tools,
      stackSummary: stackMap.summary,
    }).catch(err => console.error('[email] welcome email failed:', err))
  }

  return NextResponse.json(data)
}
