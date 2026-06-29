'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, Sparkles, Globe } from 'lucide-react'

const ROLES = [
  'Marketing Manager', 'Sales Representative', 'Customer Success Manager',
  'Product Manager', 'Software Engineer', 'Data Analyst',
  'HR Manager', 'Operations Manager', 'Content Creator', 'Executive / Leadership',
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('')
  const [customRole, setCustomRole] = useState('')
  const [companyWebsite, setCompanyWebsite] = useState('')
  const [generating, setGenerating] = useState(false)

  const selectedRole = role === 'Other' ? customRole : role

  async function handleGenerate() {
    if (!selectedRole) return
    setGenerating(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    await supabase.from('profiles').update({ role: selectedRole }).eq('id', user.id)

    const { data: company } = await supabase
      .from('companies')
      .select('tools')
      .eq('id', profile?.company_id)
      .single()

    await fetch('/api/ai/generate-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: selectedRole,
        tools: company?.tools ?? [],
        companyWebsite: companyWebsite.trim() || null,
      }),
    })

    await fetch('/api/ai/generate-skill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: selectedRole,
        tools: company?.tools ?? [],
        weekNumber: 1,
        previousSkills: [],
      }),
    })

    await supabase.from('profiles').update({ onboarded: true }).eq('id', user.id)
    router.push('/dashboard')
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
              step >= s ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-400'
            }`}>{s}</div>
            {s < 3 && <div className={`h-px w-8 ${step > s ? 'bg-emerald-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
        <span className="text-sm text-gray-400 ml-2">Step {step} of 3</span>
      </div>

      {/* Step 1 — Role */}
      {step === 1 && (
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">What&apos;s your role?</h1>
          <p className="text-gray-500 mb-6">
            This shapes your entire AI path — we&apos;ll tailor every use case to how you actually work.
          </p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                  role === r
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
                }`}
              >
                {r}
              </button>
            ))}
            <button
              onClick={() => setRole('Other')}
              className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                role === 'Other'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
              }`}
            >
              Other…
            </button>
          </div>

          {role === 'Other' && (
            <div className="mb-4">
              <Label htmlFor="customRole">Describe your role</Label>
              <Input
                id="customRole"
                placeholder="e.g. Growth Hacker, Founder, Legal Counsel"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
              />
            </div>
          )}

          <Button
            onClick={() => setStep(2)}
            disabled={!role || (role === 'Other' && !customRole)}
            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Step 2 — Company website */}
      {step === 2 && (
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Tell us about your company</h1>
          <p className="text-gray-500 mb-6">
            Add your company&apos;s website so LessAI can tailor your AI path to what actually matters
            at <strong>your specific company</strong> — not just your role in general.
          </p>

          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6 flex gap-3">
            <Globe className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-800">
              Claude will read your company&apos;s public website to understand your industry, product, and priorities — then use that to make every use case hyper-relevant.
            </p>
          </div>

          <div className="mb-6">
            <Label htmlFor="companyWebsite">Company website</Label>
            <Input
              id="companyWebsite"
              type="url"
              placeholder="https://yourcompany.com"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-gray-400 mt-1.5">Optional — skip if you prefer generic guidance</p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button
              onClick={() => setStep(3)}
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 — Generate */}
      {step === 3 && (
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Ready to build your path</h1>
          <p className="text-gray-500 mb-8">
            Claude will now generate your personalized AI path as a{' '}
            <strong>{selectedRole}</strong>
            {companyWebsite && <> at <strong>{companyWebsite.replace(/^https?:\/\//, '')}</strong></>}
            {' '}— 3 use cases specific to your job, plus your first weekly skill.
          </p>

          <div className="bg-emerald-50 rounded-xl p-5 mb-8 space-y-3">
            <p className="text-sm font-medium text-emerald-800">You&apos;ll get:</p>
            {[
              '3 AI use cases tailored to your exact role',
              companyWebsite ? 'Use cases informed by your company\'s actual context' : 'A concrete first task you can try today',
              'A new skill every week to keep building',
              'Alternative tasks if something doesn\'t work',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-emerald-700">
                <span className="text-emerald-500 mt-0.5">✓</span>
                {item}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
            >
              {generating ? (
                <>Generating your path…</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate my AI path</>
              )}
            </Button>
          </div>

          {generating && (
            <p className="text-sm text-gray-400 mt-4 animate-pulse">
              Claude is building your personalized path — this takes about 10 seconds…
            </p>
          )}
        </div>
      )}
    </div>
  )
}
