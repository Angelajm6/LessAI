import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MODEL = 'anthropic/claude-sonnet-4-5'

async function summariseWebsite(url: string): Promise<string> {
  // Normalise URL
  const fullUrl = url.startsWith('http') ? url : `https://${url}`

  // Fetch the homepage HTML
  const res = await fetch(fullUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LessAI/1.0)' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Could not fetch ${fullUrl} (${res.status})`)

  const html = await res.text()

  // Strip tags and collapse whitespace — keep only visible text
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 6000) // cap to avoid huge token usage

  // Summarise with Claude via OpenRouter
  const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://lessai.io',
      'X-Title': 'LessAI',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: 'You extract company context from website text. Be factual and concise.',
        },
        {
          role: 'user',
          content: `From this website text, extract a 3-sentence company summary covering: what they do, who their customers are, and their industry/niche. Be specific — use their actual product/service names.\n\n${text}`,
        },
      ],
    }),
  })

  if (!aiRes.ok) throw new Error(`AI error ${aiRes.status}`)
  const data = await aiRes.json()
  return data.choices[0].message.content.trim()
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url } = await req.json()
  if (!url?.trim()) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

  try {
    const summary = await summariseWebsite(url.trim())
    return NextResponse.json({ summary })
  } catch (e) {
    console.error('Scrape error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
