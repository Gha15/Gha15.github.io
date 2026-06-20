// MATIX Global Theme Loader
// This script loads and applies custom user themes across all pages

(function() {
    // Firebase config
    const firebaseConfig = {
        apiKey: "AIzaSyBmJOS_aaOVADbu5cACUoeXHrjfpHTBTdo",
        authDomain: "matix-1d538.firebaseapp.com",
        databaseURL: "https://matix-1d538-default-rtdb.firebaseio.com",
        projectId: "matix-1d538",
        storageBucket: "matix-1d538.firebasestorage.app"
    };

    // Check if Firebase is already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    const db = firebase.database();
    
    // Get current user from session
    const currentUser = sessionStorage.getItem("matix_auth_user");
    
    if (currentUser) {
        // Listen to user's profile for custom theme
        db.ref('profiles/' + currentUser).on('value', (snapshot) => {
            const profile = snapshot.val() || {};
            if (profile.customTheme) {
                document.documentElement.style.filter = `hue-rotate(${profile.customTheme}deg)`;
            } else {
                // Reset to default if no theme
                document.documentElement.style.filter = '';
            }
        });
    }
})();
