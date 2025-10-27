<?php
require_once 'config.php';

/**
 * Menghitung total harga berdasarkan jumlah pendaki, tiket parkir, dan promosi yang berlaku
 * 
 * @param int $jumlah_pendaki Jumlah pendaki
 * @param int $jumlah_tiket_parkir Jumlah tiket parkir
 * @param string $tanggal_pendakian Tanggal pendakian untuk mengecek promosi
 * @param string $kode_promo Kode promosi opsional
 * @return array Informasi harga sebelum dan sesudah promosi
 */
function hitungHargaDenganPromosi($jumlah_pendaki, $jumlah_tiket_parkir, $tanggal_pendakian, $kode_promo = null) {
    // Ambil pengaturan biaya dari database
    $biaya_response = makeSupabaseRequest('pengaturan_biaya', 'GET');
    
    if (isset($biaya_response['error'])) {
        return ['error' => 'Gagal mengambil data pengaturan biaya: ' . $biaya_response['error']];
    }
    
    $harga_tiket_masuk = 0;
    $harga_tiket_parkir = 0;
    
    foreach ($biaya_response['data'] as $item) {
        if ($item['nama_item'] === 'Tiket Masuk') {
            $harga_tiket_masuk = (int)$item['harga'];
        } elseif ($item['nama_item'] === 'Tiket Parkir') {
            $harga_tiket_parkir = (int)$item['harga'];
        }
    }
    
    // Hitung harga dasar sebelum promosi
    $harga_sebelum_promosi = ($jumlah_pendaki * $harga_tiket_masuk) + ($jumlah_tiket_parkir * $harga_tiket_parkir);
    
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

// Endpoint API
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['jumlah_pendaki']) || !isset($input['jumlah_tiket_parkir']) || !isset($input['tanggal_pendakian'])) {
        http_response_code(400);
        echo json_encode(['error' => 'jumlah_pendaki, jumlah_tiket_parkir, dan tanggal_pendakian diperlukan']);
        exit;
    }
    
    $jumlah_pendaki = (int)$input['jumlah_pendaki'];
    $jumlah_tiket_parkir = (int)$input['jumlah_tiket_parkir'];
    $tanggal_pendakian = $input['tanggal_pendakian'];
    $kode_promo = isset($input['kode_promo']) ? $input['kode_promo'] : null;
    
    $result = hitungHargaDenganPromosi($jumlah_pendaki, $jumlah_tiket_parkir, $tanggal_pendakian, $kode_promo);
    
    if (isset($result['error'])) {
        http_response_code(500);
        echo json_encode(['error' => $result['error']]);
    } else {
        echo json_encode($result);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>