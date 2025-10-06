// pendaki_php.js - Pendaki module using PHP backend
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
                    <td colspan="6" class="px-6 py-4 text-center text-gray-500">Tidak ada data pendaki ditemukan</td>
                </tr>
            `;
            document.getElementById('pendaki-jumlah-entri').textContent = '0';
            document.getElementById('pendaki-total-entri').textContent = '0';
            return;
        }

        pendakiList.forEach((pendaki, index) => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4 text-sm font-medium text-gray-900">${pendaki.nama_lengkap}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${pendaki.nik}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${pendaki.nomor_telepon}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${pendaki.alamat}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${pendaki.kontak_darurat}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${pendaki.kode_reservasi}</td>
            `;
            tbody.appendChild(row);
        });

        // Update entry counts
        document.getElementById('pendaki-jumlah-entri').textContent = pendakiList.length;
        document.getElementById('pendaki-total-entri').textContent = pendakiList.length;
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