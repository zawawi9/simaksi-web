# Panduan Pengaturan Teknis untuk Simaksi Gunung Butak

## Gambaran Proyek
Simaksi (Sistem Informasi Manajemen Kegiatan Pendakian Gunung Butak) adalah sistem reservasi berbasis web untuk izin pendakian Gunung Butak. Fitur ini mencakup antarmuka reservasi publik dan dashboard admin untuk mengelola reservasi dan keuangan.

## Teknologi yang Digunakan
- **Frontend**: HTML, CSS (Tailwind CSS melalui CDN), JavaScript (modul ES6)
- **Backend**: PHP (endpoint API)
- **Database**: Supabase (berbasis PostgreSQL)
- **Otentikasi**: Supabase Auth
- **Penyimpanan File**: (Jika diimplementasikan) Supabase Storage

## Persyaratan Sistem
- Server web dengan dukungan PHP 7.4+
- Browser web modern (Chrome, Firefox, Safari, Edge)
- Koneksi internet (untuk sumber daya CDN dan integrasi Supabase)
- Akses ke kredensial proyek Supabase

## Pengaturan Awal

### 1. Kloning/Unduh Proyek
- Unduh file-file proyek ke direktori server web Anda
- Pastikan semua file mempertahankan struktur direktori mereka

### 2. Konfigurasi Supabase
Proyek ini sudah dikonfigurasi untuk terhubung ke database Supabase:

**Konfigurasi Saat Ini** (di `api/config.php` dan `assets/js/config.js`):
- **URL Supabase**: `https://kitxtcpfnccblznbagzx.supabase.co`
- **Kunci Anon**: (sudah dikonfigurasi)
- **Kunci Peran Layanan**: (sudah dikonfigurasi)

### 3. Pengaturan Server Web
Proyek ini dapat berjalan di server web apa pun yang mendukung PHP. Tidak diperlukan konfigurasi khusus selain dukungan PHP standar.

**Untuk pengembangan lokal**, Anda dapat menggunakan:
- XAMPP (Windows) / MAMP (Mac) - menyertakan Apache dan PHP
- Server bawaan PHP (hanya untuk pengembangan):
  ```bash
  cd direktori-proyek-anda
  php -S localhost:8000
  ```

## Struktur Proyek
```
simaksi/
├── index.html                 # Halaman utama publik dengan formulir reservasi
├── dashboard-admin.html       # Dashboard admin
├── README.md
├── spesifikasi-buthak.md
├── DESIGN_GUIDELINES.md       # Dokumentasi desain (baru ditambahkan)
├── DATABASE_SCHEMA.md         # Dokumentasi database (baru ditambahkan)
├── api/                      # Endpoint API PHP
│   ├── config.php            # Konfigurasi database
│   ├── cek_session.php       # Verifikasi sesi
│   ├── dashboard.php         # Data dashboard
│   ├── keuangan.php          # Data keuangan
│   ├── konfirmasi_pembayaran.php # Konfirmasi pembayaran
│   ├── kuota.php             # Manajemen kuota
│   ├── pendaki.php           # Informasi pendaki
│   ├── pengumuman.php        # Pengumuman
│   └── reservasi.php         # Manajemen reservasi
└── assets/
    ├── images/               # Aset gambar
    └── js/                   # File JavaScript
        ├── admin-modular.js  # Aplikasi admin utama
        ├── config.js         # Konfigurasi Supabase
        └── modules/          # Komponen JavaScript modular
```

## Menjalankan Aplikasi

### 1. Antarmuka Publik (index.html)
- Akses melalui `http://domain-anda.com/index.html`
- Pengguna dapat membuat reservasi baru dan memeriksa status reservasi
- Halaman menangani pendaftaran/login pengguna melalui Supabase Auth
- Reservasi disimpan dalam tabel `reservasi`, `pendaki_rombongan`, dan `barang_bawaan_sampah`

### 2. Dashboard Admin (dashboard-admin.html)
- Akses melalui `http://domain-anda.com/dashboard-admin.html`
- Membutuhkan otentikasi tingkat admin
- Menyediakan tampilan untuk reservasi, kuota, dan manajemen keuangan
- Menampilkan daftar reservasi, mengkonfirmasi pembayaran, dan melacak pemasukan/pengeluaran

## Pengaturan Database

### Pengaturan Proyek Supabase (jika membuat ulang)
Jika Anda perlu mengatur proyek Supabase baru untuk aplikasi ini:

1. **Buat Proyek Supabase**:
   - Kunjungi https://supabase.com
   - Buat proyek baru
   - Catat URL Proyek dan kunci API

2. **Konfigurasi Tabel Database**:
   - Gunakan struktur tabel yang didokumentasikan di DATABASE_SCHEMA.md
   - Atur hubungan dan batasan yang tepat
   - Aktifkan kebijakan Row Level Security (RLS) sesuai kebutuhan

3. **Perbarui Konfigurasi**:
   - Perbarui `api/config.php` dengan kredensial proyek baru
   - Perbarui `assets/js/config.js` dengan kredensial proyek baru

4. **Atur Otentikasi**:
   - Konfigurasikan pengaturan otentikasi sesuai kebutuhan Anda
   - Atur konfirmasi email jika diperlukan
   - Pertimbangkan untuk mengatur penyedia OAuth jika diperlukan

### Tabel Database yang Dibutuhkan
Aplikasi membutuhkan tabel-tabel berikut (lihat DATABASE_SCHEMA.md untuk struktur terperinci):
- `pengguna` - Informasi pengguna yang terhubung ke Supabase Auth
- `reservasi` - Catatan reservasi
- `pendaki_rombongan` - Informasi pendaki individual per reservasi
- `barang_bawaan_sampah` - Informasi deklarasi sampah
- `pemasukan` - Catatan pemasukan
- `pengeluaran` - Catatan pengeluaran

## Referensi Endpoint API

### Endpoint Frontend (API PHP)
Semua endpoint API diakses sebagai `/api/nama_endpoint.php`:

1. **`config.php`** - Fungsi konfigurasi database dan koneksi Supabase
2. **`cek_session.php`** - Verifikasi otentikasi sesi pengguna
3. **`reservasi.php`** - Menangani operasi CRUD reservasi
4. **`pendaki.php`** - Menangani informasi pendaki untuk reservasi
5. **`keuangan.php`** - Operasi data keuangan
6. **`dashboard.php`** - Data ringkasan dashboard
7. **`konfirmasi_pembayaran.php`** - Proses konfirmasi pembayaran
8. **`kuota.php`** - Operasi manajemen kuota

### Format Respons API
Semua endpoint API mengembalikan JSON dengan format berikut:
```json
{
  "status": "success|error",
  "data": {...},
  "message": "..." (untuk error)
}
```

## Alur Otentikasi

### Pendaftaran/Login Pengguna
1. Pengguna mendaftar/login melalui Supabase Auth
2. Otentikasi yang berhasil membuat sesi
3. Sesi diverifikasi melalui `cek_session.php`
4. Peran pengguna diperiksa di tabel `pengguna`

### Akses Admin
1. Admin harus menjadi pengguna terdaftar dengan `peran = 'admin'` di tabel `pengguna`
2. Dashboard admin memeriksa validitas sesi dan peran
3. Pengguna yang tidak sah dialihkan ke halaman utama

## Panduan Pengembangan

### Pengembangan Frontend
- Gunakan kelas Tailwind CSS secara konsisten (seperti yang didefinisikan dalam pedoman desain)
- Ikuti pola modul JavaScript yang ada
- Pertahankan prinsip desain responsif
- Gunakan elemen HTML semantik
- Ikuti praktik terbaik aksesibilitas

### Pengembangan Backend
- Ikuti struktur API PHP yang ada
- Gunakan fungsi `makeSupabaseRequest()` untuk operasi database
- Pertahankan format respons yang konsisten
- Implementasikan penanganan error yang tepat
- Ikuti praktik keamanan terbaik

### Operasi Database
- Gunakan fungsi koneksi Supabase yang disediakan
- Implementasikan validasi input dan sanitasi yang tepat
- Ikuti pola alur data yang ada
- Pertahankan integritas referensial
- Gunakan penanganan error yang tepat untuk operasi database

## Pengujian

### Pengujian Frontend
- Uji semua formulir dan alur pengguna di berbagai browser
- Verifikasi desain responsif di berbagai ukuran layar
- Uji semua elemen interaktif (tombol, modal, navigasi)

### Pengujian Backend
- Uji semua endpoint API secara langsung dengan berbagai input
- Verifikasi penanganan error untuk permintaan tidak valid
- Uji alur otentikasi dan otorisasi
- Validasi batasan integritas data

## Deployment

### Deployment Produksi
1. Pastikan versi PHP memenuhi persyaratan (7.4+)
2. Verifikasi semua izin file diatur dengan benar
3. Perbarui konfigurasi Supabase untuk lingkungan produksi
4. Uji semua fungsionalitas di lingkungan produksi
5. Atur monitoring dan logging sesuai kebutuhan

### Konfigurasi Lingkungan Spesifik
- Perbarui kredensial Supabase untuk lingkungan yang berbeda
- Konfigurasikan domain khusus jika diperlukan
- Atur sertifikat SSL untuk koneksi aman
- Konfigurasikan variabel lingkungan yang diperlukan

## Pemecahan Masalah

### Masalah Umum

1. **Kesalahan Koneksi API**:
   - Verifikasi kredensial Supabase di file konfigurasi sisi klien dan sisi server
   - Periksa apakah proyek Supabase masih aktif
   - Verifikasi konektivitas jaringan ke Supabase

2. **Masalah Otentikasi**:
   - Pastikan pengaturan Supabase Auth cocok dengan implementasi
   - Verifikasi peran pengguna diatur dengan benar di tabel `pengguna`
   - Periksa konfigurasi manajemen sesi

3. **Kesalahan Query Database**:
   - Validasi bahwa semua tabel yang diperlukan ada dengan struktur yang benar
   - Verifikasi nama kolom dan tipe data cocok dengan implementasi
   - Periksa apakah ada hubungan atau batasan yang hilang

4. **Masalah Frontend**:
   - Verifikasi semua sumber daya CDN dimuat dengan benar
   - Periksa konsol JavaScript untuk error
   - Pastikan semua file yang diperlukan ada di lokasi yang benar

## Dukungan dan Pemeliharaan
- Monitor log aplikasi untuk error
- Backup database secara rutin
- Jaga agar dependensi tetap diperbarui (terutama library klien Supabase)
- Tinjau dan perbarui kebijakan keamanan secara berkala
- Uji fungsionalitas setelah perubahan infrastruktur apa pun

## Kontak & Dukungan
Untuk dukungan teknis dengan aplikasi ini, merujuk ke dokumentasi pengembangan asli atau tim yang awalnya membangun proyek ini.