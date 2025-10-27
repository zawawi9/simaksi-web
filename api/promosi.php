<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path_parts = explode('/', trim($path, '/'));

// Extract id_promosi if present in URL
$id_promosi = null;
if (isset($path_parts[2]) && is_numeric($path_parts[2])) {
    $id_promosi = (int)$path_parts[2];
}

// Function to validate promosi data
function validatePromosiData($data) {
    $required_fields = ['nama_promosi', 'tipe_promosi', 'nilai_promosi', 'tanggal_mulai', 'tanggal_akhir'];
    $errors = [];
    
    foreach ($required_fields as $field) {
        if (empty($data[$field])) {
            $errors[] = $field . ' is required';
        }
    }
    
    // Validate tipe_promosi
    if (!empty($data['tipe_promosi']) && !in_array($data['tipe_promosi'], ['PERSENTASE', 'POTONGAN_TETAP', 'HARGA_KHUSUS'])) {
        $errors[] = 'tipe_promosi must be one of: PERSENTASE, POTONGAN_TETAP, HARGA_KHUSUS';
    }
    
    // Validate numeric values
    if (!empty($data['nilai_promosi']) && !is_numeric($data['nilai_promosi'])) {
        $errors[] = 'nilai_promosi must be a number';
    }
    
    if (!empty($data['kondisi_min_pendaki']) && !is_numeric($data['kondisi_min_pendaki'])) {
        $errors[] = 'kondisi_min_pendaki must be a number';
    }
    
    if (!empty($data['kondisi_max_pendaki']) && !is_numeric($data['kondisi_max_pendaki'])) {
        $errors[] = 'kondisi_max_pendaki must be a number';
    }
    
    return $errors;
}

switch ($method) {
    case 'GET':
        if ($id_promosi) {
            // Get single promosi
            $endpoint = "promosi?id_promosi=eq." . $id_promosi;
            $response = makeSupabaseRequest($endpoint, 'GET');
        } else {
            // Get all promosi
            $query = isset($_GET['is_aktif']) ? '?is_aktif=eq.' . $_GET['is_aktif'] : '';
            $endpoint = "promosi" . $query . "&order=dibuat_pada.desc";
            $response = makeSupabaseRequest($endpoint, 'GET');
        }
        
        if (isset($response['error'])) {
            http_response_code(500);
            echo json_encode(['error' => $response['error']]);
        } else {
            echo json_encode($response['data']);
        }
        break;
        
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validate input data
        $errors = validatePromosiData($input);
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(['error' => 'Validation failed', 'details' => $errors]);
            break;
        }
        
        // Create new promosi
        $response = makeSupabaseRequest('promosi', 'POST', $input);
        
        if (isset($response['error'])) {
            http_response_code(500);
            echo json_encode(['error' => $response['error']]);
        } else {
            echo json_encode(['message' => 'Promosi created successfully', 'data' => $response['data']]);
        }
        break;
        
    case 'PUT':
        if (!$id_promosi) {
            http_response_code(400);
            echo json_encode(['error' => 'Promosi ID is required']);
            break;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validate input data if provided
        if (!empty($input)) {
            $errors = validatePromosiData($input);
            if (!empty($errors)) {
                http_response_code(400);
                echo json_encode(['error' => 'Validation failed', 'details' => $errors]);
                break;
            }
        }
        
        // Update promosi
        $endpoint = "promosi?id_promosi=eq." . $id_promosi;
        $response = makeSupabaseRequest($endpoint, 'PATCH', $input);
        
        if (isset($response['error'])) {
            http_response_code(500);
            echo json_encode(['error' => $response['error']]);
        } else {
            echo json_encode(['message' => 'Promosi updated successfully', 'data' => $response['data']]);
        }
        break;
        
    case 'DELETE':
        if (!$id_promosi) {
            http_response_code(400);
            echo json_encode(['error' => 'Promosi ID is required']);
            break;
        }
        
        // Delete promosi
        $endpoint = "promosi?id_promosi=eq." . $id_promosi;
        $response = makeSupabaseRequest($endpoint, 'DELETE');
        
        if (isset($response['error'])) {
            http_response_code(500);
            echo json_encode(['error' => $response['error']]);
        } else {
            echo json_encode(['message' => 'Promosi deleted successfully', 'data' => $response['data']]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>