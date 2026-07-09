import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code)

    if (user) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existing) {
        const meta = user.user_metadata ?? {}
        const companyName = (meta.company_name as string) ?? ''

        const { data: company } = await supabase
          .from('companies')
          .insert({ name: companyName, admin_id: user.id })
          .select()
          .single()

        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email ?? '',
          full_name: (meta.full_name as string) ?? '',
          company_id: company?.id ?? null,
          is_admin: true,
          onboarded: true,
        })
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
