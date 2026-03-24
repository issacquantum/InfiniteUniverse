//  Music Player Configuration (Updated Filenames)
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

//  Toggles Play/Pause Button
playPauseButton.addEventListener("click", function () {

    if (audio.paused) {
        audio.play().then(() => {
            playPauseButton.src = "assets/pause-icon.svg";
            songNameDisplay.classList.add("glow");
        }).catch(error => {
            console.error("Playback failed:", error);
        });

    } else {
        audio.pause();
        playPauseButton.src = "assets/play-icon.svg";
        songNameDisplay.classList.remove("glow");
    }
});

//  Automatically Plays Next Song When Current Song Ends
audio.addEventListener("ended", function () {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    audio.src = songs[currentSongIndex];
    songNameDisplay.textContent = songNames[currentSongIndex];
    audio.play();
});

// Ensures Volume is at 100%
audio.volume = 1.0;


// Generates Glowing Particles Across the Entire Site
document.addEventListener("DOMContentLoaded", function () {
    const particleContainer = document.getElementById("particles-container");

    if (!particleContainer) {
        console.error("❌ `particles-container` not found in the HTML.");
        return;
    }

    for (let i = 0; i < 80; i++) { // Adjusts particle count
        let particle = document.createElement("div");
        particle.classList.add("particle");

        // Randomize position
        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.top = `${Math.random() * 100}vh`;
        particle.style.width = `${Math.random() * 4 + 2}px`;  // Random size (8px - 15px)
        particle.style.height = particle.style.width;

        // Append to container
        particleContainer.appendChild(particle);
    }
});

// Dedicated Rachmaninoff-only player (loops Op. 43)
(function () {
    // Used the same file path I already have in my playlist
    const RACH_SRC = "assets/Sitemusic/Rhapsody_Paganini_Op43.mp3";
    const RACH_NAME = "Rhapsody on a Theme of Paganini, Op. 43 (Variation 18)";

    const rachBtn = document.getElementById("rachPlayPauseButton");
    const rachLabel = document.getElementById("rach-song-name");

    // Guard: if the block isn't on this page, do nothing
    if (!rachBtn || !rachLabel) return;

    const rachAudio = new Audio(RACH_SRC);
    rachAudio.loop = true;       // loops only this track
    rachAudio.volume = 1.0;

    function setRachPlayingUI(isPlaying) {
        if (!rachBtn || !rachLabel) return;
        rachBtn.src = isPlaying ? "assets/pause-icon.svg" : "assets/play-icon.svg";
        rachLabel.textContent = RACH_NAME;
        // reuse  existing glow class used on #song-name
        if (isPlaying) {
            rachLabel.classList.add("glow");
        } else {
            rachLabel.classList.remove("glow");
        }
    }

    rachBtn.addEventListener("click", function () {
        // Pauses the main site player if it's running (don’t touch its logic)
        try {
            if (typeof audio !== "undefined" && audio && !audio.paused) {
                audio.pause();
                if (typeof playPauseButton !== "undefined" && playPauseButton) {
                    playPauseButton.src = "assets/play-icon.svg";
                }
                if (typeof songNameDisplay !== "undefined" && songNameDisplay) {
                    songNameDisplay.classList.remove("glow");
                }
            }
        } catch (e) { }

        if (rachAudio.paused) {
            rachAudio.play().then(() => setRachPlayingUI(true)).catch(err => {
                console.error("Rach playback failed:", err);
            });
        } else {
            rachAudio.pause();
            setRachPlayingUI(false);
        }
    });

    // Keeps UI consistent if playback ends (loop=true, but just in case)
    rachAudio.addEventListener("ended", function () {
        // with loop=true this won’t fire, but leaves a safe fallback
        setRachPlayingUI(false);
    });

    // Initializes label
    rachLabel.textContent = RACH_NAME;
})();
