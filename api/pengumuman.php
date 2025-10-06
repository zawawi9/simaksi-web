<?php
require_once 'config.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Handle creating new pengumuman
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['judul']) || !isset($input['konten']) || !isset($input['start_date']) || !isset($input['end_date']) || !isset($input['id_admin'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Semua field wajib diisi: judul, konten, start_date, end_date, dan id_admin']);
        exit;
    }
    
    $judul = $input['judul'];
    $konten = $input['konten'];
    $start_date = $input['start_date'];
    $end_date = $input['end_date'];
    $id_admin = $input['id_admin'];
    $telah_terbit = isset($input['telah_terbit']) ? (bool)$input['telah_terbit'] : false;

    // Insert new pengumuman using Supabase REST API
    $response = makeSupabaseRequest('/rest/v1/pengumuman', 'POST', [
        'id_admin' => $id_admin,
        'judul' => $judul,
        'konten' => $konten,
        'start_date' => $start_date,
        'end_date' => $end_date,
        'telah_terbit' => $telah_terbit
    ]);
    
    if (isset($response['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $response['error']]);
        exit;
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Pengumuman berhasil dibuat',
        'data' => $response['data']
    ]);
    
} elseif ($method === 'GET') {
    // Handle getting pengumuman data
    $id_pengumuman = $_GET['id'] ?? null;
    
    if ($id_pengumuman) {
        // Get specific pengumuman
        $response = makeSupabaseRequest('/rest/v1/pengumuman?select=*,pengguna(nama_lengkap)&id_pengumuman=eq.' . $id_pengumuman);
    } else {
        // Get all pengumuman
        $response = makeSupabaseRequest('/rest/v1/pengumuman?select=*,pengguna(nama_lengkap)&order=dibuat_pada.desc');
    }
    
    if (isset($response['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $response['error']]);
        exit;
    }
    
    echo json_encode([
        'status' => 'success',
        'data' => $response['data'] ?? []
    ]);
    
} elseif ($method === 'PUT') {
    // Handle updating pengumuman
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['id_pengumuman'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'ID Pengumuman wajib disertakan']);
        exit;
    }
    
    $id_pengumuman = $input['id_pengumuman'];
    $updateData = [];
    
    if (isset($input['judul'])) $updateData['judul'] = $input['judul'];
    if (isset($input['konten'])) $updateData['konten'] = $input['konten'];
    if (isset($input['start_date'])) $updateData['start_date'] = $input['start_date'];
    if (isset($input['end_date'])) $updateData['end_date'] = $input['end_date'];
    if (isset($input['telah_terbit'])) $updateData['telah_terbit'] = (bool)$input['telah_terbit'];

    // Update pengumuman using Supabase REST API
    $response = makeSupabaseRequest('/rest/v1/pengumuman?id_pengumuman=eq.' . $id_pengumuman, 'PUT', $updateData);
    
    if (isset($response['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $response['error']]);
        exit;
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Pengumuman berhasil diperbarui'
    ]);
    
} elseif ($method === 'DELETE') {
    // Handle deleting pengumuman
    $id_pengumuman = $_GET['id'] ?? null;
    
    if (!$id_pengumuman) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'ID Pengumuman wajib disertakan']);
        exit;
    }

    // Delete pengumuman using Supabase REST API
    $response = makeSupabaseRequest('/rest/v1/pengumuman?id_pengumuman=eq.' . $id_pengumuman, 'DELETE');
    
    if (isset($response['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $response['error']]);
        exit;
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Pengumuman berhasil dihapus'
    ]);
    
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}
?>