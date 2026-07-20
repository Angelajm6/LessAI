'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle, ChevronDown, ChevronRight, Sparkles, Clock,
  ThumbsUp, Zap, Send, Bot, User, Bookmark, BookmarkCheck, BookMarked,
  Copy, Trash2, ArrowRight, LayoutDashboard, BookOpen,
  MessageSquare, FolderPlus, Folder, FolderOpen, Plus, X, Pencil,
  FileText, ChevronUp, Home, TrendingUp, Star, Settings, FlaskConical,
  RefreshCw, TrendingDown, BarChart2, Flame, Trophy, Target, Calendar, Brain,
  ChevronLeft, Play
} from 'lucide-react'
import Link from 'next/link'
import type { StackMap, ToolCard, ToolTrack, DailyTask, Playbook, ToolPlaybook, PromptFramework, Recommendation, PromptImprovement } from '@/lib/claude'

interface CompletedTask { tool: string; day: number; completed_at?: string }
interface ToolTipData { wrong_tool: string; better_tool: string; reason: string }
interface ChatMessage { role: 'user' | 'assistant' | 'tool-tip'; content: string; toolData?: ToolTipData }
interface SavedPrompt { id: string; content: string; label: string; tool: string | null; folder_id: string | null; created_at: string }
interface PromptFolder { id: string; name: string; created_at: string }
interface LabHistoryItem {
  id: string
  original: string
  improved: string
  tool: string | null
  scores_before: { specificity: number; context: number; output_clarity: number }
  scores_after: { specificity: number; context: number; output_clarity: number }
  summary: string | null
  created_at: string
}

interface Props {
  profile: {
    id: string
    full_name: string | null
    role: string | null
    tools: string[] | null
    tool_levels: Record<string, string> | null
    company_name?: string | null
    company_summary?: string | null
    company_website?: string | null
  }
  stackMap: StackMap | null
  playbook: Playbook | null
  completedTasks: CompletedTask[]
  savedPrompts: SavedPrompt[]
  promptFolders: PromptFolder[]
  initialXp?: number
  initialStreak?: number
  teamPrompts?: { id: string; title: string; content: string; tool: string | null; pinned: boolean; created_at: string }[]
  teamLeaderboard?: { id: string; full_name: string | null; xp: number; streak: number }[]
  labHistory?: LabHistoryItem[]
  subscriptionStatus?: string | null
  trialEnd?: string | null
  plan?: string | null
}

const XP_LEVELS = [
  { name: 'Novice', min: 0, color: 'text-gray-500' },
  { name: 'Explorer', min: 100, color: 'text-teal-600' },
  { name: 'Practitioner', min: 250, color: 'text-emerald-600' },
  { name: 'Pro', min: 500, color: 'text-amber-600' },
  { name: 'Expert', min: 1000, color: 'text-amber-500' },
]
function getXpLevel(xp: number) {
  let level = XP_LEVELS[0]
  for (const l of XP_LEVELS) { if (xp >= l.min) level = l }
  return level
}
function getNextXpLevel(xp: number) {
  return XP_LEVELS.find(l => l.min > xp) ?? null
}
function getXpPct(xp: number) {
  const cur = getXpLevel(xp)
  const next = getNextXpLevel(xp)
  if (!next) return 100
  return Math.round(((xp - cur.min) / (next.min - cur.min)) * 100)
}

const LEVEL_COLORS: Record<string, string> = {
  never: 'bg-gray-100 text-gray-500',
  learning: 'bg-amber-50 text-amber-700 border border-amber-200',
  comfortable: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
}

type Section = 'dashboard' | 'studio' | 'tasks' | 'playbook' | 'guides' | 'saved'

const NAV_ITEMS: { key: Section; icon: React.ElementType; label: string }[] = [
  { key: 'dashboard', icon: Home, label: 'Dashboard' },
  { key: 'studio', icon: Sparkles, label: 'Prompt Studio' },
  { key: 'tasks', icon: LayoutDashboard, label: 'Daily Tasks' },
  { key: 'saved', icon: Bookmark, label: 'Saved Prompts' },
  { key: 'guides', icon: BookOpen, label: 'Tool Guides' },
]

function PlaybookGenerator({ profile, firstName, onDone }: { profile: Props['profile']; firstName: string; onDone: () => void }) {
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function generate() {
    setStatus('generating')
    setErrorMsg('')
    try {
      const res = await fetch('/api/ai/generate-playbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: profile.role,
          tools: profile.tools ?? [],
          toolLevels: profile.tool_levels ?? {},
          company: profile.company_name ?? null,
          companySummary: profile.company_summary ?? null,
          firstName,
        }),
      })
      if (res.ok) {
        setStatus('done')
        setTimeout(onDone, 800)
      } else {
        const body = await res.json().catch(() => ({}))
        setErrorMsg(body?.error ?? `Error ${res.status}`)
        setStatus('error')
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Network error')
      setStatus('error')
    }
  }

  return (
    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
      <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
      <p className="text-sm font-medium text-gray-700 mb-1">Your prompt playbook hasn&apos;t been generated yet</p>
      <p className="text-xs text-gray-400 mb-5 max-w-xs mx-auto">
        We&apos;ll build role-specific prompt frameworks for every tool in your stack — takes about 30 seconds.
      </p>
      {status === 'error' && (
        <p className="text-xs text-red-500 mb-3">{errorMsg || 'Something went wrong — try again.'}</p>
      )}
      <Button
        onClick={generate}
        disabled={status === 'generating' || status === 'done'}
        className="bg-emerald-600 hover:bg-emerald-700 gap-2"
      >
        {status === 'generating' ? (
          <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating your playbook…</>
        ) : status === 'done' ? (
          <><CheckCircle className="w-3.5 h-3.5" /> Done! Loading…</>
        ) : (
          <><Sparkles className="w-3.5 h-3.5" /> Generate my playbook</>
        )}
      </Button>
    </div>
  )
}

export default function DashboardClient({ profile, stackMap, playbook, completedTasks: initialCompleted, savedPrompts: initialSaved, promptFolders: initialFolders, initialXp = 0, initialStreak = 0, teamPrompts = [], teamLeaderboard = [], labHistory: initialLabHistory = [], subscriptionStatus = null, trialEnd = null, plan = null }: Props) {
  const searchParams = useSearchParams()
  const [section, setSection] = useState<Section>(() => {
    const s = searchParams.get('section')
    return (s === 'studio' || s === 'tasks' || s === 'playbook' || s === 'guides' || s === 'saved') ? s : 'dashboard'
  })
  const [completed, setCompleted] = useState<CompletedTask[]>(initialCompleted)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [marking, setMarking] = useState<string | null>(null)
  const [saved, setSaved] = useState<SavedPrompt[]>(initialSaved)
  const [folders, setFolders] = useState<PromptFolder[]>(initialFolders)
  const [savingPrompt, setSavingPrompt] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editFolderName, setEditFolderName] = useState('')
  const [manualContent, setManualContent] = useState('')
  const [manualLabel, setManualLabel] = useState('')
  const [manualFolder, setManualFolder] = useState<string | null>(null)
  const [showManualSave, setShowManualSave] = useState(false)
  const [savingManual, setSavingManual] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editContent, setEditContent] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)
  // Playbook state
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [expandedFramework, setExpandedFramework] = useState<string | null>(null)
  const [copiedFramework, setCopiedFramework] = useState<string | null>(null)
  // XP + streak
  const [xpState, setXpState] = useState(initialXp)
  const [streakState, setStreakState] = useState(initialStreak)
  const [levelUpMsg, setLevelUpMsg] = useState<string | null>(null)
  const [showWelcome, setShowWelcome] = useState(false)
  // Command center state
  const [commandInput, setCommandInput] = useState('')
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [recommending, setRecommending] = useState(false)
  const [commandTask, setCommandTask] = useState('')
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)
  // Prompt Lab state
  const [labInput, setLabInput] = useState('')
  const [labResult, setLabResult] = useState<PromptImprovement | null>(null)
  const [labLoading, setLabLoading] = useState(false)
  const [labError, setLabError] = useState('')
  const [labCopied, setLabCopied] = useState(false)
  const [labSaved, setLabSaved] = useState(false)
  const [labView, setLabView] = useState<'improve' | 'history'>('improve')
  const [labHistory, setLabHistory] = useState<LabHistoryItem[]>(initialLabHistory)
  const [labExpandedId, setLabExpandedId] = useState<string | null>(null)
  const [studioMode, setStudioMode] = useState<'command' | 'lab'>('command')

  const [labSearch, setLabSearch] = useState('')
  const [copiedStep, setCopiedStep] = useState<string | null>(null)
  const [confirmClearHistory, setConfirmClearHistory] = useState(false)
  const [refreshingTasks, setRefreshingTasks] = useState(false)

  async function refreshTasks() {
    setRefreshingTasks(true)
    try {
      const res = await fetch('/api/ai/refresh-tasks', { method: 'POST' })
      if (res.ok) {
        window.location.reload()
      } else {
        const { error } = await res.json()
        alert(error ?? 'Failed to generate new tasks. Please try again.')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setRefreshingTasks(false)
    }
  }

  async function deleteHistoryItem(id: string) {
    const supabase = createClient()
    await supabase.from('prompt_lab_history').delete().eq('id', id)
    setLabHistory(prev => prev.filter(h => h.id !== id))
    if (labExpandedId === id) setLabExpandedId(null)
  }

  async function clearAllHistory() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('prompt_lab_history').delete().eq('user_id', user.id)
    setLabHistory([])
    setConfirmClearHistory(false)
  }

  // Day-based task scheduling
  const [selectedWeekday, setSelectedWeekday] = useState<number>(() => {
    const d = new Date().getDay() // 0=Sun…6=Sat
    if (d === 0) return 0 // Sun → show Mon
    if (d === 6) return 4 // Sat → show Fri
    return d - 1 // Mon=1→0 … Fri=5→4
  })
  const [dayToolOverrides, setDayToolOverrides] = useState<Record<number, string>>({})
  const [showSwap, setShowSwap] = useState(false)

  const firstName = profile.full_name?.split(' ')[0] ?? 'there'
  const tools = profile.tools ?? []
  const toolLevels = profile.tool_levels ?? {}
  const playbookTools = playbook?.tool_playbooks ?? []

  const todayWeekday = (() => { const d = new Date().getDay(); return d === 0 ? 0 : d === 6 ? 4 : d - 1 })()
  function getToolForDay(d: number) { return dayToolOverrides[d] ?? tools[d % tools.length] }

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])
  useEffect(() => {
    if (!localStorage.getItem('lessai_welcomed')) setShowWelcome(true)
  }, [])

  function isCompleted(tool: string, day: number) { return completed.some(c => c.tool === tool && c.day === day) }
  function isPromptSaved(content: string) { return saved.some(p => p.content === content) }

  const totalTasks = stackMap?.tool_tracks.reduce((s, t) => s + t.daily_tasks.length, 0) ?? 0
  const totalDone = completed.length
  const pct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0

  const visiblePrompts = activeFolder === null ? saved : saved.filter(p => p.folder_id === activeFolder)

  async function markTaskDone(tool: string, day: number) {
    const key = `${tool}-${day}`
    if (marking === key || isCompleted(tool, day)) return
    setMarking(key)
    setCompleted(prev => [...prev, { tool, day, completed_at: new Date().toISOString() }])
    try {
      const res = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool, day }),
      })
      if (res.ok) {
        const { xp: newXp, streak: newStreak, levelUp, levelName, skipped } = await res.json()
        if (!skipped) {
          const prevLevelName = getXpLevel(xpState).name
          setXpState(newXp)
          setStreakState(newStreak)
          if (levelUp && levelName !== prevLevelName) {
            setLevelUpMsg(levelName)
            setTimeout(() => setLevelUpMsg(null), 3500)
          }
        }
      }
    } catch { /* silent */ }
    setMarking(null)
  }

  async function savePrompt(content: string, label: string, tool: string, folderId?: string | null) {
    if (isPromptSaved(content)) return
    setSavingPrompt(content)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('saved_prompts')
        .insert({ user_id: user.id, content, label, tool, folder_id: folderId ?? null })
        .select('id, content, label, tool, folder_id, created_at')
        .single()
      if (data) setSaved(prev => [data, ...prev])
    }
    setSavingPrompt(null)
  }

  async function saveManualPrompt() {
    if (!manualContent.trim()) return
    setSavingManual(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('saved_prompts')
        .insert({ user_id: user.id, content: manualContent.trim(), label: manualLabel.trim() || 'Saved prompt', tool: null, folder_id: manualFolder })
        .select('id, content, label, tool, folder_id, created_at')
        .single()
      if (data) setSaved(prev => [data, ...prev])
    }
    setManualContent('')
    setManualLabel('')
    setManualFolder(null)
    setShowManualSave(false)
    setSavingManual(false)
  }

  async function deletePrompt(id: string) {
    const supabase = createClient()
    await supabase.from('saved_prompts').delete().eq('id', id)
    setSaved(prev => prev.filter(p => p.id !== id))
  }

  function startEdit(prompt: SavedPrompt) {
    setEditingId(prompt.id)
    setEditLabel(prompt.label)
    setEditContent(prompt.content)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditLabel('')
    setEditContent('')
  }

  async function saveEdit(id: string) {
    if (!editContent.trim()) return
    setSavingEdit(true)
    const supabase = createClient()
    await supabase.from('saved_prompts').update({ label: editLabel.trim() || 'Saved prompt', content: editContent.trim() }).eq('id', id)
    setSaved(prev => prev.map(p => p.id === id ? { ...p, label: editLabel.trim() || 'Saved prompt', content: editContent.trim() } : p))
    setEditingId(null)
    setSavingEdit(false)
  }

  async function movePromptToFolder(promptId: string, folderId: string | null) {
    const supabase = createClient()
    await supabase.from('saved_prompts').update({ folder_id: folderId }).eq('id', promptId)
    setSaved(prev => prev.map(p => p.id === promptId ? { ...p, folder_id: folderId } : p))
  }

  async function createFolder() {
    if (!newFolderName.trim()) return
    setCreatingFolder(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: newFolder, error } = await supabase
        .from('prompt_folders')
        .insert({ user_id: user.id, name: newFolderName.trim() })
        .select('id, name, created_at')
        .single()
      if (error) {
        console.error('createFolder error:', error)
        alert(`Folder error: ${error.message}`)
      } else if (newFolder) {
        setFolders(prev => [...prev, newFolder as PromptFolder])
        setActiveFolder((newFolder as PromptFolder).id)
      }
    }
    setNewFolderName('')
    setShowNewFolder(false)
    setCreatingFolder(false)
  }

  async function renameFolder(id: string) {
    if (!editFolderName.trim()) return
    const supabase = createClient()
    await supabase.from('prompt_folders').update({ name: editFolderName.trim() }).eq('id', id)
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name: editFolderName.trim() } : f))
    setEditingFolderId(null)
  }

  async function deleteFolder(id: string) {
    const supabase = createClient()
    await supabase.from('prompt_folders').delete().eq('id', id)
    setFolders(prev => prev.filter(f => f.id !== id))
    setSaved(prev => prev.map(p => p.folder_id === id ? { ...p, folder_id: null } : p))
    if (activeFolder === id) setActiveFolder(null)
  }

  async function copyPrompt(content: string, id: string) {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function copyFramework(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopiedFramework(key)
    setTimeout(() => setCopiedFramework(null), 2000)
  }

  function launchTask(taskText: string) {
    setCommandInput(taskText)
    setRecommendation(null)
    setSection('studio')
    setStudioMode('command')
    // Auto-run recommendation after state settles
    setTimeout(async () => {
      setRecommending(true)
      setCommandTask(taskText)
      try {
        const res = await fetch('/api/ai/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task: taskText, role: profile.role, tools, toolLevels, company: profile.company_name ?? null, companySummary: profile.company_summary ?? null, firstName }),
        })
        if (res.ok) setRecommendation(await res.json())
      } finally {
        setRecommending(false)
      }
    }, 80)
  }

  async function getRecommendation() {
    const task = commandInput.trim()
    if (!task || recommending) return
    setRecommending(true)
    setRecommendation(null)
    setCommandTask(task)
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, role: profile.role, tools, toolLevels, company: profile.company_name ?? null, companySummary: profile.company_summary ?? null, firstName }),
      })
      if (res.ok) {
        const data = await res.json()
        setRecommendation(data)
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
      }
    } finally {
      setRecommending(false)
    }
  }

  async function copyCommandPrompt(text: string) {
    await navigator.clipboard.writeText(text)
    setCopiedPrompt(true)
    setTimeout(() => setCopiedPrompt(false), 2000)
  }

  async function sendMessage() {
    const text = chatInput.trim()
    if (!text || chatLoading) return
    const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: text }]
    setChatMessages(newMessages)
    setChatInput('')
    setChatLoading(true)

    // Fire wrong-tool detection in background (non-blocking)
    const detectPromise = fetch('/api/ai/detect-tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, role: profile.role, tools, company: profile.company_name ?? null, companySummary: profile.company_summary ?? null, firstName }),
    }).then(r => r.ok ? r.json() : null).catch(() => null)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, role: profile.role, tools, toolLevels, company: profile.company_name ?? null, companySummary: profile.company_summary ?? null, firstName }),
      })
      if (res.ok) {
        const { reply } = await res.json()
        setChatMessages(prev => [...prev, { role: 'assistant', content: reply }])
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Try again.' }])
      }
    } finally {
      setChatLoading(false)
    }

    // Add tool-tip if a mismatch was detected
    const detection = await detectPromise
    if (detection?.wrong_tool && detection?.better_tool) {
      setChatMessages(prev => [...prev, { role: 'tool-tip', content: '', toolData: detection }])
    }
  }

  return (
    <>
    {/* ── Level-up overlay ── */}
    {levelUpMsg && (
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="animate-scale-in bg-gray-950 border border-emerald-500/30 rounded-3xl px-10 py-8 shadow-2xl text-center mx-4">
          <div className="text-4xl mb-3">🏆</div>
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Level up!</p>
          <p className="text-2xl font-black text-white">You&apos;re now a <span className="bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">{levelUpMsg}</span></p>
          <p className="text-sm text-gray-400 mt-2">Keep going — every task builds real skill</p>
        </div>
      </div>
    )}

    {/* ── Welcome overlay ── */}
    {showWelcome && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <div className="animate-scale-in w-full max-w-lg bg-gray-950 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="relative overflow-hidden p-7 pb-0">
            <div className="line-grid-3d absolute inset-0" />
            <div className="absolute top-4 right-6 w-24 h-24 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-8 w-16 h-16 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />
            <div className="relative z-10 pb-7">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Your stack is ready</span>
              </div>
              <h2 className="text-2xl font-black text-white mb-2 leading-tight">
                Welcome,{' '}<span className="bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">{firstName}.</span>
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                LessAI has analyzed your role as a <strong className="text-white">{profile.role}</strong> and built a personalized learning plan just for you.
              </p>
            </div>
          </div>
          <div className="px-7 py-5 bg-white/[0.03] border-t border-white/[0.06] space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: tools.length, label: 'Tools mapped' },
                { value: totalTasks, label: 'Daily tasks' },
                { value: (playbook?.tool_playbooks ?? []).reduce((s, tp) => s + tp.frameworks.length, 0) || '—', label: 'Prompt frameworks' },
              ].map(stat => (
                <div key={stat.label} className="bg-white/[0.05] rounded-2xl p-3 text-center border border-white/[0.07]">
                  <p className="text-xl font-black text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 text-center">Start with the AI Command Center — tell it what you want to accomplish.</p>
            <button
              onClick={() => { setShowWelcome(false); localStorage.setItem('lessai_welcomed', '1') }}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-2xl py-3.5 text-sm transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2">
              Let&apos;s go <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )}

    <div className="flex gap-0 min-h-[calc(100vh-57px)] w-full">

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 flex sm:hidden">
        {NAV_ITEMS.map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setSection(key)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
              section === key ? 'text-emerald-600' : 'text-gray-400'
            }`}>
            <Icon className="w-5 h-5" />
            <span>{label.split(' ')[0]}</span>
          </button>
        ))}
      </nav>

      {/* Sidebar (desktop only) */}
      <aside className="hidden sm:block w-52 shrink-0 border-r border-gray-100 pr-3 mr-5">
        <div className="sticky top-24 flex flex-col" style={{ minHeight: 'calc(100vh - 8rem)' }}>
          {/* Top: profile + nav */}
          <div className="space-y-1">
            {/* Profile + progress */}
            <div className="px-3 py-3 mb-2">
              <p className="font-semibold text-gray-900 text-sm truncate">{profile.full_name ?? 'You'}</p>
              <p className="text-xs text-gray-400 truncate">{profile.role ?? 'Your role'}</p>
              <div className="mt-2.5">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Stack progress</span>
                  <span className="font-semibold text-emerald-600">{totalDone}/{totalTasks}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-1.5 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #10b981, #f59e0b)' }} />
                </div>
              </div>
            </div>

            {/* Streak + XP */}
            <div className="px-3 pb-4 mb-2 border-b border-gray-100">
              {streakState > 0 && (
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-base leading-none">🔥</span>
                  <span className="text-sm font-bold text-gray-900">{streakState}-day streak</span>
                </div>
              )}
              <div className="flex justify-between text-xs mb-1">
                <span className={`font-bold ${getXpLevel(xpState).color}`}>{getXpLevel(xpState).name}</span>
                <span className="text-gray-400">{xpState} XP</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                <div className="h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${getXpPct(xpState)}%`, background: 'linear-gradient(90deg, #10b981, #14b8a6)' }} />
              </div>
              {getNextXpLevel(xpState) && (
                <p className="text-xs text-gray-400">{getNextXpLevel(xpState)!.min - xpState} XP to {getNextXpLevel(xpState)!.name}</p>
              )}
            </div>

            {/* Nav */}
            {NAV_ITEMS.map(({ key, icon: Icon, label }) => (
              <button key={key} onClick={() => setSection(key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  section === key
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                <Icon className={`w-4 h-4 shrink-0 ${section === key ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span>{label}</span>
                {key === 'saved' && saved.length > 0 && (
                  <span className={`ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full ${section === key ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                    {saved.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Bottom: settings + your stack */}
          <div className="mt-auto pt-8">
            {/* Tools */}
            {tools.length > 0 && (
              <div className="px-3 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Your stack</p>
                <div className="space-y-1.5">
                  {tools.map(t => (
                    <div key={t} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 truncate">{t}</span>
                      <span className={`text-xs px-1.5 rounded font-medium ${LEVEL_COLORS[toolLevels[t] ?? 'never']}`}>
                        {toolLevels[t] === 'comfortable' ? '✓' : toolLevels[t] === 'learning' ? '~' : '·'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings link */}
            <div className="px-3 mt-4 pb-6">
              <Link href="/settings" className="flex items-center gap-3 py-2 text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors group">
                <Settings className="w-4 h-4 group-hover:text-gray-600" />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 pb-20 sm:pb-0">

        {/* Trial countdown banner */}
        {(() => {
          if (subscriptionStatus !== 'trialing' || !trialEnd) return null
          const daysLeft = Math.ceil((new Date(trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          if (daysLeft < 0) return null
          const urgent = daysLeft <= 2
          return (
            <div className={`mb-5 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 ${urgent ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${urgent ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                  <span className="text-base">{urgent ? '⏰' : '🎉'}</span>
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-bold ${urgent ? 'text-amber-900' : 'text-emerald-900'}`}>
                    {daysLeft === 0 ? 'Your trial ends today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in your free trial`}
                  </p>
                  <p className={`text-xs mt-0.5 ${urgent ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {urgent ? 'Upgrade now to keep your progress, prompts, and daily tasks.' : `You're on the ${plan === 'teams' ? 'Teams' : 'Pro'} plan trial. No charge until day 8.`}
                  </p>
                </div>
              </div>
              <a href="/pricing"
                className={`shrink-0 text-xs font-bold px-4 py-2 rounded-xl transition-colors ${urgent ? 'bg-amber-500 hover:bg-amber-400 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}>
                Upgrade now
              </a>
            </div>
          )
        })()}

        {/* Stack summary banner — gradient with 3D grid */}
        {stackMap && section === 'tasks' && (
          <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg mb-6"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #d97706 100%)' }}>
            <div className="dot-grid-3d absolute inset-0 opacity-20" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-200" />
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-100">AI Stack Map</span>
              </div>
              <p className="text-white/90 text-sm leading-relaxed mb-3">{stackMap.summary}</p>

            </div>
          </div>
        )}

        {/* ── Dashboard Overview ── */}
        {section === 'dashboard' && (() => {
          const today = new Date().toISOString().split('T')[0]
          const doneToday = completed.some(c => c.completed_at && c.completed_at.startsWith(today))
          const hasStreak = streakState > 0
          const showNudge = !doneToday && totalDone > 0

          const now = new Date()
          const startOfWeek = new Date(now)
          startOfWeek.setDate(now.getDate() - now.getDay())
          startOfWeek.setHours(0, 0, 0, 0)
          const thisWeekDone = completed.filter(c => c.completed_at && new Date(c.completed_at) >= startOfWeek)

          const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
          const weekDayActivity = weekDays.map((label, i) => {
            const day = new Date(startOfWeek)
            day.setDate(startOfWeek.getDate() + i)
            const dayStr = day.toISOString().split('T')[0]
            const count = thisWeekDone.filter(c => c.completed_at?.startsWith(dayStr)).length
            const isToday = dayStr === now.toISOString().split('T')[0]
            const isPast = day < now && !isToday
            return { label, count, isToday, isPast }
          })
          const weekToolsSet = new Set(thisWeekDone.map(c => c.tool))
          const weekTools = Array.from(weekToolsSet)
          const xpThisWeek = thisWeekDone.length * 10

          // Today's task: show the next uncompleted task for today's assigned tool
          const todayToolName = getToolForDay(todayWeekday)
          const todayTrack = stackMap?.tool_tracks.find(t => t.tool === todayToolName) ?? stackMap?.tool_tracks[0]
          const todayNextTask = todayTrack?.daily_tasks.find(t => !completed.some(c => c.tool === todayTrack.tool && c.day === t.day))
          const todayTasks = (todayTrack && todayNextTask) ? [{ track: todayTrack, task: todayNextTask }] : []

          const recentCompleted = [...completed]
            .filter(c => c.completed_at)
            .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
            .slice(0, 3)

          return (
            <div className="space-y-5">

              {/* Greeting */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                    {(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' })()}, {firstName}.
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400 mt-0.5">{profile.role} · {tools.length} tools in your stack</p>
                </div>
              </div>

              {/* Onboarding checklist */}
              {(() => {
                const steps = [
                  { label: 'Complete your profile', done: !!(profile.role && tools.length > 0), action: () => window.location.href = '/settings' },
                  { label: 'Complete your first daily task', done: completed.length > 0, action: () => setSection('tasks') },
                  { label: 'Save a prompt', done: saved.length > 0, action: () => setSection('tasks') },
                  { label: 'Try the Prompt Studio', done: labHistory.length > 0, action: () => setSection('studio') },
                ]
                const doneCount = steps.filter(s => s.done).length
                if (doneCount === steps.length) return null
                return (
                  <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🚀</span>
                        <h3 className="text-sm font-bold text-gray-900">Get started</h3>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-0.5">{doneCount}/{steps.length} done</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3 overflow-hidden">
                      <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                        style={{ width: `${(doneCount / steps.length) * 100}%` }} />
                    </div>
                    <div className="space-y-2">
                      {steps.map((step, i) => (
                        <button key={i} onClick={step.done ? undefined : step.action} disabled={step.done}
                          className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-xl transition-colors ${step.done ? 'opacity-60 cursor-default' : 'hover:bg-gray-50 cursor-pointer'}`}>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${step.done ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                            {step.done && <CheckCircle className="w-3.5 h-3.5 text-white fill-white" />}
                          </div>
                          <span className={`text-sm ${step.done ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`}>{step.label}</span>
                          {!step.done && <ArrowRight className="w-3.5 h-3.5 text-gray-300 ml-auto shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Streak nudge — only after they've started */}
              {showNudge && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                  <span className="text-xl shrink-0">🔥</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-800">
                      {hasStreak ? `Keep your ${streakState}-day streak alive!` : "No task yet today — let's go!"}
                    </p>
                  </div>
                  <button onClick={() => setSection('tasks')}
                    className="shrink-0 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-xl px-3 py-1.5 transition-colors">
                    Do a task →
                  </button>
                </div>
              )}

              {/* Compact stats — only after they've done something */}
              {totalDone > 0 && (
                <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5 flex-1">
                    <Flame className="w-4 h-4 text-orange-500 shrink-0" />
                    <span className="text-sm font-bold text-gray-900">{streakState}d streak</span>
                  </div>
                  <div className="w-px h-4 bg-gray-200" />
                  <div className="flex items-center gap-1.5 flex-1">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-sm font-bold text-gray-900">{totalDone}/{totalTasks} tasks</span>
                  </div>
                  <div className="w-px h-4 bg-gray-200" />
                  <div className="flex items-center gap-1.5 flex-1">
                    <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className={`text-sm font-bold ${getXpLevel(xpState).color}`}>{getXpLevel(xpState).name}</span>
                  </div>
                </div>
              )}

              {/* Today's tasks */}
              {todayTasks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-bold text-gray-900">Continue where you left off</h3>
                    </div>
                    <button onClick={() => setSection('tasks')} className="text-xs text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1">
                      All tasks <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div>
                    {todayTasks.map(item => {
                      if (!item) return null
                      const { track, task } = item
                      const isDone = isCompleted(track.tool, task.day)
                      const key = `${track.tool}-${task.day}`
                      return (
                        <div key={key} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all duration-200">
                          <div className="flex items-start gap-3">
                            <button onClick={() => markTaskDone(track.tool, task.day)} disabled={isDone || marking === key}
                              className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                isDone ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-emerald-400'
                              }`}>
                              {isDone && <CheckCircle className="w-3.5 h-3.5 text-white fill-white" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-xs font-bold text-emerald-600">{track.tool}</span>
                              </div>
                              <p className="text-sm font-semibold text-gray-900 mb-1">{task.title}</p>
                              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{task.task}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Clock className="w-3 h-3" /> {task.time_minutes}m
                            </div>
                            <button onClick={() => launchTask(task.task)}
                              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                              Use Prompt Studio <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}


              {/* Empty state */}
              {!stackMap && completed.length === 0 && (
                <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                  <div className="text-4xl mb-4">🚀</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Let&apos;s build your AI stack</h3>
                  <p className="text-sm text-gray-500 max-w-xs mb-6 leading-relaxed">
                    Complete setup and LessAI will build a personalized learning plan for your role and tools.
                  </p>
                  <button onClick={() => window.location.href = '/onboarding'}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-5 py-2.5 text-sm flex items-center gap-2 transition-colors">
                    <Sparkles className="w-4 h-4" /> Set up my stack
                  </button>
                </div>
              )}

            </div>
          )
        })()}

        {/* Prompt Playbook */}
        {section === 'playbook' && (
          <div>
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl px-5 py-5 mb-5"
              style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #fefce8 60%, #fff7ed 100%)' }}>
              <div className="dot-grid-3d absolute inset-0 opacity-25" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-bold text-gray-900">Prompt Playbook</h2>
                </div>
                <p className="text-sm text-gray-500 max-w-xl">
                  Role-specific prompt frameworks for every tool in your stack. Copy the template, fill in the brackets, and get dramatically better results.
                </p>
              </div>
            </div>

            {!playbook ? (
              <PlaybookGenerator profile={profile} firstName={firstName} onDone={() => window.location.reload()} />
            ) : (
              <div className="flex flex-col sm:flex-row gap-5">
                {/* Tool tabs */}
                <div className="w-full sm:w-44 shrink-0">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Tools</p>
                  <div className="flex sm:flex-col gap-1.5 sm:gap-0.5 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
                    {playbookTools.map((tp: ToolPlaybook) => {
                      const isActive = (activeTool ?? playbookTools[0]?.tool) === tp.tool
                      return (
                        <button key={tp.tool} onClick={() => { setActiveTool(tp.tool); setExpandedFramework(null) }}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                            isActive ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200' : 'text-gray-600 hover:bg-gray-100'
                          }`}>
                          <span className="truncate">{tp.tool}</span>
                          <span className={`ml-auto text-xs shrink-0 ${isActive ? 'text-white/60' : 'text-gray-400'}`}>
                            {tp.frameworks.length}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Frameworks */}
                <div className="flex-1 min-w-0">
                  {(() => {
                    const activeToolData = playbookTools.find((tp: ToolPlaybook) => tp.tool === (activeTool ?? playbookTools[0]?.tool)) ?? playbookTools[0]
                    if (!activeToolData) return null
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base font-bold text-gray-900">{activeToolData.tool}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[toolLevels[activeToolData.tool] ?? 'never']}`}>
                            {toolLevels[activeToolData.tool] ?? 'never'}
                          </span>
                        </div>

                        {activeToolData.frameworks.map((fw: PromptFramework, idx: number) => {
                          const fwKey = `${activeToolData.tool}-${idx}`
                          const isOpen = expandedFramework === fwKey
                          return (
                            <div key={fwKey}
                              className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:border-emerald-200 hover:shadow-md transition-all duration-200">
                              {/* Framework header */}
                              <button onClick={() => setExpandedFramework(isOpen ? null : fwKey)}
                                className="w-full text-left px-5 py-4 flex items-start gap-3 group">
                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                                  {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 text-sm">{fw.title}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">{fw.use_case}</p>
                                </div>
                                <div className="shrink-0 text-gray-300 group-hover:text-emerald-500 transition-colors">
                                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                              </button>

                              {isOpen && (
                                <div className="border-t border-gray-50 space-y-4 p-5">
                                  {/* The framework template */}
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Prompt Framework</p>
                                      <button
                                        onClick={() => copyFramework(fw.framework, `${fwKey}-fw`)}
                                        className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                                        {copiedFramework === `${fwKey}-fw` ? <><CheckCircle className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                                      </button>
                                    </div>
                                    <div className="relative bg-gray-50 rounded-xl p-4 border border-gray-200 font-mono text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                                      {fw.framework}
                                    </div>
                                  </div>

                                  {/* Before / After */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                                        <span className="text-base">✗</span> Without this framework
                                      </p>
                                      <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-800 leading-relaxed italic">
                                        {fw.before}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide flex items-center gap-1">
                                          <span className="text-base">✓</span> With this framework
                                        </p>
                                        <button
                                          onClick={() => copyFramework(fw.after, `${fwKey}-after`)}
                                          className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                                          {copiedFramework === `${fwKey}-after` ? <><CheckCircle className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                                        </button>
                                      </div>
                                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-900 leading-relaxed">
                                        {fw.after}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Why better */}
                                  <div className="relative overflow-hidden bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                                    <div className="dot-grid-3d absolute inset-0 opacity-20" />
                                    <p className="relative z-10 text-xs font-semibold text-amber-700 mb-0.5 flex items-center gap-1">
                                      <Sparkles className="w-3 h-3" /> Why it works
                                    </p>
                                    <p className="relative z-10 text-xs text-amber-800 leading-relaxed">{fw.why_better}</p>
                                  </div>

                                  {/* Save to library */}
                                  <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                                    <span className="text-xs text-gray-400">Save this framework to your prompt library</span>
                                    <button
                                      onClick={() => savePrompt(fw.framework, `${activeToolData.tool} — ${fw.title}`, activeToolData.tool)}
                                      disabled={isPromptSaved(fw.framework)}
                                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                                        isPromptSaved(fw.framework)
                                          ? 'text-emerald-500 bg-emerald-50'
                                          : 'text-gray-500 hover:text-amber-600 hover:bg-amber-50 border border-gray-200'
                                      }`}>
                                      {isPromptSaved(fw.framework) ? <><BookmarkCheck className="w-3.5 h-3.5" /> Saved</> : <><Bookmark className="w-3.5 h-3.5" /> Save to library</>}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Daily Tasks */}
        {section === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Daily Tasks</h2>
              {playbookTools.length > 0 && (
                <button onClick={() => setSection('playbook')}
                  className="text-xs text-gray-400 hover:text-emerald-600 transition-colors flex items-center gap-1">
                  <FileText className="w-3 h-3" /> View all frameworks
                </button>
              )}
            </div>

            {!stackMap ? (
              <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-5">
                  <Sparkles className="w-7 h-7 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Your AI task stack is waiting</h3>
                <p className="text-sm text-gray-500 max-w-xs mb-6 leading-relaxed">
                  Complete setup to get a personalized daily task plan across all your AI tools — built around your exact role and company.
                </p>
                <div className="grid grid-cols-3 gap-3 w-full max-w-xs mb-7">
                  {[
                    { icon: '🎯', label: 'Role-specific tasks' },
                    { icon: '🤖', label: 'Tailored to your tools' },
                    { icon: '🔥', label: 'Streak & XP tracking' },
                  ].map(({ icon, label }) => (
                    <div key={label} className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                      <div className="text-xl mb-1">{icon}</div>
                      <p className="text-xs text-gray-500 font-medium leading-tight">{label}</p>
                    </div>
                  ))}
                </div>
                <Button onClick={() => window.location.href = '/onboarding'} className="bg-emerald-600 hover:bg-emerald-700 gap-2 shadow-md shadow-emerald-100">
                  <Sparkles className="w-4 h-4" /> Set up my stack
                </Button>
                <p className="text-xs text-gray-400 mt-3">Takes about 2 minutes</p>
              </div>
            ) : (() => {
              const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
              const currentToolName = getToolForDay(selectedWeekday)
              const currentTrack = stackMap.tool_tracks.find((t: ToolTrack) => t.tool === currentToolName)
                ?? stackMap.tool_tracks[selectedWeekday % stackMap.tool_tracks.length]
              const isSwapped = selectedWeekday in dayToolOverrides
              const nextTask = isSwapped
                ? (currentTrack?.daily_tasks.find((t: DailyTask) => !isCompleted(currentTrack.tool, t.day)) ?? currentTrack?.daily_tasks[0])
                : currentTrack?.daily_tasks.find((t: DailyTask) => !isCompleted(currentTrack.tool, t.day))
              return (
                <>
                  {/* Mon–Fri strip */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {DAYS.map((day, d) => {
                      const toolForDay = getToolForDay(d)
                      const track = stackMap.tool_tracks.find((t: ToolTrack) => t.tool === toolForDay)
                      const allDone = track ? track.daily_tasks.every((t: DailyTask) => isCompleted(toolForDay, t.day)) : false
                      const isSelected = d === selectedWeekday
                      const isToday = d === todayWeekday
                      return (
                        <button key={day} onClick={() => { setSelectedWeekday(d); setShowSwap(false) }}
                          className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : allDone
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                          }`}>
                          {day}
                          {allDone && !isSelected
                            ? <CheckCircle className="w-2.5 h-2.5 text-emerald-500" />
                            : <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/60' : isToday ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
                        </button>
                      )
                    })}
                  </div>

                  {/* Day card */}
                  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    {/* Tool header */}
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900">{currentTrack?.tool}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[toolLevels[currentTrack?.tool ?? ''] ?? 'never']}`}>
                            {(toolLevels[currentTrack?.tool ?? ''] ?? 'never') === 'never' ? 'New to you' : toolLevels[currentTrack?.tool ?? '']}
                          </span>
                          {selectedWeekday === todayWeekday && (
                            <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-semibold">Today</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{currentTrack?.why_this_role}</p>
                      </div>
                      <button onClick={() => setShowSwap(s => !s)}
                        className={`flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-lg transition-all ml-3 shrink-0 ${
                          showSwap ? 'bg-gray-100 text-gray-600 border-gray-200' : 'text-gray-400 hover:text-emerald-600 border-gray-200 hover:border-emerald-200'
                        }`}>
                        <RefreshCw className="w-3 h-3" /> Swap
                      </button>
                    </div>

                    {/* Swap panel */}
                    {showSwap && (
                      <div className="border-b border-gray-100 px-5 py-3 bg-gray-50">
                        <p className="text-xs font-semibold text-gray-500 mb-2">Pick a different tool for {DAYS[selectedWeekday]}</p>
                        <div className="flex flex-wrap gap-2">
                          {tools.filter(t => t !== currentToolName).map(t => (
                            <button key={t}
                              onClick={() => { setDayToolOverrides(prev => ({ ...prev, [selectedWeekday]: t })); setShowSwap(false) }}
                              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-emerald-300 hover:text-emerald-600 transition-all">
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Task or done state */}
                    {nextTask ? (() => {
                      const isDone = isCompleted(currentTrack.tool, nextTask.day)
                      const taskKey = `${currentTrack.tool}-${nextTask.day}`
                      const alreadySaved = isPromptSaved(nextTask.task)
                      const toolPlaybook = playbookTools.find((tp: ToolPlaybook) => tp.tool === currentTrack.tool)
                      const framework = toolPlaybook?.frameworks[(nextTask.day - 1) % (toolPlaybook.frameworks.length || 1)]
                      return (
                        <div className="px-5 py-5">
                          <div className="flex items-start gap-3">
                            <button onClick={() => markTaskDone(currentTrack.tool, nextTask.day)} disabled={isDone || marking === taskKey}
                              className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                isDone ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200' : 'border-gray-300 hover:border-emerald-400'
                              }`}>
                              {isDone && <CheckCircle className="w-3.5 h-3.5 text-white fill-white" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className={`text-sm font-semibold ${isDone ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{nextTask.title}</span>
                                <span className="flex items-center gap-0.5 text-xs text-gray-400"><Clock className="w-3 h-3" /> {nextTask.time_minutes}m</span>
                              </div>
                              <p className={`text-sm leading-relaxed mb-4 ${isDone ? 'text-gray-400' : 'text-gray-600'}`}>{nextTask.task}</p>

                              {framework && !isDone && (
                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4">
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Prompt framework to use</p>
                                  <p className="text-xs font-medium text-gray-800 mb-1.5">{framework.title}</p>
                                  <p className="text-xs text-gray-500 font-mono leading-relaxed line-clamp-3">{framework.framework}</p>
                                  {framework.why_better && (
                                    <p className="text-xs text-emerald-600 mt-2 font-medium">💡 {framework.why_better}</p>
                                  )}
                                </div>
                              )}

                              {!isDone && (
                                <div className="flex items-center gap-2">
                                  <button onClick={() => launchTask(nextTask.task)}
                                    className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                                    <Zap className="w-3 h-3" /> Do this task →
                                  </button>
                                  <button onClick={() => savePrompt(nextTask.task, `${currentTrack.tool} — ${nextTask.title}`, currentTrack.tool)}
                                    disabled={alreadySaved || savingPrompt === nextTask.task}
                                    className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                                      alreadySaved ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-gray-400 border-gray-200 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50'
                                    }`}>
                                    {alreadySaved ? <><BookmarkCheck className="w-3 h-3" /> Saved</> : <><Bookmark className="w-3 h-3" /> Save</>}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Progress dots */}
                          <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                            <span>Task {nextTask.day} of {currentTrack.daily_tasks.length}</span>
                            <div className="flex gap-1.5">
                              {currentTrack.daily_tasks.map((t: DailyTask) => (
                                <div key={t.day} className={`w-2 h-2 rounded-full transition-colors ${
                                  isCompleted(currentTrack.tool, t.day) ? 'bg-emerald-400' : t.day === nextTask.day ? 'bg-gray-400' : 'bg-gray-200'
                                }`} />
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })() : (
                      <div className="px-5 py-8 text-center">
                        <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <CheckCircle className="w-6 h-6 text-emerald-500" />
                        </div>
                        <p className="text-sm font-bold text-gray-900 mb-1">All done for {currentTrack?.tool}! 🎉</p>
                        <p className="text-xs text-gray-400 max-w-xs mx-auto">Pick another day to keep going, or update your stack for fresh tasks.</p>
                      </div>
                    )}
                  </div>

                  {(() => {
                    const allTasksDone = stackMap.tool_tracks.every((track: ToolTrack) =>
                      track.daily_tasks.every((t: DailyTask) => isCompleted(track.tool, t.day))
                    )
                    return allTasksDone ? (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center">
                        <p className="text-sm font-bold text-gray-900 mb-1">You&apos;ve completed all your tasks! 🏆</p>
                        <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto">Ready for a fresh set? Generate a new batch of tasks for your entire stack.</p>
                        <Button
                          onClick={refreshTasks}
                          disabled={refreshingTasks}
                          className="bg-emerald-600 hover:bg-emerald-700 gap-2 text-white"
                          size="sm"
                        >
                          {refreshingTasks ? (
                            <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating new tasks…</>
                          ) : (
                            <><RefreshCw className="w-3.5 h-3.5" /> Generate new tasks</>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center pt-2">
                        <p className="text-xs text-gray-400 mb-2">Added new tools to your stack?</p>
                        <Button variant="outline" size="sm" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1.5"
                          onClick={() => window.location.href = '/onboarding?from=stack'}>
                          <ArrowRight className="w-3.5 h-3.5" /> Update my stack
                        </Button>
                      </div>
                    )
                  })()}
                </>
              )
            })()}
          </div>
        )}

        {/* Tool Guides — dark section with 3D grid */}
        {section === 'guides' && (
          <><div className="space-y-4">
            {/* Section header with 3D grid accent */}
            <div className="relative overflow-hidden rounded-2xl px-5 py-4 mb-2"
              style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #fefce8 100%)' }}>
              <div className="dot-grid-3d absolute inset-0 opacity-30" />
              <div className="relative z-10 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-gray-900">Tool Guides</h2>
                <span className="text-xs text-gray-400 ml-1">— how to get the best out of each tool for your role</span>
              </div>
            </div>

            {!stackMap ? (
              <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-5">
                  <BookOpen className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Your AI guides are on their way</h3>
                <p className="text-sm text-gray-500 max-w-xs mb-6 leading-relaxed">
                  Once you complete setup, we'll generate bite-sized AI guides for each tool you use — with prompt frameworks specific to your role.
                </p>
                <Button onClick={() => window.location.href = '/onboarding'} className="bg-emerald-600 hover:bg-emerald-700 gap-2 shadow-md shadow-emerald-100">
                  <Sparkles className="w-4 h-4" /> Complete setup
                </Button>
                <p className="text-xs text-gray-400 mt-3">Takes about 2 minutes</p>
              </div>
            ) : null}
            {stackMap && stackMap.tool_cards.map((card: ToolCard) => (
                <div key={card.tool}
                  className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{card.tool}</h3>
                      <p className="text-xs text-emerald-600 font-medium mt-0.5">{card.tagline}</p>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 border-0 text-xs shrink-0">{toolLevels[card.tool] ?? 'never'}</Badge>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-3">
                    <p className="text-xs font-semibold text-amber-700 mb-0.5">vs. your other tools</p>
                    <p className="text-xs text-amber-800 leading-relaxed">{card.vs_others}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Best for</p>
                      <ul className="space-y-1">{card.best_for.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                          <ThumbsUp className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" /> {item}
                        </li>
                      ))}</ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Not great for</p>
                      <ul className="space-y-1">{card.not_great_for.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-500">
                          <span className="mt-0.5 shrink-0">✗</span> {item}
                        </li>
                      ))}</ul>
                    </div>
                  </div>
                  <div className="relative overflow-hidden bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                    <div className="dot-grid-3d absolute inset-0 opacity-20" />
                    <p className="relative z-10 text-xs font-semibold text-emerald-700 mb-0.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Killer use case for {profile.role}
                    </p>
                    <p className="relative z-10 text-xs text-emerald-800 leading-relaxed">{card.killer_use_case}</p>
                  </div>
                </div>
              ))}
          </div>
          <div className="text-center pt-6 mt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">Missing a tool from this list?</p>
            <Button variant="outline" size="sm" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1.5"
              onClick={() => window.location.href = '/onboarding?from=stack'}>
              <ArrowRight className="w-3.5 h-3.5" /> Update my stack
            </Button>
          </div></>
        )}

        {/* Saved Prompts */}
        {section === 'saved' && (
          <div className="space-y-5">
          {<>
          {/* Team Library */}
          {teamPrompts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookMarked className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-gray-900">Team Library</h3>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                  {teamPrompts.filter(p => p.pinned).length > 0 ? `${teamPrompts.filter(p => p.pinned).length} pinned` : `${teamPrompts.length} prompts`}
                </span>
              </div>
              <div className="space-y-2">
                {teamPrompts.map(tp => (
                  <div key={tp.id} className={`bg-white border rounded-2xl p-4 shadow-sm ${tp.pinned ? 'border-emerald-200' : 'border-gray-100'}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {tp.pinned && <span className="text-xs font-bold text-emerald-600">📌</span>}
                          <p className="text-sm font-semibold text-gray-900">{tp.title}</p>
                          {tp.tool && <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full">{tp.tool}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => savePrompt(tp.content, tp.title, tp.tool ?? '')}
                          disabled={isPromptSaved(tp.content)}
                          className={`p-1.5 rounded-lg transition-colors ${isPromptSaved(tp.content) ? 'text-emerald-500 bg-emerald-50' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                          title="Save to my prompts">
                          {isPromptSaved(tp.content) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                        </button>
                        <button onClick={() => copyPrompt(tp.content, tp.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                          {copiedId === tp.id ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 border border-gray-100 leading-relaxed line-clamp-3">{tp.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Folders sidebar */}
            <div className="w-full sm:w-44 shrink-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Folders</p>
              <div className="flex sm:flex-col gap-1.5 sm:gap-0.5 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
                <button onClick={() => setActiveFolder(null)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                    activeFolder === null ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}>
                  <Bookmark className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1 text-left truncate">All prompts</span>
                  <span className={`text-xs font-bold ${activeFolder === null ? 'text-white/70' : 'text-gray-400'}`}>{saved.length}</span>
                </button>

                {folders.map(f => (
                  <div key={f.id}>
                    {editingFolderId === f.id ? (
                      <div className="flex gap-1 px-1">
                        <Input value={editFolderName} onChange={(e) => setEditFolderName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') renameFolder(f.id); if (e.key === 'Escape') setEditingFolderId(null) }}
                          autoFocus className="h-8 text-xs border-emerald-300 focus:ring-emerald-400" />
                        <Button size="sm" onClick={() => renameFolder(f.id)} disabled={!editFolderName.trim()}
                          className="h-8 px-2 bg-emerald-600 hover:bg-emerald-700 shrink-0">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingFolderId(null)} className="h-8 px-2 shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div role="button" tabIndex={0} onClick={() => setActiveFolder(f.id)} onKeyDown={(e) => e.key === 'Enter' && setActiveFolder(f.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all group cursor-pointer ${
                          activeFolder === f.id ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                        }`}>
                        {activeFolder === f.id ? <FolderOpen className="w-3.5 h-3.5 shrink-0" /> : <Folder className="w-3.5 h-3.5 shrink-0" />}
                        <span className="flex-1 text-left truncate">{f.name}</span>
                        <span className={`text-xs font-bold ${activeFolder === f.id ? 'text-white/70' : 'text-gray-400'}`}>
                          {saved.filter(p => p.folder_id === f.id).length}
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); setEditingFolderId(f.id); setEditFolderName(f.name) }}
                          className={`opacity-0 group-hover:opacity-100 transition-opacity ${activeFolder === f.id ? 'text-white/60 hover:text-white' : 'text-gray-400 hover:text-blue-500'}`}>
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteFolder(f.id) }}
                          className={`opacity-0 group-hover:opacity-100 transition-opacity ${activeFolder === f.id ? 'text-white/60 hover:text-white' : 'text-gray-400 hover:text-red-500'}`}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {showNewFolder ? (
                  <div className="flex gap-1 mt-1">
                    <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && createFolder()}
                      placeholder="Folder name" autoFocus
                      className="h-8 text-xs border-emerald-300 focus:ring-emerald-400" />
                    <Button size="sm" onClick={createFolder} disabled={creatingFolder || !newFolderName.trim()}
                      className="h-8 px-2 bg-emerald-600 hover:bg-emerald-700 shrink-0">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setShowNewFolder(false); setNewFolderName('') }}
                      className="h-8 px-2 shrink-0"><X className="w-3.5 h-3.5" /></Button>
                  </div>
                ) : (
                  <button onClick={() => setShowNewFolder(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all mt-1">
                    <FolderPlus className="w-3.5 h-3.5" /> New folder
                  </button>
                )}
              </div>
            </div>

            {/* Prompts list */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {activeFolder === null ? 'All Prompts' : folders.find(f => f.id === activeFolder)?.name ?? 'Folder'}
                </h2>
                <Button size="sm" onClick={() => setShowManualSave(v => !v)}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 text-xs">
                  <Plus className="w-3.5 h-3.5" /> Add prompt
                </Button>
              </div>

              {showManualSave && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 space-y-3">
                  <p className="text-sm font-semibold text-emerald-800">Paste a prompt to save</p>
                  <Input placeholder="Label (e.g. 'Write a cold email')" value={manualLabel}
                    onChange={(e) => setManualLabel(e.target.value)}
                    className="border-emerald-200 focus:ring-emerald-400 text-sm" />
                  <Textarea placeholder="Paste your prompt here…" value={manualContent}
                    onChange={(e) => setManualContent(e.target.value)} rows={3}
                    className="border-emerald-200 focus:ring-emerald-400 text-sm resize-none" />
                  {folders.length > 0 && (
                    <select value={manualFolder ?? ''} onChange={(e) => setManualFolder(e.target.value || null)}
                      className="w-full text-sm border border-emerald-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400 text-gray-600">
                      <option value="">No folder</option>
                      {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={saveManualPrompt} disabled={savingManual || !manualContent.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-sm gap-1.5">
                      <Bookmark className="w-3.5 h-3.5" /> {savingManual ? 'Saving…' : 'Save prompt'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setShowManualSave(false); setManualContent(''); setManualLabel('') }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {visiblePrompts.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Bookmark className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    {activeFolder !== null ? 'No prompts in this folder yet' : 'No saved prompts yet'}
                  </p>
                  <p className="text-xs text-gray-400 mb-4 max-w-xs mx-auto">
                    {activeFolder !== null
                      ? 'Move prompts here from All Prompts, or add one manually.'
                      : 'Bookmark tasks from Daily Tasks, or paste a prompt using the Add button.'}
                  </p>
                  <Button size="sm" variant="outline" onClick={() => setSection('tasks')}
                    className="gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                    <ArrowRight className="w-3.5 h-3.5" /> Go to Daily Tasks
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {visiblePrompts.map(prompt => (
                    <div key={prompt.id}
                      className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm group hover:border-emerald-200 hover:shadow-md transition-all duration-200">
                      {editingId === prompt.id ? (
                        <div className="space-y-3">
                          <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
                            placeholder="Label" className="text-sm border-emerald-200 focus:ring-emerald-400" />
                          <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                            rows={4} className="text-sm border-emerald-200 focus:ring-emerald-400 resize-none" />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveEdit(prompt.id)} disabled={savingEdit || !editContent.trim()}
                              className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 text-xs">
                              <CheckCircle className="w-3.5 h-3.5" /> {savingEdit ? 'Saving…' : 'Save'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit} className="text-xs">Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{prompt.label}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {prompt.tool && <span className="text-xs text-emerald-600 font-medium">{prompt.tool}</span>}
                                {prompt.folder_id && (
                                  <span className="text-xs text-gray-400 flex items-center gap-0.5">
                                    <Folder className="w-3 h-3" /> {folders.find(f => f.id === prompt.folder_id)?.name}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              {folders.length > 0 && (
                                <select value={prompt.folder_id ?? ''} onChange={(e) => movePromptToFolder(prompt.id, e.target.value || null)}
                                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                  title="Move to folder">
                                  <option value="">No folder</option>
                                  {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                              )}
                              <button onClick={() => startEdit(prompt)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="Edit">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => copyPrompt(prompt.content, prompt.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                                {copiedId === prompt.id ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                              </button>
                              <button onClick={() => deletePrompt(prompt.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-3 border border-gray-100">{prompt.content}</p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-gray-400">
                              {new Date(prompt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <button onClick={() => copyPrompt(prompt.content, prompt.id)}
                              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                              {copiedId === prompt.id ? 'Copied!' : <><Copy className="w-3 h-3" /> Copy</>}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
          </>}
          </div>
        )}

        {/* ── Prompt Studio ── */}
        {section === 'studio' && (
          <div className="space-y-4">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl px-5 py-6"
              style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #1e3a5f 100%)' }}>
              <div className="dot-grid-3d absolute inset-0 opacity-20" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-10 w-24 h-24 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 bg-emerald-400/20 border border-emerald-400/30 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  </div>
                  <h2 className="text-base font-black text-white">Prompt Studio</h2>
                </div>
                <p className="text-xs text-emerald-200/80 max-w-sm">Find the right AI tool for any task, or paste a prompt and get it scored, rewritten, and explained.</p>
              </div>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              <button onClick={() => setStudioMode('command')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex flex-col items-start gap-0.5 ${studioMode === 'command' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> AI Command Center</span>
                <span className={`text-xs font-normal ${studioMode === 'command' ? 'text-gray-400' : 'text-gray-400/60'}`}>Start a prompt from scratch</span>
              </button>
              <button onClick={() => setStudioMode('lab')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex flex-col items-start gap-0.5 ${studioMode === 'lab' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <span className="flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5" /> Prompt Lab
                  {labHistory.length > 0 && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">{labHistory.length}</span>}
                </span>
                <span className={`text-xs font-normal ${studioMode === 'lab' ? 'text-gray-400' : 'text-gray-400/60'}`}>Fix a prompt you already have</span>
              </button>
            </div>

            {/* ── AI Command Center mode ── */}
            {studioMode === 'command' && (() => {
              const SUGGESTIONS = [
                'Write a cold outreach email',
                'Research a competitor',
                'Prepare for a meeting',
                'Summarize a long document',
                'Draft a proposal',
                'Analyze data and find patterns',
                'Build a presentation outline',
                'Respond to a customer complaint',
              ]
              return (
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-3xl bg-gray-950 shadow-2xl">
                    <div className="line-grid-3d absolute inset-0" />
                    <div className="absolute top-6 left-8 w-32 h-32 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none animate-float" />
                    <div className="absolute bottom-4 right-12 w-24 h-24 rounded-full bg-amber-500/15 blur-3xl pointer-events-none animate-float-slow" />
                    <div className="relative z-10 px-5 sm:px-8 pt-7 sm:pt-9 pb-6 sm:pb-7">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">AI Command Center</span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-white mb-5 sm:mb-6 leading-tight">
                        What do you want to{' '}
                        <span className="bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">accomplish</span>{' '}
                        <span className="text-white">today?</span>
                      </h3>
                      <div className="relative">
                        <textarea
                          value={commandInput}
                          onChange={e => setCommandInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); getRecommendation() }}}
                          placeholder={`e.g. "Research a competitor before a sales call and prep talking points"`}
                          rows={3}
                          className="w-full bg-white/[0.06] border border-white/10 text-white placeholder:text-gray-600 rounded-2xl px-5 py-4 text-base leading-relaxed resize-none focus:outline-none focus:border-emerald-500/40 transition-all duration-200 pr-16"
                          style={{ boxShadow: commandInput ? '0 0 0 3px rgba(16,185,129,0.08), 0 0 20px rgba(16,185,129,0.1)' : 'none' }}
                        />
                        <button onClick={getRecommendation} disabled={!commandInput.trim() || recommending}
                          className="absolute right-3 bottom-3 w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/40 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200">
                          {recommending
                            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <ArrowRight className="w-4 h-4 text-white" />}
                        </button>
                      </div>
                      <div className="flex gap-2 flex-wrap mt-3 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 no-scrollbar">
                        {SUGGESTIONS.map(s => (
                          <button key={s} onClick={() => setCommandInput(s)}
                            className="text-xs px-3 py-1.5 rounded-full bg-white/[0.07] text-gray-400 border border-white/[0.08] hover:bg-white/[0.13] hover:text-gray-200 hover:border-white/20 transition-all duration-150 whitespace-nowrap shrink-0">
                            {s}
                          </button>
                        ))}
                      </div>
                      {recommending && (
                        <div className="mt-5 flex items-center gap-3 text-gray-400 animate-fade-in">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-sm">Analyzing your stack and finding the best play…</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {recommendation && !recommending && (
                    <div ref={resultRef} className="animate-slide-up">
                      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                        <div className="px-4 sm:px-6 pt-5 pb-4 border-b border-gray-100">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Here&apos;s your play</p>
                              <p className="text-sm sm:text-base font-semibold text-gray-900 italic">&ldquo;{commandTask}&rdquo;</p>
                            </div>
                            <button onClick={() => { setRecommendation(null); setCommandInput('') }}
                              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 shrink-0 mt-1 transition-colors">
                              <X className="w-3.5 h-3.5" /> Clear
                            </button>
                          </div>
                        </div>
                        <div className="divide-y divide-gray-50">
                          <div className="px-4 sm:px-6 py-4 sm:py-5">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Best tool</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-2 self-start shrink-0">
                                <p className="text-sm font-bold text-emerald-700">{recommendation.best_tool}</p>
                              </div>
                              <p className="text-sm text-gray-600 leading-relaxed sm:pt-1.5">{recommendation.best_tool_why}</p>
                            </div>
                          </div>
                          {recommendation.second_tool && (
                            <div className="px-4 sm:px-6 py-4">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-teal-400" />
                                <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">Also consider</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                                <div className="bg-teal-50 border border-teal-100 rounded-2xl px-4 py-2 self-start shrink-0">
                                  <p className="text-sm font-bold text-teal-700">{recommendation.second_tool}</p>
                                </div>
                                <p className="text-sm text-gray-500 leading-relaxed sm:pt-1.5">{recommendation.second_tool_why}</p>
                              </div>
                            </div>
                          )}
                          {recommendation.avoid_tool && (
                            <div className="px-4 sm:px-6 py-4">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-red-300" />
                                <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Skip this time</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                                <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-2 self-start shrink-0 opacity-70">
                                  <p className="text-sm font-bold text-red-500 line-through decoration-red-300">{recommendation.avoid_tool}</p>
                                </div>
                                <p className="text-sm text-gray-400 leading-relaxed sm:pt-1.5">{recommendation.avoid_why}</p>
                              </div>
                            </div>
                          )}
                          <div className="px-4 sm:px-6 py-4 sm:py-5">
                            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Ready-to-paste prompt</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => savePrompt(recommendation.best_tool_prompt, commandTask, recommendation.best_tool)}
                                  disabled={isPromptSaved(recommendation.best_tool_prompt)}
                                  className={`text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-all ${isPromptSaved(recommendation.best_tool_prompt) ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'}`}>
                                  {isPromptSaved(recommendation.best_tool_prompt) ? <><BookmarkCheck className="w-3 h-3" /> Saved</> : <><Bookmark className="w-3 h-3" /> Save</>}
                                </button>
                                <button onClick={() => copyCommandPrompt(recommendation.best_tool_prompt)}
                                  className={`text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-all ${copiedPrompt ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'}`}>
                                  <Copy className="w-3 h-3" /> {copiedPrompt ? 'Copied!' : 'Copy'}
                                </button>
                              </div>
                            </div>
                            <div className="bg-gray-950 rounded-2xl p-4 border border-gray-800">
                              <p className="text-sm text-gray-300 leading-relaxed font-mono whitespace-pre-wrap">{recommendation.best_tool_prompt}</p>
                            </div>
                          </div>
                          {recommendation.sequence && recommendation.sequence.length > 1 && (
                            <div className="px-4 sm:px-6 py-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Zap className="w-4 h-4 text-amber-500" />
                                <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Recommended sequence</span>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {recommendation.sequence.map((step, i) => (
                                  <div key={i} className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                                      <span className="text-xs font-bold text-gray-400">{i + 1}</span>
                                      <div>
                                        <p className="text-xs font-bold text-gray-900">{step.tool}</p>
                                        <p className="text-xs text-gray-500">{step.action}</p>
                                      </div>
                                    </div>
                                    {i < recommendation.sequence!.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-emerald-50/50 to-amber-50/50">
                            <div className="flex items-start gap-4 flex-wrap">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-emerald-600" />
                                <span className="text-sm font-semibold text-emerald-700">Saves {recommendation.time_saved}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 leading-relaxed"><strong className="text-gray-700">💡 </strong>{recommendation.insight}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* ── Prompt Lab mode ── */}
            {studioMode === 'lab' && <>

            {/* View toggle */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
              <button onClick={() => setLabView('improve')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${labView === 'improve' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                Improve prompt
              </button>
              <button onClick={() => setLabView('history')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${labView === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                History
                {labHistory.length > 0 && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">{labHistory.length}</span>}
              </button>
            </div>

            {/* ── Improve view ───────────────────────────────────────── */}
            {labView === 'improve' && <>

            {/* Input card */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <label className="text-xs font-bold text-gray-700 block mb-2 flex items-center gap-1.5">
                <span className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center text-gray-500 text-xs">1</span>
                Paste your prompt
              </label>
              <Textarea
                value={labInput}
                onChange={e => { setLabInput(e.target.value); setLabResult(null); setLabError('') }}
                placeholder={'e.g. "Write me an email about the meeting"'}
                className="min-h-[90px] text-sm border-gray-200 focus:ring-emerald-400 resize-none mb-4 bg-gray-50"
              />
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  disabled={!labInput.trim() || labLoading}
                  onClick={async () => {
                    setLabLoading(true)
                    setLabError('')
                    setLabResult(null)
                    setLabSaved(false)
                    setLabCopied(false)
                    try {
                      const res = await fetch('/api/prompt/improve', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ original: labInput }),
                      })
                      const body = await res.json().catch(() => ({}))
                      if (!res.ok) {
                        setLabError(body.error ?? `Error ${res.status}`)
                        setLabLoading(false)
                        return
                      }
                      setLabResult(body)
                      // Auto-save to history
                      const supabase = createClient()
                      const { data: { user: labUser } } = await supabase.auth.getUser()
                      if (labUser) {
                        const { data: histRow } = await supabase
                          .from('prompt_lab_history')
                          .insert({
                            user_id: labUser.id,
                            original: labInput,
                            improved: body.improved,
                            tool: body.recommended_tool ?? null,
                            scores_before: body.scores.before,
                            scores_after: body.scores.after,
                            summary: body.summary,
                          })
                          .select('id, original, improved, tool, scores_before, scores_after, summary, created_at')
                          .single()
                        if (histRow) setLabHistory(prev => [histRow as LabHistoryItem, ...prev])
                      }
                    } catch (e) {
                      setLabError(`Network error: ${e instanceof Error ? e.message : String(e)}`)
                    }
                    setLabLoading(false)
                  }}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-md shadow-emerald-200 gap-2 shrink-0 font-semibold"
                >
                  {labLoading
                    ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Improving…</>
                    : <><Sparkles className="w-3.5 h-3.5" /> Improve my prompt</>}
                </Button>
              </div>
              {labError && <p className="text-xs text-red-500 mt-2">{labError}</p>}
            </div>

            {/* Results */}
            {labResult && (
              <>
                {/* Score comparison — colorful */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-gray-800 flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-emerald-500" /> Quality scores</p>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                      <p className="text-xs font-bold text-emerald-700">
                        +{Math.round((['specificity','context','output_clarity'] as const).reduce((s,k) => s + labResult.scores.after[k] - labResult.scores.before[k], 0) / 3)} avg improvement
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {([
                      { key: 'specificity' as const, label: 'Specificity', color: 'from-blue-400 to-blue-500', bg: 'bg-blue-50', text: 'text-blue-600', emoji: '🎯' },
                      { key: 'context' as const, label: 'Context', color: 'from-purple-400 to-purple-500', bg: 'bg-purple-50', text: 'text-purple-600', emoji: '🧠' },
                      { key: 'output_clarity' as const, label: 'Output clarity', color: 'from-amber-400 to-amber-500', bg: 'bg-amber-50', text: 'text-amber-600', emoji: '📄' },
                    ]).map(({ key, label, color, bg, text, emoji }) => {
                      const before = labResult.scores.before[key]
                      const after = labResult.scores.after[key]
                      const delta = after - before
                      return (
                        <div key={key} className={`${bg} rounded-xl p-3`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-700 flex items-center gap-1">{emoji} {label}</span>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-gray-400 line-through">{before}/10</span>
                              <span className={`font-black text-sm ${text}`}>{after}/10</span>
                              {delta > 0 && <span className="bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full text-xs">+{delta}</span>}
                            </div>
                          </div>
                          <div className="relative h-3 bg-white/70 rounded-full overflow-hidden">
                            <div className={`absolute inset-y-0 left-0 bg-gradient-to-r ${color} rounded-full transition-all duration-700`} style={{ width: `${after * 10}%` }} />
                            <div className="absolute inset-y-0 left-0 w-px bg-gray-400/30" style={{ left: `${before * 10}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 flex items-start gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-emerald-800"><span className="font-bold">Key win:</span> {labResult.summary}</p>
                  </div>
                </div>

                {/* What changed — promoted above before/after */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-sm font-bold text-gray-800 mb-1">What we changed</p>
                  <p className="text-xs text-gray-400 mb-3">Each fix explains exactly why your original prompt was underperforming.</p>
                  <div className="space-y-3">
                    {labResult.changes.map((c, i) => {
                      const chipColors = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700', 'bg-emerald-100 text-emerald-700', 'bg-pink-100 text-pink-700']
                      return (
                        <div key={i} className="flex gap-3 items-start">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${chipColors[i % chipColors.length]}`}>{c.label}</span>
                          <p className="text-xs text-gray-500 leading-relaxed">{c.description}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Before / After */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl p-4 border border-red-200" style={{ background: 'linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-sm">😬</div>
                      <p className="text-xs font-bold text-red-500 uppercase tracking-wide">Before</p>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap italic">&ldquo;{labInput}&rdquo;</p>
                  </div>
                  <div className="rounded-2xl p-4 border border-emerald-200" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-sm">✨</div>
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">After</p>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{labResult.improved}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 flex-wrap pb-2">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 shadow-sm shadow-emerald-200"
                    onClick={() => {
                      navigator.clipboard.writeText(labResult.improved)
                      setLabCopied(true)
                      setTimeout(() => setLabCopied(false), 2000)
                    }}
                  >
                    {labCopied ? <><CheckCircle className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy improved prompt</>}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={labSaved}
                    className="gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    onClick={async () => {
                      const label = labInput.slice(0, 60) + (labInput.length > 60 ? '…' : '')
                      const supabase = createClient()
                      const { data: { user } } = await supabase.auth.getUser()
                      if (!user) { setLabError('Not signed in'); return }
                      const { data, error } = await supabase
                        .from('saved_prompts')
                        .insert({ user_id: user.id, content: labResult.improved, label: `✨ ${label}`, tool: null, folder_id: null })
                        .select('id, content, label, tool, folder_id, created_at')
                        .single()
                      if (error) { setLabError(`Save failed: ${error.message}`); return }
                      if (data) {
                        setSaved(prev => [data, ...prev])
                        setLabSaved(true)
                      }
                    }}
                  >
                    {labSaved ? <><BookmarkCheck className="w-3.5 h-3.5" /> Saved!</> : <><Bookmark className="w-3.5 h-3.5" /> Save to my prompts</>}
                  </Button>
                  <button
                    onClick={() => { setLabResult(null); setLabInput('') }}
                    className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 ml-auto"
                  >
                    <RefreshCw className="w-3 h-3" /> Try another
                  </button>
                </div>
              </>
            )}

            {/* Empty state */}
            {!labResult && !labLoading && (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">🧪</div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Drop in any prompt to get started</p>
                <p className="text-xs text-gray-400">Works with ChatGPT, Claude, Notion AI, Gemini — any tool</p>
              </div>
            )}

            </> /* end improve view */}

            {/* ── History view ───────────────────────────────────────── */}
            {labView === 'history' && (() => {
              if (labHistory.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                    <div className="text-4xl mb-4">📜</div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">No history yet</h3>
                    <p className="text-sm text-gray-500 max-w-xs mb-5">Every prompt you improve in the Lab gets saved here automatically — so you can track your progress over time.</p>
                    <Button onClick={() => setLabView('improve')} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                      <FlaskConical className="w-4 h-4" /> Improve your first prompt
                    </Button>
                  </div>
                )
              }

              // Quality trend chart (last 20 runs, oldest→newest)
              const trendItems = [...labHistory].reverse().slice(-20)
              const avgScore = (item: LabHistoryItem) =>
                Math.round(((item.scores_after.specificity + item.scores_after.context + item.scores_after.output_clarity) / 3) * 10) / 10
              const avgBefore = (item: LabHistoryItem) =>
                Math.round(((item.scores_before.specificity + item.scores_before.context + item.scores_before.output_clarity) / 3) * 10) / 10

              const scores = trendItems.map(avgScore)
              const minScore = Math.max(0, Math.min(...scores) - 1)
              const maxScore = Math.min(10, Math.max(...scores) + 1)
              const chartW = 400
              const chartH = 60
              const pad = 8
              const xStep = (chartW - pad * 2) / Math.max(scores.length - 1, 1)
              const yScale = (v: number) => chartH - pad - ((v - minScore) / (maxScore - minScore + 0.001)) * (chartH - pad * 2)
              const points = scores.map((s, i) => `${pad + i * xStep},${yScale(s)}`).join(' ')

              const allTimeAvgAfter = labHistory.reduce((s, h) => s + avgScore(h), 0) / labHistory.length
              const allTimeAvgBefore = labHistory.reduce((s, h) => s + avgBefore(h), 0) / labHistory.length

              return (
                <div className="space-y-4">
                  {/* Trend + stats */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                      <div>
                        <p className="text-sm font-bold text-gray-900 mb-0.5">Quality trend</p>
                        <p className="text-xs text-gray-400">Avg output quality score over your last {trendItems.length} runs</p>
                      </div>
                      <div className="flex gap-4 text-center">
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Avg before</p>
                          <p className="text-lg font-black text-red-400">{allTimeAvgBefore.toFixed(1)}<span className="text-xs font-normal text-gray-400">/10</span></p>
                        </div>
                        <div className="w-px bg-gray-100" />
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Avg after</p>
                          <p className="text-lg font-black text-emerald-600">{allTimeAvgAfter.toFixed(1)}<span className="text-xs font-normal text-gray-400">/10</span></p>
                        </div>
                        <div className="w-px bg-gray-100" />
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Total runs</p>
                          <p className="text-lg font-black text-gray-700">{labHistory.length}</p>
                        </div>
                      </div>
                    </div>
                    {scores.length > 1 && (
                      <div className="relative">
                        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-14" preserveAspectRatio="none">
                          {/* Fill area */}
                          <defs>
                            <linearGradient id="labTrendGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                            </linearGradient>
                          </defs>
                          <polyline
                            points={`${pad},${chartH} ${points} ${pad + (scores.length - 1) * xStep},${chartH}`}
                            fill="url(#labTrendGrad)" stroke="none"
                          />
                          {/* Line */}
                          <polyline points={points} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          {/* Dots */}
                          {scores.map((s, i) => (
                            <circle key={i} cx={pad + i * xStep} cy={yScale(s)} r="3" fill="#10b981" stroke="white" strokeWidth="1.5" />
                          ))}
                        </svg>
                        <div className="flex justify-between text-xs text-gray-300 mt-1">
                          <span>oldest</span><span>most recent</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* History list */}
                  <div className="flex items-center justify-between gap-2">
                    {labHistory.length > 3 && (
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={labSearch}
                          onChange={e => setLabSearch(e.target.value)}
                          placeholder="Search your prompt history…"
                          className="w-full text-sm bg-white border border-gray-200 rounded-xl px-4 py-2.5 pl-9 focus:outline-none focus:border-emerald-400 transition-colors"
                        />
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </div>
                    )}
                    {confirmClearHistory ? (
                      <div className="flex items-center gap-2 shrink-0 ml-auto">
                        <span className="text-xs text-gray-500">Clear all history?</span>
                        <button onClick={clearAllHistory} className="text-xs font-semibold text-red-600 hover:text-red-700 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Yes, clear</button>
                        <button onClick={() => setConfirmClearHistory(false)} className="text-xs text-gray-400 hover:text-gray-600 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmClearHistory(true)} className="shrink-0 ml-auto flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" /> Clear all
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {labHistory.filter(item =>
                      !labSearch.trim() ||
                      item.original.toLowerCase().includes(labSearch.toLowerCase()) ||
                      item.improved.toLowerCase().includes(labSearch.toLowerCase()) ||
                      (item.tool ?? '').toLowerCase().includes(labSearch.toLowerCase())
                    ).map((item) => {
                      const isExpanded = labExpandedId === item.id
                      const after = avgScore(item)
                      const before = avgBefore(item)
                      const delta = Math.round((after - before) * 10) / 10
                      const relTime = (() => {
                        const diff = Date.now() - new Date(item.created_at).getTime()
                        const mins = Math.floor(diff / 60000)
                        if (mins < 60) return mins <= 1 ? 'just now' : `${mins}m ago`
                        const hrs = Math.floor(mins / 60)
                        if (hrs < 24) return `${hrs}h ago`
                        return `${Math.floor(hrs / 24)}d ago`
                      })()

                      return (
                        <div key={item.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                          <button
                            onClick={() => setLabExpandedId(isExpanded ? null : item.id)}
                            className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-gray-50/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">+{delta} avg</span>
                                {item.tool && <span className="text-xs text-gray-400 border border-gray-100 px-2 py-0.5 rounded-full">{item.tool}</span>}
                                <span className="text-xs text-gray-400 ml-auto">{relTime}</span>
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-1 italic">&ldquo;{item.original}&rdquo;</p>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-gray-300 shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>

                          {isExpanded && (
                            <div className="border-t border-gray-50 px-5 pb-5 pt-4 space-y-4">
                              {/* Score bars */}
                              <div className="grid grid-cols-3 gap-2">
                                {([
                                  { key: 'specificity' as const, label: '🎯 Specificity', color: 'bg-blue-500' },
                                  { key: 'context' as const, label: '🧠 Context', color: 'bg-purple-500' },
                                  { key: 'output_clarity' as const, label: '📄 Clarity', color: 'bg-amber-500' },
                                ]).map(({ key, label, color }) => {
                                  const b = item.scores_before[key]
                                  const a = item.scores_after[key]
                                  return (
                                    <div key={key} className="bg-gray-50 rounded-xl p-3">
                                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-gray-400 line-through">{b}</span>
                                        <span className="text-sm font-black text-gray-800">→ {a}</span>
                                        <span className="text-xs font-bold text-emerald-600">+{a - b}</span>
                                      </div>
                                      <div className="h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                                        <div className={`h-full ${color} rounded-full`} style={{ width: `${a * 10}%` }} />
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>

                              {/* Before / After */}
                              <div className="grid sm:grid-cols-2 gap-3">
                                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                                  <p className="text-xs font-bold text-red-400 mb-1.5">Before</p>
                                  <p className="text-xs text-gray-600 leading-relaxed italic">&ldquo;{item.original}&rdquo;</p>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                                  <p className="text-xs font-bold text-emerald-600 mb-1.5">After</p>
                                  <p className="text-xs text-gray-700 leading-relaxed">{item.improved}</p>
                                </div>
                              </div>

                              {/* Re-use button */}
                              <div className="flex gap-2 flex-wrap">
                                <Button size="sm" variant="outline"
                                  className="gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs"
                                  onClick={() => {
                                    setLabInput(item.original)
                                    setLabResult(null)
                                    setLabView('improve')
                                  }}>
                                  <RefreshCw className="w-3.5 h-3.5" /> Re-run original
                                </Button>
                                <Button size="sm" variant="outline"
                                  className="gap-1.5 text-gray-500 border-gray-200 hover:bg-gray-50 text-xs"
                                  onClick={() => { navigator.clipboard.writeText(item.improved) }}>
                                  <Copy className="w-3.5 h-3.5" /> Copy improved
                                </Button>
                                <Button size="sm" variant="outline"
                                  className="gap-1.5 text-red-400 border-red-100 hover:bg-red-50 text-xs ml-auto"
                                  onClick={() => deleteHistoryItem(item.id)}>
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
            </>}
          </div>
        )}

        {/* ── Progress (removed — content folded into Dashboard) ── */}
        {false && (() => {
          const now = new Date()
          const startOfWeek = new Date(now)
          startOfWeek.setDate(now.getDate() - now.getDay())
          startOfWeek.setHours(0, 0, 0, 0)
          const startOfLastWeek = new Date(startOfWeek)
          startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)

          const thisWeekDone = completed.filter(c => c.completed_at && new Date(c.completed_at) >= startOfWeek)
          const lastWeekDone = completed.filter(c => {
            if (!c.completed_at) return false
            const d = new Date(c.completed_at)
            return d >= startOfLastWeek && d < startOfWeek
          })

          // Build last 30 days activity map
          const activityMap: Record<string, number> = {}
          completed.forEach(c => {
            if (!c.completed_at) return
            const day = c.completed_at.slice(0, 10)
            activityMap[day] = (activityMap[day] ?? 0) + 1
          })

          // Last 5 weeks of days (Mon–Sun) for heatmap
          const weeks: string[][] = []
          const heatmapEnd = new Date(now)
          heatmapEnd.setHours(23, 59, 59)
          // go back to last Sunday
          const cursor = new Date(heatmapEnd)
          cursor.setDate(cursor.getDate() - cursor.getDay())
          for (let w = 0; w < 5; w++) {
            const week: string[] = []
            for (let d = 0; d < 7; d++) {
              const day = new Date(cursor)
              day.setDate(cursor.getDate() - (6 - d))
              week.push(day.toISOString().slice(0, 10))
            }
            weeks.unshift(week)
            cursor.setDate(cursor.getDate() - 7)
          }

          // Per-tool breakdown
          const toolCounts: Record<string, number> = {}
          completed.forEach(c => { toolCounts[c.tool] = (toolCounts[c.tool] ?? 0) + 1 })
          const toolEntries = Object.entries(toolCounts).sort((a, b) => b[1] - a[1])
          const maxToolCount = toolEntries[0]?.[1] ?? 1

          // Milestones
          const milestones = [
            { label: 'First task', icon: '🎯', reached: completed.length >= 1 },
            { label: '5 tasks done', icon: '⚡', reached: completed.length >= 5 },
            { label: '10 tasks done', icon: '🔥', reached: completed.length >= 10 },
            { label: '3-day streak', icon: '📅', reached: streakState >= 3 },
            { label: '7-day streak', icon: '🏅', reached: streakState >= 7 },
            { label: 'Explorer level', icon: '🧭', reached: xpState >= 100 },
            { label: 'Practitioner level', icon: '🌟', reached: xpState >= 250 },
            { label: '25 tasks done', icon: '🏆', reached: completed.length >= 25 },
          ]

          const weekDelta = thisWeekDone.length - lastWeekDone.length

          return (
            <div className="space-y-6 p-4 sm:p-6">
              {/* Header */}
              <div>
                <h2 className="text-xl font-black text-gray-900">Your progress</h2>
                <p className="text-sm text-gray-400 mt-0.5">Track your AI skill-building over time</p>
              </div>

              {/* Top stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: <CheckCircle className="w-5 h-5 text-emerald-500" />, value: completed.length, label: 'Total tasks done', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                  { icon: <Flame className="w-5 h-5 text-orange-500" />, value: `${streakState}d`, label: 'Current streak', bg: 'bg-orange-50', border: 'border-orange-100' },
                  { icon: <Zap className="w-5 h-5 text-amber-500" />, value: xpState, label: 'Total XP earned', bg: 'bg-amber-50', border: 'border-amber-100' },
                  { icon: <Target className="w-5 h-5 text-blue-500" />, value: thisWeekDone.length, label: 'This week', bg: 'bg-blue-50', border: 'border-blue-100' },
                ].map(stat => (
                  <div key={stat.label} className={`${stat.bg} border ${stat.border} rounded-2xl p-4`}>
                    <div className="flex items-center gap-2 mb-1">{stat.icon}</div>
                    <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* XP level bar */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold text-gray-900">Level: <span className={getXpLevel(xpState).color}>{getXpLevel(xpState).name}</span></span>
                  </div>
                  <span className="text-xs text-gray-400">{xpState} XP {getNextXpLevel(xpState) ? `/ ${getNextXpLevel(xpState)!.min}` : '(max)'}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${getXpPct(xpState)}%`, background: 'linear-gradient(90deg, #10b981, #14b8a6)' }} />
                </div>
                {getNextXpLevel(xpState) && (
                  <p className="text-xs text-gray-400 mt-2">{getNextXpLevel(xpState)!.min - xpState} XP until <span className="font-semibold">{getNextXpLevel(xpState)!.name}</span></p>
                )}
              </div>

              {/* This week vs last week + heatmap */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Week comparison */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-sm font-bold text-gray-900">This week vs last week</p>
                  </div>
                  <div className="flex items-end gap-6">
                    <div>
                      <p className="text-3xl font-black text-gray-900">{thisWeekDone.length}</p>
                      <p className="text-xs text-gray-400 mt-0.5">This week</p>
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      {weekDelta > 0 ? (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+{weekDelta} vs last week</span>
                      ) : weekDelta < 0 ? (
                        <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{weekDelta} vs last week</span>
                      ) : (
                        <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">Same as last week</span>
                      )}
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xl font-black text-gray-300">{lastWeekDone.length}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Last week</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-1.5 items-end h-10 overflow-hidden">
                    {(() => {
                      const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((dow, i) => {
                        const d = new Date(startOfWeek)
                        d.setDate(startOfWeek.getDate() + i)
                        const key = d.toISOString().slice(0, 10)
                        return { dow, key, count: activityMap[key] ?? 0, isPast: d <= now }
                      })
                      const maxCount = Math.max(1, ...days.map(d => d.count))
                      return days.map(({ dow, key, count, isPast }) => (
                        <div key={key} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full rounded-sm transition-all"
                            style={{
                              height: `${Math.max(4, Math.round((count / maxCount) * 32))}px`,
                              background: count > 0 ? 'linear-gradient(180deg,#10b981,#059669)' : isPast ? '#f3f4f6' : '#f9fafb',
                              opacity: isPast ? 1 : 0.4,
                            }}
                          />
                          <span className="text-[9px] text-gray-300">{dow[0]}</span>
                        </div>
                      ))
                    })()}
                  </div>
                </div>

                {/* 5-week heatmap */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart2 className="w-4 h-4 text-gray-400" />
                    <p className="text-sm font-bold text-gray-900">30-day activity</p>
                  </div>
                  <div className="flex gap-1">
                    {weeks.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-1 flex-1">
                        {week.map(day => {
                          const count = activityMap[day] ?? 0
                          const isFuture = day > now.toISOString().slice(0, 10)
                          const intensity = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : 3
                          const colors = ['#f3f4f6', '#bbf7d0', '#34d399', '#059669']
                          return (
                            <div
                              key={day}
                              title={`${day}: ${count} task${count !== 1 ? 's' : ''}`}
                              className="w-full rounded-sm"
                              style={{
                                height: '14px',
                                background: isFuture ? '#f9fafb' : colors[intensity],
                                opacity: isFuture ? 0.3 : 1,
                              }}
                            />
                          )
                        })}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-400">5 weeks ago</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-400">Less</span>
                      {['#f3f4f6','#bbf7d0','#34d399','#059669'].map(c => (
                        <div key={c} className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
                      ))}
                      <span className="text-[10px] text-gray-400">More</span>
                    </div>
                    <span className="text-[10px] text-gray-400">Today</span>
                  </div>
                </div>
              </div>

              {/* Per-tool breakdown */}
              {toolEntries.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <p className="text-sm font-bold text-gray-900">Tasks completed per tool</p>
                  </div>
                  <div className="space-y-3">
                    {toolEntries.map(([tool, count]) => (
                      <div key={tool}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700 font-medium">{tool}</span>
                          <span className="text-xs font-bold text-gray-500">{count} task{count !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-2 rounded-full transition-all duration-700"
                            style={{ width: `${Math.round((count / maxToolCount) * 100)}%`, background: 'linear-gradient(90deg,#10b981,#14b8a6)' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Milestones */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-bold text-gray-900">Milestones</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {milestones.map(m => (
                    <div
                      key={m.label}
                      className={`rounded-xl p-3 border text-center transition-all ${m.reached ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100 opacity-40 grayscale'}`}
                    >
                      <div className="text-2xl mb-1">{m.icon}</div>
                      <p className="text-xs font-semibold text-gray-700 leading-tight">{m.label}</p>
                      {m.reached && <p className="text-[10px] text-emerald-600 font-bold mt-1">Unlocked ✓</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Team leaderboard */}
              {teamLeaderboard.length > 1 && (() => {
                const myRank = teamLeaderboard.findIndex(t => t.id === profile.id) + 1
                return (
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <p className="text-sm font-bold text-gray-900">Team leaderboard</p>
                      </div>
                      {myRank > 0 && (
                        <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full">
                          You&apos;re #{myRank}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {teamLeaderboard.map((t, i) => {
                        const isMe = t.id === profile.id
                        return (
                          <div key={t.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${isMe ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50'}`}>
                            <span className="text-sm w-5 text-center font-bold text-gray-400 shrink-0">
                              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                            </span>
                            <p className={`text-sm flex-1 font-medium truncate ${isMe ? 'text-emerald-700' : 'text-gray-700'}`}>
                              {isMe ? 'You' : (t.full_name?.split(' ')[0] ?? 'Teammate')}
                            </p>
                            {t.streak > 0 && <span className="text-xs text-amber-500">🔥{t.streak}d</span>}
                            <span className={`text-sm font-bold shrink-0 ${isMe ? 'text-emerald-600' : 'text-gray-500'}`}>{t.xp} XP</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {/* Nudge if nothing done yet */}
              {completed.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🌱</div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Nothing tracked yet</p>
                  <p className="text-xs text-gray-400 mb-4">Complete your first daily task to start building your streak.</p>
                  <button onClick={() => setSection('tasks')} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mx-auto">
                    Go to Daily Tasks <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })()}
      </main>
    </div>
    </>
  )
}
