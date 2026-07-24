import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile first — needed to gate redirects and know company_id
  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('id, full_name, role, tools, tool_levels, company_name, company_summary, company_website, is_admin, onboarded, company_id, subscription_status, trial_end, plan, xp, streak')
    .eq('id', user.id)
    .single()

  const profile = rawProfile ? {
    ...rawProfile,
    full_name: rawProfile.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? null,
  } : rawProfile

  if (!profile?.onboarded) redirect('/onboarding')
  if (profile?.is_admin) redirect('/admin')

  // Run all remaining queries in parallel
  const [
    aiPathResult,
    completedTasksResult,
    savedPromptsResult,
    promptFoldersResult,
    playbookResult,
    labHistoryResult,
    teamPromptsResult,
    teamLeaderboardResult,
  ] = await Promise.all([
    supabase
      .from('ai_paths')
      .select('use_cases')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('task_completions')
      .select('tool, day, completed_at')
      .eq('user_id', user.id),
    supabase
      .from('saved_prompts')
      .select('id, content, label, tool, folder_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('prompt_folders')
      .select('id, name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('playbooks')
      .select('data')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('prompt_lab_history')
      .select('id, original, improved, tool, scores_before, scores_after, summary, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    profile?.company_id
      ? supabase
          .from('team_prompts')
          .select('id, title, content, tool, pinned, created_at')
          .eq('company_id', profile.company_id)
          .order('pinned', { ascending: false })
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    profile?.company_id
      ? supabase
          .from('profiles')
          .select('id, full_name, xp, streak')
          .eq('company_id', profile.company_id)
          .eq('onboarded', true)
          .eq('is_admin', false)
          .order('xp', { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] }),
  ])

  const teamLeaderboard = ((teamLeaderboardResult.data ?? []) as { id: string; full_name: string | null; xp: number; streak: number }[])
    .map(t => ({ id: t.id, full_name: t.full_name, xp: t.xp ?? 0, streak: t.streak ?? 0 }))

  return (
    <Suspense>
      <DashboardClient
        profile={profile}
        stackMap={aiPathResult.data?.use_cases ?? null}
        playbook={playbookResult.data?.data ?? null}
        completedTasks={completedTasksResult.data ?? []}
        savedPrompts={savedPromptsResult.data ?? []}
        promptFolders={promptFoldersResult.data ?? []}
        initialXp={rawProfile?.xp ?? 0}
        initialStreak={rawProfile?.streak ?? 0}
        teamPrompts={teamPromptsResult.data ?? []}
        teamLeaderboard={teamLeaderboard}
        labHistory={labHistoryResult.data as never}
        subscriptionStatus={rawProfile?.subscription_status ?? null}
        trialEnd={rawProfile?.trial_end ?? null}
        plan={rawProfile?.plan ?? null}
      />
    </Suspense>
  )
}
