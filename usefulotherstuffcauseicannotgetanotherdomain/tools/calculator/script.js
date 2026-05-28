let num1 = 0
let num2 = 0
let operator = ""
let result = 0
let textcontent = ""
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
        document.getElementById("result").textContent = "Error: Division by zero is undefined"
    } else {
        result = num1 / num2
        document.getElementById("result").textContent = result
    }
}
function calculate() {
    textcontent = document.getElementById("result").textContent
    num1 = parseFloat(document.getElementById("num1").value)
    num2 = parseFloat(document.getElementById("num2").value)
    operator = document.getElementById("operator").value

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
}