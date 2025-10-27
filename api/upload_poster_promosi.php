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
    if (!isset($_FILES['gambar_poster'])) {
        http_response_code(400);
        echo json_encode(['error' => 'File gambar poster tidak ditemukan']);
        exit;
    }

    $file = $_FILES['gambar_poster'];
    $id_promosi_terkait = $_POST['id_promosi_terkait'] ?? null; // Ambil ID promosi terkait jika ada
    
    // Validasi file - hanya gambar
    $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
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
        echo json_encode(['error' => 'Jenis file tidak diizinkan. Hanya JPEG, PNG, GIF, dan WebP yang diperbolehkan']);
        exit;
    }
    
    // Validasi ekstensi
    $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($file_extension, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Hanya file gambar yang diizinkan']);
        exit;
    }
    
    // Generate nama file unik
    $new_filename = 'poster_promosi_' . date('Ymd_His') . '_' . uniqid() . '.' . $file_extension;
    
    // Baca isi file
    $file_content = file_get_contents($file['tmp_name']);
    
    // Upload ke Supabase Storage di bucket 'poster-promosi'
    $upload_result = uploadToSupabaseStorage($new_filename, $file_content, 'poster-promosi');
    
    if (!$upload_result['success']) {
        http_response_code(500);
        echo json_encode(['error' => 'Gagal mengupload ke Supabase Storage: ' . $upload_result['error']]);
        exit;
    }
    
    // Kembalikan URL file dari Supabase Storage
    $file_url = getSupabaseStoragePublicUrl($new_filename, 'poster-promosi');
    
    $response_data = [
        'success' => true,
        'file_url' => $file_url,
        'file_name' => $new_filename,
        'message' => 'File berhasil diupload ke Supabase Storage'
    ];
    
    // Jika ID promosi terkait disertakan, tambahkan ke respons
    if ($id_promosi_terkait) {
        $response_data['id_promosi_terkait'] = $id_promosi_terkait;
    }
    
    echo json_encode($response_data);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>