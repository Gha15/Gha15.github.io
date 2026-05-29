let textcontent = ""; 
let thedigitsthatfittothescreen = 27;
let clearOnNextInput = false; 
let isErrorState = false; // Tracks if the 27-digit hard limit was hit

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

    if (clearOnNextInput || displayElement.textContent === "Error") {
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

    let parts = currentDisplay.split(/[\s+\-*/()√³]/);
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

// Handles setup for standard calculations (+, -, *, /, %)
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

// Activates square root processing with brackets
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

// Closes any active open math parenthesis brackets
function closeParenthesis() {
    checkAndResetState();
    let displayElement = document.getElementById("result");
    let currentDisplay = displayElement.textContent;
    
    if (currentDisplay.length >= thedigitsthatfittothescreen) {
        triggerStaticError();
        return;
    }
    displayElement.textContent = currentDisplay + ")";
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

        jsExpression = jsExpression.replace(/√\(/g, "Math.sqrt(");
        jsExpression = jsExpression.replace(/³√\(/g, "Math.cbrt(");

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
