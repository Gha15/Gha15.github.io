let textcontent = "" 
let num1 = 0
let num2 = 0
let operator = ""
let result = 0
let thedigitsthatfittothescreen = 10 
let isOperatorActive = false // Tracks if an operator was just clicked

// Adds clicked numbers to the display screen
function appendNumber(num) {
    let currentDisplay = document.getElementById("result").textContent

    // If an operator was just clicked, clear the display text to start the second number
    if (isOperatorActive) {
        currentDisplay = ""
        isOperatorActive = false // Reset flag since user is now typing num2
    }

    if (currentDisplay === "0") {
        currentDisplay = ""
    }

    // Prevent input if it exceeds the maximum digit limit
    if (currentDisplay.length >= thedigitsthatfittothescreen) {
        return 
    }

    document.getElementById("result").textContent = currentDisplay + num
}

// Saves the first number and displays the number + operator on screen
function setOperator(op) {
    let currentDisplay = document.getElementById("result").textContent
    
    // Parse num1 from the current display screen
    num1 = parseFloat(currentDisplay)
    operator = op
    isOperatorActive = true 

    // Show the number and the clicked operator on the screen (e.g., "12 +")
    document.getElementById("result").textContent = num1 + " " + operator
}

// Resets all calculations back to zero
function clearScreen() {
    num1 = 0
    num2 = 0
    operator = ""
    result = 0
    textcontent = ""
    isOperatorActive = false
    document.getElementById("result").textContent = "0"
}

// Function to remove the last digit from the display
function removelastdigit() {
    let currentDisplay = document.getElementById("result").textContent
    
    // If operator is showing, backspace removes the operator and brings back num1
    if (isOperatorActive) {
        isOperatorActive = false
        document.getElementById("result").textContent = num1
        return
    }

    if (currentDisplay.length > 1) {
        document.getElementById("result").textContent = currentDisplay.slice(0, -1)
    } else {
        document.getElementById("result").textContent = "0"
    }
}

// Math logic functions
function additionofthetwonumbers() {
    result = num1 + num2
    updateDisplay(result)
}

function subtractionofthetwonumbers() {
    result = num1 - num2
    updateDisplay(result)
}

function multiplicationofthetwonumbers() {
    result = num1 * num2
    updateDisplay(result)
}

function divisionofthetwonumbers() {
    if (num2 === 0) {
        document.getElementById("result").textContent = "Error"
    } else {
        result = num1 / num2
        updateDisplay(result)
    }
}

function findpercentofthetwonumberstogether() {
    result = (num1 / 100) * num2
    updateDisplay(result)
}

function findsquarerootofanumber() {
    result = Math.sqrt(num1)
    updateDisplay(result)
}

function findcuberoot() {
    result = Math.cbrt(num1)
    updateDisplay(result)
}

// Helper function to handle screen overflow and update display
function updateDisplay(val) {
    let output = val.toString()
    if (output.length > thedigitsthatfittothescreen) {
        output = val.toPrecision(thedigitsthatfittothescreen - 4) 
    }
    document.getElementById("result").textContent = output
}

// Main execution function
function calculate() {
    // If user presses equals while the operator is still showing, assume num2 is equal to num1
    if (isOperatorActive) {
        num2 = num1
        isOperatorActive = false
    } else {
        num2 = parseFloat(document.getElementById("result").textContent)
    }

    switch (operator) {
        case "+":
            additionofthetwonumbers()
            break
        case "-":
            subtractionofthetwonumbers()
            break
        case "*":
            multiplicationofthetwonumbers()
            break
        case "/":
            divisionofthetwonumbers()
            break
        case "%": 
            findpercentofthetwonumberstogether()
            break
        case "√": 
            findsquarerootofanumber()
            break
        case "³√": 
            findcuberoot()
            break
        default:
            document.getElementById("result").textContent = "Error"
    }

    // Saves the final computed string into your custom tracking variable
    textcontent = document.getElementById("result").textContent
}
