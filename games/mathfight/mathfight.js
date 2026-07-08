// mathfight.js 

const firebaseConfig = {
  apiKey: "AIzaSyBmJOS_aaOVADbu5cACUoeXHrjfpHTBTdo",
  authDomain: "matix-1d538.firebaseapp.com",
  databaseURL: "https://matix-1d538-default-rtdb.firebaseio.com",
  projectId: "matix-1d538",
  storageBucket: "matix-1d538.firebasestorage.app"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

const ROOM_ROOT = 'mathfight/rooms';
const PUBLIC_ROOM = 'public-server';
const SPEED = 3.2;
const WORLD_W = 2000;
const WORLD_H = 1200;
const P_RADIUS = 22;
const ANS_TIME = 12000;
const IDLE_RESET_MS = 5 * 60 * 1000; // 5 minutes
const BOOST_MULT = 1.9;
const COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#818cf8', '#f472b6', '#2dd4bf'];

// ── State ──────────────────────────────────────────────────
let me = null, myColor = null;
let myKey = null;
let myX = 300 + Math.random() * 500;
let myY = 200 + Math.random() * 400;
let players = {}, gameState = {}, keys = {};
let joyDx = 0, joyDy = 0, joyActive = false;
let joyTouchId = null; 
let boostTouchId = null; 
let boostHeld = false;
let camX = 0, camY = 0;
let timerInterval = null;
let deviceMode = 'pc';
const stickmanCache = {};
let roomId = '';
let ROOM = '';
let joinMode = ''; 
let activityCheckInterval = null;
let posInterval = null;
let canKick = false;
let matixUser = null;
let kicked = false;
let kickUntil = 0;
let prevPlayerAlive = {}; // tracks last-known alive state per player key for death detection
let bans = {}; // room-level ban list. banned keys are filtered out of the local `players` object
let banSweepInterval = null; // periodic .remove() sweep for banned player nodes
// Smooth-movement interpolation state: for each REMOTE player we track a locally
// drawn (x,y) that lerps toward the latest server-reported position every frame,
// so remote players glide instead of teleporting between 40 ms network updates.
let remoteInterp = {};
let lastPushX = null, lastPushY = null, lastPushTime = 0;

// Bot State
let botKey = null;
let botDifficulty = 2;

// Streak & game-over state
let myStreak = 0, bestStreak = 0;
let gameEnded = false;

// ── Sound FX (Web Audio, no assets) ───────────────────────
let audioCtx = null;
let soundOn = true;
function initAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}
function beep(freq, dur, type, vol) {
  if (!soundOn || !audioCtx) return;
  try {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    o.connect(g);
    g.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    g.gain.setValueAtTime(vol || 0.15, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.start(now);
    o.stop(now + dur);
  } catch (e) {}
}
const sfx = {
  challenge: () => { beep(440, 0.12, 'square', 0.12); setTimeout(() => beep(660, 0.15, 'square', 0.12), 120); },
  correct:   () => { beep(660, 0.1, 'sine', 0.16); setTimeout(() => beep(880, 0.18, 'sine', 0.16), 100); },
  wrong:     () => { beep(200, 0.25, 'sawtooth', 0.14); },
  win:       () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.22, 'triangle', 0.16), i * 140)); },
  lose:      () => { [392, 330, 262].forEach((f, i) => setTimeout(() => beep(f, 0.3, 'sawtooth', 0.14), i * 160)); }
};

// ── Canvas ────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener('resize', resize);

// ── DOM refs ──────────────────────────────────────────────
const $ = id => document.getElementById(id);
const joinScreen = $('join-screen');
const gameScreen = $('game-screen');
const notifEl = $('notif');
const playerListEl = $('player-list');
const challengeOverlay = $('challenge-overlay');
const challengeFrom = $('challenge-from');
const challengeQ = $('challenge-q');
const answerForm = $('answer-form');
const answerInput = $('answer-input');
const timerFill = $('timer-fill');
const resultFlash = $('result-flash');
const chatToggle = $('chat-toggle');
const chatPanel = $('chat-panel');
const chatMsgs = $('chat-msgs');
const chatForm = $('chat-form');
const chatInput = $('chat-input');
const joystickZone = $('joystick-zone');
const joystickBase = $('joystick-base');
const joystickStick = $('joystick-stick');
const boostBtn = $('boost-btn');
const roomIdInput = $('room-id');
const randomizeRoomBtn = $('randomize-room-btn');
const roomLinkEl = $('room-link');
const joinColorInput = $('join-color');
const roomConfigPanel = $('room-config-panel');
const roomConfigTitle = $('room-config-title');
const maxPlayersSection = $('max-players-section');
const joinErrorEl = $('join-error');
let maxPlayers = 20;

setupJoinFlow();

function getPlayerKey() {
  const stored = localStorage.getItem('mathfightPlayerKey');
  if (stored) {
    return stored;
  }
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
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function roomLinkFor(id) {
  return `${location.origin}/games/mathfight/room?id=${id}`;
}

function updateRoomLink(id) {
  const copyBtn = $('copy-link-btn');
  // The room-link element is optional; guard so nothing crashes if it's absent.
  if (!roomLinkEl) {
    if (copyBtn) copyBtn.classList.toggle('hidden', !id);
    return;
  }
  if (!id) {
    roomLinkEl.textContent = '';
    roomLinkEl.removeAttribute('href');
    if (copyBtn) copyBtn.classList.add('hidden');
    return;
  }

  roomLinkEl.href = roomLinkFor(id);
  roomLinkEl.textContent = `/games/mathfight/room?id=${id}`;
  if (copyBtn) copyBtn.classList.remove('hidden');
}

function getSelectedDeviceMode() {
  const checkedRadio = document.querySelector('input[name="device"]:checked');
  if (checkedRadio) return checkedRadio.value;
  return ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? 'mobile' : 'pc';
}

// ── 3-step Join Flow ─────────────────────────────────────
function setupJoinFlow() {
  const detailsPanel = $('details-panel');
  const modeOptionsEl = $('mode-options');
  const roomConfigEl = $('room-config-panel');
  const continueBtn = $('details-continue-btn');
  const joinPrivateBtn = $('join-private-btn');
  const createPrivateBtn = $('create-private-btn');
  const joinPublicBtn = $('join-public-btn');
  const joinVsBotBtn = $('join-vs-bot-btn');
  const backToDetailsBtn = $('back-to-details-btn');
  const backToModesBtn = $('back-to-modes-btn');

  function showStep(step) {
    detailsPanel.classList.add('hidden');
    modeOptionsEl.classList.add('hidden');
    roomConfigEl.classList.add('hidden');
    if (step === 'details') {
      detailsPanel.classList.remove('hidden');
    } else if (step === 'modes') {
      modeOptionsEl.classList.remove('hidden');
    } else if (step === 'config') {
      roomConfigEl.classList.remove('hidden');
    }
  }

  const queryId = normalizeRoomId(new URLSearchParams(location.search).get('id'));
  if (queryId && queryId !== 'room') {
    joinMode = 'join-private';
    roomIdInput.value = queryId;
    $('room-config-title').textContent = 'Join Private Room';
    $('max-players-section').classList.add('hidden');
    updateRoomLink(queryId);
    showStep('config');
  }

  continueBtn.addEventListener('click', () => {
    const name = $('join-name').value.trim();
    if (!name) {
      shake($('join-name'));
      return;
    }
    joinErrorEl.classList.add('hidden');
    showStep('modes');
  });

  backToDetailsBtn.addEventListener('click', () => showStep('details'));

  joinPrivateBtn.addEventListener('click', () => {
    joinMode = 'join-private';
    $('room-config-title').textContent = 'Join Private Room';
    $('max-players-section').classList.add('hidden');
    $('room-id-section').classList.remove('hidden');
    roomIdInput.value = '';
    updateRoomLink('');
    joinErrorEl.classList.add('hidden');
    showStep('config');
  });

  createPrivateBtn.addEventListener('click', () => {
    joinMode = 'create-private';
    $('room-config-title').textContent = 'Create Private Room';
    $('max-players-section').classList.remove('hidden');
    $('room-id-section').classList.remove('hidden');
    const newId = randomRoomId();
    roomIdInput.value = newId;
    updateRoomLink(newId);
    joinErrorEl.classList.add('hidden');
    showStep('config');
  });

  // VS BOT MODE IMPLEMENTATION
  joinVsBotBtn.addEventListener('click', () => {
    const name = $('join-name').value.trim();
    if (!name) {
      showStep('details');
      shake($('join-name'));
      return;
    }

    let diff = prompt("🤖 Select Bot Difficulty:\n1 = Easy (Slower, makes mistakes)\n2 = Medium\n3 = Hard (Fast, rarely misses)", "2");
    if (diff === null) return; 
    botDifficulty = parseInt(diff) || 2;

    joinMode = 'bot';
    roomId = 'bot_room_' + randomRoomId();
    ROOM = `${ROOM_ROOT}/${roomId}`;

    me = name;
    myKey = getPlayerKey();
    myColor = joinColorInput.value || COLORS[Math.floor(Math.random() * COLORS.length)];
    deviceMode = getSelectedDeviceMode();

    db.ref(`${ROOM}/config`).set({ maxPlayers: 2, operation: 'mixed', createdAt: Date.now() }).then(() => {
        startGame();
    });
  });

  joinPublicBtn.addEventListener('click', async () => {
    const name = $('join-name').value.trim();
    if (!name) {
      showStep('details');
      shake($('join-name'));
      return;
    }
    joinMode = 'public';
    roomId = PUBLIC_ROOM;
    ROOM = `${ROOM_ROOT}/${roomId}`;
    // Public server plays with ALL four operations (+ - × ÷). Set/refresh the
    // config before startGame reads it so mkQuestion runs in 'mixed' mode.
    await db.ref(`${ROOM}/config/operation`).set('mixed');
    if (await isNameTaken(name)) {
      showJoinError('That username is already in the public server. Try another!');
      showStep('details');
      shake($('join-name'));
      return;
    }
    me = name;
    myKey = getPlayerKey();

    const kickSnap = await db.ref(`${ROOM}/kicks/${myKey}`).once('value');
    const kk = kickSnap.val();
    if (kk && kk.at && (Date.now() - kk.at) < 3000) {
      const wait = Math.ceil((3000 - (Date.now() - kk.at)) / 1000);
      showJoinError('You were kicked. Please wait ' + wait + 's before rejoining.');
      return;
    }

    myColor = joinColorInput.value || COLORS[Math.floor(Math.random() * COLORS.length)];
    deviceMode = getSelectedDeviceMode();
    history.replaceState({}, '', '/games/mathfight/');
    startGame();
  });

  backToModesBtn.addEventListener('click', () => showStep('modes'));

  roomIdInput.addEventListener('input', () => {
    roomIdInput.value = normalizeRoomId(roomIdInput.value);
    updateRoomLink(roomIdInput.value);
  });

  randomizeRoomBtn.addEventListener('click', () => {
    const newId = randomRoomId();
    roomIdInput.value = newId;
    updateRoomLink(newId);
  });

  const copyLinkBtn = $('copy-link-btn');
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', () => {
      const id = normalizeRoomId(roomIdInput.value);
      const link = roomLinkFor(id);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(() => {
          copyLinkBtn.textContent = '✅ Copied';
          setTimeout(() => { copyLinkBtn.textContent = '📋 Copy'; }, 1600);
        }).catch(() => {});
      }
    });
  }

  $('join-form').addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('join-name').value.trim();
    if (!name) {
      showStep('details');
      shake($('join-name'));
      return;
    }

    roomId = normalizeRoomId(roomIdInput.value);
    if (!roomId || roomId === 'room') {
      showJoinError('Please enter a valid room ID.');
      shake(roomIdInput);
      return;
    }
    ROOM = `${ROOM_ROOT}/${roomId}`;

    if (joinMode === 'join-private') {
      const [playersSnap, cfgSnap] = await Promise.all([
        db.ref(`${ROOM}/players`).once('value'),
        db.ref(`${ROOM}/config`).once('value')
      ]);
      const cfg = cfgSnap.val() || {};
      const count = Object.keys(playersSnap.val() || {}).length;
      // A room only "exists" once it has been created (config written) or has
      // live players in it. Block joining rooms that were never made.
      const roomExists = !!cfgSnap.val() || count > 0;
      if (!roomExists) {
        showJoinError("That room doesn't exist. Ask the host for a valid ID, or create your own room.");
        shake(roomIdInput);
        return;
      }
      if (cfg.maxPlayers && count >= cfg.maxPlayers) {
        showJoinError(`Room is full (${count}/${cfg.maxPlayers}).`);
        return;
      }
    }

    if (await isNameTaken(name)) {
      showJoinError('That username is taken in this room. Try another!');
      showStep('details');
      shake($('join-name'));
      return;
    }

    if (joinMode === 'create-private') {
      const mp = parseInt($('max-players').value) || 8;
      const opSelect = document.getElementById('operation-type');
      const op = opSelect ? opSelect.value : 'multiplication';
      maxPlayers = mp;
      await db.ref(`${ROOM}/config`).set({ maxPlayers: mp, operation: op, createdAt: Date.now() });
    }

    me = name;
    myKey = getPlayerKey();

    const kickSnap = await db.ref(`${ROOM}/kicks/${myKey}`).once('value');
    const kk = kickSnap.val();
    if (kk && kk.at && (Date.now() - kk.at) < 3000) {
      const wait = Math.ceil((3000 - (Date.now() - kk.at)) / 1000);
      showJoinError('You were kicked. Please wait ' + wait + 's before rejoining.');
      return;
    }

    myColor = joinColorInput.value || COLORS[Math.floor(Math.random() * COLORS.length)];
    deviceMode = getSelectedDeviceMode();
    history.replaceState({}, '', `/games/mathfight/room?id=${roomId}`);
    startGame();
  });
}

function showJoinError(msg) {
  joinErrorEl.textContent = msg;
  joinErrorEl.classList.remove('hidden');
  setTimeout(() => joinErrorEl.classList.add('hidden'), 4500);
}

function shake(el) {
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = 'inputShake 0.38s ease';
  el.addEventListener('animationend', () => { el.style.animation = ''; }, { once: true });
}

async function isNameTaken(name) {
  if (!ROOM) {
    return false;
  }
  const snap = await db.ref(`${ROOM}/players`).once('value');
  const all = snap.val() || {};
  return Object.values(all).some(p => p && p.name && p.name.toLowerCase() === name.toLowerCase());
}

function startGame() {
  joinScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  document.body.classList.add('game-active');

  roomRef('config/operation').once('value').then(s => {
    window.currentGameMode = s.val() || 'multiplication';
  });

  const myRef = roomRef(`players/${myKey}`);
  myRef.set({ x: Math.round(myX), y: Math.round(myY), lives: 3, alive: true, color: myColor, name: me, lastActivity: Date.now() });
  myRef.onDisconnect().remove();

  // Inject the Bot if in Bot Mode
  if (joinMode === 'bot') {
      botKey = 'bot_' + Math.random().toString(36).substr(2, 5);
      roomRef(`players/${botKey}`).set({
          x: WORLD_W / 2 + 100, y: WORLD_H / 2,
          lives: 3, alive: true, color: '#94a3b8', name: 'MathBot 🤖', lastActivity: Date.now()
      });
      roomRef(`players/${botKey}`).onDisconnect().remove();
      // Slow tick: bot turn-action logic (challenges, answers). Fine at 1 Hz.
      setInterval(updateBotLoop, 1000);
      // Fast tick: bot MOVEMENT only. Runs at ~20 Hz so combined with the
      // remote-player interpolation the bot glides naturally instead of
      // teleporting once per second.
      setInterval(updateBotMovement, 50);
  }

  roomRef('game').once('value').then(s => {
    if (!s.val()) {
      writeGame({ turn: null, turnPhase: null });
    }
  });

  listenPlayers();
  listenGame();
  listenChat();
  setupKeys();
  setupJoystick(deviceMode);
  setupBoostControls(deviceMode);
  setupChat();
  canvas.addEventListener('click', onCanvasClick);
  setupExtras();
  myStreak = 0;
  updateStreakBadge();
  requestAnimationFrame(loop);
  // Push local position at ~25 Hz (40 ms). Combined with per-frame client-side
  // interpolation on remote players, this produces smooth, delay-free motion
  // for everyone without flooding Firebase.
  posInterval = setInterval(pushPos, 40);
  startActivityMonitoring();
  detectKickPrivileges();
  listenKicks();
  listenBans();
}

// ── Firebase listeners ────────────────────────────────────
function listenPlayers() {
  roomRef('players').on('value', s => {
    // Filter out banned players entirely — handles the case where a stale/old
    // client (or a truly "stuck" ghost entry) keeps re-writing their /players
    // node. Even if the ghost's writes keep landing, every up-to-date client
    // treats the room as if they aren't there.
    const raw = s.val() || {};
    const filtered = {};
    Object.keys(raw).forEach(k => { if (!bans[k]) filtered[k] = raw[k]; });
    players = filtered;
    // If the server has flagged our own node as kicked, self-handle immediately.
    // This fires faster than listenKicks because it uses the same /players listener
    // we already have open, closing the race with pushPos.
    if (!kicked && players[myKey] && players[myKey].kicked) {
      handleBeingKicked({ at: Date.now() });
      return;
    }
    // Detect newly-dead players and notify owner/manager so they can restore.
    if (canKick) {
      Object.entries(players).forEach(([k, p]) => {
        if (!p || k === myKey) return;
        const wasAlive = prevPlayerAlive[k];
        const nowDead  = p.alive === false || p.alive === 'false';
        if (wasAlive && nowDead) {
          showDeathNotif(k, p.name || k);
        }
      });
    }
    // Snapshot current alive states for next comparison.
    Object.entries(players).forEach(([k, p]) => {
      prevPlayerAlive[k] = p ? (p.alive !== false && p.alive !== 'false') : false;
    });
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
  if (kicked) return;
  // Secondary guard: catches the window between the server writing kicked:true
  // and handleBeingKicked being called via listenPlayers.
  if (players[myKey] && players[myKey].kicked) {
    handleBeingKicked({ at: Date.now() });
    return;
  }
  if (!myKey) return;
  const now = Date.now();
  const rx = Math.round(myX), ry = Math.round(myY);
  // Skip the network write when we haven't actually moved, so the 40 ms tick
  // rate doesn't burn Firebase quota while standing still. Send a heartbeat
  // every 500 ms to keep lastActivity fresh for the idle-kick watcher.
  const moved = (rx !== lastPushX) || (ry !== lastPushY);
  if (!moved && (now - lastPushTime) < 500) return;
  lastPushX = rx; lastPushY = ry; lastPushTime = now;
  roomRef(`players/${myKey}`).update({
    x: rx,
    y: ry,
    lastActivity: now
  });
}

// ── Game state machine ────────────────────────────────────
function tryStartTurn() {
  const alive = getAlive();
  if (alive.length < 2) {
    return;
  }
  const { turn, turnPhase } = gameState;
  if (turn && alive.includes(turn) && turnPhase) {
    return;
  }
  if (iAmAuthority(alive)) {
    advanceTurn(alive);
  }
}

function handleState() {
  if (!myKey) {
    return;
  }
  const { turnPhase, turn, challenger, challenged } = gameState;
  const alive = getAlive();

  if (turnPhase === 'picking') {
    challengeOverlay.classList.add('hidden');
    stopTimer();
    if (turn === myKey) {
      setNotif('🎯 Your turn! Click a player to challenge.', '#818cf8');
    } else if (turn) {
      setNotif(`${playerLabel(turn)}'s turn to pick…`, '#64748b');
    }
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
    if (gameState.resultMsg) {
      flash(gameState.resultMsg, gameState.lostLife === myKey ? '#ef4444' : '#10b981');
    }
    if (iAmAuthority(alive)) {
      setTimeout(() => advanceTurn(alive), 2800);
    }
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
  if (gameState.turn !== myKey || gameState.turnPhase !== 'picking') {
    return;
  }
  const r = canvas.getBoundingClientRect();
  const cx = e.clientX - r.left;
  const cy = e.clientY - r.top;
  for (const [name, p] of Object.entries(players)) {
    if (name === myKey || !p || !p.alive) {
      continue;
    }
    if (Math.hypot(cx - (p.x - camX), cy - (p.y - camY)) <= P_RADIUS + 10) {
      sendChallenge(name);
      return;
    }
  }
}

function sendChallenge(target) {
  const q = mkQuestion();
  writeGame({
    turnPhase: 'challenged',
    challenger: myKey,
    challenged: target,
    question: q.text,
    correctAnswer: q.answer
  });
  setTimeout(() => writeGame({ turnPhase: 'answering' }), 1200);
}

function mkQuestion() {
  const mode = window.currentGameMode || 'multiplication';
  const ops = ['addition', 'subtraction', 'multiplication', 'division'];
  const type = mode === 'mixed' ? ops[Math.floor(Math.random() * ops.length)] : mode;

  const a = 2 + Math.floor(Math.random() * 11);
  const b = 2 + Math.floor(Math.random() * 11);

  switch(type) {
    case 'addition': return { text: `${a} + ${b} = ?`, answer: a + b };
    case 'subtraction': return { text: `${a + b} - ${a} = ?`, answer: b };
    case 'multiplication': return { text: `${a} × ${b} = ?`, answer: a * b };
    case 'division': return { text: `${a * b} ÷ ${a} = ?`, answer: b };
    default: return { text: `${a} × ${b} = ?`, answer: a * b };
  }
}

// ── Challenge overlay ─────────────────────────────────────
function openChallenge() {
  if (!challengeOverlay.classList.contains('hidden')) {
    return;
  }
  challengeOverlay.classList.remove('hidden');
  challengeFrom.textContent = `${playerLabel(gameState.challenger)} challenges you!`;
  challengeQ.textContent = gameState.question;
  answerInput.value = '';
  answerInput.focus();
  sfx.challenge();
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
    if (pct < 0.25) {
      timerFill.style.background = '#ef4444';
    } else if (pct < 0.55) {
      timerFill.style.background = '#f59e0b';
    }
    if (pct <= 0) {
      stopTimer();
      resolveAnswer(null);
    }
  }, 80);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

answerForm.addEventListener('submit', e => {
  e.preventDefault();
  stopTimer();
  resolveAnswer(parseInt(answerInput.value));
});

function resolveAnswer(userAns) {
  if (gameState.challenged !== myKey) {
    return;
  }
  challengeOverlay.classList.add('hidden');
  const correct = userAns !== null && userAns === parseInt(gameState.correctAnswer);
  if (correct) {
    sfx.correct();
    myStreak++;
    if (myStreak > bestStreak) bestStreak = myStreak;
  } else {
    sfx.wrong();
    myStreak = 0;
  }
  updateStreakBadge();
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

// ── Bot Logic Engine ──────────────────────────────────────
// Bot wander target — the bot walks toward this point in small steps and picks
// a new one whenever it gets close or after a random idle interval. Produces
// natural-looking motion instead of the old 1-Hz teleport.
let botTargetX = null, botTargetY = null, botNextRetarget = 0;
let botLocalX = null, botLocalY = null; // authoritative local copy
const BOT_SPEED = 3.6; // px per 50 ms tick → ~72 px/s, similar to a real player

function updateBotMovement() {
  if (joinMode !== 'bot' || !botKey || !players[botKey] || !players[botKey].alive) return;
  if (botLocalX === null) botLocalX = players[botKey].x || WORLD_W / 2;
  if (botLocalY === null) botLocalY = players[botKey].y || WORLD_H / 2;
  const now = Date.now();
  const needsNewTarget = botTargetX === null || botTargetY === null || now >= botNextRetarget
    || (Math.hypot(botTargetX - botLocalX, botTargetY - botLocalY) < 20);
  if (needsNewTarget) {
    botTargetX = P_RADIUS + Math.random() * (WORLD_W - 2 * P_RADIUS);
    botTargetY = P_RADIUS + Math.random() * (WORLD_H - 2 * P_RADIUS);
    botNextRetarget = now + 1200 + Math.random() * 2000;
  }
  const dx = botTargetX - botLocalX;
  const dy = botTargetY - botLocalY;
  const dist = Math.hypot(dx, dy) || 1;
  const step = Math.min(BOT_SPEED, dist);
  botLocalX += (dx / dist) * step;
  botLocalY += (dy / dist) * step;
  botLocalX = Math.max(P_RADIUS, Math.min(WORLD_W - P_RADIUS, botLocalX));
  botLocalY = Math.max(P_RADIUS, Math.min(WORLD_H - P_RADIUS, botLocalY));
  roomRef(`players/${botKey}`).update({
    x: Math.round(botLocalX),
    y: Math.round(botLocalY),
    lastActivity: now,
  });
}

function updateBotLoop() {
  if (joinMode !== 'bot' || !botKey || !players[botKey] || !players[botKey].alive) return;

  // Bot Turn Actions
  const { turn, turnPhase, challenged, correctAnswer } = gameState;

  // Bot Initiates a Challenge
  if (turn === botKey && turnPhase === 'picking') {
       if (players[myKey] && players[myKey].alive && !window.botIsActing) {
           window.botIsActing = true;
           setTimeout(() => {
               const q = mkQuestion();
               writeGame({
                   turnPhase: 'challenged',
                   challenger: botKey,
                   challenged: myKey,
                   question: q.text,
                   correctAnswer: q.answer
               });
               setTimeout(() => writeGame({ turnPhase: 'answering' }), 1200);
               window.botIsActing = false;
           }, 1500);
       }
  }

  // Bot Answers a Challenge
  if (turnPhase === 'answering' && challenged === botKey && !window.botIsAnswering) {
       window.botIsAnswering = true;
       
       let delay = 6000; let acc = 0.6; // Easy
       if (botDifficulty === 2) { delay = 4000; acc = 0.8; } // Medium
       if (botDifficulty === 3) { delay = 2000; acc = 0.95; } // Hard
       delay += (Math.random() - 0.5) * 2000;

       setTimeout(() => {
           if (gameState.turnPhase !== 'answering') { window.botIsAnswering = false; return; } 
           const isCorrect = Math.random() < acc;
           const botAns = isCorrect ? parseInt(correctAnswer) : parseInt(correctAnswer) + 1;
           resolveBotAnswer(botAns);
           window.botIsAnswering = false;
       }, delay);
  }
}

function resolveBotAnswer(botAns) {
  const correct = botAns === parseInt(gameState.correctAnswer);
  const loserKey = correct ? gameState.challenger : botKey;
  const challengerName = playerLabel(gameState.challenger);
  const challengedName = playerLabel(botKey);
  const resultMsg = correct
    ? `✅ ${challengedName} got it right! ${challengerName} loses a life!`
    : `❌ Wrong! ${challengedName} loses a life!`;

  const ref = roomRef(`players/${loserKey}`);
  ref.once('value').then(s => {
    const p = s.val() || {};
    const newLives = Math.max(0, (p.lives || 1) - 1);
    ref.update({ lives: newLives, alive: newLives > 0 });
  });

  writeGame({ turnPhase: 'result', resultMsg, lostLife: loserKey });
}

// ── Win check ──────────��─────���────────────────────────────
function checkWin() {
  const alive = getAlive();
  // Ignore players currently being kicked — they must not count towards the
  // total, otherwise kicking the second-to-last player would spuriously
  // trigger a game-over during the 600 ms cleanup window.
  const total = Object.keys(players).filter(k => players[k] && !players[k].kicked).length;
  if (total > 1 && alive.length === 1) {
    if (!gameEnded) {
      gameEnded = true;
      showGameOver(alive[0]);
    }
  } else if (alive.length > 1) {
    gameEnded = false;
    hideGameOver();
  }
}

function showGameOver(winnerKey) {
  const won = winnerKey === myKey;
  if (won) sfx.win(); else sfx.lose();
  const ov = $('gameover-overlay');
  if (!ov) {
    flash(`🏆 ${playerLabel(winnerKey).toUpperCase()} WINS!`, '#fcd34d');
    return;
  }
  const titleEl = $('gameover-title');
  const subEl = $('gameover-sub');
  if (titleEl) titleEl.textContent = won ? '🏆 VICTORY!' : '💀 GAME OVER';
  if (subEl) {
    subEl.textContent = won
      ? `You're the last one standing!${bestStreak > 1 ? '  Best streak: ' + bestStreak + ' 🔥' : ''}`
      : `${playerLabel(winnerKey)} wins the match!`;
  }
  ov.classList.remove('hidden');
  // Game is now over — refresh HUD so any dead player's waiting box
  // switches to the active Revive button.
  renderHud();
}

function hideGameOver() {
  const ov = $('gameover-overlay');
  if (ov) ov.classList.add('hidden');
}

// Reset everyone to 3 lives for an instant rematch in the same room.
function rematch() {
  roomRef('players').once('value').then(s => {
    const all = s.val() || {};
    const updates = {};
    Object.keys(all).forEach(k => { updates[`${k}/lives`] = 3; updates[`${k}/alive`] = true; });
    roomRef('players').update(updates).then(() => {
      myStreak = 0;
      updateStreakBadge();
      writeGame({ turn: null, turnPhase: null, challenger: null, challenged: null, question: null, correctAnswer: null, resultMsg: null, lostLife: null });
    });
  });
}

function updateStreakBadge() {
  const el = $('streak-badge');
  if (!el) return;
  if (myStreak >= 2) {
    el.textContent = `🔥 ${myStreak} streak`;
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

// Wire up sound toggle + game-over buttons once the game screen is live.
function setupExtras() {
  initAudio();
  const st = $('sound-toggle');
  if (st && !st.dataset.wired) {
    st.dataset.wired = '1';
    st.addEventListener('click', () => {
      soundOn = !soundOn;
      st.textContent = soundOn ? '🔊' : '🔇';
      st.classList.toggle('off', !soundOn);
      if (soundOn) { initAudio(); beep(660, 0.1, 'sine', 0.14); }
    });
  }
  const again = $('gameover-again');
  if (again && !again.dataset.wired) {
    again.dataset.wired = '1';
    again.addEventListener('click', () => { hideGameOver(); gameEnded = false; rematch(); });
  }
  const menu = $('gameover-menu');
  if (menu && !menu.dataset.wired) {
    menu.dataset.wired = '1';
    menu.addEventListener('click', () => { location.href = '/games/mathfight/'; });
  }
}

// ── HUD ───────────────────────────────────────────────────
function renderHud() {
  playerListEl.innerHTML = '';
  Object.entries(players).sort((a, b) => a[0].localeCompare(b[0])).forEach(([name, p]) => {
    if (!p || p.kicked) {
      return; // hide players mid-kick so they vanish from everyone's list immediately
    }
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
    if (canKick && name !== myKey && !String(name).startsWith('bot_')) {
      const kb = document.createElement('button');
      kb.className = 'kick-btn';
      kb.title = 'Kick from room';
      kb.textContent = '🚫';
      kb.addEventListener('click', ev => { ev.stopPropagation(); kickPlayer(name); });
      div.appendChild(kb);
      const dl = document.createElement('button');
      dl.className = 'kill-btn';
      dl.title = 'Kill (eliminate this round)';
      dl.textContent = '💀';
      dl.addEventListener('click', ev => { ev.stopPropagation(); killPlayer(name); });
      div.appendChild(dl);
    }
    playerListEl.appendChild(div);
  });

  if (players[myKey] && !players[myKey].alive) {
    showReviveButton();
  } else {
    hideReviveButton();
  }
}

function playerLabel(id) {
  if (!id) {
    return 'Someone';
  }
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
  addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
}

function updateMovement() {
  const tag = document.activeElement ? document.activeElement.tagName : '';
  if (tag === 'INPUT' || tag === 'TEXTAREA') {
    return;
  }
  if (players[myKey] && !players[myKey].alive) {
    return;
  }

  let dx = 0, dy = 0;
  if (keys['a'] || keys['arrowleft']) {
    dx -= 1;
  }
  if (keys['d'] || keys['arrowright']) {
    dx += 1;
  }
  if (keys['w'] || keys['arrowup']) {
    dy -= 1;
  }
  if (keys['s'] || keys['arrowdown']) {
    dy += 1;
  }
  if (joyActive) {
    dx = joyDx;
    dy = joyDy;
  }

  const boost = boostHeld || keys['shift'];
  const speed = SPEED * (boost ? BOOST_MULT : 1);

  if (dx !== 0 && dy !== 0) {
    dx *= 0.707;
    dy *= 0.707;
  }
  myX = Math.max(P_RADIUS, Math.min(WORLD_W - P_RADIUS, myX + dx * speed));
  myY = Math.max(P_RADIUS, Math.min(WORLD_H - P_RADIUS, myY + dy * speed));
}

// ── Joystick (Multi-touch Optimized Global Listeners) ──────
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
    const r = joystickBase.getBoundingClientRect();
    ox = r.left + r.width / 2;
    oy = r.top + r.height / 2;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (joyTouchId === null) {
        joyTouchId = touch.identifier;
        joyActive = true;
        updateStickPosition(touch);
      }
    }
  }, { passive: false });

  window.addEventListener('touchmove', e => {
    if (!joyActive) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joyTouchId) {
        updateStickPosition(touch);
      }
    }
  }, { passive: false });

  function updateStickPosition(touch) {
    const dx = touch.clientX - ox;
    const dy = touch.clientY - oy;
    const len = Math.min(Math.sqrt(dx * dx + dy * dy), MAX);
    const ang = Math.atan2(dy, dx);
    const nx = Math.cos(ang) * len;
    const ny = Math.sin(ang) * len;

    joystickStick.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
    joyDx = nx / MAX;
    joyDy = ny / MAX;
  }

  const handleJoystickEnd = (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joyTouchId) {
        joyTouchId = null;
        joyActive = false;
        joyDx = 0;
        joyDy = 0;
        joystickStick.style.transform = 'translate(-50%,-50%)';
      }
    }
  };

  window.addEventListener('touchend', handleJoystickEnd);
  window.addEventListener('touchcancel', handleJoystickEnd);
}

function setupBoostControls(mode) {
  boostHeld = false;

  if (mode === 'mobile') {
    boostBtn.classList.remove('hidden');

    boostBtn.addEventListener('touchstart', e => {
      e.preventDefault();
      e.stopPropagation();
      if (boostTouchId === null && e.changedTouches.length > 0) {
        boostTouchId = e.changedTouches[0].identifier;
        boostHeld = true;
      }
    }, { passive: false });

    const releaseMobileBoost = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === boostTouchId) {
          boostTouchId = null;
          boostHeld = false;
        }
      }
    };

    window.addEventListener('touchend', releaseMobileBoost);
    window.addEventListener('touchcancel', releaseMobileBoost);
    return;
  }

  boostBtn.classList.add('hidden');
  const releasePC = () => { boostHeld = false; };
  addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) {
      return;
    }
    const tag = e.target && e.target.tagName ? e.target.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') {
      return;
    }
    boostHeld = true;
  });
  addEventListener('pointerup', releasePC);
  addEventListener('pointercancel', releasePC);
  addEventListener('blur', releasePC);
}

// ── Activity monitoring & auto-reset ──────────────────────
function startActivityMonitoring() {
  activityCheckInterval = setInterval(checkRoomActivity, 30000);
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
      roomRef('players').remove();
      roomRef('game').remove();
      roomRef('chat').remove();
    }
  });
}

// ── Revive mechanics ──────────────────────────────────────
function revivePlayer() {
  if (!myKey || !players[myKey]) {
    return;
  }
  roomRef(`players/${myKey}`).update({ lives: 3, alive: true });
  flash('💫 You revived with 3 lives!', '#10b981');
  hideReviveButton();
}

function showReviveButton() {
  if (!players[myKey] || players[myKey].alive) {
    return;
  }
  // Remove whatever state was there before so we can re-render correctly.
  hideReviveButton();
  const area = document.createElement('div');
  area.id = 'revive-btn';
  if (gameEnded) {
    // Game is over — show the active revive button.
    area.className = 'revive-btn';
    area.textContent = '\uD83D\uDCAB Revive';
    area.addEventListener('click', revivePlayer);
  } else {
    // Game still going — show the waiting message instead.
    area.className = 'revive-waiting';
    area.textContent = '\u23F3 Waiting till end of round to revive\u2026';
  }
  notifEl.parentElement.appendChild(area);
}

function hideReviveButton() {
  const el = document.getElementById('revive-btn');
  if (el) el.remove();
}

// ── Owner death notification ──────────────────────────────
function showDeathNotif(key, nm) {
  // Remove any existing death notif so we don't stack them.
  const old = document.getElementById('death-notif');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'death-notif';
  overlay.className = 'death-notif-overlay';

  const card = document.createElement('div');
  card.className = 'death-notif-card';

  const title = document.createElement('div');
  title.className = 'death-notif-title';
  title.textContent = '\uD83D\uDC80 ' + nm + ' was eliminated';

  const sub = document.createElement('div');
  sub.className = 'death-notif-sub';
  sub.textContent = 'Do you want to restore them?';

  const btns = document.createElement('div');
  btns.className = 'death-notif-btns';

  const regret = document.createElement('button');
  regret.className = 'death-notif-regret';
  regret.textContent = '\u21A9\uFE0F Regret — Restore';
  regret.addEventListener('click', () => {
    roomRef('players/' + key).update({ alive: true, lives: 3 });
    roomRef('chat').push({ user: 'System', text: '\uD83D\uDC9A ' + nm + ' was restored by a moderator.', t: Date.now() });
    overlay.remove();
  });

  const keep = document.createElement('button');
  keep.className = 'death-notif-keep';
  keep.textContent = 'Keep killed';
  keep.addEventListener('click', () => overlay.remove());

  btns.appendChild(regret);
  btns.appendChild(keep);
  card.appendChild(title);
  card.appendChild(sub);
  card.appendChild(btns);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // Auto-dismiss after 12 s so it doesn't linger forever.
  setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 12000);
}

// ── Moderator kick (owner / manager only) ────────────────
let kickAuthWatchInit = false;
function detectKickPrivileges() {
  if (!kickAuthWatchInit) {
    kickAuthWatchInit = true;
    // Keep the kick button in sync with the real, live Matix sign-in state
    // instead of only checking once when the game starts — signing in or
    // out mid-session (or the account's role changing) now updates it
    // immediately.
    window.addEventListener('mx-auth-changed', () => detectKickPrivileges());
    try {
      if (window.MatixAuth && typeof window.MatixAuth.onChange === 'function') {
        window.MatixAuth.onChange(() => detectKickPrivileges());
      }
    } catch (e) {}
  }
  try {
    matixUser = (window.MatixAuth && window.MatixAuth.getUser && window.MatixAuth.getUser())
      || sessionStorage.getItem('mx_user') || sessionStorage.getItem('matix_auth_user') || null;
  } catch (e) {
    matixUser = null;
  }
  if (!matixUser) {
    canKick = false;
    renderHud();
    return;
  }
  const clean = String(matixUser).toLowerCase().replace(/[^a-z0-9_]/g, '');
  const norm = (clean === 'matix' || clean === 'ghadimatix') ? 'ghadi' : clean;
  if (norm === 'ghadi') {
    canKick = true;
    renderHud();
    return;
  }
  db.ref('roles/' + encodeURIComponent(norm)).once('value').then(s => {
    const role = s.val();
    canKick = (role === 'owner' || role === 'manager');
    renderHud();
  }).catch(() => { canKick = false; renderHud(); });
}

function listenKicks() {
  roomRef('kicks').on('value', s => {
    const all = s.val() || {};
    const mine = all[myKey];
    if (mine && mine.at && (Date.now() - mine.at) < 3000) {
      handleBeingKicked(mine);
    }
  });
}

function listenBans() {
  roomRef('bans').on('value', s => {
    bans = s.val() || {};
    // If we've been banned, self-eject the same way as a kick.
    if (myKey && bans[myKey] && !kicked) {
      kickUntil = Date.now() + 3000;
      handleBeingKicked({ at: Date.now() });
      return;
    }
    // Re-render so any banned player disappears from the HUD immediately, and
    // start a background sweep that repeatedly deletes banned /players entries
    // in case a stale ghost client keeps re-writing them.
    renderHud();
    if (Object.keys(bans).length > 0) {
      if (!banSweepInterval) {
        banSweepInterval = setInterval(() => {
          if (!canKick) return; // only moderators sweep, saves quota
          Object.keys(bans).forEach(k => roomRef('players/' + k).remove());
        }, 800);
      }
    } else if (banSweepInterval) {
      clearInterval(banSweepInterval);
      banSweepInterval = null;
    }
  });
}

async function kickPlayer(targetKey) {
  if (!canKick || !targetKey || targetKey === myKey) {
    return;
  }
  const target = players[targetKey];
  const nm = (target && target.name) ? target.name : 'that player';
  const ok = await showConfirm('Kick ' + nm + ' from the room?', {
    detail: 'They will be locked out for 3 seconds and must completely rejoin.',
    okLabel: '\uD83D\uDEAB Kick',
    kind: 'danger',
  });
  if (!ok) return;
  // Write kicked:true onto the player node FIRST.
  // The kicked client is already listening to /players via listenPlayers, so
  // this triggers their handleBeingKicked immediately — stopping pushPos before
  // it can recreate the node. A plain .remove() was always lost to the 90ms
  // pushPos race; this approach closes that race at the source.
  const kickAt = Date.now();
  // Persist the ban server-side too. This survives stale/ghost clients that
  // keep recreating their /players node — every up-to-date client filters them out.
  roomRef('bans/' + targetKey).set(true);
  roomRef('players/' + targetKey).update({ kicked: true });
  roomRef('kicks/' + targetKey).set({ at: kickAt, by: matixUser || 'a moderator' });
  // Give the kicked client ~600 ms to self-remove, then hard-delete regardless.
  setTimeout(() => roomRef('players/' + targetKey).remove(), 600);
  roomRef('chat').push({ user: 'System', text: '🚫 ' + nm + ' was kicked by ' + (matixUser || 'a moderator') + '.', t: kickAt });
}

async function killPlayer(targetKey) {
  if (!canKick || !targetKey || targetKey === myKey) {
    return;
  }
  const target = players[targetKey];
  const nm = (target && target.name) ? target.name : 'that player';
  const ok = await showConfirm('Kill ' + nm + ' this round?', {
    detail: 'They stay in the room but are eliminated.',
    okLabel: '\uD83D\uDC80 Kill',
    kind: 'danger',
  });
  if (!ok) return;
  roomRef('players/' + targetKey).update({ alive: false, lives: 0 });
  roomRef('chat').push({ user: 'System', text: '\uD83D\uDC80 ' + nm + ' was eliminated by ' + (matixUser || 'a moderator') + '.', t: Date.now() });
}

// ── Custom modal alerts / confirms ──────���─────────────────────
function showConfirm(message, opts) {
  opts = opts || {};
  return new Promise(resolve => {
    const old = document.getElementById('mx-confirm-overlay');
    if (old) old.remove();
    const overlay = document.createElement('div');
    overlay.id = 'mx-confirm-overlay';
    overlay.className = 'mx-confirm-overlay';
    const card = document.createElement('div');
    card.className = 'mx-confirm-card' + (opts.kind === 'danger' ? ' danger' : '');
    const title = document.createElement('div');
    title.className = 'mx-confirm-title';
    title.textContent = message;
    card.appendChild(title);
    if (opts.detail) {
      const detail = document.createElement('div');
      detail.className = 'mx-confirm-detail';
      detail.textContent = opts.detail;
      card.appendChild(detail);
    }
    const btns = document.createElement('div');
    btns.className = 'mx-confirm-btns';
    const cancel = document.createElement('button');
    cancel.className = 'mx-confirm-cancel';
    cancel.textContent = opts.cancelLabel || 'Cancel';
    cancel.addEventListener('click', () => { overlay.remove(); resolve(false); });
    const ok = document.createElement('button');
    ok.className = 'mx-confirm-ok' + (opts.kind === 'danger' ? ' danger' : '');
    ok.textContent = opts.okLabel || 'OK';
    ok.addEventListener('click', () => { overlay.remove(); resolve(true); });
    btns.appendChild(cancel);
    btns.appendChild(ok);
    card.appendChild(btns);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    // Focus the OK button so keyboard users can just press Enter.
    setTimeout(() => { try { ok.focus(); } catch (e) {} }, 20);
  });
}

function showAlert(message, opts) {
  opts = opts || {};
  return new Promise(resolve => {
    const old = document.getElementById('mx-confirm-overlay');
    if (old) old.remove();
    const overlay = document.createElement('div');
    overlay.id = 'mx-confirm-overlay';
    overlay.className = 'mx-confirm-overlay';
    const card = document.createElement('div');
    card.className = 'mx-confirm-card' + (opts.kind === 'danger' ? ' danger' : '');
    const title = document.createElement('div');
    title.className = 'mx-confirm-title';
    title.textContent = message;
    card.appendChild(title);
    if (opts.detail) {
      const detail = document.createElement('div');
      detail.className = 'mx-confirm-detail';
      detail.textContent = opts.detail;
      card.appendChild(detail);
    }
    const btns = document.createElement('div');
    btns.className = 'mx-confirm-btns';
    const ok = document.createElement('button');
    ok.className = 'mx-confirm-ok';
    ok.textContent = opts.okLabel || 'OK';
    ok.addEventListener('click', () => { overlay.remove(); resolve(true); });
    btns.appendChild(ok);
    card.appendChild(btns);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    setTimeout(() => { try { ok.focus(); } catch (e) {} }, 20);
  });
}

function handleBeingKicked(kick) {
  if (kicked) {
    return;
  }
  kicked = true;
  kickUntil = (kick && kick.at ? kick.at : Date.now()) + 3000;
  if (posInterval) { clearInterval(posInterval); posInterval = null; }
  if (activityCheckInterval) { clearInterval(activityCheckInterval); activityCheckInterval = null; }
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  if (myKey) {
    roomRef('players/' + myKey).remove();
  }
  showKickOverlay();
}

function showKickOverlay() {
  let overlay = document.getElementById('kick-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'kick-overlay';
    overlay.className = 'kick-overlay';
    overlay.innerHTML = '<div class="kick-card"><div class="kick-emoji">🚫</div><h2>You were kicked</h2><p>A manager removed you from this room.</p><div class="kick-count" id="kick-count">3</div><p class="kick-sub">You must completely rejoin.</p></div>';
    document.body.appendChild(overlay);
  }
  overlay.classList.remove('hidden');
  let kickTimer = null;
  const tick = () => {
    const remain = Math.max(0, Math.ceil((kickUntil - Date.now()) / 1000));
    const countEl = document.getElementById('kick-count');
    if (countEl) countEl.textContent = remain;
    if (Date.now() >= kickUntil) {
      if (kickTimer) clearInterval(kickTimer);
      if (myKey) roomRef('kicks/' + myKey).remove();
      // Do NOT send them back to the same room — that would let them auto-rejoin.
      // Wipe their persistent player key too so they land as a fresh identity.
      try { localStorage.removeItem('mathfightPlayerKey'); } catch (e) {}
      location.href = '/games/mathfight/';
    }
  };
  tick();
  kickTimer = setInterval(tick, 200);
}

// ── Chat ──────────────────────────────────────────────────
function setupChat() {
  chatToggle.addEventListener('click', () => chatPanel.classList.toggle('hidden'));
  chatForm.addEventListener('submit', e => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text || !myKey) {
      return;
    }
    roomRef('chat').push({ user: me, text, t: Date.now() });
    chatInput.value = '';
  });
}

// ── Render loop ─��─────────────────────────────────────────
// Render loop locked to a steady 60 FPS. requestAnimationFrame alone runs at
// the display's native rate (120/144 Hz on many devices), which also made
// movement speed device-dependent. Throttling to a fixed 60 FPS timestep keeps
// motion smooth AND identical for everyone.
let _lastFrameTs = 0;
const TARGET_FPS = 60;
const FRAME_INTERVAL = 1000 / TARGET_FPS;
function loop(ts) {
  requestAnimationFrame(loop);
  if (ts === undefined) ts = performance.now();
  const elapsed = ts - _lastFrameTs;
  if (elapsed < FRAME_INTERVAL - 1) return; // too soon — skip this repaint
  // Keep cadence stable without drifting.
  _lastFrameTs = ts - (elapsed % FRAME_INTERVAL);
  updateMovement();
  camX = myX - canvas.width / 2;
  camY = myY - canvas.height / 2;
  drawBg();
  drawPlayers();
}

function drawBg() {
  ctx.fillStyle = '#040d1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  const gs = 64;
  for (let x = (((-camX) % gs) + gs) % gs; x < canvas.width; x += gs) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = (((-camY) % gs) + gs) % gs; y < canvas.height; y += gs) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(129,140,248,0.28)';
  ctx.lineWidth = 4;
  ctx.strokeRect(2 - camX, 2 - camY, WORLD_W - 4, WORLD_H - 4);
}

function drawPlayers() {
  const canPick = gameState.turn === myKey && gameState.turnPhase === 'picking';

  for (const [name, p] of Object.entries(players)) {
    if (!p) {
      continue;
    }

    if (!p.alive && (!p.lastActivity || Date.now() - p.lastActivity > 10000)) {
      continue;
    }

    // Smoothly interpolate remote players toward their latest reported x,y each
    // frame. Factor 0.28 catches up ~90% within ~120 ms (well below perception).
    // Snap immediately if the delta is huge (respawn, teleport, first-seen).
    let drawX, drawY;
    if (name === myKey) {
      drawX = myX; drawY = myY;
    } else {
      let interp = remoteInterp[name];
      const targetX = (typeof p.x === 'number') ? p.x : 0;
      const targetY = (typeof p.y === 'number') ? p.y : 0;
      if (!interp) {
        interp = { x: targetX, y: targetY };
        remoteInterp[name] = interp;
      }
      const ddx = targetX - interp.x, ddy = targetY - interp.y;
      if (Math.abs(ddx) > 260 || Math.abs(ddy) > 260) {
        interp.x = targetX; interp.y = targetY;
      } else {
        interp.x += ddx * 0.28;
        interp.y += ddy * 0.28;
      }
      drawX = interp.x; drawY = interp.y;
    }
    const sx = drawX - camX;
    const sy = drawY - camY;

    ctx.save();
    if (!p.alive) {
      ctx.globalAlpha = 0.25;
    }

    if (canPick && name !== myKey && p.alive) {
      ctx.beginPath();
      ctx.arc(sx, sy, P_RADIUS + 12, 0, Math.PI * 2);
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

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
      ctx.beginPath();
      ctx.arc(sx, sy, P_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = bodyColor;
      ctx.fill();
    }

    ctx.restore();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = '11px serif';
    const hearts = p.alive ? '❤️'.repeat(Math.max(0, p.lives || 0)) : '💀';
    ctx.fillText(hearts, sx, sy - P_RADIUS - 20);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.fillText(p.name || name, sx, sy - P_RADIUS - 6);
  }
  ctx.textBaseline = 'alphabetic';
}

// ── Helpers ───────────────────────────────────────────────
function getAlive() {
  return Object.keys(players).filter(p => players[p] && players[p].alive && !players[p].kicked);
}

function imFirst(alive) {
  return alive.slice().sort()[0] === myKey;
}

// In bot mode the human's browser is the only real client driving the bot, so
// it must always own turn/state progression regardless of key sort order.
function iAmAuthority(alive) {
  return joinMode === 'bot' ? true : imFirst(alive);
}

function getStickmanImage(color) {
  if (stickmanCache[color]) {
    return stickmanCache[color];
  }

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

//gets current total(rooms+ online server) num of players in any and puts it into main page stats section
function updatePlayerCount() {
  db.ref(ROOM_ROOT).once('value').then(s => {
    const rooms = s.val() || {};
    let count = 0;
    Object.values(rooms).forEach(r => {
      if (r.players) {
        count += Object.keys(r.players).length;
      }
    });
    const el = document.getElementById('player-count');
    if (el) el.textContent = count;
  }).catch(() => {});
}
updatePlayerCount();
setInterval(updatePlayerCount, 60000);
