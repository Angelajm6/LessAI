import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAttentionDigestEmail, type AttentionDigestUser } from '@/lib/email'

/**
 * Daily "who needs attention" digest for the LessAI owners.
 *
 * Runs once a day (see vercel.json) and emails PLATFORM_ADMIN_EMAILS a short
 * list of users to reach out to, grouped by what is going wrong, so every new
 * signup gets a personal follow-up before they go quiet.
 */

const DAY = 24 * 60 * 60 * 1000

type ProfileRow = {
  id: string
  email: string
  full_name: string | null
  role: string | null
  onboarded: boolean
  is_admin: boolean
  created_at: string
  subscription_status: string | null
  trial_end: string | null
  plan: string | null
}

function daysBetween(from: string, to = Date.now()) {
  return Math.floor((to - new Date(from).getTime()) / DAY)
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const recipients = (process.env.PLATFORM_ADMIN_EMAILS ?? '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)

  if (recipients.length === 0) {
    return NextResponse.json({ ok: true, skipped: 'PLATFORM_ADMIN_EMAILS is not set' })
  }

  const supabase = createAdminClient()
  const [{ data: profiles, error: profilesError }, { data: completions, error: completionsError }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, full_name, role, onboarded, is_admin, created_at, subscription_status, trial_end, plan')
      .order('created_at', { ascending: false }),
    supabase.from('task_completions').select('user_id, completed_at'),
  ])

  if (profilesError || completionsError) {
    return NextResponse.json({ error: profilesError?.message ?? completionsError?.message }, { status: 500 })
  }

  const activity = new Map<string, { count: number; lastAt: string | null }>()
  for (const completion of completions ?? []) {
    const current = activity.get(completion.user_id) ?? { count: 0, lastAt: null }
    current.count += 1
    if (!current.lastAt || new Date(completion.completed_at) > new Date(current.lastAt)) current.lastAt = completion.completed_at
    activity.set(completion.user_id, current)
  }

  const newSignups: AttentionDigestUser[] = []
  const stalledOnboarding: AttentionDigestUser[] = []
  const noFirstTask: AttentionDigestUser[] = []
  const trialEndingSoon: AttentionDigestUser[] = []
  const wentQuiet: AttentionDigestUser[] = []

  for (const profile of (profiles ?? []) as ProfileRow[]) {
    const signupAgeDays = daysBetween(profile.created_at)
    const tasks = activity.get(profile.id) ?? { count: 0, lastAt: null }
    const base = {
      name: profile.full_name?.trim() || profile.email,
      email: profile.email,
      role: profile.role,
      plan: profile.subscription_status ?? profile.plan ?? null,
    }

    if (signupAgeDays < 1) {
      newSignups.push({ ...base, reason: profile.onboarded ? 'Signed up and finished onboarding' : 'Signed up, has not finished onboarding yet' })
      continue
    }

    if (profile.subscription_status === 'canceled') continue

    if (!profile.onboarded && !profile.is_admin) {
      stalledOnboarding.push({ ...base, reason: `Signed up ${signupAgeDays} day${signupAgeDays === 1 ? '' : 's'} ago, never finished onboarding` })
      continue
    }

    if (profile.onboarded && tasks.count === 0 && signupAgeDays >= 3) {
      noFirstTask.push({ ...base, reason: `Onboarded ${signupAgeDays} days ago, still no task completed` })
      continue
    }

    if (profile.subscription_status === 'trialing' && profile.trial_end) {
      const daysLeft = -daysBetween(profile.trial_end)
      if (daysLeft >= 0 && daysLeft <= 3 && tasks.count < 3) {
        trialEndingSoon.push({ ...base, reason: `Trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'} with only ${tasks.count} task${tasks.count === 1 ? '' : 's'} done` })
        continue
      }
    }

    if (tasks.lastAt && signupAgeDays >= 7) {
      const quietDays = daysBetween(tasks.lastAt)
      if (quietDays >= 5) {
        wentQuiet.push({ ...base, reason: `Was active (${tasks.count} tasks), nothing in ${quietDays} days` })
      }
    }
  }

  const total = newSignups.length + stalledOnboarding.length + noFirstTask.length + trialEndingSoon.length + wentQuiet.length
  if (total === 0) {
    return NextResponse.json({ ok: true, sent: false, reason: 'Nothing needs attention today' })
  }

  const { error } = await sendAttentionDigestEmail({
    to: recipients,
    sections: [
      { title: 'New in the last 24 hours', hint: 'Send a personal hello today.', users: newSignups, tone: 'green' },
      { title: 'Stuck before onboarding', hint: 'Ask what got in the way. Offer to set them up on a call.', users: stalledOnboarding, tone: 'amber' },
      { title: 'Onboarded but no first task', hint: 'Point them to one concrete task for their role.', users: noFirstTask, tone: 'amber' },
      { title: 'Trial ending with low usage', hint: 'These are the most likely to churn at the first charge.', users: trialEndingSoon, tone: 'red' },
      { title: 'Went quiet', hint: 'Were active, then stopped. Ask what changed.', users: wentQuiet, tone: 'slate' },
    ],
  })

  if (error) return NextResponse.json({ error: 'Digest email failed' }, { status: 500 })

  return NextResponse.json({
    ok: true,
    sent: true,
    counts: {
      newSignups: newSignups.length,
      stalledOnboarding: stalledOnboarding.length,
      noFirstTask: noFirstTask.length,
      trialEndingSoon: trialEndingSoon.length,
      wentQuiet: wentQuiet.length,
    },
  })
}
