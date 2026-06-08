const MODEL_SELECTOR = [
  ".double-slit-simulator",
  ".gravity-fabric",
  ".gravity-lensing-model",
  ".wormhole-model",
  ".quantum-entanglement-model",
  ".quantum-channel-model",
  ".orbital-selector",
  ".numerical-methods-model",
  ".neural-architect-model",
  ".information-theory-model",
  ".algorithm-visualizer-model",
  ".quantum-fluctuation-model",
  ".black-hole-model",
  ".quantum-model",
  ".foundation-model"
].join(", ");

const HEADING_SELECTOR = [
  "h2",
  "h3",
  ".content-subarea-title"
].join(", ");

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
    ["gravity-lensing-model", isSpanish ? "Modelo físico" : "Physical model"],
    ["wormhole-model", isSpanish ? "Modelo especulativo" : "Speculative model"],
    ["quantum-entanglement-model", isSpanish ? "Modelo estadístico" : "Statistical model"],
    ["quantum-channel-model", isSpanish ? "Modelo de canal" : "Channel model"],
    ["orbital-selector", isSpanish ? "Modelo orbital" : "Orbital model"],
    ["numerical-methods-model", isSpanish ? "Modelo numérico" : "Numerical model"],
    ["neural-architect-model", isSpanish ? "Modelo de IA" : "AI model"],
    ["information-theory-model", isSpanish ? "Modelo de información" : "Information model"],
    ["algorithm-visualizer-model", isSpanish ? "Modelo algorítmico" : "Algorithm model"],
    ["quantum-fluctuation-model", isSpanish ? "Muestra de campo" : "Field sample"],
    ["black-hole-model", isSpanish ? "Visualización científica" : "Scientific visualization"],
    ["quantum-model", isSpanish ? "Modelo cuántico" : "Quantum model"],
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

export function syncReadingConstellation(root, language) {
  const contentWindow = root.closest(".content-window");

  if (!contentWindow) {
    return;
  }

  contentWindow._creativeProgressCleanup?.();

  const previousProgress = contentWindow.querySelector(":scope > .content-progress-constellation");
  previousProgress?.remove();
  root.querySelector(":scope > .content-progress-constellation")?.remove();

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

  const updateProgress = () => {
    const activeIndex = findActiveHeadingIndex(contentWindow, headings);
    progress.style.top = `${contentWindow.scrollTop + (contentWindow.clientHeight / 2)}px`;

    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === activeIndex);
      dot.classList.toggle("is-read", index < activeIndex);
    });
  };

  contentWindow.appendChild(progress);
  contentWindow.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress, { passive: true });
  updateProgress();

  contentWindow._creativeProgressCleanup = () => {
    contentWindow.removeEventListener("scroll", updateProgress);
    window.removeEventListener("resize", updateProgress);
    progress.remove();
  };
}
