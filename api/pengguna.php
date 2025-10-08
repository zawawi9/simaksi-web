<?php
require_once 'config.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $nama_lengkap = $_GET['nama_lengkap'] ?? null;
    $email = $_GET['email'] ?? null;

    // Build query based on parameters
    $query = '/profiles?select=id,nama_lengkap,email,nomor_telepon,alamat,peran';
    
    if ($nama_lengkap) {
        $query .= '&nama_lengkap=ilike.%' . $nama_lengkap . '%';
    }
    
    if ($email) {
        $query .= '&email=ilike.%' . $email . '%';
    }
    
    $query .= '&order=nama_lengkap.asc';

    $response = makeSupabaseRequest($query);
    
    if (isset($response['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $response['error']]);
        exit;
    }
    
    $profilesList = $response['data'] ?? [];

    echo json_encode([
        'status' => 'success',
        'data' => $profilesList
    ]);
    
} elseif ($method === 'POST') {
    // Create new profile
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['action']) || $input['action'] !== 'create') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid action for POST method']);
        exit;
    }
    
    // Validate required fields according to the database schema
    if (!isset($input['id']) || !isset($input['nama_lengkap']) || !isset($input['email'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'ID, Nama Lengkap, dan Email wajib diisi']);
        exit;
    }
    
    // Prepare data for insertion
    $newProfile = [
        'id' => $input['id'],
        'nama_lengkap' => $input['nama_lengkap'],
        'email' => $input['email'],
        'nomor_telepon' => $input['nomor_telepon'] ?? null,
        'alamat' => $input['alamat'] ?? null,
        'peran' => $input['peran'] ?? 'pendaki'  // Default to 'pendaki'
    ];
    
    // Insert into Supabase
    $response = makeSupabaseRequest('/profiles', 'POST', $newProfile);
    
    if (isset($response['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $response['error']]);
        exit;
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Profile berhasil ditambahkan',
        'data' => $response
    ]);
    
} elseif ($method === 'PUT') {
    // Update existing profile
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['action']) || $input['action'] !== 'update') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid action for PUT method']);
        exit;
    }
    
    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'ID wajib diisi']);
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
    if (isset($input['alamat'])) {
        $updateData['alamat'] = $input['alamat'];
    }
    if (isset($input['peran'])) {
        $updateData['peran'] = $input['peran'];
    }
    
    // Update in Supabase
    $response = makeSupabaseRequest('/profiles?id=eq.' . $input['id'], 'PATCH', $updateData);
    
    if (isset($response['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $response['error']]);
        exit;
    }
    
    if (count($response) === 0) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Profile tidak ditemukan']);
        exit;
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Profile berhasil diperbarui',
        'data' => $response[0]
    ]);
    
} elseif ($method === 'DELETE') {
    // Delete profile
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['action']) || $input['action'] !== 'delete') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid action for DELETE method']);
        exit;
    }
    
    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'ID wajib diisi']);
        exit;
    }
    
    // Delete from Supabase (this will also delete from auth due to CASCADE)
    $response = makeSupabaseRequest('/profiles?id=eq.' . $input['id'], 'DELETE');
    
    if (isset($response['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $response['error']]);
        exit;
    }
    
    if (count($response) === 0) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Profile tidak ditemukan']);
        exit;
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Profile berhasil dihapus'
    ]);
    
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}
?>