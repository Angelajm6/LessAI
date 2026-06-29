import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SkillClient from './SkillClient'

export default async function SkillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: skill } = await supabase
    .from('skills')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!skill) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: checkin } = await supabase
    .from('checkins')
    .select('*')
    .eq('skill_id', id)
    .single()

  return <SkillClient skill={skill} profile={profile} existingCheckin={checkin} />
}
