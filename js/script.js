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

/* 🌌 Rotating Planet Next to Name - Fluorescent Pink Icon */
.rotating-planet {
    width: 50px; /* Increased size */
    height: auto;
    margin-right: 12px; /* Space between planet and name */
    
    /* Center with the text */
    display: inline-block;
    vertical-align: middle;
    
    /* Apply Fluorescent Pink Color Directly to the SVG */
    filter: brightness(0) saturate(100%) invert(17%) sepia(98%) saturate(5000%) 
            hue-rotate(315deg) brightness(130%) contrast(120%);
    
    /* Smooth Rotating Animation */
    animation: rotatePlanet 8s linear infinite;
}

/* 🌌 Rotation Keyframes */
@keyframes rotatePlanet {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

/* 🌌 Hover Effect - Slight Scale Up */
.rotating-planet:hover {
    transform: scale(1.15); /* Slightly bigger on hover */
    transition: transform 0.3s ease-in-out;
}








