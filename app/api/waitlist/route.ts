import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('waitlist')
    .upsert({ email: email.toLowerCase().trim() }, { onConflict: 'email' })

  if (error) {
    console.error('Waitlist error:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
