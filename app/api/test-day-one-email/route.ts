import { NextRequest, NextResponse } from 'next/server'
import { sendDayOneSupportEmail } from '@/lib/email'

// A manually-triggered preview for the support email. It uses the cron secret
// so the endpoint cannot be used by the public to send email.
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const to = process.env.SUPPORT_EMAIL ?? 'hello@lessai.io'
  const { data, error } = await sendDayOneSupportEmail({ to, firstName: 'Angela' })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true, to, data })
}
