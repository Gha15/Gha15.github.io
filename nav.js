/* nav.js — Matix — Apple-style always-visible top bar */
(function() {
    'use strict';

    // FIX: Prevent the script from running inside your preview iframes
    if (window.self !== window.top) return;

    if (document.getElementById('mx-nav-bar')) return;

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/sw.js').catch(function() {});
        });
    }

    /* --- AUTH --- */
    var VALID_MEMBERS = {
        ghadi: 'iamtheownerofmatix',
        dahlia: 'cheeseflower',
        yara: 'yara10yoyo20',
        jad: 'ilikebatatameshwiyye',
        marwan: 'ilikebeingnumberonebutiamnumbertwo',
        mak: 'mak2130',
        hicham: 'pwrbulleye'
    };

    var FIREBASE_URL = 'https://matix-1d538-default-rtdb.firebaseio.com';
    var authListeners = [];

    function notifyAuthChange() {
        var u = getUser();
        authListeners.forEach(function(cb) {
            try { cb(u); } catch (e) {}
        });
        try {
            window.dispatchEvent(new CustomEvent('mx-auth-changed', { detail: { user: u } }));
        } catch (e) {}
    }

    function getUser() {
        return sessionStorage.getItem('mx_user') || sessionStorage.getItem('matix_auth_user') || null;
    }

    function setUser(user) {
        sessionStorage.setItem('mx_user', user);
        sessionStorage.setItem('matix_auth_user', user);
        notifyAuthChange();
    }

    /* Sign in checks hardcoded members first, then accounts saved in Firebase,
       then falls back to any pre-upgrade accounts saved locally in this browser. */
    function doSignIn(rawUser, pass, cb) {
        /* Usernames never contain spaces; strip them so "you sign in with your
           current username" works even if the field has stray whitespace. */
        var u = (rawUser || '').toLowerCase().replace(/\s+/g, '').trim();
        if (!u || !pass) { cb(false); return; }
        /* Block sign-in for banned users; ghadi can never be banned. */
        function finishSignIn() {
            checkBan(u, function(ban) {
                if (ban) { cb(false, ban); return; }
                setUser(u);
                cb(true);
            });
        }
        function tryLocalFallback() {
            try {
                var m = JSON.parse(localStorage.getItem('mx_joined') || '{}');
                if (m[u] && m[u] === pass) {
                    finishSignIn();
                    return;
                }
            } catch (e) {}
            cb(false);
        }
        function tryHardcoded() {
            if (VALID_MEMBERS[u] && VALID_MEMBERS[u] === pass) {
                finishSignIn();
                return;
            }
            tryLocalFallback();
        }
        /* A password saved in Firebase (set via "Change Password" on the users
           page) ALWAYS takes precedence over the built-in member password, so
           changing your password actually replaces the old one. */
        fetch(FIREBASE_URL + '/members/' + encodeURIComponent(u) + '.json')
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data && data.password) {
                    if (data.password === pass) { finishSignIn(); }
                    else { cb(false); }
                    return;
                }
                tryHardcoded();
            })
            .catch(tryHardcoded);
    }

    /* Join creates a Firebase-backed account (readable by anyone with the DB URL,
       same trust level as the hardcoded member list above) instead of a
       browser-only localStorage account. */
    function doJoin(rawUser, pass, testUser, cb) {
        if (typeof testUser === 'function') { cb = testUser; testUser = true; }
        var u = (rawUser || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (!u || u.length < 2) { cb('short'); return; }
        if (VALID_MEMBERS[u]) { cb('reserved'); return; }
        fetch(FIREBASE_URL + '/members/' + encodeURIComponent(u) + '.json')
            .then(function(r) { return r.json(); })
            .then(function(existing) {
                if (existing) { cb('taken'); return; }
                return fetch(FIREBASE_URL + '/members/' + encodeURIComponent(u) + '.json', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: pass, joinedAt: Date.now(), testUser: testUser !== false })
                }).then(function() {
                    setUser(u);
                    fetch(FIREBASE_URL + '/profiles/' + encodeURIComponent(u) + '.json', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            displayName: u,
                            bio: '',
                            ideasText: '',
                            memesText: '',
                            updatedAt: Date.now()
                        })
                    }).catch(function() {});
                    cb('ok');
                });
            })
            .catch(function() { cb('error'); });
    }

    function doSignOut() {
        sessionStorage.removeItem('mx_user');
        sessionStorage.removeItem('matix_auth_user');
        notifyAuthChange();
    }

    /* --- BANS ---
       Bans live in Firebase at /bans/<user> = { until, reason, by, at }.
       `until` is a ms timestamp (0 = permanent). Expired bans self-clear on read.
       ghadi (the owner) can never be banned. */
    function normUser(user) {
        var clean = String(user || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (clean === 'matix' || clean === 'ghadimatix') return 'ghadi';
        return clean;
    }

    function checkBan(user, cb) {
        var u = normUser(user);
        if (!u || u === 'ghadi') { cb(null); return; }
        fetch(FIREBASE_URL + '/bans/' + encodeURIComponent(u) + '.json')
            .then(function(r) { return r.json(); })
            .then(function(b) {
                if (b && (b.until === 0 || b.until > Date.now())) { cb(b); return; }
                if (b) {
                    fetch(FIREBASE_URL + '/bans/' + encodeURIComponent(u) + '.json', { method: 'DELETE' }).catch(function() {});
                }
                cb(null);
            })
            .catch(function() { cb(null); });
    }

    function banUser(user, ms, reason, cb) {
        var u = normUser(user);
        if (!u || u === 'ghadi') { cb(false); return; }
        var payload = {
            until: ms > 0 ? (Date.now() + ms) : 0,
            reason: (reason || '').trim().slice(0, 300),
            by: getUser() || 'ghadi',
            at: Date.now()
        };
        fetch(FIREBASE_URL + '/bans/' + encodeURIComponent(u) + '.json', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(function() { cb(true, payload); }).catch(function() { cb(false); });
    }

    function unbanUser(user, cb) {
        var u = normUser(user);
        if (!u) { cb(false); return; }
        fetch(FIREBASE_URL + '/bans/' + encodeURIComponent(u) + '.json', { method: 'DELETE' })
            .then(function() { cb(true); }).catch(function() { cb(false); });
    }

    function formatBanRemaining(ban) {
        if (!ban) return '';
        if (ban.until === 0) return 'Permanent';
        var ms = ban.until - Date.now();
        if (ms <= 0) return 'Expired';
        var mins = Math.round(ms / 60000);
        if (mins < 60) return mins + ' min left';
        var hrs = Math.round(mins / 60);
        if (hrs < 24) return hrs + ' hr left';
        var days = Math.round(hrs / 24);
        return days + ' day' + (days === 1 ? '' : 's') + ' left';
    }

    /* Styled ban notice (replaces the native alert popup). */
    function showBanNotice(ban) {
        var existing = document.getElementById('mx-ban-overlay');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        var ov = mk('div', 'mx-ban-overlay');
        ov.id = 'mx-ban-overlay';
        var modal = mk('div', 'mx-ban-modal');
        var ico = mk('div', 'mx-ban-ico');
        ico.textContent = '\ud83d\udeab';
        var h2 = mk('h2');
        h2.textContent = 'You are banned';
        var rs = mk('p', 'mx-ban-reason');
        rs.textContent = (ban && ban.reason) ? ban.reason : 'No reason was provided.';
        modal.appendChild(ico);
        modal.appendChild(h2);
        modal.appendChild(rs);
        if (ban && ban.by) {
            var by = mk('p', 'mx-ban-by');
            by.textContent = 'Banned by ' + ban.by;
            modal.appendChild(by);
        }
        var tm = mk('p', 'mx-ban-time');
        tm.textContent = ban ? formatBanRemaining(ban) : '';
        modal.appendChild(tm);
        var cls = mk('button', 'mx-ban-close');
        cls.textContent = 'OK';
        cls.addEventListener('click', function() {
            if (ov.parentNode) ov.parentNode.removeChild(ov);
        });
        modal.appendChild(cls);
        ov.appendChild(modal);
        (document.body || document.documentElement).appendChild(ov);
    }

    /* --- HELPERS --- */
    function mk(tag, cls) {
        var el = document.createElement(tag);
        if (cls) el.className = cls;
        return el;
    }

    function vd() {
        return mk('div', 'mx-vd');
    }

    function normalizeProfileUser(user) {
        var clean = String(user || 'ghadi').toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (clean === 'matix' || clean === 'ghadimatix') return 'ghadi';
        return clean || 'ghadi';
    }

    /* --- NAV LINKS --- */
    var LINKS = [{
            href: '/',
            label: 'Home',
            iframe: true
        },
        {
            href: '/merch',
            label: 'Merch',
            iframe: true
        },
        {
            href: '/aboutus',
            label: 'About Us',
            iframe: true
        },
        {
            href: '/funny',
            label: 'Jokes / Memes',
            iframe: true
        },
        {
            href: '/FAQ',
            label: 'FAQ',
            iframe: true
        },
        {
            href: '/games',
            label: 'Games',
            subs: [{
                    href: '/games/themathplanegame',
                    label: '✈️  Math Plane Game',
                    iframe: true
                },
                {
                    href: '/games/mathfight',
                    label: '⚔️  Math Fight',
                    iframe: true
                },
                {
                    href: '/games/treegrowinggame',
                    label: '🌳  Tree Growing Game',
                    iframe: true
                },
                {
                    href: '/games/minigames/virtualpetgame',
                    label: '🐾  Virtual Pet Game',
                    iframe: true
                }
            ]
        },
        {
            href: '/button',
            label: 'Just A Button',
            iframe: true
        },
        {
            href: '/contactus',
            label: 'Contact us',
            iframe: true
        },
        {
            href: '/usefulotherstuffcauseicannotgetanotherdomain',
            label: 'Tools',
            subs: [{
                    href: '/usefulotherstuffcauseicannotgetanotherdomain/tools/calculator',
                    label: '🔢  Calculator',
                    iframe: true
                },
                {
                    href: '/usefulotherstuffcauseicannotgetanotherdomain/tools/calendar',
                    label: '📅  Calendar',
                    iframe: true
                },
                {
                    href: '/usefulotherstuffcauseicannotgetanotherdomain/tools/function-plotter',
                    label: '📈  Function Plotter',
                    iframe: true
                },
                {
                    href: '/usefulotherstuffcauseicannotgetanotherdomain/tools/graphing-sandbox',
                    label: '📊  Graphing Sandbox',
                    iframe: true
                },
                {
                    href: '/usefulotherstuffcauseicannotgetanotherdomain/tools/stopwatch',
                    label: '⏱️  Stopwatch',
                    iframe: true
                },
                {
                    href: '/usefulotherstuffcauseicannotgetanotherdomain/tools/timer',
                    label: '⏰  Timer',
                    iframe: true
                }
            ]
        },
        {
            href: '/ideas',
            label: 'Ideas',
            iframe: true
        },
        {
            href: '/membersonly',
            label: 'Members',
            subs: [{
                    href: '/membersonly',
                    label: '🔐  Members Dashboard',
                    iframe: true
                },
                {
                    href: '/membersonly/points',
                    label: '⭐  My Points',
                    iframe: true
                },
                {
                    href: '/membersonly/points/how-to-get',
                    label: '📈  How to Earn Points',
                    iframe: true
                },
                {
                    href: '/membersonly/points/use-points',
                    label: '🎁  Use Points',
                    iframe: true
                },
                {
                    href: '/daily-challenge',
                    label: '🏆  Daily Challenge',
                    iframe: true
                }
            ]
        }
    ];

    /* --- CSS --- */
    var CSS = '\n' + [
        /* menu toggle */
        '#mx-menu-toggle{position:fixed;top:10px;left:12px;z-index:10001;width:52px;height:52px;border-radius:12px;border:1px solid rgba(59,130,246,0.28);background:linear-gradient(145deg,rgba(12,35,100,.96),rgba(29,78,216,.92));box-shadow:0 10px 26px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent}',
        '#mx-menu-toggle.is-clicked{filter:brightness(1.06)}',
        '#mx-menu-toggle:focus{outline:2px solid rgba(255,255,255,.35);outline-offset:2px}',
        '.mx-menu-stack{display:flex;flex-direction:column;gap:5px}',
        '.mx-menu-line{width:24px;height:3px;border-radius:999px;background:#fff;transition:transform .18s ease,opacity .18s ease}',
        '#mx-menu-toggle.mx-open .mx-menu-line:nth-child(1){transform:translateY(8px) rotate(45deg)}',
        '#mx-menu-toggle.mx-open .mx-menu-line:nth-child(2){opacity:0}',
        '#mx-menu-toggle.mx-open .mx-menu-line:nth-child(3){transform:translateY(-8px) rotate(-45deg)}',

        /* bar */
        '#mx-nav-bar{position:fixed;top:8px;left:74px;right:12px;height:44px;z-index:10000;display:flex;align-items:center;background:rgba(2,7,22,0.96);border:1px solid rgba(59,130,246,0.18);border-top:4px solid #f59e0b;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);box-shadow:0 2px 32px rgba(0,0,0,0.7);padding:0 10px;border-radius:11px;user-select:none;overflow-x:auto;overflow-y:visible;scrollbar-width:none;opacity:0;visibility:hidden;pointer-events:none;transform:translateY(-10px);transition:opacity .18s ease,transform .18s ease,visibility .18s ease}',
        '#mx-nav-bar.mx-open{opacity:1;visibility:visible;pointer-events:auto;transform:translateY(0)}',
        '#mx-nav-bar::-webkit-scrollbar{display:none}',
        'body{padding-top:60px!important;box-sizing:border-box}',

        /* logo */
        '.mx-logo{display:inline-flex;align-items:center;text-decoration:none;flex-shrink:0;margin-right:6px;gap:0}',
        '.mx-logo-img{height:22px;width:auto;display:block;filter:drop-shadow(0 0 6px rgba(59,130,246,0.45))}',
        '.mx-logo-wordmark{font-family:"Trebuchet MS",Arial,sans-serif;font-size:1rem;font-weight:900;color:#fff;letter-spacing:2px;margin-left:5px}',
        '.mx-logo-wordmark em{color:#f59e0b;font-style:normal}',

        /* divider */
        '.mx-vd{width:1px;height:18px;background:rgba(255,255,255,0.10);margin:0 2px;flex-shrink:0}',

        /* nav button */
        '.mx-nb{display:inline-flex;align-items:center;gap:3px;height:44px;padding:0 9px;background:transparent;color:rgba(255,255,255,0.75);font-family:"Trebuchet MS",Arial,sans-serif;font-size:0.8rem;font-weight:600;text-decoration:none;border:0;border-bottom:2.5px solid transparent;cursor:pointer;white-space:nowrap;transition:color .12s,background .12s,border-bottom-color .12s;box-sizing:border-box;line-height:1;flex-shrink:0}',
        '.mx-nb:.is-clicked,.mx-nb.mx-open{color:#fff;background:rgba(255,255,255,0.06);border-bottom-color:#f59e0b;text-decoration:none}',
        '.mx-arr{font-size:.58em;opacity:.55;margin-left:2px}',

        /* right cluster */
        '.mx-right{margin-left:auto;display:flex;align-items:center;gap:4px;flex-shrink:0;padding-left:8px}',

        /* auth buttons */
        '.mx-join-btn{height:26px;padding:0 10px;background:rgba(16,185,129,.08);border:1.5px solid #10b981;color:#34d399;border-radius:6px;font-size:.75rem;font-weight:700;cursor:pointer;font-family:"Trebuchet MS",Arial,sans-serif;white-space:nowrap;transition:background .12s;flex-shrink:0}',
        '.mx-join-btn:.is-clicked,.mx-join-btn.mx-open{background:rgba(16,185,129,.22)}',
        '.mx-si-btn{height:26px;padding:0 10px;background:rgba(245,158,11,.08);border:1.5px solid #f59e0b;color:#fbbf24;border-radius:6px;font-size:.75rem;font-weight:700;cursor:pointer;font-family:"Trebuchet MS",Arial,sans-serif;white-space:nowrap;transition:background .12s;flex-shrink:0}',
        '.mx-si-btn:.is-clicked,.mx-si-btn.mx-open{background:rgba(245,158,11,.20)}',
        '.mx-si-btn.mx-signed{background:rgba(59,130,246,.08);border-color:#3b82f6;color:#93c5fd}',
        '.mx-si-btn.mx-signed:.is-clicked{background:rgba(59,130,246,.20)}',
        '.mx-msg-btn{position:relative;display:inline-flex;align-items:center;text-decoration:none;background:rgba(59,130,246,.08);border-color:#3b82f6;color:#93c5fd}',
        '.mx-msg-btn:hover{background:rgba(59,130,246,.20);text-decoration:none}',
        '.mx-msg-dot{position:absolute;top:-4px;right:-4px;width:9px;height:9px;border-radius:50%;background:#ef4444;border:1.5px solid #030d1e;box-shadow:0 0 6px rgba(239,68,68,.8)}',
        '.mx-mobile-notif-btn{display:none;position:fixed;top:8px;right:8px;z-index:10001;width:48px;height:48px;border-radius:50%;background:linear-gradient(145deg,rgba(12,35,100,.96),rgba(29,78,216,.92));border:1.5px solid rgba(59,130,246,.5);color:#93c5fd;align-items:center;justify-content:center;font-size:1.3rem;text-decoration:none;box-shadow:0 10px 26px rgba(0,0,0,.45);cursor:pointer;-webkit-tap-highlight-color:transparent}',
        '.mx-mobile-notif-btn .mx-msg-dot{top:3px;right:3px}',

        /* panel base */
        '.mx-panel{position:fixed;top:-9999px;left:-9999px;background:rgba(2,7,22,0.98);border:1px solid rgba(59,130,246,.18);border-top:3px solid #f59e0b;border-radius:0 0 14px 14px;box-shadow:0 32px 80px rgba(0,0,0,.90);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);z-index:9999;opacity:0;pointer-events:none;transform:translateY(-8px);transition:opacity .16s ease,transform .16s ease;overflow:hidden}',
        '.mx-panel.mx-open{opacity:1;pointer-events:auto;transform:translateY(0)}',

        /* iframe preview panel */
        '.mx-p-iframe{width:660px;height:auto;display:flex;flex-direction:column;overflow:hidden}',
        '.mx-ifr-view{position:relative;overflow:hidden;flex:0 0 auto}',
        '.mx-p-iframe iframe{position:absolute;top:0;left:0;width:1320px;height:860px;transform-origin:0 0;border:none;pointer-events:none;display:block;background:#030d1e}',
        '.mx-ifr-hit{position:absolute;top:0;left:0;right:0;bottom:0;z-index:2;cursor:pointer;display:block}',
        '.mx-ifr-foot{position:relative;flex-shrink:0;padding:9px 14px;background:linear-gradient(to top,rgba(2,7,22,.98) 55%,transparent);display:flex;align-items:flex-end;justify-content:space-between;z-index:3}',
        '.mx-ifr-label{font-family:"Trebuchet MS",Arial,sans-serif;font-size:.70rem;color:#93c5fd;pointer-events:none}',
        '.mx-ifr-open{font-family:"Trebuchet MS",Arial,sans-serif;font-size:.70rem;color:#f59e0b;text-decoration:none;background:rgba(2,7,22,.8);padding:3px 9px;border-radius:4px;border:1px solid rgba(245,158,11,.4)}',
        '.mx-ifr-open:.is-clicked{background:rgba(245,158,11,.18);color:#fbbf24;text-decoration:none}',

        /* submenu panel */
        '.mx-p-sub{min-width:200px;padding:7px 0}',
        '.mx-p-sub a{display:flex;align-items:center;padding:9px 17px;color:#bfdbfe;text-decoration:none;font-family:"Trebuchet MS",Arial,sans-serif;font-size:.83rem;font-weight:600;border-left:3px solid transparent;transition:background .1s,color .1s,border-left-color .1s}',
        '.mx-p-sub a:.is-clicked{background:rgba(59,130,246,.14);color:#fff;border-left-color:#f59e0b;text-decoration:none}',
        '.mx-p-sub hr{border:0;border-top:1px solid rgba(96,165,250,.09);margin:3px 13px}',

        /* auth panel */
        '.mx-p-auth{width:290px;padding:20px 22px 22px}',
        '.mx-p-auth h3{font-family:"Trebuchet MS",Arial,sans-serif;font-size:1rem;font-weight:700;color:#f0f8ff;margin:0 0 12px;text-align:center}',
        '.mx-p-desc{font-size:.73rem;color:#64748b;text-align:center;margin-bottom:11px;font-family:"Trebuchet MS",Arial,sans-serif}',
        '.mx-fi{display:block;width:100%;background:rgba(2,5,18,.92);border:1px solid rgba(96,165,250,.16);border-radius:6px;color:#f8fafc;padding:8px 11px;margin-bottom:10px;font-family:"Trebuchet MS",Arial,sans-serif;font-size:.87rem;box-sizing:border-box;outline:none;transition:border-color .13s}',
        '.mx-fi:focus{border-color:rgba(96,165,250,.5)}',
        '.mx-fi.ta{height:60px;resize:vertical}',
        '.mx-pb{width:100%;padding:9px;border-radius:6px;font-size:.87rem;font-weight:700;cursor:pointer;font-family:"Trebuchet MS",Arial,sans-serif;transition:background .12s;border:1.5px solid;line-height:1;margin-top:2px}',
        '.mx-pb.y{background:rgba(245,158,11,.12);border-color:#f59e0b;color:#fbbf24}',
        '.mx-pb.y:.is-clicked{background:rgba(245,158,11,.26)}',
        '.mx-pb.g{background:rgba(16,185,129,.10);border-color:#10b981;color:#34d399}',
        '.mx-pb.g:.is-clicked{background:rgba(16,185,129,.24)}',
        '.mx-pb.b{background:rgba(59,130,246,.10);border-color:#3b82f6;color:#93c5fd}',
        '.mx-pb.b:.is-clicked{background:rgba(59,130,246,.24)}',
        '.mx-pb.r{background:rgba(239,68,68,.10);border-color:#ef4444;color:#f87171}',
        '.mx-pb.r:.is-clicked{background:rgba(239,68,68,.24)}',
        '.mx-ferr{color:#f87171;font-size:.74rem;text-align:center;min-height:1em;margin-bottom:8px;font-family:"Trebuchet MS",Arial,sans-serif}',
        '.mx-fok{color:#34d399;font-size:.74rem;text-align:center;min-height:1em;margin-bottom:8px;font-family:"Trebuchet MS",Arial,sans-serif}',
        '.mx-user-wrap{text-align:center;padding:0 0 14px}',
        '.mx-uname-big{font-size:1.35rem;font-weight:700;color:#34d399;margin-bottom:2px;font-family:"Trebuchet MS",Arial,sans-serif}',
        '.mx-ulabel{font-size:.71rem;color:#475569;margin-bottom:14px;font-family:"Trebuchet MS",Arial,sans-serif}',
        '.mx-switch-hint{text-align:center;margin-top:11px;font-size:.71rem;color:#475569;font-family:"Trebuchet MS",Arial,sans-serif}',
        '.mx-switch-hint a{color:#34d399;text-decoration:none;cursor:pointer}',
        '.mx-switch-hint a:.is-clicked{text-decoration:underline}',
        '.mx-profile-link{display:block;text-align:center;margin-top:9px;padding:6px;font-family:"Trebuchet MS",Arial,sans-serif;font-size:.77rem;color:#93c5fd;text-decoration:none;border:1px solid rgba(59,130,246,.25);border-radius:6px;transition:background .12s}',
        '.mx-profile-link:.is-clicked{background:rgba(59,130,246,.14);text-decoration:none}',

        /* lessons panel */
        '.mx-p-lessons{width:420px;max-height:540px;display:flex;flex-direction:column;overflow:hidden}',
        '.mx-pl-head{padding:13px 17px 10px;border-bottom:1px solid rgba(96,165,250,.10);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}',
        '.mx-pl-head h3{font-family:"Trebuchet MS",Arial,sans-serif;font-size:.93rem;font-weight:700;color:#f0f8ff;margin:0}',
        '.mx-pl-badge{font-family:"Trebuchet MS",Arial,sans-serif;font-size:.70rem;color:#34d399;background:rgba(16,185,129,.10);border:1px solid rgba(16,185,129,.32);border-radius:20px;padding:2px 9px;white-space:nowrap}',
        '.mx-pl-guest{font-family:"Trebuchet MS",Arial,sans-serif;font-size:.70rem;color:#64748b;background:rgba(100,116,139,.10);border:1px solid rgba(100,116,139,.25);border-radius:20px;padding:2px 9px;white-space:nowrap}',
        '.mx-pl-body{overflow-y:auto;flex:1}',
        '.mx-pl-body::-webkit-scrollbar{width:3px}',
        '.mx-pl-body::-webkit-scrollbar-thumb{background:rgba(96,165,250,.20);border-radius:3px}',
        '.mx-lesson-row{padding:9px 17px;border-bottom:1px solid rgba(96,165,250,.06);display:flex;align-items:flex-start;justify-content:space-between;gap:8px;transition:background .1s}',
        '.mx-lesson-row:.is-clicked{background:rgba(59,130,246,.08)}',
        '.mx-lesson-row:last-child{border-bottom:none}',
        '.mx-lesson-meta{flex:1;min-width:0}',
        '.mx-lesson-by{font-family:"Trebuchet MS",Arial,sans-serif;font-size:.67rem;color:#3b82f6;margin-bottom:2px;cursor:pointer}',
        '.mx-lesson-by:.is-clicked{text-decoration:underline}',
        '.mx-lesson-name{font-family:"Trebuchet MS",Arial,sans-serif;font-size:.85rem;font-weight:600;color:#bfdbfe;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
        '.mx-lesson-btns{display:flex;gap:4px;flex-shrink:0;align-items:center}',
        '.mx-lbtn{font-size:.66rem;padding:3px 7px;border-radius:4px;cursor:pointer;font-family:"Trebuchet MS",Arial,sans-serif;font-weight:700;border:1px solid;transition:background .1s;white-space:nowrap;background:none}',
        '.mx-lbtn.v{border-color:rgba(59,130,246,.30);color:#93c5fd}',
        '.mx-lbtn.v:.is-clicked{background:rgba(59,130,246,.18)}',
        '.mx-lbtn.e{border-color:rgba(245,158,11,.30);color:#fbbf24}',
        '.mx-lbtn.e:.is-clicked{background:rgba(245,158,11,.18)}',
        '.mx-lbtn.ban{border-color:rgba(239,68,68,.32);color:#f87171}',
        '.mx-lbtn.ban:hover,.mx-lbtn.ban.is-clicked,.mx-lbtn.ban:.is-clicked{background:rgba(239,68,68,.18)}',
        '.mx-lbtn.unban{border-color:rgba(16,185,129,.30);color:#34d399}',
        '.mx-lbtn.unban:hover,.mx-lbtn.unban.is-clicked,.mx-lbtn.unban:.is-clicked{background:rgba(16,185,129,.18)}',
        '.mx-ban-dur{display:flex;gap:8px}',
        '.mx-ban-dur .mx-fi{flex:1;min-width:0}',
        'select.mx-fi{cursor:pointer;-webkit-appearance:none;appearance:none}',
        /* ban notice modal */
        '.mx-ban-overlay{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;background:rgba(2,7,22,.82);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);padding:20px;box-sizing:border-box}',
        '.mx-ban-modal{max-width:420px;width:100%;background:rgba(10,15,30,.99);border:1px solid rgba(239,68,68,.42);border-top:4px solid #ef4444;border-radius:14px;box-shadow:0 32px 80px rgba(0,0,0,.9);padding:26px 24px;text-align:center;font-family:"Trebuchet MS",Arial,sans-serif;box-sizing:border-box}',
        '.mx-ban-modal .mx-ban-ico{font-size:2.6rem;line-height:1;margin-bottom:10px}',
        '.mx-ban-modal h2{color:#f87171;font-size:1.3rem;font-weight:800;margin:0 0 12px}',
        '.mx-ban-modal .mx-ban-reason{color:#f8fafc;font-size:.95rem;line-height:1.4;margin:0 0 8px;word-break:break-word}',
        '.mx-ban-modal .mx-ban-by{color:#64748b;font-size:.74rem;margin:0 0 4px}',
        '.mx-ban-modal .mx-ban-time{color:#fca5a5;font-size:.83rem;font-weight:700;margin:0 0 18px}',
        '.mx-ban-modal .mx-ban-close{background:rgba(239,68,68,.14);border:1.5px solid #ef4444;color:#f87171;border-radius:8px;padding:10px 18px;font-size:.9rem;font-weight:700;cursor:pointer;font-family:inherit;width:100%;transition:background .12s}',
        '.mx-ban-modal .mx-ban-close:hover,.mx-ban-modal .mx-ban-close:.is-clicked{background:rgba(239,68,68,.28)}',
        '.mx-pl-empty{padding:20px 17px;text-align:center;font-family:"Trebuchet MS",Arial,sans-serif;font-size:.81rem;color:#475569}',
        '.mx-pl-foot{padding:9px 17px;border-top:1px solid rgba(96,165,250,.10);flex-shrink:0;display:flex;gap:7px;flex-wrap:wrap}',
        '.mx-pl-foot a,.mx-pl-foot button{flex:1;min-width:80px;text-align:center;padding:7px;font-family:"Trebuchet MS",Arial,sans-serif;font-size:.78rem;font-weight:700;border-radius:6px;border:1.5px solid;cursor:pointer;text-decoration:none;transition:background .12s;line-height:1;background:none}',
        '.mx-pl-foot .va{border-color:rgba(59,130,246,.30);color:#93c5fd}',
        '.mx-pl-foot .va:.is-clicked{background:rgba(59,130,246,.18);text-decoration:none}',
        '.mx-pl-foot .ex{border-color:rgba(96,165,250,.20);color:#7ea6d4}',
        '.mx-pl-foot .ex:.is-clicked{background:rgba(59,130,246,.12);text-decoration:none}',
        '.mx-pl-foot .cr{border-color:#10b981;color:#34d399}',
        '.mx-pl-foot .cr:.is-clicked{background:rgba(16,185,129,.18)}',

        /* form panel */
        '.mx-pf{padding:14px 17px 16px}',
        '.mx-pf h4{font-family:"Trebuchet MS",Arial,sans-serif;font-size:.89rem;font-weight:700;color:#f0f8ff;margin:0 0 10px}',
        '.mx-pf-sub{font-size:.69rem;color:#475569;font-family:"Trebuchet MS",Arial,sans-serif;margin-bottom:9px;word-break:break-word}',
        '.mx-pf-back{background:none;border:none;color:#3b82f6;cursor:pointer;font-family:"Trebuchet MS",Arial,sans-serif;font-size:.76rem;padding:0;margin-bottom:9px;display:block}',
        '.mx-pf-back:.is-clicked{color:#93c5fd}',

        /* notifications */
        '.mx-p-notif{width:320px;max-height:560px;display:flex;flex-direction:column;overflow-y:auto;padding:0 0 10px}',
        '.mx-notif-list{padding:6px 8px;display:flex;flex-direction:column;gap:5px}',
        '.mx-notif-empty{padding:14px 16px;color:#64748b;font-family:"Trebuchet MS",Arial,sans-serif;font-size:.78rem}',
        '.mx-notif-item{padding:8px 12px;border-radius:8px;background:rgba(59,130,246,.06);border:1px solid rgba(59,130,246,.14)}',
        '.mx-notif-t{font-family:"Trebuchet MS",Arial,sans-serif;font-size:.8rem;font-weight:700;color:#e8f2ff}',
        '.mx-notif-b{font-family:"Trebuchet MS",Arial,sans-serif;font-size:.72rem;color:#94a3b8;margin-top:2px;word-break:break-word}',
        '.mx-notif-set{margin:10px 12px 0;padding-top:11px;border-top:1px solid rgba(255,255,255,.08);display:flex;flex-direction:column;gap:8px}',
        '.mx-notif-set-h{font-family:"Trebuchet MS",Arial,sans-serif;font-size:.72rem;font-weight:700;color:#fbbf24;text-transform:uppercase;letter-spacing:.5px}',
        '.mx-toggle{display:flex;align-items:center;gap:8px;font-family:"Trebuchet MS",Arial,sans-serif;font-size:.77rem;color:#cbd5e1;cursor:pointer}',
        '.mx-toggle input{width:15px;height:15px;accent-color:#f59e0b;cursor:pointer;flex-shrink:0}',
        '.mx-notif-all{display:block;text-align:center;margin-top:6px;padding:7px;font-family:"Trebuchet MS",Arial,sans-serif;font-size:.76rem;color:#93c5fd;text-decoration:none;border:1px solid rgba(59,130,246,.25);border-radius:6px}',
        '.mx-cl-btn{color:#fbbf24!important}',
        '.mx-users-btn{color:#93c5fd!important}',
        '.mx-p-users{width:340px;max-height:560px;overflow-y:auto}',
        '.mx-users-list{display:flex;flex-direction:column;gap:7px;margin-top:4px}',
        '.mx-user-row{padding:8px 10px;border-radius:8px;background:rgba(59,130,246,.06);border:1px solid rgba(59,130,246,.14)}',
        '.mx-user-row-top{display:flex;align-items:center;gap:7px;flex-wrap:wrap}',
        '.mx-user-row-name{font-family:"Trebuchet MS",Arial,sans-serif;font-weight:700;font-size:.82rem;color:#f0f8ff}',
        '.mx-user-row-role{font-family:"Trebuchet MS",Arial,sans-serif;font-size:.62rem;color:#93c5fd;text-transform:uppercase;letter-spacing:.4px}',
        '.mx-user-row-tag{font-family:"Trebuchet MS",Arial,sans-serif;font-size:.58rem;font-weight:800;color:#052e16;background:#34d399;border-radius:9px;padding:1px 7px}',
        '.mx-user-row-pw{font-family:"SFMono-Regular",Consolas,monospace;font-size:.78rem;color:#fcd34d;margin-top:4px;word-break:break-all}',
        '.mx-user-row-pw.muted{color:#64748b;font-style:italic}',
        '.mx-join-tu{margin:2px 0;font-size:.74rem;align-items:flex-start;line-height:1.35}',
        '.mx-join-learn{margin-top:3px;align-self:flex-start;background:none;border:none;padding:0;color:#60a5fa;text-decoration:underline;font-size:.74rem;font-weight:600;cursor:pointer}',
        '.mx-join-learn:hover{color:#93c5fd}',
        '.mx-notif-overlay{position:fixed;inset:0;background:rgba(2,6,23,.72);z-index:10050;display:none;align-items:center;justify-content:center;padding:20px;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}',
        '.mx-notif-overlay.open{display:flex}',
        '.mx-notif-modal{position:relative;width:min(820px,96vw);height:min(88vh,940px);background:#0b1730;border:1px solid rgba(147,197,253,.28);border-radius:20px;box-shadow:0 40px 90px -25px rgba(0,0,0,.85);overflow:hidden;display:flex;flex-direction:column;animation:mxNotifPop .22s cubic-bezier(.22,1,.36,1)}',
        '@keyframes mxNotifPop{from{opacity:0;transform:scale(.94) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}',
        '.mx-notif-x{position:absolute;top:13px;right:15px;z-index:3;width:34px;height:34px;border:none;border-radius:50%;background:rgba(255,255,255,.12);color:#e2e8f0;font-size:1.25rem;cursor:pointer;line-height:1;display:flex;align-items:center;justify-content:center;transition:background .15s,transform .15s}',
        '.mx-notif-x:hover{background:rgba(239,68,68,.85);color:#fff;transform:rotate(90deg)}',
        '.mx-notif-frame{border:0;width:100%;height:100%;flex:1;background:#0b1730}',

        /* media */
        '@media(max-width:768px){#mx-menu-toggle{top:8px;left:8px;width:48px;height:48px}#mx-nav-bar{top:8px;left:62px;right:8px;height:48px;padding:0 10px}body{padding-top:66px!important}.mx-nb{height:48px;padding:0 9px;font-size:.8rem}.mx-panel{max-height:calc(100vh - 72px);overflow-y:auto;z-index:10002}.mx-p-iframe{max-width:calc(100vw - 16px)!important;height:auto!important;min-height:180px}.mx-p-auth,.mx-p-sub,.mx-p-lessons{width:100%!important;box-sizing:border-box}.mx-p-lessons{max-height:min(540px,calc(100vh - 72px))}.mx-ifr-label{font-size:.62rem;max-width:55%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mx-mobile-notif-btn.mx-show{display:flex}}'
    ].join('\n');

    var sEl = mk('style');
    sEl.id = 'mx-nav-styles';
    sEl.textContent = CSS;
    document.head.appendChild(sEl);

    /* --- PANEL ENGINE --- */
    var allPanels = [];
    var activePanel = null;
    var IFR_NATIVE_W = 1320;
    var IFR_NATIVE_H = 860;
    var IFR_ASPECT = 430 / 660;
    var mobileMQ = window.matchMedia('(max-width: 768px)');

    function isMobile() {
        return mobileMQ.matches;
    }

    function getPortal() {
        var p = document.getElementById('mx-nav-portal');
        if (!p) {
            p = mk('div');
            p.id = 'mx-nav-portal';
            document.documentElement.appendChild(p);
        }
        return p;
    }

    function getNavBottom() {
        var bar = document.getElementById('mx-nav-bar');
        if (bar && bar.classList.contains('mx-open')) {
            return Math.round(bar.getBoundingClientRect().bottom + 4);
        }
        var toggle = document.getElementById('mx-menu-toggle');
        return Math.round((toggle ? toggle.getBoundingClientRect().bottom : 66) + 4);
    }

    function hidePanels() {
        allPanels.forEach(function(p) {
            p.classList.remove('mx-open');
            p.style.removeProperty('top');
            p.style.removeProperty('left');
        });
        document.querySelectorAll('#mx-nav-bar .mx-open').forEach(function(b) {
            b.classList.remove('mx-open');
        });
        activePanel = null;
    }

    function syncIframeScale(panel) {
        if (!panel || !panel._ifr) return;
        var footH = 40;
        var panelW = panel.offsetWidth;
        if (!panelW) panelW = Math.min(660, window.innerWidth - 16);
        var viewH = Math.round(panelW * IFR_ASPECT);
        var view = panel.querySelector('.mx-ifr-view');
        if (view) view.style.height = viewH + 'px';
        panel.style.height = (viewH + footH) + 'px';
        var scale = panelW / IFR_NATIVE_W;
        panel._ifr.style.width = IFR_NATIVE_W + 'px';
        panel._ifr.style.height = IFR_NATIVE_H + 'px';
        panel._ifr.style.transform = 'scale(' + scale + ')';
    }

    function getPanelTop() {
        return getNavBottom();
    }

    function positionPanel(panel, trigger, width) {
        panel.style.position = 'fixed';
        var w = width || 220;

        if (panel._ifr) {
            var panelW = isMobile() ? Math.min(w, window.innerWidth - 16) : w;
            var top = getNavBottom();
            var r = trigger.getBoundingClientRect();
            var left = Math.max(8, Math.min(r.left, window.innerWidth - panelW - 8));
            panel.style.setProperty('top', top + 'px', 'important');
            panel.style.setProperty('left', left + 'px', 'important');
            panel.style.right = 'auto';
            panel.style.width = panelW + 'px';
        } else {
            panel.style.setProperty('top', getPanelTop() + 'px', 'important');
            if (isMobile()) {
                panel.style.setProperty('left', '8px', 'important');
                panel.style.right = '8px';
                panel.style.width = 'auto';
            } else {
                var r2 = trigger.getBoundingClientRect();
                var left2 = Math.max(8, Math.min(r2.left, window.innerWidth - w - 8));
                panel.style.setProperty('left', left2 + 'px', 'important');
                panel.style.right = 'auto';
                panel.style.width = w + 'px';
            }
        }
        if (panel._ifr) {
            requestAnimationFrame(function() {
                syncIframeScale(panel);
            });
        }
    }

    function repositionOpenPanels() {
        allPanels.forEach(function(panel) {
            if (panel.classList.contains('mx-open') && panel._trigger) {
                positionPanel(panel, panel._trigger, panel._width);
            }
        });
    }

    function openPanel(id, panel, trigger, width) {
        hidePanels();
        positionPanel(panel, trigger, width);
        panel.classList.add('mx-open');
        trigger.classList.add('mx-open');
        activePanel = id;
    }

    function wirePanel(id, panel, trigger, width, onBefore) {
        panel._trigger = trigger;
        panel._width = width;

        trigger.addEventListener('click', function(e) {
            if (trigger.tagName === 'A') e.preventDefault();
            e.stopPropagation();
            if (activePanel === id) hidePanels();
            else {
                if (onBefore) onBefore();
                openPanel(id, panel, trigger, width);
            }
        });
    }

    /* --- BUILD BAR --- */
    var menuToggle = mk('button');
    menuToggle.id = 'mx-menu-toggle';
    menuToggle.type = 'button';
    menuToggle.setAttribute('aria-label', 'Open menu');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.innerHTML = '<span class="mx-menu-stack"><span class="mx-menu-line"></span><span class="mx-menu-line"></span><span class="mx-menu-line"></span></span>';

    var bar = mk('nav');
    bar.id = 'mx-nav-bar';
    bar.setAttribute('aria-label', 'Site navigation');

    /* Logo — uses logo.svg if available, fallback to wordmark */
    var logo = mk('a', 'mx-logo');
    logo.href = '/';
    logo.setAttribute('aria-label', 'Matix home');
    var logoImg = mk('img', 'mx-logo-img');
    logoImg.src = '/logo.svg';
    logoImg.alt = 'Matix';
    logoImg.onerror = function() {
        this.style.display = 'none'; // Hide the broken image
        var wm = mk('span', 'mx-logo-wordmark'); // Create wordmark here
        wm.innerHTML = 'MA<em>T</em>IX';
        logo.appendChild(wm); // Append wordmark only on error
    };
    logo.appendChild(logoImg);
    bar.appendChild(logo);
    bar.appendChild(vd());

    /* --- Main links --- */
    LINKS.forEach(function(link, i) {
        if (i > 0) bar.appendChild(vd());
        var btn = mk('a', 'mx-nb');
        btn.href = link.href;
        btn.innerHTML = link.label + (link.subs ? ' <span class="mx-arr">\u25be</span>' : '');
        bar.appendChild(btn);

        var pid = 'lnk' + i;
        var panel = mk('div', 'mx-panel');
        panel.id = 'mxp-' + pid;

        if (link.iframe) {
            panel.classList.add('mx-p-iframe');
            var ifr = mk('iframe');
            ifr.setAttribute('loading', 'lazy');
            ifr.setAttribute('sandbox', 'allow-same-origin');
            ifr.setAttribute('sandbox', 'allow-scripts')
            ifr.setAttribute('tabindex', '-1');
            ifr.setAttribute('aria-hidden', 'true');
            ifr.title = link.label + ' preview';
            var view = mk('div', 'mx-ifr-view');
            view.appendChild(ifr);
            panel.appendChild(view);
            var hit = mk('a', 'mx-ifr-hit');
            hit.href = link.href;
            hit.setAttribute('aria-label', 'Open ' + link.label);
            hit.addEventListener('click', hidePanels);
            view.appendChild(hit);
            var foot = mk('div', 'mx-ifr-foot');
            var lbl = mk('span', 'mx-ifr-label');
            lbl.textContent = link.label + ' — matixthemathclub.com' + link.href;
            var openA = mk('a', 'mx-ifr-open');
            openA.href = link.href;
            openA.textContent = 'Open page \u2192';
            openA.addEventListener('click', hidePanels);
            foot.appendChild(lbl);
            foot.appendChild(openA);
            panel.appendChild(foot);
            panel._ifr = ifr;
            panel._ifrSrc = link.href;
            panel._ifrLoaded = false;
            wirePanel(pid, panel, btn, 660, function() {
                if (!panel._ifrLoaded) {
                    panel._ifr.src = panel._ifrSrc;
                    panel._ifrLoaded = true;
                }
            });

        } else if (link.subs) {
            panel.classList.add('mx-p-sub');
            link.subs.forEach(function(sub, si) {
                if (si > 0) panel.appendChild(mk('hr'));
                var a = mk('a');
                a.href = sub.href;
                a.textContent = sub.label;
                a.addEventListener('click', hidePanels);
                panel.appendChild(a);
            });
            wirePanel(pid, panel, btn, 212);

        } else {
            panel.classList.add('mx-p-sub');
            var a2 = mk('a');
            a2.href = link.href;
            a2.textContent = '\u2192  ' + link.label;
            a2.addEventListener('click', hidePanels);
            panel.appendChild(a2);
            wirePanel(pid, panel, btn, 192);
        }

        getPortal().appendChild(panel);
        allPanels.push(panel);
    });

    /* --- RIGHT --- */
    var right = mk('div', 'mx-right');

    /* Lessons */
    right.appendChild(vd());
    var lessonsBtn = mk('a', 'mx-nb');
    lessonsBtn.href = '/lessons';
    lessonsBtn.innerHTML = 'Lessons <span class="mx-arr">\u25be</span>';
    right.appendChild(lessonsBtn);

    /* Owner-only: Add changelog item (sits right next to Lessons) */
    var clBtn = mk('a', 'mx-nb mx-cl-btn');
    clBtn.href = '#';
    clBtn.style.display = 'none';
    clBtn.innerHTML = '\u2795 Changelog';
    right.appendChild(clBtn);
    var clPanel = mk('div', 'mx-panel');
    clPanel.id = 'mxp-changelog';
    getPortal().appendChild(clPanel);
    allPanels.push(clPanel);
    function renderChangelog() {
        clPanel.innerHTML = '';
        var w = mk('div', 'mx-pf');
        var h4 = mk('h4'); h4.textContent = '\u2795 Add changelog item'; w.appendChild(h4);
        var sub = mk('div', 'mx-pf-sub'); sub.textContent = 'Owner only \u2014 notifies everyone.'; w.appendChild(sub);
        var ti = mk('input', 'mx-fi'); ti.type = 'text'; ti.placeholder = 'Title'; ti.maxLength = 80; w.appendChild(ti);
        var de = mk('textarea', 'mx-fi'); de.placeholder = 'Description'; de.rows = 3; de.maxLength = 400; de.style.resize = 'vertical'; w.appendChild(de);
        var er = mk('div', 'mx-ferr'); w.appendChild(er);
        var sb = mk('button', 'mx-pb y'); sb.textContent = 'Post to changelog'; w.appendChild(sb);
        sb.addEventListener('click', function () {
            var t = ti.value.trim(), d = de.value.trim();
            if (!t) { er.textContent = 'Title is required.'; return; }
            er.textContent = ''; sb.disabled = true; sb.textContent = 'Posting\u2026';
            var payload = { title: t, description: d, by: getUser() || 'ghadi', at: Date.now() };
            fetch(FIREBASE_URL + '/changelog.json', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                .then(function () { ti.value = ''; de.value = ''; sb.disabled = false; sb.textContent = 'Posted \u2713'; setTimeout(function () { sb.textContent = 'Post to changelog'; }, 1500); })
                .catch(function () { er.textContent = 'Could not post. Try again.'; sb.disabled = false; sb.textContent = 'Post to changelog'; });
        });
        clPanel.appendChild(w);
    }
    wirePanel('changelog', clPanel, clBtn, 300, renderChangelog);
    function refreshChangelogBtn() {
        var u = getUser();
        if (!u) { clBtn.style.display = 'none'; return; }
        if (normUser(u) === 'ghadi') { clBtn.style.display = ''; return; }
        grabJson(FIREBASE_URL + '/roles/' + encodeURIComponent(normUser(u)) + '.json').then(function (r) { clBtn.style.display = (r === 'owner') ? '' : 'none'; });
    }
    authListeners.push(refreshChangelogBtn);
    refreshChangelogBtn();

    /* Owner-only: Users & passwords directory (sits next to Lessons/Changelog) */
    var usersBtn = mk('a', 'mx-nb mx-users-btn');
    usersBtn.href = '#';
    usersBtn.style.display = 'none';
    usersBtn.innerHTML = '\ud83d\udc65 Users';
    right.appendChild(usersBtn);
    var usersPanel = mk('div', 'mx-panel mx-p-users');
    usersPanel.id = 'mxp-users';
    getPortal().appendChild(usersPanel);
    allPanels.push(usersPanel);
    function ensureAdminCss() {
        if (document.getElementById('mx-admin-css')) return;
        var st = document.createElement('style'); st.id = 'mx-admin-css';
        st.textContent = [
            '.mx-rooms-bar{margin-bottom:10px}',
            '.mx-room-delall{width:100%;background:rgba(239,68,68,.16);border:1px solid rgba(239,68,68,.5);color:#fca5a5;border-radius:9px;padding:8px 12px;font-size:.82rem;font-weight:700;cursor:pointer}'
        ].join('');
        (document.head || document.documentElement).appendChild(st);
    }
    function renderUsers() {
        usersPanel.innerHTML = '';
        var w = mk('div', 'mx-pf');
        var h4 = mk('h4'); h4.textContent = '\ud83d\udc65 Users & passwords'; w.appendChild(h4);
        var sub = mk('div', 'mx-pf-sub'); sub.textContent = 'Owner only \u2014 test users\u2019 passwords are shown here.'; w.appendChild(sub);
        var listWrap = mk('div', 'mx-users-list'); listWrap.innerHTML = '<div class="mx-notif-empty">Loading\u2026</div>'; w.appendChild(listWrap);
        usersPanel.appendChild(w);
        Promise.all([
            grabJson(FIREBASE_URL + '/members.json'),
            grabJson(FIREBASE_URL + '/roles.json')
        ]).then(function (res) {
            var members = res[0] || {}, roles = res[1] || {};
            var map = {};
            Object.keys(VALID_MEMBERS).forEach(function (u) { map[u] = { password: VALID_MEMBERS[u], testUser: true, builtin: true }; });
            Object.keys(members).forEach(function (u) {
                var m = members[u] || {};
                map[u] = { password: m.password != null ? m.password : (map[u] ? map[u].password : ''), testUser: m.testUser !== false, builtin: map[u] ? true : false };
            });
            var names = Object.keys(map).sort(function (a, b) { if (a === 'ghadi') return -1; if (b === 'ghadi') return 1; return a < b ? -1 : (a > b ? 1 : 0); });
            listWrap.innerHTML = '';
            if (!names.length) { listWrap.innerHTML = '<div class="mx-notif-empty">No users yet.</div>'; return; }
            names.forEach(function (u) {
                var info = map[u];
                var role = roles[u] || (info.builtin ? 'member' : 'user');
                var row = mk('div', 'mx-user-row');
                var top = mk('div', 'mx-user-row-top');
                var nm = mk('span', 'mx-user-row-name'); nm.textContent = '@' + u; top.appendChild(nm);
                var rl = mk('span', 'mx-user-row-role'); rl.textContent = role; top.appendChild(rl);
                if (info.testUser) { var tg = mk('span', 'mx-user-row-tag'); tg.textContent = 'test user'; top.appendChild(tg); }
                row.appendChild(top);
                var pw = mk('div', 'mx-user-row-pw');
                if (info.testUser && info.password) { pw.textContent = '\ud83d\udd11 ' + info.password; }
                else if (!info.testUser) { pw.textContent = '\ud83d\udd12 opted out \u2014 password hidden'; pw.className += ' muted'; }
                else { pw.textContent = '\ud83d\udd12 no password on record'; pw.className += ' muted'; }
                row.appendChild(pw);
                listWrap.appendChild(row);
            });
        });
    }
    wirePanel('users', usersPanel, usersBtn, 340, renderUsers);
    function refreshUsersBtn() {
        var u = getUser();
        if (!u) { usersBtn.style.display = 'none'; return; }
        if (normUser(u) === 'ghadi') { usersBtn.style.display = ''; return; }
        grabJson(FIREBASE_URL + '/roles/' + encodeURIComponent(normUser(u)) + '.json').then(function (r) { usersBtn.style.display = (r === 'owner') ? '' : 'none'; });
    }
    authListeners.push(refreshUsersBtn);
    refreshUsersBtn();

    /* Owner + Manager: Math Fight rooms manager — delete any active room.
       (Unlike Users above, this is visible to managers too, NOT just the owner.) */
    var roomsBtn = mk('a', 'mx-nb mx-rooms-btn');
    roomsBtn.href = '#';
    roomsBtn.style.display = 'none';
    roomsBtn.innerHTML = '\ud83c\udfae Rooms';
    right.appendChild(roomsBtn);
    var roomsPanel = mk('div', 'mx-panel mx-p-rooms');
    roomsPanel.id = 'mxp-rooms';
    getPortal().appendChild(roomsPanel);
    allPanels.push(roomsPanel);
    var MF_ROOMS_PATH = 'mathfight/rooms';
    var MF_PUBLIC_ID = 'public-server';
    function mfRoomLabel(id) {
        if (id === MF_PUBLIC_ID) return '\ud83c\udf10 Public Server';
        if (id.indexOf('bot_room_') === 0) return '\ud83e\udd16 ' + id;
        return '\ud83d\udd12 ' + id;
    }
    function deleteAllRooms(ids, btn) {
        mxConfirm({
            title: '\ud83d\uddd1\ufe0f Delete ALL rooms?',
            body: 'This removes all ' + ids.length + ' active room' + (ids.length === 1 ? '' : 's') + ' and kicks everyone in them. This can\u2019t be undone.',
            okLabel: '\ud83d\uddd1\ufe0f Delete all',
            cancelLabel: 'Cancel',
            danger: true
        }).then(function (res) {
            if (!res || !res.ok) return;
            btn.disabled = true; btn.textContent = 'Deleting\u2026';
            var by = normUser(getUser()) || 'a moderator';
            Promise.all(ids.map(function (id) {
                return fetch(FIREBASE_URL + '/' + MF_ROOMS_PATH + '/' + encodeURIComponent(id) + '.json', { method: 'DELETE' }).catch(function () {});
            })).then(function () {
                fetch(FIREBASE_URL + '/notifications/ghadi.json', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'game', at: Date.now(), title: '\ud83d\uddd1\ufe0f All Math Fight rooms deleted', body: '@' + by + ' deleted all ' + ids.length + ' active room' + (ids.length === 1 ? '' : 's') + '.' })
                }).catch(function () {});
                renderRooms();
            });
        });
    }
    function renderRooms() {
        ensureAdminCss();
        roomsPanel.innerHTML = '';
        var w = mk('div', 'mx-pf');
        var h4 = mk('h4'); h4.textContent = '\ud83c\udfae Math Fight rooms'; w.appendChild(h4);
        var sub = mk('div', 'mx-pf-sub'); sub.textContent = 'Owners & managers \u2014 delete any active room.'; w.appendChild(sub);
        var listWrap = mk('div', 'mx-users-list'); listWrap.innerHTML = '<div class="mx-notif-empty">Loading\u2026</div>'; w.appendChild(listWrap);
        roomsPanel.appendChild(w);
        grabJson(FIREBASE_URL + '/' + MF_ROOMS_PATH + '.json').then(function (rooms) {
            rooms = rooms || {};
            var ids = Object.keys(rooms).sort();
            listWrap.innerHTML = '';
            if (!ids.length) { listWrap.innerHTML = '<div class="mx-notif-empty">No active rooms right now.</div>'; return; }
            var bar = mk('div', 'mx-rooms-bar');
            var delAll = mk('button', 'mx-room-delall'); delAll.type = 'button'; delAll.textContent = '\ud83d\uddd1\ufe0f Delete all rooms (' + ids.length + ')';
            delAll.addEventListener('click', function () { deleteAllRooms(ids, delAll); });
            bar.appendChild(delAll); listWrap.appendChild(bar);
            ids.forEach(function (id) {
                var r = rooms[id] || {};
                var count = r.players ? Object.keys(r.players).length : 0;
                var op = (r.config && r.config.operation) ? r.config.operation : '\u2014';
                var row = mk('div', 'mx-user-row');
                var top = mk('div', 'mx-user-row-top');
                var nm = mk('span', 'mx-user-row-name'); nm.textContent = mfRoomLabel(id); top.appendChild(nm);
                var rl = mk('span', 'mx-user-row-role'); rl.textContent = count + ' player' + (count === 1 ? '' : 's') + ' \u00b7 ' + op; top.appendChild(rl);
                row.appendChild(top);
                var del = mk('button', 'mx-room-del'); del.textContent = '\ud83d\uddd1 Delete';
                del.style.cssText = 'margin-top:8px;background:rgba(248,113,113,.14);border:1px solid rgba(248,113,113,.45);color:#fca5a5;border-radius:8px;padding:5px 12px;font-size:.8rem;cursor:pointer;';
                del.addEventListener('click', function () { deleteRoom(id, count, del); });
                row.appendChild(del);
                listWrap.appendChild(row);
            });
        });
    }
    /* Reusable custom confirm modal. Returns a Promise<{ok, dontAsk}>.
       opts: { title, body, okLabel, cancelLabel, danger, dontAsk } */
    function ensureConfirmCss() {
        if (document.getElementById('mx-cfm-css')) return;
        var st = document.createElement('style'); st.id = 'mx-cfm-css';
        st.textContent = [
            '.mx-cfm-overlay{position:fixed;inset:0;z-index:100002;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;background:rgba(2,7,22,.74);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;transition:opacity .16s ease}',
            '.mx-cfm-overlay.open{opacity:1}',
            '.mx-cfm-card{width:min(420px,94vw);background:#0b1730;border:1px solid rgba(147,197,253,.28);border-top:4px solid #3b82f6;border-radius:18px;box-shadow:0 40px 90px -25px rgba(0,0,0,.85);padding:22px 22px 18px;transform:translateY(10px) scale(.97);transition:transform .18s cubic-bezier(.22,1,.36,1);font-family:"Trebuchet MS",Arial,sans-serif}',
            '.mx-cfm-card.danger{border-top-color:#f87171}',
            '.mx-cfm-overlay.open .mx-cfm-card{transform:translateY(0) scale(1)}',
            '.mx-cfm-title{font-size:1.12rem;font-weight:700;color:#f1f5f9;margin:0 0 8px;line-height:1.3}',
            '.mx-cfm-body{font-size:.92rem;color:#94a3b8;line-height:1.5;margin:0 0 14px}',
            '.mx-cfm-dna{display:flex;align-items:center;gap:8px;font-size:.86rem;color:#cbd5e1;cursor:pointer;margin:0 0 16px;user-select:none}',
            '.mx-cfm-dna input{width:16px;height:16px;accent-color:#3b82f6;cursor:pointer;flex-shrink:0}',
            '.mx-cfm-btns{display:flex;gap:10px;justify-content:flex-end}',
            '.mx-cfm-btns button{font-family:inherit;font-size:.9rem;font-weight:600;padding:9px 16px;border-radius:10px;cursor:pointer;border:1px solid transparent;transition:opacity .15s,transform .1s}',
            '.mx-cfm-btns button:active{transform:scale(.96)}',
            '.mx-cfm-cancel{background:rgba(148,163,184,.14);border-color:rgba(148,163,184,.3)!important;color:#e2e8f0}',
            '.mx-cfm-ok{background:#3b82f6;color:#fff}',
            '.mx-cfm-ok.danger{background:#ef4444}',
            '.mx-cfm-btns button:hover{opacity:.88}'
        ].join('');
        (document.head || document.documentElement).appendChild(st);
    }
    function mxConfirm(opts) {
        opts = opts || {};
        ensureConfirmCss();
        return new Promise(function (resolve) {
            var ov = mk('div', 'mx-cfm-overlay');
            var card = mk('div', 'mx-cfm-card' + (opts.danger ? ' danger' : ''));
            var h = mk('div', 'mx-cfm-title'); h.textContent = opts.title || 'Are you sure?'; card.appendChild(h);
            if (opts.body) { var bd = mk('div', 'mx-cfm-body'); bd.textContent = opts.body; card.appendChild(bd); }
            var chk = null;
            if (opts.dontAsk) {
                var lbl = mk('label', 'mx-cfm-dna');
                chk = mk('input'); chk.type = 'checkbox';
                var sp = mk('span'); sp.textContent = 'Don\u2019t show me this again';
                lbl.appendChild(chk); lbl.appendChild(sp); card.appendChild(lbl);
            }
            var btns = mk('div', 'mx-cfm-btns');
            var cancel = mk('button', 'mx-cfm-cancel'); cancel.type = 'button'; cancel.textContent = opts.cancelLabel || 'Cancel';
            var ok = mk('button', 'mx-cfm-ok' + (opts.danger ? ' danger' : '')); ok.type = 'button'; ok.textContent = opts.okLabel || 'OK';
            btns.appendChild(cancel); btns.appendChild(ok); card.appendChild(btns);
            ov.appendChild(card);
            getPortal().appendChild(ov);
            requestAnimationFrame(function () { ov.classList.add('open'); });
            var onKey;
            function close(result) {
                document.removeEventListener('keydown', onKey);
                ov.classList.remove('open');
                setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 200);
                resolve(result);
            }
            onKey = function (e) { if (e.key === 'Escape') close({ ok: false, dontAsk: false }); };
            cancel.addEventListener('click', function () { close({ ok: false, dontAsk: false }); });
            ok.addEventListener('click', function () { close({ ok: true, dontAsk: chk ? chk.checked : false }); });
            ov.addEventListener('click', function (e) { if (e.target === ov) close({ ok: false, dontAsk: false }); });
            document.addEventListener('keydown', onKey);
        });
    }

    var MF_SKIP_CONFIRM_KEY = 'mx_skip_room_delete_confirm';
    function deleteRoom(id, count, btn) {
        var label = (id === MF_PUBLIC_ID) ? 'the Public Server' : ('room \u201c' + id + '\u201d');
        function doDelete() {
            btn.disabled = true; btn.textContent = 'Deleting\u2026';
            var by = normUser(getUser()) || 'a moderator';
            fetch(FIREBASE_URL + '/' + MF_ROOMS_PATH + '/' + encodeURIComponent(id) + '.json', { method: 'DELETE' })
                .then(function () {
                    fetch(FIREBASE_URL + '/notifications/ghadi.json', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'game', at: Date.now(), title: '\ud83d\uddd1\ufe0f Math Fight room deleted', body: '@' + by + ' deleted ' + label + ' \u2014 ' + count + ' player' + (count === 1 ? '' : 's') + ' removed.' })
                    }).catch(function () {});
                    renderRooms();
                })
                .catch(function () { btn.disabled = false; btn.textContent = '\ud83d\uddd1 Delete'; });
        }
        var skip = false;
        try { skip = localStorage.getItem(MF_SKIP_CONFIRM_KEY) === '1'; } catch (e) {}
        if (skip) { doDelete(); return; }
        mxConfirm({
            title: '\ud83d\uddd1\ufe0f Delete ' + label + '?',
            body: count + ' player' + (count === 1 ? '' : 's') + ' will be removed immediately. This can\u2019t be undone.',
            okLabel: '\ud83d\uddd1\ufe0f Delete',
            cancelLabel: 'Cancel',
            danger: true,
            dontAsk: true
        }).then(function (res) {
            if (!res || !res.ok) return;
            if (res.dontAsk) { try { localStorage.setItem(MF_SKIP_CONFIRM_KEY, '1'); } catch (e) {} }
            doDelete();
        });
    }
    wirePanel('rooms', roomsPanel, roomsBtn, 340, renderRooms);
    function refreshRoomsBtn() {
        var u = getUser();
        if (!u) { roomsBtn.style.display = 'none'; return; }
        if (normUser(u) === 'ghadi') { roomsBtn.style.display = ''; return; }
        grabJson(FIREBASE_URL + '/roles/' + encodeURIComponent(normUser(u)) + '.json').then(function (r) { roomsBtn.style.display = (r === 'owner' || r === 'manager') ? '' : 'none'; });
    }
    authListeners.push(refreshRoomsBtn);
    refreshRoomsBtn();

    var lessonsPanel = mk('div', 'mx-panel mx-p-lessons');
    lessonsPanel.id = 'mxp-lessons';
    getPortal().appendChild(lessonsPanel);
    allPanels.push(lessonsPanel);

    var lsData = {};
    var lsLoaded = false;

    function renderLessons() {
        lessonsPanel.innerHTML = '';
        var user = getUser();

        var hd = mk('div', 'mx-pl-head');
        var ht = mk('h3');
        ht.textContent = 'Lessons';
        hd.appendChild(ht);
        var badge = mk('span', user ? 'mx-pl-badge' : 'mx-pl-guest');
        badge.textContent = user ? ('\ud83d\udc64 ' + user) : 'Guest';
        hd.appendChild(badge);
        lessonsPanel.appendChild(hd);

        var bd = mk('div', 'mx-pl-body');
        lessonsPanel.appendChild(bd);

        if (!lsLoaded) {
            bd.innerHTML = '<div class="mx-pl-empty">Loading\u2026</div>';
            fetch('https://matix-1d538-default-rtdb.firebaseio.com/lessons.json')
                .then(function(r) {
                    return r.json();
                })
                .then(function(d) {
                    lsLoaded = true;
                    lsData = d || {};
                    fillLessons(bd, user);
                })
                .catch(function() {
                    bd.innerHTML = '<div class="mx-pl-empty">Could not load lessons.</div>';
                });
        } else {
            fillLessons(bd, user);
        }

        var ft = mk('div', 'mx-pl-foot');
        var va = mk('a', 'va');
        va.href = '/lessons';
        va.textContent = 'All Lessons';
        va.addEventListener('click', hidePanels);
        ft.appendChild(va);
        var ex = mk('a', 'ex');
        ex.href = '/lessons/exercises';
        ex.textContent = '\ud83d\udcdd Exercises';
        ex.addEventListener('click', hidePanels);
        ft.appendChild(ex);
        if (user) {
            var cr = mk('button', 'cr');
            cr.textContent = '+ Create';
            cr.addEventListener('click', showCreateLesson);
            ft.appendChild(cr);
        }
        lessonsPanel.appendChild(ft);
    }

    function fillLessons(bd, user) {
        bd.innerHTML = '';
        var keys = Object.keys(lsData);
        if (!keys.length) {
            bd.innerHTML = '<div class="mx-pl-empty">No lessons yet \u2014 be the first!</div>';
            return;
        }
        keys.forEach(function(id) {
            var d = lsData[id];
            var row = mk('div', 'mx-lesson-row');
            var meta = mk('div', 'mx-lesson-meta');
            var byEl = mk('div', 'mx-lesson-by');
            var lessonOwner = normalizeProfileUser(d.createdBy || 'ghadi');
            byEl.textContent = '[' + lessonOwner + ']';
            byEl.addEventListener('click', function() {
                hidePanels();
                window.location.href = '/users/' + lessonOwner;
            });
            var nm = mk('div', 'mx-lesson-name');
            nm.textContent = d.title || 'Untitled';
            meta.appendChild(byEl);
            meta.appendChild(nm);
            row.appendChild(meta);

            var btns = mk('div', 'mx-lesson-btns');
            var vb = mk('button', 'mx-lbtn v');
            vb.textContent = 'View';
            vb.addEventListener('click', function() {
                hidePanels();
                window.location.href = '/lessons';
            });
            btns.appendChild(vb);

            if (user && (d.createdBy === user || user === 'ghadi')) {
                var eb = mk('button', 'mx-lbtn e');
                eb.textContent = '+ Ex';
                eb.addEventListener('click', (function(lid, lt) {
                    return function() {
                        showAddExercise(lid, lt);
                    };
                }(id, d.title || 'Untitled')));
                btns.appendChild(eb);
            }
            row.appendChild(btns);
            bd.appendChild(row);
        });
    }

    function showCreateLesson() {
        lessonsPanel.innerHTML = '';
        var f = mk('div', 'mx-pf');
        var bk = mk('button', 'mx-pf-back');
        bk.textContent = '\u2190 Back';
        bk.addEventListener('click', function() {
            lsLoaded = false;
            renderLessons();
        });
        f.appendChild(bk);
        var h4 = mk('h4');
        h4.textContent = 'Create Lesson';
        f.appendChild(h4);
        var ti = mk('input', 'mx-fi');
        ti.type = 'text';
        ti.placeholder = 'Title';
        ti.maxLength = 80;
        f.appendChild(ti);
        var de = mk('textarea', 'mx-fi ta');
        de.placeholder = 'Description (optional)';
        f.appendChild(de);
        var co = mk('textarea', 'mx-fi ta');
        co.placeholder = 'Lesson content \u2014 what members will read';
        co.style.height = '110px';
        f.appendChild(co);
        var err = mk('div', 'mx-ferr');
        f.appendChild(err);
        var sb = mk('button', 'mx-pb g');
        sb.textContent = 'Publish';
        sb.addEventListener('click', function() {
            var ttl = ti.value.trim();
            var cnt = co.value.trim();
            if (!ttl) {
                err.textContent = 'Enter a title.';
                return;
            }
            if (!cnt) {
                err.textContent = 'Enter the lesson content.';
                return;
            }
            sb.textContent = 'Publishing\u2026';
            sb.disabled = true;
            fetch('https://matix-1d538-default-rtdb.firebaseio.com/lessons.json', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title: ttl,
                        description: de.value.trim(),
                        content: cnt,
                        createdBy: getUser(),
                        createdAt: Date.now()
                    })
                }).then(function() {
                    lsLoaded = false;
                    renderLessons();
                })
                .catch(function() {
                    err.textContent = 'Failed. Try again.';
                    sb.textContent = 'Publish';
                    sb.disabled = false;
                });
        });
        f.appendChild(sb);
        lessonsPanel.appendChild(f);
    }

    function showAddExercise(lid, ltitle) {
        lessonsPanel.innerHTML = '';
        var f = mk('div', 'mx-pf');
        var bk = mk('button', 'mx-pf-back');
        bk.textContent = '\u2190 Back';
        bk.addEventListener('click', renderLessons);
        f.appendChild(bk);
        var h4 = mk('h4');
        h4.textContent = 'Add Exercise';
        f.appendChild(h4);
        var sub = mk('p', 'mx-pf-sub');
        sub.textContent = ltitle;
        f.appendChild(sub);
        var qi = mk('input', 'mx-fi');
        qi.type = 'text';
        qi.placeholder = 'Question';
        qi.maxLength = 300;
        f.appendChild(qi);
        var ai = mk('input', 'mx-fi');
        ai.type = 'text';
        ai.placeholder = 'Answer';
        ai.maxLength = 300;
        f.appendChild(ai);
        var msg = mk('div', 'mx-ferr');
        f.appendChild(msg);
        var sb = mk('button', 'mx-pb y');
        sb.textContent = 'Add Exercise';
        sb.addEventListener('click', function() {
            var q = qi.value.trim(),
                a = ai.value.trim();
            if (!q || !a) {
                msg.textContent = 'Fill both fields.';
                return;
            }
            sb.textContent = 'Saving\u2026';
            sb.disabled = true;
            fetch('https://matix-1d538-default-rtdb.firebaseio.com/exercises/' + lid + '.json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question: q,
                    answer: a,
                    createdBy: getUser(),
                    createdAt: Date.now()
                })
            }).then(function() {
                msg.className = 'mx-fok';
                msg.textContent = 'Added!';
                qi.value = '';
                ai.value = '';
                sb.textContent = 'Add Exercise';
                sb.disabled = false;
            }).catch(function() {
                msg.textContent = 'Failed.';
                sb.textContent = 'Add Exercise';
                sb.disabled = false;
            });
        });
        f.appendChild(sb);
        lessonsPanel.appendChild(f);
    }

    wirePanel('lessons', lessonsPanel, lessonsBtn, 420, renderLessons);

    /* Join Matix */
    right.appendChild(vd());
    var joinBtn = mk('button', 'mx-join-btn');
    joinBtn.textContent = 'Join Matix';
    right.appendChild(joinBtn);
    var joinPanel = mk('div', 'mx-panel');
    joinPanel.id = 'mxp-join';
    getPortal().appendChild(joinPanel);
    allPanels.push(joinPanel);

    function buildJoinPanel() {
        joinPanel.innerHTML = '';
        var user = getUser();
        var w = mk('div', 'mx-p-auth');
        if (user) {
            renderUserCard(w, user, function() {
                doSignOut();
                refreshAuth();
                buildJoinPanel();
                buildSiPanel();
            });
        } else {
            var h3 = mk('h3');
            h3.textContent = 'Join Matix';
            w.appendChild(h3);
            var desc = mk('p', 'mx-p-desc');
            desc.textContent = 'Create a free account to make lessons and track progress.';
            w.appendChild(desc);
            var ui = mk('input', 'mx-fi');
            ui.type = 'text';
            ui.placeholder = 'Choose a username';
            ui.maxLength = 24;
            ui.autocomplete = 'username';
            var pi = mk('input', 'mx-fi');
            pi.type = 'password';
            pi.placeholder = 'Password (min 4 chars)';
            pi.autocomplete = 'new-password';
            var p2 = mk('input', 'mx-fi');
            p2.type = 'password';
            p2.placeholder = 'Confirm password';
            p2.autocomplete = 'new-password';
            var tuWrap = mk('label', 'mx-toggle mx-join-tu');
            var tu = mk('input'); tu.type = 'checkbox'; tu.checked = true;
            var tuSp = mk('span'); tuSp.textContent = 'I\u2019d like to be a test user on the math club site';
            var tuLearn = mk('button', 'mx-join-learn'); tuLearn.type = 'button'; tuLearn.textContent = 'Learn more';
            tuLearn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); openDocsModal('/docs/whatistestuser.html'); });
            tuWrap.appendChild(tu); tuWrap.appendChild(tuSp); tuWrap.appendChild(tuLearn);
            var er = mk('div', 'mx-ferr');
            var sb = mk('button', 'mx-pb g');
            sb.textContent = 'Join Matix';
            sb.addEventListener('click', function() {
                if (!pi.value || pi.value.length < 4) {
                    er.textContent = 'Password must be at least 4 characters.';
                    return;
                }
                if (pi.value !== p2.value) {
                    er.textContent = 'Passwords do not match.';
                    return;
                }
                er.textContent = '';
                sb.textContent = 'Joining\u2026';
                sb.disabled = true;
                doJoin(ui.value, pi.value, tu.checked, function(res) {
                    if (res === 'ok') {
                        refreshAuth();
                        buildJoinPanel();
                        buildSiPanel();
                        return;
                    }
                    sb.textContent = 'Join Matix';
                    sb.disabled = false;
                    if (res === 'short') { er.textContent = 'Username must be at least 2 characters.'; }
                    else if (res === 'reserved') { er.textContent = 'That username is reserved \u2014 use Sign In.'; }
                    else if (res === 'taken') { er.textContent = 'Username taken. Choose another.'; }
                    else { er.textContent = 'Something went wrong. Try again.'; }
                });
            });
            [ui, pi, p2].forEach(function(inp) {
                inp.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') sb.click();
                });
            });
            var hint = mk('p', 'mx-switch-hint');
            hint.innerHTML = 'Already have an account? <a id="mx-gsi">Sign In \u2192</a>';
            w.appendChild(ui);
            w.appendChild(pi);
            w.appendChild(p2);
            w.appendChild(tuWrap);
            w.appendChild(er);
            w.appendChild(sb);
            w.appendChild(hint);
        }
        joinPanel.appendChild(w);
        var gsi = joinPanel.querySelector('#mx-gsi');
        if (gsi) gsi.addEventListener('click', function() {
            hidePanels();
            buildSiPanel();
            openPanel('si', siPanel, siBtn, 290);
        });
    }

    wirePanel('join', joinPanel, joinBtn, 290, buildJoinPanel);

    /* Sign In */
    /* Messages / notifications button */
    right.appendChild(vd());
    var msgBtn = mk('a', 'mx-si-btn mx-msg-btn');
    msgBtn.href = '/messages';
    msgBtn.innerHTML = '\ud83d\udd14 Messages';
    var msgDot = mk('span', 'mx-msg-dot');
    msgDot.style.display = 'none';
    msgBtn.appendChild(msgDot);
    right.appendChild(msgBtn);

    /* Floating bell button so notifications stay reachable on mobile, since the scrolling nav bar can otherwise hide mx-msg-btn off-screen. */
    var mobileNotifBtn = mk('a', 'mx-mobile-notif-btn');
    mobileNotifBtn.href = '/messages';
    mobileNotifBtn.setAttribute('aria-label', 'Notifications');
    mobileNotifBtn.innerHTML = '\ud83d\udd14';
    var mobileNotifDot = mk('span', 'mx-msg-dot');
    mobileNotifDot.style.display = 'none';
    mobileNotifBtn.appendChild(mobileNotifDot);
    getPortal().appendChild(mobileNotifBtn);
    mobileNotifBtn.addEventListener('click', function (e) { e.preventDefault(); openNotifModal(); });

    /* ===== Notifications center + background browser alerts ===== */
    var NOTIF_TYPES = [
        { key: 'follower', label: 'New follower' },
        { key: 'joined', label: 'New member joined' },
        { key: 'role', label: 'Role change (promotion/demotion)' },
        { key: 'changelog', label: 'New changelog item' },
        { key: 'comment', label: 'New comment on your profile' },
        { key: 'points', label: 'Points earned / changed' },
        { key: 'redeem', label: 'Points request accepted' },
        { key: 'meme', label: 'New joke / meme posted' },
        { key: 'lesson', label: 'New lesson added' },
        { key: 'deleted', label: 'A user was removed' }
    ];
    function notifPrefs(user) {
        var n = normUser(user), prefs = {};
        try { prefs = JSON.parse(localStorage.getItem('mx_notif_prefs_' + n) || '{}') || {}; } catch (e) { prefs = {}; }
        NOTIF_TYPES.forEach(function (t) { if (prefs[t.key] === undefined) prefs[t.key] = true; });
        return prefs;
    }
    function saveNotifPrefs(user, prefs) {
        try { localStorage.setItem('mx_notif_prefs_' + normUser(user), JSON.stringify(prefs)); } catch (e) {}
    }
    function grabJson(url) { return fetch(url).then(function (r) { return r.json(); }).catch(function () { return null; }); }
    /* Unified, time-sorted alert feed: computed (followers/joins/comments) + stored (role/points/redeem) + broadcast changelog. */
    function collectAlerts(user, cb) {
        var n = normUser(user);
        Promise.all([
            grabJson(FIREBASE_URL + '/follows/' + encodeURIComponent(n) + '.json'),
            grabJson(FIREBASE_URL + '/members.json'),
            grabJson(FIREBASE_URL + '/profile_comments/' + encodeURIComponent(n) + '.json'),
            grabJson(FIREBASE_URL + '/notifications/' + encodeURIComponent(n) + '.json'),
            grabJson(FIREBASE_URL + '/changelog.json'),
            grabJson(FIREBASE_URL + '/funny_memes.json'),
            grabJson(FIREBASE_URL + '/lessons.json'),
            grabJson(FIREBASE_URL + '/deletions.json')
        ]).then(function (res) {
            var follows = res[0] || {}, members = res[1] || {}, comments = res[2] || {}, stored = res[3] || {}, changelog = res[4] || {}, memes = res[5] || {}, lessons = res[6] || {}, dels = res[7] || {};
            var out = [];
            Object.keys(follows).forEach(function (k) { var f = follows[k]; if (f) out.push({ type: 'follower', title: 'New follower', body: '@' + k + ' followed you', at: f.at || 0 }); });
            Object.keys(members).forEach(function (k) { if (normUser(k) === n) return; var m = members[k]; if (m) out.push({ type: 'joined', title: 'New member joined', body: '@' + k + ' joined Matix', at: m.joinedAt || 0 }); });
            Object.keys(comments).forEach(function (k) { var c = comments[k]; if (!c || normUser(c.by) === n) return; out.push({ type: 'comment', title: 'New profile comment', body: '@' + (c.by || '?') + ': ' + String(c.text || '').slice(0, 60), at: c.at || 0 }); });
            Object.keys(stored).forEach(function (k) { var s = stored[k]; if (s) out.push({ type: s.type || 'role', title: s.title || 'Notification', body: s.body || '', at: s.at || 0 }); });
            Object.keys(changelog).forEach(function (k) { var c = changelog[k]; if (c) out.push({ type: 'changelog', title: '\ud83d\udcdc ' + (c.title || 'Changelog update'), body: c.description || '', at: c.at || 0 }); });
            Object.keys(memes).forEach(function (k) { var mm = memes[k]; if (!mm || normUser(mm.postedBy) === n) return; out.push({ type: 'meme', title: '\ud83d\ude02 New joke / meme', body: (mm.title ? '\u201c' + String(mm.title).slice(0, 60) + '\u201d' : 'A new meme was posted') + ' \u2014 @' + (mm.postedBy || '?'), at: mm.createdAt || 0 }); });
            Object.keys(lessons).forEach(function (k) { var ls = lessons[k]; if (!ls || normUser(ls.createdBy) === n) return; out.push({ type: 'lesson', title: '\ud83d\udcda New lesson', body: (ls.title || 'Untitled') + ' \u2014 by @' + (ls.createdBy || 'ghadi'), at: ls.createdAt || 0 }); });
            Object.keys(dels).forEach(function (k) { var dd = dels[k]; if (!dd || normUser(k) === n) return; out.push({ type: 'deleted', title: '\ud83d\uddd1 User removed', body: '@' + k + ' was removed from Matix' + (dd.by ? ' by @' + dd.by : ''), at: dd.at || 0 }); });
            out.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
            cb(out);
        });
    }
    /* Fire OS-level notifications for fresh alerts while any Matix tab is open. */
    function fireBrowserNotifs() {
        var me = getUser();
        if (!me || !('Notification' in window) || Notification.permission !== 'granted') return;
        var n = normUser(me), prefs = notifPrefs(me), lastRaw = null;
        try { lastRaw = localStorage.getItem('mx_notif_last_' + n); } catch (e) {}
        if (lastRaw === null) { try { localStorage.setItem('mx_notif_last_' + n, String(Date.now())); } catch (e) {} return; }
        var last = parseInt(lastRaw, 10) || 0;
        collectAlerts(me, function (list) {
            var maxAt = last;
            list.filter(function (a) { return prefs[a.type] !== false && (a.at || 0) > last; }).forEach(function (a, i) {
                if (i < 5) { try { new Notification(a.title, { body: a.body }); } catch (e) {} }
                if ((a.at || 0) > maxAt) maxAt = a.at || 0;
            });
            if (maxAt > last) { try { localStorage.setItem('mx_notif_last_' + n, String(maxAt)); } catch (e) {} }
        });
    }
    var msgPanel = mk('div', 'mx-panel mx-p-notif');
    msgPanel.id = 'mxp-msg';
    getPortal().appendChild(msgPanel);
    allPanels.push(msgPanel);
    function renderNotifPanel() {
        msgPanel.innerHTML = '';
        var me = getUser();
        var hd = mk('div', 'mx-pl-head');
        var ht = mk('h3'); ht.textContent = '\ud83d\udd14 Notifications'; hd.appendChild(ht);
        msgPanel.appendChild(hd);
        if (!me) { var g = mk('div', 'mx-notif-empty'); g.textContent = 'Sign in to see your notifications.'; msgPanel.appendChild(g); return; }
        var prefs = notifPrefs(me);
        var listWrap = mk('div', 'mx-notif-list');
        listWrap.innerHTML = '<div class="mx-notif-empty">Loading\u2026</div>';
        msgPanel.appendChild(listWrap);
        collectAlerts(me, function (list) {
            listWrap.innerHTML = '';
            var shown = list.filter(function (a) { return prefs[a.type] !== false; }).slice(0, 15);
            if (!shown.length) { listWrap.innerHTML = '<div class="mx-notif-empty">No notifications yet.</div>'; }
            else shown.forEach(function (a) {
                var it = mk('div', 'mx-notif-item');
                var t = mk('div', 'mx-notif-t'); t.textContent = a.title; it.appendChild(t);
                if (a.body) { var b = mk('div', 'mx-notif-b'); b.textContent = a.body; it.appendChild(b); }
                listWrap.appendChild(it);
            });
            try { localStorage.setItem('mx_messages_seen_' + normUser(me), String(Date.now())); } catch (e) {}
            if (msgDot) msgDot.style.display = 'none';
        });
        var setWrap = mk('div', 'mx-notif-set');
        var setHead = mk('div', 'mx-notif-set-h'); setHead.textContent = 'Alert settings'; setWrap.appendChild(setHead);
        if ('Notification' in window && Notification.permission !== 'granted') {
            var enable = mk('button', 'mx-pb b'); enable.textContent = '\ud83d\udd14 Enable browser notifications';
            enable.addEventListener('click', function () {
                if (!('Notification' in window)) return;
                Notification.requestPermission().then(function (p) { if (p === 'granted') { enable.style.display = 'none'; try { localStorage.setItem('mx_notif_last_' + normUser(me), String(Date.now())); } catch (e) {} } });
            });
            setWrap.appendChild(enable);
        }
        NOTIF_TYPES.forEach(function (ty) {
            var row = mk('label', 'mx-toggle');
            var cbx = mk('input'); cbx.type = 'checkbox'; cbx.checked = prefs[ty.key] !== false;
            cbx.addEventListener('change', function () { var p = notifPrefs(me); p[ty.key] = cbx.checked; saveNotifPrefs(me, p); });
            var sp = mk('span'); sp.textContent = ty.label;
            row.appendChild(cbx); row.appendChild(sp); setWrap.appendChild(row);
        });
        var allLink = mk('a', 'mx-notif-all'); allLink.href = '/messages'; allLink.textContent = 'Open Messages page \u2192';
        allLink.addEventListener('click', hidePanels);
        setWrap.appendChild(allLink);
        msgPanel.appendChild(setWrap);
    }
    /* Notifications now live on a full center page (/messages) \u2014 the bell is a plain link, not a dropdown. */
    (function initNotifPoller() { setInterval(function () { try { updateMessagesBadge(); } catch (e) {} try { fireBrowserNotifs(); } catch (e) {} }, 30000); })();

    /* Bell opens a centered notifications modal (iframe) with X + click-outside to close. */
    var notifOverlay = mk('div', 'mx-notif-overlay');
    notifOverlay.innerHTML = '<div class="mx-notif-modal" role="dialog" aria-label="Notifications"><button class="mx-notif-x" aria-label="Close">\u00d7</button><iframe class="mx-notif-frame" title="Notifications"></iframe></div>';
    getPortal().appendChild(notifOverlay);
    var notifFrame = notifOverlay.querySelector('.mx-notif-frame');
    function closeNotifModal() {
        notifOverlay.classList.remove('open');
        document.body.style.overflow = '';
        try { notifFrame.src = 'about:blank'; } catch (e) { }
        try { updateMessagesBadge(); } catch (e) { }
    }
    function openNotifModal() {
        hidePanels();
        notifFrame.src = '/messages';
        notifOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    notifOverlay.querySelector('.mx-notif-x').addEventListener('click', closeNotifModal);
    notifOverlay.addEventListener('click', function (e) { if (e.target === notifOverlay) closeNotifModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && notifOverlay.classList.contains('open')) closeNotifModal(); });
    msgBtn.addEventListener('click', function (e) { e.preventDefault(); openNotifModal(); });

    /* A generic centered docs modal (iframe), reused for "Learn more" links. */
    var docsOverlay = mk('div', 'mx-notif-overlay');
    docsOverlay.innerHTML = '<div class="mx-notif-modal" role="dialog" aria-label="Docs"><button class="mx-notif-x" aria-label="Close">\u00d7</button><iframe class="mx-notif-frame" title="Docs"></iframe></div>';
    getPortal().appendChild(docsOverlay);
    var docsFrame = docsOverlay.querySelector('.mx-notif-frame');
    function closeDocsModal() { docsOverlay.classList.remove('open'); document.body.style.overflow = ''; try { docsFrame.src = 'about:blank'; } catch (e) { } }
    function openDocsModal(url) { hidePanels(); docsFrame.src = url; docsOverlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
    docsOverlay.querySelector('.mx-notif-x').addEventListener('click', closeDocsModal);
    docsOverlay.addEventListener('click', function (e) { if (e.target === docsOverlay) closeDocsModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && docsOverlay.classList.contains('open')) closeDocsModal(); });

    right.appendChild(vd());
    var siBtn = mk('button', 'mx-si-btn');
    right.appendChild(siBtn);
    var siPanel = mk('div', 'mx-panel');
    siPanel.id = 'mxp-si';
    getPortal().appendChild(siPanel);
    allPanels.push(siPanel);

    function buildSiPanel() {
        siPanel.innerHTML = '';
        var user = getUser();
        var w = mk('div', 'mx-p-auth');
        if (user) {
            renderUserCard(w, user, function() {
                doSignOut();
                refreshAuth();
                buildSiPanel();
                buildJoinPanel();
            });
        } else {
            var h3 = mk('h3');
            h3.textContent = 'Sign In';
            w.appendChild(h3);
            var ui = mk('input', 'mx-fi');
            ui.type = 'text';
            ui.placeholder = 'Username';
            ui.autocomplete = 'username';
            var pi = mk('input', 'mx-fi');
            pi.type = 'password';
            pi.placeholder = 'Password';
            pi.autocomplete = 'current-password';
            var er = mk('div', 'mx-ferr');
            var sb = mk('button', 'mx-pb y');
            sb.textContent = 'Sign In';
            sb.addEventListener('click', function() {
                er.textContent = '';
                sb.textContent = 'Signing In\u2026';
                sb.disabled = true;
                doSignIn(ui.value, pi.value, function(ok, ban) {
                    sb.textContent = 'Sign In';
                    sb.disabled = false;
                    if (ok) {
                        refreshAuth();
                        buildSiPanel();
                        buildJoinPanel();
                    } else if (ban) {
                        er.textContent = '\ud83d\udeab Banned: ' + (ban.reason || 'no reason given') + ' (' + formatBanRemaining(ban) + ')';
                    } else {
                        er.textContent = 'Invalid username or password.';
                    }
                });
            });
            [ui, pi].forEach(function(inp) {
                inp.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') sb.click();
                });
            });
            var hint = mk('p', 'mx-switch-hint');
            hint.innerHTML = 'New here? <a id="mx-gjo">Join Matix \u2192</a>';
            w.appendChild(ui);
            w.appendChild(pi);
            w.appendChild(er);
            w.appendChild(sb);
            w.appendChild(hint);
        }
        siPanel.appendChild(w);
        var gjo = siPanel.querySelector('#mx-gjo');
        if (gjo) gjo.addEventListener('click', function() {
            hidePanels();
            buildJoinPanel();
            openPanel('join', joinPanel, joinBtn, 290);
        });
    }

    wirePanel('si', siPanel, siBtn, 290, buildSiPanel);

    function renderUserCard(container, user, onSignOut) {
        var uc = mk('div', 'mx-user-wrap');
        var un = mk('div', 'mx-uname-big');
        un.textContent = '\ud83d\udc64 ' + user;
        var ul = mk('div', 'mx-ulabel');
        ul.textContent = VALID_MEMBERS[user] ? 'Matix Member' : 'Matix User';
        var profLink = mk('a', 'mx-profile-link');
        profLink.href = '/users/' + normalizeProfileUser(user);
        profLink.textContent = 'View my profile \u2192';
        profLink.addEventListener('click', hidePanels);
        var so = mk('button', 'mx-pb r');
        so.textContent = 'Sign Out';
        so.style.marginTop = '6px';
        so.addEventListener('click', onSignOut);
        uc.appendChild(un);
        uc.appendChild(ul);
        uc.appendChild(profLink);
        uc.appendChild(so);
        container.appendChild(uc);
    }

    /* --- AUTH REFRESH --- */
    function refreshAuth() {
        var user = getUser();
        if (user) {
            siBtn.textContent = '\ud83d\udc64 ' + user;
            siBtn.classList.add('mx-signed');
            joinBtn.style.display = 'none';
            if (msgBtn) msgBtn.style.display = '';
            if (mobileNotifBtn) mobileNotifBtn.classList.add('mx-show');
        } else {
            siBtn.textContent = 'Sign In';
            siBtn.classList.remove('mx-signed');
            joinBtn.style.display = '';
            if (msgBtn) msgBtn.style.display = 'none';
            if (mobileNotifBtn) mobileNotifBtn.classList.remove('mx-show');
        }
        updateMessagesBadge();
    }

    /* Show a red dot on the Messages button when there are new followers,
       newly-joined members, or new profile comments since the last visit. */
    function updateMessagesBadge() {
        var me = getUser();
        if (!me) { if (msgDot) msgDot.style.display = 'none'; if (mobileNotifDot) mobileNotifDot.style.display = 'none'; return; }
        var n = normUser(me), seen = 0, prefs = notifPrefs(me);
        try { seen = parseInt(localStorage.getItem('mx_messages_seen_' + n) || '0', 10) || 0; } catch (e) {}
        collectAlerts(me, function (list) {
            var has = list.some(function (a) { return prefs[a.type] !== false && (a.at || 0) > seen; });
            if (msgDot) msgDot.style.display = has ? 'block' : 'none';
            if (mobileNotifDot) mobileNotifDot.style.display = has ? 'block' : 'none';
        });
    }
    refreshAuth();

    /* If the signed-in user is (or becomes) banned, sign them out on load. */
    (function enforceBanOnLoad() {
        var cur = getUser();
        if (!cur) return;
        checkBan(cur, function(ban) {
            if (!ban) return;
            doSignOut();
            refreshAuth();
            try {
                buildSiPanel();
                buildJoinPanel();
            } catch (e) {}
            try {
                showBanNotice(ban);
            } catch (e) {}
        });
    })();

    /* --- PUBLIC API ---
       Lets other pages (e.g. the lessons page) reuse this nav's Sign In / Join Matix
       panels instead of shipping their own login form. */
    window.MatixAuth = {
        getUser: getUser,
        signOut: function() {
            doSignOut();
            refreshAuth();
            buildJoinPanel();
            buildSiPanel();
        },
        openSignIn: function() {
            openMenu();
            buildSiPanel();
            openPanel('si', siPanel, siBtn, 290);
        },
        openJoin: function() {
            openMenu();
            buildJoinPanel();
            openPanel('join', joinPanel, joinBtn, 290);
        },
        onChange: function(cb) {
            if (typeof cb === 'function') authListeners.push(cb);
        }
    };

    /* --- ASSEMBLE --- */
    bar.appendChild(right);

    function syncPanelTop() {
        repositionOpenPanels();
    }

    function openMenu() {
        bar.classList.add('mx-open');
        menuToggle.classList.add('mx-open');
        menuToggle.setAttribute('aria-label', 'Close menu');
        menuToggle.setAttribute('aria-expanded', 'true');
        syncPanelTop();
    }

    function closeMenu() {
        bar.classList.remove('mx-open');
        menuToggle.classList.remove('mx-open');
        menuToggle.setAttribute('aria-label', 'Open menu');
        menuToggle.setAttribute('aria-expanded', 'false');
        hidePanels();
    }

    function toggleMenu() {
        if (bar.classList.contains('mx-open')) closeMenu();
        else openMenu();
    }

    function inject() {
        document.body.insertBefore(menuToggle, document.body.firstChild);
        document.body.insertBefore(bar, document.body.firstChild);
        syncPanelTop();
        menuToggle.addEventListener('click', toggleMenu);
        // Capture phase: this must run BEFORE a button's own click handler can
        // clear/rebuild its panel's innerHTML (e.g. Create Lesson, Add Exercise,
        // Back, Sign Out all do this). Otherwise the clicked element looks like
        // it's already "outside" the panel by the time this check runs, and the
        // whole nav bar incorrectly closes right as you press the button.
        document.addEventListener('click', function(e) {
            if (menuToggle.contains(e.target)) return;
            if (bar.contains(e.target)) return;
            if (allPanels.some(function(p) {
                    return p.contains(e.target);
                })) return;
            closeMenu();
        }, true);
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeMenu();
        });
        window.addEventListener('resize', syncPanelTop);
        window.addEventListener('scroll', repositionOpenPanels, { passive: true });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
    else inject();
}());