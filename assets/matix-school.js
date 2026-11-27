/* =====================================================================
   🏫 Matix schools (Nov 2026)
   - Teachers (#/teacher/classes): make a class in a school, make student
     accounts for the kids (username + password, no email needed), print
     their logins, and give homework: a topic with an easy lesson and
     exercises. They see who has done it and the scores.
   - Students sign in with "🎒 I'm a student". In 🎮 Games (website and
     app) they find their homework and the games to play at home.
   - Owners (Owner → 🏫 Schools) see every school, teacher, class and
     student, and can delete any of them. Nobody else sees that list.
   Database (plain, not scrambled):
     /schools/<sid>                   {name, by, at}
     /classes/<cid>                   {name, school, teacher, grade, at, students:{<user>: name}}
     /student_of/<user>               {cls, school, teacher, name}
     /homework/<cid>/<hid>            {topic, n, note, grade, by, at}
     /homework_done/<cid>/<hid>/<u>   {right, n, at}
   Student accounts are normal Matix accounts in /members (scrambled like
   every account), so they also work in the app.
   ===================================================================== */
(function () {
'use strict';
var D = document, W = window;
function S() { return W.mxSite; }
function $(id) { return D.getElementById(id); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function enc(s) { return encodeURIComponent(s); }
function T(s) { try { return typeof W.tr === 'function' ? W.tr(s) : s; } catch (e) { return s; } }
function toast(m, k) { S().toast(T(m), k); }
function rid(n) { var a = new Uint32Array(2); crypto.getRandomValues(a); return (a[0].toString(36) + a[1].toString(36)).slice(0, n || 10); }
function raw(p) { return S().fbGet(p, true); }
function put(p, v) { return S().fbPut(p, v, true); }
function GRADES() { var L = W.mxArcade && W.mxArcade.levels; return L || [['1', 'Grade 1'], ['2', 'Grade 2'], ['3', 'Grade 3'], ['4', 'Grade 4'], ['5', 'Grade 5'], ['6', 'Grade 6'], ['7', 'Grade 7'], ['8', 'Grade 8'], ['9', 'Grade 9'], ['10', 'Grade 10'], ['11', 'Grade 11'], ['12', 'Grade 12'], ['13', 'College']]; }
function gName(g) { var r = GRADES()[(+g || 3) - 1]; return T(r ? r[1] : 'Grade ' + g); }
function lessons() { return (W.mxArcade && W.mxArcade.lessons) || []; }
function topicName(id) { var t = lessons().filter(function (x) { return x.id === id; })[0]; if (!t) return id; var fr = W.mxLang && W.mxLang.get() === 'fr'; return t.icon + ' ' + (fr ? t.n[1] : t.n[0]); }
function cnt(o) { return Object.keys(o || {}).length; }
function schoolCode() { var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s2 = ''; for (var i = 0; i < 6; i++) s2 += a[Math.floor(Math.random() * a.length)]; return s2; }
var WORDS = ['cat', 'sun', 'owl', 'fox', 'star', 'moon', 'tree', 'bee', 'frog', 'kite', 'leaf', 'cake', 'ship', 'fish', 'bear', 'lion'];
function kidPass() { return WORDS[Math.floor(Math.random() * WORDS.length)] + (10 + Math.floor(Math.random() * 90)); }
function normU(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9_]/g, '').slice(0, 20); }

/* ---------------- teacher: my classes ---------------- */
function teacher(c, parts) {
  var me = S().me();
  if (parts[2]) return classPage(c, decodeURIComponent(parts[2]));
  c.innerHTML = '<div class="page mxs"><p><a href="#/teacher">← ' + esc(T('Teacher')) + '</a></p><h1>🏫 ' + esc(T('My classes')) + '</h1>'
    + '<p class="sub">' + esc(T('Make a class, make an account for each student, then give homework: an easy lesson and exercises they do at home, on the website or in the app.')) + '</p>'
    + '<div id="mxsList" class="mxs-grid"><p class="sub">' + esc(T('Loading…')) + '</p></div>'
    + '<h2>➕ ' + esc(T('New class')) + '</h2><form id="mxsNew" class="card mxs-form">'
    + '<label>' + esc(T('Class name')) + '<input id="mxsN" maxlength="40" placeholder="' + esc(T('e.g. 5B maths')) + '" required></label>'
    + '<label>' + esc(T('Grade')) + '<select id="mxsG">' + GRADES().map(function (g) { return '<option value="' + g[0] + '"' + (g[0] === '5' ? ' selected' : '') + '>' + esc(T(g[1])) + '</option>'; }).join('') + '</select></label>'
    + '<label>' + esc(T('School')) + '<select id="mxsS"></select></label><label id="mxsSNl">' + esc(T('New school name')) + '<input id="mxsSN" maxlength="60" placeholder="' + esc(T('e.g. Cedar Hill School')) + '"></label>'
    + '<label id="mxsCl">' + esc(T('School code (from your school administrator)')) + '<input id="mxsC" maxlength="8" autocapitalize="characters" placeholder="ABC123"></label>'
    + '<button class="btn pri" id="mxsGo">' + esc(T('Make the class')) + '</button><div class="err" id="mxsE" role="alert"></div></form></div>';
  Promise.all([raw('/classes'), raw('/schools'), raw('/teacher_school/' + enc(me))]).then(function (r) {
    var cls = r[0] || {}, sch = r[1] || {}, ts = r[2] || {}, mine = Object.keys(cls).filter(function (k) { return cls[k] && cls[k].teacher === me; });
    var mySchools = Object.keys(sch).filter(function (k) { return sch[k] && (S().isOwner() || ts[k] || sch[k].by === me || mine.some(function (c2) { return cls[c2].school === k; })); });
    $('mxsList').innerHTML = mine.length ? mine.map(function (k) { var x = cls[k];
      return '<a class="mxs-card" href="#/teacher/classes/' + enc(k) + '"><b>' + esc(x.name) + '</b><small>' + esc(sch[x.school] ? sch[x.school].name : '') + ' · ' + esc(gName(x.grade)) + '</small><span>🎒 ' + cnt(x.students) + ' ' + esc(T('students')) + '</span></a>';
    }).join('') : '<p class="sub">' + esc(T('No classes yet. Make your first one below.')) + '</p>';
    var sel = $('mxsS');
    sel.innerHTML = mySchools.map(function (k) { return '<option value="' + esc(k) + '">' + esc(sch[k].name) + '</option>'; }).join('') + '<option value="__code">🔑 ' + esc(T('Join a school with its code')) + '</option>' + (S().isOwner() || S().isAdmin() ? '<option value="__new">➕ ' + esc(T('A new school')) + '</option>' : '') + '<option value="">' + esc(T('No school')) + '</option>';
    if (!mySchools.length) sel.value = '__code';
    function showNew() { $('mxsSNl').hidden = sel.value !== '__new'; $('mxsCl').hidden = sel.value !== '__code'; }
    sel.onchange = showNew; showNew();
    $('mxsNew').onsubmit = function (e) {
      e.preventDefault(); var er = $('mxsE'); er.textContent = '';
      var name = $('mxsN').value.trim(), g = +$('mxsG').value, sid = sel.value;
      if (!name) { er.textContent = T('Give the class a name.'); return; }
      var mk = Promise.resolve(sid);
      if (sid === '__code') {
        var code = $('mxsC').value.trim().toUpperCase(), hit = Object.keys(sch).filter(function (k) { return sch[k] && String(sch[k].code || '').toUpperCase() === code; })[0];
        if (!code || !hit) { er.textContent = T('No school has that code. Ask your school administrator for it.'); return; }
        sid = hit; mk = put('/teacher_school/' + enc(me) + '/' + hit, true).then(function () { return hit; });
      }
      if (sid === '__new') {
        var sn = $('mxsSN').value.trim(); if (!sn) { er.textContent = T('Type the school name.'); return; }
        sid = 's' + rid(9); mk = put('/schools/' + sid, { name: sn, by: me, code: schoolCode(), at: Date.now() }).then(function () { return sid; });
      }
      $('mxsGo').disabled = true;
      mk.then(function (s2) { var cid = 'c' + rid(9); return put('/classes/' + cid, { name: name, school: s2, teacher: me, grade: g, at: Date.now() }).then(function () { location.hash = '#/teacher/classes/' + enc(cid); }); })
        .catch(function () { $('mxsGo').disabled = false; er.textContent = T('Could not save. Check your connection.'); });
    };
  }).catch(function () { $('mxsList').innerHTML = '<p class="sub">' + esc(T('Could not load. Check your connection.')) + '</p>'; });
}

function classPage(c, cid, made) {
  var me = S().me();
  c.innerHTML = '<div class="page mxs"><p><a href="#/teacher/classes">← ' + esc(T('My classes')) + '</a></p><div id="mxsC"><p class="sub">' + esc(T('Loading…')) + '</p></div></div>';
  Promise.all([raw('/classes/' + enc(cid)), raw('/homework/' + enc(cid)), raw('/homework_done/' + enc(cid)), raw('/schools')]).then(function (r) {
    var x = r[0], hw = r[1] || {}, done = r[2] || {}, sch = r[3] || {};
    if (!x) { $('mxsC').innerHTML = '<p class="sub">' + esc(T('This class does not exist any more.')) + '</p>'; return; }
    if (x.teacher !== me && !S().isOwner()) { $('mxsC').innerHTML = '<p class="sub">' + esc(T('This is another teacher’s class.')) + '</p>'; return; }
    var st = x.students || {}, names = Object.keys(st).sort(), hids = Object.keys(hw).sort(function (a, b) { return (hw[b].at || 0) - (hw[a].at || 0); });
    var avail = lessons().filter(function (t) { return x.grade >= t.lv[0] && x.grade <= t.lv[1]; }), other = lessons().filter(function (t) { return avail.indexOf(t) < 0; });
    $('mxsC').innerHTML = '<h1>🏫 ' + esc(x.name) + '</h1><p class="sub">' + esc(sch[x.school] ? sch[x.school].name : '') + ' · ' + esc(gName(x.grade)) + '</p>'
      + '<h2>🎒 ' + esc(T('Students')) + ' (' + names.length + ')</h2>'
      + '<p class="sub">' + esc(T('Students sign in with “🎒 I’m a student” on matixthemathclub.com or in the Matix app, with the username and password below.')) + '</p>'
      + (names.length ? '<div class="ulist" id="mxsSt">' + names.map(function (u) { return '<div class="urow"><span class="nm">' + esc(st[u]) + '<small>@' + esc(u) + '</small></span><button type="button" data-pw="' + esc(u) + '">🔑 ' + esc(T('New password')) + '</button><button type="button" class="del" data-rm="' + esc(u) + '">🗑 ' + esc(T('Delete')) + '</button></div>'; }).join('') + '</div>' : '<p class="sub">' + esc(T('No students yet.')) + '</p>')
      + '<form id="mxsAdd" class="card mxs-form"><label>' + esc(T('Add students: one first name per line')) + '<textarea id="mxsKids" rows="4" placeholder="Lina&#10;Omar&#10;Sami"></textarea></label><button class="btn pri" id="mxsAddGo">➕ ' + esc(T('Make their accounts')) + '</button><div class="err" id="mxsAE" role="alert"></div></form>'
      + '<div id="mxsLogins"></div>'
      + '<h2>📝 ' + esc(T('Homework')) + '</h2>'
      + (hids.length ? '<div class="mxs-hw">' + hids.map(function (h) { var o = hw[h], d = done[h] || {}, k = cnt(d);
          return '<details class="card"><summary><b>' + esc(topicName(o.topic)) + '</b> · ' + o.n + ' ' + esc(T('questions')) + ' · ✅ ' + k + ' / ' + names.length + (o.note ? '<br><small>' + esc(o.note) + '</small>' : '') + '</summary>'
            + '<table class="mxs-t"><tr><th>' + esc(T('Student')) + '</th><th>' + esc(T('Score')) + '</th></tr>' + names.map(function (u) { var y = d[u]; return '<tr><td>' + esc(st[u]) + '</td><td>' + (y ? y.right + ' / ' + y.n : '—') + '</td></tr>'; }).join('') + '</table>'
            + '<button type="button" class="btn ghost" data-delhw="' + esc(h) + '">🗑 ' + esc(T('Delete this homework')) + '</button></details>'; }).join('') + '</div>' : '<p class="sub">' + esc(T('No homework yet.')) + '</p>')
      + '<form id="mxsHw" class="card mxs-form"><label>' + esc(T('Topic')) + '<select id="mxsT">' + avail.concat(other).map(function (t) { return '<option value="' + esc(t.id) + '">' + esc(topicName(t.id)) + (avail.indexOf(t) < 0 ? ' (' + esc(gName(t.lv[0])) + '+)' : '') + '</option>'; }).join('') + '</select></label>'
      + '<label>' + esc(T('Number of questions')) + '<select id="mxsQn"><option>5</option><option selected>10</option><option>15</option><option>20</option></select></label>'
      + '<label>' + esc(T('Note for the students (optional)')) + '<input id="mxsNote" maxlength="120" placeholder="' + esc(T('e.g. For Monday. Read the lesson first!')) + '"></label>'
      + '<button class="btn pri" id="mxsHwGo">📝 ' + esc(T('Give this homework')) + '</button><div class="err" id="mxsHE" role="alert"></div></form>'
      + '<h2>⚙️ ' + esc(T('Class')) + '</h2><button type="button" class="btn ghost del" id="mxsDelC">🗑 ' + esc(T('Delete this class and its student accounts')) + '</button>';
    if (made && made.length) showLogins(made, x);
    var again = function () { classPage(c, cid); };
    $('mxsAdd').onsubmit = function (e) {
      e.preventDefault(); var er = $('mxsAE'); er.textContent = '';
      var kids = $('mxsKids').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 60);
      if (!kids.length) { er.textContent = T('Type at least one first name.'); return; }
      $('mxsAddGo').disabled = true;
      var made = [];
      kids.reduce(function (p, name) { return p.then(function () { return makeKid(name, cid, x).then(function (r) { if (r) made.push(r); }); }); }, Promise.resolve())
        .then(function () { toast('🎒 ' + made.length + ' ' + T('accounts made')); classPage(c, cid, made); })
        .catch(function () { $('mxsAddGo').disabled = false; er.textContent = T('Could not save. Check your connection.'); });
    };
    $('mxsC').querySelectorAll('[data-pw]').forEach(function (b) { b.onclick = function () { var u = b.dataset.pw, p = kidPass(); if (!confirm(T('Give @') + u + ' ' + T('a new password?'))) return;
      S().fbPatch('/members/' + enc(u), { password: p, passwordChangedAt: Date.now(), sessionRev: Date.now() }).then(function () { showLogins([{ name: st[u], u: u, p: p }], x); }).catch(function () { toast('Could not save. Check your connection.', 'err'); }); }; });
    $('mxsC').querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { var u = b.dataset.rm; if (!confirm(T('Delete the account of') + ' ' + st[u] + ' (@' + u + ')? ' + T('Their homework results are deleted too.'))) return;
      b.disabled = true; deleteKid(u, cid).then(again, function () { b.disabled = false; toast('Could not delete. Check your connection.', 'err'); }); }; });
    $('mxsC').querySelectorAll('[data-delhw]').forEach(function (b) { b.onclick = function () { if (!confirm(T('Delete this homework and its results?'))) return; var h = b.dataset.delhw;
      Promise.all([put('/homework/' + enc(cid) + '/' + enc(h), null), put('/homework_done/' + enc(cid) + '/' + enc(h), null)]).then(again); }; });
    $('mxsHw').onsubmit = function (e) {
      e.preventDefault(); $('mxsHwGo').disabled = true;
      var hid = 'h' + Date.now().toString(36) + rid(3);
      put('/homework/' + enc(cid) + '/' + hid, { topic: $('mxsT').value, n: +$('mxsQn').value, note: $('mxsNote').value.trim(), grade: x.grade, by: me, at: Date.now() })
        .then(function () { names.forEach(function (u) { S().fbPost('/notifications/' + enc(u), { type: 'homework', title: '📝 ' + T('New homework'), body: topicName($('mxsT').value), at: Date.now(), from: me }).catch(function () {}); }); toast('📝 ' + T('Homework given')); again(); })
        .catch(function () { $('mxsHwGo').disabled = false; $('mxsHE').textContent = T('Could not save. Check your connection.'); });
    };
    $('mxsDelC').onclick = function () { if (!confirm(T('Delete the class') + ' “' + x.name + '”, ' + names.length + ' ' + T('student accounts and all its homework? This cannot be undone.'))) return;
      deleteClass(cid, x).then(function () { toast('🗑 ' + T('Class deleted')); location.hash = '#/teacher/classes'; }, function () { toast('Could not delete. Check your connection.', 'err'); }); };
  }).catch(function () { $('mxsC').innerHTML = '<p class="sub">' + esc(T('Could not load. Check your connection.')) + '</p>'; });
}
function showLogins(list, x, teachers) {
  var box = $('mxsLogins'); if (!box || !list.length) return;
  box.innerHTML = '<div class="card mxs-logins"><h3>🔑 ' + esc(T(teachers ? 'Logins to give your teachers' : 'Logins to give your students')) + '</h3><p class="sub">' + esc(T('Write them down or print them now: passwords are not shown again (you can always make a new one).')) + '</p>'
    + '<table class="mxs-t"><tr><th>' + esc(T('Name')) + '</th><th>' + esc(T('Username')) + '</th><th>' + esc(T('Password')) + '</th></tr>' + list.map(function (k) { return '<tr><td>' + esc(k.name) + '</td><td><b>' + esc(k.u) + '</b></td><td><b>' + esc(k.p) + '</b></td></tr>'; }).join('') + '</table>'
    + '<p class="sub">' + esc(T(teachers ? 'Sign in at matixthemathclub.com or in the Matix app, then open 🍎 Teacher.' : 'Sign in at matixthemathclub.com or in the Matix app with “🎒 I’m a student”.')) + '</p><button type="button" class="btn pri" id="mxsPrint">🖨 ' + esc(T('Print')) + '</button></div>';
  $('mxsPrint').onclick = function () { var w = W.open('', '_blank'); if (!w) return; w.document.write('<title>' + esc(x.name) + '</title><style>body{font:16px system-ui;padding:20px}td,th{border:1px solid #999;padding:8px 12px}table{border-collapse:collapse}</style><h2>' + esc(x.name) + '</h2>' + box.querySelector('table').outerHTML + '<p>matixthemathclub.com · 🎒 I’m a student</p>'); w.document.close(); w.print(); };
}
function makeKid(name, cid, x) {
  var base = normU(name) || 'student', tries = 0;
  function attempt() {
    var u = base + (10 + Math.floor(Math.random() * 990)); tries++;
    return S().fbGet('/members/' + enc(u), true).then(function (ex) {
      if (ex) return tries < 6 ? attempt() : null;
      var p = kidPass(), now = Date.now();
      return S().fbPut('/members/' + enc(u), { password: p, joinedAt: now, student: true, testUser: true, displayName: name, school: x.school, cls: cid, madeBy: S().me() }).then(function () {
        return Promise.all([S().fbPut('/profiles/' + enc(u), { displayName: name, bio: '', updatedAt: now }),
          put('/student_of/' + enc(u), { cls: cid, school: x.school, teacher: x.teacher, name: name }), put('/classes/' + enc(cid) + '/students/' + enc(u), name)]);
      }).then(function () { return { name: name, u: u, p: p }; });
    });
  }
  return attempt();
}
function deleteKid(u, cid) {
  return S().deleteAccount(u).then(function () {
    return raw('/homework_done/' + enc(cid)).then(function (d) {
      var jobs = [put('/student_of/' + enc(u), null), put('/classes/' + enc(cid) + '/students/' + enc(u), null)];
      Object.keys(d || {}).forEach(function (h) { if (d[h] && d[h][u]) jobs.push(put('/homework_done/' + enc(cid) + '/' + enc(h) + '/' + enc(u), null)); });
      return Promise.all(jobs);
    });
  });
}
function deleteClass(cid, x) {
  var kids = Object.keys((x && x.students) || {});
  return kids.reduce(function (p, u) { return p.then(function () { return deleteKid(u, cid).catch(function () {}); }); }, Promise.resolve())
    .then(function () { return Promise.all([put('/homework/' + enc(cid), null), put('/homework_done/' + enc(cid), null), put('/classes/' + enc(cid), null)]); });
}


/* ---------------- 🏫 school administrator: the person who makes the school ---------------- */
function admin(c, parts) {
  var me = S().me(), sid = parts[1] ? decodeURIComponent(parts[1]) : '';
  c.innerHTML = '<div class="page mxs"><div id="mxaB"><p class="sub">' + esc(T('Loading…')) + '</p></div></div>';
  Promise.all([raw('/schools'), raw('/school_admins/' + enc(me))]).then(function (r) {
    var sch = r[0] || {}, mine = r[1] || {}, own = S().isOwner();
    var list = Object.keys(sch).filter(function (k) { return sch[k] && (own || mine[k] || sch[k].by === me); });
    if (sid && list.indexOf(sid) > -1) return schoolPage(c, sid, sch[sid]);
    if (!sid && list.length === 1 && !own) { location.hash = '#/school/' + enc(list[0]); return; }
    $('mxaB').innerHTML = '<h1>🏫 ' + esc(T('My school')) + '</h1><p class="sub">' + esc(T('You make the school. Then you add its teachers, and they make their classes and student accounts. You can see and delete everything in your school.')) + '</p>'
      + (list.length ? '<div class="mxs-grid">' + list.map(function (k) { return '<a class="mxs-card" href="#/school/' + enc(k) + '"><b>🏫 ' + esc(sch[k].name) + '</b><small>' + esc(T('Code')) + ': ' + esc(sch[k].code || '—') + (sch[k].by ? ' · @' + esc(sch[k].by) : '') + '</small></a>'; }).join('') + '</div>' : '')
      + '<h2>➕ ' + esc(T('Make a school')) + '</h2><form id="mxaNew" class="card mxs-form"><label>' + esc(T('School name')) + '<input id="mxaN" maxlength="60" placeholder="' + esc(T('e.g. Cedar Hill School')) + '" required></label>'
      + '<button class="btn pri" id="mxaGo">' + esc(T('Make the school')) + '</button><div class="err" id="mxaE" role="alert"></div></form>';
    $('mxaNew').onsubmit = function (e) {
      e.preventDefault(); var n = $('mxaN').value.trim(); if (!n) { $('mxaE').textContent = T('Type the school name.'); return; }
      $('mxaGo').disabled = true; var id = 's' + rid(9);
      Promise.all([put('/schools/' + id, { name: n, by: me, code: schoolCode(), at: Date.now() }), put('/school_admins/' + enc(me) + '/' + id, true)])
        .then(function () { location.hash = '#/school/' + enc(id); }, function () { $('mxaGo').disabled = false; $('mxaE').textContent = T('Could not save. Check your connection.'); });
    };
  }).catch(function () { $('mxaB').innerHTML = '<p class="sub">' + esc(T('Could not load. Check your connection.')) + '</p>'; });
}
function schoolPage(c, sid, sc, made) {
  Promise.all([raw('/classes'), raw('/teacher_school')]).then(function (r) {
    var cls = r[0] || {}, ts = r[1] || {}, cids = Object.keys(cls).filter(function (k) { return cls[k] && cls[k].school === sid; });
    var tch = Object.keys(ts).filter(function (u) { return ts[u] && ts[u][sid]; });
    cids.forEach(function (k) { if (tch.indexOf(cls[k].teacher) < 0) tch.push(cls[k].teacher); }); tch.sort();
    var kids = cids.reduce(function (a, k) { return a + cnt(cls[k].students); }, 0);
    $('mxaB').innerHTML = '<p><a href="#/school">← ' + esc(T('My school')) + '</a></p><h1>🏫 ' + esc(sc.name) + '</h1>'
      + '<div class="card mxa-code"><span>' + esc(T('School code for teachers')) + '</span><b>' + esc(sc.code || '—') + '</b><small>' + esc(T('Teachers type this code when they make a class, to join your school.')) + '</small><button type="button" class="btn ghost" id="mxaNewCode">🔄 ' + esc(T('New code')) + '</button></div>'
      + '<p class="sub">🍎 ' + tch.length + ' ' + esc(T('teachers')) + ' · 📚 ' + cids.length + ' ' + esc(T('classes')) + ' · 🎒 ' + kids + ' ' + esc(T('students')) + '</p>'
      + '<h2>🍎 ' + esc(T('Teachers')) + '</h2><div class="ulist">' + (tch.map(function (u) { var n = cids.filter(function (k) { return cls[k].teacher === u; }).length;
          return '<div class="urow"><span class="nm">@' + esc(u) + '<small>' + n + ' ' + esc(T('classes')) + '</small></span><button type="button" data-out="' + esc(u) + '">' + esc(T('Remove from school')) + '</button><button type="button" class="del" data-delt="' + esc(u) + '">🗑 ' + esc(T('Delete account')) + '</button></div>'; }).join('') || '<p class="sub">' + esc(T('No teachers yet.')) + '</p>') + '</div>'
      + '<form id="mxaT" class="card mxs-form"><label>' + esc(T('Add teachers: one name per line')) + '<textarea id="mxaTN" rows="3" placeholder="Ms Haddad&#10;Mr Karam"></textarea></label><button class="btn pri" id="mxaTGo">➕ ' + esc(T('Make their teacher accounts')) + '</button><div class="err" id="mxaTE" role="alert"></div></form><div id="mxsLogins"></div>'
      + '<h2>📚 ' + esc(T('Classes')) + '</h2>' + (cids.map(function (k) { var x = cls[k], st = x.students || {};
          return '<details class="card mxo-c"><summary>📚 <b>' + esc(x.name) + '</b> · ' + esc(gName(x.grade)) + ' · 🍎 @' + esc(x.teacher) + ' · 🎒 ' + cnt(st) + '</summary><div class="ulist">'
            + Object.keys(st).sort().map(function (u) { return '<div class="urow"><span class="nm">' + esc(st[u]) + '<small>@' + esc(u) + '</small></span><button type="button" class="del" data-kid="' + esc(u) + '" data-c="' + esc(k) + '">🗑 ' + esc(T('Delete student')) + '</button></div>'; }).join('')
            + '</div><a class="btn ghost" href="#/teacher/classes/' + enc(k) + '">' + esc(T('Open the class')) + '</a> <button type="button" class="btn ghost del" data-cls="' + esc(k) + '">🗑 ' + esc(T('Delete class')) + '</button></details>'; }).join('') || '<p class="sub">' + esc(T('No classes yet.')) + '</p>')
      + '<h2>⚙️ ' + esc(T('School')) + '</h2><button type="button" class="btn ghost del" id="mxaDel">🗑 ' + esc(T('Delete the school, its classes and student accounts')) + '</button>';
    if (made && made.length) showLogins(made, sc, true);
    var again = function () { schoolPage(c, sid, sc); };
    function fail() { toast('Could not save. Check your connection.', 'err'); again(); }
    $('mxaNewCode').onclick = function () { if (!confirm(T('Make a new code? The old one stops working.'))) return; sc.code = schoolCode(); put('/schools/' + enc(sid) + '/code', sc.code).then(again, fail); };
    $('mxaT').onsubmit = function (e) {
      e.preventDefault(); var names = $('mxaTN').value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 40);
      if (!names.length) { $('mxaTE').textContent = T('Type at least one name.'); return; } $('mxaTGo').disabled = true; var made = [];
      names.reduce(function (pr, n) { return pr.then(function () { return makeTeacher(n, sid).then(function (x) { if (x) made.push(x); }); }); }, Promise.resolve())
        .then(function () { toast('🍎 ' + made.length + ' ' + T('accounts made')); schoolPage(c, sid, sc, made); }, fail);
    };
    $('mxaB').onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.out) { if (!confirm(T('Remove') + ' @' + b.dataset.out + ' ' + T('from the school? Their classes stay.'))) return; put('/teacher_school/' + enc(b.dataset.out) + '/' + enc(sid), null).then(again, fail); }
      else if (b.dataset.delt) { var u = b.dataset.delt, theirs = cids.filter(function (k) { return cls[k].teacher === u; });
        if (!confirm(T('Delete the teacher account') + ' @' + u + ', ' + theirs.length + ' ' + T('classes and their student accounts?'))) return; b.disabled = true;
        theirs.reduce(function (pr, k) { return pr.then(function () { return deleteClass(k, cls[k]); }); }, Promise.resolve())
          .then(function () { return S().deleteAccount(u); }).then(function () { return Promise.all([put('/teachers/' + enc(u), null), put('/teacher_school/' + enc(u), null)]); }).then(again, fail); }
      else if (b.dataset.kid) { if (!confirm(T('Delete the student account') + ' @' + b.dataset.kid + '?')) return; b.disabled = true; deleteKid(b.dataset.kid, b.dataset.c).then(again, fail); }
      else if (b.dataset.cls) { var x = cls[b.dataset.cls]; if (!confirm(T('Delete the class') + ' “' + x.name + '” ' + T('and its') + ' ' + cnt(x.students) + ' ' + T('student accounts?'))) return; b.disabled = true; deleteClass(b.dataset.cls, x).then(again, fail); }
      else if (b.id === 'mxaDel') { if (!confirm(T('Delete the school') + ' “' + sc.name + '”, ' + cids.length + ' ' + T('classes and') + ' ' + kids + ' ' + T('student accounts?'))) return; b.disabled = true; deleteSchool(sid, cids, cls, tch).then(function () { location.hash = '#/school'; }, fail); }
    };
  }).catch(function () { $('mxaB').innerHTML = '<p class="sub">' + esc(T('Could not load. Check your connection.')) + '</p>'; });
}
function makeTeacher(name, sid) {
  var base = normU(name) || 'teacher', tries = 0;
  function attempt() {
    var u = base + (10 + Math.floor(Math.random() * 990)); tries++;
    return S().fbGet('/members/' + enc(u), true).then(function (ex) {
      if (ex) return tries < 6 ? attempt() : null;
      var p = kidPass() + kidPass().slice(-2), now = Date.now();
      return S().fbPut('/members/' + enc(u), { password: p, joinedAt: now, teacher: true, testUser: true, displayName: name, school: sid, madeBy: S().me() }).then(function () {
        return Promise.all([S().fbPut('/profiles/' + enc(u), { displayName: name, bio: '', updatedAt: now }), put('/teachers/' + enc(u), true), put('/teacher_school/' + enc(u) + '/' + enc(sid), true)]);
      }).then(function () { return { name: name, u: u, p: p }; });
    });
  }
  return attempt();
}
function deleteSchool(sid, cids, cls, tch) {
  return cids.reduce(function (pr, k) { return pr.then(function () { return deleteClass(k, cls[k]); }); }, Promise.resolve())
    .then(function () { return Promise.all(tch.map(function (u) { return put('/teacher_school/' + enc(u) + '/' + enc(sid), null); })); })
    .then(function () { return raw('/school_admins'); }).then(function (a) { var jobs = [put('/schools/' + enc(sid), null)]; Object.keys(a || {}).forEach(function (u) { if (a[u] && a[u][sid]) jobs.push(put('/school_admins/' + enc(u) + '/' + enc(sid), null)); }); return Promise.all(jobs); });
}

/* ---------------- owner: every school, teacher, class and student ---------------- */
function owner(box) {
  box.innerHTML = '<p class="sub">' + esc(T('Every school, teacher, class and student. Only owners can see this. Deleting a school or class also deletes its student accounts.')) + '</p><div id="mxoS"><p class="sub">' + esc(T('Loading…')) + '</p></div>';
  Promise.all([raw('/schools'), raw('/classes'), raw('/teachers')]).then(function (r) {
    var sch = r[0] || {}, cls = r[1] || {}, tch = r[2] || {}, cids = Object.keys(cls).filter(function (k) { return cls[k]; });
    var bySchool = {}; cids.forEach(function (k) { var s = cls[k].school || '_'; (bySchool[s] = bySchool[s] || []).push(k); });
    var sids = Object.keys(sch).filter(function (k) { return sch[k]; }).concat(bySchool._ ? ['_'] : []);
    var kidsN = cids.reduce(function (a, k) { return a + cnt(cls[k].students); }, 0);
    function classHtml(k) { var x = cls[k], st = x.students || {};
      return '<details class="mxo-c"><summary>📚 <b>' + esc(x.name) + '</b> · ' + esc(gName(x.grade)) + ' · 🍎 @' + esc(x.teacher) + ' · 🎒 ' + cnt(st) + '</summary>'
        + '<div class="ulist">' + Object.keys(st).sort().map(function (u) { return '<div class="urow"><span class="nm">' + esc(st[u]) + '<small>@' + esc(u) + '</small></span><button type="button" class="del" data-kid="' + esc(u) + '" data-c="' + esc(k) + '">🗑 ' + esc(T('Delete student')) + '</button></div>'; }).join('') + '</div>'
        + '<button type="button" class="btn ghost del" data-cls="' + esc(k) + '">🗑 ' + esc(T('Delete class')) + '</button></details>'; }
    $('mxoS').innerHTML = '<p class="sub">🏫 ' + (sids.length - (bySchool._ ? 1 : 0)) + ' ' + esc(T('schools')) + ' · 📚 ' + cids.length + ' ' + esc(T('classes')) + ' · 🍎 ' + cnt(tch) + ' ' + esc(T('teachers')) + ' · 🎒 ' + kidsN + ' ' + esc(T('students')) + '</p>'
      + (sids.length ? sids.map(function (s) { var list = bySchool[s] || [];
        return '<details class="card mxo-s" open><summary>🏫 <b>' + esc(s === '_' ? T('No school') : sch[s].name) + '</b>' + (s !== '_' && sch[s].by ? ' · ' + esc(T('made by')) + ' @' + esc(sch[s].by) : '') + ' · ' + list.length + ' ' + esc(T('classes')) + '</summary>'
          + (list.map(classHtml).join('') || '<p class="sub">' + esc(T('No classes.')) + '</p>')
          + (s !== '_' ? '<a class="btn ghost" href="#/school/' + enc(s) + '">🏫 ' + esc(T('Open as administrator')) + '</a> <button type="button" class="btn ghost del" data-sch="' + esc(s) + '">🗑 ' + esc(T('Delete school')) + '</button>' : '') + '</details>'; }).join('') : '<p class="sub">' + esc(T('No schools yet.')) + '</p>')
      + '<h3>🍎 ' + esc(T('Teachers')) + '</h3><div class="ulist">' + (Object.keys(tch).filter(function (u) { return tch[u]; }).sort().map(function (u) {
          var n = cids.filter(function (k) { return cls[k].teacher === u; }).length;
          return '<div class="urow"><span class="nm">@' + esc(u) + '<small>' + n + ' ' + esc(T('classes')) + '</small></span><button type="button" class="del" data-tch="' + esc(u) + '">✕ ' + esc(T('Remove teacher')) + '</button></div>'; }).join('') || '<p class="sub">' + esc(T('No teachers.')) + '</p>') + '</div>';
    var again = function () { owner(box); };
    box.onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.kid) { if (!confirm(T('Delete the student account') + ' @' + b.dataset.kid + '?')) return; b.disabled = true; deleteKid(b.dataset.kid, b.dataset.c).then(again, fail); }
      else if (b.dataset.cls) { var x = cls[b.dataset.cls]; if (!confirm(T('Delete the class') + ' “' + x.name + '” ' + T('and its') + ' ' + cnt(x.students) + ' ' + T('student accounts?'))) return; b.disabled = true; deleteClass(b.dataset.cls, x).then(again, fail); }
      else if (b.dataset.sch) { var s = b.dataset.sch, list = bySchool[s] || [], n = list.reduce(function (a, k) { return a + cnt(cls[k].students); }, 0);
        if (!confirm(T('Delete the school') + ' “' + sch[s].name + '”, ' + list.length + ' ' + T('classes and') + ' ' + n + ' ' + T('student accounts?'))) return; b.disabled = true;
        raw('/teacher_school').then(function (ts) { var tl = Object.keys(ts || {}).filter(function (u) { return ts[u] && ts[u][s]; }); return deleteSchool(s, list, cls, tl); }).then(again, fail); }
      else if (b.dataset.tch) { var u = b.dataset.tch; if (!confirm(T('Remove teacher mode from') + ' @' + u + '? ' + T('Their classes stay until you delete them.'))) return; b.disabled = true;
        Promise.all([put('/teachers/' + enc(u), null), S().fbPatch('/members/' + enc(u), { teacher: false })]).then(again, fail); }
    };
    function fail() { toast('Could not delete. Check your connection.', 'err'); again(); }
  }).catch(function () { $('mxoS').innerHTML = '<p class="sub">' + esc(T('Could not load. Check your connection.')) + '</p>'; });
}

if (W.trAdd) W.trAdd({"My school": "Mon école", "You make the school. Then you add its teachers, and they make their classes and student accounts. You can see and delete everything in your school.": "Tu crées l’école. Ensuite tu ajoutes ses enseignants, qui créent leurs classes et les comptes de leurs élèves. Tu peux tout voir et tout supprimer dans ton école.", "Code": "Code", "Make a school": "Créer une école", "School name": "Nom de l’école", "Make the school": "Créer l’école", "School code for teachers": "Code de l’école pour les enseignants", "Teachers type this code when they make a class, to join your school.": "Les enseignants tapent ce code en créant une classe, pour rejoindre ton école.", "New code": "Nouveau code", "Remove from school": "Retirer de l’école", "Delete account": "Supprimer le compte", "No teachers yet.": "Pas encore d’enseignant.", "Add teachers: one name per line": "Ajouter des enseignants : un nom par ligne", "Make their teacher accounts": "Créer leurs comptes enseignants", "Classes": "Classes", "Open the class": "Ouvrir la classe", "No classes yet.": "Pas encore de classe.", "Delete the school, its classes and student accounts": "Supprimer l’école, ses classes et les comptes élèves", "Make a new code? The old one stops working.": "Créer un nouveau code ? L’ancien ne marchera plus.", "Type at least one name.": "Écris au moins un nom.", "Remove": "Retirer", "from the school? Their classes stay.": "de l’école ? Ses classes restent.", "Delete the teacher account": "Supprimer le compte enseignant", "classes and their student accounts?": "classes et les comptes de leurs élèves ?", "Open as administrator": "Ouvrir comme administrateur", "administrator": "administrateur", "School code (from your school administrator)": "Code de l’école (donné par l’administrateur)", "Join a school with its code": "Rejoindre une école avec son code", "No school has that code. Ask your school administrator for it.": "Aucune école n’a ce code. Demande-le à l’administrateur de ton école."});
if (W.trAdd) W.trAdd({
  'My classes': 'Mes classes', 'Teacher': 'Enseignant', 'Loading…': 'Chargement…', 'New class': 'Nouvelle classe', 'Class name': 'Nom de la classe', 'e.g. 5B maths': 'ex. 5e B maths', 'Grade': 'Année', 'School': 'École',
  'New school name': 'Nom de la nouvelle école', 'e.g. Cedar Hill School': 'ex. École des Cèdres', 'Make the class': 'Créer la classe', 'students': 'élèves', 'No classes yet. Make your first one below.': 'Pas encore de classe. Crée la première ci-dessous.',
  'A new school': 'Une nouvelle école', 'Give the class a name.': 'Donne un nom à la classe.', 'Type the school name.': 'Écris le nom de l’école.', 'Could not save. Check your connection.': 'Impossible d’enregistrer. Vérifie ta connexion.',
  'Could not load. Check your connection.': 'Impossible de charger. Vérifie ta connexion.', 'Make a class, make an account for each student, then give homework: an easy lesson and exercises they do at home, on the website or in the app.': 'Crée une classe, un compte pour chaque élève, puis donne des devoirs : une leçon facile et des exercices à faire à la maison, sur le site ou dans l’appli.',
  'This class does not exist any more.': 'Cette classe n’existe plus.', 'This is another teacher’s class.': 'C’est la classe d’un autre enseignant.', 'Students': 'Élèves', 'New password': 'Nouveau mot de passe', 'Delete': 'Supprimer', 'No students yet.': 'Pas encore d’élève.',
  'Students sign in with “🎒 I’m a student” on matixthemathclub.com or in the Matix app, with the username and password below.': 'Les élèves se connectent avec « 🎒 Je suis élève » sur matixthemathclub.com ou dans l’appli Matix, avec le nom d’utilisateur et le mot de passe ci-dessous.',
  'Add students: one first name per line': 'Ajouter des élèves : un prénom par ligne', 'Make their accounts': 'Créer leurs comptes', 'Homework': 'Devoirs', 'questions': 'questions', 'Student': 'Élève', 'Score': 'Score', 'Delete this homework': 'Supprimer ce devoir', 'No homework yet.': 'Pas encore de devoir.',
  'Topic': 'Thème', 'Number of questions': 'Nombre de questions', 'Note for the students (optional)': 'Mot pour les élèves (facultatif)', 'e.g. For Monday. Read the lesson first!': 'ex. Pour lundi. Lis d’abord la leçon !', 'Give this homework': 'Donner ce devoir',
  'Class': 'Classe', 'Delete this class and its student accounts': 'Supprimer cette classe et les comptes de ses élèves', 'Type at least one first name.': 'Écris au moins un prénom.', 'accounts made': 'comptes créés', 'Give @': 'Donner à @', 'a new password?': 'un nouveau mot de passe ?',
  'Delete the account of': 'Supprimer le compte de', 'Their homework results are deleted too.': 'Ses résultats de devoirs sont aussi supprimés.', 'Delete this homework and its results?': 'Supprimer ce devoir et ses résultats ?', 'New homework': 'Nouveau devoir', 'Homework given': 'Devoir donné',
  'Delete the class': 'Supprimer la classe', 'student accounts and all its homework? This cannot be undone.': 'comptes d’élèves et tous ses devoirs ? C’est définitif.', 'Class deleted': 'Classe supprimée', 'Logins to give your students': 'Identifiants à donner à tes élèves',
  'Write them down or print them now: passwords are not shown again (you can always make a new one).': 'Note-les ou imprime-les maintenant : les mots de passe ne sont plus affichés ensuite (tu peux toujours en créer un nouveau).', 'Name': 'Nom', 'Username': 'Nom d’utilisateur', 'Password': 'Mot de passe',
  'Sign in at matixthemathclub.com or in the Matix app with “🎒 I’m a student”.': 'Connecte-toi sur matixthemathclub.com ou dans l’appli Matix avec « 🎒 Je suis élève ».', 'Print': 'Imprimer',
  'Every school, teacher, class and student. Only owners can see this. Deleting a school or class also deletes its student accounts.': 'Toutes les écoles, enseignants, classes et élèves. Seuls les propriétaires voient ceci. Supprimer une école ou une classe supprime aussi les comptes de ses élèves.',
  'Delete student': 'Supprimer l’élève', 'Delete class': 'Supprimer la classe', 'schools': 'écoles', 'classes': 'classes', 'teachers': 'enseignants', 'No school': 'Sans école', 'made by': 'créée par', 'No classes.': 'Aucune classe.', 'Delete school': 'Supprimer l’école', 'No schools yet.': 'Pas encore d’école.',
  'Teachers': 'Enseignants', 'Remove teacher': 'Retirer enseignant', 'No teachers.': 'Aucun enseignant.', 'Delete the student account': 'Supprimer le compte élève', 'and its': 'et ses', 'student accounts?': 'comptes d’élèves ?', 'Delete the school': 'Supprimer l’école', 'classes and': 'classes et',
  'Remove teacher mode from': 'Retirer le mode enseignant à', 'Their classes stay until you delete them.': 'Ses classes restent jusqu’à ce que tu les supprimes.', 'Could not delete. Check your connection.': 'Impossible de supprimer. Vérifie ta connexion.'
});
W.mxSchool = { teacher: teacher, owner: owner, admin: admin };
})();
