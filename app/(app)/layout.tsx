import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LogOut } from 'lucide-react'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, is_admin')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="bg-gray-950 border-b border-white/10 px-6 py-3 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href={profile?.is_admin ? '/admin' : '/dashboard'} className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center shadow-sm shadow-emerald-900/50">
              <span className="text-white font-bold text-xs">L</span>
            </div>
            <span className="font-semibold text-white">LessAI</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-gray-500">{profile?.full_name}</span>
            <form action="/api/auth/signout" method="post">
              <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-300 transition-colors">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  )
}
