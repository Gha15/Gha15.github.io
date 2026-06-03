document.addEventListener('DOMContentLoaded', () => {
    const sound = document.getElementById('click-sound');

    // Attach click listener to all buttons
    document.querySelectorAll('[class^="button-"]').forEach(btn => {
        btn.addEventListener('mousedown', () => {
            sound.currentTime = 0; // Rewind to start
            sound.play();          // Play sound
        });
    });
});