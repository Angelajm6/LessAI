# LessAI — Personalized AI Skill Coaching Platform

> **Live product:** [lessai.io](https://lessai.io) · Full working demo available without an account.

LessAI is a role-specific, tool-specific AI coaching platform that teaches employees and individuals how to get real results from the AI tools they already have. Companies spend billions on ChatGPT, Claude, Notion AI, and Copilot subscriptions — yet 70% of employees have received zero formal training on how to use them (Slack Workforce Index, 2024). LessAI fixes that.

---

## The Problem

- **70%** of employees have received zero formal AI training — yet executives keep buying more tools *(Slack Workforce Index, 2024)*
- **95%** of corporate AI pilots produce no measurable business impact — the gap is skill, not tooling *(MIT NANDA, 2025)*
- **40%** of potential AI time savings are lost to rework — fixing bad outputs nobody knew how to avoid *(Workday, 2025)*

The problem isn't that people need more AI tools. We have enough. The problem is that nobody teaches people how to actually use the ones they already have — and more specifically, how to talk to AI to get the results they want.

---

## What LessAI Does

1. **Tell us your role, tools, and company URL.** LessAI scrapes your company website to understand your industry and business context. Every task, prompt, and recommendation is built around your actual work — not a generic example.

2. **Get your personalized prompt playbook.** Role-specific prompt frameworks for every tool in your stack — what context to include, how to structure your ask, and the exact phrasing that gets great outputs for your job.

3. **Practice daily, one task per tool.** One focused practice task per AI tool per day (Monday–Friday), matched to your current skill level. Earn XP, build streaks, and track your progress with a 30-day activity heatmap and milestone levels (Novice → Explorer → Practitioner → Pro).

4. **Managers get full team visibility.** The admin dashboard shows XP, streaks, and task completion by person and by tool — real AI adoption data to identify skill gaps, prove ROI, and coach the right people.

---

## Core Features

| Feature | Description |
|---|---|
| **Prompt Playbook** | Role + tool-specific prompt frameworks generated on signup, personalized to your company context |
| **Daily Practice Tasks** | One task per tool per day, Mon–Fri, adaptive to your skill level |
| **Prompt Lab** | Paste any prompt → get an AI-rewritten version scored on Specificity, Context, and Output Clarity (before/after) |
| **AI Command Center** | Describe any work task in plain English → get the right tool recommended + a ready-to-paste prompt |
| **Tool Comparison Guides** | Side-by-side guides teaching when to use Claude vs ChatGPT vs Gemini vs Perplexity for your exact role |
| **Saved Prompts + Folders** | Save any prompt to a personal library, organize by folder, copy and reuse anytime |
| **XP & Level System** | Earn XP for completed tasks, build streaks, unlock levels — habit-forming progress loop |
| **Weekly Digest** | Automated Monday email with your progress summary and next suggested focus area |
| **Admin Dashboard** | Team leaderboard, XP/streak/task data by person, skill gap visibility |
| **Company Context Scraping** | Website content scraped at onboarding — all AI outputs reference your actual business |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, React 19) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Database & Auth** | Supabase (PostgreSQL + Row Level Security + SSR auth) |
| **AI / LLM** | OpenRouter API — `anthropic/claude-haiku-4-5` (onboarding), `anthropic/claude-sonnet-4.5` (coaching) |
| **Payments** | Stripe Checkout + Webhooks (7-day free trial, subscription billing) |
| **Email** | Resend + React Email (transactional + weekly digest) |
| **Deployment** | Vercel (auto-deploy on push to `main`) |
| **Web Scraping** | Native fetch + HTML parsing for company context extraction |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     lessai.io (Vercel)                  │
│                                                         │
│  ┌─────────────┐   ┌──────────────┐  ┌──────────────┐  │
│  │  Next.js    │   │   API Routes │  │  Cron Jobs   │  │
│  │  App Router │   │  /api/ai/*   │  │  (weekly     │  │
│  │  (RSC +     │   │  /api/stripe │  │   digest)    │  │
│  │   Client)   │   │  /api/tasks  │  └──────┬───────┘  │
│  └──────┬──────┘   └──────┬───────┘         │          │
│         │                 │                 │          │
└─────────┼─────────────────┼─────────────────┼──────────┘
          │                 │                 │
    ┌─────▼─────┐    ┌──────▼──────┐   ┌─────▼─────┐
    │ Supabase  │    │  OpenRouter │   │  Resend   │
    │ (Postgres │    │  (Claude    │   │  (Email   │
    │  + RLS +  │    │   Haiku /   │   │   API)    │
    │   Auth)   │    │   Sonnet)   │   └───────────┘
    └─────┬─────┘    └─────────────┘
          │
    ┌─────▼─────┐
    │  Stripe   │
    │ (Billing) │
    └───────────┘
```

### Key Data Flows

**Onboarding (one-time setup):**
1. User enters role, AI tools, and company URL
2. `/api/scrape` fetches and parses the company website for business context
3. `/api/ai/generate-playbook` calls Claude to generate role + tool-specific prompt frameworks
4. `/api/ai/generate-path` generates personalized daily tasks for each tool in the user's stack
5. All data stored in Supabase with RLS policies scoped to `user_id`

**Daily Use:**
- Dashboard loads server-side via Next.js RSC — zero client-side data fetching on initial render
- Daily tasks served Mon–Fri (one task per tool per day) from the user's pre-generated `stack_maps`
- Prompt Lab calls `/api/ai/recommend` → returns improved prompt + before/after scores
- AI Command Center calls `/api/ai/detect-tool` → returns best tool + ready-to-paste prompt
- XP and streaks updated server-side via `/api/tasks` on task completion

**Team / Admin:**
- Admin dashboard aggregates XP, streak, and completion data across all team members
- Invite system generates unique links scoped to a team's `org_id`

---

## Database Schema

Key tables — full schema in [`supabase-schema.sql`](./supabase-schema.sql):

| Table | Purpose |
|---|---|
| `profiles` | User profile: role, company URL, scraped context, plan, trial end date |
| `stack_maps` | Per-user AI tool stack with generated daily tasks and prompt playbooks |
| `completed_tasks` | Task completion log (tool, day index, completed_at) |
| `saved_prompts` | User's saved prompt library with folder organization |
| `prompt_folders` | Folder structure for saved prompts |
| `prompt_lab_history` | History of Prompt Lab runs with before/after scores |
| `organizations` | Team/company entities for multi-user plans |
| `org_members` | Maps users to organizations with roles |

All tables enforce Row Level Security — users can only read and write their own data. Admin queries are scoped to `org_id`.

---

## Security & Compliance

- **Row Level Security (RLS)** enforced on every Supabase table — no cross-user data access possible at the database layer
- **Auth** handled entirely by Supabase Auth (JWT-based, SSR cookies via `@supabase/ssr`)
- **No prompts stored server-side** beyond what the user explicitly saves or the Lab history the user controls (and can delete at any time)
- **PII scope:** email address only — no names, payment details, or sensitive data stored outside Stripe and Supabase
- **API keys** never exposed client-side — all AI and Stripe calls go through server-side Next.js API routes
- **Stripe webhooks** verified with `stripe.webhooks.constructEvent` signature validation

---

## Monetization

| Plan | Details |
|---|---|
| **Free Trial** | 7 days full access, no credit card required at signup |
| **Pro (Individual)** | Full prompt playbook, unlimited daily tasks, Prompt Lab, Command Center, saved prompts, XP system, weekly digest |
| **Team** | Everything in Pro + admin dashboard, team leaderboard, invite links, skill gap reporting |

Payments processed via Stripe Checkout. Webhooks update subscription status on all plan events (trial end, upgrade, cancellation).

---

## Local Development

```bash
# 1. Clone and install
git clone https://github.com/Angelajm6/LessAI.git
cd LessAI
npm install

# 2. Set environment variables
# Create .env.local with:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
#   OPENROUTER_API_KEY
#   STRIPE_SECRET_KEY
#   STRIPE_WEBHOOK_SECRET
#   RESEND_API_KEY

# 3. Apply the database schema
# Run supabase-schema.sql against your Supabase project

# 4. Start the dev server
npm run dev
# → http://localhost:3000
```

---

## Project Structure

```
app/
├── (app)/
│   ├── dashboard/        # Main user dashboard (RSC + DashboardClient)
│   ├── admin/            # Team admin dashboard
│   ├── onboarding/       # Multi-step onboarding flow
│   ├── settings/         # Account & subscription settings
│   └── skill/            # Individual tool skill guides
├── api/
│   ├── ai/
│   │   ├── generate-playbook/   # Generates role-specific prompt playbook
│   │   ├── generate-path/       # Generates personalized daily task path
│   │   ├── recommend/           # Prompt Lab: improves prompts + scores
│   │   ├── detect-tool/         # Command Center: recommends best tool
│   │   └── generate-skill/      # Tool comparison guide generation
│   ├── tasks/                   # Task completion + XP/streak update
│   ├── stripe/                  # Checkout session creation
│   │   └── webhook/             # Stripe event handling
│   ├── scrape/                  # Company website context extraction
│   └── cron/                    # Weekly digest email trigger
├── pricing/                     # Public pricing page
└── page.tsx                     # Marketing landing page
```

---

## Target Market

**Primary buyer:** SMBs and mid-market companies (20–500 employees) paying for AI tool subscriptions with no internal training program.

**Decision-makers:** L&D managers, heads of operations, team leads.

**Unique advantage:** LessAI is the only platform that personalizes AI training by role + tool + real company context. Generic AI courses (Coursera, LinkedIn Learning) teach AI literacy. LessAI teaches a Customer Success Manager exactly how to use Claude for renewal conversations — not a one-size-fits-all course nobody finishes.

---

## Contact

**hello@lessai.io**
