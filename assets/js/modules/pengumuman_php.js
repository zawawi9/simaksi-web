// pengumuman_php.js - Pengumuman module using PHP backend
export class PengumumanModule {
    constructor() {
        this.apiBaseUrl = 'api';
    }

    async loadPengumumanData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/pengumuman.php`);
            const result = await response.json();

            if (result.status === 'success') {
                this.updatePengumumanTable(result.data);
                this.loadPengumumanAktif();
            } else {
                console.error('Error loading pengumuman data:', result.message);
                this.showMessage('error', result.message || 'Failed to load pengumuman data');
            }
        } catch (error) {
            console.error('Error loading pengumuman data:', error);
            this.showMessage('error', 'Error connecting to server');
        }
    }

    async savePengumuman(judul, konten, startDate, endDate, telah_terbit = false) {
        try {
            // In a real app, this would come from the session
            const id_admin = '00000000-0000-0000-0000-000000000000'; // placeholder
            
            const response = await fetch(`${this.apiBaseUrl}/pengumuman.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    judul: judul,
                    konten: konten,
                    start_date: startDate,
                    end_date: endDate,
                    id_admin: id_admin,
                    telah_terbit: telah_terbit
                })
            });
            
            const result = await response.json();

            if (result.status === 'success') {
                this.showMessage('success', result.message || 'Pengumuman berhasil disimpan');
                // Clear the form
                document.getElementById('pengumuman-form').reset();
                // Reload the pengumuman list
                this.loadPengumumanData();
            } else {
                console.error('Error saving pengumuman:', result.message);
                this.showMessage('error', result.message || 'Failed to save pengumuman');
            }
        } catch (error) {
            console.error('Error saving pengumuman:', error);
            this.showMessage('error', 'Error connecting to server');
        }
    }

    updatePengumumanTable(pengumumanList) {
        const tbody = document.getElementById('pengumuman-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!pengumumanList || pengumumanList.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-4 text-center text-gray-500">Tidak ada pengumuman ditemukan</td>
                </tr>
            `;
            return;
        }

        pengumumanList.forEach((pengumuman, index) => {
            const startDate = new Date(pengumuman.start_date).toLocaleString();
            const endDate = new Date(pengumuman.end_date).toLocaleString();
            
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4 text-sm font-medium text-gray-900">${pengumuman.judul}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${startDate}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${endDate}</td>
                <td class="px-6 py-4">
                    <span class="status-badge ${pengumuman.telah_terbit ? 'status-terkonfirmasi' : 'status-menunggu'}">
                        ${pengumuman.telah_terbit ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm font-medium">
                    <button onclick="window.editPengumuman(${pengumuman.id_pengumuman})" 
                            class="text-blue-600 hover:text-blue-900 mr-3">
                        Edit
                    </button>
                    <button onclick="window.deletePengumuman(${pengumuman.id_pengumuman})" 
                            class="text-red-600 hover:text-red-900">
                        Hapus
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadPengumumanAktif() {
        try {
            const now = new Date().toISOString();
            const response = await fetch(`${this.apiBaseUrl}/pengumuman.php`);
            const result = await response.json();

            if (result.status === 'success') {
                const aktifPengumuman = result.data.filter(pengumuman => 
                    pengumuman.telah_terbit && 
                    new Date(pengumuman.start_date) <= new Date(now) && 
                    new Date(pengumuman.end_date) >= new Date(now)
                );

                const container = document.getElementById('pengumuman-aktif-container');
                if (!container) return;

                if (aktifPengumuman.length > 0) {
                    container.innerHTML = '';
                    aktifPengumuman.forEach(pengumuman => {
                        const pengumumanElement = document.createElement('div');
                        pengumumanElement.className = 'bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded';
                        pengumumanElement.innerHTML = `
                            <h4 class="font-bold text-gray-800 mb-2">${pengumuman.judul}</h4>
                            <p class="text-gray-700">${pengumuman.konten}</p>
                            <p class="text-sm text-gray-500 mt-2">Berlaku: ${new Date(pengumuman.start_date).toLocaleString()} - ${new Date(pengumuman.end_date).toLocaleString()}</p>
                        `;
                        container.appendChild(pengumumanElement);
                    });
                } else {
                    container.innerHTML = `
                        <div class="text-center text-gray-500 py-8">
                            <i class="fas fa-bullhorn text-4xl mb-3"></i>
                            <p>Belum ada pengumuman aktif saat ini</p>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Error loading aktif pengumuman:', error);
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