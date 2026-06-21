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

const ROOM_ROOT = 'mathfight/rooms';
const PUBLIC_ROOM = 'public-server';
const SPEED    = 3.2;
const WORLD_W  = 2000;
const WORLD_H  = 1200;
const P_RADIUS = 22;
const ANS_TIME = 12000;
const IDLE_RESET_MS = 5 * 60 * 1000; // 5 minutes
const BOOST_MULT = 1.9;
const COLORS   = ['#f87171','#fb923c','#facc15','#4ade80','#38bdf8','#818cf8','#f472b6','#2dd4bf'];

// ── State ──────────────────────────────────────────────────
let me = null, myColor = null;
let myKey = null;
let myX = 300 + Math.random() * 500;
let myY = 200 + Math.random() * 400;
let players = {}, gameState = {}, keys = {};
let joyDx = 0, joyDy = 0, joyActive = false;
let boostHeld = false;
let camX = 0, camY = 0;
let timerInterval = null;
let deviceMode = 'pc';
const stickmanCache = {};
let roomId = '';
let ROOM = '';
let joinMode = ''; // 'join-private' | 'create-private' | 'public'
let activityCheckInterval = null;

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
const boostBtn           = $('boost-btn');
const roomIdInput        = $('room-id');
const randomizeRoomBtn   = $('randomize-room-btn');
const roomLinkEl         = $('room-link');
const joinColorInput     = $('join-color');
const roomConfigPanel    = $('room-config-panel');
const roomConfigTitle    = $('room-config-title');
const maxPlayersSection  = $('max-players-section');
const joinErrorEl        = $('join-error');
let maxPlayers = 20;

setupJoinFlow();

function getPlayerKey() {
    const stored = localStorage.getItem('mathfightPlayerKey');
    if (stored) return stored;
    const fresh = (crypto.randomUUID ? crypto.randomUUID() : `p_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`).replace(/[^a-zA-Z0-9_-]/g, '');
    localStorage.setItem('mathfightPlayerKey', fresh);
    return fresh;
}

function roomRef(path) {
    return db.ref(`${ROOM}/${path}`);
}

function normalizeRoomId(value) {
    return (value || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32) || 'room';
}

function randomRoomId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
}

function roomLinkFor(id) {
    return `${location.origin}/games/mathfight/room?id=${id}`;
}

function updateRoomLink(id) {
    if (!id) {
        roomLinkEl.textContent = '';
        roomLinkEl.removeAttribute('href');
        return;
    }

    roomLinkEl.href = roomLinkFor(id);
    roomLinkEl.textContent = `/games/mathfight/room?id=${id}`;
}

function setupJoinModes() {
    joinPrivateBtn.addEventListener('click', () => {
        joinMode = 'join-private';
        joinPanelTitle.textContent = 'Join Private Room';
        roomPicker.classList.remove('hidden');
        const queryRoom = normalizeRoomId(new URLSearchParams(location.search).get('id'));
        roomIdInput.value = queryRoom || '';
        roomIdInput.required = true;
        updateRoomLink(roomIdInput.value);
        showJoinPanel();
    });

    createPrivateBtn.addEventListener('click', () => {
        joinMode = 'create-private';
        joinPanelTitle.textContent = 'Create Private Room';
        roomPicker.classList.remove('hidden');
        const newId = randomRoomId();
        roomIdInput.value = newId;
        roomIdInput.required = true;
        updateRoomLink(newId);
        showJoinPanel();
    });

    joinPublicBtn.addEventListener('click', () => {
        joinMode = 'public';
        joinPanelTitle.textContent = 'Play on Public Server';
        roomPicker.classList.add('hidden');
        roomIdInput.required = false;
        showJoinPanel();
    });

    backBtn.addEventListener('click', () => {
        hideJoinPanel();
    });

    roomIdInput.addEventListener('input', () => {
        roomIdInput.value = normalizeRoomId(roomIdInput.value);
        updateRoomLink(roomIdInput.value);
    });

    createRoomBtn.addEventListener('click', () => {
        const newId = randomRoomId();
        roomIdInput.value = newId;
        updateRoomLink(newId);
    });
}

function showJoinPanel() {
    document.querySelector('.join-options').classList.add('hidden');
    document.querySelector('.title-panel').classList.add('hidden');
    joinPanel.classList.remove('hidden');
}

function hideJoinPanel() {
    joinPanel.classList.add('hidden');
    document.querySelector('.join-options').classList.remove('hidden');
    document.querySelector('.title-panel').classList.remove('hidden');
}

// ── Join ──────────────────────────────────────────────────
$('join-form').addEventListener('submit', e => {
    e.preventDefault();
    const raw = $('join-name').value.trim();
    if (!raw) return;

    if (joinMode === 'public') {
        roomId = PUBLIC_ROOM;
    } else {
        roomId = normalizeRoomId(roomIdInput.value);
        if (!roomId || roomId === 'room') {
            alert('Please enter a valid room ID.');
            return;
        }
    }

    ROOM = `${ROOM_ROOT}/${roomId}`;

    const roomQuery = joinMode === 'public' ? '' : `?id=${roomId}`;
    if (location.pathname === '/games/mathfight/room' || location.pathname === '/games/mathfight/room/') {
        history.replaceState({}, '', roomQuery || '/games/mathfight/room');
    } else {
        history.replaceState({}, '', joinMode === 'public' ? '/games/mathfight/' : `/games/mathfight/room${roomQuery}`);
    }

    const selectedDevice = document.querySelector('input[name="device"]:checked');
    deviceMode = selectedDevice ? selectedDevice.value : 'pc';
    me = raw;
    myKey = getPlayerKey();
    myColor = joinColorInput.value || COLORS[Math.floor(Math.random() * COLORS.length)];
    startGame();
});

function startGame() {
    joinScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    document.body.classList.add('game-active');

    const myRef = roomRef(`players/${myKey}`);
    myRef.set({ x: Math.round(myX), y: Math.round(myY), lives: 3, alive: true, color: myColor, name: me, lastActivity: Date.now() });
    myRef.onDisconnect().remove();

    roomRef('game').once('value').then(s => {
        if (!s.val()) writeGame({ turn: null, turnPhase: null });
    });

    listenPlayers();
    listenGame();
    listenChat();
    setupKeys();
    setupJoystick(deviceMode);
    setupBoostControls(deviceMode);
    setupChat();
    canvas.addEventListener('click', onCanvasClick);
    requestAnimationFrame(loop);
    setInterval(pushPos, 90);
    startActivityMonitoring();
}

// ── Firebase listeners ────────────────────────────────────
function listenPlayers() {
    roomRef('players').on('value', s => {
        players = s.val() || {};
        renderHud();
        tryStartTurn();
        checkWin();
    });
}

function listenGame() {
    roomRef('game').on('value', s => {
        gameState = s.val() || {};
        handleState();
        renderHud();
    });
}

function listenChat() {
    roomRef('chat').orderByChild('t').limitToLast(80).on('value', s => {
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
    if (myKey) {
        roomRef(`players/${myKey}`).update({ 
            x: Math.round(myX), 
            y: Math.round(myY),
            lastActivity: Date.now()
        });
    }
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
    if (!myKey) return;
    const { turnPhase, turn, challenger, challenged } = gameState;
    const alive = getAlive();

    if (turnPhase === 'picking') {
        challengeOverlay.classList.add('hidden');
        stopTimer();
        if (turn === myKey)    setNotif('🎯 Your turn! Click a player to challenge.', '#818cf8');
        else if (turn)      setNotif(`${playerLabel(turn)}'s turn to pick…`, '#64748b');
    }

    if (turnPhase === 'challenged' && challenged === myKey) {
        setNotif(`${playerLabel(challenger)} is choosing your question!`, '#f59e0b');
        challengeOverlay.classList.add('hidden');
    }

    if (turnPhase === 'answering') {
        if (challenged === myKey) {
            setNotif(`${playerLabel(challenger)} challenges you — answer fast!`, '#fb923c');
            openChallenge();
        } else if (challenger === myKey) {
            setNotif(`Waiting for ${playerLabel(challenged)} to answer…`, '#38bdf8');
            challengeOverlay.classList.add('hidden');
        } else {
            setNotif(`${playerLabel(challenger)} ⚔️ ${playerLabel(challenged)}`, '#64748b');
            challengeOverlay.classList.add('hidden');
        }
    }

    if (turnPhase === 'result') {
        challengeOverlay.classList.add('hidden');
        stopTimer();
        if (gameState.resultMsg) flash(gameState.resultMsg, gameState.lostLife === myKey ? '#ef4444' : '#10b981');
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
    roomRef('game').update(data);
}

// ── Canvas click — pick a target ──────────────────────────
function onCanvasClick(e) {
    if (gameState.turn !== myKey || gameState.turnPhase !== 'picking') return;
    const r = canvas.getBoundingClientRect();
    const cx = e.clientX - r.left, cy = e.clientY - r.top;
    for (const [name, p] of Object.entries(players)) {
        if (name === myKey || !p || !p.alive) continue;
        if (Math.hypot(cx - (p.x - camX), cy - (p.y - camY)) <= P_RADIUS + 10) {
            sendChallenge(name);
            return;
        }
    }
}

function sendChallenge(target) {
    const q = mkQuestion();
    writeGame({ turnPhase: 'challenged', challenger: myKey, challenged: target, question: q.text, correctAnswer: q.answer });
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
    challengeFrom.textContent = `${playerLabel(gameState.challenger)} challenges you!`;
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
    if (gameState.challenged !== myKey) return;
    challengeOverlay.classList.add('hidden');
    const correct = userAns !== null && userAns === parseInt(gameState.correctAnswer);
    const loserKey = correct ? gameState.challenger : myKey;
    const challengerName = playerLabel(gameState.challenger);
    const challengedName = playerLabel(myKey);
    const resultMsg = correct
        ? `✅ ${challengedName} got it right! ${challengerName} loses a life!`
        : userAns === null
        ? `⏰ Time's up! ${challengedName} loses a life!`
        : `❌ Wrong! ${challengedName} loses a life!`;

    const ref = roomRef(`players/${loserKey}`);
    ref.once('value').then(s => {
        const p = s.val() || {};
        const newLives = Math.max(0, (p.lives || 1) - 1);
        ref.update({ lives: newLives, alive: newLives > 0 });
    });

    writeGame({ turnPhase: 'result', resultMsg, lostLife: loserKey });
}

// ── Win check ─────────────────────────────────────────────
function checkWin() {
    const alive = getAlive();
    const total = Object.keys(players).length;
    if (total > 1 && alive.length === 1) flash(`🏆 ${playerLabel(alive[0]).toUpperCase()} WINS!`, '#fcd34d');
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
        nm.textContent = p.name || name;
        const hts = document.createElement('span');
        hts.textContent = hearts;
        div.appendChild(nm);
        div.appendChild(hts);
        playerListEl.appendChild(div);
    });

    // Show revive button if dead
    if (players[myKey] && !players[myKey].alive) {
        showReviveButton();
    } else {
        hideReviveButton();
    }
}

function playerLabel(id) {
    if (!id) return 'Someone';
    const p = players[id];
    return (p && p.name) ? p.name : id;
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
    if (players[myKey] && !players[myKey].alive) return;

    let dx = 0, dy = 0;
    if (keys['a'] || keys['arrowleft'])  dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;
    if (keys['w'] || keys['arrowup'])    dy -= 1;
    if (keys['s'] || keys['arrowdown'])  dy += 1;
    if (joyActive) { dx = joyDx; dy = joyDy; }

    const boost = boostHeld || keys['shift'];
    const speed = SPEED * (boost ? BOOST_MULT : 1);

    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
    myX = Math.max(P_RADIUS, Math.min(WORLD_W - P_RADIUS, myX + dx * speed));
    myY = Math.max(P_RADIUS, Math.min(WORLD_H - P_RADIUS, myY + dy * speed));
}

// ── Joystick ──────────────────────────────────────────────
function setupJoystick(mode) {
    if (mode !== 'mobile') {
        joystickZone.style.display = 'none';
        boostBtn.classList.add('hidden');
        return;
    }

    joystickZone.style.display = 'block';
    boostBtn.classList.remove('hidden');
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

function setupBoostControls(mode) {
    boostHeld = false;
    const release = () => { boostHeld = false; };

    if (mode === 'mobile') {
        boostBtn.classList.remove('hidden');
        boostBtn.addEventListener('pointerdown', e => {
            e.preventDefault();
            boostHeld = true;
        });
        boostBtn.addEventListener('pointerup', release);
        boostBtn.addEventListener('pointercancel', release);
        boostBtn.addEventListener('pointerleave', release);
        return;
    }

    boostBtn.classList.add('hidden');
    addEventListener('pointerdown', e => {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        const tag = e.target && e.target.tagName ? e.target.tagName : '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
        boostHeld = true;
    });
    addEventListener('pointerup', release);
    addEventListener('pointercancel', release);
    addEventListener('blur', release);
}

// ── Activity monitoring & auto-reset ──────────────────────
function startActivityMonitoring() {
    activityCheckInterval = setInterval(checkRoomActivity, 30000); // Check every 30s
}

function checkRoomActivity() {
    roomRef('players').once('value').then(s => {
        const allPlayers = s.val() || {};
        const now = Date.now();
        let hasActivePlayer = false;

        for (const p of Object.values(allPlayers)) {
            if (p && p.lastActivity && (now - p.lastActivity) < IDLE_RESET_MS) {
                hasActivePlayer = true;
                break;
            }
        }

        if (!hasActivePlayer && Object.keys(allPlayers).length > 0) {
            // Reset room
            roomRef('players').remove();
            roomRef('game').remove();
            roomRef('chat').remove();
        }
    });
}

// ── Revive mechanics ──────────────────────────────────────
function revivePlayer() {
    if (!myKey || !players[myKey]) return;
    const myRef = roomRef(`players/${myKey}`);
    myRef.update({ lives: 3, alive: true });
    flash('💫 You revived with 3 lives!', '#10b981');
}

function showReviveButton() {
    if (!players[myKey] || players[myKey].alive) return;
    const btn = document.createElement('button');
    btn.id = 'revive-btn';
    btn.textContent = '💫 Revive';
    btn.className = 'revive-btn';
    btn.addEventListener('click', revivePlayer);
    if (!document.getElementById('revive-btn')) {
        notifEl.parentElement.appendChild(btn);
    }
}

function hideReviveButton() {
    const btn = document.getElementById('revive-btn');
    if (btn) btn.remove();
}

// ── Chat ──────────────────────────────────────────────────
function setupChat() {
    chatToggle.addEventListener('click', () => chatPanel.classList.toggle('hidden'));
    chatForm.addEventListener('submit', e => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text || !myKey) return;
        roomRef('chat').push({ user: me, text, t: Date.now() });
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
    const canPick = gameState.turn === myKey && gameState.turnPhase === 'picking';

    for (const [name, p] of Object.entries(players)) {
        if (!p) continue;
        
        // Skip completely dead players after brief fade
        if (!p.alive && (!p.lastActivity || Date.now() - p.lastActivity > 10000)) continue;

        const sx = (name === myKey ? myX : p.x) - camX;
        const sy = (name === myKey ? myY : p.y) - camY;

        ctx.save();
        if (!p.alive) ctx.globalAlpha = 0.25;

        // Dashed ring on pickable targets
        if (canPick && name !== myKey && p.alive) {
            ctx.beginPath();
            ctx.arc(sx, sy, P_RADIUS + 12, 0, Math.PI * 2);
            ctx.strokeStyle = '#fb923c';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([6, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Player stickman SVG
        const bodyColor = p.color || '#818cf8';
        const stickman = getStickmanImage(bodyColor);

        if (name === myKey) {
            ctx.beginPath();
            ctx.arc(sx, sy, P_RADIUS + 7, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        if (stickman && stickman.complete) {
            const size = 56;
            ctx.drawImage(stickman, sx - size / 2, sy - size / 2, size, size);
        } else {
            // Fallback if image is still loading
            ctx.beginPath();
            ctx.arc(sx, sy, P_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = bodyColor;
            ctx.fill();
        }

        ctx.restore();

        // Hearts above
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'bottom';
        ctx.font         = '11px serif';
        const hearts = p.alive ? '❤️'.repeat(Math.max(0, p.lives || 0)) : '💀';
        ctx.fillText(hearts, sx, sy - P_RADIUS - 20);

        // Name (show display name, not key)
        ctx.fillStyle = '#f8fafc';
        ctx.font      = 'bold 13px "Trebuchet MS", sans-serif';
        ctx.fillText(p.name || name, sx, sy - P_RADIUS - 6);
    }
    ctx.textBaseline = 'alphabetic';
}

// ── Helpers ───────────────────────────────────────────────
function getAlive() { return Object.keys(players).filter(p => players[p] && players[p].alive); }
function imFirst(alive) { return alive.slice().sort()[0] === myKey; }

function getStickmanImage(color) {
        if (stickmanCache[color]) return stickmanCache[color];

        const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <g stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <circle cx="32" cy="13" r="7" fill="${color}" />
        <line x1="32" y1="20" x2="32" y2="38" />
        <line x1="20" y1="28" x2="44" y2="28" />
        <line x1="32" y1="38" x2="22" y2="54" />
        <line x1="32" y1="38" x2="42" y2="54" />
    </g>
</svg>`;

        const img = new Image();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.trim());
        stickmanCache[color] = img;
        return img;
}
