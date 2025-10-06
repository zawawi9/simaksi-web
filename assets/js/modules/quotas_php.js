// quotas_php.js - Quotas module using PHP backend
export class QuotasModule {
    constructor() {
        this.apiBaseUrl = 'api';
    }

    async loadKuotaData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/kuota.php`);
            const result = await response.json();

            if (result.status === 'success') {
                this.updateKuotaTable(result.data);
            } else {
                console.error('Error loading quota data:', result.message);
                this.showMessage('error', result.message || 'Failed to load quota data');
            }
        } catch (error) {
            console.error('Error loading quota data:', error);
            this.showMessage('error', 'Error connecting to server');
        }
    }

    async saveKuota(tanggal, kuota_maksimal) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/kuota.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tanggal: tanggal,
                    kuota_maksimal: parseInt(kuota_maksimal)
                })
            });
            
            const result = await response.json();

            if (result.status === 'success') {
                this.showMessage('success', result.message);
                // Reload the data to reflect the changes
                this.loadKuotaData();
            } else {
                console.error('Error saving quota:', result.message);
                this.showMessage('error', result.message || 'Failed to save quota');
            }
        } catch (error) {
            console.error('Error saving quota:', error);
            this.showMessage('error', 'Error connecting to server');
        }
    }

    updateKuotaTable(kuotaList) {
        const tbody = document.getElementById('kuota-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!kuotaList || kuotaList.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-4 text-center text-gray-500">Tidak ada data kuota</td>
                </tr>
            `;
            return;
        }

        kuotaList.forEach(kuota => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4 text-sm text-gray-700">${new Date(kuota.tanggal_kuota).toLocaleDateString()}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${kuota.kuota_maksimal}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${kuota.kuota_terpesan}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${kuota.kuota_maksimal - kuota.kuota_terpesan}</td>
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