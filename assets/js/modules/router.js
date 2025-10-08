// router.js - Routing module

export class Router {
    constructor(dashboardModule, reservationsModule, quotasModule, financeModule, announcementModule = null, penggunaModule = null) {
        this.dashboardModule = dashboardModule;
        this.reservationsModule = reservationsModule;
        this.quotasModule = quotasModule;
        this.financeModule = financeModule;
        this.announcementModule = announcementModule;
        this.penggunaModule = penggunaModule;
    }

    setupNavigation() {
        const navDashboard = document.getElementById('nav-dashboard');
        const navReservasi = document.getElementById('nav-reservasi');
        const navKuota = document.getElementById('nav-kuota');
        const navKeuangan = document.getElementById('nav-keuangan');
        const navPengumuman = document.getElementById('nav-pengumuman');
        const navPengguna = document.getElementById('nav-pengguna');
        const navBikinReservasi = document.getElementById('nav-bikin-reservasi');

        if (navDashboard) {
            navDashboard.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchContent('dashboard');
            });
        }

        if (navReservasi) {
            navReservasi.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchContent('reservasi');
            });
        }

        if (navKuota) {
            navKuota.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchContent('kuota');
            });
        }

        if (navKeuangan) {
            navKeuangan.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchContent('keuangan');
            });
        }

        if (navPengumuman) {
            navPengumuman.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchContent('pengumuman');
            });
        }

        if (navPengguna) {
            navPengguna.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchContent('pengguna');
            });
        }

        if (navBikinReservasi) {
            navBikinReservasi.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchContent('bikin-reservasi');
            });
        }
    }

    switchContent(contentType) {
        // Hide all content areas
        const dashboardContent = document.getElementById('dashboard-content');
        const reservasiContent = document.getElementById('reservasi-content');
        const kuotaContent = document.getElementById('kuota-content');
        const keuanganContent = document.getElementById('keuangan-content');
        const pengumumanContent = document.getElementById('pengumuman-content');
        const penggunaContent = document.getElementById('pengguna-content');
        const bikinReservasiContent = document.getElementById('bikin-reservasi-content');

        if (dashboardContent) dashboardContent.classList.add('hidden');
        if (reservasiContent) reservasiContent.classList.add('hidden');
        if (kuotaContent) kuotaContent.classList.add('hidden');
        if (keuanganContent) keuanganContent.classList.add('hidden');
        if (pengumumanContent) pengumumanContent.classList.add('hidden');
        if (penggunaContent) penggunaContent.classList.add('hidden');
        if (bikinReservasiContent) bikinReservasiContent.classList.add('hidden');

        // Remove active class from all nav items
        document.querySelectorAll('nav a').forEach(link => {
            link.classList.remove('active');
            link.classList.remove('bg-green-700');
            link.classList.add('hover:bg-green-700');
        });

        // Add active class to clicked nav item
        const pageTitle = document.getElementById('page-title');
        if (contentType === 'dashboard' && dashboardContent) {
            document.getElementById('nav-dashboard').classList.add('active');
            document.getElementById('nav-dashboard').classList.remove('hover:bg-green-700');
            dashboardContent.classList.remove('hidden');
            if (pageTitle) {
                pageTitle.innerHTML = '<i class="fas fa-home mr-2 text-green-600"></i> Dashboard Utama';
            }
            this.dashboardModule.loadDashboardSummary();
        } else if (contentType === 'reservasi' && reservasiContent) {
            document.getElementById('nav-reservasi').classList.add('active');
            document.getElementById('nav-reservasi').classList.remove('hover:bg-green-700');
            reservasiContent.classList.remove('hidden');
            if (pageTitle) {
                pageTitle.innerHTML = '<i class="fas fa-list mr-2 text-green-600"></i> Manajemen Reservasi';
            }
            this.reservationsModule.loadReservasiData();
        } else if (contentType === 'kuota' && kuotaContent) {
            document.getElementById('nav-kuota').classList.add('active');
            document.getElementById('nav-kuota').classList.remove('hover:bg-green-700');
            kuotaContent.classList.remove('hidden');
            if (pageTitle) {
                pageTitle.innerHTML = '<i class="fas fa-ticket-alt mr-2 text-green-600"></i> Manajemen Kuota';
            }
            this.quotasModule.loadKuotaData();
            // Load pricing settings when accessing the kuota module
            if (window.pricingSettingsModule) {
                window.pricingSettingsModule.loadPricingData();
            }
        } else if (contentType === 'keuangan' && keuanganContent) {
            document.getElementById('nav-keuangan').classList.add('active');
            document.getElementById('nav-keuangan').classList.remove('hover:bg-green-700');
            keuanganContent.classList.remove('hidden');
            if (pageTitle) {
                pageTitle.innerHTML = '<i class="fas fa-money-bill-wave mr-2 text-green-600"></i> Manajemen Keuangan';
            }
        } else if (contentType === 'pengumuman' && pengumumanContent) {
            document.getElementById('nav-pengumuman').classList.add('active');
            document.getElementById('nav-pengumuman').classList.remove('hover:bg-green-700');
            pengumumanContent.classList.remove('hidden');
            if (pageTitle) {
                pageTitle.innerHTML = '<i class="fas fa-bullhorn mr-2 text-green-600"></i> Manajemen Pengumuman';
            }
            // Initialize pengumuman module tabs
            if (this.announcementModule) {
                // Set default to daftar pengumuman
                this.announcementModule.switchAnnouncementTab('daftar');
                
                // Add click event for "Buat Pengumuman Baru" button
                setTimeout(() => {
                    const tambahBtn = document.getElementById('tambah-pengumuman-tab');
                    if (tambahBtn) {
                        tambahBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            this.announcementModule.switchAnnouncementTab('tambah');
                        });
                    }
                }, 100);
            }
        } else if (contentType === 'pengguna' && penggunaContent) {
            document.getElementById('nav-pengguna').classList.add('active');
            document.getElementById('nav-pengguna').classList.remove('hover:bg-green-700');
            penggunaContent.classList.remove('hidden');
            if (pageTitle) {
                pageTitle.innerHTML = '<i class="fas fa-users mr-2 text-green-600"></i> Manajemen Pengguna';
            }
            // Load pengguna data if module is available
            if (this.penggunaModule) {
                this.penggunaModule.loadPenggunaData();
            }
        } else if (contentType === 'bikin-reservasi' && bikinReservasiContent) {
            document.getElementById('nav-bikin-reservasi').classList.add('active');
            document.getElementById('nav-bikin-reservasi').classList.remove('hover:bg-green-700');
            bikinReservasiContent.classList.remove('hidden');
            if (pageTitle) {
                pageTitle.innerHTML = '<i class="fas fa-calendar-plus mr-2 text-green-600"></i> Buat Reservasi Baru';
            }
        }
    }
}