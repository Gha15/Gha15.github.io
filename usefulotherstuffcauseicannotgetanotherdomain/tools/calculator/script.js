let textcontent = ""; 
let thedigitsthatfittothescreen = 30; // Adjust this value based on the actual character limit of the display
let clearOnNextInput = false; 
let isErrorState = false; // Tracks if the 30-digit hard limit was hit

// Locks the screen immediately without flashes or delays
function triggerStaticError() {
    let display = document.getElementById("result");
    display.textContent = "Error: Too many numbers";
    display.style.color = "red"; 
    isErrorState = true;
}

// Resets static errors, generic errors, or previous calculation states
function checkAndResetState() {
    let displayElement = document.getElementById("result");
    
    if (isErrorState) {
        displayElement.style.color = "";
        displayElement.textContent = "0";
        isErrorState = false;
    }

    if ( displayElement.textContent === "Error") {
        displayElement.textContent = "0";
        clearOnNextInput = false;
    }
}

// Appends numbers 0-9 to the interface screen
function appendNumber(num) {
    checkAndResetState();

    let displayElement = document.getElementById("result");
    let currentDisplay = displayElement.textContent;

    if (currentDisplay === "0") {
        currentDisplay = "";
    }

    if (currentDisplay.length >= thedigitsthatfittothescreen) {
        triggerStaticError();
        return; 
    }

    displayElement.textContent = currentDisplay + num;
}

// Appends a decimal point safely
function appendDecimal() {
    checkAndResetState();

    let displayElement = document.getElementById("result");
    let currentDisplay = displayElement.textContent;

    if (currentDisplay.length >= thedigitsthatfittothescreen) {
        triggerStaticError();
        return;
    }

    let parts = currentDisplay.split(/[\s+\-*/()√³^]/);
    let activeSegment = parts[parts.length - 1];

    if (activeSegment.includes(".")) {
        return;
    }

    if (currentDisplay === "" || currentDisplay.endsWith(" ") || currentDisplay.endsWith("(")) {
        displayElement.textContent = currentDisplay + "0.";
    } else {
        displayElement.textContent = currentDisplay + ".";
    }
}

// REAL BASIC CALCULATOR PERCENTAGE ENGINE
// Acts as an immediate calculation trigger based on standard hardware logic
function appendPercentage() {
    checkAndResetState();

    let displayElement = document.getElementById("result");
    let currentDisplay = displayElement.textContent;

    // Reject if empty or reset state
    if (currentDisplay === "0" || currentDisplay === "") {
        return;
    }

    try {
        // Pattern matches: [Number 1] [Operator] [Number 2] (e.g., "100 + 10" or "50 * 5")
        // Accommodates spaces around operators based on setOperator format
        let pattern = /^([\d.]+)\s*([\+\-\*\/])\s*([\d.]+)$/;
        let match = currentDisplay.match(pattern);

        let finalResult;

        if (match) {
            let num1 = parseFloat(match[1]);
            let operator = match[2];
            let num2 = parseFloat(match[3]);

            // Real calculator logic depends heavily on the operator type:
            if (operator === "+" || operator === "-") {
                // Add/Subtract percentage: 100 + 10% becomes 100 + (100 * 0.10)
                let percentAmount = num1 * (num2 / 100);
                finalResult = operator === "+" ? num1 + percentAmount : num1 - percentAmount;
            } else if (operator === "*") {
                // Multiply percentage: 50 * 10% becomes 50 * 0.10
                finalResult = num1 * (num2 / 100);
            } else if (operator === "/") {
                // Divide percentage: 50 / 10% becomes 50 / 0.10
                if (num2 === 0) throw new Error("Divide by zero");
                finalResult = num1 / (num2 / 100);
            }
        } else {
            // Standalone percentage logic: "45" becomes "0.45"
            // Ensure the string is purely a single valid float/int before splitting
            if (!isNaN(currentDisplay)) {
                finalResult = parseFloat(currentDisplay) / 100;
            } else {
                return; // Ignore if expression is complex/unsupported
            }
        }

        // Output calculation immediately and flag state to overwrite on next input
        updateDisplay(finalResult);
        textcontent = displayElement.textContent;
        clearOnNextInput = true;

    } catch (e) {
        displayElement.textContent = "Error";
        clearOnNextInput = true;
    }
}

// Handles setup for standard calculations (+, -, *, /)
function setOperator(op) {
    checkAndResetState();
    
    let displayElement = document.getElementById("result");
    let currentDisplay = displayElement.textContent;
    
    if (currentDisplay.length >= thedigitsthatfittothescreen) {
        triggerStaticError();
        return;
    }

    if (currentDisplay.endsWith(" ")) {
        displayElement.textContent = currentDisplay.slice(0, -3) + " " + op + " ";
    } else {
        displayElement.textContent = currentDisplay + " " + op + " ";
    }
}

// Appends the visible '^' operator symbol to the layout view
function findresultwithpowerof() {
    checkAndResetState();
    
    let displayElement = document.getElementById("result");
    let currentDisplay = displayElement.textContent;
    
    if (currentDisplay.length >= thedigitsthatfittothescreen) {
        triggerStaticError();
        return;
    }

    if (currentDisplay.endsWith(" ")) {
        displayElement.textContent = currentDisplay.slice(0, -3) + " ^ ";
    } else {
        displayElement.textContent = currentDisplay + " ^ ";
    }
}

// Opens a standard mathematical parenthesis group
function openParenthesis() {
    checkAndResetState();
    let displayElement = document.getElementById("result");
    let currentDisplay = displayElement.textContent;
    
    if (currentDisplay.length >= thedigitsthatfittothescreen) {
        triggerStaticError();
        return;
    }

    if (currentDisplay === "0") {
        displayElement.textContent = "(";
    } else {
        displayElement.textContent = currentDisplay + "(";
    }
}
function closeParenthesis() {
    checkAndResetState();
    let displayElement = document.getElementById("result");

    let currentDisplay = displayElement.textContent;
    
    if (currentDisplay.length >= thedigitsthatfittothescreen) {
        triggerStaticError();
        return;
    }

    if (currentDisplay === "0") {
        displayElement.textContent = ")";
    } else {
        displayElement.textContent = currentDisplay + ")";
    }
}

// Activates cube root processing with brackets
function startCubeRoot() {
    checkAndResetState();
    let displayElement = document.getElementById("result");
    let currentDisplay = displayElement.textContent;
    
    if (currentDisplay.length >= thedigitsthatfittothescreen) {
        triggerStaticError();
        return;
    }

    if (currentDisplay === "0") {
        displayElement.textContent = "³√(";
    } else {
        displayElement.textContent = currentDisplay + "³√(";
    }
}
// Activates cube root processing with brackets
function startSquareRoot() {
    checkAndResetState();
    let displayElement = document.getElementById("result");
    let currentDisplay = displayElement.textContent;
    
    if (currentDisplay.length >= thedigitsthatfittothescreen) {
        triggerStaticError();
        return;
    }

    if (currentDisplay === "0") {
        displayElement.textContent = "√(";
    } else {
        displayElement.textContent = currentDisplay + "√(";
    }
}
function startSquared() {
    
    checkAndResetState();
    let displayElement = document.getElementById("result");
    let currentDisplay = displayElement.textContent;
    
    if (currentDisplay.length >= thedigitsthatfittothescreen) {
        triggerStaticError();
        return;
    }
    displayElement.textContent = currentDisplay + "²";
}

// Complete system reset button
function clearScreen() {
    document.getElementById("result").style.color = "";
    textcontent = "";
    clearOnNextInput = false;
    isErrorState = false;
    document.getElementById("result").textContent = "0";
}

// Backspace function
function removelastdigit() {
    if (isErrorState || document.getElementById("result").textContent === "Error") {
        clearScreen();
        return;
    }
    
    let displayElement = document.getElementById("result");
    let currentDisplay = displayElement.textContent;
    
    if (currentDisplay.length > 1) {
        if (currentDisplay.endsWith(" ")) {
            displayElement.textContent = currentDisplay.slice(0, -3);
        } else {
            displayElement.textContent = currentDisplay.slice(0, -1);
        }
    } else {
        displayElement.textContent = "0";
    }
}

// Primary mathematical evaluation router
function calculate() {
    if (isErrorState) return;
    let displayElement = document.getElementById("result");
    let currentDisplay = displayElement.textContent;

    try {
        let jsExpression = currentDisplay;

        let openBrackets = (jsExpression.match(/\(/g) || []).length;
        let closeBrackets = (jsExpression.match(/\)/g) || []).length;
        while (openBrackets > closeBrackets) {
            jsExpression += ")";
            closeBrackets++;
        }
        // 1. Replace the cube root first
        jsExpression = jsExpression.replace(/³√\(/g, "Math.cbrt(");

        // 2. Then replace the square root
        jsExpression = jsExpression.replace(/√\(/g, "Math.sqrt(");

        // 3. Replace exponents
        jsExpression = jsExpression.replace(/\^/g, "**");

        jsExpression = jsExpression.replace(/\²/g, "**2");


  

        let result = new Function(`return ${jsExpression}`)();
        
        if (isNaN(result) || result === Infinity || result === -Infinity) {
            throw new Error("Invalid Math");
        }

        updateDisplay(result);
        textcontent = displayElement.textContent;
        clearOnNextInput = true; 
    } catch (e) {
        displayElement.textContent = "Error";
        clearOnNextInput = true;
    }
}

// Outputs result strings to layout view
function updateDisplay(val) {
    let output = val.toString();
    if (output.length > thedigitsthatfittothescreen) {
        output = val.toPrecision(thedigitsthatfittothescreen - 4); 
    }
    document.getElementById("result").textContent = output;
}
