function checkanswer(message) {
    //checks if the answer is correct and displays a message
    const input = document.querySelector('input');
    const answer = input.value;
    const problemText = document.getElementById('problem').innerText;
    let correctAnswer;
    switch (problemText) {
        case "What is the value of x in the equation 2x + 3 = 7?":
            correctAnswer = "2";
            break;
        case "If f(x) = 2x^2 + 3x - 5, what is f(2)?":
            correctAnswer = "9";
            break;
        case "Solve for y: 3y - 4 = 11":
            correctAnswer = "5";
            break;
        case "What is the derivative of f(x) = x^3 + 2x^2 - x + 1?":
            correctAnswer = "3x^2 + 4x - 1";
            break;
        case "If a triangle has sides of length 3, 4, and 5, what is its area?":
            correctAnswer = "6";
            break;
        default:
            correctAnswer = "";
    }
    if (answer === correctAnswer) {
        alert("Correct!" + "secret: i have a crush on the person who i told to check this and hint for the person: batata meshwiyye(i am not jad btw) and also the answer u answered is: " + correctAnswer);
    } else {
        alert("Incorrect.! try again.");
    }
}

function generaterandomveryhardproblem() {
    //generates a random very hard problem and displays it on the page
    const problems = [
        "What is the value of x in the equation 2x + 3 = 7?",
        "If f(x) = 2x^2 + 3x - 5, what is f(2)?",
        "Solve for y: 3y - 4 = 11",
        "What is the derivative of f(x) = x^3 + 2x^2 - x + 1?",
        "If a triangle has sides of length 3, 4, and 5, what is its area?"
    ];
    const randomIndex = Math.floor(Math.random() * problems.length);
    const problemText = problems[randomIndex];
    document.getElementById('problem').innerText = problemText;
    showwindowforquestion();
}

function checkifinputisnotpasted() {
    //checks if the user pasted the answer into the input box, if so, it will alert the user and clear the input box
    const input = document.querySelector('input');
    input.addEventListener('paste', (event) => {
        event.preventDefault();
        alert('Pasting is not allowed!');
        input.value = '';
    });
}

function showwindowforquestion() {
    //shows the window for the question and input box
    const problemOutput = document.getElementById('problem-output');
    problemOutput.innerHTML = `
        <p id="problem" class="problem-text"></p>
        <input type="text" placeholder="Enter your answer here">
        <button class="button" onclick="checkanswer()">Submit Answer</button>
    `;
    checkifinputisnotpasted();
}

