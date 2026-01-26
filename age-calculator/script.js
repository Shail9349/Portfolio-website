// Age Calculator - Works on all devices

// DOM Elements
const dayInput = document.getElementById('day');
const monthSelect = document.getElementById('month');
const yearInput = document.getElementById('year');
const calculateBtn = document.getElementById('calculate-btn');
const resetBtn = document.getElementById('reset-btn');

// Result elements
const yearsResult = document.getElementById('years');
const monthsResult = document.getElementById('months');
const daysResult = document.getElementById('days');
const totalDaysResult = document.getElementById('total-days');
const zodiacResult = document.getElementById('zodiac');
const nextBdayResult = document.getElementById('next-bday');
const daysToBdayResult = document.getElementById('days-to-bday');

// Error elements
const dayError = document.getElementById('day-error');
const monthError = document.getElementById('month-error');
const yearError = document.getElementById('year-error');

// Current year for footer
document.getElementById('current-year').textContent = new Date().getFullYear();

// Month names for display
const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Zodiac signs with date ranges
const zodiacSigns = [
    { name: "Capricorn", start: { month: 12, day: 22 }, end: { month: 1, day: 19 } },
    { name: "Aquarius", start: { month: 1, day: 20 }, end: { month: 2, day: 18 } },
    { name: "Pisces", start: { month: 2, day: 19 }, end: { month: 3, day: 20 } },
    { name: "Aries", start: { month: 3, day: 21 }, end: { month: 4, day: 19 } },
    { name: "Taurus", start: { month: 4, day: 20 }, end: { month: 5, day: 20 } },
    { name: "Gemini", start: { month: 5, day: 21 }, end: { month: 6, day: 20 } },
    { name: "Cancer", start: { month: 6, day: 21 }, end: { month: 7, day: 22 } },
    { name: "Leo", start: { month: 7, day: 23 }, end: { month: 8, day: 22 } },
    { name: "Virgo", start: { month: 8, day: 23 }, end: { month: 9, day: 22 } },
    { name: "Libra", start: { month: 9, day: 23 }, end: { month: 10, day: 22 } },
    { name: "Scorpio", start: { month: 10, day: 23 }, end: { month: 11, day: 21 } },
    { name: "Sagittarius", start: { month: 11, day: 22 }, end: { month: 12, day: 21 } }
];

// Function to get zodiac sign based on birth date
function getZodiacSign(month, day) {
    for (const sign of zodiacSigns) {
        // Handle Capricorn (starts in December, ends in January)
        if (sign.name === "Capricorn") {
            if (
                (month === 12 && day >= sign.start.day) ||
                (month === 1 && day <= sign.end.day)
            ) {
                return sign.name;
            }
        } 
        // Handle other signs
        else if (
            (month === sign.start.month && day >= sign.start.day) ||
            (month === sign.end.month && day <= sign.end.day)
        ) {
            return sign.name;
        }
    }
    return "Unknown";
}

// Function to validate the date
function validateDate(day, month, year) {
    let isValid = true;
    
    // Clear previous errors
    dayError.textContent = "";
    monthError.textContent = "";
    yearError.textContent = "";
    
    // Validate year
    if (!year) {
        yearError.textContent = "Year is required";
        isValid = false;
    } else if (year < 1900 || year > new Date().getFullYear()) {
        yearError.textContent = `Year must be between 1900 and ${new Date().getFullYear()}`;
        isValid = false;
    }
    
    // Validate month
    if (!month) {
        monthError.textContent = "Month is required";
        isValid = false;
    }
    
    // Validate day
    if (!day) {
        dayError.textContent = "Day is required";
        isValid = false;
    } else if (day < 1 || day > 31) {
        dayError.textContent = "Day must be between 1 and 31";
        isValid = false;
    } else if (month && year) {
        // Check if day is valid for the selected month and year
        const daysInMonth = new Date(year, month, 0).getDate();
        if (day > daysInMonth) {
            dayError.textContent = `Selected month has only ${daysInMonth} days`;
            isValid = false;
        }
    }
    
    // Check if birth date is in the future
    if (isValid) {
        const birthDate = new Date(year, month - 1, day);
        const today = new Date();
        
        if (birthDate > today) {
            dayError.textContent = "Birth date cannot be in the future";
            isValid = false;
        }
    }
    
    return isValid;
}

// Function to calculate age
function calculateAge(birthDate) {
    const today = new Date();
    
    // Calculate years
    let years = today.getFullYear() - birthDate.getFullYear();
    
    // Calculate months
    let months = today.getMonth() - birthDate.getMonth();
    
    // Calculate days
    let days = today.getDate() - birthDate.getDate();
    
    // Adjust for negative days
    if (days < 0) {
        months--;
        // Get days in the previous month
        const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += prevMonth.getDate();
    }
    
    // Adjust for negative months
    if (months < 0) {
        years--;
        months += 12;
    }
    
    // Calculate total days
    const timeDiff = today.getTime() - birthDate.getTime();
    const totalDays = Math.floor(timeDiff / (1000 * 3600 * 24));
    
    // Calculate next birthday
    const currentYear = today.getFullYear();
    let nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
    
    // If birthday has already passed this year, set for next year
    if (nextBirthday < today) {
        nextBirthday.setFullYear(currentYear + 1);
    }
    
    // Calculate days until next birthday
    const daysToBirthday = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    // Format next birthday
    const nextBdayFormatted = `${monthNames[nextBirthday.getMonth()]} ${nextBirthday.getDate()}, ${nextBirthday.getFullYear()}`;
    
    return {
        years,
        months,
        days,
        totalDays,
        nextBdayFormatted,
        daysToBirthday
    };
}

// Function to update results with animation
function updateResults(ageData, zodiac) {
    // Apply fade-in animation
    const resultElements = [yearsResult, monthsResult, daysResult];
    resultElements.forEach(el => {
        el.classList.remove('fade-in');
        void el.offsetWidth; // Trigger reflow
        el.classList.add('fade-in');
    });
    
    // Update results
    yearsResult.textContent = ageData.years;
    monthsResult.textContent = ageData.months;
    daysResult.textContent = ageData.days;
    totalDaysResult.textContent = ageData.totalDays.toLocaleString();
    zodiacResult.textContent = zodiac;
    nextBdayResult.textContent = ageData.nextBdayFormatted;
    daysToBdayResult.textContent = ageData.daysToBirthday;
}

// Function to reset the form
function resetForm() {
    dayInput.value = "";
    monthSelect.selectedIndex = 0;
    yearInput.value = "";
    
    dayError.textContent = "";
    monthError.textContent = "";
    yearError.textContent = "";
    
    // Reset results
    yearsResult.textContent = "--";
    monthsResult.textContent = "--";
    daysResult.textContent = "--";
    totalDaysResult.textContent = "0";
    zodiacResult.textContent = "--";
    nextBdayResult.textContent = "--";
    daysToBdayResult.textContent = "--";
}

// Event Listeners
calculateBtn.addEventListener('click', function() {
    const day = parseInt(dayInput.value);
    const month = parseInt(monthSelect.value);
    const year = parseInt(yearInput.value);
    
    // Validate inputs
    if (!validateDate(day, month, year)) {
        return;
    }
    
    // Create birth date object
    const birthDate = new Date(year, month - 1, day);
    
    // Calculate age
    const ageData = calculateAge(birthDate);
    
    // Get zodiac sign
    const zodiac = getZodiacSign(month, day);
    
    // Update results
    updateResults(ageData, zodiac);
});

resetBtn.addEventListener('click', resetForm);

// Allow Enter key to trigger calculation
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        calculateBtn.click();
    }
});

// Input validation for real-time feedback
dayInput.addEventListener('input', function() {
    const day = parseInt(dayInput.value);
    const month = parseInt(monthSelect.value);
    const year = parseInt(yearInput.value);
    
    if (month && year && day) {
        validateDate(day, month, year);
    }
});

monthSelect.addEventListener('change', function() {
    const day = parseInt(dayInput.value);
    const month = parseInt(monthSelect.value);
    const year = parseInt(yearInput.value);
    
    if (day && month && year) {
        validateDate(day, month, year);
    }
});

yearInput.addEventListener('input', function() {
    const day = parseInt(dayInput.value);
    const month = parseInt(monthSelect.value);
    const year = parseInt(yearInput.value);
    
    if (day && month && year) {
        validateDate(day, month, year);
    }
});

// Initialize with example data (today's date - 25 years)
window.addEventListener('load', function() {
    const today = new Date();
    const exampleDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
    
    dayInput.value = exampleDate.getDate();
    monthSelect.value = exampleDate.getMonth() + 1;
    yearInput.value = exampleDate.getFullYear();
});

// Mobile-specific improvements
document.addEventListener('DOMContentLoaded', function() {
    // Prevent zoom on input focus (iOS)
    document.addEventListener('touchstart', function(event) {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') {
            event.target.style.fontSize = '16px';
        }
    });
    
    // Auto-advance inputs on mobile
    dayInput.addEventListener('input', function() {
        if (this.value.length === 2) {
            monthSelect.focus();
        }
    });
    
    monthSelect.addEventListener('change', function() {
        if (this.value) {
            yearInput.focus();
        }
    });
    
    // Hide keyboard after calculation on mobile
    calculateBtn.addEventListener('click', function() {
        if ('ontouchstart' in window) {
            document.activeElement.blur();
        }
    });
});
