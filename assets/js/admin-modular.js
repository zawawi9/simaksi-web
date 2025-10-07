// admin.js - Admin dashboard main module

import { DashboardModule } from './modules/dashboard_php.js';
import { ReservationsModule } from './modules/reservasi_php.js';
import { QuotasModule } from './modules/quotas_php.js';
import { FinanceModule } from './modules/finance_php.js';
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
        await checkAdminSession();

        // Initialize modules
        const dashboardModule = new DashboardModule();
        const reservationsModule = new ReservationsModule();
        const quotasModule = new QuotasModule();
        const financeModule = new FinanceModule();
        const router = new Router(dashboardModule, reservationsModule, quotasModule, financeModule);

        // Make modules available globally for HTML onclick events
        window.dashboardModule = dashboardModule;
        window.reservationsModule = reservationsModule;
        window.quotasModule = quotasModule;
        window.financeModule = financeModule;
        
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

        // Verify if user is an admin from the pengguna table using Supabase directly
        const { data: userData, error: userError } = await window.supabase
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
function setupPengeluaranForm(financeModule) {
    const pengeluaranForm = document.getElementById('pengeluaran-form');
    
    if (pengeluaranForm) {
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
            
            if (financeModule) {
                financeModule.savePengeluaran(jumlah, tanggal, keterangan, kategori);
            }
        });
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
}

// Make some functions available globally for HTML onclick events
window.switchKeuanganTab = function(tabName) {
    // This function will be updated after modules are initialized
    if (window.financeModule) {
        window.financeModule.switchKeuanganTab(tabName);
    }
};

// Function to show reservation details in modal
window.showReservationDetail = function(id_reservasi) {
    // This function will be implemented to fetch and show reservation details
    fetch(`api/reservasi.php?id=${id_reservasi}`)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success' && result.data.length > 0) {
                const reservasi = result.data[0];
                
                // Update modal content
                const rombonganList = document.getElementById('rombongan-list');
                const barangList = document.getElementById('barang-list');
                
                if (rombonganList) {
                    rombonganList.innerHTML = '';
                    reservasi.pendaki_rombongan.forEach(pendaki => {
                        const li = document.createElement('li');
                        li.className = 'mb-2';
                        li.textContent = `${pendaki.nama_lengkap} - ${pendaki.nik}`;
                        rombonganList.appendChild(li);
                    });
                }
                
                if (barangList) {
                    barangList.innerHTML = '';
                    reservasi.barang_bawaan.forEach(barang => {
                        const li = document.createElement('li');
                        li.className = 'mb-2';
                        li.textContent = `${barang.nama_barang} (${barang.jenis_sampah})`;
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
window.confirmPayment = function(id_reservasi, kode_reservasi) {
    if (window.reservationsModule) {
        window.reservationsModule.confirmPayment(id_reservasi, kode_reservasi);
    }
};