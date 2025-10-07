// dashboard_php.js - Dashboard module using PHP backend
export class DashboardModule {
    constructor() {
        this.apiBaseUrl = 'api';
    }

    async loadDashboardSummary() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/dashboard.php`);
            const result = await response.json();

            if (result.status === 'success') {
                const data = result.data;

                // Update dashboard statistics
                document.getElementById('total-pendaki-hari-ini').textContent = data.total_pendaki_hari_ini;
                document.getElementById('persentase-pendaki').textContent = `${data.persentase_pendaki}%`;
                document.getElementById('progress-pendaki').style.width = `${data.persentase_pendaki}%`;

                document.getElementById('total-reservasi').textContent = data.total_reservasi;
                document.getElementById('reservasi-menunggu').textContent = data.reservasi_menunggu;
                document.getElementById('reservasi-terbayar').textContent = data.reservasi_terbayar;
                const persentaseReservasi = data.total_reservasi > 0 ? (data.reservasi_terbayar / data.total_reservasi) * 100 : 0;
                document.getElementById('progress-reservasi').style.width = `${persentaseReservasi}%`;

                document.getElementById('pendapatan-hari-ini').textContent = Utils.formatRupiah(data.pendapatan_hari_ini);
                document.getElementById('persentase-pendapatan').textContent = `${data.persentase_pendapatan}%`;
                document.getElementById('progress-pendapatan').style.width = `${data.persentase_pendapatan}%`;

                document.getElementById('rata-rating').textContent = data.rata_rating;
                document.getElementById('jumlah-rating').textContent = data.jumlah_rating;

                // Update recent activities table
                this.updateAktivitasTable(data.aktivitas_terbaru);
            } else {
                console.error('Error loading dashboard data:', result.message);
                this.showMessage('error', result.message || 'Failed to load dashboard data');
            }
        } catch (error) {
            console.error('Error loading dashboard summary:', error);
            this.showMessage('error', 'Error connecting to server');
        }
    }

    updateAktivitasTable(aktivitas) {
        const tbody = document.getElementById('aktivitas-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!aktivitas || aktivitas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-4 text-center text-gray-500">Tidak ada aktivitas terbaru</td>
                </tr>
            `;
            return;
        }

        aktivitas.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4 text-sm text-gray-700">${new Date(item.tanggal_pesan).toLocaleString()}</td>
                <td class="px-6 py-4 text-sm font-medium text-gray-900">${item.nama_pengguna}</td>
                <td class="px-6 py-4 text-sm text-gray-700">Membuat reservasi</td>
                <td class="px-6 py-4 text-sm text-gray-700">${item.kode_reservasi}</td>
            `;
            tbody.appendChild(row);
        });
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