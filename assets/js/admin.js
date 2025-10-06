// admin.js - Admin dashboard functionality

let supabase;

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Load config module
        const configModule = await import('./config.js');
        supabase = configModule.supabase;

        // Check if user is logged in as admin
        await checkAdminSession();

        // Set up navigation
        setupNavigation();

        // Set up logout functionality
        setupLogout();

        // Set up modal functionality
        setupModal();

        // Set up search functionality
        setupSearch();

        // Set up keuangan tabs
        setupKeuanganTabs();

        // Load initial content
        loadReservasiData();

        // Load pengeluaran form
        loadPengeluaranForm();

        // Show login tab by default
        setTimeout(() => {
            if (document.getElementById('nav-reservasi')) {
                switchContent('reservasi');
            }
        }, 100); // Small delay to ensure everything is loaded
    } catch (error) {
        console.error('Error during initialization:', error);
        // Redirect to login if initialization fails
        window.location.href = 'index.html';
    }
});

// Function to check if user is logged in as admin
async function checkAdminSession() {
    try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            console.log('No valid session found, redirecting to login');
            // Redirect to login page if not logged in
            window.location.href = 'index.html';
            return;
        }

        // Verify if user is an admin from the pengguna table
        const { data: userData, error: userError } = await supabase
            .from('pengguna')
            .select('peran, nama_lengkap')
            .eq('id_pengguna', session.user.id)
            .single();

        if (userError) {
            console.error('Error fetching user data:', userError);
            // If user is not found in pengguna table, redirect to login
            window.location.href = 'index.html';
            return;
        }

        if (!userData || userData.peran !== 'admin') {
            console.log('User is not an admin, redirecting to login');
            // Redirect to login page if not an admin
            window.location.href = 'index.html';
            return;
        }

        // Display admin name in header if element exists
        const adminNameElement = document.getElementById('admin-name');
        if (adminNameElement) {
            adminNameElement.textContent = userData.nama_lengkap || session.user.email;
        }
        
        console.log('Admin session validated successfully');
    } catch (err) {
        console.error('Error checking admin session:', err);
        window.location.href = 'index.html';
    }
}

// Function to set up navigation
function setupNavigation() {
    const navReservasi = document.getElementById('nav-reservasi');
    const navKuota = document.getElementById('nav-kuota');
    const navKeuangan = document.getElementById('nav-keuangan');

    if (navReservasi) {
        navReservasi.addEventListener('click', function(e) {
            e.preventDefault();
            switchContent('reservasi');
        });
    }

    if (navKuota) {
        navKuota.addEventListener('click', function(e) {
            e.preventDefault();
            switchContent('kuota');
        });
    }

    if (navKeuangan) {
        navKeuangan.addEventListener('click', function(e) {
            e.preventDefault();
            switchContent('keuangan');
        });
    }
}

// Function to switch between content areas
function switchContent(contentType) {
    // Hide all content areas
    document.getElementById('reservasi-content').classList.add('hidden');
    document.getElementById('kuota-content').classList.add('hidden');
    document.getElementById('keuangan-content').classList.add('hidden');

    // Remove active class from all nav items
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
        link.classList.remove('bg-green-700');
        link.classList.add('hover:bg-green-700');
    });

    // Add active class to clicked nav item
    if (contentType === 'reservasi') {
        document.getElementById('nav-reservasi').classList.add('active');
        document.getElementById('nav-reservasi').classList.remove('hover:bg-green-700');
        document.getElementById('reservasi-content').classList.remove('hidden');
        document.getElementById('page-title').innerHTML = '<i class="fas fa-list mr-2 text-green-600"></i> Manajemen Reservasi';
        loadReservasiData();
    } else if (contentType === 'kuota') {
        document.getElementById('nav-kuota').classList.add('active');
        document.getElementById('nav-kuota').classList.remove('hover:bg-green-700');
        document.getElementById('kuota-content').classList.remove('hidden');
        document.getElementById('page-title').innerHTML = '<i class="fas fa-ticket-alt mr-2 text-green-600"></i> Manajemen Kuota';
        loadKuotaData();
    } else if (contentType === 'keuangan') {
        document.getElementById('nav-keuangan').classList.add('active');
        document.getElementById('nav-keuangan').classList.remove('hover:bg-green-700');
        document.getElementById('keuangan-content').classList.remove('hidden');
        document.getElementById('page-title').innerHTML = '<i class="fas fa-money-bill-wave mr-2 text-green-600"></i> Manajemen Keuangan';
    }
}

// Function to set up logout functionality
function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            try {
                const { error } = await supabase.auth.signOut();
                if (error) {
                    console.error('Error logging out:', error);
                    showMessage('error', 'Gagal logout. Silakan coba lagi.');
                } else {
                    // Redirect to landing page
                    window.location.href = 'index.html';
                }
            } catch (err) {
                console.error('Logout error:', err);
                showMessage('error', 'Terjadi kesalahan saat logout.');
            }
        });
    }
}

// Function to set up modal functionality
function setupModal() {
    const closeModalBtn = document.getElementById('closeModal');
    const cancelModalBtn = document.getElementById('cancelModal');
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideModal);
    }
    
    if (cancelModalBtn) {
        cancelModalBtn.addEventListener('click', hideModal);
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('detailModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideModal();
            }
        });
    }
}

// Function to show modal
function showModal() {
    const modal = document.getElementById('detailModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// Function to hide modal
function hideModal() {
    const modal = document.getElementById('detailModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    // Reset button visibility
    document.getElementById('confirmPayment').classList.add('hidden');
}

// Function to show messages
function showMessage(type, message) {
    const container = document.getElementById('message-container');
    const content = document.getElementById('message-content');
    
    if (container && content) {
        content.textContent = message;
        
        // Set background color based on type
        let bgColor = 'bg-blue-500';
        if (type === 'error') {
            bgColor = 'bg-red-500';
        } else if (type === 'success') {
            bgColor = 'bg-green-500';
        }
        
        content.className = `px-6 py-4 rounded-lg shadow-lg ${bgColor} max-w-xs`;
        
        // Add animation
        container.classList.remove('hidden', 'animate-fade-out');
        container.classList.add('animate-fade-in');
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            container.classList.add('animate-fade-out');
            setTimeout(() => {
                container.classList.add('hidden');
            }, 300);
        }, 3000);
    }
}

// Function to show loading state
function showLoading(element) {
    const originalText = element.innerHTML;
    element.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Memproses...';
    element.disabled = true;
    
    return function() {
        element.innerHTML = originalText;
        element.disabled = false;
    };
}

// Function to load reservasi data
async function loadReservasiData() {
    try {
        // Check that session exists before attempting to load data
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
            console.log('No session, redirecting to login');
            window.location.href = 'index.html';
            return;
        }
        
        // Query reservasi for today
        const today = new Date().toISOString().split('T')[0];
        
        const { data: reservasi, error } = await supabase
            .from('reservasi')
            .select(`
                id_reservasi,
                kode_reservasi,
                jumlah_pendaki,
                tanggal_pendakian,
                status,
                pengguna!inner(nama_lengkap)
            `)
            .eq('tanggal_pendakian', today)
            .order('dibuat_pada', { ascending: false });

        if (error) {
            console.error('Error loading reservasi:', error);
            showMessage('error', 'Gagal memuat data reservasi');
            return;
        }

        // Update table
        const tbody = document.getElementById('reservasi-tbody');
        if (tbody) {
            tbody.innerHTML = '';

            if (reservasi && reservasi.length > 0) {
                reservasi.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="px-5 py-3 border-b border-gray-200 bg-white text-sm">
                            ${item.kode_reservasi}
                        </td>
                        <td class="px-5 py-3 border-b border-gray-200 bg-white text-sm">
                            ${item.pengguna.nama_lengkap}
                        </td>
                        <td class="px-5 py-3 border-b border-gray-200 bg-white text-sm">
                            ${formatDate(item.tanggal_pendakian)}
                        </td>
                        <td class="px-5 py-3 border-b border-gray-200 bg-white text-sm">
                            ${item.jumlah_pendaki}
                        </td>
                        <td class="px-5 py-3 border-b border-gray-200 bg-white text-sm">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${item.status === 'terkonfirmasi' ? 'bg-green-100 text-green-800' : 
                                  item.status === 'dibatalkan' ? 'bg-red-100 text-red-800' : 
                                  'bg-yellow-100 text-yellow-800'}">
                                ${item.status}
                            </span>
                        </td>
                        <td class="px-5 py-3 border-b border-gray-200 bg-white text-sm">
                            <button class="detail-btn bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm mr-2" 
                                data-id="${item.id_reservasi}" data-kode="${item.kode_reservasi}">
                                Detail
                            </button>
                            ${item.status === 'menunggu_pembayaran' ? 
                                `<button class="konfirmasi-btn bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-sm" 
                                    data-id="${item.id_reservasi}">
                                    Konfirmasi
                                </button>` : ''}
                        </td>
                    `;
                    tbody.appendChild(row);
                });

                // Add event listeners to detail buttons
                document.querySelectorAll('.detail-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        showReservasiDetail(this.dataset.id, this.dataset.kode);
                    });
                });

                // Add event listeners to konfirmasi buttons
                document.querySelectorAll('.konfirmasi-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        confirmPayment(this.dataset.id);
                    });
                });
            } else {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-5 py-3 border-b border-gray-200 bg-white text-sm text-center">
                            Tidak ada reservasi untuk hari ini
                        </td>
                    </tr>
                `;
            }

            // Update entry count
            const totalEntries = reservasi ? reservasi.length : 0;
            document.getElementById('total-entri').textContent = totalEntries;
            document.getElementById('jumlah-entri').textContent = totalEntries;
        }
    } catch (err) {
        console.error('Error loading reservasi:', err);
        showMessage('error', 'Gagal memuat data reservasi');
    }
}

// Function to load kuota data
async function loadKuotaData() {
    try {
        // Check that session exists before attempting to load data
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
            console.log('No session, redirecting to login');
            window.location.href = 'index.html';
            return;
        }
        
        // Load kuota data for the next 30 days
        const { data: kuota, error } = await supabase
            .from('kuota_harian')
            .select('*')
            .gte('tanggal_kuota', new Date().toISOString().split('T')[0])
            .order('tanggal_kuota', { ascending: true });

        if (error) {
            console.error('Error loading kuota:', error);
            showMessage('error', 'Gagal memuat data kuota');
            return;
        }

        // Update table
        const tbody = document.getElementById('kuota-tbody');
        if (tbody) {
            tbody.innerHTML = '';

            if (kuota && kuota.length > 0) {
                kuota.forEach(item => {
                    const sisaKuota = item.kuota_maksimal - item.kuota_terpesan;
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="px-5 py-3 border-b border-gray-200 bg-white text-sm">
                            ${formatDate(item.tanggal_kuota)}
                        </td>
                        <td class="px-5 py-3 border-b border-gray-200 bg-white text-sm">
                            ${item.kuota_maksimal}
                        </td>
                        <td class="px-5 py-3 border-b border-gray-200 bg-white text-sm">
                            ${item.kuota_terpesan}
                        </td>
                        <td class="px-5 py-3 border-b border-gray-200 bg-white text-sm">
                            <span class="${sisaKuota < 10 ? 'text-red-600 font-bold' : sisaKuota < 20 ? 'text-yellow-600' : 'text-green-600'}">
                                ${sisaKuota}
                            </span>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            } else {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="px-5 py-3 border-b border-gray-200 bg-white text-sm text-center">
                            Tidak ada data kuota
                        </td>
                    </tr>
                `;
            }
        }

        // Set up kuota form
        setupKuotaForm();
    } catch (err) {
        console.error('Error loading kuota:', err);
        showMessage('error', 'Gagal memuat data kuota');
    }
}

// Function to set up kuota form
function setupKuotaForm() {
    const tanggalInput = document.getElementById('kuota-tanggal');
    const kuotaInput = document.getElementById('kuota-maksimal');
    const simpanBtn = document.getElementById('simpan-kuota');

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    if (tanggalInput) {
        tanggalInput.value = today;
    }

    // Set up save button
    if (simpanBtn) {
        simpanBtn.addEventListener('click', async function() {
            const tanggal = tanggalInput.value;
            const kuota = kuotaInput.value;

            if (!tanggal || !kuota) {
                showMessage('error', 'Harap lengkapi semua field');
                return;
            }

            if (parseInt(kuota) <= 0) {
                showMessage('error', 'Kuota harus lebih dari 0');
                return;
            }

            try {
                // Check if kuota exists for this date
                const { data: existingKuota, error: selectError } = await supabase
                    .from('kuota_harian')
                    .select('*')
                    .eq('tanggal_kuota', tanggal)
                    .single();

                if (selectError && selectError.code !== 'PGRST116') {
                    console.error('Error checking existing kuota:', selectError);
                    showMessage('error', 'Gagal memeriksa kuota');
                    return;
                }

                let result;
                if (existingKuota) {
                    // Update existing kuota
                    result = await supabase
                        .from('kuota_harian')
                        .update({ 
                            kuota_maksimal: parseInt(kuota),
                            kuota_terpesan: existingKuota.kuota_terpesan // Keep existing bookings
                        })
                        .eq('tanggal_kuota', tanggal);
                } else {
                    // Insert new kuota
                    result = await supabase
                        .from('kuota_harian')
                        .insert([{ 
                            tanggal_kuota: tanggal,
                            kuota_maksimal: parseInt(kuota)
                        }]);
                }

                if (result.error) {
                    console.error('Error saving kuota:', result.error);
                    showMessage('error', 'Gagal menyimpan kuota');
                    return;
                }

                showMessage('success', 'Kuota berhasil disimpan');
                loadKuotaData(); // Refresh the table
                kuotaInput.value = ''; // Clear the input
            } catch (err) {
                console.error('Error saving kuota:', err);
                showMessage('error', 'Gagal menyimpan kuota');
            }
        });
    }
}

// Function to show reservasi detail
async function showReservasiDetail(reservasiId, kodeReservasi) {
    try {
        // Check that session exists before attempting to load data
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
            console.log('No session, redirecting to login');
            window.location.href = 'index.html';
            return;
        }
        
        // Get pendaki rombongan
        const { data: pendaki, error: pendakiError } = await supabase
            .from('pendaki_rombongan')
            .select('*')
            .eq('id_reservasi', reservasiId);

        // Get barang bawaan sampah
        const { data: barang, error: barangError } = await supabase
            .from('barang_bawaan_sampah')
            .select('*')
            .eq('id_reservasi', reservasiId);

        if (pendakiError || barangError) {
            console.error('Error loading detail:', pendakiError || barangError);
            showMessage('error', 'Gagal memuat detail reservasi');
            return;
        }

        // Update modal content
        const rombonganList = document.getElementById('rombongan-list');
        const barangList = document.getElementById('barang-list');
        const modalTitle = document.getElementById('modal-title');
        const confirmBtn = document.getElementById('confirmPayment');

        modalTitle.textContent = `Detail Reservasi: ${kodeReservasi}`;

        if (rombonganList) {
            rombonganList.innerHTML = '';
            if (pendaki && pendaki.length > 0) {
                pendaki.forEach(pendakiItem => {
                    const li = document.createElement('li');
                    li.className = 'flex justify-between py-2 border-b';
                    li.innerHTML = `
                        <span>${pendakiItem.nama_lengkap} (${pendakiItem.nik})</span>
                        <span>${pendakiItem.nomor_telepon}</span>
                    `;
                    rombonganList.appendChild(li);
                });
            } else {
                rombonganList.innerHTML = '<li class="text-gray-500">Tidak ada data pendaki</li>';
            }
        }

        if (barangList) {
            barangList.innerHTML = '';
            if (barang && barang.length > 0) {
                barang.forEach(barangItem => {
                    const li = document.createElement('li');
                    li.className = 'flex justify-between py-2 border-b';
                    li.innerHTML = `
                        <span>${barangItem.nama_barang}</span>
                        <span class="capitalize">${barangItem.jenis_sampah}</span>
                    `;
                    barangList.appendChild(li);
                });
            } else {
                barangList.innerHTML = '<li class="text-gray-500">Tidak ada barang bawaan yang dilaporkan</li>';
            }
        }

        // Check if payment needs to be confirmed
        const { data: reservasi, error: reservasiError } = await supabase
            .from('reservasi')
            .select('status')
            .eq('id_reservasi', reservasiId)
            .single();

        if (reservasi && reservasi.status === 'menunggu_pembayaran') {
            confirmBtn.classList.remove('hidden');
            confirmBtn.dataset.reservasiId = reservasiId;
        } else {
            confirmBtn.classList.add('hidden');
        }

        // Show modal
        showModal();
    } catch (err) {
        console.error('Error showing detail:', err);
        showMessage('error', 'Gagal memuat detail reservasi');
    }
}

// Function to confirm payment
async function confirmPayment(reservasiId) {
    try {
        // Get current user ID
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
            console.log('No session, redirecting to login');
            window.location.href = 'index.html';
            return;
        }

        // Call your PHP API to confirm payment
        // For now, we'll update directly in Supabase
        const { error } = await supabase
            .from('reservasi')
            .update({ 
                status: 'terkonfirmasi'
            })
            .eq('id_reservasi', reservasiId);

        if (error) {
            console.error('Error confirming payment:', error);
            showMessage('error', 'Gagal mengkonfirmasi pembayaran');
            return;
        }

        showMessage('success', 'Pembayaran berhasil dikonfirmasi');
        hideModal();
        loadReservasiData(); // Refresh the table
    } catch (err) {
        console.error('Error confirming payment:', err);
        showMessage('error', 'Gagal mengkonfirmasi pembayaran');
    }
}

// Function to format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Function to setup search
function setupSearch() {
    const searchKode = document.getElementById('search-kode');
    const searchNama = document.getElementById('search-nama');
    const searchBtn = document.getElementById('search-reservasi');

    if (searchKode && searchNama && searchBtn) {
        searchBtn.addEventListener('click', function() {
            searchReservasi(searchKode.value, searchNama.value);
        });

        // Also search when pressing Enter
        searchKode.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchReservasi(searchKode.value, searchNama.value);
            }
        });

        searchNama.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchReservasi(searchKode.value, searchNama.value);
            }
        });
    }
}

// Function to search reservasi
async function searchReservasi(kode, nama) {
    try {
        let query = supabase
            .from('reservasi')
            .select(`
                id_reservasi,
                kode_reservasi,
                jumlah_pendaki,
                tanggal_pendakian,
                status,
                pengguna!inner(nama_lengkap)
            `)
            .order('dibuat_pada', { ascending: false });

        if (kode) {
            query = query.ilike('kode_reservasi', `%${kode}%`);
        }

        if (nama) {
            query = query.ilike('pengguna.nama_lengkap', `%${nama}%`);
        }

        const { data: reservasi, error } = await query;

        if (error) {
            console.error('Error searching reservasi:', error);
            showMessage('error', 'Gagal mencari data reservasi');
            return;
        }

        // Update table with search results
        const tbody = document.getElementById('reservasi-tbody');
        if (tbody) {
            tbody.innerHTML = '';

            if (reservasi && reservasi.length > 0) {
                reservasi.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="px-5 py-3 border-b border-gray-200 bg-white text-sm">
                            ${item.kode_reservasi}
                        </td>
                        <td class="px-5 py-3 border-b border-gray-200 bg-white text-sm">
                            ${item.pengguna.nama_lengkap}
                        </td>
                        <td class="px-5 py-3 border-b border-gray-200 bg-white text-sm">
                            ${formatDate(item.tanggal_pendakian)}
                        </td>
                        <td class="px-5 py-3 border-b border-gray-200 bg-white text-sm">
                            ${item.jumlah_pendaki}
                        </td>
                        <td class="px-5 py-3 border-b border-gray-200 bg-white text-sm">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${item.status === 'terkonfirmasi' ? 'bg-green-100 text-green-800' : 
                                  item.status === 'dibatalkan' ? 'bg-red-100 text-red-800' : 
                                  'bg-yellow-100 text-yellow-800'}">
                                ${item.status}
                            </span>
                        </td>
                        <td class="px-5 py-3 border-b border-gray-200 bg-white text-sm">
                            <button class="detail-btn bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm mr-2" 
                                data-id="${item.id_reservasi}" data-kode="${item.kode_reservasi}">
                                Detail
                            </button>
                            ${item.status === 'menunggu_pembayaran' ? 
                                `<button class="konfirmasi-btn bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-sm" 
                                    data-id="${item.id_reservasi}">
                                    Konfirmasi
                                </button>` : ''}
                        </td>
                    `;
                    tbody.appendChild(row);
                });

                // Add event listeners to detail buttons
                document.querySelectorAll('.detail-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        showReservasiDetail(this.dataset.id, this.dataset.kode);
                    });
                });

                // Add event listeners to konfirmasi buttons
                document.querySelectorAll('.konfirmasi-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        confirmPayment(this.dataset.id);
                    });
                });
            } else {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-5 py-3 border-b border-gray-200 bg-white text-sm text-center">
                            Tidak ditemukan data reservasi
                        </td>
                    </tr>
                `;
            }

            // Update entry count
            const totalEntries = reservasi ? reservasi.length : 0;
            document.getElementById('total-entri').textContent = totalEntries;
            document.getElementById('jumlah-entri').textContent = totalEntries;
        }
    } catch (err) {
        console.error('Error searching reservasi:', err);
        showMessage('error', 'Gagal mencari data reservasi');
    }
}

// Function to set up keuangan tabs
function setupKeuanganTabs() {
    const laporanTab = document.getElementById('laporan-tab');
    const pengeluaranTab = document.getElementById('pengeluaran-tab');
    const laporanContent = document.getElementById('laporan-content');
    const pengeluaranContent = document.getElementById('pengeluaran-content');
    const showReportBtn = document.getElementById('show-report');

    if (laporanTab && pengeluaranTab) {
        laporanTab.addEventListener('click', function(e) {
            e.preventDefault();
            switchKeuanganTab('laporan');
        });

        pengeluaranTab.addEventListener('click', function(e) {
            e.preventDefault();
            switchKeuanganTab('pengeluaran');
        });
    }

    if (showReportBtn) {
        showReportBtn.addEventListener('click', function() {
            const fromDate = document.getElementById('date-from').value;
            const toDate = document.getElementById('date-to').value;
            loadKeuanganReport(fromDate, toDate);
        });
    }
}

// Function to switch keuangan tabs
function switchKeuanganTab(tabName) {
    const laporanContent = document.getElementById('laporan-content');
    const pengeluaranContent = document.getElementById('pengeluaran-content');
    const laporanTab = document.getElementById('laporan-tab');
    const pengeluaranTab = document.getElementById('pengeluaran-tab');

    if (tabName === 'laporan') {
        laporanContent.classList.remove('hidden');
        pengeluaranContent.classList.add('hidden');
        laporanTab.classList.remove('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        laporanTab.classList.add('text-blue-600', 'border-blue-600');
        pengeluaranTab.classList.remove('text-blue-600', 'border-blue-600');
        pengeluaranTab.classList.add('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
    } else if (tabName === 'pengeluaran') {
        pengeluaranContent.classList.remove('hidden');
        laporanContent.classList.add('hidden');
        pengeluaranTab.classList.remove('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        pengeluaranTab.classList.add('text-blue-600', 'border-blue-600');
        laporanTab.classList.remove('text-blue-600', 'border-blue-600');
        laporanTab.classList.add('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
    }
}

// Function to load pengeluaran form
async function loadPengeluaranForm() {
    try {
        // Check that session exists before attempting to load data
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
            console.log('No session, redirecting to login');
            window.location.href = 'index.html';
            return;
        }
        
        const { data: kategori, error } = await supabase
            .from('kategori_pengeluaran')
            .select('*');

        if (error) {
            console.error('Error loading kategori:', error);
            return;
        }

        const kategoriSelect = document.getElementById('kategori-pengeluaran');
        if (kategoriSelect && kategori) {
            // Clear existing options except the first one
            kategoriSelect.innerHTML = '<option value="">Pilih Kategori</option>';
            
            kategori.forEach(kat => {
                const option = document.createElement('option');
                option.value = kat.id_kategori;
                option.textContent = kat.nama_kategori;
                kategoriSelect.appendChild(option);
            });
        }

        // Set up pengeluaran form submission
        const pengeluaranForm = document.getElementById('pengeluaran-form');
        if (pengeluaranForm) {
            pengeluaranForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                await submitPengeluaran();
            });
        }
    } catch (err) {
        console.error('Error loading pengeluaran form:', err);
    }
}

// Function to submit pengeluaran
async function submitPengeluaran() {
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
            console.log('No session, redirecting to login');
            window.location.href = 'index.html';
            return;
        }

        const jumlah = document.getElementById('jumlah-pengeluaran').value;
        const tanggal = document.getElementById('tanggal-pengeluaran').value;
        const keterangan = document.getElementById('keterangan-pengeluaran').value;
        const kategori = document.getElementById('kategori-pengeluaran').value;

        if (!jumlah || !tanggal || !keterangan) {
            showMessage('error', 'Harap lengkapi semua field');
            return;
        }

        const { error } = await supabase
            .from('pengeluaran')
            .insert([{
                id_admin: session.user.id,
                id_kategori: kategori ? parseInt(kategori) : null,
                jumlah: parseInt(jumlah),
                keterangan: keterangan,
                tanggal_pengeluaran: tanggal
            }]);

        if (error) {
            console.error('Error submitting pengeluaran:', error);
            showMessage('error', 'Gagal menyimpan pengeluaran');
            return;
        }

        showMessage('success', 'Pengeluaran berhasil disimpan');
        
        // Reset form
        document.getElementById('pengeluaran-form').reset();
    } catch (err) {
        console.error('Error submitting pengeluaran:', err);
        showMessage('error', 'Gagal menyimpan pengeluaran');
    }
}

// Function to load keuangan report
async function loadKeuanganReport(fromDate, toDate) {
    try {
        // Check that session exists before attempting to load data
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
            console.log('No session, redirecting to login');
            window.location.href = 'index.html';
            return;
        }
        
        // Load pemasukan
        let pemasukanQuery = supabase
            .from('pemasukan')
            .select('*');

        if (fromDate && toDate) {
            pemasukanQuery = pemasukanQuery
                .gte('tanggal_pemasukan', fromDate)
                .lte('tanggal_pemasukan', toDate);
        }

        const { data: pemasukan, error: pemasukanError } = await pemasukanQuery;

        // Load pengeluaran
        let pengeluaranQuery = supabase
            .from('pengeluaran')
            .select('*');

        if (fromDate && toDate) {
            pengeluaranQuery = pengeluaranQuery
                .gte('tanggal_pengeluaran', fromDate)
                .lte('tanggal_pengeluaran', toDate);
        }

        const { data: pengeluaran, error: pengeluaranError } = await pengeluaranQuery;

        if (pemasukanError || pengeluaranError) {
            console.error('Error loading report:', pemasukanError || pengeluaranError);
            showMessage('error', 'Gagal memuat laporan keuangan');
            return;
        }

        // Calculate totals
        const totalPemasukan = pemasukan ? pemasukan.reduce((sum, item) => sum + item.jumlah, 0) : 0;
        const totalPengeluaran = pengeluaran ? pengeluaran.reduce((sum, item) => sum + item.jumlah, 0) : 0;
        const saldoAkhir = totalPemasukan - totalPengeluaran;

        // Update summary cards
        document.getElementById('total-pemasukan').textContent = `Rp ${totalPemasukan.toLocaleString('id-ID')}`;
        document.getElementById('total-pengeluaran').textContent = `Rp ${totalPengeluaran.toLocaleString('id-ID')}`;
        document.getElementById('saldo-akhir').textContent = `Rp ${saldoAkhir.toLocaleString('id-ID')}`;

        // Update pemasukan table
        const pemasukanTbody = document.getElementById('pemasukan-tbody');
        if (pemasukanTbody) {
            pemasukanTbody.innerHTML = '';
            if (pemasukan && pemasukan.length > 0) {
                pemasukan.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="px-5 py-3 border-b border-gray-200 bg-white text-sm">
                            ${formatDate(item.tanggal_pemasukan)}
                        </td>
                        <td class="px-5 py-3 border-b border-gray-200 bg-white text-sm">
                            ${item.keterangan}
                        </td>
                        <td class="px-5 py-3 border-b border-gray-200 bg-white text-sm">
                            Rp ${item.jumlah.toLocaleString('id-ID')}
                        </td>
                    `;
                    pemasukanTbody.appendChild(row);
                });
            } else {
                pemasukanTbody.innerHTML = `
                    <tr>
                        <td colspan="3" class="px-5 py-3 border-b border-gray-200 bg-white text-sm text-center">
                            Tidak ada data pemasukan
                        </td>
                    </tr>
                `;
            }
        }

        // Update pengeluaran table
        const pengeluaranTbody = document.getElementById('pengeluaran-tbody');
        if (pengeluaranTbody) {
            pengeluaranTbody.innerHTML = '';
            if (pengeluaran && pengeluaran.length > 0) {
                pengeluaran.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="px-5 py-3 border-b border-gray-200 bg-white text-sm">
                            ${formatDate(item.tanggal_pengeluaran)}
                        </td>
                        <td class="px-5 py-3 border-b border-gray-200 bg-white text-sm">
                            ${item.kategori ? item.kategori.nama_kategori : 'Umum'}
                        </td>
                        <td class="px-5 py-3 border-b border-gray-200 bg-white text-sm">
                            Rp ${item.jumlah.toLocaleString('id-ID')}
                        </td>
                    `;
                    pengeluaranTbody.appendChild(row);
                });
            } else {
                pengeluaranTbody.innerHTML = `
                    <tr>
                        <td colspan="3" class="px-5 py-3 border-b border-gray-200 bg-white text-sm text-center">
                            Tidak ada data pengeluaran
                        </td>
                    </tr>
                `;
            }
        }
    } catch (err) {
        console.error('Error loading report:', err);
        showMessage('error', 'Gagal memuat laporan keuangan');
    }
}