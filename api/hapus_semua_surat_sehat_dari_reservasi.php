<?php
require_once 'config_storage.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['id_reservasi'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID reservasi tidak ditemukan']);
        exit;
    }
    
    $id_reservasi = $input['id_reservasi'];
    
    // Ambil semua file surat sehat yang terkait dengan reservasi ini
    $pendaki_response = makeSupabaseRequest('pendaki_rombongan?select=url_surat_sehat&url_surat_sehat.not.is.null&id_reservasi=eq.' . $id_reservasi, 'GET');
    
    if (isset($pendaki_response['error'])) {
        http_response_code(500);
        echo json_encode(['error' => 'Gagal mengambil data pendaki: ' . $pendaki_response['error']]);
        exit;
    }
    
    $surat_files = $pendaki_response['data'];
    
    // Hapus semua file surat sehat yang terkait
    $deleted_files = [];
    foreach ($surat_files as $pendaki) {
        if ($pendaki['url_surat_sehat']) {
            // Ekstrak nama file dari URL
            $file_path = basename(parse_url($pendaki['url_surat_sehat'], PHP_URL_PATH));
            
            // Hapus file dari Supabase Storage
            $delete_result = deleteFromSupabaseStorage($file_path, 'surat-sehat');
            
            if ($delete_result['success']) {
                $deleted_files[] = $file_path;
            } else {
                // Log error jika gagal menghapus
                error_log('Gagal menghapus file surat sehat: ' . $file_path . ' - ' . $delete_result['error']);
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => count($deleted_files) . ' file surat sehat berhasil dihapus',
        'deleted_files' => $deleted_files
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>