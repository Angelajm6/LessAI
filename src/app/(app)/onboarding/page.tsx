import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingClient from './OnboardingClient'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, company_id, is_admin, onboarded')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.is_admin) redirect('/admin')
  if (profile.onboarded) redirect('/dashboard')

  const { data: company } = await supabase
    .from('companies')
    .select('name, tools')
    .eq('id', profile.company_id)
    .single()

  return (
    <OnboardingClient
      profile={{ id: profile.id, full_name: profile.full_name, company_id: profile.company_id }}
      company={company}
    />
  )
}
