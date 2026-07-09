import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LogOut, Settings } from 'lucide-react'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('full_name, is_admin')
    .eq('id', user.id)
    .single()

  const profile = rawProfile ? {
    ...rawProfile,
    full_name: rawProfile.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? null,
  } : rawProfile

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-3 sm:px-6 py-3 sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <Link href={profile?.is_admin ? '/admin' : '/dashboard'} className="flex items-center gap-2">
            <img src="/logo.svg" alt="LessAI" width={24} height={24} className="shrink-0" />
            <span className="font-semibold text-gray-900">LessAI</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-gray-500">{profile?.full_name}</span>
            <Link href="/settings" className="text-gray-400 hover:text-gray-700 transition-colors">
              <Settings className="w-4 h-4" />
            </Link>
            <form action="/api/auth/signout" method="post">
              <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="max-w-screen-2xl mx-auto px-3 sm:px-4 py-5 sm:py-8">{children}</main>
    </div>
  )
}
