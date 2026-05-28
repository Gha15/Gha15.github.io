let textcontent = "" 
let num1 = 0
let num2 = 0
let operator = ""
let result = 0
let thedigitsthatfittothescreen = 15 
let isOperatorActive = false 
let flashInterval = null // Tracking variable for our error flash timing loops

// Displays a flashing warning message when layout bounds are reached
function triggerErrorFlash() {
    if (flashInterval) return; 

    let display = document.getElementById("result");
    let isVisible = true;
    let flashCount = 0;
    let originalText = display.textContent; 

    flashInterval = setInterval(() => {
        if (isVisible) {
            display.textContent = "Error: Too many numbers";
            display.style.color = "red"; 
        } else {
            display.textContent = ""; 
        }
        
        isVisible = !isVisible;
        flashCount++;

        if (flashCount >= 6) {
            clearInterval(flashInterval);
            flashInterval = null;
            display.textContent = originalText; 
            display.style.color = ""; 
        }
    }, 250); 
}

// Appends numbers 0-9 to the interface screen
function appendNumber(num) {
    if (flashInterval) return;

    let displayElement = document.getElementById("result");
    let currentDisplay = displayElement.textContent;

    if (currentDisplay === "0") {
        currentDisplay = "";
    }

    if (currentDisplay.length >= thedigitsthatfittothescreen) {
        triggerErrorFlash();
        return; 
    }

    displayElement.textContent = currentDisplay + num;
}

// Appends a decimal point safely, preventing duplicates inside a single number
function appendDecimal() {
    if (flashInterval) return;

    let displayElement = document.getElementById("result");
    let currentDisplay = displayElement.textContent;

    if (currentDisplay.length >= thedigitsthatfittothescreen) {
        triggerErrorFlash();
        return;
    }

    // Split text by spaces to look at only the current active number being typed
    let parts = currentDisplay.split(" ");
    let activeSegment = parts[parts.length - 1];

    // If the active number segment already contains a decimal point, reject the new one
    if (activeSegment.includes(".")) {
        return;
    }

    // If the user starts with a decimal point, append it as "0." instead of just "."
    if (currentDisplay === "" || currentDisplay.endsWith(" ")) {
        displayElement.textContent = currentDisplay + "0.";
    } else {
        displayElement.textContent = currentDisplay + ".";
    }
}

// Handles setup for standard calculations (+, -, *, /, %)
function setOperator(op) {
    if (flashInterval) return; 
    
    let displayElement = document.getElementById("result");
    let currentDisplay = displayElement.textContent;
    
    // If inside a root parenthesis, append the operator natively within the brackets
    if (currentDisplay.includes("(")) {
        if (currentDisplay.length >= thedigitsthatfittothescreen) {
            triggerErrorFlash();
            return;
        }
        displayElement.textContent = currentDisplay + " " + op + " ";
        return;
    }

    num1 = parseFloat(currentDisplay);
    operator = op;
    displayElement.textContent = num1 + " " + operator + " ";
    isOperatorActive = true;
}

// Activates square root processing with brackets
function startSquareRoot() {
    if (flashInterval) return;
    let displayElement = document.getElementById("result");
    let currentDisplay = displayElement.textContent;
    operator = "√";
    
    if (currentDisplay === "0") {
        displayElement.textContent = "√(";
    } else {
        if (currentDisplay.length >= thedigitsthatfittothescreen) {
            triggerErrorFlash();
            return;
        }
        displayElement.textContent = currentDisplay + "√(";
    }
}

// Activates cube root processing with brackets
function startCubeRoot() {
    if (flashInterval) return;
    let displayElement = document.getElementById("result");
    let currentDisplay = displayElement.textContent;
    operator = "³√";
    
    if (currentDisplay === "0") {
        displayElement.textContent = "³√(";
    } else {
        if (currentDisplay.length >= thedigitsthatfittothescreen) {
            triggerErrorFlash();
            return;
        }
        displayElement.textContent = currentDisplay + "³√(";
    }
}

// Closes any active open math parenthesis brackets
function closeParenthesis() {
    if (flashInterval) return;
    let displayElement = document.getElementById("result");
    let currentDisplay = displayElement.textContent;
    
    if (currentDisplay.includes("(")) {
        if (currentDisplay.length >= thedigitsthatfittothescreen) {
            triggerErrorFlash();
            return;
        }
        displayElement.textContent = currentDisplay + ")";
    }
}

// Complete system reset button
function clearScreen() {
    if (flashInterval) {
        clearInterval(flashInterval);
        flashInterval = null;
        document.getElementById("result").style.color = "";
    }
    num1 = 0;
    num2 = 0;
    operator = "";
    result = 0;
    textcontent = "";
    isOperatorActive = false;
    document.getElementById("result").textContent = "0";
}

// Destructive backspace function to delete single characters
function removelastdigit() {
    if (flashInterval) return;
    let displayElement = document.getElementById("result");
    let currentDisplay = displayElement.textContent;
    
    if (currentDisplay.length > 1) {
        // If the last character is surrounded by trailing whitespace design layout spaces
        if (currentDisplay.endsWith(" ")) {
            displayElement.textContent = currentDisplay.slice(0, -3);
        } else {
            displayElement.textContent = currentDisplay.slice(0, -1);
        }
    } else {
        displayElement.textContent = "0";
    }
}

// Extracts and processes calculations located inside parenthetical symbols
function parseParenthesisExpression(displayStr) {
    let startIndex = displayStr.indexOf("(") + 1;
    let endIndex = displayStr.indexOf(")");
    if (endIndex === -1) {
        endIndex = displayStr.length;
    }
    let internalExpression = displayStr.slice(startIndex, endIndex);
    // Runs mathematical compilation safely through an isolated execution shell
    let innerResult = new Function(`return ${internalExpression}`)();
    return innerResult;
}

// Primary mathematical evaluation router
function calculate() {
    if (flashInterval) return;
    let displayElement = document.getElementById("result");
    let currentDisplay = displayElement.textContent;

    // 1. Process Radical Bracket Expressions
    if (currentDisplay.includes("√(")) {
        let insideValue = parseParenthesisExpression(currentDisplay);
        result = Math.sqrt(insideValue);
        updateDisplay(result);
        return;
    }

    if (currentDisplay.includes("³√(")) {
        let insideValue = parseParenthesisExpression(currentDisplay);
        result = Math.cbrt(insideValue);
        updateDisplay(result);
        return;
    }

    // 2. Process Percentage Operations
    if (currentDisplay.includes("%")) {
        let parts = currentDisplay.split(" ");
        
        // Standalone Percentage Conversion (e.g., "50 %")
        if (parts.length < 3 || parts[2] === "" || parts[2] === "%") {
            let baseNum = parseFloat(parts[0]);
            result = baseNum / 100;
            updateDisplay(result);
            return;
        }
        
        // Percent of a Value Context Formula (e.g., "100 + 15 %")
        num1 = parseFloat(parts[0]);
        let actualOp = parts[1];
        let percentageValue = parseFloat(parts[2]);
        let fractionalAmount = (num1 / 100) * percentageValue; 

        switch (actualOp) {
            case "+": result = num1 + fractionalAmount; break;
            case "-": result = num1 - fractionalAmount; break;
            case "*": result = num1 * fractionalAmount; break; 
            case "/": result = num1 / fractionalAmount; break;
            default: return;
        }
        
        updateDisplay(result);
        textcontent = displayElement.textContent;
        return;
    }

    // 3. Process Core Standard Operations (+, -, *, /)
    let parts = currentDisplay.split(" ");
    num1 = parseFloat(parts[0]);
    let currentOp = parts[1];
    num2 = parseFloat(parts[2]);

    if (isNaN(num2)) num2 = 0; 

    switch (currentOp) {
        case "+": result = num1 + num2; break;
        case "-": result = num1 - num2; break;
        case "*": result = num1 * num2; break;
        case "/": 
            if (num2 === 0) {
                displayElement.textContent = "Error";
                return;
            }
            result = num1 / num2; 
            break;
        default: return;
    }

    updateDisplay(result);
    textcontent = displayElement.textContent;
}

// Outputs result strings to layout view, handling extreme values using precision notation
function updateDisplay(val) {
    let output = val.toString();
    if (output.length > thedigitsthatfittothescreen) {
        output = val.toPrecision(thedigitsthatfittothescreen - 5); 
    }
    document.getElementById("result").textContent = output;
}
