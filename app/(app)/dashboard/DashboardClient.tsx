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
  MessageSquare, FolderPlus, Folder, FolderOpen, Plus, X, Pencil
} from 'lucide-react'
import type { StackMap, ToolCard, ToolTrack, DailyTask } from '@/lib/claude'

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
  completedTasks: CompletedTask[]
  savedPrompts: SavedPrompt[]
  promptFolders: PromptFolder[]
}

const LEVEL_COLORS: Record<string, string> = {
  never: 'bg-gray-800 text-gray-400',
  learning: 'bg-amber-950/60 text-amber-400 border border-amber-800/50',
  comfortable: 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50',
}

type Section = 'tasks' | 'guides' | 'saved' | 'ask'

const NAV_ITEMS: { key: Section; icon: React.ElementType; label: string }[] = [
  { key: 'tasks', icon: LayoutDashboard, label: 'Daily Tasks' },
  { key: 'guides', icon: BookOpen, label: 'Tool Guides' },
  { key: 'saved', icon: Bookmark, label: 'Saved Prompts' },
  { key: 'ask', icon: MessageSquare, label: 'Ask AI' },
]

export default function DashboardClient({ profile, stackMap, completedTasks: initialCompleted, savedPrompts: initialSaved, promptFolders: initialFolders }: Props) {
  const [section, setSection] = useState<Section>('tasks')
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

  const firstName = profile.full_name?.split(' ')[0] ?? 'there'
  const tools = profile.tools ?? []
  const toolLevels = profile.tool_levels ?? {}

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
    <div className="flex gap-0 min-h-[calc(100vh-72px)] bg-gray-950">

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-950 border-t border-white/10 flex sm:hidden">
        {NAV_ITEMS.map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setSection(key)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
              section === key ? 'text-emerald-400' : 'text-gray-600'
            }`}>
            <Icon className="w-5 h-5" />
            <span>{label.split(' ')[0]}</span>
          </button>
        ))}
      </nav>

      {/* Sidebar (desktop only) */}
      <aside className="hidden sm:block w-60 shrink-0 border-r border-white/10 pr-4 mr-6">
        <div className="sticky top-24 space-y-1">
          <div className="px-3 py-4 mb-3">
            <p className="font-semibold text-white text-sm truncate">{profile.full_name ?? 'You'}</p>
            <p className="text-xs text-gray-500 truncate mt-0.5">{profile.role ?? 'Your role'}</p>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Stack progress</span>
                <span className="text-emerald-400 font-semibold">{totalDone}/{totalTasks}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #10b981, #f59e0b)' }}
                />
              </div>
            </div>
          </div>

          {NAV_ITEMS.map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setSection(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative overflow-hidden ${
                section === key
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}>
              {section === key && (
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent pointer-events-none" />
              )}
              <Icon className={`w-4 h-4 shrink-0 relative z-10 ${section === key ? 'text-emerald-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
              <span className="relative z-10">{label}</span>
              {key === 'saved' && saved.length > 0 && (
                <span className={`ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full relative z-10 ${section === key ? 'bg-emerald-500/30 text-emerald-300' : 'bg-white/10 text-gray-400'}`}>
                  {saved.length}
                </span>
              )}
            </button>
          ))}

          {tools.length > 0 && (
            <div className="mt-6 px-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Your stack</p>
              <div className="space-y-2">
                {tools.map(t => (
                  <div key={t} className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 truncate">{t}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${LEVEL_COLORS[toolLevels[t] ?? 'never']}`}>
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
      <main className="flex-1 min-w-0 pb-20 sm:pb-8 px-0 sm:px-2">

        {stackMap && section === 'tasks' && (
          <div className="relative overflow-hidden rounded-2xl p-5 text-white mb-6 border border-white/10"
            style={{ background: 'linear-gradient(135deg, #064e3b 0%, #111827 60%, #78350f 100%)' }}>
            <div className="absolute inset-0 opacity-20">
              <div className="dot-grid-3d absolute inset-0" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">AI Stack Map</span>
              </div>
              <p className="text-white/80 text-sm leading-relaxed mb-3">{stackMap.summary}</p>
              <div className="bg-white/10 rounded-xl p-3 border border-white/15 backdrop-blur-sm">
                <p className="text-xs font-semibold text-amber-400 mb-0.5">Workflow tip</p>
                <p className="text-white/80 text-sm">{stackMap.workflow_tip}</p>
              </div>
            </div>
          </div>
        )}

        {/* Daily Tasks */}
        {section === 'tasks' && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white mb-4">Daily Tasks</h2>
            {!stackMap ? (
              <div className="text-center py-12 text-gray-600">No tasks yet — complete onboarding first.</div>
            ) : stackMap.tool_tracks.map((track: ToolTrack) => {
              const done = completed.filter(c => c.tool === track.tool).length
              const isOpen = expanded === track.tool
              return (
                <div key={track.tool}
                  className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden transition-all duration-200 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-900/20 group">
                  <button onClick={() => setExpanded(isOpen ? null : track.tool)} className="w-full text-left px-5 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-semibold text-white">{track.tool}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[toolLevels[track.tool] ?? 'never']}`}>
                          {(toolLevels[track.tool] ?? 'never') === 'never' ? 'New to you' : toolLevels[track.tool]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1">{track.why_this_role}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">{done}/{track.daily_tasks.length}</div>
                        <div className="w-16 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                          <div className="h-1 rounded-full transition-all duration-500"
                            style={{
                              width: `${(done / track.daily_tasks.length) * 100}%`,
                              background: 'linear-gradient(90deg, #10b981, #f59e0b)',
                            }} />
                        </div>
                      </div>
                      {isOpen
                        ? <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 transition-colors" />
                        : <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-white/10 divide-y divide-white/5">
                      {track.daily_tasks.map((task: DailyTask) => {
                        const isDone = isCompleted(track.tool, task.day)
                        const key = `${track.tool}-${task.day}`
                        const alreadySaved = isPromptSaved(task.task)
                        return (
                          <div key={task.day}
                            className={`px-5 py-4 transition-all duration-200 ${isDone ? 'bg-emerald-950/30' : 'hover:bg-white/[0.02]'}`}>
                            <div className="flex items-start gap-3">
                              <button onClick={() => markTaskDone(track.tool, task.day)} disabled={isDone || marking === key}
                                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                                  isDone
                                    ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/30'
                                    : 'border-gray-700 hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-500/20'
                                }`}>
                                {isDone && <CheckCircle className="w-3.5 h-3.5 text-white fill-white" />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className={`text-sm font-semibold ${isDone ? 'text-gray-600 line-through' : 'text-white'}`}>
                                    Day {task.day} — {task.title}
                                  </span>
                                  <span className="flex items-center gap-0.5 text-xs text-gray-600">
                                    <Clock className="w-3 h-3" /> {task.time_minutes}m
                                  </span>
                                </div>
                                <p className={`text-sm leading-relaxed ${isDone ? 'text-gray-600' : 'text-gray-400'}`}>{task.task}</p>
                              </div>
                              <button
                                onClick={() => savePrompt(task.task, `${track.tool} — Day ${task.day}: ${task.title}`, track.tool)}
                                disabled={alreadySaved || savingPrompt === task.task}
                                title={alreadySaved ? 'Saved' : 'Save this prompt'}
                                className={`shrink-0 mt-0.5 p-1.5 rounded-lg transition-all duration-200 ${
                                  alreadySaved
                                    ? 'text-emerald-400 bg-emerald-500/15'
                                    : 'text-gray-600 hover:text-amber-400 hover:bg-amber-500/10'
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

        {/* Tool Guides */}
        {section === 'guides' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white mb-4">Tool Guides</h2>
            {!stackMap ? <div className="text-center py-12 text-gray-600">No guides yet.</div>
              : stackMap.tool_cards.map((card: ToolCard) => (
                <div key={card.tool}
                  className="bg-gray-900 border border-white/10 rounded-2xl p-5 transition-all duration-200 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-900/20">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-white">{card.tool}</h3>
                      <p className="text-xs text-emerald-400 font-medium mt-0.5">{card.tagline}</p>
                    </div>
                    <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs shrink-0">
                      {toolLevels[card.tool] ?? 'never'}
                    </Badge>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-3">
                    <p className="text-xs font-semibold text-amber-400 mb-0.5">vs. your other tools</p>
                    <p className="text-xs text-amber-200/70 leading-relaxed">{card.vs_others}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Best for</p>
                      <ul className="space-y-1">{card.best_for.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-400">
                          <ThumbsUp className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" /> {item}
                        </li>
                      ))}</ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Not great for</p>
                      <ul className="space-y-1">{card.not_great_for.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                          <span className="mt-0.5 shrink-0">✗</span> {item}
                        </li>
                      ))}</ul>
                    </div>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                    <p className="text-xs font-semibold text-emerald-400 mb-0.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Killer use case for {profile.role}
                    </p>
                    <p className="text-xs text-emerald-200/70 leading-relaxed">{card.killer_use_case}</p>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Saved Prompts */}
        {section === 'saved' && (
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="w-full sm:w-48 shrink-0">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 px-1">Folders</p>
              <div className="flex sm:flex-col gap-1.5 sm:gap-0.5 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
                <button onClick={() => setActiveFolder(null)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                    activeFolder === null
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  }`}>
                  <Bookmark className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1 text-left truncate">All prompts</span>
                  <span className={`text-xs font-bold ${activeFolder === null ? 'text-emerald-400' : 'text-gray-600'}`}>{saved.length}</span>
                </button>

                {folders.map(f => (
                  <div key={f.id}>
                    {editingFolderId === f.id ? (
                      <div className="flex gap-1 px-1">
                        <Input value={editFolderName} onChange={(e) => setEditFolderName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') renameFolder(f.id); if (e.key === 'Escape') setEditingFolderId(null) }}
                          autoFocus className="h-8 text-xs bg-gray-800 border-emerald-500/50 text-white focus:ring-emerald-500" />
                        <Button size="sm" onClick={() => renameFolder(f.id)} disabled={!editFolderName.trim()}
                          className="h-8 px-2 bg-emerald-600 hover:bg-emerald-500 shrink-0">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingFolderId(null)}
                          className="h-8 px-2 shrink-0 text-gray-400 hover:text-white">
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div role="button" tabIndex={0} onClick={() => setActiveFolder(f.id)} onKeyDown={(e) => e.key === 'Enter' && setActiveFolder(f.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all group cursor-pointer ${
                          activeFolder === f.id
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                        }`}>
                        {activeFolder === f.id ? <FolderOpen className="w-3.5 h-3.5 shrink-0" /> : <Folder className="w-3.5 h-3.5 shrink-0" />}
                        <span className="flex-1 text-left truncate">{f.name}</span>
                        <span className={`text-xs font-bold ${activeFolder === f.id ? 'text-emerald-400' : 'text-gray-600'}`}>
                          {saved.filter(p => p.folder_id === f.id).length}
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); setEditingFolderId(f.id); setEditFolderName(f.name) }}
                          className={`opacity-0 group-hover:opacity-100 transition-opacity ${activeFolder === f.id ? 'text-emerald-300/60 hover:text-emerald-200' : 'text-gray-600 hover:text-blue-400'}`}>
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteFolder(f.id) }}
                          className={`opacity-0 group-hover:opacity-100 transition-opacity ${activeFolder === f.id ? 'text-emerald-300/60 hover:text-white' : 'text-gray-600 hover:text-red-400'}`}>
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
                      className="h-8 text-xs bg-gray-800 border-emerald-500/50 text-white placeholder:text-gray-600 focus:ring-emerald-500" />
                    <Button size="sm" onClick={createFolder} disabled={creatingFolder || !newFolderName.trim()}
                      className="h-8 px-2 bg-emerald-600 hover:bg-emerald-500 shrink-0">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setShowNewFolder(false); setNewFolderName('') }}
                      className="h-8 px-2 shrink-0 text-gray-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <button onClick={() => setShowNewFolder(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-600 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all mt-1">
                    <FolderPlus className="w-3.5 h-3.5" /> New folder
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">
                  {activeFolder === null ? 'All Prompts' : folders.find(f => f.id === activeFolder)?.name ?? 'Folder'}
                </h2>
                <Button size="sm" onClick={() => setShowManualSave(v => !v)}
                  className="bg-emerald-600 hover:bg-emerald-500 gap-1.5 text-xs shadow-lg shadow-emerald-900/40">
                  <Plus className="w-3.5 h-3.5" /> Add prompt
                </Button>
              </div>

              {showManualSave && (
                <div className="bg-gray-900 border border-emerald-500/30 rounded-2xl p-4 mb-4 space-y-3">
                  <p className="text-sm font-semibold text-emerald-300">Paste a prompt to save</p>
                  <Input placeholder="Label (e.g. 'Write a cold email')" value={manualLabel}
                    onChange={(e) => setManualLabel(e.target.value)}
                    className="bg-gray-800 border-white/10 text-white placeholder:text-gray-600 focus:border-emerald-500/50 text-sm" />
                  <Textarea placeholder="Paste your prompt here…" value={manualContent}
                    onChange={(e) => setManualContent(e.target.value)} rows={3}
                    className="bg-gray-800 border-white/10 text-white placeholder:text-gray-600 focus:border-emerald-500/50 text-sm resize-none" />
                  {folders.length > 0 && (
                    <select value={manualFolder ?? ''} onChange={(e) => setManualFolder(e.target.value || null)}
                      className="w-full text-sm border border-white/10 rounded-lg px-3 py-2 bg-gray-800 text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50">
                      <option value="">No folder</option>
                      {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={saveManualPrompt} disabled={savingManual || !manualContent.trim()}
                      className="bg-emerald-600 hover:bg-emerald-500 text-sm gap-1.5">
                      <Bookmark className="w-3.5 h-3.5" /> {savingManual ? 'Saving…' : 'Save prompt'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setShowManualSave(false); setManualContent(''); setManualLabel('') }}
                      className="border-white/15 text-gray-400 hover:text-white hover:bg-white/5">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {visiblePrompts.length === 0 ? (
                <div className="text-center py-16 bg-gray-900 rounded-2xl border border-dashed border-white/10">
                  <Bookmark className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    {activeFolder !== null ? 'No prompts in this folder yet' : 'No saved prompts yet'}
                  </p>
                  <p className="text-xs text-gray-600 mb-4 max-w-xs mx-auto">
                    {activeFolder !== null
                      ? 'Move prompts here from All Prompts, or add one manually.'
                      : 'Bookmark tasks from Daily Tasks, or paste a prompt using the Add button.'}
                  </p>
                  <Button size="sm" variant="outline" onClick={() => setSection('tasks')}
                    className="gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                    <ArrowRight className="w-3.5 h-3.5" /> Go to Daily Tasks
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {visiblePrompts.map(prompt => (
                    <div key={prompt.id}
                      className="bg-gray-900 border border-white/10 rounded-2xl p-5 transition-all duration-200 group hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-900/20">
                      {editingId === prompt.id ? (
                        <div className="space-y-3">
                          <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
                            placeholder="Label"
                            className="bg-gray-800 border-white/10 text-white placeholder:text-gray-600 focus:border-emerald-500/50 text-sm" />
                          <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                            rows={4}
                            className="bg-gray-800 border-white/10 text-white placeholder:text-gray-600 focus:border-emerald-500/50 text-sm resize-none" />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveEdit(prompt.id)} disabled={savingEdit || !editContent.trim()}
                              className="bg-emerald-600 hover:bg-emerald-500 gap-1.5 text-xs">
                              <CheckCircle className="w-3.5 h-3.5" /> {savingEdit ? 'Saving…' : 'Save'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}
                              className="text-xs border-white/15 text-gray-400 hover:text-white hover:bg-white/5">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <p className="text-sm font-semibold text-white">{prompt.label}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {prompt.tool && <span className="text-xs text-emerald-400 font-medium">{prompt.tool}</span>}
                                {prompt.folder_id && (
                                  <span className="text-xs text-gray-600 flex items-center gap-0.5">
                                    <Folder className="w-3 h-3" /> {folders.find(f => f.id === prompt.folder_id)?.name}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              {folders.length > 0 && (
                                <select
                                  value={prompt.folder_id ?? ''}
                                  onChange={(e) => movePromptToFolder(prompt.id, e.target.value || null)}
                                  className="text-xs border border-white/10 rounded-lg px-2 py-1 bg-gray-800 text-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                                  title="Move to folder">
                                  <option value="">No folder</option>
                                  {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                              )}
                              <button onClick={() => startEdit(prompt)}
                                className="p-1.5 rounded-lg text-gray-600 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="Edit">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => copyPrompt(prompt.content, prompt.id)}
                                className="p-1.5 rounded-lg text-gray-600 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                                {copiedId === prompt.id ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                              </button>
                              <button onClick={() => deletePrompt(prompt.id)}
                                className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-400 leading-relaxed bg-gray-800/60 rounded-xl p-3 border border-white/5">{prompt.content}</p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-gray-600">
                              {new Date(prompt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <button onClick={() => copyPrompt(prompt.content, prompt.id)}
                              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1">
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

        {/* Ask AI */}
        {section === 'ask' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white">Ask AI</h2>
            {chatMessages.length === 0 && (
              <div className="space-y-3">
                <div className="relative overflow-hidden bg-gray-900 border border-white/10 rounded-2xl p-5">
                  <div className="absolute inset-0 opacity-10">
                    <div className="dot-grid-3d absolute inset-0" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-900/50">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Your AI tool coach</p>
                        <p className="text-xs text-gray-500">Knows your stack · Answers for your role</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Ask anything about your tools — which to use, how to write better prompts, or how they compare for your role as a <strong className="text-white">{profile.role}</strong>.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 font-medium">Try asking:</p>
                <div className="grid gap-2">
                  {[
                    `Which of my tools is best for writing a performance review?`,
                    `How do I write a better prompt in ${tools[0] ?? 'Claude'}?`,
                    `What's the difference between ${tools[0] ?? 'Claude'} and ${tools[1] ?? 'ChatGPT'} for my role?`,
                    `What can ${tools[0] ?? 'Claude'} do that I'm probably not using yet?`,
                  ].map(q => (
                    <button key={q} onClick={() => setChatInput(q)}
                      className="text-left text-sm text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl px-4 py-2.5 transition-all duration-200 hover:shadow-md hover:shadow-emerald-900/30">
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
                      msg.role === 'user' ? 'bg-gray-700' : 'bg-emerald-600 shadow-md shadow-emerald-900/50'
                    }`}>
                      {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-gray-300" /> : <Bot className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-sm shadow-lg shadow-emerald-900/40'
                        : 'bg-gray-900 border border-white/10 text-gray-300 rounded-tl-sm'
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
                    <div className="bg-gray-900 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1 items-center h-4">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                rows={2}
                className="resize-none bg-gray-900 border-white/10 text-white placeholder:text-gray-600 focus:border-emerald-500/50 text-sm" />
              <Button onClick={sendMessage} disabled={chatLoading || !chatInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 h-10 w-10 p-0 shrink-0 shadow-lg shadow-emerald-900/40 disabled:opacity-30">
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-600 text-center">Answers tailored to your role and your specific tools</p>
          </div>
        )}

        <div className="text-center pt-8 mt-8 border-t border-white/10">
          <p className="text-xs text-gray-600 mb-2">Added new tools to your stack?</p>
          <Button variant="outline" size="sm"
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
            onClick={() => window.location.href = '/onboarding'}>
            <ArrowRight className="w-3.5 h-3.5" /> Update my stack
          </Button>
        </div>
      </main>
    </div>
  )
}
