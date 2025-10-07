// finance_php.js - Finance module using PHP backend
export class FinanceModule {
    constructor() {
        this.apiBaseUrl = 'api';
        this.currentTab = 'laporan'; // Default to laporan tab
    }

    async loadKeuanganReport(fromDate = null, toDate = null) {
        try {
            if (!fromDate) fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ago
            if (!toDate) toDate = new Date().toISOString().split('T')[0]; // Today

            const response = await fetch(`${this.apiBaseUrl}/keuangan.php?from_date=${fromDate}&to_date=${toDate}`);
            const result = await response.json();

            if (result.status === 'success') {
                this.updateKeuanganReport(result.data);
            } else {
                console.error('Error loading financial report:', result.message);
                this.showMessage('error', result.message || 'Failed to load financial report');
            }
        } catch (error) {
            console.error('Error loading financial report:', error);
            this.showMessage('error', 'Error connecting to server');
        }
    }

    async savePengeluaran(jumlah, tanggal, keterangan, id_kategori = null) {
        try {
            // Get the current admin ID from the session
            const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
            if (sessionError || !session) {
                throw new Error('Sesi admin tidak valid');
            }
            
            const adminId = session.user.id;
            
            const response = await fetch(`${this.apiBaseUrl}/keuangan.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    jumlah: parseInt(jumlah),
                    tanggal_pengeluaran: tanggal,
                    keterangan: keterangan,
                    id_kategori: id_kategori,
                    admin_id: adminId  // Use the actual current admin user ID
                })
            });
            
            const result = await response.json();

            if (result.status === 'success') {
                this.showMessage('success', result.message);
                // Clear the form
                document.getElementById('pengeluaran-form').reset();
            } else {
                console.error('Error saving expense:', result.message);
                this.showMessage('error', result.message || 'Failed to save expense');
            }
        } catch (error) {
            console.error('Error saving expense:', error);
            this.showMessage('error', 'Error connecting to server');
        }
    }

    updateKeuanganReport(data) {
        // Update summary cards
        document.getElementById('total-pemasukan').textContent = `Rp ${data.total_pemasukan.toLocaleString()}`;
        document.getElementById('total-pengeluaran').textContent = `Rp ${data.total_pengeluaran.toLocaleString()}`;
        document.getElementById('saldo-akhir').textContent = `Rp ${data.saldo_akhir.toLocaleString()}`;

        // Update pemasukan table
        const pemasukanTbody = document.getElementById('pemasukan-tbody');
        if (pemasukanTbody) {
            pemasukanTbody.innerHTML = '';
            
            if (data.pemasukan && data.pemasukan.length > 0) {
                data.pemasukan.forEach(pemasukan => {
                    const row = document.createElement('tr');
                    row.className = 'border-b border-gray-200 hover:bg-gray-50';
                    row.innerHTML = `
                        <td class="px-6 py-4 text-sm text-gray-700">${new Date(pemasukan.tanggal_pemasukan).toLocaleDateString()}</td>
                        <td class="px-6 py-4 text-sm text-gray-700">${pemasukan.keterangan || 'Pemasukan dari reservasi'}</td>
                        <td class="px-6 py-4 text-sm text-gray-700">Rp ${pemasukan.jumlah.toLocaleString()}</td>
                    `;
                    pemasukanTbody.appendChild(row);
                });
            } else {
                pemasukanTbody.innerHTML = `
                    <tr>
                        <td colspan="3" class="px-6 py-4 text-center text-gray-500">Tidak ada data pemasukan</td>
                    </tr>
                `;
            }
        }

        // Update pengeluaran table
        const pengeluaranTbody = document.getElementById('pengeluaran-tbody');
        if (pengeluaranTbody) {
            pengeluaranTbody.innerHTML = '';
            
            if (data.pengeluaran && data.pengeluaran.length > 0) {
                data.pengeluaran.forEach(pengeluaran => {
                    const row = document.createElement('tr');
                    row.className = 'border-b border-gray-200 hover:bg-gray-50';
                    row.innerHTML = `
                        <td class="px-6 py-4 text-sm text-gray-700">${new Date(pengeluaran.tanggal_pengeluaran).toLocaleDateString()}</td>
                        <td class="px-6 py-4 text-sm text-gray-700">${pengeluaran.keterangan}</td>
                        <td class="px-6 py-4 text-sm text-gray-700">Rp ${pengeluaran.jumlah.toLocaleString()}</td>
                    `;
                    pengeluaranTbody.appendChild(row);
                });
            } else {
                pengeluaranTbody.innerHTML = `
                    <tr>
                        <td colspan="3" class="px-6 py-4 text-center text-gray-500">Tidak ada data pengeluaran</td>
                    </tr>
                `;
            }
        }
    }

    switchKeuanganTab(tabName) {
        // Hide all keuangan content sections
        const laporanContent = document.getElementById('laporan-content');
        const pengeluaranContent = document.getElementById('pengeluaran-content');

        if (laporanContent) laporanContent.classList.add('hidden');
        if (pengeluaranContent) pengeluaranContent.classList.add('hidden');

        // Remove active class from all tabs
        const laporanTab = document.getElementById('laporan-tab');
        const pengeluaranTab = document.getElementById('pengeluaran-tab');

        if (laporanTab) {
            laporanTab.classList.remove('text-green-600', 'border-green-600');
            laporanTab.classList.add('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        }
        
        if (pengeluaranTab) {
            pengeluaranTab.classList.remove('text-green-600', 'border-green-600');
            pengeluaranTab.classList.add('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        }

        // Show selected content and activate tab
        if (tabName === 'laporan' && laporanContent) {
            laporanContent.classList.remove('hidden');
            if (laporanTab) {
                laporanTab.classList.remove('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
                laporanTab.classList.add('text-green-600', 'border-green-600');
            }
            // Load laporan data if not already loaded
            const fromDate = document.getElementById('date-from')?.value || null;
            const toDate = document.getElementById('date-to')?.value || null;
            this.loadKeuanganReport(fromDate, toDate);
        } else if (tabName === 'pengeluaran' && pengeluaranContent) {
            pengeluaranContent.classList.remove('hidden');
            if (pengeluaranTab) {
                pengeluaranTab.classList.remove('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
                pengeluaranTab.classList.add('text-green-600', 'border-green-600');
            }
        }

        this.currentTab = tabName;
    }

    async loadPengeluaranForm() {
        // Load categories for the select dropdown from the Supabase table
        try {
            const { data: categories, error } = await window.supabase
                .from('kategori_pengeluaran')
                .select('id_kategori, nama_kategori');

            const categorySelect = document.getElementById('kategori-pengeluaran');
            if (categorySelect) {
                categorySelect.innerHTML = '<option value="">Pilih Kategori</option>';
                
                if (error) {
                    console.error('Error fetching categories:', error);
                    // Fallback to default options if API call fails
                    categorySelect.innerHTML += `
                        <option value="1">Operasional</option>
                        <option value="2">Peralatan</option>
                        <option value="3">Transportasi</option>
                        <option value="4">Administrasi</option>
                        <option value="5">Lainnya</option>
                    `;
                } else if (categories && categories.length > 0) {
                    categories.forEach(category => {
                        categorySelect.innerHTML += `<option value="${category.id_kategori}">${category.nama_kategori}</option>`;
                    });
                }
            }
        } catch (error) {
            console.error('Error loading expense form:', error);
            // Fallback to default options
            const categorySelect = document.getElementById('kategori-pengeluaran');
            if (categorySelect) {
                categorySelect.innerHTML = `
                    <option value="">Pilih Kategori</option>
                    <option value="1">Operasional</option>
                    <option value="2">Peralatan</option>
                    <option value="3">Transportasi</option>
                    <option value="4">Administrasi</option>
                    <option value="5">Lainnya</option>
                `;
            }
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