# SIMAKSI - Sistem Informasi Manajemen Aplikasi Kawasan Gunung Butak

Repo untuk project SIMAKSI (Sistem Informasi Manajemen Aplikasi Kawasan) Gunung Butak - Semester 3 WEB dan Android POLITEKNIK NEGERI JEMBER

## Deskripsi Aplikasi

SIMAKSI adalah aplikasi web untuk sistem reservasi pendakian Gunung Butak berbasis web. Aplikasi ini dirancang untuk memudahkan pendakian dalam proses pendaftaran, pembayaran, serta pengelolaan data oleh admin. Aplikasi ini menyediakan sistem manajemen yang komprehensif untuk pengelolaan pendakian Gunung Butak.

## Fitur Utama

### 1. Sistem Autentikasi
- **Registrasi Pengguna**: Pengguna dapat mendaftar dengan email, nama lengkap, dan nomor telepon
- **Login/Logout**: Sistem otentikasi berbasis Supabase Auth
- **Otorisasi Role**: Perbedaan akses antara pengguna biasa (pendaki) dan admin

### 2. Halaman Landing (Frontend)
- **Landing Page**: Tampilan menarik dengan informasi tentang Gunung Butak
- **Tentang Gunung Butak**: Sejarah, fakta menarik, dan keunggulan
- **Informasi Cuaca**: Prakiraan cuaca harian dan 3 hari ke depan
- **Lokasi Pendakian**: Peta Google Maps interaktif dan informasi rute
- **Testimoni Pendaki**: Ulasan dan rating dari pendaki sebelumnya
- **Waktu Terbaik Mendaki**: Informasi musim dan waktu ideal untuk pendakian
- **Pengumuman**: Informasi penting dari admin
- **Galeri & Visualisasi**: Poster promosi yang dapat dirotasi secara otomatis
- **Pendaftaran & Reservasi**: Formulir reservasi online

### 3. Sistem Reservasi
- **Formulir Reservasi**: Pemesanan tiket pendakian dan parkir
- **Validasi Data**: Pemeriksaan data pemesan (NIK, surat sehat)
- **Pemilihan Tanggal**: Kalender interaktif untuk memilih tanggal pendakian
- **Pemilihan Jumlah Tiket**: Penyesuaian jumlah tiket pendaki dan kendaraan
- **Sistem Kuota Harian**: Batas maksimum pendaki per hari
- **Validasi Kuota**: Pemeriksaan ketersediaan slot
- **Upload Surat Sehat**: Pendaki dapat mengupload surat keterangan sehat
- **Manajemen Rombohgan**: Penambahan data pendaki dalam satu rombongan

### 4. Sistem Pembayaran
- **Pembayaran Manual**: Sistem konfirmasi pembayaran oleh admin
- **Status Pembayaran**: Pelacakan status pembayaran reservasi
- **Pembuatan Kode Reservasi**: Kode unik untuk setiap reservasi

### 5. Sistem Admin
- **Dashboard Admin**: Ringkasan data usaha dan statistik
- **Manajemen Reservasi**: Lihat, konfirmasi, dan validasi reservasi
- **Manajemen Pengguna**: Lihat dan kelola data pengguna
- **Manajemen Pengumuman**: Buat, edit, dan hapus pengumuman
- **Manajemen Barang Bawaan**: Validasi jenis barang bawaan dan sampah
- **Manajemen Kuota Harian**: Atur batas maksimum pendaki per hari
- **Manajemen Harga Tiket**: Atur harga tiket masuk dan parkir
- **Manajemen Pengeluaran**: Catat biaya operasional
- **Manajemen Laporan Keuangan**: Laporan pemasukan dan pengeluaran
- **Validasi Surat Sehat**: Verifikasi surat keterangan sehat pendaki
- **Validasi Sampah**: Pemeriksaan jenis dan jumlah sampah bawaan

### 6. Sistem Rating & Ulasan
- **Penilaian Bintang**: Sistem rating 5 bintang dari pendaki
- **Formulir Komentar**: Pendaki dapat meninggalkan komentar
- **Statistik Rating**: Rata-rata rating dan jumlah ulasan
- **Tampilan Ulasan**: Ulasan ditampilkan secara sliding di halaman utama

### 7. Sistem Validasi & Keamanan
- **Validasi Data**: Pemeriksaan data pengguna dan surat sehat
- **Validasi Sampah**: Pemeriksaan jenis dan jumlah sampah bawaan
- **Validasi NIK**: Pemeriksaan identitas pengguna
- **Sistem Verifikasi Email**: Konfirmasi email registrasi

### 8. Fitur Tambahan
- **Visualisasi Data**: Charts dan grafik untuk data statistik
- **Sistem Notifikasi**: Alert dan pesan status operasional
- **Responsive Design**: Tampilan yang responsif untuk berbagai ukuran layar
- **Mode Gelap**: Opsi tampilan dark mode
- **Slider Otomatis**: Untuk poster promosi dan ulasan
- **Search Functionality**: Pencarian data reservasi dan pengguna

## Teknologi dan API yang Digunakan

### 1. Supabase
- **Database**: PostgreSQL database untuk menyimpan semua data aplikasi
- **Authentication**: Sistem login/logout dan manajemen sesi
- **Storage**: Penyimpanan file surat sehat dan poster promosi
- **Real-time**: Sinkronisasi data secara real-time

### 2. OpenWeatherMap API
- **Cuaca & Prakiraan**: Data cuaca aktual dan prakiraan 3 hari ke depan
- **Data Meteorologi**: Suhu, kelembaban, kecepatan angin, tekanan udara
- **Lokasi Spesifik**: Data cuaca untuk lokasi Gunung Butak

### 3. Google Maps API
- **Embeded Maps**: Peta interaktif untuk lokasi pendakian
- **Rute Pendakian**: Visualisasi jalur pendakian
- **Geolokasi**: Informasi lokasi basecamp dan titik penting

### 4. Chart.js
- **Visualisasi Data**: Grafik dan chart untuk statistik dashboard
- **Berbagai Jenis Chart**: Line chart, doughnut chart, bar chart
- **Interaktif**: Grafik yang responsif dan interaktif

### 5. Font Awesome
- **Icon Set**: Koleksi icon vektor untuk antarmuka pengguna
- **Kustomisasi**: Banyak pilihan icon untuk berbagai fungsi

### 6. Tailwind CSS
- **Framework CSS**: Styling komponen dan tampilan aplikasi
- **Utility-first**: Pendekatan utility untuk styling cepat
- **Responsif**: Framework mobile-first untuk semua ukuran layar

## Struktur Database

Aplikasi menggunakan struktur database berikut:
- **profiles**: Data pengguna (pendaki dan admin)
- **reservasi**: Informasi pemesanan pendakian
- **pendaki_rombongan**: Data pendaki dalam satu rombongan
- **barang_bawaan_sampah**: Barang bawaan dan jenis sampah
- **komentar**: Ulasan dan rating dari pendaki
- **pengumuman**: Pengumuman dari admin
- **kuota_harian**: Batas maksimum pendaki per hari
- **pemasukan**: Data pemasukan dari reservasi
- **pengeluaran**: Data pengeluaran operasional
- **kategori_pengeluaran**: Kategori biaya operasional
- **promosi_poster**: Poster promosi untuk slider
- **pengaturan_biaya**: Harga tiket masuk dan parkir

## Setup dan Instalasi

1. Clone repository ini
2. Install dependencies dengan `npm install`
3. Setup konfigurasi Supabase di `assets/js/config.js`
4. Setup API key cuaca di `assets/js/weather-forecast.js`
5. Jalankan aplikasi di server web lokal

## Kontributor

Project ini dikembangkan sebagai bagian dari mata kuliah Semester 3 di POLITEKNIK NEGERI JEMBER.

## Lisensi

[Isi dengan informasi lisensi aplikasi jika ada]