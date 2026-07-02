/* nav.js — Matix global nav bar, self-contained. Injects into every page. */
(function () {
  'use strict';
  if (document.getElementById('mx-nav-menu')) return;

  /* ── STYLES ──────────────────────────────────────────────── */
  const css = `
    .mx-menu-container {
      position: fixed;
      top: 10px;
      left: 12px;
      z-index: 10000;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      background: linear-gradient(140deg, #4d97ff, #2d7de4);
      border: 1px solid rgba(15,23,42,0.18);
      border-radius: 10px;
      box-shadow: 0 8px 18px rgba(15,23,42,0.25);
      overflow: hidden;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    .mx-menu-container::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image: url('/logo.svg');
      background-size: 135%;
      background-position: center;
      background-repeat: no-repeat;
      opacity: 0.28;
      filter: saturate(1.25) contrast(1.15);
      pointer-events: none;
    }
    .mx-menu-line {
      position: relative;
      z-index: 2;
      width: 26px;
      height: 3px;
      border-radius: 6px;
      background: #fff;
      transition: transform 0.25s ease, opacity 0.25s ease;
      flex-shrink: 0;
    }
    .mx-menu-spacer {
      height: 5px;
      position: relative;
      z-index: 2;
      flex-shrink: 0;
    }
    .mx-menu-container.active .mx-menu-line:nth-child(1) {
      transform: translateY(8px) rotate(45deg);
    }
    .mx-menu-container.active .mx-menu-line:nth-child(3) {
      transform: translateY(-8px) rotate(-45deg);
    }
    .mx-menu-container.active .mx-menu-line:nth-child(5) {
      opacity: 0;
      transform: scaleX(0);
    }

    /* ── Nav bar ── */
    .mx-nav-menu {
      position: fixed;
      top: 10px;
      left: 78px;
      right: 12px;
      z-index: 9999;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      flex-wrap: nowrap;
      min-height: 54px;
      padding: 8px 14px;
      background: rgba(26, 86, 219, 0.97);
      border: 1px solid rgba(10,38,90,0.28);
      border-top: 4px solid #ffab19;
      border-radius: 10px;
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transform: translateY(-12px);
      transition: opacity 0.22s ease, transform 0.22s ease, visibility 0.22s;
      overflow-x: auto;
      overflow-y: visible;
      white-space: nowrap;
      box-shadow: 0 10px 22px rgba(15,23,42,0.33);
      gap: 0;
    }
    .mx-nav-menu.active {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      transform: translateY(0);
    }
    .mx-nav-menu::-webkit-scrollbar { height: 4px; }
    .mx-nav-menu::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.3);
      border-radius: 4px;
    }

    /* ── Separator ── */
    .mx-nav-sep {
      color: rgba(255,255,255,0.3);
      font-size: 0.85rem;
      font-weight: 300;
      user-select: none;
      pointer-events: none;
      flex-shrink: 0;
      padding: 0 2px;
      line-height: 1;
      align-self: center;
    }

    /* ── Nav item wrapper (needed for preview positioning) ── */
    .mx-nav-item {
      position: relative;
      display: inline-flex;
      align-items: center;
      flex-shrink: 0;
    }

    /* ── Nav link ── */
    .mx-nav-btn {
      display: inline-block;
      padding: 8px 12px;
      background: transparent;
      color: #fff;
      font-family: 'Trebuchet MS', Arial, sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      text-decoration: none;
      border-radius: 6px;
      transition: background 0.15s ease;
      white-space: nowrap;
      cursor: pointer;
      line-height: 1.2;
      border: 0;
    }
    .mx-nav-btn:hover,
    .mx-nav-btn:focus {
      background: rgba(255,255,255,0.18);
      color: #fff;
      text-decoration: none;
      outline: 2px solid rgba(255,255,255,0.35);
      outline-offset: 1px;
    }

    /* ── Page preview tooltip (static label card) ── */
    .mx-nav-preview {
      position: fixed;
      width: 190px;
      padding: 13px 16px 15px;
      background: rgba(10, 24, 52, 0.98);
      border: 1.5px solid rgba(56,189,248,0.55);
      border-radius: 10px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.18s ease;
      z-index: 99999;
      box-shadow: 0 14px 34px rgba(0,0,0,0.6);
    }
    .mx-nav-preview.mx-visible {
      opacity: 1;
    }
    .mx-nav-preview::before {
      content: '';
      position: absolute;
      top: -7px;
      left: 50%;
      transform: translateX(-50%);
      border: 6px solid transparent;
      border-bottom-color: rgba(56,189,248,0.55);
      border-top: 0;
      pointer-events: none;
    }
    .mx-nav-preview-name {
      font-family: 'Trebuchet MS', Arial, sans-serif;
      font-size: 1rem;
      font-weight: 700;
      color: #f0f8ff;
      white-space: nowrap;
      display: block;
      margin-bottom: 4px;
    }
    .mx-nav-preview-url {
      font-family: monospace;
      font-size: 0.68rem;
      color: rgba(56,189,248,0.85);
      display: block;
      white-space: nowrap;
    }

    /* ── Dropdown panel ── */
    .mx-dropdown {
      position: fixed;
      min-width: 200px;
      background: rgba(6, 24, 72, 0.97);
      border: 1px solid rgba(96, 165, 250, 0.26);
      border-top: 3px solid #f59e0b;
      border-radius: 10px;
      padding: 6px 0;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.16s ease, transform 0.16s ease;
      transform: translateY(-6px);
      z-index: 99997;
      box-shadow: 0 18px 44px rgba(0,0,0,0.65);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
    }
    .mx-dropdown.mx-open {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }
    .mx-dropdown-item {
      display: block;
      padding: 10px 18px;
      color: #bfdbfe;
      font-family: 'Trebuchet MS', Arial, sans-serif;
      font-size: 0.88rem;
      font-weight: 600;
      text-decoration: none;
      transition: background 0.12s ease, color 0.12s ease, border-left-color 0.12s ease;
      white-space: nowrap;
      border-left: 3px solid transparent;
    }
    .mx-dropdown-item:hover {
      background: rgba(59, 130, 246, 0.20);
      color: #fff;
      text-decoration: none;
      border-left-color: #f59e0b;
    }
    .mx-has-arrow::after {
      content: ' ▾';
      font-size: 0.7em;
      opacity: 0.72;
    }
    .mx-separator {
      height: 1px;
      background: rgba(96, 165, 250, 0.14);
      margin: 4px 10px;
    }

    /* ── Secret dot ── */
    .mx-secret-dot {
      flex-shrink: 0;
      margin-left: auto;
      margin-right: 2px;
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: rgba(77,151,255,0.52);
      border: 1px solid rgba(255,255,255,0.2);
      text-decoration: none;
      font-size: 0;
      line-height: 0;
      transition: transform 0.2s ease;
      cursor: pointer;
      display: inline-block;
    }
    .mx-secret-dot:hover {
      transform: scale(1.25);
    }

    @media (max-width: 720px) {
      .mx-menu-container { top: 8px; left: 8px; width: 52px; height: 52px; }
      .mx-nav-menu { top: 8px; left: 66px; right: 8px; min-height: 46px; padding: 7px 10px; }
      .mx-nav-btn { font-size: 0.88rem; padding: 7px 9px; }
      .mx-nav-preview { display: none !important; }
      .mx-dropdown { display: none !important; }
    }
  `;

  var styleEl = document.createElement('style');
  styleEl.id = 'mx-nav-styles';
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ── NAV DATA ────────────────────────────────────────────── */
  var NAV_LINKS = [
    { href: '/',          label: 'Home' },
    { href: '/merch',     label: 'Merch' },
    { href: '/aboutus',   label: 'About Us' },
    { href: '/funny',     label: 'Jokes / Memes' },
    { href: '/FAQ',       label: 'FAQ' },
    { href: '/games',     label: 'Games', subs: [
      { href: '/games/themathplanegame',            label: '✈️  Math Plane Game'     },
      { href: '/games/mathfight',                   label: '⚔️  Math Fight'          },
      { href: '/games/treegrowinggame',             label: '🌳  Tree Growing Game'   },
      { href: '/games/virtualpetgame',              label: '🐾  Virtual Pet'          },
      { href: '/games/minigames/minigame1.html',    label: '🎮  Mini Games'           },
    ]},
    { href: '/button',    label: 'Just a Button' },
    { href: '/contactus', label: 'Contact Us' },
    { href: '/usefulotherstuffcauseicannotgetanotherdomain', label: 'Useful Other Stuff', subs: [
      { href: '/usefulotherstuffcauseicannotgetanotherdomain/tools/calculator',       label: '🔢  Calculator'        },
      { href: '/usefulotherstuffcauseicannotgetanotherdomain/tools/calendar',         label: '📅  Calendar'          },
      { href: '/usefulotherstuffcauseicannotgetanotherdomain/tools/function-plotter', label: '📈  Function Plotter'  },
      { href: '/usefulotherstuffcauseicannotgetanotherdomain/tools/graphing-sandbox', label: '📊  Graphing Sandbox'  },
      { href: '/usefulotherstuffcauseicannotgetanotherdomain/tools/stopwatch',        label: '⏱️  Stopwatch'         },
      { href: '/usefulotherstuffcauseicannotgetanotherdomain/tools/timer',            label: '⏰  Timer'             },
    ]},
    { href: '/lessons',   label: 'Lessons', subs: [
      { href: '/lessons/exercises',                   label: '📝  Exercises'          },
      { href: '/lessons/exercises/problem-generator', label: '⚡  Problem Generator' },
    ]},
    { href: '/ideas',     label: 'Ideas' },
    { href: '/membersonly', label: 'Members', subs: [
      { href: '/membersonly',                   label: '🔐  Sign In / Dashboard'  },
      { href: '/membersonly/points',            label: '⭐  My Points'            },
      { href: '/membersonly/points/how-to-get', label: '📈  How to Earn Points'  },
      { href: '/membersonly/points/use-points', label: '🎁  Use Points'           },
      { href: '/daily-challenge',               label: '🏆  Daily Challenge'      },
    ]},
  ];

  /* ── BUILD HAMBURGER ─────────────────────────────────────── */
  var burger = document.createElement('div');
  burger.id = 'mx-menu-container';
  burger.className = 'mx-menu-container';
  burger.setAttribute('aria-label', 'Menu');
  burger.setAttribute('aria-expanded', 'false');
  burger.setAttribute('role', 'button');
  burger.setAttribute('tabindex', '0');

  ['mx-menu-line','mx-menu-spacer','mx-menu-line','mx-menu-spacer','mx-menu-line'].forEach(function (cls) {
    var el = document.createElement('div');
    el.className = cls;
    burger.appendChild(el);
  });

  /* ── BUILD NAV ───────────────────────────────────────────── */
  var nav = document.createElement('nav');
  nav.id = 'mx-nav-menu';
  nav.className = 'mx-nav-menu';
  nav.setAttribute('aria-hidden', 'true');
  nav.setAttribute('aria-label', 'Site navigation');

  var previews = [];
  var dropdowns = [];

  function closeAllDropdowns() {
    dropdowns.forEach(function (d) { d.classList.remove('mx-open'); d.setAttribute('aria-hidden', 'true'); });
    previews.forEach(function (p) { p.classList.remove('mx-visible'); });
  }

  NAV_LINKS.forEach(function (link, i) {
    if (i > 0) {
      var sep = document.createElement('span');
      sep.className = 'mx-nav-sep';
      sep.setAttribute('aria-hidden', 'true');
      sep.textContent = '|';
      nav.appendChild(sep);
    }

    var item = document.createElement('span');
    item.className = 'mx-nav-item';

    var a = document.createElement('a');
    a.href = link.href;
    a.tabIndex = -1;

    if (link.subs && link.subs.length) {
      // ── Item with dropdown sub-pages ──
      a.className = 'mx-nav-btn mx-has-arrow';
      a.textContent = link.label;

      var dropdown = document.createElement('div');
      dropdown.className = 'mx-dropdown';
      dropdown.setAttribute('aria-hidden', 'true');
      dropdowns.push(dropdown);

      link.subs.forEach(function (sub, si) {
        if (si > 0) {
          var divider = document.createElement('div');
          divider.className = 'mx-separator';
          divider.setAttribute('aria-hidden', 'true');
          dropdown.appendChild(divider);
        }
        var subA = document.createElement('a');
        subA.href = sub.href;
        subA.className = 'mx-dropdown-item';
        subA.textContent = sub.label;
        subA.tabIndex = -1;
        subA.addEventListener('click', closeAllDropdowns);
        dropdown.appendChild(subA);
      });

      item.appendChild(a);
      nav.appendChild(item);

      var hideTimer = null;
      var posDropdown = function () {
        var r = a.getBoundingClientRect();
        dropdown.style.left = r.left + 'px';
        dropdown.style.top  = (r.bottom + 6) + 'px';
        dropdown.removeAttribute('aria-hidden');
        dropdown.classList.add('mx-open');
      };
      var closeDropdown = function () {
        dropdown.classList.remove('mx-open');
        dropdown.setAttribute('aria-hidden', 'true');
      };

      a.addEventListener('mouseenter', function () {
        clearTimeout(hideTimer);
        closeAllDropdowns();
        posDropdown();
      });
      a.addEventListener('mouseleave', function () {
        hideTimer = setTimeout(closeDropdown, 130);
      });
      dropdown.addEventListener('mouseenter', function () {
        clearTimeout(hideTimer);
      });
      dropdown.addEventListener('mouseleave', function () {
        hideTimer = setTimeout(closeDropdown, 130);
      });

    } else {
      // ── Simple item with label preview tooltip ──
      a.className = 'mx-nav-btn';
      a.textContent = link.label;

      var preview = document.createElement('span');
      preview.className = 'mx-nav-preview';
      preview.setAttribute('aria-hidden', 'true');

      var nameEl = document.createElement('span');
      nameEl.className = 'mx-nav-preview-name';
      nameEl.textContent = link.label;
      preview.appendChild(nameEl);

      var urlEl = document.createElement('span');
      urlEl.className = 'mx-nav-preview-url';
      urlEl.textContent = 'matix.com' + link.href;
      preview.appendChild(urlEl);

      item.appendChild(a);
      item.appendChild(preview);
      nav.appendChild(item);
      previews.push(preview);

      a.addEventListener('mouseenter', function () {
        var r = a.getBoundingClientRect();
        var pw = 190;
        var left = r.left + r.width / 2 - pw / 2;
        var top  = r.bottom + 10;
        left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
        preview.style.left = left + 'px';
        preview.style.top  = top  + 'px';
        preview.classList.add('mx-visible');
      });
      a.addEventListener('mouseleave', function () {
        preview.classList.remove('mx-visible');
      });
    }
  });

  // Secret dot — always last, pushed to the right
  var dot = document.createElement('a');
  dot.href = '/secretitems';
  dot.className = 'mx-secret-dot';
  dot.setAttribute('aria-label', 'Secret');
  nav.appendChild(dot);

  /* ── INJECT INTO PAGE ────────────────────────────────────── */
  function inject() {
    document.body.insertBefore(burger, document.body.firstChild);
    document.body.insertBefore(nav, burger.nextSibling);
    // Previews and dropdowns are direct body children to avoid overflow-x clipping
    previews.forEach(function (p) { document.body.appendChild(p); });
    dropdowns.forEach(function (d) { document.body.appendChild(d); });
    initBehavior();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

  /* ── BEHAVIOR ────────────────────────────────────────────── */
  function initBehavior() {
    var allLinks = nav.querySelectorAll('.mx-nav-btn, .mx-secret-dot');

    function a11y(open) {
      burger.setAttribute('aria-expanded', String(open));
      nav.setAttribute('aria-hidden', String(!open));
      allLinks.forEach(function (l) { l.tabIndex = open ? 0 : -1; });
    }

    function syncPos() {
      var r = burger.getBoundingClientRect();
      nav.style.top  = Math.max(8, Math.round(r.top)) + 'px';
      nav.style.left = (Math.round(r.right) + 8) + 'px';
      nav.style.right = '12px';
    }

    function open()   { syncPos(); burger.classList.add('active');    nav.classList.add('active');    a11y(true);  }
    function close()  { burger.classList.remove('active'); nav.classList.remove('active'); a11y(false); closeAllDropdowns(); }
    function toggle() { burger.classList.contains('active') ? close() : open(); }

    a11y(false);

    burger.addEventListener('click', toggle);
    burger.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });

    window.addEventListener('resize', function () {
      if (burger.classList.contains('active')) syncPos();
    });

    // Close on link click (including secret dot)
    nav.querySelectorAll('.mx-nav-btn, .mx-secret-dot').forEach(function (l) {
      l.addEventListener('click', close);
    });

    // Close nav + dropdowns on outside click
    document.addEventListener('click', function (e) {
      if (burger.contains(e.target) || nav.contains(e.target)) return;
      if (burger.classList.contains('active')) close();
      else closeAllDropdowns();
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }
}());
