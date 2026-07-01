'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })
  const [focused, setFocused] = useState<string | null>(null)
  const [hovered, setHovered] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword(form)

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, onboarded')
      .eq('id', user?.id ?? '')
      .single()

    router.refresh()

    if (profile?.is_admin) {
      router.push('/admin')
    } else if (!profile?.onboarded) {
      router.push('/onboarding')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        boxShadow: hovered
          ? '0 20px 60px -10px rgba(16, 185, 129, 0.35), 0 4px 24px -4px rgba(16, 185, 129, 0.2)'
          : '0 8px 40px -8px rgba(0,0,0,0.5), 0 2px 12px -4px rgba(0,0,0,0.3)',
        transition: 'box-shadow 0.35s ease',
      }}
      className="relative bg-white rounded-2xl border border-gray-100 p-8 overflow-hidden"
    >
      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-amber-400 rounded-t-2xl" />

      {/* Background glow on hover */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 0%, rgba(167,243,208,0.35) 0%, transparent 65%)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      />

      {/* Border highlight on hover */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          border: '1.5px solid rgba(52,211,153,0.5)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.35s ease',
        }}
      />

      <div className="relative">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm shadow-emerald-200">
            <span className="text-white font-black text-sm">L</span>
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">LessAI</span>
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-1">Welcome back</h1>
        <p className="text-gray-500 text-sm mb-7">Sign in to your LessAI account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
            <div
              style={{
                transform: focused === 'email' ? 'scale(1.015)' : 'scale(1)',
                transition: 'transform 0.18s ease',
              }}
              className="relative"
            >
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                className="pl-9 border-gray-200 focus:border-emerald-400 focus:ring-emerald-400 transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
            <div
              style={{
                transform: focused === 'password' ? 'scale(1.015)' : 'scale(1)',
                transition: 'transform 0.18s ease',
              }}
              className="relative"
            >
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                className="pl-9 border-gray-200 focus:border-emerald-400 focus:ring-emerald-400 transition-colors"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 text-base font-semibold shadow-sm shadow-emerald-200 relative overflow-hidden mt-2 group/btn"
            disabled={loading}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? 'Signing in…' : (
                <>Sign in <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" /></>
              )}
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-amber-400/25 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline underline-offset-2 transition-colors">
            Get started free
          </Link>
        </p>
      </div>
    </div>
  )
}
