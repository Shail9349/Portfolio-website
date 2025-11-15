// Notification management system
class NotificationManager {
    constructor() {
        this.storage = storage;
        this.setupEventListeners();
        this.updateNotificationDisplay();
        this.checkDailyReminders();
    }

    // Setup event listeners for notification UI
    setupEventListeners() {
        const notificationBell = document.getElementById('notificationBell');
        const notificationPanel = document.getElementById('notificationPanel');
        const closeNotifications = document.getElementById('closeNotifications');

        if (notificationBell) {
            notificationBell.addEventListener('click', () => {
                this.toggleNotificationPanel();
            });
        }

        if (closeNotifications) {
            closeNotifications.addEventListener('click', () => {
                this.hideNotificationPanel();
            });
        }

        // Close notification panel when clicking outside
        document.addEventListener('click', (event) => {
            if (notificationPanel && 
                !notificationPanel.contains(event.target) && 
                !notificationBell.contains(event.target) &&
                notificationPanel.classList.contains('show')) {
                this.hideNotificationPanel();
            }
        });
    }

    // Toggle notification panel visibility
    toggleNotificationPanel() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.classList.toggle('show');
            this.updateNotificationDisplay();
        }
    }

    // Hide notification panel
    hideNotificationPanel() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.classList.remove('show');
        }
    }

    // Update notification display
    updateNotificationDisplay() {
        this.updateNotificationCount();
        this.updateNotificationList();
    }

    // Update notification count in the bell
    updateNotificationCount() {
        const countElement = document.getElementById('notificationCount');
        const count = this.storage.getUnreadNotificationsCount();
        
        if (countElement) {
            countElement.textContent = count;
            countElement.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    // Update notification list in the panel
    updateNotificationList() {
        const listElement = document.getElementById('notificationsList');
        if (!listElement) return;

        const notifications = this.storage.getAllNotifications();

        if (notifications.length === 0) {
            listElement.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications yet</p>
                    <small>You'll get reminders here for admit cards and exams</small>
                </div>
            `;
            return;
        }

        listElement.innerHTML = notifications.map(notification => `
            <div class="notification-item ${notification.priority}">
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">
                    ${this.formatNotificationTime(notification.createdAt)}
                </div>
            </div>
        `).join('');
    }

    // Format notification time
    formatNotificationTime(timestamp) {
        const now = new Date();
        const notificationTime = new Date(timestamp);
        const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        
        return notificationTime.toLocaleDateString();
    }

    // Check for daily reminders
    checkDailyReminders() {
        const lastReminderCheck = localStorage.getItem('lastReminderCheck');
        const today = new Date().toDateString();

        if (lastReminderCheck !== today) {
            this.showDailyReminders();
            localStorage.setItem('lastReminderCheck', today);
        }
    }

    // Show daily reminders
    showDailyReminders() {
        const urgentExams = this.storage.getUrgentExams();
        const today = new Date();
        
        const upcomingAdmitCards = this.storage.getAllApplications().filter(app => {
            if (!app.admitCardDate || app.status !== 'applied') return false;
            const admitCardDate = new Date(app.admitCardDate);
            const daysUntilAdmitCard = Math.ceil((admitCardDate - today) / (1000 * 60 * 60 * 24));
            return daysUntilAdmitCard <= 7 && daysUntilAdmitCard >= 0;
        });

        if (urgentExams.length > 0 || upcomingAdmitCards.length > 0) {
            this.showReminderAlert(urgentExams, upcomingAdmitCards);
        }
    }

    // Show reminder alert
    showReminderAlert(urgentExams, upcomingAdmitCards) {
        let message = '';

        if (urgentExams.length > 0) {
            message += `You have ${urgentExams.length} exam(s) coming up soon!\n\n`;
            urgentExams.forEach((exam, index) => {
                const examDate = new Date(exam.examDate);
                const daysLeft = Math.ceil((examDate - new Date()) / (1000 * 60 * 60 * 24));
                message += `• ${exam.jobTitle} - ${daysLeft} day${daysLeft > 1 ? 's' : ''} left\n`;
            });
            message += '\n';
        }

        if (upcomingAdmitCards.length > 0) {
            message += `Admit cards available soon for ${upcomingAdmitCards.length} exam(s):\n\n`;
            upcomingAdmitCards.forEach((app, index) => {
                const admitCardDate = new Date(app.admitCardDate);
                const daysLeft = Math.ceil((admitCardDate - new Date()) / (1000 * 60 * 60 * 24));
                message += `• ${app.jobTitle} - ${daysLeft} day${daysLeft > 1 ? 's' : ''} left\n`;
            });
        }

        if (message) {
            // Show browser notification if supported
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('JobTrack - Daily Reminder', {
                    body: message,
                    icon: '/favicon.ico'
                });
            }

            // Show in-app notification
            this.showToast(message, 'warning');
        }
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

    // Request browser notification permission
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.showToast('Notification permission granted!', 'success');
                }
            });
        }
    }
}

// Initialize notification manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.notificationManager = new NotificationManager();
});