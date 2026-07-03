import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { token, fullName, password } = await req.json()
  if (!token || !fullName || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Validate the invite token
  const { data: invite, error: inviteErr } = await serviceClient
    .from('invites')
    .select('id, company_id, email')
    .eq('token', token)
    .eq('used', false)
    .single()

  if (inviteErr || !invite) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 400 })
  }

  // Create the user with email already confirmed — no confirmation email sent
  const { data: created, error: createErr } = await serviceClient.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (createErr || !created.user) {
    return NextResponse.json({ error: createErr?.message ?? 'Failed to create account' }, { status: 500 })
  }

  // Create the profile
  await serviceClient.from('profiles').insert({
    id: created.user.id,
    email: invite.email,
    full_name: fullName,
    company_id: invite.company_id,
    is_admin: false,
    onboarded: false,
  })

  // Mark invite as used
  await serviceClient.from('invites').update({ used: true }).eq('id', invite.id)

  return NextResponse.json({ ok: true })
}
