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

// Appends a decimal point safely
function appendDecimal() {
    if (flashInterval) return;

    let displayElement = document.getElementById("result");
    let currentDisplay = displayElement.textContent;

    if (currentDisplay.length >= thedigitsthatfittothescreen) {
        triggerErrorFlash();
        return;
    }

    let parts = currentDisplay.split(" ");
    let activeSegment = parts[parts.length - 1];

    if (activeSegment.includes(".")) {
        return;
    }

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

// Backspace function
function removelastdigit() {
    if (flashInterval) return;
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
    if (flashInterval) return;
    let displayElement = document.getElementById("result");
    let currentDisplay = displayElement.textContent;

    try {
        // Replace roots with JS functions everywhere
        let jsExpression = currentDisplay
            .replace(/√\(([^()]*)\)/g, "Math.sqrt($1)")
            .replace(/³√\(([^()]*)\)/g, "Math.cbrt($1)");

        // Evaluate full expression
        result = new Function(`return ${jsExpression}`)();
        updateDisplay(result);
        textcontent = displayElement.textContent;
    } catch (e) {
        displayElement.textContent = "Error";
    }
}

// Outputs result strings to layout view
function updateDisplay(val) {
    let output = val.toString();
    if (output.length > thedigitsthatfittothescreen) {
        output = val.toPrecision(thedigitsthatfittothescreen - 5); 
    }
    document.getElementById("result").textContent = output;
}
