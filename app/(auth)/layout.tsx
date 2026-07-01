'use client'

import { useEffect, useState } from 'react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handler = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 relative overflow-hidden">

      {/* Mouse-follow glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{ background: `radial-gradient(500px circle at ${mousePos.x}px ${mousePos.y}px, rgba(16,185,129,0.07), transparent 70%)` }}
      />

      {/* 3D line grid */}
      <div className="line-grid-3d absolute inset-0 z-0" />

      {/* Floating orbs */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute -bottom-32 -right-32 w-[600px] h-[500px] bg-amber-400/8 rounded-full blur-3xl pointer-events-none animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-emerald-600/5 rounded-full blur-3xl pointer-events-none animate-float-slow" style={{ animationDelay: '1s' }} />

      {/* Small accent dots */}
      <div className="absolute top-20 right-[20%] w-2 h-2 bg-emerald-400/40 rounded-full animate-float" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-32 left-[15%] w-1.5 h-1.5 bg-amber-400/40 rounded-full animate-float-slow" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/3 left-[10%] w-1 h-1 bg-emerald-300/30 rounded-full animate-float" style={{ animationDelay: '3s' }} />

      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  )
}
