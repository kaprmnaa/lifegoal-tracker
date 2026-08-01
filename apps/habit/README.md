# Pulse — Habit Tracker

React + Vite + Supabase habit tracker dengan login username, checklist harian,
to-do per habit, grafik konsistensi, dan tema mobile-first.

## Fitur

- Login/daftar pakai **username** (bukan email) — di balik layar tetap pakai Supabase Auth.
- Tambah, edit, hapus habit. Setiap habit punya **tujuan** (goal) dan **kategori/referensi**
  (cth: habit "Gym" → tujuan "Push Day").
- Checklist harian per habit (tandai selesai hari ini) + checklist to-do di dalam habit
  (cth: "Bench Press 4x8").
- Skor **disiplin & konsistensi** otomatis (persen 30 hari terakhir) + streak harian.
- Grafik garis (line chart, recharts) tren konsistensi 14 hari.
- Tema gelap "Pulse" (ember/mint accent), responsif untuk mobile.

## 1. Setup lokal

```bash
npm install
cp .env.example .env
```

Isi `.env` dengan kredensial Supabase kamu:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Jalankan:

```bash
npm run dev
```

## 2. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, jalankan isi file `supabase/schema.sql` (bikin tabel
   `hbits_profiles`, `hbits_habits`, `hbits_habit_todos`, `hbits_habit_logs` + RLS policy).
3. Buka **Authentication > Providers**, pastikan **Email** provider aktif.
4. Buka **Authentication > Settings**, matikan "Confirm email" (Email confirmations)
   supaya user bisa langsung login setelah daftar — karena app ini pakai
   username (bukan email asli), user tidak bisa klik link konfirmasi.
5. Ambil `Project URL` dan `anon public key` dari **Settings > API**, masukkan ke `.env`.

> Catatan: username diubah jadi email dummy `username@habits.local` di balik layar
> supaya bisa dipakai dengan Supabase Auth yang berbasis email/password. Ini murni
> teknis — user tetap login pakai username biasa.

## 3. Deploy ke Vercel

1. Push project ini ke GitHub.
2. Di [vercel.com](https://vercel.com), import repo tersebut.
3. Framework preset: **Vite**. Build command: `npm run build`. Output dir: `dist`.
4. Tambahkan Environment Variables di Vercel (Project Settings > Environment Variables):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy.

### Domain kustom `habits.direction.my.id`

1. Di dashboard Vercel project, buka **Settings > Domains**, tambahkan
   `habits.direction.my.id`.
2. Vercel akan kasih target DNS (biasanya CNAME `cname.vercel-dns.com`, atau
   A record ke `76.76.21.21` kalau itu domain root).
3. Di pengelola DNS domain `direction.my.id` kamu, tambahkan record:
   - Type: `CNAME`
   - Name: `habits`
   - Value: `cname.vercel-dns.com`
4. Tunggu propagasi DNS (biasanya beberapa menit sampai 1 jam), Vercel akan
   otomatis terbitkan SSL.
5. Tambahkan juga `habits.direction.my.id` ke **Supabase > Authentication >
   URL Configuration > Site URL / Redirect URLs** kalau nanti menambah fitur
   OAuth/reset password.

## Struktur project

```
src/
  components/    UI: Login, HabitList/Card, modal form & detail, chart, badge
  context/       AuthContext (session, signIn/signUp/signOut)
  hooks/         useHabits (CRUD habits, todos, daily logs)
  utils/         consistency.js (skor disiplin & streak), dateUtils.js
  lib/           supabaseClient.js
supabase/
  schema.sql     Tabel + Row Level Security policies
```

## Model data singkat

Semua tabel diberi awalan `hbits_` di database Supabase:

- `hbits_habits`: `name`, `goal` (tujuan), `reference` (kategori/merujuk ke apa), `icon`, `color`.
- `hbits_habit_todos`: checklist di dalam sebuah habit (`habit_id`, `text`, `is_done`).
- `hbits_habit_logs`: checklist harian per tanggal (`habit_id`, `log_date`, `completed`) —
  dipakai untuk menghitung streak, skor konsistensi, dan grafik.
- `hbits_profiles`: menyimpan `username` yang terhubung ke `auth.users` bawaan Supabase.
