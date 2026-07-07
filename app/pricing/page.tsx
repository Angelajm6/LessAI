'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, X, ArrowRight, Zap, Users, Building2, MessageSquare, Sparkles, FlaskConical } from 'lucide-react'

const FREE_FEATURES = [
  { text: '2 tools in your stack', included: true },
  { text: 'Daily practice tasks', included: true },
  { text: 'Tool comparison guides', included: true },
  { text: 'AI Command Center', included: true },
  { text: '20 Ask AI messages/month', included: true },
  { text: 'Company website context', included: true },
  { text: 'Prompt playbook', included: false },
  { text: 'Saved prompts + folders', included: false },
  { text: 'Prompt Lab', included: false },
  { text: 'Team features', included: false },
]

const PRO_FEATURES = [
  { text: 'Unlimited tools in your stack', included: true },
  { text: 'Full prompt playbook per tool', included: true },
  { text: 'Unlimited daily practice tasks', included: true },
  { text: 'Unlimited Ask AI messages', included: true },
  { text: 'Saved prompts + folders', included: true },
  { text: 'Prompt Lab — rewrite & score any prompt', included: true },
  { text: 'Tool comparison guides', included: true },
  { text: 'Company website context', included: true },
  { text: 'Priority AI generation', included: true },
]

const TEAM_FEATURES = [
  { text: 'Everything in Pro — per seat', included: true },
  { text: 'Admin dashboard', included: true },
  { text: 'Tool adoption analytics', included: true },
  { text: 'XP leaderboard', included: true },
  { text: 'Team prompt library', included: true },
  { text: 'Member invite management', included: true },
  { text: 'ROI & time-saved tracking', included: true },
  { text: 'CSV export', included: true },
  { text: 'Priority support', included: true },
]

const FAQS = [
  {
    q: 'Is the Free plan really free?',
    a: 'Yes — no credit card required. You get 2 tools, daily tasks, and the AI Command Center forever. Upgrade to Pro when you want the full prompt playbook and Prompt Lab.',
  },
  {
    q: 'What is the Prompt Lab?',
    a: 'Prompt Lab lets you paste any prompt you\'ve been using and get an AI-rewritten version that\'s sharper, more specific, and scored on three dimensions. It\'s exclusive to Pro and Team.',
  },
  {
    q: 'Who is Pro for?',
    a: 'Individuals who want the full experience — teachers, support reps, freelancers, solopreneurs, anyone who uses AI tools daily and wants to get dramatically better at them.',
  },
  {
    q: 'What\'s the minimum for Team?',
    a: 'Team requires a minimum of 2 seats. It\'s designed for small teams and growing companies who want visibility into AI skill across the whole group.',
  },
  {
    q: 'Can I mix Free and Pro users on a team?',
    a: 'Team plans cover all invited members at the per-seat rate. Individual Free or Pro plans are separate — for people joining on their own, not through a company invite.',
  },
  {
    q: 'What does the annual discount look like?',
    a: 'Annual billing gives you 2 months free — Pro drops from $10/mo to $8/mo (billed $96/yr), and Team drops from $15/seat to $12/seat/mo (billed annually).',
  },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="bg-white text-gray-900">

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gray-950 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">L</span>
            </div>
            <span className="font-bold text-gray-950 text-lg tracking-tight">LessAI</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50">Sign in</Link>
            <Link href="/signup" className="ml-1 flex items-center gap-1.5 bg-gray-950 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-gray-900/20 group">
              Get started <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative bg-white overflow-hidden">
        <div className="dot-grid-3d" />
        <div className="absolute -top-40 -left-40 w-[600px] h-[500px] bg-emerald-300/15 rounded-full blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute -top-20 right-[-100px] w-[400px] h-[350px] bg-amber-200/15 rounded-full blur-3xl pointer-events-none animate-float" style={{ animationDelay: '2s' }} />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5 text-xs font-semibold text-emerald-700 mb-6">
              <Zap className="w-3.5 h-3.5" /> Simple, transparent pricing
            </div>
            <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight text-gray-950">
              Start free. Upgrade when<br />
              <span className="bg-gradient-to-r from-emerald-600 to-amber-500 bg-clip-text text-transparent">you need more.</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              For individuals building real AI skills, and teams who want proof it&apos;s working.
            </p>
          </div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <span className={`text-sm font-semibold transition-colors ${!annual ? 'text-gray-900' : 'text-gray-400'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(a => !a)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${annual ? 'bg-emerald-500' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${annual ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-semibold transition-colors ${annual ? 'text-gray-900' : 'text-gray-400'}`}>
              Annual
              <span className="ml-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">2 months free</span>
            </span>
          </div>

          {/* Plans — 3 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">

            {/* Free */}
            <div className="group border border-gray-200 rounded-2xl p-6 flex flex-col bg-white hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-100/70 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Free</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-black text-gray-950">$0</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">No credit card required · forever free</p>
              </div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {FREE_FEATURES.map(f => (
                  <li key={f.text} className={`flex items-start gap-2 text-sm ${f.included ? 'text-gray-600' : 'text-gray-300'}`}>
                    {f.included
                      ? <CheckCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      : <X className="w-4 h-4 text-gray-200 shrink-0 mt-0.5" />}
                    {f.text}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block text-center border border-gray-200 hover:border-gray-300 text-gray-600 font-semibold text-sm py-3 rounded-xl hover:bg-gray-50 transition-colors">
                Get started free
              </Link>
            </div>

            {/* Pro */}
            <div className="group border border-blue-100 rounded-2xl p-6 flex flex-col bg-white hover:border-blue-400 hover:shadow-xl hover:shadow-blue-100/70 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-500">Pro</p>
                </div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-black text-gray-950">${annual ? '8' : '10'}</span>
                  <span className="text-sm text-gray-400 mb-2">/mo</span>
                </div>
                {annual && <p className="text-xs text-emerald-600 font-semibold">Billed $96/yr — save $24</p>}
                <p className="text-xs text-gray-400 mt-1">For individuals who want it all</p>
              </div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {PRO_FEATURES.map(f => (
                  <li key={f.text} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    {f.text === 'Prompt Lab — rewrite & score any prompt'
                      ? <span>{f.text} <span className="text-xs bg-blue-50 text-blue-500 font-semibold px-1.5 py-0.5 rounded-full border border-blue-100 ml-0.5">New</span></span>
                      : f.text}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block text-center bg-gray-950 hover:bg-gray-800 text-white font-semibold text-sm py-3 rounded-xl transition-colors">
                Start Pro trial
              </Link>
            </div>

            {/* Team — highlighted */}
            <div className="relative flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg shadow-emerald-500/30">Most popular</span>
              </div>
              <div className="group rounded-2xl p-6 flex flex-col flex-1 relative overflow-hidden bg-gray-950 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-1" style={{ border: '1px solid rgba(52,211,153,0.35)' }}
                onMouseEnter={e => (e.currentTarget.style.border = '1px solid rgba(52,211,153,0.7)')}
                onMouseLeave={e => (e.currentTarget.style.border = '1px solid rgba(52,211,153,0.35)')}>
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
                <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.15), transparent 70%)' }} />
                <div className="mb-5 relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Team</p>
                  </div>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-5xl font-black text-white">${annual ? '12' : '15'}</span>
                    <span className="text-sm text-gray-400 mb-2">/seat/mo</span>
                  </div>
                  {annual
                    ? <p className="text-xs text-emerald-400 font-semibold">Billed annually · save $36/seat/yr</p>
                    : <p className="text-xs text-gray-500">Min 2 seats · billed monthly</p>}
                </div>
                <ul className="space-y-2.5 flex-1 mb-6 relative">
                  {TEAM_FEATURES.map(f => (
                    <li key={f.text} className="flex items-start gap-2 text-sm text-gray-200">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> {f.text}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="relative group block">
                  <span className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-amber-400 rounded-xl blur opacity-40 group-hover:opacity-70 transition-opacity" />
                  <span className="relative flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-3 rounded-xl transition-colors">
                    Start team trial <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* Who each plan is for */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: '🎓', label: 'Free is great for', examples: 'Students, curious individuals, anyone trying AI for the first time' },
              { icon: '⚡', label: 'Pro is great for', examples: 'Freelancers, solopreneurs, support reps, teachers, power users' },
              { icon: '🏢', label: 'Team is great for', examples: 'Startups, SMBs, L&D managers, ops leads, anyone running a team on AI tools' },
            ].map(p => (
              <div key={p.label} className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5">
                <p className="text-xs font-bold text-gray-400 mb-1">{p.icon} {p.label}</p>
                <p className="text-sm text-gray-600">{p.examples}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature comparison table — dark */}
      <div className="relative bg-gray-950 text-white">
        <div className="line-grid-3d" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <p className="text-center text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3">Compare plans</p>
          <h2 className="text-3xl font-black text-center mb-10">Everything side by side</h2>

          <div className="relative rounded-2xl p-px overflow-hidden">
            <div className="animate-border-spin absolute" style={{ width: '200%', height: '200%', top: '-50%', left: '-50%', background: 'conic-gradient(from 0deg, transparent 0deg, #10b981 60deg, #34d399 90deg, #fbbf24 150deg, #f59e0b 180deg, transparent 240deg, #10b981 300deg, transparent 360deg)' }} />
            <div className="relative rounded-2xl overflow-hidden overflow-x-auto" style={{ background: '#0d1117' }}>
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th className="text-left px-5 py-4 w-[45%]">
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Feature</span>
                    </th>
                    {[
                      { label: 'Free', color: 'text-gray-400' },
                      { label: 'Pro', color: 'text-blue-400' },
                      { label: 'Team', color: 'text-emerald-400' },
                    ].map(col => (
                      <th key={col.label} className={`text-center px-3 py-4 text-sm font-bold ${col.color}`}>
                        {col.label === 'Team' ? (
                          <span className="inline-flex flex-col items-center gap-1">
                            <span className="font-black">Team</span>
                            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">Popular</span>
                          </span>
                        ) : col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Tools in stack', free: '2', pro: 'Unlimited', team: 'Unlimited' },
                    { feature: 'Daily practice tasks', free: true, pro: 'Unlimited', team: 'Unlimited' },
                    { feature: 'AI Command Center', free: true, pro: true, team: true },
                    { feature: 'Tool comparison guides', free: true, pro: true, team: true },
                    { feature: 'Company website context', free: true, pro: true, team: true },
                    { feature: 'Ask AI messages', free: '20/mo', pro: 'Unlimited', team: 'Unlimited' },
                    { feature: 'Prompt playbook', free: false, pro: true, team: true },
                    { feature: 'Saved prompts + folders', free: false, pro: true, team: true },
                    { feature: 'Prompt Lab ✨', free: false, pro: true, team: true },
                    { feature: 'Priority AI generation', free: false, pro: true, team: true },
                    { feature: 'Admin dashboard', free: false, pro: false, team: true },
                    { feature: 'Tool adoption analytics', free: false, pro: false, team: true },
                    { feature: 'XP leaderboard', free: false, pro: false, team: true },
                    { feature: 'Team prompt library', free: false, pro: false, team: true },
                    { feature: 'ROI & time tracking', free: false, pro: false, team: true },
                    { feature: 'CSV export', free: false, pro: false, team: true },
                    { feature: 'Priority support', free: false, pro: false, team: true },
                  ].map((row, idx) => (
                    <tr key={row.feature}
                      style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                      <td className="px-5 py-3.5 text-gray-300 font-medium text-sm">{row.feature}</td>
                      {([row.free, row.pro, row.team] as (boolean | string)[]).map((val, col) => (
                        <td key={col} className={`text-center px-3 py-3.5 ${col === 2 ? 'bg-emerald-500/5' : ''}`}>
                          {val === true ? (
                            <CheckCircle className={`w-4 h-4 mx-auto ${col === 2 ? 'text-emerald-400' : col === 1 ? 'text-blue-400' : 'text-gray-400'}`} />
                          ) : val === false ? (
                            <X className="w-3.5 h-3.5 text-white/15 mx-auto" />
                          ) : (
                            <span className={`text-xs font-semibold ${col === 2 ? 'text-emerald-400' : col === 1 ? 'text-blue-400' : 'text-gray-400'}`}>{val}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Manager callout + FAQs */}
      <div className="relative bg-gray-50 overflow-hidden">
        <div className="dot-grid-3d" />
        <div className="absolute top-0 right-[-100px] w-[500px] h-[400px] bg-emerald-200/20 rounded-full blur-3xl pointer-events-none animate-float-slow" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16">

          {/* Prompt Lab callout */}
          <div className="relative rounded-2xl p-8 mb-10 overflow-hidden" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #1e3a5f 100%)', border: '1px solid rgba(52,211,153,0.25)' }}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex items-start gap-5 flex-wrap">
              <div className="w-12 h-12 bg-emerald-400/20 border border-emerald-400/30 rounded-2xl flex items-center justify-center shrink-0">
                <FlaskConical className="w-6 h-6 text-emerald-300" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-black text-white">Prompt Lab</h3>
                  <span className="text-xs bg-amber-400/20 border border-amber-400/30 text-amber-300 font-bold px-2 py-0.5 rounded-full">Pro & Team only</span>
                </div>
                <p className="text-sm text-emerald-100/80 leading-relaxed mb-4">Paste any prompt you&apos;ve been using — we&apos;ll rewrite it to be sharper, more specific, and score it on three dimensions: Specificity, Context, and Output clarity. See exactly what changed and why.</p>
                <div className="flex gap-3 flex-wrap">
                  {['🎯 Scored before & after', '✨ AI-rewritten', '📖 Changes explained', '💾 Save to your prompts'].map(b => (
                    <span key={b} className="text-xs bg-white/10 text-emerald-200 px-2.5 py-1 rounded-full font-medium">{b}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Manager callout */}
          <div className="relative rounded-2xl p-8 text-center mb-12 overflow-hidden bg-gray-950" style={{ border: '1px solid rgba(52,211,153,0.25)' }}>
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
            <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.12), transparent 65%)' }} />
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-3 py-1 text-xs font-semibold text-emerald-300 mb-4">
                <Building2 className="w-3.5 h-3.5" /> For team leads & managers
              </div>
              <h2 className="text-2xl font-bold mb-3 text-white">Your team has AI tools. Do they know how to use them?</h2>
              <p className="text-gray-300 max-w-2xl mx-auto mb-6 leading-relaxed">
                The problem isn&apos;t access — it&apos;s skill. Your team opens ChatGPT, types a vague prompt, gets a mediocre answer, and concludes &ldquo;AI isn&apos;t that useful.&rdquo; LessAI closes that gap with role-specific prompt playbooks, daily practice, and an admin dashboard that shows exactly who&apos;s improving.
              </p>
              <Link href="/signup" className="relative group inline-flex">
                <span className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 to-amber-300 rounded-xl blur opacity-50 group-hover:opacity-80 transition-opacity" />
                <span className="relative flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold px-6 py-3 rounded-xl transition-colors">
                  Start your team trial <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>

          {/* FAQs */}
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-950">Frequently asked questions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all">
                <div className="flex items-start gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-gray-900">{q}</p>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed pl-6">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="relative bg-gray-950 text-white">
        <div className="line-grid-3d" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <div className="relative text-center rounded-2xl p-10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="absolute -inset-[1px] rounded-2xl overflow-hidden pointer-events-none">
              <div className="animate-border-spin absolute" style={{ width: '200%', height: '200%', top: '-50%', left: '-50%', background: 'conic-gradient(from 0deg, transparent 0deg, transparent 120deg, #10b981 180deg, #34d399 210deg, #6ee7b7 240deg, transparent 300deg, transparent 360deg)' }} />
            </div>
            <div className="absolute inset-[1px] rounded-2xl" style={{ background: 'rgba(15,15,15,0.95)' }} />
            <div className="absolute inset-0 rounded-2xl" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(5,150,105,0.12), transparent 70%)' }} />
            <div className="relative">
              <h2 className="text-2xl font-bold mb-3">Start free. No credit card needed.</h2>
              <p className="text-gray-400 mb-6 max-w-lg mx-auto">
                Get started with 2 tools and daily practice tasks for free. Upgrade when you&apos;re ready for the full playbook and Prompt Lab.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link href="/signup" className="relative group">
                  <span className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-amber-400 rounded-xl blur opacity-50 group-hover:opacity-80 transition-opacity" />
                  <span className="relative flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                    Get started free <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
                <a href="mailto:hello@lessai.io" className="flex items-center gap-2 border border-white/10 text-gray-300 font-semibold px-6 py-3 rounded-xl hover:bg-white/5 hover:border-white/20 transition-colors text-sm">
                  Talk to us
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-black text-xs">L</span>
                </div>
                <span className="font-bold text-white">LessAI</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">The centralized hub for mastering every AI tool your team uses — one place for prompts, practice, and skill tracking.</p>
              <a href="mailto:hello@lessai.io" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">hello@lessai.io</a>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Product</p>
              <ul className="space-y-2">
                {[{ label: 'Home', href: '/' }, { label: 'Pricing', href: '/pricing' }, { label: 'Sign up', href: '/signup' }, { label: 'Sign in', href: '/login' }].map(l => (
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
