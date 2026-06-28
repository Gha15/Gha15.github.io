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

// Wrap initialization to run safely after DOM loads
document.addEventListener('DOMContentLoaded', () => {
  trackView();
  listenToStats();
  initTeleportScroll();
});