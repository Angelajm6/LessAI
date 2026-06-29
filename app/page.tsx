'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, CheckCircle, Zap, Users, BarChart3, Sparkles } from 'lucide-react'

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
  {
    value: 95, suffix: '%',
    label: 'of AI pilots produce no measurable business impact',
    source: 'MIT NANDA, 2025',
    href: 'https://fortune.com/2025/08/18/mit-report-95-percent-generative-ai-pilots-at-companies-failing-cfo/',
  },
  {
    value: 44, suffix: '%',
    label: 'of organizations report negative consequences from AI — mostly from misuse and lack of training',
    source: 'McKinsey State of AI, 2024',
    href: 'https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai-2024',
  },
  {
    value: 40, suffix: '%',
    label: 'of AI time savings are lost to rework — correcting errors and rewriting bad outputs',
    source: 'Workday, 2025',
    href: 'https://investor.workday.com/news-and-events/press-releases/news-details/2026/New-Workday-Research-Companies-Are-Leaving-AI-Gains-on-the-Table/default.aspx',
  },
]

const features = [
  { icon: Zap, title: 'Role-specific AI paths', description: 'Every employee gets 3 use cases tailored to their exact job — not generic tips, but actions they can take this afternoon.' },
  { icon: Users, title: 'Weekly micro-skills', description: 'One new AI skill per week, with a real work task attached. 5 minutes to learn, immediate impact on the job.' },
  { icon: BarChart3, title: 'Adoption dashboard', description: 'See who on your team is actually using AI and who needs a nudge — by person, by tool, by week.' },
]

const steps = [
  { step: '01', title: 'Admin sets up the team', desc: "Add your company's AI tools (ChatGPT, Claude, Notion AI, etc.) and invite your team. Takes 3 minutes." },
  { step: '02', title: 'Each employee gets their own path', desc: 'Employees pick their role and instantly receive 3 AI use cases built for their specific job — with a concrete first task to try today.' },
  { step: '03', title: 'Weekly skills keep momentum going', desc: 'Every week, one new AI skill lands in their dashboard with a real work task attached. 5 minutes to learn, immediate impact.' },
  { step: '04', title: "Didn't work? Claude adapts", desc: "If a task doesn't land, employees flag it and Claude generates a simpler alternative in seconds. No one gets left behind." },
]

const logos = ['ChatGPT', 'Claude', 'Notion AI', 'Copilot', 'Gemini', 'Perplexity', 'Grammarly', 'HubSpot AI', 'Midjourney', 'Salesforce AI']

function StatCard({ value, suffix, label, source, href, delay }: { value: number; suffix: string; label: string; source: string; href: string; delay: string }) {
  const { ref, inView } = useInView()
  const count = useCounter(value, 1600, inView)
  return (
    <a
      ref={ref as unknown as React.RefObject<HTMLAnchorElement>}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-100 hover:-translate-y-2 transition-all duration-300 overflow-hidden opacity-0-start cursor-pointer block ${inView ? `animate-fade-up ${delay}` : ''}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-emerald-700 rounded-l-2xl" />
      <div className="relative">
        <div className="text-5xl font-black text-emerald-700 mb-2 tabular-nums">{count}{suffix}</div>
        <div className="text-sm font-medium text-gray-700 mb-1 leading-snug">{label}</div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-amber-600 font-semibold">{source}</div>
          <div className="text-xs text-emerald-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            Read source <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </a>
  )
}

function StepCard({ title, desc, index, inView }: { title: string; desc: string; index: number; inView: boolean }) {
  const delays = ['delay-100', 'delay-200', 'delay-300', 'delay-400']
  return (
    <div className={`group flex gap-5 p-6 rounded-2xl border border-gray-100 bg-white hover:border-amber-200 hover:bg-amber-50/40 hover:shadow-md transition-all duration-300 opacity-0-start ${inView ? `animate-slide-left ${delays[index]}` : ''}`}>
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-700 transition-colors duration-300">
          <span className="text-lg font-black text-emerald-700 group-hover:text-white transition-colors duration-300">{index + 1}</span>
        </div>
      </div>
      <div>
        <h3 className="font-bold text-gray-900 mb-1 group-hover:text-emerald-800 transition-colors">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

export default function Home() {
  const { ref: statsRef, inView: statsInView } = useInView()
  const { ref: stepsRef, inView: stepsInView } = useInView()
  const { ref: featuresRef, inView: featuresInView } = useInView()
  const { ref: previewRef, inView: previewInView } = useInView()

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-600 rounded-md flex items-center justify-center shadow-sm shadow-emerald-200">
              <span className="text-white font-black text-xs">L</span>
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">LessAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-emerald-700 hover:bg-emerald-50">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="relative overflow-hidden bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-200 group">
                <span className="relative z-10">Get started free</span>
                <span className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_center,_rgba(167,243,208,0.5)_0%,_rgba(209,250,229,0.2)_50%,_transparent_70%)] rounded-full blur-2xl" />
          <div className="absolute top-20 right-0 w-72 h-72 bg-amber-100/40 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>
        <div className="absolute top-32 right-[8%] w-3 h-3 bg-amber-400 rounded-full animate-float opacity-70" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-48 right-[15%] w-2 h-2 bg-emerald-500 rounded-full animate-float opacity-50" style={{ animationDelay: '1.2s' }} />
        <div className="absolute top-24 left-[12%] w-2.5 h-2.5 bg-amber-300 rounded-full animate-float opacity-60" style={{ animationDelay: '0.8s' }} />
        <div className="absolute top-56 left-[8%] w-1.5 h-1.5 bg-emerald-600 rounded-full animate-float opacity-40" style={{ animationDelay: '2s' }} />

        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <div className="animate-fade-up">
            <Badge className="mb-6 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-colors cursor-default px-4 py-1.5">
              <Sparkles className="w-3 h-3 mr-1.5 inline" />
              AI adoption, finally solved
            </Badge>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-gray-900 leading-[1.1] mb-6 tracking-tight animate-fade-up delay-100 opacity-0-start">
            Your team bought<br />the AI tools.
            <br />
            <span className="relative inline-block mt-1">
              <span className="animate-gradient bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 bg-clip-text text-transparent" style={{ backgroundSize: '300% 300%' }}>
                Nobody uses them.
              </span>
              <span className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-amber-300 rounded-full animate-fade-in delay-700 opacity-0-start" />
            </span>
          </h1>
          <p className="text-xl text-gray-500 mb-3 max-w-2xl mx-auto animate-fade-up delay-200 opacity-0-start">
            LessAI gives every employee a personalized AI path — specific to their role, their tools, and their actual work. Not a course. A coach.
          </p>
          <p className="text-sm text-gray-400 mb-10 max-w-xl mx-auto animate-fade-up delay-300 opacity-0-start">
            Companies spend <span className="text-emerald-700 font-semibold">$50B on AI tools</span> annually. Most of that value never reaches the employee.
          </p>
          <div className="flex items-center justify-center gap-3 animate-fade-up delay-400 opacity-0-start">
            <Link href="/signup">
              <Button size="lg" className="relative overflow-hidden bg-emerald-700 hover:bg-emerald-800 text-white gap-2 shadow-lg shadow-emerald-200 group px-7 text-base">
                <span className="relative z-10 flex items-center gap-2">
                  Start onboarding your team <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-all">
                Sign in
              </Button>
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-4 animate-fade-up delay-500 opacity-0-start">Free to start · No credit card required · $10/user/month after trial</p>
        </div>
      </section>

      {/* Logo ticker */}
      <div className="border-y border-gray-100 bg-gray-50/60 py-4 overflow-hidden">
        <div className="flex animate-ticker whitespace-nowrap" style={{ width: 'max-content' }}>
          {[...logos, ...logos].map((logo, i) => (
            <span key={i} className="inline-flex items-center gap-2 mx-8 text-sm text-gray-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              {logo}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <section ref={statsRef} className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className={`text-center text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3 opacity-0-start ${statsInView ? 'animate-fade-in' : ''}`}>The problem is real</p>
          <h2 className={`text-3xl font-black text-center text-gray-900 mb-12 opacity-0-start ${statsInView ? 'animate-fade-up delay-100' : ''}`}>The AI investment gap</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((s, i) => <StatCard key={s.value} {...s} delay={`delay-${(i + 1) * 100}`} />)}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section ref={stepsRef} className="py-20 px-6 bg-gradient-to-b from-gray-50/80 to-white">
        <div className="max-w-4xl mx-auto">
          <p className={`text-center text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3 opacity-0-start ${stepsInView ? 'animate-fade-in' : ''}`}>How it works</p>
          <h2 className={`text-3xl font-black text-center text-gray-900 mb-3 opacity-0-start ${stepsInView ? 'animate-fade-up delay-100' : ''}`}>Set up in 5 minutes</h2>
          <p className={`text-center text-gray-500 mb-12 opacity-0-start ${stepsInView ? 'animate-fade-up delay-200' : ''}`}>Results from day one.</p>
          <div className="grid gap-4">
            {steps.map((item, i) => <StepCard key={item.step} {...item} index={i} inView={stepsInView} />)}
          </div>
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className={`text-center text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3 opacity-0-start ${featuresInView ? 'animate-fade-in' : ''}`}>What you get</p>
          <h2 className={`text-3xl font-black text-center text-gray-900 mb-12 opacity-0-start ${featuresInView ? 'animate-fade-up delay-100' : ''}`}>Built for real adoption</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const delays = ['delay-100', 'delay-200', 'delay-300']
              return (
                <div key={f.title} className={`group relative bg-white rounded-2xl p-7 border border-gray-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-50 hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-default opacity-0-start ${featuresInView ? `animate-scale-in ${delays[i]}` : ''}`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                  <div className="relative">
                    <div className="w-11 h-11 bg-emerald-50 group-hover:bg-emerald-700 rounded-xl flex items-center justify-center mb-5 transition-colors duration-300 shadow-sm">
                      <f.icon className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2 group-hover:text-emerald-800 transition-colors">{f.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                  </div>
                  <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-emerald-400 to-amber-300 w-0 group-hover:w-full transition-all duration-500 rounded-b-2xl" />
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Employee preview */}
      <section ref={previewRef} className="py-20 px-6 bg-gradient-to-b from-white to-emerald-50/40">
        <div className="max-w-4xl mx-auto">
          <p className={`text-center text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3 opacity-0-start ${previewInView ? 'animate-fade-in' : ''}`}>The employee experience</p>
          <h2 className={`text-3xl font-black text-center text-gray-900 mb-3 opacity-0-start ${previewInView ? 'animate-fade-up delay-100' : ''}`}>What your employees actually see</h2>
          <p className={`text-center text-gray-500 mb-12 opacity-0-start ${previewInView ? 'animate-fade-up delay-200' : ''}`}>Not a training portal. A clear next step, every week.</p>
          <div className={`relative max-w-lg mx-auto opacity-0-start ${previewInView ? 'animate-scale-in delay-300' : ''}`}>
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-200/40 to-amber-100/40 rounded-3xl blur-2xl" />
            <div className="relative bg-white border border-gray-200 rounded-2xl p-7 shadow-xl shadow-emerald-100/50">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md shadow-emerald-200">S</div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Sarah — Marketing Manager</div>
                  <div className="text-xs text-gray-400">Week 3 · 2 of 3 use cases completed</div>
                </div>
                <div className="ml-auto">
                  <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full">🔥 3-week streak</span>
                </div>
              </div>
              <div className="mb-5">
                <div className="flex justify-between text-xs text-gray-400 mb-1.5"><span>Weekly progress</span><span>2/3 done</span></div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-5 mb-4 border border-emerald-100">
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-2">This week&apos;s skill</div>
                <div className="font-bold text-gray-900 mb-1">Write better briefs with Claude</div>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">Use Claude to turn a rough 3-bullet campaign idea into a full creative brief — tone, audience, key messages, and success metrics.</p>
                <div className="bg-white rounded-lg p-4 border border-emerald-100 shadow-sm">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Your task today</div>
                  <p className="text-sm text-gray-700 leading-relaxed">Pick your next campaign. Write 3 bullet points. Paste them into Claude and ask: <em className="text-emerald-700">&ldquo;Turn this into a full creative brief for a B2B SaaS product.&rdquo;</em></p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="bg-emerald-700 hover:bg-emerald-800 flex-1 text-white shadow-sm group relative overflow-hidden">
                  <span className="relative z-10 flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Mark as done</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Button>
                <Button variant="outline" className="flex-1 border-gray-200 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 transition-all">Didn&apos;t work for me</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 animate-gradient" style={{ backgroundSize: '300% 300%' }} />
        <div className="absolute top-8 left-8 w-2.5 h-2.5 bg-amber-300 rounded-full animate-float opacity-60" />
        <div className="absolute top-16 right-16 w-2 h-2 bg-amber-400 rounded-full animate-float opacity-50" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-12 left-1/4 w-2 h-2 bg-emerald-300 rounded-full animate-float opacity-40" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-8 right-8 w-3 h-3 bg-amber-200 rounded-full animate-float opacity-50" style={{ animationDelay: '0.7s' }} />
        <div className="absolute -top-20 left-1/3 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 right-1/4 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-4 leading-tight">
            Ready to make your team<br />
            <span className="bg-gradient-to-r from-amber-300 to-amber-400 bg-clip-text text-transparent">actually AI-ready?</span>
          </h2>
          <p className="text-emerald-200 mb-2 text-lg">Free to start. No credit card required.</p>
          <p className="text-emerald-300/70 text-sm mb-10">$10/user/month after your trial — scales from SMB to enterprise.</p>
          <Link href="/signup">
            <Button size="lg" className="relative overflow-hidden bg-amber-400 hover:bg-amber-300 text-emerald-900 font-bold gap-2 shadow-xl shadow-emerald-900/40 text-base px-8 group">
              <span className="relative z-10 flex items-center gap-2">
                Get started free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-emerald-600 rounded flex items-center justify-center">
              <span className="text-white font-black text-xs">L</span>
            </div>
            <span className="text-sm font-semibold text-gray-700">LessAI</span>
          </div>
          <p className="text-xs text-gray-400">© 2026 LessAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
