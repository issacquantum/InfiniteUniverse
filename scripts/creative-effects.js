const MODEL_SELECTOR = [
  ".glass-window[data-model-target]",
  ".gravity-fabric[data-model-target]",
  ".quantum-model__frame.glass-window"
].join(", ");

const HEADING_SELECTOR = [
  "h2",
  "h3",
  ".content-subarea-title"
].join(", ");

const OUTLINE_PHOTON_SELECTOR = [
  ".glass-sphere",
  ".section-grid .glass-tab",
  ".knowledge-worlds-row .glass-tab",
  ".topic-grid .glass-tab",
  ".branch-grid .glass-tab",
  ".legacy-item-grid .glass-tab",
  ".mobile-knowledge-nav__domain-button",
  ".mobile-knowledge-nav__topic-button",
  ".equation-link",
  ".equation-display"
].join(", ");

function hashString(value) {
  let hash = 2166136261;
  const text = String(value ?? "");

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function getPhotonSignature(target, index) {
  return [
    index,
    target.id,
    target.className,
    target.getAttribute("aria-label"),
    target.getAttribute("title"),
    target.getAttribute("href"),
    target.textContent
  ].filter(Boolean).join("|");
}

function randomizePhotonMotion(target, index) {
  const hash = hashString(getPhotonSignature(target, index));
  const duration = 6.8 + ((hash % 220) / 100);
  const delay = -(((hash >>> 8) % 780) / 100);
  const angle = 96 + ((hash >>> 16) % 54);
  const direction = (hash & 1) === 0 ? "normal" : "reverse";
  const size = 245 + ((hash >>> 20) % 72);

  target.style.setProperty("--outline-photon-duration", `${duration.toFixed(2)}s`);
  target.style.setProperty("--outline-photon-delay", `${delay.toFixed(2)}s`);
  target.style.setProperty("--outline-photon-angle", `${angle}deg`);
  target.style.setProperty("--outline-photon-direction", direction);
  target.style.setProperty("--outline-photon-size", `${size}%`);
}

function getInterfaceText(language) {
  return language === "es"
    ? {
        readingProgress: "Ruta de lectura",
        progressPrefix: "Ir a"
      }
    : {
        readingProgress: "Reading route",
        progressPrefix: "Go to"
      };
}

function getModelBadgeText(model, language) {
  const isSpanish = language === "es";
  const labels = [
    ["double-slit-simulator", isSpanish ? "Modelo de ondas" : "Wave model"],
    ["gravity-fabric", isSpanish ? "Modelo de analogía" : "Analogy model"],
    ["gravity-lensing", isSpanish ? "Modelo físico" : "Physical model"],
    ["wormhole-model", isSpanish ? "Modelo especulativo" : "Speculative model"],
    ["quantum-entanglement", isSpanish ? "Modelo estadístico" : "Statistical model"],
    ["quantum-channel", isSpanish ? "Modelo de canal" : "Channel model"],
    ["orbital-selector", isSpanish ? "Modelo orbital" : "Orbital model"],
    ["numerical-methods", isSpanish ? "Modelo numérico" : "Numerical model"],
    ["neural-architect", isSpanish ? "Modelo de IA" : "AI model"],
    ["information-theory-model", isSpanish ? "Modelo de información" : "Information model"],
    ["algorithm-visualizer", isSpanish ? "Modelo algorítmico" : "Algorithm model"],
    ["quantum-fluctuation", isSpanish ? "Muestra de campo" : "Field sample"],
    ["black-hole-model", isSpanish ? "Visualización científica" : "Scientific visualization"],
    ["quantum-model__frame", isSpanish ? "Modelo cuántico" : "Quantum model"],
    ["foundation-model", isSpanish ? "Modelo conceptual" : "Conceptual model"]
  ];

  return labels.find(([className]) => model.classList.contains(className))?.[1]
    ?? (isSpanish ? "Modelo interactivo" : "Interactive model");
}

function compactText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function scrollHeadingIntoView(contentWindow, heading) {
  const windowRect = contentWindow.getBoundingClientRect();
  const headingRect = heading.getBoundingClientRect();
  const targetTop = contentWindow.scrollTop + headingRect.top - windowRect.top - 18;
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  contentWindow.scrollTo({
    top: Math.max(targetTop, 0),
    behavior: prefersReducedMotion ? "auto" : "smooth"
  });
}

function findActiveHeadingIndex(contentWindow, headings) {
  const windowTop = contentWindow.getBoundingClientRect().top;
  let activeIndex = 0;

  headings.forEach((heading, index) => {
    if (heading.getBoundingClientRect().top - windowTop <= 90) {
      activeIndex = index;
    }
  });

  return activeIndex;
}

export function decorateModelBadges(root, language) {
  root.querySelectorAll(MODEL_SELECTOR).forEach((model) => {
    if (model.querySelector(":scope > .model-creative-badge")) {
      return;
    }

    model.classList.add("model-creative-shell");

    const badge = document.createElement("span");
    badge.className = "model-creative-badge";
    badge.textContent = getModelBadgeText(model, language);
    model.appendChild(badge);
  });
}

export function decoratePhotonOutlines(root = document) {
  const scope = root?.querySelectorAll ? root : document;
  const targets = new Set();

  if (scope.matches?.(OUTLINE_PHOTON_SELECTOR)) {
    targets.add(scope);
  }

  scope.querySelectorAll(OUTLINE_PHOTON_SELECTOR).forEach((target) => {
    targets.add(target);
  });

  Array.from(targets).forEach((target, index) => {
    if (target.querySelector(":scope > .outline-photon-channel")) {
      randomizePhotonMotion(target, index);
      return;
    }

    target.classList.add("has-outline-photon");
    randomizePhotonMotion(target, index);

    const photon = document.createElement("span");
    photon.className = "outline-photon-channel";
    photon.setAttribute("aria-hidden", "true");
    target.appendChild(photon);
  });
}

export function syncReadingConstellation(root, language) {
  const contentWindow = root.closest(".content-window");

  if (!contentWindow) {
    return;
  }

  contentWindow._creativeProgressCleanup?.();

  document.querySelectorAll(".content-progress-constellation").forEach((node) => {
    node.remove();
  });

  const headings = Array.from(root.querySelectorAll(HEADING_SELECTOR))
    .filter((heading) => {
      const label = compactText(heading.textContent);
      return (
        label
        && !heading.closest(".content-progress-constellation")
        && !heading.closest(".model-accessibility")
        && !heading.closest(".model-teaching-card")
      );
    })
    .slice(0, 14);

  if (headings.length < 3) {
    contentWindow._creativeProgressCleanup = null;
    return;
  }

  const text = getInterfaceText(language);
  const progress = document.createElement("nav");
  progress.className = "content-progress-constellation";
  progress.setAttribute("aria-label", text.readingProgress);

  const dots = headings.map((heading) => {
    const label = compactText(heading.textContent);
    const button = document.createElement("button");
    button.className = "content-progress-constellation__dot";
    button.type = "button";
    button.setAttribute("aria-label", `${text.progressPrefix}: ${label}`);
    button.title = label;
    button.addEventListener("click", () => {
      scrollHeadingIntoView(contentWindow, heading);
    });
    progress.appendChild(button);
    return button;
  });

  const syncProgressPosition = () => {
    const rect = contentWindow.getBoundingClientRect();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || rect.right;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || rect.height;
    const minTop = 90;
    const maxTop = Math.max(minTop, viewportHeight - 90);
    const top = Math.min(Math.max(rect.top + (rect.height / 2), minTop), maxTop);
    const outsideGap = Math.max(viewportWidth - rect.right, 0);
    const right = Math.max(Math.min(outsideGap * 0.25, 10), 2);

    progress.style.setProperty("--progress-top", `${top}px`);
    progress.style.setProperty("--progress-right", `${right}px`);
    progress.style.setProperty("--progress-window-height", `${Math.max(rect.height, 160)}px`);
    progress.style.setProperty("--progress-dot-gap", headings.length > 10 ? "0.22rem" : "0.36rem");
  };

  const updateProgress = () => {
    const activeIndex = findActiveHeadingIndex(contentWindow, headings);

    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === activeIndex);
      dot.classList.toggle("is-read", index < activeIndex);
    });
  };

  const syncAndUpdateProgress = () => {
    syncProgressPosition();
    updateProgress();
  };

  document.body.appendChild(progress);
  contentWindow.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", syncAndUpdateProgress, { passive: true });

  const resizeObserver = typeof ResizeObserver === "function"
    ? new ResizeObserver(syncAndUpdateProgress)
    : null;

  resizeObserver?.observe(contentWindow);
  syncAndUpdateProgress();

  contentWindow._creativeProgressCleanup = () => {
    contentWindow.removeEventListener("scroll", updateProgress);
    window.removeEventListener("resize", syncAndUpdateProgress);
    resizeObserver?.disconnect();
    progress.remove();
  };
}
