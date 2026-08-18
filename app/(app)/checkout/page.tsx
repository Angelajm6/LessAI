'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

function CheckoutRedirect() {
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') ?? 'pro'
  const [error, setError] = useState('')

  useEffect(() => {
    const paymentLink = plan === 'teams'
      ? process.env.NEXT_PUBLIC_STRIPE_TEAMS_PAYMENT_LINK
      : process.env.NEXT_PUBLIC_STRIPE_PRO_PAYMENT_LINK

    if (paymentLink) {
      window.location.assign(paymentLink)
    } else {
      setError('Checkout is being set up. Please try again shortly or contact hello@lessai.io.')
    }
  }, [plan])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-2.5 mb-6">
        <img src="/logo.svg" alt="LessAI" width={32} height={32} />
        <span className="font-bold text-gray-900 text-lg tracking-tight">LessAI</span>
      </div>
      {error ? (
        <div className="text-center">
          <p className="text-red-600 font-medium mb-3">{error}</p>
          <a href="/pricing" className="text-emerald-600 hover:underline text-sm">← Back to pricing</a>
        </div>
      ) : (
        <>
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-gray-500 text-sm">Setting up your trial…</p>
        </>
      )}
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    }>
      <CheckoutRedirect />
    </Suspense>
  )
}
