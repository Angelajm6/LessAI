'use client'

import { useState, useRef, useEffect } from 'react'
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
  FileText, ChevronUp, Home, TrendingUp, Star, Settings
} from 'lucide-react'
import Link from 'next/link'
import type { StackMap, ToolCard, ToolTrack, DailyTask, Playbook, ToolPlaybook, PromptFramework, Recommendation } from '@/lib/claude'

interface CompletedTask { tool: string; day: number; completed_at?: string }
interface ToolTipData { wrong_tool: string; better_tool: string; reason: string }
interface ChatMessage { role: 'user' | 'assistant' | 'tool-tip'; content: string; toolData?: ToolTipData }
interface SavedPrompt { id: string; content: string; label: string; tool: string | null; folder_id: string | null; created_at: string }
interface PromptFolder { id: string; name: string; created_at: string }

interface Props {
  profile: {
    id: string
    full_name: string | null
    role: string | null
    tools: string[] | null
    tool_levels: Record<string, string> | null
    company_name?: string | null
  }
  stackMap: StackMap | null
  playbook: Playbook | null
  completedTasks: CompletedTask[]
  savedPrompts: SavedPrompt[]
  promptFolders: PromptFolder[]
  initialXp?: number
  initialStreak?: number
  teamPrompts?: { id: string; title: string; content: string; tool: string | null; pinned: boolean; created_at: string }[]
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

type Section = 'home' | 'tasks' | 'playbook' | 'guides' | 'saved'

const NAV_ITEMS: { key: Section; icon: React.ElementType; label: string }[] = [
  { key: 'home', icon: Home, label: 'Overview' },
  { key: 'tasks', icon: LayoutDashboard, label: 'Daily Tasks' },
  { key: 'guides', icon: BookOpen, label: 'Tool Guides' },
  { key: 'saved', icon: Bookmark, label: 'Saved Prompts' },
]

function PlaybookGenerator({ profile, onDone }: { profile: Props['profile']; onDone: () => void }) {
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

export default function DashboardClient({ profile, stackMap, playbook, completedTasks: initialCompleted, savedPrompts: initialSaved, promptFolders: initialFolders, initialXp = 0, initialStreak = 0, teamPrompts = [] }: Props) {
  const [section, setSection] = useState<Section>('home')
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

  const firstName = profile.full_name?.split(' ')[0] ?? 'there'
  const tools = profile.tools ?? []
  const toolLevels = profile.tool_levels ?? {}
  const playbookTools = playbook?.tool_playbooks ?? []

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
      const { error } = await supabase.from('prompt_folders').insert({ user_id: user.id, name: newFolderName.trim() })
      if (error) {
        console.error('createFolder error:', error)
        alert(`Folder error: ${error.message}`)
      } else {
        const { data: updatedFolders } = await supabase
          .from('prompt_folders')
          .select('id, name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
        if (updatedFolders) {
          setFolders(updatedFolders)
          setActiveFolder(updatedFolders[updatedFolders.length - 1].id)
        }
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
    setSection('home')
    // Auto-run recommendation after state settles
    setTimeout(async () => {
      setRecommending(true)
      setCommandTask(taskText)
      try {
        const res = await fetch('/api/ai/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task: taskText, role: profile.role, tools, toolLevels, company: profile.company_name ?? null }),
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
        body: JSON.stringify({ task, role: profile.role, tools, toolLevels, company: profile.company_name ?? null }),
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
      body: JSON.stringify({ message: text, role: profile.role, tools }),
    }).then(r => r.ok ? r.json() : null).catch(() => null)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, role: profile.role, tools, toolLevels, company: profile.company_name ?? null }),
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
              <div className="bg-white/15 rounded-xl p-3 border border-white/20 backdrop-blur-sm">
                <p className="text-xs font-semibold text-amber-200 mb-0.5">Workflow tip</p>
                <p className="text-white/90 text-sm">{stackMap.workflow_tip}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Overview / Home — AI Command Center ── */}
        {section === 'home' && (() => {
          const today = new Date().toISOString().split('T')[0]
          const doneToday = completed.some(c => c.completed_at && c.completed_at.startsWith(today))
          const hasStreak = streakState > 0
          const showNudge = !doneToday && totalDone > 0

          const todayTasks = stackMap?.tool_tracks.map(track => {
            const nextTask = track.daily_tasks.find(t => !completed.some(c => c.tool === track.tool && c.day === t.day))
            return nextTask ? { track, task: nextTask } : null
          }).filter(Boolean) ?? []

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
            <div className="space-y-5">

              {/* Greeting */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                    {(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' })()}, {firstName}.
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400 mt-0.5 truncate">{profile.role} · {tools.length} tools in your stack</p>
                </div>
                {totalTasks > 0 && (
                  <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 shrink-0">
                    <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #10b981, #f59e0b)' }} />
                    </div>
                    <span className="font-semibold text-emerald-600">{pct}%</span>
                  </div>
                )}
              </div>

              {/* Streak nudge */}
              {showNudge && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                  <span className="text-xl shrink-0">🔥</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-800">
                      {hasStreak ? `Keep your ${streakState}-day streak alive!` : 'No task yet today — let\'s go!'}
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">Complete one task below to stay on track.</p>
                  </div>
                  <button onClick={() => setSection('tasks')}
                    className="shrink-0 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-xl px-3 py-1.5 transition-colors">
                    Do a task →
                  </button>
                </div>
              )}

              {/* ── Command Center ── */}
              <div className="relative overflow-hidden rounded-3xl bg-gray-950 shadow-2xl">
                <div className="line-grid-3d absolute inset-0" />
                {/* Floating orbs */}
                <div className="absolute top-6 left-8 w-32 h-32 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none animate-float" />
                <div className="absolute bottom-4 right-12 w-24 h-24 rounded-full bg-amber-500/15 blur-3xl pointer-events-none animate-float-slow" />
                <div className="absolute top-2 right-1/3 w-16 h-16 rounded-full bg-teal-400/10 blur-2xl pointer-events-none" />

                <div className="relative z-10 px-5 sm:px-8 pt-7 sm:pt-9 pb-6 sm:pb-7">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">AI Command Center</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white mb-5 sm:mb-6 leading-tight">
                    What do you want to{' '}
                    <span className="bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">
                      accomplish
                    </span>{' '}<span className="text-white">today?</span>
                  </h3>

                  {/* Input */}
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
                    <button
                      onClick={getRecommendation}
                      disabled={!commandInput.trim() || recommending}
                      className="absolute right-3 bottom-3 w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/40 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {recommending
                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <ArrowRight className="w-4 h-4 text-white" />
                      }
                    </button>
                  </div>

                  {/* Suggestion chips */}
                  <div className="flex gap-2 flex-wrap mt-3 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 no-scrollbar">
                    {SUGGESTIONS.map(s => (
                      <button key={s}
                        onClick={() => { setCommandInput(s); }}
                        className="text-xs px-3 py-1.5 rounded-full bg-white/[0.07] text-gray-400 border border-white/[0.08] hover:bg-white/[0.13] hover:text-gray-200 hover:border-white/20 transition-all duration-150 whitespace-nowrap shrink-0">
                        {s}
                      </button>
                    ))}
                  </div>

                  {/* Loading state */}
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

              {/* ── Recommendation Result ── */}
              {recommendation && !recommending && (
                <div ref={resultRef} className="animate-slide-up">
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">

                    {/* Result header */}
                    <div className="px-4 sm:px-6 pt-5 pb-4 border-b border-gray-100">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Here&apos;s your play</p>
                          <p className="text-sm sm:text-base font-semibold text-gray-900 italic">&ldquo;{commandTask}&rdquo;</p>
                        </div>
                        <button onClick={() => { setRecommendation(null); setCommandInput(''); }}
                          className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 shrink-0 mt-1 transition-colors">
                          <X className="w-3.5 h-3.5" /> Clear
                        </button>
                      </div>
                    </div>

                    <div className="divide-y divide-gray-50">

                      {/* Best tool */}
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

                      {/* Second tool */}
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

                      {/* Avoid tool */}
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

                      {/* Ready-to-paste prompt */}
                      <div className="px-4 sm:px-6 py-4 sm:py-5">
                        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Ready-to-paste prompt</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => savePrompt(recommendation.best_tool_prompt, commandTask, recommendation.best_tool)}
                              disabled={isPromptSaved(recommendation.best_tool_prompt)}
                              className={`text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-all ${
                                isPromptSaved(recommendation.best_tool_prompt)
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                  : 'text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'
                              }`}>
                              {isPromptSaved(recommendation.best_tool_prompt)
                                ? <><BookmarkCheck className="w-3 h-3" /> Saved</>
                                : <><Bookmark className="w-3 h-3" /> Save</>
                              }
                            </button>
                            <button onClick={() => copyCommandPrompt(recommendation.best_tool_prompt)}
                              className={`text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-all ${
                                copiedPrompt
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                  : 'text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'
                              }`}>
                              <Copy className="w-3 h-3" /> {copiedPrompt ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        </div>
                        <div className="bg-gray-950 rounded-2xl p-4 border border-gray-800">
                          <p className="text-sm text-gray-300 leading-relaxed font-mono whitespace-pre-wrap">{recommendation.best_tool_prompt}</p>
                        </div>
                      </div>

                      {/* Sequence */}
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
                                {i < recommendation.sequence!.length - 1 && (
                                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer: time saved + insight */}
                      <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-emerald-50/50 to-amber-50/50">
                        <div className="flex items-start gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-semibold text-emerald-700">Saves {recommendation.time_saved}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 leading-relaxed">
                              <strong className="text-gray-700">💡 </strong>{recommendation.insight}
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* ── Continue where you left off ── */}
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
                  <div className="grid gap-3 sm:grid-cols-2">
                    {todayTasks.slice(0, 4).map(item => {
                      if (!item) return null
                      const { track, task } = item
                      const isDone = isCompleted(track.tool, task.day)
                      const key = `${track.tool}-${task.day}`
                      return (
                        <div key={key} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all duration-200 group">
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
                                <span className="text-xs text-gray-400">· Day {task.day}</span>
                              </div>
                              <p className="text-sm font-semibold text-gray-900 mb-1">{task.title}</p>
                              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{task.task}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" /> {task.time_minutes}m
                          </div>
                        </div>
                      )
                    })}
                  </div>
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
              <PlaybookGenerator profile={profile} onDone={() => window.location.reload()} />
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
          <><div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Daily Tasks</h2>
              {playbookTools.length > 0 && (
                <button onClick={() => setSection('playbook')}
                  className="text-xs text-gray-400 hover:text-emerald-600 transition-colors flex items-center gap-1">
                  <FileText className="w-3 h-3" /> View all frameworks
                </button>
              )}
            </div>
            {!stackMap ? (
              <div className="text-center py-12 text-gray-400">No tasks yet — complete onboarding first.</div>
            ) : stackMap.tool_tracks.map((track: ToolTrack) => {
              const done = completed.filter(c => c.tool === track.tool).length
              const isOpen = expanded === track.tool
              return (
                <div key={track.tool}
                  className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:border-emerald-200 hover:shadow-md transition-all duration-200 group">
                  <button onClick={() => setExpanded(isOpen ? null : track.tool)} className="w-full text-left px-5 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-semibold text-gray-900">{track.tool}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[toolLevels[track.tool] ?? 'never']}`}>
                          {(toolLevels[track.tool] ?? 'never') === 'never' ? 'New to you' : toolLevels[track.tool]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1">{track.why_this_role}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xs text-gray-400">{done}/{track.daily_tasks.length}</div>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div className="h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${(done / track.daily_tasks.length) * 100}%`, background: 'linear-gradient(90deg, #10b981, #f59e0b)' }} />
                        </div>
                      </div>
                      {isOpen
                        ? <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                        : <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />}
                    </div>
                  </button>
                  {isOpen && (() => {
                    const toolPlaybook = playbookTools.find((tp: ToolPlaybook) => tp.tool === track.tool)
                    return (
                      <div className="border-t border-gray-50 divide-y divide-gray-50">
                        {track.daily_tasks.map((task: DailyTask) => {
                          const isDone = isCompleted(track.tool, task.day)
                          const key = `${track.tool}-${task.day}`
                          const alreadySaved = isPromptSaved(task.task)
                          const framework = toolPlaybook?.frameworks[(task.day - 1) % (toolPlaybook.frameworks.length || 1)]
                          return (
                            <div key={task.day}
                              className={`px-5 py-4 transition-colors ${isDone ? 'bg-emerald-50/60' : 'hover:bg-gray-50/60'}`}>
                              <div className="flex items-start gap-3">
                                <button onClick={() => markTaskDone(track.tool, task.day)} disabled={isDone || marking === key}
                                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                    isDone
                                      ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200'
                                      : 'border-gray-300 hover:border-emerald-400'
                                  }`}>
                                  {isDone && <CheckCircle className="w-3.5 h-3.5 text-white fill-white" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className={`text-sm font-semibold ${isDone ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                      Day {task.day} — {task.title}
                                    </span>
                                    <span className="flex items-center gap-0.5 text-xs text-gray-400">
                                      <Clock className="w-3 h-3" /> {task.time_minutes}m
                                    </span>
                                  </div>
                                  <p className={`text-sm leading-relaxed mb-3 ${isDone ? 'text-gray-400' : 'text-gray-600'}`}>{task.task}</p>

                                  {/* Framework inline */}
                                  {framework && !isDone && (
                                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-3">
                                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Prompt framework to use</p>
                                      <p className="text-xs font-medium text-gray-800 mb-1.5">{framework.title}</p>
                                      <p className="text-xs text-gray-500 font-mono leading-relaxed line-clamp-3">{framework.framework}</p>
                                      {framework.why_better && (
                                        <p className="text-xs text-emerald-600 mt-2 font-medium">💡 {framework.why_better}</p>
                                      )}
                                    </div>
                                  )}

                                  {/* Actions */}
                                  {!isDone && (
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => launchTask(task.task)}
                                        className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                                        <Zap className="w-3 h-3" /> Do this task →
                                      </button>
                                      <button
                                        onClick={() => savePrompt(task.task, `${track.tool} — Day ${task.day}: ${task.title}`, track.tool)}
                                        disabled={alreadySaved || savingPrompt === task.task}
                                        className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                                          alreadySaved ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-gray-400 border-gray-200 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50'
                                        }`}>
                                        {alreadySaved ? <><BookmarkCheck className="w-3 h-3" /> Saved</> : <><Bookmark className="w-3 h-3" /> Save</>}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>
              )
            })}
          </div>
          <div className="text-center pt-6 mt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">Added new tools to your stack?</p>
            <Button variant="outline" size="sm" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1.5"
              onClick={() => window.location.href = '/onboarding?from=stack'}>
              <ArrowRight className="w-3.5 h-3.5" /> Update my stack
            </Button>
          </div></>
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

            {!stackMap ? <div className="text-center py-12 text-gray-400">No guides yet.</div>
              : stackMap.tool_cards.map((card: ToolCard) => (
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
          </div>
        )}
      </main>
    </div>
    </>
  )
}
