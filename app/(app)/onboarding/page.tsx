'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight, ArrowLeft, Sparkles, Building2, X, Plus, CheckCircle, Zap, BarChart2, BookOpen } from 'lucide-react'

const PRESET_ROLES = [
  { label: 'Marketing Manager', emoji: '📣' },
  { label: 'Sales Representative', emoji: '💼' },
  { label: 'Customer Success', emoji: '🤝' },
  { label: 'Product Manager', emoji: '🗂️' },
  { label: 'Software Engineer', emoji: '💻' },
  { label: 'Data Analyst', emoji: '📊' },
  { label: 'HR Manager', emoji: '👥' },
  { label: 'Operations Manager', emoji: '⚙️' },
  { label: 'Content Creator', emoji: '✍️' },
  { label: 'Executive / Leadership', emoji: '🎯' },
]

const PRESET_TOOLS = [
  'Claude', 'ChatGPT', 'Gemini', 'Microsoft Copilot', 'Perplexity',
  'Notion AI', 'GitHub Copilot', 'Grammarly', 'Midjourney', 'DALL-E',
  'Runway', 'HeyGen', 'ElevenLabs', 'Jasper', 'Copy.ai',
  'Otter.ai', 'Fireflies.ai', 'HubSpot AI', 'Salesforce Einstein', 'Zapier AI',
]

const LEVELS = [
  { value: 'never', label: 'Never used', desc: 'Haven\'t touched it', color: 'border-gray-200 bg-gray-50 text-gray-600', activeColor: 'border-gray-400 bg-gray-100 text-gray-800 ring-2 ring-gray-300' },
  { value: 'learning', label: 'Learning', desc: 'Used it a few times', color: 'border-amber-200 bg-amber-50 text-amber-700', activeColor: 'border-amber-400 bg-amber-100 text-amber-800 ring-2 ring-amber-300' },
  { value: 'comfortable', label: 'Comfortable', desc: 'Use it regularly', color: 'border-emerald-200 bg-emerald-50 text-emerald-700', activeColor: 'border-emerald-500 bg-emerald-100 text-emerald-800 ring-2 ring-emerald-400' },
]

const STEP_LABELS = ['Your role', 'Your company', 'Your AI tools', 'Skill levels']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('')
  const [customRole, setCustomRole] = useState('')
  const [company, setCompany] = useState('')
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [customTool, setCustomTool] = useState('')
  const [toolLevels, setToolLevels] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const selectedRole = role === 'Other' ? customRole : role

  function toggleTool(tool: string) {
    setSelectedTools(prev =>
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    )
    if (!toolLevels[tool]) setToolLevels(prev => ({ ...prev, [tool]: 'never' }))
  }

  function addCustomTool() {
    const t = customTool.trim()
    if (!t || selectedTools.includes(t)) return
    setSelectedTools(prev => [...prev, t])
    setToolLevels(prev => ({ ...prev, [t]: 'never' }))
    setCustomTool('')
  }

  async function handleGenerate() {
    setGenerating(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Session expired — please sign in again.'); setGenerating(false); return }

      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email ?? '',
        role: selectedRole,
        company_name: company.trim() || null,
        tools: selectedTools,
        tool_levels: toolLevels,
        onboarded: false,
      }, { onConflict: 'id' })

      const res = await fetch('/api/ai/generate-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole, company: company.trim() || null, tools: selectedTools, toolLevels }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? `Generation failed (${res.status})`)
      }

      await supabase.from('profiles').update({ onboarded: true }).eq('id', user.id)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setGenerating(false)
    }
  }

  // Loading screen
  if (generating) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-200 animate-pulse">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Building your prompt playbook</h2>
        <p className="text-gray-500 mb-8 max-w-sm">
          Creating role-specific frameworks for <span className="font-semibold text-emerald-600">{selectedTools.length} tools</span> as a <span className="font-semibold text-emerald-600">{selectedRole}</span>… this takes about 15 seconds.
        </p>
        <div className="w-64 h-1.5 bg-gray-100 rounded-full overflow-hidden mb-8">
          <div className="h-full bg-emerald-500 rounded-full animate-[loading_15s_ease-in-out_forwards]" style={{ animation: 'progress 15s ease-in-out forwards' }} />
        </div>
        <div className="grid grid-cols-3 gap-3 max-w-sm w-full px-4">
          {[
            { icon: BarChart2, label: 'Comparing your tools' },
            { icon: BookOpen, label: 'Writing prompt frameworks' },
            { icon: Zap, label: 'Tailoring to your role' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-xl p-3 text-center shadow-sm">
              <Icon className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
        <style>{`
          @keyframes progress {
            from { width: 0% }
            to { width: 95% }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto">

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          {STEP_LABELS.map((label, i) => {
            const s = i + 1
            const done = step > s
            const active = step === s
            return (
              <div key={s} className="flex flex-col items-center gap-1.5 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  done ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                  : active ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                  : 'bg-gray-100 text-gray-400'
                }`}>
                  {done ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                <span className={`text-xs font-medium hidden sm:block transition-colors ${active ? 'text-emerald-700' : done ? 'text-gray-500' : 'text-gray-300'}`}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
        <div className="h-1 bg-gray-100 rounded-full">
          <div className="h-1 bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${((step - 1) / 3) * 100}%` }} />
        </div>
      </div>

      {/* Step 1 — Role */}
      {step === 1 && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="mb-6">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-1">Step 1 of 4</p>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">What&apos;s your role?</h1>
            <p className="text-gray-500 text-sm">Your prompt playbook is built around your role — a PM and a marketer should use AI very differently.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {PRESET_ROLES.map(({ label, emoji }) => (
              <button key={label} onClick={() => setRole(label)}
                className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2.5 ${
                  role === label
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-100'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                }`}>
                <span className="text-lg">{emoji}</span>
                {label}
              </button>
            ))}
            <button onClick={() => setRole('Other')}
              className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2.5 ${
                role === 'Other' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
              }`}>
              <span className="text-lg">✏️</span> Other…
            </button>
          </div>

          {role === 'Other' && (
            <div className="mb-4">
              <Input placeholder="e.g. Growth Hacker, Founder, Legal Counsel"
                value={customRole} onChange={(e) => setCustomRole(e.target.value)}
                className="border-emerald-200 focus:ring-emerald-400" autoFocus />
            </div>
          )}

          <Button onClick={() => setStep(2)} disabled={!role || (role === 'Other' && !customRole.trim())}
            className="bg-emerald-600 hover:bg-emerald-700 gap-2 h-11 px-6">
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Step 2 — Company */}
      {step === 2 && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="mb-6">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-1">Step 2 of 4</p>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Where do you work?</h1>
            <p className="text-gray-500 text-sm">Helps us understand your industry and context. Totally optional.</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Building2 className="w-4 h-4 text-gray-400" /> Company name
            </label>
            <Input placeholder="e.g. Acme Corp, Notion, Shopify"
              value={company} onChange={(e) => setCompany(e.target.value)}
              className="border-gray-200 focus:ring-emerald-400"
              onKeyDown={(e) => e.key === 'Enter' && setStep(3)} />
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5 h-11">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={() => setStep(3)} className="bg-emerald-600 hover:bg-emerald-700 gap-2 h-11 px-6">
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
            <button onClick={() => setStep(3)} className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2">
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Tools */}
      {step === 3 && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="mb-6">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-1">Step 3 of 4</p>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Which AI tools does your company give you?</h1>
            <p className="text-gray-500 text-sm">Select all of them — even ones you&apos;ve barely touched. That&apos;s exactly what LessAI is here to fix.</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {PRESET_TOOLS.map((tool) => {
              const selected = selectedTools.includes(tool)
              return (
                <button key={tool} onClick={() => toggleTool(tool)}
                  className={`px-3.5 py-1.5 rounded-full border text-sm font-medium transition-all flex items-center gap-1.5 ${
                    selected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50'
                  }`}>
                  {selected && <CheckCircle className="w-3.5 h-3.5" />}
                  {tool}
                </button>
              )
            })}
          </div>

          <div className="flex gap-2 mb-5">
            <Input placeholder="Add another tool…" value={customTool}
              onChange={(e) => setCustomTool(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomTool()}
              className="border-gray-200 focus:ring-emerald-400" />
            <Button variant="outline" onClick={addCustomTool} disabled={!customTool.trim()} className="shrink-0 gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>

          {selectedTools.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-5">
              <p className="text-xs text-emerald-600 font-semibold mb-2">{selectedTools.length} tool{selectedTools.length > 1 ? 's' : ''} selected</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedTools.map(t => (
                  <span key={t} className="flex items-center gap-1 bg-white border border-emerald-200 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    {t}
                    <button onClick={() => setSelectedTools(prev => prev.filter(x => x !== t))} className="text-emerald-400 hover:text-red-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-1.5 h-11">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={() => setStep(4)} disabled={selectedTools.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 gap-2 h-11 px-6">
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4 — Skill levels */}
      {step === 4 && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="mb-6">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-1">Step 4 of 4</p>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">How well do you know each tool?</h1>
            <p className="text-gray-500 text-sm">Be honest — this sets the complexity of your prompt frameworks and daily tasks.</p>
          </div>

          <div className="space-y-3 mb-8">
            {selectedTools.map(tool => (
              <div key={tool} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="font-semibold text-gray-900 mb-3 text-sm">{tool}</div>
                <div className="grid grid-cols-3 gap-2">
                  {LEVELS.map(level => {
                    const active = toolLevels[tool] === level.value
                    return (
                      <button key={level.value}
                        onClick={() => setToolLevels(prev => ({ ...prev, [tool]: level.value }))}
                        className={`py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all text-center ${active ? level.activeColor : level.color + ' hover:opacity-80'}`}>
                        {level.label}
                        <div className={`text-xs font-normal mt-0.5 ${active ? 'opacity-80' : 'opacity-60'}`}>{level.desc}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
              <span className="text-red-500 mt-0.5">✕</span>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setStep(3)} className="gap-1.5 h-11">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={handleGenerate} disabled={generating}
              className="bg-emerald-600 hover:bg-emerald-700 gap-2 h-11 px-6 shadow-md shadow-emerald-100">
              <Sparkles className="w-4 h-4" /> Build my prompt playbook
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
