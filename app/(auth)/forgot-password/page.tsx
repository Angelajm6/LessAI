'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
    })
    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 p-8 overflow-hidden"
      style={{ boxShadow: '0 8px 40px -8px rgba(0,0,0,0.5), 0 2px 12px -4px rgba(0,0,0,0.3)' }}>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-amber-400 rounded-t-2xl" />

      <div className="flex items-center gap-2 mb-8">
        <img src="/logo.svg" alt="LessAI" width={32} height={32} className="shrink-0" />
        <span className="font-bold text-gray-900 text-lg tracking-tight">LessAI</span>
      </div>

      {sent ? (
        <div className="text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-7 h-7 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Check your email</h1>
          <p className="text-gray-500 text-sm mb-1">We sent a password reset link to</p>
          <p className="font-semibold text-gray-900 text-sm mb-6">{email}</p>
          <p className="text-xs text-gray-400 mb-6">The link expires in 1 hour. Check your spam folder if you don&apos;t see it.</p>
          <Link href="/login" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline underline-offset-2">
            ← Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Reset your password</h1>
          <p className="text-gray-500 text-sm mb-7">Enter your email and we&apos;ll send you a reset link.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 text-base font-semibold shadow-sm shadow-emerald-200 mt-2">
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>

          <Link href="/login"
            className="flex items-center gap-1.5 justify-center text-sm text-gray-400 hover:text-gray-600 mt-5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        </>
      )}
    </div>
  )
}
