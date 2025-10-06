// reservations_php.js - Reservations module using PHP backend
export class ReservationsModule {
    constructor() {
        this.apiBaseUrl = 'api';
        this.currentPage = 1;
        this.itemsPerPage = 10;
    }

    async loadReservasiData(date = null) {
        try {
            if (!date) {
                date = new Date().toISOString().split('T')[0]; // Today's date
            }
            
            const response = await fetch(`${this.apiBaseUrl}/reservasi.php?date=${date}`);
            const result = await response.json();

            if (result.status === 'success') {
                this.updateReservasiTable(result.data);
            } else {
                console.error('Error loading reservation data:', result.message);
                this.showMessage('error', result.message || 'Failed to load reservation data');
            }
        } catch (error) {
            console.error('Error loading reservation data:', error);
            this.showMessage('error', 'Error connecting to server');
        }
    }

    async searchReservasi(kode = null, nama = null) {
        try {
            let url = `${this.apiBaseUrl}/reservasi.php?`;
            if (kode) url += `kode=${encodeURIComponent(kode)}&`;
            if (nama) url += `nama=${encodeURIComponent(nama)}&`;

            const response = await fetch(url);
            const result = await response.json();

            if (result.status === 'success') {
                this.updateReservasiTable(result.data);
            } else {
                console.error('Error searching reservation data:', result.message);
                this.showMessage('error', result.message || 'Failed to search reservation data');
            }
        } catch (error) {
            console.error('Error searching reservation data:', error);
            this.showMessage('error', 'Error connecting to server');
        }
    }

    updateReservasiTable(reservasiList) {
        const tbody = document.getElementById('reservasi-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!reservasiList || reservasiList.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-gray-500">Tidak ada reservasi ditemukan</td>
                </tr>
            `;
            document.getElementById('jumlah-entri').textContent = '0';
            document.getElementById('total-entri').textContent = '0';
            return;
        }

        reservasiList.forEach((reservasi, index) => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4 text-sm text-gray-700">${reservasi.kode_reservasi}</td>
                <td class="px-6 py-4 text-sm font-medium text-gray-900">${reservasi.nama_ketua_rombongan}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${new Date(reservasi.tanggal_pendakian).toLocaleDateString()}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${reservasi.jumlah_pendaki}</td>
                <td class="px-6 py-4">
                    <span class="status-badge status-${this.getStatusClass(reservasi.status)}">
                        ${this.getStatusText(reservasi.status)}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm font-medium">
                    <button onclick="window.showReservationDetail(${reservasi.id_reservasi})" 
                            class="text-blue-600 hover:text-blue-900 mr-4">
                        Detail
                    </button>
                    ${reservasi.status === 'menunggu_pembayaran' ? 
                        `<button onclick="window.confirmPayment(${reservasi.id_reservasi}, '${reservasi.kode_reservasi}')" 
                                class="text-green-600 hover:text-green-900">
                            Konfirmasi
                        </button>` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });

        // Update entry counts
        document.getElementById('jumlah-entri').textContent = reservasiList.length;
        document.getElementById('total-entri').textContent = reservasiList.length;
    }

    getStatusClass(status) {
        switch (status) {
            case 'menunggu_pembayaran': return 'menunggu';
            case 'terkonfirmasi': return 'terkonfirmasi';
            case 'dibatalkan': return 'dibatalkan';
            case 'selesai': return 'selesai';
            default: return 'menunggu';
        }
    }

    getStatusText(status) {
        switch (status) {
            case 'menunggu_pembayaran': return 'Menunggu Pembayaran';
            case 'terkonfirmasi': return 'Terkonfirmasi';
            case 'dibatalkan': return 'Dibatalkan';
            case 'selesai': return 'Selesai';
            default: return status;
        }
    }

    async confirmPayment(id_reservasi, kode_reservasi) {
        try {
            // Get admin ID - in a real app, this would come from session
            const adminId = '00000000-0000-0000-0000-000000000000'; // placeholder
            
            const response = await fetch(`${this.apiBaseUrl}/reservasi.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_reservasi: id_reservasi,
                    kode_reservasi: kode_reservasi,
                    admin_id: adminId
                })
            });
            
            const result = await response.json();

            if (result.status === 'success') {
                this.showMessage('success', result.message);
                // Reload the data to reflect the changes
                this.loadReservasiData();
                // Hide the modal if it's open
                if (window.Utils && window.Utils.hideModal) {
                    window.Utils.hideModal();
                }
            } else {
                console.error('Error confirming payment:', result.message);
                this.showMessage('error', result.message || 'Failed to confirm payment');
            }
        } catch (error) {
            console.error('Error confirming payment:', error);
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