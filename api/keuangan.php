<?php
require_once 'config.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get financial report data
    $fromDate = $_GET['from_date'] ?? date('Y-m-d', strtotime('-30 days'));
    $toDate = $_GET['to_date'] ?? date('Y-m-d');
    
    // Get pemasukan data
    $pemasukanResponse = makeSupabaseRequest('/pemasukan?select=*&tanggal_pemasukan=gte.' . $fromDate . '&tanggal_pemasukan=lte.' . $toDate . '&order=tanggal_pemasukan.desc');
    if (isset($pemasukanResponse['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $pemasukanResponse['error']]);
        exit;
    }
    $pemasukanData = $pemasukanResponse['data'] ?? [];
    
    // Get pengeluaran data
    $pengeluaranResponse = makeSupabaseRequest('/pengeluaran?select=*&tanggal_pengeluaran=gte.' . $fromDate . '&tanggal_pengeluaran=lte.' . $toDate . '&order=tanggal_pengeluaran.desc');
    if (isset($pengeluaranResponse['error'])) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $pengeluaranResponse['error']]);
        exit;
    }
    $pengeluaranData = $pengeluaranResponse['data'] ?? [];
    
    // Calculate totals
    $totalPemasukan = 0;
    foreach ($pemasukanData as $pemasukan) {
        $totalPemasukan += (int)$pemasukan['jumlah'];
    }
    
    $totalPengeluaran = 0;
    foreach ($pengeluaranData as $pengeluaran) {
        $totalPengeluaran += (int)$pengeluaran['jumlah'];
    }
    
    $saldoAkhir = $totalPemasukan - $totalPengeluaran;
    
    echo json_encode([
        'status' => 'success',
        'data' => [
            'total_pemasukan' => $totalPemasukan,
            'total_pengeluaran' => $totalPengeluaran,
            'saldo_akhir' => $saldoAkhir,
            'pemasukan' => $pemasukanData,
            'pengeluaran' => $pengeluaranData
        ]
    ]);
    
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['jumlah']) || !isset($input['tanggal_pengeluaran']) || !isset($input['keterangan'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'jumlah, tanggal_pengeluaran, and keterangan are required']);
        exit;
    }
    
    $jumlah = (int)$input['jumlah'];
    $tanggal_pengeluaran = $input['tanggal_pengeluaran'];
    $keterangan = $input['keterangan'];
    $id_kategori = $input['id_kategori'] ?? null;
    $admin_id = $input['admin_id'] ?? '00000000-0000-0000-0000-000000000000'; // placeholder
    
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
        echo json_encode(['status' => 'error', 'message' => $createResponse['error']]);
        exit;
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Pengeluaran recorded successfully'
    ]);
    
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}
?>