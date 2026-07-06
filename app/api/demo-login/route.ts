import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  if (!process.env.DEMO_EMAIL || !process.env.DEMO_PASSWORD) {
    return NextResponse.json({ error: 'Demo not configured' }, { status: 503 })
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: process.env.DEMO_EMAIL,
    password: process.env.DEMO_PASSWORD,
  })

  if (error) {
    return NextResponse.json({ error: 'Demo login unavailable' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
