<?php
require_once 'config.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $kode_reservasi = $_GET['kode_reservasi'] ?? null;
    $nama_pendaki = $_GET['nama_pendaki'] ?? null;
    $id_pendaki = $_GET['id_pendaki'] ?? null;

    // If id_pendaki is provided, fetch single record
    if ($id_pendaki) {
        $query = '/pendaki_rombongan?select=*,reservasi!inner(kode_reservasi)&id_pendaki=eq.' . $id_pendaki;
    } else {
        // Build query based on parameters for multiple records
        $query = '/pendaki_rombongan?select=*,reservasi!inner(kode_reservasi)';
        
        if ($kode_reservasi) {
            $query .= '&reservasi.kode_reservasi=ilike.%' . $kode_reservasi . '%';
        }
        
        if ($nama_pendaki) {
            $query .= '&nama_lengkap=ilike.%' . $nama_pendaki . '%';
        }
        
        $query .= '&order=nama_lengkap.asc';
    }

    $response = makeSupabaseRequest($query);
    
    if (isset($response['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $response['error']]);
        exit;
    }
    
    $pendakiList = $response['data'] ?? [];
    
    // Format data to return kode_reservasi from the related table
    $formattedList = [];
    foreach ($pendakiList as $pendaki) {
        $formattedPendaki = [
            'id_pendaki' => $pendaki['id_pendaki'],
            'nama_lengkap' => $pendaki['nama_lengkap'],
            'nik' => $pendaki['nik'],
            'alamat' => $pendaki['alamat'],
            'nomor_telepon' => $pendaki['nomor_telepon'],
            'kontak_darurat' => $pendaki['kontak_darurat'],
            'kode_reservasi' => $pendaki['reservasi']['kode_reservasi'] ?? 'N/A',
            'url_surat_sehat' => $pendaki['url_surat_sehat'] ?? null
        ];
        $formattedList[] = $formattedPendaki;
    }

    // If fetching single record, return as single object instead of array
    if ($id_pendaki && count($formattedList) > 0) {
        echo json_encode([
            'status' => 'success',
            'data' => $formattedList[0]
        ]);
    } else {
        echo json_encode([
            'status' => 'success',
            'data' => $formattedList
        ]);
    }
    
} elseif ($method === 'POST') {
    // Create new hiker
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['action']) || $input['action'] !== 'create') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid action for POST method']);
        exit;
    }
    
    // Validate required fields according to the database schema
    if (!isset($input['nama_lengkap']) || !isset($input['nik']) || !isset($input['id_reservasi']) || 
        !isset($input['alamat']) || !isset($input['nomor_telepon']) || !isset($input['kontak_darurat'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Nama lengkap, NIK, ID Reservasi, Alamat, Nomor Telepon, dan Kontak Darurat wajib diisi']);
        exit;
    }
    
    // Prepare data for insertion
    $newPendaki = [
        'id_reservasi' => $input['id_reservasi'],
        'nama_lengkap' => $input['nama_lengkap'],
        'nik' => $input['nik'],
        'alamat' => $input['alamat'] ?? '',
        'nomor_telepon' => $input['nomor_telepon'] ?? '',
        'kontak_darurat' => $input['kontak_darurat'] ?? '',
        'url_surat_sehat' => !empty($input['url_surat_sehat']) ? $input['url_surat_sehat'] : null
    ];
    
    // Insert into Supabase
    $response = makeSupabaseRequest('/pendaki_rombongan', 'POST', $newPendaki);
    
    if (isset($response['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $response['error']]);
        exit;
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Pendaki berhasil ditambahkan',
        'data' => $response
    ]);
    
} elseif ($method === 'PUT') {
    // Update existing hiker
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['action']) || $input['action'] !== 'update') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid action for PUT method']);
        exit;
    }
    
    if (!isset($input['id_pendaki'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'ID Pendaki wajib diisi']);
        exit;
    }
    
    // Validate required fields for update if they are provided
    if (isset($input['alamat']) && empty($input['alamat'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Alamat wajib diisi']);
        exit;
    }
    if (isset($input['nomor_telepon']) && empty($input['nomor_telepon'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Nomor Telepon wajib diisi']);
        exit;
    }
    if (isset($input['kontak_darurat']) && empty($input['kontak_darurat'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Kontak Darurat wajib diisi']);
        exit;
    }

    // Prepare data for update (only include fields that are present)
    $updateData = [];
    if (isset($input['nama_lengkap'])) {
        $updateData['nama_lengkap'] = $input['nama_lengkap'];
    }
    if (isset($input['nik'])) {
        $updateData['nik'] = $input['nik'];
    }
    if (isset($input['alamat'])) {
        $updateData['alamat'] = $input['alamat'];
    }
    if (isset($input['nomor_telepon'])) {
        $updateData['nomor_telepon'] = $input['nomor_telepon'];
    }
    if (isset($input['kontak_darurat'])) {
        $updateData['kontak_darurat'] = $input['kontak_darurat'];
    }
    if (isset($input['url_surat_sehat'])) {
        $updateData['url_surat_sehat'] = $input['url_surat_sehat'];
    }
    
    // Update in Supabase
    $response = makeSupabaseRequest('/pendaki_rombongan?id_pendaki=eq.' . $input['id_pendaki'], 'PATCH', $updateData);
    
    if (isset($response['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $response['error']]);
        exit;
    }
    
    if (count($response) === 0) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Pendaki tidak ditemukan']);
        exit;
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Pendaki berhasil diperbarui',
        'data' => $response[0]
    ]);
    
} elseif ($method === 'DELETE') {
    // Delete hiker
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['action']) || $input['action'] !== 'delete') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid action for DELETE method']);
        exit;
    }
    
    if (!isset($input['id_pendaki'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'ID Pendaki wajib diisi']);
        exit;
    }
    
    // Delete from Supabase
    $response = makeSupabaseRequest('/pendaki_rombongan?id_pendaki=eq.' . $input['id_pendaki'], 'DELETE');
    
    if (isset($response['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $response['error']]);
        exit;
    }
    
    if (count($response) === 0) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Pendaki tidak ditemukan']);
        exit;
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Pendaki berhasil dihapus'
    ]);
    
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}
?>