'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function InviteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [invite, setInvite] = useState<{ id: string; company_id: string; email: string } | null>(null)
  const [form, setForm] = useState({ fullName: '', password: '' })

  useEffect(() => {
    if (!token) return
    const supabase = createClient()
    supabase
      .from('invites')
      .select('id, company_id, email')
      .eq('token', token)
      .eq('used', false)
      .single()
      .then(({ data }) => setInvite(data))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!invite) return
    setLoading(true)
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

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

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

  if (!token || invite === null) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Invalid or expired invite link.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-7 h-7 bg-emerald-600 rounded-md flex items-center justify-center">
          <span className="text-white font-bold text-sm">L</span>
        </div>
        <span className="font-semibold text-gray-900 text-lg">LessAI</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">You&apos;re invited!</h1>
      <p className="text-gray-500 text-sm mb-6">
        Join your team on LessAI and start your AI journey.
      </p>

      <div className="bg-emerald-50 rounded-lg px-4 py-3 mb-6 text-sm text-emerald-700">
        Joining as <strong>{invite.email}</strong>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="fullName">Your name</Label>
          <Input
            id="fullName"
            placeholder="Your full name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Create a password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={8}
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          disabled={loading}
        >
          {loading ? 'Creating account…' : 'Join team'}
        </Button>
      </form>
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
