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
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 3);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30); // 30 second timeout
    
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
    
    curl_close($ch);
    
    if ($curlError) {
        error_log("CURL Error: " . $curlError);
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
?>