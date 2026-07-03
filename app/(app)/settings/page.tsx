import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, tools, tool_levels, company_id')
    .eq('id', user.id)
    .single()

  let companyName: string | null = null
  if (profile?.company_id) {
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', profile.company_id)
      .single()
    companyName = company?.name ?? null
  }

  return <SettingsClient profile={profile} companyName={companyName} userEmail={user.email ?? ''} />
}
