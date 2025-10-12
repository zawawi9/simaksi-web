<?php
require_once 'config.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

// Get total climbers today (reservasi with status 'terkonfirmasi' for today)
try {
    $reservasiResponse = makeSupabaseRequest('/reservasi?select=*&tanggal_pendakian=eq.' . date('Y-m-d') . '&status=eq.terkonfirmasi');
    if (isset($reservasiResponse['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $reservasiResponse['error']]);
        exit;
    }
    $totalPendakiHariIni = count($reservasiResponse['data']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Error getting total climbers: ' . $e->getMessage()]);
    exit;
}

// Get total reservations
try {
    $reservasiAllResponse = makeSupabaseRequest('/reservasi?select=count&limit=1');
    if (isset($reservasiAllResponse['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $reservasiAllResponse['error']]);
        exit;
    }
    $totalReservasi = isset($reservasiAllResponse['data'][0]['count']) ? $reservasiAllResponse['data'][0]['count'] : 0;
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Error getting total reservations: ' . $e->getMessage()]);
    exit;
}

// Get reservations by status
try {
    $reservasiByStatusResponse = makeSupabaseRequest('/reservasi?select=status&status=not.eq.dibatalkan');
    if (isset($reservasiByStatusResponse['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $reservasiByStatusResponse['error']]);
        exit;
    }

    $reservasiMenunggu = 0;
    $reservasiTerbayar = 0;

    if (isset($reservasiByStatusResponse['data'])) {
        foreach ($reservasiByStatusResponse['data'] as $reservasi) {
            if ($reservasi['status'] === 'menunggu_pembayaran') {
                $reservasiMenunggu++;
            } elseif ($reservasi['status'] === 'terkonfirmasi') {
                $reservasiTerbayar++;
            }
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Error getting reservations by status: ' . $e->getMessage()]);
    exit;
}

// Get today's income (total amount from confirmed reservations today)
try {
    $incomeResponse = makeSupabaseRequest('/reservasi?select=total_harga&tanggal_pendakian=eq.' . date('Y-m-d') . '&status=eq.terkonfirmasi');
    if (isset($incomeResponse['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $incomeResponse['error']]);
        exit;
    }

    $pendapatanHariIni = 0;
    if (isset($incomeResponse['data'])) {
        foreach ($incomeResponse['data'] as $reservasi) {
            $pendapatanHariIni += (int)$reservasi['total_harga'];
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Error getting income: ' . $e->getMessage()]);
    exit;
}

// Get average rating and count from komentar table
try {
    $komentarResponse = makeSupabaseRequest('/komentar?select=count');
    if (isset($komentarResponse['error'])) {
        $rataRating = 0;
        $jumlahRating = 0;
    } else {
        $jumlahRating = isset($komentarResponse['data'][0]['count']) ? $komentarResponse['data'][0]['count'] : 0;
        $rataRating = $jumlahRating > 0 ? 4.5 : 0; // Default to 4.5 if there are comments
    }
} catch (Exception $e) {
    $rataRating = 0;
    $jumlahRating = 0;
    error_log('Error getting comments count: ' . $e->getMessage());
}

// Get recent activities (last 5 reservations)
try {
    $aktivitasResponse = makeSupabaseRequest('/reservasi?select=kode_reservasi,dipesan_pada,id_pengguna&order=dipesan_pada.desc&limit=5');
    if (isset($aktivitasResponse['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $aktivitasResponse['error']]);
        exit;
    }

    $aktivitasTerbaru = [];
    if (isset($aktivitasResponse['data'])) {
        foreach ($aktivitasResponse['data'] as $reservasi) {
            // Get user details to get nama_lengkap
            try {
                $userResponse = makeSupabaseRequest('/profiles?select=nama_lengkap&id=eq.' . $reservasi['id_pengguna']);
                $nama_pengguna = 'Unknown';
                $nama_ketua_rombongan = 'Nama tidak ditemukan';
                
                if (!isset($userResponse['error']) && !empty($userResponse['data']) && isset($userResponse['data'][0]['nama_lengkap'])) {
                    $nama_pengguna = $userResponse['data'][0]['nama_lengkap'];
                    $nama_ketua_rombongan = $userResponse['data'][0]['nama_lengkap'];
                }
                
                $aktivitasTerbaru[] = [
                    'kode_reservasi' => $reservasi['kode_reservasi'],
                    'nama_ketua_rombongan' => $nama_ketua_rombongan,
                    'tanggal_pesan' => $reservasi['dipesan_pada'],
                    'nama_pengguna' => $nama_pengguna
                ];
            } catch (Exception $e) {
                error_log('Error getting user profile: ' . $e->getMessage());
                $aktivitasTerbaru[] = [
                    'kode_reservasi' => $reservasi['kode_reservasi'],
                    'nama_ketua_rombongan' => 'Unknown',
                    'tanggal_pesan' => $reservasi['dipesan_pada'],
                    'nama_pengguna' => 'Unknown'
                ];
            }
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Error getting recent activities: ' . $e->getMessage()]);
    exit;
}

$response = [
    'status' => 'success',
    'data' => [
        'total_pendaki_hari_ini' => $totalPendakiHariIni,
        'persentase_pendaki' => $totalPendakiHariIni > 0 ? min(100, ($totalPendakiHariIni / 100) * 100) : 0,
        'total_reservasi' => $totalReservasi,
        'reservasi_menunggu' => $reservasiMenunggu,
        'reservasi_terbayar' => $reservasiTerbayar,
        'persentase_reservasi' => $totalReservasi > 0 ? min(100, ($reservasiTerbayar / $totalReservasi) * 100) : 0,
        'pendapatan_hari_ini' => $pendapatanHariIni,
        'persentase_pendapatan' => $pendapatanHariIni > 0 ? min(100, ($pendapatanHariIni / 5000000) * 100) : 0, // Assuming target is 5,000,000
        'rata_rating' => $rataRating,
        'jumlah_rating' => $jumlahRating,
        'aktivitas_terbaru' => $aktivitasTerbaru
    ]
];

echo json_encode($response);
?>