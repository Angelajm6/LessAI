'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Zap, BarChart3, Sparkles, ThumbsUp, Brain, Target, TrendingUp, Shield, BookOpen, MessageSquare } from 'lucide-react'

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
  { value: 77, suffix: '%', label: "of employees say they've never been trained on how to prompt AI tools effectively", source: 'Slack Future of Work, 2024', href: 'https://slack.com/intl/en-gb/blog/news/the-state-of-work-2023' },
  { value: 40, suffix: '%', label: 'of AI time savings are lost to rework — fixing bad outputs nobody knew how to avoid', source: 'Workday, 2025', href: 'https://investor.workday.com/news-and-events/press-releases/news-details/2026/New-Workday-Research-Companies-Are-Leaving-AI-Gains-on-the-Table/default.aspx' },
  { value: 95, suffix: '%', label: 'of AI pilots produce no measurable business impact — the gap is skill, not tooling', source: 'MIT NANDA, 2025', href: 'https://fortune.com/2025/08/18/mit-report-95-percent-generative-ai-pilots-at-companies-failing-cfo/' },
]

const logos = ['Claude', 'ChatGPT', 'Gemini', 'Copilot', 'Notion AI', 'Perplexity', 'GitHub Copilot', 'Grammarly', 'Midjourney', 'HeyGen', 'Runway', 'Salesforce AI']

const steps = [
  {
    icon: Target,
    title: 'Tell us your role and your tools',
    desc: 'You\'re a Content Marketer with ChatGPT, Notion AI, and Grammarly. Or a Sales Rep with Claude and Salesforce AI. We map your exact stack to your exact job.',
    color: 'green',
  },
  {
    icon: BookOpen,
    title: 'Get your prompt playbook',
    desc: 'Not generic AI tips. Role-specific prompt frameworks for every tool you have — what context to include, how to structure your ask, what makes the difference between a mediocre and great output.',
    color: 'dark',
  },
  {
    icon: Zap,
    title: 'Practice with daily 10-minute tasks',
    desc: 'One concrete task per day per tool. Not a course — actual work you\'d do at your job. Do it, get the result, see the before/after. Build the muscle in weeks, not months.',
    color: 'yellow',
  },
  {
    icon: BarChart3,
    title: 'Manager sees who\'s leveling up',
    desc: 'The admin dashboard shows skill gaps by person and tool. See who needs coaching, which tools aren\'t landing, and prove AI ROI with real adoption data.',
    color: 'green',
  },
]

const features = [
  {
    icon: MessageSquare,
    title: 'Role-based prompt coaching',
    description: 'How a PM prompts Claude for a PRD is nothing like how a marketer prompts it for a campaign. LessAI gives you the exact frameworks, context structure, and phrasing for your job — not generic advice.',
    tag: 'Core feature',
  },
  {
    icon: Zap,
    title: 'Daily 10-minute tasks',
    description: 'One task per tool per day, matched to your skill level and role. Do it, see what good output looks like, and check it off. 5 minutes of practice beats a 2-hour workshop you\'ll never finish.',
    tag: 'Habit-building',
  },
  {
    icon: Brain,
    title: 'Tool-by-tool comparison guides',
    description: 'Claude, ChatGPT, Gemini, and Copilot are not interchangeable. Each has a distinct strength. LessAI teaches you when to use which — so you stop defaulting to the one you know and start using the right one.',
    tag: 'Know your tools',
  },
  {
    icon: BookOpen,
    title: 'Prompt library by role',
    description: 'Searchable, curated prompts built for your job title and your tools. Not crowdsourced garbage — tested frameworks that actually produce the output your role needs.',
    tag: 'Save time',
  },
  {
    icon: Sparkles,
    title: 'Before/after benchmarking',
    description: 'See exactly what a weak prompt gets vs. a strong one on the same task. The gap is always obvious — and once you see it, you can\'t unsee it. That\'s the "aha" moment that changes how you work.',
    tag: 'See the delta',
  },
  {
    icon: BarChart3,
    title: 'Team skill dashboard',
    description: 'Managers see who\'s improving, which tools need more training, and which licenses are being wasted. Justify every AI subscription or cut the ones nobody\'s actually using well.',
    tag: 'For managers',
  },
]

function StatCard({ value, suffix, label, source, href, delay }: { value: number; suffix: string; label: string; source: string; href: string; delay: number }) {
  const { ref, inView } = useInView()
  const count = useCounter(value, 1600, inView)
  return (
    <a
      ref={ref as unknown as React.RefObject<HTMLAnchorElement>}
      href={href} target="_blank" rel="noopener noreferrer"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
      className={`group relative rounded-2xl p-6 border border-gray-200 bg-white hover:border-emerald-300 hover:shadow-2xl hover:shadow-emerald-100/80 transition-all duration-300 overflow-hidden block ${inView ? 'animate-fade-up opacity-0' : 'opacity-0'}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
      <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-emerald-400 via-emerald-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-100 rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
      <div className="relative">
        <div className="text-5xl font-black text-gray-900 mb-2 tabular-nums group-hover:text-emerald-600 transition-colors duration-300">{count}{suffix}</div>
        <div className="text-sm font-medium text-gray-500 mb-3 leading-snug">{label}</div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-amber-600 font-semibold">{source}</div>
          <div className="text-xs text-emerald-600 font-medium opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 translate-x-2 group-hover:translate-x-0">
            Read source <ArrowRight className="w-3 h-3" />
          </div>
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
        {/* Header */}
        <div className="bg-gray-950 p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-400/8 rounded-full blur-xl" />
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
        {/* Tabs */}
        <div className="flex gap-1 p-2 bg-gray-50 border-b border-gray-100">
          {(['before', 'after', 'tasks'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              {tab === 'before' ? '❌ Weak prompt' : tab === 'after' ? '✅ Strong prompt' : '📋 Daily tasks'}
            </button>
          ))}
        </div>
        {/* Content */}
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
                <p className="text-sm text-gray-700 font-mono leading-relaxed text-xs">"You are a B2B sales rep at a SaaS company. Write a 3-sentence cold email to a VP of Engineering at a 200-person fintech startup. Their pain point is slow deployment cycles. My value prop: we cut deployment time by 40%. Tone: direct, no fluff."</p>
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

function Orb({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`absolute rounded-full blur-3xl pointer-events-none ${className}`} style={style} />
}

export default function Home() {
  const { ref: statsRef, inView: statsInView } = useInView()
  const { ref: stepsRef, inView: stepsInView } = useInView()
  const { ref: featuresRef, inView: featuresInView } = useInView()
  const { ref: managerRef, inView: managerInView } = useInView()
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handler = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      <div className="fixed inset-0 pointer-events-none z-0 transition-all duration-700"
        style={{ background: `radial-gradient(500px circle at ${mousePos.x}px ${mousePos.y}px, rgba(16,185,129,0.05), transparent 70%)` }} />

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
            <Link href="/pricing" className="hidden sm:block text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50">
              Pricing
            </Link>
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50">
              Sign in
            </Link>
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
                <Sparkles className="w-3 h-3" /> Less AI noise. More AI results.
              </div>

              <h1 className="text-5xl sm:text-6xl font-black leading-[1.05] tracking-tight mb-6 animate-fade-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                <span className="text-gray-950">Your colleagues</span><br />
                <span className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 bg-clip-text text-transparent animate-gradient">get better answers.</span>
                <br />
                <span className="relative">
                  <span className="relative z-10 text-gray-950">Here&apos;s why.</span>
                  <span className="absolute bottom-1 left-0 w-full h-3 bg-emerald-300/40 -z-0 -rotate-1 rounded-sm" />
                </span>
              </h1>

              <p className="text-lg text-gray-500 mb-6 leading-relaxed animate-fade-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                Same tools, same license — wildly different outputs. The gap isn't the AI. It's knowing how to talk to it. LessAI teaches your team the exact prompts, context, and frameworks for their role and their tools.
              </p>

              <p className="text-sm text-emerald-700 font-semibold mb-8 animate-fade-up" style={{ animationDelay: '240ms', animationFillMode: 'forwards' }}>
                Tailored to your role · your tools · your company context.
              </p>

              <div className="flex items-center gap-3 flex-wrap animate-fade-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
                <Link href="/signup" className="group relative">
                  <span className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
                  <span className="relative flex items-center gap-2 bg-gray-950 hover:bg-gray-800 text-white font-bold px-7 py-3.5 rounded-2xl transition-all duration-200 hover:shadow-xl hover:shadow-gray-900/20 text-base">
                    Get my prompt playbook <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-4 py-3.5 border border-gray-200 rounded-2xl hover:border-gray-300 hover:bg-gray-50 font-medium">
                  See pricing
                </Link>
              </div>

              <div className="flex items-center gap-5 mt-8 animate-fade-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
                {['7-day free trial', 'No generic courses', 'Role-specific'].map((t) => (
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

      {/* ── STATS ── */}
      <section ref={statsRef} className="py-24 px-6 relative overflow-hidden">
        <div className="dot-grid-3d" />
        <Orb className="w-[500px] h-[400px] bg-emerald-200/25 top-0 left-1/2 -translate-x-1/2 animate-float-slow" />
        <Orb className="w-[300px] h-[200px] bg-amber-200/20 bottom-0 right-0 animate-float" style={{ animationDelay: '1.5s' }} />

        <div className="max-w-4xl mx-auto relative">
          <p className={`text-center text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3 ${statsInView ? 'animate-fade-in' : 'opacity-0'}`}>The problem is real</p>
          <h2 className={`text-3xl sm:text-4xl font-black text-center mb-4 text-gray-950 ${statsInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            Nobody taught your team how to prompt
          </h2>
          <p className={`text-center text-gray-500 mb-12 max-w-xl mx-auto text-sm ${statsInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            Companies buy the tools. They skip the training. Employees flounder, output is mediocre, and nobody connects the dots back to prompting skill.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((s, i) => <StatCard key={s.value} {...s} delay={(i + 1) * 100} />)}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — dark section ── */}
      <section ref={stepsRef} className="py-24 px-6 relative overflow-hidden bg-gray-950">
        <div className="line-grid-3d" />
        <Orb className="w-[500px] h-[400px] bg-emerald-500/10 top-[-100px] left-[-100px] animate-float-slow" />
        <Orb className="w-[400px] h-[300px] bg-amber-400/6 bottom-[-50px] right-[-50px] animate-float" style={{ animationDelay: '2s' }} />
        <Orb className="w-[300px] h-[200px] bg-emerald-400/8 bottom-0 left-1/3 animate-float-slow" style={{ animationDelay: '1s' }} />
        {[
          { top: '15%', right: '10%', size: 6, color: 'bg-emerald-400', delay: '0s' },
          { top: '60%', left: '6%', size: 4, color: 'bg-amber-400', delay: '1.2s' },
          { top: '80%', right: '20%', size: 5, color: 'bg-emerald-300', delay: '0.6s' },
        ].map((d, i) => (
          <div key={i} className={`absolute rounded-full ${d.color} animate-float opacity-40`}
            style={{ top: d.top, left: d.left, right: (d as { right?: string }).right, width: d.size, height: d.size, animationDelay: d.delay }} />
        ))}

        <div className="max-w-4xl mx-auto relative">
          <p className={`text-center text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3 ${stepsInView ? 'animate-fade-in' : 'opacity-0'}`}>How it works</p>
          <h2 className={`text-3xl sm:text-4xl font-black text-center mb-3 text-white ${stepsInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            From AI confusion to confident daily use
          </h2>
          <p className={`text-center text-gray-500 mb-14 max-w-xl mx-auto text-sm ${stepsInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            LessAI doesn't teach AI in general. It teaches you how to use the specific tools your company gave you — for the specific work your role demands.
          </p>

          <div className="grid gap-3">
            {steps.map((item, i) => {
              const accent = item.color === 'green'
                ? {
                    card: 'border-emerald-500/20 bg-emerald-500/8 hover:bg-emerald-500/16 hover:border-emerald-400/40',
                    icon: 'text-emerald-300 bg-emerald-400/15 border-emerald-400/30 group-hover:bg-emerald-400/30 group-hover:shadow-md group-hover:shadow-emerald-500/30',
                    title: 'text-emerald-300',
                    number: 'text-emerald-600',
                    glow: 'hover:shadow-2xl hover:shadow-emerald-500/25',
                    bar: 'from-emerald-400 to-emerald-300',
                  }
                : item.color === 'yellow'
                ? {
                    card: 'border-amber-500/20 bg-amber-500/8 hover:bg-amber-500/16 hover:border-amber-400/40',
                    icon: 'text-amber-300 bg-amber-400/15 border-amber-400/30 group-hover:bg-amber-400/30 group-hover:shadow-md group-hover:shadow-amber-500/30',
                    title: 'text-amber-300',
                    number: 'text-amber-600',
                    glow: 'hover:shadow-2xl hover:shadow-amber-500/25',
                    bar: 'from-amber-400 to-amber-300',
                  }
                : {
                    card: 'border-blue-500/15 bg-blue-500/6 hover:bg-blue-500/12 hover:border-blue-400/30',
                    icon: 'text-blue-300 bg-blue-400/15 border-blue-400/30 group-hover:bg-blue-400/30 group-hover:shadow-md group-hover:shadow-blue-500/30',
                    title: 'text-blue-300',
                    number: 'text-blue-600',
                    glow: 'hover:shadow-2xl hover:shadow-blue-500/20',
                    bar: 'from-blue-400 to-blue-300',
                  }
              return (
                <div key={i}
                  className={`group relative flex gap-5 p-6 rounded-2xl border overflow-hidden transition-all duration-300 cursor-default ${accent.card} ${accent.glow} ${stepsInView ? 'animate-slide-left opacity-0' : 'opacity-0'}`}
                  style={{ animationDelay: `${(i + 1) * 100}ms`, animationFillMode: 'forwards' }}>
                  <div className={`absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r ${accent.bar} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-gradient-to-r ${accent.bar} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />
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

      {/* ── FEATURES — back to white ── */}
      <section ref={featuresRef} className="py-24 px-6 relative overflow-hidden">
        <div className="dot-grid-3d" />
        <Orb className="w-[600px] h-[400px] bg-emerald-200/30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-float-slow" />
        <Orb className="w-[250px] h-[200px] bg-amber-200/25 top-0 right-0 animate-float" style={{ animationDelay: '1s' }} />
        {[
          { top: '10%', left: '3%', size: 7, color: 'bg-emerald-300', delay: '0s' },
          { bottom: '15%', right: '4%', size: 5, color: 'bg-amber-300', delay: '1.4s' },
        ].map((d, i) => (
          <div key={i} className={`absolute rounded-full ${d.color} animate-float opacity-40`}
            style={{ top: d.top, left: d.left, right: (d as { right?: string }).right, bottom: (d as { bottom?: string }).bottom, width: d.size, height: d.size, animationDelay: d.delay }} />
        ))}

        <div className="max-w-5xl mx-auto relative">
          <p className={`text-center text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3 ${featuresInView ? 'animate-fade-in' : 'opacity-0'}`}>What you get</p>
          <h2 className={`text-3xl sm:text-4xl font-black text-center mb-4 text-gray-950 ${featuresInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            Everything to go from AI amateur to power user
          </h2>
          <p className={`text-center text-gray-500 mb-14 max-w-xl mx-auto text-sm ${featuresInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            Not a course. Not generic tips. A system built around your role, your stack, and how you actually work.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div key={f.title}
                className={`group relative rounded-2xl p-7 border border-gray-200 bg-white hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-100/60 hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-default ${featuresInView ? 'animate-scale-in opacity-0' : 'opacity-0'}`}
                style={{ animationDelay: `${(i + 1) * 100}ms`, animationFillMode: 'forwards' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-100 rounded-full blur-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-500" />
                <div className="absolute top-0 right-0 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-bl-xl rounded-tr-2xl border-l border-b border-emerald-100">
                  {f.tag}
                </div>
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

      {/* ── MANAGER — light gray ── */}
      <section ref={managerRef} className="py-24 px-6 relative overflow-hidden bg-gray-50">
        <div className="dot-grid-3d" style={{ '--dot-color': '#c9cdd4' } as React.CSSProperties} />
        <Orb className="w-[450px] h-[350px] bg-amber-200/30 top-[-50px] right-[-100px] animate-float-slow" />
        <Orb className="w-[350px] h-[250px] bg-emerald-200/20 bottom-0 left-[-50px] animate-float" style={{ animationDelay: '1.5s' }} />

        <div className="max-w-4xl mx-auto relative">
          <p className={`text-center text-xs font-semibold text-amber-600 uppercase tracking-widest mb-3 ${managerInView ? 'animate-fade-in' : 'opacity-0'}`}>For team leads & managers</p>
          <h2 className={`text-3xl sm:text-4xl font-black text-center mb-3 text-gray-950 ${managerInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            See exactly who needs coaching — and on what
          </h2>
          <p className={`text-center text-gray-500 mb-14 max-w-xl mx-auto text-sm ${managerInView ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            Stop guessing why output quality varies across your team. The admin dashboard shows skill gaps by person and tool — so you know exactly where to focus.
          </p>

          <div className={`grid md:grid-cols-3 gap-4 mb-4 ${managerInView ? 'animate-fade-up opacity-0' : 'opacity-0'}`} style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
            {[
              { icon: TrendingUp, label: 'Prompt skill score', value: '73%', sub: 'team avg up 31% this month', accent: 'emerald' },
              { icon: Shield, label: 'Needs coaching', value: '3', sub: 'members stuck below 40%', accent: 'amber' },
              { icon: Sparkles, label: 'Top performer', value: 'Sarah M.', sub: '5/5 tasks done this week', accent: 'emerald' },
            ].map((card) => (
              <div key={card.label} className={`group rounded-2xl p-6 border bg-white hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden relative ${card.accent === 'amber' ? 'border-amber-200 hover:border-amber-300 hover:shadow-amber-100/60' : 'border-gray-200 hover:border-emerald-200 hover:shadow-emerald-100/60'}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-current/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${card.accent === 'amber' ? 'bg-amber-100 group-hover:bg-amber-200' : 'bg-emerald-100 group-hover:bg-emerald-200'} transition-colors`}>
                  <card.icon className={`w-4 h-4 ${card.accent === 'amber' ? 'text-amber-600' : 'text-emerald-600'}`} />
                </div>
                <p className="text-xs text-gray-400 font-medium mb-1">{card.label}</p>
                <p className={`text-3xl font-black mb-1 ${card.accent === 'amber' ? 'text-amber-500' : 'text-emerald-600'}`}>{card.value}</p>
                <p className="text-xs text-gray-400">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className={`relative rounded-2xl overflow-hidden ${managerInView ? 'animate-fade-up opacity-0' : 'opacity-0'}`} style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
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

      {/* ── FINAL CTA — dark ── */}
      <section className="relative py-20 px-6 bg-gray-950 isolate">
        <div className="line-grid-3d" />
        <Orb className="w-[700px] h-[500px] bg-emerald-500/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-float-slow" />
        <Orb className="w-[350px] h-[250px] bg-amber-400/8 top-0 right-1/4 animate-float" style={{ animationDelay: '1s' }} />
        <Orb className="w-[250px] h-[200px] bg-emerald-400/6 bottom-0 left-1/4 animate-float-slow" style={{ animationDelay: '2s' }} />
        {[
          { top: '20%', left: '12%', size: 8, color: 'bg-amber-400', delay: '0s' },
          { top: '70%', right: '8%', size: 6, color: 'bg-emerald-400', delay: '1.5s' },
          { top: '35%', right: '18%', size: 5, color: 'bg-amber-300', delay: '0.7s' },
          { top: '80%', left: '20%', size: 4, color: 'bg-emerald-300', delay: '2.2s' },
        ].map((d, i) => (
          <div key={i} className={`absolute rounded-full ${d.color} animate-float opacity-40`}
            style={{ top: d.top, left: d.left, right: (d as { right?: string }).right, width: d.size, height: d.size, animationDelay: d.delay }} />
        ))}

        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-4 py-1.5 text-xs font-semibold text-emerald-400 mb-8">
            <Zap className="w-3 h-3" /> 7-day free trial
          </div>
          <h2 className="text-4xl sm:text-5xl font-black mb-4 leading-tight text-white">
            Your team has the tools.<br />
            <span className="relative inline-block">
              <span className="relative z-10 text-white">Now teach them how to use them.</span>
              <span className="absolute bottom-1 left-0 w-full h-3 bg-amber-400/25 -z-0 -rotate-1 rounded-sm" />
            </span>
          </h2>
          <p className="text-gray-400 mb-8 text-lg">Get your personalized prompt playbook in 3 minutes.</p>

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

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-gray-950 rounded-md flex items-center justify-center">
              <span className="text-white font-black text-xs">L</span>
            </div>
            <span className="text-sm font-semibold text-gray-600">LessAI</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-gray-400">
            <Link href="/pricing" className="hover:text-gray-700 transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-gray-700 transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-gray-700 transition-colors">Get started</Link>
          </div>
          <p className="text-xs text-gray-400">© 2026 LessAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
