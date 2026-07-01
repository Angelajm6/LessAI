-- Fluent: AI Onboarding Platform
-- Run this in your Supabase SQL editor

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  admin_id uuid references auth.users(id) on delete cascade,
  tools text[] default '{}',
  created_at timestamptz default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  email text not null,
  full_name text,
  role text, -- their job role e.g. "Marketing Manager"
  is_admin boolean default false,
  onboarded boolean default false,
  created_at timestamptz default now()
);

create table ai_paths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  use_cases jsonb not null, -- [{title, description, first_task, tool}]
  current_use_case_index int default 0,
  created_at timestamptz default now()
);

create table skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  week_number int not null,
  title text not null,
  description text not null,
  task text not null, -- the specific thing to try today
  tool text,
  status text default 'pending', -- pending | completed | flagged
  created_at timestamptz default now()
);

create table checkins (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid references skills(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  completed boolean not null,
  feedback text,
  alternative_task text, -- Claude-generated if flagged
  created_at timestamptz default now()
);

create table invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  email text not null,
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  used boolean default false,
  created_at timestamptz default now()
);

-- RLS policies
alter table companies enable row level security;
alter table profiles enable row level security;
alter table ai_paths enable row level security;
alter table skills enable row level security;
alter table checkins enable row level security;
alter table invites enable row level security;

-- Companies: admin can read/update their own
create policy "company admin access" on companies
  for all using (admin_id = auth.uid());

-- Profiles: users can read their own + admins can read their company
create policy "own profile" on profiles
  for all using (id = auth.uid());

create policy "admin reads company profiles" on profiles
  for select using (
    company_id in (select id from companies where admin_id = auth.uid())
  );

-- AI paths: own only
create policy "own ai_paths" on ai_paths
  for all using (user_id = auth.uid());

-- Skills: own only
create policy "own skills" on skills
  for all using (user_id = auth.uid());

-- Checkins: own only
create policy "own checkins" on checkins
  for all using (user_id = auth.uid());

-- Invites: company admin can manage
create policy "admin manages invites" on invites
  for all using (
    company_id in (select id from companies where admin_id = auth.uid())
  );

create policy "invite lookup by token" on invites
  for select using (true);

-- Playbooks table (prompt frameworks + before/after per tool, generated at onboarding)
create table playbooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz default now()
);

alter table playbooks enable row level security;

create policy "own playbooks" on playbooks
  for all using (user_id = auth.uid());
