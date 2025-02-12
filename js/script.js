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
const audio = new Audio(songs[currentSongIndex]); // Load the first song
const playPauseButton = document.getElementById("playPauseButton");
const songNameDisplay = document.getElementById("song-name");

console.log('Audio created:', audio);

// 🎛 Toggle Play/Pause Button
playPauseButton.addEventListener("click", function () {
    console.log('Play/Pause clicked');
    if (audio.paused) {
        audio.play().then(() => {
            console.log('Audio started');
        }).catch(err => {
            console.error('Error playing audio:', err);
        });
        playPauseButton.src = "assets/pause-icon.svg"; // Switch to pause icon
        songNameDisplay.classList.add("glow"); // Apply glowing effect to song name
    } else {
        audio.pause(); // Pause the song when clicked
        playPauseButton.src = "assets/play-icon.svg"; // Switch to play icon
        songNameDisplay.classList.remove("glow"); // Remove glowing effect
    }
});

// 🎵 Automatically Play Next Song When Current Song Ends
audio.addEventListener("ended", function () {
    console.log('Song ended, moving to next');
    currentSongIndex = (currentSongIndex + 1) % songs.length; // Move to next song
    audio.src = songs[currentSongIndex]; // Update the source of audio to the next song
    songNameDisplay.textContent = songNames[currentSongIndex]; // Update the song name display
    
    // Create a new audio element to play the next song
    const newAudio = new Audio(songs[currentSongIndex]);  // Create new audio object
    newAudio.volume = 1.0; // Ensure the volume is set
    newAudio.play()  // Play the next song
        .then(() => {
            console.log('Next song started');
        })
        .catch(err => {
            console.error('Error playing next song:', err);
        });
    
    // Reassign the audio element to the newAudio object
    audio = newAudio;  // Update the audio object to the new one
});


// 🎛 Audio Volume & Initial Setup (important for sound)
audio.volume = 1.0; // Set the volume to 100% to ensure sound plays
audio.load(); // Ensure the audio is loaded initially

// 📌 Open PDF Viewer When Clicking CV Icon
document.getElementById("cvIcon").addEventListener("click", function () {
    document.getElementById("cvOverlay").classList.add("show");
});

// 📌 Close PDF Viewer When Clicking Outside
document.getElementById("cvOverlay").addEventListener("click", function (event) {
    if (event.target === this) {
        this.classList.remove("show");
    }
});
// 📌 Fix Mobile PDF Display & Scrolling
document.getElementById("cvIcon").addEventListener("click", function () {
    setTimeout(() => {
        let frame = document.getElementById("cvFrame");
        frame.style.height = "100vh"; // Force full height
        frame.style.overflow = "auto"; // Ensure scrolling works
        frame.contentWindow.document.body.style.zoom = "100%"; // Reset zoom if needed
    }, 500);
});

