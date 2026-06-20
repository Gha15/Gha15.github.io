// MATIX Global Theme Loader
// This script loads and applies custom user themes across all pages

(function() {
    // Check localStorage first for cached theme (only if user has changed color)
    const hasChangedColor = localStorage.getItem('haschangedcolor');
    const cachedTheme = localStorage.getItem('matix_theme_hue');
    
    if (cachedTheme && hasChangedColor === 'true') {
        document.documentElement.style.filter = `hue-rotate(${cachedTheme}deg)`;
    }
    
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
        // Listen to user's profile for custom theme (redeemed rewards)
        db.ref('profiles/' + currentUser).on('value', (snapshot) => {
            const profile = snapshot.val() || {};
            // Firebase theme (from redemption) overrides localStorage if present
            if (profile.customTheme) {
                document.documentElement.style.filter = `hue-rotate(${profile.customTheme}deg)`;
                // Also save to localStorage for consistency
                localStorage.setItem('matix_theme_hue', profile.customTheme);
                localStorage.setItem('haschangedcolor', 'true');
            } else if (!cachedTheme || hasChangedColor !== 'true') {
                // Reset to default if no theme and no valid cache
                document.documentElement.style.filter = '';
            }
        });
    }
})();
