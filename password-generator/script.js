class PasswordGenerator {
    constructor() {
        this.passwordHistory = JSON.parse(localStorage.getItem('passwordHistory')) || [];
        this.characters = {
            uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            lowercase: 'abcdefghijklmnopqrstuvwxyz',
            numbers: '0123456789',
            symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
        };
        
        this.initializeElements();
        this.bindEvents();
        this.generatePassword();
        this.renderHistory();
    }

    initializeElements() {
        // Password display
        this.passwordOutput = document.getElementById('passwordOutput');
        this.copyBtn = document.getElementById('copyBtn');
        this.strengthBar = document.getElementById('strengthBar');
        this.strengthText = document.getElementById('strengthText');
        
        // Settings
        this.lengthSlider = document.getElementById('lengthSlider');
        this.lengthValue = document.getElementById('lengthValue');
        this.uppercase = document.getElementById('uppercase');
        this.lowercase = document.getElementById('lowercase');
        this.numbers = document.getElementById('numbers');
        this.symbols = document.getElementById('symbols');
        this.excludeSimilar = document.getElementById('excludeSimilar');
        
        // Buttons
        this.generateBtn = document.getElementById('generateBtn');
        this.regenerateBtn = document.getElementById('regenerateBtn');
        this.clearHistory = document.getElementById('clearHistory');
        
        // History
        this.passwordHistoryEl = document.getElementById('passwordHistory');
        
        // Notification
        this.copyNotification = document.getElementById('copyNotification');
    }

    bindEvents() {
        this.generateBtn.addEventListener('click', () => this.generatePassword());
        this.regenerateBtn.addEventListener('click', () => this.generatePassword());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        this.clearHistory.addEventListener('click', () => this.clearPasswordHistory());
        
        // Update length value when slider changes
        this.lengthSlider.addEventListener('input', () => {
            this.lengthValue.textContent = this.lengthSlider.value;
        });
        
        // Generate new password when settings change
        [this.lengthSlider, this.uppercase, this.lowercase, this.numbers, this.symbols, this.excludeSimilar]
            .forEach(element => {
                element.addEventListener('change', () => this.generatePassword());
            });
    }

    generatePassword() {
        const length = parseInt(this.lengthSlider.value);
        const includeUppercase = this.uppercase.checked;
        const includeLowercase = this.lowercase.checked;
        const includeNumbers = this.numbers.checked;
        const includeSymbols = this.symbols.checked;
        const excludeSimilarChars = this.excludeSimilar.checked;

        // Validate at least one character type is selected
        if (!includeUppercase && !includeLowercase && !includeNumbers && !includeSymbols) {
            this.showError('Please select at least one character type');
            return;
        }

        let characterPool = '';
        
        if (includeUppercase) {
            characterPool += excludeSimilarChars ? 
                this.characters.uppercase.replace(/[IO]/g, '') : 
                this.characters.uppercase;
        }
        
        if (includeLowercase) {
            characterPool += excludeSimilarChars ? 
                this.characters.lowercase.replace(/[il]/g, '') : 
                this.characters.lowercase;
        }
        
        if (includeNumbers) {
            characterPool += excludeSimilarChars ? 
                this.characters.numbers.replace(/[01]/g, '') : 
                this.characters.numbers;
        }
        
        if (includeSymbols) {
            characterPool += this.characters.symbols;
        }

        // Ensure character pool is not empty
        if (characterPool.length === 0) {
            this.showError('No valid characters available with current settings');
            return;
        }

        let password = '';
        const array = new Uint32Array(length);
        window.crypto.getRandomValues(array);

        for (let i = 0; i < length; i++) {
            password += characterPool[array[i] % characterPool.length];
        }

        // Ensure password contains at least one character from each selected type
        password = this.ensureCharacterVariety(password, {
            includeUppercase, includeLowercase, includeNumbers, includeSymbols
        });

        this.passwordOutput.value = password;
        this.updatePasswordStrength(password);
        this.addToHistory(password);
    }

    ensureCharacterVariety(password, options) {
        const { includeUppercase, includeLowercase, includeNumbers, includeSymbols } = options;
        let newPassword = password.split('');
        
        const checks = [
            { condition: includeUppercase, regex: /[A-Z]/, chars: this.characters.uppercase },
            { condition: includeLowercase, regex: /[a-z]/, chars: this.characters.lowercase },
            { condition: includeNumbers, regex: /[0-9]/, chars: this.characters.numbers },
            { condition: includeSymbols, regex: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, chars: this.characters.symbols }
        ];

        checks.forEach((check, index) => {
            if (check.condition && !check.regex.test(newPassword.join(''))) {
                // Replace a random character with one from the missing type
                const replaceIndex = Math.floor(Math.random() * newPassword.length);
                const randomChar = check.chars[Math.floor(Math.random() * check.chars.length)];
                newPassword[replaceIndex] = randomChar;
            }
        });

        return newPassword.join('');
    }

    updatePasswordStrength(password) {
        let strength = 0;
        const length = password.length;

        // Length factor
        if (length >= 8) strength += 1;
        if (length >= 12) strength += 1;
        if (length >= 16) strength += 1;

        // Character variety factors
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;

        // Update strength meter and text
        this.strengthBar.className = 'strength-bar';
        this.strengthBar.classList.add(this.getStrengthClass(strength));
        this.strengthText.textContent = this.getStrengthText(strength);
        this.strengthText.style.color = this.getStrengthColor(strength);
    }

    getStrengthClass(strength) {
        if (strength <= 2) return 'very-weak';
        if (strength <= 4) return 'weak';
        if (strength <= 6) return 'medium';
        if (strength <= 8) return 'strong';
        return 'very-strong';
    }

    getStrengthText(strength) {
        if (strength <= 2) return 'Very Weak';
        if (strength <= 4) return 'Weak';
        if (strength <= 6) return 'Medium';
        if (strength <= 8) return 'Strong';
        return 'Very Strong';
    }

    getStrengthColor(strength) {
        if (strength <= 2) return '#e53e3e';
        if (strength <= 4) return '#ed8936';
        if (strength <= 6) return '#ecc94b';
        if (strength <= 8) return '#48bb78';
        return '#38a169';
    }

    copyToClipboard() {
        const password = this.passwordOutput.value;
        
        if (!password) return;

        navigator.clipboard.writeText(password).then(() => {
            this.showCopyNotification();
            this.copyBtn.classList.add('copied');
            this.copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            
            setTimeout(() => {
                this.copyBtn.classList.remove('copied');
                this.copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy password: ', err);
            this.showError('Failed to copy password');
        });
    }

    showCopyNotification() {
        this.copyNotification.classList.add('show');
        setTimeout(() => {
            this.copyNotification.classList.remove('show');
        }, 2000);
    }

    showError(message) {
        // Simple error display - you can enhance this with a proper notification system
        alert(message);
    }

    addToHistory(password) {
        const historyItem = {
            id: Date.now(),
            password: password,
            timestamp: new Date().toLocaleString()
        };

        this.passwordHistory.unshift(historyItem);
        this.passwordHistory = this.passwordHistory.slice(0, 10); // Keep only last 10
        localStorage.setItem('passwordHistory', JSON.stringify(this.passwordHistory));
        this.renderHistory();
    }

    renderHistory() {
        if (this.passwordHistory.length === 0) {
            this.passwordHistoryEl.innerHTML = `
                <div class="history-item" style="justify-content: center; color: #718096;">
                    No password history
                </div>
            `;
            return;
        }

        this.passwordHistoryEl.innerHTML = this.passwordHistory.map(item => `
            <div class="history-item">
                <span class="history-password">${item.password}</span>
                <div class="history-actions">
                    <button class="history-copy-btn" onclick="passwordGenerator.copyHistoryPassword('${item.password}')" title="Copy">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="history-delete-btn" onclick="passwordGenerator.deleteHistoryItem(${item.id})" title="Delete">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    copyHistoryPassword(password) {
        navigator.clipboard.writeText(password).then(() => {
            this.showCopyNotification();
        }).catch(err => {
            console.error('Failed to copy password: ', err);
        });
    }

    deleteHistoryItem(id) {
        this.passwordHistory = this.passwordHistory.filter(item => item.id !== id);
        localStorage.setItem('passwordHistory', JSON.stringify(this.passwordHistory));
        this.renderHistory();
    }

    clearPasswordHistory() {
        if (this.passwordHistory.length === 0) return;
        
        if (confirm('Are you sure you want to clear all password history?')) {
            this.passwordHistory = [];
            localStorage.setItem('passwordHistory', JSON.stringify(this.passwordHistory));
            this.renderHistory();
        }
    }
}

// Initialize the password generator
const passwordGenerator = new PasswordGenerator();