import { redirect } from 'next/navigation'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import PlatformAdminClient, { type PlatformUser } from './PlatformAdminClient'

function isPlatformAdmin(email: string | undefined) {
  const allowlist = (process.env.PLATFORM_ADMIN_EMAILS ?? '')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean)

  return Boolean(email && allowlist.includes(email.toLowerCase()))
}

export default async function PlatformAdminPage() {
  const sessionClient = await createClient()
  const { data: { user } } = await sessionClient.auth.getUser()

  if (!isPlatformAdmin(user?.email)) redirect('/dashboard')

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: profiles, error: profilesError }, { data: completions, error: completionsError }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, full_name, role, onboarded, created_at, subscription_status, trial_end, plan, xp, streak')
      .order('created_at', { ascending: false }),
    supabase
      .from('task_completions')
      .select('user_id, created_at'),
  ])

  if (profilesError || completionsError) {
    throw new Error(`Could not load platform data: ${profilesError?.message ?? completionsError?.message}`)
  }

  const activityByUser = new Map<string, { tasksCompleted: number; lastTaskAt: string | null }>()
  for (const completion of completions ?? []) {
    const current = activityByUser.get(completion.user_id) ?? { tasksCompleted: 0, lastTaskAt: null }
    current.tasksCompleted += 1
    if (!current.lastTaskAt || new Date(completion.created_at) > new Date(current.lastTaskAt)) {
      current.lastTaskAt = completion.created_at
    }
    activityByUser.set(completion.user_id, current)
  }

  const platformUsers: PlatformUser[] = (profiles ?? []).map(profile => {
    const activity = activityByUser.get(profile.id)
    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
      onboarded: profile.onboarded,
      signedUpAt: profile.created_at,
      subscriptionStatus: profile.subscription_status,
      trialEnd: profile.trial_end,
      plan: profile.plan,
      xp: profile.xp ?? 0,
      streak: profile.streak ?? 0,
      tasksCompleted: activity?.tasksCompleted ?? 0,
      lastTaskAt: activity?.lastTaskAt ?? null,
    }
  })

  return <PlatformAdminClient users={platformUsers} supportEmail={process.env.SUPPORT_EMAIL ?? 'hello@lessai.io'} />
}
