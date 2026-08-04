# LessAI Technical Video Script
*Target: 2–3 minutes. Screen share your codebase/architecture while narrating.*

---

## 0:00 – 0:20 | STACK OVERVIEW
*(Show the project root in your editor or the README)*

"LessAI is built on Next.js 16 with the App Router and React 19, TypeScript in strict mode, Supabase for the database and auth, OpenRouter as the AI layer, Stripe for billing, and Resend for email. It's deployed on Vercel with auto-deploy on every push to main."

"Let me walk you through the key engineering decisions."

---

## 0:20 – 0:55 | AI PIPELINE
*(Open app/api/ai/ folder — show the route files)*

"The core of LessAI is a personalized AI generation pipeline. It starts at onboarding."

*(Open /api/scrape or /api/ai/generate-playbook)*

"When a user signs up, we first scrape their company website — fetching and parsing the HTML to extract business context: industry, product, tone, niche. That context gets stored in their profile in Supabase."

"Then we call Claude via OpenRouter — claude-haiku-4-5 for the onboarding generation steps since we need speed and low latency — and pass it the user's role, their AI tools, and the scraped company context. The output is a fully personalized prompt playbook and a set of daily practice tasks per tool, stored in the stack_maps table."

*(Show /api/ai/recommend or /api/ai/detect-tool)*

"For the Prompt Lab, every time a user submits a prompt, we call claude-sonnet-4.5 — the more capable model — to rewrite it and score it on three dimensions: Specificity, Context, and Output Clarity, before and after. The AI Command Center works similarly — it receives a plain English task description and returns the best tool recommendation with a ready-to-paste prompt, all personalized to the user's role and stack."

---

## 0:55 – 1:30 | DATABASE & SECURITY
*(Open supabase-schema.sql or describe the tables)*

"The database is Supabase — PostgreSQL with Row Level Security enforced on every single table. Users can only ever read and write their own data at the database layer — not enforced at the application level, enforced at the DB level. No cross-user data access is architecturally possible."

"Key tables: profiles stores the user's role, company context, and subscription status. stack_maps stores the generated playbook and daily tasks per tool. completed_tasks tracks task completion for XP and streak calculation. prompt_lab_history stores every Prompt Lab run with before and after scores. saved_prompts and prompt_folders give users their personal prompt library."

"Auth is handled entirely by Supabase Auth — JWT-based with SSR cookies via the official @supabase/ssr package. No custom auth logic."

---

## 1:30 – 1:55 | ARCHITECTURE PATTERN
*(Show app/(app)/dashboard/page.tsx briefly)*

"One architectural decision I'm proud of: the dashboard loads entirely server-side via Next.js React Server Components. The page.tsx fetches all the user's data — profile, stack, tasks, saved prompts, lab history — in a single server render. The client component, DashboardClient, receives everything as props and handles all interactivity from there."

"This means zero loading spinners on the main dashboard, no client-side data fetching waterfalls, and a fast initial render — which matters for a product people open every day."

---

## 1:55 – 2:20 | BILLING & EMAIL
*(Show app/api/stripe/ briefly)*

"Billing is Stripe Checkout with a 7-day free trial. Stripe webhooks update the user's subscription status and plan in Supabase on every billing event — trial end, upgrade, cancellation. Webhook signatures are verified with Stripe's constructEvent to prevent spoofing."

"Email is handled by Resend with React Email components — transactional emails for onboarding, and an automated weekly digest sent every Monday via a Vercel cron job that summarizes each user's progress and suggests their next focus area."

---

## 2:20 – 2:40 | DEPLOYMENT
*(Show vercel.json or just describe it)*

"Deployment is Vercel — every push to main triggers an automatic production deploy. Environment variables are managed in Vercel's dashboard. The architecture is fully serverless — no infrastructure to manage, scales automatically."

"The full schema is in supabase-schema.sql in the repo, and the local dev setup is documented in the README."

---

## 2:40 – 3:00 | CLOSE

"The entire stack is production-grade, live today at lessai.io, and built to scale. Everything from the AI pipeline to the billing to the team admin layer is working in production — not a prototype."

"Thank you."

---

*Total estimated time: ~2:45 at a natural pace.*
