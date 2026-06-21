// Global Variable Controllers
let currentCorrectAnswer = 0;
let score = 0;
let highScore = 0;
let combo = 0;
let timeLeft = 30;
let timerInterval = null;
let particleCtx = null;
let particlesArray = [];
let animationFrameId = null;

function startGame(level) {
    console.log(`Starting The Math Plane Game at level ${level}`);
    start(level);
}

function start(mode) {
    // 1. Wipe old frame and stop existing loops
    document.body.innerHTML = '';
    if (timerInterval) clearInterval(timerInterval);
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    particlesArray = [];

    // Inject Modern Dark Synthwave/Cyberpunk global styling
    const globalStyles = document.createElement('style');
    globalStyles.textContent = `
        body {
            margin: 0; padding: 0; background: #0f0c1b;
            font-family: 'Segoe UI', system-ui, sans-serif;
            display: flex; justify-content: center; align-items: center;
            min-height: 100vh; overflow: hidden; perspective: 1000px;
        }
        #game-arena {
            position: relative; width: 550px; background: rgba(23, 19, 44, 0.85);
            padding: 30px; border-radius: 24px;
            border: 2px solid #3f3377; box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(111, 66, 251, 0.2);
            backdrop-filter: blur(10px); display: flex; flex-direction: column; align-items: center;
            transition: transform 0.1s ease;
        }
        .dash {
            display: flex; justify-content: space-between; width: 100%;
            font-weight: 800; font-size: 18px; color: #a5b4fc; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;
        }
        #combo-badge {
            font-size: 24px; color: #ff007f; text-shadow: 0 0 10px #ff007f; font-weight: 900;
            opacity: 0; transform: scale(0.5); transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        #timer-container { width: 100%; height: 8px; background: #221a36; border-radius: 10px; margin-bottom: 25px; overflow: hidden; }
        #timer-bar { width: 100%; height: 100%; background: #00f2fe; box-shadow: 0 0 12px #00f2fe; transition: width 0.1s linear, background-color 0.4s; }
        #visual-stage {
            position: relative; width: 100%; height: 140px; margin-bottom: 20px;
            background: #15102a; border-radius: 16px; border: 1px solid #2d2452; overflow: hidden;
        }
        .airplane {
            position: absolute; top: 45px; left: -60px; width: 45px; height: 30px;
            background: linear-gradient(135deg, #00f2fe, #4facfe);
            clip-path: polygon(0 0, 100% 40%, 0 100%, 30% 50%);
            filter: drop-shadow(0 0 12px #00f2fe);
            transform: rotate(5deg);
            animation: introPlane 1.2s cubic-bezier(0.19, 1, 0.22, 1) forwards, floatPlane 3s ease-in-out infinite 1.2s;
        }
        @keyframes introPlane { to { left: 60px; } }
        @keyframes floatPlane {
            0%, 100% { transform: translateY(0) rotate(5deg); }
            50% { transform: translateY(-10px) rotate(2deg); }
        }
        .you { position: absolute; bottom: 20px; right: 70px; width: 40px; height: 80px; transition: transform 0.2s; }
        .head { width: 18px; height: 18px; border: 3px solid #ff007f; border-radius: 50%; position: absolute; left: 8px; box-shadow: 0 0 8px #ff007f; }
        .body-line { width: 3px; height: 28px; background: #ff007f; position: absolute; left: 19px; top: 21px; box-shadow: 0 0 8px #ff007f; }
        .arm-l { width: 18px; height: 3px; background: #ff007f; position: absolute; left: 3px; top: 27px; transform: rotate(-25deg); transform-origin: right; }
        .arm-r { width: 18px; height: 3px; background: #ff007f; position: absolute; left: 19px; top: 27px; transform: rotate(25deg); transform-origin: left; }
        .leg-l { width: 3px; height: 24px; background: #ff007f; position: absolute; left: 14px; top: 48px; transform: rotate(15deg); }
        .leg-r { width: 3px; height: 24px; background: #ff007f; position: absolute; left: 24px; top: 48px; transform: rotate(-15deg); }
        #question-box { font-size: 36px; font-weight: 900; color: #fff; margin-bottom: 15px; text-shadow: 0 0 15px rgba(255,255,255,0.3); letter-spacing: 1px; }
        #answer-input {
            width: 85%; background: #130f24; border: 2px solid #ff007f; border-radius: 14px;
            font-size: 32px; font-weight: 800; color: #ff007f; text-align: center; padding: 12px;
            margin-bottom: 25px; box-shadow: inset 0 0 15px rgba(255, 0, 127, 0.15), 0 0 15px rgba(255, 0, 127, 0.1);
            letter-spacing: 2px; height: 38px; display: flex; align-items: center; justify-content: center;
        }
        #custom-keyboard { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; width: 100%; }
        .btn {
            background: #1c1735; border: 1px solid #332a59; padding: 18px; font-size: 22px; font-weight: 700;
            color: #e2e8f0; border-radius: 14px; cursor: pointer; user-select: none; transition: all 0.1s ease;
        }
        .btn:hover { background: #251f47; border-color: #4c3f85; }
        .btn:active { transform: scale(0.95); background: #2e2659; }
        .btn.action-clear { background: rgba(239, 68, 68, 0.15); color: #ef4444; border-color: rgba(239, 68, 68, 0.4); }
        .btn.action-clear:hover { background: rgba(239, 68, 68, 0.25); }
        .btn.action-enter { background: linear-gradient(135deg, #00f2fe, #4facfe); color: #0f0c1b; border: none; font-weight: 800; grid-column: span 2; box-shadow: 0 0 15px rgba(0, 242, 254, 0.4); }
        .btn.action-enter:hover { box-shadow: 0 0 25px rgba(0, 242, 254, 0.6); }
        #particle-canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; border-radius: 24px; z-index: 10; }
    `;
    document.head.appendChild(globalStyles);

    // 2. Build Arena Framework
    const arena = document.createElement('div');
    arena.id = "game-arena";
    document.body.appendChild(arena);

    const canvas = document.createElement('canvas');
    canvas.id = "particle-canvas";
    arena.appendChild(canvas);
    particleCtx = canvas.getContext('2d');
    resizeCanvas(canvas);

    const dash = document.createElement('div');
    dash.className = "dash";
    dash.innerHTML = `
        <div>SCORE: <span id="score-val" style="color: #fff">0</span></div>
        <div id="combo-badge">X0 COMBO</div>
        <div>HIGH: <span id="high-val" style="color: #fff">${highScore}</span></div>
    `;
    arena.appendChild(dash);

    const timerContainer = document.createElement('div');
    timerContainer.id = "timer-container";
    const timerBar = document.createElement('div');
    timerBar.id = "timer-bar";
    timerContainer.appendChild(timerBar);
    arena.appendChild(timerContainer);

    const stage = document.createElement('div');
    stage.id = "visual-stage";
    arena.appendChild(stage);

    const airplane = document.createElement('div');
    airplane.className = "airplane";
    stage.appendChild(airplane);

    const player = document.createElement('div');
    player.className = "you";
    player.innerHTML = `
        <div class="head"></div> <div class="body-line"></div>
        <div class="arm-l"></div> <div class="arm-r"></div>
        <div class="leg-l"></div> <div class="leg-r"></div>
    `;
    stage.appendChild(player);

    const questionBox = document.createElement('div');
    questionBox.id = "question-box";
    arena.appendChild(questionBox);

    const answerInput = document.createElement('div');
    answerInput.id = "answer-input";
    arena.appendChild(answerInput);

    const keyboard = document.createElement('div');
    keyboard.id = "custom-keyboard";
    arena.appendChild(keyboard);

    const keys = ['1', '2', '3', 'Clear', '4', '5', '6', '-', '7', '8', '9', '0', 'Enter'];
    keys.forEach(keyText => {
        const btn = document.createElement('button');
        btn.className = "btn";
        btn.textContent = keyText;
        if (keyText === 'Clear') btn.classList.add('action-clear');
        if (keyText === 'Enter') btn.classList.add('action-enter');
        
        btn.onclick = () => handleInput(keyText, answerInput, questionBox, mode, player, airplane, arena);
        keyboard.appendChild(btn);
    });

    score = 0; combo = 0; timeLeft = 30;
    generateMathQuestion(questionBox, mode);
    runTimer(timerBar, arena);
    setupParticleLoop();

    document.onkeydown = function(event) {
        let pressedKey = event.key;
        if (pressedKey === 'Backspace') pressedKey = 'Clear';
        if (keys.includes(pressedKey)) {
            handleInput(pressedKey, answerInput, questionBox, mode, player, airplane, arena);
        }
    };
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 25; i++) {
        particlesArray.push({
            x: x, y: y,
            radius: Math.random() * 4 + 2,
            speedX: (Math.random() - 0.5) * 8,
            speedY: (Math.random() - 0.5) * 8 - 3,
            alpha: 1,
            color: color
        });
    }
}

function setupParticleLoop() {
    function animate() {
        if (!particleCtx) return;
        particleCtx.clearRect(0, 0, particleCtx.canvas.width, particleCtx.canvas.height);
        
        for (let i = 0; i < particlesArray.length; i++) {
            let p = particlesArray[i];
            p.x += p.speedX;
            p.y += p.speedY;
            p.speedY += 0.1;
            p.alpha -= 0.02;

            particleCtx.save();
            particleCtx.globalAlpha = p.alpha;
            particleCtx.fillStyle = p.color;
            particleCtx.shadowBlur = 10;
            particleCtx.shadowColor = p.color;
            particleCtx.beginPath();
            particleCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            particleCtx.fill();
            particleCtx.restore();
        }
        particlesArray = particlesArray.filter(p => p.alpha > 0);
        animationFrameId = requestAnimationFrame(animate);
    }
    animationFrameId = requestAnimationFrame(animate);
}

function resizeCanvas(c) {
    const rect = c.getBoundingClientRect();
    c.width = rect.width || 550;
    c.height = rect.height || 500;
}

function juiceArenaShake(arenaEl, power = 10) {
    let count = 0;
    const interval = setInterval(() => {
        let dx = (Math.random() - 0.5) * power;
        let dy = (Math.random() - 0.5) * power;
        arenaEl.style.transform = `translate(${dx}px, ${dy}px)`;
        count++;
        if (count > 6) {
            clearInterval(interval);
            arenaEl.style.transform = 'none';
        }
    }, 25);
}

function runTimer(barElement, arenaEl) {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft -= 0.1;
        let pct = (timeLeft / 30) * 100;
        barElement.style.width = Math.max(pct, 0) + "%";
        if (pct > 50) barElement.style.background = "#00f2fe";
        else if (pct > 25) barElement.style.background = "#f1c40f";
        else barElement.style.background = "#ff007f";

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            juiceArenaShake(arenaEl, 30);
            setTimeout(() => {
                alert(`⚡ SYSTEM CRASH: Game Over. Final Score: ${score} | Max Combo: X${combo}`);
                location.reload();
            }, 300);
        }
    }, 100);
}

function generateMathQuestion(boxElement, mode) {
    let num1, num2;
    if (mode === 'easy') {
        num1 = Math.floor(Math.random() * 12) + 2;
        num2 = Math.floor(Math.random() * 12) + 2;
        currentCorrectAnswer = num1 + num2;
        boxElement.textContent = `${num1} + ${num2}`;
    } else if (mode === 'medium') {
        num1 = Math.floor(Math.random() * 50) + 10;
        num2 = Math.floor(Math.random() * 50) + 10;
        if (Math.random() > 0.4) {
            currentCorrectAnswer = num1 + num2;
            boxElement.textContent = `${num1} + ${num2}`;
        } else {
            const big = Math.max(num1, num2);
            const small = Math.min(num1, num2);
            currentCorrectAnswer = big - small;
            boxElement.textContent = `${big} - ${small}`;
        }
    } else if (mode === 'hard') {
        num1 = Math.floor(Math.random() * 12) + 2;
        num2 = Math.floor(Math.random() * 12) + 2;
        currentCorrectAnswer = num1 * num2;
        boxElement.textContent = `${num1} × ${num2}`;
    }
}

function handleInput(value, inputDisplay, questionDisplay, mode, playerEl, planeEl, arenaEl) {
    if (value === 'Clear') {
        inputDisplay.textContent = '';
    } else if (value === 'Enter') {
        if (inputDisplay.textContent === '') return;
        const playerAnswer = parseInt(inputDisplay.textContent);
        if (playerAnswer === currentCorrectAnswer) {
            combo++;
            let pointsGained = 1 * combo;
            score += pointsGained;
            document.getElementById('score-val').textContent = score;
            if (score > highScore) {
                highScore = score;
                document.getElementById('high-val').textContent = highScore;
            }
            const badge = document.getElementById('combo-badge');
            if (combo > 1) {
                badge.textContent = `X${combo} COMBO`;
                badge.style.opacity = '1';
                badge.style.transform = 'scale(1.2) rotate(-5deg)';
                setTimeout(() => badge.style.transform = 'scale(1) rotate(0deg)', 150);
            }
            timeLeft = Math.min(timeLeft + 5, 30);
            createExplosion(275, 200, combo > 3 ? '#ff007f' : '#00f2fe');
            juiceArenaShake(arenaEl, 5 + combo);
            playerEl.style.transform = 'translateY(-45px) scaleX(1.3) rotate(-15deg)';
            planeEl.style.transform = 'translate(60px, -25px) scale(1.2) rotate(-20deg)';
            inputDisplay.style.borderColor = '#00f2fe';
            setTimeout(() => {
                playerEl.style.transform = 'none';
                planeEl.style.transform = 'none';
                inputDisplay.style.borderColor = '#ff007f';
            }, 250);
        } else {
            combo = 0;
            const badge = document.getElementById('combo-badge');
            badge.style.opacity = '0';
            badge.style.transform = 'scale(0.5)';
            timeLeft = Math.max(timeLeft - 5, 0);
            juiceArenaShake(arenaEl, 22);
            inputDisplay.style.borderColor = '#ef4444';
            inputDisplay.style.color = '#ef4444';
            createExplosion(275, 260, '#ef4444');
            setTimeout(() => {
                inputDisplay.style.borderColor = '#ff007f';
                inputDisplay.style.color = '#ff007f';
            }, 400);
        }
        inputDisplay.textContent = '';
        generateMathQuestion(questionDisplay, mode);
    } else {
        if (value === '-' && inputDisplay.textContent !== '') return;
        if (inputDisplay.textContent.length > 5) return;
        inputDisplay.textContent += value;
    }
}
