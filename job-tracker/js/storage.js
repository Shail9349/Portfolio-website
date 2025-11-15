// Storage management for job applications
class StorageManager {
    constructor() {
        this.storageKey = 'jobApplications';
        this.notificationsKey = 'jobNotifications';
        this.applications = this.loadApplications();
        this.notifications = this.loadNotifications();
    }

    // Load applications from localStorage
    loadApplications() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                return JSON.parse(stored);
            } else {
                // Add sample data if no data exists
                const sampleData = this.getSampleData();
                this.applications = sampleData;
                this.saveApplications();
                return sampleData;
            }
        } catch (error) {
            console.error('Error loading applications:', error);
            return this.getSampleData();
        }
    }

    // Get sample data for first-time users
    getSampleData() {
        return [
            {
                id: this.generateId(),
                jobTitle: "RRB NTPC Graduate",
                organization: "Railway Recruitment Board",
                applicationDate: "2024-01-15",
                applicationFee: 500,
                examDate: "2024-03-20",
                admitCardDate: "2024-03-01",
                status: "applied",
                notes: "Tier 1 exam scheduled",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: this.generateId(),
                jobTitle: "SSC Stenographer",
                organization: "Staff Selection Commission",
                applicationDate: "2024-01-20",
                applicationFee: 100,
                examDate: "2024-04-15",
                admitCardDate: "2024-04-01",
                status: "admitCardDownloaded",
                notes: "Grade C and D posts",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: this.generateId(),
                jobTitle: "DSSSB Non-Teaching Staff",
                organization: "Delhi Subordinate Services Selection Board",
                applicationDate: "2024-02-01",
                applicationFee: 100,
                status: "applied",
                notes: "Various posts - Clerk, Assistant, etc.",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
    }

    // Save applications to localStorage
    saveApplications() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.applications));
            return true;
        } catch (error) {
            console.error('Error saving applications:', error);
            return false;
        }
    }

    // Load notifications from localStorage
    loadNotifications() {
        try {
            const stored = localStorage.getItem(this.notificationsKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading notifications:', error);
            return [];
        }
    }

    // Save notifications to localStorage
    saveNotifications() {
        try {
            localStorage.setItem(this.notificationsKey, JSON.stringify(this.notifications));
            return true;
        } catch (error) {
            console.error('Error saving notifications:', error);
            return false;
        }
    }

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Add new application
    addApplication(applicationData) {
        const application = {
            id: this.generateId(),
            ...applicationData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.applications.push(application);
        const success = this.saveApplications();
        
        if (success) {
            this.generateNotifications(application);
        }
        
        return success ? application : null;
    }

    // Update existing application
    updateApplication(id, updates) {
        const index = this.applications.findIndex(app => app.id === id);
        
        if (index !== -1) {
            this.applications[index] = {
                ...this.applications[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            const success = this.saveApplications();
            
            if (success) {
                this.generateNotifications(this.applications[index]);
            }
            
            return success;
        }
        
        return false;
    }

    // Delete application
    deleteApplication(id) {
        const index = this.applications.findIndex(app => app.id === id);
        
        if (index !== -1) {
            this.applications.splice(index, 1);
            return this.saveApplications();
        }
        
        return false;
    }

    // Get application by ID
    getApplication(id) {
        return this.applications.find(app => app.id === id);
    }

    // Get all applications
    getAllApplications() {
        return [...this.applications].sort((a, b) => 
            new Date(b.applicationDate) - new Date(a.applicationDate)
        );
    }

    // Get recent applications (last 5)
    getRecentApplications() {
        return this.getAllApplications().slice(0, 5);
    }

    // Get applications by status
    getApplicationsByStatus(status) {
        if (status === 'all') return this.getAllApplications();
        return this.getAllApplications().filter(app => app.status === status);
    }

    // Search applications
    searchApplications(query) {
        if (!query) return this.getAllApplications();
        
        const searchTerm = query.toLowerCase();
        return this.getAllApplications().filter(app => 
            app.jobTitle.toLowerCase().includes(searchTerm) ||
            app.organization.toLowerCase().includes(searchTerm) ||
            (app.notes && app.notes.toLowerCase().includes(searchTerm))
        );
    }

    // Get upcoming exams
    getUpcomingExams() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return this.getAllApplications()
            .filter(app => app.examDate && 
                          new Date(app.examDate) >= today)
            .sort((a, b) => new Date(a.examDate) - new Date(b.examDate));
    }

    // Get urgent exams (within 7 days)
    getUrgentExams() {
        const today = new Date();
        const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        return this.getUpcomingExams().filter(app => 
            new Date(app.examDate) <= next7Days
        );
    }

    // Get statistics
    getStatistics() {
        const total = this.applications.length;
        const upcoming = this.getUpcomingExams().length;
        const completed = this.applications.filter(app => 
            ['examGiven', 'resultDeclared', 'selected', 'rejected'].includes(app.status)
        ).length;

        // Status breakdown
        const statusCounts = {};
        this.applications.forEach(app => {
            statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
        });

        return { 
            total, 
            upcoming, 
            completed,
            statusCounts
        };
    }

    // Generate notifications for an application
    generateNotifications(application) {
        // Remove old notifications for this application
        this.notifications = this.notifications.filter(notif => 
            notif.applicationId !== application.id
        );

        const notifications = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Admit card notification (7 days before)
        if (application.admitCardDate) {
            const admitCardDate = new Date(application.admitCardDate);
            const daysUntilAdmitCard = Math.ceil((admitCardDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntilAdmitCard <= 7 && daysUntilAdmitCard >= 0) {
                notifications.push({
                    id: this.generateId(),
                    applicationId: application.id,
                    type: 'admitCard',
                    message: `Admit card for ${application.jobTitle} will be available in ${daysUntilAdmitCard} day${daysUntilAdmitCard !== 1 ? 's' : ''}`,
                    date: application.admitCardDate,
                    priority: daysUntilAdmitCard <= 3 ? 'urgent' : 'warning',
                    createdAt: new Date().toISOString()
                });
            }
        }

        // Exam date notification (14 days before)
        if (application.examDate) {
            const examDate = new Date(application.examDate);
            const daysUntilExam = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntilExam <= 14 && daysUntilExam >= 0) {
                notifications.push({
                    id: this.generateId(),
                    applicationId: application.id,
                    type: 'exam',
                    message: `Exam for ${application.jobTitle} is in ${daysUntilExam} day${daysUntilExam !== 1 ? 's' : ''}`,
                    date: application.examDate,
                    priority: daysUntilExam <= 7 ? 'urgent' : 'warning',
                    createdAt: new Date().toISOString()
                });
            }
        }

        // Add new notifications
        this.notifications.push(...notifications);
        this.saveNotifications();
        
        return notifications;
    }

    // Get all notifications
    getAllNotifications() {
        return this.notifications.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // Get unread notifications count
    getUnreadNotificationsCount() {
        return this.notifications.length;
    }

    // Clear old notifications (older than 30 days)
    clearOldNotifications() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        this.notifications = this.notifications.filter(notif => 
            new Date(notif.createdAt) > thirtyDaysAgo
        );
        
        this.saveNotifications();
    }

    // Export data
    exportData() {
        return {
            applications: this.applications,
            notifications: this.notifications,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
    }

    // Import data
    importData(data) {
        if (data.applications && Array.isArray(data.applications)) {
            this.applications = data.applications;
            this.saveApplications();
            
            // Regenerate notifications for all applications
            this.notifications = [];
            this.applications.forEach(app => {
                this.generateNotifications(app);
            });
            
            return true;
        }
        return false;
    }
}

// Create global storage instance
const storage = new StorageManager();