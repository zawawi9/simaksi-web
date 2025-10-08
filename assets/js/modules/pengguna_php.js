// pengguna_php.js - Pengguna module using PHP backend
export class PenggunaModule {
    constructor() {
        this.apiBaseUrl = 'api';
        this.currentPage = 1;
        this.itemsPerPage = 10;
    }

    async loadPenggunaData(nama_pengguna = null, email_pengguna = null) {
        try {
            let url = `${this.apiBaseUrl}/pengguna.php?`;
            if (nama_pengguna) url += `nama_pengguna=${encodeURIComponent(nama_pengguna)}&`;
            if (email_pengguna) url += `email_pengguna=${encodeURIComponent(email_pengguna)}&`;

            const response = await fetch(url);
            const result = await response.json();

            if (result.status === 'success') {
                this.updatePenggunaTable(result.data);
            } else {
                console.error('Error loading pengguna data:', result.message);
                this.showMessage('error', result.message || 'Failed to load pengguna data');
            }
        } catch (error) {
            console.error('Error loading pengguna data:', error);
            this.showMessage('error', 'Error connecting to server');
        }
    }

    async searchPengguna(nama_pengguna = null, email_pengguna = null) {
        this.loadPenggunaData(nama_pengguna, email_pengguna);
    }

    updatePenggunaTable(penggunaList) {
        const tbody = document.getElementById('pengguna-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!penggunaList || penggunaList.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">Tidak ada data pengguna ditemukan</td>
                </tr>
            `;
            document.getElementById('pengguna-jumlah-entri').textContent = '0';
            document.getElementById('pengguna-total-entri').textContent = '0';
            return;
        }

        penggunaList.forEach((pengguna, index) => {
            const roleBadge = pengguna.peran === 'admin' 
                ? '<span class="status-badge status-terkonfirmasi">Admin</span>' 
                : '<span class="status-badge status-menunggu">Pendaki</span>';
                
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4 text-sm font-medium text-gray-900">${pengguna.nama_lengkap}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${pengguna.email}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${pengguna.nomor_telepon || '-'}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${pengguna.nik || '-'}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${pengguna.alamat || '-'}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${roleBadge}</td>
                <td class="px-6 py-4 text-sm text-gray-500">
                    <button onclick="window.editPengguna('${pengguna.id}')" class="text-blue-600 hover:text-blue-900 mr-3">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="window.deletePengguna('${pengguna.id}', '${pengguna.nama_lengkap}')" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Update entry counts
        document.getElementById('pengguna-jumlah-entri').textContent = penggunaList.length;
        document.getElementById('pengguna-total-entri').textContent = penggunaList.length;
    }

    async addPengguna(penggunaData) {
        try {
            // First, create a Supabase user
            const { data: authData, error: authError } = await window.supabase.auth.admin.createUser({
                email: penggunaData.email,
                password: penggunaData.password || 'DefaultPassword123!', // Default password for admin-created users
                emailConfirm: true // Assuming admin creates verified users
            });

            if (authError) {
                throw new Error(authError.message);
            }

            // Then add to the pengguna table
            const response = await fetch(`${this.apiBaseUrl}/pengguna.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'create',
                    id_pengguna: authData.user.id,
                    ...penggunaData
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                this.showMessage('success', 'Pengguna berhasil ditambahkan');
                // Reload the data to show the new user
                this.loadPenggunaData();
                // Close the modal if it's open
                if (window.Utils && window.Utils.hideModal) {
                    window.Utils.hideModal();
                }
                return true;
            } else {
                this.showMessage('error', result.message || 'Gagal menambahkan pengguna');
                return false;
            }
        } catch (error) {
            console.error('Error adding pengguna:', error);
            this.showMessage('error', error.message || 'Error connecting to server');
            return false;
        }
    }

    async updatePengguna(id_pengguna, penggunaData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/pengguna.php`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'update',
                    id_pengguna: id_pengguna,
                    ...penggunaData
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                this.showMessage('success', 'Pengguna berhasil diperbarui');
                // Reload the data to show the updated user
                this.loadPenggunaData();
                // Close the modal if it's open
                if (window.Utils && window.Utils.hideModal) {
                    window.Utils.hideModal();
                }
                return true;
            } else {
                this.showMessage('error', result.message || 'Gagal memperbarui pengguna');
                return false;
            }
        } catch (error) {
            console.error('Error updating pengguna:', error);
            this.showMessage('error', 'Error connecting to server');
            return false;
        }
    }

    async deletePengguna(id_pengguna) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/pengguna.php`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'delete',
                    id_pengguna: id_pengguna
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                this.showMessage('success', 'Pengguna berhasil dihapus');
                // Reload the data to remove the deleted user
                this.loadPenggunaData();
                return true;
            } else {
                this.showMessage('error', result.message || 'Gagal menghapus pengguna');
                return false;
            }
        } catch (error) {
            console.error('Error deleting pengguna:', error);
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