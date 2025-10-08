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
            !isset($data['ketua_rombongan']) || !isset($data['anggota_rombongan'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Data tidak lengkap']);
            exit;
        }

        $tanggal_pendakian = $data['tanggal_pendakian'];
        $jumlah_pendaki = $data['jumlah_pendaki'];
        $jumlah_tiket_parkir = $data['jumlah_tiket_parkir'];
        $total_harga = $data['total_harga'];
        $jumlah_potensi_sampah = $data['jumlah_potensi_sampah'] ?? 0;
        $ketua_rombongan = $data['ketua_rombongan'];
        $anggota_rombongan = $data['anggota_rombongan'];
        $barang_bawaan = $data['barang_bawaan'] ?? [];

        // Log data yang diterima untuk debugging
        error_log("Data received: tanggal_pendakian=" . $tanggal_pendakian . ", jumlah_pendaki=" . $jumlah_pendaki);

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

        // Check if user exists in profiles
        error_log("Checking user with email: " . $ketua_rombongan['email']);
        $user_response = makeSupabaseRequest('profiles?select=id&email=eq.' . urlencode($ketua_rombongan['email']), 'GET');
        
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
            // The user doesn't exist, so we need to create them
            $new_user_id = bin2hex(random_bytes(16)); // Generate a UUID-like ID
            error_log("Creating new user with ID: " . $new_user_id);
            
            $insert_profile_data = [
                'id' => $new_user_id,
                'nama_lengkap' => $ketua_rombongan['nama_lengkap'],
                'email' => $ketua_rombongan['email'],
                'nomor_telepon' => $ketua_rombongan['nomor_telepon'],
                'alamat' => $ketua_rombongan['alamat'],
                'peran' => 'pendaki'
            ];
            
            $insert_profile_response = makeSupabaseRequest('profiles', 'POST', $insert_profile_data);

            if (isset($insert_profile_response['error'])) {
                error_log("Failed to create user: " . $insert_profile_response['error']);
                http_response_code(500);
                echo json_encode(['error' => 'Gagal membuat profil pengguna: ' . $insert_profile_response['error']]);
                exit;
            }
            
            $user_id = $new_user_id;
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
                'jenis_sampah' => $barang['jenis_sampah']
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
            'kode_reservasi' => $kode_reservasi
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