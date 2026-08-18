import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendAccountDeletionConfirmationEmail } from '@/lib/email'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await serviceClient
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  const { error } = await serviceClient.auth.admin.deleteUser(user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send the written confirmation only after Supabase confirms the deletion.
  // An email delivery issue must not undo or misreport a completed deletion.
  if (user.email) {
    const firstName = profile?.full_name?.trim().split(/\s+/)[0] || 'there'
    const { error: emailError } = await sendAccountDeletionConfirmationEmail({
      to: user.email,
      firstName,
      deletedAt: new Date(),
    })
    if (emailError) console.error('[account-delete] confirmation email failed:', emailError)
  }

  return NextResponse.json({ ok: true })
}
