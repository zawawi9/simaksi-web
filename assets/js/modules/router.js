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
        const navPromosiPoster = document.getElementById('nav-promosi-poster');
        const navKomentar = document.getElementById('nav-komentar');
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

        if (navPromosiPoster) {
            navPromosiPoster.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchContent('promosi-poster');
            });
        }

        if (navKomentar) {
            navKomentar.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchContent('komentar');
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
        const promosiPosterContent = document.getElementById('promosi-poster-content');
        const komentarContent = document.getElementById('komentar-content');
        const penggunaContent = document.getElementById('pengguna-content');
        const bikinReservasiContent = document.getElementById('bikin-reservasi-content');

        if (dashboardContent) dashboardContent.classList.add('hidden');
        if (reservasiContent) reservasiContent.classList.add('hidden');
        if (kuotaContent) kuotaContent.classList.add('hidden');
        if (keuanganContent) keuanganContent.classList.add('hidden');
        if (pengumumanContent) pengumumanContent.classList.add('hidden');
        if (promosiPosterContent) promosiPosterContent.classList.add('hidden');
        if (komentarContent) komentarContent.classList.add('hidden');
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
            
            // Initialize reservation tabs
            this.initializeReservationTabs();
            
            // Load reservation data
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
        } else if (contentType === 'promosi-poster' && promosiPosterContent) {
            document.getElementById('nav-promosi-poster').classList.add('active');
            document.getElementById('nav-promosi-poster').classList.remove('hover:bg-green-700');
            promosiPosterContent.classList.remove('hidden');
            if (pageTitle) {
                pageTitle.innerHTML = '<i class="fas fa-image mr-2 text-green-600"></i> Manajemen Promosi';
            }
            // Initialize promosi poster tabs
            setTimeout(() => {
                this.initializePromosiPosterTabs();
            }, 100);
        } else if (contentType === 'komentar' && komentarContent) {
            document.getElementById('nav-komentar').classList.add('active');
            document.getElementById('nav-komentar').classList.remove('hover:bg-green-700');
            komentarContent.classList.remove('hidden');
            if (pageTitle) {
                pageTitle.innerHTML = '<i class="fas fa-comment mr-2 text-green-600"></i> Manajemen Komentar';
            }
            // Initialize komentar tabs
            setTimeout(() => {
                this.initializeKomentarTabs();
            }, 100);
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
            // Load pricing data and users when accessing the new reservation module
            setTimeout(() => {
                console.log('Mencoba memanggil loadPricingData dari router');
                if (typeof loadPricingData === 'function') {
                    console.log('Memanggil loadPricingData');
                    loadPricingData();
                } else {
                    console.log('Fungsi loadPricingData tidak ditemukan');
                }
                
                console.log('Mencoba memanggil loadUsers dari router');
                if (typeof loadUsers === 'function') {
                    console.log('Memanggil loadUsers');
                    loadUsers();
                } else {
                    console.log('Fungsi loadUsers tidak ditemukan');
                }
            }, 500); // Small delay to ensure elements are ready
        }
    }
    
    initializePromosiPosterTabs() {
        const daftarPromosiTab = document.getElementById('daftar-promosi-tab');
        const tambahPromosiTab = document.getElementById('tambah-promosi-tab');
        
        if (daftarPromosiTab) {
            // Set default to daftar promosi
            document.getElementById('daftar-promosi-content').classList.remove('hidden');
            document.getElementById('tambah-promosi-content').classList.add('hidden');
            
            // Update active tab styling
            daftarPromosiTab.classList.add('active', 'text-green-600', 'border-green-600');
            if (tambahPromosiTab) {
                tambahPromosiTab.classList.remove('active', 'text-green-600', 'border-green-600');
            }
            
            // Add click event for "Tambah Promosi Baru" button
            setTimeout(() => {
                if (tambahPromosiTab) {
                    tambahPromosiTab.addEventListener('click', (e) => {
                        e.preventDefault();
                        document.getElementById('tambah-promosi-content').classList.remove('hidden');
                        document.getElementById('daftar-promosi-content').classList.add('hidden');
                        
                        // Update active tab styling
                        tambahPromosiTab.classList.add('active', 'text-green-600', 'border-green-600');
                        daftarPromosiTab.classList.remove('active', 'text-green-600', 'border-green-600');
                    });
                }
                
                if (daftarPromosiTab) {
                    daftarPromosiTab.addEventListener('click', (e) => {
                        e.preventDefault();
                        document.getElementById('daftar-promosi-content').classList.remove('hidden');
                        document.getElementById('tambah-promosi-content').classList.add('hidden');
                        
                        // Update active tab styling
                        daftarPromosiTab.classList.add('active', 'text-green-600', 'border-green-600');
                        if (tambahPromosiTab) {
                            tambahPromosiTab.classList.remove('active', 'text-green-600', 'border-green-600');
                        }
                    });
                }
            }, 100);
        }
    }
    
    initializeReservationTabs() {
        const daftarReservasiTab = document.getElementById('daftar-reservasi-tab');
        const buatReservasiTab = document.getElementById('buat-reservasi-tab');
        
        if (daftarReservasiTab) {
            // Set default to daftar reservasi
            document.getElementById('daftar-reservasi-content').classList.remove('hidden');
            document.getElementById('buat-reservasi-content').classList.add('hidden');
            
            // Update active tab styling
            daftarReservasiTab.classList.add('active', 'text-green-600', 'border-green-600');
            if (buatReservasiTab) {
                buatReservasiTab.classList.remove('active', 'text-green-600', 'border-green-600');
            }
            
            // Add click event for "Buat Reservasi Baru" button
            setTimeout(() => {
                if (buatReservasiTab) {
                    buatReservasiTab.addEventListener('click', (e) => {
                        e.preventDefault();
                        document.getElementById('buat-reservasi-content').classList.remove('hidden');
                        document.getElementById('daftar-reservasi-content').classList.add('hidden');
                        
                        // Update active tab styling
                        buatReservasiTab.classList.add('active', 'text-green-600', 'border-green-600');
                        daftarReservasiTab.classList.remove('active', 'text-green-600', 'border-green-600');
                        
                        // Load pricing data and users when the form is shown
                        if (typeof loadPricingData === 'function') {
                            loadPricingData();
                        }
                        if (typeof loadUsers === 'function') {
                            loadUsers();
                        }
                        if (typeof loadPromosi === 'function') {
                            loadPromosi();
                        }
                    });
                }
                
                if (daftarReservasiTab) {
                    daftarReservasiTab.addEventListener('click', (e) => {
                        e.preventDefault();
                        document.getElementById('daftar-reservasi-content').classList.remove('hidden');
                        document.getElementById('buat-reservasi-content').classList.add('hidden');
                        
                        // Update active tab styling
                        daftarReservasiTab.classList.add('active', 'text-green-600', 'border-green-600');
                        if (buatReservasiTab) {
                            buatReservasiTab.classList.remove('active', 'text-green-600', 'border-green-600');
                        }
                        
                        // Reload reservation data when the list tab is shown
                        if (typeof this.reservationsModule?.loadReservasiData === 'function') {
                            this.reservationsModule.loadReservasiData();
                        }
                    });
                }
            }, 100);
        }
    }
    
    initializeKomentarTabs() {
        const daftarKomentarTab = document.getElementById('daftar-komentar-tab');
        
        if (daftarKomentarTab) {
            // Set default to daftar komentar
            document.getElementById('daftar-komentar-content').classList.remove('hidden');
            
            // Update active tab styling
            daftarKomentarTab.classList.add('active', 'text-green-600', 'border-green-600');
            
            // Load comments data when the tab is shown
            setTimeout(() => {
                if (typeof loadKomentarData === 'function') {
                    loadKomentarData();
                }
            }, 200);
        }
    }
}