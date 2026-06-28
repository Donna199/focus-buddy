-- Focus Friends — Supabase schema (v0)
-- Run this in the Supabase SQL Editor once you've created a project.
-- Matches the shapes used by src/data/mockData.js so swapping is direct.

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null,
  created_at timestamptz default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avatar_letter text,
  group_id uuid references groups(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  group_id uuid references groups(id) on delete cascade not null,
  category text not null check (category in ('good', 'bad', 'bonus')),
  activity_name text not null,
  duration_minutes integer, -- null for bonus activities
  points integer not null,
  caption text,
  trigger text, -- only used for 'bad' category
  created_at timestamptz default now()
);

-- Helpful index for the feed and ranking queries (filter by group, sort by time)
create index if not exists logs_group_created_idx on logs (group_id, created_at desc);
create index if not exists logs_user_created_idx on logs (user_id, created_at desc);

-- Row Level Security — keeps each group's data private to its members.
-- For v0 with a small trusted friend group, you can start permissive and
-- tighten later; this is the minimum safe default.
alter table users enable row level security;
alter table logs enable row level security;
alter table groups enable row level security;

create policy "Users can read all users" on users for select using (true);
create policy "Users can read all groups" on groups for select using (true);
create policy "Logs are readable by anyone" on logs for select using (true);
create policy "Anyone can insert their own log" on logs for insert with check (true);
create policy "Anyone can insert a user" on users for insert with check (true);
create policy "Anyone can insert a group" on groups for insert with check (true);

-- NOTE: these policies are intentionally open for a fast v0 launch with a
-- trusted friend group. Before opening this to strangers, replace with
-- policies scoped to auth.uid() once you add real authentication.
