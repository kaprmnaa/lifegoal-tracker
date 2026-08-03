# lifegoal.direction — monorepo

Menggabungkan dua app React + Vite + Supabase dalam satu domain:

- **`/habit`** → Pulse (habit tracker) — tema & fitur tidak diubah
- **`/finance`** → FinanceTrack (expense tracker) — tema & fitur tidak diubah
- **`/`** → halaman landing kecil yang menautkan ke keduanya

Kedua app tetap 100% independen (bundle, state, dan routing masing-masing terpisah) —
digabung hanya di level deploy/hosting, bukan di kode. Jadi tidak ada risiko tema atau
CSS yang satu "bocor" ke yang lain.

```
lifegoal/
  apps/
    habit/      ← Pulse, dari project sebelumnya (base path diubah ke /habit/)
    finance/    ← FinanceTrack kamu (base path diubah ke /finance/, router basename /finance)
  landing/
    index.html  ← halaman pemilihan app di root domain
  build.sh       ← build kedua app lalu susun ke dist/habit, dist/finance, dist/index.html
  vercel.json    ← 1 project Vercel, build kedua app, routing /habit & /finance
```

## Kunci Aplikasi — PIN & Face ID / Touch ID

Kedua app (Pulse dan FinanceTrack) sekarang punya lapisan kunci tambahan di atas
login Supabase yang sudah ada — mirip fitur "App Lock" di banking app.

- Tap ikon **🔒** di Topbar (Pulse) atau menu **🔒 Keamanan** di Sidebar (FinanceTrack)
  untuk aktifkan.
- **PIN 6 digit** — selalu bisa dipakai di device manapun.
- **Face ID / Touch ID** — pakai WebAuthn platform authenticator (API browser bawaan,
  bukan integrasi native). Tombol "Aktifkan" cuma muncul kalau device/browser
  mendukung (terdeteksi otomatis).
- Begitu salah satu diaktifkan, app akan minta buka kunci setiap kali dibuka (termasuk
  saat dibuka dari ikon Home Screen di iOS), dan otomatis terkunci lagi kalau app
  disembunyikan >5 menit lalu dibuka kembali.
- **PIN dan credential Face ID/Touch ID disimpan HANYA di localStorage perangkat itu
  sendiri** — tidak dikirim ke Supabase atau server manapun. Ini murni gerbang lokal
  di atas sesi login yang sudah ada, bukan pengganti sistem login. Konsekuensinya:
  ganti device atau hapus data browser → perlu disetel ulang; dan tidak ada cara
  "reset PIN dari server" kalau lupa (tinggal hapus PIN dari menu Keamanan kalau masih
  bisa masuk, atau clear site data dari browser kalau benar-benar lupa).
- Kenapa bukan Face ID "native": website/PWA tidak diberi akses langsung ke Face ID
  oleh iOS — satu-satunya jalan resmi adalah WebAuthn, yang memicu prompt Face ID/Touch
  ID asli lewat browser. Dukungannya bagus di Safari/PWA standalone sejak iOS 16-an ke
  atas; kalau device/browser tidak mendukung, opsi Face ID otomatis disembunyikan dan
  PIN tetap jadi cadangan utama.

## Fitur baru di Pulse (dari habit tracker lama kamu)

Diambil dari project habit tracker lama kamu, dipasang ke tema Pulse yang sekarang
(tidak pakai styling/tailwind lama, tapi logikanya sama):

- **Jadwal Harian / Mingguan / Bulanan** — saat tambah/edit habit, sekarang ada pilihan
  jadwal: Harian (tiap hari), Mingguan (pilih hari tertentu, cth: Sen/Rab/Jum), atau
  Bulanan (pilih tanggal tertentu, cth: tgl 1 & 15). Checklist harian, streak, dan skor
  konsistensi semua sekarang sadar jadwal — hari yang tidak dijadwalkan tidak memutus
  streak dan tidak dihitung di skor konsistensi.
- **Rencana Besok** — section baru di bawah daftar habit: pilih habit (opsional), tulis
  rencana untuk besok, tandai selesai. Sama seperti fitur "Rencana Besok" di app lama
  kamu (`tomorrow_plans` + pilih habit).
- **Goals** — section baru: buat Goal besar, pecah jadi beberapa "Tantangan" berdurasi
  (cth: "Lari pagi" 30 hari), lalu checklist harian per tantangan lewat grid titik hari.
  Progress bar otomatis, tantangan otomatis "Tuntas" saat semua hari tercapai, bisa
  di-reset atau dihapus.

Scope trim: fitur "catat kesalahan" (mistakes) dan "evaluasi" di Goals app lama **belum**
dipindahkan (itu sub-fitur besar tersendiri) — kalau masih dibutuhkan, bisa ditambahkan
di sesi berikutnya.

Tabel baru/berubah di `apps/habit/supabase/schema.sql`:
- `hbits_habits` — tambah kolom `period`, `target`, `unit`, `selected_days`
- `hbits_tomorrow_plans` — baru
- `hbits_goals`, `hbits_goal_tasks`, `hbits_goal_checkins` — baru

**Wajib jalankan ulang** `apps/habit/supabase/schema.sql` di SQL Editor Supabase
supaya kolom & tabel barunya aktif (aman dijalankan ulang — semua pakai
`if not exists` / `add column if not exists`).

## Login ke Pulse dan FinanceTrack sekaligus

Karena kedua app sekarang satu domain (`lifegoal.direction.my.id`), browser
menyimpan sesi login keduanya di `localStorage` **origin yang sama**. Supaya
tidak saling menimpa, masing-masing Supabase client diberi `storageKey`
unik:

- Pulse → `pulse-hbits-auth` (`apps/habit/src/lib/supabaseClient.js`)
- FinanceTrack → `financetrack-auth` (`apps/finance/src/lib/supabaseClient.js`)

Dengan ini kamu bisa login ke FinanceTrack di satu tab dan Pulse di tab lain
(atau bahkan bolak-balik di tab yang sama) — keduanya tetap login sendiri-
sendiri tanpa error atau saling logout. Ini murni soal penyimpanan sesi di
browser; akun/tabel usernya memang sudah terpisah dari awal (`hbits_profiles`
vs `financetrack_profiles`).

## Kenapa signup habit sempat gagal 500

Root cause-nya sudah diperbaiki di `apps/finance/supabase/schema.sql`: ada trigger
`financetrack_on_auth_user_created` yang jalan di **setiap** insert ke `auth.users`
(bukan cuma dari FinanceTrack), dan dulu selalu mencoba insert ke
`financetrack_profiles` walau `username` di metadata kosong (kasus signup dari Pulse).
Itu bikin transaksi gagal dan **signup Pulse ikut gagal**, walau errornya kelihatan di
sisi Pulse.

Sekarang trigger-nya di-guard: hanya insert ke `financetrack_profiles` kalau memang ada
`username` di metadata (artinya request dari FinanceTrack). Signup dari app manapun yang
berbagi project Supabase yang sama tidak akan lagi saling menjatuhkan.

**Wajib jalankan ulang `apps/finance/supabase/schema.sql` di SQL Editor Supabase**
(project yang sama dengan yang dipakai Pulse) supaya fix ini aktif.

## 1. Setup lokal

Masing-masing app tetap punya `.env` sendiri (isi dengan kredensial Supabase — boleh
project yang sama untuk keduanya, seperti sekarang):

```bash
cp apps/habit/.env.example apps/habit/.env
cp apps/finance/.env.example apps/finance/.env
# isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY di masing-masing
```

Jalankan salah satu app untuk dev (port beda supaya bisa jalan bareng):

```bash
npm run dev:habit     # http://localhost:5173
npm run dev:finance   # http://localhost:5174
```

## 2. Setup Supabase

Kalau kedua app pakai **project Supabase yang sama** (seperti sekarang):

1. Jalankan `apps/habit/supabase/schema.sql` (tabel `hbits_*`).
2. Jalankan `apps/finance/supabase/schema.sql` (tabel `financetrack_*`, sudah termasuk
   fix trigger di atas).
3. Authentication → Providers → Email tetap aktif; matikan **"Confirm email"**
   (kedua app pakai email dummy berbasis username, bukan email asli).

Kedua app punya sistem auth/username terpisah (tabel profil berbeda: `hbits_profiles`
vs `financetrack_profiles`), jadi **akun di Pulse dan FinanceTrack tidak saling
terhubung** — login beda, meskipun 1 project Supabase. Kalau nanti mau akun tunggal
untuk kedua app, itu perubahan terpisah (bisa didiskusikan lagi).

## 3. Deploy — pilih salah satu: Vercel atau Netlify

Repo ini sudah siap untuk keduanya (`vercel.json` dan `netlify.toml` sama-sama ada di
root, tidak saling ganggu — masing-masing platform cuma baca file konfigurasinya sendiri).

### Opsi A — Vercel (1 project, 1 domain)

1. Push folder `lifegoal/` ini ke GitHub (root repo = folder ini, bukan `apps/habit` atau
   `apps/finance` sendiri-sendiri).
2. Di Vercel, **New Project** → import repo ini.
3. Vercel akan otomatis pakai konfigurasi dari `vercel.json` di root:
   - `buildCommand`: `npm run build` (menjalankan `build.sh` → build kedua app →
     susun ke `dist/`)
   - `outputDirectory`: `dist`
4. Environment Variables (Project Settings → Environment Variables) — cukup 2, dipakai
   bareng oleh kedua app karena nama variabelnya sama persis di keduanya:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy.

#### Domain di Vercel

1. Vercel → Project Settings → Domains → tambahkan `lifegoal.direction.my.id`
   (root domain, bukan subdomain).
2. Vercel kasih target DNS. Untuk root/apex domain biasanya:
   - Type `A`, Name `@`, Value `76.76.21.21`
   - (atau ikuti persis instruksi yang muncul di dashboard Vercel — kadang berbeda
     tergantung setup domain kamu)
3. Kalau `direction.my.id` juga dipakai untuk subdomain lain, cukup tambahkan record
   untuk `lifegoal` sesuai instruksi Vercel (`CNAME lifegoal → cname.vercel-dns.com`
   kalau itu jadi subdomain, bukan root).

### Opsi B — Netlify (1 site, 1 domain)

1. Push folder `lifegoal/` ini ke GitHub (sama seperti di atas).
2. Di Netlify, **Add new site → Import an existing project** → pilih repo ini.
3. Netlify baca `netlify.toml` di root otomatis:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Redirect rules untuk `/habit/*` dan `/finance/*` sudah diatur di sana, supaya
     refresh/deep-link (termasuk rute React Router di FinanceTrack seperti
     `/finance/login`) tetap kebuka, bukan 404.
4. Site settings → **Environment variables** → tambahkan 2 variable yang sama:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy site.

#### Domain di Netlify

1. Site settings → **Domain management** → **Add a domain** → masukkan
   `lifegoal.direction.my.id`.
2. Netlify kasih 2 opsi, pilih salah satu:
   - **Pakai Netlify DNS** (paling gampang, auto-SSL): ganti nameserver domain
     `direction.my.id` ke nameserver yang diberikan Netlify. Ini akan mengatur DNS
     domain secara keseluruhan lewat Netlify — cocok kalau `direction.my.id` memang
     mau dikelola sepenuhnya di sana.
   - **Pakai DNS eksternal** (kalau nameserver domain kamu tetap di provider lain):
     tambahkan record sesuai instruksi yang muncul di dashboard Netlify saat itu —
     biasanya `A` record ke IP load balancer Netlify untuk root domain, atau `CNAME`
     ke `<nama-site>.netlify.app` kalau `lifegoal` didaftarkan sebagai subdomain.
     Nilai persisnya bisa beda-beda, jadi ikuti yang tertera di dashboard saat kamu
     menambahkan domainnya, bukan nilai statis dari sini.
3. Tunggu propagasi DNS, Netlify otomatis terbitkan SSL (Let's Encrypt) setelah DNS
   terverifikasi.
4. Cek:
   - `lifegoal.direction.my.id/` → halaman pilihan
   - `lifegoal.direction.my.id/habit` → Pulse
   - `lifegoal.direction.my.id/finance` → FinanceTrack

## Catatan penting

- Kalau butuh update salah satu app saja (misal cuma Pulse), tetap push dari repo
  gabungan ini — Vercel akan rebuild keduanya (build cepat, tidak masalah untuk project
  sekecil ini).
- Vite `base` di `apps/habit/vite.config.js` dan `apps/finance/vite.config.js` sudah
  diset ke `/habit/` dan `/finance/` — **jangan dihapus**, itu yang bikin asset (JS/CSS)
  ke-resolve dengan benar di bawah subpath.
- React Router di FinanceTrack sudah diberi `basename="/finance"` di `App.jsx` — kalau
  nanti nambah route baru, pemanggilan `<Link to="/...">` tetap relatif ke basename ini
  secara otomatis, tidak perlu diawali `/finance` manual.
- `vercel.json` dan `netlify.toml` sengaja dibiarkan ada berdua — tidak konflik, karena
  masing-masing platform cuma baca file konfigurasinya sendiri. Kamu bisa pilih salah
  satu (atau deploy ke keduanya sekaligus dengan domain berbeda) tanpa perlu hapus yang
  lain.
