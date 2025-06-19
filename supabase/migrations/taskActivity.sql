create table if not exists public.task_user_status (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null,
  user_id uuid not null,
  user_name text not null,
  status text not null check (status in ('Todo', 'In Progress', 'In Review', 'Completed')),
  updated_at timestamp with time zone not null default now()
);

-- Index for fast lookup
create index if not exists idx_task_user_status_task_id on public.task_user_status (task_id);


create table if not exists public.task_activity_log (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null,
  user_id uuid not null,
  user_name text not null,
  action text not null,
  timestamp timestamp with time zone not null default now()
);

-- Index for fast lookup
create index if not exists idx_task_activity_log_task_id on public.task_activity_log (task_id);

-- Enable RLS
alter table public.task_user_status enable row level security;
alter table public.task_activity_log enable row level security;

-- Allow all users to select, insert, and update (for development)
create policy "Allow all select" on public.task_user_status for select using (true);
create policy "Allow all insert" on public.task_user_status for insert with check (true);
create policy "Allow all update" on public.task_user_status for update using (true);

create policy "Allow all select" on public.task_activity_log for select using (true);
create policy "Allow all insert" on public.task_activity_log for insert with check (true);