// admin.js - Admin dashboard main module

import { DashboardModule } from './modules/dashboard_php.js';
import { ReservationsModule } from './modules/reservasi_php.js';
import { QuotasModule } from './modules/quotas_php.js';
import { PricingSettingsModule } from './modules/pricing_settings.js';
import { FinanceModule } from './modules/finance_php.js';
import { AnnouncementModule } from './modules/pengumuman_php.js';
import { PenggunaModule } from './modules/pengguna_php.js';
import { PendakiModule } from './modules/pendaki_php.js';
import { Router } from './modules/router.js';
import { Utils } from './modules/utils.js';

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Verify we have a valid Supabase instance
        if (!window.supabase) {
            console.error('Supabase client not loaded');
            window.location.href = 'index.html';
            return;
        }

        // Check if user is logged in as admin
        checkAdminSession().catch(err => {
            console.error('Error checking admin session:', err);
            window.location.href = 'index.html';
        });

        // Initialize modules
        const dashboardModule = new DashboardModule();
        const reservationsModule = new ReservationsModule();
        const quotasModule = new QuotasModule();
        const pricingSettingsModule = new PricingSettingsModule();
        const financeModule = new FinanceModule();
        const announcementModule = new AnnouncementModule();
        const penggunaModule = new PenggunaModule();
        const pendakiModule = new PendakiModule();
        const router = new Router(dashboardModule, reservationsModule, quotasModule, financeModule, announcementModule, penggunaModule);

        // Make modules available globally for HTML onclick events
        window.dashboardModule = dashboardModule;
        window.reservationsModule = reservationsModule;
        window.quotasModule = quotasModule;
        window.pricingSettingsModule = pricingSettingsModule;
        window.financeModule = financeModule;
        window.announcementModule = announcementModule;
        window.penggunaModule = penggunaModule;
        window.pendakiModule = pendakiModule;
        
        // Make Utils class available globally
        window.Utils = Utils;

        // Set up navigation
        router.setupNavigation();

        // Set up logout functionality
        setupLogout();

        // Set up modal functionality
        setupModal();

        // Set up search functionality
        setupSearch(reservationsModule);
        
        // Set up pengguna search functionality
        setupPenggunaSearch(penggunaModule);
        
        // Set up pendaki search functionality
        setupPendakiSearch(pendakiModule);

        // Set up keuangan tabs
        setupKeuanganTabs(financeModule);
        
        // Set up pengeluaran form submission
        setupPengeluaranForm(financeModule);
        
        // Set up kuota form submission
        setupKuotaForm(quotasModule);

        // Load initial content
        reservationsModule.loadReservasiData();
        
        // Load pengeluaran form
        financeModule.loadPengeluaranForm();
        
        // Load kuota data
        quotasModule.loadKuotaData();
        
        // Load announcement data
        if (announcementModule) {
            announcementModule.loadAnnouncements();
            // Setup announcement form submission after modules are initialized
            setupPengumumanForm(announcementModule);
        }

        // Show dashboard by default
        setTimeout(() => {
            if (document.getElementById('nav-dashboard')) {
                router.switchContent('dashboard');
            }
        }, 100); // Small delay to ensure everything is loaded
        
        // Set up periodic updates for dashboard data
        setInterval(() => {
            if (document.getElementById('dashboard-content') && !document.getElementById('dashboard-content').classList.contains('hidden')) {
                dashboardModule.loadDashboardSummary();
            }
        }, 60000); // Update every minute
    } catch (error) {
        console.error('Error during initialization:', error);
        // Redirect to login if initialization fails
        window.location.href = 'index.html';
    }
});

// Function to check if user is logged in as admin
async function checkAdminSession() {
    try {
        // Get current session token from Supabase
        const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
        
        if (sessionError || !session) {
            console.log('No valid session found, redirecting to login');
            // Redirect to login page if not logged in
            window.location.href = 'index.html';
            return;
        }

        // Small delay to allow session to be properly established
        await new Promise(resolve => setTimeout(resolve, 300));

        // Verify if user is an admin from the profiles table using Supabase directly
        const { data: userData, error: userError } = await window.supabase
            .from('profiles')
            .select('peran, nama_lengkap')
            .eq('id', session.user.id)
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

// Function to set up logout functionality
function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            try {
                const { error } = await window.supabase.auth.signOut();
                if (error) {
                    console.error('Error logging out:', error);
                    Utils.showMessage('error', 'Gagal logout. Silakan coba lagi.');
                } else {
                    // Redirect to landing page
                    window.location.href = 'index.html';
                }
            } catch (err) {
                console.error('Logout error:', err);
                Utils.showMessage('error', 'Terjadi kesalahan saat logout.');
            }
        });
    }
}

// Function to set up modal functionality
function setupModal() {
    const closeModalBtn = document.getElementById('closeModal');
    const cancelModalBtn = document.getElementById('cancelModal');
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', Utils.hideModal);
    }
    
    if (cancelModalBtn) {
        cancelModalBtn.addEventListener('click', Utils.hideModal);
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('detailModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                Utils.hideModal();
            }
        });
    }
}

// Function to setup search
function setupSearch(reservationsModule) {
    const searchKode = document.getElementById('search-kode');
    const searchNama = document.getElementById('search-nama');
    const searchBtn = document.getElementById('search-reservasi');

    if (searchKode && searchNama && searchBtn) {
        searchBtn.addEventListener('click', function() {
            reservationsModule.searchReservasi(searchKode.value, searchNama.value);
        });

        // Also search when pressing Enter
        searchKode.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                reservationsModule.searchReservasi(searchKode.value, searchNama.value);
            }
        });

        searchNama.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                reservationsModule.searchReservasi(searchKode.value, searchNama.value);
            }
        });
    }
}

// Function to setup pengguna search
function setupPenggunaSearch(penggunaModule) {
    const searchNamaPengguna = document.getElementById('search-nama-pengguna');
    const searchEmailPengguna = document.getElementById('search-email-pengguna');
    const searchPenggunaBtn = document.getElementById('search-pengguna');
    const tambahPenggunaBtn = document.getElementById('tambah-pengguna-btn');

    if (searchNamaPengguna && searchEmailPengguna && searchPenggunaBtn) {
        searchPenggunaBtn.addEventListener('click', function() {
            penggunaModule.searchPengguna(searchNamaPengguna.value, searchEmailPengguna.value);
        });

        // Also search when pressing Enter in any search field
        searchNamaPengguna.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                penggunaModule.searchPengguna(searchNamaPengguna.value, searchEmailPengguna.value);
            }
        });

        searchEmailPengguna.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                penggunaModule.searchPengguna(searchNamaPengguna.value, searchEmailPengguna.value);
            }
        });
    }

    if (tambahPenggunaBtn) {
        tambahPenggunaBtn.addEventListener('click', function() {
            showAddPenggunaForm();
        });
    }
}

// Function to setup pendaki search
function setupPendakiSearch(pendakiModule) {
    const searchNamaPendaki = document.getElementById('search-nama-pendaki');
    const searchKodeReservasi = document.getElementById('search-kode-reservasi');
    const searchPendakiBtn = document.getElementById('search-pendaki');
    const tambahPendakiBtn = document.getElementById('tambah-pendaki-btn');

    if (searchNamaPendaki && searchKodeReservasi && searchPendakiBtn) {
        searchPendakiBtn.addEventListener('click', function() {
            pendakiModule.searchPendaki(searchKodeReservasi.value, searchNamaPendaki.value);
        });

        // Also search when pressing Enter in any search field
        searchNamaPendaki.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                pendakiModule.searchPendaki(searchKodeReservasi.value, searchNamaPendaki.value);
            }
        });

        searchKodeReservasi.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                pendakiModule.searchPendaki(searchKodeReservasi.value, searchNamaPendaki.value);
            }
        });
    }

    if (tambahPendakiBtn) {
        tambahPendakiBtn.addEventListener('click', function() {
            showAddPendakiForm();
        });
    }
}

// Function to set up keuangan tabs
function setupKeuanganTabs(financeModule) {
    const laporanTab = document.getElementById('laporan-tab');
    const pengeluaranTab = document.getElementById('pengeluaran-tab');
    const showReportBtn = document.getElementById('show-report');

    if (laporanTab && pengeluaranTab) {
        laporanTab.addEventListener('click', function(e) {
            e.preventDefault();
            financeModule.switchKeuanganTab('laporan');
        });

        pengeluaranTab.addEventListener('click', function(e) {
            e.preventDefault();
            financeModule.switchKeuanganTab('pengeluaran');
        });
    }

    if (showReportBtn) {
        showReportBtn.addEventListener('click', function() {
            const fromDate = document.getElementById('date-from').value;
            const toDate = document.getElementById('date-to').value;
            financeModule.loadKeuanganReport(fromDate, toDate);
        });
    }
}

// Function to set up pengeluaran form
// Function to set up pengeluaran form submission
function setupPengeluaranForm(financeModule) {
    const pengeluaranForm = document.getElementById('pengeluaran-form');
    
    if (pengeluaranForm) {
        // Add input formatting for jumlah field
        const jumlahInput = document.getElementById('jumlah-pengeluaran');
        if (jumlahInput) {
            jumlahInput.addEventListener('input', function(e) {
                // Remove non-numeric characters except for formatting
                let value = e.target.value.replace(/[^\d]/g, '');
                
                // Format with dots only (avoid 'Rp ' prefix for input field)
                if (value) {
                    // Use a simple formatting function for input (without 'Rp ' prefix)
                    value = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                }
                
                // Set value while preserving cursor position
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                
                e.target.value = value;
                
                // Restore cursor position after reformatting
                const newStart = Math.min(start, e.target.value.length);
                const newEnd = Math.min(end, e.target.value.length);
                
                e.target.setSelectionRange(newStart, newEnd);
            });
            
            // Handle paste event to maintain formatting
            jumlahInput.addEventListener('paste', function(e) {
                setTimeout(() => {
                    let value = e.target.value.replace(/[^\d]/g, '');
                    if (value) {
                        // Format with dots only (avoid 'Rp ' prefix for input field)
                        value = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                        e.target.value = value;
                    }
                }, 10);
            });
            
            // Add validation for keypress to only allow numbers and control keys
            jumlahInput.addEventListener('keypress', function(e) {
                // Allow numbers, tab, delete, backspace, enter, escape, arrow keys, etc.
                if (!/[0-9\b\t\n\r]/.test(e.key) && 
                    ![8, 9, 13, 27, 37, 38, 39, 40, 46].includes(e.keyCode)) {
                    e.preventDefault();
                }
            });
        }
        
        pengeluaranForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const jumlah = document.getElementById('jumlah-pengeluaran').value;
            const tanggal = document.getElementById('tanggal-pengeluaran').value;
            const keterangan = document.getElementById('keterangan-pengeluaran').value;
            const kategori = document.getElementById('kategori-pengeluaran').value;
            
            if (!jumlah || !tanggal || !keterangan) {
                Utils.showMessage('error', 'Semua field harus diisi');
                return;
            }
            
            // Parse the formatted value - remove dots and convert to integer
            // Since we format numbers with dots as thousands separator
            const jumlahString = jumlah.toString();
            let parsedJumlah;
            
            if (jumlahString) {
                // Remove dots and parse to integer
                parsedJumlah = parseInt(jumlahString.replace(/[.]/g, '')) || 0;
            } else {
                parsedJumlah = 0;
            }
            
            if (parsedJumlah <= 0) {
                Utils.showMessage('error', 'Jumlah pengeluaran harus lebih dari 0');
                return;
            }
            
            if (financeModule) {
                financeModule.savePengeluaran(parsedJumlah, tanggal, keterangan, kategori);
            }
        });
        
        // Set up tambah kategori button
        const tambahKategoriBtn = document.getElementById('tambah-kategori-btn');
        if (tambahKategoriBtn) {
            tambahKategoriBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Show a prompt for the user to enter the category name
                const categoryName = prompt('Masukkan nama kategori baru:');
                if (categoryName !== null) { // User didn't cancel
                    if (financeModule) {
                        financeModule.addKategori(categoryName);
                    }
                }
            });
        }
    }
}

// Function to set up quota form
function setupKuotaForm(quotasModule) {
    const simpanKuotaBtn = document.getElementById('simpan-kuota');
    
    if (simpanKuotaBtn) {
        simpanKuotaBtn.addEventListener('click', function() {
            const tanggal = document.getElementById('kuota-tanggal').value;
            const kuotaMaksimal = document.getElementById('kuota-maksimal').value;
            
            if (!tanggal || !kuotaMaksimal) {
                Utils.showMessage('error', 'Tanggal dan kuota maksimal harus diisi');
                return;
            }
            
            if (quotasModule) {
                quotasModule.saveKuota(tanggal, kuotaMaksimal);
            }
        });
    }
    
    // Set up pricing settings form
    const simpanHargaBtn = document.getElementById('simpan-harga');
    if (simpanHargaBtn) {
        simpanHargaBtn.addEventListener('click', function() {
            if (window.pricingSettingsModule) {
                window.pricingSettingsModule.savePricing();
            }
        });
    }
}

// Function to set up pengumuman form
function setupPengumumanForm(announcementModule) {
    const pengumumanForm = document.getElementById('pengumuman-form');
    
    if (pengumumanForm) {
        // Check if event listener has already been added to avoid duplicates
        if (!pengumumanForm.dataset.listenerAdded) {
            pengumumanForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const judul = document.getElementById('judul-pengumuman').value;
                const konten = document.getElementById('konten-pengumuman').value;
                const startDate = document.getElementById('tanggal-mulai').value;
                const endDate = document.getElementById('tanggal-selesai').value;
                const status = document.getElementById('status-pengumuman').value;
                
                if (!judul || !konten || !startDate || !endDate) {
                    Utils.showMessage('error', 'Semua field wajib diisi');
                    return;
                }
                
                if (announcementModule) {
                    announcementModule.saveAnnouncement(judul, konten, startDate, endDate, status);
                }
            });
            
            pengumumanForm.dataset.listenerAdded = 'true';
        }
    }
}

// Make some functions available globally for HTML onclick events
window.switchKeuanganTab = function(tabName) {
    // This function will be updated after modules are initialized
    if (window.financeModule) {
        window.financeModule.switchKeuanganTab(tabName);
    }
};

// Make setupPengumumanForm available globally
window.setupPengumumanForm = setupPengumumanForm;

// Function to show reservation details in modal
window.showReservationDetail = function(id_reservasi) {
    // This function will be implemented to fetch and show reservation details
    fetch(`api/reservasi.php?id=${id_reservasi}`)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success' && result.data.length > 0) {
                const reservasi = result.data[0];
                
                // Update modal content with currency formatting
                const rombonganList = document.getElementById('rombongan-list');
                const barangList = document.getElementById('barang-list');
                
                if (rombonganList) {
                    rombonganList.innerHTML = '';
                    reservasi.pendaki_rombongan.forEach(pendaki => {
                        // Create list item with surat sehat info
                        const li = document.createElement('li');
                        li.className = 'mb-2 flex justify-between items-center';
                        li.innerHTML = `
                            <span>${pendaki.nama_lengkap} - ${pendaki.nik}</span>
                            ${pendaki.url_surat_sehat ? 
                                `<a href="${pendaki.url_surat_sehat}" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm">Lihat Surat Sehat</a>` : 
                                '<span class="text-red-600 text-sm">Tidak ada surat sehat</span>'}
                        `;
                        rombonganList.appendChild(li);
                    });
                }
                
                if (barangList) {
                    barangList.innerHTML = '';
                    reservasi.barang_bawaan.forEach(barang => {
                        const li = document.createElement('li');
                        li.className = 'mb-2';
                        li.textContent = `${barang.nama_barang} (${barang.jenis_sampah}) - Jumlah: ${barang.jumlah || 1}`;
                        barangList.appendChild(li);
                    });
                }
                
                // Show/hide confirm payment button based on status
                const confirmButton = document.getElementById('confirmPayment');
                if (confirmButton) {
                    if (reservasi.status === 'menunggu_pembayaran') {
                        confirmButton.classList.remove('hidden');
                        confirmButton.onclick = () => window.confirmPayment(reservasi.id_reservasi, reservasi.kode_reservasi);
                    } else {
                        confirmButton.classList.add('hidden');
                    }
                }
                
                // Add total price information
                const modalContent = document.getElementById('modal-content');
                if (modalContent) {
                    // Remove existing price info if it exists
                    const existingPriceInfo = document.getElementById('price-info');
                    if (existingPriceInfo) {
                        existingPriceInfo.remove();
                    }
                    
                    // Add price information
                    const priceInfo = document.createElement('div');
                    priceInfo.id = 'price-info';
                    priceInfo.className = 'mt-4 p-3 bg-gray-50 rounded-lg';
                    priceInfo.innerHTML = `
                        <h4 class="font-medium text-gray-700 mb-2">Informasi Pembayaran:</h4>
                        <div class="grid grid-cols-2 gap-2">
                            <div class="text-gray-600">Total Harga:</div>
                            <div class="font-medium">${Utils.formatRupiah(reservasi.total_harga)}</div>
                            <div class="text-gray-600">Jumlah Pendaki:</div>
                            <div>${reservasi.jumlah_pendaki} orang</div>
                            <div class="text-gray-600">Harga per Tiket:</div>
                            <div>${Utils.formatRupiah(Math.round(reservasi.total_harga / reservasi.jumlah_pendaki))}</div>
                        </div>
                    `;
                    modalContent.appendChild(priceInfo);
                }
                
                // Set up sampah validation buttons
                const sampahSesuaiBtn = document.getElementById('sampahSesuai');
                const sampahTidakSesuaiBtn = document.getElementById('sampahTidakSesuai');
                
                if (sampahSesuaiBtn && sampahTidakSesuaiBtn) {
                    // Initially hide both buttons
                    sampahSesuaiBtn.style.display = 'none';
                    sampahTidakSesuaiBtn.style.display = 'none';
                    
                    // Show appropriate button based on current status_sampah
                    if (reservasi.status_sampah === 'belum_dicek') {
                        sampahSesuaiBtn.style.display = 'inline-block';
                        sampahTidakSesuaiBtn.style.display = 'inline-block';
                        
                        sampahSesuaiBtn.onclick = () => window.updateSampahStatus(reservasi.id_reservasi, 'sesuai');
                        sampahTidakSesuaiBtn.onclick = () => window.updateSampahStatus(reservasi.id_reservasi, 'tidak_sesuai');
                    } else {
                        // Show text indicating current status
                        const statusText = document.createElement('div');
                        statusText.className = 'mt-2 text-sm';
                        statusText.innerHTML = `<strong>Status Sampah:</strong> <span class="status-badge status-${window.reservationsModule.getSampahStatusClass(reservasi.status_sampah)}">${window.reservationsModule.getSampahStatusText(reservasi.status_sampah)}</span>`;
                        
                        const modalContent = document.getElementById('modal-content');
                        modalContent.appendChild(statusText);
                    }
                }
                
                // Show the modal
                const modal = document.getElementById('detailModal');
                if (modal) {
                    modal.classList.remove('hidden');
                }
            } else {
                Utils.showMessage('error', 'Reservasi tidak ditemukan');
            }
        })
        .catch(error => {
            console.error('Error fetching reservation details:', error);
            Utils.showMessage('error', 'Error connecting to server');
        });
};

// Function to confirm payment
window.confirmPayment = async function(id_reservasi, kode_reservasi) {
    if (!window.supabase) {
        console.error('Supabase client not available');
        Utils.showMessage('error', 'Koneksi ke database tidak tersedia');
        return;
    }
    
    if (!confirm('Apakah Anda yakin ingin mengkonfirmasi pembayaran ini?')) {
        return;
    }
    
    try {
        // Get current admin ID from session
        const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
        if (sessionError || !session) {
            throw new Error('Sesi admin tidak valid');
        }
        
        const adminId = session.user.id;

        // Call the database function to confirm payment
        const { data, error } = await window.supabase
            .rpc('konfirmasi_pembayaran_reservasi', {
                input_id_reservasi: id_reservasi,
                input_id_admin: adminId
            });

        if (error) {
            console.error('Error confirming payment:', error);
            throw new Error(error.message);
        }

        // Show success message and refresh the data
        const result = data[0];
        if (result && typeof result === 'string' && result.includes('Success')) {
            Utils.showMessage('success', 'Pembayaran berhasil dikonfirmasi dan pemasukan telah dicatat!');
            
            // Hide the modal and refresh data
            Utils.hideModal();
            
            // Refresh the reservation data to reflect the status change
            setTimeout(() => {
                if (window.reservationsModule) {
                    window.reservationsModule.loadReservasiData();
                }
                
                // Also reload dashboard stats
                if (window.dashboardModule) {
                    window.dashboardModule.loadDashboardSummary();
                }
            }, 500);
        } else {
            // Handle the error case (this would be the error message from the function)
            const errorMessage = result || 'Terjadi kesalahan saat mengkonfirmasi pembayaran';
            Utils.showMessage('error', errorMessage);
        }
    } catch (error) {
        console.error('Error confirming payment:', error);
        Utils.showMessage('error', 'Gagal mengkonfirmasi pembayaran: ' + error.message);
    }
};

// Function to edit announcement
window.editAnnouncement = function(id_pengumuman) {
    if (window.announcementModule) {
        window.announcementModule.editAnnouncement(id_pengumuman);
    } else {
        console.error('announcementModule not available');
    }
};

// Function to delete announcement
window.deleteAnnouncement = function(id_pengumuman) {
    if (window.announcementModule) {
        if (confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) {
            window.announcementModule.deleteAnnouncement(id_pengumuman);
        }
    } else {
        console.error('announcementModule not available');
    }
};

// Function to update sampah status
window.updateSampahStatus = function(id_reservasi, status_sampah) {
    if (window.reservationsModule) {
        window.reservationsModule.updateSampahStatus(id_reservasi, status_sampah);
    }
};

// Function to show add pengguna form in modal
function showAddPenggunaForm() {
    const modalContent = document.getElementById('modal-content');
    if (!modalContent) return;

    modalContent.innerHTML = `
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Tambah Pengguna Baru</h3>
        <form id="add-pengguna-form">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="nama_lengkap_pengguna">
                        <i class="fas fa-user mr-1"></i> Nama Lengkap *
                    </label>
                    <input type="text" id="nama_lengkap_pengguna" class="input-modern w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" required>
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="email_pengguna">
                        <i class="fas fa-envelope mr-1"></i> Email *
                    </label>
                    <input type="email" id="email_pengguna" class="input-modern w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" required>
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="nomor_telepon_pengguna">
                        <i class="fas fa-phone mr-1"></i> Nomor Telepon
                    </label>
                    <input type="text" id="nomor_telepon_pengguna" class="input-modern w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="nik_pengguna">
                        <i class="fas fa-id-card mr-1"></i> NIK
                    </label>
                    <input type="text" id="nik_pengguna" class="input-modern w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                </div>
                <div class="md:col-span-2">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="alamat_pengguna">
                        <i class="fas fa-home mr-1"></i> Alamat
                    </label>
                    <textarea id="alamat_pengguna" class="input-modern w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" rows="2"></textarea>
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="peran_pengguna">
                        <i class="fas fa-user-tag mr-1"></i> Peran *
                    </label>
                    <select id="peran_pengguna" class="input-modern w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" required>
                        <option value="pendaki">Pendaki</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="password_pengguna">
                        <i class="fas fa-lock mr-1"></i> Password
                    </label>
                    <input type="password" id="password_pengguna" class="input-modern w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Kosongkan jika tidak ingin set password">
                    <p class="text-xs text-gray-500 mt-1">Biarkan kosong untuk menggunakan password default</p>
                </div>
            </div>
            <div class="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-200">
                <button type="button" id="cancel-pengguna-btn" class="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg">
                    Batal
                </button>
                <button type="submit" class="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg">
                    <i class="fas fa-save mr-2"></i> Simpan Pengguna
                </button>
            </div>
        </form>
    `;

    // Show the modal
    const modal = document.getElementById('detailModal');
    const modalTitle = document.getElementById('modal-title');
    if (modal) {
        modal.classList.remove('hidden');
    }
    if (modalTitle) {
        modalTitle.textContent = 'Tambah Pengguna Baru';
    }

    // Add submit event to the form
    const form = document.getElementById('add-pengguna-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const penggunaData = {
                nama_lengkap: document.getElementById('nama_lengkap_pengguna').value,
                email: document.getElementById('email_pengguna').value,
                nomor_telepon: document.getElementById('nomor_telepon_pengguna').value,
                nik: document.getElementById('nik_pengguna').value,
                alamat: document.getElementById('alamat_pengguna').value,
                peran: document.getElementById('peran_pengguna').value,
                password: document.getElementById('password_pengguna').value || null
            };

            if (window.penggunaModule) {
                window.penggunaModule.addPengguna(penggunaData);
            }
        });
    }
    
    // Add event listener for cancel button
    const cancelBtn = document.getElementById('cancel-pengguna-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            Utils.hideModal();
        });
    }
}

// Function to show edit pengguna form in modal
function showEditPenggunaForm(id, profileData) {
    const modalContent = document.getElementById('modal-content');
    if (!modalContent) return;

    modalContent.innerHTML = `
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Edit Pengguna</h3>
        <form id="edit-pengguna-form">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="edit_nama_lengkap_pengguna">
                        <i class="fas fa-user mr-1"></i> Nama Lengkap *
                    </label>
                    <input type="text" id="edit_nama_lengkap_pengguna" class="input-modern w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" value="${profileData.nama_lengkap || ''}" required>
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="edit_email_pengguna">
                        <i class="fas fa-envelope mr-1"></i> Email *
                    </label>
                    <input type="email" id="edit_email_pengguna" class="input-modern w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" value="${profileData.email || ''}" required>
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="edit_nomor_telepon_pengguna">
                        <i class="fas fa-phone mr-1"></i> Nomor Telepon
                    </label>
                    <input type="text" id="edit_nomor_telepon_pengguna" class="input-modern w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" value="${profileData.nomor_telepon || ''}">
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="edit_peran_pengguna">
                        <i class="fas fa-user-tag mr-1"></i> Peran *
                    </label>
                    <select id="edit_peran_pengguna" class="input-modern w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" required>
                        <option value="pendaki" ${profileData.peran === 'pendaki' ? 'selected' : ''}>Pendaki</option>
                        <option value="admin" ${profileData.peran === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </div>
            </div>
            <div class="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-200">
                <button type="button" id="cancel-edit-pengguna-btn" class="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg">
                    Batal
                </button>
                <button type="submit" class="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg">
                    <i class="fas fa-save mr-2"></i> Simpan Perubahan
                </button>
            </div>
        </form>
    `;

    // Show the modal
    const modal = document.getElementById('detailModal');
    const modalTitle = document.getElementById('modal-title');
    if (modal) {
        modal.classList.remove('hidden');
    }
    if (modalTitle) {
        modalTitle.textContent = 'Edit Pengguna';
    }

    // Add submit event to the form
    const form = document.getElementById('edit-pengguna-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const updatedPenggunaData = {
                nama_lengkap: document.getElementById('edit_nama_lengkap_pengguna').value,
                email: document.getElementById('edit_email_pengguna').value,
                nomor_telepon: document.getElementById('edit_nomor_telepon_pengguna').value,
                peran: document.getElementById('edit_peran_pengguna').value
            };

            if (window.penggunaModule) {
                window.penggunaModule.updatePengguna(id, updatedPenggunaData);
            }
        });
    }
    
    // Add event listener for cancel button
    const cancelEditBtn = document.getElementById('cancel-edit-pengguna-btn');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', function() {
            Utils.hideModal();
        });
    }
}

// Function to handle editing a user
window.editPengguna = function(id) {
    // Fetch the specific profile data by ID
    fetch(`api/pengguna.php`)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                const profile = result.data.find(p => p.id == id);
                if (profile) {
                    showEditPenggunaForm(id, profile);
                } else {
                    Utils.showMessage('error', 'Pengguna tidak ditemukan');
                }
            } else {
                Utils.showMessage('error', 'Gagal memuat data pengguna');
            }
        })
        .catch(error => {
            console.error('Error fetching profile data:', error);
            Utils.showMessage('error', 'Error connecting to server');
        });
};

// Function to handle deleting a user
window.deletePengguna = function(id, nama_lengkap) {
    if (confirm(`Apakah Anda yakin ingin menghapus pengguna ${nama_lengkap}? Tindakan ini akan menghapus akun dan semua data terkait.`)) {
        if (window.penggunaModule) {
            window.penggunaModule.deletePengguna(id);
        }
    }
};

// Function to show add pendaki form in modal
function showAddPendakiForm() {
    const modalContent = document.getElementById('modal-content');
    if (!modalContent) return;

    modalContent.innerHTML = `
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Tambah Pendaki Baru</h3>
        <form id="add-pendaki-form">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="nama_lengkap">
                        <i class="fas fa-user mr-1"></i> Nama Lengkap *
                    </label>
                    <input type="text" id="nama_lengkap" class="input-modern w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" required>
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="nik">
                        <i class="fas fa-id-card mr-1"></i> NIK *
                    </label>
                    <input type="text" id="nik" class="input-modern w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" required>
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="nomor_telepon">
                        <i class="fas fa-phone mr-1"></i> Nomor Telepon *
                    </label>
                    <input type="text" id="nomor_telepon" class="input-modern w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" required>
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="kontak_darurat">
                        <i class="fas fa-phone-alt mr-1"></i> Kontak Darurat *
                    </label>
                    <input type="text" id="kontak_darurat" class="input-modern w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" required>
                </div>
                <div class="md:col-span-2">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="alamat">
                        <i class="fas fa-home mr-1"></i> Alamat *
                    </label>
                    <textarea id="alamat" class="input-modern w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" rows="2" required></textarea>
                </div>
                <div class="md:col-span-2">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="id_reservasi">
                        <i class="fas fa-calendar mr-1"></i> ID Reservasi *
                    </label>
                    <input type="number" id="id_reservasi" class="input-modern w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" required>
                    <p class="text-xs text-gray-500 mt-1">Masukkan ID reservasi yang valid</p>
                </div>
                <div class="md:col-span-2">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="url_surat_sehat">
                        <i class="fas fa-file-medical mr-1"></i> URL Surat Sehat
                    </label>
                    <input type="url" id="url_surat_sehat" class="input-modern w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                    <p class="text-xs text-gray-500 mt-1">Alamat URL untuk surat keterangan sehat (opsional)</p>
                </div>
            </div>
        </form>
    `;

    // Show the modal
    const modal = document.getElementById('detailModal');
    const modalTitle = document.getElementById('modal-title');
    if (modal) {
        modal.classList.remove('hidden');
    }
    if (modalTitle) {
        modalTitle.textContent = 'Tambah Pendaki Baru';
    }

    // Add submit event to the form
    const form = document.getElementById('add-pendaki-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const pendakiData = {
                nama_lengkap: document.getElementById('nama_lengkap').value,
                nik: document.getElementById('nik').value,
                nomor_telepon: document.getElementById('nomor_telepon').value,
                kontak_darurat: document.getElementById('kontak_darurat').value,
                alamat: document.getElementById('alamat').value,
                id_reservasi: parseInt(document.getElementById('id_reservasi').value),
                url_surat_sehat: document.getElementById('url_surat_sehat').value || null
            };

            if (window.pendakiModule) {
                window.pendakiModule.addPendaki(pendakiData);
            }
        });
    }
}

// Function to show edit pendaki form in modal
function showEditPendakiForm(pendakiId, pendakiData) {
    const modalContent = document.getElementById('modal-content');
    if (!modalContent) return;

    modalContent.innerHTML = `
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Edit Pendaki</h3>
        <form id="edit-pendaki-form">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="edit_nama_lengkap">
                        <i class="fas fa-user mr-1"></i> Nama Lengkap *
                    </label>
                    <input type="text" id="edit_nama_lengkap" class="input-modern w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" value="${pendakiData.nama_lengkap || ''}" required>
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="edit_nik">
                        <i class="fas fa-id-card mr-1"></i> NIK *
                    </label>
                    <input type="text" id="edit_nik" class="input-modern w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" value="${pendakiData.nik || ''}" required>
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="edit_nomor_telepon">
                        <i class="fas fa-phone mr-1"></i> Nomor Telepon *
                    </label>
                    <input type="text" id="edit_nomor_telepon" class="input-modern w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" value="${pendakiData.nomor_telepon || ''}" required>
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="edit_kontak_darurat">
                        <i class="fas fa-phone-alt mr-1"></i> Kontak Darurat *
                    </label>
                    <input type="text" id="edit_kontak_darurat" class="input-modern w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" value="${pendakiData.kontak_darurat || ''}" required>
                </div>
                <div class="md:col-span-2">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="edit_alamat">
                        <i class="fas fa-home mr-1"></i> Alamat *
                    </label>
                    <textarea id="edit_alamat" class="input-modern w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" rows="2" required>${pendakiData.alamat || ''}</textarea>
                </div>
                <div class="md:col-span-2">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="edit_url_surat_sehat">
                        <i class="fas fa-file-medical mr-1"></i> URL Surat Sehat
                    </label>
                    <input type="url" id="edit_url_surat_sehat" class="input-modern w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" value="${pendakiData.url_surat_sehat || ''}">
                    <p class="text-xs text-gray-500 mt-1">Alamat URL untuk surat keterangan sehat (opsional)</p>
                </div>
            </div>
        </form>
    `;

    // Show the modal
    const modal = document.getElementById('detailModal');
    const modalTitle = document.getElementById('modal-title');
    if (modal) {
        modal.classList.remove('hidden');
    }
    if (modalTitle) {
        modalTitle.textContent = 'Edit Pendaki';
    }

    // Add submit event to the form
    const form = document.getElementById('edit-pendaki-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const updatedPendakiData = {
                nama_lengkap: document.getElementById('edit_nama_lengkap').value,
                nik: document.getElementById('edit_nik').value,
                nomor_telepon: document.getElementById('edit_nomor_telepon').value,
                kontak_darurat: document.getElementById('edit_kontak_darurat').value,
                alamat: document.getElementById('edit_alamat').value,
                url_surat_sehat: document.getElementById('edit_url_surat_sehat').value || null
            };

            if (window.pendakiModule) {
                window.pendakiModule.updatePendaki(pendakiId, updatedPendakiData);
            }
        });
    }
}

// Function to handle editing a reservation hiker
window.editPendakiFromRombongan = function(id_pendaki) {
    // Fetch the specific pendaki data by ID
    fetch(`api/pendaki.php?id_pendaki=${id_pendaki}`)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success' && result.data) {
                showEditPendakiForm(id_pendaki, result.data);
            } else {
                Utils.showMessage('error', 'Pendaki tidak ditemukan');
            }
        })
        .catch(error => {
            console.error('Error fetching pendaki data:', error);
            Utils.showMessage('error', 'Error connecting to server');
        });
};

// Function to handle deleting a reservation hiker
window.deletePendakiFromRombongan = function(id_pendaki, nama_lengkap) {
    if (confirm(`Apakah Anda yakin ingin menghapus pendaki ${nama_lengkap}?`)) {
        if (window.pendakiModule) {
            window.pendakiModule.deletePendaki(id_pendaki);
        }
    }
};
