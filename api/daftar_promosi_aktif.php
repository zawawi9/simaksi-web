<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Ambil promosi yang aktif dan dalam masa berlaku
    $now = date('Y-m-d H:i:s');
    $query = "promosi?select=*&is_aktif=eq.true&tanggal_mulai=lte." . urlencode($now) . "&tanggal_akhir=gte." . urlencode($now) . "&order=tanggal_mulai.desc";
    
    $promosi_response = makeSupabaseRequest($query, 'GET');
    
    if (isset($promosi_response['error'])) {
        http_response_code(500);
        echo json_encode(['error' => 'Gagal mengambil data promosi: ' . $promosi_response['error']]);
        exit;
    }
    
    $promosi_aktif = $promosi_response['data'] ?? [];
    
    // Ambil juga promosi poster yang aktif
    $poster_query = "promosi_poster?select=*&is_aktif=eq.true&order=urutan.asc";
    
    $poster_response = makeSupabaseRequest($poster_query, 'GET');
    
    if (isset($poster_response['error'])) {
        // Jika gagal mengambil poster, tetap kembalikan promosi
        $promosi_poster_aktif = [];
    } else {
        $promosi_poster_aktif = $poster_response['data'] ?? [];
    }
    
    // Gabungkan data promosi dan promosi poster
    $result = [
        'promosi_aktif' => $promosi_aktif,
        'promosi_poster_aktif' => $promosi_poster_aktif,
        'jumlah_promosi' => count($promosi_aktif),
        'jumlah_poster' => count($promosi_poster_aktif)
    ];
    
    echo json_encode($result);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>