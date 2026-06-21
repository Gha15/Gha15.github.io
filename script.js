// Your Firebase Configuration Object
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

// Initialize Firebase (compat SDK loaded via <script> tags in index.html exposes the global `firebase`)
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Keep the latest value so we can render it whenever the counter element appears in the DOM
let latestViews = 0;

function renderViewCounter() {
  const viewCounterElement = document.getElementById('view-counter');
  if (viewCounterElement) {
    viewCounterElement.innerText = latestViews;
  }
}

function trackView() {
  // Check browser cache so a single browser only counts once
  const hasViewed = localStorage.getItem('has_viewed_matix');

  if (!hasViewed) {
    // Atomic server-side increment
    database.ref('views').set(firebase.database.ServerValue.increment(1))
      .then(() => {
        localStorage.setItem('has_viewed_matix', 'true');
        console.log("[v0] Unique view recorded!");
      })
      .catch((error) => {
        console.error("[v0] Error updating view count: ", error);
      });
  } else {
    console.log("[v0] Welcome back! Browser cache prevented duplicate view count.");
  }

  // Live listener: store the value and render it if the counter is already on the page
  database.ref('views').on('value', (snapshot) => {
    latestViews = snapshot.val() || 0;
    renderViewCounter();
  });
}

// Auto-run on page load
trackView();

// Waits for a scroll of 20vh to reveal the stats panel
function onScroll(threshold, callback) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > window.innerHeight * threshold) {
      callback();
    }
  });
}

let statsShown = false;
/* shows text:
stats 📊:
views 👀: [views]
lessons 📚: [lessons]
current players on math fight multiplayer 🎮: [currentPlayers]*/
onScroll(0.2, () => {
  if (!statsShown) {
    statsShown = true;

    const statsElement = document.createElement('div');
    statsElement.className = 'stats';
    statsElement.innerHTML = `
      <h2>stats 📊:</h2>
      <p>views 👀: <span id="view-counter">0</span></p>
      <p>lessons 📚: <span id="lesson-counter">0</span></p>
      <p>current players on math fight multiplayer 🎮: <span id="player-counter">0</span></p>`;
    document.body.appendChild(statsElement);

    // Render the most recent value now that the counter element exists
    renderViewCounter();
  }
});
