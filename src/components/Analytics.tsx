'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { identifyUser, initAnalytics, resetUser } from '@/lib/analytics/client'

/**
 * Boots Amplitude and keeps its user id in sync with the Supabase session.
 * Rendered once in the root layout; renders nothing.
 */
export default function Analytics() {
  useEffect(() => {
    initAnalytics()

    const supabase = createClient()

    // Sign-out happens through a server route, so the browser client does not
    // always emit SIGNED_OUT. Reconcile on every page load instead.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) identifyUser(session.user.id)
      else resetUser()
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') resetUser()
      else if (session?.user) identifyUser(session.user.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  return null
}
