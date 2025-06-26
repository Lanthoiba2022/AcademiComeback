-- Drop the existing table if it exists (this will delete all current goals data!)
drop table if exists goals;

-- Ensure the pgcrypto extension is enabled for UUID generation
create extension if not exists "pgcrypto";

-- Create the goals table with all lowercase column names
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  userid uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  type text check (type in ('daily', 'weekly', 'monthly', 'custom')) not null,
  challenge text,
  target integer not null,
  current integer default 0,
  unit text check (unit in ('minutes', 'tasks', 'quizzes', 'points')) not null,
  deadline timestamptz,
  iscompleted boolean default false,
  createdat timestamptz default now(),
  priority text check (priority in ('low', 'medium', 'high')) not null,
  updatedat timestamptz default now()
);

-- Create an index for fast user lookups
create index if not exists idx_goals_userid on goals(userid);