let textcontent = "" // Line 0: Initialized your custom variable at the very top
let num1 = 0
let num2 = 0
let operator = ""
let result = 0

// Adds clicked numbers to the display screen
function appendNumber(num) {
    let currentDisplay = document.getElementById("result").textContent
    if (currentDisplay === "0") {
        document.getElementById("result").textContent = num
    } else {
        document.getElementById("result").textContent = currentDisplay + num
    }
}

// Saves the first number and sets up the operation
function setOperator(op) {
    num1 = parseFloat(document.getElementById("result").textContent)
    operator = op
    document.getElementById("result").textContent = "0"
}

// Resets all calculations back to zero
function clearScreen() {
    num1 = 0
    num2 = 0
    operator = ""
    result = 0
    textcontent = ""
    document.getElementById("result").textContent = "0"
}

// Math logic functions
function additionofthetwonumbers() {
    result = num1 + num2
    document.getElementById("result").textContent = result
}

function subtractionofthetwonumbers() {
    result = num1 - num2
    document.getElementById("result").textContent = result
}

function multiplicationofthetwonumbers() {
    result = num1 * num2
    document.getElementById("result").textContent = result
}

function divisionofthetwonumbers() {
    if (num2 === 0) {
        document.getElementById("result").textContent = "Error: Division by zero"
    } else {
        result = num1 / num2
        document.getElementById("result").textContent = result
    }
}

// Main execution function
function calculate() {
    num2 = parseFloat(document.getElementById("result").textContent)

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
        default:
            document.getElementById("result").textContent = "Error: Invalid operator"
    }

    // Saves the final computed string into your custom tracking variable
    textcontent = document.getElementById("result").textContent
}
