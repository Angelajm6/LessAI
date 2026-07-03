import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { detectWrongTool } from '@/lib/claude'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json(null, { status: 401 })

  const { message, role, tools } = await req.json()
  if (!message || !tools?.length) return NextResponse.json(null)

  try {
    const detection = await detectWrongTool(message, role ?? 'professional', tools)
    return NextResponse.json(detection)
  } catch {
    return NextResponse.json(null)
  }
}
