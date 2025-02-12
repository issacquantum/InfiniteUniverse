document.addEventListener("DOMContentLoaded", function () {
    console.log("JavaScript Loaded");

    const musicButtonTop = document.getElementById("musicNavButton");
    const songNameTop = document.getElementById("songNameTop");

    // 🎵 Correct Order of Rachmaninoff Pieces
    const songs = [
    { file: "https://infinite-universe.vercel.app/assets/Sitemusic/Prelude in C-sharp minor, Op. 3, No. 2.mp3", title: "Prelude in C-sharp minor, Op. 3, No. 2" },
    { file: "https://infinite-universe.vercel.app/assets/Sitemusic/Moment Musical No. 4 in D Major, Op. 16.mp3", title: "Moment Musical No. 4 in D Major, Op. 16" },
    { file: "https://infinite-universe.vercel.app/assets/Sitemusic/Élégie in E-flat minor, Op. 3 No. 1.mp3", title: "Élégie in E-flat minor, Op. 3 No. 1" },
    { file: "https://infinite-universe.vercel.app/assets/Sitemusic/Rhapsody on a Theme of Paganini, Op. 43.mp3", title: "Rhapsody on a Theme of Paganini, Op. 43" }
];

    let currentSongIndex = 0;
    let audio = new Audio(songs[currentSongIndex].file);
    let isPlaying = false;

    // 🔥 Function to Update the Song Name Display
    function updateSongName() {
        console.log("Updating song name:", songs[currentSongIndex].title);
        songNameTop.textContent = songs[currentSongIndex].title;

        // Apply glow effect
        songNameTop.classList.add("glow");
        songNameTop.style.opacity = "1";
    }

    // 🔥 Function to Play/Pause Music
    function toggleMusic() {
        console.log("Play/Pause button clicked!");

        if (isPlaying) {
            audio.pause();
            isPlaying = false;
            musicButtonTop.src = "assets/play-icon.svg";
            songNameTop.style.opacity = "0"; // Hide the song name when paused
            songNameTop.classList.remove("glow");
        } else {
            if (audio.src !== songs[currentSongIndex].file) {
                audio.src = songs[currentSongIndex].file;
            }
            audio.play();
            isPlaying = true;
            musicButtonTop.src = "assets/pause-icon.svg";
            updateSongName();
        }
    }

    // 🔥 Function to Play Next Song & Show Name (IN ORDER, NO RANDOMIZATION)
    function playNextSong() {
        console.log("Next song clicked!");
        currentSongIndex = (currentSongIndex + 1) % songs.length;
        audio.src = songs[currentSongIndex].file;
        audio.load();
        audio.play();
        isPlaying = true;
        musicButtonTop.src = "assets/pause-icon.svg";
        updateSongName();
    }

    // 🔥 Play Next Song Automatically When Current Song Ends
    audio.addEventListener("ended", playNextSong);

    // 🎵 Attach Event Listener for Play/Pause Button
    musicButtonTop.addEventListener("click", toggleMusic);
    musicButtonTop.addEventListener("touchstart", toggleMusic);  // Add touch support for mobile devices
});
document.addEventListener("DOMContentLoaded", function () {
    const musicButtonTop = document.getElementById("musicNavButton");

    // Function to ensure the play button size and position are optimized based on mobile orientation
    function adjustButtonPosition() {
        if (window.innerWidth <= 768) { // Check for smaller screens
            // Ensure the button stays at the bottom and isn't overlapped
            musicButtonTop.style.bottom = "20px";
            musicButtonTop.style.right = "20px";
        } else {
            // Reset to original position for larger screens (optional, based on design)
            musicButtonTop.style.bottom = "50px";
            musicButtonTop.style.right = "50px";
        }
    }

    // Adjust button position when the window is resized (for changing orientations)
    window.addEventListener('resize', adjustButtonPosition);

    // Call the function initially to ensure the button is correctly placed on page load
    adjustButtonPosition();
});

