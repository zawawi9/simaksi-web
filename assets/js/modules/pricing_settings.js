// pricing_settings.js - Pricing settings module using PHP backend
export class PricingSettingsModule {
    constructor() {
        this.apiBaseUrl = 'api';
        this.loadPricingData();
        this.setupEventListeners();
    }

    formatRupiah(angka) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(angka);
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
                const hargaTiketInput = document.getElementById('harga-tiket');
                if (hargaTiketInput) {
                    hargaTiketInput.value = item.harga ? this.formatNumberWithDots(item.harga) : '';
                }
            } else if (item.nama_item === 'tiket_parkir') {
                const hargaParkirInput = document.getElementById('harga-parkir');
                if (hargaParkirInput) {
                    hargaParkirInput.value = item.harga ? this.formatNumberWithDots(item.harga) : '';
                }
            }
        });
    }

    // Fungsi untuk memformat angka dengan titik sebagai pemisah ribuan
    formatNumberWithDots(number) {
        if (!number) return '';
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // Fungsi untuk mengonversi string terformat kembali ke angka
    parseFormattedNumber(formattedString) {
        if (!formattedString) return 0;
        // Hapus semua karakter non-digit
        return parseInt(formattedString.replace(/[^\d]/g, '')) || 0;
    }

    async savePricing() {
        try {
            // Save ticket price
            const ticketPriceInput = document.getElementById('harga-tiket');
            if (ticketPriceInput && ticketPriceInput.value) {
                const ticketPrice = this.parseFormattedNumber(ticketPriceInput.value);
                if (isNaN(ticketPrice) || ticketPrice <= 0) {
                    this.showMessage('error', 'Harga tiket pendakian harus berupa angka yang valid');
                    return;
                }
                
                const ticketResponse = await fetch(`${this.apiBaseUrl}/pengaturan_biaya.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nama_item: 'tiket_masuk',
                        harga: ticketPrice,
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
            const parkingPriceInput = document.getElementById('harga-parkir');
            if (parkingPriceInput && parkingPriceInput.value) {
                const parkingPrice = this.parseFormattedNumber(parkingPriceInput.value);
                if (isNaN(parkingPrice) || parkingPrice <= 0) {
                    this.showMessage('error', 'Harga tiket parkir harus berupa angka yang valid');
                    return;
                }
                
                const parkingResponse = await fetch(`${this.apiBaseUrl}/pengaturan_biaya.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nama_item: 'tiket_parkir',
                        harga: parkingPrice,
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
        
        // Tambahkan event listener untuk format input harga saat pengguna mengetik
        const hargaTiketInput = document.getElementById('harga-tiket');
        if (hargaTiketInput) {
            hargaTiketInput.addEventListener('input', (e) => {
                this.formatInputCurrency(e);
            });
        }
        
        const hargaParkirInput = document.getElementById('harga-parkir');
        if (hargaParkirInput) {
            hargaParkirInput.addEventListener('input', (e) => {
                this.formatInputCurrency(e);
            });
        }
    }

    // Fungsi untuk memformat input currency saat pengguna mengetik
    formatInputCurrency(e) {
        const input = e.target;
        let value = input.value.replace(/[^0-9]/g, '');
        
        // Format angka dengan pemisah ribuan
        if (value) {
            value = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        }
        
        // Simpan posisi kursor sebelum mengubah nilai
        const start = input.selectionStart;
        const end = input.selectionEnd;
        
        // Set nilai terformat ke input
        input.value = value;
        
        // Kembalikan posisi kursor
        const newStart = Math.min(start, input.value.length);
        const newEnd = Math.min(end, input.value.length);
        input.setSelectionRange(newStart, newEnd);
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