// 🎵 Music Player Configuration (Updated Paths)
const songs = [
    "assets/Prelude_Csharp_Op3_No2.mp3",
    "assets/Moment_Musical_No4_Op16.mp3",
    "assets/Elegie_Op3_No1.mp3",
    "assets/Rhapsody_Paganini_Op43.mp3"
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

// 📝 Ensure song name is displayed at start
songNameDisplay.textContent = songNames[currentSongIndex];

// 🎛 Play/Pause Button Toggle
playPauseButton.addEventListener("click", function () {
    if (audio.paused) {
        audio.play();
        playPauseButton.src = "assets/pause-icon.svg"; // Switch to pause icon
        songNameDisplay.classList.add("glow");
    } else {
        audio.pause();
        playPauseButton.src = "assets/play-icon.svg"; // Switch to play icon
        songNameDisplay.classList.remove("glow");
    }
});

// 🎵 Auto Play Next Song When Current One Ends
audio.addEventListener("ended", function () {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    audio.src = songs[currentSongIndex];
    songNameDisplay.textContent = songNames[currentSongIndex];

    audio.load(); // 🔄 Reload audio to apply new source
    audio.play();
});

// 🔊 Ensure Volume is 100%
audio.volume = 1.0;
