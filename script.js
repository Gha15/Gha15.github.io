
  import { initializeApp } from "https://gstatic.com";
  import { getDatabase, ref, runTransaction, onValue } from "https://gstatic.com";

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

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const database = getDatabase(app);

  // Reference to the 'views' path in your database
  const viewsRef = ref(database, 'views');

  // Function to handle the view tracking logic
  function trackView() {
    // Check if the user has already viewed the site using localStorage cache
    const hasViewed = localStorage.getItem('has_viewed_matix');

    if (!hasViewed) {
      // User is new: Increment the view count by 1 atomically
      runTransaction(viewsRef, (currentValue) => {
        return (currentValue || 0) + 1;
      }).then(() => {
        // Save to browser cache so they don't trigger it again on refresh
        localStorage.setItem('has_viewed_matix', 'true');
        console.log("New view recorded successfully!");
      }).catch((error) => {
        console.error("Transaction failed: ", error);
      });
    } else {
      console.log("Returning visitor. View count not incremented.");
    }

    // Optional: Real-time listener to display the view count on your webpage
    onValue(viewsRef, (snapshot) => {
      const totalViews = snapshot.val() || 0;
      const viewCounterElement = document.getElementById('view-counter');
      if (viewCounterElement) {
        viewCounterElement.innerText = totalViews;
      }
    });
  }

  // Execute tracking when the script loads
  trackView();

