import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, update, increment, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAVE_B0QDpRrHEPfUOuVx2pwkPG65pkHEo",
  authDomain: "matix-the-math-club-views.firebaseapp.com",
  databaseURL: "https://matix-the-math-club-views-default-rtdb.firebaseio.com", 
  projectId: "matix-the-math-club-views",
  storageBucket: "matix-the-math-club-views.firebasestorage.app",
  messagingSenderId: "392827461909",
  appId: "1:392827461909:web:55a6b36927b4d79ebb491c",
  measurementId: "G-9J2VZ3T6YG"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export function trackView() {
  const hasViewed = localStorage.getItem('has_viewed_matix');
  if (!hasViewed) {
    update(ref(database), { views: increment(1) })
      .then(() => localStorage.setItem('has_viewed_matix', 'true'))
      .catch((err) => console.error("Error tracking view: ", err));
  }
}

function listenToStats() {
  // 1. Listen to Views
  onValue(ref(database, 'views'), (snapshot) => {
    const el = document.getElementById('view-counter');
    if (el) el.innerText = snapshot.val() || 0;
  });

  // 2. FIXED: Count items inside the lessons object node
  onValue(ref(database, 'lessons'), (snapshot) => {
    const el = document.getElementById('lessons-counter');
    if (el) {
      const data = snapshot.val();
      if (data && typeof data === 'object') {
        // Count how many keys (individual lessons) exist inside the node
        el.innerText = Object.keys(data).length;
      } else if (typeof data === 'number') {
        // Fallback fallback case if it's stored as a simple integer
        el.innerText = data;
      } else {
        el.innerText = 0;
      }
    }
  });

  // 3. Listen to Active Players
  onValue(ref(database, 'currentPlayers'), (snapshot) => {
    const el = document.getElementById('current-players-counter');
    if (el) el.innerText = snapshot.val() || 0;
  });
}

// Fire data tracking and listeners immediately on launch
trackView();
listenToStats();