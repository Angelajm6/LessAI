'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle, ChevronDown, ChevronRight, Sparkles, Clock,
  ThumbsUp, Zap, Send, Bot, User, Bookmark, BookmarkCheck,
  Copy, Trash2, ArrowRight, LayoutDashboard, BookOpen,
  MessageSquare, FolderPlus, Folder, FolderOpen, Plus, X, Pencil,
  FileText, ChevronUp, Home, TrendingUp, Star
} from 'lucide-react'
import type { StackMap, ToolCard, ToolTrack, DailyTask, Playbook, ToolPlaybook, PromptFramework } from '@/lib/claude'

interface CompletedTask { tool: string; day: number }
interface ChatMessage { role: 'user' | 'assistant'; content: string }
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
}

const LEVEL_COLORS: Record<string, string> = {
  never: 'bg-gray-100 text-gray-500',
  learning: 'bg-amber-50 text-amber-700 border border-amber-200',
  comfortable: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
}

type Section = 'home' | 'tasks' | 'playbook' | 'guides' | 'saved' | 'ask'

const NAV_ITEMS: { key: Section; icon: React.ElementType; label: string }[] = [
  { key: 'home', icon: Home, label: 'Overview' },
  { key: 'tasks', icon: LayoutDashboard, label: 'Daily Tasks' },
  { key: 'playbook', icon: FileText, label: 'Prompt Playbook' },
  { key: 'guides', icon: BookOpen, label: 'Tool Guides' },
  { key: 'saved', icon: Bookmark, label: 'Saved Prompts' },
  { key: 'ask', icon: MessageSquare, label: 'Ask AI' },
]

export default function DashboardClient({ profile, stackMap, playbook, completedTasks: initialCompleted, savedPrompts: initialSaved, promptFolders: initialFolders }: Props) {
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

  const firstName = profile.full_name?.split(' ')[0] ?? 'there'
  const tools = profile.tools ?? []
  const toolLevels = profile.tool_levels ?? {}
  const playbookTools = playbook?.tool_playbooks ?? []

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

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
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('task_completions').upsert({ user_id: user.id, tool, day }, { onConflict: 'user_id,tool,day' })
    setCompleted(prev => [...prev, { tool, day }])
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

  async function sendMessage() {
    const text = chatInput.trim()
    if (!text || chatLoading) return
    const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: text }]
    setChatMessages(newMessages)
    setChatInput('')
    setChatLoading(true)
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
    setChatLoading(false)
  }

  return (
    <div className="flex gap-0 min-h-[calc(100vh-72px)]">

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
      <aside className="hidden sm:block w-56 shrink-0 border-r border-gray-100 pr-4 mr-12">
        <div className="sticky top-24 space-y-1">
          {/* Profile + progress */}
          <div className="px-3 py-3 mb-4">
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

          {/* Tools */}
          {tools.length > 0 && (
            <div className="mt-6 px-3">
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

        {/* ── Overview / Home ── */}
        {section === 'home' && (() => {
          // Next uncompleted task per tool track
          const todayTasks = stackMap?.tool_tracks.map(track => {
            const nextTask = track.daily_tasks.find(t => !completed.some(c => c.tool === track.tool && c.day === t.day))
            return nextTask ? { track, task: nextTask } : null
          }).filter(Boolean) ?? []

          // First playbook framework for a quick win preview
          const quickWin = playbook?.tool_playbooks?.[0]?.frameworks?.[0] ?? null
          const quickWinTool = playbook?.tool_playbooks?.[0]?.tool ?? ''

          return (
            <div className="space-y-6">
              {/* Personalized hero card */}
              <div className="relative overflow-hidden rounded-2xl p-6"
                style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 40%, #d97706 100%)' }}>
                <div className="dot-grid-3d absolute inset-0 opacity-20" />
                <div className="relative z-10">
                  <p className="text-emerald-100 text-xs font-semibold uppercase tracking-widest mb-1">Your personalized dashboard</p>
                  <h2 className="text-2xl font-black text-white mb-1">
                    {(() => {
                      const h = new Date().getHours()
                      return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
                    })()}, {firstName}.
                  </h2>
                  <p className="text-white/75 text-sm mb-4 max-w-lg">
                    You&apos;re a <strong className="text-white">{profile.role}</strong> with a prompt playbook built for your exact role and tools. Every section below is specific to how you work — not generic AI tips.
                  </p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="bg-white/15 rounded-xl px-4 py-2.5 border border-white/20">
                      <p className="text-xs text-white/60 mb-0.5">Tasks completed</p>
                      <p className="text-xl font-black text-white">{totalDone}<span className="text-sm text-white/60 font-normal">/{totalTasks}</span></p>
                    </div>
                    <div className="bg-white/15 rounded-xl px-4 py-2.5 border border-white/20">
                      <p className="text-xs text-white/60 mb-0.5">Tools in your stack</p>
                      <p className="text-xl font-black text-white">{tools.length}</p>
                    </div>
                    <div className="bg-white/15 rounded-xl px-4 py-2.5 border border-white/20">
                      <p className="text-xs text-white/60 mb-0.5">Prompt frameworks</p>
                      <p className="text-xl font-black text-white">{(playbook?.tool_playbooks ?? []).reduce((s, tp) => s + tp.frameworks.length, 0) || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar full-width */}
              {totalTasks > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-semibold text-gray-900">Your progress</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">{pct}% complete</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                    <div className="h-2.5 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #10b981, #f59e0b)' }} />
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {stackMap?.tool_tracks.map(track => {
                      const done = completed.filter(c => c.tool === track.tool).length
                      const trackPct = Math.round((done / track.daily_tasks.length) * 100)
                      return (
                        <div key={track.tool} className="flex items-center gap-1.5 text-xs text-gray-500">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: trackPct === 100 ? '#10b981' : trackPct > 0 ? '#f59e0b' : '#e5e7eb' }} />
                          <span>{track.tool}</span>
                          <span className="text-gray-400">{done}/{track.daily_tasks.length}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Today's tasks */}
              {todayTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-gray-900">Continue where you left off</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {todayTasks.slice(0, 4).map(item => {
                      if (!item) return null
                      const { track, task } = item
                      const isDone = isCompleted(track.tool, task.day)
                      const key = `${track.tool}-${task.day}`
                      return (
                        <div key={key}
                          className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all duration-200 group">
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
                          <div className="mt-3 flex items-center justify-between">
                            <span className="flex items-center gap-1 text-xs text-gray-400"><Clock className="w-3 h-3" /> {task.time_minutes}m</span>
                            <button onClick={() => setSection('tasks')}
                              className="text-xs text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1">
                              See all tasks <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Quick win: before/after from playbook */}
              {quickWin && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-gray-900">Quick win — see the before/after difference</h3>
                    <span className="text-xs text-gray-400">{quickWinTool}</span>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-5 pt-4 pb-3 border-b border-gray-50">
                      <p className="text-sm font-semibold text-gray-900">{quickWin.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{quickWin.use_case}</p>
                    </div>
                    <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                      <div className="p-4">
                        <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-2 flex items-center gap-1">✗ Without this framework</p>
                        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-800 italic leading-relaxed">{quickWin.before}</div>
                      </div>
                      <div className="p-4">
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-2 flex items-center gap-1">✓ With this framework</p>
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-900 leading-relaxed">{quickWin.after}</div>
                      </div>
                    </div>
                    <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
                      <p className="text-xs text-amber-800 flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span><strong>Why it works:</strong> {quickWin.why_better}</span>
                      </p>
                    </div>
                    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-400">Your full playbook has {(playbook?.tool_playbooks ?? []).reduce((s, tp) => s + tp.frameworks.length, 0)} frameworks like this</span>
                      <button onClick={() => setSection('playbook')}
                        className="text-xs text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1">
                        Open playbook <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Feature quick-links */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Everything in your dashboard</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { key: 'tasks' as Section, icon: LayoutDashboard, title: 'Daily Tasks', desc: '10-min practice tasks per tool, matched to your skill level', color: 'emerald' },
                    { key: 'playbook' as Section, icon: FileText, title: 'Prompt Playbook', desc: 'Role-specific frameworks with before/after examples for every tool', color: 'teal' },
                    { key: 'guides' as Section, icon: BookOpen, title: 'Tool Guides', desc: 'When to use which tool, what each is best for your role', color: 'amber' },
                    { key: 'ask' as Section, icon: MessageSquare, title: 'Ask AI Coach', desc: 'Ask anything about your tools — answers tailored to your role', color: 'blue' },
                  ].map(item => (
                    <button key={item.key} onClick={() => setSection(item.key)}
                      className="group text-left bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all duration-200">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                        item.color === 'emerald' ? 'bg-emerald-100 group-hover:bg-emerald-200' :
                        item.color === 'teal' ? 'bg-teal-100 group-hover:bg-teal-200' :
                        item.color === 'amber' ? 'bg-amber-100 group-hover:bg-amber-200' :
                        'bg-blue-100 group-hover:bg-blue-200'
                      }`}>
                        <item.icon className={`w-4 h-4 ${
                          item.color === 'emerald' ? 'text-emerald-600' :
                          item.color === 'teal' ? 'text-teal-600' :
                          item.color === 'amber' ? 'text-amber-600' :
                          'text-blue-600'
                        }`} />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">{item.title}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

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
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500 mb-1">Playbook not generated yet</p>
                <p className="text-xs text-gray-400 mb-4">Re-run onboarding to generate your prompt playbook.</p>
                <Button size="sm" variant="outline" onClick={() => window.location.href = '/onboarding'}
                  className="gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                  <ArrowRight className="w-3.5 h-3.5" /> Go to onboarding
                </Button>
              </div>
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
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Daily Tasks</h2>
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
                  {isOpen && (
                    <div className="border-t border-gray-50 divide-y divide-gray-50">
                      {track.daily_tasks.map((task: DailyTask) => {
                        const isDone = isCompleted(track.tool, task.day)
                        const key = `${track.tool}-${task.day}`
                        const alreadySaved = isPromptSaved(task.task)
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
                                <p className={`text-sm leading-relaxed ${isDone ? 'text-gray-400' : 'text-gray-600'}`}>{task.task}</p>
                              </div>
                              <button
                                onClick={() => savePrompt(task.task, `${track.tool} — Day ${task.day}: ${task.title}`, track.tool)}
                                disabled={alreadySaved || savingPrompt === task.task}
                                title={alreadySaved ? 'Saved' : 'Save this prompt'}
                                className={`shrink-0 mt-0.5 p-1.5 rounded-lg transition-all ${
                                  alreadySaved ? 'text-emerald-500 bg-emerald-50' : 'text-gray-300 hover:text-amber-500 hover:bg-amber-50'
                                }`}>
                                {alreadySaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Tool Guides — dark section with 3D grid */}
        {section === 'guides' && (
          <div className="space-y-4">
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
        )}

        {/* Saved Prompts */}
        {section === 'saved' && (
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
        )}

        {/* Ask AI — gradient header with 3D grid */}
        {section === 'ask' && (
          <div className="flex flex-col gap-4">
            {chatMessages.length === 0 && (
              <div className="space-y-3">
                {/* Coach intro — gradient + 3D grid */}
                <div className="relative overflow-hidden rounded-2xl p-5"
                  style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #fefce8 100%)' }}>
                  <div className="dot-grid-3d absolute inset-0 opacity-25" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center shadow-sm shadow-emerald-200">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Your AI tool coach</p>
                        <p className="text-xs text-gray-500">Knows your stack · Answers for your role</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Ask anything about your tools — which to use, how to write better prompts, or how they compare for your role as a <strong>{profile.role}</strong>.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 font-medium">Try asking:</p>
                <div className="grid gap-2">
                  {[
                    `Which of my tools is best for writing a performance review?`,
                    `How do I write a better prompt in ${tools[0] ?? 'Claude'}?`,
                    `What's the difference between ${tools[0] ?? 'Claude'} and ${tools[1] ?? 'ChatGPT'} for my role?`,
                    `What can ${tools[0] ?? 'Claude'} do that I'm probably not using yet?`,
                  ].map(q => (
                    <button key={q} onClick={() => setChatInput(q)}
                      className="text-left text-sm text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 rounded-xl px-4 py-2.5 transition-all duration-200 hover:shadow-sm">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatMessages.length > 0 && (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      msg.role === 'user' ? 'bg-gray-200' : 'bg-emerald-600'
                    }`}>
                      {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-gray-600" /> : <Bot className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-sm'
                        : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1 items-center h-4">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>
            )}

            <div className="flex gap-2 items-end">
              <Textarea placeholder="Ask anything about your tools…" value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                rows={2} className="resize-none border-gray-200 focus:border-emerald-400 focus:ring-emerald-400 text-sm" />
              <Button onClick={sendMessage} disabled={chatLoading || !chatInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 h-10 w-10 p-0 shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-400 text-center">Answers tailored to your role and your specific tools</p>
          </div>
        )}

        <div className="text-center pt-8 mt-8 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-2">Added new tools to your stack?</p>
          <Button variant="outline" size="sm" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1.5"
            onClick={() => window.location.href = '/onboarding'}>
            <ArrowRight className="w-3.5 h-3.5" /> Update my stack
          </Button>
        </div>
      </main>
    </div>
  )
}
