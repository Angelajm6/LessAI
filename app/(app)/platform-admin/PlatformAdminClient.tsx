'use client'

import { useMemo, useState } from 'react'
import { Activity, AlertTriangle, ArrowUpRight, CheckCircle2, Clock3, Mail, Search, UserMinus, Users } from 'lucide-react'

export interface PlatformUser {
  id: string
  email: string
  fullName: string | null
  role: string | null
  onboarded: boolean
  signedUpAt: string
  subscriptionStatus: string | null
  trialEnd: string | null
  plan: string | null
  xp: number
  streak: number
  tasksCompleted: number
  lastTaskAt: string | null
}

type Segment = 'all' | 'new' | 'not-onboarded' | 'active' | 'at-risk' | 'trial-ending' | 'canceled'

const DAY = 24 * 60 * 60 * 1000

function daysSince(date: string | null) {
  return date ? Math.floor((Date.now() - new Date(date).getTime()) / DAY) : null
}

function formatDate(date: string | null) {
  if (!date) return 'No task activity'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))
}

function displayName(user: PlatformUser) {
  return user.fullName?.trim() || user.email
}

function trialEnding(user: PlatformUser) {
  if (user.subscriptionStatus !== 'trialing' || !user.trialEnd) return false
  const days = daysSince(user.trialEnd)
  return days !== null && days <= 0 && days >= -3
}

function isActiveThisWeek(user: PlatformUser) {
  const days = daysSince(user.lastTaskAt)
  return days !== null && days <= 7
}

function isAtRisk(user: PlatformUser) {
  if (!user.onboarded || user.subscriptionStatus === 'canceled') return false
  const signupAge = daysSince(user.signedUpAt) ?? 0
  const activityAge = daysSince(user.lastTaskAt)
  return signupAge >= 7 && (activityAge === null || activityAge > 7)
}

function segmentFor(user: PlatformUser, segment: Segment) {
  switch (segment) {
    case 'new': return (daysSince(user.signedUpAt) ?? Infinity) <= 7
    case 'not-onboarded': return !user.onboarded
    case 'active': return isActiveThisWeek(user)
    case 'at-risk': return isAtRisk(user)
    case 'trial-ending': return trialEnding(user)
    case 'canceled': return user.subscriptionStatus === 'canceled'
    default: return true
  }
}

function statusLabel(user: PlatformUser) {
  if (user.subscriptionStatus === 'canceled') return { label: 'Canceled', className: 'bg-rose-50 text-rose-700 border-rose-200' }
  if (trialEnding(user)) return { label: 'Trial ending', className: 'bg-amber-50 text-amber-700 border-amber-200' }
  if (!user.onboarded) return { label: 'Not onboarded', className: 'bg-slate-100 text-slate-600 border-slate-200' }
  if (isAtRisk(user)) return { label: 'At risk', className: 'bg-orange-50 text-orange-700 border-orange-200' }
  if (isActiveThisWeek(user)) return { label: 'Active this week', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  return { label: user.subscriptionStatus ?? 'Onboarded', className: 'bg-blue-50 text-blue-700 border-blue-200' }
}

export default function PlatformAdminClient({ users, supportEmail }: { users: PlatformUser[]; supportEmail: string }) {
  const [segment, setSegment] = useState<Segment>('all')
  const [query, setQuery] = useState('')

  const segments = useMemo(() => [
    { id: 'all' as const, label: 'All users', icon: Users, count: users.length },
    { id: 'new' as const, label: 'New signups', icon: Clock3, count: users.filter(user => segmentFor(user, 'new')).length },
    { id: 'not-onboarded' as const, label: 'Not onboarded', icon: AlertTriangle, count: users.filter(user => segmentFor(user, 'not-onboarded')).length },
    { id: 'active' as const, label: 'Active this week', icon: Activity, count: users.filter(user => segmentFor(user, 'active')).length },
    { id: 'at-risk' as const, label: 'At risk / inactive', icon: AlertTriangle, count: users.filter(user => segmentFor(user, 'at-risk')).length },
    { id: 'trial-ending' as const, label: 'Trial ending', icon: Clock3, count: users.filter(user => segmentFor(user, 'trial-ending')).length },
    { id: 'canceled' as const, label: 'Canceled', icon: UserMinus, count: users.filter(user => segmentFor(user, 'canceled')).length },
  ], [users])

  const visibleUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return users.filter(user => {
      const matchesSegment = segmentFor(user, segment)
      const matchesQuery = !normalizedQuery || [user.email, user.fullName, user.role].filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery)
      return matchesSegment && matchesQuery
    })
  }, [users, segment, query])

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Private owner view</p>
            <h1 className="text-3xl font-black tracking-tight">Platform adoption</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Every LessAI account in one place. Use task activity as the adoption signal and reach out before users go quiet.</p>
          </div>
          <a href="/dashboard" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900">Open product <ArrowUpRight className="h-4 w-4" /></a>
        </div>

        <div className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Total users" value={users.length} note="All registered accounts" />
          <Metric label="Activation rate" value={`${users.length ? Math.round((users.filter(user => user.onboarded).length / users.length) * 100) : 0}%`} note={`${users.filter(user => user.onboarded).length} completed onboarding`} />
          <Metric label="Active this week" value={users.filter(isActiveThisWeek).length} note="Completed at least one task" />
          <Metric label="Needs attention" value={users.filter(isAtRisk).length} note="Inactive for 7+ days" attention />
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {segments.map(item => {
            const Icon = item.icon
            return <button key={item.id} onClick={() => setSegment(item.id)} className={`whitespace-nowrap rounded-xl border px-3 py-2 text-sm font-semibold transition ${segment === item.id ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
              <Icon className="mr-1.5 inline h-3.5 w-3.5" />{item.label} <span className={`ml-1 text-xs ${segment === item.id ? 'text-emerald-100' : 'text-slate-400'}`}>{item.count}</span>
            </button>
          })}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold">{visibleUsers.length} user{visibleUsers.length === 1 ? '' : 's'}</p>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name, email, role" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 sm:w-64" />
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-bold">User</th><th className="px-4 py-3 font-bold">Signed up</th><th className="px-4 py-3 font-bold">Adoption</th><th className="px-4 py-3 font-bold">Last task activity</th><th className="px-4 py-3 font-bold">Plan</th><th className="px-5 py-3 text-right font-bold">Action</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {visibleUsers.map(user => {
                  const status = statusLabel(user)
                  const replySubject = `Checking in from LessAI`
                  const mailto = `mailto:${user.email}?subject=${encodeURIComponent(replySubject)}`
                  return <tr key={user.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4"><p className="font-bold text-slate-900">{displayName(user)}</p><p className="mt-0.5 text-xs text-slate-500">{user.email}{user.role ? ` · ${user.role}` : ''}</p></td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(user.signedUpAt)}</td>
                    <td className="px-4 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${status.className}`}>{status.label}</span><p className="mt-1.5 text-xs text-slate-500">{user.tasksCompleted} task{user.tasksCompleted === 1 ? '' : 's'} · {user.xp} XP</p></td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(user.lastTaskAt)}</td>
                    <td className="px-4 py-4 capitalize text-slate-600">{user.subscriptionStatus ?? user.plan ?? '—'}</td>
                    <td className="px-5 py-4 text-right"><a href={mailto} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"><Mail className="h-3.5 w-3.5" /> Email</a></td>
                  </tr>
                })}
                {visibleUsers.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500"><CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-slate-300" />No users match this segment.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-400">“Last task activity” tracks completed LessAI tasks. It is intentionally not presented as a login timestamp.</p>
      </div>
    </main>
  )
}

function Metric({ label, value, note, attention = false }: { label: string; value: string | number; note: string; attention?: boolean }) {
  return <div className={`rounded-2xl border bg-white p-5 shadow-sm ${attention ? 'border-amber-200' : 'border-slate-200'}`}><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-2 text-3xl font-black ${attention ? 'text-amber-600' : 'text-slate-900'}`}>{value}</p><p className="mt-1 text-xs text-slate-500">{note}</p></div>
}
