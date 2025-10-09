<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    if (!isset($_FILES['surat_sehat'])) {
        http_response_code(400);
        echo json_encode(['error' => 'File surat sehat tidak ditemukan']);
        exit;
    }

    $file = $_FILES['surat_sehat'];
    
    // Validasi file - hanya PDF
    $allowed_types = ['application/pdf'];
    $max_size = 5 * 1024 * 1024; // 5MB
    
    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'Error saat mengupload file: ' . $file['error']]);
        exit;
    }
    
    if ($file['size'] > $max_size) {
        http_response_code(400);
        echo json_encode(['error' => 'File terlalu besar. Maksimal 5MB']);
        exit;
    }
    
    if (!in_array($file['type'], $allowed_types)) {
        http_response_code(400);
        echo json_encode(['error' => 'Jenis file tidak diizinkan. Hanya PDF yang diperbolehkan']);
        exit;
    }
    
    // Validasi ekstensi
    $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if ($file_extension !== 'pdf') {
        http_response_code(400);
        echo json_encode(['error' => 'Hanya file PDF yang diizinkan']);
        exit;
    }
    
    // Generate nama file unik - we don't use the original filename for security
    $new_filename = 'surat_sehat_' . date('Ymd_His') . '_' . uniqid() . '.pdf';
    
    // Baca isi file
    $file_content = file_get_contents($file['tmp_name']);
    
    // Upload ke Supabase Storage
    $upload_result = uploadToSupabaseStorage($new_filename, $file_content, 'surat-sehat');
    
    if (!$upload_result['success']) {
        http_response_code(500);
        echo json_encode(['error' => 'Gagal mengupload ke Supabase Storage: ' . $upload_result['error']]);
        exit;
    }
    
    // Kembalikan URL file dari Supabase Storage
    $file_url = getSupabaseStoragePublicUrl($new_filename, 'surat-sehat');
    
    echo json_encode([
        'success' => true,
        'file_url' => $file_url,
        'file_name' => $new_filename,
        'message' => 'File berhasil diupload ke Supabase Storage'
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>