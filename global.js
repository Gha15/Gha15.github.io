// gets data from /alldailypuzzles.js and puts them as current daily challenge
const dailyChallenges = puzzles;

function checkifdailyanswerisnotpasted() {
    // checks if the user pasted the answer into the input box, if so, it will alert the user and clear the input box
    const input = document.getElementById('user-answer');
    if (input) {
        input.addEventListener('paste', (event) => {
            event.preventDefault();
            alert('Pasting is not allowed!');
            input.value = '';
        });
    }
}

// State Elements
let streak = parseInt(localStorage.getItem('math_streak')) || 0;
let lastCompletedDate = localStorage.getItem('math_last_completed');

// DOM Elements
const difficultyBox = document.getElementById('difficultyBox');
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
const currentChallenge = dailyChallenges[todayStr] || { question: "-- = ?", answer: "--", difficulty: "--" };

// Initialize interface text displays
function initChallenge() {
    if (difficultyBox) difficultyBox.textContent = currentChallenge.difficulty || "--";
    if (problemDisplay) problemDisplay.textContent = currentChallenge.question;
    if (streakCount) streakCount.textContent = streak;

    // Check completion status instantly
    if (lastCompletedDate === todayStr) {
        lockChallenge("Completed! Come back tomorrow. ✨", "success");
    }
}

// Logic validation rules
if (submitBtn) {
    submitBtn.addEventListener('click', () => {
        const rawValue = userAnswerInput.value.trim();
        
        if (rawValue === "") {
            showFeedback("Please enter an answer.", "error");
            return;
        }

        // Convert to number if the expected answer is a number, otherwise keep as string
        const userAns = typeof currentChallenge.answer === 'number' ? Number(rawValue) : rawValue;

        if (userAns === currentChallenge.answer) {
            handleCorrectAnswer();
        } else {
            showFeedback("Incorrect. Try again! ❌", "error");
        }
    });
}

function handleCorrectAnswer() {
    if (lastCompletedDate !== todayStr) {
        streak++;
        localStorage.setItem('math_streak', streak);
        localStorage.setItem('math_last_completed', todayStr);
        if (streakCount) streakCount.textContent = streak;
    }
    lockChallenge("Correct! Streak updated. 🎉", "success");
}

function lockChallenge(msg, type) {
    showFeedback(msg, type);
    if (userAnswerInput) userAnswerInput.disabled = true;
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
    }
}

function showFeedback(text, type) {
    if (feedbackMsg) {
        feedbackMsg.textContent = text;
        feedbackMsg.className = `feedback ${type}`;
    }
}

// Global dynamic midnight clock counter
function updateCountdown() {
    if (!countdownEl) return;
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
if (countdownEl) {
    setInterval(updateCountdown, 1000);
    updateCountdown();
}
checkifdailyanswerisnotpasted();


/* ==========================================================================
   The parts below are preserved for your other pages as requested,
   but safely wrapped so they don't break the daily challenge page.
   ========================================================================== */

function checkanswer(message) {
    const input = document.querySelector('#problem-output input, input');
    if (!input) return;
    const answer = input.value.trim();
    const problemEl = document.getElementById('problem');
    if (!problemEl) return;
    const problemText = problemEl.innerText;
    
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
        alert("Correct!");
    } else {
        alert("Incorrect.! try again.");
    }
}

function generaterandomveryhardproblem() {
    const problems = [
        "What is the value of x in the equation 2x + 3 = 7?",
        "If f(x) = 2x^2 + 3x - 5, what is f(2)?",
        "Solve for y: 3y - 4 = 11",
        "What is the derivative of f(x) = x^3 + 2x^2 - x + 1?",
        "If a triangle has sides of length 3, 4, and 5, what is its area?"
    ];
    const randomIndex = Math.floor(Math.random() * problems.length);
    const problemText = problems[randomIndex];
    
    showwindowforquestion();
    const problemEl = document.getElementById('problem');
    if (problemEl) problemEl.innerText = problemText;
}

function checkifinputisnotpasted() {
    const input = document.querySelector('#problem-output input');
    if (input) {
        input.addEventListener('paste', (event) => {
            event.preventDefault();
            alert('Pasting is not allowed!');
            input.value = '';
        });
    }
}

function showwindowforquestion() {
    const problemOutput = document.getElementById('problem-output');
    if (!problemOutput) return;
    problemOutput.innerHTML = `
        <p id="problem" class="problem-text"></p>
        <input type="text" placeholder="Enter your answer here">
        <button class="button" onclick="checkanswer()">Submit Answer</button>
    `;
    checkifinputisnotpasted();
}