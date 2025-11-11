class CountdownTimer {
    constructor() {
        this.timeLeft = 0;
        this.totalTime = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.intervalId = null;
        this.recentTimers = JSON.parse(localStorage.getItem('recentTimers')) || [];
        
        this.initializeElements();
        this.bindEvents();
        this.updateDisplay();
        this.renderRecentTimers();
    }

    initializeElements() {
        // Input elements
        this.hoursInput = document.getElementById('hoursInput');
        this.minutesInput = document.getElementById('minutesInput');
        this.secondsInput = document.getElementById('secondsInput');
        
        // Display elements
        this.displayTime = document.getElementById('displayTime');
        this.startTimerBtn = document.getElementById('startTimerBtn');
        this.timerStatus = document.getElementById('timerStatus');
        
        // Control buttons
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resumeBtn = document.getElementById('resumeBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // Other elements
        this.presetBtns = document.querySelectorAll('.preset-btn');
        this.notificationToggle = document.getElementById('notificationToggle');
        this.recentList = document.getElementById('recentList');
        this.notificationSound = document.getElementById('notificationSound');
        
        // Progress ring
        this.progressCircle = document.querySelector('.progress-ring-circle');
        this.circumference = 2 * Math.PI * 140;
        this.progressCircle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
        this.progressCircle.style.strokeDashoffset = this.circumference;
    }

    bindEvents() {
        this.startTimerBtn.addEventListener('click', () => this.startTimer());
        this.pauseBtn.addEventListener('click', () => this.pauseTimer());
        this.resumeBtn.addEventListener('click', () => this.resumeTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        
        this.presetBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const minutes = parseInt(e.target.dataset.minutes);
                this.setPresetTime(minutes);
            });
        });

        // Input validation
        [this.hoursInput, this.minutesInput, this.secondsInput].forEach(input => {
            input.addEventListener('change', () => this.validateInputs());
            input.addEventListener('input', () => this.validateInputs());
        });
    }

    validateInputs() {
        // Ensure values are within valid ranges
        this.hoursInput.value = Math.min(23, Math.max(0, parseInt(this.hoursInput.value) || 0));
        this.minutesInput.value = Math.min(59, Math.max(0, parseInt(this.minutesInput.value) || 0));
        this.secondsInput.value = Math.min(59, Math.max(0, parseInt(this.secondsInput.value) || 0));
    }

    setPresetTime(minutes) {
        this.hoursInput.value = 0;
        this.minutesInput.value = minutes;
        this.secondsInput.value = 0;
        this.validateInputs();
        
        // Visual feedback
        this.animatePresetButton(minutes);
    }

    animatePresetButton(minutes) {
        const button = Array.from(this.presetBtns).find(btn => 
            parseInt(btn.dataset.minutes) === minutes
        );
        if (button) {
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = '';
            }, 150);
        }
    }

    startTimer() {
        const hours = parseInt(this.hoursInput.value) || 0;
        const minutes = parseInt(this.minutesInput.value) || 0;
        const seconds = parseInt(this.secondsInput.value) || 0;

        this.totalTime = hours * 3600 + minutes * 60 + seconds;
        
        if (this.totalTime <= 0) {
            this.shakeInputs();
            return;
        }

        this.timeLeft = this.totalTime;
        this.isRunning = true;
        this.isPaused = false;
        
        // Hide start button and show status
        this.startTimerBtn.style.display = 'none';
        this.timerStatus.style.display = 'block';
        this.timerStatus.textContent = 'Running';
        this.timerStatus.style.color = '#48bb78';

        this.updateButtons();
        this.updateDisplay();

        this.intervalId = setInterval(() => this.tick(), 1000);
        
        // Add to recent timers
        this.addToRecentTimers(hours, minutes, seconds);
    }

    pauseTimer() {
        if (this.isRunning && !this.isPaused) {
            this.isPaused = true;
            clearInterval(this.intervalId);
            this.timerStatus.textContent = 'Paused';
            this.timerStatus.style.color = '#ed8936';
            this.updateButtons();
        }
    }

    resumeTimer() {
        if (this.isRunning && this.isPaused) {
            this.isPaused = false;
            this.timerStatus.textContent = 'Running';
            this.timerStatus.style.color = '#48bb78';
            this.intervalId = setInterval(() => this.tick(), 1000);
            this.updateButtons();
        }
    }

    resetTimer() {
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.intervalId);
        this.timeLeft = 0;
        this.totalTime = 0;
        
        // Show start button and hide status
        this.startTimerBtn.style.display = 'flex';
        this.timerStatus.style.display = 'none';

        this.updateDisplay();
        this.updateButtons();
        
        // Reset progress ring
        this.setProgress(100);
    }

    tick() {
        this.timeLeft--;
        
        if (this.timeLeft <= 0) {
            this.timerComplete();
            return;
        }
        
        this.updateDisplay();
    }

    timerComplete() {
        clearInterval(this.intervalId);
        this.isRunning = false;
        this.isPaused = false;
        
        this.displayTime.textContent = '00:00:00';
        this.timerStatus.textContent = 'Time\'s Up!';
        this.timerStatus.style.color = '#f56565';
        
        this.updateButtons();
        this.setProgress(0);
        
        // Show start button again after completion
        setTimeout(() => {
            this.startTimerBtn.style.display = 'flex';
            this.timerStatus.style.display = 'none';
        }, 3000);
        
        // Visual and audio notification
        this.notifyCompletion();
    }

    notifyCompletion() {
        // Visual notification
        this.displayTime.classList.add('pulse');
        
        // Audio notification
        if (this.notificationToggle.checked) {
            this.notificationSound.play().catch(e => {
                console.log('Audio playback failed:', e);
            });
        }
        
        // Stop pulsing after 5 seconds
        setTimeout(() => {
            this.displayTime.classList.remove('pulse');
        }, 5000);
    }

    updateDisplay() {
        const hours = Math.floor(this.timeLeft / 3600);
        const minutes = Math.floor((this.timeLeft % 3600) / 60);
        const seconds = this.timeLeft % 60;

        this.displayTime.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Update progress ring
        if (this.totalTime > 0) {
            const progress = (this.timeLeft / this.totalTime) * 100;
            this.setProgress(progress);
        }
    }

    setProgress(percent) {
        const offset = this.circumference - (percent / 100) * this.circumference;
        this.progressCircle.style.strokeDashoffset = offset;
        
        // Change color based on progress
        if (percent > 50) {
            this.progressCircle.style.stroke = '#48bb78';
        } else if (percent > 25) {
            this.progressCircle.style.stroke = '#ed8936';
        } else {
            this.progressCircle.style.stroke = '#f56565';
        }
    }

    updateButtons() {
        this.pauseBtn.disabled = !this.isRunning || this.isPaused;
        this.resumeBtn.disabled = !this.isRunning || !this.isPaused;
        this.resetBtn.disabled = false;
    }

    addToRecentTimers(hours, minutes, seconds) {
        const timer = {
            id: Date.now(), // Add unique ID for deletion
            hours: hours,
            minutes: minutes,
            seconds: seconds,
            timestamp: new Date().toLocaleString()
        };
        
        this.recentTimers.unshift(timer);
        this.recentTimers = this.recentTimers.slice(0, 5); // Keep only last 5
        localStorage.setItem('recentTimers', JSON.stringify(this.recentTimers));
        this.renderRecentTimers();
    }

    renderRecentTimers() {
        if (this.recentTimers.length === 0) {
            this.recentList.innerHTML = '<div class="recent-item" style="justify-content: center; color: #718096;">No recent timers</div>';
            return;
        }

        this.recentList.innerHTML = this.recentTimers.map(timer => `
            <div class="recent-item">
                <div class="recent-content" onclick="countdownTimer.useRecentTimer(${timer.hours}, ${timer.minutes}, ${timer.seconds})">
                    <div class="recent-time">
                        ${timer.hours.toString().padStart(2, '0')}:${timer.minutes.toString().padStart(2, '0')}:${timer.seconds.toString().padStart(2, '0')}
                    </div>
                    <div class="recent-date">${timer.timestamp}</div>
                </div>
                <button class="delete-recent-btn" onclick="countdownTimer.deleteRecentTimer(${timer.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    deleteRecentTimer(timerId) {
        this.recentTimers = this.recentTimers.filter(timer => timer.id !== timerId);
        localStorage.setItem('recentTimers', JSON.stringify(this.recentTimers));
        this.renderRecentTimers();
        
        // Visual feedback
        this.animateDelete(timerId);
    }

    animateDelete(timerId) {
        const deleteBtn = event.target.closest('.delete-recent-btn');
        if (deleteBtn) {
            deleteBtn.style.transform = 'scale(0.8)';
            setTimeout(() => {
                deleteBtn.style.transform = '';
            }, 200);
        }
    }

    useRecentTimer(hours, minutes, seconds) {
        this.hoursInput.value = hours;
        this.minutesInput.value = minutes;
        this.secondsInput.value = seconds;
        this.validateInputs();
        
        // Visual feedback
        this.animateRecentSelection(hours, minutes, seconds);
    }

    animateRecentSelection(hours, minutes, seconds) {
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        const items = this.recentList.querySelectorAll('.recent-item');
        
        items.forEach(item => {
            if (item.querySelector('.recent-time').textContent === timeString) {
                item.style.background = '#667eea';
                item.style.color = 'white';
                setTimeout(() => {
                    item.style.background = '';
                    item.style.color = '';
                }, 1000);
            }
        });
    }

    shakeInputs() {
        [this.hoursInput, this.minutesInput, this.secondsInput].forEach(input => {
            input.classList.add('shake');
            setTimeout(() => input.classList.remove('shake'), 500);
        });
    }
}

// Initialize the timer
const countdownTimer = new CountdownTimer();