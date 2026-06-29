'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkEmail, setCheckEmail] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    companyName: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName, company_name: form.companyName, is_admin: true },
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/admin`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user && !data.session) {
      // Email confirmation is enabled — user exists but isn't authenticated yet
      setCheckEmail(true)
      setLoading(false)
      return
    }

    if (data.user && data.session) {
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({ name: form.companyName, admin_id: data.user.id })
        .select()
        .single()

      if (companyError) {
        setError('Failed to create company: ' + companyError.message)
        setLoading(false)
        return
      }

      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email: form.email,
        full_name: form.fullName,
        company_id: company?.id,
        is_admin: true,
        onboarded: true,
      })

      if (profileError) {
        setError('Failed to create profile: ' + profileError.message)
        setLoading(false)
        return
      }

      router.push('/admin')
    }
  }

  if (checkEmail) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📬</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Check your email</h1>
        <p className="text-gray-500 text-sm mb-1">
          We sent a confirmation link to <strong>{form.email}</strong>.
        </p>
        <p className="text-gray-400 text-sm">
          Click it to activate your account and get to your admin dashboard.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
          <span className="text-white font-bold text-sm">F</span>
        </div>
        <span className="font-semibold text-gray-900 text-lg">Fluent</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
      <p className="text-gray-500 text-sm mb-6">Set up Fluent for your team — free to start</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="fullName">Your name</Label>
          <Input
            id="fullName"
            placeholder="Angela Martin"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="companyName">Company name</Label>
          <Input
            id="companyName"
            placeholder="Acme Corp"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
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
          className="w-full bg-indigo-600 hover:bg-indigo-700"
          disabled={loading}
        >
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-indigo-600 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
