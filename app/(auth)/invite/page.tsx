'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight, Eye, EyeOff, CheckCircle, Sparkles, Users, Zap } from 'lucide-react'

function InviteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [invite, setInvite] = useState<{ id: string; company_id: string; email: string } | null>(null)
  const [invalid, setInvalid] = useState(false)
  const [form, setForm] = useState({ fullName: '', password: '' })

  useEffect(() => {
    if (!token) { setInvalid(true); setLoading(false); return }
    const supabase = createClient()
    supabase
      .from('invites')
      .select('id, company_id, email')
      .eq('token', token)
      .eq('used', false)
      .single()
      .then(({ data }) => {
        if (!data) setInvalid(true)
        else setInvite(data)
        setLoading(false)
      })
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!invite) return
    setSubmitting(true)
    setError('')

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: invite.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName },
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding`,
      },
    })

    if (signUpError) { setError(signUpError.message); setSubmitting(false); return }

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: invite.email,
        full_name: form.fullName,
        company_id: invite.company_id,
        is_admin: false,
        onboarded: false,
      })
      await supabase.from('invites').update({ used: true }).eq('id', invite.id)
      router.push('/onboarding')
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4 animate-pulse">
        <div className="h-6 w-24 bg-gray-100 rounded-lg" />
        <div className="h-8 w-48 bg-gray-100 rounded-lg" />
        <div className="h-4 w-64 bg-gray-100 rounded-lg" />
        <div className="h-10 w-full bg-gray-100 rounded-xl" />
        <div className="h-10 w-full bg-gray-100 rounded-xl" />
        <div className="h-11 w-full bg-gray-100 rounded-xl" />
      </div>
    )
  }

  // Invalid / expired
  if (invalid) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔗</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Invalid or expired link</h2>
        <p className="text-sm text-gray-500 mb-6">This invite link has already been used or doesn't exist. Ask your admin to send a new one.</p>
        <Button variant="outline" onClick={() => router.push('/login')} className="gap-2">
          Back to sign in <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Green header */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-8 py-7 text-white">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 bg-white/20 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <span className="font-bold text-white text-base">LessAI</span>
        </div>
        <h1 className="text-2xl font-black mb-1">You're invited! 🎉</h1>
        <p className="text-emerald-200 text-sm">Your team is waiting. Set up your account and build your AI Stack Map.</p>
      </div>

      <div className="px-8 py-7">
        {/* Email badge */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-6">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-sm text-emerald-800">Joining as <strong>{invite!.email}</strong></span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Your name</label>
            <Input
              placeholder="First and last name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="border-gray-200 focus:ring-emerald-400 h-11"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Create a password</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
                className="border-gray-200 focus:ring-emerald-400 h-11 pr-10"
                required
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button type="submit" disabled={submitting || !form.fullName.trim() || form.password.length < 8}
            className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 font-semibold gap-2">
            {submitting ? 'Creating account…' : <><Sparkles className="w-4 h-4" /> Join team & build my Stack Map</>}
          </Button>
        </form>

        {/* What's next */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">What happens next</p>
          <div className="space-y-2.5">
            {[
              { icon: Users, text: 'Your account is linked to your team' },
              { icon: Zap, text: 'You\'ll set up your personal AI Stack Map' },
              { icon: Sparkles, text: 'Daily tasks are generated for your tools' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-sm text-gray-500">
                <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InvitePage() {
  return (
    <Suspense>
      <InviteForm />
    </Suspense>
  )
}
