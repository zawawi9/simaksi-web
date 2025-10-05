<?php
// api/konfirmasi_pembayaran.php

// Set content type to JSON
header('Content-Type: application/json');

// Enable CORS for frontend access
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

// Database connection parameters
$supabaseUrl = $_ENV['SUPABASE_URL'] ?? 'YOUR_SUPABASE_URL';  // Use environment variable or default
$supabaseKey = $_ENV['SUPABASE_SERVICE_ROLE_KEY'] ?? 'YOUR_SERVICE_ROLE_KEY';  // Use SERVICE_ROLE_KEY

// Check if this is a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode([
        'status' => 'gagal',
        'message' => 'Hanya menerima metode POST'
    ]);
    exit;
}

// Get input data
$input = json_decode(file_get_contents('php://input'), true);

// Validate input
if (!isset($input['id_reservasi']) || !isset($input['id_admin'])) {
    http_response_code(400); // Bad Request
    echo json_encode([
        'status' => 'gagal',
        'message' => 'Parameter id_reservasi dan id_admin diperlukan'
    ]);
    exit;
}

$id_reservasi = $input['id_reservasi'];
$id_admin = $input['id_admin'];

// Validate that the inputs are integers
if (!is_numeric($id_reservasi) || !is_numeric($id_admin)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'gagal',
        'message' => 'Parameter id_reservasi dan id_admin harus berupa angka'
    ]);
    exit;
}

// Using Supabase PHP client library
// Note: You need to install the library via composer require supabase/storage-sdk-php
// For this implementation, we'll use raw HTTP requests to the Supabase API

// Prepare the RPC call to Supabase
$rpcEndpoint = $supabaseUrl . '/rest/v1/rpc/konfirmasi_pembayaran_dan_catat_pemasukan';

// Prepare headers for Supabase API
$headers = [
    'Content-Type: application/json',
    'apikey: ' . $supabaseKey,
    'Authorization: Bearer ' . $supabaseKey
];

// Prepare the RPC call body
$rpcBody = json_encode([
    'input_id_reservasi' => (int)$id_reservasi,
    'input_id_admin' => (int)$id_admin
]);

// Initialize cURL
$ch = curl_init();

// Set cURL options
curl_setopt($ch, CURLOPT_URL, $rpcEndpoint);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $rpcBody);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

// Execute the request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);

curl_close($ch);

// Check for cURL errors
if ($curlError) {
    http_response_code(500);
    echo json_encode([
        'status' => 'gagal',
        'message' => 'Kesalahan koneksi: ' . $curlError
    ]);
    exit;
}

// Process the response
if ($httpCode >= 200 && $httpCode < 300) {
    // Successfully called the RPC function
    $result = json_decode($response, true);
    
    // Check the result of the function
    if (is_array($result) && count($result) > 0) {
        $functionResult = $result[0]; // RPC functions return an array
        
        if (strpos($functionResult, 'Success:') === 0) {
            // Success case
            echo json_encode([
                'status' => 'sukses',
                'message' => $functionResult
            ]);
        } else {
            // Error returned by the function
            echo json_encode([
                'status' => 'gagal',
                'message' => $functionResult
            ]);
        }
    } else {
        // Unexpected response format
        http_response_code(500);
        echo json_encode([
            'status' => 'gagal',
            'message' => 'Format respons tidak dikenali'
        ]);
    }
} else {
    // Error occurred during the API call
    http_response_code(500);
    echo json_encode([
        'status' => 'gagal',
        'message' => 'Terjadi kesalahan saat menghubungi Supabase: HTTP ' . $httpCode . ' - ' . $response
    ]);
}
?>