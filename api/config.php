<?php
// Supabase configuration
$supabaseUrl = 'https://kitxtcpfnccblznbagzx.supabase.co/rest/v1';
$supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdHh0Y3BmbmNjYmx6bmJhZ3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODIxMzEsImV4cCI6MjA3NTE1ODEzMX0.OySigpw4AWI3G7JW_8r8yXu7re0Mr9CYv8u3d9Fr548'; // anon key
$serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdHh0Y3BmbmNjYmx6bmJhZ3p4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU4MjEzMSwiZXhwIjoyMDc1MTU4MTMxfQ.eSggC5imTRztxGNQyW9exZTQo3CU-8QmZ54BhfUDTcE'; // service role key

// Set headers for Supabase API requests
$headers = [
    'Content-Type: application/json',
    'apikey: ' . $supabaseKey,
    'Authorization: Bearer ' . $serviceRoleKey,
    'Prefer: return=representation'
];

// Supabase Storage configuration
$storageUrl = str_replace('/rest/v1', '/storage/v1', $supabaseUrl);

// Headers for Storage API requests
$storageHeaders = [
    'Authorization: Bearer ' . $serviceRoleKey,
    'apikey: ' . $serviceRoleKey
];

// Function to make API requests to Supabase
function makeSupabaseRequest($endpoint, $method = 'GET', $data = null) {
    global $supabaseUrl, $headers;
    
    // Handle query parameters differently from path endpoints
    $url_parts = explode('?', $endpoint, 2);
    $path = $url_parts[0];
    $query = isset($url_parts[1]) ? '?' . $url_parts[1] : '';
    
    // Remove leading slash if it exists and check the endpoint format
    $url = rtrim($supabaseUrl, '/') . '/' . ltrim($path, '/') . $query;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Set to true in production
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false); // Set to true in production
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 3);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30); // 30 second timeout
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'); // Set a user agent
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10); // Connection timeout
    curl_setopt($ch, CURLOPT_ENCODING, ''); // Accept all encodings
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    } elseif ($method === 'PUT') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    } elseif ($method === 'PATCH') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    } elseif ($method === 'DELETE') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    $totalTime = curl_getinfo($ch, CURLINFO_TOTAL_TIME);
    
    curl_close($ch);
    
    if ($curlError) {
        error_log("CURL Error: " . $curlError . " (Total time: {$totalTime}s)");
        return ['error' => 'Curl error: ' . $curlError];
    }
    
    // Log the response for debugging if it's not JSON
    $result = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("Invalid JSON response: HTTP " . $httpCode . " - " . $response);
        return ['error' => 'Invalid JSON response: HTTP ' . $httpCode . ' - ' . $response];
    }
    
    if ($httpCode >= 400) {
        error_log("HTTP error: " . $httpCode . " - " . $response);
        return ['error' => 'HTTP error: ' . $httpCode . ' - ' . $response];
    }
    
    return [
        'status_code' => $httpCode,
        'data' => $result
    ];
}

// Function to upload file to Supabase Storage
function uploadToSupabaseStorage($filePath, $fileContent, $bucket = 'surat-sehat') {
    global $storageUrl, $storageHeaders;
    
    $uploadUrl = $storageUrl . '/object/' . $bucket . '/' . $filePath;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $uploadUrl);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $fileContent);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $storageHeaders);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60); // 60 second timeout for larger files
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    
    curl_close($ch);
    
    if ($curlError) {
        return [
            'success' => false,
            'error' => 'Curl error: ' . $curlError
        ];
    }
    
    if ($httpCode >= 400) {
        return [
            'success' => false,
            'error' => 'HTTP error: ' . $httpCode . ' - ' . $response
        ];
    }
    
    return [
        'success' => true,
        'response' => $response
    ];
}

// Function to delete file from Supabase Storage
function deleteFromSupabaseStorage($filePath, $bucket = 'surat-sehat') {
    global $storageUrl, $storageHeaders;
    
    $deleteUrl = $storageUrl . '/object/' . $bucket . '/' . $filePath;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $deleteUrl);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    curl_setopt($ch, CURLOPT_HTTPHEADER, $storageHeaders);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    
    curl_close($ch);
    
    if ($curlError) {
        return [
            'success' => false,
            'error' => 'Curl error: ' . $curlError
        ];
    }
    
    if ($httpCode >= 400) {
        return [
            'success' => false,
            'error' => 'HTTP error: ' . $httpCode . ' - ' . $response
        ];
    }
    
    return [
        'success' => true,
        'response' => $response
    ];
}

// Function to get public URL for a file in Supabase Storage
function getSupabaseStoragePublicUrl($filePath, $bucket = 'surat-sehat') {
    global $storageUrl;
    
    // Extract project ref from original URL
    $projectRef = parse_url($storageUrl, PHP_URL_HOST);
    $projectRef = explode('.', $projectRef)[0]; // Get the first part of the hostname
    
    return "https://{$projectRef}.supabase.co/storage/v1/object/public/{$bucket}/{$filePath}";
}
?>