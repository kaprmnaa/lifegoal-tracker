# FinanceTrack

Expense-only tracker bertema crypto/blockchain — dibuat dengan Vite + React + Supabase.
**App ini hanya mencatat uang keluar** (tidak ada pemasukan/saldo). Setiap pengeluaran
ditampilkan sebagai "blok" di ledger, dan divisualisasikan sebagai candlestick chart
(seperti chart trading) yang membandingkan periode ini vs periode sebelumnya. Latar
belakang dan elemen UI punya animasi SVG bertema jaringan blockchain (node & link yang
berkedip pelan, dot sinyal yang berjalan di sepanjang divider, dsb).

## Cara kerja candlestick

Setiap candle mewakili satu periode (hari/minggu/bulan):

- **open** = total pengeluaran periode sebelumnya
- **close** = total pengeluaran periode ini
- **high/low** = nilai tertinggi/terendah dari open & close

Candle **hijau (naik)** = kamu keluar uang **lebih banyak** dari periode sebelumnya.
Candle **merah (turun)** = kamu keluar uang **lebih sedikit** dari periode sebelumnya.

Contoh: hari ini keluar Rp200rb, besok Rp250rb → candle besok hijau/naik.
Hari ini Rp200rb, besok Rp150rb → candle besok merah/turun. Aturan yang sama
berlaku untuk chart weekly & monthly (dibandingkan minggu/bulan sebelumnya).

## Auth berbasis username

Supabase Auth secara default butuh email. Di app ini, user cukup mengisi **username**;
di balik layar, app membuat "shadow email" deterministik (`username@financetrack.local`)
yang dikirim ke Supabase Auth. User tidak pernah melihat atau mengisi email apa pun.

---

## 1. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor** → **New query**, tempel isi `supabase/schema.sql`, lalu **Run**.
   Ini akan membuat:
   - `financetrack_profiles` (username publik, terhubung ke `auth.users`)
   - `financetrack_transactions` (income/expense, dengan Row Level Security — user hanya
     bisa melihat/mengubah transaksi miliknya sendiri)
   - trigger otomatis yang membuat baris profile setiap kali ada user baru daftar
3. **Penting:** matikan konfirmasi email, karena app ini tidak memakai email asli.
   Buka **Authentication → Providers → Email**, matikan **"Confirm email"**, lalu **Save**.
   (Kalau ini dibiarkan aktif, user baru tidak akan bisa langsung login setelah daftar.)
4. Ambil kredensial API: **Project Settings → API**
   - `Project URL` → jadi `VITE_SUPABASE_URL`
   - `anon public` key → jadi `VITE_SUPABASE_ANON_KEY`

## 2. Setup lokal

```bash
npm install
cp .env.example .env
# isi .env dengan VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY dari langkah di atas
npm run dev
```

Buka `http://localhost:5173`, daftar dengan username + password, lalu mulai tambah transaksi.

## 3. Deploy ke Vercel

1. Push folder ini ke sebuah repo GitHub/GitLab.
2. Di [vercel.com](https://vercel.com) → **Add New Project** → import repo tersebut.
   Vercel akan otomatis mendeteksi Vite (build command `vite build`, output `dist`).
3. Di tab **Environment Variables**, tambahkan:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy.
5. `vercel.json` sudah berisi rewrite rule supaya routing client-side (`/login`, `/register`)
   tidak 404 saat direfresh.

## 4. Domain `finance.direction.my.id`

1. Di project Vercel → **Settings → Domains** → tambahkan `finance.direction.my.id`.
2. Vercel akan menunjukkan target DNS record yang perlu ditambahkan (biasanya CNAME
   mengarah ke `cname.vercel-dns.com`, atau A record jika itu domain apex).
3. Tambahkan record tersebut di pengaturan DNS penyedia domain kamu untuk `direction.my.id`.
4. Tunggu propagasi DNS (biasanya beberapa menit hingga 1 jam), Vercel akan otomatis
   menerbitkan sertifikat HTTPS.
5. (Opsional) Di Supabase → **Authentication → URL Configuration**, tambahkan
   `https://finance.direction.my.id` ke **Site URL** / **Redirect URLs** agar konsisten,
   meski app ini tidak memakai email redirect flow.

## Struktur proyek

```
src/
  lib/supabaseClient.js     # koneksi Supabase + helper username→email
  context/AuthContext.jsx   # session, profile, signUp/signIn/signOut
  pages/Login.jsx           # halaman login
  pages/Register.jsx        # halaman daftar
  pages/Dashboard.jsx       # halaman utama
  components/CandleChart.jsx    # chart candlestick (lightweight-charts)
  components/StatsBar.jsx       # ringkasan saldo & delta pengeluaran
  components/TransactionForm.jsx # modal tambah transaksi
  components/TransactionList.jsx # ledger riwayat transaksi
  utils/aggregate.js        # logika agregasi OHLC per hari/minggu/bulan
supabase/schema.sql          # skema database + RLS + trigger
```

## Catatan keamanan

- Semua akses tabel `financetrack_transactions` dibatasi oleh Row Level Security —
  user hanya bisa membaca/menulis transaksi milik dirinya sendiri (`auth.uid() = user_id`).
- `financetrack_profiles` hanya menyimpan `id` dan `username` — tidak ada email asli
  yang tersimpan di database.
