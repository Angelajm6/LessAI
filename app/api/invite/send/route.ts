import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendInviteEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  // Verify the caller is an admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, company_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin || !profile.company_id) {
    return NextResponse.json({ error: 'Not an admin' }, { status: 403 })
  }

  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', profile.company_id)
    .single()

  // Create the invite record using service role to bypass RLS (admin already verified above)
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: invite, error } = await serviceClient
    .from('invites')
    .insert({ company_id: profile.company_id, email })
    .select('token')
    .single()

  if (error || !invite?.token) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create invite' }, { status: 500 })
  }

  const origin = new URL(req.url).origin
  const appUrl = origin.includes('localhost') ? (process.env.NEXT_PUBLIC_APP_URL ?? 'https://lessai.io') : origin
  const inviteLink = `${appUrl}/invite?token=${invite.token}`
  const adminFirstName = profile.full_name?.split(' ')[0] ?? 'Your manager'
  const companyName = company?.name ?? 'your team'

  // Send invite email (non-blocking — link is always returned as fallback)
  sendInviteEmail({ to: email, inviteLink, adminFirstName, companyName })
    .catch(err => console.error('[email] invite email failed:', err))

  return NextResponse.json({ ok: true, inviteLink })
}
