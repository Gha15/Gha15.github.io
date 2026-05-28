let textcontent = "" // Line 0: Initialized your custom variable at the very top
let num1 = 0
let num2 = 0
let operator = ""
let result = 0
let thedigitsthatfittothescreen = 22 // Variable to store the maximum digits that fit on the screen

// Adds clicked numbers to the display screen
function appendNumber(num) {
    if (textcontent.length < (thedigitsthatfittothescreen + 1)) { //made a varible to store the max digits that fit on the screen and used it here to prevent the user from inputting more digits than the screen can handle
        textcontent = "too many digits"
    }
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
     //keeps the display the same when you click an operator, instead of clearing it for the second number input, which is more user-friendly and allows for chaining operations
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
//removelastdigit(): Function to remove the last digit from the display
function removelastdigit() {
    let currentDisplay = document.getElementById("result").textContent
    if (currentDisplay.length > 1) {
        document.getElementById("result").textContent = currentDisplay.slice(0, -1)
    } else {
        document.getElementById("result").textContent = "0"
    }
}
// Math logic functions
function additionofthetwonumbers() {
    result = num1 + num2
    document.getElementById("result").textContent = textcontent + result
}

function subtractionofthetwonumbers() {
    result = num1 - num2
    document.getElementById("result").textContent = textcontent + result
}

function multiplicationofthetwonumbers() {
    result = num1 * num2
    document.getElementById("result").textContent = textcontent + result
}

function divisionofthetwonumbers() {
    if (num2 === 0) {
        document.getElementById("result").textContent = "Error: Division by zero"
    } else {
        result = num1 / num2
        document.getElementById("result").textContent = textcontent + result
    }
}
function findpercentofthetwonumberstogether() {
    result = (num1 / 100) * num2
    document.getElementById("result").textContent = textcontent + result
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
        case "%": //percentage calculation
            findpercentofthetwonumberstogether()
            break
        default:
            document.getElementById("result").textContent = "Error: Invalid operator"
    }

    // Saves the final computed string into your custom tracking variable
    textcontent = document.getElementById("result").textContent
}
