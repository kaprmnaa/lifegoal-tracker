-- FinanceTrack schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Profiles: maps each auth.users row to a public username.
-- ---------------------------------------------------------------------
create table if not exists public.financetrack_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  created_at timestamptz not null default now()
);

alter table public.financetrack_profiles enable row level security;

drop policy if exists "financetrack_profiles_select" on public.financetrack_profiles;
create policy "financetrack_profiles_select"
  on public.financetrack_profiles for select
  using (true);

drop policy if exists "financetrack_profiles_insert_self" on public.financetrack_profiles;
create policy "financetrack_profiles_insert_self"
  on public.financetrack_profiles for insert
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------
-- Transactions: one row per expense entry (this app only tracks money
-- going out — no income is recorded).
-- ---------------------------------------------------------------------
create table if not exists public.financetrack_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  category text not null default 'Lainnya',
  description text,
  occurred_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.financetrack_transactions enable row level security;

drop policy if exists "financetrack_transactions_owner" on public.financetrack_transactions;
create policy "financetrack_transactions_owner"
  on public.financetrack_transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists financetrack_transactions_user_date_idx
  on public.financetrack_transactions (user_id, occurred_at);

-- ---------------------------------------------------------------------
-- Auto-create a profile row whenever a new auth user signs up.
-- The username is passed in via supabase.auth.signUp({ options: { data } }).
-- ---------------------------------------------------------------------
create or replace function public.financetrack_handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- This Supabase project is shared with other apps (e.g. Pulse habit
  -- tracker), whose signups do not pass a 'username' in user metadata.
  -- Only handle inserts that actually belong to FinanceTrack, and never
  -- let a missing/duplicate username abort signup for other apps sharing
  -- this auth.users table.
  if new.raw_user_meta_data ->> 'username' is not null then
    insert into public.financetrack_profiles (id, username)
    values (new.id, new.raw_user_meta_data ->> 'username')
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists financetrack_on_auth_user_created on auth.users;
create trigger financetrack_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.financetrack_handle_new_user();

-- ---------------------------------------------------------------------
-- Migration: if you already ran an earlier version of this schema that
-- included an income/expense `type` column, run this once to drop it
-- (this app now only tracks expenses).
-- ---------------------------------------------------------------------
-- alter table public.financetrack_transactions drop column if exists type;
