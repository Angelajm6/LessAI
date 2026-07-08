'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, User, Building2, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState<string | null>(null)
  const [hovered, setHovered] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', fullName: '', companyName: '' })

  function passwordStrength(p: string): { score: number; label: string; color: string } {
    if (!p) return { score: 0, label: '', color: '' }
    let score = 0
    if (p.length >= 8) score++
    if (p.length >= 12) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    if (score <= 1) return { score, label: 'Weak', color: 'bg-red-400' }
    if (score <= 2) return { score, label: 'Fair', color: 'bg-amber-400' }
    if (score <= 3) return { score, label: 'Good', color: 'bg-blue-400' }
    return { score, label: 'Strong', color: 'bg-emerald-500' }
  }
  const pwStrength = passwordStrength(form.password)

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

    if (data.user) {
      const { data: company } = await supabase
        .from('companies')
        .insert({ name: form.companyName, admin_id: data.user.id })
        .select()
        .single()

      await supabase.from('profiles').insert({
        id: data.user.id,
        email: form.email,
        full_name: form.fullName,
        company_id: company?.id,
        is_admin: true,
        onboarded: true,
      })

      router.push('/admin')
    }
  }

  const fields = [
    { id: 'fullName', label: 'Your name', placeholder: 'Angela Martin', type: 'text', icon: User, key: 'fullName' as const },
    { id: 'companyName', label: 'Company name', placeholder: 'Acme Corp', type: 'text', icon: Building2, key: 'companyName' as const },
    { id: 'email', label: 'Work email', placeholder: 'you@company.com', type: 'email', icon: Mail, key: 'email' as const },
    { id: 'password', label: 'Password', placeholder: 'Min. 8 characters', type: 'password', icon: Lock, key: 'password' as const },
  ]

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
          <img src="/logo.svg" alt="LessAI" width={32} height={32} className="shrink-0" />
          <span className="font-bold text-gray-900 text-lg tracking-tight">LessAI</span>
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-1">Create your account</h1>
        <p className="text-gray-500 text-sm mb-6">Set up LessAI for your team — 7-day free trial</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(({ id, label, placeholder, type, icon: Icon, key }) => (
            <div key={id} className="space-y-1.5">
              <Label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</Label>
              <div
                style={{ transform: focused === id ? 'scale(1.015)' : 'scale(1)', transition: 'transform 0.18s ease' }}
                className="relative"
              >
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  id={id}
                  type={key === 'password' ? (showPassword ? 'text' : 'password') : type}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  onFocus={() => setFocused(id)}
                  onBlur={() => setFocused(null)}
                  className={`pl-9 border-gray-200 focus:border-emerald-400 focus:ring-emerald-400 transition-colors ${key === 'password' ? 'pr-10' : ''}`}
                  minLength={key === 'password' ? 8 : undefined}
                  required
                />
                {key === 'password' && (
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
              {key === 'password' && form.password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= pwStrength.score ? pwStrength.color : 'bg-gray-100'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${pwStrength.score <= 1 ? 'text-red-500' : pwStrength.score <= 2 ? 'text-amber-500' : pwStrength.score <= 3 ? 'text-blue-500' : 'text-emerald-600'}`}>
                    {pwStrength.label}
                  </p>
                </div>
              )}
            </div>
          ))}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 text-base font-semibold gap-2 shadow-sm shadow-emerald-200 group/btn relative overflow-hidden mt-2"
            disabled={loading}
          >
            <span className="relative z-10 flex items-center gap-2">
              {loading ? 'Creating account…' : <>Create account <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" /></>}
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline underline-offset-2 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
