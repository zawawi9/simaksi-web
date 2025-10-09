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
    // Endpoint untuk mendapatkan daftar file dari bucket Supabase Storage
    $listUrl = $storageUrl . '/object/list/surat-sehat';
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $listUrl);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $storageHeaders);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    
    curl_close($ch);
    
    if ($curlError) {
        http_response_code(500);
        echo json_encode(['error' => 'Curl error: ' . $curlError]);
        exit;
    }
    
    if ($httpCode >= 400) {
        http_response_code($httpCode);
        echo json_encode(['error' => 'HTTP error: ' . $httpCode . ' - ' . $response]);
        exit;
    }
    
    $files = json_decode($response, true);
    
    echo json_encode([
        'success' => true,
        'files' => $files,
        'message' => 'Daftar file surat sehat berhasil diambil'
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>