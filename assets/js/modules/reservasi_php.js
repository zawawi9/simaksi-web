// reservations_php.js - Reservations module using PHP backend
export class ReservationsModule {
    constructor() {
        this.apiBaseUrl = 'api';
        this.currentPage = 1;
        this.itemsPerPage = 10;
    }

    async loadReservasiData(date = null, page = 1) {
        try {
            // Calculate offset for pagination (page - 1) * items per page
            const offset = (page - 1) * this.itemsPerPage;
            let url = `${this.apiBaseUrl}/reservasi.php`;
            
            if (date) {
                // If date is provided, filter by specific date
                url += `?date=${date}&limit=${this.itemsPerPage}&offset=${offset}`;
            } else {
                // If no date is provided, load ALL reservations with pagination
                url += `?all=true&limit=${this.itemsPerPage}&offset=${offset}`;
            }
            
            const response = await fetch(url);
            const result = await response.json();

            if (result.status === 'success') {
                // Count total records for pagination
                let countUrl = `${this.apiBaseUrl}/reservasi.php`;
                if (date) {
                    // If date is provided, filter by specific date
                    countUrl += `?date=${date}&select=count(*)`;
                } else {
                    // If no date is provided, count ALL reservations
                    countUrl += '?all=true&select=count(*)';
                }
                
                const countResponse = await fetch(countUrl);
                const countResult = await countResponse.json();
                
                let totalCount = 0;
                if (countResult.status === 'success' && countResult.data && countResult.data.length > 0) {
                    totalCount = countResult.data[0].count || 0;
                }
                
                this.updateReservasiTable(result.data, totalCount, page);
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
            let url = `${this.apiBaseUrl}/reservasi.php?limit=${this.itemsPerPage}&offset=0`; // Reset to first page on search
            if (kode) url += `&kode=${encodeURIComponent(kode)}`;
            if (nama) url += `&nama=${encodeURIComponent(nama)}`;

            const response = await fetch(url);
            const result = await response.json();

            if (result.status === 'success') {
                // For search results, get the total count
                let countUrl = `${this.apiBaseUrl}/reservasi.php?select=count(*)`;
                if (kode) countUrl += `&kode=${encodeURIComponent(kode)}`;
                if (nama) countUrl += `&nama=${encodeURIComponent(nama)}`;
                
                const countResponse = await fetch(countUrl);
                const countResult = await countResponse.json();
                
                let totalCount = 0;
                if (countResult.status === 'success' && countResult.data && countResult.data.length > 0) {
                    totalCount = countResult.data[0].count || 0;
                }
                
                this.updateReservasiTable(result.data, totalCount, 1); // Page 1 for search results
            } else {
                console.error('Error searching reservation data:', result.message);
                this.showMessage('error', result.message || 'Failed to search reservation data');
            }
        } catch (error) {
            console.error('Error searching reservation data:', error);
            this.showMessage('error', 'Error connecting to server');
        }
    }

    updateReservasiTable(reservasiList, totalCount = 0, currentPage = 1) {
        const tbody = document.getElementById('reservasi-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!reservasiList || reservasiList.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">Tidak ada reservasi ditemukan</td>
                </tr>
            `;
            document.getElementById('jumlah-entri').textContent = '0';
            document.getElementById('total-entri').textContent = '0';
            this.updatePaginationControls(currentPage, totalCount);
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
                <td class="px-6 py-4">
                    <span class="status-badge status-${this.getSampahStatusClass(reservasi.status_sampah)}">
                        ${this.getSampahStatusText(reservasi.status_sampah)}
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

        // Update entry counts and pagination
        document.getElementById('jumlah-entri').textContent = reservasiList.length;
        document.getElementById('total-entri').textContent = totalCount;
        this.updatePaginationControls(currentPage, totalCount);
    }
    
    updatePaginationControls(currentPage, totalCount) {
        const totalPages = Math.ceil(totalCount / this.itemsPerPage);
        const prevButton = document.getElementById('prev-page');
        const nextButton = document.getElementById('next-page');
        const currentPageSpan = document.querySelector('#prev-page ~ span'); // Find the current page span
        
        if (currentPageSpan) {
            currentPageSpan.textContent = currentPage;
        }
        
        // Update previous button
        if (prevButton) {
            prevButton.disabled = currentPage <= 1;
            if (currentPage > 1) {
                prevButton.classList.remove('bg-gray-200', 'hover:bg-gray-300');
                prevButton.classList.add('bg-green-500', 'hover:bg-green-600');
            } else {
                prevButton.classList.remove('bg-green-500', 'hover:bg-green-600');
                prevButton.classList.add('bg-gray-200', 'hover:bg-gray-300');
            }
        }
        
        // Update next button
        if (nextButton) {
            nextButton.disabled = currentPage >= totalPages;
            if (currentPage < totalPages) {
                nextButton.classList.remove('bg-gray-200', 'hover:bg-gray-300');
                nextButton.classList.add('bg-green-500', 'hover:bg-green-600');
            } else {
                nextButton.classList.remove('bg-green-500', 'hover:bg-green-600');
                nextButton.classList.add('bg-gray-200', 'hover:bg-gray-300');
            }
        }
        
        // Add event listeners for pagination buttons
        this.setupPaginationEvents(currentPage, totalPages);
    }
    
    setupPaginationEvents(currentPage, totalPages) {
        const prevButton = document.getElementById('prev-page');
        const nextButton = document.getElementById('next-page');
        
        if (prevButton) {
            // Remove existing event listeners to avoid duplication
            prevButton.replaceWith(prevButton.cloneNode(true)); 
            const newPrevButton = document.getElementById('prev-page');
            
            if (newPrevButton && currentPage > 1) {
                newPrevButton.addEventListener('click', () => {
                    this.loadReservasiData(null, currentPage - 1);
                });
            }
        }
        
        if (nextButton) {
            // Remove existing event listeners to avoid duplication 
            nextButton.replaceWith(nextButton.cloneNode(true));
            const newNextButton = document.getElementById('next-page');
            
            if (newNextButton && currentPage < totalPages) {
                newNextButton.addEventListener('click', () => {
                    this.loadReservasiData(null, currentPage + 1);
                });
            }
        }
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

    getSampahStatusClass(statusSampah) {
        switch (statusSampah) {
            case 'belum_dicek': return 'menunggu';
            case 'sesuai': return 'terkonfirmasi';
            case 'tidak_sesuai': return 'dibatalkan';
            default: return 'menunggu';
        }
    }

    getSampahStatusText(statusSampah) {
        switch (statusSampah) {
            case 'belum_dicek': return 'Belum Dicek';
            case 'sesuai': return 'Sesuai';
            case 'tidak_sesuai': return 'Tidak Sesuai';
            default: return statusSampah;
        }
    }
    
    formatCurrency(amount) {
        return 'Rp ' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    async confirmPayment(id_reservasi, kode_reservasi) {
        try {
            // Get the current admin ID from the session and access token
            const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
            if (sessionError || !session) {
                throw new Error('Sesi admin tidak valid');
            }
            
            // Get access token to include in authorization header
            const accessToken = session.access_token;
            
            const response = await fetch(`${this.apiBaseUrl}/konfirmasi_pembayaran.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`  // Include access token for auth context
                },
                body: JSON.stringify({
                    id_reservasi: id_reservasi
                })
            });
            
            const result = await response.json();

            if (result.status === 'sukses') {
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

    async updateSampahStatus(id_reservasi, status_sampah) {
        try {
            // Get the current admin ID from the session
            const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
            if (sessionError || !session) {
                throw new Error('Sesi admin tidak valid');
            }
            
            const adminId = session.user.id;
            
            const response = await fetch(`${this.apiBaseUrl}/reservasi.php`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_reservasi: id_reservasi,
                    status_sampah: status_sampah,
                    id_admin: adminId
                })
            });
            
            const result = await response.json();

            if (result.status === 'success') {
                this.showMessage('success', result.message || 'Status sampah berhasil diperbarui');
                // Reload the data to reflect the changes
                this.loadReservasiData();
                // Hide the modal if it's open
                if (window.Utils && window.Utils.hideModal) {
                    window.Utils.hideModal();
                }
            } else {
                console.error('Error updating sampah status:', result.message);
                this.showMessage('error', result.message || 'Gagal memperbarui status sampah');
            }
        } catch (error) {
            console.error('Error updating sampah status:', error);
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