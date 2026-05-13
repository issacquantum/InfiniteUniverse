function hasConfiguredPath(value) {
  return typeof value === "string" && value.trim() !== "" && value !== "PATH_HERE";
}

function normalizeFolder(folder) {
  if (!hasConfiguredPath(folder)) {
    return "";
  }

  return folder.endsWith("/") ? folder.slice(0, -1) : folder;
}

function formatTrackName(fileName) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replaceAll("_", " ")
    .replaceAll("-", " ");
}

function resolveTrackEntries(folder, entries) {
  return entries
    .map((entry) => {
      if (typeof entry === "string" && entry.trim() !== "") {
        return {
          fileName: entry,
          displayName: formatTrackName(entry),
          source: `${folder}/${entry}`
        };
      }

      if (
        entry
        && typeof entry === "object"
        && typeof entry.fileName === "string"
        && entry.fileName.trim() !== ""
      ) {
        const versionSuffix = typeof entry.version === "string" && entry.version.trim() !== ""
          ? `?v=${encodeURIComponent(entry.version)}`
          : "";

        return {
          fileName: entry.fileName,
          displayName: typeof entry.displayName === "string" && entry.displayName.trim() !== ""
            ? entry.displayName
            : formatTrackName(entry.fileName),
          source: `${folder}/${entry.fileName}${versionSuffix}`
        };
      }

      return null;
    })
    .filter(Boolean);
}

function resolvePlaylist(assets, contextId = "default") {
  const folder = normalizeFolder(assets?.music?.folder ?? "");
  const defaultEntries = Array.isArray(assets?.music?.files) ? assets.music.files : [];
  const contextEntries = Array.isArray(assets?.music?.contexts?.[contextId]?.tracks)
    ? assets.music.contexts[contextId].tracks
    : null;
  const entries = contextId === "default" || !contextEntries ? defaultEntries : contextEntries;

  if (!folder || entries.length === 0) {
    return [];
  }

  return resolveTrackEntries(folder, entries);
}

export function syncMusicUi({ refs, isPlaying = false, currentTrackName = "" }) {
  const iconName = isPlaying ? "pause" : "play";
  const ariaLabel = isPlaying ? "Pause site music" : "Play site music";

  refs.musicButtons.forEach((button) => {
    if (!button) {
      return;
    }

    button.setAttribute("aria-pressed", String(isPlaying));
    button.setAttribute("aria-label", ariaLabel);

    const icon = button.querySelector("[data-music-icon]");
    if (icon) {
      icon.setAttribute("data-lucide", iconName);
    }
  });

  refs.desktopTrackName.hidden = !isPlaying || !currentTrackName;
  refs.desktopTrackName.textContent = currentTrackName;
}

export function createMusicController({ refs, assets, onStateChange }) {
  const TEKKEN_AUTOPLAY_DELAY_MS = 3000;
  const defaultPlaylist = resolvePlaylist(assets);
  const tekkenPlaylist = resolvePlaylist(assets, "tekken");
  const defaultAudio = new Audio();
  const tekkenAudio = new Audio();
  let activeContextId = "default";
  let currentTrackIndex = 0;
  let tekkenAutoplayTimer = null;
  let defaultPlaybackState = {
    currentTrackIndex: 0,
    currentTime: 0,
    wasPlaying: false
  };
  let isTekkenCountdownPending = false;

  defaultAudio.preload = "metadata";
  tekkenAudio.preload = "metadata";
  tekkenAudio.loop = true;
  tekkenAudio.volume = 1;

  if (tekkenPlaylist[0]) {
    tekkenAudio.src = tekkenPlaylist[0].source;
  }

  function isAudioPlaying(audio) {
    return Boolean(audio.src) && !audio.paused && !audio.ended;
  }

  function getPlaylist(contextId = activeContextId) {
    if (contextId === "default") {
      return defaultPlaylist;
    }

    if (contextId === "tekken") {
      return tekkenPlaylist;
    }

    return defaultPlaylist;
  }

  function getTrack() {
    return getPlaylist()[currentTrackIndex] ?? null;
  }

  function getActiveAudio() {
    return activeContextId === "tekken" ? tekkenAudio : defaultAudio;
  }

  function clearTekkenAutoplayTimer() {
    if (tekkenAutoplayTimer !== null) {
      window.clearTimeout(tekkenAutoplayTimer);
      tekkenAutoplayTimer = null;
    }
  }

  function getPlaybackState() {
    const audio = getActiveAudio();
    const isPlaying = activeContextId === "tekken" && isTekkenCountdownPending
      ? false
      : isAudioPlaying(audio);
    return {
      isPlaying,
      currentTrackName: isPlaying ? getTrack()?.displayName ?? "" : ""
    };
  }

  function emitState() {
    if (typeof onStateChange === "function") {
      onStateChange(getPlaybackState());
    }
  }

  function setButtonAvailability() {
    const playlist = getPlaylist();

    refs.musicButtons.forEach((button) => {
      if (!button) {
        return;
      }

      button.disabled = playlist.length === 0;
    });
  }

  function setTrack(index) {
    currentTrackIndex = index;

    const track = getTrack();
    if (!track) {
      defaultAudio.removeAttribute("src");
      defaultAudio.load();
      return;
    }

    if (defaultAudio.getAttribute("src") !== track.source) {
      defaultAudio.src = track.source;
      defaultAudio.load();
    }
  }

  function saveDefaultPlaybackState() {
    defaultPlaybackState = {
      currentTrackIndex,
      currentTime: defaultAudio.src ? defaultAudio.currentTime : 0,
      wasPlaying: isAudioPlaying(defaultAudio)
    };
  }

  function setDefaultCurrentTime(time) {
    if (defaultAudio.readyState >= 1) {
      defaultAudio.currentTime = time;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      defaultAudio.addEventListener("loadedmetadata", () => {
        defaultAudio.currentTime = time;
        resolve();
      }, { once: true });
    });
  }

  async function playCurrentTrack() {
    const playlist = getPlaylist();

    if (playlist.length === 0) {
      emitState();
      return false;
    }

    if (!defaultAudio.src) {
      setTrack(currentTrackIndex);
    }

    try {
      await defaultAudio.play();
      return true;
    } catch (_error) {
      emitState();
      return false;
    }
  }

  async function playTekkenTrack() {
    if (!tekkenPlaylist.length) {
      emitState();
      return false;
    }

    clearTekkenAutoplayTimer();

    if (!tekkenAudio.src && tekkenPlaylist[0]) {
      tekkenAudio.src = tekkenPlaylist[0].source;
    }

    try {
      isTekkenCountdownPending = false;
      tekkenAudio.muted = false;
      tekkenAudio.volume = 1;
      await tekkenAudio.play();
      return true;
    } catch (_error) {
      emitState();
      return false;
    }
  }

  function startTekkenAutoplayDelay() {
    if (!tekkenPlaylist.length) {
      emitState();
      return false;
    }

    clearTekkenAutoplayTimer();

    if (!tekkenAudio.src && tekkenPlaylist[0]) {
      tekkenAudio.src = tekkenPlaylist[0].source;
    }

    tekkenAudio.currentTime = 0;
    tekkenAudio.muted = false;
    tekkenAudio.volume = 1;
    isTekkenCountdownPending = true;
    unlockTekkenAudioForDelayedStart();
    return true;
  }

  function unlockTekkenAudioForDelayedStart() {
    if (!tekkenAudio.src) {
      return;
    }

    tekkenAudio.muted = true;
    tekkenAudio.volume = 0;
    const playPromise = tekkenAudio.play();

    if (!playPromise || typeof playPromise.then !== "function") {
      tekkenAudio.pause();
      tekkenAudio.currentTime = 0;
      tekkenAudio.muted = false;
      tekkenAudio.volume = 1;
      return;
    }

    playPromise
      .then(() => {
        if (isTekkenCountdownPending) {
          tekkenAudio.pause();
          tekkenAudio.currentTime = 0;
        }
        tekkenAudio.muted = false;
        tekkenAudio.volume = 1;
        emitState();
      })
      .catch(() => {
        tekkenAudio.muted = false;
        tekkenAudio.volume = 1;
        emitState();
      });
  }

  async function togglePlayback() {
    const playlist = getPlaylist();

    if (playlist.length === 0) {
      emitState();
      return;
    }

    const audio = getActiveAudio();

    if (activeContextId === "tekken") {
      clearTekkenAutoplayTimer();

      if (isTekkenCountdownPending) {
        isTekkenCountdownPending = false;
        tekkenAudio.currentTime = 0;
        await playTekkenTrack();
        return;
      }
    }

    if (!audio.paused && !audio.ended) {
      audio.pause();
      return;
    }

    if (activeContextId === "tekken") {
      await playTekkenTrack();
      return;
    }

    await playCurrentTrack();
  }

  async function handleTrackEnd() {
    const playlist = defaultPlaylist;

    if (playlist.length === 0) {
      return;
    }

    setTrack((currentTrackIndex + 1) % playlist.length);
    await playCurrentTrack();
  }

  function scheduleTekkenAutoplay() {
    if (!tekkenPlaylist.length) {
      return;
    }

    clearTekkenAutoplayTimer();
    tekkenAutoplayTimer = window.setTimeout(() => {
      tekkenAutoplayTimer = null;

      if (activeContextId !== "tekken" || !isTekkenCountdownPending) {
        return;
      }

      isTekkenCountdownPending = false;
      tekkenAudio.currentTime = 0;
      void playTekkenTrack();
    }, TEKKEN_AUTOPLAY_DELAY_MS);
  }

  defaultAudio.addEventListener("play", emitState);
  defaultAudio.addEventListener("pause", emitState);
  defaultAudio.addEventListener("ended", handleTrackEnd);
  defaultAudio.addEventListener("error", emitState);
  tekkenAudio.addEventListener("play", emitState);
  tekkenAudio.addEventListener("pause", emitState);
  tekkenAudio.addEventListener("error", emitState);

  refs.musicButtons.forEach((button) => {
    if (!button) {
      return;
    }

    button.addEventListener("click", togglePlayback);
  });

  setButtonAvailability();
  emitState();

  return {
    async setContext(contextId = "default") {
      const nextContextId = contextId === "tekken" && tekkenPlaylist.length ? "tekken" : "default";

      if (nextContextId === activeContextId) {
        return;
      }

      clearTekkenAutoplayTimer();

      if (activeContextId === "default") {
        saveDefaultPlaybackState();
        defaultAudio.pause();
      } else {
        isTekkenCountdownPending = false;
        tekkenAudio.pause();
        tekkenAudio.currentTime = 0;
        tekkenAudio.muted = false;
        tekkenAudio.volume = 1;
      }

      activeContextId = nextContextId;
      setButtonAvailability();

      if (activeContextId === "default") {
        currentTrackIndex = Math.min(
          defaultPlaybackState.currentTrackIndex,
          Math.max(defaultPlaylist.length - 1, 0)
        );
        setTrack(currentTrackIndex);
        await setDefaultCurrentTime(defaultPlaybackState.currentTime);

        if (defaultPlaybackState.wasPlaying) {
          await playCurrentTrack();
          return;
        }

        emitState();
        return;
      }

      currentTrackIndex = 0;
      if (tekkenPlaylist[0] && tekkenAudio.getAttribute("src") !== tekkenPlaylist[0].source) {
        tekkenAudio.src = tekkenPlaylist[0].source;
      }
      tekkenAudio.currentTime = 0;
      if (startTekkenAutoplayDelay()) {
        emitState();
        scheduleTekkenAutoplay();
        return;
      }

      emitState();
    },
    dispose() {
      if (activeContextId === "default") {
        saveDefaultPlaybackState();
      }

      clearTekkenAutoplayTimer();
      isTekkenCountdownPending = false;
      defaultAudio.pause();
      tekkenAudio.pause();
      defaultAudio.removeEventListener("play", emitState);
      defaultAudio.removeEventListener("pause", emitState);
      defaultAudio.removeEventListener("ended", handleTrackEnd);
      defaultAudio.removeEventListener("error", emitState);
      tekkenAudio.removeEventListener("play", emitState);
      tekkenAudio.removeEventListener("pause", emitState);
      tekkenAudio.removeEventListener("error", emitState);
    }
  };
}
