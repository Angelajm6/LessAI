import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { improvePrompt } from '@/lib/claude'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { original, tool } = await req.json()
  if (!original?.trim()) return NextResponse.json({ error: 'No prompt provided' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tools')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'professional'
  const tools: string[] = profile?.tools ?? []

  try {
    const result = await improvePrompt(original.trim(), role, tools, tool ?? null)
    return NextResponse.json(result)
  } catch (e) {
    console.error('improvePrompt error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
