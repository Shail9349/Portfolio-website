const display = document.querySelector('input[name="display"]');

function appendToDisplay(value) {
    const currentValue = display.value;
    const lastChar = currentValue.slice(-1);
    
    // If the last character is an operator and the new value is also an operator,
    // replace the last operator instead of adding a new one
    if ("+-*/".includes(value) && "+-*/".includes(lastChar)) {
        display.value = currentValue.slice(0, -1) + value;
        return;
    }
    
    // Prevent multiple decimal points in the same number
    if (value === '.') {
        const parts = currentValue.split(/[\+\-\*\/]/);
        const lastPart = parts[parts.length - 1];
        if (lastPart.includes('.')) {
            return;
        }
    }
    
    // Prevent starting with operators (except minus for negative numbers)
    if ("+*/".includes(value) && currentValue === '') {
        return;
    }
    
    // Prevent multiple zeros at the beginning of a number
    if (value === '0' || value === '00') {
        const parts = currentValue.split(/[\+\-\*\/]/);
        const lastPart = parts[parts.length - 1];
        if (lastPart === '0') {
            return;
        }
    }
    
    display.value += value;
}

function clearDisplay() {
    display.value = '';
}

function deleteLast() {
    display.value = display.value.toString().slice(0, -1);
}

function calculate() {
    try {
        // Don't calculate if display is empty
        if (!display.value.trim()) {
            return;
        }
        
        // Validate expression for safety
        const expression = display.value;
        const validChars = /^[0-9+\-*/.() ]+$/;
        
        if (!validChars.test(expression)) {
            throw new Error('Invalid characters in expression');
        }
        
        // Use a safe calculation method instead of eval
        const result = safeEval(expression);
        
        // Check if result is valid
        if (typeof result !== 'number' || !isFinite(result)) {
            throw new Error('Invalid calculation result');
        }
        
        // Format the result to avoid long decimal numbers
        display.value = formatResult(result);
    } catch (error) {
        display.value = 'Error';
        setTimeout(() => clearDisplay(), 1500);
    }
}

// Safe calculation function without using eval
function safeEval(expression) {
    // Remove any whitespace
    expression = expression.replace(/\s+/g, '');
    
    // Handle negative numbers at the beginning
    if (expression.startsWith('-')) {
        expression = '0' + expression;
    }
    
    // Use a recursive descent parser for basic arithmetic
    let index = 0;
    
    function parseExpression() {
        let left = parseTerm();
        
        while (index < expression.length) {
            const operator = expression[index];
            if (operator === '+' || operator === '-') {
                index++;
                const right = parseTerm();
                left = operator === '+' ? left + right : left - right;
            } else {
                break;
            }
        }
        
        return left;
    }
    
    function parseTerm() {
        let left = parseFactor();
        
        while (index < expression.length) {
            const operator = expression[index];
            if (operator === '*' || operator === '/') {
                index++;
                const right = parseFactor();
                if (operator === '*') {
                    left = left * right;
                } else {
                    if (right === 0) {
                        throw new Error('Division by zero');
                    }
                    left = left / right;
                }
            } else {
                break;
            }
        }
        
        return left;
    }
    
    function parseFactor() {
        if (expression[index] === '(') {
            index++;
            const result = parseExpression();
            if (expression[index] !== ')') {
                throw new Error('Missing closing parenthesis');
            }
            index++;
            return result;
        }
        
        let start = index;
        
        // Handle negative numbers
        if (expression[index] === '-') {
            index++;
        }
        
        // Parse the number
        while (index < expression.length && 
               (expression[index] === '.' || 
                (expression[index] >= '0' && expression[index] <= '9'))) {
            index++;
        }
        
        const numberStr = expression.substring(start, index);
        const number = parseFloat(numberStr);
        
        if (isNaN(number)) {
            throw new Error('Invalid number: ' + numberStr);
        }
        
        return number;
    }
    
    const result = parseExpression();
    
    // Check if we parsed the entire expression
    if (index !== expression.length) {
        throw new Error('Invalid expression');
    }
    
    return result;
}

// Format the result to avoid long decimal numbers
function formatResult(result) {
    // If it's an integer, return as is
    if (Number.isInteger(result)) {
        return result.toString();
    }
    
    // Otherwise, round to 10 decimal places to avoid floating point precision issues
    return parseFloat(result.toFixed(10)).toString();
}

// Keyboard support
document.addEventListener('keydown', function(event) {
    const key = event.key;
    
    if ('0123456789/*-+.'.includes(key)) {
        appendToDisplay(key);
    } else if (key === 'Enter') {
        calculate();
    } else if (key === 'Escape') {
        clearDisplay();
    } else if (key === 'Backspace') {
        deleteLast();
    }
});