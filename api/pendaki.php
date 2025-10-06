<?php
require_once 'config.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $kode_reservasi = $_GET['kode_reservasi'] ?? null;
    $nama_pendaki = $_GET['nama_pendaki'] ?? null;

    // Build query based on parameters
    $query = '/pendaki_rombongan?select=*,reservasi!inner(kode_reservasi)';
    
    if ($kode_reservasi) {
        $query .= '&reservasi.kode_reservasi=ilike.%' . $kode_reservasi . '%';
    }
    
    if ($nama_pendaki) {
        $query .= '&nama_lengkap=ilike.%' . $nama_pendaki . '%';
    }
    
    $query .= '&order=nama_lengkap.asc';

    $response = makeSupabaseRequest($query);
    
    if (isset($response['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $response['error']]);
        exit;
    }
    
    $pendakiList = $response['data'] ?? [];
    
    // Format data to return kode_reservasi from the related table
    $formattedList = [];
    foreach ($pendakiList as $pendaki) {
        $formattedPendaki = [
            'id_pendaki' => $pendaki['id_pendaki'],
            'nama_lengkap' => $pendaki['nama_lengkap'],
            'nik' => $pendaki['nik'],
            'alamat' => $pendaki['alamat'],
            'nomor_telepon' => $pendaki['nomor_telepon'],
            'kontak_darurat' => $pendaki['kontak_darurat'],
            'kode_reservasi' => $pendaki['reservasi']['kode_reservasi'] ?? 'N/A'
        ];
        $formattedList[] = $formattedPendaki;
    }

    echo json_encode([
        'status' => 'success',
        'data' => $formattedList
    ]);
    
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}
?>