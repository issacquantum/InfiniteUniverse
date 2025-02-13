// 🎵 Music Player Configuration (Updated Filenames)
const songs = [
    "assets/Sitemusic/Prelude_Csharp_Op3_No2.mp3",
    "assets/Sitemusic/Moment_Musical_No4_Op16.mp3",
    "assets/Sitemusic/Elegie_Op3_No1.mp3",
    "assets/Sitemusic/Rhapsody_Paganini_Op43.mp3"
];

const songNames = [
    "Prelude in C-sharp minor, Op. 3, No. 2",
    "Moment Musical No. 4 in D Major, Op. 16",
    "Élégie in E-flat minor, Op. 3 No. 1",
    "Rhapsody on a Theme of Paganini, Op. 43"
];

let currentSongIndex = 0;
let audio = new Audio(songs[currentSongIndex]);
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
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    audio.src = songs[currentSongIndex];
    songNameDisplay.textContent = songNames[currentSongIndex];
    audio.play();
});

// 🎛 Ensure Volume is at 100%
audio.volume = 1.0;


// 🌌 Generate Glowing Particles Across the Entire Site
document.addEventListener("DOMContentLoaded", function () {
    const particleContainer = document.getElementById("particles-container");

    if (!particleContainer) {
        console.error("❌ `particles-container` not found in the HTML.");
        return;
    }

    for (let i = 0; i < 80; i++) { // Adjust particle count
        let particle = document.createElement("div");
        particle.classList.add("particle");

        // Randomize position
        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.top = `${Math.random() * 100}vh`;
        particle.style.width = `${Math.random() * 8 + 4}px`;  // Random size (4px - 12px)
        particle.style.height = particle.style.width;

        // Append to container
        particleContainer.appendChild(particle);
    }
});
