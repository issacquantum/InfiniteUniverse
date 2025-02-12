document.addEventListener("DOMContentLoaded", function () {
    console.log("JavaScript Loaded");

    const musicButtonTop = document.getElementById("musicNavButton");
    const songNameTop = document.getElementById("songNameTop");

    // 🎵 Correct Order of Rachmaninoff Pieces
    const songs = [
    { file: "https://docs.google.com/uc?export=download&id=1VtOazM0bmq1bvIQKC-kF1jGqCXNlLx-S", title: "Prelude in C-sharp minor, Op. 3, No. 2" },
    { file: "https://docs.google.com/uc?export=download&id=1xEL6qU1GyuMLbLBeHDBUm3FtEXewxIcB", title: "Moment Musical No. 4 in D Major, Op. 16" },
    { file: "https://docs.google.com/uc?export=download&id=1tOZ1nqviwTmQmygFilV2NYnfdxT_k3NK", title: "Élégie in E-flat minor, Op. 3 No. 1" },
    { file: "https://docs.google.com/uc?export=download&id=1-kUGxhHipBrEsy5t73nnOzvaD3aKcVUK", title: "Rhapsody on a Theme of Paganini, Op. 43" }
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
});
