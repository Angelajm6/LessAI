import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, company_id, is_admin, onboarded')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.is_admin) redirect('/admin')
  if (!profile.onboarded) redirect('/onboarding')

  const { data: company } = await supabase
    .from('companies')
    .select('name, tools')
    .eq('id', profile.company_id)
    .single()

  const { data: aiPath } = await supabase
    .from('ai_paths')
    .select('use_cases, current_use_case_index')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: skills } = await supabase
    .from('skills')
    .select('*')
    .eq('user_id', user.id)
    .order('week_number', { ascending: false })

  return (
    <DashboardClient
      profile={{
        id: profile.id,
        full_name: profile.full_name,
        role: profile.role ?? '',
        company_id: profile.company_id,
      }}
      company={company}
      aiPath={aiPath ?? null}
      initialSkills={skills ?? []}
    />
  )
}
