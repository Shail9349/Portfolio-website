// Main application controller
class JobTrackerApp {
    constructor() {
        this.storage = storage;
        this.currentFilter = 'all';
        this.currentSearch = '';
        this.init();
    }

    // Initialize the application
    init() {
        this.setupEventListeners();
        this.showSection('dashboard');
        this.loadDashboard();
        this.setDefaultDates();
        
        // Request notification permission after a delay
        setTimeout(() => {
            if (window.notificationManager) {
                window.notificationManager.requestNotificationPermission();
            }
        }, 2000);
    }

    // Setup all event listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('.nav-link').dataset.section;
                this.showSection(section);
            });
        });

        // View all links
        document.querySelectorAll('.view-all, #addNewApp').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('[data-section]').dataset.section;
                this.showSection(section);
            });
        });

        // Form submission
        document.getElementById('applicationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Clear form
        document.getElementById('clearForm').addEventListener('click', () => {
            this.clearForm();
        });

        // Filter applications
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.loadApplications();
        });

        // Search applications
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.currentSearch = e.target.value;
            this.loadApplications();
        });

        // Edit modal
        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.closeEditModal();
        });

        document.querySelector('.close').addEventListener('click', () => {
            this.closeEditModal();
        });

        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditSubmit();
        });

        // Close modal when clicking outside
        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target.id === 'editModal') {
                this.closeEditModal();
            }
        });

        // Data management
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importData').addEventListener('click', () => {
            this.importData();
        });
    }

    // Show specific section
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update page title
        this.updatePageTitle(sectionName);

        // Load section content
        switch(sectionName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'applications':
                this.loadApplications();
                break;
            case 'upcoming-exams':
                this.loadUpcomingExams();
                break;
            case 'statistics':
                this.loadStatistics();
                break;
        }
    }

    // Update page title based on section
    updatePageTitle(section) {
        const titles = {
            'dashboard': 'Application Dashboard',
            'add-application': 'Add New Application',
            'applications': 'All Applications',
            'upcoming-exams': 'Upcoming Exams',
            'statistics': 'Application Statistics'
        };

        const subtitles = {
            'dashboard': 'Track all your job applications in one place',
            'add-application': 'Add a new job application to track',
            'applications': 'View and manage all your applications',
            'upcoming-exams': 'Never miss an important exam date',
            'statistics': 'Analyze your application progress'
        };

        document.getElementById('pageTitle').textContent = titles[section] || 'JobTrack';
        document.getElementById('pageSubtitle').textContent = subtitles[section] || '';
    }

    // Set default dates in forms
    setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('applicationDate').value = today;
    }

    // Handle form submission
    handleFormSubmit() {
        const formData = this.getFormData();
        
        if (!formData) {
            return;
        }

        const application = this.storage.addApplication(formData);
        
        if (application) {
            this.showToast('Application added successfully!', 'success');
            this.clearForm();
            this.loadDashboard();
            
            // Update notifications
            if (window.notificationManager) {
                window.notificationManager.updateNotificationDisplay();
            }
        } else {
            this.showToast('Error adding application. Please try again.', 'error');
        }
    }

    // Get form data
    getFormData() {
        const jobTitle = document.getElementById('jobTitle').value.trim();
        const organization = document.getElementById('organization').value.trim();
        const applicationDate = document.getElementById('applicationDate').value;
        const applicationFee = document.getElementById('applicationFee').value;
        const examDate = document.getElementById('examDate').value;
        const admitCardDate = document.getElementById('admitCardDate').value;
        const status = document.getElementById('status').value;
        const notes = document.getElementById('notes').value.trim();

        if (!jobTitle || !organization || !applicationDate) {
            this.showToast('Please fill in all required fields.', 'warning');
            return null;
        }

        return {
            jobTitle,
            organization,
            applicationDate,
            applicationFee: applicationFee ? parseInt(applicationFee) : 0,
            examDate: examDate || null,
            admitCardDate: admitCardDate || null,
            status,
            notes: notes || ''
        };
    }

    // Clear form
    clearForm() {
        document.getElementById('applicationForm').reset();
        this.setDefaultDates();
    }

    // Load dashboard content
    loadDashboard() {
        this.updateStatistics();
        this.loadRecentApplications();
        this.loadDashboardUpcomingExams();
    }

    // Load recent applications for dashboard
    loadRecentApplications() {
        const listElement = document.getElementById('recentApplicationsList');
        const applications = this.storage.getRecentApplications();

        if (applications.length === 0) {
            listElement.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-alt"></i>
                    <p>No applications yet</p>
                    <small>Add your first job application to get started</small>
                </div>
            `;
            return;
        }

        listElement.innerHTML = applications.map(app => this.createApplicationCard(app)).join('');
        this.attachApplicationEventListeners(listElement);
    }

    // Load applications into the list
    loadApplications() {
        const listElement = document.getElementById('allApplicationsList');
        let applications;

        if (this.currentSearch) {
            applications = this.storage.searchApplications(this.currentSearch);
        } else {
            applications = this.storage.getApplicationsByStatus(this.currentFilter);
        }

        if (applications.length === 0) {
            listElement.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-alt"></i>
                    <p>No applications found</p>
                    <small>${this.currentSearch ? 'Try adjusting your search' : 'Start by adding your first job application'}</small>
                </div>
            `;
            return;
        }

        listElement.innerHTML = applications.map(app => this.createApplicationCard(app)).join('');
        this.attachApplicationEventListeners(listElement);
    }

    // Create application card HTML
    createApplicationCard(application) {
        const statusClass = `status-${application.status}`;
        const statusText = application.status.replace(/([A-Z])/g, ' $1').trim();
        
        return `
            <div class="application-card" data-id="${application.id}">
                <div class="application-header">
                    <div>
                        <div class="application-title">${this.escapeHtml(application.jobTitle)}</div>
                        <div class="application-org">${this.escapeHtml(application.organization)}</div>
                    </div>
                    ${application.applicationFee ? `
                    <div class="application-fee">₹${application.applicationFee}</div>
                    ` : ''}
                </div>
                
                <div class="application-dates">
                    <div class="date-item">
                        <span class="date-label">Applied on</span>
                        <span class="date-value">${this.formatDate(application.applicationDate)}</span>
                    </div>
                    ${application.examDate ? `
                    <div class="date-item">
                        <span class="date-label">Exam Date</span>
                        <span class="date-value">${this.formatDate(application.examDate)}</span>
                    </div>
                    ` : ''}
                    ${application.admitCardDate ? `
                    <div class="date-item">
                        <span class="date-label">Admit Card</span>
                        <span class="date-value">${this.formatDate(application.admitCardDate)}</span>
                    </div>
                    ` : ''}
                </div>
                
                ${application.notes ? `
                <div class="application-notes">
                    <strong>Notes:</strong> ${this.escapeHtml(application.notes)}
                </div>
                ` : ''}
                
                <div class="application-footer">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                    <div class="application-actions">
                        <button class="action-btn edit-btn" title="Edit" data-id="${application.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" title="Delete" data-id="${application.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Attach event listeners to application action buttons
    attachApplicationEventListeners(container) {
        // Edit buttons
        container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.edit-btn').dataset.id;
                this.openEditModal(id);
            });
        });

        // Delete buttons
        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.delete-btn').dataset.id;
                this.confirmDeleteApplication(id);
            });
        });
    }

    // Load upcoming exams for dashboard
    loadDashboardUpcomingExams() {
        const container = document.getElementById('dashboardUpcomingExams');
        const upcomingExams = this.storage.getUpcomingExams().slice(0, 2); // Show only 2 on dashboard

        if (upcomingExams.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-day"></i>
                    <p>No upcoming exams</p>
                    <small>Add exam dates to your applications to see them here</small>
                </div>
            `;
            return;
        }

        container.innerHTML = upcomingExams.map(exam => this.createUpcomingExamCard(exam)).join('');
    }

    // Load all upcoming exams
    loadUpcomingExams() {
        const container = document.getElementById('upcomingExamsList');
        const upcomingExams = this.storage.getUpcomingExams();

        if (upcomingExams.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-day"></i>
                    <p>No upcoming exams</p>
                    <small>Add exam dates to your applications to see them here</small>
                </div>
            `;
            return;
        }

        container.innerHTML = upcomingExams.map(exam => this.createUpcomingExamCard(exam)).join('');
    }

    // Create upcoming exam card
    createUpcomingExamCard(application) {
        const examDate = new Date(application.examDate);
        const today = new Date();
        const daysLeft = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
        
        let priority = 'normal';
        if (daysLeft <= 7) priority = 'urgent';
        else if (daysLeft <= 30) priority = 'warning';

        return `
            <div class="upcoming-card ${priority}">
                <div class="upcoming-header">
                    <div>
                        <div class="upcoming-title">${this.escapeHtml(application.jobTitle)}</div>
                        <div class="upcoming-org">${this.escapeHtml(application.organization)}</div>
                    </div>
                    <div class="days-left">${daysLeft} day${daysLeft !== 1 ? 's' : ''} left</div>
                </div>
                <div class="upcoming-dates">
                    <div><strong>Exam Date:</strong> ${this.formatDate(application.examDate)}</div>
                    ${application.admitCardDate ? `
                    <div><strong>Admit Card:</strong> ${this.formatDate(application.admitCardDate)}</div>
                    ` : ''}
                    <div><strong>Status:</strong> ${application.status.replace(/([A-Z])/g, ' $1').trim()}</div>
                </div>
            </div>
        `;
    }

    // Load statistics
    loadStatistics() {
        const stats = this.storage.getStatistics();
        
        document.getElementById('statTotalApplications').textContent = stats.total;
        document.getElementById('statUpcomingExams').textContent = stats.upcoming;
        document.getElementById('statCompletedExams').textContent = stats.completed;

        // Update status breakdown
        this.updateStatusBreakdown(stats.statusCounts);
    }

    // Update status breakdown
    updateStatusBreakdown(statusCounts) {
        const container = document.getElementById('statusBreakdown');
        const statusLabels = {
            'applied': 'Applied',
            'admitCardDownloaded': 'Admit Card Downloaded',
            'examGiven': 'Exam Given',
            'resultDeclared': 'Result Declared',
            'selected': 'Selected',
            'rejected': 'Rejected'
        };

        if (Object.keys(statusCounts).length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No data available</p></div>';
            return;
        }

        container.innerHTML = Object.entries(statusCounts).map(([status, count]) => `
            <div class="status-item">
                <div class="status-info">
                    <span class="status-badge status-${status}">${statusLabels[status]}</span>
                </div>
                <div class="status-count">${count}</div>
            </div>
        `).join('');
    }

    // Update statistics on dashboard
    updateStatistics() {
        const stats = this.storage.getStatistics();
        
        document.getElementById('totalApplications').textContent = stats.total;
        document.getElementById('upcomingExams').textContent = stats.upcoming;
        document.getElementById('completedExams').textContent = stats.completed;
    }

    // Open edit modal
    openEditModal(id) {
        const application = this.storage.getApplication(id);
        
        if (!application) {
            this.showToast('Application not found.', 'error');
            return;
        }

        // Populate form
        document.getElementById('editId').value = application.id;
        document.getElementById('editJobTitle').value = application.jobTitle;
        document.getElementById('editOrganization').value = application.organization;
        document.getElementById('editApplicationDate').value = application.applicationDate;
        document.getElementById('editApplicationFee').value = application.applicationFee || '';
        document.getElementById('editExamDate').value = application.examDate || '';
        document.getElementById('editAdmitCardDate').value = application.admitCardDate || '';
        document.getElementById('editStatus').value = application.status;
        document.getElementById('editNotes').value = application.notes || '';

        // Show modal
        document.getElementById('editModal').style.display = 'block';
    }

    // Close edit modal
    closeEditModal() {
        document.getElementById('editModal').style.display = 'none';
        document.getElementById('editForm').reset();
    }

    // Handle edit form submission
    handleEditSubmit() {
        const id = document.getElementById('editId').value;
        const updates = {
            jobTitle: document.getElementById('editJobTitle').value.trim(),
            organization: document.getElementById('editOrganization').value.trim(),
            applicationDate: document.getElementById('editApplicationDate').value,
            applicationFee: document.getElementById('editApplicationFee').value ? 
                parseInt(document.getElementById('editApplicationFee').value) : 0,
            examDate: document.getElementById('editExamDate').value || null,
            admitCardDate: document.getElementById('editAdmitCardDate').value || null,
            status: document.getElementById('editStatus').value,
            notes: document.getElementById('editNotes').value.trim()
        };

        if (!updates.jobTitle || !updates.organization || !updates.applicationDate) {
            this.showToast('Please fill in all required fields.', 'warning');
            return;
        }

        const success = this.storage.updateApplication(id, updates);
        
        if (success) {
            this.showToast('Application updated successfully!', 'success');
            this.closeEditModal();
            this.loadDashboard();
            this.loadApplications();
            
            if (window.notificationManager) {
                window.notificationManager.updateNotificationDisplay();
            }
        } else {
            this.showToast('Error updating application.', 'error');
        }
    }

    // Confirm and delete application
    confirmDeleteApplication(id) {
        const application = this.storage.getApplication(id);
        
        if (!application) return;

        if (confirm(`Are you sure you want to delete the application for "${application.jobTitle}"?`)) {
            const success = this.storage.deleteApplication(id);
            
            if (success) {
                this.showToast('Application deleted successfully!', 'success');
                this.loadDashboard();
                this.loadApplications();
                
                if (window.notificationManager) {
                    window.notificationManager.updateNotificationDisplay();
                }
            } else {
                this.showToast('Error deleting application.', 'error');
            }
        }
    }

    // Export data
    exportData() {
        const data = this.storage.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `jobtrack-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        this.showToast('Data exported successfully!', 'success');
    }

    // Import data
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    if (confirm('This will replace all your current data. Are you sure?')) {
                        const success = this.storage.importData(data);
                        if (success) {
                            this.showToast('Data imported successfully!', 'success');
                            this.loadDashboard();
                            this.loadApplications();
                            
                            if (window.notificationManager) {
                                window.notificationManager.updateNotificationDisplay();
                            }
                        } else {
                            this.showToast('Error importing data. Invalid file format.', 'error');
                        }
                    }
                } catch (error) {
                    this.showToast('Error importing data. Invalid file format.', 'error');
                }
            };
            
            reader.readAsText(file);
        });
        
        input.click();
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }, 5000);
    }

    // Utility function to format dates
    formatDate(dateString) {
        if (!dateString) return 'Not set';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    // Utility function to escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.jobTrackerApp = new JobTrackerApp();
});