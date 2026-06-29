import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAIPath } from '@/lib/claude'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role, tools, companyWebsite } = await req.json()

  const useCases = await generateAIPath(role, tools, companyWebsite || undefined)

  const { data, error } = await supabase
    .from('ai_paths')
    .insert({ user_id: user.id, use_cases: useCases })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
