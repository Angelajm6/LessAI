import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminClient from './AdminClient'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, company_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', profile.company_id)
    .single()

  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, onboarded, tools, tool_levels, company_name')
    .eq('company_id', profile.company_id)
    .neq('id', user.id)

  const { data: invites } = await supabase
    .from('invites')
    .select('id, email, used, created_at')
    .eq('company_id', profile.company_id)

  const memberIds = (members ?? []).map(m => m.id)

  const { data: taskCompletions } = memberIds.length > 0
    ? await supabase
        .from('task_completions')
        .select('user_id, tool, day')
        .in('user_id', memberIds)
    : { data: [] }

  return (
    <AdminClient
      company={company}
      members={members ?? []}
      invites={invites ?? []}
      adminName={profile.full_name ?? ''}
      taskCompletions={taskCompletions ?? []}
    />
  )
}
