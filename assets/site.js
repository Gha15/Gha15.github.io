/* =====================================================================
   matixthemathclub.com (Nov 2026)
   - Home: an ad for the Matix app with Google Play + App Store buttons.
     The App Store button reads /site/appstore from the club database:
       {link}       → "Download on the App Store"
       {testflight} → "Join the beta on TestFlight"
       nothing      → 🔒 "Coming soon" (locked)
     The owner, when signed in, can edit it right on the home page.
   - Sign in / create account: same accounts as the app (same database,
     same password scrambling via matix-crypt.js).
   - Signed in → top menu: Exercises (class or home), Games,
     User upgrading (owner only), Download app (home).
   - The previous site lives on, inactive, at /temp/.
   ===================================================================== */
(function () {
'use strict';
var D = document, W = window;
var FB = 'https://matix-1d538-default-rtdb.firebaseio.com';
var PLAY = 'https://play.google.com/store/apps/details?id=com.matixmathclubappandroid.app';
var PLAY_TEST = 'https://play.google.com/apps/testing/com.matixmathclubappandroid.app';
var OWNERS = ['ghadi'];
function $(id) { return D.getElementById(id); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function enc(s) { return encodeURIComponent(s); }
function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } }
function toast(msg, kind) {
  var t = D.createElement('div'); t.className = 'toast' + (kind === 'err' ? ' err' : ''); t.setAttribute('role', 'status'); t.textContent = msg;
  D.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600);
}
function xf(path, data, dir) { try { return typeof W.mxCryptXform === 'function' ? W.mxCryptXform(FB, path, data, dir) : data; } catch (e) { return data; } }
/* fbGet decodes scrambled fields like the app; raw=true keeps them exactly as stored */
function fbGet(path, raw) { return fetch(FB + path + '.json').then(function (r) { return r.json(); }).then(function (d) { return raw ? d : xf(path, d, 'dec'); }); }
function fbPut(path, data, raw) {
  return fetch(FB + path + '.json', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(raw ? data : xf(path, data, 'enc')) })
    .then(function (r) { if (!r.ok) throw new Error('db ' + r.status); return r.json(); });
}
function fbPost(path, data) { return fetch(FB + path + '.json', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(function (r) { return r.json(); }); }

/* ---------------- account ---------------- */
var ME = null, ROLE = 'user';
function getUser() { return ss('mx_user') || ls('mx_site_user') || null; }
function setUser(u, keep) {
  ss('mx_user', u); ss('matix_auth_user', u);
  if (keep) ls('mx_site_user', u); else ls('mx_site_user', null);
  ME = u; loadRole().then(paintAuth);
}
function signOut() { ss('mx_user', null); ss('matix_auth_user', null); ls('mx_site_user', null); ME = null; ROLE = 'user'; paintAuth(); location.hash = '#/'; }
function isOwner() { return !!ME && (OWNERS.indexOf(ME) > -1 || ROLE === 'owner'); }
function loadRole() {
  if (!ME) return Promise.resolve('user');
  return fbGet('/roles/' + enc(ME)).then(function (r) { ROLE = String(r || '').toLowerCase() || 'user'; if (OWNERS.indexOf(ME) > -1) ROLE = 'owner'; return ROLE; })
    .catch(function () { return ROLE; });
}
function signIn(rawU, pass) {
  var u = String(rawU || '').toLowerCase().replace(/\s+/g, '');
  if (!u || !pass) return Promise.resolve('Enter your username and password.');
  return fbGet('/members/' + enc(u)).then(function (m) {
    if (!m || !m.password) return 'Wrong username or password.';
    if (m.password !== pass) return 'Wrong username or password.';
    return fbGet('/bans/' + enc(u)).then(function (b) { return b ? 'This account has been suspended by the owner.' : { ok: u }; });
  }).catch(function () { return 'Could not reach Matix. Check your connection.'; });
}
function join(rawU, pass) {
  var u = String(rawU || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (u.length < 2) return Promise.resolve('Pick a username with at least 2 letters or numbers.');
  if (!pass || pass.length < 4) return Promise.resolve('Use a password with at least 4 characters.');
  return fbGet('/members/' + enc(u), true).then(function (ex) {
    if (ex) return 'That username is taken.';
    return fbPut('/members/' + enc(u), { password: pass, joinedAt: Date.now(), testUser: true }).then(function () {
      fbPut('/profiles/' + enc(u), { displayName: u, bio: '', updatedAt: Date.now() }).catch(function () {});
      return { ok: u };
    });
  }).catch(function () { return 'Could not reach Matix. Check your connection.'; });
}

var joinMode = false, lastFocus = null;
function openModal(id) { lastFocus = D.activeElement; var m = $(id); m.hidden = false; var f = m.querySelector('input,button:not(.x)'); if (f) f.focus(); }
function closeModal(m) { m.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
function wireModals() {
  D.querySelectorAll('.modal').forEach(function (m) {
    m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('[data-close]')) closeModal(m); });
    m.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(m); });
  });
  $('authSwap').onclick = function () {
    joinMode = !joinMode;
    $('authTitle').textContent = joinMode ? 'Create your Matix account' : 'Sign in to Matix';
    $('authSub').textContent = joinMode ? 'It works in the app too.' : 'Use the same username and password as the app.';
    $('authGo').textContent = joinMode ? 'Create account' : 'Sign in';
    $('authSwapTxt').textContent = joinMode ? 'Already have an account?' : 'New to Matix?';
    $('authSwap').textContent = joinMode ? 'Sign in' : 'Create an account';
    $('authPass').setAttribute('autocomplete', joinMode ? 'new-password' : 'current-password');
    $('authErr').textContent = '';
  };
  $('authForm').onsubmit = function (e) {
    e.preventDefault();
    var b = $('authGo'), keep = $('authKeep').checked; b.disabled = true; $('authErr').textContent = '';
    (joinMode ? join : signIn)($('authUser').value, $('authPass').value).then(function (r) {
      b.disabled = false;
      if (r && r.ok) { $('authPass').value = ''; closeModal($('authModal')); setUser(r.ok, keep); toast(joinMode ? '🎉 Welcome to Matix, @' + r.ok + '!' : '👋 Signed in as @' + r.ok); }
      else $('authErr').textContent = r;
    });
  };
}
function paintAuth() {
  var who = $('who'), menu = $('menu');
  if (ME) {
    who.innerHTML = '<span class="chip"><span class="av" aria-hidden="true">' + esc(ME.charAt(0).toUpperCase()) + '</span><span class="nm">@' + esc(ME) + '</span>'
      + (ROLE && ROLE !== 'user' ? '<span class="role">' + esc(ROLE) + '</span>' : '') + '</span><button type="button" class="btn ghost" id="signOutBtn">Sign out</button>';
    $('signOutBtn').onclick = signOut;
    menu.hidden = false; $('menuUsers').hidden = !isOwner();
  } else {
    who.innerHTML = '<button type="button" class="btn ghost" id="signInBtn">Sign in</button>';
    $('signInBtn').onclick = function () { openModal('authModal'); };
    menu.hidden = true;
  }
  route();
}

/* ---------------- App Store button ---------------- */
var STORE = null;
function loadStore() { return fbGet('/site/appstore', true).then(function (s) { STORE = s || {}; return STORE; }).catch(function () { STORE = {}; return STORE; }); }
function tfUrl(v) { v = String(v || '').trim(); if (!v) return ''; if (/^https?:\/\//i.test(v)) return v; return 'https://testflight.apple.com/join/' + v.replace(/[^A-Za-z0-9]/g, ''); }
var ICON_PLAY = '<svg width="28" height="30" viewBox="0 0 28 30" aria-hidden="true"><path d="M2 2l14 13L2 28z" fill="#34d399"/><path d="M2 2l19 10.5-5 2.5z" fill="#38bdf8"/><path d="M2 28l14-13 5 2.5z" fill="#f43f5e"/><path d="M21 12.5l5 2.5-5 2.5-5-2.5z" fill="#fbbf24"/></svg>';
var ICON_APPLE = '<svg width="26" height="30" viewBox="0 0 26 30" aria-hidden="true"><path fill="currentColor" d="M21.4 15.9c0-3.6 3-5.3 3.1-5.4-1.7-2.5-4.3-2.8-5.2-2.9-2.2-.2-4.3 1.3-5.4 1.3-1.1 0-2.8-1.3-4.7-1.2-2.4 0-4.6 1.4-5.8 3.6-2.5 4.3-.6 10.7 1.8 14.2 1.2 1.7 2.6 3.6 4.4 3.5 1.8-.1 2.4-1.1 4.6-1.1 2.1 0 2.7 1.1 4.6 1.1 1.9 0 3.1-1.7 4.2-3.4 1.3-2 1.9-3.9 1.9-4-.1 0-3.5-1.4-3.5-5.7zM17.9 5.4c1-1.2 1.6-2.8 1.4-4.4-1.4.1-3.1.9-4.1 2.1-.9 1-1.7 2.7-1.5 4.3 1.6.1 3.2-.8 4.2-2z"/></svg>';
function storeButtons() {
  var s = STORE || {}, apple;
  if (s.link) apple = '<a class="store" href="' + esc(s.link) + '" target="_blank" rel="noopener">' + ICON_APPLE + '<span><small>Download on the</small><b>App Store</b></span></a>';
  else if (s.testflight) apple = '<a class="store" href="' + esc(tfUrl(s.testflight)) + '" target="_blank" rel="noopener">' + ICON_APPLE + '<span><small>iPhone beta on</small><b>TestFlight</b></span></a>';
  else apple = '<span class="store locked" role="img" aria-label="App Store: coming soon">' + ICON_APPLE + '<span><small>🔒 App Store</small><b>Coming soon</b></span></span>';
  return '<div class="stores"><a class="store" href="' + PLAY + '" target="_blank" rel="noopener">' + ICON_PLAY + '<span><small>Get it on</small><b>Google Play</b></span></a>' + apple + '</div>'
    + '<p class="store-note">Android tester? Join first with <a href="' + PLAY_TEST + '" target="_blank" rel="noopener">the tester link</a>, using your Play Store email.'
    + (s.testflight && !s.link ? ' iPhone: install TestFlight, then use code <b>' + esc(String(s.testflight).replace(/^https?:\/\/testflight\.apple\.com\/join\//i, '')) + '</b>.' : '') + '</p>'
    + (isOwner() ? '<div class="owner-edit"><button type="button" class="btn ghost" data-edit-store>✏️ Edit the App Store button</button></div>' : '');
}
function wireStoreEdit(root) {
  root.querySelectorAll('[data-edit-store]').forEach(function (b) {
    b.onclick = function () { var s = STORE || {}; $('stLink').value = s.link || ''; $('stTf').value = s.testflight || ''; $('stErr').textContent = ''; openModal('storeModal'); };
  });
}
function saveStore(val) {
  if (!isOwner()) return;
  fbPut('/site/appstore', val ? Object.assign(val, { updatedAt: Date.now(), by: ME }) : null, true).then(function () {
    STORE = val || {}; closeModal($('storeModal')); toast(val ? '✅ App Store button updated' : '🔒 App Store button set to Coming soon'); route();
  }).catch(function () { $('stErr').textContent = 'Could not save. Check your connection.'; });
}
function wireStoreModal() {
  $('stSave').onclick = function () {
    var link = $('stLink').value.trim(), tf = $('stTf').value.trim();
    if (link && !/^https:\/\/(apps\.apple\.com|itunes\.apple\.com)\//i.test(link)) { $('stErr').textContent = 'The App Store link should start with https://apps.apple.com/'; return; }
    if (tf && /^https?:\/\//i.test(tf) && !/^https:\/\/testflight\.apple\.com\/join\//i.test(tf)) { $('stErr').textContent = 'A TestFlight link looks like https://testflight.apple.com/join/CODE'; return; }
    if (!link && !tf) { saveStore(null); return; }
    saveStore(link ? { link: link } : { testflight: tf });
  };
  $('stLock').onclick = function () { saveStore(null); };
}

/* ---------------- pages ---------------- */
function home(c) {
  c.innerHTML =
    '<section class="hero"><div class="hero-in"><div>'
    + '<span class="eyebrow">📲 The Matix app</span>'
    + '<h1>Math you can <em>watch, play</em> and share.</h1>'
    + '<p class="lead">103 one-minute video lessons from Grade 1 to college, six real math games, end-to-end encrypted chat and friends. Made by and for the Matix math club.</p>'
    + storeButtons()
    + '</div>'
    + '<div class="phone" aria-hidden="true"><div class="scr"><div class="ph-h">🦉 Math Learn</div><img src="/assets/posters/pythagoras.jpg" alt=""><div class="ph-tag">Grade 8 · Pythagoras · 1:01</div>'
    + '<div class="ph-row"><img src="/assets/posters/fractions_intro.jpg" alt=""><img src="/assets/posters/derivative.jpg" alt=""></div><div class="ph-tag">Grade 3 · Fractions &nbsp; Grade 12 · Derivatives</div>'
    + '<div class="ph-dock"><span>⌂</span><span>🦉</span><span>🎮</span><span>🔔</span><span>👤</span></div></div></div>'
    + '</div></section>'
    + '<section class="sec"><h2>Everything in one app</h2><p class="sub">Free, made for students, and it works offline once installed.</p><div class="feats">'
    + feat('/assets/posters/add_intro.jpg', '', '🎬 Grade 1 to college', 'One-minute animated lessons: from how to add, through fractions and equations, to derivatives, integrals and matrices. Each one ends with a quiz.')
    + feat('/arcade/img/bg_space.jpg', '/arcade/img/ship.png', '🎮 Matix Arcade', 'Asteroid Answers, Balloon Pop, Fruit Market Sums, Pizza Fractions, Owl Runner and Memory Match. Pick your grade; the questions grow with you.')
    + feat('', '', '🔒 Encrypted Math Chat', 'Chat with the club, send equations and stickers. Messages are end-to-end encrypted: only you and your friend can read them.', '💬')
    + feat('/arcade/img/bg_sky.jpg', '/arcade/img/owl0.png', '🤝 Friends & points', 'Add friends, earn points, climb the leaderboard and share ideas with the club.')
    + feat('', '', '♿ Easy for everyone', 'Bigger text, high contrast, bigger buttons, dark mode and reduced motion, plus Arabic, French and Spanish.', '🧭')
    + feat('/assets/posters/matrices.jpg', '', '✨ Matix AI', 'Stuck? Ask Matix AI. It shows its working step by step, like a patient tutor.')
    + '</div></section>'
    + '<section class="sec"><h2>From counting to calculus</h2><p class="sub">A peek at the video course.</p><div class="strip">'
    + [['count_10', 'Grade 1 · Counting to 10'], ['times_6_7', 'Grade 4 · 6 and 7 times tables'], ['probability', 'Grade 7 · Probability'], ['slope', 'Grade 8 · Slope'], ['unit_circle', 'Grade 11 · The unit circle'], ['integral', 'Grade 12 · The integral'], ['matrices', 'College · Matrices']]
      .map(function (p) { return '<figure><img loading="lazy" src="/assets/posters/' + p[0] + '.jpg" alt="' + esc(p[1]) + ' lesson"><figcaption>' + esc(p[1]) + '</figcaption></figure>'; }).join('')
    + '</div></section>'
    + '<section class="cta"><h2>Get Matix</h2><p class="sub" style="margin:0 auto">Install it and start with any grade.</p>' + storeButtons() + '</section>';
  wireStoreEdit(c);
}
function feat(bg, img, title, text, emoji) {
  return '<article class="feat"><div class="art" style="' + (bg ? 'background-image:url(' + bg + ')' : 'background:linear-gradient(135deg,#3b2a8a,#121326)') + '">'
    + (img ? '<img src="' + img + '" alt="">' : (emoji ? '<span aria-hidden="true">' + emoji + '</span>' : '')) + '</div>'
    + '<div class="tx"><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p></div></article>';
}
function needSignIn(c, what) {
  c.innerHTML = '<div class="gate"><div style="font-size:3rem">🔐</div><h1>Sign in to use ' + esc(what) + '</h1><p class="sub">Use your Matix account, or create one in a few seconds.</p><button type="button" class="btn pri" id="gateIn">Sign in</button></div>';
  $('gateIn').onclick = function () { openModal('authModal'); };
}

/* ---------- exercises: home (practice alone) and class (one big screen, two teams) ---------- */
var LEVELS = [['1', 'Grade 1'], ['2', 'Grade 2'], ['3', 'Grade 3'], ['4', 'Grade 4'], ['5', 'Grade 5'], ['6', 'Grade 6'], ['7', 'Grade 7'], ['8', 'Grade 8'], ['9', 'Grade 9'], ['10', 'Grade 10'], ['11', 'Grade 11'], ['12', 'Grade 12'], ['13', 'College']];
function makeQ(L) { try { return W.mxArcade.makeQ(L); } catch (e) { var a = 2 + Math.floor(Math.random() * 8), b = 2 + Math.floor(Math.random() * 8); return { q: a + ' × ' + b, a: a * b }; } }
function wrongs(ans, n) {
  var out = {}, list = [], tries = 0, span = Math.max(3, Math.round(Math.abs(ans) * 0.25));
  while (list.length < n && tries++ < 200) { var w = ans + (Math.random() < .5 ? -1 : 1) * (1 + Math.floor(Math.random() * span)); if (w === ans || out[w]) continue; out[w] = 1; list.push(w); }
  return list;
}
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
var EX = { mode: ls('mx_site_exmode') || 'home', level: parseInt(ls('mx_arcade_level') || '3', 10) || 3 };
function exercises(c) {
  c.innerHTML = '<div class="page"><h1>✏️ Interactive exercises</h1><p class="sub">Practise at home on your own, or run a class game on one big screen.</p>'
    + '<div class="tabs" role="tablist"><button role="tab" data-m="home" aria-selected="' + (EX.mode === 'home') + '">🏠 Home</button><button role="tab" data-m="class" aria-selected="' + (EX.mode === 'class') + '">🏫 Class</button></div>'
    + '<div class="bar"><label>Grade <select id="exLv">' + LEVELS.map(function (l) { return '<option value="' + l[0] + '"' + (+l[0] === EX.level ? ' selected' : '') + '>' + l[1] + '</option>'; }).join('') + '</select></label></div>'
    + '<div id="exBody"></div></div>';
  c.querySelectorAll('.tabs button').forEach(function (b) { b.onclick = function () { EX.mode = b.dataset.m; ls('mx_site_exmode', EX.mode); exercises(c); }; });
  $('exLv').onchange = function () { EX.level = +this.value; ls('mx_arcade_level', this.value); EX.mode === 'home' ? homeQuiz() : classGame(); };
  EX.mode === 'home' ? homeQuiz() : classGame();
}
function homeQuiz() {
  var box = $('exBody'), N = 10, k = 0, right = 0, streak = 0;
  function ask() {
    var q = makeQ(EX.level), opts = shuffle([q.a].concat(wrongs(q.a, 3)));
    box.innerHTML = '<div class="card"><div class="meta"><span>Question ' + (k + 1) + ' / ' + N + '</span><span>✅ ' + right + (streak > 1 ? ' · 🔥 ' + streak : '') + '</span></div>'
      + '<div class="prog"><i style="width:' + (100 * k / N) + '%"></i></div><div class="q" aria-live="polite">' + esc(q.q) + (/=\s*\?$|\?$/.test(q.q) ? '' : ' = ?') + '</div>'
      + '<div class="opts">' + opts.map(function (o) { return '<button type="button" class="opt">' + esc(o) + '</button>'; }).join('') + '</div></div>';
    var bs = box.querySelectorAll('.opt');
    bs.forEach(function (b) {
      b.onclick = function () {
        var ok = +b.textContent === q.a; if (ok) { right++; streak++; } else streak = 0;
        bs.forEach(function (x) { x.disabled = true; if (+x.textContent === q.a) x.classList.add('ok'); }); if (!ok) b.classList.add('no');
        setTimeout(function () { k++; k < N ? ask() : done(); }, ok ? 700 : 1500);
      };
    });
    bs[0].focus();
  }
  function done() {
    var key = 'mx_site_best_' + EX.level, best = Math.max(+ls(key) || 0, right); ls(key, String(best));
    box.innerHTML = '<div class="card center"><div style="font-size:2.6rem">' + (right === N ? '🏆' : right >= 7 ? '🌟' : '💪') + '</div><div class="big-num">' + right + ' / ' + N + '</div>'
      + '<p class="sub">Best for this grade: ' + best + ' / ' + N + '</p><button type="button" class="btn pri" id="exAgain">↻ Try again</button></div>';
    $('exAgain').onclick = homeQuiz; $('exAgain').focus();
  }
  ask();
}
var CL = { a: 0, b: 0, t: null };
function classGame() {
  var box = $('exBody'), q = null, left = 0;
  clearInterval(CL.t);
  box.innerHTML = '<div class="class" id="clBox"><div class="bar" style="justify-content:space-between"><span class="timer" id="clT" aria-live="off">⏱ 30</span>'
    + '<button type="button" class="btn ghost" id="clFs">⛶ Full screen</button></div>'
    + '<div class="q" id="clQ" aria-live="polite"></div><div class="ans" id="clA"></div>'
    + '<div class="bar" style="justify-content:center"><button type="button" class="btn ghost" id="clShow">👀 Show answer</button><button type="button" class="btn pri" id="clNext">Next question →</button></div>'
    + '<div class="teams"><div class="team a"><span>Team A</span><b id="tA">' + CL.a + '</b><button type="button" class="btn ghost" data-t="a" data-d="1">+1</button><button type="button" class="btn ghost" data-t="a" data-d="-1">−1</button></div>'
    + '<div class="team b"><span>Team B</span><b id="tB">' + CL.b + '</b><button type="button" class="btn ghost" data-t="b" data-d="1">+1</button><button type="button" class="btn ghost" data-t="b" data-d="-1">−1</button></div></div>'
    + '<p class="center sub" style="margin-top:14px">Read the question out loud. The first team with the right answer gets the point. <button type="button" class="link" id="clReset">Reset scores</button></p></div>';
  function next() {
    q = makeQ(EX.level); $('clQ').textContent = q.q + (/\?$/.test(q.q) ? '' : ' = ?'); $('clA').textContent = ''; left = 30;
    clearInterval(CL.t); $('clT').textContent = '⏱ ' + left;
    CL.t = setInterval(function () { if (!$('clT')) { clearInterval(CL.t); return; } left--; $('clT').textContent = '⏱ ' + Math.max(0, left); if (left <= 0) { clearInterval(CL.t); show(); } }, 1000);
  }
  function show() { if (q) $('clA').textContent = q.a; clearInterval(CL.t); }
  $('clNext').onclick = next; $('clShow').onclick = show;
  $('clFs').onclick = function () { var el = $('clBox'); try { (el.requestFullscreen || el.webkitRequestFullscreen).call(el); } catch (e) {} };
  $('clReset').onclick = function () { CL.a = CL.b = 0; $('tA').textContent = 0; $('tB').textContent = 0; };
  box.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { var t = b.dataset.t; CL[t] = Math.max(0, CL[t] + (+b.dataset.d)); $(t === 'a' ? 'tA' : 'tB').textContent = CL[t]; }; });
  next();
}

/* ---------- games ---------- */
function games(c) { if (typeof W.renderGames === 'function') W.renderGames(c); else c.innerHTML = '<div class="page"><p>Games could not load.</p></div>'; }

/* ---------- user upgrading (owner only) ---------- */
var LADDER = ['user', 'member', 'admin', 'manager'], RICON = { user: '🙂', member: '🎓', admin: '⭐', manager: '🛡️', owner: '👑' };
function users(c) {
  if (!isOwner()) { c.innerHTML = '<div class="gate"><div style="font-size:3rem">👑</div><h1>Owner only</h1><p class="sub">Only the club owner can upgrade users.</p></div>'; return; }
  c.innerHTML = '<div class="page"><h1>⬆️ User upgrading</h1><p class="sub">Promote members step by step (user → member → admin → manager), or delete an account. Deleting keeps a backup, so you can undo it from Messages in the app.</p>'
    + '<input class="search" id="uQ" type="search" placeholder="Search users…" aria-label="Search users"><div class="ulist" id="uList"><p class="sub">Loading…</p></div></div>';
  Promise.all([fbGet('/members', true), fbGet('/roles', true)]).then(function (r) {
    var names = Object.keys(r[0] || {}).sort(), roles = r[1] || {}, q = '';
    function roleOf(u) { if (OWNERS.indexOf(u) > -1 || roles[u] === 'owner') return 'owner'; var x = String(roles[u] || '').toLowerCase(); return LADDER.indexOf(x) > -1 ? x : 'user'; }
    function draw() {
      var list = names.filter(function (u) { return !q || u.indexOf(q) > -1; });
      $('uList').innerHTML = list.map(function (u) {
        var r0 = roleOf(u), i = LADDER.indexOf(r0), locked = r0 === 'owner' || u === ME;
        return '<div class="urow"><span class="nm">@' + esc(u) + '</span><span class="rl">' + RICON[r0] + ' ' + esc(r0) + '</span>'
          + (locked ? '' : (i < LADDER.length - 1 ? '<button type="button" data-u="' + esc(u) + '" data-a="up">⬆ Promote to ' + LADDER[i + 1] + '</button>' : '')
            + (i > 0 ? '<button type="button" data-u="' + esc(u) + '" data-a="down">⬇ ' + LADDER[i - 1] + '</button>' : '')
            + '<button type="button" class="del" data-u="' + esc(u) + '" data-a="del">🗑 Delete</button>') + '</div>';
      }).join('') || '<p class="sub">Nobody matches that.</p>';
    }
    $('uQ').oninput = function () { q = this.value.toLowerCase().trim(); draw(); };
    $('uList').onclick = function (e) {
      var b = e.target.closest('button[data-a]'); if (!b) return;
      var u = b.dataset.u, a = b.dataset.a, i = LADDER.indexOf(roleOf(u));
      if (a === 'up' || a === 'down') {
        var nr = LADDER[i + (a === 'up' ? 1 : -1)];
        if (!confirm((a === 'up' ? 'Promote' : 'Demote') + ' @' + u + ' to ' + nr + '?')) return;
        b.disabled = true;
        fbPut('/roles/' + enc(u), nr, true).then(function () {
          roles[u] = nr; draw(); toast(RICON[nr] + ' @' + u + ' is now ' + nr);
          fbPost('/notifications/' + enc(u), { type: 'role', title: RICON[nr] + ' You are now ' + (nr === 'admin' ? 'an ' : 'a ') + nr, body: '@' + ME + ' changed your role in the club.', at: Date.now(), from: ME }).catch(function () {});
        }).catch(function () { b.disabled = false; toast('Could not save. Check your connection.', 'err'); });
      } else if (a === 'del') {
        if (!confirm('Delete @' + u + '? Their account, profile, role, comments and follows are removed. A backup is kept so you can undo it from Messages in the app.')) return;
        b.disabled = true; b.textContent = 'Deleting…';
        Promise.all(['/members/', '/profiles/', '/roles/', '/profile_comments/', '/follows/'].map(function (p) { return fbGet(p + enc(u), true); })).then(function (d) {
          return fbPut('/deletion_backups/' + enc(u), { member: d[0], profile: d[1], role: d[2], comments: d[3], follows: d[4], at: Date.now(), by: ME }, true);
        }).then(function () {
          return Promise.all([fbPut('/deletions/' + enc(u), { at: Date.now(), by: ME }, true)].concat(['/members/', '/profiles/', '/roles/', '/profile_comments/', '/follows/', '/friends/'].map(function (p) { return fbPut(p + enc(u), null, true); })));
        }).then(function () { names = names.filter(function (x) { return x !== u; }); delete roles[u]; draw(); toast('🗑 @' + u + ' deleted'); })
          .catch(function () { b.disabled = false; b.textContent = '🗑 Delete'; toast('Could not delete. Check your connection.', 'err'); });
      }
    };
    draw();
  }).catch(function () { $('uList').innerHTML = '<p class="sub">Could not load users. Check your connection.</p>'; });
}

/* ---------------- router ---------------- */
function route() {
  var c = $('content'), r = (location.hash.replace(/^#\/?/, '') || 'home').split('/')[0];
  D.querySelectorAll('#menu a').forEach(function (a) { if (a.dataset.r === r) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  if (r === 'exercises') { if (!ME) needSignIn(c, 'exercises'); else exercises(c); }
  else if (r === 'games') { if (!ME) needSignIn(c, 'games'); else games(c); }
  else if (r === 'users') users(c);
  else home(c);
  D.title = { exercises: 'Exercises · Matix', games: 'Games · Matix', users: 'User upgrading · Matix' }[r] || 'Matix the Math Club';
  if (r !== 'home') { try { c.focus({ preventScroll: true }); } catch (e) {} W.scrollTo(0, 0); }
}

function boot() {
  wireModals(); wireStoreModal();
  ME = getUser();
  W.addEventListener('hashchange', route);
  Promise.all([loadStore(), loadRole()]).then(paintAuth, paintAuth);
  paintAuth();
}
if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot); else boot();
})();
