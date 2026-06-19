-- Run this in your Supabase project's SQL Editor (left sidebar -> SQL Editor -> New query)
-- This creates the one table the app needs and opens it up for the team-sync use case.

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  team_id text not null,
  name text not null,
  week jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (team_id, name)
);

create index if not exists members_team_id_idx on members (team_id);

-- Enable Row Level Security
alter table members enable row level security;

-- Simple open policy: anyone with the anon key can read/write.
-- This is fine for a small friends-app with no sensitive data.
-- (Team codes act as a lightweight shared secret.)
create policy "Allow all reads" on members
  for select using (true);

create policy "Allow all inserts" on members
  for insert with check (true);

create policy "Allow all updates" on members
  for update using (true);
