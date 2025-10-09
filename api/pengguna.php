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
    // Create new profile and user
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['action']) || $input['action'] !== 'create') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid action for POST method']);
        exit;
    }
    
    // Validate required fields according to the database schema
    if (!isset($input['nama_lengkap']) || !isset($input['email'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Nama Lengkap dan Email wajib diisi']);
        exit;
    }
    
    // First, create a Supabase auth user via API call
    // We need to make an HTTP request to Supabase Auth API using cURL
    $supabaseAuthUrl = 'https://kitxtcpfnccblznbagzx.supabase.co/auth/v1/admin/users';
    $password = $input['password'] ?? 'DefaultPassword123!'; // Default password for admin-created users
    $email = $input['email'];
    $emailConfirm = true; // Admin-created users are considered verified
    
    $authData = [
        'email' => $email,
        'password' => $password,
        'email_confirm' => $emailConfirm
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseAuthUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($authData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $serviceRoleKey,  // Using service role key for admin access
        'apikey: ' . $supabaseKey
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Set to true in production
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $authResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    
    curl_close($ch);
    
    if ($curlError) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Curl error: ' . $curlError]);
        exit;
    }
    
    if ($httpCode >= 400) {
        // Log the error for debugging
        error_log("Supabase Auth API error: HTTP " . $httpCode . " - " . $authResponse);
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to create user in auth system: HTTP ' . $httpCode . ' - ' . $authResponse]);
        exit;
    }
    
    $authResult = json_decode($authResponse, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Invalid JSON response from auth system']);
        exit;
    }
    
    // Extract the user ID from the auth response
    $userId = $authResult['id'] ?? null;
    if (!$userId) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to get user ID from auth system']);
        exit;
    }
    
    // Now create the profile record with the user ID
    $newProfile = [
        'id' => $userId,
        'nama_lengkap' => $input['nama_lengkap'],
        'email' => $input['email'],
        'nomor_telepon' => $input['nomor_telepon'] ?? null,
        'alamat' => $input['alamat'] ?? null,
        'peran' => $input['peran'] ?? 'pendaki'  // Default to 'pendaki'
    ];
    
    // Insert into Supabase profiles table
    $response = makeSupabaseRequest('/profiles', 'POST', $newProfile);
    
    if (isset($response['error'])) {
        // If profile creation failed, try to delete the auth user to rollback
        $deleteCh = curl_init();
        curl_setopt($deleteCh, CURLOPT_URL, $supabaseAuthUrl . '/' . $userId);
        curl_setopt($deleteCh, CURLOPT_CUSTOMREQUEST, 'DELETE');
        curl_setopt($deleteCh, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $serviceRoleKey,
            'apikey: ' . $supabaseKey
        ]);
        curl_setopt($deleteCh, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($deleteCh, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($deleteCh, CURLOPT_TIMEOUT, 30);
        
        curl_exec($deleteCh);
        curl_close($deleteCh);
        
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $response['error']]);
        exit;
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => 'User berhasil ditambahkan',
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