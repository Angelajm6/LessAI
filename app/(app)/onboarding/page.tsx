'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight, ArrowLeft, Sparkles, Building2, X, Plus, CheckCircle, Zap, BarChart2, BookOpen, RefreshCw, Globe, Loader2 } from 'lucide-react'

const ROLE_CATEGORIES = [
  {
    category: 'Business & Sales',
    roles: [
      { label: 'Sales Representative', emoji: '💼' },
      { label: 'Account Executive', emoji: '🤝' },
      { label: 'Customer Success Manager', emoji: '🌟' },
      { label: 'Marketing Manager', emoji: '📣' },
      { label: 'Operations Manager', emoji: '⚙️' },
      { label: 'Executive / Leadership', emoji: '🎯' },
    ],
  },
  {
    category: 'Creative & Content',
    roles: [
      { label: 'Content Creator', emoji: '✍️' },
      { label: 'Copywriter', emoji: '📝' },
      { label: 'Social Media Manager', emoji: '📱' },
      { label: 'Graphic Designer', emoji: '🎨' },
      { label: 'Video Producer', emoji: '🎬' },
    ],
  },
  {
    category: 'Tech & Product',
    roles: [
      { label: 'Software Engineer', emoji: '💻' },
      { label: 'Product Manager', emoji: '🗂️' },
      { label: 'Data Analyst', emoji: '📊' },
      { label: 'UX / Product Designer', emoji: '🖌️' },
    ],
  },
  {
    category: 'People & Admin',
    roles: [
      { label: 'HR Manager', emoji: '👥' },
      { label: 'Recruiter', emoji: '🔍' },
      { label: 'Executive Assistant', emoji: '📅' },
      { label: 'Project Manager', emoji: '📋' },
    ],
  },
  {
    category: 'Healthcare & Wellness',
    roles: [
      { label: 'Healthcare Administrator', emoji: '🏥' },
      { label: 'Nurse / Clinical Staff', emoji: '🩺' },
      { label: 'Therapist / Counselor', emoji: '🧠' },
      { label: 'Wellness Coach', emoji: '💪' },
    ],
  },
  {
    category: 'Education',
    roles: [
      { label: 'Teacher / Educator', emoji: '📚' },
      { label: 'Instructional Designer', emoji: '🎓' },
      { label: 'School Administrator', emoji: '🏫' },
    ],
  },
  {
    category: 'Finance & Legal',
    roles: [
      { label: 'Financial Analyst', emoji: '📈' },
      { label: 'Accountant', emoji: '🧾' },
      { label: 'Legal Counsel / Paralegal', emoji: '⚖️' },
      { label: 'Compliance Officer', emoji: '🔒' },
    ],
  },
  {
    category: 'Real Estate & Construction',
    roles: [
      { label: 'Real Estate Agent', emoji: '🏡' },
      { label: 'Property Manager', emoji: '🏢' },
      { label: 'Architect', emoji: '📐' },
      { label: 'Interior Designer', emoji: '🛋️' },
      { label: 'Construction Manager', emoji: '🔨' },
    ],
  },
  {
    category: 'Nonprofit & Government',
    roles: [
      { label: 'Nonprofit Program Manager', emoji: '❤️' },
      { label: 'Grant Writer', emoji: '📜' },
      { label: 'Policy Analyst', emoji: '🏛️' },
    ],
  },
  {
    category: 'Founders & Freelancers',
    roles: [
      { label: 'Founder / Entrepreneur', emoji: '🚀' },
      { label: 'Freelancer / Consultant', emoji: '🧩' },
    ],
  },
]

const PRESET_ROLES = ROLE_CATEGORIES.flatMap(c => c.roles)

const PRESET_TOOLS = [
  'ChatGPT', 'Claude', 'Gemini', 'Microsoft Copilot', 'Perplexity',
  'Notion AI', 'GitHub Copilot', 'Grammarly', 'Canva AI', 'Google Workspace AI',
  'Midjourney', 'DALL-E', 'Grok', 'Meta AI', 'Cursor',
  'Runway', 'HeyGen', 'ElevenLabs', 'Jasper', 'Copy.ai',
  'Otter.ai', 'Fireflies.ai', 'HubSpot AI', 'Salesforce Einstein', 'Zapier AI',
]

const LEVELS = [
  { value: 'never', label: 'Never used', desc: "Haven't touched it", color: 'border-gray-200 bg-gray-50 text-gray-600', activeColor: 'border-gray-400 bg-gray-100 text-gray-800 ring-2 ring-gray-300' },
  { value: 'learning', label: 'Learning', desc: 'Used it a few times', color: 'border-amber-200 bg-amber-50 text-amber-700', activeColor: 'border-amber-400 bg-amber-100 text-amber-800 ring-2 ring-amber-300' },
  { value: 'comfortable', label: 'Comfortable', desc: 'Use it regularly', color: 'border-emerald-200 bg-emerald-50 text-emerald-700', activeColor: 'border-emerald-500 bg-emerald-100 text-emerald-800 ring-2 ring-emerald-400' },
]

const STEP_LABELS = ['Your role', 'Your company', 'Your AI tools', 'Skill levels']

function RoleButton({ label, emoji, customText, selected, disabled, onToggle, fullWidth }: {
  label: string; emoji: string; customText?: string; selected: boolean
  disabled: boolean; onToggle: (label: string) => void; fullWidth?: boolean
}) {
  return (
    <button
      onClick={() => onToggle(label)}
      disabled={disabled}
      className={`${fullWidth ? 'w-full' : ''} text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2.5 ${
        selected
          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-100'
          : disabled
            ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
            : 'bg-white/80 text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 backdrop-blur-sm'
      }`}
    >
      <span className="text-lg">{emoji}</span>
      <span className="flex-1">{customText ?? label}</span>
      {selected && <CheckCircle className="w-3.5 h-3.5 shrink-0 opacity-80" />}
    </button>
  )
}

function OnboardingFlow() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const updateStackMode = searchParams.get('from') === 'stack'
  const [step, setStep] = useState(1)
  const [roles, setRoles] = useState<string[]>([])
  const [customRole, setCustomRole] = useState('')
  const [company, setCompany] = useState('')
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [customTool, setCustomTool] = useState('')
  const [toolLevels, setToolLevels] = useState<Record<string, string>>({})
  const [website, setWebsite] = useState('')
  const [scraping, setScraping] = useState(false)
  const [companySummary, setCompanySummary] = useState<string | null>(null)
  const [scrapeError, setScrapeError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [prefillLoading, setPrefillLoading] = useState(updateStackMode)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setPrefillLoading(false); return }

      if (!updateStackMode) {
        // Fresh signup — prefill company name from account creation metadata
        const meta = user.user_metadata ?? {}
        if (meta.company_name) setCompany(meta.company_name as string)
        return
      }

      supabase.from('profiles').select('role, company_name, company_website, tools, tool_levels').eq('id', user.id).single()
        .then(({ data }) => {
          if (data) {
            if (data.role) {
              const parts = (data.role as string).split(',').map((s: string) => s.trim()).filter(Boolean)
              const presetParts = parts.filter(p => PRESET_ROLES.some(r => r.label === p))
              const customParts = parts.filter(p => !PRESET_ROLES.some(r => r.label === p))
              const newRoles = [...presetParts, ...(customParts.length ? ['Other'] : [])]
              setRoles(newRoles)
              if (customParts.length) setCustomRole(customParts.join(', '))
            }
            if (data.company_name) setCompany(data.company_name)
            if (data.company_website) setWebsite(data.company_website)
            if (Array.isArray(data.tools)) setSelectedTools(data.tools)
            if (data.tool_levels && typeof data.tool_levels === 'object') setToolLevels(data.tool_levels as Record<string, string>)
          }
          setPrefillLoading(false)
        })
    })
  }, [updateStackMode])

  function toggleRole(label: string) {
    setRoles(prev => {
      if (prev.includes(label)) return prev.filter(r => r !== label)
      if (prev.length >= 3) return prev
      return [...prev, label]
    })
  }

  const selectedRole = roles
    .map(r => r === 'Other' ? customRole.trim() : r)
    .filter(Boolean)
    .join(', ')

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

  async function scrapeWebsite() {
    if (!website.trim()) return
    setScraping(true)
    setScrapeError('')
    setCompanySummary(null)
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: website.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not read that website')
      setCompanySummary(data.summary)
    } catch (e) {
      setScrapeError(e instanceof Error ? e.message : 'Could not read that website — you can still continue without it.')
    }
    setScraping(false)
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
        full_name: user.user_metadata?.full_name ?? null,
        role: selectedRole,
        company_name: company.trim() || null,
        company_website: website.trim() || null,
        company_summary: companySummary || null,
        tools: selectedTools,
        tool_levels: toolLevels,
        onboarded: false,
      }, { onConflict: 'id' })

      const res = await fetch('/api/ai/generate-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole, company: company.trim() || null, companySummary: companySummary || null, tools: selectedTools, toolLevels }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? `Generation failed (${res.status})`)
      }

      router.push('/dashboard?section=workflows&from=onboarding')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setGenerating(false)
    }
  }

  // ── Pre-fill loading state ────────────────────────────────────────────────
  if (prefillLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-sm text-gray-400">Loading your existing stack…</p>
      </div>
    )
  }

  // ── Full-screen loading overlay ──────────────────────────────────────────
  if (generating) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col items-center justify-center overflow-hidden">
        {/* 3D line grid */}
        <div className="line-grid-3d absolute inset-0" />

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute top-1/2 right-1/3 w-32 h-32 rounded-full bg-teal-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 text-center px-6 max-w-lg mx-auto">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-6 mx-auto shadow-xl shadow-emerald-900/40 animate-pulse-glow">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          {/* Label */}
          <div className="flex items-center gap-2 justify-center mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{updateStackMode ? 'Rebuilding your AI stack' : 'Building your AI stack'}</span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl font-black text-white mb-3 leading-tight">
            {updateStackMode ? <>Rebuilding your{' '}<span className="bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">prompt playbook</span></> : <>Creating your{' '}<span className="bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">personal playbook</span></>}
          </h2>
          <p className="text-gray-400 text-sm mb-3 max-w-xs mx-auto leading-relaxed">
            Tailoring{' '}
            <strong className="text-gray-200">{selectedTools.length} tool{selectedTools.length !== 1 ? 's' : ''}</strong>{' '}
            to how a <strong className="text-gray-200">{selectedRole}</strong> actually works
            {companySummary ? <> at <strong className="text-emerald-400">{company || 'your company'}</strong></> : ''}.
          </p>
          <p className="text-amber-400/80 text-xs font-medium mb-8">⏱ This takes 2–4 minutes — don&apos;t close this tab.</p>

          {/* Progress bar */}
          <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden mx-auto mb-8">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-400"
              style={{ animation: 'onboarding-progress 180s ease-in-out forwards' }} />
          </div>

          {/* Stage cards */}
          <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
            {[
              { icon: BarChart2, label: 'Comparing your tools', delay: '0s' },
              { icon: BookOpen, label: 'Writing frameworks', delay: '8s' },
              { icon: Zap, label: 'Tailoring to your role', delay: '16s' },
            ].map(({ icon: Icon, label, delay }, i) => (
              <div key={i} className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-3.5 text-center"
                style={{ animation: `stage-appear 0.5s ease forwards`, animationDelay: delay, opacity: i === 0 ? 1 : 0 }}>
                <Icon className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs text-gray-400 leading-snug">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes onboarding-progress { from { width: 0% } to { width: 92% } }
          @keyframes stage-appear { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        `}</style>
      </div>
    )
  }

  return (
    <>
      {/* ── Fixed background — visible across all steps ── */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-emerald-50/50" />
        {/* Floating orbs */}
        <div className="absolute top-24 left-[10%] w-64 h-64 rounded-full bg-emerald-400/[0.07] blur-3xl animate-float-slow" />
        <div className="absolute bottom-20 right-[8%] w-48 h-48 rounded-full bg-amber-400/[0.07] blur-3xl animate-float" />
        <div className="absolute top-1/2 right-[20%] w-32 h-32 rounded-full bg-teal-400/[0.06] blur-2xl" />
        {/* Subtle dot grid */}
        <div className="dot-grid-3d absolute inset-0 opacity-30" />
      </div>

      <div className="max-w-xl mx-auto">

        {/* Progress stepper */}
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
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-1 rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / 3) * 100}%`, background: 'linear-gradient(90deg, #10b981, #f59e0b)' }} />
          </div>
        </div>

        {/* Step 1 — Role */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-5">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-1">{updateStackMode ? 'Update stack · Step 1 of 4' : 'Step 1 of 4'}</p>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{updateStackMode ? 'Update your role' : "What's your role?"}</h1>
              <p className="text-gray-500 text-sm">{updateStackMode ? 'Changed roles or want to refocus? Update here and we\'ll rebuild your entire stack around it.' : 'Your prompt playbook is built around your role — pick up to 3 that describe you best.'}</p>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                roles.length === 3 ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}>
                {roles.length} / 3 selected
              </span>
              {roles.length === 3 && <span className="text-xs text-emerald-600 font-medium">Maximum reached</span>}
            </div>

            <div className="space-y-4 mb-4">
              {ROLE_CATEGORIES.map(({ category, roles: categoryRoles }) => (
                <div key={category}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">{category}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {categoryRoles.map(({ label, emoji }) => (
                      <RoleButton
                        key={label}
                        label={label}
                        emoji={emoji}
                        selected={roles.includes(label)}
                        disabled={roles.length >= 3 && !roles.includes(label)}
                        onToggle={toggleRole}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <RoleButton
                label="Other"
                emoji="✏️"
                customText="Other — type your role"
                selected={roles.includes('Other')}
                disabled={roles.length >= 3 && !roles.includes('Other')}
                onToggle={toggleRole}
                fullWidth
              />
            </div>

            {roles.includes('Other') && (
              <div className="mb-4">
                <Input placeholder="e.g. Growth Hacker, Founder, Legal Counsel"
                  value={customRole} onChange={(e) => setCustomRole(e.target.value)}
                  className="border-emerald-200 focus:ring-emerald-400 bg-white/80 backdrop-blur-sm" autoFocus />
              </div>
            )}

            <Button onClick={() => setStep(2)} disabled={roles.length === 0 || (roles.includes('Other') && !customRole.trim())}
              className="bg-emerald-600 hover:bg-emerald-700 gap-2 h-11 px-6 shadow-md shadow-emerald-100">
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step 2 — Company */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-6">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-1">{updateStackMode ? 'Update stack · Step 2 of 4' : 'Step 2 of 4'}</p>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{updateStackMode ? 'Update your company details' : 'Tell us about your company'}</h1>
              <p className="text-gray-500 text-sm">We&apos;ll read your website to make every task, prompt, and example specific to your actual business.</p>
            </div>

            <div className="space-y-4 mb-6">
              {/* Company name */}
              <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-5 shadow-sm">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 text-gray-400" /> Company name <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <Input placeholder="e.g. Acme Corp, Notion, Shopify"
                  value={company} onChange={(e) => setCompany(e.target.value)}
                  className="border-gray-200 focus:ring-emerald-400 bg-white" />
              </div>

              {/* Website */}
              <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-5 shadow-sm">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Globe className="w-4 h-4 text-emerald-500" /> Company website <span className="text-gray-400 font-normal">(optional but recommended)</span>
                </label>
                <p className="text-xs text-gray-400 mb-3">We&apos;ll scrape it to understand your niche, customers, and product — so your tasks feel like they were written for you.</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. acmecorp.com"
                    value={website}
                    onChange={(e) => { setWebsite(e.target.value); setCompanySummary(null); setScrapeError('') }}
                    onKeyDown={(e) => e.key === 'Enter' && scrapeWebsite()}
                    className="border-gray-200 focus:ring-emerald-400 bg-white"
                  />
                  <Button
                    variant="outline"
                    onClick={scrapeWebsite}
                    disabled={!website.trim() || scraping}
                    className="shrink-0 border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-1.5 bg-white/80"
                  >
                    {scraping ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Reading…</> : <><Globe className="w-3.5 h-3.5" /> Read site</>}
                  </Button>
                </div>

                {scrapeError && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">⚠️ {scrapeError}</p>
                )}

                {companySummary && (
                  <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-700">Got it! Here&apos;s what we learned:</span>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">{companySummary}</p>
                    <button onClick={() => { setCompanySummary(null); setWebsite('') }} className="text-xs text-emerald-500 hover:text-emerald-700 mt-1.5 underline underline-offset-2">
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5 h-11 bg-white/80">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button onClick={() => setStep(3)} className="bg-emerald-600 hover:bg-emerald-700 gap-2 h-11 px-6 shadow-md shadow-emerald-100">
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
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-1">{updateStackMode ? 'Update stack · Step 3 of 4' : 'Step 3 of 4'}</p>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{updateStackMode ? 'Update your AI tools' : 'Which AI tools does your company give you?'}</h1>
              <p className="text-gray-500 text-sm">{updateStackMode ? 'Add new tools, remove old ones, or swap out the whole list.' : "Select all of them — even ones you've barely touched. That's exactly what LessAI is here to fix."}</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              {PRESET_TOOLS.map((tool) => {
                const selected = selectedTools.includes(tool)
                return (
                  <button key={tool} onClick={() => toggleTool(tool)}
                    className={`px-3.5 py-1.5 rounded-full border text-sm font-medium transition-all flex items-center gap-1.5 ${
                      selected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white/80 text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 backdrop-blur-sm'
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
                className="border-gray-200 focus:ring-emerald-400 bg-white/80 backdrop-blur-sm" />
              <Button variant="outline" onClick={addCustomTool} disabled={!customTool.trim()} className="shrink-0 gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-white/80">
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>

            {selectedTools.length > 0 && (
              <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-3 mb-5 backdrop-blur-sm">
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
              <Button variant="outline" onClick={() => setStep(2)} className="gap-1.5 h-11 bg-white/80">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button onClick={() => setStep(4)} disabled={selectedTools.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 gap-2 h-11 px-6 shadow-md shadow-emerald-100">
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4 — Skill levels */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-6">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-1">{updateStackMode ? 'Update stack · Step 4 of 4' : 'Step 4 of 4'}</p>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">How well do you know each tool?</h1>
              <p className="text-gray-500 text-sm">{updateStackMode ? 'Update your skill levels — your tasks will be re-calibrated to match.' : 'Be honest — this sets the complexity of your prompt frameworks and daily tasks.'}</p>
            </div>

            <div className="space-y-3 mb-8">
              {selectedTools.map(tool => (
                <div key={tool} className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-4 shadow-sm hover:border-emerald-100 transition-colors">
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
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-3">
                <span className="text-red-500 mt-0.5 text-base">✕</span>
                <div className="flex-1">
                  <p className="text-sm text-red-700 font-medium mb-0.5">Something went wrong</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
                <button onClick={() => { setError(''); handleGenerate() }}
                  className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 shrink-0 mt-0.5 font-medium">
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setStep(3)} className="gap-1.5 h-11 bg-white/80">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button onClick={handleGenerate} disabled={generating}
                className="bg-emerald-600 hover:bg-emerald-700 gap-2 h-11 px-6 shadow-md shadow-emerald-100">
                <Sparkles className="w-4 h-4" /> {updateStackMode ? 'Rebuild my stack' : 'Build my prompt playbook'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingFlow />
    </Suspense>
  )
}
