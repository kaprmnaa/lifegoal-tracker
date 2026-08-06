-- Papan Tugas SMA — Supabase schema
-- Jalankan script ini di Supabase Dashboard > SQL Editor.
--
-- Tabel diberi prefix `tugassma_` supaya aman dipakai di project Supabase
-- yang sama dengan app lain (Pulse pakai prefix `hbits_`, FinanceTrack pakai
-- `financetrack_`) — tidak akan saling tabrakan nama tabel.
--
-- PENTING: matikan opsi "Confirm email" di Authentication > Sign In /
-- Providers > Email, supaya user bisa langsung login setelah daftar
-- (aplikasi login pakai username, yang di baliknya dipetakan ke alamat
-- email palsu — jadi email itu memang tidak bisa dikonfirmasi lewat inbox
-- nyata). Kalau project ini dipakai bareng Pulse/FinanceTrack, opsi ini
-- kemungkinan sudah dimatikan sebelumnya untuk mereka.

create extension if not exists "pgcrypto";

-- Profil publik yang menyimpan username tiap akun (auth.users tidak boleh diakses langsung dari client)
create table if not exists tugassma_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists tugassma_mapel (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nama text not null,
  warna text not null default '#3D8BFD',
  created_at timestamptz not null default now()
);

create table if not exists tugassma_tugas (
  id uuid primary key default gen_random_uuid(),
  mapel_id uuid not null references tugassma_mapel(id) on delete cascade,
  judul text not null,
  deskripsi text default '',
  deadline date,
  selesai boolean not null default false,
  created_at timestamptz not null default now()
);

alter table tugassma_profiles enable row level security;
alter table tugassma_mapel enable row level security;
alter table tugassma_tugas enable row level security;

drop policy if exists "tugassma read profiles" on tugassma_profiles;
create policy "tugassma read profiles" on tugassma_profiles for select using (true);

drop policy if exists "tugassma insert own profile" on tugassma_profiles;
create policy "tugassma insert own profile" on tugassma_profiles for insert with check (auth.uid() = id);

drop policy if exists "tugassma update own profile" on tugassma_profiles;
create policy "tugassma update own profile" on tugassma_profiles for update using (auth.uid() = id);

-- mapel: hanya pemilik (user_id = auth.uid()) yang boleh baca/tulis
drop policy if exists "tugassma select own mapel" on tugassma_mapel;
create policy "tugassma select own mapel" on tugassma_mapel for select using (auth.uid() = user_id);

drop policy if exists "tugassma insert own mapel" on tugassma_mapel;
create policy "tugassma insert own mapel" on tugassma_mapel for insert with check (auth.uid() = user_id);

drop policy if exists "tugassma update own mapel" on tugassma_mapel;
create policy "tugassma update own mapel" on tugassma_mapel for update using (auth.uid() = user_id);

drop policy if exists "tugassma delete own mapel" on tugassma_mapel;
create policy "tugassma delete own mapel" on tugassma_mapel for delete using (auth.uid() = user_id);

-- tugas: ikut kepemilikan mapel induknya
drop policy if exists "tugassma select own tugas" on tugassma_tugas;
create policy "tugassma select own tugas" on tugassma_tugas for select
  using (exists (select 1 from tugassma_mapel where tugassma_mapel.id = tugassma_tugas.mapel_id and tugassma_mapel.user_id = auth.uid()));

drop policy if exists "tugassma insert own tugas" on tugassma_tugas;
create policy "tugassma insert own tugas" on tugassma_tugas for insert
  with check (exists (select 1 from tugassma_mapel where tugassma_mapel.id = tugassma_tugas.mapel_id and tugassma_mapel.user_id = auth.uid()));

drop policy if exists "tugassma update own tugas" on tugassma_tugas;
create policy "tugassma update own tugas" on tugassma_tugas for update
  using (exists (select 1 from tugassma_mapel where tugassma_mapel.id = tugassma_tugas.mapel_id and tugassma_mapel.user_id = auth.uid()));

drop policy if exists "tugassma delete own tugas" on tugassma_tugas;
create policy "tugassma delete own tugas" on tugassma_tugas for delete
  using (exists (select 1 from tugassma_mapel where tugassma_mapel.id = tugassma_tugas.mapel_id and tugassma_mapel.user_id = auth.uid()));
