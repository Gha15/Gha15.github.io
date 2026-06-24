// Mock database configuration for math questions mapped by date
const dailyChallenges = {
    "2026-06-24": { question: "5 × 4 + 12 = ?", answer: 32 },
    "2026-06-25": { question: "(48 ÷ 6) × 3 = ?", answer: 24 },
    "2026-06-26": { question: "15% of 200 = ?", answer: 30 }
};

// State Elements
let streak = parseInt(localStorage.getItem('math_streak')) || 0;
let lastCompletedDate = localStorage.getItem('math_last_completed');

// DOM Elements
const problemDisplay = document.getElementById('problem-display');
const streakCount = document.getElementById('streak-count');
const countdownEl = document.getElementById('countdown');
const userAnswerInput = document.getElementById('user-answer');
const submitBtn = document.getElementById('submit-btn');
const feedbackMsg = document.getElementById('feedback-msg');

// Get current date string formatted as YYYY-MM-DD
function getTodayString() {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
}

const todayStr = getTodayString();
const currentChallenge = dailyChallenges[todayStr] || { question: "10 + 10 = ?", answer: 20 };

// Initialize interface text displays
function initChallenge() {
    problemDisplay.textContent = currentChallenge.question;
    streakCount.textContent = streak;

    // Check completion status instantly
    if (lastCompletedDate === todayStr) {
        lockChallenge("Completed! Come back tomorrow. ✨", "success");
    }
}

// Logic validation rules
submitBtn.addEventListener('click', () => {
    const userAns = parseInt(userAnswerInput.value);
    
    if (isNaN(userAns)) {
        showFeedback("Please enter a valid number.", "error");
        return;
    }

    if (userAns === currentChallenge.answer) {
        handleCorrectAnswer();
    } else {
        showFeedback("Incorrect. Try again! ❌", "error");
    }
});

function handleCorrectAnswer() {
    if (lastCompletedDate !== todayStr) {
        streak++;
        localStorage.setItem('math_streak', streak);
        localStorage.setItem('math_last_completed', todayStr);
        streakCount.textContent = streak;
    }
    lockChallenge("Correct! Streak updated. 🎉", "success");
}

function lockChallenge(msg, type) {
    showFeedback(msg, type);
    userAnswerInput.disabled = true;
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
}

function showFeedback(text, type) {
    feedbackMsg.textContent = text;
    feedbackMsg.className = `feedback ${type}`;
}

// Global dynamic midnight clock counter
function updateCountdown() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    const diff = midnight - now;

    const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
    const minutes = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
    const seconds = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');

    countdownEl.textContent = `${hours}:${minutes}:${seconds}`;
}

// Run tasks
initChallenge();
setInterval(updateCountdown, 1000);
updateCountdown();


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
