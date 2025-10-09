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

// Validate input - hanya perlu id_reservasi karena fungsi RPC mengambil id_admin dari auth.uid()
if (!isset($input['id_reservasi'])) {
    http_response_code(400); // Bad Request
    echo json_encode([
        'status' => 'gagal',
        'message' => 'Parameter id_reservasi diperlukan'
    ]);
    exit;
}

$id_reservasi = $input['id_reservasi'];

// Validate that the inputs are valid
if (!is_numeric($id_reservasi) || !ctype_digit(strval($id_reservasi))) {
    http_response_code(400);
    echo json_encode([
        'status' => 'gagal',
        'message' => 'Parameter id_reservasi harus berupa angka'
    ]);
    exit;
}

// Ensure $id_reservasi is an integer
$id_reservasi = intval($id_reservasi);

// Using Supabase function to confirm payment and record income
// We need to pass the user's authorization header so the RPC function can identify the admin

// Get the Authorization header from the request to pass to Supabase
$authHeader = null;
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
} elseif (function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
    }
}

if (!$authHeader) {
    http_response_code(401);
    echo json_encode([
        'status' => 'gagal',
        'message' => 'Autentikasi diperlukan untuk mengonfirmasi pembayaran'
    ]);
    exit;
}

// Prepare the data for the RPC call
$rpcData = [
    'input_id_reservasi' => (int)$id_reservasi
];
error_log("Calling RPC function with data: " . print_r($rpcData, true));

// Direct cURL request to Supabase RPC endpoint with user's auth token
$supabaseUrl = 'https://kitxtcpfnccblznbagzx.supabase.co/rest/v1';
$supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdHh0Y3BmbmNjYmx6bmJhZ3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODIxMzEsImV4cCI6MjA3NTE1ODEzMX0.OySigpw4AWI3G7JW_8r8yXu7re0Mr9CYv8u3d9Fr548'; // anon key

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rpc/konfirmasi_pembayaran_dan_catat_pemasukan');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($rpcData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'apikey: ' . $supabaseKey,
    'Authorization: ' . $authHeader,
    'Prefer: return=representation'
]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

error_log("Raw RPC response: " . $response . " HTTP Code: " . $httpCode);

if ($curlError) {
    error_log("CURL Error: " . $curlError);
    $rpcResponse = ['error' => 'Curl error: ' . $curlError];
} elseif ($httpCode >= 400) {
    $decodedResponse = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        $error_message = "HTTP error: " . $httpCode . " - " . $response;
    } else {
        $error_message = isset($decodedResponse['message']) ? $decodedResponse['message'] : "HTTP error: " . $httpCode;
    }
    $rpcResponse = ['error' => $error_message];
} else {
    $decodedResponse = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        $rpcResponse = ['error' => 'Invalid JSON response: ' . $response];
    } else {
        $rpcResponse = [
            'status_code' => $httpCode,
            'data' => $decodedResponse
        ];
    }
}

// Process the response
if (isset($rpcResponse['error'])) {
    // Error occurred during the API call
    error_log("RPC Error: " . print_r($rpcResponse['error'], true));
    http_response_code(500);
    echo json_encode([
        'status' => 'gagal',
        'message' => $rpcResponse['error']
    ]);
    exit;
}

$result = $rpcResponse['data'];
error_log("RPC Result: " . print_r($result, true));

// Handle different response formats from the RPC function
if ($result !== null) {
    // The RPC function might return result in different formats
    // Check if it's an array with response inside
    if (is_array($result)) {
        if (count($result) > 0 && isset($result[0])) {
            // Get the first item from the array
            $functionResult = $result[0];
            
            // If it's a string, check if it starts with "Success:"
            if (is_string($functionResult)) {
                if (strpos($functionResult, 'Success:') === 0) {
                    echo json_encode([
                        'status' => 'sukses',
                        'message' => $functionResult
                    ]);
                } else {
                    // This is an error message from the function
                    echo json_encode([
                        'status' => 'gagal',
                        'message' => $functionResult
                    ]);
                }
            } else {
                // The result is not a string - might be an object or other format
                error_log("Unexpected format for function result: " . print_r($functionResult, true));
                echo json_encode([
                    'status' => 'gagal',
                    'message' => 'Format hasil fungsi tidak dikenali: ' . print_r($functionResult, true)
                ]);
            }
        } else {
            // Array is empty
            error_log("Empty result array from RPC function");
            echo json_encode([
                'status' => 'gagal',
                'message' => 'Fungsi mengembalikan array kosong'
            ]);
        }
    } else {
        // Result might be a direct string response
        if (is_string($result)) {
            if (strpos($result, 'Success:') === 0) {
                echo json_encode([
                    'status' => 'sukses',
                    'message' => $result
                ]);
            } else {
                echo json_encode([
                    'status' => 'gagal',
                    'message' => $result
                ]);
            }
        } else {
            // Unexpected response format
            error_log("Unexpected response format: " . print_r($result, true));
            echo json_encode([
                'status' => 'gagal',
                'message' => 'Format respons tidak dikenali: ' . print_r($result, true)
            ]);
        }
    }
} else {
    // Result is null
    error_log("Null result from RPC function");
    echo json_encode([
        'status' => 'gagal',
        'message' => 'Fungsi mengembalikan hasil null'
    ]);
}

?>