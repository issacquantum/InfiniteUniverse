// Match the site's tablet boundary; touch-primary tablets also qualify in landscape.
export const MOBILE_PERFORMANCE_QUERY = "(max-width: 1024px), (hover: none) and (pointer: coarse)";
const profile = window.matchMedia(MOBILE_PERFORMANCE_QUERY);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
export const isMobilePerformance = () => profile.matches;
export const modelPixelRatio = (desktopCap = 2) => Math.min(window.devicePixelRatio || 1, isMobilePerformance() ? 1 : desktopCap);
export const modelRendererOptions = (desktop) => isMobilePerformance()
  ? { ...desktop, antialias: false, powerPreference: "low-power" } : desktop;

export function onPerformanceProfileChange(callback) {
  profile.addEventListener("change", callback);
  return () => profile.removeEventListener("change", callback);
}
function syncProfile() {
  document.body.dataset.performance = isMobilePerformance() ? "mobile" : "desktop";
}
syncProfile();
profile.addEventListener("change", syncProfile);

const pending = new Map();
const loops = new Map();
const media = new Map();
let removalObserver;
let approachObserver;
const interactionEvents = ["input", "change", "click", "pointerdown", "pointermove", "pointerup", "touchmove", "wheel", "keydown"];
const motionReduced = () => document.body.dataset.motion === "reduced" || reducedMotion.matches;

function watchRemovals() {
  if (removalObserver) return;
  removalObserver = new MutationObserver(() => {
    for (const [element] of pending) {
      if (!element.isConnected) {
        approachObserver?.unobserve(element);
        pending.delete(element);
      }
    }
    for (const [video, dispose] of media) {
      if (!video.isConnected) { dispose(); media.delete(video); }
    }
    for (const [model, loop] of loops) {
      if (!model.container.isConnected) {
        loop.dispose();
        model.destroy?.();
      }
    }
  });
  removalObserver.observe(document.body, { childList: true, subtree: true });
}

// Constructors (including their Three.js imports) wait until the model is nearby.
export function deferModelInitialization(element, initialize) {
  if (!isMobilePerformance()) {
    initialize();
    return;
  }
  if (!element.isConnected || pending.has(element)) return;
  watchRemovals();
  if (!approachObserver) {
    approachObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const start = pending.get(entry.target);
        pending.delete(entry.target);
        approachObserver.unobserve(entry.target);
        if (entry.target.isConnected) start?.();
      }
    }, { rootMargin: "200px 0px" });
  }
  pending.set(element, initialize);
  approachObserver.observe(element);
}

export function invalidateModel(model) {
  loops.get(model)?.invalidate();
}

export function stopModelAnimation(model) {
  loops.get(model)?.dispose();
}

// Desktop calls retain their original RAF scheduling. Mobile owns one cancellable
// timer/RAF pair per model, with no polling while hidden, offscreen, or static.
export function requestModelFrame(model) {
  if (!isMobilePerformance()) return requestAnimationFrame(model.render);
  if (model.destroyed || !model.container.isConnected) return null;
  if (!loops.has(model)) loops.set(model, createMobileLoop(model));
  return null;
}

function createMobileLoop(model) {
  watchRemovals();
  let visible = false;
  let disposed = false;
  let dirty = true;
  let timer = null;
  let frame = null;
  let lastPaint = -Infinity;
  let clock = 0;
  let previousTime = null;
  const container = model.container;
  const surface = model.canvas ?? model.frame ?? container;
  const allowed = () => !disposed && !model.destroyed && container.isConnected && visible && !document.hidden;
  const cancel = () => {
    if (timer !== null) clearTimeout(timer);
    if (frame !== null) cancelAnimationFrame(frame);
    timer = frame = null;
    previousTime = null;
  };
  const schedule = () => {
    if (!allowed() || timer !== null || frame !== null || (motionReduced() && !dirty)) return;
    const delay = Math.max(0, 1000 / 30 - (performance.now() - lastPaint));
    timer = setTimeout(() => {
      timer = null;
      if (!allowed()) return;
      frame = requestAnimationFrame(paint);
    }, delay);
  };
  const paint = (timestamp) => {
    frame = null;
    if (!allowed()) return;
    if (!motionReduced()) clock += previousTime === null ? 1000 / 30 : Math.min(timestamp - previousTime, 50);
    previousTime = timestamp;
    lastPaint = timestamp;
    dirty = false;
    model.render(clock);
    schedule();
  };
  const invalidate = () => { dirty = true; schedule(); };
  const visibility = () => {
    cancel();
    if (!document.hidden) invalidate();
  };
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) invalidate(); else cancel();
  });
  observer.observe(surface);
  const resize = new ResizeObserver(invalidate);
  resize.observe(surface);
  const motion = new MutationObserver(() => { cancel(); invalidate(); });
  motion.observe(document.body, { attributes: true, attributeFilter: ["data-motion"] });
  document.addEventListener("visibilitychange", visibility);
  reducedMotion.addEventListener("change", visibility);
  for (const event of interactionEvents) container.addEventListener(event, invalidate, { passive: true });
  return { invalidate, dispose() {
    if (disposed) return;
    disposed = true;
    cancel();
    observer.disconnect();
    resize.disconnect();
    motion.disconnect();
    document.removeEventListener("visibilitychange", visibility);
    reducedMotion.removeEventListener("change", visibility);
    for (const event of interactionEvents) container.removeEventListener(event, invalidate);
    loops.delete(model);
  } };
}

// Native video playback also stops when its figure or the document is hidden.
export function observeMobileMedia(root) {
  if (!isMobilePerformance()) return;
  root.querySelectorAll("video").forEach((video) => {
    if (media.has(video)) return;
    watchRemovals();
    let visible = false;
    let resume = false;
    const sync = () => {
      if (!visible || document.hidden) {
        resume ||= !video.paused;
        video.pause();
      } else if (resume) {
        resume = false;
        void video.play().catch(() => {});
      }
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(video);
    document.addEventListener("visibilitychange", sync);
    video.addEventListener("play", sync);
    media.set(video, () => {
      video.pause();
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      video.removeEventListener("play", sync);
    });
  });
}
