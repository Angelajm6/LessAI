'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, X, ArrowRight, Zap, Users, Building2, MessageSquare, Sparkles, Mail, Shield } from 'lucide-react'

function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <img src="/logo.svg" alt="LessAI" width={size} height={size} className="shrink-0" style={{ width: size, height: size }} />
  )
}

const PRO_FEATURES = [
  { text: 'Unlimited tools in your stack', included: true },
  { text: 'Full prompt playbook per tool', included: true },
  { text: 'Unlimited daily practice tasks', included: true },
  { text: 'Prompt Studio (Lab + Command Center)', included: true },
  { text: 'Multi-tool Workflows', included: true },
  { text: 'Saved prompts + folders', included: true },
  { text: 'Tool comparison guides', included: true },
  { text: 'Company website context', included: true },
  { text: 'XP, streaks & level system', included: true },
  { text: 'Weekly progress digest email', included: true },
]

const TEAM_FEATURES = [
  { text: 'Everything in Pro — per seat', included: true },
  { text: 'Admin dashboard', included: true },
  { text: 'Tool adoption analytics', included: true },
  { text: 'XP & streak leaderboard', included: true },
  { text: 'Team prompt library', included: true },
  { text: 'Member invite management', included: true },
  { text: 'Skill gap visibility', included: true },
  { text: 'CSV export', included: true },
  { text: 'Dedicated support channel', included: true },
]

const ENTERPRISE_FEATURES = [
  'Everything in Teams',
  'Unlimited seats',
  'Custom onboarding & setup',
  'SSO / SAML',
  'Custom tool tracks & playbooks',
  'SLA & uptime guarantee',
  'Dedicated account manager',
  'Invoice billing',
]

const FAQS = [
  {
    q: 'How does the 7-day free trial work?',
    a: 'Start your trial with full access — no limits, no feature locks. We collect your card at signup but won\'t charge until day 8. Cancel any time before that and you pay nothing.',
  },
  {
    q: 'What is Prompt Studio?',
    a: 'Two modes in one. Command Center: describe any work task in plain English → get the right tool + a ready-to-paste prompt. Prompt Lab: paste any prompt you\'ve been using → get it AI-rewritten and scored on Specificity, Context, and Output Clarity.',
  },
  {
    q: 'Who is Pro for?',
    a: 'Individuals who want the full experience — marketers, ops managers, sales reps, freelancers, anyone who uses AI tools daily and wants to get dramatically better at them.',
  },
  {
    q: 'What\'s the minimum for Teams?',
    a: 'Teams requires a minimum of 2 seats. It\'s built for small teams and growing companies who want visibility into AI skill across the whole group.',
  },
  {
    q: 'What does the annual discount look like?',
    a: 'Annual billing saves you 2 months — Pro drops from $12/mo to $10/mo (billed $120/yr), and Teams drops from $19/seat/mo to $15/seat/mo (billed annually per seat).',
  },
  {
    q: 'What\'s included in Enterprise?',
    a: 'Enterprise is fully custom — unlimited seats, SSO, custom tool tracks, a dedicated account manager, SLA guarantees, and invoice billing. Email us at hello@lessai.io to get a quote.',
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
            <LogoMark size={28} />
            <span className="font-bold text-gray-950 text-lg tracking-tight">LessAI</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50">Sign in</Link>
            <Link href="/signup" className="ml-1 flex items-center gap-1.5 bg-gray-950 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-gray-900/20 group">
              Start free trial <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative bg-white overflow-hidden">
        <div className="dot-grid-3d" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5 text-xs font-semibold text-emerald-700 mb-6">
              <Zap className="w-3.5 h-3.5" /> 7-day free trial on all plans
            </div>
            <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight text-gray-950">
              Try free for 7 days.<br />
              <span className="bg-gradient-to-r from-emerald-600 to-amber-500 bg-clip-text text-transparent">Cancel anytime.</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Full access from day one. Card collected at signup, charged on day 8. No surprise fees.
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

            {/* Pro */}
            <div className="border border-emerald-100 rounded-2xl p-6 flex flex-col bg-white shadow-sm hover:shadow-lg hover:shadow-emerald-100/60 hover:border-emerald-300 hover:-translate-y-1 transition-all duration-200">
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Pro</p>
                </div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-black text-gray-950">${annual ? '10' : '12'}</span>
                  <span className="text-sm text-gray-400 mb-2">/mo</span>
                </div>
                {annual
                  ? <p className="text-xs text-emerald-600 font-semibold">Billed $120/yr — save $24</p>
                  : <p className="text-xs text-gray-400 mt-1">7-day free trial · then billed monthly</p>}
              </div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {PRO_FEATURES.map(f => (
                  <li key={f.text} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    {f.text === 'Prompt Studio (Lab + Command Center)'
                      ? <span>{f.text} <span className="text-xs bg-emerald-50 text-emerald-600 font-semibold px-1.5 py-0.5 rounded-full border border-emerald-100 ml-0.5">New</span></span>
                      : f.text}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block text-center bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm py-3 rounded-xl transition-colors shadow-sm">
                Start 7-day free trial
              </Link>
              <p className="text-xs text-center text-gray-400 mt-2">No charge until day 8</p>
            </div>

            {/* Teams — highlighted */}
            <div className="relative flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg shadow-emerald-500/30">Most popular</span>
              </div>
              <div className="rounded-2xl p-6 flex flex-col flex-1 relative overflow-hidden bg-gray-950 transition-all duration-200 hover:shadow-2xl hover:shadow-emerald-500/40 hover:-translate-y-1" style={{ border: '1px solid rgba(52,211,153,0.35)' }}
                onMouseEnter={e => { e.currentTarget.style.border = '1px solid rgba(52,211,153,0.8)'; e.currentTarget.style.background = '#0a1f17' }}
                onMouseLeave={e => { e.currentTarget.style.border = '1px solid rgba(52,211,153,0.35)'; e.currentTarget.style.background = '' }}>
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
                <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.15), transparent 70%)' }} />
                <div className="mb-5 relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Teams</p>
                  </div>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-5xl font-black text-white">${annual ? '15' : '19'}</span>
                    <span className="text-sm text-gray-400 mb-2">/seat/mo</span>
                  </div>
                  {annual
                    ? <p className="text-xs text-emerald-400 font-semibold">Billed annually · save $48/seat/yr</p>
                    : <p className="text-xs text-gray-500">Min 2 seats · 7-day free trial</p>}
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
                <p className="text-xs text-center text-gray-600 mt-2">No charge until day 8</p>
              </div>
            </div>

            {/* Enterprise */}
            <div className="border border-gray-100 rounded-2xl p-6 flex flex-col bg-white shadow-sm hover:shadow-md hover:border-gray-200 hover:-translate-y-1 transition-all duration-200">
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-3.5 h-3.5 text-gray-500" />
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Enterprise</p>
                </div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-black text-gray-950 leading-tight">Custom</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Tailored to your org size & needs</p>
              </div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {ENTERPRISE_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <Shield className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <a href="mailto:hello@lessai.io" className="block text-center border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold text-sm py-3 rounded-xl hover:bg-gray-50 transition-colors">
                Talk to sales
              </a>
              <p className="text-xs text-center text-gray-400 mt-2">Reply within 1 business day</p>
            </div>

          </div>

          {/* Who each plan is for */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: '⚡', label: 'Pro is great for', examples: 'Freelancers, solopreneurs, individual contributors, and anyone who uses AI tools daily and wants to get dramatically better' },
              { icon: '🏢', label: 'Teams is great for', examples: 'Startups, SMBs, L&D managers, ops leads — anyone rolling AI out across a team and needing visibility into who\'s actually leveling up' },
              { icon: '🔒', label: 'Enterprise is great for', examples: 'Large orgs that need SSO, custom tool tracks, SLA guarantees, dedicated onboarding, and invoice billing' },
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
                      { label: 'Pro', color: 'text-emerald-300' },
                      { label: 'Teams', color: 'text-emerald-400', popular: true },
                      { label: 'Enterprise', color: 'text-gray-300' },
                    ].map(col => (
                      <th key={col.label} className={`text-center px-3 py-4 text-sm font-bold ${col.color}`}>
                        {col.popular ? (
                          <span className="inline-flex flex-col items-center gap-1">
                            <span className="font-black">Teams</span>
                            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">Popular</span>
                          </span>
                        ) : col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Tools in stack', pro: 'Unlimited', team: 'Unlimited', enterprise: 'Unlimited' },
                    { feature: 'Daily practice tasks', pro: 'Unlimited', team: 'Unlimited', enterprise: 'Unlimited' },
                    { feature: 'Prompt playbook per tool', pro: true, team: true, enterprise: true },
                    { feature: 'AI Command Center', pro: true, team: true, enterprise: true },
                    { feature: 'Tool comparison guides', pro: true, team: true, enterprise: true },
                    { feature: 'Company website context', pro: true, team: true, enterprise: true },
                    { feature: 'Prompt Studio ✨', pro: true, team: true, enterprise: true },
                    { feature: 'Multi-tool Workflows', pro: true, team: true, enterprise: true },
                    { feature: 'Saved prompts + folders', pro: true, team: true, enterprise: true },
                    { feature: 'XP, streaks & levels', pro: true, team: true, enterprise: true },
                    { feature: 'Weekly digest email', pro: true, team: true, enterprise: true },
                    { feature: 'Admin dashboard', pro: false, team: true, enterprise: true },
                    { feature: 'Tool adoption analytics', pro: false, team: true, enterprise: true },
                    { feature: 'XP leaderboard', pro: false, team: true, enterprise: true },
                    { feature: 'Team prompt library', pro: false, team: true, enterprise: true },
                    { feature: 'Skill gap visibility', pro: false, team: true, enterprise: true },
                    { feature: 'CSV export', pro: false, team: true, enterprise: true },
                    { feature: 'Dedicated support channel', pro: false, team: true, enterprise: true },
                    { feature: 'SSO / SAML', pro: false, team: false, enterprise: true },
                    { feature: 'Custom tool tracks', pro: false, team: false, enterprise: true },
                    { feature: 'Dedicated account manager', pro: false, team: false, enterprise: true },
                    { feature: 'SLA & uptime guarantee', pro: false, team: false, enterprise: true },
                    { feature: 'Invoice billing', pro: false, team: false, enterprise: true },
                  ].map((row, idx) => (
                    <tr key={row.feature}
                      style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                      <td className="px-5 py-3.5 text-gray-300 font-medium text-sm">{row.feature}</td>
                      {([row.pro, row.team, row.enterprise] as (boolean | string)[]).map((val, col) => (
                        <td key={col} className={`text-center px-3 py-3.5 ${col === 1 ? 'bg-emerald-500/5' : ''}`}>
                          {val === true ? (
                            <CheckCircle className={`w-4 h-4 mx-auto ${col === 1 ? 'text-emerald-400' : col === 0 ? 'text-emerald-300' : 'text-gray-400'}`} />
                          ) : val === false ? (
                            <X className="w-3.5 h-3.5 text-white/15 mx-auto" />
                          ) : (
                            <span className={`text-xs font-semibold ${col === 1 ? 'text-emerald-400' : col === 0 ? 'text-emerald-300' : 'text-gray-400'}`}>{val}</span>
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

      {/* Callouts + FAQs */}
      <div className="relative bg-gray-50 overflow-hidden">
        <div className="dot-grid-3d" />
        <div className="absolute top-0 right-[-100px] w-[500px] h-[400px] bg-emerald-200/20 rounded-full blur-3xl pointer-events-none animate-float-slow" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16">

          {/* Prompt Studio callout */}
          <div className="relative rounded-2xl p-8 mb-6 overflow-hidden" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #1e3a5f 100%)', border: '1px solid rgba(52,211,153,0.25)' }}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex items-start gap-5 flex-wrap">
              <div className="w-12 h-12 bg-emerald-400/20 border border-emerald-400/30 rounded-2xl flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-emerald-300" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-black text-white">Prompt Studio</h3>
                  <span className="text-xs bg-amber-400/20 border border-amber-400/30 text-amber-300 font-bold px-2 py-0.5 rounded-full">Pro & Teams</span>
                </div>
                <p className="text-sm text-emerald-100/80 leading-relaxed mb-4">Two modes in one place. <strong className="text-white">Command Center</strong> — describe any task and get the right tool + a ready-to-paste prompt. <strong className="text-white">Prompt Lab</strong> — paste any prompt, get an AI-rewritten version scored on Specificity, Context, and Output Clarity.</p>
                <div className="flex gap-3 flex-wrap">
                  {['⚡ AI tool recommendations', '🎯 Scored before & after', '✨ AI-rewritten prompts', '💾 Save to your library'].map(b => (
                    <span key={b} className="text-xs bg-white/10 text-emerald-200 px-2.5 py-1 rounded-full font-medium">{b}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Teams callout */}
          <div className="relative rounded-2xl p-8 text-center mb-12 overflow-hidden bg-gray-950" style={{ border: '1px solid rgba(52,211,153,0.25)' }}>
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
            <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.12), transparent 65%)' }} />
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-3 py-1 text-xs font-semibold text-emerald-300 mb-4">
                <Building2 className="w-3.5 h-3.5" /> For team leads & managers
              </div>
              <h2 className="text-2xl font-bold mb-3 text-white">Your team has AI tools. Do they know how to use them?</h2>
              <p className="text-gray-300 max-w-2xl mx-auto mb-6 leading-relaxed">
                The problem isn&apos;t access — it&apos;s skill. Your team opens ChatGPT, types a vague prompt, gets a mediocre answer, and concludes &ldquo;AI isn&apos;t that useful.&rdquo; LessAI closes that gap — and gives you a live dashboard showing exactly who&apos;s improving.
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
              <h2 className="text-2xl font-bold mb-3">7 days free. No risk.</h2>
              <p className="text-gray-400 mb-6 max-w-lg mx-auto">
                Full access from day one. We collect your card at signup and charge on day 8 — cancel any time before that and you pay nothing.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link href="/signup" className="relative group">
                  <span className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-amber-400 rounded-xl blur opacity-50 group-hover:opacity-80 transition-opacity" />
                  <span className="relative flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                    Start free trial <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
                <a href="mailto:hello@lessai.io" className="flex items-center gap-2 border border-white/10 text-gray-300 font-semibold px-6 py-3 rounded-xl hover:bg-white/5 hover:border-white/20 transition-colors text-sm">
                  Talk to sales
                </a>
              </div>
              <p className="text-xs text-gray-600 mt-4">No charge until day 8 · cancel any time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <LogoMark size={26} />
                <span className="font-bold text-white">LessAI</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">The centralized hub for mastering every AI tool your team uses — one place for prompts, practice, and skill tracking.</p>
              <a href="mailto:hello@lessai.io" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5"><Mail className="w-3 h-3" />hello@lessai.io</a>
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
