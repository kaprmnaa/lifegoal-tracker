# Papan Tugas SMA

Bagian dari monorepo `lifegoal.direction` — lihat `README.md` di root repo untuk
panduan setup & deploy lengkap (dev server, Supabase, Vercel/Netlify).

App ini dilayani di path **`/tugas`**. Dijalankan sendiri untuk dev:

```bash
npm run dev:tugas   # dari root repo, http://localhost:5175
```

## Fitur

- Login & daftar akun pakai username (bukan email)
- Tambah / hapus mapel, masing-masing dengan warna label sendiri
- Tambah / centang selesai / hapus tugas di dalam tiap mapel
- Deadline opsional dengan status urgensi otomatis (telat / hari ini / segera)
- Data tersimpan di Supabase — fallback otomatis ke localStorage kalau
  `.env` belum diisi

## Supabase

Jalankan `supabase/schema.sql` di SQL Editor Supabase (aman dijalankan ulang).
Semua tabel diberi prefix `tugassma_` (`tugassma_profiles`, `tugassma_mapel`,
`tugassma_tugas`) supaya tidak bentrok dengan tabel Pulse (`hbits_*`) atau
FinanceTrack (`financetrack_*`) kalau memakai project Supabase yang sama.

**Catatan teknis penting:** proses signup di `src/lib/auth.js` sengaja
**tidak** mengirim `username` lewat user metadata Supabase Auth
(`options.data`). Kalau project Supabase ini sama dengan yang dipakai
FinanceTrack, ada trigger `financetrack_on_auth_user_created` di sana yang
otomatis jalan untuk **setiap** insert ke `auth.users` (dari app manapun) dan
mencoba insert ke `financetrack_profiles` kalau ada `username` di metadata.
Username di app ini disimpan manual ke `tugassma_profiles` sesudah signup
berhasil — pola yang sama seperti yang dipakai Pulse (`hbits_profiles`) untuk
menghindari trigger itu.

Jangan lupa matikan **"Confirm email"** di Supabase Authentication Settings
(lihat README root untuk detail alasannya).
