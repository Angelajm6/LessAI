export interface WorkflowStep {
  tool: string
  action: string
  prompt: string
  output: string
}

export interface Workflow {
  id: string
  title: string
  description: string
  category: 'content' | 'research' | 'outreach' | 'analysis' | 'strategy' | 'operations'
  tools: string[]
  time_estimate: string
  steps: WorkflowStep[]
}

export const CATEGORY_LABELS: Record<Workflow['category'], string> = {
  content: 'Content',
  research: 'Research',
  outreach: 'Outreach',
  analysis: 'Analysis',
  strategy: 'Strategy',
  operations: 'Operations',
}

export const CATEGORY_COLORS: Record<Workflow['category'], string> = {
  content: 'bg-purple-100 text-purple-700',
  research: 'bg-blue-100 text-blue-700',
  outreach: 'bg-emerald-100 text-emerald-700',
  analysis: 'bg-amber-100 text-amber-700',
  strategy: 'bg-rose-100 text-rose-700',
  operations: 'bg-gray-100 text-gray-700',
}

export const WORKFLOWS: Workflow[] = [
  {
    id: 'campaign-brief',
    title: 'Campaign Brief Builder',
    description: 'Go from a campaign idea to a polished, structured brief ready to share with your team.',
    category: 'content',
    tools: ['ChatGPT', 'Claude', 'Notion AI'],
    time_estimate: '20 min',
    steps: [
      {
        tool: 'ChatGPT',
        action: 'Brainstorm campaign angles',
        prompt: `I'm planning a marketing campaign for [product/service] targeting [audience]. Our main goal is [goal — awareness/leads/conversion]. Generate 5 distinct campaign angles or concepts, each with a core message, emotional hook, and channel recommendation (social, email, paid, etc.).`,
        output: '5 campaign concepts with messaging angles',
      },
      {
        tool: 'Claude',
        action: 'Structure the winning concept',
        prompt: `I'm developing a marketing campaign brief. Here's the concept I want to build on:\n\n[paste chosen concept from Step 1]\n\nWrite a complete campaign brief including: campaign objective, target audience (demographics + psychographics), key message, tone of voice, channels, success metrics (KPIs), timeline overview, and budget considerations. Format it as a professional brief document.`,
        output: 'Full campaign brief document',
      },
      {
        tool: 'Notion AI',
        action: 'Organize into a shareable page',
        prompt: `Take this campaign brief and organize it into a clean Notion page with headers, bullet points, and callout blocks. Add a summary section at the top (3 sentences max) and a "Next Steps" section at the bottom with 5 action items.\n\n[paste brief from Step 2]`,
        output: 'Structured, shareable Notion brief',
      },
    ],
  },
  {
    id: 'competitor-deep-dive',
    title: 'Competitor Deep Dive',
    description: 'Research a competitor thoroughly and turn findings into a strategic positioning summary.',
    category: 'research',
    tools: ['ChatGPT', 'Claude'],
    time_estimate: '25 min',
    steps: [
      {
        tool: 'ChatGPT',
        action: 'Map the competitive landscape',
        prompt: `I want to analyze [competitor name] as a competitor to [my company/product]. Based on publicly available knowledge, outline: their main products/services, pricing model (if known), target customer segments, key marketing messages, strengths, weaknesses, and recent notable moves. Format as a structured competitive profile.`,
        output: 'Competitor profile overview',
      },
      {
        tool: 'Claude',
        action: 'Extract strategic positioning insights',
        prompt: `Here is a competitive profile for [competitor]:\n\n[paste profile from Step 1]\n\nAnalyze this from a strategic positioning perspective. Identify: (1) where they are clearly stronger than us, (2) where we have a genuine edge, (3) underserved segments or needs they're missing, (4) messaging angles we could use to differentiate, and (5) 3 specific threats to monitor. Be direct and honest — no fluff.`,
        output: 'Strategic positioning analysis with differentiators',
      },
    ],
  },
  {
    id: 'cold-outreach-sequence',
    title: 'Cold Outreach Sequence',
    description: 'Build a personalized 3-touch outreach sequence for a specific prospect or segment.',
    category: 'outreach',
    tools: ['Claude', 'ChatGPT', 'Grammarly'],
    time_estimate: '15 min',
    steps: [
      {
        tool: 'Claude',
        action: 'Write the opening email',
        prompt: `Write a cold outreach email for [prospect name/company]. Context: I work at [my company], we help [who we help] with [problem we solve]. This prospect is a [their role] at [company type]. My goal is to get a 20-minute discovery call. Requirements: under 100 words, no buzzwords, lead with a specific observation about their situation, one clear CTA. Do not use "I hope this email finds you well" or similar openers.`,
        output: 'Opening cold email (under 100 words)',
      },
      {
        tool: 'ChatGPT',
        action: 'Generate follow-up variations',
        prompt: `Here is my opening cold email:\n\n[paste email from Step 1]\n\nCreate 2 follow-up emails: Touch 2 (send 3 days later) — add a new angle, share a relevant stat or case study, same CTA. Touch 3 (send 7 days later) — a short "break-up" email that creates urgency without being pushy. All follow-ups should be under 75 words.`,
        output: '2 follow-up emails completing the 3-touch sequence',
      },
      {
        tool: 'Grammarly',
        action: 'Polish and check tone',
        prompt: `Paste each email into Grammarly and run it with the "Confident" tone goal. Accept suggestions that reduce word count or sharpen the message. Reject suggestions that add formality or corporate language. Check that every email has a single clear CTA — remove any secondary asks.`,
        output: 'Polished, ready-to-send 3-email sequence',
      },
    ],
  },
  {
    id: 'meeting-prep',
    title: 'High-Stakes Meeting Prep',
    description: 'Prepare thoroughly for an important client, exec, or sales meeting in under 15 minutes.',
    category: 'strategy',
    tools: ['ChatGPT', 'Claude'],
    time_estimate: '15 min',
    steps: [
      {
        tool: 'ChatGPT',
        action: 'Research the person and company',
        prompt: `I have a meeting with [name], [title] at [company]. Research what you know about this company and role. Give me: (1) 3 things happening in their industry right now that are relevant, (2) likely priorities and pressures for someone in their role, (3) 5 smart questions I could ask that show I've done my homework, (4) topics to avoid bringing up.`,
        output: 'Background brief on person & company context',
      },
      {
        tool: 'Claude',
        action: 'Build your agenda and talking points',
        prompt: `I'm going into a meeting with [name] at [company]. Meeting goal: [your goal — sell, get buy-in, solve a problem, etc.]. Background research:\n\n[paste from Step 1]\n\nBuild me: (1) a 3-point agenda I can share in advance, (2) my key talking points, (3) anticipated objections and how to handle each, (4) a strong opening line that isn't "let me tell you about us," and (5) the ideal close and next step to propose.`,
        output: 'Complete meeting prep document',
      },
    ],
  },
  {
    id: 'content-repurposing',
    title: 'Content Repurposing Machine',
    description: 'Take one long-form piece and turn it into 5 different content formats for different channels.',
    category: 'content',
    tools: ['Claude', 'ChatGPT', 'Grammarly'],
    time_estimate: '20 min',
    steps: [
      {
        tool: 'Claude',
        action: 'Extract the core ideas',
        prompt: `Here is a [blog post / article / podcast transcript / report]:\n\n[paste content]\n\nExtract: (1) the 5 most valuable insights or takeaways, (2) the most quotable sentence or stat, (3) the core argument in one sentence, (4) 3 controversial or debate-worthy claims, (5) 2 specific examples or stories that could stand alone as content pieces.`,
        output: 'Core ideas, quotes, and angles extracted',
      },
      {
        tool: 'ChatGPT',
        action: 'Generate multi-format versions',
        prompt: `Using these insights:\n\n[paste from Step 1]\n\nCreate all of the following:\n1. LinkedIn post (200-250 words, narrative hook, 3 insights, CTA)\n2. Twitter/X thread (6 tweets, numbered, punchy)\n3. Email newsletter intro paragraph (150 words)\n4. Short-form video script (60 seconds, conversational)\n5. 3 standalone quote graphics (each under 20 words)`,
        output: '5 ready-to-publish content pieces',
      },
      {
        tool: 'Grammarly',
        action: 'Tone-check each piece for its channel',
        prompt: `Review each piece in Grammarly. For LinkedIn: set goal to "Informative." For Twitter: "Confident." For email: "Friendly." For video script: "Casual." Accept fixes that match the channel tone. Check for repetition across pieces — each one should feel distinct.`,
        output: 'Channel-optimized, publish-ready content set',
      },
    ],
  },
  {
    id: 'weekly-report',
    title: 'Weekly Team Report',
    description: 'Compile a clear, engaging weekly report from raw notes in 10 minutes.',
    category: 'operations',
    tools: ['Notion AI', 'Claude'],
    time_estimate: '10 min',
    steps: [
      {
        tool: 'Notion AI',
        action: 'Summarize your week\'s notes',
        prompt: `Open your Notion workspace and use AI to summarize all notes, tasks, and updates from the past 7 days. Prompt: "Summarize all content from the past week into: (1) what was completed, (2) what is in progress, (3) blockers or issues, (4) decisions made." Remove duplicates and sort by priority.`,
        output: 'Structured summary of the week\'s activity',
      },
      {
        tool: 'Claude',
        action: 'Write the report',
        prompt: `Here are my raw notes from this week:\n\n[paste Notion summary]\n\nWrite a weekly team report with: Highlights (top 2-3 wins), Progress (what moved forward), Blockers (what needs attention or a decision), Numbers (key metrics), and Next Week (top 3 priorities). Tone: direct and human, not corporate. Total length: under 250 words. Start with a one-sentence "bottom line" at the very top.`,
        output: 'Polished weekly report ready to send',
      },
    ],
  },
  {
    id: 'feedback-synthesis',
    title: 'Customer Feedback Synthesizer',
    description: 'Turn a batch of raw customer feedback into actionable insights and a shareable report.',
    category: 'analysis',
    tools: ['Claude', 'ChatGPT', 'Notion AI'],
    time_estimate: '20 min',
    steps: [
      {
        tool: 'Claude',
        action: 'Categorize and analyze the feedback',
        prompt: `Here is a batch of customer feedback:\n\n[paste feedback — survey responses, reviews, support tickets, etc.]\n\nAnalyze and categorize it: (1) top 5 recurring themes (positive and negative), (2) most emotionally charged quotes (verbatim), (3) overall sentiment as a percentage (positive / neutral / negative), (4) single most urgent issue that needs addressing, (5) any unexpected praise or complaints worth flagging.`,
        output: 'Categorized feedback analysis with key quotes',
      },
      {
        tool: 'ChatGPT',
        action: 'Generate action recommendations',
        prompt: `Based on this customer feedback analysis:\n\n[paste from Step 1]\n\nGenerate: (1) 3 immediate actions we could take this week with low effort and high impact, (2) 2 medium-term product or process improvements to consider, (3) 1 strategic insight we might be underweighting, (4) a suggested response template for the most common complaint. Be specific, not generic.`,
        output: 'Prioritized action list with quick wins and strategic moves',
      },
      {
        tool: 'Notion AI',
        action: 'Format as a shareable stakeholder report',
        prompt: `Combine this analysis and action plan into a clean Notion report. Structure: Executive Summary (3 sentences), Sentiment Overview, Top Themes (with example quotes), Action Recommendations (grouped by urgency), Raw Stats. Add a callout block at the top with the single most important takeaway. Keep it under 500 words.`,
        output: 'Shareable stakeholder report in Notion',
      },
    ],
  },
  {
    id: 'seo-blog-post',
    title: 'SEO Blog Post',
    description: 'Research, outline, and write an SEO-optimized blog post that actually gets read.',
    category: 'content',
    tools: ['ChatGPT', 'Claude', 'Grammarly'],
    time_estimate: '30 min',
    steps: [
      {
        tool: 'ChatGPT',
        action: 'Research keywords and content angles',
        prompt: `I want to write a blog post about [topic] for [audience]. Give me: (1) 10 related keywords and phrases worth targeting (mix of high/low competition), (2) most commonly searched questions about this topic, (3) 5 possible article angles sorted by uniqueness — avoid the most obvious angle, (4) what information is missing from the top search results on this topic right now.`,
        output: 'Keyword research and differentiated content angles',
      },
      {
        tool: 'Claude',
        action: 'Write the full post',
        prompt: `Write a blog post:\n- Topic: [topic]\n- Target keyword: [from Step 1]\n- Angle: [chosen angle from Step 1]\n- Audience: [audience]\n- Word count: ~800 words\n- Tone: [conversational / authoritative / etc.]\n\nRequirements: Strong headline (not clickbait), hook that earns attention in the first 2 sentences, H2 subheadings, one concrete example or story, genuine takeaway at the end (not a generic CTA). No filler sentences.`,
        output: 'Full 800-word blog post draft',
      },
      {
        tool: 'Grammarly',
        action: 'Edit for clarity and readability',
        prompt: `Paste the blog post into Grammarly. Set goal: Audience = "Knowledgeable," Formality = "Informal," Tone = "Confident." Accept suggestions that shorten sentences or improve flow. Review the readability score — aim for Grade 8-10 for broad audiences. Check that the target keyword appears naturally 3-5 times without forced placement.`,
        output: 'Publication-ready, SEO-optimized blog post',
      },
    ],
  },
  {
    id: 'social-media-calendar',
    title: 'Social Media Content Calendar',
    description: 'Plan and write a full month of social content across LinkedIn and Twitter in one session.',
    category: 'content',
    tools: ['ChatGPT', 'Claude', 'Notion AI'],
    time_estimate: '30 min',
    steps: [
      {
        tool: 'ChatGPT',
        action: 'Generate a month of content ideas',
        prompt: `I manage social media for [brand/company] in the [industry] space. Audience: [description]. Content pillars: [list 2-3 themes]. Generate a 4-week content calendar with 3 posts per week (12 total). For each post: week number, platform (LinkedIn or Twitter), content type (tip, story, data, question, etc.), and a 1-sentence idea summary. Vary formats and types — no two consecutive posts the same style.`,
        output: '12-post content calendar plan',
      },
      {
        tool: 'Claude',
        action: 'Write all 12 posts in full',
        prompt: `Here is my social media content calendar:\n\n[paste from Step 1]\n\nWrite all 12 posts in full. For each: final copy, hashtags (LinkedIn: max 3, Twitter: max 2), and a note on visual or asset to pair with it. LinkedIn posts: 150-250 words, conversational, value-first. Twitter posts: under 240 characters. Label them Week 1 Post 1, Week 1 Post 2, etc.`,
        output: '12 ready-to-publish posts with visual notes',
      },
      {
        tool: 'Notion AI',
        action: 'Build the calendar in Notion',
        prompt: `Organize these 12 posts into a Notion calendar database. Columns: Week, Day, Platform, Content Type, Post Copy, Visual Notes, Status (all set to "Draft"). Sort by week. Create a gallery view filtered by platform so I can review LinkedIn and Twitter posts separately.`,
        output: 'Organized, filterable content calendar in Notion',
      },
    ],
  },
  {
    id: 'sales-pitch-deck',
    title: 'Sales Pitch Deck',
    description: 'Build the narrative and slide-by-slide outline for a compelling sales presentation.',
    category: 'strategy',
    tools: ['Claude', 'ChatGPT'],
    time_estimate: '20 min',
    steps: [
      {
        tool: 'Claude',
        action: 'Build the narrative arc',
        prompt: `I need to build a sales pitch deck for [prospect/audience]. Context: We sell [product/service] to [target customer]. Their main pain points: [list]. Our key differentiators: [list]. Build the narrative arc using "Situation → Problem → Solution → Proof → Ask." For each section: the core message, the emotional or logical hook, and what objection it preemptively addresses. This is the story, not the slides yet.`,
        output: 'Narrative arc and core messaging per section',
      },
      {
        tool: 'ChatGPT',
        action: 'Create the slide-by-slide outline',
        prompt: `Here is the narrative for my sales pitch:\n\n[paste from Step 1]\n\nTurn this into a 10-12 slide deck outline. For each slide: slide title, 1-sentence main message (what the audience should take away), bullet points or talking points, and suggested visual (chart, diagram, photo, quote, etc.). Include a powerful opening slide that isn't just a logo, a "why now" slide, and a clear ask/close slide with specific next steps.`,
        output: 'Complete 10-12 slide deck outline ready to build',
      },
    ],
  },
  {
    id: 'onboarding-sequence',
    title: 'Customer Onboarding Sequence',
    description: 'Build a 5-email onboarding sequence that turns new sign-ups into active, engaged users.',
    category: 'outreach',
    tools: ['Claude', 'ChatGPT', 'Grammarly'],
    time_estimate: '25 min',
    steps: [
      {
        tool: 'Claude',
        action: 'Plan the onboarding arc',
        prompt: `I need an email onboarding sequence for new [customers/users] of [product/service]. They signed up because [reason/goal]. Key activation action in week 1: [what they need to do first to get value]. Common drop-off points: [where they get stuck]. Design a 5-email sequence with: send timing (Day 0, 1, 3, 7, 14), goal of each email, and the one action each email should drive. Arc: welcome → first win → deeper value → social proof → re-engagement.`,
        output: 'Onboarding sequence plan (5 emails with timing)',
      },
      {
        tool: 'ChatGPT',
        action: 'Write all 5 emails',
        prompt: `Write all 5 onboarding emails based on this plan:\n\n[paste plan from Step 1]\n\nFor each email: subject line (and one A/B variant), preview text (under 90 chars), full email body (under 200 words), and CTA button text. Tone: helpful and human, not corporate. Each email should feel like it's from a person. No "As a valued customer" or "We're excited to have you" language.`,
        output: '5 complete emails with subjects and CTAs',
      },
      {
        tool: 'Grammarly',
        action: 'Review for tone consistency',
        prompt: `Paste each email into Grammarly one by one. Set tone goal to "Friendly" for all. Check: (1) consistent voice across all 5 emails — they should sound like the same person, (2) no passive voice in CTAs, (3) each email has exactly one main ask — remove any secondary asks, (4) subject lines are under 50 characters for mobile.`,
        output: 'Polished, consistent 5-email onboarding sequence',
      },
    ],
  },
  {
    id: 'job-description',
    title: 'Job Description Writer',
    description: 'Write a compelling, honest JD that attracts the right candidates and filters out the wrong ones.',
    category: 'operations',
    tools: ['Claude', 'Grammarly'],
    time_estimate: '15 min',
    steps: [
      {
        tool: 'Claude',
        action: 'Draft the job description',
        prompt: `Write a job description for a [job title] at [company description in 1-2 sentences]. This person will [main responsibilities in 3-4 bullets]. Must-have skills: [list]. Nice-to-have: [list]. Include: a punchy intro (why this role matters), day-to-day responsibilities, what success looks like in 90 days, and a "who will NOT thrive here" section (be honest). Avoid: "fast-paced environment," "rock star," "ninja," "competitive salary" with no number.`,
        output: 'Full job description draft',
      },
      {
        tool: 'Grammarly',
        action: 'Bias and clarity check',
        prompt: `Paste the job description into Grammarly. Use "Formal" tone setting. Specifically check: (1) gendered language — remove all of it, (2) unnecessarily complex requirements that might exclude qualified candidates, (3) vague phrases like "strong communication skills" — flag for specificity. Accept all clarity improvements. Manually review: does every listed requirement actually matter for this role?`,
        output: 'Polished, inclusive, publish-ready job description',
      },
    ],
  },
]
