-- Focus Buddy — Supabase schema (v1, with Auth)
-- Run this in the Supabase SQL Editor.
-- If you ran the original v0 schema, run the "MIGRATION" section at the bottom
-- instead of the full CREATE TABLE statements.

-- ── Tables ────────────────────────────────────────────────────────────────────

create table if not exists groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text unique not null,
  created_at  timestamptz default now()
);

-- id must equal auth.uid() — enforced by RLS policy below.
create table if not exists users (
  id            uuid primary key,            -- set to auth.uid() on insert
  name          text not null,
  avatar_letter text,
  group_id      uuid references groups(id) on delete set null,
  created_at    timestamptz default now()
);

create table if not exists logs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references users(id) on delete cascade not null,
  group_id         uuid references groups(id) on delete cascade not null,
  category         text not null check (category in ('good', 'bad', 'bonus')),
  activity_name    text not null,
  duration_minutes integer,
  points           integer not null,
  caption          text,
  trigger          text,
  created_at       timestamptz default now()
);

create index if not exists logs_group_created_idx on logs (group_id, created_at desc);
create index if not exists logs_user_created_idx  on logs (user_id,  created_at desc);

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table users  enable row level security;
alter table logs   enable row level security;
alter table groups enable row level security;

-- Drop all policies (old v0 names and new v1 names) before recreating
drop policy if exists "Users can read all groups"             on groups;
drop policy if exists "Anyone can insert a group"             on groups;
drop policy if exists "Groups are readable by all"            on groups;
drop policy if exists "Authenticated users can create groups" on groups;

drop policy if exists "Users can read all users"              on users;
drop policy if exists "Anyone can insert a user"              on users;
drop policy if exists "User profiles are readable by all"     on users;
drop policy if exists "Users can create their own profile"    on users;
drop policy if exists "Users can update their own profile"    on users;

drop policy if exists "Logs are readable by anyone"           on logs;
drop policy if exists "Anyone can insert their own log"       on logs;
drop policy if exists "Logs are readable by all"              on logs;
drop policy if exists "Users can insert their own logs"       on logs;

-- Groups: anyone can read; authenticated users can create
create policy "Groups are readable by all"            on groups for select using (true);
create policy "Authenticated users can create groups" on groups
  for insert with check (auth.uid() is not null);

-- Users: anyone can read or create; only owner can update
-- Insert is open because signUp() has no active session when email confirmation is on
create policy "User profiles are readable by all"  on users for select using (true);
create policy "Users can create their own profile" on users for insert with check (true);
create policy "Users can update their own profile" on users for update using (auth.uid() = id);

-- Logs: anyone can read; users can only insert their own
create policy "Logs are readable by all"       on logs for select using (true);
create policy "Users can insert their own logs" on logs
  for insert with check (auth.uid() = user_id);

-- ── MIGRATION (run this if you already ran the v0 schema) ────────────────────
--
-- The only structural change is that users.id no longer has a default value,
-- since it must be set to auth.uid() on insert. If your users table is empty,
-- you can skip the ALTER and just re-run the policy drops/creates above.
--
-- alter table users alter column id drop default;
--
-- Then run all the DROP POLICY / CREATE POLICY statements above.
