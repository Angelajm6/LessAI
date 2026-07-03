import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendStreakReminderEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { memberId } = await req.json()
  if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('is_admin, company_id')
    .eq('id', user.id)
    .single()

  if (!adminProfile?.is_admin || !adminProfile.company_id) {
    return NextResponse.json({ error: 'Not an admin' }, { status: 403 })
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: member } = await serviceClient
    .from('profiles')
    .select('full_name, company_id, xp, streak')
    .eq('id', memberId)
    .single()

  if (!member || member.company_id !== adminProfile.company_id) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  const { data: authUser } = await serviceClient.auth.admin.getUserById(memberId)
  if (!authUser?.user?.email) {
    return NextResponse.json({ error: 'Could not get member email' }, { status: 500 })
  }

  const firstName = member.full_name?.split(' ')[0] ?? 'there'
  await sendStreakReminderEmail({
    to: authUser.user.email,
    firstName,
    streak: member.streak ?? 0,
    toolCount: 1,
  })

  return NextResponse.json({ ok: true })
}
