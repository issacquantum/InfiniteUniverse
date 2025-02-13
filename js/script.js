// 🎵 Music Player Configuration (Fixed Issues)
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

// 🎵 Auto Play Next Song When Current One Ends (Fixed)
audio.addEventListener("ended", function () {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    audio.src = songs[currentSongIndex];
    songNameDisplay.textContent = songNames[currentSongIndex];

    audio.load(); // 🔄 Reload audio to apply new source
    audio.play();
});

// 🔊 Ensure Volume is 100%
audio.volume = 1.0;

// 🌌 Generate Glowing Particles Across the Entire Site
document.addEventListener("DOMContentLoaded", function () {
    const particleContainer = document.getElementById("particles-container");

    if (!particleContainer) {
        console.error("❌ `particles-container` not found in the HTML.");
        return;
    }

    for (let i = 0; i < 80; i++) { // Número de partículas
        let particle = document.createElement("div");
        particle.classList.add("particle");

        // Posiciones aleatorias
        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.top = `${Math.random() * 100}vh`;
        particle.style.width = `${Math.random() * 4 + 2}px`;  // Tamaño pequeño
        particle.style.height = particle.style.width;

        particleContainer.appendChild(particle);
    }
});

// 🌌 Efecto de Partículas: Aparición y Movimiento Suave
const particles = document.querySelectorAll(".particle");

particles.forEach(particle => {
    const animationDuration = Math.random() * 30 + 20; // Velocidad de la animación
    const fadeDuration = Math.random() * 30 + 20; // Velocidad de aparición/desaparición
    particle.style.animation = `fade ${fadeDuration}s infinite alternate, moveParticles ${animationDuration}s linear infinite`;
});

// 🌌 Definir Animaciones
const style = document.createElement("style");
style.innerHTML = `
    @keyframes fade {
        0% { opacity: 0; }
        50% { opacity: 0.75; }
        100% { opacity: 0; }
    }

    @keyframes moveParticles {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-3px); }
        100% { transform: translateY(0px); }
    }
`;
document.head.appendChild(style);
