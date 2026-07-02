import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, update, increment, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// 1. Your Main Stats / Views Config
const mainFirebaseConfig = {
  apiKey: "AIzaSyAVE_B0QDpRrHEPfUOuVx2pwkPG65pkHEo",
  authDomain: "matix-the-math-club-views.firebaseapp.com",
  databaseURL: "https://matix-the-math-club-views-default-rtdb.firebaseio.com", 
  projectId: "matix-the-math-club-views",
  storageBucket: "matix-the-math-club-views.firebasestorage.app",
  messagingSenderId: "392827461909",
  appId: "1:392827461909:web:55a6b36927b4d79ebb491c",
  measurementId: "G-9J2VZ3T6YG"
};

// 2. Your Lessons Vault Config
const lessonsFirebaseConfig = {
  apiKey: "AIzaSyBmJOS_aaOVADbu5cACUoeXHrjfpHTBTdo",
  authDomain: "matix-1d538.firebaseapp.com",
  databaseURL: "https://matix-1d538-default-rtdb.firebaseio.com",
  projectId: "matix-1d538",
  storageBucket: "matix-1d538.firebasestorage.app"
};

// Initialize both apps safely
const mainApp = initializeApp(mainFirebaseConfig);
const mainDatabase = getDatabase(mainApp);

const lessonsApp = initializeApp(lessonsFirebaseConfig, "lessonsApp");
const lessonsDatabase = getDatabase(lessonsApp);

export function trackView() {
  const hasViewed = localStorage.getItem('has_viewed_matix');
  if (!hasViewed) {
    update(ref(mainDatabase), { views: increment(1) })
      .then(() => localStorage.setItem('has_viewed_matix', 'true'))
      .catch((err) => console.error("Error tracking view: ", err));
  }
}

function listenToStats() {
  onValue(ref(mainDatabase, 'views'), (snapshot) => {
    const el = document.getElementById('view-counter');
    if (el) el.innerText = snapshot.val() || 0;
  });

  onValue(ref(mainDatabase, 'currentPlayers'), (snapshot) => {
    const el = document.getElementById('current-players-counter');
    if (el) el.innerText = snapshot.val() || 0;
  });

  onValue(ref(lessonsDatabase, 'lessons'), (snapshot) => {
    const el = document.getElementById('lessons-counter');
    if (el) {
      const data = snapshot.val();
      if (data && typeof data === 'object') {
        el.innerText = Object.keys(data).length;
      } else {
        el.innerText = 0;
      }
    }
  });

  onValue(ref(mainDatabase, 'ideacount'), (snapshot) => {
    const el = document.getElementById('ideas-counter');
    if (el) el.innerText = snapshot.val() || 0;
  });
}

// ── DIRECTIONAL SMOOTH GLIDE ENGINE ───────────────────────
function initTeleportScroll() {
  let scrollTimeout;
  let isTeleporting = false;
  let lastScrollY = window.scrollY;

  function autoTeleport() {
    if (isTeleporting) return;
    
    const sections = document.querySelectorAll('.screen-section');
    if (!sections.length) return;

    const currentScroll = window.scrollY;
    const slideHeight = window.innerHeight;
    
    // Calculate how far the user actually moved during their hold
    const scrollDelta = currentScroll - lastScrollY;
    
    // If they barely moved (less than 15px), don't do anything
    if (Math.abs(scrollDelta) < 15) {
      return;
    }

    isTeleporting = true;
    const currentSlideIndex = Math.floor(currentScroll / slideHeight);
    let targetSlideIndex = currentSlideIndex;

    // Determine direction based on their movement trail
    if (scrollDelta > 0) {
      // Scrolled DOWN -> Glide to next section
      targetSlideIndex = Math.min(currentSlideIndex + 1, sections.length - 1);
    } else {
      // Scrolled UP -> Glide to previous section
      targetSlideIndex = Math.max(currentSlideIndex, 0);
    }

    const targetY = targetSlideIndex * slideHeight;
    
    window.scrollTo({
      top: targetY,
      behavior: 'smooth' // Smoothly slides into place instead of a hard cut!
    });

    // Update coordinates tracker
    lastScrollY = targetY;

    // Cooldown matches the duration of the browser's smooth scroll animation
    setTimeout(() => {
      isTeleporting = false;
    }, 700); 
  }

  window.addEventListener('scroll', () => {
    if (isTeleporting) {
      // Keep updating baseline while the animation glides to prevent scroll fight back
      lastScrollY = window.scrollY;
      return;
    }

    clearTimeout(scrollTimeout);

    // Fires the millisecond you stop holding/rolling
    scrollTimeout = setTimeout(() => {
      autoTeleport();
    }, 0); 
  }, { passive: true });
}

// ── HAMBURGER MENU (TOP BAR DRAWER) ────────────────────────
function initMenu() {
  const menuContainer = document.querySelector('.menu-container');
  const navMenu = document.querySelector('.nav-menu');
  if (!menuContainer || !navMenu) return;

  const navLinks = Array.from(navMenu.querySelectorAll('.nav-btn, .secret-dot'));

  function setMenuA11yState(isOpen) {
    menuContainer.setAttribute('aria-expanded', String(isOpen));
    navMenu.setAttribute('aria-hidden', String(!isOpen));
    navLinks.forEach((link) => {
      link.tabIndex = isOpen ? 0 : -1;
    });
  }

  function syncTopBarPosition() {
    const triggerRect = menuContainer.getBoundingClientRect();
    const top = Math.max(8, Math.round(triggerRect.top));
    const left = Math.round(triggerRect.right + 8);

    navMenu.style.top = `${top}px`;
    navMenu.style.left = `${left}px`;
    navMenu.style.right = '12px';
  }

  function openMenu() {
    syncTopBarPosition();
    menuContainer.classList.add('active');
    navMenu.classList.add('active');
    setMenuA11yState(true);
  }

  function toggleMenu() {
    const isOpen = menuContainer.classList.contains('active');
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  function closeMenu() {
    menuContainer.classList.remove('active');
    navMenu.classList.remove('active');
    setMenuA11yState(false);
  }

  setMenuA11yState(false);

  menuContainer.addEventListener('click', toggleMenu);

  // Keyboard support since the hamburger is a <div role="button">
  menuContainer.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleMenu();
    }
  });

  // Keep the drawer anchored to the menu button if viewport changes.
  window.addEventListener('resize', () => {
    if (menuContainer.classList.contains('active')) {
      syncTopBarPosition();
    }
  });

  // Tapping a link closes the drawer before navigating away.
  navMenu.querySelectorAll('.nav-btn, .secret-dot').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  // Clicking outside closes the top bar drawer.
  document.addEventListener('click', (e) => {
    if (!menuContainer.classList.contains('active')) return;
    if (menuContainer.contains(e.target) || navMenu.contains(e.target)) return;
    closeMenu();
  });

  // Escape closes it too.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

// ── SCROLL BUTTON: flips between ⬇ and ⬆ depending on the slide ──
function initScrollButton() {
  const scrollBtn = document.getElementById('scroll-btn');
  const arrowEl = document.getElementById('scroll-arrow');
  const textEl = document.getElementById('scroll-text');
  const sections = document.querySelectorAll('.screen-section');
  if (!scrollBtn || !arrowEl || !textEl || !sections.length) return;

  function currentSlideIndex() {
    const slideHeight = window.innerHeight;
    return Math.round(window.scrollY / slideHeight);
  }

  function isOnLastSlide() {
    return currentSlideIndex() >= sections.length - 1;
  }

  function updateHint() {
    if (isOnLastSlide()) {
      arrowEl.textContent = '⬆';
      textEl.textContent = 'scroll up for home';
    } else {
      arrowEl.textContent = '⬇';
      textEl.textContent = 'scroll down for live stats';
    }
  }

  scrollBtn.addEventListener('click', () => {
    const slideHeight = window.innerHeight;
    const targetIndex = isOnLastSlide() ? 0 : Math.min(currentSlideIndex() + 1, sections.length - 1);
    window.scrollTo({ top: targetIndex * slideHeight, behavior: 'smooth' });
  });

  window.addEventListener('scroll', updateHint, { passive: true });
  window.addEventListener('resize', updateHint);
  updateHint();
}

// Wrap initialization to run safely after DOM loads
document.addEventListener('DOMContentLoaded', () => {
  trackView();
  listenToStats();
  initTeleportScroll();
  // initMenu is handled by nav.js (injected globally)
  initScrollButton();
});