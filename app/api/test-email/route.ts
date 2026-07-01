import { NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email'

// DELETE THIS FILE before going to production
export async function GET() {
  const { data, error } = await sendWelcomeEmail({
    to: 'angelajaume.m@gmail.com',
    firstName: 'Angela',
    role: 'Marketing Manager',
    tools: ['Claude', 'Notion AI', 'Grammarly', 'ChatGPT'],
    stackSummary: 'As a Marketing Manager, your strongest combo is Claude for drafting and strategy, paired with Notion AI for organizing campaigns. Grammarly keeps your copy polished across every channel. Start with Claude — it has the highest ceiling for your role.',
  })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true, data })
}
