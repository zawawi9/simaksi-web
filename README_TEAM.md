# Dokumentasi Lengkap Proyek Simaksi Gunung Butak

## Gambaran Umum

File dokumentasi ini berisi pedoman lengkap untuk proyek Simaksi (Sistem Informasi Manajemen Kegiatan Pendakian Gunung Butak). Dokumentasi ini dirancang untuk membantu tim Anda memahami arsitektur, desain, dan struktur teknis proyek agar dapat melanjutkan pengembangan dengan konsistensi tinggi.

## File Dokumentasi yang Tersedia

### 1. DESIGN_GUIDELINES.md
File ini berisi:
- Pedoman desain UI/UX komprehensif
- Palet warna dan tipografi yang digunakan
- Pola komponen (tombol, kartu, formulir, tabel, dll.)
- Pedoman konsistensi visual
- Instruksi untuk developer frontend dan backend

**Isi utama:**
- Warna utama: Hijau (#1E8449), Aksen (#2ECC71), Gelap (#145A32)
- Font: Poppins (Google Fonts)
- Komponen: Tombol konsisten dengan efek hover, kartu dengan bayangan, formulir dengan fokus
- Konsistensi dalam tampilan dan interaksi

### 2. DATABASE_SCHEMA.md
File ini berisi:
- Struktur lengkap tabel database
- Hubungan antar tabel
- Kolom dan tipe data setiap tabel
- Indeks dan batasan
- Alur data dan query utama
- Konfigurasi Supabase

**Tabel utama:**
- `pengguna`: Informasi pengguna (ID, peran, nama)
- `reservasi`: Data reservasi (kode, tanggal, jumlah pendaki, status)
- `pendaki_rombongan`: Informasi individual pendaki
- `barang_bawaan_sampah`: Data sampah yang dibawa
- `pemasukan`: Catatan pemasukan dari reservasi
- `pengeluaran`: Catatan pengeluaran admin

### 3. TECHNICAL_SETUP.md
File ini berisi:
- Panduan teknis untuk menjalankan proyek
- Stack teknologi yang digunakan
- Struktur file dan direktori
- Alur otentikasi
- Endpoint API dan format respons
- Panduan pengembangan dan deployment
- Troubleshooting

## Teknologi yang Digunakan

### Frontend
- HTML5
- CSS: Tailwind CSS (melalui CDN)
- JavaScript: ES6 modules
- Font: Poppins (Google Fonts)

### Backend
- PHP 7.4+
- Supabase (sebagai database dan otentikasi)
- PostgreSQL (database engine)

### Struktur File
- `index.html`: Halaman utama untuk pengguna
- `dashboard-admin.html`: Dashboard admin
- `/api/`: Endpoint API PHP
- `/assets/js/`: File JavaScript modular
- `/assets/images/`: Aset gambar

## Alur Bisnis

### Untuk Pengguna
1. Pengguna mengunjungi `index.html`
2. Melakukan pendaftaran/login melalui Supabase Auth
3. Membuat reservasi (tanggal, jumlah pendaki)
4. Menambahkan informasi pendaki
5. Mendeklarasikan barang bawaan sampah
6. Menunggu konfirmasi pembayaran

### Untuk Admin
1. Admin mengakses `dashboard-admin.html`
2. Melakukan otentikasi admin
3. Melihat daftar reservasi
4. Mengkonfirmasi pembayaran
5. Mengelola keuangan (pemasukan dan pengeluaran)
6. Mengatur kuota pendakian

## Panduan untuk Tim Anda

### Frontend Developer
- Gunakan kelas-kelas Tailwind CSS secara konsisten
- Implementasikan efek hover dan animasi sesuai pedoman
- Jaga konsistensi warna dan tipografi
- Gunakan komponen-komponen yang sudah ada
- Ikuti pola modular JavaScript

### Backend Developer
- Ikuti struktur API PHP yang sudah ada di `/api/`
- Gunakan fungsi `makeSupabaseRequest()` untuk operasi database
- Jaga format respons JSON konsisten
- Terapkan otentikasi dan otorisasi
- Validasi input dengan benar

### Full-Stack Developer
- Pertahankan alur data JS → API PHP → Database
- Gunakan fungsi-fungsi utilitas yang sudah ada
- Pastikan konsistensi antara frontend dan backend
- Ikuti format error/sukses message

## Catatan Penting

### Keamanan
- Validasi input di frontend dan backend
- Gunakan otentikasi Supabase
- Batasi akses berdasarkan peran pengguna
- Lindungi endpoint sensitif

### Kinerja
- Gunakan CDN untuk library eksternal
- Optimalkan query database
- Gunakan caching saat perlu
- Jaga ukuran file asset minimal

### Konsistensi
- Gunakan komponen dan gaya yang konsisten
- Ikuti pedoman desain
- Gunakan warna dan tipografi dengan benar
- Jaga pengalaman pengguna yang seragam

## Mulai Pengembangan

File-file dokumentasi ini memberikan panduan lengkap untuk melanjutkan pengembangan proyek. Tim Anda dapat menggunakan masing-masing file sebagai referensi teknis yang spesifik:

- Gunakan DESIGN_GUIDELINES.md saat bekerja pada tampilan antarmuka
- Gunakan DATABASE_SCHEMA.md saat bekerja pada query dan struktur data
- Gunakan TECHNICAL_SETUP.md saat mengembangkan fitur baru atau memperbaiki bug

Semua dokumentasi ini disimpan dalam direktori utama proyek agar mudah diakses oleh tim Anda selama proses pengembangan.