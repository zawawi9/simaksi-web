<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Ambil data dari body request
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['file_path'])) {
        http_response_code(400);
        echo json_encode(['error' => 'File path tidak ditemukan']);
        exit;
    }
    
    $file_path = $input['file_path'];
    
    // Format untuk menghapus file di Supabase Storage
    // URL format: /storage/v1/object/bucket_name/file_path
    $storageUrl = str_replace('/rest/v1', '/storage/v1', $supabaseUrl);
    $deleteUrl = $storageUrl . '/object/surat-sehat/' . ltrim($file_path, '/');
    
    $headers = [
        'apikey: ' . $serviceRoleKey,
        'Authorization: Bearer ' . $serviceRoleKey,
        'Content-Type: application/json'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $deleteUrl);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
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
    
    echo json_encode([
        'success' => true,
        'message' => 'File berhasil dihapus dari Supabase Storage'
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>