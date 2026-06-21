import { initializeApp } from "https://gstatic.com";
import { getDatabase, ref, update, increment, onValue } from "https://gstatic.com";

// Your Firebase Configuration Object
const firebaseConfig = {
  apiKey: "AIzaSyAVE_B0QDpRrHEPfUOuVx2pwkPG65pkHEo",
  authDomain: "://firebaseapp.com",
  databaseURL: "https://firebaseio.com",
  projectId: "matix-the-math-club-views",
  storageBucket: "matix-the-math-club-views.firebasestorage.app",
  messagingSenderId: "392827461909",
  appId: "1:392827461909:web:55a6b36927b4d79ebb491c",
  measurementId: "G-9J2VZ3T6YG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export function trackView() {
  // Check browser cache
  const hasViewed = localStorage.getItem('has_viewed_matix');

  if (!hasViewed) {
    // Fire-and-forget server increment
    update(ref(database), {
      views: increment(1)
    }).then(() => {
      localStorage.setItem('has_viewed_matix', 'true');
      console.log("Unique view recorded!");
    }).catch((error) => {
      console.error("Error updating view count: ", error);
    });
  } else {
    console.log("Welcome back! Browser cache prevented duplicate view count.");
  }

  // Live listener to find your counter on the DOM
  onValue(ref(database, 'views'), (snapshot) => {
    const viewCounterElement = document.getElementById('view-counter');
    if (viewCounterElement) {
      viewCounterElement.innerText = snapshot.val() || 0;
    }
  });
}

// Auto-run the function on page load
trackView();

//<!--waits for scroll of 20 vh to make all the stuff disappear to the top animatedley to show stats-->
function onScroll(threshold, callback) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > window.innerHeight * threshold) {
      callback();
    }
  });
}



let statsShown = false;
let currentViews = firebase.database().ref('views');
/* shows  text:
stats 📊:
views 👀: [views]
lessons 📚: [lessons]
current players on math fight multiplayer 🎮: [currentPlayers]*/
onScroll(0.2, () => {
  if (!statsShown) {
    const statsElement = document.createElement('div');
    statsElement.className = 'stats';
    statsElement.innerHTML = `
      <h2>stats 📊:</h2>
      <p>views 👀: <span id="view-counter">0</span></p>
      <p>lessons 📚: <span id="lesson-counter">0</span></p>
      <p>current players on math fight multiplayer 🎮: <span id="player-counter">0</span></p>`;
    document.body.appendChild(statsElement);

    // Listen for real-time updates to views
    currentViews.on('value', (snapshot) => {
      const viewCounterElement = document.getElementById('view-counter');
      if (viewCounterElement) {
        viewCounterElement.innerText = snapshot.val() || 0;
      }
    });

    statsShown = true;
  }
});