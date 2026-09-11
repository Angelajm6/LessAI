# LessAI — AI Builders Hackathon Submission Kit

Use this document to complete the project form and prepare the required written materials. Replace every item in `[[double brackets]]` before submitting.

## Submission form copy

### Project name

LessAI — Personalized AI Skill Coaching for Teams

### One-line pitch

LessAI turns the AI tools employees already have into a personalized, daily practice system that improves prompt quality, builds durable habits, and gives managers measurable adoption visibility.

### Short description (about 100 words)

Companies buy ChatGPT, Claude, Copilot, and Notion AI, but employees are often left to learn by trial and error. LessAI is a role- and company-aware AI coaching platform that closes that gap. A user selects their role and AI tools, then LessAI uses their company context to generate practical daily exercises, reusable prompt frameworks, and task-specific tool recommendations. Prompt Lab helps users improve a real prompt with scored feedback; the AI Command Center recommends the best tool and a ready-to-use prompt for a work task. Team leaders can see skill activity, identify coaching opportunities, and build an evidence-based AI enablement program.

### Full description (about 250 words)

AI adoption has a human problem: people are given powerful tools without a practical way to learn how to use them in their own work. The result is generic prompts, inconsistent outputs, rework, and little visibility into whether a company's AI investment is creating capability.

LessAI is the enablement layer between AI subscriptions and real work. During onboarding, a user shares their job role, selected AI tools, skill level, and company website. LessAI turns this context into a personalized tool stack: prompt playbooks, tool comparison guidance, and three short practice tasks for each selected tool. Rather than asking people to finish a long course, it makes skill-building a repeatable daily habit.

The product has two immediate AI workspaces. In Prompt Lab, users paste a prompt they already use and receive a sharper version plus before/after feedback across specificity, context, and output clarity. In the AI Command Center, users describe a work task in plain language; LessAI recommends the most suitable tool from their stack, explains why, and creates a ready-to-paste prompt. Users can save useful prompts in folders, complete daily practice tasks, and track XP, streaks, and progress. Managers can invite teammates and review completion, XP, and streak data to spot where coaching is needed.

LessAI is a working full-stack product, not a concept video. It makes AI more useful by helping people build the judgment and prompting habits required to get dependable outcomes from the tools they already pay for.

### Problem statement

Organizations are investing in AI tools faster than they are building employees' ability to use them well. Generic courses and one-off workshops do not translate into a marketer's campaign brief, a support manager's escalation response, or an operator's weekly report. Without role-specific practice and feedback, employees spend time iterating on weak prompts and correcting generic outputs, while managers cannot see whether adoption is becoming skill.

### Solution

LessAI creates a personalized AI coaching path for each employee and turns training into short, relevant practice. It grounds AI guidance in a user's role, selected tools, and company context; then combines daily tasks, prompt improvement, tool selection support, reusable prompt libraries, and team-level visibility.

### Target users

- Primary user: non-technical knowledge workers who use AI tools but lack practical, role-specific training.
- Buyer: operations leaders, learning and development teams, and team managers at growing companies.
- Secondary user: individual professionals who want to build AI fluency through focused, repeatable practice.

### Key features

1. Context-aware onboarding — captures role, tool stack, skill level, and company context.
2. Personalized daily practice — creates short, concrete tasks by tool and skill level; XP and streaks reinforce consistency.
3. Prompt Playbook — produces role-specific prompt frameworks users can reuse.
4. Prompt Lab — rewrites a real prompt and scores the improvement on specificity, context, and output clarity.
5. AI Command Center — recommends the right AI tool for a task and provides a ready-to-paste prompt.
6. Prompt library — saves and organizes reusable prompts.
7. Team dashboard — surfaces completion, XP, streaks, and tool-level activity for managers.

### How AI is used

LessAI uses Claude models through OpenRouter to generate structured, personalized coaching content. It uses a faster model for onboarding outputs such as tool cards and task tracks, and a more capable model for coaching workflows such as prompt improvement, tool recommendations, and playbook generation. AI is not a decorative chat feature: it creates the personalized practice, feedback, and decision support that define the product experience.

### Technical architecture

- Front end: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, shadcn/ui.
- Backend: Next.js route handlers for AI, task, authentication, scraping, billing, email, and scheduled workflows.
- AI: OpenRouter with Claude Haiku 4.5 for fast onboarding generation and Claude Sonnet 4.5 for coaching tasks.
- Data and auth: Supabase PostgreSQL, Supabase Auth, and Row Level Security.
- Integrations: Stripe for subscriptions; Resend for email; native fetch and HTML parsing for company-context extraction.
- Deployment: Vercel.

### Links (fill before submitting)

| Submission field | Value |
|---|---|
| Live app | https://lessai.io |
| Public GitHub repository | https://github.com/Angelajm6/LessAI |
| Demo video | [[Paste video link]] |
| Presentation deck | [[Upload deck or paste share link]] |
| Team / contact | [[Name, email, and team members]] |

## Repository readiness checklist

Before making the repository public, confirm the following.

- [ ] The repository visibility is Public.
- [ ] `.env.local` and all API keys are excluded from Git history.
- [ ] `README.md` renders correctly on GitHub and its setup steps work from a fresh clone.
- [ ] A reviewer can find the architecture, required environment variables, database schema, and local run command.
- [ ] `supabase-schema.sql` is current and can be applied to a new Supabase project.
- [ ] The submitted commit builds successfully with `npm run build`.
- [ ] The live link and demo link in the submission form open without requiring judge credentials, or provide clear demo-access instructions.
- [ ] The team replaces all `[[placeholders]]` in this document.

## Suggested submission-form answers

### What makes this project different?

Most AI training is generic and episodic. LessAI makes AI enablement personal and continuous: it uses a person's role, tools, skill level, and company context to generate the next useful action. It pairs individual coaching with a manager view, so adoption can be coached and measured instead of assumed.

### Why now?

AI is already embedded in day-to-day knowledge work, yet speed alone does not guarantee value. Workday's 2026 research found that 37% of time saved with AI is offset by rework, reinforcing the need for practical training and better contextual prompting. LessAI focuses on that missing behavior layer. [Source: Workday, *Measuring the Real Value of AI*, 2026.](https://www.workday.com/en-us/artificial-intelligence/research/beyond-productivity-ai-value.html)

### What is working today?

The prototype includes onboarding, personalized task-path generation, prompt playbooks, Prompt Lab, the AI Command Center, saved prompts, XP and streak tracking, a team dashboard, invitations, authentication, payment flows, and email workflows. The public site also includes an interactive product demo.

### What will you build next?

1. Pilot with a small team and measure activation, task completion, prompt-quality improvement, and time-to-first-useful-output.
2. Add manager-facing outcome metrics and role-level skill gap reports.
3. Add organization-approved prompt standards and shared team workflows.
4. Expand integrations so LessAI can recommend practice from real work signals while keeping users in control of their data.

## Five-minute demo guide

Record the demo against this narrative. The full voiceover is in `docs/demo-script.md`.

| Time | What to show | Core point |
|---|---|---|
| 0:00–0:20 | Landing page | Companies have AI subscriptions but lack practical enablement. |
| 0:20–0:50 | Onboarding | Role, tools, and company context make coaching relevant. |
| 0:50–1:30 | Daily Tasks | Small role-specific practice builds an ongoing habit. |
| 1:30–2:15 | Prompt Lab and Command Center | LessAI improves prompt quality and helps choose the right tool. |
| 2:15–2:40 | Saved Prompts | Useful work becomes reusable organizational knowledge. |
| 2:40–3:10 | Team dashboard | Managers can see where enablement is working and where coaching is needed. |
| 3:10–3:30 | Closing | LessAI is the missing layer between AI tools and people who need results. |

## Judge-facing claims: use with care

- Say “working prototype” only after confirming the deployed app and critical flows work on the day of submission.
- Do not claim customer results, time saved, adoption lift, or revenue unless you have measured evidence.
- The Workday rework statistic above is external research, not LessAI performance data.
- If a submission form asks for a model provider, use the exact model and routing information listed in the technical architecture section.
