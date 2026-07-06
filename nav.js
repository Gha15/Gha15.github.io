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
        var u = (rawUser || '').toLowerCase().trim();
        if (!u || !pass) { cb(false); return; }
        if (VALID_MEMBERS[u] && VALID_MEMBERS[u] === pass) {
            setUser(u);
            cb(true);
            return;
        }
        function tryLocalFallback() {
            try {
                var m = JSON.parse(localStorage.getItem('mx_joined') || '{}');
                if (m[u] && m[u] === pass) {
                    setUser(u);
                    cb(true);
                    return;
                }
            } catch (e) {}
            cb(false);
        }
        fetch(FIREBASE_URL + '/members/' + encodeURIComponent(u) + '.json')
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data && data.password === pass) {
                    setUser(u);
                    cb(true);
                    return;
                }
                tryLocalFallback();
            })
            .catch(tryLocalFallback);
    }

    /* Join creates a Firebase-backed account (readable by anyone with the DB URL,
       same trust level as the hardcoded member list above) instead of a
       browser-only localStorage account. */
    function doJoin(rawUser, pass, cb) {
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
                    body: JSON.stringify({ password: pass, joinedAt: Date.now() })
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
        '#mx-nav-bar{position:fixed;top:10px;left:74px;right:12px;height:52px;z-index:10000;display:flex;align-items:center;background:rgba(2,7,22,0.96);border:1px solid rgba(59,130,246,0.18);border-top:4px solid #f59e0b;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);box-shadow:0 2px 32px rgba(0,0,0,0.7);padding:0 14px;border-radius:12px;user-select:none;overflow-x:auto;overflow-y:visible;scrollbar-width:none;opacity:0;visibility:hidden;pointer-events:none;transform:translateY(-10px);transition:opacity .18s ease,transform .18s ease,visibility .18s ease}',
        '#mx-nav-bar.mx-open{opacity:1;visibility:visible;pointer-events:auto;transform:translateY(0)}',
        '#mx-nav-bar::-webkit-scrollbar{display:none}',
        'body{padding-top:72px!important;box-sizing:border-box}',

        /* logo */
        '.mx-logo{display:inline-flex;align-items:center;text-decoration:none;flex-shrink:0;margin-right:6px;gap:0}',
        '.mx-logo-img{height:26px;width:auto;display:block;filter:drop-shadow(0 0 6px rgba(59,130,246,0.45))}',
        '.mx-logo-wordmark{font-family:"Trebuchet MS",Arial,sans-serif;font-size:1.1rem;font-weight:900;color:#fff;letter-spacing:2.5px;margin-left:6px}',
        '.mx-logo-wordmark em{color:#f59e0b;font-style:normal}',

        /* divider */
        '.mx-vd{width:1px;height:22px;background:rgba(255,255,255,0.10);margin:0 3px;flex-shrink:0}',

        /* nav button */
        '.mx-nb{display:inline-flex;align-items:center;gap:3px;height:52px;padding:0 11px;background:transparent;color:rgba(255,255,255,0.75);font-family:"Trebuchet MS",Arial,sans-serif;font-size:0.83rem;font-weight:600;text-decoration:none;border:0;border-bottom:2.5px solid transparent;cursor:pointer;white-space:nowrap;transition:color .12s,background .12s,border-bottom-color .12s;box-sizing:border-box;line-height:1;flex-shrink:0}',
        '.mx-nb:.is-clicked,.mx-nb.mx-open{color:#fff;background:rgba(255,255,255,0.06);border-bottom-color:#f59e0b;text-decoration:none}',
        '.mx-arr{font-size:.58em;opacity:.55;margin-left:2px}',

        /* right cluster */
        '.mx-right{margin-left:auto;display:flex;align-items:center;gap:4px;flex-shrink:0;padding-left:8px}',

        /* auth buttons */
        '.mx-join-btn{height:30px;padding:0 12px;background:rgba(16,185,129,.08);border:1.5px solid #10b981;color:#34d399;border-radius:6px;font-size:.78rem;font-weight:700;cursor:pointer;font-family:"Trebuchet MS",Arial,sans-serif;white-space:nowrap;transition:background .12s;flex-shrink:0}',
        '.mx-join-btn:.is-clicked,.mx-join-btn.mx-open{background:rgba(16,185,129,.22)}',
        '.mx-si-btn{height:30px;padding:0 12px;background:rgba(245,158,11,.08);border:1.5px solid #f59e0b;color:#fbbf24;border-radius:6px;font-size:.78rem;font-weight:700;cursor:pointer;font-family:"Trebuchet MS",Arial,sans-serif;white-space:nowrap;transition:background .12s;flex-shrink:0}',
        '.mx-si-btn:.is-clicked,.mx-si-btn.mx-open{background:rgba(245,158,11,.20)}',
        '.mx-si-btn.mx-signed{background:rgba(59,130,246,.08);border-color:#3b82f6;color:#93c5fd}',
        '.mx-si-btn.mx-signed:.is-clicked{background:rgba(59,130,246,.20)}',

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

        /* media */
        '@media(max-width:768px){#mx-menu-toggle{top:8px;left:8px;width:48px;height:48px}#mx-nav-bar{top:8px;left:62px;right:8px;height:48px;padding:0 10px}body{padding-top:66px!important}.mx-nb{height:48px;padding:0 9px;font-size:.8rem}.mx-panel{max-height:calc(100vh - 72px);overflow-y:auto;z-index:10002}.mx-p-iframe{max-width:calc(100vw - 16px)!important;height:auto!important;min-height:180px}.mx-p-auth,.mx-p-sub,.mx-p-lessons{width:100%!important;box-sizing:border-box}.mx-p-lessons{max-height:min(540px,calc(100vh - 72px))}.mx-ifr-label{font-size:.62rem;max-width:55%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}'
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

    var lessonsPanel = mk('div', 'mx-panel mx-p-lessons');
    lessonsPanel.id = 'mxp-lessons';
    getPortal().appendChild(lessonsPanel);
    allPanels.push(lessonsPanel);

    /* Users */
    right.appendChild(vd());
    var usersBtn = mk('a', 'mx-nb');
    usersBtn.href = '/users';
    usersBtn.textContent = 'Users';
    right.appendChild(usersBtn);

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
                doJoin(ui.value, pi.value, function(res) {
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
                doSignIn(ui.value, pi.value, function(ok) {
                    sb.textContent = 'Sign In';
                    sb.disabled = false;
                    if (ok) {
                        refreshAuth();
                        buildSiPanel();
                        buildJoinPanel();
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
        } else {
            siBtn.textContent = 'Sign In';
            siBtn.classList.remove('mx-signed');
            joinBtn.style.display = '';
        }
    }
    refreshAuth();

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