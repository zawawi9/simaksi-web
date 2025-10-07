// utils.js - Utility functions for the admin dashboard
export class Utils {
    static showMessage(type, message) {
        // Find the message container - could be in admin dashboard or elsewhere
        let container = document.getElementById('message-container');
        let content = document.getElementById('message-content');
        
        // If the specific message container isn't found, try to create one dynamically
        if (!container || !content) {
            // Create the message container dynamically
            if (!document.querySelector('#dynamic-message-container')) {
                const newContainer = document.createElement('div');
                newContainer.id = 'dynamic-message-container';
                newContainer.className = 'fixed top-4 right-4 z-50';
                newContainer.style.cssText = `
                    position: fixed;
                    top: 1rem;
                    right: 1rem;
                    z-index: 50;
                    max-width: 400px;
                `;
                
                const newContent = document.createElement('div');
                newContent.id = 'dynamic-message-content';
                newContent.className = 'px-6 py-4 rounded-lg shadow-lg text-white';
                
                newContainer.appendChild(newContent);
                document.body.appendChild(newContainer);
                
                container = newContainer;
                content = newContent;
            } else {
                container = document.querySelector('#dynamic-message-container');
                content = document.querySelector('#dynamic-message-content');
            }
        }
        
        if (!content) {
            console.error('Message container not found');
            return;
        }
        
        // Set message content and style based on type
        content.textContent = message;
        
        // Clear previous classes
        content.className = 'px-6 py-4 rounded-lg shadow-lg text-white';
        
        // Add appropriate classes based on message type
        if (type === 'success') {
            content.classList.add('bg-green-500');
        } else if (type === 'error') {
            content.classList.add('bg-red-500');
        } else if (type === 'warning') {
            content.classList.add('bg-yellow-500');
        } else {
            content.classList.add('bg-blue-500');
        }
        
        // Show the container
        container.classList.remove('hidden');
        container.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (container) {
                container.style.display = 'none';
            }
        }, 5000);
    }
    
    static hideModal() {
        const modal = document.getElementById('detailModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    static formatRupiah(angka) {
        if (typeof angka !== 'number') {
            angka = parseFloat(angka) || 0;
        }
        return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    
    static parseRupiah(rupiah) {
        if (!rupiah) return 0;
        // Convert to string first to ensure it's a string for replace operation
        const rupiahString = String(rupiah);
        // Remove 'Rp ' prefix and dots, then parse to integer
        return parseInt(rupiahString.replace(/^Rp\s?|[.]/g, '')) || 0;
    }
    
    static formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    }
}