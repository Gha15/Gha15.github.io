console.log("global.js loaded");

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue, serverTimestamp, remove } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAYE_80QqRrHIEFUOvxV2pkPW65pKHeO",
    authDomain: "matix-the-math-club-views.firebaseapp.com",
    databaseURL: "https://matix-the-math-club-views-default-rtdb.firebaseio.com",
    projectId: "matix-the-math-club-views",
    storageBucket: "matix-the-math-club-views.appspot.com",
    messagingSenderId: "392827461909",
    appId: "1:392827461909:web:55ae636927bad79ebb491c",
    measurementId: "G-932V23T6YQ"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

function getActiveProfileUser() {
    const sessionUser = sessionStorage.getItem('mx_user') || sessionStorage.getItem('matix_auth_user');
    if (sessionUser) return sessionUser;
    // Check joined users stored by nav.js (key: mx_joined)
    try {
        const joined = JSON.parse(localStorage.getItem('mx_joined') || '{}');
        const keys = Object.keys(joined);
        if (keys.length) return keys[0]; // return first joined username as fallback
    } catch(e) {}
    return 'guest';
}

// --- Core Actions ---

window.addidea = function(ideaText) {
    const trimmedText = ideaText ? ideaText.trim() : "";
    if (trimmedText === "") return alert("Please enter an idea first!");

    const ideasRef = ref(database, 'ideas');
    const newIdeaRef = push(ideasRef);

    set(newIdeaRef, {
        text: trimmedText,
        createdBy: getActiveProfileUser(),
        timestamp: serverTimestamp()
    }).then(() => {
        const inputBox = document.getElementById('idea-input');
        if (inputBox) inputBox.value = '';
    }).catch(err => console.error(err));
};

window.deleteIdea = function(ideaId) {
    // checks if there is the adminKey in localStorage, if not, it will alert the user that they are not authorized to delete ideas
    if (!localStorage.getItem('adminKey')) {
        alert("You are not authorized to delete ideas!");
        return;
    } else /*deletes the idea from the database*/ {
        const specificIdeaRef = ref(database, `ideas/${ideaId}`);
        remove(specificIdeaRef).catch(err => console.error(err));
    }
};

window.likeIdea = function(ideaId) {
    //checks if not already liked by checking for the tag haslikedidea-ideaId in localStorage
    if (localStorage.getItem(`haslikedidea-${ideaId}`)) {
        alert("You have already liked this idea!");
        return;
    }
    const specificLikeRef = ref(database, `likes/${ideaId}`);
    const newLikeRef = push(specificLikeRef);
    set(newLikeRef, true).then(() => {
        localStorage.setItem(`haslikedidea-${ideaId}`, true);
    }).catch(err => console.error(err));
};

window.addComment = function(ideaId) {
    const inputElement = document.getElementById(`comment-input-${ideaId}`);
    if (!inputElement || inputElement.value.trim() === "") return;

    const specificCommentRef = ref(database, `comments/${ideaId}`);
    const newCommentRef = push(specificCommentRef);
    
    set(newCommentRef, {
        text: inputElement.value.trim(),
        timestamp: serverTimestamp()
    }).then(() => {
        inputElement.value = '';
    }).catch(err => console.error(err));
};

window.toggleComments = function(ideaId) {
    const sec = document.getElementById(`comments-sec-${ideaId}`);
    if (sec) {
        sec.style.display = sec.style.display === 'none' ? 'block' : 'none';
    }
};

// --- Real-time Listeners ---
//stores num of ideas in the database folder called ideacount and updates it in real-time
function updateIdeaCount() {
    const ideasRef = ref(database, 'ideas');
    onValue(ideasRef, (snapshot) => {
        const count = snapshot.size || 0;
        const countRef = ref(database, 'ideacount');
        set(countRef, count).catch(err => console.error(err));
    });
}

function initListeners() {
    // 1. Ideas Listener
    onValue(ref(database, 'ideas'), (snapshot) => {
        const container = document.getElementById('ideas-container');
        if (!container) return;
        container.innerHTML = '';
        
        const ideas = snapshot.val();
        if (!ideas) return;

        Object.keys(ideas).forEach(ideaId => {
            const idea = ideas[ideaId];
            const ideaCard = document.createElement('div');
            ideaCard.className = 'idea';
            const author = idea.createdBy ? `<div class="idea-author">[${idea.createdBy}]</div>` : '';
            ideaCard.innerHTML = `
                ${author}
                <p class="idea-text">${idea.text || ''}</p>
                <div class="idea-actions">
                    <button class="delete-button" onclick="deleteIdea('${ideaId}')">Delete</button>
                    <button class="like-button" onclick="likeIdea('${ideaId}')">Like</button>
                    <span class="like-count" id="likes-${ideaId}">0</span>
                    <button class="comment-button" onclick="toggleComments('${ideaId}')">Comment</button>
                    <div class="comments-section" id="comments-sec-${ideaId}" style="display: none;">
                        <input type="text" id="comment-input-${ideaId}" class="comment-input" placeholder="Add a comment...">
                        <button class="submit-comment" onclick="addComment('${ideaId}')">Submit</button>
                        <div class="comments-list" id="comments-${ideaId}"></div>
                    </div>
                </div>
            `;
            container.appendChild(ideaCard);
        });
    });

    // 2. Likes Listener
    onValue(ref(database, 'likes'), (snapshot) => {
        const allLikes = snapshot.val() || {};
        document.querySelectorAll('.like-count').forEach(span => {
            const id = span.id.replace('likes-', '');
            const count = allLikes[id] ? Object.keys(allLikes[id]).length : 0;
            span.textContent = count;
        });
    });

    // 3. Comments Listener
    onValue(ref(database, 'comments'), (snapshot) => {
        const allComments = snapshot.val() || {};
        Object.keys(allComments).forEach(ideaId => {
            const list = document.getElementById(`comments-${ideaId}`);
            if (list) {
                list.innerHTML = '';
                const ideaComments = allComments[ideaId];
                Object.values(ideaComments).forEach(comment => {
                    const div = document.createElement('div');
                    div.className = 'comment-item';
                    div.textContent = comment.text || comment;
                    list.appendChild(div);
                });
            }
        });
    });
}

initListeners();

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


const qrDisplay = document.getElementById("qr-display");
const qrInput = document.getElementById("qr-input");
const generateBtn = document.getElementById("generate-btn");
const downloadBtn = document.getElementById("download-btn");
const actionContainer = document.getElementById("action-container");

let qrInstance = null;

function buildQRCode() {
    const rawContent = qrInput.value.trim();

    if (!rawContent) {
        alert("Please enter a valid link or text message.");
        return;
    }

    qrDisplay.innerHTML = "";

    // Config options utilizing the upgraded library engine
    const options = {
        text: rawContent,
        width: 240,
        height: 240,
        colorDark: "#0f172a",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H, // Hardcoded high correction to ensure logo spacing scalability
        
        // Brand center overlay injection settings
        logo: "../../../favicon.svg",
        logoWidth: 60,
        logoHeight: 60,
        logoBgColor: '#ffffff',
        logoBackgroundTransparent: false
    };

    // Instantiate and execute canvas compile routine
    qrInstance = new QRCode(qrDisplay, options);
    
    // Reveal download action button once processing finishes
    actionContainer.classList.remove("hidden");
}

function downloadQR() {
    // Locate the underlying graphic component inside our display viewport wrapper
    const canvasElement = qrDisplay.querySelector("canvas");
    const imgElement = qrDisplay.querySelector("img");
    
    let imageSource = "";

    if (canvasElement) {
        imageSource = canvasElement.toDataURL("image/png");
    } else if (imgElement) {
        imageSource = imgElement.src;
    } else {
        alert("Graphic data error. Please regenerate.");
        return;
    }

    // Programmatically trigger sandbox link to bypass local cross-origin security
    const triggerLink = document.createElement("a");
    triggerLink.href = imageSource;
    triggerLink.download = "matix-qr-code.png";
    document.body.appendChild(triggerLink);
    triggerLink.click();
    document.body.removeChild(triggerLink);
}

generateBtn.addEventListener("click", buildQRCode);
downloadBtn.addEventListener("click", downloadQR);

// Build initially on window activation routines
window.addEventListener("DOMContentLoaded", buildQRCode);

console.log("the idea count is being updated in real-time");
updateIdeaCount(); // Start the real-time idea count listener