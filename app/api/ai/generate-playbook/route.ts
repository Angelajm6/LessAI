import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

import { createClient } from '@/lib/supabase/server'
import { generatePlaybookForTool } from '@/lib/claude'
import type { ToolPlaybook } from '@/lib/claude'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role, tools, toolLevels, company, companySummary, firstName } = await req.json()

  if (!tools || tools.length === 0) {
    return NextResponse.json({ error: 'No tools provided' }, { status: 400 })
  }

  // Generate one tool at a time to stay within timeout limits
  const tool_playbooks: ToolPlaybook[] = []
  for (const tool of tools as string[]) {
    try {
      const tp = await generatePlaybookForTool(role, tool, toolLevels?.[tool] ?? 'never', company ?? null, companySummary ?? null, firstName ?? null)
      tool_playbooks.push(tp)
    } catch (err) {
      console.error(`Playbook generation error for ${tool}:`, err)
      // Non-fatal — skip this tool rather than failing everything
    }
  }

  if (tool_playbooks.length === 0) {
    return NextResponse.json({ error: 'AI generation failed for all tools' }, { status: 500 })
  }

  await supabase.from('playbooks').delete().eq('user_id', user.id)
  const { error } = await supabase.from('playbooks').insert({
    user_id: user.id,
    data: { tool_playbooks },
  })

  if (error) {
    console.error('Playbook insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
