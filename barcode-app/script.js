class BarcodeApp {
    constructor() {
        this.history = JSON.parse(localStorage.getItem('barcodeHistory')) || [];
        this.currentBarcode = null;
        this.batchItems = [];
        
        this.initializeElements();
        this.bindEvents();
        this.loadHistory();
        
        // Generate initial barcode
        setTimeout(() => this.generateBarcode(), 100);
    }

    initializeElements() {
        // Tabs
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // Generator
        this.barcodeData = document.getElementById('barcodeData');
        this.barcodeType = document.getElementById('barcodeType');
        this.barcodeSize = document.getElementById('barcodeSize');
        this.generateBtn = document.getElementById('generateBtn');
        this.barcodePreview = document.getElementById('barcodePreview');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.saveBtn = document.getElementById('saveBtn');
        
        // Batch
        this.batchData = document.getElementById('batchData');
        this.batchType = document.getElementById('batchType');
        this.generateBatchBtn = document.getElementById('generateBatchBtn');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        this.batchResults = document.getElementById('batchResults');
        this.itemCount = document.getElementById('itemCount');
        
        // History
        this.historyList = document.getElementById('historyList');
        this.exportBtn = document.getElementById('exportBtn');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
    }

    bindEvents() {
        // Tabs
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Generator
        this.generateBtn.addEventListener('click', () => this.generateBarcode());
        this.downloadBtn.addEventListener('click', () => this.downloadBarcode());
        this.saveBtn.addEventListener('click', () => this.saveBarcode());
        
        // Batch
        this.batchData.addEventListener('input', () => this.updateBatchCounter());
        this.generateBatchBtn.addEventListener('click', () => this.generateBatch());
        this.downloadAllBtn.addEventListener('click', () => this.downloadBatch());
        
        // History
        this.exportBtn.addEventListener('click', () => this.exportHistory());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
    }

    switchTab(tabName) {
        // Update tabs
        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update content
        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabName);
        });
    }

    // Generator Functions
    generateBarcode() {
        const data = this.barcodeData.value.trim();
        const type = this.barcodeType.value;
        const size = this.getSizeValue(this.barcodeSize.value);

        if (!data) {
            this.showNotification('Please enter some text', 'error');
            return;
        }

        try {
            this.barcodePreview.innerHTML = '';
            
            if (type === 'qrcode') {
                this.generateQRCode(data, size);
            } else {
                this.generate1DBarcode(data, type, size);
            }
            
            this.currentBarcode = { data, type, size };
            this.downloadBtn.disabled = false;
            this.saveBtn.disabled = false;
            
        } catch (error) {
            this.showNotification('Error generating barcode', 'error');
            console.error('Generation error:', error);
        }
    }

    generateQRCode(data, size) {
        try {
            // Use the qrcode-generator library
            const typeNumber = 0; // Auto
            const errorCorrectionLevel = 'L';
            const qr = qrcode(typeNumber, errorCorrectionLevel);
            qr.addData(data);
            qr.make();
            
            const canvas = document.createElement('canvas');
            const scale = size / qr.getModuleCount();
            const ctx = canvas.getContext('2d');
            
            canvas.width = size;
            canvas.height = size;
            
            // Draw QR code
            for (let row = 0; row < qr.getModuleCount(); row++) {
                for (let col = 0; col < qr.getModuleCount(); col++) {
                    ctx.fillStyle = qr.isDark(row, col) ? '#000000' : '#FFFFFF';
                    ctx.fillRect(col * scale, row * scale, scale, scale);
                }
            }
            
            this.barcodePreview.appendChild(canvas);
        } catch (error) {
            console.error('QR Code error:', error);
            this.showNotification('QR Code generation failed', 'error');
        }
    }

    generate1DBarcode(data, type, size) {
        try {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            this.barcodePreview.appendChild(svg);
            
            JsBarcode(svg, data, {
                format: type,
                width: this.getBarcodeWidth(size),
                height: this.getBarcodeHeight(size),
                displayValue: true,
                fontSize: 14,
                margin: 10,
                background: '#ffffff',
                lineColor: '#000000'
            });
        } catch (error) {
            console.error('Barcode error:', error);
            this.showNotification('Barcode generation failed', 'error');
        }
    }

    getSizeValue(size) {
        const sizes = {
            small: 150,
            medium: 200,
            large: 250
        };
        return sizes[size] || sizes.medium;
    }

    getBarcodeWidth(size) {
        const widths = {
            small: 1,
            medium: 2,
            large: 3
        };
        return widths[size] || widths.medium;
    }

    getBarcodeHeight(size) {
        const heights = {
            small: 50,
            medium: 70,
            large: 90
        };
        return heights[size] || heights.medium;
    }

    downloadBarcode() {
        if (!this.currentBarcode) return;

        const canvas = this.barcodePreview.querySelector('canvas');
        const svg = this.barcodePreview.querySelector('svg');

        if (canvas) {
            // Download canvas as PNG
            const link = document.createElement('a');
            link.download = `qrcode-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            this.showNotification('QR Code downloaded!', 'success');
        } else if (svg) {
            // Download SVG
            const serializer = new XMLSerializer();
            const source = serializer.serializeToString(svg);
            const blob = new Blob([source], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.download = `barcode-${Date.now()}.svg`;
            link.href = url;
            link.click();
            
            URL.revokeObjectURL(url);
            this.showNotification('Barcode downloaded!', 'success');
        }
    }

    saveBarcode() {
        if (!this.currentBarcode) return;

        const barcodeItem = {
            id: Date.now(),
            data: this.currentBarcode.data,
            type: this.currentBarcode.type,
            timestamp: new Date().toLocaleString()
        };

        this.history.unshift(barcodeItem);
        this.saveHistory();
        this.loadHistory();
        this.showNotification('Barcode saved to history!', 'success');
    }

    // Batch Functions
    updateBatchCounter() {
        const items = this.batchData.value.split('\n').filter(item => item.trim());
        this.itemCount.textContent = `${items.length} items`;
    }

    generateBatch() {
        const data = this.batchData.value.trim();
        const type = this.batchType.value;

        if (!data) {
            this.showNotification('Please enter some data', 'error');
            return;
        }

        const items = data.split('\n').filter(item => item.trim());
        this.batchItems = [];
        this.batchResults.innerHTML = '';

        if (items.length > 20) {
            this.showNotification('Generating large batch, please wait...', 'info');
        }

        items.forEach((item, index) => {
            setTimeout(() => {
                this.createBatchItem(item.trim(), type, index);
            }, index * 50); // Stagger generation to prevent blocking
        });

        setTimeout(() => {
            this.downloadAllBtn.disabled = false;
            this.showNotification(`Generated ${items.length} barcodes!`, 'success');
        }, items.length * 50 + 500);
    }

    createBatchItem(data, type, index) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'batch-item';
        
        const label = document.createElement('div');
        label.className = 'batch-item-label';
        label.textContent = data.length > 15 ? data.substring(0, 15) + '...' : data;

        try {
            if (type === 'qrcode') {
                // Create QR Code for batch
                const qr = qrcode(0, 'L');
                qr.addData(data);
                qr.make();
                
                const canvas = document.createElement('canvas');
                const scale = 3;
                const size = qr.getModuleCount() * scale;
                const ctx = canvas.getContext('2d');
                
                canvas.width = size;
                canvas.height = size;
                
                for (let row = 0; row < qr.getModuleCount(); row++) {
                    for (let col = 0; col < qr.getModuleCount(); col++) {
                        ctx.fillStyle = qr.isDark(row, col) ? '#000000' : '#FFFFFF';
                        ctx.fillRect(col * scale, row * scale, scale, scale);
                    }
                }
                
                itemDiv.appendChild(canvas);
            } else {
                // Create 1D barcode for batch
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('width', '100%');
                svg.setAttribute('height', '60');
                
                JsBarcode(svg, data, {
                    format: type,
                    width: 1,
                    height: 40,
                    displayValue: false,
                    margin: 5
                });
                
                itemDiv.appendChild(svg);
            }
        } catch (error) {
            console.error('Batch item error:', error);
            const errorDiv = document.createElement('div');
            errorDiv.textContent = 'Error';
            errorDiv.style.color = 'red';
            itemDiv.appendChild(errorDiv);
        }

        itemDiv.appendChild(label);
        this.batchResults.appendChild(itemDiv);
        this.batchItems.push({ data, type, element: itemDiv });
    }

    downloadBatch() {
        if (this.batchItems.length === 0) return;

        this.showNotification(`Downloading ${this.batchItems.length} files...`, 'info');

        this.batchItems.forEach((item, index) => {
            setTimeout(() => {
                const canvas = item.element.querySelector('canvas');
                const svg = item.element.querySelector('svg');

                if (canvas) {
                    const link = document.createElement('a');
                    link.download = `qrcode-${index + 1}-${Date.now()}.png`;
                    link.href = canvas.toDataURL('image/png');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else if (svg) {
                    const serializer = new XMLSerializer();
                    const source = serializer.serializeToString(svg);
                    const blob = new Blob([source], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(blob);
                    
                    const link = document.createElement('a');
                    link.download = `barcode-${index + 1}-${Date.now()}.svg`;
                    link.href = url;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    setTimeout(() => URL.revokeObjectURL(url), 100);
                }
            }, index * 300); // Stagger downloads
        });
    }

    // History Functions
    loadHistory() {
        if (this.history.length === 0) {
            this.historyList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>No barcodes generated yet</p>
                </div>
            `;
            return;
        }

        this.historyList.innerHTML = this.history.map(item => `
            <div class="history-item">
                <div class="history-barcode">
                    ${item.type === 'qrcode' ? 
                        '<i class="fas fa-qrcode" style="font-size: 2rem; color: #667eea;"></i>' : 
                        '<i class="fas fa-barcode" style="font-size: 2rem; color: #667eea;"></i>'
                    }
                </div>
                <div class="history-details">
                    <div class="history-data">${this.escapeHtml(item.data)}</div>
                    <div class="history-meta">
                        <span class="history-type">${item.type}</span>
                        <span>${item.timestamp}</span>
                    </div>
                </div>
                <div class="history-actions">
                    <button class="copy-btn" onclick="barcodeApp.copyToClipboard('${this.escapeHtml(item.data).replace(/'/g, "\\'")}')">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="delete-btn" onclick="barcodeApp.deleteHistoryItem(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('Copied to clipboard!', 'success');
        });
    }

    deleteHistoryItem(id) {
        this.history = this.history.filter(item => item.id !== id);
        this.saveHistory();
        this.loadHistory();
        this.showNotification('Item deleted from history', 'info');
    }

    exportHistory() {
        if (this.history.length === 0) {
            this.showNotification('No history to export', 'error');
            return;
        }

        const csv = [
            ['Data', 'Type', 'Timestamp'],
            ...this.history.map(item => [
                `"${item.data.replace(/"/g, '""')}"`,
                item.type,
                item.timestamp
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = `barcode-history-${new Date().toISOString().split('T')[0]}.csv`;
        link.href = url;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(url), 100);
        this.showNotification('History exported as CSV!', 'success');
    }

    clearHistory() {
        if (this.history.length === 0) return;
        
        if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
            this.history = [];
            this.saveHistory();
            this.loadHistory();
            this.showNotification('History cleared!', 'success');
        }
    }

    // Utility Functions
    saveHistory() {
        localStorage.setItem('barcodeHistory', JSON.stringify(this.history));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type) {
        // Create a simple notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            font-family: 'Poppins', sans-serif;
            font-weight: 500;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }
}

// Initialize the app when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.barcodeApp = new BarcodeApp();
});