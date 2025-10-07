<?php
require_once 'config.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $nama_pengguna = $_GET['nama_pengguna'] ?? null;
    $email_pengguna = $_GET['email_pengguna'] ?? null;

    // Build query based on parameters
    $query = '/pengguna?select=id_pengguna,nama_lengkap,email,nomor_telepon,nik,alamat,peran,dibuat_pada';
    
    if ($nama_pengguna) {
        $query .= '&nama_lengkap=ilike.%' . $nama_pengguna . '%';
    }
    
    if ($email_pengguna) {
        $query .= '&email=ilike.%' . $email_pengguna . '%';
    }
    
    $query .= '&order=nama_lengkap.asc';

    $response = makeSupabaseRequest($query);
    
    if (isset($response['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $response['error']]);
        exit;
    }
    
    $penggunaList = $response['data'] ?? [];

    echo json_encode([
        'status' => 'success',
        'data' => $penggunaList
    ]);
    
} elseif ($method === 'POST') {
    // Create new pengguna
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['action']) || $input['action'] !== 'create') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid action for POST method']);
        exit;
    }
    
    // Validate required fields according to the database schema
    if (!isset($input['id_pengguna']) || !isset($input['nama_lengkap']) || !isset($input['email'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'ID Pengguna, Nama Lengkap, dan Email wajib diisi']);
        exit;
    }
    
    // Prepare data for insertion
    $newPengguna = [
        'id_pengguna' => $input['id_pengguna'],
        'nama_lengkap' => $input['nama_lengkap'],
        'email' => $input['email'],
        'nomor_telepon' => $input['nomor_telepon'] ?? null,
        'nik' => $input['nik'] ?? null,
        'alamat' => $input['alamat'] ?? null,
        'peran' => $input['peran'] ?? 'pendaki',  // Default to 'pendaki'
        'is_verified' => $input['is_verified'] ?? true  // Default to verified since admin creates
    ];
    
    // Insert into Supabase
    $response = makeSupabaseRequest('/pengguna', 'POST', $newPengguna);
    
    if (isset($response['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $response['error']]);
        exit;
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Pengguna berhasil ditambahkan',
        'data' => $response
    ]);
    
} elseif ($method === 'PUT') {
    // Update existing pengguna
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['action']) || $input['action'] !== 'update') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid action for PUT method']);
        exit;
    }
    
    if (!isset($input['id_pengguna'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'ID Pengguna wajib diisi']);
        exit;
    }
    
    // Prepare data for update (only include fields that are present)
    $updateData = [];
    if (isset($input['nama_lengkap'])) {
        $updateData['nama_lengkap'] = $input['nama_lengkap'];
    }
    if (isset($input['email'])) {
        $updateData['email'] = $input['email'];
    }
    if (isset($input['nomor_telepon'])) {
        $updateData['nomor_telepon'] = $input['nomor_telepon'];
    }
    if (isset($input['nik'])) {
        $updateData['nik'] = $input['nik'];
    }
    if (isset($input['alamat'])) {
        $updateData['alamat'] = $input['alamat'];
    }
    if (isset($input['peran'])) {
        $updateData['peran'] = $input['peran'];
    }
    if (isset($input['is_verified'])) {
        $updateData['is_verified'] = $input['is_verified'];
    }
    
    // Update in Supabase
    $response = makeSupabaseRequest('/pengguna?id_pengguna=eq.' . $input['id_pengguna'], 'PATCH', $updateData);
    
    if (isset($response['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $response['error']]);
        exit;
    }
    
    if (count($response) === 0) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Pengguna tidak ditemukan']);
        exit;
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Pengguna berhasil diperbarui',
        'data' => $response[0]
    ]);
    
} elseif ($method === 'DELETE') {
    // Delete pengguna
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['action']) || $input['action'] !== 'delete') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid action for DELETE method']);
        exit;
    }
    
    if (!isset($input['id_pengguna'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'ID Pengguna wajib diisi']);
        exit;
    }
    
    // Delete from Supabase (this will also delete from auth due to CASCADE)
    $response = makeSupabaseRequest('/pengguna?id_pengguna=eq.' . $input['id_pengguna'], 'DELETE');
    
    if (isset($response['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $response['error']]);
        exit;
    }
    
    if (count($response) === 0) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Pengguna tidak ditemukan']);
        exit;
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Pengguna berhasil dihapus'
    ]);
    
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}
?>