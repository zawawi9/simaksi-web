<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include the price calculation with promotions
function hitungHargaDenganPromosi($jumlah_pendaki, $jumlah_tiket_parkir, $tanggal_pendakian, $kode_promo = null) {
    // Ambil pengaturan biaya dari database
    $biaya_response = makeSupabaseRequest('pengaturan_biaya', 'GET');
    
    if (isset($biaya_response['error'])) {
        return ['error' => 'Gagal mengambil data pengaturan biaya: ' . $biaya_response['error']];
    }
    
    $harga_tiket_masuk = 0;
    $harga_tiket_parkir = 0;
    
    foreach ($biaya_response['data'] as $item) {
        $nama_item_lower = strtolower($item['nama_item']);
        if (strpos($nama_item_lower, 'tiket') !== false && strpos($nama_item_lower, 'masuk') !== false) {
            $harga_tiket_masuk = (int)$item['harga'];
        } elseif (strpos($nama_item_lower, 'parkir') !== false) {
            $harga_tiket_parkir = (int)$item['harga'];
        }
    }
    
    // Hitung harga dasar sebelum promosi
    $harga_sebelum_promosi = ($jumlah_pendaki * $harga_tiket_masuk) + ($jumlah_tiket_parkir * $harga_tiket_parkir);
    
    // Log harga untuk debugging
    error_log("Harga tiket masuk: " . $harga_tiket_masuk . ", Harga tiket parkir: " . $harga_tiket_parkir);
    error_log("Jumlah pendaki: " . $jumlah_pendaki . ", Jumlah tiket parkir: " . $jumlah_tiket_parkir);
    error_log("Harga sebelum promosi: " . $harga_sebelum_promosi);
    
    // Ambil promosi yang aktif untuk tanggal pendakian
    $now = date('Y-m-d H:i:s');
    $query = "promosi?select=*&is_aktif=eq.true&tanggal_mulai=lte." . urlencode($now) . "&tanggal_akhir=gte." . urlencode($now);
    if ($kode_promo) {
        $query .= "&kode_promo=eq." . urlencode($kode_promo);
    }
    
    $promosi_response = makeSupabaseRequest($query, 'GET');
    
    if (isset($promosi_response['error'])) {
        return ['error' => 'Gagal mengambil data promosi: ' . $promosi_response['error']];
    }
    
    $promosi_yang_berlaku = null;
    
    // Cek apakah ada promosi yang cocok dengan kondisi jumlah pendaki
    foreach ($promosi_response['data'] as $promo) {
        $min_pendaki = (int)($promo['kondisi_min_pendaki'] ?? 1);
        $max_pendaki = $promo['kondisi_max_pendaki'] ? (int)$promo['kondisi_max_pendaki'] : PHP_INT_MAX;
        
        if ($jumlah_pendaki >= $min_pendaki && $jumlah_pendaki <= $max_pendaki) {
            $promosi_yang_berlaku = $promo;
            break;
        }
    }
    
    // Hitung harga setelah promosi
    $harga_setelah_promosi = $harga_sebelum_promosi;
    
    if ($promosi_yang_berlaku) {
        $tipe_promosi = $promosi_yang_berlaku['tipe_promosi'];
        $nilai_promosi = (float)$promosi_yang_berlaku['nilai_promosi'];
        
        switch ($tipe_promosi) {
            case 'PERSENTASE':
                $potongan = $harga_sebelum_promosi * ($nilai_promosi / 100);
                $harga_setelah_promosi = $harga_sebelum_promosi - $potongan;
                break;
                
            case 'POTONGAN_TETAP':
                $harga_setelah_promosi = $harga_sebelum_promosi - $nilai_promosi;
                // Pastikan harga tidak negatif
                $harga_setelah_promosi = max(0, $harga_setelah_promosi);
                break;
                
            case 'HARGA_KHUSUS':
                // Untuk HARGA_KHUSUS, ini biasanya harga total tetap
                // Atau bisa juga harga per item tetap, tergantung logika bisnis
                // Dalam implementasi ini, kita asumsikan nilai_promosi adalah harga total untuk semua pendaki
                $harga_setelah_promosi = $nilai_promosi;
                break;
                
            default:
                // Jika tipe promosi tidak dikenal, tidak ada perubahan harga
                break;
        }
    }
    
    // Pastikan harga tidak negatif
    $harga_setelah_promosi = max(0, $harga_setelah_promosi);
    
    return [
        'harga_sebelum_promosi' => $harga_sebelum_promosi,
        'harga_setelah_promosi' => (int)$harga_setelah_promosi,
        'potongan_promosi' => $harga_sebelum_promosi - (int)$harga_setelah_promosi,
        'promosi_yang_berlaku' => $promosi_yang_berlaku
    ];
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get pricing data from pengaturan_biaya table
        $response = makeSupabaseRequest('pengaturan_biaya', 'GET');
        
        if (isset($response['error'])) {
            http_response_code(500);
            echo json_encode(['error' => $response['error']]);
            exit;
        }
        
        echo json_encode($response['data']);
    } 
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);

        // Validate required fields
        if (!isset($data['tanggal_pendakian']) || !isset($data['jumlah_pendaki']) || 
            !isset($data['jumlah_tiket_parkir']) || !isset($data['total_harga']) || 
            !isset($data['id_pengguna']) || !isset($data['anggota_rombongan'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Data tidak lengkap']);
            exit;
        }

        $tanggal_pendakian = $data['tanggal_pendakian'];
        $jumlah_pendaki = $data['jumlah_pendaki'];
        $jumlah_tiket_parkir = $data['jumlah_tiket_parkir'];
        $total_harga = $data['total_harga'];
        $jumlah_potensi_sampah = $data['jumlah_potensi_sampah'] ?? 0;
        $id_pengguna = $data['id_pengguna']; // Ambil ID pengguna dari data yang dikirim
        $anggota_rombongan = $data['anggota_rombongan'];
        $barang_bawaan = $data['barang_bawaan'] ?? [];
        $kode_promo = $data['kode_promo'] ?? null; // Ambil kode promosi jika ada

        // Log data yang diterima untuk debugging
        error_log("Data received: tanggal_pendakian=" . $tanggal_pendakian . ", jumlah_pendaki=" . $jumlah_pendaki . ", id_pengguna=" . $id_pengguna);

        // Check quota availability manually by fetching from kuota_harian table
        error_log("Checking quota for date: " . $tanggal_pendakian);
        $kuota_response = makeSupabaseRequest(
            'kuota_harian?select=kuota_maksimal,kuota_terpesan&tanggal_kuota=eq.' . urlencode($tanggal_pendakian), 
            'GET'
        );

        if (isset($kuota_response['error'])) {
            error_log("Quota check error: " . $kuota_response['error']);
            http_response_code(500);
            echo json_encode(['error' => 'Gagal memeriksa kuota: ' . $kuota_response['error']]);
            exit;
        }

        $kuota_data = $kuota_response['data'];
        error_log("Quota data: " . print_r($kuota_data, true));
        
        if (empty($kuota_data)) {
            // Jika tidak ada entri kuota untuk tanggal tersebut, buat default atau gunakan nilai default
            // Dalam kasus ini, kita asumsikan kuota maksimal default adalah 50
            $available_quota = 50; // Nilai default jika tidak ada data kuota
            error_log("No quota data found, using default available quota: " . $available_quota);
        } else {
            // Calculate available quota
            $available_quota = $kuota_data[0]['kuota_maksimal'] - $kuota_data[0]['kuota_terpesan'];
        }
        
        if ($available_quota < $jumlah_pendaki) {
            http_response_code(400);
            echo json_encode(['error' => 'Kuota tidak mencukupi untuk tanggal tersebut. Tersedia: ' . $available_quota . ', Dibutuhkan: ' . $jumlah_pendaki]);
            exit;
        }
        
        // Validate harga dengan promosi sesuai dengan jumlah pendaki dan tiket parkir
        $harga_validation = hitungHargaDenganPromosi($jumlah_pendaki, $jumlah_tiket_parkir, $tanggal_pendakian, $kode_promo);
        
        if (isset($harga_validation['error'])) {
            http_response_code(500);
            echo json_encode(['error' => $harga_validation['error']]);
            exit;
        }
        
        // Cek apakah total_harga yang dikirim sesuai dengan perhitungan sistem
        $harga_seharusnya = (int)$harga_validation['harga_setelah_promosi'];
        if ($total_harga != $harga_seharusnya) {
            http_response_code(400);
            echo json_encode([
                'error' => 'Total harga tidak sesuai. Harga seharusnya: ' . $harga_seharusnya . ', harga yang dikirim: ' . $total_harga,
                'harga_seharusnya' => $harga_seharusnya,
                'harga_yang_dikirim' => $total_harga,
                'promosi_yang_berlaku' => $harga_validation['promosi_yang_berlaku']
            ]);
            exit;
        }

        // Check if user exists in profiles
        error_log("Checking user with ID: " . $id_pengguna);
        $user_response = makeSupabaseRequest('profiles?select=id,nama_lengkap&' . 'id=eq.' . urlencode($id_pengguna), 'GET');
        
        if (isset($user_response['error'])) {
            error_log("User check error: " . $user_response['error']);
            http_response_code(500);
            echo json_encode(['error' => $user_response['error']]);
            exit;
        }

        $user_id = null;
        if (isset($user_response['data']) && count($user_response['data']) > 0) {
            $user_id = $user_response['data'][0]['id'];
            error_log("Found existing user with ID: " . $user_id);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'User tidak ditemukan di database. Harap daftarkan user terlebih dahulu sebelum membuat reservasi.']);
            exit;
        }

        // Generate reservation code
        $kode_reservasi = 'R' . date('Ymd') . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));
        error_log("Creating reservation with code: " . $kode_reservasi);

        // Insert reservation
        $reservation_data = [
            'id_pengguna' => $user_id,
            'kode_reservasi' => $kode_reservasi,
            'tanggal_pendakian' => $tanggal_pendakian,
            'jumlah_pendaki' => $jumlah_pendaki,
            'jumlah_tiket_parkir' => $jumlah_tiket_parkir,
            'total_harga' => $total_harga,
            'jumlah_potensi_sampah' => $jumlah_potensi_sampah
        ];
        
        error_log("Reservation data: " . print_r($reservation_data, true));
        $reservation_response = makeSupabaseRequest('reservasi', 'POST', $reservation_data);

        if (isset($reservation_response['error'])) {
            error_log("Reservation creation error: " . $reservation_response['error']);
            http_response_code(500);
            echo json_encode(['error' => 'Gagal membuat reservasi: ' . $reservation_response['error']]);
            exit;
        }

        $id_reservasi = $reservation_response['data'][0]['id_reservasi'];
        error_log("Reservation created with ID: " . $id_reservasi);

        // Insert group members (including the leader as the first member)
        foreach ($anggota_rombongan as $pendaki) {
            $pendaki_data = [
                'id_reservasi' => $id_reservasi,
                'nama_lengkap' => $pendaki['nama_lengkap'],
                'nik' => $pendaki['nik'],
                'alamat' => $pendaki['alamat'],
                'nomor_telepon' => $pendaki['nomor_telepon'],
                'kontak_darurat' => $pendaki['kontak_darurat'],
                'url_surat_sehat' => isset($pendaki['url_surat_sehat']) ? $pendaki['url_surat_sehat'] : null
            ];
            
            $pendaki_response = makeSupabaseRequest('pendaki_rombongan', 'POST', $pendaki_data);

            if (isset($pendaki_response['error'])) {
                http_response_code(500);
                echo json_encode(['error' => 'Gagal menambahkan anggota rombongan: ' . $pendaki_response['error']]);
                exit;
            }
        }

        // Insert waste items if any
        foreach ($barang_bawaan as $barang) {
            $barang_data = [
                'id_reservasi' => $id_reservasi,
                'nama_barang' => $barang['nama_barang'],
                'jenis_sampah' => $barang['jenis_sampah'],
                'jumlah' => $barang['jumlah'] ?? 1  // Default to 1 if jumlah is not provided
            ];
            
            $barang_response = makeSupabaseRequest('barang_bawaan_sampah', 'POST', $barang_data);

            if (isset($barang_response['error'])) {
                http_response_code(500);
                echo json_encode(['error' => 'Gagal menambahkan barang bawaan: ' . $barang_response['error']]);
                exit;
            }
        }

        // Return success response
        echo json_encode([
            'success' => true,
            'message' => 'Reservasi berhasil dibuat',
            'kode_reservasi' => $kode_reservasi,
            'harga_sebelum_promosi' => $harga_validation['harga_sebelum_promosi'],
            'potongan_promosi' => $harga_validation['potongan_promosi'],
            'promosi_yang_berlaku' => $harga_validation['promosi_yang_berlaku']
        ]);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>