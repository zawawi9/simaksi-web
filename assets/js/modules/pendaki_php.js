// pendaki_php.js - Pendaki module using PHP backend (for reservation hikers)
export class PendakiModule {
    constructor() {
        this.apiBaseUrl = 'api';
        this.currentPage = 1;
        this.itemsPerPage = 10;
    }

    async loadPendakiData(kode_reservasi = null, nama_pendaki = null) {
        try {
            let url = `${this.apiBaseUrl}/pendaki.php?`;
            if (kode_reservasi) url += `kode_reservasi=${encodeURIComponent(kode_reservasi)}&`;
            if (nama_pendaki) url += `nama_pendaki=${encodeURIComponent(nama_pendaki)}&`;

            const response = await fetch(url);
            const result = await response.json();

            if (result.status === 'success') {
                this.updatePendakiTable(result.data);
            } else {
                console.error('Error loading pendaki data:', result.message);
                this.showMessage('error', result.message || 'Failed to load pendaki data');
            }
        } catch (error) {
            console.error('Error loading pendaki data:', error);
            this.showMessage('error', 'Error connecting to server');
        }
    }

    async searchPendaki(kode_reservasi = null, nama_pendaki = null) {
        this.loadPendakiData(kode_reservasi, nama_pendaki);
    }

    updatePendakiTable(pendakiList) {
        const tbody = document.getElementById('pendaki-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!pendakiList || pendakiList.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">Tidak ada data pendaki ditemukan</td>
                </tr>
            `;
            document.getElementById('pendaki-jumlah-entri').textContent = '0';
            document.getElementById('pendaki-total-entri').textContent = '0';
            return;
        }

        pendakiList.forEach((pendaki, index) => {
            const suratSehatStatus = pendaki.url_surat_sehat ? 
                `<a href="${pendaki.url_surat_sehat}" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm">Lihat Surat Sehat</a>` : 
                '<span class="text-red-600 text-sm">Tidak ada surat sehat</span>';
                
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4 text-sm font-medium text-gray-900">${pendaki.nama_lengkap}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${pendaki.nik}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${pendaki.nomor_telepon}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${pendaki.alamat}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${pendaki.kontak_darurat}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${pendaki.kode_reservasi}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${suratSehatStatus}</td>
                <td class="px-6 py-4 text-sm text-gray-500">
                    <button onclick="window.editPendakiFromRombongan(${pendaki.id_pendaki})" class="text-blue-600 hover:text-blue-900 mr-3">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="window.deletePendakiFromRombongan(${pendaki.id_pendaki}, '${pendaki.nama_lengkap}')" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Update entry counts
        document.getElementById('pendaki-jumlah-entri').textContent = pendakiList.length;
        document.getElementById('pendaki-total-entri').textContent = pendakiList.length;
    }

    async addPendaki(pendakiData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/pendaki.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'create',
                    ...pendakiData
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                this.showMessage('success', 'Pendaki berhasil ditambahkan');
                // Reload the data to show the new hiker
                this.loadPendakiData();
                // Close the modal if it's open
                if (window.Utils && window.Utils.hideModal) {
                    window.Utils.hideModal();
                }
                return true;
            } else {
                this.showMessage('error', result.message || 'Gagal menambahkan pendaki');
                return false;
            }
        } catch (error) {
            console.error('Error adding pendaki:', error);
            this.showMessage('error', 'Error connecting to server');
            return false;
        }
    }

    async updatePendaki(id_pendaki, pendakiData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/pendaki.php`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'update',
                    id_pendaki: id_pendaki,
                    ...pendakiData
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                this.showMessage('success', 'Pendaki berhasil diperbarui');
                // Reload the data to show the updated hiker
                this.loadPendakiData();
                // Close the modal if it's open
                if (window.Utils && window.Utils.hideModal) {
                    window.Utils.hideModal();
                }
                return true;
            } else {
                this.showMessage('error', result.message || 'Gagal memperbarui pendaki');
                return false;
            }
        } catch (error) {
            console.error('Error updating pendaki:', error);
            this.showMessage('error', 'Error connecting to server');
            return false;
        }
    }

    async deletePendaki(id_pendaki) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/pendaki.php`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'delete',
                    id_pendaki: id_pendaki
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                this.showMessage('success', 'Pendaki berhasil dihapus');
                // Reload the data to remove the deleted hiker
                this.loadPendakiData();
                return true;
            } else {
                this.showMessage('error', result.message || 'Gagal menghapus pendaki');
                return false;
            }
        } catch (error) {
            console.error('Error deleting pendaki:', error);
            this.showMessage('error', 'Error connecting to server');
            return false;
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