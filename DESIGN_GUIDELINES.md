# Pedoman Desain untuk Proyek Simaksi Gunung Butak

## Gambaran Umum
Dokumen ini menyediakan pedoman komprehensif untuk elemen desain, komponen UI, dan interaksi database dalam proyek Simaksi (Sistem Informasi Manajemen Kegiatan Pendakian Gunung Butak) untuk memastikan konsistensi bagi tim pengembangan Anda.

## Palet Warna
Proyek ini menggunakan palet warna hijau yang sesuai untuk sistem reservasi gunung:

- **Hijau Utama**: `#1E8449` - Warna brand utama
- **Hijau Aksen**: `#2ECC71` - Untuk sorotan dan elemen interaktif
- **Hijau Gelap**: `#145A32` - Untuk kontras dan kedalaman
- **Oranye**: `#FF8C00` - Untuk peringatan dan sorotan khusus
- **Merah**: `#E74C3C` - Untuk error dan tindakan kritis
- **Biru**: `#3498DB` - Untuk tautan dan elemen informasi

## Tipografi
- **Famili Font**: Poppins (Google Fonts) - Digunakan di seluruh aplikasi
- **Berat Font**: 300 (ringan), 400 (reguler), 500 (medium), 600 (semibold), 700 (bold)

## Kerangka CSS
- **Tailwind CSS**: Digunakan melalui CDN dengan konfigurasi kustom
- **CSS Kustom**: Ditambahkan dalam tag `<style>` file HTML untuk komponen tertentu

## Pola Desain Komponen

### 1. Tombol
Proyek ini menggunakan sistem desain tombol yang konsisten:

```html
<!-- Tombol utama -->
<button class="btn-modern bg-primary hover:bg-dark-green text-white px-4 py-2 rounded-lg">
  Aksi Utama
</button>

<!-- Tombol sekunder -->
<button class="btn-modern bg-white border border-primary text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-lg">
  Aksi Sekunder
</button>

<!-- Lencana status -->
<span class="status-badge status-terkonfirmasi">Terkonfirmasi</span> <!-- Hijau -->
<span class="status-badge status-menunggu">Menunggu</span>           <!-- Oranye -->
<span class="status-badge status-dibatalkan">Dibatalkan</span>       <!-- Merah -->
<span class="status-badge status-selesai">Selesai</span>             <!-- Biru -->
```

Kelas tombol yang digunakan di seluruh aplikasi:
- `.btn-modern` - Styling tombol dasar dengan efek hover
- Efek hover: `transform: translateY(-2px)` dan penambahan bayangan
- Sudut membulat: `border-radius: 8px`

### 2. Kartu
- `.card-modern` - Styling kartu standar dengan:
  - `border-radius: 12px`
  - Bayangan halus: `box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05)`
  - Efek hover: `transform: translateY(-2px)` dengan bayangan yang meningkat
  - Batas: `1px solid #e2e8f0`

### 3. Formulir dan Input
- `.input-modern` - Styling untuk input formulir dengan:
  - `border-radius: 8px`
  - `border: 2px solid #e2e8f0`
  - Fokus: `border-color: var(--accent)` dan `box-shadow: 0 0 0 3px rgba(46, 204, 113, 0.2)`

### 4. Tabel
- `.table-modern` - Styling tabel responsif dengan:
  - `border-collapse: separate`
  - `border-spacing: 0`
  - `border-radius: 8px`
  - Styling header: huruf kapital, tebal, ukuran font lebih kecil
  - Efek hover pada baris: perubahan warna latar

### 5. Efek Khusus dan Animasi
- **Efek Kartu Kaca**: 
  ```css
  .glass-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  ```
- **Efek Hover Kartu**: 
  - Animasi geser ke atas: `transform: translateY(-15px) scale(1.02)`
  - Bayangan ditingkatkan: `box-shadow: 0 30px 50px rgba(0, 0, 0, 0.3)`
  - Efek kilat menggunakan pseudo-elements

### 6. Navigasi dan Sidebar
- Sidebar menggunakan gradien: `background: linear-gradient(180deg, var(--sidebar-bg) 0%, var(--dark-green) 100%)`
- Item navigasi aktif: `background: var(--sidebar-hover); color: white; border-left: 4px solid var(--accent);`
- Efek hover dengan animasi kilat

### 7. Modal
- `.modal-overlay`: `backdrop-filter: blur(5px)`
- `.modal-content`: Sudut membulat dan bayangan besar untuk kedalaman

## Arsitektur Database

### Layanan Database
- **Supabase**: Digunakan sebagai solusi backend-as-a-service
- **Koneksi**: Dibuat melalui config.php dengan URL dan kunci Supabase yang专门

### Tabel Database
Sistem ini menggunakan tabel-tabel utama berikut:

1. **reservasi** - Menyimpan informasi reservasi:
   - `id_reservasi` (Kunci Utama)
   - `kode_reservasi` - Kode reservasi
   - `nama_ketua_rombongan` - Nama ketua rombongan
   - `tanggal_pendakian` - Tanggal pendakian
   - `jumlah_pendaki` - Jumlah pendaki
   - `status` - Status reservasi (menunggu_pembayaran, terkonfirmasi, dibatalkan, selesai)
   - `total_harga` - Total harga
   - `id_pengguna` - Kunci asing ke pengguna

2. **pengguna** - Menyimpan informasi pengguna:
   - `id_pengguna` (Kunci Utama, UUID)
   - `peran` - Peran pengguna (admin, pengguna biasa)
   - `nama_lengkap` - Nama lengkap

3. **pendaki_rombongan** - Menyimpan informasi pendaki untuk setiap grup:
   - `id_pendaki` (Kunci Utama)
   - `id_reservasi` - Kunci asing ke reservasi
   - `nama_lengkap` - Nama lengkap
   - `nik` - Nomor identitas
   - `alamat` - Alamat
   - `nomor_telepon` - Nomor telepon
   - `kontak_darurat` - Kontak darurat

4. **barang_bawaan_sampah** - Menyimpan informasi sampah:
   - `id_barang` (Kunci Utama)
   - `id_reservasi` - Kunci asing ke reservasi
   - `nama_barang` - Nama barang
   - `jenis_sampah` - Jenis sampah
   - `jumlah` - Kuantitas

5. **pemasukan** - Menyimpan catatan pemasukan:
   - `id_pemasukan` (Kunci Utama)
   - `id_reservasi` - Kunci asing ke reservasi
   - `id_admin` - Admin yang mencatat pemasukan
   - `jumlah` - Jumlah
   - `keterangan` - Keterangan
   - `tanggal_pemasukan` - Tanggal pemasukan

6. **pengeluaran** - Menyimpan catatan pengeluaran:
   - `id_pengeluaran` (Kunci Utama)
   - `id_admin` - Admin yang mencatat pengeluaran
   - `jumlah` - Jumlah
   - `keterangan` - Keterangan
   - `kategori` - Kategori pengeluaran
   - `tanggal_pengeluaran` - Tanggal pengeluaran

## Endpoint API

### Endpoint API Frontend (Pengguna)
Terletak di direktori `/api`:
- `config.php` - Konfigurasi database dan koneksi Supabase
- `cek_session.php` - Verifikasi sesi
- `dashboard.php` - Data dashboard
- `keuangan.php` - Data keuangan
- `konfirmasi_pembayaran.php` - Konfirmasi pembayaran
- `kuota.php` - Manajemen kuota
- `pendaki.php` - Informasi pendaki
- `pengumuman.php` - Pengumuman
- `reservasi.php` - Manajemen reservasi

### Struktur API Backend (Admin)
Dashboard admin menggunakan modul JavaScript yang berkomunikasi dengan endpoint API PHP:
- **Otentikasi**: Otentikasi Supabase dengan akses berbasis peran (admin/pengguna biasa)
- **Alur Data**: HTML → Modul JavaScript → API PHP → Database Supabase

## Arsitektur Frontend

### Struktur Modul JavaScript
Dashboard admin diorganisir menjadi modul-modul:
- `admin-modular.js` - File inisialisasi utama
- `modules/dashboard_php.js` - Fungsionalitas dashboard
- `modules/reservasi_php.js` - Manajemen reservasi
- `modules/quotas_php.js` - Manajemen kuota
- `modules/finance_php.js` - Manajemen keuangan
- `modules/router.js` - Penanganan navigasi
- `modules/utils.js` - Fungsi utilitas

### Navigasi dan Routing
- Pendekatan single-page application menggunakan modul JavaScript
- Navigasi berbasis tab dengan peralihan konten
- Tampilan detail berbasis modal

## Pedoman Konsistensi Desain

### 1. Penggunaan Warna
- Gunakan hijau utama untuk aksi utama
- Gunakan hijau aksen untuk aksi sekunder
- Gunakan oranye untuk peringatan/notifikasi
- Gunakan merah untuk keadaan error atau tindakan destruktif
- Gunakan biru untuk elemen informasi

### 2. Hirarki Tipografi
- Pertahankan famili font Poppins di seluruhnya
- Gunakan berat font yang sesuai untuk hierarki visual
- Pastikan rasio kontras yang tepat untuk aksesibilitas

### 3. Spasi dan Tata Letak
- Gunakan padding dan margin yang konsisten
- Pertahankan prinsip desain responsif
- Pastikan target sentuh yang memadai (setidaknya 44px untuk mobile)

### 4. Elemen Interaktif
- Semua elemen interaktif harus memberikan umpan balik visual
- Status hover harus konsisten
- Pertahankan status loading untuk aksi API
- Gunakan pesan umpan balik sukses/error yang sesuai

### 5. Desain Formulir
- Gunakan styling formulir yang konsisten dengan `.input-modern`
- Sediakan umpan balik validasi yang jelas
- Sertakan teks placeholder yang sesuai
- Gunakan jenis input yang sesuai untuk pengalaman mobile

## Praktik Terbaik Pengembangan

### Organisasi Kode
- Jaga modularitas JavaScript menggunakan modul ES6
- Pertahankan konvensi penamaan yang konsisten
- Gunakan HTML semantik untuk aksesibilitas
- Pisahkan tanggung jawab antara HTML, CSS, dan JavaScript

### Pertimbangan Keamanan
- Validasi dan sanitasi semua input pengguna
- Gunakan query parameterisasi di endpoint API
- Pertahankan otentikasi dan otorisasi yang tepat
- Sanitasi data sebelum menampilkannya di UI

### Optimasi Kinerja
- Minimalkan permintaan HTTP
- Optimalkan gambar dan aset
- Gunakan query database yang efisien
- Terapkan caching yang tepat di mana pun sesuai

## Struktur File
```
simaksi/
├── index.html                 # Halaman utama
├── dashboard-admin.html       # Dashboard admin
├── README.md
├── spesifikasi-buthak.md
├── api/                      # Endpoint API PHP
│   ├── config.php
│   ├── cek_session.php
│   ├── dashboard.php
│   ├── keuangan.php
│   ├── konfirmasi_pembayaran.php
│   ├── kuota.php
│   ├── pendaki.php
│   ├── pengumuman.php
│   └── reservasi.php
└── assets/
    ├── css/                  # Saat ini kosong (menggunakan CDN Tailwind)
    ├── images/               # Aset gambar
    └── js/                   # File JavaScript
        ├── admin-modular.js  # Skrip admin utama
        ├── config.js         # Konfigurasi Supabase
        └── modules/          # Komponen modular
```

## Instruksi Serah Terima untuk Tim Anda

### Untuk Developer Frontend
1. Pertahankan konsistensi dengan kelas komponen dan styling yang ada
2. Ikuti pola styling tombol dan formulir
3. Gunakan Tailwind CSS dengan konfigurasi kustom
4. Terapkan efek hover dan interaksi yang sama
5. Jaga skema warna dan tipografi yang sama

### Untuk Developer Backend
1. Ikuti struktur API PHP yang ada di direktori `/api`
2. Gunakan metode koneksi Supabase yang sama di config.php
3. Jaga validasi data dan penanganan error yang konsisten
4. Ikuti format respons yang sama: `{status: 'success'|'error', data|message: ...}`
5. Terapkan pemeriksaan otentikasi yang tepat di mana diperlukan

### Untuk Developer Full-Stack
1. Pertahankan pola alur data yang sama (JS → API PHP → Database)
2. Ikuti penanganan respons yang sama di modul JavaScript
3. Gunakan pesan error yang konsisten di frontend dan backend
4. Jaga struktur URL dan endpoint API yang sama
5. Pertahankan pola sesi dan otentikasi yang sama

Dokumentasi ini menyediakan gambaran lengkap tentang pola desain dan arsitektur teknis. Gunakan ini sebagai referensi untuk memastikan konsistensi saat Anda melanjutkan pengembangan bersama tim Anda.