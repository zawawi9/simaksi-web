# Dokumentasi Sistem Upload Surat Sehat

Dokumentasi ini menjelaskan mekanisme upload surat sehat dalam aplikasi SIMAKSI, termasuk implementasi di sisi web dan panduan implementasi untuk aplikasi Android menggunakan Java.

## 1. Arsitektur Sistem

### Jalur Proses Upload Surat Sehat

1. **Form HTML (bikin_reservasi.html)**:
   - Setiap anggota rombongan memiliki form input file surat sehat
   - Input file terletak di bagian formulir pendaki

2. **JavaScript Frontend**:
   - File diupload terlebih dahulu ke endpoint PHP sebelum data reservasi disimpan
   - Menggunakan fungsi `fetch()` untuk mengupload file ke `api/upload_surat_sehat_to_supabase.php`
   - Proses upload dilakukan sebelum menyimpan data reservasi utama

3. **Backend PHP**:
   - Menerima file dari frontend
   - Melakukan validasi (PDF saja, maksimal 5MB)
   - Upload ke Supabase Storage menggunakan fungsi `uploadToSupabaseStorage()`
   - Mengembalikan URL file yang dapat diakses publik

4. **Supabase Storage**:
   - Menggunakan API Supabase Storage untuk menyimpan file
   - File disimpan dalam bucket bernama `surat-sehat`
   - URL publik dibangun untuk akses file

## 2. Implementasi Web (Frontend)

### Struktur Form Upload

```html
<input type="file" id="surat-sehat-${i}" class="input-modern w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500">
```

### Proses Upload JavaScript

```javascript
// Di fungsi buatReservasi()
const fileUploadPromises = [];
for (let i = 1; i <= jumlahPendaki; i++) {
    const suratSehatFile = document.getElementById(`surat-sehat-${i}`)?.files[0];
    if (suratSehatFile) {
        // Validasi file type dan size
        if (suratSehatFile.type !== 'application/pdf') {
            alert(`File surat sehat untuk anggota rombongan ${i} harus berupa PDF`);
            return;
        }
        
        if (suratSehatFile.size > 5 * 1024 * 1024) {
            alert(`File surat sehat untuk anggota rombongan ${i} terlalu besar. Maksimal 5MB`);
            return;
        }
        
        // Upload ke endpoint PHP
        const formData = new FormData();
        formData.append('surat_sehat', suratSehatFile);
        
        const uploadPromise = fetch('api/upload_surat_sehat_to_supabase.php', {
            method: 'POST',
            body: formData
        }).then(response => response.json())
        .then(result => {
            if (result.success) {
                return { index: i, url: result.file_url };
            } else {
                throw new Error(result.error || 'Gagal mengupload file');
            }
        });
        
        fileUploadPromises.push(uploadPromise);
    }
}

// Tunggu semua upload selesai sebelum menyimpan data reservasi
const uploadedFiles = await Promise.all(fileUploadPromises);
```

## 3. Implementasi Backend PHP

### File `api/upload_surat_sehat_to_supabase.php`

```php
<?php
require_once 'config.php';

// Validasi dan proses file
if (!isset($_FILES['surat_sehat'])) {
    http_response_code(400);
    echo json_encode(['error' => 'File surat sehat tidak ditemukan']);
    exit;
}

$file = $_FILES['surat_sehat'];

// Validasi file - hanya PDF
$allowed_types = ['application/pdf'];
$max_size = 5 * 1024 * 1024; // 5MB

if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Error saat mengupload file: ' . $file['error']]);
    exit;
}

if ($file['size'] > $max_size) {
    http_response_code(400);
    echo json_encode(['error' => 'File terlalu besar. Maksimal 5MB']);
    exit;
}

if (!in_array($file['type'], $allowed_types)) {
    http_response_code(400);
    echo json_encode(['error' => 'Jenis file tidak diizinkan. Hanya PDF yang diperbolehkan']);
    exit;
}

// Validasi ekstensi
$file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if ($file_extension !== 'pdf') {
    http_response_code(400);
    echo json_encode(['error' => 'Hanya file PDF yang diizinkan']);
    exit;
}

// Generate nama file unik
$new_filename = 'surat_sehat_' . date('Ymd_His') . '_' . uniqid() . '.pdf';

// Baca isi file dan upload ke Supabase Storage
$file_content = file_get_contents($file['tmp_name']);
$upload_result = uploadToSupabaseStorage($new_filename, $file_content, 'surat-sehat');

if (!$upload_result['success']) {
    http_response_code(500);
    echo json_encode(['error' => 'Gagal mengupload ke Supabase Storage: ' . $upload_result['error']]);
    exit;
}

// Kembalikan URL file dari Supabase Storage
$file_url = getSupabaseStoragePublicUrl($new_filename, 'surat-sehat');

echo json_encode([
    'success' => true,
    'file_url' => $file_url,
    'file_name' => $new_filename,
    'message' => 'File berhasil diupload ke Supabase Storage'
]);
?>
```

### File `api/config.php` - Fungsi Upload ke Supabase Storage

```php
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

// Function to get public URL for a file in Supabase Storage
function getSupabaseStoragePublicUrl($filePath, $bucket = 'surat-sehat') {
    global $storageUrl;
    
    // Extract project ref from original URL
    $projectRef = parse_url($storageUrl, PHP_URL_HOST);
    $projectRef = explode('.', $projectRef)[0]; // Get the first part of the hostname
    
    return "https://{$projectRef}.supabase.co/storage/v1/object/public/{$bucket}/{$filePath}";
}
```

## 4. Implementasi Android Java

Berikut adalah implementasi Java untuk mengupload file ke Supabase Storage dalam aplikasi Android.

### Dependencies

Tambahkan dependencies berikut di `build.gradle` (Module: app):

```gradle
implementation 'com.squareup.okhttp3:okhttp:4.12.0'
implementation 'com.google.code.gson:gson:2.10.1'
```

### Kelas SupabaseFileUploader

```java
import okhttp3.*;
import org.json.JSONObject;
import java.io.File;
import java.io.IOException;
import java.util.UUID;

public class SupabaseFileUploader {
    // Konfigurasi Supabase
    private static final String SUPABASE_URL = "https://kitxtcpfnccblznbagzx.supabase.co/storage/v1";
    private static final String SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdHh0Y3BmbmNjYmx6bmJhZ3p4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU4MjEzMSwiZXhwIjoyMDc1MTU4MTMxfQ.eSggC5imTRztxGNQyW9exZTQo3CU-8QmZ54BhfUDTcE";
    
    private OkHttpClient client = new OkHttpClient();
    
    public interface UploadCallback {
        void onSuccess(String fileUrl);
        void onError(String error);
    }
    
    public void uploadHealthCertificate(File file, String bucketName, UploadCallback callback) {
        // Validasi file
        if (!isValidHealthCertificate(file)) {
            callback.onError("File tidak valid. Hanya file PDF dengan ukuran maksimal 5MB yang diperbolehkan.");
            return;
        }
        
        // Membuat nama file unik
        String fileName = "surat_sehat_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString() + ".pdf";
        
        // Membuat request body untuk upload
        RequestBody fileBody = RequestBody.create(file, MediaType.parse("application/pdf"));
        RequestBody requestBody = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("file", fileName, fileBody)
                .build();
        
        // Membuat request ke Supabase Storage
        Request request = new Request.Builder()
                .url(SUPABASE_URL + "/object/" + bucketName + "/" + fileName)
                .post(requestBody)
                .addHeader("Authorization", "Bearer " + SERVICE_ROLE_KEY)
                .addHeader("apikey", SERVICE_ROLE_KEY)
                .build();
        
        // Eksekusi request
        client.newCall(request).enqueue(new okhttp3.Callback() {
            @Override
            public void onFailure(okhttp3.Call call, IOException e) {
                callback.onError("Upload gagal: " + e.getMessage());
            }
            
            @Override
            public void onResponse(okhttp3.Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    // Jika upload berhasil, kembalikan URL publik
                    String publicUrl = getPublicUrl(fileName, bucketName);
                    callback.onSuccess(publicUrl);
                } else {
                    callback.onError("Upload gagal: " + response.code() + " - " + response.body().string());
                }
            }
        });
    }
    
    private boolean isValidHealthCertificate(File file) {
        // Validasi ukuran file (maksimal 5MB)
        if (file.length() > 5 * 1024 * 1024) {
            return false;
        }
        
        // Validasi ekstensi file
        String fileName = file.getName().toLowerCase();
        return fileName.endsWith(".pdf");
    }
    
    private String getPublicUrl(String fileName, String bucketName) {
        // Membangun URL publik untuk file
        return SUPABASE_URL.replace("/storage/v1", "") + 
               "/object/public/" + bucketName + "/" + fileName;
    }
    
    // Metode alternatif menggunakan HTTPURLConnection jika tidak ingin menggunakan OkHttp
    public void uploadHealthCertificateWithHttpUrlConnection(File file, String bucketName, UploadCallback callback) {
        // Validasi file
        if (!isValidHealthCertificate(file)) {
            callback.onError("File tidak valid. Hanya file PDF dengan ukuran maksimal 5MB yang diperbolehkan.");
            return;
        }
        
        // Membuat nama file unik
        String fileName = "surat_sehat_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString() + ".pdf";
        
        new Thread(() -> {
            try {
                java.net.URL url = new java.net.URL(SUPABASE_URL + "/object/" + bucketName + "/" + fileName);
                javax.net.ssl.HttpsURLConnection connection = (javax.net.ssl.HttpsURLConnection) url.openConnection();
                
                // Set request method dan headers
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Authorization", "Bearer " + SERVICE_ROLE_KEY);
                connection.setRequestProperty("apikey", SERVICE_ROLE_KEY);
                connection.setRequestProperty("Content-Type", "application/pdf");
                connection.setDoOutput(true);
                
                // Kirim file
                java.io.FileInputStream fileInputStream = new java.io.FileInputStream(file);
                java.io.OutputStream outputStream = connection.getOutputStream();
                
                byte[] buffer = new byte[4096];
                int bytesRead;
                while ((bytesRead = fileInputStream.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, bytesRead);
                }
                
                fileInputStream.close();
                outputStream.close();
                
                int responseCode = connection.getResponseCode();
                
                if (responseCode == 200) {
                    // Upload berhasil
                    String publicUrl = getPublicUrl(fileName, bucketName);
                    android.os.Handler mainHandler = new android.os.Handler(android.os.Looper.getMainLooper());
                    mainHandler.post(() -> callback.onSuccess(publicUrl));
                } else {
                    // Upload gagal
                    java.io.BufferedReader reader = new java.io.BufferedReader(
                        new java.io.InputStreamReader(connection.getErrorStream())
                    );
                    String errorResponse = reader.readLine();
                    reader.close();
                    
                    android.os.Handler mainHandler = new android.os.Handler(android.os.Looper.getMainLooper());
                    mainHandler.post(() -> callback.onError("Upload gagal: " + responseCode + " - " + errorResponse));
                }
                
                connection.disconnect();
            } catch (Exception e) {
                android.os.Handler mainHandler = new android.os.Handler(android.os.Looper.getMainLooper());
                mainHandler.post(() -> callback.onError("Upload gagal: " + e.getMessage()));
            }
        }).start();
    }
}
```

### Contoh Penggunaan di Activity Android

```java
public class MainActivity extends AppCompatActivity {
    private static final int PICK_PDF_REQUEST = 1;
    private SupabaseFileUploader uploader;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        uploader = new SupabaseFileUploader();
        
        // Tombol untuk memilih file PDF
        Button selectPdfButton = findViewById(R.id.select_pdf_button);
        selectPdfButton.setOnClickListener(v -> selectPdfFile());
    }
    
    private void selectPdfFile() {
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.setType("application/pdf");
        startActivityForResult(intent, PICK_PDF_REQUEST);
    }
    
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        
        if (requestCode == PICK_PDF_REQUEST && resultCode == RESULT_OK) {
            Uri selectedPdfUri = data.getData();
            if (selectedPdfUri != null) {
                // Konversi URI ke File
                File pdfFile = getFileFromUri(selectedPdfUri);
                
                // Upload ke Supabase Storage
                uploader.uploadHealthCertificate(pdfFile, "surat-sehat", new SupabaseFileUploader.UploadCallback() {
                    @Override
                    public void onSuccess(String fileUrl) {
                        // Upload berhasil - simpan URL ke database atau gunakan sesuai kebutuhan
                        Toast.makeText(MainActivity.this, "Upload berhasil! URL: " + fileUrl, Toast.LENGTH_LONG).show();
                        
                        // Di sini Anda bisa menyimpan fileUrl ke database lokal atau kirim ke backend
                        saveToDatabase(fileUrl);
                    }
                    
                    @Override
                    public void onError(String error) {
                        // Upload gagal
                        Toast.makeText(MainActivity.this, "Upload gagal: " + error, Toast.LENGTH_LONG).show();
                    }
                });
            }
        }
    }
    
    private File getFileFromUri(Uri uri) {
        // Konversi URI ke File (harus ditangani dengan hati-hati karena Android 10+ memiliki pembatasan)
        String filePath = getRealPathFromUri(uri);
        if (filePath != null) {
            return new File(filePath);
        }
        return null;
    }
    
    private String getRealPathFromUri(Uri uri) {
        String[] projection = {android.provider.MediaStore.Images.Media.DATA};
        Cursor cursor = getContentResolver().query(uri, projection, null, null, null);
        if (cursor != null) {
            int columnIndex = cursor.getColumnIndexOrThrow(android.provider.MediaStore.Images.Media.DATA);
            cursor.moveToFirst();
            String filePath = cursor.getString(columnIndex);
            cursor.close();
            return filePath;
        }
        return null;
    }
    
    private void saveToDatabase(String fileUrl) {
        // Simpan URL file ke database lokal atau kirim ke backend
        // Implementasi sesuai kebutuhan aplikasi Anda
    }
}
```

### Permissions Android

Tambahkan permissions berikut di `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

## 5. Best Practices

1. **Keamanan**:
   - Validasi file di sisi client dan server
   - Gunakan service role key hanya di backend atau pastikan aplikasi Anda cukup aman
   - Dalam produksi, pertimbangkan menggunakan API intermediate yang aman daripada mengakses Supabase langsung dari aplikasi mobile

2. **Validasi**:
   - Validasi file sebelum upload (PDF, size limit)
   - Validasi nama file untuk mencegah masalah keamanan

3. **Error Handling**:
   - Tangani berbagai skenario error (koneksi gagal, ukuran file melebihi batas, dll)
   - Berikan feedback yang jelas kepada pengguna

4. **Thread Management**:
   - Pastikan operasi jaringan dijalankan di background thread
   - Update UI di main thread

5. **Cleanup**:
   - Hapus file temporary setelah upload selesai jika diperlukan

## 6. Troubleshooting

1. **Upload Gagal**:
   - Pastikan service role key benar dan tidak kadaluarsa
   - Cek koneksi internet
   - Pastikan ukuran file tidak melebihi batas

2. **File Tidak Valid**:
   - Pastikan file adalah PDF
   - Pastikan ukuran file tidak lebih dari 5MB

3. **Akses Forbidden**:
   - Periksa konfigurasi bucket Supabase Storage
   - Pastikan memiliki akses untuk upload ke bucket yang benar

## 7. Konfigurasi Supabase Storage

Pastikan bucket `surat-sehat` telah dibuat di Supabase Storage dan konfigurasi akses telah diatur dengan benar agar file dapat diupload dan diakses secara publik.