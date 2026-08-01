-- =========================================================
-- Pulse Habit Tracker — Supabase schema
-- Jalankan file ini di Supabase SQL Editor (Project > SQL Editor)
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- hbits_profiles: menyimpan username (auth Supabase tetap pakai email
-- di balik layar: username diubah jadi "username@habits.local")
-- ---------------------------------------------------------
create table if not exists hbits_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null check (char_length(username) between 3 and 24),
  created_at timestamptz default now()
);

alter table hbits_profiles enable row level security;

drop policy if exists "hbits_profiles are viewable by owner" on hbits_profiles;
create policy "hbits_profiles are viewable by owner"
  on hbits_profiles for select
  using (auth.uid() = id);

drop policy if exists "hbits_profiles are insertable by owner" on hbits_profiles;
create policy "hbits_profiles are insertable by owner"
  on hbits_profiles for insert
  with check (auth.uid() = id);

-- ---------------------------------------------------------
-- hbits_habits
-- ---------------------------------------------------------
create table if not exists hbits_habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  goal text,          -- tujuan, contoh: "Push Day"
  reference text,      -- kategori/merujuk ke apa, contoh: "Gym"
  icon text default '🔥',
  color text default '#FF5A36',
  period text default 'daily',        -- 'daily' | 'weekly' | 'monthly'
  target integer default 1,
  unit text,
  selected_days jsonb default '[]'::jsonb,  -- weekly: 0=Sen..6=Min, monthly: tanggal 1-31
  created_at timestamptz default now()
);

-- Migrasi untuk database yang sudah pernah dibuat sebelum kolom ini ada.
alter table hbits_habits add column if not exists period text default 'daily';
alter table hbits_habits add column if not exists target integer default 1;
alter table hbits_habits add column if not exists unit text;
alter table hbits_habits add column if not exists selected_days jsonb default '[]'::jsonb;

alter table hbits_habits enable row level security;

drop policy if exists "hbits_habits are managed by owner" on hbits_habits;
create policy "hbits_habits are managed by owner"
  on hbits_habits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------
-- hbits_habit_todos: checklist item di dalam sebuah habit
-- ---------------------------------------------------------
create table if not exists hbits_habit_todos (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references hbits_habits(id) on delete cascade not null,
  text text not null,
  is_done boolean default false,
  created_at timestamptz default now()
);

alter table hbits_habit_todos enable row level security;

drop policy if exists "todos are managed by habit owner" on hbits_habit_todos;
create policy "todos are managed by habit owner"
  on hbits_habit_todos for all
  using (exists (select 1 from hbits_habits h where h.id = habit_id and h.user_id = auth.uid()))
  with check (exists (select 1 from hbits_habits h where h.id = habit_id and h.user_id = auth.uid()));

-- ---------------------------------------------------------
-- hbits_habit_logs: checklist harian (dipakai untuk grafik & konsistensi)
-- ---------------------------------------------------------
create table if not exists hbits_habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references hbits_habits(id) on delete cascade not null,
  log_date date not null,
  completed boolean default true,
  created_at timestamptz default now(),
  unique (habit_id, log_date)
);

alter table hbits_habit_logs enable row level security;

drop policy if exists "logs are managed by habit owner" on hbits_habit_logs;
create policy "logs are managed by habit owner"
  on hbits_habit_logs for all
  using (exists (select 1 from hbits_habits h where h.id = habit_id and h.user_id = auth.uid()))
  with check (exists (select 1 from hbits_habits h where h.id = habit_id and h.user_id = auth.uid()));

-- ---------------------------------------------------------
-- index bantu query grafik
-- ---------------------------------------------------------
create index if not exists idx_hbits_habit_logs_habit_date on hbits_habit_logs (habit_id, log_date desc);
create index if not exists idx_hbits_habits_user on hbits_habits (user_id);
create index if not exists idx_hbits_todos_habit on hbits_habit_todos (habit_id);

-- ---------------------------------------------------------
-- hbits_tomorrow_plans: rencana besok, opsional dikaitkan ke satu habit
-- ---------------------------------------------------------
create table if not exists hbits_tomorrow_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  habit_id uuid references hbits_habits(id) on delete cascade,
  plan text not null,
  plan_date date not null,
  completed boolean default false,
  created_at timestamptz default now()
);

alter table hbits_tomorrow_plans enable row level security;

drop policy if exists "tomorrow plans are managed by owner" on hbits_tomorrow_plans;
create policy "tomorrow plans are managed by owner"
  on hbits_tomorrow_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_hbits_tomorrow_plans_user_date on hbits_tomorrow_plans (user_id, plan_date);

-- ---------------------------------------------------------
-- Goals: goal besar -> tantangan (goal_tasks) berdurasi -> checkin harian
-- ---------------------------------------------------------
create table if not exists hbits_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  status text default 'active',   -- 'active' | 'completed'
  created_at timestamptz default now()
);

alter table hbits_goals enable row level security;

drop policy if exists "goals are managed by owner" on hbits_goals;
create policy "goals are managed by owner"
  on hbits_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_hbits_goals_user on hbits_goals (user_id);

create table if not exists hbits_goal_tasks (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references hbits_goals(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  duration_days integer not null default 30,
  start_date date not null default current_date,
  status text default 'active',   -- 'active' | 'completed'
  created_at timestamptz default now()
);

alter table hbits_goal_tasks enable row level security;

drop policy if exists "goal tasks are managed by owner" on hbits_goal_tasks;
create policy "goal tasks are managed by owner"
  on hbits_goal_tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_hbits_goal_tasks_goal on hbits_goal_tasks (goal_id);

create table if not exists hbits_goal_checkins (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references hbits_goal_tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  check_date date not null,
  created_at timestamptz default now(),
  unique (task_id, check_date)
);

alter table hbits_goal_checkins enable row level security;

drop policy if exists "goal checkins are managed by owner" on hbits_goal_checkins;
create policy "goal checkins are managed by owner"
  on hbits_goal_checkins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_hbits_goal_checkins_task on hbits_goal_checkins (task_id, check_date);
