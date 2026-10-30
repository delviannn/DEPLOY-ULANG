# Katalog Toko Delviann

Katalog online untuk Toko Delviann. Pengunjung dapat mencari dan memfilter produk, melihat detail, memilih jumlah atau varian, lalu mengirim pesanan melalui WhatsApp. Pemilik toko mengelola katalog melalui halaman admin.

**Aplikasi live:** [deploy-ulang.vercel.app](https://deploy-ulang.vercel.app/)  
**Contoh halaman produk:** [Produk 1](https://deploy-ulang.vercel.app/produk/1)

## Fitur

- Katalog produk dari Supabase dengan pencarian, filter kategori, pengurutan, dan paginasi.
- Halaman detail produk dengan galeri foto, stok, harga promo, serta pilihan jumlah dan varian.
- Keranjang dan pemesanan melalui WhatsApp.
- Admin terlindungi untuk melihat, menambah, mengubah, dan menghapus produk serta mengganti password.
- Unggah foto produk ke Supabase Storage dan pembuatan deskripsi dengan OpenAI atau Gemini (opsional).
- Dukungan PWA agar katalog dapat dipasang di perangkat.

## Menjalankan secara lokal

### 1. Clone repo dan pasang dependensi

```bash
git clone https://github.com/<akunmu>/<nama-repo>.git
cd <nama-repo>
npm install
```

### 2. Siapkan Supabase

Buat proyek di [supabase.com](https://supabase.com). Buka **SQL Editor**, lalu jalankan `docs/schema.sql` dan `docs/migration-fitur-katalog.sql` agar skema memiliki kolom dan tabel yang dipakai aplikasi.

Buat bucket publik bernama `product-images` di Supabase Storage untuk foto produk.

Buat akun admin di Supabase Auth dan matikan pendaftaran akun baru di **Authentication > Sign In / Providers**. Beri role admin melalui SQL Editor dengan UUID akun admin yang benar:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where id = '<UUID_ADMIN_DARI_AUTH_USERS>';
```

Keluar lalu masuk kembali agar sesi memuat role baru.

### 3. Atur environment

Salin `.env.example` menjadi `.env.local`, lalu isi nilainya dari **Supabase > Project Settings > API**:

```env
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
SITE_URL=http://localhost:3000
```

Pembuatan deskripsi dengan AI bersifat opsional. Isi salah satu `OPENAI_API_KEY` atau `GEMINI_API_KEY` untuk mengaktifkannya. Semua variabel dipakai di server; jangan menambahkan awalan `NEXT_PUBLIC_`.

### 4. Jalankan aplikasi

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Deployment ke Vercel

Impor repo ke Vercel, tambahkan variabel environment Supabase yang sama pada **Project Settings > Environment Variables**, lalu deploy. Atur `SITE_URL` ke URL produksi, misalnya `https://deploy-ulang.vercel.app`. Tambahkan kunci AI jika fitur pembuatan deskripsi ingin digunakan.

## Konfigurasi toko

- Identitas toko, nomor WhatsApp, alamat, dan jam buka: `lib/toko.js`.
- Warna aplikasi: bagian `@theme` pada `app/globals.css`.
- Produk: halaman admin atau Supabase **Table Editor > produk**.

## Struktur penting

| File atau folder | Kegunaan |
| --- | --- |
| `app/` | Halaman katalog, detail produk, informasi toko, dan admin |
| `components/` | Komponen antarmuka katalog dan pengelolaan produk |
| `lib/` | Koneksi Supabase, format data, dan konfigurasi toko |
| `docs/schema.sql` | Skema awal database |
| `docs/migration-fitur-katalog.sql` | Perluasan skema untuk fitur katalog |
| `docs/user-stories.md` | Daftar kebutuhan fitur |
| `docs/checklist-keamanan.md` | Checklist keamanan |
| `docs/checklist-pengujian.md` | Checklist pengujian manual |

## Teknologi

- Next.js 16 (App Router) dan React 19
- JavaScript dan Tailwind CSS 4
- Supabase Auth, Database, dan Storage
- Vercel
