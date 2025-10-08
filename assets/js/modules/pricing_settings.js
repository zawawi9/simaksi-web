// pricing_settings.js - Pricing settings module using PHP backend
export class PricingSettingsModule {
    constructor() {
        this.apiBaseUrl = 'api';
        this.loadPricingData();
        this.setupEventListeners();
    }

    async loadPricingData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/pengaturan_biaya.php`);
            const result = await response.json();

            if (result.status === 'success') {
                this.updatePricingInputs(result.data);
            } else {
                console.error('Error loading pricing data:', result.message);
                this.showMessage('error', result.message || 'Failed to load pricing data');
            }
        } catch (error) {
            console.error('Error loading pricing data:', error);
            this.showMessage('error', 'Error connecting to server');
        }
    }

    updatePricingInputs(pricingData) {
        pricingData.forEach(item => {
            if (item.nama_item === 'tiket_masuk') {
                document.getElementById('harga-tiket').value = item.harga || '';
            } else if (item.nama_item === 'tiket_parkir') {
                document.getElementById('harga-parkir').value = item.harga || '';
            }
        });
    }

    async savePricing() {
        try {
            // Save ticket price
            const ticketPrice = document.getElementById('harga-tiket').value;
            if (ticketPrice) {
                const ticketResponse = await fetch(`${this.apiBaseUrl}/pengaturan_biaya.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nama_item: 'tiket_masuk',
                        harga: parseInt(ticketPrice),
                        deskripsi: 'Harga tiket pendakian per orang'
                    })
                });
                
                const ticketResult = await ticketResponse.json();
                if (ticketResult.status !== 'success') {
                    console.error('Error saving ticket price:', ticketResult.message);
                    this.showMessage('error', `Gagal menyimpan harga tiket: ${ticketResult.message}`);
                    return;
                }
            }

            // Save parking price
            const parkingPrice = document.getElementById('harga-parkir').value;
            if (parkingPrice) {
                const parkingResponse = await fetch(`${this.apiBaseUrl}/pengaturan_biaya.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nama_item: 'tiket_parkir',
                        harga: parseInt(parkingPrice),
                        deskripsi: 'Harga tiket parkir per kendaraan'
                    })
                });
                
                const parkingResult = await parkingResponse.json();
                if (parkingResult.status !== 'success') {
                    console.error('Error saving parking price:', parkingResult.message);
                    this.showMessage('error', `Gagal menyimpan harga parkir: ${parkingResult.message}`);
                    return;
                }
            }

            this.showMessage('success', 'Harga tiket berhasil diperbarui');
        } catch (error) {
            console.error('Error saving pricing:', error);
            this.showMessage('error', 'Error connecting to server');
        }
    }

    setupEventListeners() {
        const saveButton = document.getElementById('simpan-harga');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                this.savePricing();
            });
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