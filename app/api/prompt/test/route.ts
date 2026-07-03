import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) return NextResponse.json({ error: 'OPENROUTER_API_KEY not set' }, { status: 500 })

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lessai.io',
        'X-Title': 'LessAI',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-5',
        max_tokens: 20,
        messages: [{ role: 'user', content: 'Reply with just: ok' }],
      }),
    })
    const data = await res.json()
    return NextResponse.json({ status: res.status, data })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
