import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const MODEL = 'anthropic/claude-sonnet-4.5'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages, role, tools, toolLevels, company, companySummary, firstName } = await req.json()

  const toolContext = (tools as string[]).map((t: string) =>
    `- ${t} (skill level: ${(toolLevels as Record<string, string>)?.[t] ?? 'unknown'})`
  ).join('\n')

  const systemPrompt = `You are an AI tool coach embedded in LessAI, an app that helps employees master their company's AI stack.

The person you're talking to:
- Name: ${firstName ?? 'the user'}
- Role: ${role}
${company ? `- Company: ${company}` : ''}
${companySummary ? `- About their company: ${companySummary}` : ''}
- AI tools they have access to:
${toolContext}

Your job:
- Answer questions about their specific tools (features, use cases, how-tos, comparisons)
- Give advice that's targeted to their role and company context — not generic AI tips
- When comparing tools, use their actual stack — don't suggest tools they don't have
- If they ask "which tool should I use for X?", give a direct recommendation from their stack with a one-line reason
- Keep answers concise and actionable. No fluff. Max 3-4 short paragraphs.
- If you give an example prompt or action, make it specific to a ${role}'s real work${company ? ` at ${company}` : ''}

You are NOT a general-purpose assistant. Stay focused on helping them get more out of their AI tools.`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  let res: Response
  try {
    res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
        'X-Title': 'LessAI',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      }),
    })
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: `AI error: ${res.status}` }, { status: 500 })
  }

  const data = await res.json()
  const reply = data.choices[0].message.content as string
  return NextResponse.json({ reply })
}
