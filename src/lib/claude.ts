import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface UseCase {
  title: string
  description: string
  first_task: string
  tool: string
  why: string
}

export interface Skill {
  title: string
  description: string
  task: string
  tool: string
  estimated_minutes: number
}

export async function generateAIPath(
  role: string,
  tools: string[],
  companyWebsite?: string
): Promise<UseCase[]> {
  const toolList = tools.join(', ') || 'ChatGPT, Claude'
  const companySection = companyWebsite
    ? `\nThe employee works at a company whose website is: ${companyWebsite}\nUse what you know about this company (industry, product, customers, and priorities) to make the use cases reflect what actually matters at this specific company.\n`
    : ''

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are an AI adoption coach. Generate exactly 3 specific, practical AI use cases for someone with the role: "${role}".

Their company uses these AI tools: ${toolList}
${companySection}
Return a JSON array of exactly 3 objects with this structure:
[
  {
    "title": "short action-oriented title (max 6 words)",
    "description": "2 sentences explaining the use case and why it matters for their role",
    "first_task": "one specific, concrete task they can do in the next 30 minutes to try this — be very specific, not generic",
    "tool": "which tool from their list to use (pick the most appropriate one)",
    "why": "one sentence on why this use case saves them time or makes them better at their job"
  }
]

Make them role-specific and immediately actionable. No generic advice. Return only the JSON array, no other text.`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return JSON.parse(text)
}

export async function generateWeeklySkill(
  role: string,
  tools: string[],
  weekNumber: number,
  previousSkills: string[]
): Promise<Skill> {
  const toolList = tools.join(', ') || 'ChatGPT, Claude'
  const prevList = previousSkills.length > 0 ? previousSkills.join(', ') : 'none yet'

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `You are an AI adoption coach. Generate one AI skill for week ${weekNumber} for a "${role}".

Their AI tools: ${toolList}
Skills they already learned: ${prevList}

The skill should:
- Be NEW (not something they already learned)
- Be learnable in 5 minutes
- Come with a real, specific work task to try it on
- Build progressively (week 1 = basics, later weeks = advanced)

Return a single JSON object:
{
  "title": "short action-oriented skill name",
  "description": "explain the skill in 2 sentences — what it is and when to use it",
  "task": "the specific thing to try TODAY using this skill — be very concrete, mention the tool, give example prompts if relevant",
  "tool": "which of their tools to use",
  "estimated_minutes": 15
}

Return only the JSON object, no other text.`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return JSON.parse(text)
}

export async function generateAlternativeTask(
  originalTask: string,
  feedback: string,
  role: string,
  tool: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `An employee with the role "${role}" tried this AI task but it didn't work out:

Original task: "${originalTask}"
Their feedback: "${feedback}"
Tool they used: ${tool}

Generate ONE alternative, simpler version of this task that addresses their concern.
Be specific and concrete. Return just the task description as plain text, no JSON, no preamble.`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return text.trim()
}
