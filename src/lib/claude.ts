const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const MODEL = 'anthropic/claude-sonnet-4.5'
// Haiku is ~4x faster — used for onboarding generation to fit Vercel's timeout
const FAST_MODEL = 'anthropic/claude-haiku-4-5'

async function chat(prompt: string, maxTokens: number, model = MODEL): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 55_000)

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
        model: model,
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
  company?: string | null,
  companySummary?: string | null
): Promise<StackMap> {
  const toolList = tools.map(t => `${t} (${toolLevels[t] ?? 'never'})`).join(', ')
  const companyLine = company ? `They work at ${company}.` : ''
  const summaryLine = companySummary ? `Company context: ${companySummary}` : ''

  const text = await chat(
    `You are an AI adoption coach. A ${role} has these AI tools: ${toolList}. ${companyLine} ${summaryLine}

Use the company context to make every task, example, and use case specific to their actual business.

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
        {"day": 1, "title": "short name", "task": "Specific 10-min task with exact steps. Name the feature, give example input, state expected output.", "time_minutes": 10},
        {"day": 2, "title": "short name", "task": "...", "time_minutes": 10},
        {"day": 3, "title": "short name", "task": "...", "time_minutes": 10},
        {"day": 4, "title": "short name", "task": "...", "time_minutes": 10},
        {"day": 5, "title": "short name", "task": "...", "time_minutes": 10}
      ]
    }
  ]
}

Include ALL ${tools.length} tools in both tool_cards and tool_tracks: ${tools.join(', ')}.
daily_tasks: exactly 5 per tool. Return ONLY the JSON object.`,
    4096,
    FAST_MODEL
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

export async function generatePlaybookForTool(
  role: string,
  tool: string,
  level: string,
  company?: string | null,
  companySummary?: string | null,
  firstName?: string | null,
): Promise<ToolPlaybook> {
  const companyLine = company ? ` They work at ${company}${companySummary ? ` (${companySummary})` : ''}.` : ''
  const nameLine = firstName ? ` Their name is ${firstName}.` : ''
  const text = await chat(
    `You are an expert AI prompt coach. A ${role} uses ${tool} (skill level: ${level}).${companyLine}${nameLine}

Create 2 prompt frameworks that are genuinely useful for a ${role} using ${tool}.
A framework is a reusable prompt template with [PLACEHOLDER] variables.

Return a JSON object with this EXACT structure (no extra text, no markdown):

{
  "tool": "${tool}",
  "frameworks": [
    {
      "title": "What this framework accomplishes (5-8 words)",
      "use_case": "One sentence: when a ${role} should reach for this",
      "framework": "The full reusable prompt template. Use [CAPS_PLACEHOLDER] for variables. 3-5 sentences with context, task, constraints, and output format.",
      "before": "A weak, vague prompt a beginner might write (1-2 sentences)",
      "after": "The same prompt using the framework — filled in with a realistic ${role} example${company ? ` at ${company}` : ''}",
      "why_better": "One sentence: the specific technique that makes the after version better"
    }
  ]
}

Rules:
- Exactly 2 frameworks
- Role-specific for a ${role} using ${tool}, not generic${company ? ` at ${company}` : ''}
- Make before/after contrast stark and educational
- Return ONLY the JSON object`,
    2000
  )
  return JSON.parse(text)
}

export async function generatePlaybook(
  role: string,
  tools: string[],
  toolLevels: Record<string, string>,
  company?: string | null,
  companySummary?: string | null,
  firstName?: string | null,
): Promise<Playbook> {
  const toolList = tools.map(t => `${t} (${toolLevels[t] ?? 'never'})`).join(', ')
  const companyLine = company ? `They work at ${company}${companySummary ? ` — ${companySummary}` : ''}.` : ''
  const nameLine = firstName ? ` Their name is ${firstName}.` : ''

  const text = await chat(
    `You are an expert AI prompt coach. A ${role} uses these AI tools: ${toolList}. ${companyLine}${nameLine}

For each tool, create 3 prompt frameworks that are genuinely useful for a ${role}${company ? ` at ${company}` : ''}.
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
    Math.min(tools.length * 3 * 400 + 1500, 4096),
    FAST_MODEL
  )

  return JSON.parse(text)
}

// ─── AI Command Center ────────────────────────────────────────────────────────

export interface Recommendation {
  best_tool: string
  best_tool_why: string
  best_tool_prompt: string
  second_tool: string | null
  second_tool_why: string | null
  avoid_tool: string | null
  avoid_why: string | null
  sequence: Array<{ tool: string; action: string }> | null
  time_saved: string
  insight: string
}

export async function generateRecommendation(
  task: string,
  role: string,
  tools: string[],
  toolLevels: Record<string, string>,
  company?: string | null,
  companySummary?: string | null,
  firstName?: string | null,
): Promise<Recommendation> {
  const toolList = tools.map(t => `${t} (${toolLevels[t] ?? 'never used'})`).join(', ')
  const companyLine = company ? ` They work at ${company}${companySummary ? ` (${companySummary})` : ''}.` : ''
  const nameLine = firstName ? ` Their name is ${firstName}.` : ''

  const text = await chat(
    `You are an expert AI tool advisor. A ${role} wants to accomplish: "${task}"
Their AI tools: ${toolList}.${companyLine}${nameLine}

Be extremely opinionated. Pick the single best tool from their stack for this task.

Return ONLY this JSON (no extra text, no markdown):
{
  "best_tool": "exact tool name from their stack",
  "best_tool_why": "2 sentences: exactly why this tool wins for this specific task. Name the specific feature or capability that makes the difference.",
  "best_tool_prompt": "A complete, ready-to-paste prompt they can use right now. Include their role context, the task details, output format, and any constraints. 4-7 sentences. Make it feel personal to a ${role}.",
  "second_tool": "second best tool from their stack, or null if none adds value",
  "second_tool_why": "1 sentence on when to use this instead of the best tool, or null",
  "avoid_tool": "the tool from their stack most people would instinctively reach for but shouldn't for THIS task — or null",
  "avoid_why": "1 sharp sentence on why to skip it for this specific task — or null",
  "sequence": [{"tool": "tool name", "action": "short phrase what to do"}] if using 2+ tools in sequence adds significant value, otherwise null,
  "time_saved": "realistic time estimate vs doing this manually, e.g. '~20 minutes'",
  "insight": "One counterintuitive or non-obvious insight about why AI specifically accelerates this for a ${role}. Something they probably haven't realized yet."
}

Only use tools from their stack. Return ONLY valid JSON.`,
    1400
  )

  return JSON.parse(text)
}

// ─── Wrong Tool Detector ─────────────────────────────────────────────────────

export interface ToolDetection {
  wrong_tool: string
  better_tool: string
  reason: string
}

export async function detectWrongTool(
  message: string,
  role: string,
  tools: string[]
): Promise<ToolDetection | null> {
  const text = await chat(
    `A ${role} just asked: "${message}"
Their AI tools: ${tools.join(', ')}.

Does this message imply they are using (or about to use) a suboptimal tool for their task? Only flag if you're confident there is a clearly better tool in their stack.

Return ONLY one of:
- The exact string: null
- A JSON object: {"wrong_tool": "tool they seem to be using or reaching for", "better_tool": "the better tool from their stack", "reason": "one sharp sentence — specific capability that makes the better tool win here"}

Be conservative. If no clear mismatch, return null. Return ONLY the JSON or null.`,
    300
  )

  const trimmed = text.trim().replace(/^"/, '').replace(/"$/, '')
  if (trimmed === 'null') return null
  try { return JSON.parse(trimmed) } catch { return null }
}

// ─── Prompt Lab ──────────────────────────────────────────────────────────────

export interface PromptImprovement {
  improved: string
  changes: Array<{ label: string; description: string }>
  scores: {
    before: { specificity: number; context: number; output_clarity: number }
    after: { specificity: number; context: number; output_clarity: number }
  }
  summary: string
  recommended_tool: string
  why_this_tool: string
  why_not_others: Array<{ tool: string; reason: string }>
}

export async function improvePrompt(
  original: string,
  role: string,
  tools: string[],
  tool: string | null,
): Promise<PromptImprovement> {
  const toolLine = tool ? `They are using ${tool}.` : `Their tools: ${tools.join(', ')}.`

  // Use a direct fetch with system+user messages to avoid the shared chat() JSON extraction
  // which can corrupt responses when the improved prompt contains { } characters
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60_000)
  let res: Response
  try {
    res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lessai.io',
        'X-Title': 'LessAI',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1400,
        messages: [
          {
            role: 'system',
            content: 'You are an expert AI prompt coach. Always respond with valid JSON only — no markdown fences, no extra text.',
          },
          {
            role: 'user',
            content: `A ${role} wrote this prompt: "${original.replace(/"/g, "'")}"

Their AI tools: ${tools.join(', ')}.

Return this exact JSON structure:
{"improved":"rewritten prompt here","changes":[{"label":"label","description":"description"}],"scores":{"before":{"specificity":3,"context":2,"output_clarity":2},"after":{"specificity":8,"context":9,"output_clarity":8}},"summary":"key improvement sentence","recommended_tool":"ChatGPT","why_this_tool":"one sentence explaining why this tool is best for this specific prompt","why_not_others":[{"tool":"Claude","reason":"one sentence why it's not the best pick for this task"},{"tool":"Notion AI","reason":"one sentence why it's not the best pick for this task"}]}

Rules:
- improved: rewrite as a much more effective, structured prompt (3-8 sentences, role-specific for a ${role})
- changes: 3-5 items, each a distinct improvement
- scores: integers 1-10 for specificity, context, output_clarity
- summary: one sentence on the most important improvement
- recommended_tool: pick the single best tool from [${tools.join(', ')}] for this prompt based on the task type
- why_this_tool: one clear sentence on why this tool wins for this specific task — be specific, not generic
- why_not_others: include ALL other tools from the user's stack (not the recommended one), each with a brief honest reason why it's not the best pick here
- Return ONLY valid JSON, no markdown`,
          },
        ],
      }),
    })
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) throw new Error(`OpenRouter error ${res.status}: ${await res.text()}`)

  const data = await res.json()
  const raw = data.choices[0].message.content as string
  // Strip any accidental markdown fences
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  return JSON.parse(clean)
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
