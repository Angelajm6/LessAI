import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

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

  // Verify member belongs to this company
  const { data: member } = await serviceClient
    .from('profiles')
    .select('company_id')
    .eq('id', memberId)
    .single()

  if (!member || member.company_id !== adminProfile.company_id) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  // Delete auth user — cascades to profiles via DB trigger/FK
  const { error } = await serviceClient.auth.admin.deleteUser(memberId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
