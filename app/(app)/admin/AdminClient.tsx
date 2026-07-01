'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Users, Send, CheckCircle, Clock, TrendingUp, AlertTriangle, Zap,
  Copy, ChevronDown, ChevronRight, Download, BarChart2, Flame,
  UserCheck, Mail, ArrowUpRight
} from 'lucide-react'

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

interface Props {
  company: { id: string; name: string; tools: string[] } | null
  members: Member[]
  invites: { id: string; email: string; used: boolean; created_at: string }[]
  adminName: string
  taskCompletions: TaskCompletion[]
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

export default function AdminClient({ company, members, invites, adminName, taskCompletions }: Props) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [expandedMember, setExpandedMember] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'people' | 'tools' | 'invite'>('people')
  const [sortPeople, setSortPeople] = useState<'name' | 'tasks' | 'engagement'>('tasks')

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

  const sortedMembers = [...members].sort((a, b) => {
    if (sortPeople === 'tasks') return (completionsByMember[b.id]?.length ?? 0) - (completionsByMember[a.id]?.length ?? 0)
    if (sortPeople === 'engagement') {
      const aEng = getEngagementScore(completionsByMember[a.id]?.length ?? 0, a.tools?.length ?? 0).score
      const bEng = getEngagementScore(completionsByMember[b.id]?.length ?? 0, b.tools?.length ?? 0).score
      return bEng - aEng
    }
    return (a.full_name ?? a.email).localeCompare(b.full_name ?? b.email)
  })

  async function sendInvite() {
    if (!inviteEmail || !company) return
    setInviting(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('invites')
      .insert({ company_id: company.id, email: inviteEmail })
      .select('token')
      .single()
    if (data?.token) setInviteLink(`${window.location.origin}/invite?token=${data.token}`)
    setInviteEmail('')
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
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {([
          { key: 'people', label: '👥 By person' },
          { key: 'tools', label: '🔧 By tool' },
          { key: 'invite', label: '✉️ Invite' },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
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

      {/* ── Invite tab ── */}
      {activeTab === 'invite' && (
        <div className="space-y-5">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-600" /> Invite a team member
            </h3>
            <p className="text-xs text-gray-400 mb-4">They&apos;ll get a link to sign up and build their personal AI Stack Map.</p>
            <div className="flex gap-2">
              <Input type="email" placeholder="colleague@company.com"
                value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendInvite()}
                className="border-gray-200 focus:ring-emerald-400" />
              <Button onClick={sendInvite} disabled={inviting || !inviteEmail}
                className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
                {inviting ? 'Creating…' : 'Generate link'}
              </Button>
            </div>

            {inviteLink && (
              <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <p className="text-xs text-emerald-700 font-semibold mb-2">Link ready — copy and send:</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-emerald-800 bg-white border border-emerald-100 px-2 py-1.5 rounded-lg flex-1 truncate">{inviteLink}</code>
                  <Button size="sm" variant="outline" onClick={() => copyLink(inviteLink)}
                    className="shrink-0 gap-1 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                    {copiedLink ? <><CheckCircle className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Invite history */}
          {invites.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Sent invites</h3>
                <span className="text-xs text-gray-400">{invites.filter(i => i.used).length}/{invites.length} joined</span>
              </div>
              <div className="space-y-2">
                {invites.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <span className="text-sm text-gray-700">{inv.email}</span>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(inv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    {inv.used
                      ? <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs gap-1"><CheckCircle className="w-3 h-3" /> Joined</Badge>
                      : <Badge variant="outline" className="text-xs text-gray-400 gap-1"><Clock className="w-3 h-3" /> Pending</Badge>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members list */}
          {members.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" /> Active members ({members.length})
              </h3>
              <div className="space-y-2">
                {members.map(m => {
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
