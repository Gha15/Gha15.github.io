/* =====================================================================
   🎯 Matix Present (Nov 2026): teacher quizzes played live in class.
   - Teacher page (#/teacher): make quizzes with a style (theme) and five
     kinds of question: Quiz (one answer), True or false, Multiple answers,
     Type the answer, Poll. Optional picture / YouTube video per question.
   - Matix Present (#/live/<PIN>): the smart-board screen. Students join at
     /join with the Game PIN (or the QR code), pick a name and a math avatar
     (they can change it until the teacher presses Start). Each question
     shows big on the board with four coloured math-sign answers
     (+ − × ÷). Students press the matching sign on their device.
     Timer, points for speed, answer streaks, leaderboard, podium, CSV.
   - The board is in charge: it checks the answers and writes the scores,
     so a student device never needs to know the right answer.
   Database (plain, not scrambled):
     /mxquiz/<teacher>/<quizId>       the teacher's quizzes
     /mxhosts/<teacher>/<PIN>         games the teacher has open
     /mxlive/<PIN>/meta               host, quiz, question order
     /mxlive/<PIN>/pub                what everyone sees (state, timer …)
     /mxlive/<PIN>/players/<pid>      name, avatar, score, last result
     /mxlive/<PIN>/ans/<i>/<pid>      a student's answer + server time
   Live updates use Firebase's streaming REST API (EventSource).
   ===================================================================== */
(function () {
'use strict';
var D = document, W = window;
var FB = 'https://matix-1d538-default-rtdb.firebaseio.com';
function $(id) { return D.getElementById(id); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function T(s) { try { return typeof W.tr === 'function' ? W.tr(s) : s; } catch (e) { return s; } }
function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } }
function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
function enc(s) { return encodeURIComponent(s); }
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function rid(n) { var a = new Uint32Array(2); crypto.getRandomValues(a); return (a[0].toString(36) + a[1].toString(36)).slice(0, n || 10); }
function toast(msg, kind) {
  var t = D.createElement('div'); t.className = 'toast' + (kind === 'err' ? ' err' : ''); t.setAttribute('role', 'status'); t.textContent = T(msg);
  D.body.appendChild(t); setTimeout(function () { t.remove(); }, 2800);
}
function fr() { try { return W.mxLang && W.mxLang.get() === 'fr'; } catch (e) { return false; } }
function place(n) { if (fr()) return n + (n === 1 ? 're' : 'e'); var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
function pinFmt(p) { p = String(p || ''); return p.slice(0, 3) + ' ' + p.slice(3); }
function copy(text) {
  var done = function () { toast('🔗 Link copied'); };
  try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, function () { prompt(T('Copy this link:'), text); }); return; } } catch (e) {}
  prompt(T('Copy this link:'), text);
}

/* ---------------- database ---------------- */
function api(path, method, data) {
  var o = { method: method || 'GET' };
  if (data !== undefined) { o.headers = { 'Content-Type': 'application/json' }; o.body = JSON.stringify(data); }
  return fetch(FB + path + '.json', o).then(function (r) { if (!r.ok) throw new Error('db ' + r.status); return r.json(); });
}
var TS = { '.sv': 'timestamp' };
var OFF = 0; /* this device's clock vs the database clock */
function now() { return Date.now() + OFF; }
function syncClock(path) {
  var t0 = Date.now();
  return api(path, 'PUT', TS).then(function (v) { if (typeof v === 'number') OFF = v - (t0 + Date.now()) / 2; }).catch(function () {});
}
function setAt(root, path, val) {
  var ks = String(path).split('/').filter(Boolean);
  if (!ks.length) return val;
  if (!root || typeof root !== 'object') root = {};
  var o = root;
  for (var i = 0; i < ks.length - 1; i++) { if (!o[ks[i]] || typeof o[ks[i]] !== 'object') o[ks[i]] = {}; o = o[ks[i]]; }
  var k = ks[ks.length - 1]; if (val === null) delete o[k]; else o[k] = val;
  return root;
}
/* live copy of one database path (Firebase streaming REST) */
function watch(path, cb) {
  var data = null, es;
  try { es = new EventSource(FB + path + '.json'); } catch (e) { return { close: function () {} }; }
  es.addEventListener('put', function (e) { try { var m = JSON.parse(e.data); data = setAt(data, m.path, m.data); cb(data); } catch (x) {} });
  es.addEventListener('patch', function (e) { try { var m = JSON.parse(e.data), base = m.path === '/' ? '' : m.path; for (var k in m.data) data = setAt(data, base + '/' + k, m.data[k]); cb(data); } catch (x) {} });
  return { close: function () { try { es.close(); } catch (e) {} } };
}

/* ---------------- games nobody has open stop by themselves ----------------
   Every browser showing a game (the board or a student's device) writes
   /mxlive/<PIN>/alive every 15 s. A game not seen for more than a minute is
   closed: it is deleted the next time anybody looks at it. */
var ALIVE_MS = 60000, BEAT_MS = 15000;
function beat(code) { return api('/mxlive/' + code + '/alive', 'PUT', TS).catch(function () {}); }
function heartbeat(code) { beat(code); return setInterval(function () { beat(code); }, BEAT_MS); }
/* resolves true (and deletes the game) when nobody has had it open for a minute */
function stale(code) {
  return Promise.all([api('/mxlive/' + code + '/alive'), api('/mxlive/' + code + '/meta')]).then(function (r) {
    var meta = r[1]; if (!meta) return false;
    var seen = typeof r[0] === 'number' ? r[0] : (typeof meta.createdAt === 'number' ? meta.createdAt : 0);
    if (Date.now() + OFF - seen <= ALIVE_MS) return false;
    var jobs = [api('/mxlive/' + code, 'DELETE')];
    if (meta.host) jobs.push(api('/mxhosts/' + enc(meta.host) + '/' + code, 'DELETE'));
    return Promise.all(jobs).then(function () { return true; }, function () { return true; });
  }).catch(function () { return false; });
}
function sweep() {
  fetch(FB + '/mxlive.json?shallow=true').then(function (r) { return r.json(); }).then(function (o) { Object.keys(o || {}).slice(0, 60).forEach(function (k) { stale(k); }); }).catch(function () {});
}

/* ---------------- shared look: answer signs, avatars, styles ---------------- */
var SH = [{ s: '+', c: '#e53950', n: 'Plus' }, { s: '−', c: '#2f6fe0', n: 'Minus' }, { s: '×', c: '#e0a100', n: 'Times' }, { s: '÷', c: '#1f9d55', n: 'Divide' }];
var TFSH = [{ s: '=', c: '#1f9d55', n: 'True' }, { s: '≠', c: '#e53950', n: 'False' }];
function signs(type, n) { return type === 'tf' ? TFSH : SH.slice(0, clamp(n || 4, 2, 4)); }
var AV = [['π', '#8b5cf6', 'Pi'], ['∑', '#ef4444', 'Sigma'], ['√', '#16a34a', 'Root'], ['∞', '#2563eb', 'Infinity'], ['Δ', '#d97706', 'Delta'], ['θ', '#db2777', 'Theta'],
  ['∫', '#0d9488', 'Integral'], ['%', '#ea580c', 'Percent'], ['÷', '#4f46e5', 'Divide'], ['×', '#e11d48', 'Times'], ['+', '#15803d', 'Plus'], ['=', '#0284c7', 'Equals'],
  ['≈', '#9333ea', 'Almost'], ['∠', '#b45309', 'Angle'], ['λ', '#047857', 'Lambda'], ['φ', '#be185d', 'Phi'], ['½', '#1d4ed8', 'Half'], ['x²', '#dc2626', 'Square'],
  ['7', '#7c3aed', 'Seven'], ['0', '#0e7490', 'Zero'], ['e', '#4d7c0f', 'Euler'], ['i', '#a21caf', 'Imaginary'], ['?', '#c2410c', 'Mystery'], ['★', '#a16207', 'Star']];
function avHtml(i, size) { var a = AV[((+i || 0) % AV.length + AV.length) % AV.length]; return '<span class="mxv" style="--c:' + a[1] + ';--z:' + (size || 48) + 'px" aria-hidden="true"><i></i><b>' + esc(a[0]) + '</b></span>'; }
var THEMES = [
  ['galaxy', 'Galaxy', 'bg_space_w.jpg', 'rgba(20,12,60,.55)'], ['ocean', 'Ocean', 'bg_ocean_w.jpg', 'rgba(4,30,60,.5)'],
  ['jungle', 'Jungle', 'bg_jungle_w.jpg', 'rgba(6,40,20,.5)'], ['candy', 'Candy', 'bg_candy_w.jpg', 'rgba(80,10,60,.45)'],
  ['volcano', 'Volcano', 'bg_volcano_w.jpg', 'rgba(60,10,0,.5)'], ['arctic', 'Arctic', 'bg_arctic_w.jpg', 'rgba(10,40,70,.5)'],
  ['robot', 'Robots', 'bg_robot_w.jpg', 'rgba(15,20,40,.55)'], ['pirate', 'Pirates', 'bg_pirate_w.jpg', 'rgba(30,20,10,.5)'],
  ['chalk', 'Chalkboard', '', 'radial-gradient(ellipse at 30% 20%,#2c5a41,#163325 70%)'], ['grape', 'Grape', '', 'linear-gradient(135deg,#3b0f80,#7c3aed)']];
function theme(id) { for (var i = 0; i < THEMES.length; i++) if (THEMES[i][0] === id) return THEMES[i]; return THEMES[0]; }
function themeBg(id) { var t = theme(id); return t[2] ? 'linear-gradient(' + t[3] + ',' + t[3] + '),url(/arcade/img/' + t[2] + ') center/cover' : t[3]; }

/* ---------------- questions ---------------- */
var TYPES = [['mc', '🔢', 'Quiz'], ['tf', '✅', 'True or false'], ['multi', '☑️', 'Multiple answers'], ['type', '⌨️', 'Type answer'], ['poll', '📊', 'Poll']];
function typeInfo(t) { for (var i = 0; i < TYPES.length; i++) if (TYPES[i][0] === t) return TYPES[i]; return TYPES[0]; }
var TIMES = [5, 10, 20, 30, 45, 60, 90, 120, 240];
function newQ(type) {
  var q = { type: type || 'mc', q: '', media: '', time: 20, points: 1, choices: ['', '', '', ''], correct: [0], answers: [] };
  if (type === 'tf') { q.choices = ['True', 'False']; q.correct = [0]; q.time = 10; }
  if (type === 'multi') q.correct = [];
  if (type === 'poll') { q.correct = []; q.points = 0; }
  if (type === 'type') { q.choices = []; q.correct = []; q.time = 30; }
  return q;
}
function arr(x) { if (Array.isArray(x)) return x; if (x && typeof x === 'object') return Object.keys(x).sort(function (a, b) { return a - b; }).map(function (k) { return x[k]; }); return []; }
function loadQ(q, pad) {
  var o = newQ(q && q.type); o.q = q.q || ''; o.media = q.media || ''; o.time = +q.time || 20; o.points = q.points == null ? 1 : +q.points;
  o.choices = arr(q.choices).map(String); o.correct = arr(q.correct).map(Number); o.answers = arr(q.answers).map(String);
  if (o.type === 'tf') o.choices = ['True', 'False'];
  if (pad && (o.type === 'mc' || o.type === 'multi' || o.type === 'poll')) while (o.choices.length < 4) o.choices.push('');
  return o;
}
function loadQuiz(z, pad) { return { id: z.id, title: z.title || '', theme: z.theme || 'galaxy', onDevice: !!z.onDevice, shuffle: !!z.shuffle, updatedAt: z.updatedAt || 0, questions: arr(z.questions).map(function (q) { return loadQ(q, pad); }) }; }
function finalize(q) {
  var o = { type: q.type, q: String(q.q || '').trim(), media: String(q.media || '').trim(), time: q.time, points: q.type === 'poll' ? 0 : q.points };
  if (q.type === 'type') { o.answers = q.answers.map(function (s) { return String(s).trim(); }).filter(Boolean); return o; }
  if (q.type === 'tf') { o.choices = ['True', 'False']; o.correct = [q.correct[0] === 1 ? 1 : 0]; return o; }
  var ch = [], cor = [];
  q.choices.forEach(function (c, k) { c = String(c || '').trim(); if (c) { if (q.correct.indexOf(k) > -1) cor.push(ch.length); ch.push(c); } });
  o.choices = ch; o.correct = q.type === 'poll' ? [] : cor; return o;
}
function problem(o, i) {
  var n = T('Question') + ' ' + (i + 1) + (fr() ? ' : ' : ': ');
  if (!o.q && !o.media) return n + T('write the question.');
  if (o.type === 'type') return o.answers.length ? '' : n + T('add at least one accepted answer.');
  if (o.type === 'tf') return '';
  if (o.choices.length < 2) return n + T('add at least 2 answers.');
  if (o.type === 'mc' && o.correct.length !== 1) return n + T('tick the right answer.');
  if (o.type === 'multi' && !o.correct.length) return n + T('tick at least one right answer.');
  return '';
}
/* typed answers: 1/2 = 0.5 = 0,5 ; case, accents and spaces do not matter */
function num(s) {
  s = String(s).trim().replace(/\s+/g, '').replace(/[−–]/g, '-').replace(',', '.');
  var m = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/); if (m && +m[2] !== 0) return +m[1] / +m[2];
  return /^-?(\d+\.?\d*|\.\d+)$/.test(s) ? +s : null;
}
function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[−–]/g, '-').replace(/\s+/g, ''); }
function sameAns(a, b) { var x = num(a), y = num(b); if (x !== null && y !== null) return Math.abs(x - y) < 1e-6; return norm(a) === norm(b) && norm(a) !== ''; }
function judge(q, c) {
  if (q.type === 'poll') return null;
  if (c == null) return false;
  if (q.type === 'type') return q.answers.some(function (x) { return sameAns(x, c); });
  var a = (Array.isArray(c) ? c : [c]).map(Number);
  if (q.type === 'multi') return a.length === q.correct.length && q.correct.every(function (k) { return a.indexOf(k) > -1; });
  return q.correct.indexOf(a[0]) > -1;
}
function media(url, big) {
  url = String(url || '').trim(); if (!/^https?:\/\//i.test(url)) return '';
  var y = url.match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([\w-]{11})/);
  if (y) return big ? '<div class="mxl-media"><iframe src="https://www.youtube-nocookie.com/embed/' + y[1] + '?rel=0" title="Video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>' : '<span class="mxt-mtag">▶ YouTube</span>';
  return big ? '<div class="mxl-media"><img src="' + esc(url) + '" alt=""></div>' : '<img class="mxt-mthumb" src="' + esc(url) + '" alt="" onerror="this.remove()">';
}

/* =====================================================================
   🍎 Teacher page
   ===================================================================== */
function me() { return W.mxUser || null; }
function page(c, parts) {
  stop();
  if (parts[1] === 'new') return editor(c, null);
  if (parts[1] === 'edit' && parts[2]) return editor(c, decodeURIComponent(parts[2]));
  list(c);
}
var SAMPLE = { title: 'Matix warm-up', theme: 'galaxy', questions: [
  { type: 'mc', q: '7 × 8 = ?', choices: ['54', '56', '64', '48'], correct: [1], time: 20, points: 1 },
  { type: 'tf', q: 'The angles of a triangle add up to 180°.', choices: ['True', 'False'], correct: [0], time: 10, points: 1 },
  { type: 'multi', q: 'Which numbers are prime?', choices: ['2', '9', '13', '21'], correct: [0, 2], time: 30, points: 1 },
  { type: 'type', q: 'Write 3/4 as a decimal.', answers: ['0.75'], time: 30, points: 2 },
  { type: 'poll', q: 'What should we practise next?', choices: ['Fractions', 'Geometry', 'Algebra', 'Probability'], correct: [], time: 20, points: 0 }] };
var SAMPLE_FR = { title: 'Échauffement Matix', theme: 'galaxy', questions: [
  { type: 'mc', q: '7 × 8 = ?', choices: ['54', '56', '64', '48'], correct: [1], time: 20, points: 1 },
  { type: 'tf', q: 'La somme des angles d’un triangle est 180°.', choices: ['True', 'False'], correct: [0], time: 10, points: 1 },
  { type: 'multi', q: 'Quels nombres sont premiers ?', choices: ['2', '9', '13', '21'], correct: [0, 2], time: 30, points: 1 },
  { type: 'type', q: 'Écris 3/4 sous forme décimale.', answers: ['0,75'], time: 30, points: 2 },
  { type: 'poll', q: 'Que veux-tu travailler ensuite ?', choices: ['Fractions', 'Géométrie', 'Algèbre', 'Probabilités'], correct: [], time: 20, points: 0 }] };
function newId() { return 'q' + Date.now().toString(36) + rid(4); }

function list(c) {
  var u = me(), origin = location.origin;
  c.innerHTML = '<div class="page mxt"><h1>🍎 <span>Teacher</span></h1>'
    + '<p class="sub">Make quizzes, then run them live on the smart board with 🎯 Matix Present. Students join at <b>' + esc(location.host) + '/join</b> with the Game PIN. They do not need an account.</p>'
    + '<div class="row-btns"><a class="btn pri" href="#/teacher/new">➕ New quiz</a><a class="btn ghost" href="/join/" target="_blank" rel="noopener">🎯 Student join page</a></div>'
    + '<div id="mxtOpen"></div>'
    + '<h2 class="mxt-h">📚 My quizzes</h2><div id="mxtList" class="mxt-grid"><p class="sub">Loading…</p></div>'
    + '<h2 class="mxt-h">🎞️ My slideshows</h2><p class="sub">Your exercise sets from Interactive games → In class → Presentation mode. Each one has its own link that anybody can open, no account needed.</p><div id="mxtDecks" class="mxt-decks"><p class="sub">Loading…</p></div></div>';
  var quizzes = [];
  function draw() {
    var box = $('mxtList'); if (!box) return;
    if (!quizzes.length) {
      box.innerHTML = '<div class="card mxt-empty"><p>No quizzes yet.</p><div class="row-btns"><a class="btn pri" href="#/teacher/new">➕ New quiz</a><button type="button" class="btn ghost" id="mxtSample">✨ Make a sample quiz</button></div></div>';
      $('mxtSample').onclick = function () { var z = JSON.parse(JSON.stringify(fr() ? SAMPLE_FR : SAMPLE)); z.id = newId(); z.updatedAt = Date.now(); api('/mxquiz/' + enc(u) + '/' + z.id, 'PUT', z).then(function () { list(c); }, function () { toast('Could not save. Check your connection.', 'err'); }); };
      return;
    }
    box.innerHTML = quizzes.map(function (z, i) {
      return '<article class="mxt-card"><div class="mxt-cover" style="background:' + themeBg(z.theme) + '"><span>' + z.questions.length + ' ' + T(z.questions.length === 1 ? 'question' : 'questions') + '</span></div>'
        + '<div class="mxt-cx"><h3>' + esc(z.title || T('Untitled quiz')) + '</h3><small>' + esc(T(theme(z.theme)[1])) + (z.updatedAt ? ' · ' + esc(new Date(z.updatedAt).toLocaleDateString(fr() ? 'fr-FR' : undefined)) : '') + '</small>'
        + '<div class="mxt-acts"><button type="button" class="btn pri" data-live="' + i + '">▶ Matix Present</button><a class="btn ghost" href="#/teacher/edit/' + enc(z.id) + '">✏️ Edit</a>'
        + '<button type="button" class="btn ghost" data-dup="' + i + '" aria-label="Duplicate" title="Duplicate">⧉</button><button type="button" class="btn ghost" data-del="' + i + '" aria-label="Delete" title="Delete">🗑</button></div></div></article>';
    }).join('');
    box.querySelectorAll('[data-live]').forEach(function (b) { b.onclick = function () { startLive(quizzes[+b.dataset.live], b); }; });
    box.querySelectorAll('[data-dup]').forEach(function (b) { b.onclick = function () {
      var z = JSON.parse(JSON.stringify(quizzes[+b.dataset.dup])); z.id = newId(); z.title = (z.title || '') + ' (' + T('copy') + ')'; z.updatedAt = Date.now();
      api('/mxquiz/' + enc(u) + '/' + z.id, 'PUT', z).then(function () { quizzes.unshift(loadQuiz(z)); draw(); toast('⧉ Quiz copied'); }, function () { toast('Could not save. Check your connection.', 'err'); }); }; });
    box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () {
      var z = quizzes[+b.dataset.del]; if (!confirm(T('Delete this quiz?') + ' ' + (z.title || ''))) return;
      api('/mxquiz/' + enc(u) + '/' + z.id, 'DELETE').then(function () { quizzes.splice(quizzes.indexOf(z), 1); draw(); }, function () { toast('Could not delete. Check your connection.', 'err'); }); }; });
  }
  api('/mxquiz/' + enc(u)).then(function (o) {
    quizzes = Object.keys(o || {}).map(function (k) { return o[k]; }).filter(function (z) { return z && z.id; }).map(function (z) { return loadQuiz(z); })
      .sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    draw();
  }).catch(function () { var b = $('mxtList'); if (b) b.innerHTML = '<p class="sub">Could not load your quizzes. Check your connection.</p>'; });
  /* games that are still open on some board */
  sweep();
  api('/mxhosts/' + enc(u)).then(function (o) {
    var all = Object.keys(o || {});
    return Promise.all(all.map(function (k) { return stale(k).then(function (gone) { return gone ? null : api('/mxlive/' + k + '/meta').then(function (m) { if (!m) { api('/mxhosts/' + enc(u) + '/' + k, 'DELETE'); return null; } return k; }); }); }))
      .then(function (ks) { var r = {}; ks.forEach(function (k) { if (k) r[k] = o[k]; }); return r; });
  }).then(function (o) {
    var codes = Object.keys(o || {}).sort(function (a, b) { return (o[b] || 0) - (o[a] || 0); }); var box = $('mxtOpen'); if (!box || !codes.length) return;
    box.innerHTML = '<div class="card mxt-open"><b>🟢 Games still open</b>' + codes.map(function (k) {
      return '<div class="mxt-orow"><span>PIN <b>' + pinFmt(k) + '</b> · ' + esc(new Date(+o[k] || 0).toLocaleString(fr() ? 'fr-FR' : undefined)) + '</span><span><a class="btn ghost" href="#/live/' + k + '">↩ Resume</a><button type="button" class="btn ghost" data-close="' + k + '">✕ Close</button></span></div>';
    }).join('') + '</div>';
    box.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { closeGame(b.dataset.close).then(function () { list(c); }); }; });
  }).catch(function () {});
  /* slideshows (Presentation mode sets) */
  api('/arcade/decks/' + enc(u)).then(function (o) {
    var box = $('mxtDecks'); if (!box) return;
    var ds = Object.keys(o || {}).map(function (k) { return o[k]; }).filter(function (d) { return d && d.id && d.slides; }).sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    if (!ds.length) { box.innerHTML = '<p class="sub">No slideshows yet. <a href="#/games">Make one in Interactive games → In class → Presentation mode.</a></p>'; return; }
    box.innerHTML = ds.map(function (d) {
      var path = '/present/' + enc(u) + '/' + enc(d.id);
      return '<div class="mxt-orow"><span><b>' + esc(d.title || T('Untitled')) + '</b> · ' + arr(d.slides).length + ' ' + T('slides') + '</span><span><a class="btn ghost" href="#' + path + '">▶ Open</a><button type="button" class="btn ghost" data-link="' + esc(origin + path) + '">🔗 Copy link</button></span></div>';
    }).join('');
    box.querySelectorAll('[data-link]').forEach(function (b) { b.onclick = function () { copy(b.dataset.link); }; });
  }).catch(function () { var b = $('mxtDecks'); if (b) b.innerHTML = ''; });
}

function closeGame(code) {
  var u = me();
  return Promise.all([api('/mxlive/' + code, 'DELETE'), api('/mxhosts/' + enc(u) + '/' + code, 'DELETE')]).catch(function () { toast('Could not close. Check your connection.', 'err'); });
}
function startLive(z, btn) {
  var u = me(); if (!u || !z || !z.questions || !z.questions.length) return;
  if (btn) btn.disabled = true;
  function pickCode(n) { var code = String(100000 + Math.floor(Math.random() * 900000)); return api('/mxlive/' + code + '/meta').then(function (m) { return m && n < 8 ? pickCode(n + 1) : code; }); }
  pickCode(0).then(function (code) {
    var order = z.questions.map(function (_, i) { return i; }); if (z.shuffle) order = shuffle(order);
    return api('/mxlive/' + code, 'PUT', { meta: { host: u, quiz: z.id, title: z.title || '', theme: z.theme || 'galaxy', n: order.length, order: order, createdAt: TS },
      pub: { state: 'lobby', i: -1, title: z.title || '', theme: z.theme || 'galaxy', n: order.length }, alive: TS })
      .then(function () { return api('/mxhosts/' + enc(u) + '/' + code, 'PUT', Date.now()); })
      .then(function () {
        /* close my other games that nobody has open */
        api('/mxhosts/' + enc(u)).then(function (o) { Object.keys(o || {}).forEach(function (k) { if (k !== code) stale(k).then(function (gone) { if (!gone) api('/mxlive/' + k + '/meta').then(function (m) { if (!m) api('/mxhosts/' + enc(u) + '/' + k, 'DELETE'); }); }); }); }).catch(function () {});
        location.hash = '#/live/' + code;
      });
  }).catch(function () { if (btn) btn.disabled = false; toast('Could not start the game. Check your connection.', 'err'); });
}

/* ---------- quiz editor ---------- */
var LEVELS = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'College'];
function fmtN(x) { return typeof x === 'number' ? String(Math.round(x * 1000) / 1000) : String(x); }
function wrongNums(a, n) {
  var out = [], seen = {}, step = Number.isInteger(a) ? 1 : (Math.abs(a) < 1 ? 0.1 : 0.5), span = Math.max(3, Math.round(Math.abs(a) * 0.2 / step)), tries = 0;
  seen[fmtN(a)] = 1;
  while (out.length < n && tries++ < 300) {
    var w = a + (Math.random() < .5 ? -1 : 1) * step * (1 + Math.floor(Math.random() * span));
    if (Math.random() < .2 && Number.isInteger(a)) w = a + (Math.random() < .5 ? -10 : 10);
    if (a >= 0 && w < 0) continue;
    var k = fmtN(w); if (seen[k]) continue; seen[k] = 1; out.push(k);
  }
  return out;
}
function editor(c, id) {
  var u = me();
  c.innerHTML = '<div class="page mxt"><p class="sub">Loading…</p></div>';
  (id ? api('/mxquiz/' + enc(u) + '/' + enc(id)) : Promise.resolve(null)).then(function (z) {
    if (id && !z) { c.innerHTML = '<div class="page mxt"><h1>Quiz not found</h1><p><a class="btn ghost" href="#/teacher">← My quizzes</a></p></div>'; return; }
    var Q = z ? loadQuiz(z, true) : { id: newId(), title: '', theme: 'galaxy', onDevice: false, shuffle: false, questions: [newQ('mc')] };
    if (!Q.questions.length) Q.questions.push(newQ('mc'));
    var gradeSel = clamp(parseInt(ls('mx_arcade_level') || '3', 10) || 3, 1, 13);
    function qCard(q, i) {
      var ti = typeInfo(q.type), sg = signs(q.type, 4), isTF = q.type === 'tf', h;
      h = '<div class="mxt-q card" data-i="' + i + '"><div class="mxt-qh"><b class="mxt-qn">' + (i + 1) + '</b>'
        + '<select data-type aria-label="' + esc(T('Question type')) + '">' + TYPES.map(function (t) { return '<option value="' + t[0] + '"' + (t[0] === q.type ? ' selected' : '') + '>' + t[1] + ' ' + T(t[2]) + '</option>'; }).join('') + '</select>'
        + '<span class="mxt-sp"></span><button type="button" data-up="' + i + '" aria-label="Move up">▲</button><button type="button" data-dn="' + i + '" aria-label="Move down">▼</button>'
        + '<button type="button" data-cp="' + i + '" aria-label="Duplicate">⧉</button><button type="button" data-rm="' + i + '" aria-label="Remove">✕</button></div>'
        + '<label>Question<textarea data-f="q" rows="2" maxlength="300" placeholder="' + esc(T(isTF ? 'e.g. 0.5 is the same as 1/2' : 'e.g. 3/4 + 1/8 = ?')) + '">' + esc(q.q) + '</textarea></label>'
        + '<div class="mxt-row3"><label>Time limit<select data-f="time">' + TIMES.map(function (s) { return '<option value="' + s + '"' + (s === q.time ? ' selected' : '') + '>' + s + ' s</option>'; }).join('') + '</select></label>'
        + (q.type === 'poll' ? '' : '<label>Points<select data-f="points"><option value="1"' + (q.points === 1 ? ' selected' : '') + '>Standard</option><option value="2"' + (q.points === 2 ? ' selected' : '') + '>Double points</option><option value="0"' + (q.points === 0 ? ' selected' : '') + '>No points</option></select></label>')
        + '<label>Picture or video link (optional)<input data-f="media" type="url" maxlength="400" value="' + esc(q.media) + '" placeholder="https://… (image or YouTube)"></label></div>'
        + (q.media ? '<div class="mxt-mprev">' + media(q.media, false) + '</div>' : '');
      if (q.type === 'type') {
        h += '<label>Accepted answers (comma separated)<input data-f="answers" maxlength="300" value="' + esc(q.answers.join(', ')) + '" placeholder="' + esc(T('e.g. 0.75, 3/4')) + '"></label><p class="mxt-hint">Numbers that are equal count as right: 1/2, 0.5 and 0,5 are the same. Capitals and accents do not matter.</p>';
      } else {
        h += '<div class="mxt-chs">' + (isTF ? [0, 1] : [0, 1, 2, 3]).map(function (k) {
          var s = sg[k], on = q.correct.indexOf(k) > -1;
          return '<div class="mxt-opt" style="--c:' + s.c + '"><span class="mxt-sg" aria-hidden="true">' + s.s + '</span>'
            + (isTF ? '<span class="mxt-tf">' + T(k ? 'False' : 'True') + '</span>' : '<input data-c="' + k + '" maxlength="90" value="' + esc(q.choices[k] || '') + '" placeholder="' + esc(T('Answer') + ' ' + (k + 1) + (k > 1 ? ' ' + T('(optional)') : '')) + '" aria-label="' + esc(T('Answer') + ' ' + s.s) + '">')
            + (q.type === 'poll' ? '' : '<label class="mxt-ok" title="' + esc(T('Right answer')) + '"><input type="' + (q.type === 'multi' ? 'checkbox' : 'radio') + '" name="cor' + i + '" data-k="' + k + '"' + (on ? ' checked' : '') + ' aria-label="' + esc(T('Right answer')) + '"><span>✓</span></label>')
            + '</div>';
        }).join('') + '</div>'
          + '<p class="mxt-hint">' + T(q.type === 'poll' ? 'A poll has no right answer and gives no points: it shows what the class thinks.' : q.type === 'multi' ? 'Tick every right answer. Students must pick all of them.' : 'Tick the right answer.') + '</p>';
      }
      return h + '</div>';
    }
    function draw() {
      c.innerHTML = '<div class="page mxt mxt-ed"><a class="mxt-back" href="#/teacher">← My quizzes</a><h1>' + (id ? '✏️ <span>Edit quiz</span>' : '➕ <span>New quiz</span>') + '</h1>'
        + '<div class="card"><label>Quiz title<input id="qzT" maxlength="80" value="' + esc(Q.title) + '" placeholder="' + esc(T('e.g. Fractions challenge')) + '"></label>'
        + '<div class="mxt-lab">Style</div><div class="mxt-themes">' + THEMES.map(function (t) { return '<button type="button" class="mxt-th' + (t[0] === Q.theme ? ' on' : '') + '" data-th="' + t[0] + '" aria-pressed="' + (t[0] === Q.theme) + '" style="background:' + themeBg(t[0]) + '"><span>' + esc(T(t[1])) + '</span></button>'; }).join('') + '</div>'
        + '<label class="mxt-chk"><input type="checkbox" id="qzDev"' + (Q.onDevice ? ' checked' : '') + '> Also show the question and answers on the students’ devices</label>'
        + '<label class="mxt-chk"><input type="checkbox" id="qzSh"' + (Q.shuffle ? ' checked' : '') + '> Shuffle the question order each game</label></div>'
        + Q.questions.map(qCard).join('')
        + '<div class="mxt-add"><b>Add a question:</b>' + TYPES.map(function (t) { return '<button type="button" class="btn ghost" data-add="' + t[0] + '">' + t[1] + ' ' + T(t[2]) + '</button>'; }).join('') + '</div>'
        + '<div class="card mxt-gen"><b>✨ Math question maker</b><span>Add 5 ready-made questions for</span><select id="qzG" aria-label="Grade">' + LEVELS.map(function (l, k) { return '<option value="' + (k + 1) + '"' + (k + 1 === gradeSel ? ' selected' : '') + '>' + T(l) + '</option>'; }).join('') + '</select><button type="button" class="btn ghost" id="qzGen">Add 5 questions</button></div>'
        + '<div class="err" id="qzErr" role="alert"></div>'
        + '<div class="mxt-save"><button type="button" class="btn pri" id="qzSave">💾 Save</button><button type="button" class="btn pri mxt-go" id="qzPlay">▶ Save and start Matix Present</button><a class="btn ghost" href="#/teacher">Cancel</a></div></div>';
      wire();
    }
    function read() {
      Q.title = $('qzT').value.trim(); Q.onDevice = $('qzDev').checked; Q.shuffle = $('qzSh').checked;
      c.querySelectorAll('.mxt-q').forEach(function (el) {
        var q = Q.questions[+el.dataset.i];
        el.querySelectorAll('[data-f]').forEach(function (f) {
          var k = f.dataset.f, v = f.value;
          if (k === 'time' || k === 'points') q[k] = +v; else if (k === 'answers') q.answers = v.split(',').map(function (s) { return s.trim(); }).filter(Boolean); else q[k] = v;
        });
        el.querySelectorAll('[data-c]').forEach(function (f) { q.choices[+f.dataset.c] = f.value; });
        if (q.type !== 'poll' && q.type !== 'type') { var cor = []; el.querySelectorAll('[data-k]').forEach(function (f) { if (f.checked) cor.push(+f.dataset.k); }); q.correct = cor; }
      });
    }
    function wire() {
      c.querySelectorAll('[data-th]').forEach(function (b) { b.onclick = function () { read(); Q.theme = b.dataset.th; draw(); }; });
      c.querySelectorAll('[data-type]').forEach(function (s) { s.onchange = function () {
        read(); var i = +s.closest('.mxt-q').dataset.i, old = Q.questions[i], nt = s.value, q = newQ(nt);
        q.q = old.q; q.media = old.media; q.time = old.time;
        if (nt !== 'poll') q.points = old.points || 1;
        if ((nt === 'mc' || nt === 'multi' || nt === 'poll') && old.type !== 'tf' && old.type !== 'type') { q.choices = old.choices.slice(); while (q.choices.length < 4) q.choices.push(''); }
        if (nt === 'mc' && old.correct.length) q.correct = [old.correct[0]];
        if (nt === 'multi' && old.type === 'mc') q.correct = old.correct.slice();
        if (nt === 'type' && old.type !== 'tf') q.answers = old.correct.map(function (k) { return old.choices[k]; }).filter(Boolean);
        Q.questions[i] = q; draw(); }; });
      c.querySelectorAll('[data-up],[data-dn],[data-rm],[data-cp]').forEach(function (b) { b.onclick = function () {
        read(); var d = b.dataset, i = +(d.up || d.dn || d.rm || d.cp), L = Q.questions;
        if (d.rm != null) { L.splice(i, 1); if (!L.length) L.push(newQ('mc')); }
        else if (d.cp != null) L.splice(i + 1, 0, JSON.parse(JSON.stringify(L[i])));
        else { var j = d.up != null ? i - 1 : i + 1; if (j < 0 || j >= L.length) return; var t = L[i]; L[i] = L[j]; L[j] = t; }
        draw(); }; });
      c.querySelectorAll('[data-f="media"]').forEach(function (f) { f.onchange = function () { read(); draw(); }; });
      c.querySelectorAll('[data-add]').forEach(function (b) { b.onclick = function () {
        read(); Q.questions.push(newQ(b.dataset.add)); draw();
        var cards = c.querySelectorAll('.mxt-q'), last = cards[cards.length - 1]; if (last) { last.scrollIntoView({ block: 'center' }); var t = last.querySelector('textarea'); if (t) t.focus(); } }; });
      $('qzGen').onclick = function () {
        read(); var L = +$('qzG').value, A = W.mxArcade; gradeSel = L;
        if (!A || !A.makeQ) { toast('The question maker could not load.', 'err'); return; }
        Q.questions = Q.questions.filter(function (q) { return String(q.q || '').trim() || String(q.media || '').trim(); });
        for (var n = 0; n < 5; n++) {
          var g = A.makeQ(L), text = String(g.q).replace(/\s*=\s*\?\s*$/, '') , q;
          text = /\?/.test(text) ? text : text + ' = ?';
          if (typeof g.a === 'number' && isFinite(g.a)) {
            q = newQ('mc'); var pos = Math.floor(Math.random() * 4), ch = wrongNums(g.a, 3); ch.splice(pos, 0, fmtN(g.a)); q.choices = ch; q.correct = [pos];
          } else { q = newQ('type'); q.answers = [String(g.a)]; }
          q.q = text; q.time = L <= 4 ? 20 : 30; Q.questions.push(q);
        }
        draw(); toast('✨ 5 questions added');
      };
      function save(play) {
        read();
        var out = { id: Q.id, title: Q.title || T('My quiz'), theme: Q.theme, onDevice: !!Q.onDevice, shuffle: !!Q.shuffle, updatedAt: Date.now(), questions: Q.questions.map(finalize) };
        var errs = out.questions.map(problem).filter(Boolean);
        if (errs.length) { $('qzErr').innerHTML = errs.slice(0, 5).map(esc).join('<br>'); $('qzErr').scrollIntoView({ block: 'center' }); return; }
        $('qzSave').disabled = $('qzPlay').disabled = true;
        api('/mxquiz/' + enc(u) + '/' + Q.id, 'PUT', out).then(function () {
          toast('✅ Quiz saved');
          if (play) startLive(loadQuiz(out)); else location.hash = '#/teacher';
        }).catch(function () { $('qzSave').disabled = $('qzPlay').disabled = false; $('qzErr').textContent = T('Could not save. Check your connection.'); });
      }
      $('qzSave').onclick = function () { save(false); }; $('qzPlay').onclick = function () { save(true); };
    }
    draw();
  }).catch(function () { c.innerHTML = '<div class="page mxt"><p class="sub">Could not load the quiz. Check your connection.</p></div>'; });
}

/* =====================================================================
   🎯 Matix Present: the board (host) screen
   ===================================================================== */
var LV = null;
function stop(keep) {
  if (!LV || (keep && LV.code === String(keep))) return;
  var H = LV; LV = null; H.dead = true;
  if (H.w) H.w.close(); clearInterval(H.tk); clearInterval(H.hb); D.removeEventListener('keydown', H.key);
  if (H.ov && H.ov.parentNode) H.ov.parentNode.removeChild(H.ov);
  D.body.classList.remove('mxl-on');
  try { if (D.fullscreenElement) D.exitFullscreen(); } catch (e) {}
}
var AC = null;
function beep(f, d, v) {
  if (LV && LV.mute) return;
  try {
    AC = AC || new (W.AudioContext || W.webkitAudioContext)();
    var o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
    o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(v || .08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d);
  } catch (e) {}
}
function msgPage(c, title, text) {
  c.innerHTML = '<div class="page mxt"><div class="gate"><div style="font-size:3rem">🎯</div><h1>' + esc(T(title)) + '</h1><p class="sub">' + text + '</p><p class="row-btns" style="justify-content:center"><a class="btn ghost" href="#/teacher">🍎 Teacher</a><a class="btn ghost" href="/join/">🎯 Join a game</a></p></div></div>';
}
function live(c, code) {
  code = String(code || '').replace(/\D/g, '');
  if (LV && LV.code === code && !LV.dead) { c.innerHTML = '<div class="page"><p class="sub">Matix Present is open.</p><a class="btn ghost" href="#/teacher">← Teacher</a></div>'; return; }
  stop();
  c.innerHTML = '<div class="page"><p class="sub">Loading Matix Present…</p></div>';
  stale(code).then(function (gone) { return gone ? [null, null, true] : Promise.all([api('/mxlive/' + code + '/meta'), api('/mxlive/' + code + '/pub')]); }).then(function (r) {
    var meta = r[0], pub = r[1];
    if (r[2]) { msgPage(c, 'This game stopped', esc(T('Nobody had it open for more than a minute, so it was closed. Start a new game from the Teacher page.'))); return; }
    if (!meta || !pub) { msgPage(c, 'This game is closed', esc(T('This Matix Present game does not exist any more.'))); return; }
    if (meta.host !== me()) { msgPage(c, 'Only the teacher can run this board', esc(T('This game belongs to')) + ' <b>@' + esc(meta.host) + '</b>. ' + esc(T('Students join at')) + ' <a href="/join/?c=' + code + '">' + esc(location.host) + '/join</a>.'); return; }
    return api('/mxquiz/' + enc(meta.host) + '/' + enc(meta.quiz)).then(function (z) {
      if (!z) { msgPage(c, 'Quiz not found', esc(T('The quiz for this game was deleted.'))); return; }
      c.innerHTML = '<div class="page"><p class="sub">Matix Present is open.</p><a class="btn ghost" href="#/teacher">← Teacher</a></div>';
      host(code, meta, loadQuiz(z), pub);
    });
  }).catch(function () { msgPage(c, 'Could not reach Matix', esc(T('Check your connection and try again.'))); });
}
function host(code, meta, quiz, pub0) {
  var H = LV = { code: code, meta: meta, quiz: quiz, S: { pub: pub0, players: {} }, view: '', mute: ls('mxl_mute') === '1', lastCount: -1, beeped: {} };
  var base = '/mxlive/' + code, joinUrl = location.origin + '/join/?c=' + code;
  var order = arr(meta.order).map(Number);
  function qAt(i) { var k = order[i]; return quiz.questions[k == null ? i : k]; }
  function n() { return order.length || quiz.questions.length; }
  var ov = H.ov = D.createElement('div'); ov.id = 'mxlOv'; ov.className = 'mxl' + (meta.theme === 'chalk' ? ' mxl-chalk' : ''); ov.style.background = themeBg(meta.theme);
  ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Matix Present'); ov.tabIndex = -1;
  ov.innerHTML = '<div class="mxl-top"><span class="mxl-brand">🎯 Matix Present</span><b class="mxl-title">' + esc(quiz.title) + '</b><span class="mxl-pinchip">PIN <b>' + pinFmt(code) + '</b></span>'
    + '<button type="button" class="mxl-ib" id="mxlMute" aria-label="Sound">' + (H.mute ? '🔇' : '🔊') + '</button><button type="button" class="mxl-ib" id="mxlFs" aria-label="Full screen">⛶</button><button type="button" class="mxl-ib" id="mxlX" aria-label="Leave the board">✕</button></div>'
    + '<div class="mxl-main" id="mxlMain"></div>';
  D.body.appendChild(ov); D.body.classList.add('mxl-on'); try { ov.focus(); } catch (e) {}
  $('mxlMute').onclick = function () { H.mute = !H.mute; ls('mxl_mute', H.mute ? '1' : '0'); this.textContent = H.mute ? '🔇' : '🔊'; };
  $('mxlFs').onclick = function () { try { if (D.fullscreenElement) D.exitFullscreen(); else (ov.requestFullscreen || ov.webkitRequestFullscreen).call(ov); } catch (e) {} };
  $('mxlX').onclick = function () {
    var st = (H.S.pub || {}).state;
    if (st !== 'lobby' && st !== 'end' && !confirm(T('Leave the board? The game stays open: you can come back from the Teacher page.'))) return;
    location.hash = '#/teacher';
  };
  H.key = function (e) {
    if (!LV || /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '')) return;
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { var b = ov.querySelector('[data-main]'); if (b && !b.disabled) { e.preventDefault(); b.click(); } }
  };
  D.addEventListener('keydown', H.key);
  syncClock(base + '/clk/host');
  H.hb = heartbeat(code);
  H.w = watch(base, function (s) {
    if (H.dead) return;
    if (!s || !s.pub) { stop(); location.hash = '#/teacher'; toast('The game was closed.'); return; }
    H.S = s; if (!H.S.players) H.S.players = {}; paint();
  });
  H.tk = setInterval(tick, 200);
  paint();

  function players() { var P = H.S.players || {}; return Object.keys(P).map(function (k) { var p = P[k] || {}; return { id: k, name: String(p.name || '?'), av: p.av, score: +p.score || 0, right: +p.right || 0, rank: p.rank, prev: p.prev, joinedAt: p.joinedAt || 0 }; }); }
  function ranked() { return players().sort(function (a, b) { return b.score - a.score || a.joinedAt - b.joinedAt; }); }
  function ansCount(i) { var a = (H.S.ans || {})[i]; return a ? Object.keys(a).length : 0; }
  function setPub(p) { return api(base + '/pub', 'PATCH', p).catch(function () { toast('Could not reach Matix. Check your connection.', 'err'); }); }

  function paint() {
    var pub = H.S.pub || {}, key = pub.state + ':' + pub.i;
    if (key !== H.view) { H.view = key; view(pub); }
    live2(pub);
  }
  /* the parts that change without a new screen */
  function live2(pub) {
    if (pub.state === 'lobby') {
      var ps = players().sort(function (a, b) { return a.joinedAt - b.joinedAt; }), box = $('mxlPlist');
      if (H.lastCount >= 0 && ps.length > H.lastCount) beep(740, .18, .06);
      H.lastCount = ps.length;
      $('mxlCount').textContent = ps.length;
      if (box) box.innerHTML = ps.length ? ps.map(function (p) { return '<button type="button" class="mxl-p" data-pid="' + esc(p.id) + '" title="' + esc(T('Remove')) + ' ' + esc(p.name) + '">' + avHtml(p.av, 46) + '<span>' + esc(p.name) + '</span></button>'; }).join('') : '<p class="mxl-wait">' + esc(T('Waiting for players…')) + '</p>';
      var st = $('mxlStart'); if (st) st.disabled = !ps.length;
      var lk = $('mxlLock'); if (lk) { lk.textContent = pub.locked ? '🔒 ' + T('Locked') : '🔓 ' + T('Open'); lk.setAttribute('aria-pressed', !!pub.locked); }
    } else if (pub.state === 'q') {
      var a = $('mxlAns'); if (a) a.textContent = ansCount(pub.i);
      var t = $('mxlOf'); if (t) t.textContent = '/ ' + players().length;
    }
  }
  function tiles(q, pub, rev) {
    if (q.type === 'type') {
      if (!rev) return '<div class="mxl-typed">⌨️ <span>Type your answer on your device</span></div>';
      var right = players().filter(function (p) { var l = ((H.S.players || {})[p.id] || {}).last; return l && l.i === pub.i && l.ok; }).length;
      return '<div class="mxl-typed ok"><span>Right answer:</span> <b>' + esc(q.answers.join('  ·  ')) + '</b><small>' + right + ' / ' + players().length + ' ' + esc(T('got it right')) + '</small></div>';
    }
    var sg = signs(q.type, q.choices.length), counts = arr(pub.counts), cor = arr(pub.correct).map(Number), max = Math.max.apply(null, [1].concat(counts));
    var bars = rev ? '<div class="mxl-bars">' + sg.map(function (s, k) { var v = +counts[k] || 0; return '<div class="mxl-bar" style="--c:' + s.c + '"><b>' + v + '</b><i style="height:' + Math.round(8 + 92 * v / max) + '%"></i><span>' + s.s + (cor.indexOf(k) > -1 ? ' ✓' : '') + '</span></div>'; }).join('') + '</div>' : '';
    return bars + '<div class="mxl-tiles n' + sg.length + '">' + sg.map(function (s, k) {
      var label = q.type === 'tf' ? T(k ? 'False' : 'True') : q.choices[k], ok = cor.indexOf(k) > -1;
      return '<div class="mxl-tile' + (rev && q.type !== 'poll' ? (ok ? ' ok' : ' dim') : '') + '" style="--c:' + s.c + '"><span class="mxl-sg">' + s.s + '</span><span class="mxl-tt">' + esc(label) + '</span>' + (rev && ok && q.type !== 'poll' ? '<span class="mxl-ck">✓</span>' : '') + '</div>';
    }).join('') + '</div>';
  }
  function qHead(q, pub) {
    var ti = typeInfo(q.type);
    return '<div class="mxl-qhead"><span class="mxl-qn"><span>Question</span> ' + (pub.i + 1) + ' / ' + n() + '</span><span class="mxl-qt">' + ti[1] + ' ' + esc(T(ti[2])) + '</span>' + (q.points === 2 ? '<span class="mxl-x2">×2 <span>Double points</span></span>' : '') + '</div>'
      + (q.q ? '<h1 class="mxl-qtext' + (q.q.length > 90 ? ' long' : '') + '">' + esc(q.q) + '</h1>' : '');
  }
  function view(pub) {
    var m = $('mxlMain'); if (!m) return;
    var st = pub.state, i = pub.i, q = i >= 0 ? qAt(i) : null;
    m.className = 'mxl-main st-' + st;
    if (st === 'lobby') {
      m.innerHTML = '<div class="mxl-lobby"><div class="mxl-joinbox"><div class="mxl-jt"><span>Go to</span><b class="mxl-url">' + esc(location.host) + '/join</b><span>and type the Game PIN:</span><b class="mxl-pin">' + pinFmt(code) + '</b><span class="mxl-or">or scan the code with a phone or tablet</span></div>'
        + '<button type="button" class="mxl-qr" id="mxlQr" aria-label="Make the QR code bigger"></button></div>'
        + '<div class="mxl-pl"><div class="mxl-plh"><span class="mxl-cnt"><b id="mxlCount">0</b> <span>players</span></span><span class="mxl-sp"></span>'
        + '<button type="button" class="mxl-b sec" id="mxlLock" aria-pressed="false">🔓 Open</button><button type="button" class="mxl-b sec" id="mxlLink">🔗 <span>Copy join link</span></button><button type="button" class="mxl-b pri" id="mxlStart" data-main disabled>▶ <span>Start</span></button></div>'
        + '<div class="mxl-plist" id="mxlPlist"></div><p class="mxl-hint">Students can change their avatar until you press Start. Click a player to remove them.</p></div></div>';
      var qr = $('mxlQr');
      try { var g = qrcode(0, 'M'); g.addData(joinUrl); g.make(); qr.innerHTML = g.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); } catch (e) { qr.innerHTML = '<small>' + esc(joinUrl) + '</small>'; }
      qr.onclick = function () { qr.classList.toggle('big'); };
      $('mxlLink').onclick = function () { copy(joinUrl); };
      $('mxlLock').onclick = function () { setPub({ locked: !(H.S.pub || {}).locked }); };
      $('mxlStart').onclick = function () { this.disabled = true; goQ(0); };
      $('mxlPlist').onclick = function (e) {
        var b = e.target.closest('[data-pid]'); if (!b) return;
        var p = (H.S.players || {})[b.dataset.pid]; if (!p || !confirm(T('Remove this player?') + ' ' + p.name)) return;
        api(base + '/players/' + enc(b.dataset.pid), 'DELETE').catch(function () {});
      };
    } else if (st === 'q' && q) {
      H.beeped = {};
      m.innerHTML = qHead(q, pub) + '<div class="mxl-mid"><div class="mxl-timer" id="mxlTimer" style="--p:1"><b id="mxlLeft">' + (pub.dur || q.time) + '</b></div>' + (media(q.media, true) || '<div class="mxl-media mxl-nomedia">' + avHtml(Math.floor(Math.random() * AV.length), 120) + '</div>')
        + '<div class="mxl-acount"><b id="mxlAns">0</b><span id="mxlOf"></span><small>answers</small></div></div>'
        + tiles(q, pub, false) + '<div class="mxl-ctl"><button type="button" class="mxl-b sec" id="mxlSkip" data-main>⏭ <span>Stop the timer</span></button></div>';
      $('mxlSkip').onclick = function () { this.disabled = true; reveal(); };
      beep(523, .12); setTimeout(function () { beep(784, .18); }, 120);
    } else if (st === 'reveal' && q) {
      m.innerHTML = qHead(q, pub) + tiles(q, pub, true) + '<div class="mxl-ctl"><button type="button" class="mxl-b pri" id="mxlNext" data-main>🏆 <span>Leaderboard</span> →</button></div>';
      $('mxlNext').onclick = function () { setPub({ state: 'board' }); };
      beep(880, .25, .07);
    } else if (st === 'board') {
      var R = ranked(), top = R.slice(0, 5), last = i >= n() - 1;
      m.innerHTML = '<div class="mxl-board"><h1>🏆 <span>Leaderboard</span></h1>' + (top.length ? '<ol>' + top.map(function (p, k) {
        var mv = p.prev && p.rank ? p.prev - p.rank : 0;
        return '<li style="--d:' + (k * 90) + 'ms"><span class="mxl-rk">' + (k + 1) + '</span>' + avHtml(p.av, 52) + '<b>' + esc(p.name) + '</b>' + (mv > 0 ? '<span class="mxl-mv">▲ ' + mv + '</span>' : '') + '<span class="mxl-sc">' + p.score + '</span></li>';
      }).join('') + '</ol>' : '<p class="mxl-wait">No players.</p>')
        + '<div class="mxl-ctl"><button type="button" class="mxl-b pri" id="mxlNext" data-main>' + (last ? '🏁 <span>Final results</span>' : '<span>Next question</span> →') + '</button></div></div>';
      $('mxlNext').onclick = function () { this.disabled = true; if (last) setPub({ state: 'end' }); else goQ(i + 1); };
    } else if (st === 'end') {
      var E = ranked(), pod = [E[1], E[0], E[2]];
      m.innerHTML = '<div class="mxl-end"><h1>🏁 ' + esc(quiz.title || 'Matix Present') + '</h1><div class="mxl-podium">' + pod.map(function (p, k) {
        if (!p) return '<div class="mxl-pod empty"></div>';
        var pl = [2, 1, 3][k];
        return '<div class="mxl-pod p' + pl + '">' + avHtml(p.av, pl === 1 ? 96 : 72) + '<b>' + esc(p.name) + '</b><span>' + p.score + '</span><div class="mxl-step">' + ['🥇', '🥈', '🥉'][pl - 1] + '<i>' + pl + '</i></div></div>';
      }).join('') + '</div>'
        + '<div class="mxl-ctl"><button type="button" class="mxl-b sec" id="mxlAll">📋 <span>All results</span></button><button type="button" class="mxl-b sec" id="mxlCsv">⬇ <span>Download results</span></button><button type="button" class="mxl-b sec" id="mxlAgain">↻ <span>Play again</span></button><button type="button" class="mxl-b pri" id="mxlClose" data-main>✕ <span>Close the game</span></button></div>'
        + '<div class="mxl-all" id="mxlAllBox" hidden><table><thead><tr><th>#</th><th>Name</th><th>Score</th><th>Right answers</th></tr></thead><tbody>' + E.map(function (p, k) { return '<tr><td>' + (k + 1) + '</td><td>' + esc(p.name) + '</td><td>' + p.score + '</td><td>' + p.right + ' / ' + n() + '</td></tr>'; }).join('') + '</tbody></table></div>'
        + confetti() + '</div>';
      $('mxlAll').onclick = function () { var b = $('mxlAllBox'); b.hidden = !b.hidden; };
      $('mxlCsv').onclick = function () { csv(E); };
      $('mxlAgain').onclick = function () { this.disabled = true; startLive(quiz, null); };
      $('mxlClose').onclick = function () { if (!confirm(T('Close this game? Students will see that it ended.'))) return; closeGame(code).then(function () { location.hash = '#/teacher'; }); };
      [523, 659, 784, 1047].forEach(function (f, k) { setTimeout(function () { beep(f, .3, .07); }, k * 140); });
    }
  }
  function tick() {
    if (!LV || H.dead) return;
    var pub = H.S.pub || {};
    if (pub.state !== 'q' || typeof pub.startAt !== 'number' || H.revealing) return;
    var dur = +pub.dur || 20, left = dur - (now() - pub.startAt) / 1000, el = $('mxlLeft'), tm = $('mxlTimer');
    if (el) el.textContent = Math.max(0, Math.ceil(left));
    if (tm) { tm.style.setProperty('--p', clamp(left / dur, 0, 1)); tm.classList.toggle('low', left <= 5); }
    var s = Math.ceil(left); if (s <= 5 && s > 0 && !H.beeped[s]) { H.beeped[s] = 1; beep(440, .08, .05); }
    var np = players().length;
    if (pub.scored === pub.i) return;
    if (left <= 0 || (np > 0 && ansCount(pub.i) >= np)) reveal();
  }
  function goQ(i) {
    var q = qAt(i); if (!q) return;
    H.revealing = false;
    var p = { state: 'q', i: i, type: q.type, nc: q.type === 'type' ? 0 : q.choices.length, dur: q.time || 20, startAt: TS, points: q.points, correct: null, counts: null, q: null, ch: null };
    if (quiz.onDevice) { p.q = q.q || null; p.ch = q.type === 'type' || q.type === 'tf' ? null : q.choices; }
    return setPub(p);
  }
  /* the board checks every answer and writes the scores */
  function reveal() {
    if (H.revealing) return; H.revealing = true;
    var pub = H.S.pub || {}, i = pub.i, q = qAt(i);
    if (!q || pub.scored === i) { H.revealing = false; return; }
    api(base + '/ans/' + i).then(function (ans) {
      ans = ans || {};
      var P = H.S.players || {}, upd = {}, counts = (q.choices || []).map(function () { return 0; }), dur = (+pub.dur || 20) * 1000, sc = {}, before = {};
      ranked().forEach(function (p, k) { before[p.id] = k + 1; });
      Object.keys(P).forEach(function (pid) {
        var p = P[pid] || {}, a = ans[pid], on = !!(a && typeof a.at === 'number' && a.at <= pub.startAt + dur + 1500), ok = null, pts = 0, st = +p.streak || 0;
        if (on && q.type !== 'type') (Array.isArray(a.c) ? a.c : [a.c]).forEach(function (k) { if (counts[+k] != null) counts[+k]++; });
        if (q.type !== 'poll') {
          ok = on && judge(q, a.c);
          if (ok) { st++; var el = clamp((a.at - pub.startAt) / dur, 0, 1); pts = q.points ? Math.round(1000 * (1 - el / 2)) * q.points + Math.min(st - 1, 5) * 100 : 0; } else st = 0;
        }
        sc[pid] = (+p.score || 0) + pts;
        upd[pid + '/score'] = sc[pid]; upd[pid + '/streak'] = st; upd[pid + '/right'] = (+p.right || 0) + (ok ? 1 : 0);
        upd[pid + '/last'] = { i: i, ok: ok, pts: pts, ans: on };
      });
      Object.keys(sc).sort(function (a, b) { return sc[b] - sc[a] || ((P[a] || {}).joinedAt || 0) - ((P[b] || {}).joinedAt || 0); })
        .forEach(function (pid, k) { upd[pid + '/rank'] = k + 1; upd[pid + '/prev'] = before[pid] || k + 1; });
      return (Object.keys(upd).length ? api(base + '/players', 'PATCH', upd) : Promise.resolve())
        .then(function () { return api(base + '/pub', 'PATCH', { state: 'reveal', correct: q.type === 'poll' || q.type === 'type' ? null : q.correct, counts: counts.length ? counts : null, scored: i }); });
    }).catch(function () { H.revealing = false; toast('Could not reach Matix. Check your connection.', 'err'); });
  }
  function csv(E) {
    var rows = [[T('Rank'), T('Name'), T('Score'), T('Right answers'), T('Questions')]].concat(E.map(function (p, k) { return [k + 1, p.name, p.score, p.right, n()]; }));
    var s = rows.map(function (r) { return r.map(function (x) { x = String(x); if (/^[=+\-@]/.test(x)) x = "'" + x; return '"' + x.replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
    var a = D.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + s], { type: 'text/csv' }));
    a.download = (quiz.title || 'Matix Present').replace(/[\\\/:*?"<>|]/g, '') + ' - ' + T('results') + '.csv'; D.body.appendChild(a); a.click(); a.remove();
  }
}
function confetti() {
  var cs = ['#e53950', '#2f6fe0', '#e0a100', '#1f9d55', '#fff', '#a855f7'], out = '';
  for (var k = 0; k < 60; k++) out += '<i style="left:' + Math.round(Math.random() * 100) + '%;background:' + cs[k % cs.length] + ';animation-delay:' + (Math.random() * 2.5).toFixed(2) + 's;animation-duration:' + (2.5 + Math.random() * 2.5).toFixed(2) + 's"></i>';
  return '<div class="mxl-confetti" aria-hidden="true">' + out + '</div>';
}

/* =====================================================================
   🎯 Matix Present: the student's device (/join). No account needed.
   ===================================================================== */
function player(root, code0) {
  var P = { code: '', pid: '', ws: [], answered: {}, view: '', checked: {} };
  function closeAll() { P.ws.forEach(function (w) { w.close(); }); P.ws = []; clearInterval(P.tk); clearInterval(P.hb); }
  function card(h) { root.dataset.mood = ''; root.innerHTML = '<div class="mxj-card">' + h + '</div>'; }
  function codeScreen(err, val) {
    closeAll(); P.view = '';
    card('<div class="mxj-logo">🎯 Matix Present</div><h1>Join a game</h1><p class="sub">Type the Game PIN you see on the board.</p>'
      + '<form id="jf"><input id="jc" class="mxj-pin" inputmode="numeric" autocomplete="off" maxlength="7" placeholder="Game PIN" aria-label="Game PIN" value="' + esc(val || '') + '">'
      + '<div class="err" id="je" role="alert">' + esc(err ? T(err) : '') + '</div><button class="mxj-go" id="jgo">Enter</button></form><p class="mxj-foot">No account needed.</p>');
    var inp = $('jc'); inp.focus();
    inp.oninput = function () { var d = this.value.replace(/\D/g, '').slice(0, 6); this.value = d.length > 3 ? d.slice(0, 3) + ' ' + d.slice(3) : d; };
    inp.oninput.call(inp);
    $('jf').onsubmit = function (e) { e.preventDefault(); var c = inp.value.replace(/\D/g, ''); if (c.length !== 6) { $('je').textContent = T('The Game PIN has 6 digits.'); return; } $('jgo').disabled = true; tryCode(c); };
  }
  function tryCode(code) {
    stale(code).then(function (gone) { return Promise.all([gone ? null : api('/mxlive/' + code + '/pub'), JSON.parse(ss('mxj_' + code) || 'null'), gone]); }).then(function (r) {
      var pub = r[0], saved = r[1];
      if (r[2]) return codeScreen('That game stopped because nobody had it open for more than a minute.', code);
      if (!pub) return codeScreen('No game with that PIN. Check the board.', code);
      if (pub.state === 'end') return codeScreen('That game has finished.', code);
      P.code = code; P.title = pub.title || '';
      try { history.replaceState(null, '', '/join/?c=' + code); } catch (e) {}
      if (saved && saved.pid) return api('/mxlive/' + code + '/players/' + saved.pid).then(function (p) { if (p) { P.pid = saved.pid; play(); } else if (pub.locked) codeScreen('The teacher locked this game.', code); else nameScreen(); });
      if (pub.locked) return codeScreen('The teacher locked this game.', code);
      nameScreen();
    }).catch(function () { codeScreen('Could not reach Matix. Check your connection.', code); });
  }
  function nameScreen() {
    var av = Math.floor(Math.random() * AV.length), last = ls('mxj_name') || '';
    card('<p class="mxj-game">PIN ' + pinFmt(P.code) + (P.title ? ' · ' + esc(P.title) : '') + '</p><h1>Your name and avatar</h1><div class="mxj-me" id="jMe">' + avHtml(av, 104) + '</div>'
      + '<form id="nf"><input id="jn" class="mxj-name" maxlength="16" autocomplete="off" placeholder="Your name" aria-label="Your name" value="' + esc(last) + '">'
      + '<div class="mxj-avs" id="jAvs">' + AV.map(function (a, k) { return '<button type="button" data-av="' + k + '" aria-label="' + esc(T(a[2])) + '" aria-pressed="' + (k === av) + '">' + avHtml(k, 50) + '</button>'; }).join('') + '</div>'
      + '<div class="err" id="je" role="alert"></div><button class="mxj-go" id="jgo">Join</button></form><button type="button" class="mxj-link" id="jBack">← Different PIN</button>');
    $('jn').focus();
    $('jAvs').onclick = function (e) { var b = e.target.closest('[data-av]'); if (!b) return; av = +b.dataset.av; $('jMe').innerHTML = avHtml(av, 104); this.querySelectorAll('[data-av]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); };
    $('jBack').onclick = function () { codeScreen(); };
    $('nf').onsubmit = function (e) {
      e.preventDefault();
      var name = $('jn').value.replace(/\s+/g, ' ').trim().slice(0, 16), er = $('je');
      if (!name) { er.textContent = T('Type your name.'); return; }
      $('jgo').disabled = true;
      Promise.all([api('/mxlive/' + P.code + '/players'), api('/mxlive/' + P.code + '/pub')]).then(function (r) {
        var pl = r[0] || {}, pub = r[1];
        if (!pub || pub.state === 'end') { codeScreen('That game has finished.'); return; }
        if (pub.locked) { codeScreen('The teacher locked this game.'); return; }
        var taken = Object.keys(pl).some(function (k) { return pl[k] && String(pl[k].name || '').toLowerCase() === name.toLowerCase(); });
        if (taken) { er.textContent = T('Someone already has that name. Try another one.'); $('jgo').disabled = false; return; }
        var pid = 'p' + rid(10);
        return api('/mxlive/' + P.code + '/players/' + pid, 'PUT', { name: name, av: av, score: 0, streak: 0, right: 0, joinedAt: TS }).then(function () {
          ls('mxj_name', name); ss('mxj_' + P.code, JSON.stringify({ pid: pid })); P.pid = pid; play();
        });
      }).catch(function () { $('jgo').disabled = false; er.textContent = T('Could not reach Matix. Check your connection.'); });
    };
  }
  function play() {
    closeAll(); P.view = ''; P.pub = null; P.me = null; P.gotPub = false; P.seen = false;
    card('<p class="sub">Loading…</p>');
    var base = '/mxlive/' + P.code;
    syncClock(base + '/clk/' + P.pid);
    P.hb = heartbeat(P.code);
    P.ws.push(watch(base + '/pub', function (v) { P.pub = v; P.gotPub = true; render(); }));
    P.ws.push(watch(base + '/players/' + P.pid, function (v) { if (v) P.seen = true; P.me = v; render(); }));
    P.tk = setInterval(tickP, 250);
  }
  function bar(me) { return '<div class="mxj-bar">' + avHtml(me.av, 34) + '<b>' + esc(me.name) + '</b><span class="mxj-sp"></span><span class="mxj-sc">' + (+me.score || 0) + '</span></div>'; }
  function left() { var p = P.pub || {}; return typeof p.startAt === 'number' ? (+p.dur || 20) - (now() - p.startAt) / 1000 : (+p.dur || 20); }
  function ended(kind) {
    closeAll(); ss('mxj_' + P.code, null);
    card('<div class="mxj-big">' + (kind === 'kicked' ? '<div class="mxj-emo">🚪</div><h1>You were removed from the game</h1>' : '<div class="mxj-emo">👋</div><h1>The game was closed</h1>')
      + '<button type="button" class="mxj-go" id="jAgain">Join a game</button></div>');
    $('jAgain').onclick = function () { codeScreen(); };
  }
  function render() {
    var pub = P.pub, me = P.me;
    if (P.gotPub && !pub) return ended('closed');
    if (P.seen && !me) return ended('kicked');
    if (!pub || !me) return;
    var st = pub.state, i = pub.i, last = me.last || {}, up = left() <= 0;
    var key = [st, i, P.answered[i] ? 1 : 0, last.i, st === 'lobby' ? me.av : '', st === 'q' ? up : '', me.rank, me.score].join(':');
    if (key === P.view) return; P.view = key;
    root.dataset.mood = '';
    if (st === 'lobby') {
      card(bar(me) + '<div class="mxj-big">' + avHtml(me.av, 120) + '<h1>You’re in!</h1><p>See your name on the board?</p><p class="sub">Wait for your teacher to start.</p></div>'
        + '<p class="mxj-lab">Change your avatar</p><div class="mxj-avs sm" id="jAvs">' + AV.map(function (a, k) { return '<button type="button" data-av="' + k + '" aria-label="' + esc(T(a[2])) + '" aria-pressed="' + (k === +me.av) + '">' + avHtml(k, 44) + '</button>'; }).join('') + '</div>');
      $('jAvs').onclick = function (e) { var b = e.target.closest('[data-av]'); if (!b) return; api('/mxlive/' + P.code + '/players/' + P.pid, 'PATCH', { av: +b.dataset.av }).catch(function () {}); };
    } else if (st === 'q') {
      if (!P.answered[i] && !P.checked[i]) {
        P.checked[i] = true; /* after a reload: did I already answer? */
        api('/mxlive/' + P.code + '/ans/' + i + '/' + P.pid).then(function (a) { if (a) { P.answered[i] = true; P.view = ''; render(); } }).catch(function () {});
      }
      if (P.answered[i]) { card(bar(me) + '<div class="mxj-big"><div class="mxj-emo spin">⏳</div><h1>Answer sent!</h1><p>Look at the board…</p></div>'); return; }
      if (up) { card(bar(me) + '<div class="mxj-big"><div class="mxj-emo">⏰</div><h1>Time’s up!</h1></div>'); return; }
      var type = pub.type, ch = arr(pub.ch), sg = signs(type, pub.nc || ch.length || 4), h = bar(me)
        + '<div class="mxj-qbar"><span><span>Question</span> ' + (i + 1) + '</span><b id="jT" class="mxj-t">' + Math.ceil(left()) + '</b></div>'
        + (pub.q ? '<div class="mxj-qtext">' + esc(pub.q) + '</div>' : '<p class="mxj-look">👀 <span>Look at the board</span></p>');
      if (type === 'type') {
        h += '<form id="tf" class="mxj-type"><input id="ti" maxlength="40" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type your answer" aria-label="Your answer"><button class="mxj-go">Send</button></form>';
      } else {
        h += '<div class="mxj-tiles n' + sg.length + '">' + sg.map(function (s, k) {
          var lbl = type === 'tf' ? T(k ? 'False' : 'True') : (ch[k] || '');
          return '<button type="button" class="mxj-tile" data-k="' + k + '" style="--c:' + s.c + '" aria-label="' + esc(type === 'tf' ? lbl : T(s.n) + (lbl ? ': ' + lbl : '')) + '" aria-pressed="false"><span>' + s.s + '</span>' + (lbl ? '<small>' + esc(lbl) + '</small>' : '') + '</button>';
        }).join('') + '</div>' + (type === 'multi' ? '<p class="mxj-hint">Pick every right answer, then press Send.</p><button type="button" class="mxj-go" id="ms" disabled>Send</button>' : '');
      }
      card(h);
      if (type === 'type') { $('ti').focus(); $('tf').onsubmit = function (e) { e.preventDefault(); var v = $('ti').value.trim(); if (v) send(i, v); }; }
      else root.querySelectorAll('.mxj-tile').forEach(function (b) { b.onclick = function () {
        if (type !== 'multi') { send(i, +b.dataset.k); return; }
        var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); b.classList.toggle('on', on);
        $('ms').disabled = !root.querySelector('.mxj-tile.on'); }; });
      if ($('ms')) $('ms').onclick = function () { var picks = []; root.querySelectorAll('.mxj-tile.on').forEach(function (b) { picks.push(+b.dataset.k); }); if (picks.length) send(i, picks); };
    } else if (st === 'reveal') {
      if (last.i !== i) { card(bar(me) + '<div class="mxj-big"><div class="mxj-emo spin">⏳</div><h1>Checking answers…</h1></div>'); return; }
      var mood = last.ok === null || last.ok === undefined ? (pub.type === 'poll' ? 'poll' : 'no') : last.ok ? 'ok' : 'no';
      var head = pub.type === 'poll' ? (last.ans ? '<div class="mxj-emo">📊</div><h1>Thanks for voting!</h1>' : '<div class="mxj-emo">⏰</div><h1>No vote this time</h1>')
        : last.ok ? '<div class="mxj-emo">✅</div><h1>Correct!</h1><p class="mxj-pts">+' + (last.pts || 0) + '</p>' + ((+me.streak || 0) > 1 ? '<p class="mxj-streak">🔥 <span>Answer streak</span> ' + me.streak + '</p>' : '')
        : last.ans ? '<div class="mxj-emo">❌</div><h1>Not this time</h1><p>Keep going, you’ve got the next one!</p>' : '<div class="mxj-emo">⏰</div><h1>No answer</h1>';
      card(bar(me) + '<div class="mxj-big">' + head + (me.rank ? '<p class="mxj-rank"><span>You are in</span> <b>' + place(me.rank) + '</b> <span>place</span></p>' : '') + '</div>');
      root.dataset.mood = mood;
      try { if (navigator.vibrate) navigator.vibrate(last.ok ? 40 : [60, 60, 60]); } catch (e) {}
    } else if (st === 'board') {
      var mv = me.prev && me.rank ? me.prev - me.rank : 0;
      card(bar(me) + '<div class="mxj-big"><div class="mxj-emo">🏆</div><h1><span>You are in</span> ' + place(me.rank || 1) + ' <span>place</span></h1><p class="mxj-pts">' + (+me.score || 0) + ' <span>points</span></p>' + (mv > 0 ? '<p class="mxj-streak">▲ ' + mv + '</p>' : '') + '<p>Look at the board…</p></div>');
    } else if (st === 'end') {
      var r = me.rank || 1;
      card(bar(me) + '<div class="mxj-big"><div class="mxj-emo">' + (r <= 3 ? ['🥇', '🥈', '🥉'][r - 1] : '🏁') + '</div><h1>Game over</h1><p class="mxj-rank"><span>You finished in</span> <b>' + place(r) + '</b> <span>place</span></p><p class="mxj-pts">' + (+me.score || 0) + ' <span>points</span></p>'
        + '<p>' + (+me.right || 0) + ' <span>right answers</span></p><button type="button" class="mxj-go" id="jAgain">Join another game</button></div>' + (r <= 3 ? confetti() : ''));
      $('jAgain').onclick = function () { ss('mxj_' + P.code, null); codeScreen(); };
    }
  }
  function send(i, c) {
    P.answered[i] = true; P.view = ''; render();
    try { if (navigator.vibrate) navigator.vibrate(25); } catch (e) {}
    api('/mxlive/' + P.code + '/ans/' + i + '/' + P.pid, 'PUT', { c: c, at: TS }).catch(function () { P.answered[i] = false; P.view = ''; render(); toast('Could not send. Try again.', 'err'); });
  }
  function tickP() {
    var p = P.pub; if (!p || p.state !== 'q' || P.answered[p.i]) return;
    var t = $('jT'), l = left();
    if (t) { t.textContent = Math.max(0, Math.ceil(l)); t.classList.toggle('low', l <= 5); }
    if (l <= 0) render();
  }
  var c0 = String(code0 || '').replace(/\D/g, '');
  if (c0.length === 6) { card('<p class="sub">Loading…</p>'); tryCode(c0); } else codeScreen();
}

/* ---------------- French ---------------- */
if (W.trAdd) W.trAdd({
  'Teacher': 'Enseignant', 'New quiz': 'Nouveau quiz', 'Edit quiz': 'Modifier le quiz', '➕ New quiz': '➕ Nouveau quiz', '🎯 Student join page': '🎯 Page pour rejoindre (élèves)', '📚 My quizzes': '📚 Mes quiz', '🎞️ My slideshows': '🎞️ Mes diaporamas',
  'Make quizzes, then run them live on the smart board with 🎯 Matix Present. Students join at ': 'Crée des quiz, puis lance-les en direct sur le tableau avec 🎯 Matix Present. Les élèves rejoignent sur ',
  ' with the Game PIN. They do not need an account.': ' avec le code PIN. Ils n’ont pas besoin de compte.',
  'Your exercise sets from Interactive games → In class → Presentation mode. Each one has its own link that anybody can open, no account needed.': 'Tes séries d’exercices de Jeux interactifs → En classe → Mode présentation. Chacune a son propre lien que tout le monde peut ouvrir, sans compte.',
  'No quizzes yet.': 'Pas encore de quiz.', '✨ Make a sample quiz': '✨ Créer un quiz d’exemple', 'question': 'question', 'questions': 'questions', 'Untitled quiz': 'Quiz sans titre', '✏️ Edit': '✏️ Modifier', 'Duplicate': 'Dupliquer', 'Delete': 'Supprimer', 'copy': 'copie',
  'Delete this quiz?': 'Supprimer ce quiz ?', '⧉ Quiz copied': '⧉ Quiz copié', '🟢 Games still open': '🟢 Parties encore ouvertes', '↩ Resume': '↩ Reprendre', '✕ Close': '✕ Fermer', '▶ Open': '▶ Ouvrir', '🔗 Copy link': '🔗 Copier le lien', 'slides': 'diapos', 'Untitled': 'Sans titre',
  'Make one in Interactive games → In class → Presentation mode.': 'Crée-en un dans Jeux interactifs → En classe → Mode présentation.', 'No slideshows yet. ': 'Pas encore de diaporama. ', '🔗 Link copied': '🔗 Lien copié', 'Copy this link:': 'Copie ce lien :',
  '← My quizzes': '← Mes quiz', 'Quiz title': 'Titre du quiz', 'Style': 'Style', 'Galaxy': 'Galaxie', 'Ocean': 'Océan', 'Candy': 'Bonbons', 'Volcano': 'Volcan', 'Arctic': 'Arctique', 'Robots': 'Robots', 'Pirates': 'Pirates', 'Chalkboard': 'Tableau noir', 'Grape': 'Raisin', 'Jungle': 'Jungle',
  ' Also show the question and answers on the students’ devices': ' Afficher aussi la question et les réponses sur les appareils des élèves', ' Shuffle the question order each game': ' Mélanger l’ordre des questions à chaque partie',
  'Quiz': 'Quiz', 'True or false': 'Vrai ou faux', 'Multiple answers': 'Plusieurs réponses', 'Type answer': 'Réponse à taper', 'Poll': 'Sondage', 'True': 'Vrai', 'False': 'Faux',
  'Question': 'Question', 'Time limit': 'Temps limite', 'Points': 'Points', 'Standard': 'Normal', 'Double points': 'Points doublés', 'No points': 'Sans points', 'Picture or video link (optional)': 'Lien d’image ou de vidéo (facultatif)',
  'Accepted answers (comma separated)': 'Réponses acceptées (séparées par des virgules)', 'Numbers that are equal count as right: 1/2, 0.5 and 0,5 are the same. Capitals and accents do not matter.': 'Les nombres égaux sont acceptés : 1/2, 0.5 et 0,5 sont pareils. Les majuscules et les accents ne comptent pas.',
  'Answer': 'Réponse', '(optional)': '(facultatif)', 'Right answer': 'Bonne réponse', 'Tick the right answer.': 'Coche la bonne réponse.', 'Tick every right answer. Students must pick all of them.': 'Coche toutes les bonnes réponses. Les élèves doivent toutes les choisir.',
  'A poll has no right answer and gives no points: it shows what the class thinks.': 'Un sondage n’a pas de bonne réponse et ne donne pas de points : il montre ce que pense la classe.',
  'Add a question:': 'Ajouter une question :', '✨ Math question maker': '✨ Générateur de questions de maths', 'Add 5 ready-made questions for': 'Ajouter 5 questions toutes prêtes pour', 'Add 5 questions': 'Ajouter 5 questions', '✨ 5 questions added': '✨ 5 questions ajoutées',
  '💾 Save': '💾 Enregistrer', '▶ Save and start Matix Present': '▶ Enregistrer et lancer Matix Present', 'Cancel': 'Annuler', '✅ Quiz saved': '✅ Quiz enregistré', 'My quiz': 'Mon quiz',
  'write the question.': 'écris la question.', 'add at least one accepted answer.': 'ajoute au moins une réponse acceptée.', 'add at least 2 answers.': 'ajoute au moins 2 réponses.', 'tick the right answer.': 'coche la bonne réponse.', 'tick at least one right answer.': 'coche au moins une bonne réponse.',
  'e.g. Fractions challenge': 'ex. Défi fractions', 'e.g. 0.75, 3/4': 'ex. 0,75, 3/4', 'e.g. 0.5 is the same as 1/2': 'ex. 0,5 est égal à 1/2',
  'Could not save. Check your connection.': 'Impossible d’enregistrer. Vérifie ta connexion.', 'Could not start the game. Check your connection.': 'Impossible de lancer la partie. Vérifie ta connexion.', 'Could not reach Matix. Check your connection.': 'Impossible de joindre Matix. Vérifie ta connexion.',
  'Go to': 'Va sur', 'and type the Game PIN:': 'et tape le code PIN :', 'or scan the code with a phone or tablet': 'ou scanne le code avec un téléphone ou une tablette', 'players': 'joueurs', 'Open': 'Ouvert', 'Locked': 'Verrouillé', 'Copy join link': 'Copier le lien', 'Start': 'Commencer',
  'Students can change their avatar until you press Start. Click a player to remove them.': 'Les élèves peuvent changer d’avatar jusqu’à ce que tu appuies sur Commencer. Clique sur un joueur pour le retirer.',
  'Waiting for players…': 'En attente des joueurs…', 'Remove this player?': 'Retirer ce joueur ?', 'Remove': 'Retirer', 'answers': 'réponses', 'Stop the timer': 'Arrêter le chrono', 'Leaderboard': 'Classement', 'Next question': 'Question suivante', 'Final results': 'Résultats finaux',
  'Type your answer on your device': 'Tape ta réponse sur ton appareil', 'Right answer:': 'Bonne réponse :', 'got it right': 'ont trouvé', 'All results': 'Tous les résultats', 'Download results': 'Télécharger les résultats', 'Play again': 'Rejouer', 'Close the game': 'Fermer la partie',
  'Name': 'Nom', 'Score': 'Score', 'Right answers': 'Bonnes réponses', 'Rank': 'Rang', 'Questions': 'Questions', 'results': 'résultats', 'No players.': 'Aucun joueur.',
  'Leave the board? The game stays open: you can come back from the Teacher page.': 'Quitter le tableau ? La partie reste ouverte : tu peux revenir depuis la page Enseignant.', 'Close this game? Students will see that it ended.': 'Fermer cette partie ? Les élèves verront qu’elle est terminée.',
  'The game was closed.': 'La partie a été fermée.', 'This game is closed': 'Cette partie est fermée', 'This Matix Present game does not exist any more.': 'Cette partie Matix Present n’existe plus.', 'Only the teacher can run this board': 'Seul l’enseignant peut lancer ce tableau',
  'This game belongs to': 'Cette partie appartient à', 'Students join at': 'Les élèves rejoignent sur', 'Quiz not found': 'Quiz introuvable', 'The quiz for this game was deleted.': 'Le quiz de cette partie a été supprimé.', 'Could not reach Matix': 'Impossible de joindre Matix', 'Check your connection and try again.': 'Vérifie ta connexion et réessaie.',
  'Loading Matix Present…': 'Chargement de Matix Present…', 'Matix Present is open.': 'Matix Present est ouvert.', '← Teacher': '← Enseignant', '🍎 Teacher': '🍎 Enseignant', '🎯 Join a game': '🎯 Rejoindre une partie',
  'Join a game': 'Rejoindre une partie', 'Type the Game PIN you see on the board.': 'Tape le code PIN affiché au tableau.', 'Game PIN': 'Code PIN', 'Enter': 'Entrer', 'No account needed.': 'Pas besoin de compte.', 'The Game PIN has 6 digits.': 'Le code PIN a 6 chiffres.',
  'No game with that PIN. Check the board.': 'Aucune partie avec ce code. Regarde le tableau.', 'That game has finished.': 'Cette partie est terminée.', 'The teacher locked this game.': 'L’enseignant a verrouillé cette partie.',
  'Your name and avatar': 'Ton nom et ton avatar', 'Your name': 'Ton nom', 'Join': 'Rejoindre', '← Different PIN': '← Autre code', 'Type your name.': 'Tape ton nom.', 'Someone already has that name. Try another one.': 'Quelqu’un a déjà ce nom. Essaie un autre.',
  'You’re in!': 'Tu es dedans !', 'See your name on the board?': 'Tu vois ton nom au tableau ?', 'Wait for your teacher to start.': 'Attends que ton enseignant commence.', 'Change your avatar': 'Change ton avatar',
  'Answer sent!': 'Réponse envoyée !', 'Look at the board…': 'Regarde le tableau…', 'Look at the board': 'Regarde le tableau', 'Time’s up!': 'Temps écoulé !', 'Type your answer': 'Tape ta réponse', 'Your answer': 'Ta réponse', 'Send': 'Envoyer', 'Pick every right answer, then press Send.': 'Choisis toutes les bonnes réponses, puis appuie sur Envoyer.',
  'Checking answers…': 'Vérification des réponses…', 'Thanks for voting!': 'Merci d’avoir voté !', 'No vote this time': 'Pas de vote cette fois', 'Correct!': 'Bravo !', 'Answer streak': 'Série de bonnes réponses', 'Not this time': 'Pas cette fois', 'Keep going, you’ve got the next one!': 'Continue, tu vas réussir la prochaine !', 'No answer': 'Pas de réponse',
  'You are in': 'Tu es à la', 'place': 'place', 'You finished in': 'Tu termines à la', 'points': 'points', 'Game over': 'Partie terminée', 'You finished': 'Tu termines', 'right answers': 'bonnes réponses', 'Join another game': 'Rejoindre une autre partie',
  'You were removed from the game': 'Tu as été retiré de la partie', 'The game was closed': 'La partie a été fermée', 'Could not send. Try again.': 'Impossible d’envoyer. Réessaie.',
  'Join a game': 'Rejoindre une partie', 'Teacher tools': 'Outils enseignant', 'Turn on': 'Activer', 'Turn off': 'Désactiver', 'On': 'Activé', 'Off': 'Désactivé', '🍎 Teacher tools': '🍎 Outils enseignant',
  ' 🍎 I’m a teacher (make quizzes and run Matix Present in class)': ' 🍎 Je suis enseignant (créer des quiz et lancer Matix Present en classe)',
  'Teachers get the Teacher tab: make quizzes and run them live in class with Matix Present.': 'Les enseignants ont l’onglet Enseignant : créer des quiz et les lancer en direct en classe avec Matix Present.',
  'Make quizzes and run them live on the smart board with Matix Present. Students join from their phones or tablets with a Game PIN, no account needed.': 'Crée des quiz et lance-les en direct sur le tableau avec Matix Present. Les élèves rejoignent depuis leur téléphone ou tablette avec un code PIN, sans compte.',
  '🍎 I’m a teacher: turn on teacher tools': '🍎 Je suis enseignant : activer les outils', '🍎 Teacher tools are on': '🍎 Outils enseignant activés', 'Teacher tools are off': 'Outils enseignant désactivés',
  'Slideshow': 'Diaporama', 'Opening…': 'Ouverture…', 'The slideshow is closed.': 'Le diaporama est fermé.', '▶ Open it again': '▶ L’ouvrir à nouveau', 'Home': 'Accueil',
  'This slideshow does not exist (it may have been deleted).': 'Ce diaporama n’existe pas (il a peut-être été supprimé).', 'Could not load the slideshow. Check your connection.': 'Impossible de charger le diaporama. Vérifie ta connexion.',
  'Also show the question and answers on the students’ devices': 'Afficher aussi la question et les réponses sur les appareils des élèves', 'Shuffle the question order each game': 'Mélanger l’ordre des questions à chaque partie',
  'Make quizzes, then run them live on the smart board with 🎯 Matix Present. Students join at': 'Crée des quiz, puis lance-les en direct sur le tableau avec 🎯 Matix Present. Les élèves rejoignent sur',
  'with the Game PIN. They do not need an account.': 'avec le code PIN. Ils n’ont pas besoin de compte.', 'No slideshows yet.': 'Pas encore de diaporama.',
  'https://… (image or YouTube)': 'https://… (image ou YouTube)', 'Question type': 'Type de question',
  '✉️ Connect email': '✉️ Connecter un e-mail', '✉️ Change email': '✉️ Changer d’e-mail', 'Copy the link to this game': 'Copier le lien de ce jeu', 'Copy the link to this slideshow': 'Copier le lien de ce diaporama',
  'Matix home': 'Accueil Matix', 'Root': 'Racine',
  'This game stopped': 'Cette partie s’est arrêtée', 'Nobody had it open for more than a minute, so it was closed. Start a new game from the Teacher page.': 'Personne ne l’a eue ouverte pendant plus d’une minute, elle a donc été fermée. Lance une nouvelle partie depuis la page Enseignant.',
  'That game stopped because nobody had it open for more than a minute.': 'Cette partie s’est arrêtée car personne ne l’a eue ouverte pendant plus d’une minute.',
  'Are you a teacher? Ask the club owner to turn on teacher mode for your account.': 'Tu es enseignant ? Demande au propriétaire du club d’activer le mode enseignant sur ton compte.',
  'Turn off teacher mode? Only the owner can turn it back on.': 'Désactiver le mode enseignant ? Seul le propriétaire peut le réactiver.',
  '🍎 Make teacher': '🍎 Passer enseignant', '🎒 Back to student': '🎒 Repasser élève', '🍎 Teacher': '🍎 Enseignant', '🎒 Student': '🎒 Élève', 'Infinity': 'Infini', 'Theta': 'Thêta', 'Integral': 'Intégrale', 'Percent': 'Pour cent', 'Equals': 'Égal', 'Almost': 'Environ',
  'Half': 'Moitié', 'Square': 'Carré', 'Seven': 'Sept', 'Zero': 'Zéro', 'Imaginary': 'Imaginaire', 'Mystery': 'Mystère', 'Star': 'Étoile',
  'Plus': 'Plus', 'Minus': 'Moins', 'Times': 'Fois', 'Divide': 'Divisé', 'Make the QR code bigger': 'Agrandir le code QR', 'Leave the board': 'Quitter le tableau', 'Sound': 'Son', 'Full screen': 'Plein écran'
});

W.mxPresent = { page: page, live: live, stop: stop, player: player, avHtml: avHtml, judge: judge, sameAns: sameAns, copy: copy };
})();
