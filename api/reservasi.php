<?php
require_once 'config.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $id_reservasi = $_GET['id'] ?? null;
    $date = $_GET['date'] ?? date('Y-m-d');
    $kode = $_GET['kode'] ?? null;
    $nama = $_GET['nama'] ?? null;

    if ($id_reservasi) {
        // Fetch single reservation by ID (for detail view)
        $query = '/reservasi?select=*&id_reservasi=eq.' . $id_reservasi;
        $response = makeSupabaseRequest($query);
        
        if (isset($response['error'])) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $response['error']]);
            exit;
        }
        
        $reservasi = $response['data'][0] ?? null;
        
        if ($reservasi) {
            // Get pendaki rombongan details
            $pendakiResponse = makeSupabaseRequest('/pendaki_rombongan?select=*&id_reservasi=eq.' . $reservasi['id_reservasi']);
            $pendakiList = isset($pendakiResponse['data']) ? $pendakiResponse['data'] : [];
            
            // Get barang bawaan sampah details
            $barangResponse = makeSupabaseRequest('/barang_bawaan_sampah?select=*&id_reservasi=eq.' . $reservasi['id_reservasi']);
            $barangList = isset($barangResponse['data']) ? $barangResponse['data'] : [];
            
            $reservasi['pendaki_rombongan'] = $pendakiList;
            $reservasi['barang_bawaan'] = $barangList;
        }
        
        $reservasiWithDetails = $reservasi ? [$reservasi] : [];
        
        echo json_encode([
            'status' => 'success',
            'data' => $reservasiWithDetails
        ]);
        exit;
    }

    // Check if searching by name - this requires a different approach
    if ($nama) {
        // First, get user IDs that match the name
        $usersResponse = makeSupabaseRequest('/profiles?select=id&nama_lengkap=ilike.*' . $nama . '*');
        if (isset($usersResponse['error'])) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $usersResponse['error']]);
            exit;
        }
        
        if (empty($usersResponse['data'])) {
            // No matching users found
            echo json_encode(['status' => 'success', 'data' => []]);
            exit;
        }
        
        // Extract user IDs
        $userIds = array_column($usersResponse['data'], 'id');
        
        // Build query for reservations with specific user IDs
        $query = '/reservasi?select=id_reservasi,kode_reservasi,tanggal_pendakian,jumlah_pendaki,status,id_pengguna&';
        $query .= 'id_pengguna=in.(' . implode(',', $userIds) . ')'; // Filter by user IDs
        
        if ($kode) {
            $query .= '&kode_reservasi=ilike.*' . $kode . '*';
        }
        
        $query .= '&order=kode_reservasi.asc';
        
    } else {
        // Standard query without name search
        $query = '/reservasi?select=id_reservasi,kode_reservasi,tanggal_pendakian,jumlah_pendaki,status,id_pengguna&';
        
        if ($kode) {
            $query .= 'kode_reservasi=ilike.*' . $kode . '*&';
        } else {
            // Check if 'all' parameter is set to true to show all reservations
            $all_param = $_GET['all'] ?? null;
            if ($all_param === 'true') {
                // Show all reservations sorted by newest date first, with pagination
            } else {
                // If no specific search and no 'all' parameter, show today's reservations  
                $query .= 'tanggal_pendakian=eq.' . $date . '&';
            }
        }
        
        // Add pagination parameters if they exist and not doing name search
        $limit = $_GET['limit'] ?? 10; // Default to 10 items
        $offset = $_GET['offset'] ?? 0; // Default to offset 0 (first page)
        
        // Order by date descending (newest first), then by kode_reservasi for secondary ordering
        $query .= 'order=tanggal_pendakian.desc,kode_reservasi.desc&limit=' . intval($limit) . '&offset=' . intval($offset);
    }

    $response = makeSupabaseRequest($query);
    
    if (isset($response['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $response['error']]);
        exit;
    }
    
    // For each reservation, get the details
    $reservasiWithDetails = [];
    if (isset($response['data'])) {
        foreach ($response['data'] as $reservasi) {
            // Get user details to get nama_lengkap
            $userResponse = makeSupabaseRequest('/profiles?select=nama_lengkap&id=eq.' . $reservasi['id_pengguna']);
            if (!isset($userResponse['error']) && !empty($userResponse['data']) && isset($userResponse['data'][0]['nama_lengkap'])) {
                $reservasi['nama_ketua_rombongan'] = $userResponse['data'][0]['nama_lengkap'];
            } else {
                $reservasi['nama_ketua_rombongan'] = 'Nama tidak ditemukan';
            }
            
            // Get pendaki rombongan details
            $pendakiResponse = makeSupabaseRequest('/pendaki_rombongan?select=*&id_reservasi=eq.' . $reservasi['id_reservasi']);
            $pendakiList = isset($pendakiResponse['data']) ? $pendakiResponse['data'] : [];
            
            // Get barang bawaan sampah details
            $barangResponse = makeSupabaseRequest('/barang_bawaan_sampah?select=*&id_reservasi=eq.' . $reservasi['id_reservasi']);
            $barangList = isset($barangResponse['data']) ? $barangResponse['data'] : [];
            
            $reservasi['pendaki_rombongan'] = $pendakiList;
            $reservasi['barang_bawaan'] = $barangList;
            
            $reservasiWithDetails[] = $reservasi;
        }
    }
    
    echo json_encode([
        'status' => 'success',
        'data' => $reservasiWithDetails
    ]);
    
} elseif ($method === 'PATCH') {
    // Handle updating reservation data including status_sampah
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['id_reservasi'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'id_reservasi is required']);
        exit;
    }
    
    $id_reservasi = $input['id_reservasi'];
    $updateData = [];
    
    // Prepare data to update based on provided input
    if (isset($input['status_sampah'])) {
        $updateData['status_sampah'] = $input['status_sampah'];
    }
    
    // Allow updating the main status as well
    if (isset($input['status'])) {
        $updateData['status'] = $input['status'];
    }

    // Only update if there's data to update
    if (empty($updateData)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'No data to update']);
        exit;
    }
    
    // If this is a payment confirmation (status is being changed to 'terkonfirmasi'), create the income record
    if (isset($input['status']) && $input['status'] === 'terkonfirmasi') {
        // First, get the current reservation data to fetch total_harga and kode_reservasi
        $reservasiResponse = makeSupabaseRequest('/reservasi?select=*&id_reservasi=eq.' . $id_reservasi . '&status=eq.menunggu_pembayaran', 'GET');
        
        if (isset($reservasiResponse['error']) || empty($reservasiResponse['data'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Reservasi tidak ditemukan atau status bukan menunggu pembayaran']);
            exit;
        }
        
        $reservasi = $reservasiResponse['data'][0];
        
        // Create income record
        $incomeData = [
            'id_reservasi' => (int)$id_reservasi,
            'id_admin' => $input['id_admin'],
            'jumlah' => (int)$reservasi['total_harga'],
            'keterangan' => 'Pemasukan dari tiket reservasi kode: ' . $reservasi['kode_reservasi'],
            'tanggal_pemasukan' => date('Y-m-d')
        ];
        
        $incomeResponse = makeSupabaseRequest('/pemasukan', 'POST', $incomeData);
        
        if (isset($incomeResponse['error'])) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Gagal membuat catatan pemasukan: ' . $incomeResponse['error']]);
            exit;
        }
    }
    
    // Update reservation in Supabase
    $updateResponse = makeSupabaseRequest('/reservasi?id_reservasi=eq.' . $id_reservasi, 'PATCH', $updateData);
    
    if (isset($updateResponse['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $updateResponse['error']]);
        exit;
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Reservation updated successfully'
    ]);
    
} elseif ($method === 'POST') {
    // This endpoint should not handle payment confirmation anymore
    // Payment confirmation should be handled by api/konfirmasi_pembayaran.php
    http_response_code(400);
    echo json_encode([
        'status' => 'error', 
        'message' => 'This endpoint does not handle payment confirmation. Use /konfirmasi_pembayaran.php instead.'
    ]);
    exit;
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}
?>