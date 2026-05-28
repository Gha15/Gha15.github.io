let textcontent = "" 
let num1 = 0
let num2 = 0
let operator = ""
let result = 0
let thedigitsthatfittothescreen = 15 
let isOperatorActive = false 
let flashInterval = null // Stores the timer for the flashing animation

// Displays a flashing error message on the screen
function triggerErrorFlash() {
    // If it is already flashing, don't start a duplicate timer
    if (flashInterval) return; 

    let display = document.getElementById("result");
    let isVisible = true;
    let flashCount = 0;
    
    // Save what was on the screen before the error occurred
    let originalText = display.textContent; 

    flashInterval = setInterval(() => {
        if (isVisible) {
            display.textContent = "Error: Too many numbers";
            display.style.color = "red"; // Changes text to red for visual impact
        } else {
            display.textContent = ""; // Empties screen to create the blinking effect
        }
        
        isVisible = !isVisible;
        flashCount++;

        // Stop flashing after 6 blinks (about 1.5 seconds)
        if (flashCount >= 6) {
            clearInterval(flashInterval);
            flashInterval = null;
            display.textContent = originalText; // Safely restore their typed numbers
            display.style.color = ""; // Resets text color back to normal
        }
    }, 250); // Blinks every 250 milliseconds
}

// Adds clicked numbers to the display screen
function appendNumber(num) {
    let currentDisplay = document.getElementById("result").textContent

    // Block typing completely if the screen is currently flashing an error
    if (flashInterval) return;

    if (currentDisplay === "0") {
        currentDisplay = ""
    }

    // Trigger flashing error if user goes past the digit threshold
    if (currentDisplay.length >= thedigitsthatfittothescreen) {
        triggerErrorFlash();
        return; 
    }

    document.getElementById("result").textContent = currentDisplay + num
}

// Handles standard operators (+, -, *, /, %)
function setOperator(op) {
    if (flashInterval) return; // Block input if error is flashing
    
    let currentDisplay = document.getElementById("result").textContent
    
    if (currentDisplay.includes("(")) {
        if (currentDisplay.length >= thedigitsthatfittothescreen) {
            triggerErrorFlash();
            return;
        }
        document.getElementById("result").textContent = currentDisplay + " " + op + " "
        return
    }

    num1 = parseFloat(currentDisplay)
    operator = op
    document.getElementById("result").textContent = num1 + " " + operator + " "
    isOperatorActive = true
}

// Special function to start a Square Root with an open parenthesis
function startSquareRoot() {
    if (flashInterval) return;
    let currentDisplay = document.getElementById("result").textContent
    operator = "√"
    
    if (currentDisplay === "0") {
        document.getElementById("result").textContent = "√("
    } else {
        if (currentDisplay.length >= thedigitsthatfittothescreen) {
            triggerErrorFlash();
            return;
        }
        document.getElementById("result").textContent = currentDisplay + "√("
    }
}

// Special function to start a Cube Root with an open parenthesis
function startCubeRoot() {
    if (flashInterval) return;
    let currentDisplay = document.getElementById("result").textContent
    operator = "³√"
    
    if (currentDisplay === "0") {
        document.getElementById("result").textContent = "³√("
    } else {
        if (currentDisplay.length >= thedigitsthatfittothescreen) {
            triggerErrorFlash();
            return;
        }
        document.getElementById("result").textContent = currentDisplay + "³√("
    }
}

// Closes the open parenthesis on the screen
function closeParenthesis() {
    if (flashInterval) return;
    let currentDisplay = document.getElementById("result").textContent
    if (currentDisplay.includes("(")) {
        if (currentDisplay.length >= thedigitsthatfittothescreen) {
            triggerErrorFlash();
            return;
        }
        document.getElementById("result").textContent = currentDisplay + ")"
    }
}

// Resets all calculations back to zero
function clearScreen() {
    // If an error is flashing, forcibly stop it when Clear is hit
    if (flashInterval) {
        clearInterval(flashInterval);
        flashInterval = null;
        document.getElementById("result").style.color = "";
    }
    num1 = 0
    num2 = 0
    operator = ""
    result = 0
    textcontent = ""
    isOperatorActive = false
    document.getElementById("result").textContent = "0"
}

// Function to remove the last character from the display
function removelastdigit() {
    if (flashInterval) return;
    let currentDisplay = document.getElementById("result").textContent
    if (currentDisplay.length > 1) {
        if (currentDisplay.endsWith(" ")) {
            document.getElementById("result").textContent = currentDisplay.slice(0, -3)
        } else {
            document.getElementById("result").textContent = currentDisplay.slice(0, -1)
        }
    } else {
        document.getElementById("result").textContent = "0"
    }
}

// Helper function to safely process the math inside parentheses
function parseParenthesisExpression(displayStr) {
    let startIndex = displayStr.indexOf("(") + 1
    let endIndex = displayStr.indexOf(")")
    if (endIndex === -1) {
        endIndex = displayStr.length
    }
    let internalExpression = displayStr.slice(startIndex, endIndex)
    let innerResult = new Function(`return ${internalExpression}`)()
    return innerResult
}

// Main execution function
function calculate() {
    if (flashInterval) return;
    let currentDisplay = document.getElementById("result").textContent

    if (currentDisplay.includes("√(")) {
        let insideValue = parseParenthesisExpression(currentDisplay)
        result = Math.sqrt(insideValue)
        updateDisplay(result)
        return
    }

    if (currentDisplay.includes("³√(")) {
        let insideValue = parseParenthesisExpression(currentDisplay)
        result = Math.cbrt(insideValue)
        updateDisplay(result)
        return
    }

    let parts = currentDisplay.split(" ")
    num1 = parseFloat(parts[0])
    let currentOp = parts[1]
    num2 = parseFloat(parts[2])

    if (isNaN(num2)) num2 = 0 

    switch (currentOp) {
        case "+": result = num1 + num2; break;
        case "-": result = num1 - num2; break;
        case "*": result = num1 * num2; break;
        case "/": 
            if (num2 === 0) {
                document.getElementById("result").textContent = "Error";
                return;
            }
            result = num1 / num2; 
            break;
        case "%": result = (num1 / 100) * num2; break;
        default: return;
    }

    updateDisplay(result)
    textcontent = document.getElementById("result").textContent
}

// Helper function to handle screen overflow and update display
function updateDisplay(val) {
    let output = val.toString()
    if (output.length > thedigitsthatfittothescreen) {
        output = val.toPrecision(thedigitsthatfittothescreen - 5) 
    }
    document.getElementById("result").textContent = output
}
