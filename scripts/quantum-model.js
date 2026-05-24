import { buildDensityCloud, buildCurrentCloud, advanceCurrentCloud, SCALE } from "./orbital-math.js?v=20260524-model-layout-fix-v1";
import { OrbitalRenderer } from "./orbital-renderer.js?v=20260524-model-layout-fix-v1";
import { OrbitalCamera } from "./orbital-camera.js?v=20260524-model-layout-fix-v1";

const MOUNTED = new WeakSet();

function isLowPowerDevice() {
  const memory = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency;

  if (memory && memory < 4) {
    return true;
  }

  if (cores && cores <= 4) {
    return true;
  }

  return false;
}

async function fetchShader(url) {
  const response = await fetch(url, { cache: "force-cache" });

  if (!response.ok) {
    throw new Error(`Failed to load shader: ${url}`);
  }

  return response.text();
}

function getLanguage(host) {
  const scopedLanguage = host.closest("[lang]")?.getAttribute("lang");
  return scopedLanguage || document.documentElement.lang || "en";
}

function getHintCopy(language) {
  return language.startsWith("es")
    ? "arrastra para rotar · Shift/Alt o clic derecho para mover · desplaza para acercar"
    : "drag to rotate · Shift/Alt or right-drag to move · scroll to zoom";
}

function getFallbackCopy(language) {
  return language.startsWith("es")
    ? "El modelo 3D no pudo cargarse en este navegador."
    : "The 3D model could not be loaded in this browser.";
}

async function mountModel(host) {
  if (MOUNTED.has(host)) {
    return;
  }

  MOUNTED.add(host);

  const frame = host.querySelector(".quantum-model__frame") ?? host;
  const language = getLanguage(host);
  const canvas = document.createElement("canvas");

  canvas.className = "quantum-model__canvas";
  canvas.tabIndex = 0;
  canvas.setAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight ArrowUp ArrowDown + -");
  canvas.setAttribute("aria-label", language.startsWith("es")
    ? "Modelo 3D interactivo del orbital de hidrógeno. Usa arrastre para rotar, Shift Alt o clic derecho para mover, pellizco, flechas y los signos más y menos para interactuar."
    : "Interactive 3D hydrogen orbital model. Use drag to rotate, Shift Alt or right-drag to move, pinch, arrow keys, and plus and minus keys to interact.");

  const figure = host.closest(".quantum-model-figure");
  const figcaption = figure?.querySelector("figcaption");
  if (figcaption) {
    if (!figcaption.id) {
      figcaption.id = `quantum-model-caption-${Math.random().toString(36).slice(2, 10)}`;
    }
    canvas.setAttribute("aria-describedby", figcaption.id);
  }

  frame.replaceChildren(canvas);

  let hint = host.querySelector(".quantum-model__hint");
  if (!hint) {
    hint = document.createElement("p");
    hint.className = "quantum-model__hint";
    host.append(hint);
  }
  hint.textContent = getHintCopy(language);

  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false
  });

  if (!gl) {
    frame.innerHTML = `<p class="content-placeholder">${getFallbackCopy(language)}</p>`;
    return;
  }

  const lowPower = isLowPowerDevice();
  const densityCount = lowPower ? 28000 : 64000;
  const currentCount = 0;
  const dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2.0);

  const [vertexSource, fragmentSource] = await Promise.all([
    fetchShader(new URL("../shaders/orbital.vert.glsl", import.meta.url)),
    fetchShader(new URL("../shaders/orbital.frag.glsl?v=20260524-model-layout-fix-v1", import.meta.url))
  ]);

  const renderer = new OrbitalRenderer(canvas, gl);
  renderer.buildProgram(vertexSource, fragmentSource);
  renderer.setDensityCloud(buildDensityCloud(densityCount, 7));

  const { positions: currentPositions, meta: currentMeta } = buildCurrentCloud(currentCount, 13);
  if (currentPositions.length > 0) {
    renderer.setCurrentCloud(currentPositions);
  }

  const camera = new OrbitalCamera(canvas);
  canvas.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        camera.nudgeRotation(-0.12, 0.0);
        break;
      case "ArrowRight":
        event.preventDefault();
        camera.nudgeRotation(0.12, 0.0);
        break;
      case "ArrowUp":
        event.preventDefault();
        camera.nudgeRotation(0.0, -0.12);
        break;
      case "ArrowDown":
        event.preventDefault();
        camera.nudgeRotation(0.0, 0.12);
        break;
      case "+":
      case "=":
        event.preventDefault();
        camera.nudgeZoom(0.08);
        break;
      case "-":
      case "_":
        event.preventDefault();
        camera.nudgeZoom(-0.08);
        break;
      default:
        break;
    }
  });

  const displayScale = 1.0 / SCALE;
  let frameId = null;
  let lastTime = null;
  let running = false;

  function renderFrame(timestamp) {
    if (!running) {
      return;
    }

    frameId = requestAnimationFrame(renderFrame);
    const deltaTime = lastTime === null ? 0.016 : Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    camera.tick(deltaTime);
    if (currentPositions.length > 0) {
      advanceCurrentCloud(currentPositions, currentMeta, deltaTime);
      renderer.updateCurrentCloud(currentPositions);
    }
    renderer.resize(dpr);

    const aspect = canvas.width / canvas.height;
    const mvp = camera.getMvp(aspect, displayScale);

    renderer.clear();
    renderer.draw(mvp, dpr);
  }

  function start() {
    if (running) {
      return;
    }

    running = true;
    lastTime = null;
    frameId = requestAnimationFrame(renderFrame);
  }

  function stop() {
    running = false;
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  }

  const visibilityObserver = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting) {
      start();
    } else {
      stop();
    }
  }, { threshold: 0.12 });

  visibilityObserver.observe(host);

  const cleanupObserver = new MutationObserver(() => {
    if (!document.contains(host)) {
      stop();
      visibilityObserver.disconnect();
      renderer.destroy();
      cleanupObserver.disconnect();
    }
  });

  cleanupObserver.observe(document.body, { childList: true, subtree: true });
}

export function initQuantumModels(root = document) {
  root.querySelectorAll("[data-quantum-model]").forEach((host) => {
    mountModel(host).catch(() => {
      const frame = host.querySelector(".quantum-model__frame") ?? host;
      frame.innerHTML = `<p class="content-placeholder">${getFallbackCopy(getLanguage(host))}</p>`;
    });
  });
}
