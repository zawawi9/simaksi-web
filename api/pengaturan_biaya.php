<?php
require_once 'config.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get all pricing settings
    $response = makeSupabaseRequest('/pengaturan_biaya?select=*');
    
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
    
    if (!isset($input['nama_item']) || !isset($input['harga'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'nama_item and harga are required']);
        exit;
    }
    
    $nama_item = $input['nama_item'];
    $harga = (int)$input['harga'];
    $deskripsi = $input['deskripsi'] ?? null;
    
    // Check if pricing setting for this item already exists
    $existingResponse = makeSupabaseRequest('/pengaturan_biaya?select=*&nama_item=eq.' . $nama_item);
    
    if (isset($existingResponse['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $existingResponse['error']]);
        exit;
    }
    
    if (count($existingResponse['data']) > 0) {
        // Update existing pricing setting
        $updateResponse = makeSupabaseRequest('/pengaturan_biaya?nama_item=eq.' . $nama_item, 'PATCH', [
            'harga' => $harga,
            'deskripsi' => $deskripsi,
            'diperbarui_pada' => date('Y-m-d H:i:s')
        ]);
        
        if (isset($updateResponse['error'])) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $updateResponse['error']]);
            exit;
        }
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Harga diperbarui berhasil'
        ]);
    } else {
        // Create new pricing setting
        $createResponse = makeSupabaseRequest('/pengaturan_biaya', 'POST', [
            'nama_item' => $nama_item,
            'harga' => $harga,
            'deskripsi' => $deskripsi
        ]);
        
        if (isset($createResponse['error'])) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $createResponse['error']]);
            exit;
        }
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Harga ditambahkan berhasil'
        ]);
    }
    
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}
?>