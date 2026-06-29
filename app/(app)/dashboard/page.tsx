import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, companies(name, tools)')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarded) redirect('/onboarding')
  if (profile?.is_admin) redirect('/admin')

  // Get AI path
  const { data: aiPath } = await supabase
    .from('ai_paths')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Get all skills
  const { data: skills } = await supabase
    .from('skills')
    .select('*, checkins(*)')
    .eq('user_id', user.id)
    .order('week_number', { ascending: true })

  return (
    <DashboardClient
      profile={profile}
      aiPath={aiPath}
      skills={skills ?? []}
    />
  )
}
