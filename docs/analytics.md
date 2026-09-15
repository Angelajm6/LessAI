# Product analytics

LessAI tracks the new-user journey in two places at once:

- **Amplitude** (US data center project) for funnels, user paths, cohorts and
  per-user event timelines.
- **`user_events` table in Supabase**, a copy of every server-side event so the
  platform-admin page and the daily attention digest work without leaving
  our own database.

## Environment variables

| Variable | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_AMPLITUDE_API_KEY` | Vercel (all environments) + `.env.local` | Browser project key. Public by design. Nothing tracks while it is unset. |
| `NEXT_PUBLIC_AMPLITUDE_SERVER_ZONE` | Vercel + `.env.local` | `US` (current project) or `EU`. |
| `PLATFORM_ADMIN_EMAILS` | Vercel (Production) | Comma-separated owners. Also the recipients of the attention digest. |

Use a **separate Amplitude project** for Preview/Development so test signups
never land in the production funnel.

## One-time setup

Run [`supabase/migrations/20260915120000_user_events.sql`](../supabase/migrations/20260915120000_user_events.sql)
in the Supabase SQL editor. Until then, Amplitude still receives every event;
only the Supabase copy is skipped (an error is logged per event).

## Events

Names live in [`src/lib/analytics/events.ts`](../src/lib/analytics/events.ts).
Server events are sent from API routes and the Stripe webhook through
`trackEvent()` in `src/lib/analytics/server.ts`, so they are immune to ad
blockers. Browser events use `track()` from `src/lib/analytics/client.ts`.

| Event | Fired from | Key properties |
|---|---|---|
| `signup_submitted` | signup page (browser) | plan, has_checkout_session |
| `signup_confirmation_sent` | signup page (browser) | plan |
| `signed_up` | auth callback, invite accept | method (`email` / `invite`) |
| `logged_in` | login page (browser) | plan_intent |
| `onboarding_step_viewed` | onboarding page (browser) | step 1–4, label, mode |
| `onboarding_completed` | generate-path route | role, tools, tool_count |
| `task_completed` | tasks/complete route | tool, day, xp, streak, is_first_task |
| `checkout_started` | stripe/checkout route | plan |
| `trial_started` | Stripe webhook, auth callback (payment link) | plan, source |
| `payment_succeeded` | Stripe webhook | plan, amount, is_first_payment |
| `payment_failed` | Stripe webhook | amount, retries_exhausted |
| `subscription_canceled` | Stripe webhook | cancel_at |
| `subscription_status_changed` | Stripe webhook | from, to |
| `invite_sent` | invite/send route | company_id |
| `account_deleted` | account/delete route | (Amplitude only) |

Page views, sessions and UTM attribution are autocaptured by the browser SDK.
The Supabase user id is the Amplitude user id, set by
`src/components/Analytics.tsx` on every page load and on login.

## Suggested Amplitude charts

1. **Funnel**: `signed_up` → `onboarding_completed` → `task_completed` →
   `trial_started` → `payment_succeeded`, conversion within 7 days.
2. **Funnel**: `onboarding_step_viewed` step 1 → 2 → 3 → 4 →
   `onboarding_completed`, to find the step people abandon.
3. **User look-up**: search by email to read one person's full journey before
   replying to them.

## Daily attention digest

`/api/cron/attention-digest` runs every day at 08:00 UTC (see `vercel.json`)
and emails `PLATFORM_ADMIN_EMAILS` the users to reach out to, grouped by:
new in the last 24 hours, stuck before onboarding, onboarded but no first
task, trial ending with low usage, and went quiet. The email is skipped on
days when nothing needs attention.

Test it locally:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/attention-digest
```

## Handy SQL

Latest events for one user:

```sql
select created_at, event, properties
from user_events
where user_id = (select id from profiles where email = 'someone@example.com')
order by created_at desc;
```
