// announcement_php.js - Announcement module using PHP backend
export class AnnouncementModule {
    constructor() {
        this.apiBaseUrl = 'api';
    }

    async loadAnnouncements() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/pengumuman.php`);
            const result = await response.json();

            if (result.status === 'success') {
                this.updateAnnouncementsTable(result.data);
            } else {
                console.error('Error loading announcements:', result.message);
                this.showMessage('error', result.message || 'Failed to load announcements');
            }
        } catch (error) {
            console.error('Error loading announcements:', error);
            this.showMessage('error', 'Error connecting to server');
        }
    }

    async saveAnnouncement(judul, konten, startDate, endDate, telah_terbit) {
        try {
            // Get the current admin ID from the session
            const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
            if (sessionError || !session) {
                throw new Error('Sesi admin tidak valid');
            }
            
            const adminId = session.user.id;
            
            // Format dates properly to ensure they are in the right format for Supabase
            // The date input field returns YYYY-MM-DD format which should be valid
            const formattedStartDate = startDate + 'T00:00:00+00:00';
            const formattedEndDate = endDate + 'T23:59:59+00:00';
            
            const response = await fetch(`${this.apiBaseUrl}/pengumuman.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    judul: judul,
                    konten: konten,
                    start_date: formattedStartDate,
                    end_date: formattedEndDate,
                    telah_terbit: telah_terbit === 'true',
                    id_admin: adminId
                })
            });
            
            const result = await response.json();

            if (result.status === 'success') {
                this.showMessage('success', result.message);
                // Clear the form
                document.getElementById('pengumuman-form').reset();
                // Reload the data to reflect the changes
                this.loadAnnouncements();
            } else {
                console.error('Error saving announcement:', result.message);
                this.showMessage('error', result.message || 'Failed to save announcement');
            }
        } catch (error) {
            console.error('Error saving announcement:', error);
            this.showMessage('error', 'Error connecting to server');
        }
    }

    async updateAnnouncement(id_pengumuman, judul, konten, startDate, endDate, telah_terbit) {
        try {
            // Format dates properly to ensure they are in the right format for Supabase
            // The date input field returns YYYY-MM-DD format which should be valid
            const formattedStartDate = startDate + 'T00:00:00+00:00';
            const formattedEndDate = endDate + 'T23:59:59+00:00';
            
            const response = await fetch(`${this.apiBaseUrl}/pengumuman.php`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_pengumuman: id_pengumuman,
                    judul: judul,
                    konten: konten,
                    start_date: formattedStartDate,
                    end_date: formattedEndDate,
                    telah_terbit: telah_terbit
                })
            });
            
            const result = await response.json();

            if (result.status === 'success') {
                this.showMessage('success', result.message);
                // Reload the data to reflect the changes
                this.loadAnnouncements();
            } else {
                console.error('Error updating announcement:', result.message);
                this.showMessage('error', result.message || 'Failed to update announcement');
            }
        } catch (error) {
            console.error('Error updating announcement:', error);
            this.showMessage('error', 'Error connecting to server');
        }
    }

    async deleteAnnouncement(id_pengumuman) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/pengumuman.php?id=${id_pengumuman}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();

            if (result.status === 'success') {
                this.showMessage('success', result.message);
                // Reload the data to reflect the changes
                this.loadAnnouncements();
            } else {
                console.error('Error deleting announcement:', result.message);
                this.showMessage('error', result.message || 'Failed to delete announcement');
            }
        } catch (error) {
            console.error('Error deleting announcement:', error);
            this.showMessage('error', 'Error connecting to server');
        }
    }

    updateAnnouncementsTable(announcements) {
        const tbody = document.getElementById('pengumuman-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!announcements || announcements.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-4 text-center text-gray-500">Tidak ada pengumuman</td>
                </tr>
            `;
            return;
        }

        announcements.forEach(announcement => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-50';
            
            const startDate = new Date(announcement.start_date).toLocaleDateString();
            const endDate = new Date(announcement.end_date).toLocaleDateString();
            const createdAt = new Date(announcement.dibuat_pada).toLocaleDateString();
            
            row.innerHTML = `
                <td class="px-6 py-4 text-sm font-medium text-gray-900">${announcement.judul}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${createdAt}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${startDate} - ${endDate}</td>
                <td class="px-6 py-4">
                    <span class="status-badge ${announcement.telah_terbit ? 'status-terkonfirmasi' : 'status-dibatalkan'}">
                        ${announcement.telah_terbit ? 'Terbit' : 'Belum Terbit'}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm font-medium">
                    <button onclick="window.editAnnouncement(${announcement.id_pengumuman})" class="text-blue-600 hover:text-blue-900 mr-4">
                        Edit
                    </button>
                    <button onclick="window.deleteAnnouncement(${announcement.id_pengumuman})" class="text-red-600 hover:text-red-900">
                        Hapus
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    switchAnnouncementTab(tabName) {
        // Hide all announcement content sections
        const daftarContent = document.getElementById('daftar-pengumuman-content');
        const tambahContent = document.getElementById('tambah-pengumuman-content');

        if (daftarContent) daftarContent.classList.add('hidden');
        if (tambahContent) tambahContent.classList.add('hidden');

        // Remove active class from all tabs
        const daftarTab = document.getElementById('daftar-pengumuman-tab');
        const tambahTab = document.getElementById('tambah-pengumuman-tab');

        if (daftarTab) {
            daftarTab.classList.remove('text-green-600', 'border-green-600');
            daftarTab.classList.add('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        }
        
        if (tambahTab) {
            tambahTab.classList.remove('text-green-600', 'border-green-600');
            tambahTab.classList.add('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        }

        // Show selected content and activate tab
        if (tabName === 'daftar' && daftarContent) {
            daftarContent.classList.remove('hidden');
            if (daftarTab) {
                daftarTab.classList.remove('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
                daftarTab.classList.add('text-green-600', 'border-green-600');
            }
            // Load announcement data if not already loaded
            this.loadAnnouncements();
        } else if (tabName === 'tambah' && tambahContent) {
            tambahContent.classList.remove('hidden');
            if (tambahTab) {
                tambahTab.classList.remove('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
                tambahTab.classList.add('text-green-600', 'border-green-600');
            }
            
            // Setup pengumuman form when switching to tambah tab
            // We need to access the global setupPengumumanForm function
            if (window.setupPengumumanForm && typeof window.setupPengumumanForm === 'function') {
                window.setupPengumumanForm(this);
            }
        }
        
        // Add event listeners if they don't exist yet
        this.setupTabEventListeners();
    }
    
    setupTabEventListeners() {
        const daftarTab = document.getElementById('daftar-pengumuman-tab');
        const tambahTab = document.getElementById('tambah-pengumuman-tab');
        
        // Check if event listeners have already been added to avoid duplicates
        if (daftarTab && !daftarTab.dataset.listenerAdded) {
            daftarTab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchAnnouncementTab('daftar');
            });
            daftarTab.dataset.listenerAdded = 'true';
        }
        
        if (tambahTab && !tambahTab.dataset.listenerAdded) {
            tambahTab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchAnnouncementTab('tambah');
            });
            tambahTab.dataset.listenerAdded = 'true';
        }
    }
    
    // Method to populate form for editing
    async editAnnouncement(id_pengumuman) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/pengumuman.php?id=${id_pengumuman}`);
            const result = await response.json();
            
            if (result.status === 'success' && result.data && result.data.length > 0) {
                const announcement = result.data[0];
                
                // Fill the form with announcement data
                document.getElementById('judul-pengumuman').value = announcement.judul;
                document.getElementById('konten-pengumuman').value = announcement.konten;
                // Extract date part from timestamp (YYYY-MM-DD)
                document.getElementById('tanggal-mulai').value = announcement.start_date.split('T')[0];
                document.getElementById('tanggal-selesai').value = announcement.end_date.split('T')[0];
                document.getElementById('status-pengumuman').value = announcement.telah_terbit.toString();
                
                // Switch to the form tab
                this.switchAnnouncementTab('tambah');
                
                // Change the form submit behavior to update instead of create
                const form = document.getElementById('pengumuman-form');
                if (form) {
                    // Store the ID for update operation
                    form.setAttribute('data-id-pengumuman', id_pengumuman);
                    
                    // Change button text to "Update"
                    const submitButton = form.querySelector('button[type="submit"]');
                    if (submitButton) {
                        submitButton.innerHTML = '<i class="fas fa-sync-alt mr-2"></i> Update Pengumuman';
                    }
                    
                    // Temporarily change the submit handler to update
                    const originalOnSubmit = form.onsubmit;
                    form.onsubmit = (e) => {
                        e.preventDefault();
                        this.updateAnnouncement(
                            id_pengumuman,
                            document.getElementById('judul-pengumuman').value,
                            document.getElementById('konten-pengumuman').value,
                            document.getElementById('tanggal-mulai').value,
                            document.getElementById('tanggal-selesai').value,
                            document.getElementById('status-pengumuman').value
                        );
                        
                        // Reset the form to original state
                        setTimeout(() => {
                            if (submitButton) {
                                submitButton.innerHTML = '<i class="fas fa-save mr-2"></i> Simpan Pengumuman';
                            }
                            form.onsubmit = originalOnSubmit;
                            form.removeAttribute('data-id-pengumuman');
                        }, 1000);
                    };
                }
            } else {
                this.showMessage('error', result.message || 'Pengumuman tidak ditemukan');
            }
        } catch (error) {
            console.error('Error editing announcement:', error);
            this.showMessage('error', 'Error connecting to server');
        }
    }

    showMessage(type, message) {
        // Reuse the existing showMessage function from utils
        if (window.Utils && window.Utils.showMessage) {
            window.Utils.showMessage(type, message);
        } else {
            console.error('Utils.showMessage not available');
        }
    }
}