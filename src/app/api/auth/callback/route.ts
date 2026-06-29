import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (!existing) {
        const meta = user.user_metadata ?? {}
        const isAdmin = meta.is_admin === true

        let companyId: string | null = null
        if (isAdmin && meta.company_name) {
          const { data: company } = await supabase
            .from('companies')
            .insert({ name: meta.company_name, admin_id: user.id })
            .select('id')
            .single()
          companyId = company?.id ?? null
        }

        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email ?? '',
          full_name: meta.full_name ?? null,
          company_id: companyId,
          is_admin: isAdmin,
          onboarded: isAdmin,
        })
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
