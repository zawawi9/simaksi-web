<?php
require_once 'config.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get quota data
    $tanggal = $_GET['tanggal'] ?? null;
    
    if ($tanggal) {
        // Get specific date quota
        $response = makeSupabaseRequest('/kuota_harian?select=*&tanggal_kuota=eq.' . $tanggal);
    } else {
        // Get all quota data (for the next 30 days)
        $endDate = date('Y-m-d', strtotime('+30 days'));
        $response = makeSupabaseRequest('/kuota_harian?select=*&tanggal_kuota=gte.' . date('Y-m-d') . '&tanggal_kuota=lte.' . $endDate . '&order=tanggal_kuota.asc');
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
    
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['tanggal']) || !isset($input['kuota_maksimal'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'tanggal and kuota_maksimal are required']);
        exit;
    }
    
    $tanggal = $input['tanggal'];
    $kuota_maksimal = (int)$input['kuota_maksimal'];
    
    // Check if quota for this date already exists
    $existingResponse = makeSupabaseRequest('/kuota_harian?select=*&tanggal_kuota=eq.' . $tanggal);
    
    if (isset($existingResponse['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $existingResponse['error']]);
        exit;
    }
    
    if (count($existingResponse['data']) > 0) {
        // Update existing quota
        $updateResponse = makeSupabaseRequest('/kuota_harian?tanggal_kuota=eq.' . $tanggal, 'PATCH', [
            'kuota_maksimal' => $kuota_maksimal
        ]);
        
        if (isset($updateResponse['error'])) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $updateResponse['error']]);
            exit;
        }
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Quota updated successfully'
        ]);
    } else {
        // Create new quota
        $createResponse = makeSupabaseRequest('/kuota_harian', 'POST', [
            'tanggal_kuota' => $tanggal,
            'kuota_maksimal' => $kuota_maksimal,
            'kuota_terpesan' => 0
        ]);
        
        if (isset($createResponse['error'])) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $createResponse['error']]);
            exit;
        }
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Quota created successfully'
        ]);
    }
    
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}
?>