'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Zap, BarChart3, Sparkles, Brain, Target, TrendingUp, Shield, BookOpen, MessageSquare, Mail, FlaskConical, Globe, Flame } from 'lucide-react'

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let W = window.innerWidth
    let H = window.innerHeight
    canvas.width = W
    canvas.height = H

    const N = Math.min(90, Math.floor((W * H) / 12000))
    const COLORS = ['16,185,129', '16,185,129', '52,211,153', '245,158,11']

    const particles = Array.from({ length: N }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      ox: 0, oy: 0,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.8 + 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      baseOpacity: Math.random() * 0.3 + 0.15,
    }))

    const REPEL = 180
    const LINK = 140

    function draw() {
      ctx.clearRect(0, 0, W, H)
      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      for (const p of particles) {
        const dx = p.x - mx
        const dy = p.y - my
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d < REPEL && d > 1) {
          const f = (1 - d / REPEL) * 3.5
          p.vx += (dx / d) * f
          p.vy += (dy / d) * f
        }
        p.vx *= 0.92
        p.vy *= 0.92
        p.x += p.vx
        p.y += p.vy
        if (p.x < -20) p.x = W + 20
        if (p.x > W + 20) p.x = -20
        if (p.y < -20) p.y = H + 20
        if (p.y > H + 20) p.y = -20
      }

      // Cursor aura
      if (mx > 0) {
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, REPEL)
        grad.addColorStop(0, 'rgba(16,185,129,0.07)')
        grad.addColorStop(1, 'rgba(16,185,129,0)')
        ctx.beginPath()
        ctx.arc(mx, my, REPEL, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      }

      // Connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < LINK) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(16,185,129,${(1 - d / LINK) * 0.22})`
            ctx.lineWidth = 0.7
            ctx.stroke()
          }
        }
      }

      // Dots
      for (const p of particles) {
        const dx = p.x - mx
        const dy = p.y - my
        const d = Math.sqrt(dx * dx + dy * dy)
        const near = d < 200 ? (1 - d / 200) : 0
        const opacity = Math.min(1, p.baseOpacity + near * 0.5)
        const radius = p.r + near * 2

        // Glow halo for nearby dots
        if (near > 0.1) {
          const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 4)
          halo.addColorStop(0, `rgba(${p.color},${near * 0.25})`)
          halo.addColorStop(1, `rgba(${p.color},0)`)
          ctx.beginPath()
          ctx.arc(p.x, p.y, radius * 4, 0, Math.PI * 2)
          ctx.fillStyle = halo
          ctx.fill()
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.color},${opacity})`
        ctx.fill()
      }

      animId = requestAnimationFrame(draw)
    }

    draw()

    const onMouse = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY } }
    const onResize = () => {
      W = window.innerWidth; H = window.innerHeight
      canvas.width = W; canvas.height = H
    }
    window.addEventListener('mousemove', onMouse)
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }} />
}

function useCounter(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number
    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(ease * target))
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
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

const stats = [
  { value: 70, suffix: '%', label: "of employees have received zero formal AI training from their employer — yet executives keep buying more tools", source: 'Slack Workforce Index, 2024', href: 'https://slack.com/blog/news/the-workforce-index-june-2024' },
  { value: 40, suffix: '%', label: 'of AI time savings are lost to rework — fixing bad outputs nobody knew how to avoid', source: 'Workday, 2025', href: 'https://investor.workday.com/news-and-events/press-releases/news-details/2026/New-Workday-Research-Companies-Are-Leaving-AI-Gains-on-the-Table/default.aspx' },
  { value: 95, suffix: '%', label: 'of AI pilots produce no measurable business impact — the gap is skill, not tooling', source: 'MIT NANDA, 2025', href: 'https://fortune.com/2025/08/18/mit-report-95-percent-generative-ai-pilots-at-companies-failing-cfo/' },
]

const logos = ['Claude', 'ChatGPT', 'Gemini', 'Copilot', 'Notion AI', 'Perplexity', 'GitHub Copilot', 'Grammarly', 'Midjourney', 'HeyGen', 'Runway', 'Salesforce AI']

const steps = [
  { icon: Target, title: 'Tell us your role, tools, and company', desc: 'You\'re a Content Marketer with ChatGPT, Notion AI, and Grammarly. We scrape your company website to understand your niche — so every task and prompt is built around your actual business, not a generic example.', color: 'green' },
  { icon: BookOpen, title: 'Get your personalized prompt playbook', desc: 'Not generic AI tips. Role-specific prompt frameworks for every tool in your stack — what context to include, how to structure your ask, and the exact phrasing that gets great outputs for your job.', color: 'dark' },
  { icon: Zap, title: 'Practice daily, track your progress', desc: 'One concrete 10-min task per tool per day. Earn XP, build streaks, and watch your skill heatmap fill up. Use Prompt Lab to paste any prompt you\'re using and instantly see how to make it sharper.', color: 'yellow' },
  { icon: BarChart3, title: 'Manager sees who\'s leveling up', desc: 'The admin dashboard shows XP, streaks, and task completion by person and tool. See skill gaps, spot who needs coaching, and prove AI ROI with real adoption data — not survey responses.', color: 'green' },
]

const features = [
  { icon: MessageSquare, title: 'Role-based prompt coaching', description: 'How a PM prompts Claude for a PRD is nothing like how a marketer prompts it for a campaign. LessAI gives you the exact frameworks, context structure, and phrasing for your job — not generic advice.', tag: 'Core feature' },
  { icon: FlaskConical, title: 'Prompt Lab', description: 'Paste any prompt you\'ve been using and get an AI-rewritten version that\'s sharper and more specific — scored on Specificity, Context, and Output Clarity before and after. See exactly what changed and why.', tag: '✨ New' },
  { icon: Zap, title: 'Daily 10-minute tasks', description: 'One task per tool per day, matched to your skill level and role. Earn XP, build a streak, and watch your skill heatmap fill up. 10 minutes of real practice beats any workshop you\'ll forget by Friday.', tag: 'Habit-building' },
  { icon: Globe, title: 'Company website context', description: 'Tell us your company URL and we scrape it to understand your industry and product. Every task, prompt, and use case references your actual business — not a made-up B2B SaaS example.', tag: 'Personalized' },
  { icon: Brain, title: 'Tool-by-tool comparison guides', description: 'Claude, ChatGPT, Gemini, and Copilot are not interchangeable. LessAI teaches you exactly when to use which — so you stop defaulting to the one you know and start using the right one for each job.', tag: 'Know your tools' },
  { icon: Flame, title: 'Progress tracking + weekly digest', description: 'XP, streaks, a 30-day activity heatmap, per-tool breakdowns, and milestone badges. Plus a weekly email digest every Monday — tasks done, streak status, and your next suggested task.', tag: 'Stay on track' },
  { icon: BookOpen, title: 'Saved prompts + folders', description: 'Save any prompt to your personal library, organize by folder, and access it from anywhere. Every prompt saved from the Lab or Command Center is one-click away next time you need it.', tag: 'Save time' },
  { icon: BarChart3, title: 'Team skill dashboard', description: 'Managers see XP, streaks, and task completion by person and tool. See skill gaps, spot who needs coaching, and prove AI ROI with real adoption data — not survey responses.', tag: 'For managers' },
  { icon: Sparkles, title: 'AI Command Center', description: 'Describe any work task in plain English — get told which tool to use, exactly why it wins for this task, and a ready-to-paste prompt built around your role and your stack. No more guessing.', tag: 'Instant answers' },
]


function StatCard({ value, suffix, label, source, href, delay }: { value: number; suffix: string; label: string; source: string; href: string; delay: number }) {
  const { ref, inView } = useInView()
  const count = useCounter(value, 1600, inView)
  return (
    <a
      ref={ref as unknown as React.RefObject<HTMLAnchorElement>}
      href={href} target="_blank" rel="noopener noreferrer"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
      className={`group relative rounded-2xl p-6 border border-gray-200 bg-white hover:border-emerald-300 hover:shadow-2xl hover:shadow-emerald-100/80 transition-all duration-300 overflow-hidden block ${inView ? 'animate-fade-up' : 'opacity-0'}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
      <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-emerald-400 via-emerald-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-100 rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
      <div className="relative">
        <div className="text-5xl font-black text-gray-900 mb-2 tabular-nums group-hover:text-emerald-600 transition-colors duration-300">{count}{suffix}</div>
        <div className="text-sm font-medium text-gray-500 mb-3 leading-snug">{label}</div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-amber-600 font-semibold">{source}</div>
          <div className="text-xs text-emerald-600 font-medium opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 translate-x-2 group-hover:translate-x-0">Read source <ArrowRight className="w-3 h-3" /></div>
        </div>
      </div>
    </a>
  )
}

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
      <div className="absolute -inset-4 bg-gradient-to-br from-emerald-200/50 via-white to-amber-100/40 rounded-3xl blur-2xl animate-float-slow" />
      <div className="absolute -inset-1 bg-gradient-to-br from-emerald-100/60 to-amber-50/40 rounded-3xl blur-md" />
      <div className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xl shadow-gray-200/80">
        <div className="bg-gray-950 p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 bg-emerald-400 rounded flex items-center justify-center">
                <MessageSquare className="w-3 h-3 text-gray-950" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Prompt Playbook</span>
            </div>
            <p className="text-sm text-gray-400 mb-3">As a <strong className="text-white">Sales Rep</strong> using Claude</p>
            <div className="bg-white/8 rounded-xl p-3 border border-white/10 text-xs text-gray-300">
              <span className="text-amber-400 font-semibold">Coaching tip:</span> Always include your prospect's industry, pain point, and desired outcome — Claude needs context to be specific.
            </div>
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
                <p className="text-sm text-gray-700 font-mono leading-relaxed">"Write me a cold email for a sales prospect."</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wide">What you get</p>
                <p className="text-xs text-gray-500 leading-relaxed italic">A generic, forgettable email that reads like every other cold outreach. The prospect deletes it immediately.</p>
              </div>
            </div>
          )}
          {activeTab === 'after' && (
            <div className="space-y-2">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                <p className="text-xs text-emerald-600 font-semibold mb-1 uppercase tracking-wide">What LessAI teaches you</p>
                <p className="text-xs text-gray-700 font-mono leading-relaxed">"You are a B2B sales rep at a SaaS company. Write a 3-sentence cold email to a VP of Engineering at a 200-person fintech startup. Their pain point is slow deployment cycles. My value prop: we cut deployment time by 40%. Tone: direct, no fluff."</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wide">What you get</p>
                <p className="text-xs text-gray-500 leading-relaxed italic">A specific, relevant email the prospect actually reads — because it sounds like you knew their problem before you hit send.</p>
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
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-medium ${checked.includes(i) ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{t.tool} — {t.title}</span>
                  </div>
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

function ProductDemo() {
  const [activeTab, setActiveTab] = useState<'home' | 'tasks' | 'lab' | 'saved'>('home')
  const [checkedTasks, setCheckedTasks] = useState<number[]>([])
  const [commandText, setCommandText] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [typing, setTyping] = useState(false)
  const [activeFolder, setActiveFolder] = useState<string | null>(null)

  const EXAMPLE = 'Build a Q2 pipeline forecast from our CRM data'

  function runDemo() {
    if (showResult) { setShowResult(false); setCommandText(''); return }
    setTyping(true)
    setCommandText('')
    let i = 0
    const interval = setInterval(() => {
      setCommandText(EXAMPLE.slice(0, i + 1))
      i++
      if (i >= EXAMPLE.length) { clearInterval(interval); setTyping(false); setTimeout(() => setShowResult(true), 300) }
    }, 32)
  }

  const tasks = [
    { tool: 'Claude', title: 'Analyze churn data and surface the top 3 risk factors', time: 10, level: 'Practitioner' },
    { tool: 'ChatGPT', title: 'Draft a pipeline review memo for leadership', time: 10, level: 'Explorer' },
    { tool: 'Perplexity', title: 'Research a target account before outreach', time: 10, level: 'Explorer' },
    { tool: 'Notion AI', title: 'Summarize last quarter\'s deal velocity notes', time: 10, level: 'Novice' },
  ]

  const folders = [
    { id: 'q1', name: 'Q1 2026', count: 6 },
    { id: 'q2', name: 'Q2 2026', count: 4 },
    { id: 'pipeline', name: 'Pipeline', count: 8 },
    { id: 'reporting', name: 'Reporting', count: 5 },
  ]

  const allPrompts = [
    { id: '1', folder: 'q2', tool: 'Claude', title: 'Q2 forecast narrative', prompt: 'You are a RevOps Manager. Based on the pipeline data below, write a 3-paragraph Q2 forecast narrative for our VP of Sales. Include: current pipeline coverage ratio, top 3 at-risk deals with reasoning, and a recommended action for each. Data: [paste CRM export]' },
    { id: '2', folder: 'q2', tool: 'ChatGPT', title: 'Pipeline gap analysis', prompt: 'Analyze this pipeline report and identify the gap between our Q2 target ($[X]) and current projected close. List the top 5 deals that could close the gap, ranked by likelihood. Format as a table: Deal | ARR | Close Date | Risk | Recommended action.' },
    { id: '3', folder: 'q2', tool: 'Perplexity', title: 'Account research brief', prompt: 'Research [Company Name] and give me: their revenue range, recent funding, tech stack (any AI tools), key decision-makers in ops/sales, and any recent news that\'s relevant to a RevOps pitch. Format as a 5-bullet brief.' },
    { id: '4', folder: 'q2', tool: 'Notion AI', title: 'QBR agenda draft', prompt: 'Draft a 45-minute QBR agenda for our RevOps team reviewing Q2 performance. Include: 5-min metrics review, 10-min pipeline health, 15-min process improvements, 10-min tool adoption scorecard, 5-min Q3 priorities. Add 2-3 discussion questions per section.' },
    { id: '5', folder: 'q1', tool: 'Claude', title: 'Churn risk summary', prompt: 'Review these customer health scores and identify the top 5 churn risks. For each, provide: account name, key signals, estimated ARR at risk, and a suggested intervention (email, call, or QBR). Be direct — no hedging.' },
    { id: '6', folder: 'q1', tool: 'ChatGPT', title: 'Win/loss pattern analysis', prompt: 'Analyze these 20 closed-won and closed-lost deals from Q1. Identify 3 patterns in the wins and 3 patterns in the losses. Focus on: deal size, sales cycle length, competitor mentioned, and persona of the champion. Output as a structured report.' },
    { id: '7', folder: 'pipeline', tool: 'Claude', title: 'Deal health score summary', prompt: 'You are a RevOps analyst. For each deal in this list, assign a health score (1–10) based on: last activity date, number of stakeholders engaged, days in current stage, and whether a next step is logged. Flag anything below 6 as at-risk.' },
    { id: '8', folder: 'pipeline', tool: 'ChatGPT', title: 'Stalled deal reactivation email', prompt: 'Write a reactivation email for a deal that\'s been stalled in "Proposal Sent" for 3 weeks. The prospect is a [title] at a [industry] company. Tone: direct, not needy. Offer one new insight or value-add. Keep it under 5 sentences.' },
    { id: '9', folder: 'reporting', tool: 'Claude', title: 'Monthly RevOps report', prompt: 'Generate a monthly RevOps report from this data. Structure: Executive Summary (3 bullets), Pipeline Metrics (coverage, velocity, conversion by stage), Top 3 Risks, Top 3 Wins, Recommended actions for next month. Audience: VP Sales and CFO.' },
  ]

  const visiblePrompts = activeFolder ? allPrompts.filter(p => p.folder === activeFolder) : allPrompts.slice(0, 5)

  const levelColors: Record<string, string> = {
    Novice: 'bg-gray-700 text-gray-300',
    Explorer: 'bg-teal-900/60 text-teal-300',
    Practitioner: 'bg-emerald-900/60 text-emerald-300',
    Pro: 'bg-amber-900/60 text-amber-300',
  }

  const navItems = [
    { key: 'home', label: 'Overview' },
    { key: 'tasks', label: 'Daily Tasks' },
    { key: 'lab', label: 'Prompt Lab' },
    { key: 'saved', label: 'Saved Prompts' },
  ]

  return (
    <div className="relative max-w-5xl mx-auto">
      <div className="absolute -inset-6 bg-gradient-to-br from-emerald-500/10 via-transparent to-amber-400/10 rounded-3xl blur-3xl pointer-events-none" />
      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-gray-950/80" style={{ background: '#0d1117' }}>

        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-amber-500/60" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-white/[0.06] rounded-md px-4 py-1 text-xs text-gray-500">app.lessai.io/dashboard</div>
          </div>
        </div>

        {/* ── MOBILE: compact profile + tab bar ── */}
        <div className="md:hidden border-b border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Jordan Reyes</p>
              <p className="text-xs text-gray-500">RevOps Manager · 5 tools</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-amber-400 font-semibold"><span>🔥</span>7</span>
              <span className="text-emerald-400 font-semibold">310 XP</span>
            </div>
          </div>
          <div className="flex border-t border-white/[0.06]">
            {navItems.map(item => (
              <button key={item.key} onClick={() => setActiveTab(item.key as typeof activeTab)}
                className={`flex-1 py-2.5 text-xs font-medium transition-all relative ${activeTab === item.key ? 'text-white' : 'text-gray-500'}`}>
                {item.label}
                {activeTab === item.key && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-emerald-400 rounded-full" />}
              </button>
            ))}
          </div>
        </div>

        {/* ── DESKTOP: sidebar + content ── */}
        <div className="flex" style={{ minHeight: 540 }}>

          {/* Sidebar — hidden on mobile */}
          <div className="hidden md:flex w-48 shrink-0 border-r border-white/[0.06] p-4 flex-col">
            <div className="px-1 mb-4">
              <p className="text-sm font-semibold text-white truncate">Jordan Reyes</p>
              <p className="text-xs text-gray-500 truncate mb-2.5">RevOps Manager · 5 tools</p>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Stack progress</span>
                <span className="text-emerald-400 font-semibold">14/25</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-1.5 rounded-full" style={{ width: '56%', background: 'linear-gradient(90deg,#10b981,#f59e0b)' }} />
              </div>
            </div>
            <div className="px-1 pb-4 mb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-sm">🔥</span>
                <span className="text-sm font-bold text-white">7-day streak</span>
              </div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-emerald-400">Practitioner</span>
                <span className="text-gray-500">310 XP</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-1.5 rounded-full" style={{ width: '62%', background: 'linear-gradient(90deg,#10b981,#14b8a6)' }} />
              </div>
              <p className="text-xs text-gray-600 mt-1">190 XP to Pro</p>
            </div>
            <div className="space-y-0.5 flex-1">
              {navItems.map(item => (
                <button key={item.key} onClick={() => setActiveTab(item.key as typeof activeTab)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left ${activeTab === item.key ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'}`}>
                  <div className={`w-3 h-3 rounded-sm shrink-0 ${activeTab === item.key ? 'bg-white/40' : 'bg-white/10'}`} />
                  {item.label}
                  {item.key === 'saved' && <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-400 px-1.5 rounded-full font-bold">23</span>}
                </button>
              ))}
            </div>
            <div className="mt-auto pt-4 border-t border-white/[0.06]">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Your stack</p>
              {[
                { name: 'Claude', level: '✓' },
                { name: 'ChatGPT', level: '✓' },
                { name: 'Perplexity', level: '~' },
                { name: 'Notion AI', level: '~' },
                { name: 'Grok', level: '·' },
              ].map(t => (
                <div key={t.name} className="flex items-center justify-between py-0.5">
                  <span className="text-xs text-gray-500 truncate">{t.name}</span>
                  <span className={`text-xs ${t.level === '✓' ? 'text-emerald-500' : t.level === '~' ? 'text-teal-500' : 'text-gray-600'}`}>{t.level}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">

            {/* ── HOME ── */}
            {activeTab === 'home' && (
              <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
                <div className="hidden md:block">
                  <h2 className="text-base font-bold text-white">Good morning, Jordan.</h2>
                  <p className="text-xs text-gray-500 mt-0.5">RevOps Manager · 5 tools in your stack</p>
                </div>

                <div className="relative rounded-2xl overflow-hidden" style={{ background: '#030712', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="line-grid-3d absolute inset-0 opacity-60" />
                  <div className="absolute top-4 left-6 w-20 h-20 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />
                  <div className="absolute bottom-2 right-8 w-16 h-16 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />
                  <div className="relative z-10 px-4 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">AI Command Center</span>
                    </div>
                    <h3 className="text-base sm:text-xl font-black text-white mb-3 sm:mb-4">What do you want to <span className="bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">accomplish</span> <span className="text-white">today?</span></h3>
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-gray-300 min-h-[40px] flex items-center min-w-0">
                        <span className="truncate">{commandText || <span className="text-gray-600">Describe any work task…</span>}</span>
                        {typing && <span className="ml-0.5 w-0.5 h-4 bg-emerald-400 inline-block animate-pulse shrink-0" />}
                      </div>
                      <button onClick={runDemo}
                        className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showResult ? 'bg-white/10 text-gray-400' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
                        {showResult ? <span className="text-xs">✕</span> : <ArrowRight className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                      {['Build Q2 forecast', 'Analyze churn signals', 'Draft pipeline memo'].map(chip => (
                        <button key={chip} onClick={() => { setCommandText(chip); setTimeout(() => setShowResult(true), 200) }}
                          className="text-xs px-3 py-1.5 bg-white/[0.06] border border-white/[0.08] rounded-full text-gray-400 hover:text-gray-200 hover:bg-white/[0.1] hover:border-white/[0.15] transition-all whitespace-nowrap shrink-0">
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {showResult && (
                  <div className="rounded-2xl p-4 border border-emerald-500/25 animate-fade-up" style={{ background: 'rgba(16,185,129,0.05)', animationFillMode: 'forwards' }}>
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Best tool for this</span>
                      <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-medium">Claude</span>
                    </div>
                    <p className="text-xs font-semibold text-white mb-1">Use Claude — best for structured analysis with narrative</p>
                    <p className="text-xs text-gray-400 leading-relaxed mb-3">Claude handles multi-variable reasoning well. Give it your CRM export and ask for coverage ratio, risk flags, and a narrative summary in one prompt.</p>
                    <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-3">
                      <p className="text-xs text-emerald-400 font-semibold mb-1.5">Ready-to-paste prompt:</p>
                      <p className="text-xs text-gray-300 leading-relaxed font-mono break-words">&ldquo;You are a RevOps analyst. Calculate Q2 coverage ratio, flag deals at risk (stalled &gt;14 days or missing next step), and write a 3-sentence forecast narrative for the VP of Sales. Data: [paste CRM export]&rdquo;</p>
                    </div>
                  </div>
                )}

                {!showResult && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Today&apos;s tasks</p>
                      <button onClick={() => setActiveTab('tasks')} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">View all →</button>
                    </div>
                    <div className="space-y-2">
                      {tasks.slice(0, 2).map((t, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                          <div className="w-4 h-4 rounded-full border border-gray-600 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs text-gray-300 truncate block">{t.tool} — {t.title}</span>
                          </div>
                          <span className="text-xs text-gray-600 shrink-0">{t.time}m</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── DAILY TASKS ── */}
            {activeTab === 'tasks' && (
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-white">Daily Tasks</h2>
                    <p className="text-xs text-gray-500 mt-0.5">{checkedTasks.length}/{tasks.length} done today</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 sm:w-24 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-1.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${(checkedTasks.length / tasks.length) * 100}%` }} />
                    </div>
                    <span className="text-xs text-emerald-400 font-semibold">{Math.round((checkedTasks.length / tasks.length) * 100)}%</span>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {tasks.map((t, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer ${checkedTasks.includes(i) ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'}`}
                      onClick={() => setCheckedTasks(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${checkedTasks.includes(i) ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600'}`}>
                        {checkedTasks.includes(i) && <CheckCircle className="w-3.5 h-3.5 text-white fill-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-xs font-medium block mb-1 ${checkedTasks.includes(i) ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{t.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-emerald-600 font-semibold">{t.tool}</span>
                          <span className="text-gray-700">·</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${levelColors[t.level]}`}>{t.level}</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-600 shrink-0">{t.time}m</span>
                    </div>
                  ))}
                </div>
                {checkedTasks.length > 0 && (
                  <div className="mt-4 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                    <span className="text-base">⚡</span>
                    <div>
                      <p className="text-xs font-bold text-emerald-400">+{checkedTasks.length * 20} XP earned today</p>
                      <p className="text-xs text-gray-500">{checkedTasks.length === tasks.length ? 'Perfect day — streak extended! 🔥' : `${tasks.length - checkedTasks.length} task${tasks.length - checkedTasks.length > 1 ? 's' : ''} left`}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── PROMPT LAB ── */}
            {activeTab === 'lab' && (
              <div className="p-4 sm:p-5 space-y-3">
                <div>
                  <h2 className="text-sm font-bold text-white">Prompt Lab</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Paste any prompt → get a smarter version + score</p>
                </div>
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1.5">Your prompt</p>
                  <p className="text-xs text-gray-300 font-mono leading-relaxed italic">&ldquo;Write a cold email for a sales prospect.&rdquo;</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Specificity', before: 2, after: 9, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                    { label: 'Context', before: 1, after: 8, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
                    { label: 'Output clarity', before: 3, after: 9, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                  ].map(s => (
                    <div key={s.label} className={`rounded-xl p-2.5 border ${s.bg} text-center`}>
                      <p className="text-[10px] text-gray-500 mb-1">{s.label}</p>
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-xs text-gray-600 line-through">{s.before}</span>
                        <span className="text-[10px] text-gray-600">→</span>
                        <span className={`text-base font-black ${s.color}`}>{s.after}</span>
                      </div>
                      <p className="text-[10px] text-gray-600 mt-0.5">out of 10</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-3 border border-emerald-500/20 bg-emerald-500/5">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide mb-1.5">✨ Improved prompt</p>
                  <p className="text-xs text-gray-300 font-mono leading-relaxed">&ldquo;You are a B2B sales rep at a SaaS company. Write a 3-sentence cold email to a VP of Engineering at a 200-person fintech startup. Their pain: slow deployments. My value prop: we cut deploy time by 40%. Tone: direct, no fluff.&rdquo;</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 text-xs bg-white/[0.06] border border-white/[0.1] text-gray-300 rounded-lg py-2 font-medium">Copy prompt</button>
                  <button className="flex-1 text-xs bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 rounded-lg py-2 font-medium">Save to library</button>
                </div>
              </div>
            )}

            {/* ── SAVED PROMPTS ── */}
            {activeTab === 'saved' && (
              <div className="flex flex-col h-full">
                {/* Folder chips — mobile */}
                <div className="md:hidden px-4 pt-3 pb-2 flex gap-2 overflow-x-auto no-scrollbar border-b border-white/[0.06]">
                  <button onClick={() => setActiveFolder(null)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!activeFolder ? 'bg-emerald-600 text-white' : 'bg-white/[0.06] text-gray-400'}`}>
                    All
                  </button>
                  {folders.map(f => (
                    <button key={f.id} onClick={() => setActiveFolder(f.id)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeFolder === f.id ? 'bg-emerald-600 text-white' : 'bg-white/[0.06] text-gray-400'}`}>
                      {f.name}
                    </button>
                  ))}
                </div>

                {/* Desktop: folder sidebar + list */}
                <div className="flex flex-1 min-h-0">
                  <div className="hidden md:block w-36 shrink-0 border-r border-white/[0.06] p-3 space-y-1">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 px-1">Folders</p>
                    <button onClick={() => setActiveFolder(null)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${!activeFolder ? 'bg-white/[0.08] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'}`}>
                      All prompts <span className="ml-1 text-gray-600">{allPrompts.length}</span>
                    </button>
                    {folders.map(f => (
                      <button key={f.id} onClick={() => setActiveFolder(f.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${activeFolder === f.id ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'}`}>
                        <span className="truncate">{f.name}</span>
                        <span className="text-gray-600 ml-1 shrink-0">{f.count}</span>
                      </button>
                    ))}
                  </div>

                  {/* Prompt list */}
                  <div className="flex-1 min-w-0 p-3 sm:p-4 space-y-2 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-white">{activeFolder ? folders.find(f => f.id === activeFolder)?.name : 'All prompts'}</p>
                      <span className="text-xs text-gray-600">{visiblePrompts.length} prompts</span>
                    </div>
                    {visiblePrompts.map(p => (
                      <div key={p.id} className="border border-white/[0.07] rounded-xl bg-white/[0.02] hover:border-white/[0.12] transition-all group">
                        <div className="flex items-center gap-2.5 px-3 py-2.5">
                          <span className="text-xs bg-emerald-900/50 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium shrink-0">{p.tool}</span>
                          <p className="text-xs font-semibold text-gray-200 flex-1 truncate">{p.title}</p>
                          <button className="text-xs text-gray-600 hover:text-gray-200 transition-colors sm:opacity-0 group-hover:opacity-100 px-2 py-1 rounded-lg hover:bg-white/[0.06] shrink-0">Copy</button>
                        </div>
                        <div className="px-3 pb-2.5">
                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 font-mono break-words">{p.prompt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Demo hint */}
        <div className="border-t border-white/[0.04] px-4 sm:px-5 py-3 flex items-center justify-between gap-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <p className="text-xs text-gray-600 truncate">
            {activeTab === 'home' ? '👆 Tap a chip to see the AI recommend a tool + prompt' : activeTab === 'tasks' ? '👆 Tap any task to mark it done and earn XP' : activeTab === 'lab' ? '👆 Paste a prompt, get a smarter version with scores' : '👆 Browse folders or tap a prompt to copy it'}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            {(['home', 'tasks', 'lab', 'saved'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === tab ? 'bg-emerald-400' : 'bg-white/20'}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setStatus(res.ok ? 'done' : 'error')
  }

  return (
    <div className="max-w-md mx-auto">
      {status === 'done' ? (
        <div className="flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-6 py-4">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <p className="text-emerald-300 font-semibold">You're on the list — we'll be in touch.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@company.com"
              className="w-full bg-white/[0.07] border border-white/10 text-white placeholder:text-gray-600 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500/40 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {status === 'loading' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Notify me <ArrowRight className="w-3.5 h-3.5" /></>}
          </button>
        </form>
      )}
      {status === 'error' && <p className="text-red-400 text-xs text-center mt-2">Something went wrong — try again or email hello@lessai.io</p>}
    </div>
  )
}

function Orb({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`absolute rounded-full blur-3xl pointer-events-none ${className}`} style={style} />
}

export default function Home() {
  const { ref: statsRef, inView: statsInView } = useInView()
  const { ref: stepsRef, inView: stepsInView } = useInView()
  const { ref: featuresRef, inView: featuresInView } = useInView()
const { ref: managerRef, inView: managerInView } = useInView()
  const { ref: demoRef, inView: demoInView } = useInView()
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handler = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  return (
    <div className="bg-white text-gray-900 overflow-x-hidden">

      <ParticleField />

      <div className="fixed inset-0 pointer-events-none z-0 transition-all duration-700"
        style={{ background: `radial-gradient(500px circle at ${mousePos.x}px ${mousePos.y}px, rgba(16,185,129,0.06), transparent 70%)` }} />

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gray-950 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">L</span>
            </div>
            <span className="font-bold text-gray-950 text-lg tracking-tight">LessAI</span>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/pricing" className="hidden sm:block text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50">Pricing</Link>
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50">Sign in</Link>
            <Link href="/signup" className="ml-1 flex items-center gap-1.5 bg-gray-950 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-gray-900/20 group">
              Get started <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-20 pb-28 px-6 overflow-hidden">
        <div className="dot-grid-3d" />
        <Orb className="w-[700px] h-[500px] bg-emerald-300/20 -top-40 -left-60 animate-float-slow" />
        <Orb className="w-[500px] h-[400px] bg-amber-200/20 top-10 right-[-200px] animate-float" style={{ animationDelay: '2s' }} />
        <Orb className="w-[400px] h-[300px] bg-emerald-200/15 bottom-[-50px] left-1/3 animate-float-slow" style={{ animationDelay: '1s' }} />
        {[
          { top: '18%', left: '8%', size: 8, color: 'bg-emerald-400', delay: '0s', opacity: 0.5 },
          { top: '40%', right: '6%', size: 6, color: 'bg-amber-400', delay: '1s', opacity: 0.5 },
          { top: '65%', left: '4%', size: 5, color: 'bg-emerald-300', delay: '1.8s', opacity: 0.4 },
          { top: '12%', right: '18%', size: 10, color: 'bg-amber-300', delay: '0.5s', opacity: 0.35 },
          { top: '78%', right: '12%', size: 6, color: 'bg-emerald-400', delay: '2.3s', opacity: 0.4 },
        ].map((d, i) => (
          <div key={i} className={`absolute rounded-full ${d.color} animate-float`}
            style={{ top: d.top, left: d.left, right: (d as { right?: string }).right, width: d.size, height: d.size, opacity: d.opacity, animationDelay: d.delay }} />
        ))}

        <div className="max-w-6xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5 text-xs font-semibold text-emerald-700 mb-8 animate-fade-up">
                <Sparkles className="w-3 h-3" /> For individuals, employees &amp; entire teams
              </div>
              <h1 className="text-5xl sm:text-6xl font-black leading-[1.05] tracking-tight mb-6 animate-fade-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                <span className="text-gray-950">All your AI tools.</span><br />
                <span className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 bg-clip-text text-transparent animate-gradient">One place to master them.</span>
              </h1>
              <p className="text-lg text-gray-500 mb-4 leading-relaxed animate-fade-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                Learning on your own, stuck with tools your company bought but never trained you on, or rolling AI out across a team — LessAI is the hub where you actually get good at this.
              </p>
              <p className="text-sm text-gray-400 mb-8 leading-relaxed animate-fade-up" style={{ animationDelay: '240ms', animationFillMode: 'forwards' }}>
                Role-specific prompt coaching · daily practice · AI Command Center · team skill tracking — tailored to your role, your stack, and your company.
              </p>
              <div className="flex items-center gap-3 flex-wrap animate-fade-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
                <Link href="/signup" className="group relative">
                  <span className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
                  <span className="relative flex items-center gap-2 bg-gray-950 hover:bg-gray-800 text-white font-bold px-7 py-3.5 rounded-2xl transition-all duration-200 hover:shadow-xl hover:shadow-gray-900/20 text-base">
                    Start for free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-4 py-3.5 border border-gray-200 rounded-2xl hover:border-gray-300 hover:bg-gray-50 font-medium">
                  See pricing
                </Link>
              </div>
              <div className="flex items-center gap-5 mt-8 animate-fade-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
                {['Free to start', 'No AI experience needed', 'Built for your role & tools'].map((t) => (
                  <div key={t} className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> {t}
                  </div>
                ))}
              </div>
            </div>
            <div className="animate-fade-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
              <PromptPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Logo ticker */}
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
      <section className="py-20 px-6 bg-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3">Who it&apos;s for</p>
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-4 text-gray-950">Built for every layer of your team</h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto text-sm">
            One platform, three kinds of users. Everyone gets exactly what they need.
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                emoji: '👤',
                audience: 'Individuals',
                sub: 'Want to get better at AI on your own',
                color: 'emerald',
                items: [
                  'Role-specific prompt frameworks for your exact job',
                  'Prompt Lab: paste any prompt, get a sharper version instantly',
                  'Daily 10-min practice tasks that build real habits',
                  'Personal prompt library, organized by folder',
                  'AI Command Center: describe a task, get the right tool + prompt',
                ],
              },
              {
                emoji: '💼',
                audience: 'Employees',
                sub: 'Have tools but got zero training',
                color: 'blue',
                items: [
                  'Your company context scraped from your website — every prompt is specific to your business',
                  'Know which AI tool to use for each task, and exactly why',
                  'Claude vs. ChatGPT vs. Gemini: learn when each one wins',
                  'Stop defaulting to the one tool you know — use the right one',
                  'No fluff, no generic advice — just what works for your role',
                ],
              },
              {
                emoji: '📊',
                audience: 'Teams & managers',
                sub: 'Rolling AI out across an org',
                color: 'amber',
                items: [
                  'Admin dashboard: XP, streaks, and task completion by person',
                  'See who\'s using which tools — and who needs coaching',
                  'Skill gaps visible across your entire team in one view',
                  'Prove AI ROI with real adoption data — not survey responses',
                  'Pitch it to leadership: "We gave them tools. Now we\'re giving them training."',
                ],
              },
            ].map((card) => {
              const border = card.color === 'emerald' ? 'border-emerald-200 hover:border-emerald-300 hover:shadow-emerald-100/60' : card.color === 'amber' ? 'border-amber-200 hover:border-amber-300 hover:shadow-amber-100/60' : 'border-blue-200 hover:border-blue-300 hover:shadow-blue-100/60'
              const badge = card.color === 'emerald' ? 'bg-emerald-50 text-emerald-700' : card.color === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
              const check = card.color === 'emerald' ? 'text-emerald-500' : card.color === 'amber' ? 'text-amber-500' : 'text-blue-500'
              return (
                <div key={card.audience} className={`group rounded-2xl p-7 border bg-white hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 overflow-hidden relative ${border}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{card.emoji}</span>
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${badge}`}>{card.audience}</p>
                    </div>
                  </div>
                  <p className="font-bold text-gray-900 mb-1">{card.sub}</p>
                  <div className="w-8 h-0.5 bg-gray-200 mb-4 mt-2" />
                  <ul className="space-y-2.5">
                    {card.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${check}`} />
                        <span className="text-sm text-gray-600 leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
          <div className="text-center mt-10">
            <Link href="/signup" className="inline-flex items-center gap-2 bg-gray-950 hover:bg-gray-800 text-white font-bold px-7 py-3.5 rounded-2xl transition-all duration-200 hover:shadow-xl hover:shadow-gray-900/20 text-sm">
              Start free — works for all three <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef} className="py-24 px-6 relative overflow-hidden">
        <div className="dot-grid-3d" />
        <Orb className="w-[500px] h-[400px] bg-emerald-200/25 top-0 left-1/2 -translate-x-1/2 animate-float-slow" />
        <div className="max-w-4xl mx-auto relative">
          <p className={`text-center text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3 ${statsInView ? 'animate-fade-in' : 'opacity-0'}`}>Why this matters</p>
          <h2 className={`text-3xl sm:text-4xl font-black text-center mb-4 text-gray-950 ${statsInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            The AI skills gap is costing you — every day
          </h2>
          <p className={`text-center text-gray-500 mb-12 max-w-xl mx-auto text-sm ${statsInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            Companies buy the tools. They skip the training. Individuals waste hours getting mediocre outputs. Teams can&apos;t prove ROI. Nobody connects the dots back to one thing: knowing how to prompt.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((s, i) => <StatCard key={s.value} {...s} delay={(i + 1) * 100} />)}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — dark ── */}
      <section ref={stepsRef} className="py-24 px-6 relative overflow-hidden bg-gray-950">
        <div className="line-grid-3d" />
        <Orb className="w-[500px] h-[400px] bg-emerald-500/10 top-[-100px] left-[-100px] animate-float-slow" />
        <Orb className="w-[400px] h-[300px] bg-amber-400/6 bottom-[-50px] right-[-50px] animate-float" style={{ animationDelay: '2s' }} />
        <div className="max-w-4xl mx-auto relative">
          <p className={`text-center text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3 ${stepsInView ? 'animate-fade-in' : 'opacity-0'}`}>How it works</p>
          <h2 className={`text-3xl sm:text-4xl font-black text-center mb-3 text-white ${stepsInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            Set up once. Get better every day.
          </h2>
          <p className={`text-center text-gray-500 mb-14 max-w-xl mx-auto text-sm ${stepsInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            LessAI personalizes everything to you — your role, your stack, your company. Then it builds your skills daily, and gives managers full visibility into how the whole team is leveling up.
          </p>
          <div className="grid gap-3">
            {steps.map((item, i) => {
              const accent = item.color === 'green'
                ? { card: 'border-emerald-500/20 bg-emerald-500/8 hover:bg-emerald-500/16 hover:border-emerald-400/40', icon: 'text-emerald-300 bg-emerald-400/15 border-emerald-400/30 group-hover:bg-emerald-400/30', title: 'text-emerald-300', number: 'text-emerald-600', glow: 'hover:shadow-2xl hover:shadow-emerald-500/25', bar: 'from-emerald-400 to-emerald-300' }
                : item.color === 'yellow'
                ? { card: 'border-amber-500/20 bg-amber-500/8 hover:bg-amber-500/16 hover:border-amber-400/40', icon: 'text-amber-300 bg-amber-400/15 border-amber-400/30 group-hover:bg-amber-400/30', title: 'text-amber-300', number: 'text-amber-600', glow: 'hover:shadow-2xl hover:shadow-amber-500/25', bar: 'from-amber-400 to-amber-300' }
                : { card: 'border-blue-500/15 bg-blue-500/6 hover:bg-blue-500/12 hover:border-blue-400/30', icon: 'text-blue-300 bg-blue-400/15 border-blue-400/30 group-hover:bg-blue-400/30', title: 'text-blue-300', number: 'text-blue-600', glow: 'hover:shadow-2xl hover:shadow-blue-500/20', bar: 'from-blue-400 to-blue-300' }
              return (
                <div key={i} className={`group relative flex gap-5 p-6 rounded-2xl border overflow-hidden transition-all duration-300 cursor-default ${accent.card} ${accent.glow} ${stepsInView ? 'animate-slide-left' : 'opacity-0'}`}
                  style={{ animationDelay: `${(i + 1) * 100}ms`, animationFillMode: 'forwards' }}>
                  <div className={`absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r ${accent.bar} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="shrink-0">
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all duration-300 ${accent.icon}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-xs font-bold ${accent.number}`}>0{i + 1}</span>
                      <h3 className={`font-bold transition-colors ${accent.title}`}>{item.title}</h3>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
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
        <Orb className="w-[600px] h-[400px] bg-emerald-500/8 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-float-slow" />
        <div className="max-w-5xl mx-auto relative">
          <p className={`text-center text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3 ${demoInView ? 'animate-fade-in' : 'opacity-0'}`}>See it in action</p>
          <h2 className={`text-3xl sm:text-4xl font-black text-center mb-4 text-white ${demoInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            Your complete AI hub — explore it live
          </h2>
          <p className={`text-center text-gray-500 mb-12 max-w-2xl mx-auto text-sm ${demoInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            Click through the tabs below — this is the real product. The <strong className="text-gray-300">Overview</strong> tab shows the AI Command Center (right tool + ready prompt for any task). <strong className="text-gray-300">Daily Tasks</strong> shows your 10-min practice queue. <strong className="text-gray-300">Prompt Lab</strong> rewrites and scores any prompt. <strong className="text-gray-300">Saved Prompts</strong> is your personal library organized by folder.
          </p>
          <div className={`${demoInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
            <ProductDemo />
          </div>
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 ${demoInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
            {[
              { label: 'AI Command Center', desc: 'Right tool + ready-to-paste prompt for any task' },
              { label: 'Daily Tasks', desc: '10-min practice tasks that build real skill fast' },
              { label: 'Prompt Lab', desc: 'Rewrite & score any prompt before/after' },
              { label: 'Saved Prompts', desc: 'Your personal prompt library, organized by folder' },
            ].map(item => (
              <div key={item.label} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 text-center">
                <p className="text-sm font-bold text-white mb-1">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section ref={featuresRef} className="py-24 px-6 relative overflow-hidden">
        <div className="dot-grid-3d" />
        <Orb className="w-[600px] h-[400px] bg-emerald-200/30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-float-slow" />
        <div className="max-w-5xl mx-auto relative">
          <p className={`text-center text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3 ${featuresInView ? 'animate-fade-in' : 'opacity-0'}`}>Everything included</p>
          <h2 className={`text-3xl sm:text-4xl font-black text-center mb-4 text-gray-950 ${featuresInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            Every feature you need — for individuals and teams
          </h2>
          <p className={`text-center text-gray-500 mb-14 max-w-xl mx-auto text-sm ${featuresInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            Not a course. Not a generic tips blog. A centralized system built around your role, your exact AI stack, and how you actually work — day to day.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div key={f.title}
                className={`group relative rounded-2xl p-7 border border-gray-200 bg-white hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-100/60 hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-default ${featuresInView ? 'animate-scale-in' : 'opacity-0'}`}
                style={{ animationDelay: `${(i + 1) * 100}ms`, animationFillMode: 'forwards' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                <div className="absolute top-0 right-0 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-bl-xl rounded-tr-2xl border-l border-b border-emerald-100">{f.tag}</div>
                <div className="relative">
                  <div className="w-11 h-11 bg-gray-950 rounded-xl flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:shadow-lg group-hover:shadow-emerald-500/30 transition-all duration-300">
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-950 mb-2 group-hover:text-emerald-700 transition-colors">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                </div>
                <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-emerald-400 to-amber-400 w-0 group-hover:w-full transition-all duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MANAGER ── */}
      <section ref={managerRef} className="py-24 px-6 relative overflow-hidden bg-gray-50">
        <div className="dot-grid-3d" style={{ '--dot-color': '#c9cdd4' } as React.CSSProperties} />
        <Orb className="w-[450px] h-[350px] bg-amber-200/30 top-[-50px] right-[-100px] animate-float-slow" />
        <Orb className="w-[350px] h-[250px] bg-emerald-200/20 bottom-0 left-[-50px] animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="max-w-4xl mx-auto relative">
          <p className={`text-center text-xs font-semibold text-amber-600 uppercase tracking-widest mb-3 ${managerInView ? 'animate-fade-in' : 'opacity-0'}`}>For team leads &amp; managers</p>
          <h2 className={`text-3xl sm:text-4xl font-black text-center mb-3 text-gray-950 ${managerInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            Your team&apos;s AI skills, visible in one place
          </h2>
          <p className={`text-center text-gray-500 mb-14 max-w-xl mx-auto text-sm ${managerInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            While individuals level up through daily practice, you get a live view of every person on your team — who&apos;s building skill, who&apos;s falling behind, and which tools nobody actually knows how to use yet.
          </p>
          <div className={`grid md:grid-cols-3 gap-4 mb-4 ${managerInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
            {[
              { icon: TrendingUp, label: 'Team avg XP', value: '410', sub: 'up 38% from last month', accent: 'emerald' },
              { icon: Shield, label: 'Needs coaching', value: '3', sub: 'members below 10 tasks done', accent: 'amber' },
              { icon: Sparkles, label: 'Top streak', value: 'Sarah M.', sub: '12-day streak 🔥', accent: 'emerald' },
            ].map((card) => (
              <div key={card.label} className={`group rounded-2xl p-6 border bg-white hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden relative ${card.accent === 'amber' ? 'border-amber-200 hover:border-amber-300 hover:shadow-amber-100/60' : 'border-gray-200 hover:border-emerald-200 hover:shadow-emerald-100/60'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${card.accent === 'amber' ? 'bg-amber-100 group-hover:bg-amber-200' : 'bg-emerald-100 group-hover:bg-emerald-200'} transition-colors`}>
                  <card.icon className={`w-4 h-4 ${card.accent === 'amber' ? 'text-amber-600' : 'text-emerald-600'}`} />
                </div>
                <p className="text-xs text-gray-400 font-medium mb-1">{card.label}</p>
                <p className={`text-3xl font-black mb-1 ${card.accent === 'amber' ? 'text-amber-500' : 'text-emerald-600'}`}>{card.value}</p>
                <p className="text-xs text-gray-400">{card.sub}</p>
              </div>
            ))}
          </div>
          <div className={`relative rounded-2xl overflow-hidden ${managerInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
            <div className="bg-gray-950 p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-32 bg-emerald-500/8 rounded-full blur-2xl" />
              <div className="absolute bottom-0 right-0 w-48 h-24 bg-amber-400/8 rounded-full blur-2xl" />
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
              <div className="relative flex items-center justify-between gap-6 flex-wrap">
                <div>
                  <p className="font-bold text-lg mb-1 text-white">The pitch to your leadership team:</p>
                  <p className="text-gray-400 text-sm max-w-md leading-relaxed">
                    "We gave everyone AI tools. Now we&apos;re giving them the training to actually use them. LessAI shows us skill gaps, tracks improvement, and proves our AI investment is paying off."
                  </p>
                </div>
                <Link href="/signup" className="group shrink-0 flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold px-5 py-2.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-amber-400/30 text-sm">
                  See the dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WAITLIST / EMAIL CAPTURE ── */}
      <section className="py-20 px-6 relative overflow-hidden bg-gray-950 border-t border-white/[0.04]">
        <div className="line-grid-3d opacity-50" />
        <Orb className="w-[500px] h-[350px] bg-amber-400/8 top-0 right-0 animate-float" style={{ animationDelay: '1s' }} />
        <Orb className="w-[400px] h-[300px] bg-emerald-500/8 bottom-0 left-0 animate-float-slow" />
        <div className="max-w-xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-full px-4 py-1.5 text-xs font-semibold text-amber-400 mb-6">
            <Mail className="w-3 h-3" /> Not ready to sign up yet?
          </div>
          <h2 className="text-3xl font-black text-white mb-3">Stay in the loop</h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Drop your email and we'll let you know when we launch new features, roles, and tool guides. No spam — just product updates worth reading.
          </p>
          <WaitlistForm />
          <p className="text-xs text-gray-600 mt-4">Or reach us directly at <a href="mailto:hello@lessai.io" className="text-emerald-400 hover:text-emerald-300 transition-colors">hello@lessai.io</a></p>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative py-20 px-6 bg-gray-950 isolate border-t border-white/[0.04]">
        <div className="line-grid-3d" />
        <Orb className="w-[700px] h-[500px] bg-emerald-500/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-float-slow" />
        <Orb className="w-[350px] h-[250px] bg-amber-400/8 top-0 right-1/4 animate-float" style={{ animationDelay: '1s' }} />
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
          <p className="text-gray-400 mb-8 text-lg">Get your personalized prompt playbook in under 3 minutes. Free to start.</p>
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
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-black text-xs">L</span>
                </div>
                <span className="font-bold text-white">LessAI</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Teach your team to use AI tools the right way — with role-specific prompts, daily practice, and real skill-building.
              </p>
              <a href="mailto:hello@lessai.io" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> hello@lessai.io
              </a>
            </div>
            {/* Product */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Product</p>
              <ul className="space-y-2">
                {[{ label: 'Features', href: '/#features' }, { label: 'Pricing', href: '/pricing' }, { label: 'Sign up', href: '/signup' }, { label: 'Sign in', href: '/login' }].map(l => (
                  <li key={l.label}><Link href={l.href} className="text-sm text-gray-500 hover:text-white transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            {/* Company */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Company</p>
              <ul className="space-y-2">
                {[{ label: 'Contact us', href: 'mailto:hello@lessai.io' }, { label: 'Support', href: 'mailto:hello@lessai.io' }].map(l => (
                  <li key={l.label}><a href={l.href} className="text-sm text-gray-500 hover:text-white transition-colors">{l.label}</a></li>
                ))}
              </ul>
            </div>
            {/* Legal */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Legal</p>
              <ul className="space-y-2">
                {['Privacy Policy', 'Terms of Service'].map(l => (
                  <li key={l}><span className="text-sm text-gray-600 cursor-default">{l}</span></li>
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
