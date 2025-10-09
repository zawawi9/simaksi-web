<?php
// Test upload to Supabase Storage
require_once 'config_storage.php';

header('Content-Type: application/json');

// Generate a test PDF content
$test_pdf_content = "%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n50 750 Td\n(Test PDF for Surat Sehat) Tj\nET\nendstream\nendobj\n5 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000079 00000 n \n0000000144 00000 n \n0000000236 00000 n \n0000000332 00000 n \ntrailer\n<<\n/Size 6\n/Root 1 0 R\n>>\nstartxref\n400\n%%EOF";

// Generate nama file unik
$new_filename = 'test_surat_sehat_' . date('Ymd_His') . '_' . uniqid() . '.pdf';

// Upload ke Supabase Storage
$upload_result = uploadToSupabaseStorage($new_filename, $test_pdf_content, 'surat-sehat');

if ($upload_result['success']) {
    echo json_encode([
        'success' => true,
        'message' => 'Test upload berhasil',
        'file_url' => getSupabaseStoragePublicUrl($new_filename, 'surat-sehat'),
        'file_name' => $new_filename
    ]);
} else {
    echo json_encode([
        'success' => false,
        'error' => 'Test upload gagal: ' . $upload_result['error']
    ]);
}
?>