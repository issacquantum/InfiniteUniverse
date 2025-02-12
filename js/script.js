// 🎵 Music Player Configuration
const songs = [
    "assets/Sitemusic/Prelude in C-sharp minor, Op. 3, No. 2.mp3",
    "assets/Sitemusic/Moment Musical No. 4 in D Major, Op. 16.mp3",
    "assets/Sitemusic/Élégie in E-flat minor, Op. 3 No. 1.mp3",
    "assets/Sitemusic/Rhapsody on a Theme of Paganini, Op. 43.mp3"
];

const songNames = [
    "Prelude in C-sharp minor, Op. 3, No. 2",
    "Moment Musical No. 4 in D Major, Op. 16",
    "Élégie in E-flat minor, Op. 3 No. 1",
    "Rhapsody on a Theme of Paganini, Op. 43"
];

let currentSongIndex = 0;
let audio = new Audio(songs[currentSongIndex]); // Load the first song
const playPauseButton = document.getElementById("playPauseButton");
const songNameDisplay = document.getElementById("song-name");

// 🎛 Toggle Play/Pause Button
playPauseButton.addEventListener("click", function () {
    if (audio.paused) {
        audio.play();
        playPauseButton.src = "assets/pause-icon.svg"; // Switch to pause icon
        songNameDisplay.classList.add("glow"); // Apply glowing effect to song name
    } else {
        audio.pause();
        playPauseButton.src = "assets/play-icon.svg"; // Switch to play icon
        songNameDisplay.classList.remove("glow"); // Remove glowing effect
    }
});

// 🎵 Automatically Play Next Song When Current Song Ends
audio.addEventListener("ended", function () {
    currentSongIndex = (currentSongIndex + 1) % songs.length; // Move to next song
    audio.src = songs[currentSongIndex]; // Load next song
    songNameDisplay.textContent = songNames[currentSongIndex]; // Update song name
    audio.play(); // Auto-play next song
});

// 🎛 Ensure Volume is at 100%
audio.volume = 1.0;

// 📌 Open PDF in Fullscreen Mode (Computer Only)
document.getElementById("cvIcon").addEventListener("click", function () {
    let overlay = document.getElementById("cvOverlay");
    let frame = document.getElementById("cvFrame");

    overlay.classList.add("show"); // Show overlay
    frame.src = "assets/ProfessionalResume.pdf"; // Reload PDF to ensure full load
    frame.style.height = "100vh"; // Ensure full height

    setTimeout(() => {
        frame.focus(); // Ensure PDF interaction
    }, 500);
});

// 📌 Close PDF Overlay When Clicking Outside
document.getElementById("cvOverlay").addEventListener("click", function (event) {
    if (event.target === this) {
        this.classList.remove("show");
    }
});

// Static Glowing Particles for the Entire Site
const numParticles = 150; // Increased number of particles for more intensity

// Function to create and add particles to the page
function createParticles() {
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Randomly set the size and position of each particle
        const size = Math.random() * 5 + 3; // Smaller particle size range (from 3px to 8px)
        const xPosition = Math.random() * 100 + "%"; // Random x position
        const yPosition = Math.random() * 100 + "%"; // Random y position
        const delay = Math.random() * 10 + "s"; // Random delay for fade in/out

        // Set the CSS properties of the particle
        particle.style.width = size + "px";
        particle.style.height = size + "px";
        particle.style.left = xPosition;
        particle.style.top = yPosition;
        particle.style.animationDelay = delay;

        // Append the particle to the body (make sure it's across the entire site)
        document.body.appendChild(particle);
    }
}

// Call the function to create the particles
createParticles();
