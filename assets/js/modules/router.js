// router.js - Routing module

export class Router {
    constructor(dashboardModule, reservationsModule, quotasModule, financeModule) {
        this.dashboardModule = dashboardModule;
        this.reservationsModule = reservationsModule;
        this.quotasModule = quotasModule;
        this.financeModule = financeModule;
    }

    setupNavigation() {
        const navDashboard = document.getElementById('nav-dashboard');
        const navReservasi = document.getElementById('nav-reservasi');
        const navKuota = document.getElementById('nav-kuota');
        const navKeuangan = document.getElementById('nav-keuangan');

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
    }

    switchContent(contentType) {
        // Hide all content areas
        const dashboardContent = document.getElementById('dashboard-content');
        const reservasiContent = document.getElementById('reservasi-content');
        const kuotaContent = document.getElementById('kuota-content');
        const keuanganContent = document.getElementById('keuangan-content');

        if (dashboardContent) dashboardContent.classList.add('hidden');
        if (reservasiContent) reservasiContent.classList.add('hidden');
        if (kuotaContent) kuotaContent.classList.add('hidden');
        if (keuanganContent) keuanganContent.classList.add('hidden');

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
        } else if (contentType === 'keuangan' && keuanganContent) {
            document.getElementById('nav-keuangan').classList.add('active');
            document.getElementById('nav-keuangan').classList.remove('hover:bg-green-700');
            keuanganContent.classList.remove('hidden');
            if (pageTitle) {
                pageTitle.innerHTML = '<i class="fas fa-money-bill-wave mr-2 text-green-600"></i> Manajemen Keuangan';
            }
        }
    }
}