'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight, Loader2, CheckCircle, Sparkles, Globe } from 'lucide-react'
import type { UseCase } from '@/lib/claude'

type Step = 'welcome' | 'role' | 'company' | 'generating' | 'reveal'

interface Props {
  profile: { id: string; full_name: string | null; company_id: string }
  company: { name: string; tools: string[] } | null
}

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = [1, 2, 3] as const
  return (
    <div className="flex items-center gap-2 mb-10">
      {steps.map((s, i) => {
        const done = current > s
        const active = current === s
        return (
          <div key={s} className="contents">
            <div className={`w-7 h-7 rounded-full text-xs flex items-center justify-center shrink-0 font-bold transition-colors ${
              done ? 'bg-indigo-600 text-white' :
              active ? 'bg-indigo-600 text-white' :
              'bg-gray-100 text-gray-400'
            }`}>
              {done ? <CheckCircle className="w-4 h-4" /> : s}
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 rounded-full transition-colors ${current > s ? 'bg-indigo-600' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function OnboardingClient({ profile, company }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('welcome')
  const [role, setRole] = useState('')
  const [companyWebsite, setCompanyWebsite] = useState('')
  const [useCases, setUseCases] = useState<UseCase[]>([])
  const [error, setError] = useState('')
  const [finishing, setFinishing] = useState(false)

  const firstName = profile.full_name?.split(' ')[0] ?? 'there'

  async function generatePath(skipWebsite = false) {
    setStep('generating')
    setError('')
    try {
      const res = await fetch('/api/ai/generate-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          tools: company?.tools ?? [],
          companyWebsite: skipWebsite ? '' : companyWebsite.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const supabase = createClient()
      await supabase.from('profiles').update({ role }).eq('id', profile.id)

      setUseCases(data.use_cases)
      setStep('reveal')
    } catch {
      setError('Something went wrong — please try again.')
      setStep('company')
    }
  }

  async function finish() {
    setFinishing(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ onboarded: true }).eq('id', profile.id)
    router.push('/dashboard')
  }

  if (step === 'welcome') {
    return (
      <div className="max-w-lg mx-auto pt-10 text-center">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200">
          <span className="text-white font-bold text-2xl">F</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Welcome, {firstName}! 👋
        </h1>
        <p className="text-gray-500 mb-2 text-lg leading-relaxed">
          You&apos;re about to get your personal AI path —<br />
          3 use cases built exactly for your role.
        </p>
        <p className="text-gray-400 text-sm mb-10">
          Takes 2 minutes. Claude does the work.
        </p>
        <Button
          size="lg"
          className="bg-indigo-600 hover:bg-indigo-700 gap-2 px-8"
          onClick={() => setStep('role')}
        >
          Let&apos;s go <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  if (step === 'role') {
    return (
      <div className="max-w-lg mx-auto pt-10">
        <StepIndicator current={1} />

        <h2 className="text-2xl font-bold text-gray-900 mb-1">What&apos;s your role?</h2>
        <p className="text-gray-500 text-sm mb-6">
          The more specific, the better Claude can tailor your AI path.
        </p>

        <Input
          placeholder="e.g. Marketing Manager, Sales Engineer, Product Designer…"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && role.trim() && setStep('company')}
          className="mb-4 h-11"
          autoFocus
        />

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep('welcome')}>
            Back
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 gap-2 flex-1"
            onClick={() => setStep('company')}
            disabled={!role.trim()}
          >
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  if (step === 'company') {
    return (
      <div className="max-w-lg mx-auto pt-10">
        <StepIndicator current={2} />

        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-5 h-5 text-indigo-500" />
          <h2 className="text-2xl font-bold text-gray-900">What&apos;s your company website?</h2>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Claude will read your company&apos;s homepage to understand what your business actually does — so your AI use cases reflect real priorities, not generic ones.
        </p>

        <Input
          type="url"
          placeholder="https://yourcompany.com"
          value={companyWebsite}
          onChange={(e) => setCompanyWebsite(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && generatePath()}
          className="mb-4 h-11"
          autoFocus
        />

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <div className="flex gap-3 mb-4">
          <Button variant="outline" onClick={() => setStep('role')}>
            Back
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 gap-2 flex-1"
            onClick={() => generatePath()}
            disabled={!companyWebsite.trim()}
          >
            Generate my path <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <button
          className="w-full text-sm text-gray-400 hover:text-gray-500 transition-colors"
          onClick={() => generatePath(true)}
        >
          Skip — generate without company context
        </button>
      </div>
    )
  }

  if (step === 'generating') {
    return (
      <div className="max-w-lg mx-auto pt-10">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="flex-1 h-0.5 bg-indigo-600 rounded-full" />
          <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="flex-1 h-0.5 bg-indigo-200 rounded-full" />
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        </div>

        <div className="text-center mb-10">
          <Sparkles className="w-9 h-9 text-indigo-400 mx-auto mb-3 animate-pulse" />
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Claude is building your path…
          </h2>
          <p className="text-gray-500 text-sm">
            Personalizing 3 use cases for a <strong>{role}</strong>
            {companyWebsite && <> at <strong>{new URL(companyWebsite).hostname.replace('www.', '')}</strong></>}
          </p>
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-5 w-6 bg-gray-100 rounded" />
                <div className="h-5 w-20 bg-indigo-100 rounded-full" />
              </div>
              <div className="h-5 w-3/4 bg-gray-100 rounded mb-2" />
              <div className="h-4 w-full bg-gray-100 rounded mb-1" />
              <div className="h-4 w-2/3 bg-gray-100 rounded mb-3" />
              <div className="h-16 bg-indigo-50 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto pt-10">
      <div className="flex items-center gap-2 mb-10 max-w-lg">
        {[1, 2, 3].map((s, i) => (
          <div key={s} className="contents">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
            {i < 2 && <div className="flex-1 h-0.5 bg-indigo-600 rounded-full" />}
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Your AI path is ready ✨
        </h2>
        <p className="text-gray-500 text-sm">
          3 use cases tailored for <strong>{role}</strong> — start with whichever resonates most.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {useCases.map((uc, i) => (
          <div
            key={i}
            className="border border-gray-100 rounded-xl p-5 hover:border-indigo-100 hover:bg-indigo-50/20 transition-colors"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-indigo-300 w-5 shrink-0">0{i + 1}</span>
              <span className="text-xs font-medium px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                {uc.tool}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{uc.title}</h3>
            <p className="text-sm text-gray-500 mb-3">{uc.description}</p>
            <div className="bg-indigo-50 rounded-lg p-3 mb-3">
              <p className="text-xs font-semibold text-indigo-600 mb-1 uppercase tracking-wide">Your first task</p>
              <p className="text-sm text-gray-700">{uc.first_task}</p>
            </div>
            <div className="flex items-start gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400">{uc.why}</p>
            </div>
          </div>
        ))}
      </div>

      <Button
        size="lg"
        className="bg-indigo-600 hover:bg-indigo-700 gap-2"
        onClick={finish}
        disabled={finishing}
      >
        {finishing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Setting up your dashboard…
          </>
        ) : (
          <>
            Start my AI journey <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>
    </div>
  )
}
