// assets/js/admin.js - Admin dashboard specific functionality
// Import the supabase instance from config
let supabase;
let currentUserId = null;

// Load config and initialize when the page loads
document.addEventListener('DOMContentLoaded', async function() {
    // Load config module
    const configModule = await import('./config.js');
    supabase = configModule.supabase;
    
    // Check if user is authenticated and has admin role
    checkUserAuth();
    
    // Load today's reservations
    loadTodaysReservations();
    
    // Set up event listeners for search functionality
    setupSearchEvents();
    
    // Set up modal functionality
    setupModalEvents();
    
    // Set up keuangan functionality
    setupKeuanganEvents();
    
    // Load categories for the pengeluaran form
    loadCategories();
});

// Function to check if user is authenticated and is an admin
async function checkUserAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (!session) {
        // No active session, redirect to login
        window.location.href = 'index.html';
        return;
    }
    
    // Get user ID from session
    currentUserId = session.user.id;
    
    // Verify user role is admin
    const { data: userData, error: userError } = await supabase
        .from('pengguna')
        .select('peran')
        .eq('id_pengguna', currentUserId)
        .single();
    
    if (userError || !userData || userData.peran !== 'admin') {
        // Not an admin, redirect to login
        window.location.href = 'index.html';
    }
}

// Function to load today's reservations from Supabase
async function loadTodaysReservations() {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    try {
        // Query reservations for today with user information
        const { data: reservations, error } = await supabase
            .from('reservasi')
            .select(`
                id_reservasi,
                kode_reservasi,
                tanggal_pendakian,
                jumlah_pendaki,
                total_harga,
                status,
                jumlah_potensi_sampah,
                status_sampah,
                dipesan_pada,
                pengguna!inner(nama_lengkap)
            `)
            .eq('tanggal_pendakian', today)
            .order('dipesan_pada', { ascending: false });
        
        if (error) {
            console.error('Error fetching reservations:', error);
            showMessage('Error saat mengambil data reservasi', 'error');
            return;
        }
        
        // Update the UI with the reservations data
        updateReservationsTable(reservations);
    } catch (err) {
        console.error('Error fetching reservations:', err);
        showMessage('Error saat mengambil data reservasi', 'error');
    }
}

// Function to update the reservations table with data
function updateReservationsTable(reservations) {
    const tableBody = document.getElementById('reservasi-tbody');
    const jumlahEntri = document.getElementById('jumlah-entri');
    const totalEntri = document.getElementById('total-entri');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    if (!reservations || reservations.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-5 py-5 border-b border-gray-200 bg-white text-center text-sm">
                    <p class="text-gray-700">Tidak ada reservasi untuk hari ini</p>
                </td>
            </tr>
        `;
        jumlahEntri.textContent = '0';
        totalEntri.textContent = '0';
        return;
    }
    
    // Populate table with reservation data
    reservations.forEach(res => {
        const row = document.createElement('tr');
        
        // Format status for display
        let statusText = '';
        let statusClass = '';
        switch (res.status) {
            case 'menunggu_pembayaran':
                statusText = 'Menunggu Pembayaran';
                statusClass = 'text-yellow-600';
                break;
            case 'terkonfirmasi':
                statusText = 'Terkonfirmasi';
                statusClass = 'text-green-600';
                break;
            case 'dibatalkan':
                statusText = 'Dibatalkan';
                statusClass = 'text-red-600';
                break;
            case 'selesai':
                statusText = 'Selesai';
                statusClass = 'text-blue-600';
                break;
            default:
                statusText = res.status;
                statusClass = 'text-gray-600';
        }
        
        // Format date for display
        const formattedDate = new Date(res.tanggal_pendakian).toLocaleDateString('id-ID');
        
        row.innerHTML = `
            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <p class="text-gray-900 whitespace-no-wrap">${res.kode_reservasi}</p>
            </td>
            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <p class="text-gray-900 whitespace-no-wrap">${res.pengguna.nama_lengkap}</p>
            </td>
            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <p class="text-gray-900 whitespace-no-wrap">${formattedDate}</p>
            </td>
            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <p class="text-gray-900 whitespace-no-wrap">${res.jumlah_pendaki}</p>
            </td>
            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <span class="${statusClass} font-medium">${statusText}</span>
            </td>
            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <button class="bg-blue-500 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm mr-2 detail-btn"
                    data-reservasi-id="${res.id_reservasi}">
                    Detail
                </button>
                ${res.status === 'menunggu_pembayaran' ? 
                    `<button class="bg-green-500 hover:bg-green-700 text-white py-1 px-3 rounded text-sm confirm-btn"
                        data-reservasi-id="${res.id_reservasi}">
                        Konfirmasi
                    </button>` : 
                    `<span class="text-gray-500 text-sm">-</span>`
                }
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Update entry counts
    jumlahEntri.textContent = reservations.length;
    totalEntri.textContent = reservations.length;
    
    // Add event listeners to the new buttons
    setupTableEvents();
}

// Function to set up table event listeners
function setupTableEvents() {
    // Add event listeners for detail buttons
    document.querySelectorAll('.detail-btn').forEach(button => {
        button.addEventListener('click', function() {
            const reservasiId = this.getAttribute('data-reservasi-id');
            showReservationDetail(reservasiId);
        });
    });
    
    // Add event listeners for confirm buttons
    document.querySelectorAll('.confirm-btn').forEach(button => {
        button.addEventListener('click', function() {
            const reservasiId = this.getAttribute('data-reservasi-id');
            confirmPayment(reservasiId);
        });
    });
}

// Function to show reservation detail in modal
async function showReservationDetail(reservasiId) {
    try {
        // Get reservation details
        const { data: reservation, error: resError } = await supabase
            .from('reservasi')
            .select(`
                *,
                pengguna!inner(nama_lengkap)
            `)
            .eq('id_reservasi', reservasiId)
            .single();
        
        if (resError) {
            console.error('Error fetching reservation:', resError);
            showMessage('Error saat mengambil detail reservasi', 'error');
            return;
        }
        
        // Get pendaki rombongan details
        const { data: pendakiList, error: pendakiError } = await supabase
            .from('pendaki_rombongan')
            .select('*')
            .eq('id_reservasi', reservasiId);
        
        if (pendakiError) {
            console.error('Error fetching pendaki list:', pendakiError);
            showMessage('Error saat mengambil data pendaki rombongan', 'error');
            return;
        }
        
        // Get barang bawaan sampah details
        const { data: barangList, error: barangError } = await supabase
            .from('barang_bawaan_sampah')
            .select('*')
            .eq('id_reservasi', reservasiId);
        
        if (barangError) {
            console.error('Error fetching barang list:', barangError);
            showMessage('Error saat mengambil data barang bawaan', 'error');
            return;
        }
        
        // Update modal content
        document.getElementById('modal-title').textContent = `Detail Reservasi: ${reservation.kode_reservasi}`;
        
        // Populate pendaki list
        const rombonganList = document.getElementById('rombongan-list');
        rombonganList.innerHTML = '';
        
        if (pendakiList && pendakiList.length > 0) {
            pendakiList.forEach(pendaki => {
                const listItem = document.createElement('li');
                listItem.className = 'mb-1';
                listItem.innerHTML = `
                    <strong>${pendaki.nama_lengkap}</strong> (Ketua: ${pendaki.nama_lengkap === reservation.pengguna.nama_lengkap ? 'Ya' : 'Tidak'})<br>
                    <span class="ml-4">NIK: ${pendaki.nik}</span><br>
                    <span class="ml-4">Alamat: ${pendaki.alamat}</span><br>
                    <span class="ml-4">No. Telp: ${pendaki.nomor_telepon}</span><br>
                    <span class="ml-4">Kontak Darurat: ${pendaki.kontak_darurat}</span>
                `;
                rombonganList.appendChild(listItem);
            });
        } else {
            rombonganList.innerHTML = '<li class="text-gray-500">Tidak ada data pendaki rombongan</li>';
        }
        
        // Populate barang list
        const barangListElement = document.getElementById('barang-list');
        barangListElement.innerHTML = '';
        
        if (barangList && barangList.length > 0) {
            barangList.forEach(barang => {
                const listItem = document.createElement('li');
                listItem.textContent = `${barang.nama_barang} (${barang.jenis_sampah})`;
                barangListElement.appendChild(listItem);
            });
        } else {
            barangListElement.innerHTML = '<li class="text-gray-500">Tidak ada data barang bawaan</li>';
        }
        
        // Show/hide confirm payment button based on status
        const confirmPaymentBtn = document.getElementById('confirmPayment');
        if (reservation.status === 'menunggu_pembayaran') {
            confirmPaymentBtn.classList.remove('hidden');
            confirmPaymentBtn.setAttribute('data-reservasi-id', reservasiId);
        } else {
            confirmPaymentBtn.classList.add('hidden');
        }
        
        // Show the modal
        document.getElementById('detailModal').classList.remove('hidden');
    } catch (err) {
        console.error('Error showing reservation detail:', err);
        showMessage('Error saat menampilkan detail reservasi', 'error');
    }
}

// Function to confirm payment via backend API
async function confirmPayment(reservasiId) {
    try {
        // Show confirmation
        if (!confirm('Apakah Anda yakin ingin mengkonfirmasi pembayaran ini?')) {
            return;
        }

        // Prepare the request payload
        const payload = {
            id_reservasi: parseInt(reservasiId),
            id_admin: parseInt(currentUserId) // Using current user ID as admin ID
        };

        // Call the backend API
        const response = await fetch('api/konfirmasi_pembayaran.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.status === 'sukses') {
            showMessage(result.message, 'success');
            
            // Close the modal
            document.getElementById('detailModal').classList.add('hidden');
            
            // Reload the reservations table
            loadTodaysReservations();
        } else {
            showMessage(result.message || 'Error saat mengkonfirmasi pembayaran', 'error');
        }
    } catch (err) {
        console.error('Error confirming payment:', err);
        showMessage('Error saat mengkonfirmasi pembayaran', 'error');
    }
}

// Function to set up search event listeners
function setupSearchEvents() {
    const searchKode = document.getElementById('search-kode');
    const searchNama = document.getElementById('search-nama');
    const searchButton = document.querySelector('button.bg-green-600');
    
    // Search button event
    searchButton.addEventListener('click', performSearch);
    
    // Also allow Enter key to trigger search
    searchKode.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    searchNama.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

// Function to perform search
async function performSearch() {
    const searchKode = document.getElementById('search-kode').value.trim();
    const searchNama = document.getElementById('search-nama').value.trim();
    
    // If both fields are empty, load today's reservations
    if (!searchKode && !searchNama) {
        loadTodaysReservations();
        return;
    }
    
    // Build query based on search terms
    let query = supabase
        .from('reservasi')
        .select(`
            id_reservasi,
            kode_reservasi,
            tanggal_pendakian,
            jumlah_pendaki,
            total_harga,
            status,
            jumlah_potensi_sampah,
            status_sampah,
            dipesan_pada,
            pengguna!inner(nama_lengkap)
        `)
        .order('dipesan_pada', { ascending: false });
    
    // Add filters based on search terms
    if (searchKode) {
        query = query.ilike('kode_reservasi', `%${searchKode}%`);
    }
    
    if (searchNama) {
        query = query.ilike('pengguna.nama_lengkap', `%${searchNama}%`);
    }
    
    try {
        const { data: reservations, error } = await query;
        
        if (error) {
            console.error('Error searching reservations:', error);
            showMessage('Error saat mencari reservasi', 'error');
            return;
        }
        
        // Update the UI with the search results
        updateReservationsTable(reservations);
    } catch (err) {
        console.error('Error searching reservations:', err);
        showMessage('Error saat mencari reservasi', 'error');
    }
}

// Function to set up modal event listeners
function setupModalEvents() {
    const modal = document.getElementById('detailModal');
    const closeModalBtn = document.getElementById('closeModal');
    const cancelModalBtn = document.getElementById('cancelModal');
    const confirmPaymentBtn = document.getElementById('confirmPayment');
    
    // Close modal functions
    function closeModal() {
        modal.classList.add('hidden');
    }
    
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);
    
    // Close modal when clicking outside the content
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // Confirm payment button event (will be updated when modal is shown)
    confirmPaymentBtn.addEventListener('click', function() {
        const reservasiId = this.getAttribute('data-reservasi-id');
        confirmPayment(reservasiId);
    });
}

// Function to set up keuangan event listeners
function setupKeuanganEvents() {
    // Add event listeners for the sidebar navigation
    document.getElementById('nav-reservasi').addEventListener('click', function(e) {
        e.preventDefault();
        showSection('reservasi');
    });
    
    document.getElementById('nav-kuota').addEventListener('click', function(e) {
        e.preventDefault();
        showSection('kuota');
    });
    
    document.getElementById('nav-keuangan').addEventListener('click', function(e) {
        e.preventDefault();
        showSection('keuangan');
    });
    
    // Add event listeners for the tab navigation
    document.getElementById('laporan-tab').addEventListener('click', function() {
        showKeuanganTab('laporan');
    });
    
    document.getElementById('pengeluaran-tab').addEventListener('click', function() {
        showKeuanganTab('pengeluaran');
    });
    
    // Add event listener for the show report button
    document.getElementById('show-report').addEventListener('click', loadFinancialReport);
    
    // Add event listener for the pengeluaran form
    document.getElementById('pengeluaran-form').addEventListener('submit', submitPengeluaranForm);
    
    // Set today's date as default for date inputs
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tanggal-pengeluaran').value = today;
    document.getElementById('date-from').value = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ago
    document.getElementById('date-to').value = today;
}

// Function to show different sections
function showSection(section) {
    // Update page title
    const pageTitle = document.getElementById('page-title');
    
    // Hide all content sections
    document.getElementById('reservasi-content').classList.add('hidden');
    document.getElementById('keuangan-content').classList.add('hidden');
    
    // Update sidebar active state
    const sidebarLinks = document.querySelectorAll('.bg-green-800 a');
    sidebarLinks.forEach(link => link.classList.remove('bg-green-700', 'font-medium'));
    
    if (section === 'reservasi') {
        document.getElementById('reservasi-content').classList.remove('hidden');
        pageTitle.textContent = 'Manajemen Reservasi';
        sidebarLinks[0].classList.add('bg-green-700', 'font-medium'); // First link (reservasi)
    } else if (section === 'kuota') {
        document.getElementById('reservasi-content').classList.add('hidden');
        pageTitle.textContent = 'Manajemen Kuota';
        sidebarLinks[1].classList.add('bg-green-700', 'font-medium'); // Second link (kuota)
        showMessage('Fitur Manajemen Kuota akan segera hadir', 'info');
    } else if (section === 'keuangan') {
        document.getElementById('keuangan-content').classList.remove('hidden');
        pageTitle.textContent = 'Manajemen Keuangan';
        sidebarLinks[2].classList.add('bg-green-700', 'font-medium'); // Third link (keuangan)
        
        // Load the financial report by default
        loadFinancialReport();
    }
}

// Function to show different tabs in keuangan section
function showKeuanganTab(tab) {
    // Hide all tab content
    document.getElementById('laporan-content').classList.add('hidden');
    document.getElementById('pengeluaran-content').classList.add('hidden');
    
    // Update tab active state
    const tabs = document.querySelectorAll('#laporan-tab, #pengeluaran-tab');
    tabs.forEach(tab => tab.classList.remove('active', 'text-blue-600', 'border-blue-600'));
    
    if (tab === 'laporan') {
        document.getElementById('laporan-content').classList.remove('hidden');
        document.getElementById('laporan-tab').classList.add('active', 'text-blue-600', 'border-blue-600');
    } else if (tab === 'pengeluaran') {
        document.getElementById('pengeluaran-content').classList.remove('hidden');
        document.getElementById('pengeluaran-tab').classList.add('active', 'text-blue-600', 'border-blue-600');
    }
}

// Function to load financial report based on date range
async function loadFinancialReport() {
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;
    
    if (!dateFrom || !dateTo) {
        showMessage('Silakan lengkapi rentang tanggal', 'error');
        return;
    }
    
    try {
        // Get all pemasukan for the date range
        const { data: pemasukan, error: pemasukanError } = await supabase
            .from('pemasukan')
            .select(`
                jumlah,
                keterangan,
                tanggal_pemasukan,
                reservasi!inner(kode_reservasi)
            `)
            .gte('tanggal_pemasukan', dateFrom)
            .lte('tanggal_pemasukan', dateTo)
            .order('tanggal_pemasukan', { ascending: false });
        
        if (pemasukanError) {
            console.error('Error fetching pemasukan:', pemasukanError);
            showMessage('Error saat mengambil data pemasukan', 'error');
            return;
        }
        
        // Get all pengeluaran for the date range
        const { data: pengeluaran, error: pengeluaranError } = await supabase
            .from('pengeluaran')
            .select(`
                jumlah,
                keterangan,
                tanggal_pengeluaran,
                kategori_pengeluaran!inner(nama_kategori)
            `)
            .gte('tanggal_pengeluaran', dateFrom)
            .lte('tanggal_pengeluaran', dateTo)
            .order('tanggal_pengeluaran', { ascending: false });
        
        if (pengeluaranError) {
            console.error('Error fetching pengeluaran:', pengeluaranError);
            showMessage('Error saat mengambil data pengeluaran', 'error');
            return;
        }
        
        // Update the pemasukan table
        updatePemasukanTable(pemasukan);
        
        // Update the pengeluaran table
        updatePengeluaranTable(pengeluaran);
        
        // Calculate and display summary
        calculateAndDisplaySummary(pemasukan, pengeluaran);
    } catch (err) {
        console.error('Error loading financial report:', err);
        showMessage('Error saat mengambil laporan keuangan', 'error');
    }
}

// Function to update the pemasukan table
function updatePemasukanTable(pemasukan) {
    const tableBody = document.getElementById('pemasukan-tbody');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    if (!pemasukan || pemasukan.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="px-5 py-5 border-b border-gray-200 bg-white text-center text-sm">
                    <p class="text-gray-700">Tidak ada data pemasukan untuk rentang tanggal ini</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Populate table with pemasukan data
    pemasukan.forEach(pem => {
        const row = document.createElement('tr');
        const formattedDate = new Date(pem.tanggal_pemasukan).toLocaleDateString('id-ID');
        
        row.innerHTML = `
            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <p class="text-gray-900 whitespace-no-wrap">${formattedDate}</p>
            </td>
            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <p class="text-gray-900 whitespace-no-wrap">${pem.keterangan} (${pem.reservasi.kode_reservasi})</p>
            </td>
            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <p class="text-gray-900 whitespace-no-wrap text-right">Rp ${pem.jumlah.toLocaleString('id-ID')}</p>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Function to update the pengeluaran table
function updatePengeluaranTable(pengeluaran) {
    const tableBody = document.getElementById('pengeluaran-tbody');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    if (!pengeluaran || pengeluaran.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="px-5 py-5 border-b border-gray-200 bg-white text-center text-sm">
                    <p class="text-gray-700">Tidak ada data pengeluaran untuk rentang tanggal ini</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Populate table with pengeluaran data
    pengeluaran.forEach(peng => {
        const row = document.createElement('tr');
        const formattedDate = new Date(peng.tanggal_pengeluaran).toLocaleDateString('id-ID');
        
        row.innerHTML = `
            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <p class="text-gray-900 whitespace-no-wrap">${formattedDate}</p>
            </td>
            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <p class="text-gray-900 whitespace-no-wrap">${peng.kategori_pengeluaran.nama_kategori}</p>
            </td>
            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <p class="text-gray-900 whitespace-no-wrap text-right">Rp ${peng.jumlah.toLocaleString('id-ID')}</p>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Function to calculate and display summary
function calculateAndDisplaySummary(pemasukan, pengeluaran) {
    // Calculate total pemasukan
    const totalPemasukan = pemasukan.reduce((sum, p) => sum + p.jumlah, 0);
    
    // Calculate total pengeluaran
    const totalPengeluaran = pengeluaran.reduce((sum, p) => sum + p.jumlah, 0);
    
    // Calculate saldo
    const saldo = totalPemasukan - totalPengeluaran;
    
    // Format and display values
    document.getElementById('total-pemasukan').textContent = `Rp ${totalPemasukan.toLocaleString('id-ID')}`;
    document.getElementById('total-pengeluaran').textContent = `Rp ${totalPengeluaran.toLocaleString('id-ID')}`;
    document.getElementById('saldo-akhir').textContent = `Rp ${saldo.toLocaleString('id-ID')}`;
}

// Function to load categories for the pengeluaran form
async function loadCategories() {
    try {
        const { data: categories, error } = await supabase
            .from('kategori_pengeluaran')
            .select('id_kategori, nama_kategori')
            .order('nama_kategori', { ascending: true });
        
        if (error) {
            console.error('Error fetching categories:', error);
            showMessage('Error saat mengambil kategori pengeluaran', 'error');
            return;
        }
        
        // Update the category dropdown
        const categorySelect = document.getElementById('kategori-pengeluaran');
        categorySelect.innerHTML = '<option value="">Pilih Kategori</option>';
        
        if (categories && categories.length > 0) {
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id_kategori;
                option.textContent = cat.nama_kategori;
                categorySelect.appendChild(option);
            });
        }
    } catch (err) {
        console.error('Error loading categories:', err);
        showMessage('Error saat mengambil kategori pengeluaran', 'error');
    }
}

// Function to submit the pengeluaran form
async function submitPengeluaranForm(e) {
    e.preventDefault();
    
    // Get form values
    const jumlah = document.getElementById('jumlah-pengeluaran').value;
    const tanggal = document.getElementById('tanggal-pengeluaran').value;
    const keterangan = document.getElementById('keterangan-pengeluaran').value;
    const kategori = document.getElementById('kategori-pengeluaran').value;
    
    // Validate inputs
    if (!jumlah || !tanggal || !keterangan || !kategori) {
        showMessage('Silakan lengkapi semua field', 'error');
        return;
    }
    
    // Validate jumlah is numeric and positive
    if (isNaN(jumlah) || parseFloat(jumlah) <= 0) {
        showMessage('Jumlah pengeluaran harus berupa angka positif', 'error');
        return;
    }
    
    try {
        // Insert new pengeluaran record
        const { data, error } = await supabase
            .from('pengeluaran')
            .insert({
                id_admin: currentUserId,
                id_kategori: kategori,
                jumlah: parseInt(jumlah),
                keterangan: keterangan,
                tanggal_pengeluaran: tanggal
            });
        
        if (error) {
            console.error('Error inserting pengeluaran:', error);
            showMessage('Error saat menyimpan pengeluaran', 'error');
            return;
        }
        
        // Show success message
        showMessage('Pengeluaran berhasil dicatat', 'success');
        
        // Reset the form
        document.getElementById('pengeluaran-form').reset();
        
        // Set today's date again
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('tanggal-pengeluaran').value = today;
        
        // Reload the financial report if currently in the laporan tab
        const laporanTab = document.getElementById('laporan-content');
        if (!laporanTab.classList.contains('hidden')) {
            loadFinancialReport();
        }
    } catch (err) {
        console.error('Error submitting pengeluaran:', err);
        showMessage('Error saat menyimpan pengeluaran', 'error');
    }
}

// Function to show a message (success or error)
function showMessage(message, type) {
    const messageContainer = document.getElementById('message-container');
    const messageContent = document.getElementById('message-content');
    
    // Set message content and style based on type
    messageContent.textContent = message;
    
    // Apply different styles based on message type
    if (type === 'success') {
        messageContent.className = 'px-6 py-4 rounded-lg shadow-lg bg-green-500 text-white max-w-xs';
    } else if (type === 'error') {
        messageContent.className = 'px-6 py-4 rounded-lg shadow-lg bg-red-500 text-white max-w-xs';
    } else if (type === 'info') {
        messageContent.className = 'px-6 py-4 rounded-lg shadow-lg bg-blue-500 text-white max-w-xs';
    } else {
        messageContent.className = 'px-6 py-4 rounded-lg shadow-lg bg-gray-500 text-white max-w-xs';
    }
    
    // Show the message container
    messageContainer.classList.remove('hidden');
    
    // Hide the message after 5 seconds
    setTimeout(() => {
        messageContainer.classList.add('hidden');
    }, 5000);
}