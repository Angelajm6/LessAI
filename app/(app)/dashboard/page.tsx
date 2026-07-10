import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('id, full_name, role, tools, tool_levels, company_name, company_summary, company_website, is_admin, onboarded, company_id')
    .eq('id', user.id)
    .single()

  // Fall back to auth metadata if profile full_name is missing
  const profile = rawProfile ? {
    ...rawProfile,
    full_name: rawProfile.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? null,
  } : rawProfile

  const { data: teamPromptsData } = profile?.company_id
    ? await supabase
        .from('team_prompts')
        .select('id, title, content, tool, pinned, created_at')
        .eq('company_id', profile.company_id)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })
    : { data: [] }

  const { data: profileXp } = await supabase
    .from('profiles')
    .select('xp, streak')
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
    .select('tool, day, completed_at')
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

  const { data: savedWorkflowsData } = await supabase
    .from('saved_workflows')
    .select('workflow_id')
    .eq('user_id', user.id)

  const { data: labHistoryData } = await supabase
    .from('prompt_lab_history')
    .select('id, original, improved, tool, scores_before, scores_after, summary, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Team leaderboard — only for users in a company
  let teamLeaderboard: { id: string; full_name: string | null; xp: number; streak: number }[] = []
  if (profile?.company_id) {
    const { data: teammates } = await supabase
      .from('profiles')
      .select('id, full_name, xp, streak')
      .eq('company_id', profile.company_id)
      .eq('onboarded', true)
      .eq('is_admin', false)
      .order('xp', { ascending: false })
      .limit(10)
    teamLeaderboard = (teammates ?? []).map(t => ({
      id: t.id,
      full_name: t.full_name,
      xp: t.xp ?? 0,
      streak: t.streak ?? 0,
    }))
  }

  return (
    <Suspense>
      <DashboardClient
        profile={profile}
        stackMap={aiPath?.use_cases ?? null}
        playbook={playbookRow?.data ?? null}
        completedTasks={completedTasks ?? []}
        savedPrompts={savedPrompts ?? []}
        promptFolders={promptFolders ?? []}
        initialXp={profileXp?.xp ?? 0}
        initialStreak={profileXp?.streak ?? 0}
        teamPrompts={teamPromptsData ?? []}
        teamLeaderboard={teamLeaderboard}
        labHistory={labHistoryData as never}
        initialSavedWorkflowIds={(savedWorkflowsData ?? []).map(r => r.workflow_id)}
      />
    </Suspense>
  )
}
