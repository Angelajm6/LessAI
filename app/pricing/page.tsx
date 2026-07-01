import Link from 'next/link'
import { CheckCircle, X, ArrowRight, Zap, Users, Building2, MessageSquare, Sparkles } from 'lucide-react'

const BASIC_FEATURES = [
  'AI Stack Map (up to 5 tools)',
  '10 daily tasks per tool',
  'Tool comparison guides',
  '50 Ask AI messages/month',
  'Saved prompts (up to 20)',
]

const PRO_FEATURES = [
  'AI Stack Map for all your tools',
  'Unlimited daily tasks',
  'Full tool comparison guides',
  'Unlimited Ask AI',
  'Unlimited saved prompts + folders',
  'Priority AI generation',
]

const TEAM_FEATURES = [
  'Everything in Pro',
  'Admin ROI dashboard',
  'Tool adoption analytics',
  'Unused tool detection',
  'Team invite management',
  'CSV export',
  'Slack nudges (coming soon)',
  'Priority support',
]

const ENTERPRISE_FEATURES = [
  'Everything in Team',
  'Custom AI tool integrations',
  'SSO / SAML',
  'Dedicated onboarding',
  'SLA & uptime guarantee',
  'Custom contracts & invoicing',
]

const FAQS = [
  {
    q: 'What counts as a "user"?',
    a: 'Anyone on your team who has an account and has completed onboarding. Admins are included in the count.',
  },
  {
    q: 'Do I need a credit card to start?',
    a: 'Yes — a credit card is required to start your 7-day free trial. You won\'t be charged until the trial ends, and you can cancel any time before day 7.',
  },
  {
    q: 'What happens at the end of the trial?',
    a: 'On day 4 we\'ll send a reminder that your trial is halfway through. On day 7 you\'ll get a final heads-up. If you don\'t cancel, your card is charged on day 8 for the monthly plan.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Yes — upgrade or downgrade any time. Changes take effect at the start of your next billing cycle.',
  },
  {
    q: 'What happens to my data if I cancel?',
    a: 'Your Stack Map, saved prompts, and task history are retained for 30 days after cancellation so you can export everything.',
  },
  {
    q: "Can I use LessAI if my company hasn't given me AI tools yet?",
    a: "Absolutely. Pick tools you're exploring during onboarding and use the Stack Map to learn before your company commits to licenses.",
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gray-950 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">L</span>
            </div>
            <span className="font-bold text-gray-950 text-lg tracking-tight">LessAI</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50">
              Sign in
            </Link>
            <Link href="/signup" className="ml-1 flex items-center gap-1.5 bg-gray-950 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-gray-900/20 group">
              Get started <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero + plans — white */}
      <div className="relative bg-white overflow-hidden">
        <div className="dot-grid-3d" />
        <div className="absolute -top-40 -left-40 w-[600px] h-[500px] bg-emerald-300/15 rounded-full blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute -top-20 right-[-100px] w-[400px] h-[350px] bg-amber-200/15 rounded-full blur-3xl pointer-events-none animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[200px] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 py-16">

        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5 text-xs font-semibold text-emerald-700 mb-6">
            <Zap className="w-3.5 h-3.5" /> Simple, transparent pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight text-gray-950">
            7 days free.<br />
            <span className="bg-gradient-to-r from-emerald-600 to-amber-500 bg-clip-text text-transparent">Then from $8/user/month.</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Start your free trial today. No hidden fees. Cancel any time before day 7 and you won't be charged.
          </p>
        </div>

        {/* Plans grid — 4 tiers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16 overflow-visible pt-4">

          {/* Basic */}
          <div className="group border border-gray-200 rounded-2xl p-6 flex flex-col bg-white hover:border-amber-300 hover:bg-amber-50 hover:shadow-xl hover:shadow-amber-100 transition-all duration-300">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Basic</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-black text-gray-950">$8</span>
                <span className="text-sm text-gray-400 mb-1.5">/user/mo</span>
              </div>
              <p className="text-xs text-gray-400">7-day free trial · Card required</p>
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {BASIC_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block text-center border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold text-sm py-3 rounded-xl hover:bg-white transition-colors">
              Start free trial
            </Link>
          </div>

          {/* Pro */}
          <div className="group border border-gray-200 rounded-2xl p-6 flex flex-col bg-white hover:border-amber-300 hover:bg-amber-50 hover:shadow-xl hover:shadow-amber-100 transition-all duration-300">
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Pro</p>
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-black text-gray-950">$10</span>
                <span className="text-sm text-gray-400 mb-1.5">/user/mo</span>
              </div>
              <p className="text-xs text-gray-400">7-day free trial · Card required</p>
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block text-center bg-gray-950 hover:bg-gray-800 text-white font-semibold text-sm py-3 rounded-xl transition-colors">
              Start free trial
            </Link>
          </div>

          {/* Team — highlighted */}
          <div className="relative flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
              <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg shadow-emerald-500/30">Most popular</span>
            </div>
            <div className="rounded-2xl p-6 flex flex-col flex-1 relative overflow-hidden bg-gray-950 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20" style={{ border: '1px solid rgba(52,211,153,0.35)' }}>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
              <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.15), transparent 70%)' }} />
              <div className="mb-5 relative">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Team</p>
                </div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-black text-white">$15</span>
                  <span className="text-sm text-gray-400 mb-1.5">/user/mo</span>
                </div>
                <p className="text-xs text-gray-500">7-day free trial · Card required</p>
              </div>
              <ul className="space-y-2.5 flex-1 mb-6 relative">
                {TEAM_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-200">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="relative group block">
                <span className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-amber-400 rounded-xl blur opacity-40 group-hover:opacity-70 transition-opacity" />
                <span className="relative flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-3 rounded-xl transition-colors">
                  Start free trial <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>

          {/* Enterprise */}
          <div className="group border border-gray-200 rounded-2xl p-6 flex flex-col bg-gray-50 hover:border-amber-300 hover:bg-amber-50 hover:shadow-xl hover:shadow-amber-100 transition-all duration-300">
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                <p className="text-xs font-bold uppercase tracking-widest text-amber-500">Enterprise</p>
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-black text-gray-950">Custom</span>
              </div>
              <p className="text-xs text-gray-400">Volume pricing · Annual contracts</p>
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {ENTERPRISE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> {f}
                </li>
              ))}
            </ul>
            <a href="mailto:hello@lessai.co" className="block text-center border border-gray-200 text-gray-700 font-semibold text-sm py-2.5 rounded-xl hover:bg-white hover:border-gray-300 transition-colors">
              Contact us
            </a>
          </div>
        </div>

        {/* Trial transparency note */}
        <p className="text-center text-xs text-gray-400 -mt-10 mb-10">
          Credit card required to start · Day 4 reminder · Day 7 final notice · Charged on day 8 if not cancelled
        </p>

      </div>
      </div>

      {/* Comparison table — dark */}
      <div className="relative bg-gray-950 text-white">
        <div className="line-grid-3d" />
        <div className="relative max-w-6xl mx-auto px-6 py-16">
        <div className="mb-0">
          <p className="text-center text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3">Compare plans</p>
          <h2 className="text-3xl font-black text-center mb-10">Full feature comparison</h2>

          {/* Animated gradient border wrapper */}
          <div className="relative rounded-2xl p-px overflow-hidden">
            <div className="animate-border-spin absolute" style={{ width: '200%', height: '200%', top: '-50%', left: '-50%', background: 'conic-gradient(from 0deg, transparent 0deg, #10b981 60deg, #34d399 90deg, #fbbf24 150deg, #f59e0b 180deg, transparent 240deg, #10b981 300deg, transparent 360deg)' }} />

            <div className="relative rounded-2xl overflow-hidden overflow-x-auto" style={{ background: '#0d1117' }}>
              <table className="w-full text-sm min-w-[580px]">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th className="text-left px-5 py-4 w-[40%]">
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Feature</span>
                    </th>
                    {[
                      { label: 'Basic', color: 'text-gray-400' },
                      { label: 'Pro', color: 'text-blue-400' },
                      { label: 'Team', color: 'text-emerald-400' },
                      { label: 'Ent.', color: 'text-amber-400' },
                    ].map(col => (
                      <th key={col.label} className={`text-center px-3 py-4 text-sm font-bold ${col.color}`}>
                        {col.label === 'Team' ? (
                          <span className="inline-flex flex-col items-center gap-1">
                            <span className="text-emerald-400 font-black">{col.label}</span>
                            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">Popular</span>
                          </span>
                        ) : col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'AI Stack Map', basic: '5 tools', pro: 'Unlimited', team: 'Unlimited', ent: 'Unlimited', group: 'Core' },
                    { feature: 'Daily tasks per tool', basic: '10/day', pro: 'Unlimited', team: 'Unlimited', ent: 'Unlimited', group: 'Core' },
                    { feature: 'Tool comparison guides', basic: true, pro: true, team: true, ent: true, group: 'Core' },
                    { feature: 'Ask AI messages', basic: '50/mo', pro: 'Unlimited', team: 'Unlimited', ent: 'Unlimited', group: 'Core' },
                    { feature: 'Saved prompts', basic: '20', pro: 'Unlimited', team: 'Unlimited', ent: 'Unlimited', group: 'Core' },
                    { feature: 'Priority AI generation', basic: false, pro: true, team: true, ent: true, group: 'Pro' },
                    { feature: 'Admin dashboard', basic: false, pro: false, team: true, ent: true, group: 'Team' },
                    { feature: 'Tool adoption analytics', basic: false, pro: false, team: true, ent: true, group: 'Team' },
                    { feature: 'CSV export', basic: false, pro: false, team: true, ent: true, group: 'Team' },
                    { feature: 'Team invites', basic: false, pro: false, team: true, ent: true, group: 'Team' },
                    { feature: 'SSO / SAML', basic: false, pro: false, team: false, ent: true, group: 'Ent' },
                    { feature: 'Dedicated onboarding', basic: false, pro: false, team: false, ent: true, group: 'Ent' },
                    { feature: 'Custom integrations', basic: false, pro: false, team: false, ent: true, group: 'Ent' },
                  ].map((row, idx) => (
                    <tr key={row.feature}
                      className="transition-colors duration-150 group"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {row.group === 'Pro' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
                          {row.group === 'Team' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                          {row.group === 'Ent' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                          <span className="text-gray-300 font-medium group-hover:text-white transition-colors">{row.feature}</span>
                        </div>
                      </td>
                      {[
                        { val: row.basic, col: 0 },
                        { val: row.pro, col: 1 },
                        { val: row.team, col: 2 },
                        { val: row.ent, col: 3 },
                      ].map(({ val, col }) => (
                        <td key={col} className={`text-center px-3 py-3.5 ${col === 2 ? 'bg-emerald-500/5' : ''}`}>
                          {val === true ? (
                            col === 2
                              ? <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto drop-shadow-[0_0_4px_rgba(52,211,153,0.6)]" />
                              : col === 3
                              ? <CheckCircle className="w-4 h-4 text-amber-400 mx-auto" />
                              : col === 1
                              ? <CheckCircle className="w-4 h-4 text-blue-400 mx-auto" />
                              : <CheckCircle className="w-4 h-4 text-gray-400 mx-auto" />
                          ) : val === false ? (
                            <X className="w-3.5 h-3.5 text-white/15 mx-auto" />
                          ) : (
                            <span className={`text-xs font-semibold ${col === 2 ? 'text-emerald-400' : col === 3 ? 'text-amber-400' : col === 1 ? 'text-blue-400' : 'text-gray-400'}`}>{val as string}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center gap-6 px-5 py-3 border-t border-white/6" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" /> Pro features</span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Team features</span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> Enterprise features</span>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* ROI + FAQs — gray-50 */}
      <div className="relative bg-gray-50 overflow-hidden">
        <div className="dot-grid-3d" />
        <div className="absolute top-0 right-[-100px] w-[500px] h-[400px] bg-emerald-200/20 rounded-full blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute bottom-0 left-[-50px] w-[400px] h-[300px] bg-amber-100/25 rounded-full blur-3xl pointer-events-none animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="relative max-w-6xl mx-auto px-6 py-16">
        {/* Manager ROI callout */}
        <div className="relative rounded-2xl p-8 text-center mb-16 overflow-hidden bg-gray-950" style={{ border: '1px solid rgba(52,211,153,0.25)' }}>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.12), transparent 65%)' }} />
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-3 py-1 text-xs font-semibold text-emerald-300 mb-4">
              <Building2 className="w-3.5 h-3.5" /> For team leads & HR
            </div>
            <h2 className="text-2xl font-bold mb-3 text-white">Know exactly what your AI spend is doing</h2>
            <p className="text-gray-300 max-w-xl mx-auto mb-6 leading-relaxed">
              The average company wastes 60% of its AI tool budget on licenses nobody uses.
              LessAI's Team plan gives you a real-time adoption dashboard so you can prove ROI — or cut what's not working.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto mb-6">
              {[
                { stat: '3×', label: 'faster AI adoption vs self-serve' },
                { stat: '60%', label: 'of AI licenses go unused on average' },
                { stat: '$15', label: 'per user/month — less than one unused license' },
              ].map(s => (
                <div key={s.stat} className="bg-white/6 border border-white/10 rounded-xl p-3">
                  <div className="text-2xl font-black text-amber-400 mb-0.5">{s.stat}</div>
                  <div className="text-xs text-gray-300">{s.label}</div>
                </div>
              ))}
            </div>
            <Link href="/signup" className="relative group inline-flex">
              <span className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 to-amber-300 rounded-xl blur opacity-50 group-hover:opacity-80 transition-opacity" />
              <span className="relative flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold px-6 py-3 rounded-xl transition-colors">
                Start your team trial <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>

        {/* FAQs */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-950">Frequently asked questions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-gray-300 hover:shadow-md hover:shadow-gray-100 transition-all">
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
      </div>

      {/* Bottom CTA — dark */}
      <div className="relative bg-gray-950 text-white">
        <div className="line-grid-3d" />
        <div className="relative max-w-6xl mx-auto px-6 py-16">
        <div className="relative text-center rounded-2xl p-10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="absolute -inset-[1px] rounded-2xl overflow-hidden pointer-events-none">
            <div className="animate-border-spin absolute" style={{ width: '200%', height: '200%', top: '-50%', left: '-50%', background: 'conic-gradient(from 0deg, transparent 0deg, transparent 120deg, #10b981 180deg, #34d399 210deg, #6ee7b7 240deg, transparent 300deg, transparent 360deg)' }} />
          </div>
          <div className="absolute inset-[1px] rounded-2xl" style={{ background: 'rgba(15,15,15,0.95)' }} />
          <div className="absolute inset-0 rounded-2xl" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(5,150,105,0.12), transparent 70%)' }} />
          <div className="relative">
            <h2 className="text-2xl font-bold mb-3">Ready to stop wasting AI licenses?</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Start your 7-day free trial. Cancel any time before day 7 — no charge.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/signup" className="relative group">
                <span className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 to-emerald-400 rounded-xl blur opacity-50 group-hover:opacity-80 transition-opacity" />
                <span className="relative flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold px-6 py-3 rounded-xl transition-colors">
                  Start free trial <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
              <a href="mailto:hello@lessai.co" className="flex items-center gap-2 border border-white/10 text-gray-300 font-semibold px-6 py-3 rounded-xl hover:bg-white/5 hover:border-white/20 transition-colors text-sm">
                Talk to us
              </a>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
