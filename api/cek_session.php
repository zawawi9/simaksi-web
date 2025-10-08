<?php
require_once 'config.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

// Try to get token from both the request body and the Authorization header
$token = null;
$input = json_decode(file_get_contents('php://input'), true);

// First try to get from request body
if (isset($input['token'])) {
    $token = $input['token'];
} elseif (isset($input['user_id'])) {
    // If we have user_id, we'll verify through Supabase
    $userId = $input['user_id'];
} 

// Also check Authorization header
if (!$token) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = $matches[1];
    }
}

// If we have a token, we'll use it to get the user ID from Supabase
if ($token) {
    // Verify the session token with Supabase Auth
    $headers = [
        'Content-Type: application/json',
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $token
    ];

    $authUrl = $supabaseUrl . '/auth/v1/user';
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $authUrl);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);

    curl_close($ch);

    if ($curlError) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Curl error: ' . $curlError]);
        exit;
    }

    if ($httpCode === 401) {
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
        exit;
    }

    if ($httpCode >= 400) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'HTTP error: ' . $httpCode . ' - ' . $response]);
        exit;
    }

    $userData = json_decode($response, true);
    if (!$userData || !isset($userData['id'])) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Invalid user data: ' . json_encode($response)]);
        exit;
    }

    $userId = $userData['id'];
} elseif (isset($input['user_id'])) {
    // If only user ID was provided, we'll verify the role by user ID
    $userId = $input['user_id'];
} else {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Token or user ID required']);
    exit;
}

// Now check if this user has admin role in the profiles table
$userRoleResponse = makeSupabaseRequest('/profiles?select=peran,nama_lengkap&id=eq.' . $userId);

if (isset($userRoleResponse['error'])) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to fetch user role: ' . $userRoleResponse['error']]);
    exit;
}

if (!isset($userRoleResponse['data'][0])) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'User not found in system']);
    exit;
}

if ($userRoleResponse['data'][0]['peran'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'User is not an admin. Role: ' . $userRoleResponse['data'][0]['peran']]);
    exit;
}

echo json_encode([
    'status' => 'success',
    'data' => [
        'user' => [
            'id' => $userId,
            'nama_lengkap' => $userRoleResponse['data'][0]['nama_lengkap'],
            'peran' => $userRoleResponse['data'][0]['peran']
        ]
    ]
]);
?>