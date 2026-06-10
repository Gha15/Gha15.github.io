 let timeLeft = 0;
let pickedTime = 0;
let isRunning = false;
let timerInterval = null;
const endAudio = new Audio('endtimesound.mp3');

function updateDisplay() {
  if (timeLeft === 0 && isRunning) {
    // Browser autoplay policy requires a prior user interaction (like a click)
    endAudio.loop = true;
    endAudio.play().catch((error) => {
      console.error("Audio playback failed:", error);
    });
  }

  let minutes = Math.floor(timeLeft / 60000);
  let seconds = Math.floor((timeLeft % 60000) / 1000);

  let minStr = String(minutes).padStart(2, '0');
  let secStr = String(seconds).padStart(2, '0');

  let formattedTime = `${minStr}:${secStr}`;
  document.getElementById('display').innerText = formattedTime;

  if (isRunning) {
    document.title = `timer:[${formattedTime}] - matix the math club`;
  } else {
    document.title = "timer - matix the math club";
  }
}

function startTimer() {
  if (!isRunning && timeLeft > 0) {
    isRunning = true;
    timerInterval = setInterval(() => {
      timeLeft -= 10;
      updateDisplay();
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        isRunning = false;
      }
    }, 10);
  }
}

function pauseTimer() {
  if (isRunning) {
    clearInterval(timerInterval);
    isRunning = false;
  }
}

function stopTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  timeLeft = pickedTime;
  updateDisplay();
}

function clearTimer() {
  clearInterval(timerInterval); // Fixed: Changed from 0 to timerInterval
  isRunning = false;
  timeLeft = 0;
  pickedTime = 0;
  updateDisplay();
}

document.getElementById('addMinBtn').addEventListener('click', () => {
  isRunning = false;
  timeLeft += 60000;
  pickedTime = timeLeft;
  updateDisplay();
});

document.getElementById('addSecBtn').addEventListener('click', () => {
  isRunning = false;
  timeLeft += 10000;
  pickedTime = timeLeft;
  updateDisplay();
});

document.getElementById('addOneSecBtn').addEventListener('click', () => {
  isRunning = false;
  timeLeft += 1000;
  pickedTime = timeLeft;
  updateDisplay();
});

document.getElementById('clearBtn').addEventListener('click', clearTimer);
document.getElementById('startBtn').addEventListener('click', startTimer);
document.getElementById('pauseBtn').addEventListener('click', pauseTimer);
document.getElementById('stopBtn').addEventListener('click', stopTimer);

updateDisplay();
