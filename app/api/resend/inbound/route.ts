import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const supportEmail = process.env.SUPPORT_EMAIL ?? 'hello@lessai.io'

/**
 * Receives Resend's `email.received` webhook and forwards the original message
 * to the inbox the team monitors. Resend retains the inbound message, so a
 * temporary forwarding failure can be replayed from its dashboard.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY
  const webhookSecret = process.env.RESEND_INBOUND_WEBHOOK_SECRET
  const forwardTo = process.env.SUPPORT_INBOX_FORWARD_TO

  if (!apiKey || !webhookSecret || !forwardTo) {
    console.error('[resend] inbound email configuration is incomplete')
    return NextResponse.json({ error: 'Inbound email is not configured' }, { status: 503 })
  }

  const payload = await req.text()
  const resend = new Resend(apiKey)

  let event
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: req.headers.get('svix-id') ?? '',
        timestamp: req.headers.get('svix-timestamp') ?? '',
        signature: req.headers.get('svix-signature') ?? '',
      },
      webhookSecret,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  if (event.type !== 'email.received') {
    return NextResponse.json({ received: true })
  }

  const { error } = await resend.emails.receiving.forward({
    emailId: event.data.email_id,
    from: `LessAI Support <${supportEmail}>`,
    to: forwardTo,
    passthrough: true,
  })

  if (error) {
    console.error('[resend] failed to forward inbound email:', error)
    return NextResponse.json({ error: 'Could not forward inbound email' }, { status: 502 })
  }

  return NextResponse.json({ received: true })
}
