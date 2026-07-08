'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Zap, BarChart3, Sparkles, Brain, Target, TrendingUp, Shield, BookOpen, MessageSquare, Mail, FlaskConical, Globe, Flame, Users } from 'lucide-react'

/* ─── Logo ─────────────────────────────────────────────────────────── */
function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <img src="/logo.svg" alt="LessAI" width={size} height={size} className="shrink-0" style={{ width: size, height: size }} />
  )
}

/* ─── Particle field ────────────────────────────────────────────────── */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    if (!ctx) return

    let animId: number
    let W = window.innerWidth
    let H = window.innerHeight
    canvas.width = W
    canvas.height = H

    const N = Math.min(70, Math.floor((W * H) / 14000))
    const COLORS = ['16,185,129', '16,185,129', '52,211,153', '20,184,166']

    const particles = Array.from({ length: N }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.4 + 0.8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      baseOpacity: Math.random() * 0.12 + 0.06,
    }))

    const REPEL = 160, LINK = 120

    function draw() {
      ctx.clearRect(0, 0, W, H)
      const mx = mouseRef.current.x, my = mouseRef.current.y

      for (const p of particles) {
        const dx = p.x - mx, dy = p.y - my
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d < REPEL && d > 1) { const f = (1 - d / REPEL) * 2.8; p.vx += (dx / d) * f; p.vy += (dy / d) * f }
        p.vx *= 0.93; p.vy *= 0.93; p.x += p.vx; p.y += p.vy
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20
      }

      if (mx > 0) {
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, REPEL)
        g.addColorStop(0, 'rgba(16,185,129,0.04)'); g.addColorStop(1, 'rgba(16,185,129,0)')
        ctx.beginPath(); ctx.arc(mx, my, REPEL, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill()
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < LINK) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(16,185,129,${(1 - d / LINK) * 0.10})`; ctx.lineWidth = 0.5; ctx.stroke()
          }
        }
      }

      for (const p of particles) {
        const dx = p.x - mx, dy = p.y - my
        const d = Math.sqrt(dx * dx + dy * dy)
        const near = d < 180 ? (1 - d / 180) : 0
        const opacity = Math.min(0.6, p.baseOpacity + near * 0.3)
        const radius = p.r + near * 1.5
        if (near > 0.15) {
          const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 3.5)
          halo.addColorStop(0, `rgba(${p.color},${near * 0.12})`); halo.addColorStop(1, `rgba(${p.color},0)`)
          ctx.beginPath(); ctx.arc(p.x, p.y, radius * 3.5, 0, Math.PI * 2); ctx.fillStyle = halo; ctx.fill()
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.color},${opacity})`; ctx.fill()
      }

      animId = requestAnimationFrame(draw)
    }

    draw()
    const onMouse = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY } }
    const onResize = () => { W = window.innerWidth; H = window.innerHeight; canvas.width = W; canvas.height = H }
    window.addEventListener('mousemove', onMouse)
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('mousemove', onMouse); window.removeEventListener('resize', onResize) }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: -1 }} />
}

/* ─── Hooks ─────────────────────────────────────────────────────────── */
function useCounter(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number
    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      setCount(Math.floor((1 - Math.pow(1 - progress, 3)) * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [start, target, duration])
  return count
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    obs.observe(el); return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

/* ─── Data ──────────────────────────────────────────────────────────── */
const stats = [
  { value: 70, suffix: '%', label: 'of employees have received zero formal AI training — yet executives keep buying more tools', source: 'Slack Workforce Index, 2024', href: 'https://slack.com/blog/news/the-workforce-index-june-2024' },
  { value: 40, suffix: '%', label: 'of AI time savings are lost to rework — fixing bad outputs nobody knew how to avoid', source: 'Workday, 2025', href: 'https://investor.workday.com/news-and-events/press-releases/news-details/2026/New-Workday-Research-Companies-Are-Leaving-AI-Gains-on-the-Table/default.aspx' },
  { value: 95, suffix: '%', label: 'of AI pilots produce no measurable business impact — the gap is skill, not tooling', source: 'MIT NANDA, 2025', href: 'https://fortune.com/2025/08/18/mit-report-95-percent-generative-ai-pilots-at-companies-failing-cfo/' },
]

const logos = ['Claude', 'ChatGPT', 'Gemini', 'Copilot', 'Notion AI', 'Perplexity', 'GitHub Copilot', 'Grammarly', 'Midjourney', 'HeyGen', 'Runway', 'Salesforce AI']

const steps = [
  { icon: Target, title: 'Tell us your role, tools, and company', desc: 'You\'re a Content Marketer with ChatGPT, Notion AI, and Grammarly. We scrape your company website to understand your niche — every task and prompt is built around your actual business.' },
  { icon: BookOpen, title: 'Get your personalized prompt playbook', desc: 'Role-specific prompt frameworks for every tool in your stack — what context to include, how to structure your ask, and the exact phrasing that gets great outputs for your job.' },
  { icon: Zap, title: 'Practice daily, track your progress', desc: 'One 10-min task per tool per day. Earn XP, build streaks, and watch your skill heatmap fill up. Use Prompt Lab to paste any prompt and instantly see how to make it sharper.' },
  { icon: BarChart3, title: 'Manager sees who\'s leveling up', desc: 'The admin dashboard shows XP, streaks, and task completion by person and tool. See skill gaps, spot who needs coaching, and prove AI ROI with real data — not surveys.' },
]

const features = [
  { icon: MessageSquare, title: 'Role-based prompt coaching', description: 'How a PM prompts Claude for a PRD is nothing like how a marketer prompts for a campaign. LessAI gives you the exact frameworks for your job — not generic advice.' },
  { icon: FlaskConical, title: 'Prompt Lab', description: 'Paste any prompt — get an AI-rewritten version scored on Specificity, Context, and Output Clarity before and after. See exactly what changed and why.', highlight: true },
  { icon: Zap, title: 'Daily 10-minute tasks', description: 'One task per tool per day, matched to your skill level. Earn XP, build a streak, and watch your heatmap fill up. 10 minutes of real practice beats any workshop.' },
  { icon: Globe, title: 'Company website context', description: 'We scrape your company URL to understand your industry and product. Every task, prompt, and use case references your actual business — not a made-up example.' },
  { icon: Brain, title: 'Tool comparison guides', description: 'Claude, ChatGPT, Gemini, and Copilot are not interchangeable. LessAI teaches exactly when to use which — so you use the right tool for each job.' },
  { icon: Flame, title: 'Progress tracking', description: 'XP, streaks, a 30-day activity heatmap, per-tool breakdowns, and milestone badges. Plus a weekly email digest every Monday with your next suggested task.' },
  { icon: BookOpen, title: 'Saved prompts + folders', description: 'Save any prompt to your personal library, organize by folder, and access it anywhere. Every prompt from the Lab or Command Center is one click away.' },
  { icon: BarChart3, title: 'Team skill dashboard', description: 'Managers see XP, streaks, and completion by person and tool. Spot skill gaps, identify who needs coaching, and prove AI ROI with real adoption data.' },
  { icon: Sparkles, title: 'AI Command Center', description: 'Describe any work task in plain English — get the right tool, exactly why it wins, and a ready-to-paste prompt built around your role and stack. No more guessing.' },
]

/* ─── Stat card ─────────────────────────────────────────────────────── */
/* ─── Stat card ──────────────────────────────────────────────────────── */
const STAT_THEMES = {
  green: {
    border: 'conic-gradient(from 0deg, transparent 0deg, #10b981 60deg, #34d399 90deg, #6ee7b7 150deg, transparent 240deg, #10b981 300deg, transparent 360deg)',
    hoverBg: 'hover:bg-emerald-50',
    hoverShadow: 'hover:shadow-emerald-100/60',
    numberHover: 'group-hover:text-emerald-600',
    sourceColor: 'text-emerald-600',
    linkColor: 'text-emerald-600',
  },
  blue: {
    border: 'conic-gradient(from 0deg, transparent 0deg, #3b82f6 60deg, #60a5fa 90deg, #93c5fd 150deg, transparent 240deg, #3b82f6 300deg, transparent 360deg)',
    hoverBg: 'hover:bg-blue-50',
    hoverShadow: 'hover:shadow-blue-100/60',
    numberHover: 'group-hover:text-blue-600',
    sourceColor: 'text-blue-600',
    linkColor: 'text-blue-600',
  },
  amber: {
    border: 'conic-gradient(from 0deg, transparent 0deg, #f59e0b 60deg, #fbbf24 90deg, #fcd34d 150deg, transparent 240deg, #f59e0b 300deg, transparent 360deg)',
    hoverBg: 'hover:bg-amber-50',
    hoverShadow: 'hover:shadow-amber-100/60',
    numberHover: 'group-hover:text-amber-500',
    sourceColor: 'text-amber-600',
    linkColor: 'text-amber-600',
  },
}

function StatCard({ value, suffix, label, source, href, delay, floatDelay, color }: { value: number; suffix: string; label: string; source: string; href: string; delay: number; floatDelay: number; color: keyof typeof STAT_THEMES }) {
  const { ref, inView } = useInView()
  const count = useCounter(value, 2000, inView)
  const theme = STAT_THEMES[color]
  return (
    <div style={inView ? { animation: `float 4s ease-in-out ${floatDelay}ms infinite` } : undefined}>
      <div
        ref={ref as unknown as React.RefObject<HTMLDivElement>}
        style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
        className={`relative rounded-2xl p-px overflow-hidden ${inView ? 'animate-scale-in' : 'opacity-0'}`}
      >
        <div className="animate-border-spin absolute" style={{ width: '200%', height: '200%', top: '-50%', left: '-50%', background: theme.border }} />
        <a
          href={href} target="_blank" rel="noopener noreferrer"
          className={`group relative block bg-white rounded-2xl p-8 ${theme.hoverBg} hover:shadow-xl ${theme.hoverShadow} transition-all duration-300`}
        >
          <div className={`text-[3.75rem] font-black tabular-nums leading-none mb-3 text-gray-950 ${theme.numberHover} transition-colors duration-300`}>
            {count}{suffix}
          </div>
          <div className="text-sm text-gray-500 leading-relaxed mb-4">{label}</div>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${theme.sourceColor}`}>{source}</span>
            <span className={`text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 ${theme.linkColor}`}>Read source <ArrowRight className="w-3 h-3" /></span>
          </div>
        </a>
      </div>
    </div>
  )
}

/* ─── Prompt preview ─────────────────────────────────────────────────── */
function PromptPreview() {
  const [activeTab, setActiveTab] = useState<'before' | 'after' | 'tasks'>('before')
  const [checked, setChecked] = useState<number[]>([])
  const tasks = [
    { tool: 'ChatGPT', title: 'Write a cold outreach email with role context', time: 10 },
    { tool: 'Claude', title: 'Summarize a doc and extract action items', time: 10 },
    { tool: 'Notion AI', title: 'Turn bullet notes into a structured brief', time: 10 },
  ]
  return (
    <div className="relative">
      <div className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xl shadow-gray-200/60">
        <div className="bg-gray-950 p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 bg-emerald-500 rounded-md flex items-center justify-center">
              <MessageSquare className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Prompt Playbook</span>
          </div>
          <p className="text-sm text-gray-400 mb-3">As a <strong className="text-white">Sales Rep</strong> using Claude</p>
          <div className="bg-white/[0.06] rounded-xl p-3 border border-white/10 text-xs text-gray-300">
            <span className="text-amber-400 font-semibold">Coaching tip:</span> Always include your prospect&apos;s industry, pain point, and desired outcome — Claude needs context to be specific.
          </div>
        </div>
        <div className="flex gap-1 p-2 bg-gray-50 border-b border-gray-100">
          {(['before', 'after', 'tasks'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              {tab === 'before' ? '❌ Weak prompt' : tab === 'after' ? '✅ Strong prompt' : '📋 Daily tasks'}
            </button>
          ))}
        </div>
        <div className="p-4 bg-white">
          {activeTab === 'before' && (
            <div className="space-y-2">
              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <p className="text-xs text-red-400 font-semibold mb-1 uppercase tracking-wide">What most people type</p>
                <p className="text-sm text-gray-700 font-mono leading-relaxed">&ldquo;Write me a cold email for a sales prospect.&rdquo;</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wide">What you get</p>
                <p className="text-xs text-gray-500 leading-relaxed italic">A generic, forgettable email. The prospect deletes it immediately.</p>
              </div>
            </div>
          )}
          {activeTab === 'after' && (
            <div className="space-y-2">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                <p className="text-xs text-emerald-600 font-semibold mb-1 uppercase tracking-wide">What LessAI teaches you</p>
                <p className="text-xs text-gray-700 font-mono leading-relaxed">&ldquo;You are a B2B sales rep at a SaaS company. Write a 3-sentence cold email to a VP of Engineering at a 200-person fintech startup. Their pain: slow deployments. My value prop: we cut deploy time by 40%. Tone: direct, no fluff.&rdquo;</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wide">What you get</p>
                <p className="text-xs text-gray-500 leading-relaxed italic">A specific, relevant email the prospect actually reads.</p>
              </div>
            </div>
          )}
          {activeTab === 'tasks' && (
            <div className="space-y-2">
              {tasks.map((t, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${checked.includes(i) ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100 hover:border-gray-200'}`}>
                  <button onClick={() => setChecked(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${checked.includes(i) ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-emerald-400'}`}>
                    {checked.includes(i) && <CheckCircle className="w-3.5 h-3.5 text-white fill-white" />}
                  </button>
                  <span className={`text-xs font-medium flex-1 ${checked.includes(i) ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{t.tool} — {t.title}</span>
                  <span className="text-xs text-gray-400 shrink-0">{t.time}m</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Product demo ───────────────────────────────────────────────────── */
function ProductDemo() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'studio' | 'tasks' | 'saved'>('dashboard')
  const [checkedTasks, setCheckedTasks] = useState<number[]>([])
  const [commandText, setCommandText] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [typing, setTyping] = useState(false)
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [studioMode, setStudioMode] = useState<'command' | 'lab'>('command')

  const EXAMPLE = 'Build a Q2 pipeline forecast from our CRM data'

  function runDemo() {
    if (showResult) { setShowResult(false); setCommandText(''); return }
    setTyping(true); setCommandText(''); let i = 0
    const interval = setInterval(() => {
      setCommandText(EXAMPLE.slice(0, i + 1)); i++
      if (i >= EXAMPLE.length) { clearInterval(interval); setTyping(false); setTimeout(() => setShowResult(true), 300) }
    }, 32)
  }

  const tasks = [
    { tool: 'Claude', title: 'Analyze churn data and surface the top 3 risk factors', time: 10, level: 'Practitioner' },
    { tool: 'ChatGPT', title: 'Draft a pipeline review memo for leadership', time: 10, level: 'Explorer' },
    { tool: 'Perplexity', title: 'Research a target account before outreach', time: 10, level: 'Explorer' },
    { tool: 'Notion AI', title: "Summarize last quarter's deal velocity notes", time: 10, level: 'Novice' },
  ]

  const folders = [
    { id: 'q1', name: 'Q1 2026', count: 6 }, { id: 'q2', name: 'Q2 2026', count: 4 },
    { id: 'pipeline', name: 'Pipeline', count: 8 }, { id: 'reporting', name: 'Reporting', count: 5 },
  ]

  const allPrompts = [
    { id: '1', folder: 'q2', tool: 'Claude', title: 'Q2 forecast narrative', prompt: 'You are a RevOps Manager. Based on the pipeline data below, write a 3-paragraph Q2 forecast narrative for our VP of Sales...' },
    { id: '2', folder: 'q2', tool: 'ChatGPT', title: 'Pipeline gap analysis', prompt: 'Analyze this pipeline report and identify the gap between our Q2 target and current projected close. List top 5 deals...' },
    { id: '3', folder: 'q2', tool: 'Perplexity', title: 'Account research brief', prompt: 'Research [Company Name] and give me: revenue range, recent funding, tech stack, key decision-makers, and recent news...' },
    { id: '4', folder: 'q2', tool: 'Notion AI', title: 'QBR agenda draft', prompt: 'Draft a 45-minute QBR agenda for our RevOps team reviewing Q2 performance...' },
    { id: '5', folder: 'q1', tool: 'Claude', title: 'Churn risk summary', prompt: 'Review these customer health scores and identify the top 5 churn risks. For each: account name, key signals, ARR at risk...' },
    { id: '6', folder: 'q1', tool: 'ChatGPT', title: 'Win/loss pattern analysis', prompt: 'Analyze these 20 closed-won and closed-lost deals from Q1. Identify 3 patterns in the wins and 3 in the losses...' },
    { id: '7', folder: 'pipeline', tool: 'Claude', title: 'Deal health score summary', prompt: 'You are a RevOps analyst. For each deal, assign a health score (1–10) based on last activity, stakeholders engaged...' },
    { id: '8', folder: 'pipeline', tool: 'ChatGPT', title: 'Stalled deal reactivation', prompt: 'Write a reactivation email for a deal stalled in "Proposal Sent" for 3 weeks. Tone: direct, not needy...' },
    { id: '9', folder: 'reporting', tool: 'Claude', title: 'Monthly RevOps report', prompt: 'Generate a monthly RevOps report. Structure: Executive Summary, Pipeline Metrics, Top 3 Risks, Top 3 Wins...' },
  ]

  const visiblePrompts = activeFolder ? allPrompts.filter(p => p.folder === activeFolder) : allPrompts.slice(0, 5)

  const levelColors: Record<string, string> = {
    Novice: 'bg-gray-100 text-gray-600',
    Explorer: 'bg-teal-50 text-teal-700 border border-teal-200',
    Practitioner: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Pro: 'bg-amber-50 text-amber-700 border border-amber-200',
  }

  const navItems = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'studio', label: 'Prompt Studio' },
    { key: 'tasks', label: 'Daily Tasks' },
    { key: 'saved', label: 'Saved Prompts' },
  ]

  return (
    <div className="relative max-w-5xl mx-auto">
      <div className="absolute -inset-6 bg-gradient-to-br from-emerald-500/10 via-transparent to-amber-400/10 rounded-3xl blur-3xl pointer-events-none" />
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-2xl shadow-gray-300/50">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gray-100">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-amber-400" /><div className="w-3 h-3 rounded-full bg-emerald-400" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-white border border-gray-200 rounded-md px-4 py-1 text-xs text-gray-400">app.lessai.io/dashboard</div>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-b border-gray-100 bg-white">
          <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <div><p className="text-sm font-semibold text-gray-900">Jordan Reyes</p><p className="text-xs text-gray-400">RevOps Manager · 5 tools</p></div>
            <div className="flex items-center gap-3 text-xs"><span className="flex items-center gap-1 text-amber-500 font-semibold"><span>🔥</span>7</span><span className="text-emerald-600 font-semibold">310 XP</span></div>
          </div>
          <div className="flex border-t border-gray-100">
            {navItems.map(item => (
              <button key={item.key} onClick={() => setActiveTab(item.key as typeof activeTab)}
                className={`flex-1 py-2.5 text-xs font-medium transition-all relative ${activeTab === item.key ? 'text-emerald-600' : 'text-gray-400'}`}>
                {item.label}
                {activeTab === item.key && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-emerald-500 rounded-full" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex bg-gray-50" style={{ minHeight: 540 }}>
          {/* Sidebar */}
          <div className="hidden md:flex w-48 shrink-0 bg-white border-r border-gray-100 p-4 flex-col">
            <div className="px-1 mb-4">
              <p className="text-sm font-semibold text-gray-900 truncate">Jordan Reyes</p>
              <p className="text-xs text-gray-400 truncate mb-2.5">RevOps Manager · 5 tools</p>
              <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Stack progress</span><span className="text-emerald-600 font-semibold">14/25</span></div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-1.5 rounded-full" style={{ width: '56%', background: 'linear-gradient(90deg,#10b981,#f59e0b)' }} /></div>
            </div>
            <div className="px-1 pb-4 mb-3 border-b border-gray-100">
              <div className="flex items-center gap-1.5 mb-2"><span className="text-sm">🔥</span><span className="text-sm font-bold text-gray-900">7-day streak</span></div>
              <div className="flex justify-between text-xs mb-1"><span className="font-bold text-emerald-600">Practitioner</span><span className="text-gray-400">310 XP</span></div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-1.5 rounded-full" style={{ width: '62%', background: 'linear-gradient(90deg,#10b981,#14b8a6)' }} /></div>
              <p className="text-xs text-gray-400 mt-1">190 XP to Pro</p>
            </div>
            <div className="space-y-0.5 flex-1">
              {navItems.map(item => (
                <button key={item.key} onClick={() => setActiveTab(item.key as typeof activeTab)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left ${activeTab === item.key ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
                  <div className={`w-3 h-3 rounded-sm shrink-0 ${activeTab === item.key ? 'bg-white/40' : 'bg-gray-200'}`} />
                  {item.label}
                  {item.key === 'saved' && <span className="ml-auto text-xs bg-emerald-100 text-emerald-600 px-1.5 rounded-full font-bold">23</span>}
                </button>
              ))}
            </div>
            <div className="mt-auto pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Your stack</p>
              {[{ name: 'Claude', level: '✓' }, { name: 'ChatGPT', level: '✓' }, { name: 'Perplexity', level: '~' }, { name: 'Notion AI', level: '~' }, { name: 'Grok', level: '·' }].map(t => (
                <div key={t.name} className="flex items-center justify-between py-0.5">
                  <span className="text-xs text-gray-500 truncate">{t.name}</span>
                  <span className={`text-xs ${t.level === '✓' ? 'text-emerald-500' : t.level === '~' ? 'text-teal-500' : 'text-gray-300'}`}>{t.level}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {activeTab === 'dashboard' && (
              <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
                <div className="hidden md:block">
                  <h2 className="text-base font-bold text-gray-900">Good morning, Jordan.</h2>
                  <p className="text-xs text-gray-400 mt-0.5">RevOps Manager · 5 tools in your stack</p>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Total XP', value: '310', accent: 'text-emerald-600' },
                    { label: 'Day streak', value: '7 🔥', accent: 'text-amber-500' },
                    { label: 'This week', value: '90 XP', accent: 'text-blue-600' },
                    { label: 'Tasks done', value: '14', accent: 'text-purple-600' },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl p-2.5 border border-gray-100 shadow-sm text-center">
                      <p className={`text-base font-black ${s.accent}`}>{s.value}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">Practitioner</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-full font-semibold">Level 3</span>
                    </div>
                    <span className="text-xs text-gray-400">190 XP to Pro</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-2 rounded-full" style={{ width: '62%', background: 'linear-gradient(90deg,#10b981,#14b8a6)' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Continue where you left off</p>
                    <button onClick={() => setActiveTab('tasks')} className="text-xs text-emerald-600 hover:text-emerald-500 transition-colors font-medium">View all →</button>
                  </div>
                  <div className="space-y-2">
                    {tasks.slice(0, 2).map((t, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white shadow-sm">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                          <div className="w-3 h-3 rounded-full border-2 border-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-gray-800 truncate block">{t.title}</span>
                          <span className="text-[10px] text-emerald-600 font-semibold">{t.tool}</span>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{t.time}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'studio' && (
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Prompt Studio</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Build and test AI prompts for your workflow</p>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                    <button onClick={() => setStudioMode('command')} className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${studioMode === 'command' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Command</button>
                    <button onClick={() => setStudioMode('lab')} className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${studioMode === 'lab' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Lab</button>
                  </div>
                </div>
                {studioMode === 'command' && (
                  <div className="relative rounded-2xl overflow-hidden" style={{ background: '#030712', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="line-grid-3d absolute inset-0 opacity-60" />
                    <div className="relative z-10 px-4 sm:px-5 pt-5 pb-4">
                      <div className="flex items-center gap-2 mb-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /><span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">AI Command Center</span></div>
                      <h3 className="text-base sm:text-lg font-black text-white mb-3">What do you want to <span className="bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">accomplish</span> today?</h3>
                      <div className="flex gap-2 mb-3">
                        <div className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-gray-300 min-h-[40px] flex items-center min-w-0">
                          <span className="truncate">{commandText || <span className="text-gray-600">Describe any work task…</span>}</span>
                          {typing && <span className="ml-0.5 w-0.5 h-4 bg-emerald-400 inline-block animate-pulse shrink-0" />}
                        </div>
                        <button onClick={runDemo} className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showResult ? 'bg-white/10 text-gray-400' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
                          {showResult ? <span className="text-xs">✕</span> : <ArrowRight className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {['Build Q2 forecast', 'Analyze churn signals', 'Draft pipeline memo'].map(chip => (
                          <button key={chip} onClick={() => { setCommandText(chip); setTimeout(() => setShowResult(true), 200) }}
                            className="text-xs px-3 py-1.5 bg-white/[0.06] border border-white/[0.08] rounded-full text-gray-400 hover:text-gray-200 hover:bg-white/[0.1] transition-all whitespace-nowrap shrink-0">{chip}</button>
                        ))}
                      </div>
                    </div>
                    {showResult && (
                      <div className="mx-4 mb-4 rounded-xl p-3 border border-emerald-500/25 animate-fade-up" style={{ background: 'rgba(16,185,129,0.05)', animationFillMode: 'forwards' }}>
                        <div className="flex items-center gap-2 mb-2 flex-wrap"><div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" /><span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Best tool for this</span><span className="ml-auto text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-medium">Claude</span></div>
                        <p className="text-xs font-semibold text-white mb-1">Use Claude — best for structured analysis with narrative</p>
                        <p className="text-xs text-gray-400 leading-relaxed mb-2">Claude handles multi-variable reasoning well. Give it your CRM export and ask for coverage ratio, risk flags, and a narrative summary.</p>
                        <div className="bg-white/[0.04] border border-white/[0.07] rounded-lg p-2.5"><p className="text-xs text-emerald-400 font-semibold mb-1">Ready-to-paste prompt:</p><p className="text-xs text-gray-300 leading-relaxed font-mono break-words">&ldquo;You are a RevOps analyst. Calculate Q2 coverage ratio, flag deals at risk, and write a 3-sentence forecast narrative for the VP of Sales. Data: [paste CRM export]&rdquo;</p></div>
                      </div>
                    )}
                  </div>
                )}
                {studioMode === 'lab' && (
                  <div className="space-y-3">
                    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm"><p className="text-xs text-gray-400 mb-1.5">Your prompt</p><p className="text-xs text-gray-700 font-mono leading-relaxed italic">&ldquo;Write a cold email for a sales prospect.&rdquo;</p></div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Specificity', before: 2, after: 9, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                        { label: 'Context', before: 1, after: 8, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
                        { label: 'Output clarity', before: 3, after: 9, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
                      ].map(s => (
                        <div key={s.label} className={`rounded-xl p-2.5 border ${s.bg} text-center`}>
                          <p className="text-[10px] text-gray-400 mb-1">{s.label}</p>
                          <div className="flex items-center justify-center gap-1.5"><span className="text-xs text-gray-400 line-through">{s.before}</span><span className="text-[10px] text-gray-400">→</span><span className={`text-base font-black ${s.color}`}>{s.after}</span></div>
                          <p className="text-[10px] text-gray-400 mt-0.5">out of 10</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl p-3 border border-emerald-100 bg-emerald-50"><p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1.5">✨ Improved prompt</p><p className="text-xs text-gray-700 font-mono leading-relaxed">&ldquo;You are a B2B sales rep at a SaaS company. Write a 3-sentence cold email to a VP of Engineering at a 200-person fintech startup. Their pain: slow deployments. My value prop: we cut deploy time by 40%. Tone: direct, no fluff.&rdquo;</p></div>
                    <div className="flex gap-2">
                      <button className="flex-1 text-xs bg-white border border-gray-200 text-gray-600 rounded-lg py-2 font-medium">Copy prompt</button>
                      <button className="flex-1 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg py-2 font-medium">Save to library</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <div><h2 className="text-sm font-bold text-gray-900">Daily Tasks</h2><p className="text-xs text-gray-400 mt-0.5">{checkedTasks.length}/{tasks.length} done today</p></div>
                  <div className="flex items-center gap-2"><div className="h-1.5 w-20 sm:w-24 bg-gray-100 rounded-full overflow-hidden"><div className="h-1.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${(checkedTasks.length / tasks.length) * 100}%` }} /></div><span className="text-xs text-emerald-600 font-semibold">{Math.round((checkedTasks.length / tasks.length) * 100)}%</span></div>
                </div>
                <div className="space-y-2.5">
                  {tasks.map((t, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer ${checkedTasks.includes(i) ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 bg-white hover:border-gray-200 shadow-sm'}`}
                      onClick={() => setCheckedTasks(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${checkedTasks.includes(i) ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                        {checkedTasks.includes(i) && <CheckCircle className="w-3.5 h-3.5 text-white fill-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-xs font-medium block mb-1 ${checkedTasks.includes(i) ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{t.title}</span>
                        <div className="flex items-center gap-2"><span className="text-xs text-emerald-600 font-semibold">{t.tool}</span><span className="text-gray-300">·</span><span className={`text-xs px-1.5 py-0.5 rounded font-medium ${levelColors[t.level]}`}>{t.level}</span></div>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{t.time}m</span>
                    </div>
                  ))}
                </div>
                {checkedTasks.length > 0 && (
                  <div className="mt-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <span className="text-base">⚡</span>
                    <div><p className="text-xs font-bold text-emerald-700">+{checkedTasks.length * 20} XP earned today</p><p className="text-xs text-gray-500">{checkedTasks.length === tasks.length ? 'Perfect day — streak extended! 🔥' : `${tasks.length - checkedTasks.length} task${tasks.length - checkedTasks.length > 1 ? 's' : ''} left`}</p></div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="flex flex-col h-full">
                <div className="md:hidden px-4 pt-3 pb-2 flex gap-2 overflow-x-auto no-scrollbar border-b border-gray-100 bg-white">
                  <button onClick={() => setActiveFolder(null)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!activeFolder ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'}`}>All</button>
                  {folders.map(f => (<button key={f.id} onClick={() => setActiveFolder(f.id)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeFolder === f.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{f.name}</button>))}
                </div>
                <div className="flex flex-1 min-h-0">
                  <div className="hidden md:block w-36 shrink-0 border-r border-gray-100 bg-white p-3 space-y-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Folders</p>
                    <button onClick={() => setActiveFolder(null)} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${!activeFolder ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>All prompts <span className="ml-1 text-gray-400">{allPrompts.length}</span></button>
                    {folders.map(f => (<button key={f.id} onClick={() => setActiveFolder(f.id)} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${activeFolder === f.id ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}><span className="truncate">{f.name}</span><span className="text-gray-400 ml-1 shrink-0">{f.count}</span></button>))}
                  </div>
                  <div className="flex-1 min-w-0 p-3 sm:p-4 space-y-2 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2"><p className="text-xs font-semibold text-gray-900">{activeFolder ? folders.find(f => f.id === activeFolder)?.name : 'All prompts'}</p><span className="text-xs text-gray-400">{visiblePrompts.length} prompts</span></div>
                    {visiblePrompts.map(p => (
                      <div key={p.id} className="border border-gray-100 rounded-xl bg-white hover:border-gray-200 transition-all group shadow-sm">
                        <div className="flex items-center gap-2.5 px-3 py-2.5"><span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-medium shrink-0">{p.tool}</span><p className="text-xs font-semibold text-gray-800 flex-1 truncate">{p.title}</p><button className="text-xs text-gray-400 hover:text-gray-700 transition-colors sm:opacity-0 group-hover:opacity-100 px-2 py-1 rounded-lg hover:bg-gray-50 shrink-0">Copy</button></div>
                        <div className="px-3 pb-2.5"><p className="text-xs text-gray-400 leading-relaxed line-clamp-2 font-mono break-words">{p.prompt}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 px-4 sm:px-5 py-3 flex items-center justify-between gap-4 bg-white">
          <p className="text-xs text-gray-400 truncate">
            {activeTab === 'dashboard' ? '👆 Your AI activity hub — stats, tasks, and progress at a glance' : activeTab === 'tasks' ? '👆 Tap any task to mark it done and earn XP' : activeTab === 'studio' ? '👆 Switch between Command Center and Prompt Lab modes' : '👆 Browse folders or tap a prompt to copy it'}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            {(['dashboard', 'studio', 'tasks', 'saved'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === tab ? 'bg-emerald-500' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Waitlist form ──────────────────────────────────────────────────── */
function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!email.trim()) return; setStatus('loading')
    const res = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
    setStatus(res.ok ? 'done' : 'error')
  }

  return (
    <div className="max-w-md mx-auto">
      {status === 'done' ? (
        <div className="flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-6 py-4">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <p className="text-emerald-300 font-semibold">You&apos;re on the list — we&apos;ll be in touch.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@company.com"
              className="w-full bg-white/[0.07] border border-white/10 text-white placeholder:text-gray-600 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500/40 transition-all" />
          </div>
          <button type="submit" disabled={status === 'loading'}
            className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center gap-2">
            {status === 'loading' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Notify me <ArrowRight className="w-3.5 h-3.5" /></>}
          </button>
        </form>
      )}
      {status === 'error' && <p className="text-red-400 text-xs text-center mt-2">Something went wrong — try again or email hello@lessai.io</p>}
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function Home() {
  const { ref: statsRef, inView: statsInView } = useInView()
  const { ref: stepsRef, inView: stepsInView } = useInView()
  const { ref: featuresRef, inView: featuresInView } = useInView()
  const { ref: managerRef, inView: managerInView } = useInView()
  const { ref: demoRef, inView: demoInView } = useInView()

  return (
    <div className="bg-white text-gray-900 overflow-x-hidden">

      <ParticleField />

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5">
            <LogoMark size={28} />
            <span className="font-bold text-gray-950 text-lg tracking-tight">LessAI</span>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/pricing" className="hidden sm:block text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50">Pricing</Link>
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50">Sign in</Link>
            <Link href="/signup" className="ml-1 flex items-center gap-1.5 bg-gray-950 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-gray-900/20 group">
              Start free trial <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-24 pb-28 px-6 overflow-hidden">
        <div className="dot-grid-3d" />
        <div className="max-w-6xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-gray-500 border border-gray-200 mb-8 animate-fade-up">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                For individuals, employees &amp; entire teams
              </div>
              <h1 className="text-5xl sm:text-6xl font-black leading-[1.04] tracking-tight mb-6 animate-fade-up" style={{ animationDelay: '80ms', animationFillMode: 'forwards' }}>
                All your <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">AI tools</span>.<br />
                <span className="bg-gradient-to-r from-gray-900 via-emerald-700 to-teal-600 bg-clip-text text-transparent">One place to master them.</span>
              </h1>
              <p className="text-lg text-gray-500 mb-4 leading-relaxed animate-fade-up" style={{ animationDelay: '160ms', animationFillMode: 'forwards' }}>
                Your company bought the AI tools. Nobody trained you on them. LessAI fixes that — role-specific coaching, daily practice, and full team visibility in one place.
              </p>
              <p className="text-sm text-gray-400 mb-8 animate-fade-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                Role-specific coaching · daily practice · AI Command Center · team skill tracking
              </p>
              <div className="flex items-center gap-3 flex-wrap animate-fade-up" style={{ animationDelay: '260ms', animationFillMode: 'forwards' }}>
                <Link href="/signup" className="group relative">
                  <span className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
                  <span className="relative flex items-center gap-2 bg-gray-950 hover:bg-gray-800 text-white font-bold px-7 py-3.5 rounded-2xl transition-all duration-200 hover:shadow-xl hover:shadow-gray-900/20 text-base">
                    Start free trial <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-4 py-3.5 border border-gray-200 rounded-2xl hover:border-gray-300 hover:bg-gray-50 font-medium">
                  See pricing
                </Link>
              </div>
              <div className="flex items-center gap-5 mt-8 animate-fade-up" style={{ animationDelay: '340ms', animationFillMode: 'forwards' }}>
                {['7-day free trial · no charge until day 8', 'Setup in under 3 minutes', 'Built for your exact role & tools'].map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> {t}
                  </div>
                ))}
              </div>
            </div>
            <div className="animate-fade-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              <PromptPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGO TICKER ── */}
      <div className="border-y border-gray-100 py-4 overflow-hidden bg-gray-50/60">
        <p className="text-center text-xs text-gray-400 mb-3 font-medium tracking-wide uppercase">Works with every tool your company already pays for</p>
        <div className="flex animate-ticker whitespace-nowrap" style={{ width: 'max-content' }}>
          {[...logos, ...logos].map((logo, i) => (
            <span key={i} className="inline-flex items-center gap-2 mx-8 text-sm text-gray-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              {logo}
            </span>
          ))}
        </div>
      </div>

      {/* ── WHO IT'S FOR ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3">Who it&apos;s for</p>
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-4 text-gray-950">Built for every layer of your team</h2>
          <p className="text-center text-gray-500 mb-12 max-w-lg mx-auto text-sm">One platform. Three kinds of users. Everyone gets exactly what they need.</p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                n: '01', label: 'Individuals', sub: 'Learning on your own',
                color: 'emerald',
                items: ['Role-specific prompt frameworks for your exact job', 'Prompt Lab: paste any prompt, get a sharper version instantly', 'Daily 10-min practice tasks that build real habits', 'AI Command Center: right tool + ready-to-paste prompt'],
              },
              {
                n: '02', label: 'Employees', sub: 'Have tools, got no training',
                color: 'blue',
                items: ['Company context scraped from your website — every prompt fits your business', 'Know which AI tool to use for each task, and exactly why', 'Claude vs. ChatGPT vs. Gemini: learn when each one wins', 'No fluff, no generic advice — built for your actual role'],
              },
              {
                n: '03', label: 'Teams & managers', sub: 'Rolling AI out company-wide',
                color: 'amber',
                items: ['Admin dashboard: XP, streaks, task completion by person', 'See who\'s using which tools — and who needs coaching', 'Skill gaps visible across the team in one view', 'Prove AI ROI with adoption data — not survey responses'],
              },
            ].map(card => (
              <div key={card.n} className={`rounded-2xl p-7 border border-gray-100 transition-all duration-200 bg-white group hover:shadow-md ${card.color === 'emerald' ? 'hover:border-emerald-300 hover:shadow-emerald-50' : card.color === 'blue' ? 'hover:border-blue-300 hover:shadow-blue-50' : 'hover:border-amber-300 hover:shadow-amber-50'}`}>
                <div className="flex items-center justify-between mb-5">
                  <span className={`text-xs font-bold uppercase tracking-widest ${card.color === 'emerald' ? 'text-emerald-500' : card.color === 'blue' ? 'text-blue-500' : 'text-amber-500'}`}>{card.label}</span>
                  <span className="text-2xl font-black text-gray-100 group-hover:text-gray-200 transition-colors tabular-nums">{card.n}</span>
                </div>
                <p className="font-semibold text-gray-800 mb-4 text-sm">{card.sub}</p>
                <ul className="space-y-2.5">
                  {card.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <div className={`w-1 h-1 rounded-full mt-1.5 shrink-0 ${card.color === 'emerald' ? 'bg-emerald-400' : card.color === 'blue' ? 'bg-blue-400' : 'bg-amber-400'}`} />
                      <span className="text-sm text-gray-500 leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/signup" className="inline-flex items-center gap-2 bg-gray-950 hover:bg-gray-800 text-white font-semibold px-7 py-3.5 rounded-2xl transition-all duration-200 text-sm hover:shadow-xl hover:shadow-gray-900/20">
              Start free — works for all three <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef} className="py-24 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <p className={`text-center text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3 ${statsInView ? 'animate-fade-in' : 'opacity-0'}`}>Why this matters</p>
          <h2 className={`text-3xl sm:text-4xl font-black text-center mb-4 text-gray-950 ${statsInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            The AI skills gap is costing you — every day
          </h2>
          <p className={`text-center text-gray-500 mb-14 max-w-xl mx-auto text-sm ${statsInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '180ms', animationFillMode: 'forwards' }}>
            Companies buy the tools. They skip the training. Nobody connects the dots back to one thing: knowing how to prompt.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((s, i) => <StatCard key={s.value} {...s} delay={(i + 1) * 120} floatDelay={i * 600} color={(['green', 'blue', 'amber'] as const)[i]} />)}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section ref={stepsRef} className="py-24 px-6 relative overflow-hidden bg-gray-950">
        <div className="line-grid-3d" />
        <div className="absolute -inset-0 bg-gradient-to-b from-emerald-950/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative">
          <p className={`text-center text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3 ${stepsInView ? 'animate-fade-in' : 'opacity-0'}`}>How it works</p>
          <h2 className={`text-3xl sm:text-4xl font-black text-center mb-3 text-white ${stepsInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            Set up once. Get better every day.
          </h2>
          <p className={`text-center text-gray-500 mb-14 max-w-xl mx-auto text-sm ${stepsInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '180ms', animationFillMode: 'forwards' }}>
            LessAI personalizes everything to you — your role, your stack, your company. Then it builds your skills daily and gives managers full visibility into how the team is leveling up.
          </p>
          <div className="grid gap-3">
            {steps.map((item, i) => {
              const stepColors = [
                { border: 'border-emerald-500/15', bg: 'bg-emerald-500/[0.06]', hoverBg: 'hover:bg-emerald-500/[0.12]', hoverBorder: 'hover:border-emerald-400/30', hoverShadow: 'hover:shadow-emerald-500/10', iconBorder: 'border-emerald-400/25', iconBg: 'bg-emerald-400/10', iconHover: 'group-hover:bg-emerald-400/20', iconColor: 'text-emerald-300', numColor: 'text-emerald-600', titleColor: 'text-emerald-200' },
                { border: 'border-blue-500/15', bg: 'bg-blue-500/[0.06]', hoverBg: 'hover:bg-blue-500/[0.12]', hoverBorder: 'hover:border-blue-400/30', hoverShadow: 'hover:shadow-blue-500/10', iconBorder: 'border-blue-400/25', iconBg: 'bg-blue-400/10', iconHover: 'group-hover:bg-blue-400/20', iconColor: 'text-blue-300', numColor: 'text-blue-500', titleColor: 'text-blue-200' },
                { border: 'border-amber-500/15', bg: 'bg-amber-500/[0.06]', hoverBg: 'hover:bg-amber-500/[0.12]', hoverBorder: 'hover:border-amber-400/30', hoverShadow: 'hover:shadow-amber-500/10', iconBorder: 'border-amber-400/25', iconBg: 'bg-amber-400/10', iconHover: 'group-hover:bg-amber-400/20', iconColor: 'text-amber-300', numColor: 'text-amber-500', titleColor: 'text-amber-200' },
                { border: 'border-violet-500/15', bg: 'bg-violet-500/[0.06]', hoverBg: 'hover:bg-violet-500/[0.12]', hoverBorder: 'hover:border-violet-400/30', hoverShadow: 'hover:shadow-violet-500/10', iconBorder: 'border-violet-400/25', iconBg: 'bg-violet-400/10', iconHover: 'group-hover:bg-violet-400/20', iconColor: 'text-violet-300', numColor: 'text-violet-500', titleColor: 'text-violet-200' },
              ][i]
              return (
              <div key={i}
                className={`group flex gap-5 p-6 rounded-2xl border ${stepColors.border} ${stepColors.bg} ${stepColors.hoverBg} ${stepColors.hoverBorder} hover:shadow-xl ${stepColors.hoverShadow} transition-all duration-300 cursor-default ${stepsInView ? 'animate-slide-left' : 'opacity-0'}`}
                style={{ animationDelay: `${(i + 1) * 100}ms`, animationFillMode: 'forwards' }}>
                <div className="shrink-0">
                  <div className={`w-11 h-11 rounded-xl border ${stepColors.iconBorder} ${stepColors.iconBg} flex items-center justify-center ${stepColors.iconHover} transition-all duration-300`}>
                    <item.icon className={`w-5 h-5 ${stepColors.iconColor}`} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className={`text-xs font-bold ${stepColors.numColor}`}>0{i + 1}</span>
                    <h3 className={`font-bold ${stepColors.titleColor}`}>{item.title}</h3>
                  </div>
                  <p className="text-gray-500 group-hover:text-white text-sm leading-relaxed transition-colors duration-300">{item.desc}</p>
                </div>
              </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── PRODUCT DEMO ── */}
      <section ref={demoRef} className="py-16 sm:py-24 px-3 sm:px-6 relative overflow-hidden bg-gray-950 border-t border-white/[0.04]">
        <div className="line-grid-3d opacity-40" />
        <div className="max-w-5xl mx-auto relative">
          <p className={`text-center text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3 ${demoInView ? 'animate-fade-in' : 'opacity-0'}`}>See it in action</p>
          <h2 className={`text-3xl sm:text-4xl font-black text-center mb-4 text-white ${demoInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            Your complete AI hub — explore it live
          </h2>
          <p className={`text-center text-gray-500 mb-12 max-w-2xl mx-auto text-sm ${demoInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '180ms', animationFillMode: 'forwards' }}>
            Click through the tabs — this is the real product. <strong className="text-gray-300">Dashboard</strong> shows your progress and daily tasks. <strong className="text-gray-300">Prompt Studio</strong> is your AI Command Center and Prompt Lab in one. <strong className="text-gray-300">Daily Tasks</strong> is your 10-min practice queue. <strong className="text-gray-300">Saved Prompts</strong> is your personal library.
          </p>
          <div className={`${demoInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '260ms', animationFillMode: 'forwards' }}>
            <ProductDemo />
          </div>
          <div className={`mt-8 ${demoInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '360ms', animationFillMode: 'forwards' }}>
            <div className="relative rounded-2xl border border-white/[0.08] overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center gap-4 px-5 py-4 flex-wrap">
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-base">🤫</span>
                  <p className="text-sm font-bold text-white">Psst — this is just the surface.</p>
                </div>
                <div className="flex gap-2 flex-wrap flex-1">
                  {['Multi-tool Workflows', 'Tool Guides', 'XP & Level System', 'Stack Recommendations', '+ more'].map((f, i) => (
                    <span key={f} className={`text-xs px-2.5 py-1 rounded-full font-medium border ${i === 4 ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-white/[0.06] border-white/[0.08] text-gray-400'}`}>{f}</span>
                  ))}
                </div>
                <p className="text-xs text-gray-600 shrink-0 italic">Some good stuff stays behind the curtain 🎭</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section ref={featuresRef} className="py-24 px-6 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <p className={`text-center text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3 ${featuresInView ? 'animate-fade-in' : 'opacity-0'}`}>Everything included</p>
          <h2 className={`text-3xl sm:text-4xl font-black text-center mb-4 text-gray-950 ${featuresInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            Every feature you need — for individuals and teams
          </h2>
          <p className={`text-center text-gray-400 mb-14 max-w-xl mx-auto text-sm ${featuresInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '180ms', animationFillMode: 'forwards' }}>
            Not a course. Not a generic tips blog. A system built around your role, your AI stack, and how you actually work — day to day.
          </p>
          <div className="grid md:grid-cols-3 gap-3">
            {features.map((f, i) => (
              <div key={f.title}
                className={`group rounded-2xl p-6 border border-gray-100 bg-white hover:border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default ${f.highlight ? 'ring-1 ring-emerald-200' : ''} ${featuresInView ? 'animate-scale-in' : 'opacity-0'}`}
                style={{ animationDelay: `${(i + 1) * 60}ms`, animationFillMode: 'forwards' }}>
                <div className="w-9 h-9 bg-gray-950 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-all duration-200">
                  <f.icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-gray-950 mb-2 text-sm">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.description}</p>
                {f.highlight && <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full"><Sparkles className="w-3 h-3" /> Prompt Lab</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR TEAMS ── */}
      <section ref={managerRef} className="py-24 px-6 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <p className={`text-center text-xs font-semibold text-amber-600 uppercase tracking-widest mb-3 ${managerInView ? 'animate-fade-in' : 'opacity-0'}`}>For teams &amp; managers</p>
          <h2 className={`text-3xl sm:text-4xl font-black text-center mb-3 text-gray-950 ${managerInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            Full visibility into who&apos;s actually leveling up
          </h2>
          <p className={`text-center text-gray-500 mb-14 max-w-xl mx-auto text-sm ${managerInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '180ms', animationFillMode: 'forwards' }}>
            While your team builds AI skills daily, you get a live admin dashboard — see who&apos;s practicing, who&apos;s falling behind, and which tools nobody&apos;s actually using yet.
          </p>

          <div className={`grid lg:grid-cols-2 gap-10 items-start ${managerInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '260ms', animationFillMode: 'forwards' }}>

            {/* Feature list */}
            <div className="space-y-4">
              {[
                { icon: Users, title: 'Invite your team in seconds', desc: 'Send invite links by email. Members join, complete onboarding, and show up in your dashboard automatically — no IT setup required.', color: 'bg-emerald-50 text-emerald-600' },
                { icon: TrendingUp, title: 'XP & streak leaderboard', desc: 'See every team member\'s XP, current streak, level, and tasks completed at a glance. Know who\'s building the habit and who needs a nudge.', color: 'bg-blue-50 text-blue-600' },
                { icon: Target, title: 'Tool adoption by person', desc: 'Find out which tools each person is actually using vs ignoring. If your team has Notion AI and nobody\'s touched it — you\'ll see that clearly.', color: 'bg-amber-50 text-amber-600' },
                { icon: Shield, title: 'Spot skill gaps before they cost you', desc: 'Filter by tool or skill level to see exactly who needs coaching. No surveys, no guesswork — real task completion data per person.', color: 'bg-rose-50 text-rose-600' },
                { icon: BarChart3, title: 'Prove ROI to leadership', desc: 'Export adoption data and improvement trends. When finance asks what the AI investment achieved, you\'ll have the numbers.', color: 'bg-violet-50 text-violet-600' },
              ].map(({ icon: Icon, title, desc, color }) => (
                <div key={title} className="flex gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">{title}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <Link href="/signup" className="group inline-flex items-center gap-2 bg-gray-950 hover:bg-gray-800 text-white font-bold px-6 py-3 rounded-xl transition-all duration-200 text-sm hover:shadow-xl hover:shadow-gray-900/20">
                  Set up your team <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Admin dashboard mock */}
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-xl shadow-gray-200/60">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" /><div className="w-2.5 h-2.5 rounded-full bg-amber-400" /><div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-white border border-gray-200 rounded px-3 py-0.5 text-[10px] text-gray-400">app.lessai.io/admin</div>
                </div>
              </div>
              {/* Header */}
              <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-gray-900">Team Overview</p>
                  <p className="text-xs text-gray-400 mt-0.5">Acme Corp · 8 members · week of Jul 7</p>
                </div>
                <div className="flex gap-2">
                  <div className="text-center">
                    <p className="text-base font-black text-emerald-600">412</p>
                    <p className="text-[10px] text-gray-400">avg XP</p>
                  </div>
                  <div className="w-px bg-gray-100 mx-1" />
                  <div className="text-center">
                    <p className="text-base font-black text-amber-500">6</p>
                    <p className="text-[10px] text-gray-400">active this week</p>
                  </div>
                </div>
              </div>
              {/* Table */}
              <div className="bg-white">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-5 py-2 border-b border-gray-100 bg-gray-50">
                  {['Member', 'XP', 'Streak', 'Tasks'].map(h => (
                    <p key={h} className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</p>
                  ))}
                </div>
                {[
                  { name: 'Sarah M.', role: 'Marketing', xp: 640, streak: 12, tasks: 28, level: 'Pro', flag: null },
                  { name: 'Jordan R.', role: 'RevOps', xp: 510, streak: 9, tasks: 22, level: 'Pro', flag: null },
                  { name: 'Alex T.', role: 'Sales', xp: 310, streak: 4, tasks: 14, level: 'Practitioner', flag: null },
                  { name: 'Maya K.', role: 'Content', xp: 180, streak: 2, tasks: 8, level: 'Explorer', flag: null },
                  { name: 'Chris D.', role: 'Design', xp: 60, streak: 0, tasks: 3, level: 'Novice', flag: 'needs nudge' },
                  { name: 'Priya L.', role: 'Ops', xp: 40, streak: 0, tasks: 2, level: 'Novice', flag: 'needs nudge' },
                ].map((row, i) => (
                  <div key={row.name} className={`grid grid-cols-[1fr_auto_auto_auto] gap-x-3 items-center px-5 py-3 border-b border-gray-50 ${row.flag ? 'bg-amber-50/60' : 'hover:bg-gray-50'} transition-colors`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black text-white ${['bg-emerald-500','bg-teal-500','bg-blue-500','bg-violet-500','bg-amber-400','bg-orange-400'][i]}`}>
                        {row.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{row.name}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-400">{row.role}</span>
                          {row.flag && <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 px-1.5 rounded-full">needs nudge</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-emerald-600">{row.xp}</p>
                      <p className="text-[10px] text-gray-400">{row.level}</p>
                    </div>
                    <p className="text-xs font-semibold text-gray-700 text-right">{row.streak > 0 ? `🔥 ${row.streak}d` : '—'}</p>
                    <p className="text-xs font-semibold text-gray-500 text-right">{row.tasks}</p>
                  </div>
                ))}
              </div>
              {/* Footer */}
              <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 flex items-center justify-between">
                <p className="text-xs text-gray-400">2 members need attention this week</p>
                <button className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors">Send reminder →</button>
              </div>
            </div>

          </div>

          {/* Pitch quote */}
          <div className={`mt-10 relative rounded-2xl overflow-hidden ${managerInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
            <div className="bg-gray-950 p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
              <div className="relative flex items-center justify-between gap-6 flex-wrap">
                <div>
                  <p className="font-bold text-base mb-1.5 text-white">The pitch to your leadership team:</p>
                  <p className="text-gray-400 text-sm max-w-lg leading-relaxed">&ldquo;We gave everyone AI tools. Now we&apos;re giving them the training to use them well. LessAI shows skill gaps, tracks improvement, and proves our AI investment is paying off — with real data.&rdquo;</p>
                </div>
                <Link href="/signup" className="group shrink-0 flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold px-5 py-2.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-amber-400/30 text-sm">
                  Get the admin dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ── FINAL CTA ── */}
      <section className="relative py-20 px-6 bg-gray-950 isolate border-t border-white/[0.04]">
        <div className="line-grid-3d" />
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-4 py-1.5 text-xs font-semibold text-emerald-400 mb-8">
            <Zap className="w-3 h-3" /> 7-day free trial
          </div>
          <h2 className="text-4xl sm:text-5xl font-black mb-4 leading-tight text-white">
            You have the tools.<br />
            <span className="relative inline-block">
              <span className="relative z-10 text-white">Now actually get good at them.</span>
              <span className="absolute bottom-1 left-0 w-full h-3 bg-amber-400/25 -z-0 -rotate-1 rounded-sm" />
            </span>
          </h2>
          <p className="text-gray-400 mb-8 text-lg">Get your personalized prompt playbook in under 3 minutes. Full access free for 7 days.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/signup" className="group relative">
              <span className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 to-amber-300 rounded-2xl blur opacity-50 group-hover:opacity-80 transition-opacity duration-300" />
              <span className="relative flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold px-8 py-4 rounded-2xl transition-all duration-200 text-base">
                Get my prompt playbook <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-6 py-4 border border-white/10 rounded-2xl hover:border-white/20 hover:bg-white/5 font-medium">
              Sign in
            </Link>
          </div>
          <p className="text-xs text-gray-600 mt-4">No credit card required · setup in under 3 minutes</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <LogoMark size={26} />
                <span className="font-bold text-white">LessAI</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">The centralized hub for mastering every AI tool your team uses — one place for prompts, practice, and skill tracking.</p>
              <a href="mailto:hello@lessai.io" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> hello@lessai.io
              </a>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Product</p>
              <ul className="space-y-2">
                {[{ label: 'Features', href: '/#features' }, { label: 'Pricing', href: '/pricing' }, { label: 'Sign up', href: '/signup' }, { label: 'Sign in', href: '/login' }].map(l => (
                  <li key={l.label}><Link href={l.href} className="text-sm text-gray-500 hover:text-white transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Company</p>
              <ul className="space-y-2">
                {[{ label: 'Contact us', href: 'mailto:hello@lessai.io' }, { label: 'Support', href: 'mailto:hello@lessai.io' }].map(l => (
                  <li key={l.label}><a href={l.href} className="text-sm text-gray-500 hover:text-white transition-colors">{l.label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Legal</p>
              <ul className="space-y-2">
                {['Privacy Policy', 'Terms of Service'].map(l => (
                  <li key={l}><a href="mailto:hello@lessai.io" className="text-sm text-gray-500 hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-6 flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-gray-600">© 2026 LessAI. All rights reserved.</p>
            <p className="text-xs text-gray-600">Built for teams who take AI seriously.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
