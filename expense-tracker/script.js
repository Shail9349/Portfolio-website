class ExpenseTracker {
    constructor() {
        this.expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        this.categories = JSON.parse(localStorage.getItem('categories')) || [
            { id: 'education', name: 'Education', color: '#667eea', expenses: 0, amount: 0 },
            { id: 'food', name: 'Food & Dining', color: '#48bb78', expenses: 0, amount: 0 },
            { id: 'transport', name: 'Transport', color: '#ed8936', expenses: 0, amount: 0 },
            { id: 'shopping', name: 'Shopping', color: '#9f7aea', expenses: 0, amount: 0 },
            { id: 'entertainment', name: 'Entertainment', color: '#ed64a6', expenses: 0, amount: 0 }
        ];
        this.currentPeriod = 'today';
        this.isEditing = false;
        this.editingExpenseId = null;
        
        this.initializeElements();
        this.bindEvents();
        this.loadCategories();
        this.loadExpenses();
        this.updateSummary();
        
        // Set default date to today
        this.expenseDate.value = new Date().toISOString().split('T')[0];
    }

    initializeElements() {
        // Period elements - Now dropdown
        this.periodDropdown = document.getElementById('periodDropdown');
        this.currentPeriodEl = document.getElementById('currentPeriod');
        this.dropdownContent = document.querySelector('.dropdown-content');
        this.dropdownItems = document.querySelectorAll('.dropdown-item');
        this.periodTotal = document.getElementById('periodTotal');
        this.periodLabel = document.getElementById('periodLabel');
        this.transactionCount = document.getElementById('transactionCount');
        
        // Form elements
        this.expenseForm = document.getElementById('expenseForm');
        this.formTitle = document.getElementById('formTitle');
        this.editingExpenseIdInput = document.getElementById('editingExpenseId');
        this.expenseTitle = document.getElementById('expenseTitle');
        this.expenseAmount = document.getElementById('expenseAmount');
        this.expenseDate = document.getElementById('expenseDate');
        this.expenseCategory = document.getElementById('expenseCategory');
        this.expenseSubcategory = document.getElementById('expenseSubcategory');
        this.paymentMethod = document.getElementById('paymentMethod');
        this.expenseDescription = document.getElementById('expenseDescription');
        this.submitBtn = document.getElementById('submitBtn');
        this.clearFormBtn = document.getElementById('clearFormBtn');
        this.cancelEditBtn = document.getElementById('cancelEditBtn');
        this.quickAddCategory = document.getElementById('quickAddCategory');
        
        // Categories elements
        this.categoriesList = document.getElementById('categoriesList');
        this.addCategoryBtn = document.getElementById('addCategoryBtn');
        
        // History elements
        this.expensesList = document.getElementById('expensesList');
        this.exportBtn = document.getElementById('exportBtn');
        
        // Modal elements
        this.categoryModal = document.getElementById('categoryModal');
        this.exportModal = document.getElementById('exportModal');
        this.categoryForm = document.getElementById('categoryForm');
        this.categoryName = document.getElementById('categoryName');
        this.categoryColor = document.getElementById('categoryColor');
        this.closeModalBtns = document.querySelectorAll('.close-modal');
        this.exportOptions = document.querySelectorAll('.export-option');
        
        // Create dropdown overlay
        this.dropdownOverlay = document.createElement('div');
        this.dropdownOverlay.className = 'dropdown-overlay';
        document.body.appendChild(this.dropdownOverlay);
    }

    bindEvents() {
        // Period dropdown
        this.periodDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });
        
        this.dropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setPeriod(e.target.dataset.period);
                this.closeDropdown();
            });
        });
        
        // Close dropdown when clicking outside
        this.dropdownOverlay.addEventListener('click', () => {
            this.closeDropdown();
        });
        
        // Form events - FIXED: Proper form submission
        this.expenseForm.addEventListener('submit', (e) => this.handleSubmit(e));
        this.clearFormBtn.addEventListener('click', () => this.clearForm());
        this.cancelEditBtn.addEventListener('click', () => this.cancelEdit());
        
        // Category events
        this.addCategoryBtn.addEventListener('click', () => this.showCategoryModal());
        this.quickAddCategory.addEventListener('click', () => this.showCategoryModal());
        this.categoryForm.addEventListener('submit', (e) => this.handleCategorySubmit(e));
        
        // Export events
        this.exportBtn.addEventListener('click', () => this.showExportModal());
        this.exportOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                this.exportData(e.currentTarget.dataset.format);
            });
        });
        
        // Modal events
        this.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.categoryModal) this.categoryModal.classList.remove('show');
            if (e.target === this.exportModal) this.exportModal.classList.remove('show');
        });
    }

    toggleDropdown() {
        const isOpen = this.dropdownContent.classList.contains('show');
        if (isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        this.dropdownContent.classList.add('show');
        this.periodDropdown.classList.add('active');
        this.dropdownOverlay.classList.add('show');
    }

    closeDropdown() {
        this.dropdownContent.classList.remove('show');
        this.periodDropdown.classList.remove('active');
        this.dropdownOverlay.classList.remove('show');
    }

    setPeriod(period) {
        this.currentPeriod = period;
        
        // Update current period display
        const periodLabels = {
            'today': "Today",
            'week': "This Week", 
            'month': "This Month",
            'year': "This Year",
            'all': "All Time"
        };
        this.currentPeriodEl.textContent = periodLabels[period];
        
        // Update dropdown items active state
        this.dropdownItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.period === period) {
                item.classList.add('active');
            }
        });
        
        // Update period label in summary
        const summaryLabels = {
            'today': "Today's Total",
            'week': "This Week's Total", 
            'month': "This Month's Total",
            'year': "This Year's Total",
            'all': "All Time Total"
        };
        this.periodLabel.textContent = summaryLabels[period];
        
        this.loadExpenses();
        this.updateSummary();
    }

    handleSubmit(e) {
        e.preventDefault();
        
        // Validate form
        if (!this.validateForm()) {
            return;
        }
        
        const expenseData = {
            title: this.expenseTitle.value.trim(),
            amount: parseFloat(this.expenseAmount.value),
            date: this.expenseDate.value,
            category: this.expenseCategory.value,
            subcategory: this.expenseSubcategory.value.trim(),
            paymentMethod: this.paymentMethod.value,
            description: this.expenseDescription.value.trim(),
            createdAt: new Date().toISOString()
        };
        
        if (this.isEditing) {
            // Update existing expense
            this.updateExpense(expenseData);
        } else {
            // Add new expense
            this.addExpense(expenseData);
        }
    }

    validateForm() {
        // Basic validation
        if (!this.expenseTitle.value.trim()) {
            this.showNotification('Please enter a title', 'error');
            this.expenseTitle.focus();
            return false;
        }
        
        if (!this.expenseAmount.value || parseFloat(this.expenseAmount.value) <= 0) {
            this.showNotification('Please enter a valid amount', 'error');
            this.expenseAmount.focus();
            return false;
        }
        
        if (!this.expenseDate.value) {
            this.showNotification('Please select a date', 'error');
            this.expenseDate.focus();
            return false;
        }
        
        if (!this.expenseCategory.value) {
            this.showNotification('Please select a category', 'error');
            this.expenseCategory.focus();
            return false;
        }
        
        if (!this.paymentMethod.value) {
            this.showNotification('Please select a payment method', 'error');
            this.paymentMethod.focus();
            return false;
        }
        
        return true;
    }

    addExpense(expenseData) {
        const expense = {
            id: Date.now(),
            ...expenseData
        };
        
        this.expenses.unshift(expense);
        this.saveToLocalStorage();
        this.loadExpenses();
        this.updateSummary();
        this.clearForm();
        
        this.showNotification('Expense added successfully!', 'success');
    }

    updateExpense(expenseData) {
        const expenseIndex = this.expenses.findIndex(exp => exp.id === this.editingExpenseId);
        
        if (expenseIndex !== -1) {
            this.expenses[expenseIndex] = {
                ...this.expenses[expenseIndex],
                ...expenseData,
                updatedAt: new Date().toISOString()
            };
            
            this.saveToLocalStorage();
            this.loadExpenses();
            this.updateSummary();
            this.cancelEdit();
            
            this.showNotification('Expense updated successfully!', 'success');
        }
    }

    editExpense(expenseId) {
        const expense = this.expenses.find(exp => exp.id === expenseId);
        
        if (expense) {
            this.isEditing = true;
            this.editingExpenseId = expenseId;
            
            // Update form for editing
            this.formTitle.textContent = 'Edit Expense';
            this.submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Expense';
            this.cancelEditBtn.style.display = 'flex';
            this.editingExpenseIdInput.value = expenseId;
            
            // Fill form with expense data
            this.expenseTitle.value = expense.title;
            this.expenseAmount.value = expense.amount;
            this.expenseDate.value = expense.date;
            this.expenseCategory.value = expense.category;
            this.expenseSubcategory.value = expense.subcategory || '';
            this.paymentMethod.value = expense.paymentMethod;
            this.expenseDescription.value = expense.description || '';
            
            // Scroll to form
            this.expenseForm.scrollIntoView({ behavior: 'smooth' });
            this.expenseTitle.focus();
        }
    }

    cancelEdit() {
        this.isEditing = false;
        this.editingExpenseId = null;
        
        // Reset form
        this.formTitle.textContent = 'Add New Expense';
        this.submitBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Add Expense';
        this.cancelEditBtn.style.display = 'none';
        this.editingExpenseIdInput.value = '';
        
        this.clearForm();
    }

    clearForm() {
        this.expenseForm.reset();
        this.expenseDate.value = new Date().toISOString().split('T')[0];
        this.expenseSubcategory.value = '';
        this.expenseDescription.value = '';
        this.paymentMethod.value = '';
    }

    handleCategorySubmit(e) {
        e.preventDefault();
        
        const category = {
            id: this.categoryName.value.toLowerCase().replace(/\s+/g, '-'),
            name: this.categoryName.value.trim(),
            color: this.categoryColor.value,
            expenses: 0,
            amount: 0
        };
        
        // Check if category already exists
        if (this.categories.find(c => c.id === category.id)) {
            this.showNotification('Category already exists!', 'error');
            return;
        }
        
        this.categories.push(category);
        this.saveCategories();
        this.loadCategories();
        this.closeModals();
        this.categoryForm.reset();
        this.categoryColor.value = '#667eea';
        
        this.showNotification('Category added successfully!', 'success');
    }

    loadCategories() {
        // Update category select options
        this.expenseCategory.innerHTML = '<option value="">Select Category</option>';
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            this.expenseCategory.appendChild(option);
        });
        
        // Calculate category stats
        this.calculateCategoryStats();
        
        // Render categories list
        this.renderCategoriesList();
    }

    calculateCategoryStats() {
        // Reset category stats
        this.categories.forEach(category => {
            category.expenses = 0;
            category.amount = 0;
        });
        
        // Calculate stats for current period
        const filteredExpenses = this.getFilteredExpenses();
        filteredExpenses.forEach(expense => {
            const category = this.categories.find(c => c.id === expense.category);
            if (category) {
                category.expenses++;
                category.amount += expense.amount;
            }
        });
    }

    renderCategoriesList() {
        const activeCategories = this.categories.filter(category => category.expenses > 0);
        
        if (activeCategories.length === 0) {
            this.categoriesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>No expenses in this period</p>
                </div>
            `;
            return;
        }
        
        // Sort by amount (descending)
        activeCategories.sort((a, b) => b.amount - a.amount);
        
        this.categoriesList.innerHTML = activeCategories.map(category => `
            <div class="category-item" style="border-left-color: ${category.color}">
                <div class="category-header">
                    <div class="category-name">
                        <span class="category-color" style="background: ${category.color}"></span>
                        ${this.escapeHtml(category.name)}
                    </div>
                </div>
                <div class="category-amount">₹${category.amount.toLocaleString()}</div>
                <div class="category-stats">
                    <span>${category.expenses} expense${category.expenses !== 1 ? 's' : ''}</span>
                    <span>Avg: ₹${Math.round(category.amount / category.expenses).toLocaleString()}</span>
                </div>
            </div>
        `).join('');
    }

    loadExpenses() {
        const filteredExpenses = this.getFilteredExpenses();
        this.renderExpensesList(filteredExpenses);
    }

    getFilteredExpenses() {
        const now = new Date();
        let filteredExpenses = [...this.expenses];
        
        switch (this.currentPeriod) {
            case 'today':
                filteredExpenses = filteredExpenses.filter(expense => 
                    this.isSameDay(new Date(expense.date), now)
                );
                break;
            case 'week':
                filteredExpenses = filteredExpenses.filter(expense => 
                    this.isSameWeek(new Date(expense.date), now)
                );
                break;
            case 'month':
                filteredExpenses = filteredExpenses.filter(expense => 
                    this.isSameMonth(new Date(expense.date), now)
                );
                break;
            case 'year':
                filteredExpenses = filteredExpenses.filter(expense => 
                    this.isSameYear(new Date(expense.date), now)
                );
                break;
            // 'all' shows all expenses
        }
        
        return filteredExpenses;
    }

    renderExpensesList(expenses) {
        if (expenses.length === 0) {
            this.expensesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <h4>No expenses found</h4>
                    <p>${this.currentPeriod === 'all' ? 'Add your first expense to get started!' : 'No expenses for the selected period'}</p>
                </div>
            `;
            return;
        }
        
        this.expensesList.innerHTML = expenses.map(expense => {
            const category = this.categories.find(c => c.id === expense.category);
            const categoryName = category ? category.name : 'Uncategorized';
            const categoryColor = category ? category.color : '#718096';
            
            // Payment method display
            const paymentMethodLabels = {
                'cash': 'Cash',
                'upi': 'UPI',
                'card': 'Card',
                'bank': 'Bank Transfer',
                'cheque': 'Cheque',
                'other': 'Other'
            };
            
            return `
                <div class="expense-item" style="border-left-color: ${categoryColor}">
                    <div class="expense-header">
                        <div class="expense-title-section">
                            <div class="expense-title">${this.escapeHtml(expense.title)}</div>
                            <div class="expense-details">
                                <div class="expense-meta expense-category" style="color: ${categoryColor}">
                                    <i class="fas fa-tag"></i>
                                    ${this.escapeHtml(categoryName)}
                                </div>
                                <div class="expense-meta expense-date">
                                    <i class="fas fa-calendar"></i>
                                    ${this.formatDate(expense.date)}
                                </div>
                                <div class="expense-meta">
                                    <span class="payment-method-badge ${expense.paymentMethod}">
                                        <i class="fas fa-wallet"></i>
                                        ${paymentMethodLabels[expense.paymentMethod]}
                                    </span>
                                </div>
                                ${expense.subcategory ? `
                                    <div class="expense-meta expense-subcategory">
                                        <i class="fas fa-layer-group"></i>
                                        ${this.escapeHtml(expense.subcategory)}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        <div class="expense-amount-section">
                            <div class="expense-amount">₹${expense.amount.toLocaleString()}</div>
                            <div class="expense-actions">
                                <button class="edit-btn" onclick="expenseTracker.editExpense(${expense.id})">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                            </div>
                        </div>
                    </div>
                    ${expense.description ? `
                        <div class="expense-description">
                            ${this.escapeHtml(expense.description)}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    updateSummary() {
        const filteredExpenses = this.getFilteredExpenses();
        const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        this.periodTotal.textContent = `₹${totalAmount.toLocaleString()}`;
        this.transactionCount.textContent = filteredExpenses.length;
        
        // Update category stats
        this.calculateCategoryStats();
        this.renderCategoriesList();
    }

    showCategoryModal() {
        this.categoryModal.classList.add('show');
        this.categoryName.focus();
    }

    showExportModal() {
        this.exportModal.classList.add('show');
    }

    exportData(format) {
        const data = this.expenses;
        
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            this.downloadFile(blob, `expenses-${new Date().toISOString().split('T')[0]}.json`);
        } else if (format === 'csv') {
            const headers = ['Title', 'Amount', 'Date', 'Category', 'Subcategory', 'Payment Method', 'Description'];
            const csvData = data.map(expense => [
                expense.title,
                expense.amount,
                expense.date,
                expense.category,
                expense.subcategory || '',
                expense.paymentMethod,
                expense.description || ''
            ]);
            const csvContent = [headers, ...csvData].map(row => 
                row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(',')
            ).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            this.downloadFile(blob, `expenses-${new Date().toISOString().split('T')[0]}.csv`);
        } else if (format === 'print') {
            this.printSummary();
        }
        
        this.closeModals();
        this.showNotification('Data exported successfully!', 'success');
    }

    printSummary() {
        const printWindow = window.open('', '_blank');
        const now = new Date();
        
        const periodLabels = {
            'today': 'Today',
            'week': 'This Week',
            'month': 'This Month', 
            'year': 'This Year',
            'all': 'All Time'
        };
        
        const summary = `
            <html>
                <head>
                    <title>Expense Summary</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
                        h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
                        .summary { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
                        .category { margin: 10px 0; padding: 10px; border-left: 4px solid #667eea; background: white; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background: #f0f0f0; }
                        .total { font-weight: bold; font-size: 1.2em; margin-top: 20px; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    <h1>Expense Tracker Summary</h1>
                    <div class="summary">
                        <p><strong>Period:</strong> ${periodLabels[this.currentPeriod]}</p>
                        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Total Expenses:</strong> ${this.getFilteredExpenses().length}</p>
                        <p><strong>Total Amount:</strong> ₹${this.getFilteredExpenses().reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</p>
                    </div>
                    
                    <h2>Category-wise Summary</h2>
                    ${this.categories.filter(cat => cat.amount > 0).map(cat => `
                        <div class="category" style="border-left-color: ${cat.color}">
                            <strong>${cat.name}</strong><br>
                            Total: ₹${cat.amount.toLocaleString()} | Expenses: ${cat.expenses} | Average: ₹${Math.round(cat.amount / cat.expenses).toLocaleString()}
                        </div>
                    `).join('')}
                    
                    <h2>Recent Expenses</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Title</th>
                                <th>Amount</th>
                                <th>Category</th>
                                <th>Payment Method</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.getFilteredExpenses().slice(0, 20).map(expense => {
                                const category = this.categories.find(c => c.id === expense.category);
                                const paymentMethodLabels = {
                                    'cash': 'Cash',
                                    'upi': 'UPI', 
                                    'card': 'Card',
                                    'bank': 'Bank Transfer',
                                    'cheque': 'Cheque',
                                    'other': 'Other'
                                };
                                return `
                                    <tr>
                                        <td>${this.formatDate(expense.date)}</td>
                                        <td>${expense.title}</td>
                                        <td>₹${expense.amount.toLocaleString()}</td>
                                        <td>${category ? category.name : 'Uncategorized'}</td>
                                        <td>${paymentMethodLabels[expense.paymentMethod]}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `;
        
        printWindow.document.write(summary);
        printWindow.document.close();
        printWindow.print();
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    closeModals() {
        this.categoryModal.classList.remove('show');
        this.exportModal.classList.remove('show');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#48bb78' : '#f56565'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1001;
            animation: slideInRight 0.3s ease-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    // Utility functions (same as before)
    isSameDay(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }

    isSameWeek(date1, date2) {
        const startOfWeek = new Date(date2);
        startOfWeek.setDate(date2.getDate() - date2.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        return date1 >= startOfWeek && date1 <= endOfWeek;
    }

    isSameMonth(date1, date2) {
        return date1.getMonth() === date2.getMonth() && 
               date1.getFullYear() === date2.getFullYear();
    }

    isSameYear(date1, date2) {
        return date1.getFullYear() === date2.getFullYear();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    saveToLocalStorage() {
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
    }

    saveCategories() {
        localStorage.setItem('categories', JSON.stringify(this.categories));
    }
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);

// Initialize the expense tracker
const expenseTracker = new ExpenseTracker();