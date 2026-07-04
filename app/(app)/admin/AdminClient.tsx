'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Users, Send, CheckCircle, Clock, TrendingUp, AlertTriangle, Zap,
  Copy, ChevronDown, ChevronRight, Download, BarChart2, Flame,
  UserCheck, Mail, ArrowUpRight, BookMarked, Pin, PinOff, Trash2,
  Plus, DollarSign, Trophy, Sparkles, Star
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

interface Member {
  id: string
  full_name: string | null
  email: string
  role: string | null
  onboarded: boolean
  tools: string[] | null
  tool_levels: Record<string, string> | null
  company_name: string | null
}

interface TaskCompletion {
  user_id: string
  tool: string
  day: number
  completed_at?: string
}

interface TeamPrompt {
  id: string
  title: string
  content: string
  tool: string | null
  pinned: boolean
  created_by: string | null
  created_at: string
}

interface Props {
  company: { id: string; name: string; tools: string[] } | null
  members: Member[]
  invites: { id: string; email: string; used: boolean; created_at: string }[]
  adminName: string
  taskCompletions: TaskCompletion[]
  teamPrompts: TeamPrompt[]
  memberXp: Record<string, { xp: number; streak: number }>
}

function getInitials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(' ')
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function getEngagementScore(completions: number, toolCount: number): { score: number; label: string; color: string } {
  if (!toolCount) return { score: 0, label: 'Not started', color: 'text-gray-400' }
  const pct = Math.min(Math.round((completions / (toolCount * 5)) * 100), 100)
  if (pct === 0) return { score: pct, label: 'Inactive', color: 'text-amber-500' }
  if (pct < 30) return { score: pct, label: 'Getting started', color: 'text-blue-500' }
  if (pct < 70) return { score: pct, label: 'Progressing', color: 'text-emerald-600' }
  return { score: pct, label: 'Power user', color: 'text-emerald-700' }
}

function getMemberStatus(member: Member, completions: TaskCompletion[]) {
  if (!member.onboarded) return { label: 'Not started', color: 'bg-gray-100 text-gray-500' }
  if (completions.length === 0) return { label: 'Needs nudge', color: 'bg-amber-100 text-amber-700' }
  if (completions.length >= 5) return { label: 'Active', color: 'bg-emerald-100 text-emerald-700' }
  return { label: 'Getting started', color: 'bg-blue-50 text-blue-600' }
}

function exportCSV(members: Member[], completionsByMember: Record<string, TaskCompletion[]>) {
  const rows = [
    ['Name', 'Email', 'Role', 'Onboarded', 'Tools', 'Tasks Done', 'Engagement %'],
    ...members.map(m => {
      const completions = completionsByMember[m.id] ?? []
      const tools = m.tools ?? []
      const eng = getEngagementScore(completions.length, tools.length)
      return [
        m.full_name ?? '',
        m.email,
        m.role ?? '',
        m.onboarded ? 'Yes' : 'No',
        tools.join('; '),
        completions.length,
        `${eng.score}%`,
      ]
    })
  ]
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'lessai-team-report.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminClient({ company, members, invites, adminName, taskCompletions, teamPrompts: initialTeamPrompts, memberXp }: Props) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [expandedMember, setExpandedMember] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'people' | 'tools' | 'leaderboard' | 'marketplace' | 'roi' | 'invite'>('people')
  const [lbPeriod, setLbPeriod] = useState<'alltime' | 'week'>('alltime')
  const [sortPeople, setSortPeople] = useState<'name' | 'tasks' | 'engagement'>('tasks')
  // Marketplace state
  const [teamPrompts, setTeamPrompts] = useState<TeamPrompt[]>(initialTeamPrompts)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newTool, setNewTool] = useState('')
  const [savingPrompt, setSavingPrompt] = useState(false)
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null)
  const [nudgingId, setNudgingId] = useState<string | null>(null)
  const [nudgedId, setNudgedId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [memberList, setMemberList] = useState(members)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [resentId, setResentId] = useState<string | null>(null)
  const [inviteList, setInviteList] = useState(invites)
  const [deletingInviteId, setDeletingInviteId] = useState<string | null>(null)

  // ── Derived data ──────────────────────────────────────────────────────────
  const completionsByMember: Record<string, TaskCompletion[]> = {}
  const completionsByTool: Record<string, Set<string>> = {}

  for (const c of taskCompletions) {
    if (!completionsByMember[c.user_id]) completionsByMember[c.user_id] = []
    completionsByMember[c.user_id].push(c)
    if (!completionsByTool[c.tool]) completionsByTool[c.tool] = new Set()
    completionsByTool[c.tool].add(c.user_id)
  }

  const allStackTools = Array.from(new Set(members.flatMap(m => m.tools ?? [])))

  const toolStats = allStackTools.map(tool => {
    const membersWithTool = members.filter(m => (m.tools ?? []).includes(tool))
    const activeUsers = completionsByTool[tool]?.size ?? 0
    const adoptionPct = membersWithTool.length > 0 ? Math.round((activeUsers / membersWithTool.length) * 100) : 0
    const totalTasksDone = taskCompletions.filter(c => c.tool === tool).length
    const skillBreakdown = {
      never: membersWithTool.filter(m => (m.tool_levels?.[tool] ?? 'never') === 'never').length,
      learning: membersWithTool.filter(m => m.tool_levels?.[tool] === 'learning').length,
      comfortable: membersWithTool.filter(m => m.tool_levels?.[tool] === 'comfortable').length,
    }
    return { tool, membersWithTool: membersWithTool.length, activeUsers, adoptionPct, totalTasksDone, skillBreakdown }
  }).sort((a, b) => b.adoptionPct - a.adoptionPct)

  const unusedTools = toolStats.filter(t => t.membersWithTool > 0 && t.activeUsers === 0)
  const onboardedCount = members.filter(m => m.onboarded).length
  const totalTasks = taskCompletions.length
  const avgTasksPerMember = onboardedCount > 0 ? Math.round(totalTasks / onboardedCount) : 0
  const topPerformer = [...members].sort((a, b) =>
    (completionsByMember[b.id]?.length ?? 0) - (completionsByMember[a.id]?.length ?? 0)
  )[0]

  const sortedMembers = [...memberList].sort((a, b) => {
    if (sortPeople === 'tasks') return (completionsByMember[b.id]?.length ?? 0) - (completionsByMember[a.id]?.length ?? 0)
    if (sortPeople === 'engagement') {
      const aEng = getEngagementScore(completionsByMember[a.id]?.length ?? 0, a.tools?.length ?? 0).score
      const bEng = getEngagementScore(completionsByMember[b.id]?.length ?? 0, b.tools?.length ?? 0).score
      return bEng - aEng
    }
    return (a.full_name ?? a.email).localeCompare(b.full_name ?? b.email)
  })

  async function nudgeMember(memberId: string) {
    setNudgingId(memberId)
    await fetch('/api/admin/nudge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    })
    setNudgingId(null)
    setNudgedId(memberId)
    setTimeout(() => setNudgedId(null), 3000)
  }

  async function removeMember(memberId: string) {
    if (!confirm('Permanently delete this member and their account? This cannot be undone.')) return
    setRemovingId(memberId)
    const res = await fetch('/api/admin/remove-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    })
    if (res.ok) {
      setMemberList(prev => prev.filter(m => m.id !== memberId))
      setExpandedMember(null)
    }
    setRemovingId(null)
  }

  async function createTeamPrompt() {
    if (!newTitle.trim() || !newContent.trim() || !company) return
    setSavingPrompt(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('team_prompts')
        .insert({ company_id: company.id, title: newTitle.trim(), content: newContent.trim(), tool: newTool || null, pinned: false, created_by: user.id })
        .select('id, title, content, tool, pinned, created_by, created_at')
        .single()
      if (data) setTeamPrompts(prev => [data, ...prev])
    }
    setNewTitle(''); setNewContent(''); setNewTool('')
    setSavingPrompt(false)
  }

  async function togglePin(id: string, current: boolean) {
    const supabase = createClient()
    await supabase.from('team_prompts').update({ pinned: !current }).eq('id', id)
    setTeamPrompts(prev => prev.map(p => p.id === id ? { ...p, pinned: !current } : p)
      .sort((a, b) => Number(b.pinned) - Number(a.pinned)))
  }

  async function deleteTeamPrompt(id: string) {
    const supabase = createClient()
    await supabase.from('team_prompts').delete().eq('id', id)
    setTeamPrompts(prev => prev.filter(p => p.id !== id))
  }

  async function copyTeamPrompt(content: string, id: string) {
    await navigator.clipboard.writeText(content)
    setCopiedPromptId(id)
    setTimeout(() => setCopiedPromptId(null), 2000)
  }

  async function sendInvite() {
    if (!inviteEmail) return
    setInviting(true)
    setInviteError('')
    try {
      const res = await fetch('/api/invite/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        setInviteError(data?.error ?? `Error ${res.status}`)
      } else if (data?.inviteLink) {
        setInviteLink(data.inviteLink)
        setInviteEmail('')
      }
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : 'Network error')
    }
    setInviting(false)
  }

  async function copyLink(link: string) {
    await navigator.clipboard.writeText(link)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hey {adminName.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 text-sm mt-0.5">{company?.name ?? 'Your team'} · AI adoption dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => exportCSV(members, completionsByMember)}
            className="gap-1.5 text-xs border-gray-200 text-gray-600 hover:bg-gray-50">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
          <Button size="sm" onClick={() => setActiveTab('invite')}
            className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 text-xs">
            <Mail className="w-3.5 h-3.5" /> Invite member
          </Button>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Onboarded',
            value: `${onboardedCount}/${members.length}`,
            sub: members.length > 0 ? `${Math.round((onboardedCount / members.length) * 100)}% of team` : 'No members yet',
            icon: UserCheck,
            amber: false,
          },
          {
            label: 'Tasks done',
            value: totalTasks,
            sub: 'across all tools',
            icon: CheckCircle,
            amber: false,
          },
          {
            label: 'Avg per person',
            value: avgTasksPerMember,
            sub: 'tasks completed',
            icon: BarChart2,
            amber: false,
          },
          {
            label: 'Unused tools',
            value: unusedTools.length,
            sub: unusedTools.length > 0 ? 'need attention' : 'all tools active',
            icon: AlertTriangle,
            amber: unusedTools.length > 0,
          },
        ].map(card => (
          <div key={card.label} className={`rounded-2xl p-4 border ${card.amber ? 'bg-amber-50 border-amber-100' : 'bg-white border-gray-100 shadow-sm'}`}>
            <card.icon className={`w-4 h-4 mb-2 ${card.amber ? 'text-amber-500' : 'text-emerald-500'}`} />
            <div className={`text-2xl font-black mb-0.5 ${card.amber ? 'text-amber-600' : 'text-gray-900'}`}>{card.value}</div>
            <div className="text-xs font-semibold text-gray-700">{card.label}</div>
            <div className="text-xs text-gray-400">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Top performer + nudge callout */}
      <div className="grid sm:grid-cols-2 gap-3">
        {topPerformer && (completionsByMember[topPerformer.id]?.length ?? 0) > 0 && (
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-200">Top performer</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                {getInitials(topPerformer.full_name, topPerformer.email)}
              </div>
              <div>
                <p className="font-bold">{topPerformer.full_name ?? topPerformer.email}</p>
                <p className="text-emerald-200 text-xs">{completionsByMember[topPerformer.id]?.length ?? 0} tasks · {topPerformer.role}</p>
              </div>
            </div>
          </div>
        )}
        {unusedTools.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-1">
                  {unusedTools.length} tool{unusedTools.length > 1 ? 's' : ''} with zero usage
                </p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  <strong>{unusedTools.map(t => t.tool).join(', ')}</strong> — nobody has completed a task yet.
                </p>
                <button onClick={() => setActiveTab('tools')} className="text-xs text-amber-600 font-semibold mt-1.5 flex items-center gap-0.5 hover:text-amber-800">
                  View details <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {([
          { key: 'people', label: '👥 Team' },
          { key: 'tools', label: '🔧 Tools' },
          { key: 'leaderboard', label: '🏆 Leaderboard' },
          { key: 'marketplace', label: '📚 Prompts' },
          { key: 'roi', label: '📊 ROI' },
          { key: 'invite', label: '✉️ Invite' },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap px-3 ${activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── By person tab ── */}
      {activeTab === 'people' && (
        <div className="space-y-3">
          {/* Sort controls */}
          {members.length > 1 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400 font-medium">Sort by:</span>
              {(['tasks', 'engagement', 'name'] as const).map(s => (
                <button key={s} onClick={() => setSortPeople(s)}
                  className={`px-3 py-1 rounded-full border font-medium transition-all capitalize ${sortPeople === s ? 'bg-emerald-600 text-white border-emerald-600' : 'text-gray-500 border-gray-200 hover:border-emerald-300'}`}>
                  {s === 'tasks' ? 'Most active' : s === 'engagement' ? 'Engagement' : 'Name'}
                </button>
              ))}
            </div>
          )}

          {members.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400 mb-3">No team members yet</p>
              <Button size="sm" onClick={() => setActiveTab('invite')} className="bg-emerald-600 hover:bg-emerald-700">
                Send first invite
              </Button>
            </div>
          ) : sortedMembers.map(m => {
            const completions = completionsByMember[m.id] ?? []
            const tools = m.tools ?? []
            const status = getMemberStatus(m, completions)
            const eng = getEngagementScore(completions.length, tools.length)
            const initials = getInitials(m.full_name, m.email)
            const isOpen = expandedMember === m.id
            const toolCompletion: Record<string, number> = {}
            for (const c of completions) toolCompletion[c.tool] = (toolCompletion[c.tool] ?? 0) + 1

            return (
              <div key={m.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-emerald-200 transition-colors shadow-sm">
                <button onClick={() => setExpandedMember(isOpen ? null : m.id)}
                  className="w-full text-left p-4 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{m.full_name ?? m.email}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>{status.label}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{m.role ?? 'Role not set'} · {tools.length} tool{tools.length !== 1 ? 's' : ''} · {completions.length} tasks</div>
                  </div>
                  {/* Engagement bar */}
                  <div className="hidden sm:block w-24 shrink-0">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className={`font-semibold ${eng.color}`}>{eng.score}%</span>
                      <span className="text-gray-300 text-xs">{eng.label}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-1.5 bg-emerald-500 rounded-full transition-all" style={{ width: `${eng.score}%` }} />
                    </div>
                  </div>
                  {/* Tool pills */}
                  <div className="hidden md:flex items-center gap-1 shrink-0">
                    {tools.slice(0, 3).map(t => (
                      <span key={t} className={`text-xs px-2 py-0.5 rounded-full font-medium ${(toolCompletion[t] ?? 0) > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                        {t}
                      </span>
                    ))}
                    {tools.length > 3 && <span className="text-xs text-gray-400">+{tools.length - 3}</span>}
                  </div>
                  {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />}
                </button>

                {isOpen && (
                  <div className="border-t border-gray-50 px-4 pb-4 pt-3">
                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={() => nudgeMember(m.id)}
                        disabled={nudgingId === m.id}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors font-medium disabled:opacity-50"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        {nudgingId === m.id ? 'Sending…' : nudgedId === m.id ? '✓ Nudge sent!' : 'Send nudge'}
                      </button>
                      <button
                        onClick={() => removeMember(m.id)}
                        disabled={removingId === m.id}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors font-medium disabled:opacity-50 ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {removingId === m.id ? 'Removing…' : 'Remove member'}
                      </button>
                    </div>
                    {!m.onboarded ? (
                      <p className="text-sm text-gray-400 italic">This person hasn&apos;t completed onboarding yet.</p>
                    ) : tools.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No tools in their stack.</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <div className="text-xl font-black text-gray-800">{completions.length}</div>
                            <div className="text-xs text-gray-400">Tasks done</div>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <div className="text-xl font-black text-gray-800">{tools.length}</div>
                            <div className="text-xs text-gray-400">Tools</div>
                          </div>
                          <div className={`rounded-xl p-3 text-center ${eng.score >= 50 ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                            <div className={`text-xl font-black ${eng.score >= 50 ? 'text-emerald-700' : 'text-amber-600'}`}>{eng.score}%</div>
                            <div className="text-xs text-gray-400">Engagement</div>
                          </div>
                        </div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Tool progress</p>
                        <div className="space-y-2">
                          {tools.map(tool => {
                            const done = toolCompletion[tool] ?? 0
                            const level = m.tool_levels?.[tool] ?? 'never'
                            const pct = Math.min(Math.round((done / 5) * 100), 100)
                            return (
                              <div key={tool} className="flex items-center gap-3">
                                <div className="w-28 shrink-0 text-xs font-medium text-gray-700 truncate">{tool}</div>
                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                                  <div className={`h-1.5 rounded-full transition-all ${done > 0 ? 'bg-emerald-500' : 'bg-gray-200'}`} style={{ width: `${pct}%` }} />
                                </div>
                                <div className="text-xs text-gray-400 w-12 text-right">{done}/5</div>
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium w-20 text-center ${
                                  level === 'comfortable' ? 'bg-emerald-50 text-emerald-600' :
                                  level === 'learning' ? 'bg-amber-50 text-amber-600' :
                                  'bg-gray-50 text-gray-400'
                                }`}>{level}</span>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── By tool tab ── */}
      {activeTab === 'tools' && (
        <div className="space-y-3">
          {toolStats.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Zap className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No tool data yet — team members need to complete onboarding first.</p>
            </div>
          ) : toolStats.map(({ tool, membersWithTool, activeUsers, adoptionPct, totalTasksDone, skillBreakdown }) => {
            const isUnused = activeUsers === 0 && membersWithTool > 0
            const isStrong = adoptionPct >= 70
            return (
              <div key={tool} className={`bg-white border rounded-2xl p-5 shadow-sm ${isUnused ? 'border-amber-200' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-semibold text-gray-900">{tool}</span>
                      {isUnused && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Unused
                        </span>
                      )}
                      {isStrong && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <Flame className="w-3 h-3" /> High adoption
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{membersWithTool} member{membersWithTool !== 1 ? 's' : ''} · {totalTasksDone} tasks done</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-2xl font-black ${isUnused ? 'text-amber-500' : isStrong ? 'text-emerald-600' : 'text-gray-700'}`}>
                      {adoptionPct}%
                    </div>
                    <div className="text-xs text-gray-400">adoption</div>
                  </div>
                </div>

                {/* Adoption bar */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div className={`h-2 rounded-full transition-all ${isUnused ? 'bg-amber-300' : isStrong ? 'bg-emerald-500' : 'bg-emerald-400'}`}
                    style={{ width: `${adoptionPct}%` }} />
                </div>

                {/* Skill breakdown */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-gray-400 font-medium">Skill levels:</span>
                  {skillBreakdown.comfortable > 0 && (
                    <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{skillBreakdown.comfortable} comfortable</span>
                  )}
                  {skillBreakdown.learning > 0 && (
                    <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{skillBreakdown.learning} learning</span>
                  )}
                  {skillBreakdown.never > 0 && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{skillBreakdown.never} never used</span>
                  )}
                  {isUnused && <span className="text-xs text-amber-600 font-medium ml-auto">Consider reviewing this license</span>}
                </div>
              </div>
            )
          })}

          {/* ROI callout */}
          {unusedTools.length > 0 && (
            <div className="bg-emerald-700 text-white rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-amber-300" />
                <span className="text-sm font-bold">ROI opportunity</span>
              </div>
              <p className="text-sm text-emerald-100 leading-relaxed mb-3">
                <strong className="text-white">{unusedTools.length} tool{unusedTools.length > 1 ? 's' : ''}</strong> in your stack
                {unusedTools.length > 1 ? ' have' : ' has'} 0% adoption.
                If each costs ~$20/seat/month across {members.length} people, that&apos;s{' '}
                <strong className="text-amber-300">${unusedTools.length * 20 * members.length}/month</strong> going unused.
              </p>
              <div className="bg-white/10 rounded-xl p-3 text-sm text-emerald-100">
                <strong className="text-white">What to do:</strong> Send a nudge to your team, or use this data to justify cancelling unused licenses and reallocating the budget.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Leaderboard tab ── */}
      {activeTab === 'leaderboard' && (() => {
        const XP_LEVELS = [
          { name: 'Novice', min: 0, color: 'text-gray-500' },
          { name: 'Explorer', min: 100, color: 'text-teal-600' },
          { name: 'Practitioner', min: 250, color: 'text-emerald-600' },
          { name: 'Pro', min: 500, color: 'text-amber-600' },
          { name: 'Expert', min: 1000, color: 'text-amber-500' },
        ]
        function getLevelName(xp: number) {
          let name = XP_LEVELS[0].name
          for (const l of XP_LEVELS) { if (xp >= l.min) name = l.name }
          return name
        }
        function getLevelColor(xp: number) {
          let color = XP_LEVELS[0].color
          for (const l of XP_LEVELS) { if (xp >= l.min) color = l.color }
          return color
        }

        const startOfWeek = new Date()
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
        startOfWeek.setHours(0, 0, 0, 0)

        const weekCompletionsByMember: Record<string, number> = {}
        for (const c of taskCompletions) {
          if (c.completed_at && new Date(c.completed_at) >= startOfWeek) {
            weekCompletionsByMember[c.user_id] = (weekCompletionsByMember[c.user_id] ?? 0) + 1
          }
        }

        const ranked = members
          .filter(m => m.onboarded)
          .map(m => ({
            ...m,
            xp: memberXp[m.id]?.xp ?? 0,
            streak: memberXp[m.id]?.streak ?? 0,
            tasks: completionsByMember[m.id]?.length ?? 0,
            weekTasks: weekCompletionsByMember[m.id] ?? 0,
          }))
          .sort((a, b) => lbPeriod === 'week' ? b.weekTasks - a.weekTasks : b.xp - a.xp)

        const top3 = ranked.slice(0, 3)
        const rest = ranked.slice(3)

        const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3
        const podiumHeights = ['h-20', 'h-28', 'h-16']
        const podiumLabels = ['2nd', '1st', '3rd']
        const podiumMedals = ['🥈', '🥇', '🥉']
        const podiumBg = ['bg-gray-100', 'bg-amber-100', 'bg-gray-50']

        return (
          <div className="space-y-5">
            {/* Period toggle */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Team XP Leaderboard</h3>
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                {([{ key: 'alltime', label: 'All time' }, { key: 'week', label: 'This week' }] as const).map(p => (
                  <button key={p.key} onClick={() => setLbPeriod(p.key)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${lbPeriod === p.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {ranked.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Trophy className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No XP data yet — members earn XP by completing tasks.</p>
              </div>
            ) : (
              <>
                {/* Podium */}
                {top3.length >= 2 && (
                  <div className="bg-gradient-to-b from-gray-950 to-gray-900 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.3), transparent 70%)' }} />
                    <div className="relative flex items-end justify-center gap-4">
                      {podiumOrder.map((m, i) => m && (
                        <div key={m.id} className="flex flex-col items-center gap-2">
                          <div className="text-xl">{podiumMedals[i]}</div>
                          <div className="w-12 h-12 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center border-2 border-white/20">
                            {getInitials(m.full_name, m.email)}
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-bold text-white truncate max-w-[80px]">{(m.full_name ?? m.email).split(' ')[0]}</p>
                            <p className="text-xs text-emerald-400 font-bold">
                              {lbPeriod === 'week' ? `${m.weekTasks} tasks` : `${m.xp} XP`}
                            </p>
                          </div>
                          <div className={`${podiumHeights[i]} w-20 ${podiumBg[i]} rounded-t-xl flex items-center justify-center`}>
                            <span className="text-xs font-bold text-gray-500">{podiumLabels[i]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full ranked list */}
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  {ranked.map((m, i) => (
                    <div key={m.id} className={`flex items-center gap-3 px-4 py-3 ${i < ranked.length - 1 ? 'border-b border-gray-50' : ''} ${i < 3 ? 'bg-emerald-50/30' : ''}`}>
                      <span className="w-6 text-sm font-black text-center text-gray-400 shrink-0">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {getInitials(m.full_name, m.email)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{m.full_name ?? m.email}</p>
                        <p className="text-xs text-gray-400">{m.role ?? 'No role'} · <span className={getLevelColor(m.xp)}>{getLevelName(m.xp)}</span></p>
                      </div>
                      <div className="text-right shrink-0 space-y-0.5">
                        <p className="text-sm font-bold text-emerald-600">
                          {lbPeriod === 'week' ? `${m.weekTasks} tasks` : `${m.xp} XP`}
                        </p>
                        <div className="flex items-center gap-2 justify-end">
                          {m.streak > 0 && <span className="text-xs text-amber-500">🔥 {m.streak}d</span>}
                          <span className="text-xs text-gray-300">{m.tasks} total</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary bar */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total XP earned', value: ranked.reduce((s, m) => s + m.xp, 0).toLocaleString() },
                    { label: 'Longest streak', value: `${Math.max(...ranked.map(m => m.streak), 0)}d 🔥` },
                    { label: 'Tasks this week', value: ranked.reduce((s, m) => s + m.weekTasks, 0) },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                      <p className="text-lg font-black text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )
      })()}

      {/* ── Marketplace tab ── */}
      {activeTab === 'marketplace' && (
        <div className="space-y-5">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl p-5"
            style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #fefce8 100%)' }}>
            <div className="dot-grid-3d absolute inset-0 opacity-20" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <BookMarked className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-gray-900">Team Prompt Library</h2>
              </div>
              <p className="text-sm text-gray-500">
                Publish approved prompt templates your whole team can copy. Pinned prompts appear first in every member&apos;s dashboard.
              </p>
            </div>
          </div>

          {/* Create form */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" /> Add a team prompt
            </h3>
            <div className="space-y-3">
              <Input placeholder="Title — e.g. 'Weekly status update framework'"
                value={newTitle} onChange={e => setNewTitle(e.target.value)}
                className="border-gray-200 focus:ring-emerald-400 text-sm" />
              <Textarea placeholder="The full prompt template your team should use…"
                value={newContent} onChange={e => setNewContent(e.target.value)}
                rows={4} className="border-gray-200 focus:ring-emerald-400 text-sm resize-none" />
              <div className="flex gap-2">
                <select value={newTool} onChange={e => setNewTool(e.target.value)}
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-400">
                  <option value="">No specific tool</option>
                  {Array.from(new Set(members.flatMap(m => m.tools ?? []))).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <Button onClick={createTeamPrompt} disabled={savingPrompt || !newTitle.trim() || !newContent.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 shrink-0">
                  {savingPrompt ? 'Publishing…' : <><Sparkles className="w-4 h-4" /> Publish</>}
                </Button>
              </div>
            </div>
          </div>

          {/* Prompt list */}
          {teamPrompts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <BookMarked className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400 mb-1">No team prompts yet</p>
              <p className="text-xs text-gray-300">Publish one above — it&apos;ll appear in every team member&apos;s dashboard.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teamPrompts.map(p => (
                <div key={p.id} className={`bg-white border rounded-2xl p-4 shadow-sm transition-all ${p.pinned ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        {p.pinned && <Pin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                        <p className="text-sm font-semibold text-gray-900">{p.title}</p>
                        {p.tool && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{p.tool}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => copyTeamPrompt(p.content, p.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Copy">
                        {copiedPromptId === p.id ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button onClick={() => togglePin(p.id, p.pinned)}
                        className={`p-1.5 rounded-lg transition-colors ${p.pinned ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                        title={p.pinned ? 'Unpin' : 'Pin to top'}>
                        {p.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                      </button>
                      <button onClick={() => deleteTeamPrompt(p.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 bg-white border border-gray-100 rounded-xl p-3 leading-relaxed line-clamp-3">{p.content}</p>
                </div>
              ))}
            </div>
          )}

          {teamPrompts.length > 0 && (
            <p className="text-xs text-gray-400 text-center">
              {teamPrompts.filter(p => p.pinned).length} pinned · {teamPrompts.length} total prompts · visible to all {members.filter(m => m.onboarded).length} onboarded members
            </p>
          )}
        </div>
      )}

      {/* ── ROI Dashboard tab ── */}
      {activeTab === 'roi' && (() => {
        const MINUTES_PER_TASK = 15
        const HOURLY_RATE = 35 // conservative avg fully-loaded $/hr
        const totalMinutesSaved = totalTasks * MINUTES_PER_TASK
        const totalHoursSaved = totalMinutesSaved / 60
        const totalValueSaved = Math.round(totalHoursSaved * HOURLY_RATE)
        const adoptionRate = members.length > 0 ? Math.round((onboardedCount / members.length) * 100) : 0
        const projectedAnnualValue = Math.round(totalValueSaved * (52 / Math.max(4, 1))) // rough 52-week projection

        // XP leaderboard
        const leaderboard = [...members]
          .filter(m => m.onboarded)
          .map(m => ({
            ...m,
            xp: memberXp[m.id]?.xp ?? 0,
            streak: memberXp[m.id]?.streak ?? 0,
            tasks: completionsByMember[m.id]?.length ?? 0,
          }))
          .sort((a, b) => b.xp - a.xp)
          .slice(0, 5)

        const XP_LEVELS = [
          { name: 'Novice', min: 0 },
          { name: 'Explorer', min: 100 },
          { name: 'Practitioner', min: 250 },
          { name: 'Pro', min: 500 },
          { name: 'Expert', min: 1000 },
        ]
        function getLevelName(xp: number) {
          let name = XP_LEVELS[0].name
          for (const l of XP_LEVELS) { if (xp >= l.min) name = l.name }
          return name
        }

        const levelDist = XP_LEVELS.map(level => ({
          ...level,
          count: leaderboard.filter(m => getLevelName(m.xp) === level.name).length,
        })).filter(l => l.count > 0)

        return (
          <div className="space-y-5">
            {/* ROI headline */}
            <div className="relative overflow-hidden rounded-2xl p-6 text-white"
              style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #d97706 100%)' }}>
              <div className="dot-grid-3d absolute inset-0 opacity-20" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-amber-200" />
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-100">ROI Summary</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { value: `${Math.round(totalHoursSaved)}h`, label: 'Time saved' },
                    { value: `$${totalValueSaved.toLocaleString()}`, label: 'Est. value' },
                    { value: `${adoptionRate}%`, label: 'Adoption rate' },
                    { value: `$${projectedAnnualValue.toLocaleString()}`, label: 'Annual projection' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white/15 rounded-xl px-3 py-2.5 border border-white/20">
                      <p className="text-lg font-black text-white">{stat.value}</p>
                      <p className="text-xs text-white/60">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-white/50 mt-3">Based on {totalTasks} tasks × 15 min avg saved · $35/hr loaded cost assumption</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* XP Leaderboard */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" /> XP Leaderboard
                </h3>
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No XP data yet — members earn XP by completing tasks.</p>
                ) : (
                  <div className="space-y-2.5">
                    {leaderboard.map((m, i) => (
                      <div key={m.id} className="flex items-center gap-3">
                        <span className={`w-5 text-xs font-black text-center ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : 'text-gray-300'}`}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                        </span>
                        <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {getInitials(m.full_name, m.email)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">{m.full_name ?? m.email}</p>
                          <p className="text-xs text-gray-400">{getLevelName(m.xp)} · {m.tasks} tasks</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-emerald-600">{m.xp} XP</p>
                          {m.streak > 0 && <p className="text-xs text-amber-500">🔥 {m.streak}d</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Skill level distribution */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 text-emerald-500" /> Skill Progression
                </h3>
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No progression data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {XP_LEVELS.slice().reverse().map(level => {
                      const count = leaderboard.filter(m => getLevelName(m.xp) === level.name).length
                      const pct = leaderboard.length > 0 ? Math.round((count / leaderboard.length) * 100) : 0
                      if (count === 0) return null
                      return (
                        <div key={level.name}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-gray-700">{level.name}</span>
                            <span className="text-gray-400">{count} member{count !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-700"
                              style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Per-tool ROI breakdown */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-600" /> Value by Tool
              </h3>
              {toolStats.length === 0 ? (
                <p className="text-sm text-gray-400">No tool data yet.</p>
              ) : (
                <div className="space-y-3">
                  {toolStats.slice(0, 8).map(({ tool, totalTasksDone, membersWithTool }) => {
                    const mins = totalTasksDone * MINUTES_PER_TASK
                    const value = Math.round((mins / 60) * HOURLY_RATE)
                    const maxTasks = toolStats[0]?.totalTasksDone ?? 1
                    return (
                      <div key={tool} className="flex items-center gap-3">
                        <div className="w-28 shrink-0 text-xs font-medium text-gray-700 truncate">{tool}</div>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-2 rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${Math.round((totalTasksDone / Math.max(maxTasks, 1)) * 100)}%` }} />
                        </div>
                        <div className="text-xs text-gray-500 w-14 text-right shrink-0">{totalTasksDone} tasks</div>
                        <div className="text-xs font-semibold text-emerald-600 w-16 text-right shrink-0">${value}</div>
                      </div>
                    )
                  })}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-3 border-t border-gray-50 pt-3">
                Present this to leadership: <strong className="text-gray-600">{totalTasks} tasks completed = ~${totalValueSaved.toLocaleString()} in recovered productivity</strong> at your team size.
              </p>
            </div>
          </div>
        )
      })()}

      {/* ── Invite tab ── */}
      {activeTab === 'invite' && (
        <div className="space-y-5">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-600" /> Invite a team member
            </h3>
            <p className="text-xs text-gray-400 mb-4">An invite email is sent automatically. We'll also show you the link as a backup.</p>
            <div className="flex gap-2">
              <Input type="email" placeholder="colleague@company.com"
                value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendInvite()}
                className="border-gray-200 focus:ring-emerald-400" />
              <Button onClick={sendInvite} disabled={inviting || !inviteEmail}
                className="bg-emerald-600 hover:bg-emerald-700 shrink-0 gap-1.5">
                {inviting ? 'Sending…' : <><Send className="w-3.5 h-3.5" /> Send invite</>}
              </Button>
            </div>

            {inviteError && (
              <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{inviteError}</p>
              </div>
            )}

            {inviteLink && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-700 font-semibold">Invite email sent!</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-medium mb-2">Backup link (if email doesn't arrive):</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-gray-600 bg-white border border-gray-200 px-2 py-1.5 rounded-lg flex-1 truncate">{inviteLink}</code>
                    <Button size="sm" variant="outline" onClick={() => copyLink(inviteLink)}
                      className="shrink-0 gap-1 text-xs">
                      {copiedLink ? <><CheckCircle className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Invite history */}
          {invites.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Sent invites</h3>
                <span className="text-xs text-gray-400">{inviteList.filter(i => i.used).length}/{inviteList.length} joined</span>
              </div>
              <div className="space-y-2">
                {inviteList.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <span className="text-sm text-gray-700">{inv.email}</span>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(inv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {inv.used
                        ? <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs gap-1"><CheckCircle className="w-3 h-3" /> Joined</Badge>
                        : (
                          <>
                            <Badge variant="outline" className="text-xs text-gray-400 gap-1"><Clock className="w-3 h-3" /> Pending</Badge>
                            <button
                              disabled={resendingId === inv.id}
                              onClick={async () => {
                                setResendingId(inv.id)
                                await fetch('/api/invite/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: inv.email }) })
                                setResendingId(null)
                                setResentId(inv.id)
                                setTimeout(() => setResentId(null), 3000)
                              }}
                              className="text-xs font-medium transition-colors disabled:opacity-50 text-emerald-600 hover:text-emerald-700"
                            >
                              {resendingId === inv.id ? 'Sending…' : resentId === inv.id ? '✓ Sent!' : 'Resend'}
                            </button>
                          </>
                        )}
                      <button
                        disabled={deletingInviteId === inv.id}
                        onClick={async () => {
                          setDeletingInviteId(inv.id)
                          const supabase = createClient()
                          await supabase.from('invites').delete().eq('id', inv.id)
                          setInviteList(prev => prev.filter(i => i.id !== inv.id))
                          setDeletingInviteId(null)
                        }}
                        className="p-1 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"
                        title="Delete invite"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members list */}
          {memberList.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" /> Active members ({memberList.length})
              </h3>
              <div className="space-y-2">
                {memberList.map(m => {
                  const completions = completionsByMember[m.id] ?? []
                  const eng = getEngagementScore(completions.length, m.tools?.length ?? 0)
                  return (
                    <div key={m.id} className="flex items-center justify-between py-1.5">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{m.full_name ?? m.email}</div>
                        <div className="text-xs text-gray-400">{m.role ?? 'Role not set'} · {completions.length} tasks</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.onboarded
                          ? <div className="flex items-center gap-1 text-emerald-600 text-xs"><CheckCircle className="w-3.5 h-3.5" /> Onboarded</div>
                          : <div className="flex items-center gap-1 text-amber-500 text-xs"><Clock className="w-3.5 h-3.5" /> Pending</div>}
                        {m.onboarded && <span className={`text-xs font-semibold ${eng.color}`}>{eng.score}%</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
