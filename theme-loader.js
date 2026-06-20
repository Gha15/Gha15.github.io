// MATIX Global Theme Loader
// This script loads and applies custom user themes across all pages

(function() {
    function applyCachedTheme() {
        const cachedTheme = localStorage.getItem('matix_theme_hue');
        const hasChangedColor = localStorage.getItem('haschangedcolor');

        if (cachedTheme && hasChangedColor === 'true') {
            document.documentElement.style.filter = `hue-rotate(${cachedTheme}deg)`;
            return true;
        }

        document.documentElement.style.filter = '';
        return false;
    }

    // Check localStorage first for cached theme (only if user has changed color)
    applyCachedTheme();
    
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
            const cachedTheme = localStorage.getItem('matix_theme_hue');
            const hasChangedColor = localStorage.getItem('haschangedcolor');

            // Local theme wins if the user actively changed it; profile fills in otherwise.
            if (cachedTheme && hasChangedColor === 'true') {
                applyCachedTheme();
            } else if (profile.customTheme) {
                document.documentElement.style.filter = `hue-rotate(${profile.customTheme}deg)`;
                // Also save to localStorage for consistency
                localStorage.setItem('matix_theme_hue', profile.customTheme);
                localStorage.setItem('haschangedcolor', 'true');
            } else {
                localStorage.removeItem('matix_theme_hue');
                localStorage.removeItem('haschangedcolor');
                applyCachedTheme();
            }
        });
    }
})();
