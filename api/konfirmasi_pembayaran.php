<?php
require_once 'config.php';

// Set content type to JSON
header('Content-Type: application/json');

// Enable CORS for frontend access
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

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

// Validate that the inputs are valid
if (!is_numeric($id_reservasi)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'gagal',
        'message' => 'Parameter id_reservasi harus berupa angka'
    ]);
    exit;
}

// Using Supabase function to confirm payment and record income
$rpcResponse = makeSupabaseRequest('/rpc/konfirmasi_pembayaran_dan_catat_pemasukan', 'POST', [
    'input_id_reservasi' => (int)$id_reservasi,
    'input_id_admin' => $id_admin
]);

// Process the response
if (isset($rpcResponse['error'])) {
    // Error occurred during the API call
    http_response_code(500);
    echo json_encode([
        'status' => 'gagal',
        'message' => $rpcResponse['error']
    ]);
    exit;
}

// Successfully called the RPC function
$result = $rpcResponse['data'];

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

?>