import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, tools, tool_levels, company_name, is_admin, onboarded')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarded) redirect('/onboarding')
  if (profile?.is_admin) redirect('/admin')

  const { data: aiPath } = await supabase
    .from('ai_paths')
    .select('use_cases')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { data: completedTasks } = await supabase
    .from('task_completions')
    .select('tool, day')
    .eq('user_id', user.id)

  const { data: savedPrompts } = await supabase
    .from('saved_prompts')
    .select('id, content, label, tool, folder_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: promptFolders } = await supabase
    .from('prompt_folders')
    .select('id, name, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  const { data: playbookRow } = await supabase
    .from('playbooks')
    .select('data')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <DashboardClient
      profile={profile}
      stackMap={aiPath?.use_cases ?? null}
      playbook={playbookRow?.data ?? null}
      completedTasks={completedTasks ?? []}
      savedPrompts={savedPrompts ?? []}
      promptFolders={promptFolders ?? []}
    />
  )
}
