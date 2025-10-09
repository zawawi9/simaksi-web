<?php
require_once 'config_storage.php';

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
    
    // Hapus file dari Supabase Storage
    $result = deleteFromSupabaseStorage(ltrim($file_path, '/'), 'surat-sehat');
    
    if (!$result['success']) {
        http_response_code(500);
        echo json_encode(['error' => 'Gagal menghapus file dari Supabase Storage: ' . $result['error']]);
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