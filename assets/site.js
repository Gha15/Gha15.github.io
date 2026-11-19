/* =====================================================================
   matixthemathclub.com (Nov 2026)
   - Home: an ad for the Matix app.
       Google Play button, set by the owner at /site/playstore:
         live → "Get it on Google Play"
         testing (default) → Google Play + "🧪 In testing: join the test"
         soon → 🔒 coming soon
       App Store button, set by the owner at /site/appstore:
         link → App Store, testflight → TestFlight, nothing → 🔒 coming soon
   - Accounts are the app's accounts (same database, same password
     scrambling via matix-crypt.js, same email system):
       sign in with username OR email, create an account with an email,
       6-digit email codes (verify, forgot password, change email),
       sent with the club's EmailJS settings (/config/emailjs).
   - Signed in → top menu: Exercises (home / class), Games, Download app,
     and 👑 Owner for the owner only (it is never added for anyone else):
       user upgrading, email sending settings, store buttons.
   - The previous site lives on, inactive, at /temp/.
   ===================================================================== */
(function () {
'use strict';
var D = document, W = window;
var FB = 'https://matix-1d538-default-rtdb.firebaseio.com';
var PLAY = 'https://play.google.com/store/apps/details?id=com.matixmathclubappandroid.app';
var PLAY_TEST = 'https://play.google.com/apps/testing/com.matixmathclubappandroid.app';
var OWNERS = ['ghadi'];
var CODE_MIN = 15, MAX_TRIES = 5, RESEND_MS = 45000;
function $(id) { return D.getElementById(id); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function enc(s) { return encodeURIComponent(s); }
function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } }
function toast(msg, kind) {
  var t = D.createElement('div'); t.className = 'toast' + (kind === 'err' ? ' err' : ''); t.setAttribute('role', 'status'); t.textContent = msg;
  D.body.appendChild(t); setTimeout(function () { t.remove(); }, 2800);
}

/* ---------------- database (same scrambling as the app) ---------------- */
function xf(path, data, dir) { try { return typeof W.mxCryptXform === 'function' ? W.mxCryptXform(FB, path, data, dir) : data; } catch (e) { return data; } }
function req(path, method, data, raw) {
  var o = { method: method || 'GET' };
  if (data !== undefined) { o.headers = { 'Content-Type': 'application/json' }; o.body = JSON.stringify(raw ? data : xf(path, data, 'enc')); }
  return fetch(FB + path + '.json', o).then(function (r) { if (!r.ok) throw new Error('db ' + r.status); return r.json(); })
    .then(function (d) { return raw || method === 'DELETE' ? d : xf(path, d, 'dec'); });
}
function fbGet(path, raw) { return req(path, 'GET', undefined, raw); }
function fbPut(path, data, raw) { return req(path, 'PUT', data, raw); }
function fbPatch(path, data) { return req(path, 'PATCH', data); }
function fbDel(path) { return req(path, 'DELETE'); }
function fbPost(path, data) { return req(path, 'POST', data, true); }

/* ---------------- email helpers (same as the app) ---------------- */
function normU(u) { return String(u || '').toLowerCase().replace(/[^a-z0-9_]/g, ''); }
function normE(e) { return String(e || '').trim().toLowerCase(); }
function validEmail(e) { return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(e) && e.length <= 120; }
function maskEmail(e) { e = String(e || ''); var i = e.indexOf('@'); if (i < 1) return e; var n = e.slice(0, i); return n.slice(0, Math.min(2, n.length)) + '•••' + e.slice(i); }
function sha(s) { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }); }
function emailKey(e) { return sha('matix-email:' + normE(e)); }
function newCode() { var a = new Uint32Array(1); crypto.getRandomValues(a); return String(a[0] % 1000000).padStart(6, '0'); }
var CFG = null;
function loadCfg(force) {
  if (CFG && !force) return Promise.resolve(CFG);
  return fbGet('/config/emailjs', true).then(function (v) { v = v || {}; CFG = { serviceId: v.serviceId || '', templateId: v.templateId || '', publicKey: v.publicKey || '' }; return CFG; })
    .catch(function () { CFG = CFG || {}; return CFG; });
}
function emailReady() { return !!(CFG && CFG.serviceId && CFG.templateId && CFG.publicKey); }
var PURPOSE = {
  verify: { subject: 'Verify your Matix email', message: 'Use this code to verify your email for Matix.' },
  reset: { subject: 'Reset your Matix password', message: 'Use this code to reset your Matix password. If you did not ask for this, you can ignore this email.' },
  change: { subject: 'Confirm your new Matix email', message: 'Use this code to confirm this new email address for your Matix account.' },
  test: { subject: 'Matix email test', message: 'Email sending works. This is a test code.' }
};
function sendMail(to, user, code, purpose) {
  return loadCfg().then(function () {
    if (!emailReady()) throw new Error('noservice');
    var p = PURPOSE[purpose] || PURPOSE.verify;
    return fetch('https://api.emailjs.com/api/v1.0/email/send', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_id: CFG.serviceId, template_id: CFG.templateId, user_id: CFG.publicKey,
        template_params: { to_email: to, email: to, to_name: user, username: user, code: code, passcode: code, subject: p.subject, message: p.message, expires: String(CODE_MIN), app_name: 'Matix' } }) })
      .then(function (r) { if (!r.ok) throw new Error('send ' + r.status); return true; });
  });
}
function issueCode(u, purpose, to, extra) {
  var path = '/authCodes/' + enc(u);
  return fbGet(path).catch(function () { return null; }).then(function (cur) {
    if (cur && cur.purpose === purpose && cur.sentAt && Date.now() - cur.sentAt < RESEND_MS && (!extra || !extra.email || cur.email === extra.email))
      throw new Error('wait:' + Math.ceil((RESEND_MS - (Date.now() - cur.sentAt)) / 1000));
    var code = newCode();
    return sha(code + ':' + u + ':' + purpose).then(function (h) {
      var rec = { purpose: purpose, h: h, exp: Date.now() + CODE_MIN * 60000, sentAt: Date.now(), tries: 0 };
      if (extra) for (var k in extra) rec[k] = extra[k];
      return fbPut(path, rec).then(function () { return sendMail(to, u, code, purpose).catch(function (e) { return fbDel(path).catch(function () {}).then(function () { throw e; }); }); });
    });
  });
}
function checkCode(u, purpose, code) {
  var path = '/authCodes/' + enc(u);
  code = String(code || '').replace(/\D/g, '');
  return fbGet(path).then(function (c) {
    if (!c || c.purpose !== purpose) return { err: 'none' };
    if (Date.now() > c.exp) return fbDel(path).then(function () { return { err: 'expired' }; });
    if ((c.tries || 0) >= MAX_TRIES) return { err: 'locked' };
    return sha(code + ':' + u + ':' + purpose).then(function (h) {
      if (code.length !== 6 || h !== c.h) return fbPatch(path, { tries: (c.tries || 0) + 1 }).then(function () { return { err: 'wrong', left: MAX_TRIES - (c.tries || 0) - 1 }; });
      return fbDel(path).then(function () { return { ok: true, rec: c }; });
    });
  });
}
function codeErr(r) { return r.err === 'expired' ? 'That code expired. Send a new one.' : r.err === 'locked' ? 'Too many wrong tries. Send a new code.' : r.err === 'none' ? 'No active code. Send a new one.' : 'Wrong code.' + (r.left > 0 ? ' Tries left: ' + r.left : ''); }
function sendErr(e) {
  var m = String(e && e.message || e);
  if (m.indexOf('wait:') === 0) return 'Wait a moment before asking for another code (' + m.slice(5) + 's).';
  if (m === 'noservice') return 'Email sending is not set up yet. Ask the owner.';
  return 'Could not send the email. Check your connection and try again.';
}
function lookupEmail(e) { return emailKey(e).then(function (k) { return fbGet('/emailIndex/' + k, true); }).then(function (u) { return typeof u === 'string' ? u : null; }); }
function emailFree(e, u) { return lookupEmail(e).then(function (o) { return !o || o === u; }); }
function attachEmail(u, e) {
  e = normE(e);
  return fbGet('/members/' + enc(u)).then(function (m) {
    m = m || {};
    var drop = Promise.resolve();
    if (m.email && normE(m.email) !== e) drop = emailKey(m.email).then(function (ok) { return fbGet('/emailIndex/' + ok, true).then(function (o) { if (o === u) return fbDel('/emailIndex/' + ok); }); }).catch(function () {});
    return drop.then(function () { return emailKey(e); }).then(function (k) { return fbPut('/emailIndex/' + k, u, true); })
      .then(function () { return fbPatch('/members/' + enc(u), { email: e, emailVerified: true, emailVerifiedAt: Date.now() }); });
  });
}

/* ---------------- account state ---------------- */
var ME = null, ROLE = 'user';
function getUser() { return ss('mx_user') || ls('mx_site_user') || null; }
function setUser(u, keep) {
  ss('mx_user', u); ss('matix_auth_user', u);
  if (keep) ls('mx_site_user', u); else ls('mx_site_user', null);
  ME = u; ROLE = 'user'; loadRole().then(paintAuth);
}
function signOut() { ss('mx_user', null); ss('matix_auth_user', null); ls('mx_site_user', null); ME = null; ROLE = 'user'; paintAuth(); location.hash = '#/'; }
function isOwner() { return !!ME && (OWNERS.indexOf(ME) > -1 || ROLE === 'owner'); }
function loadRole() {
  if (!ME) return Promise.resolve('user');
  return fbGet('/roles/' + enc(ME), true).then(function (r) { ROLE = String(r || '').toLowerCase() || 'user'; if (OWNERS.indexOf(ME) > -1) ROLE = 'owner'; return ROLE; })
    .catch(function () { return ROLE; });
}
function passOk(u, p) { return fbGet('/members/' + enc(u)).then(function (m) { return !!(m && m.password && m.password === p); }); }
function signIn(id, pass) {
  id = String(id || '').trim();
  if (!id || !pass) return Promise.resolve('Enter your username (or email) and password.');
  var who = id.indexOf('@') > 0 ? lookupEmail(id) : Promise.resolve(id.toLowerCase().replace(/\s+/g, ''));
  return who.then(function (u) {
    if (!u) return 'No account uses that email.';
    return passOk(u, pass).then(function (ok) {
      if (!ok) return 'Wrong username/email or password.';
      return fbGet('/bans/' + enc(u), true).then(function (b) { return b ? 'This account has been suspended by the owner.' : { ok: u }; });
    });
  }).catch(function () { return 'Could not reach Matix. Check your connection.'; });
}
function join(rawU, email, pass) {
  var u = normU(rawU); email = normE(email);
  if (u.length < 2) return Promise.resolve('Pick a username with at least 2 letters or numbers.');
  if (!validEmail(email)) return Promise.resolve('Enter a real email address.');
  if (!pass || pass.length < 4) return Promise.resolve('Use a password with at least 4 characters.');
  return fbGet('/members/' + enc(u), true).then(function (ex) {
    if (ex) return 'That username is taken.';
    return emailFree(email, u).then(function (free) {
      if (!free) return 'That email is already used by another account.';
      return fbPut('/members/' + enc(u), { password: pass, joinedAt: Date.now(), testUser: true, email: email, emailVerified: false }).then(function () {
        fbPut('/profiles/' + enc(u), { displayName: u, bio: '', updatedAt: Date.now() }).catch(function () {});
        return { ok: u, email: email };
      });
    });
  }).catch(function () { return 'Could not reach Matix. Check your connection.'; });
}

/* ---------------- sign-in / join / verify / forgot (one dialog, several steps) ---------------- */
var lastFocus = null, KEEP = true;
function openAuth(view, arg) { lastFocus = D.activeElement; $('authModal').hidden = false; showView(view || 'signin', arg); }
function closeAuth() { $('authModal').hidden = true; if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {} }
function fld(label, id, type, ac, ph) { return '<label>' + esc(label) + '<input id="' + id + '" type="' + (type || 'text') + '"' + (ac ? ' autocomplete="' + ac + '"' : '') + (ph ? ' placeholder="' + esc(ph) + '"' : '') + (type === 'text' || !type ? ' autocapitalize="none" spellcheck="false"' : '') + '></label>'; }
function codeFld(id) { return '<label>6-digit code<input id="' + id + '" class="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••"></label>'; }
function showView(v, arg) {
  var b = $('authBody'), h = '';
  if (v === 'signin') {
    h = '<h2 id="authTitle">Sign in to Matix</h2><p class="sub">Use your username or email, and the same password as the app.</p><form id="af">'
      + fld('Username or email', 'aU', 'text', 'username') + fld('Password', 'aP', 'password', 'current-password')
      + '<label class="check"><input type="checkbox" id="aK"' + (KEEP ? ' checked' : '') + '> Keep me signed in on this device</label>'
      + '<div class="err" id="aE" role="alert"></div><button class="btn pri wide" id="aGo">Sign in</button></form>'
      + '<p class="swap"><button type="button" class="link" id="aForgot">Forgot your password?</button></p>'
      + '<p class="swap">New to Matix? <button type="button" class="link" id="aJoin">Create an account</button></p>';
  } else if (v === 'join') {
    h = '<h2 id="authTitle">Create your Matix account</h2><p class="sub">It works in the app too. We send a code to your email to check it is yours.</p><form id="af">'
      + fld('Username', 'aU', 'text', 'username', 'yourname') + fld('Email', 'aM', 'email', 'email', 'you@example.com') + fld('Password', 'aP', 'password', 'new-password')
      + '<label class="check"><input type="checkbox" id="aK"' + (KEEP ? ' checked' : '') + '> Keep me signed in on this device</label>'
      + '<div class="err" id="aE" role="alert"></div><button class="btn pri wide" id="aGo">Create account</button></form>'
      + '<p class="swap">Already have an account? <button type="button" class="link" id="aIn">Sign in</button></p>';
  } else if (v === 'verify') {
    h = '<h2 id="authTitle">📬 Check your email</h2><p class="sub">We sent a 6-digit code to <b>' + esc(maskEmail(arg.email)) + '</b>. It works for 15 minutes.</p><form id="af">'
      + codeFld('aC') + '<div class="err" id="aE" role="alert"></div><button class="btn pri wide" id="aGo">Verify my email</button></form>'
      + '<p class="swap"><button type="button" class="link" id="aResend">Send a new code</button> · <button type="button" class="link" id="aLater">Later</button></p>';
  } else if (v === 'forgot') {
    h = '<h2 id="authTitle">🔑 Forgot your password?</h2><p class="sub">Type your username and the email on your account. We will email you a 6-digit code.</p><form id="af">'
      + fld('Username', 'aU', 'text', 'username') + fld('Email', 'aM', 'email', 'email') + '<div class="err" id="aE" role="alert"></div><button class="btn pri wide" id="aGo">Send reset code</button></form>'
      + '<p class="swap"><button type="button" class="link" id="aIn">← Back to sign in</button></p>';
  } else if (v === 'reset') {
    h = '<h2 id="authTitle">📬 Check your email</h2><p class="sub">We sent a 6-digit code to <b>' + esc(maskEmail(arg.email)) + '</b>.</p><form id="af">'
      + codeFld('aC') + fld('New password', 'aP', 'password', 'new-password') + fld('Repeat new password', 'aP2', 'password', 'new-password')
      + '<div class="err" id="aE" role="alert"></div><button class="btn pri wide" id="aGo">Change password</button></form>'
      + '<p class="swap"><button type="button" class="link" id="aResend">Send a new code</button> · <button type="button" class="link" id="aIn">Back to sign in</button></p>';
  }
  b.innerHTML = h;
  var f = b.querySelector('input'); if (f) f.focus();
  function on(id, fn) { var n = $(id); if (n) n.onclick = fn; }
  on('aJoin', function () { showView('join'); }); on('aIn', function () { showView('signin'); }); on('aForgot', function () { showView('forgot'); });
  on('aLater', function () { closeAuth(); toast('You can verify your email any time from your account.'); });
  on('aResend', function () { issueCode(arg.u, v === 'reset' ? 'reset' : 'verify', arg.email, v === 'verify' ? { email: arg.email } : undefined).then(function () { toast('📬 New code sent'); }, function (x) { $('aE').textContent = sendErr(x); }); });
  $('af').onsubmit = function (e) {
    e.preventDefault();
    var go = $('aGo'), er = $('aE'); er.textContent = ''; go.disabled = true;
    var done = function () { go.disabled = false; };
    var keep = $('aK') ? $('aK').checked : KEEP; KEEP = keep;
    if (v === 'signin') {
      signIn($('aU').value, $('aP').value).then(function (r) { done(); if (r && r.ok) { closeAuth(); setUser(r.ok, keep); toast('👋 Signed in as @' + r.ok); } else er.textContent = r; });
    } else if (v === 'join') {
      join($('aU').value, $('aM').value, $('aP').value).then(function (r) {
        done(); if (!(r && r.ok)) { er.textContent = r; return; }
        setUser(r.ok, keep); toast('🎉 Welcome to Matix, @' + r.ok + '!');
        loadCfg().then(function () {
          if (!emailReady()) { closeAuth(); return; }
          issueCode(r.ok, 'verify', r.email, { email: r.email }).then(function () { showView('verify', { u: r.ok, email: r.email }); }, function () { closeAuth(); toast('We could not send the code now. Verify later from your account.'); });
        });
      });
    } else if (v === 'verify') {
      checkCode(arg.u, 'verify', $('aC').value).then(function (r) {
        done(); if (!r.ok) { er.textContent = codeErr(r); return; }
        return attachEmail(arg.u, r.rec.email || arg.email).then(function () { closeAuth(); toast('✅ Email verified'); route(); });
      }).catch(function () { done(); er.textContent = 'Something went wrong. Try again.'; });
    } else if (v === 'forgot') {
      var u = normU($('aU').value), em = normE($('aM').value);
      if (!u || !validEmail(em)) { done(); er.textContent = 'Type your username and a real email address.'; return; }
      fbGet('/members/' + enc(u)).then(function (m) {
        if (!m || !m.email) { done(); er.textContent = 'This account has no email connected yet. Ask the owner for help.'; return; }
        if (normE(m.email) !== em) { done(); er.textContent = 'That username and email do not match.'; return; }
        return issueCode(u, 'reset', em).then(function () { showView('reset', { u: u, email: em }); });
      }).catch(function (x) { done(); er.textContent = sendErr(x); });
    } else if (v === 'reset') {
      var p1 = $('aP').value, p2 = $('aP2').value;
      if (!p1 || p1.length < 4) { done(); er.textContent = 'Password too short (min 4).'; return; }
      if (p1 !== p2) { done(); er.textContent = 'The two passwords are different.'; return; }
      checkCode(arg.u, 'reset', $('aC').value).then(function (r) {
        if (!r.ok) { done(); er.textContent = codeErr(r); return; }
        var rev = Date.now();
        return fbPatch('/members/' + enc(arg.u), { password: p1, emailVerified: true, passwordChangedAt: rev, sessionRev: rev }).then(function () {
          showView('signin'); $('aU').value = arg.u; $('aP').focus(); toast('🔑 Password changed. Sign in with your new password.');
        });
      }).catch(function () { done(); er.textContent = 'Something went wrong. Try again.'; });
    }
  };
}
function wireModal() {
  var m = $('authModal');
  m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('[data-close]')) closeAuth(); });
  m.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAuth(); });
}

function paintAuth() {
  var who = $('who'), menu = $('menu');
  var old = $('menuOwner'); if (old) old.remove();
  if (ME) {
    who.innerHTML = '<a class="chip" href="#/account" title="My account"><span class="av" aria-hidden="true">' + esc(ME.charAt(0).toUpperCase()) + '</span><span class="nm">@' + esc(ME) + '</span>'
      + (ROLE && ROLE !== 'user' ? '<span class="role">' + esc(ROLE) + '</span>' : '') + '</a><button type="button" class="btn ghost" id="signOutBtn">Sign out</button>';
    $('signOutBtn').onclick = signOut;
    menu.hidden = false;
    /* the owner tab is only ever created for the owner */
    if (isOwner()) {
      var a = D.createElement('a'); a.id = 'menuOwner'; a.href = '#/owner'; a.dataset.r = 'owner'; a.innerHTML = '👑 <span>Owner</span>';
      menu.insertBefore(a, menu.lastElementChild);
    }
  } else {
    who.innerHTML = '<button type="button" class="btn ghost" id="signInBtn">Sign in</button>';
    $('signInBtn').onclick = function () { openAuth('signin'); };
    menu.hidden = true;
  }
  route();
}

/* ---------------- store buttons ---------------- */
var STORE = {}, PLAYCFG = {};
function loadStores() {
  return Promise.all([fbGet('/site/appstore', true), fbGet('/site/playstore', true)]).then(function (r) { STORE = r[0] || {}; PLAYCFG = r[1] || {}; })
    .catch(function () { STORE = {}; PLAYCFG = {}; });
}
function tfUrl(v) { v = String(v || '').trim(); if (!v) return ''; if (/^https?:\/\//i.test(v)) return v; return 'https://testflight.apple.com/join/' + v.replace(/[^A-Za-z0-9]/g, ''); }
function playMode() { return ['live', 'testing', 'soon'].indexOf(PLAYCFG.mode) > -1 ? PLAYCFG.mode : 'testing'; }
var ICON_PLAY = '<svg width="28" height="30" viewBox="0 0 28 30" aria-hidden="true"><path d="M2 2l14 13L2 28z" fill="#34d399"/><path d="M2 2l19 10.5-5 2.5z" fill="#38bdf8"/><path d="M2 28l14-13 5 2.5z" fill="#f43f5e"/><path d="M21 12.5l5 2.5-5 2.5-5-2.5z" fill="#fbbf24"/></svg>';
var ICON_APPLE = '<svg width="26" height="30" viewBox="0 0 26 30" aria-hidden="true"><path fill="currentColor" d="M21.4 15.9c0-3.6 3-5.3 3.1-5.4-1.7-2.5-4.3-2.8-5.2-2.9-2.2-.2-4.3 1.3-5.4 1.3-1.1 0-2.8-1.3-4.7-1.2-2.4 0-4.6 1.4-5.8 3.6-2.5 4.3-.6 10.7 1.8 14.2 1.2 1.7 2.6 3.6 4.4 3.5 1.8-.1 2.4-1.1 4.6-1.1 2.1 0 2.7 1.1 4.6 1.1 1.9 0 3.1-1.7 4.2-3.4 1.3-2 1.9-3.9 1.9-4-.1 0-3.5-1.4-3.5-5.7zM17.9 5.4c1-1.2 1.6-2.8 1.4-4.4-1.4.1-3.1.9-4.1 2.1-.9 1-1.7 2.7-1.5 4.3 1.6.1 3.2-.8 4.2-2z"/></svg>';
function storeButtons() {
  var pm = playMode(), playLink = PLAYCFG.link || PLAY, testLink = PLAYCFG.testLink || PLAY_TEST, s = STORE, apple, play = '';
  if (pm === 'soon') play = '<span class="store locked" role="img" aria-label="Google Play: coming soon">' + ICON_PLAY + '<span><small>🔒 Google Play</small><b>Coming soon</b></span></span>';
  else {
    play = '<a class="store" href="' + esc(playLink) + '" target="_blank" rel="noopener">' + ICON_PLAY + '<span><small>Get it on</small><b>Google Play</b></span></a>';
    if (pm === 'testing') play += '<a class="store testing" href="' + esc(testLink) + '" target="_blank" rel="noopener"><span class="tube" aria-hidden="true">🧪</span><span><small>Android · in testing</small><b>Join the test</b></span></a>';
  }
  if (s.link) apple = '<a class="store" href="' + esc(s.link) + '" target="_blank" rel="noopener">' + ICON_APPLE + '<span><small>Download on the</small><b>App Store</b></span></a>';
  else if (s.testflight) apple = '<a class="store" href="' + esc(tfUrl(s.testflight)) + '" target="_blank" rel="noopener">' + ICON_APPLE + '<span><small>iPhone beta on</small><b>TestFlight</b></span></a>';
  else apple = '<span class="store locked" role="img" aria-label="App Store: coming soon">' + ICON_APPLE + '<span><small>🔒 App Store</small><b>Coming soon</b></span></span>';
  return '<div class="stores">' + play + apple + '</div>'
    + (pm === 'testing' ? '<p class="store-note">Matix is in testing on Android: tap <b>Join the test</b> with your Play Store email first, then install it.</p>' : '')
    + (s.testflight && !s.link ? '<p class="store-note">iPhone: install TestFlight, then use code <b>' + esc(String(s.testflight).replace(/^https?:\/\/testflight\.apple\.com\/join\//i, '')) + '</b>.</p>' : '')
    + (isOwner() ? '<div class="owner-edit"><a class="btn ghost" href="#/owner/stores">✏️ Edit the store buttons</a></div>' : '');
}

/* ---------------- pages ---------------- */
function home(c) {
  c.innerHTML =
    '<section class="hero"><div class="hero-in"><div>'
    + '<img class="hero-logo" src="/assets/matix-logo-light.svg" alt="MATIX" height="44">'
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
}
function feat(bg, img, title, text, emoji) {
  return '<article class="feat"><div class="art" style="' + (bg ? 'background-image:url(' + bg + ')' : 'background:linear-gradient(135deg,#3b2a8a,#121326)') + '">'
    + (img ? '<img src="' + img + '" alt="">' : (emoji ? '<span aria-hidden="true">' + emoji + '</span>' : '')) + '</div>'
    + '<div class="tx"><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p></div></article>';
}
function needSignIn(c, what) {
  c.innerHTML = '<div class="gate"><div style="font-size:3rem">🔐</div><h1>Sign in to use ' + esc(what) + '</h1><p class="sub">Use your Matix account, or create one in a few seconds.</p><button type="button" class="btn pri" id="gateIn">Sign in</button></div>';
  $('gateIn').onclick = function () { openAuth('signin'); };
}

/* ---------- my account: email + password ---------- */
function account(c) {
  c.innerHTML = '<div class="page"><h1>👤 My account</h1><p class="sub">Your email and password. Your email is private: nobody else can see it.</p><div id="acBody" class="card">Loading…</div></div>';
  fbGet('/members/' + enc(ME)).then(function (m) {
    m = m || {};
    var em = m.email || '', ver = !!m.emailVerified;
    $('acBody').innerHTML = '<div class="kv"><span>Username</span><b>@' + esc(ME) + '</b></div>'
      + '<div class="kv"><span>Email</span><b id="acEm">' + (em ? esc(maskEmail(em)) : '<i>not connected</i>') + '</b>' + (em ? '<button type="button" class="link" id="acShow">Show</button>' : '')
      + '<span class="pill ' + (ver ? 'ok' : 'no') + '">' + (ver ? 'Verified' : 'Not verified') + '</span></div>'
      + '<div class="row-btns">' + (em && !ver ? '<button type="button" class="btn pri" id="acVerify">✅ Verify my email</button>' : '')
      + '<button type="button" class="btn ghost" id="acEmail">✉️ ' + (em ? 'Change email' : 'Connect email') + '</button>'
      + '<button type="button" class="btn ghost" id="acPw">🔑 Change password</button></div><div id="acStep"></div><div class="err" id="acErr" role="alert"></div>';
    if ($('acShow')) $('acShow').onclick = function () { var s = this.textContent === 'Show'; $('acEm').textContent = s ? em : maskEmail(em); this.textContent = s ? 'Hide' : 'Show'; };
    var er = $('acErr'), step = $('acStep');
    function codeStep(purpose, email) {
      step.innerHTML = '<form id="acF" class="mini"><p class="sub">We sent a 6-digit code to <b>' + esc(maskEmail(email)) + '</b>.</p>' + codeFld('acC') + '<button class="btn pri" id="acGo">Confirm</button></form>';
      $('acC').focus();
      $('acF').onsubmit = function (e) {
        e.preventDefault(); er.textContent = '';
        checkCode(ME, purpose, $('acC').value).then(function (r) {
          if (!r.ok) { er.textContent = codeErr(r); return; }
          return attachEmail(ME, r.rec.email || email).then(function () { toast(purpose === 'verify' ? '✅ Email verified' : '✅ Email changed'); account(c); });
        }).catch(function () { er.textContent = 'Something went wrong. Try again.'; });
      };
    }
    if ($('acVerify')) $('acVerify').onclick = function () { er.textContent = ''; issueCode(ME, 'verify', em, { email: em }).then(function () { codeStep('verify', em); }, function (x) { er.textContent = sendErr(x); }); };
    $('acEmail').onclick = function () {
      er.textContent = '';
      step.innerHTML = '<form id="acF" class="mini">' + (em ? fld('Current password', 'acP', 'password', 'current-password') : '') + fld('New email', 'acM', 'email', 'email', 'you@example.com') + '<button class="btn pri" id="acGo">Send code</button></form>';
      step.querySelector('input').focus();
      $('acF').onsubmit = function (e) {
        e.preventDefault(); er.textContent = '';
        var ne = normE($('acM').value);
        if (!validEmail(ne)) { er.textContent = 'Enter a real email address.'; return; }
        (em ? passOk(ME, $('acP').value) : Promise.resolve(true)).then(function (ok) {
          if (!ok) { er.textContent = 'Wrong password.'; return; }
          return emailFree(ne, ME).then(function (free) {
            if (!free) { er.textContent = 'That email is already used by another account.'; return; }
            return issueCode(ME, 'change', ne, { email: ne }).then(function () { codeStep('change', ne); });
          });
        }).catch(function (x) { er.textContent = sendErr(x); });
      };
    };
    $('acPw').onclick = function () {
      er.textContent = '';
      step.innerHTML = '<form id="acF" class="mini">' + fld('Current password', 'acP', 'password', 'current-password') + fld('New password', 'acN', 'password', 'new-password') + fld('Repeat new password', 'acN2', 'password', 'new-password') + '<button class="btn pri" id="acGo">Change password</button></form>';
      $('acP').focus();
      $('acF').onsubmit = function (e) {
        e.preventDefault(); er.textContent = '';
        var n1 = $('acN').value, n2 = $('acN2').value;
        if (!n1 || n1.length < 4) { er.textContent = 'Password too short (min 4).'; return; }
        if (n1 !== n2) { er.textContent = 'The two passwords are different.'; return; }
        passOk(ME, $('acP').value).then(function (ok) {
          if (!ok) { er.textContent = 'Wrong password.'; return; }
          var rev = Date.now();
          return fbPatch('/members/' + enc(ME), { password: n1, passwordChangedAt: rev, sessionRev: rev }).then(function () { toast('🔑 Password changed. Other devices were signed out.'); account(c); });
        }).catch(function () { er.textContent = 'Something went wrong. Try again.'; });
      };
    };
  }).catch(function () { $('acBody').textContent = 'Could not load your account. Check your connection.'; });
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
      + '<div class="prog"><i style="width:' + (100 * k / N) + '%"></i></div><div class="q" aria-live="polite">' + esc(q.q) + (/\?$/.test(q.q) ? '' : ' = ?') + '</div>'
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
  box.innerHTML = '<div class="class" id="clBox"><div class="bar" style="justify-content:space-between"><span class="timer" id="clT">⏱ 30</span>'
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

/* ---------- 👑 owner tab: users, email sending, store buttons ---------- */
var LADDER = ['user', 'member', 'admin', 'manager'], RICON = { user: '🙂', member: '🎓', admin: '⭐', manager: '🛡️', owner: '👑' };
function owner(c, sub) {
  if (!isOwner()) { home(c); return; }
  sub = ['users', 'email', 'stores'].indexOf(sub) > -1 ? sub : 'users';
  c.innerHTML = '<div class="page"><h1>👑 Owner</h1><p class="sub">Only you can see this tab.</p>'
    + '<div class="tabs" role="tablist">' + [['users', '⬆️ User upgrading'], ['email', '📮 Email sending'], ['stores', '🛒 Store buttons']].map(function (t) {
      return '<a role="tab" class="tab" href="#/owner/' + t[0] + '" aria-selected="' + (sub === t[0]) + '">' + t[1] + '</a>';
    }).join('') + '</div><div id="owBody"></div></div>';
  ({ users: ownerUsers, email: ownerEmail, stores: ownerStores })[sub]($('owBody'));
}
function ownerUsers(box) {
  box.innerHTML = '<p class="sub">Promote members step by step (user → member → admin → manager), or delete an account. Deleting keeps a backup, so you can undo it from Messages in the app.</p>'
    + '<input class="search" id="uQ" type="search" placeholder="Search users…" aria-label="Search users"><div class="ulist" id="uList"><p class="sub">Loading…</p></div>';
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
function ownerEmail(box) {
  loadCfg(true).then(function () {
    var c = CFG || {};
    box.innerHTML = '<div class="card"><h2 class="h2">📮 Email sending <span class="pill ' + (emailReady() ? 'ok' : 'no') + '">' + (emailReady() ? 'On' : 'Off') + '</span></h2>'
      + '<p class="sub">Verification and password-reset codes (in the app and on this site) are emailed through your free EmailJS account. Paste its Service ID, Template ID and Public key. Until this is set, nobody is asked to verify.</p>'
      + '<form id="mjF" class="grid3">' + fld('Service ID', 'mjS', 'text', 'off', 'service_xxxxxxx') + fld('Template ID', 'mjT', 'text', 'off', 'template_xxxxxxx') + fld('Public key', 'mjK', 'text', 'off', 'xxxxxxxxxxxxxxx') + '</form>'
      + '<div class="row-btns"><button type="button" class="btn pri" id="mjSave">Save</button><button type="button" class="btn ghost" id="mjTest">Send me a test email</button></div><div class="err" id="mjErr" role="alert"></div></div>';
    $('mjS').value = c.serviceId || ''; $('mjT').value = c.templateId || ''; $('mjK').value = c.publicKey || '';
    $('mjSave').onclick = function () {
      var v = { serviceId: $('mjS').value.trim(), templateId: $('mjT').value.trim(), publicKey: $('mjK').value.trim(), updatedAt: Date.now(), by: ME };
      fbPut('/config/emailjs', v, true).then(function () { return loadCfg(true); }).then(function () { toast('✅ Saved'); ownerEmail(box); }).catch(function () { $('mjErr').textContent = 'Could not save. Check your connection.'; });
    };
    $('mjTest').onclick = function () {
      var b = this; b.disabled = true; $('mjErr').textContent = '';
      fbGet('/members/' + enc(ME)).then(function (m) {
        if (!m || !m.email) throw new Error('noemail');
        return sendMail(m.email, ME, newCode(), 'test').then(function () { toast('📬 Test email sent to ' + maskEmail(m.email)); });
      }).catch(function (x) { $('mjErr').textContent = String(x.message) === 'noemail' ? 'Connect your own email first (My account → Connect email).' : sendErr(x); })
        .then(function () { b.disabled = false; });
    };
  });
}
function ownerStores(box) {
  loadStores().then(function () {
    var pm = playMode(), s = STORE;
    box.innerHTML = '<div class="card"><h2 class="h2">Google Play</h2>'
      + '<fieldset class="radios"><legend>Button</legend>'
      + [['live', '✅ Live: “Get it on Google Play”'], ['testing', '🧪 In testing: Google Play + “Join the test”'], ['soon', '🔒 Coming soon (locked)']].map(function (o) {
        return '<label class="radio"><input type="radio" name="pm" value="' + o[0] + '"' + (pm === o[0] ? ' checked' : '') + '> ' + o[1] + '</label>';
      }).join('') + '</fieldset>'
      + fld('Play Store link', 'psL', 'url', 'off', PLAY) + fld('Testing link (for “Join the test”)', 'psT', 'url', 'off', PLAY_TEST)
      + '<div class="row-btns"><button type="button" class="btn pri" id="psSave">Save Google Play</button></div><div class="err" id="psErr" role="alert"></div></div>'
      + '<div class="card" style="margin-top:16px"><h2 class="h2">App Store</h2><p class="sub">Fill in ONE of these. Leave both empty for 🔒 Coming soon.</p>'
      + fld('App Store link', 'stL', 'url', 'off', 'https://apps.apple.com/app/…') + fld('TestFlight code or link', 'stT', 'text', 'off', 'ABCD1234 or https://testflight.apple.com/join/ABCD1234')
      + '<div class="row-btns"><button type="button" class="btn ghost" id="stLock">🔒 Coming soon</button><button type="button" class="btn pri" id="stSave">Save App Store</button></div><div class="err" id="stErr" role="alert"></div></div>'
      + '<p class="sub" style="margin-top:14px"><a href="#/">See how the home page looks →</a></p>';
    $('psL').value = PLAYCFG.link || ''; $('psT').value = PLAYCFG.testLink || ''; $('stL').value = s.link || ''; $('stT').value = s.testflight || '';
    $('psSave').onclick = function () {
      var mode = (box.querySelector('input[name=pm]:checked') || {}).value || 'testing', l = $('psL').value.trim(), t = $('psT').value.trim();
      if (l && !/^https:\/\/play\.google\.com\//i.test(l)) { $('psErr').textContent = 'The Play Store link should start with https://play.google.com/'; return; }
      if (t && !/^https:\/\/play\.google\.com\//i.test(t)) { $('psErr').textContent = 'The testing link should start with https://play.google.com/'; return; }
      var v = { mode: mode, updatedAt: Date.now(), by: ME }; if (l) v.link = l; if (t) v.testLink = t;
      fbPut('/site/playstore', v, true).then(function () { PLAYCFG = v; toast('✅ Google Play button saved'); }).catch(function () { $('psErr').textContent = 'Could not save. Check your connection.'; });
    };
    function saveApple(val) {
      fbPut('/site/appstore', val ? Object.assign(val, { updatedAt: Date.now(), by: ME }) : null, true).then(function () { STORE = val || {}; toast(val ? '✅ App Store button saved' : '🔒 App Store set to Coming soon'); ownerStores(box); })
        .catch(function () { $('stErr').textContent = 'Could not save. Check your connection.'; });
    }
    $('stSave').onclick = function () {
      var link = $('stL').value.trim(), tf = $('stT').value.trim();
      if (link && !/^https:\/\/(apps|itunes)\.apple\.com\//i.test(link)) { $('stErr').textContent = 'The App Store link should start with https://apps.apple.com/'; return; }
      if (tf && /^https?:\/\//i.test(tf) && !/^https:\/\/testflight\.apple\.com\/join\//i.test(tf)) { $('stErr').textContent = 'A TestFlight link looks like https://testflight.apple.com/join/CODE'; return; }
      if (!link && !tf) { saveApple(null); return; }
      saveApple(link ? { link: link } : { testflight: tf });
    };
    $('stLock').onclick = function () { saveApple(null); };
  });
}

/* ---------------- router ---------------- */
function route() {
  var c = $('content'), parts = (location.hash.replace(/^#\/?/, '') || 'home').split('/'), r = parts[0] || 'home';
  if (r === 'users') r = 'owner';
  D.querySelectorAll('#menu a').forEach(function (a) { if (a.dataset.r === r) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  if (r === 'exercises') { if (!ME) needSignIn(c, 'exercises'); else exercises(c); }
  else if (r === 'games') { if (!ME) needSignIn(c, 'games'); else games(c); }
  else if (r === 'account') { if (!ME) needSignIn(c, 'your account'); else account(c); }
  else if (r === 'owner') owner(c, parts[1]);
  else { r = 'home'; home(c); }
  D.title = { exercises: 'Exercises · Matix', games: 'Games · Matix', account: 'My account · Matix', owner: 'Owner · Matix' }[r] || 'Matix the Math Club';
  if (r !== 'home') { try { c.focus({ preventScroll: true }); } catch (e) {} W.scrollTo(0, 0); }
}

function boot() {
  wireModal();
  ME = getUser();
  W.addEventListener('hashchange', route);
  Promise.all([loadStores(), loadRole()]).then(paintAuth, paintAuth);
  paintAuth();
}
if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot); else boot();
})();
