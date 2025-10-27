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

// Extract id_poster if present in URL
$id_poster = null;
if (isset($path_parts[2]) && is_numeric($path_parts[2])) {
    $id_poster = (int)$path_parts[2];
}

switch ($method) {
    case 'GET':
        if ($id_poster) {
            // Get single promosi poster
            $endpoint = "promosi_poster?id_poster=eq." . $id_poster;
            $response = makeSupabaseRequest($endpoint, 'GET');
        } else {
            // Get all promosi posters with related promosi info
            $query = isset($_GET['is_aktif']) ? '?is_aktif=eq.' . $_GET['is_aktif'] : '?select=id_poster,judul_poster,deskripsi_poster,url_gambar,url_tautan,is_aktif,urutan,dibuat_pada,promosi!id_promosi_terkait(nama_promosi,deskripsi_promosi,tipe_promosi,nilai_promosi,kondisi_min_pendaki,kondisi_max_pendaki,tanggal_mulai,tanggal_akhir,is_aktif)&order=urutan.asc';
            $endpoint = "promosi_poster" . $query;
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
        
        // Validate required fields
        if (empty($input['judul_poster']) || empty($input['url_gambar'])) {
            http_response_code(400);
            echo json_encode(['error' => 'judul_poster and url_gambar are required']);
            break;
        }
        
        // Create new promosi poster
        $response = makeSupabaseRequest('promosi_poster', 'POST', $input);
        
        if (isset($response['error'])) {
            http_response_code(500);
            echo json_encode(['error' => $response['error']]);
        } else {
            echo json_encode(['message' => 'Promosi poster created successfully', 'data' => $response['data']]);
        }
        break;
        
    case 'PUT':
        if (!$id_poster) {
            http_response_code(400);
            echo json_encode(['error' => 'Poster ID is required']);
            break;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Update promosi poster
        $endpoint = "promosi_poster?id_poster=eq." . $id_poster;
        $response = makeSupabaseRequest($endpoint, 'PATCH', $input);
        
        if (isset($response['error'])) {
            http_response_code(500);
            echo json_encode(['error' => $response['error']]);
        } else {
            echo json_encode(['message' => 'Promosi poster updated successfully', 'data' => $response['data']]);
        }
        break;
        
    case 'DELETE':
        if (!$id_poster) {
            http_response_code(400);
            echo json_encode(['error' => 'Poster ID is required']);
            break;
        }
        
        // Delete promosi poster
        $endpoint = "promosi_poster?id_poster=eq." . $id_poster;
        $response = makeSupabaseRequest($endpoint, 'DELETE');
        
        if (isset($response['error'])) {
            http_response_code(500);
            echo json_encode(['error' => $response['error']]);
        } else {
            echo json_encode(['message' => 'Promosi poster deleted successfully', 'data' => $response['data']]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>