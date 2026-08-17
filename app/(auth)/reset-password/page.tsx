'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [checkingLink, setCheckingLink] = useState(true)
  const [linkError, setLinkError] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [complete, setComplete] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data, error: userError }) => {
      if (userError || !data.user) {
        setLinkError('This reset link is invalid or has expired. Request a new one and try again.')
      }
      setCheckingLink(false)
    })
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Choose a password with at least 8 characters.')
      return
    }
    if (password !== confirmation) {
      setError('Your passwords do not match.')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setComplete(true)
    setSaving(false)
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-8" style={{ boxShadow: '0 8px 40px -8px rgba(0,0,0,0.5), 0 2px 12px -4px rgba(0,0,0,0.3)' }}>
      <div className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-amber-400" />
      <div className="mb-8 flex items-center gap-2">
        <img src="/logo.svg" alt="LessAI" width={32} height={32} className="shrink-0" />
        <span className="text-lg font-bold tracking-tight text-gray-900">LessAI</span>
      </div>

      {checkingLink ? (
        <div className="py-7 text-center"><p className="text-sm text-gray-500">Verifying your reset link…</p></div>
      ) : linkError ? (
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50"><ShieldCheck className="h-7 w-7 text-amber-600" /></div>
          <h1 className="mb-2 text-2xl font-black text-gray-900">Reset link expired</h1>
          <p className="mb-6 text-sm leading-6 text-gray-500">{linkError}</p>
          <Link href="/forgot-password" className="inline-flex rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-700">Send a new reset link</Link>
        </div>
      ) : complete ? (
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50"><CheckCircle2 className="h-7 w-7 text-emerald-600" /></div>
          <h1 className="mb-2 text-2xl font-black text-gray-900">Password updated</h1>
          <p className="mb-6 text-sm leading-6 text-gray-500">You&apos;re all set. Your LessAI account is secure with your new password.</p>
          <Button onClick={() => router.push('/dashboard')} className="w-full bg-emerald-600 text-base font-semibold hover:bg-emerald-700">Open my dashboard →</Button>
        </div>
      ) : (
        <>
          <h1 className="mb-1 text-2xl font-black text-gray-900">Choose a new password</h1>
          <p className="mb-7 text-sm text-gray-500">Use at least 8 characters. A unique passphrase is best.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordField id="password" label="New password" value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword(current => !current)} />
            <PasswordField id="confirmation" label="Confirm new password" value={confirmation} onChange={setConfirmation} show={showPassword} onToggle={() => setShowPassword(current => !current)} />
            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2"><p className="text-sm text-red-600">{error}</p></div>}
            <Button type="submit" disabled={saving} className="mt-2 h-11 w-full bg-emerald-600 text-base font-semibold shadow-sm shadow-emerald-200 hover:bg-emerald-700">{saving ? 'Updating…' : 'Update password'}</Button>
          </form>
          <Link href="/login" className="mt-5 flex items-center justify-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-600"><ArrowLeft className="h-3.5 w-3.5" /> Back to sign in</Link>
        </>
      )}
    </div>
  )
}

function PasswordField({ id, label, value, onChange, show, onToggle }: { id: string; label: string; value: string; onChange: (value: string) => void; show: boolean; onToggle: () => void }) {
  return <div className="space-y-1.5">
    <Label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</Label>
    <div className="relative">
      <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input id={id} type={show ? 'text' : 'password'} value={value} onChange={event => onChange(event.target.value)} className="border-gray-200 pl-9 pr-10 focus:border-emerald-400 focus:ring-emerald-400" required autoComplete={id === 'password' ? 'new-password' : 'new-password'} />
      <button type="button" onClick={onToggle} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
    </div>
  </div>
}
