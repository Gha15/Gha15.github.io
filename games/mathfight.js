// mathfight.js — MATIX Math Fight

const firebaseConfig = {
    apiKey: "AIzaSyBmJOS_aaOVADbu5cACUoeXHrjfpHTBTdo",
    authDomain: "matix-1d538.firebaseapp.com",
    databaseURL: "https://matix-1d538-default-rtdb.firebaseio.com",
    projectId: "matix-1d538",
    storageBucket: "matix-1d538.firebasestorage.app"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const ROOM     = 'mathfight/room';
const SPEED    = 3.2;
const WORLD_W  = 2000;
const WORLD_H  = 1200;
const P_RADIUS = 22;
const ANS_TIME = 12000;
const COLORS   = ['#f87171','#fb923c','#facc15','#4ade80','#38bdf8','#818cf8','#f472b6','#2dd4bf'];

// ── State ──────────────────────────────────────────────────
let me = null, myColor = null;
let myX = 300 + Math.random() * 500;
let myY = 200 + Math.random() * 400;
let players = {}, gameState = {}, keys = {};
let joyDx = 0, joyDy = 0, joyActive = false;
let camX = 0, camY = 0;
let timerInterval = null;

// ── Canvas ────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
resize();
addEventListener('resize', resize);

// ── DOM refs ──────────────────────────────────────────────
const $ = id => document.getElementById(id);
const joinScreen       = $('join-screen');
const gameScreen       = $('game-screen');
const notifEl          = $('notif');
const playerListEl     = $('player-list');
const challengeOverlay = $('challenge-overlay');
const challengeFrom    = $('challenge-from');
const challengeQ       = $('challenge-q');
const answerForm       = $('answer-form');
const answerInput      = $('answer-input');
const timerFill        = $('timer-fill');
const resultFlash      = $('result-flash');
const chatToggle       = $('chat-toggle');
const chatPanel        = $('chat-panel');
const chatMsgs         = $('chat-msgs');
const chatForm         = $('chat-form');
const chatInput        = $('chat-input');
const joystickZone     = $('joystick-zone');
const joystickBase     = $('joystick-base');
const joystickStick    = $('joystick-stick');

// ── Join ──────────────────────────────────────────────────
$('join-form').addEventListener('submit', e => {
    e.preventDefault();
    const raw = $('join-name').value.trim();
    if (!raw) return;
    me = raw.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 16) || 'player';
    myColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    startGame();
});

function startGame() {
    joinScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    const myRef = db.ref(`${ROOM}/players/${me}`);
    myRef.set({ x: Math.round(myX), y: Math.round(myY), lives: 3, alive: true, color: myColor });
    myRef.onDisconnect().remove();

    db.ref(`${ROOM}/game`).once('value').then(s => {
        if (!s.val()) writeGame({ turn: null, turnPhase: null });
    });

    listenPlayers();
    listenGame();
    listenChat();
    setupKeys();
    setupJoystick();
    setupChat();
    canvas.addEventListener('click', onCanvasClick);
    requestAnimationFrame(loop);
    setInterval(pushPos, 90);
}

// ── Firebase listeners ────────────────────────────────────
function listenPlayers() {
    db.ref(`${ROOM}/players`).on('value', s => {
        players = s.val() || {};
        renderHud();
        tryStartTurn();
        checkWin();
    });
}

function listenGame() {
    db.ref(`${ROOM}/game`).on('value', s => {
        gameState = s.val() || {};
        handleState();
        renderHud();
    });
}

function listenChat() {
    db.ref(`${ROOM}/chat`).orderByChild('t').limitToLast(80).on('value', s => {
        const raw = s.val() || {};
        chatMsgs.innerHTML = '';
        Object.values(raw).sort((a, b) => a.t - b.t).forEach(msg => {
            const d = document.createElement('div');
            d.className = 'chat-msg';
            const u = document.createElement('span');
            u.className = 'chat-user';
            u.textContent = '@' + msg.user + ':';
            d.appendChild(u);
            d.appendChild(document.createTextNode(' ' + msg.text));
            chatMsgs.appendChild(d);
        });
        chatMsgs.scrollTop = chatMsgs.scrollHeight;
    });
}

function pushPos() {
    if (me) db.ref(`${ROOM}/players/${me}`).update({ x: Math.round(myX), y: Math.round(myY) });
}

// ── Game state machine ────────────────────────────────────
function tryStartTurn() {
    const alive = getAlive();
    if (alive.length < 2) return;
    const { turn, turnPhase } = gameState;
    if (turn && alive.includes(turn) && turnPhase) return;
    if (imFirst(alive)) advanceTurn(alive);
}

function handleState() {
    if (!me) return;
    const { turnPhase, turn, challenger, challenged } = gameState;
    const alive = getAlive();

    if (turnPhase === 'picking') {
        challengeOverlay.classList.add('hidden');
        stopTimer();
        if (turn === me)    setNotif('🎯 Your turn! Click a player to challenge.', '#818cf8');
        else if (turn)      setNotif(`${turn.toUpperCase()}'s turn to pick…`, '#64748b');
    }

    if (turnPhase === 'challenged' && challenged === me) {
        setNotif(`${challenger.toUpperCase()} is choosing your question!`, '#f59e0b');
        challengeOverlay.classList.add('hidden');
    }

    if (turnPhase === 'answering') {
        if (challenged === me) {
            setNotif(`${challenger.toUpperCase()} challenges you — answer fast!`, '#fb923c');
            openChallenge();
        } else if (challenger === me) {
            setNotif(`Waiting for ${challenged.toUpperCase()} to answer…`, '#38bdf8');
            challengeOverlay.classList.add('hidden');
        } else {
            setNotif(`${challenger.toUpperCase()} ⚔️ ${challenged.toUpperCase()}`, '#64748b');
            challengeOverlay.classList.add('hidden');
        }
    }

    if (turnPhase === 'result') {
        challengeOverlay.classList.add('hidden');
        stopTimer();
        if (gameState.resultMsg) flash(gameState.resultMsg, gameState.lostLife === me ? '#ef4444' : '#10b981');
        if (imFirst(alive)) setTimeout(() => advanceTurn(alive), 2800);
    }
}

function advanceTurn(alive) {
    const sorted = alive.slice().sort();
    const cur = gameState.turn;
    const next = sorted[(sorted.indexOf(cur) + 1) % sorted.length];
    writeGame({
        turn: next,
        turnPhase: 'picking',
        challenger: null,
        challenged: null,
        question: null,
        correctAnswer: null,
        resultMsg: null,
        lostLife: null
    });
}

function writeGame(data) {
    db.ref(`${ROOM}/game`).update(data);
}

// ── Canvas click — pick a target ──────────────────────────
function onCanvasClick(e) {
    if (gameState.turn !== me || gameState.turnPhase !== 'picking') return;
    const r = canvas.getBoundingClientRect();
    const cx = e.clientX - r.left, cy = e.clientY - r.top;
    for (const [name, p] of Object.entries(players)) {
        if (name === me || !p || !p.alive) continue;
        if (Math.hypot(cx - (p.x - camX), cy - (p.y - camY)) <= P_RADIUS + 10) {
            sendChallenge(name);
            return;
        }
    }
}

function sendChallenge(target) {
    const q = mkQuestion();
    writeGame({ turnPhase: 'challenged', challenger: me, challenged: target, question: q.text, correctAnswer: q.answer });
    setTimeout(() => writeGame({ turnPhase: 'answering' }), 1200);
}

function mkQuestion() {
    const a = 2 + Math.floor(Math.random() * 11);
    const b = 2 + Math.floor(Math.random() * 11);
    return { text: `${a} × ${b} = ?`, answer: a * b };
}

// ── Challenge overlay ─────────────────────────────────────
function openChallenge() {
    if (!challengeOverlay.classList.contains('hidden')) return;
    challengeOverlay.classList.remove('hidden');
    challengeFrom.textContent = `${gameState.challenger.toUpperCase()} challenges you!`;
    challengeQ.textContent = gameState.question;
    answerInput.value = '';
    answerInput.focus();
    startTimer();
}

function startTimer() {
    stopTimer();
    const start = Date.now();
    timerFill.style.width = '100%';
    timerFill.style.background = '#10b981';
    timerInterval = setInterval(() => {
        const pct = Math.max(0, 1 - (Date.now() - start) / ANS_TIME);
        timerFill.style.width = pct * 100 + '%';
        if (pct < 0.25)      timerFill.style.background = '#ef4444';
        else if (pct < 0.55) timerFill.style.background = '#f59e0b';
        if (pct <= 0) { stopTimer(); resolveAnswer(null); }
    }, 80);
}

function stopTimer() { clearInterval(timerInterval); timerInterval = null; }

answerForm.addEventListener('submit', e => {
    e.preventDefault();
    stopTimer();
    resolveAnswer(parseInt(answerInput.value));
});

function resolveAnswer(userAns) {
    if (gameState.challenged !== me) return;
    challengeOverlay.classList.add('hidden');
    const correct = userAns !== null && userAns === parseInt(gameState.correctAnswer);
    const lostLife = correct ? gameState.challenger : me;
    const resultMsg = correct
        ? `✅ ${me.toUpperCase()} got it right! ${gameState.challenger.toUpperCase()} loses a life!`
        : userAns === null
        ? `⏰ Time's up! ${me.toUpperCase()} loses a life!`
        : `❌ Wrong! ${me.toUpperCase()} loses a life!`;

    const ref = db.ref(`${ROOM}/players/${lostLife}`);
    ref.once('value').then(s => {
        const p = s.val() || {};
        const newLives = Math.max(0, (p.lives || 1) - 1);
        ref.update({ lives: newLives, alive: newLives > 0 });
    });

    writeGame({ turnPhase: 'result', resultMsg, lostLife });
}

// ── Win check ─────────────────────────────────────────────
function checkWin() {
    const alive = getAlive();
    const total = Object.keys(players).length;
    if (total > 1 && alive.length === 1) flash(`🏆 ${alive[0].toUpperCase()} WINS!`, '#fcd34d');
}

// ── HUD ───────────────────────────────────────────────────
function renderHud() {
    playerListEl.innerHTML = '';
    Object.entries(players).sort((a, b) => a[0].localeCompare(b[0])).forEach(([name, p]) => {
        if (!p) return;
        const div = document.createElement('div');
        const isTurn = gameState.turn === name;
        div.className = 'player-entry' + (!p.alive ? ' dead' : '') + (isTurn ? ' is-turn' : '');
        const hearts = p.alive
            ? '❤️'.repeat(Math.max(0, p.lives || 0)) + '🖤'.repeat(Math.max(0, 3 - (p.lives || 0)))
            : '💀';
        const nm = document.createElement('span');
        nm.style.color = p.color || '#f8fafc';
        nm.textContent = name;
        const hts = document.createElement('span');
        hts.textContent = hearts;
        div.appendChild(nm);
        div.appendChild(hts);
        playerListEl.appendChild(div);
    });
}

function setNotif(msg, color) {
    notifEl.textContent = msg;
    notifEl.style.borderColor = color || '#818cf8';
}

function flash(msg, color) {
    resultFlash.textContent = msg;
    resultFlash.style.color = color || '#f8fafc';
    resultFlash.classList.remove('hidden');
    clearTimeout(flash._t);
    flash._t = setTimeout(() => resultFlash.classList.add('hidden'), 2800);
}

// ── Keyboard input ────────────────────────────────────────
function setupKeys() {
    addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
    addEventListener('keyup',   e => { keys[e.key.toLowerCase()] = false; });
}

function updateMovement() {
    const tag = document.activeElement ? document.activeElement.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (players[me] && !players[me].alive) return;

    let dx = 0, dy = 0;
    if (keys['a'] || keys['arrowleft'])  dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;
    if (keys['w'] || keys['arrowup'])    dy -= 1;
    if (keys['s'] || keys['arrowdown'])  dy += 1;
    if (joyActive) { dx = joyDx; dy = joyDy; }

    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
    myX = Math.max(P_RADIUS, Math.min(WORLD_W - P_RADIUS, myX + dx * SPEED));
    myY = Math.max(P_RADIUS, Math.min(WORLD_H - P_RADIUS, myY + dy * SPEED));
}

// ── Joystick ──────────────────────────────────────────────
function setupJoystick() {
    if (!('ontouchstart' in window)) return;
    joystickZone.style.display = 'block';
    let ox = 0, oy = 0;
    const MAX = 34;
    joystickBase.addEventListener('touchstart', e => {
        e.preventDefault();
        joyActive = true;
        const r = joystickBase.getBoundingClientRect();
        ox = r.left + r.width / 2; oy = r.top + r.height / 2;
    }, { passive: false });
    joystickBase.addEventListener('touchmove', e => {
        e.preventDefault();
        const t = e.touches[0];
        const dx = t.clientX - ox, dy = t.clientY - oy;
        const len = Math.min(Math.sqrt(dx * dx + dy * dy), MAX);
        const ang = Math.atan2(dy, dx);
        const nx = Math.cos(ang) * len, ny = Math.sin(ang) * len;
        joystickStick.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
        joyDx = nx / MAX; joyDy = ny / MAX;
    }, { passive: false });
    const end = () => {
        joyActive = false; joyDx = 0; joyDy = 0;
        joystickStick.style.transform = 'translate(-50%,-50%)';
    };
    joystickBase.addEventListener('touchend', end);
    joystickBase.addEventListener('touchcancel', end);
}

// ── Chat ──────────────────────────────────────────────────
function setupChat() {
    chatToggle.addEventListener('click', () => chatPanel.classList.toggle('hidden'));
    chatForm.addEventListener('submit', e => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text || !me) return;
        db.ref(`${ROOM}/chat`).push({ user: me, text, t: Date.now() });
        chatInput.value = '';
    });
}

// ── Render loop ───────────────────────────────────────────
function loop() {
    updateMovement();
    camX = myX - canvas.width / 2;
    camY = myY - canvas.height / 2;
    drawBg();
    drawPlayers();
    requestAnimationFrame(loop);
}

function drawBg() {
    ctx.fillStyle = '#040d1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    const gs = 64;
    for (let x = (((-camX) % gs) + gs) % gs; x < canvas.width; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = (((-camY) % gs) + gs) % gs; y < canvas.height; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // World boundary
    ctx.strokeStyle = 'rgba(129,140,248,0.28)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2 - camX, 2 - camY, WORLD_W - 4, WORLD_H - 4);
}

function drawPlayers() {
    const canPick = gameState.turn === me && gameState.turnPhase === 'picking';

    for (const [name, p] of Object.entries(players)) {
        if (!p) continue;
        const sx = (name === me ? myX : p.x) - camX;
        const sy = (name === me ? myY : p.y) - camY;

        ctx.save();
        if (!p.alive) ctx.globalAlpha = 0.25;

        // Dashed ring on pickable targets
        if (canPick && name !== me && p.alive) {
            ctx.beginPath();
            ctx.arc(sx, sy, P_RADIUS + 12, 0, Math.PI * 2);
            ctx.strokeStyle = '#fb923c';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([6, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Player circle
        ctx.beginPath();
        ctx.arc(sx, sy, P_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = p.color || '#818cf8';
        ctx.fill();
        ctx.strokeStyle = name === me ? '#ffffff' : 'rgba(255,255,255,0.38)';
        ctx.lineWidth   = name === me ? 3 : 1.5;
        ctx.stroke();

        ctx.restore();

        // Hearts above
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'bottom';
        ctx.font         = '11px serif';
        const hearts = p.alive ? '❤️'.repeat(Math.max(0, p.lives || 0)) : '💀';
        ctx.fillText(hearts, sx, sy - P_RADIUS - 20);

        // Name
        ctx.fillStyle = '#f8fafc';
        ctx.font      = 'bold 13px "Trebuchet MS", sans-serif';
        ctx.fillText(name, sx, sy - P_RADIUS - 6);
    }
    ctx.textBaseline = 'alphabetic';
}

// ── Helpers ───────────────────────────────────────────────
function getAlive() { return Object.keys(players).filter(p => players[p] && players[p].alive); }
function imFirst(alive) { return alive.slice().sort()[0] === me; }
