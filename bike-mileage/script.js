// DOM Elements
const distanceInput = document.getElementById('distance');
const fuelInput = document.getElementById('fuel');
const calculateBtn = document.getElementById('calculate-btn');
const resultElement = document.getElementById('result');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history');

// Load history from localStorage
let calculationHistory = JSON.parse(localStorage.getItem('mileageHistory')) || [];

// Display history on page load
displayHistory();

// Calculate mileage when button is clicked
calculateBtn.addEventListener('click', calculateMileage);

// Calculate mileage when Enter key is pressed in input fields
distanceInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') calculateMileage();
});

fuelInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') calculateMileage();
});

// Clear history when button is clicked
clearHistoryBtn.addEventListener('click', clearHistory);

// Calculate bike mileage
function calculateMileage() {
    const distance = parseFloat(distanceInput.value);
    const fuel = parseFloat(fuelInput.value);
    
    // Validate inputs
    if (isNaN(distance) || isNaN(fuel) || distance <= 0 || fuel <= 0) {
        alert('Please enter valid positive numbers for both distance and fuel.');
        return;
    }
    
    // Calculate mileage
    const mileage = distance / fuel;
    
    // Display result
    resultElement.textContent = mileage.toFixed(2);
    
    // Add to history
    addToHistory(distance, fuel, mileage);
    
    // Clear inputs
    distanceInput.value = '';
    fuelInput.value = '';
    
    // Focus on distance input for next calculation
    distanceInput.focus();
}

// Add calculation to history
function addToHistory(distance, fuel, mileage) {
    const calculation = {
        distance: distance,
        fuel: fuel,
        mileage: mileage.toFixed(2),
        timestamp: new Date().toLocaleString()
    };
    
    calculationHistory.unshift(calculation); // Add to beginning of array
    
    // Keep only last 10 calculations
    if (calculationHistory.length > 10) {
        calculationHistory = calculationHistory.slice(0, 10);
    }
    
    // Save to localStorage
    localStorage.setItem('mileageHistory', JSON.stringify(calculationHistory));
    
    // Update display
    displayHistory();
}

// Display calculation history
function displayHistory() {
    if (calculationHistory.length === 0) {
        historyList.innerHTML = '<p class="no-history">No calculations yet. Calculate your first mileage!</p>';
        return;
    }
    
    historyList.innerHTML = calculationHistory.map(calc => `
        <div class="history-item">
            <span class="history-distance">${calc.distance} km</span>
            <span class="history-fuel">${calc.fuel} L</span>
            <span class="history-mileage">${calc.mileage} km/L</span>
        </div>
    `).join('');
}

// Clear calculation history
function clearHistory() {
    if (calculationHistory.length === 0) {
        alert('History is already empty.');
        return;
    }
    
    if (confirm('Are you sure you want to clear all calculation history?')) {
        calculationHistory = [];
        localStorage.removeItem('mileageHistory');
        displayHistory();
    }
}

// Add some sample data for demonstration (remove in production)
if (calculationHistory.length === 0) {
    // Add sample calculations for demo purposes
    calculationHistory = [
        { distance: 150, fuel: 5, mileage: "30.00", timestamp: new Date().toLocaleString() },
        { distance: 200, fuel: 8, mileage: "25.00", timestamp: new Date().toLocaleString() },
        { distance: 120, fuel: 4, mileage: "30.00", timestamp: new Date().toLocaleString() }
    ];
    localStorage.setItem('mileageHistory', JSON.stringify(calculationHistory));
    displayHistory();
}