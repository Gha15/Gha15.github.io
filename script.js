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

// 2. Your Lessons Vault Config (From your lessons page)
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

const lessonsApp = initializeApp(lessonsFirebaseConfig, "lessonsApp"); // Named instance avoids conflicts
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
  // Pulls views from Main DB
  onValue(ref(mainDatabase, 'views'), (snapshot) => {
    const el = document.getElementById('view-counter');
    if (el) el.innerText = snapshot.val() || 0;
  });

  // Pulls active players from Main DB
  onValue(ref(mainDatabase, 'currentPlayers'), (snapshot) => {
    const el = document.getElementById('current-players-counter');
    if (el) el.innerText = snapshot.val() || 0;
  });

  // SUCCESS: Now targets the accurate Lessons DB node!
  onValue(ref(lessonsDatabase, 'lessons'), (snapshot) => {
    const el = document.getElementById('lessons-counter');
    if (el) {
      const data = snapshot.val();
      if (data && typeof data === 'object') {
        el.innerText = Object.keys(data).length; // Will output 4
      } else {
        el.innerText = 0;
      }
    }
  });
}

// Fire data tracking and listeners immediately on launch
trackView();
listenToStats();