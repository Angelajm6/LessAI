const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const MODEL = 'anthropic/claude-sonnet-4.5'

async function chat(prompt: string, maxTokens: number): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60_000)

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
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const content = data.choices[0].message.content as string
  // Strip markdown fences
  let clean = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  // Extract just the JSON object/array if there's surrounding text
  const objStart = clean.indexOf('{')
  const objEnd = clean.lastIndexOf('}')
  if (objStart !== -1 && objEnd !== -1) clean = clean.slice(objStart, objEnd + 1)
  return clean
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UseCase {
  title: string
  description: string
  tool: string
  why?: string
  first_task?: string
  prompt_template?: string
  tips?: string[]
}

export interface ToolCard {
  tool: string
  tagline: string           // "Best for long-form writing and reasoning"
  best_for: string[]        // ["Drafting emails", "Research synthesis"]
  not_great_for: string[]   // ["Real-time web data", "Image generation"]
  vs_others: string         // "Unlike ChatGPT, Claude is better at following nuanced instructions..."
  killer_use_case: string   // One specific wow moment for this role
}

export interface DailyTask {
  day: number
  title: string
  task: string              // Specific, concrete, 10-min task
  time_minutes: number
}

export interface ToolTrack {
  tool: string
  skill_level: string       // never / learning / comfortable
  why_this_role: string     // Why this tool specifically matters for their role
  daily_tasks: DailyTask[]  // 5 daily tasks (Mon-Fri)
}

export interface StackMap {
  summary: string           // 2-sentence overview of their stack
  workflow_tip: string      // How to combine these tools together
  tool_cards: ToolCard[]
  tool_tracks: ToolTrack[]
}

// ─── Main generation ─────────────────────────────────────────────────────────

export async function generateStackMap(
  role: string,
  tools: string[],
  toolLevels: Record<string, string>,
  company?: string | null
): Promise<StackMap> {
  const toolList = tools.map(t => `${t} (${toolLevels[t] ?? 'never'})`).join(', ')
  const companyLine = company ? `They work at ${company}.` : ''

  const text = await chat(
    `You are an AI adoption coach. A ${role} has these AI tools: ${toolList}. ${companyLine}

Return a JSON object with this EXACT structure (no extra text, no markdown):

{
  "summary": "2 sentences about their stack strengths and biggest gap",
  "workflow_tip": "1 sentence on chaining 2-3 of their tools for a common ${role} task",
  "tool_cards": [
    {
      "tool": "tool name",
      "tagline": "max 6 words",
      "best_for": ["use case 1 for ${role}", "use case 2", "use case 3"],
      "not_great_for": ["limitation 1", "limitation 2"],
      "vs_others": "1 sentence vs most similar tool in their stack",
      "killer_use_case": "One specific 10-min task for a ${role} that would impress their manager"
    }
  ],
  "tool_tracks": [
    {
      "tool": "tool name",
      "skill_level": "level from input",
      "why_this_role": "1 sentence why this matters for ${role}",
      "daily_tasks": [
        {"day": 1, "title": "short name", "task": "Specific 10-min task with exact steps for a ${role}. Name the feature, give example input, state expected output.", "time_minutes": 10},
        {"day": 2, "title": "short name", "task": "...", "time_minutes": 10},
        {"day": 3, "title": "short name", "task": "...", "time_minutes": 10},
        {"day": 4, "title": "short name", "task": "...", "time_minutes": 10},
        {"day": 5, "title": "short name", "task": "...", "time_minutes": 10}
      ]
    }
  ]
}

Include ALL ${tools.length} tools in both tool_cards and tool_tracks: ${tools.join(', ')}.
daily_tasks: exactly 5 per tool, day 1=beginner, day 5=intermediate. Be specific not generic.
Return ONLY the JSON object.`,
    8192
  )

  return JSON.parse(text)
}

export async function generateAIPath(
  role: string,
  tools: string[],
  companyWebsite?: string
): Promise<UseCase[]> {
  const contextLine = companyWebsite ? `Their company website: ${companyWebsite}.` : ''
  const text = await chat(
    `You are an AI adoption coach. A ${role} uses these tools: ${tools.join(', ')}. ${contextLine}

Return a JSON array of 4-6 use cases. Each use case must match this structure:
[
  {
    "title": "short action title",
    "description": "1-2 sentences on what they'll learn",
    "tool": "which tool to use",
    "why": "1 sentence on why this matters for their role",
    "first_task": "a concrete 10-minute task to try today",
    "tips": ["tip 1", "tip 2"]
  }
]

Be specific to the ${role} role. Return ONLY the JSON array.`,
    2048
  )

  const arrStart = text.indexOf('[')
  const arrEnd = text.lastIndexOf(']')
  const json = arrStart !== -1 && arrEnd !== -1 ? text.slice(arrStart, arrEnd + 1) : text
  return JSON.parse(json)
}

// ─── Prompt Playbook ─────────────────────────────────────────────────────────

export interface PromptFramework {
  title: string         // "Write a Weekly Status Update"
  use_case: string      // When to use this (1 sentence)
  framework: string     // Reusable template with [PLACEHOLDERS] in caps
  before: string        // Example of a weak prompt
  after: string         // Strong prompt using the framework
  why_better: string    // What specifically makes the after version stronger
}

export interface ToolPlaybook {
  tool: string
  frameworks: PromptFramework[]
}

export interface Playbook {
  tool_playbooks: ToolPlaybook[]
}

export async function generatePlaybook(
  role: string,
  tools: string[],
  toolLevels: Record<string, string>,
  company?: string | null
): Promise<Playbook> {
  const toolList = tools.map(t => `${t} (${toolLevels[t] ?? 'never'})`).join(', ')
  const companyLine = company ? `They work at ${company}.` : ''

  const text = await chat(
    `You are an expert AI prompt coach. A ${role} uses these AI tools: ${toolList}. ${companyLine}

For each tool, create 3 prompt frameworks that are genuinely useful for a ${role}.
A framework is a reusable prompt template with [PLACEHOLDER] variables the user fills in.

Return a JSON object with this EXACT structure (no extra text, no markdown):

{
  "tool_playbooks": [
    {
      "tool": "exact tool name from input",
      "frameworks": [
        {
          "title": "What this framework accomplishes (5-8 words)",
          "use_case": "One sentence: when a ${role} should reach for this",
          "framework": "The full reusable prompt template. Use [CAPS_PLACEHOLDER] for variables the user fills in. Should be 3-6 sentences with clear structure. Include context, task, constraints, and output format instructions.",
          "before": "A weak, vague prompt a beginner might write for the same goal (1-2 sentences)",
          "after": "The same prompt but using the framework — filled in with a realistic example for a ${role}",
          "why_better": "One sentence: the specific technique that makes the 'after' produce better results"
        }
      ]
    }
  ]
}

Rules:
- Include ALL ${tools.length} tools: ${tools.join(', ')}
- Each tool gets exactly 3 frameworks
- Frameworks must be role-specific for a ${role}, not generic
- The [PLACEHOLDERS] in the framework template should be the parts a user customizes
- The "after" example should be filled in with realistic ${role} content, not placeholders
- Make the before/after contrast stark and educational
- Return ONLY the JSON object`,
    tools.length * 3 * 500 + 2000
  )

  return JSON.parse(text)
}

// ─── Legacy helpers (kept for backward compat) ───────────────────────────────

export async function generateAlternativeTask(
  originalTask: string,
  feedback: string,
  role: string,
  tool: string
): Promise<string> {
  const text = await chat(
    `An employee with the role "${role}" tried this AI task but it didn't work:

Original task: "${originalTask}"
Their feedback: "${feedback}"
Tool: ${tool}

Generate ONE alternative, simpler version. Be specific and concrete. Return plain text only, no JSON, no preamble.`,
    256
  )
  return text.trim()
}
