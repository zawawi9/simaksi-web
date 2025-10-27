<?php
require_once 'config.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        // Get financial report data with proper validation
        $fromDate = $_GET['from_date'] ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $_GET['to_date'] ?? date('Y-m-d');
        
        // Validate dates
        if (!strtotime($fromDate) || !strtotime($toDate)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid date format']);
            exit;
        }
        
        // Ensure proper date formatting
        $fromDate = date('Y-m-d', strtotime($fromDate));
        $toDate = date('Y-m-d', strtotime($toDate));
        
        // Get pemasukan data
        $pemasukanEndpoint = "/pemasukan?select=*&tanggal_pemasukan=gte." . urlencode($fromDate) . "&tanggal_pemasukan=lte." . urlencode($toDate) . "&order=tanggal_pemasukan.desc";
        $pemasukanResponse = makeSupabaseRequest($pemasukanEndpoint, 'GET');
        if (isset($pemasukanResponse['error'])) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $pemasukanResponse['error']['message'] ?? $pemasukanResponse['error']]);
            exit;
        }
        $pemasukanData = $pemasukanResponse['data'] ?? [];
        
        // Get pengeluaran data
        $pengeluaranEndpoint = "/pengeluaran?select=*&tanggal_pengeluaran=gte." . urlencode($fromDate) . "&tanggal_pengeluaran=lte." . urlencode($toDate) . "&order=tanggal_pengeluaran.desc";
        $pengeluaranResponse = makeSupabaseRequest($pengeluaranEndpoint, 'GET');
        if (isset($pengeluaranResponse['error'])) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $pengeluaranResponse['error']['message'] ?? $pengeluaranResponse['error']]);
            exit;
        }
        $pengeluaranData = $pengeluaranResponse['data'] ?? [];
        
        // Calculate totals
        $totalPemasukan = 0;
        foreach ($pemasukanData as $pemasukan) {
            $totalPemasukan += (int)($pemasukan['jumlah'] ?? 0);
        }
        
        $totalPengeluaran = 0;
        foreach ($pengeluaranData as $pengeluaran) {
            $totalPengeluaran += (int)($pengeluaran['jumlah'] ?? 0);
        }
        
        $saldoAkhir = $totalPemasukan - $totalPengeluaran;
        
        echo json_encode([
            'status' => 'success',
            'data' => [
                'total_pemasukan' => $totalPemasukan,
                'total_pengeluaran' => $totalPengeluaran,
                'saldo_akhir' => $saldoAkhir,
                'from_date' => $fromDate,
                'to_date' => $toDate,
                'pemasukan' => $pemasukanData,
                'pengeluaran' => $pengeluaranData
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to load financial data: ' . $e->getMessage()]);
        exit;
    }
    
} elseif ($method === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['jumlah']) || !isset($input['tanggal_pengeluaran']) || !isset($input['keterangan'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'jumlah, tanggal_pengeluaran, and keterangan are required']);
            exit;
        }
        
        $jumlah = (int)$input['jumlah'];
        $tanggal_pengeluaran = $input['tanggal_pengeluaran'];
        $keterangan = trim($input['keterangan']);
        $id_kategori = $input['id_kategori'] ?? null;
        
        // Validate required fields
        if ($jumlah <= 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Jumlah must be greater than 0']);
            exit;
        }
        
        if (!strtotime($tanggal_pengeluaran)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid date format for tanggal_pengeluaran']);
            exit;
        }
        
        if (empty($keterangan)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Keterangan cannot be empty']);
            exit;
        }
        
        // For now, use a default admin ID or require it in the request
        // In a real app, this would come from the authenticated user session
        if (!isset($input['admin_id']) || empty($input['admin_id'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'admin_id is required']);
            exit;
        }
        
        $admin_id = $input['admin_id'];
        
        // Insert new pengeluaran
        $createResponse = makeSupabaseRequest('/pengeluaran', 'POST', [
            'id_admin' => $admin_id,
            'id_kategori' => $id_kategori,
            'jumlah' => $jumlah,
            'keterangan' => $keterangan,
            'tanggal_pengeluaran' => $tanggal_pengeluaran
        ]);
        
        if (isset($createResponse['error'])) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $createResponse['error']['message'] ?? $createResponse['error']]);
            exit;
        }
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Pengeluaran recorded successfully'
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to record pengeluaran: ' . $e->getMessage()]);
        exit;
    }
    
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}
?>