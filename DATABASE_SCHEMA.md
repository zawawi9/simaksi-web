# Dokumentasi Skema Database untuk Simaksi Gunung Butak

## Gambaran Umum
Proyek ini menggunakan Supabase sebagai layanan backend, yang menyediakan database PostgreSQL dengan fitur tambahan seperti otentikasi, langganan real-time, dan penyimpanan.

## Otentikasi
Supabase menangani otentikasi pengguna dengan sistem Auth bawaan. Pengguna disimpan dalam tabel auth Supabase standar, dan informasi pengguna khusus aplikasi disimpan dalam tabel `pengguna` yang terhubung ke ID pengguna Supabase.

## Tabel dan Struktur Data

### 1. pengguna
Menyimpan informasi pengguna khusus aplikasi yang terhubung ke pengguna Auth Supabase.

**Kolom:**
- `id_pengguna` (UUID, Kunci Utama) - Menghubungkan ke ID pengguna Supabase
- `peran` (TEXT) - Peran pengguna ('admin' atau 'pendaki')
- `nama_lengkap` (TEXT) - Nama lengkap pengguna
- `created_at` (TIMESTAMPTZ) - Timestamp pembuatan akun

**Hubungan:**
- Menghubungkan ke tabel auth.users Supabase melalui id_pengguna
- Kunci asing dari `reservasi.id_pengguna` → `pengguna.id_pengguna`

**Indeks:**
- Kunci utama pada id_pengguna
- Indeks pada peran untuk query berbasis peran

### 2. reservasi
Menyimpan informasi reservasi untuk grup pendaki.

**Kolom:**
- `id_reservasi` (BIGINT, Kunci Utama, Auto-increment) - ID reservasi unik
- `kode_reservasi` (TEXT) - Kode reservasi unik untuk identifikasi
- `id_pengguna` (UUID) - Kunci asing ke tabel pengguna (pengguna yang membuat reservasi)
- `nama_ketua_rombongan` (TEXT) - Nama ketua rombongan
- `tanggal_pendakian` (DATE) - Tanggal perjalanan pendakian
- `jumlah_pendaki` (INTEGER) - Jumlah pendaki dalam grup
- `status` (TEXT) - Status saat ini ('menunggu_pembayaran', 'terkonfirmasi', 'dibatalkan', 'selesai')
- `total_harga` (INTEGER) - Jumlah total yang harus dibayar
- `created_at` (TIMESTAMPTZ) - Timestamp pembuatan reservasi
- `updated_at` (TIMESTAMPTZ) - Timestamp pembaruan terakhir

**Batasan:**
- Batasan UNIQUE pada kode_reservasi
- Batasan CHECK pada kolom status untuk memastikan nilai valid
- Batasan kunci asing menghubungkan id_pengguna ke pengguna.id_pengguna

**Hubungan:**
- Satu-ke-banyak: pengguna → reservasi (satu pengguna dapat membuat beberapa reservasi)
- Satu-ke-banyak: reservasi → pendaki_rombongan (satu reservasi dapat memiliki beberapa pendaki)
- Satu-ke-banyak: reservasi → barang_bawaan_sampah (satu reservasi dapat memiliki beberapa item sampah)
- Satu-ke-banyak: reservasi → pemasukan (satu reservasi dapat menghasilkan satu entri pemasukan)

**Indeks:**
- Kunci utama pada id_reservasi
- Indeks unik pada kode_reservasi
- Indeks pada tanggal_pendakian untuk query berbasis tanggal
- Indeks pada status untuk query berbasis status

### 3. pendaki_rombongan
Menyimpan informasi pendaki individual untuk setiap reservasi.

**Kolom:**
- `id_pendaki` (BIGINT, Kunci Utama, Auto-increment) - ID pendaki unik
- `id_reservasi` (BIGINT) - Kunci asing ke tabel reservasi
- `nama_lengkap` (TEXT) - Nama lengkap pendaki
- `nik` (TEXT) - Nomor identitas nasional
- `alamat` (TEXT) - Alamat pendaki
- `nomor_telepon` (TEXT) - Nomor telepon
- `kontak_darurat` (TEXT) - Informasi kontak darurat
- `created_at` (TIMESTAMPTZ) - Timestamp pembuatan catatan

**Batasan:**
- Batasan kunci asing menghubungkan id_reservasi ke reservasi.id_reservasi
- Hapus secara berantai: ketika reservasi dihapus, pendaki terkait juga dihapus

**Hubungan:**
- Banyak-ke-satu: pendaki_rombongan → reservasi (beberapa pendaki termasuk dalam satu reservasi)

**Indeks:**
- Kunci utama pada id_pendaki
- Indeks pada id_reservasi untuk query berbasis reservasi
- Indeks pada nama_lengkap untuk operasi pencarian

### 4. barang_bawaan_sampah
Menyimpan informasi tentang sampah yang dibawa oleh pendaki untuk pembuangan yang tepat.

**Kolom:**
- `id_barang` (BIGINT, Kunci Utama, Auto-increment) - ID item unik
- `id_reservasi` (BIGINT) - Kunci asing ke tabel reservasi
- `nama_barang` (TEXT) - Nama dari item
- `jenis_sampah` (TEXT) - Jenis sampah ('organik', 'anorganik', 'b3', dll.)
- `jumlah` (INTEGER) - Jumlah dari item
- `created_at` (TIMESTAMPTZ) - Timestamp pembuatan catatan

**Batasan:**
- Batasan kunci asing menghubungkan id_reservasi ke reservasi.id_reservasi
- Hapus secara berantai: ketika reservasi dihapus, item sampah terkait juga dihapus

**Hubungan:**
- Banyak-ke-satu: barang_bawaan_sampah → reservasi (beberapa item termasuk dalam satu reservasi)

**Indeks:**
- Kunci utama pada id_barang
- Indeks pada id_reservasi untuk query berbasis reservasi
- Indeks pada jenis_sampah untuk query berbasis jenis sampah

### 5. pemasukan
Menyimpan catatan pemasukan dari reservasi yang dikonfirmasi.

**Kolom:**
- `id_pemasukan` (BIGINT, Kunci Utama, Auto-increment) - ID pemasukan unik
- `id_reservasi` (BIGINT) - Kunci asing ke tabel reservasi (reservasi yang menghasilkan pemasukan ini)
- `id_admin` (UUID) - ID admin yang memproses konfirmasi
- `jumlah` (INTEGER) - Jumlah pemasukan
- `keterangan` (TEXT) - Deskripsi pemasukan
- `tanggal_pemasukan` (DATE) - Tanggal pencatatan pemasukan
- `created_at` (TIMESTAMPTZ) - Timestamp pembuatan catatan

**Batasan:**
- Batasan kunci asing menghubungkan id_reservasi ke reservasi.id_reservasi
- Batasan kunci asing menghubungkan id_admin ke pengguna.id_pengguna

**Hubungan:**
- Satu-ke-satu: reservasi → pemasukan (setiap reservasi biasanya menghasilkan satu entri pemasukan)
- Banyak-ke-satu: pemasukan → pengguna (beberapa entri pemasukan dikelola oleh satu admin)

**Indeks:**
- Kunci utama pada id_pemasukan
- Indeks pada id_reservasi
- Indeks pada tanggal_pemasukan untuk query berbasis tanggal
- Indeks pada id_admin untuk query berbasis admin

### 6. pengeluaran
Menyimpan catatan pengeluaran untuk pelacakan keuangan.

**Kolom:**
- `id_pengeluaran` (BIGINT, Kunci Utama, Auto-increment) - ID pengeluaran unik
- `id_admin` (UUID) - ID admin yang mencatat pengeluaran
- `jumlah` (INTEGER) - Jumlah pengeluaran
- `keterangan` (TEXT) - Deskripsi pengeluaran
- `kategori` (TEXT) - Kategori pengeluaran ('operasional', 'perawatan', 'pembelian', dll.)
- `tanggal_pengeluaran` (DATE) - Tanggal pengeluaran
- `created_at` (TIMESTAMPTZ) - Timestamp pembuatan catatan

**Batasan:**
- Batasan kunci asing menghubungkan id_admin ke pengguna.id_pengguna

**Hubungan:**
- Banyak-ke-satu: pengeluaran → pengguna (beberapa pengeluaran dicatat oleh satu admin)

**Indeks:**
- Kunci utama pada id_pengeluaran
- Indeks pada id_admin untuk query berbasis admin
- Indeks pada tanggal_pengeluaran untuk query berbasis tanggal
- Indeks pada kategori untuk query berbasis kategori

## Konfigurasi Supabase

### Pengaturan Proyek Supabase
- **URL**: `https://kitxtcpfnccblznbagzx.supabase.co`
- **Kunci Anon**: Digunakan di frontend untuk akses publik
- **Kunci Peran Layanan**: Digunakan di API backend untuk akses penuh

### Pengaturan Otentikasi
- Otentikasi email/kata sandi diaktifkan
- Pendaftaran pengguna diizinkan
- Konfirmasi email diperlukan
- Panjang minimum kata sandi: 6 karakter

### Kebijakan RLS (Row Level Security)
- RLS kemungkinan besar diaktifkan untuk operasi sensitif
- Pengguna hanya dapat melihat reservasi mereka sendiri
- Admin dapat melihat semua catatan

## Endpoint API dan Alur Data

### Alur Data Proses Reservasi
1. Pengguna membuat reservasi → Membuat catatan di tabel `reservasi`
2. Pengguna menambahkan pendaki → Membuat catatan di tabel `pendaki_rombongan`
3. Pengguna menyatakan item sampah → Membuat catatan di tabel `barang_bawaan_sampah`
4. Admin mengkonfirmasi pembayaran → Memperbarui `status` di tabel `reservasi` menjadi 'terkonfirmasi'
5. Konfirmasi membuat catatan di tabel `pemasukan`

### Query Database Utama yang Digunakan
Aplikasi menggunakan klien JavaScript Supabase dan API PHP untuk melakukan query. Pola umum:

#### JavaScript (Frontend/Backend):
```javascript
// Ambil reservasi untuk tanggal tertentu
const { data, error } = await supabase
  .from('reservasi')
  .select('id_reservasi, kode_reservasi, nama_ketua_rombongan, tanggal_pendakian, jumlah_pendaki, status')
  .eq('tanggal_pendakian', selectedDate)
  .order('nama_ketua_rombongan', { ascending: true })

// Dapatkan pendaki untuk reservasi tertentu dengan hubungan
const { data, error } = await supabase
  .from('pendaki_rombongan')
  .select('*')
  .eq('id_reservasi', reservationId)
```

#### PHP (Endpoint API):
```php
// Di config.php
function makeSupabaseRequest($endpoint, $method = 'GET', $data = null) {
  global $supabaseUrl, $headers;
  $url = $supabaseUrl . $endpoint;
  // ... implementasi cURL
}

// Di file API
$response = makeSupabaseRequest('/reservasi?select=*&id_reservasi=eq.' . $id_reservasi);
```

## Ringkasan Hubungan
```
pengguna (1) ←→ (N) reservasi ←→ (N) pendaki_rombongan
              ↓
            pemasukan
              
              ↑
reservasi ←→ barang_bawaan_sampah

pengguna (1) ←→ (N) pemasukan
pengguna (1) ←→ (N) pengeluaran
```

## Pertimbangan Pemeliharaan
- Konfigurasi backup rutin ditangani oleh Supabase
- Monitor koneksi database dan kinerja
- Bersihkan catatan lama secara berkala jika diperlukan
- Tinjau kebijakan RLS untuk memastikan keamanan