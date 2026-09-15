-- Product events, one row per tracked event. Written only by the server with
-- the service-role key (see src/lib/analytics/server.ts). Amplitude receives
-- the same events; this table is LessAI's own copy for the platform-admin
-- view and the daily attention digest.
--
-- Run this in the Supabase SQL editor (or `supabase db push`).

create table if not exists user_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  event text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists user_events_user_id_created_at_idx
  on user_events (user_id, created_at desc);

create index if not exists user_events_event_created_at_idx
  on user_events (event, created_at desc);

-- No policies on purpose: anon and authenticated roles cannot read or write.
-- The service role bypasses RLS.
alter table user_events enable row level security;
