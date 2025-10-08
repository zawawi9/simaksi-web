<?php
// File sederhana untuk menguji endpoint pengaturan biaya
header('Content-Type: application/json');

// Konfigurasi Supabase - mengambil dari config.php
require_once 'api/config.php';

// Melakukan permintaan GET untuk mendapatkan data pengaturan biaya
$response = makeSupabaseRequest('/pengaturan_biaya?select=*');

if (isset($response['error'])) {
    echo json_encode([
        'status' => 'error',
        'message' => $response['error']
    ]);
    exit;
}

$hargaTiket = null;
$hargaParkir = null;

foreach($response['data'] as $item) {
    if ($item['nama_item'] === 'tiket_masuk') {
        $hargaTiket = $item['harga'];
    } elseif ($item['nama_item'] === 'tiket_parkir') {
        $hargaParkir = $item['harga'];
    }
}

echo json_encode([
    'status' => 'success',
    'data' => [
        'harga_tiket' => $hargaTiket,
        'harga_parkir' => $hargaParkir
    ]
]);
?>