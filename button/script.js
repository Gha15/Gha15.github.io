const firebaseConfig = {
    apiKey: "AIzaSyAYvc019SSz8ouPAMw5dROe68E3QupBCmg",
    authDomain: "matixthemathclubbuttons.firebaseapp.com",
    databaseURL: "https://matixthemathclubbuttons-default-rtdb.firebaseio.com",
    projectId: "matixthemathclubbuttons",
    storageBucket: "matixthemathclubbuttons.firebasestorage.app",
    messagingSenderId: "47705433057",
    appId: "1:47705433057:web:c59549db6f6c7f9477e8a0",
    measurementId: "G-BYZ6ELCKTG"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

document.addEventListener('DOMContentLoaded', () => {
    const clickSound = document.getElementById('click-sound');
    const buttonSizes = ['xs', 's', 'm', 'l', 'xl'];

    buttonSizes.forEach(size => {
        const button = document.querySelector(`.button-${size}`);
        const counterDisplay = document.getElementById(`counter-${size}`);
        const dbRef = database.ref('clicks/' + size);

        // Real-time listener for global count updates
        dbRef.on('value', (snapshot) => {
            const count = snapshot.val() || 0;
            counterDisplay.textContent = `Global Clicks: ${count}`;
        });

        // Click handler
        if (button) {
            button.addEventListener('mousedown', () => {
                if (clickSound) {
                    clickSound.currentTime = 0;
                    clickSound.play().catch(e => console.log("Audio requires interaction"));
                }

                // Increment in cloud
                dbRef.transaction((currentCount) => {
                    return (currentCount || 0) + 1;
                });
            });
        }
    });
});