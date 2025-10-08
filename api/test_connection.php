<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// File untuk test koneksi supabase
require_once 'config.php';

// Test connection
echo "Testing Supabase connection...\n";

// Try to get pricing data
$response = makeSupabaseRequest('pengaturan_biaya', 'GET');

if (isset($response['error'])) {
    echo "Error getting pricing data: " . $response['error'] . "\n";
} else {
    echo "Success getting pricing data: " . json_encode($response['data']) . "\n";
}

// Test kuota harian
$tanggal = date('Y-m-d'); // today's date
$kuota_response = makeSupabaseRequest('kuota_harian?select=kuota_maksimal,kuota_terpesan&tanggal_kuota=eq.' . $tanggal, 'GET');

if (isset($kuota_response['error'])) {
    echo "Error getting quota data: " . $kuota_response['error'] . "\n";
} else {
    echo "Success getting quota data: " . json_encode($kuota_response['data']) . "\n";
}

echo "Test complete.\n";
?>