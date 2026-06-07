const MODEL_SELECTOR = [
  "[data-double-slit-simulator]",
  "[data-gravity-fabric-model]",
  "[data-gravity-lensing-model]",
  "[data-wormhole-model]",
  "[data-quantum-entanglement-model]",
  "[data-quantum-channel-model]",
  "[data-quantum-model]",
  "[data-orbital-selector-model]",
  "[data-numerical-methods-model]",
  "[data-neural-architect-model]",
  "[data-information-theory-model]",
  "[data-algorithm-visualizer-model]",
  "[data-quantum-fluctuation-model]",
  "[data-black-hole-model]",
  "[data-foundation-model]"
].join(",");

const CONTROL_SELECTOR = "input:not([type='hidden']), select, button";
const VISUAL_FALLBACK_SELECTOR = [
  "canvas",
  "[data-ds-viewport]",
  "[data-foundation-model-frame]",
  "[data-na-frame]",
  "[data-qf-frame]",
  "[data-nm-frame]",
  "[data-it-frame]",
  "[data-av-frame]",
  "[data-qc-frame]",
  "[class$='__frame']"
].join(",");

const COPY = {
  en: {
    active: "active",
    checkboxOff: "off",
    checkboxOn: "on",
    controlsHelp: "Keyboard controls",
    controlsText: "Use Tab to reach sliders, selectors, and buttons. Range sliders respond to arrow keys; Home and End usually move to the minimum or maximum.",
    describe: "Describe this model",
    detailsHidden: "Hide model description",
    fallbackDescription: "A fixed diagram showing the model as connected layers, so the idea can still be read without animation.",
    fallbackTitle: "Static fallback",
    genericExplanation: "Changing a slider updates the visible model and this current-state line. A range usually changes size, speed, strength, distance, noise, or probability; a checkbox turns a layer on or off; a mode button changes which lesson is emphasized.",
    genericName: "interactive model",
    higher: "higher",
    lower: "lower",
    middle: "middle",
    reducedText: "Reduced motion is active or preferred. Use the static diagram and current-state text instead of relying on animation.",
    reducedTitle: "Reduced-motion fallback",
    selectValue: "selected",
    stateLabel: "Current model state",
    visualLabel: "Interactive visual area for"
  },
  es: {
    active: "activo",
    checkboxOff: "apagado",
    checkboxOn: "encendido",
    controlsHelp: "Controles con teclado",
    controlsText: "Usa Tab para llegar a deslizadores, selectores y botones. Los deslizadores responden a las flechas; Inicio y Fin suelen moverlos al mínimo o al máximo.",
    describe: "Describir este modelo",
    detailsHidden: "Ocultar descripción del modelo",
    fallbackDescription: "Un diagrama fijo que muestra el modelo como capas conectadas, para que la idea pueda leerse sin depender de la animación.",
    fallbackTitle: "Vista estática",
    genericExplanation: "Cambiar un deslizador actualiza el modelo visible y esta línea de estado. Un rango suele cambiar tamaño, velocidad, intensidad, distancia, ruido o probabilidad; una casilla activa o desactiva una capa; un botón de modo cambia la lección que se enfatiza.",
    genericName: "modelo interactivo",
    higher: "alto",
    lower: "bajo",
    middle: "medio",
    reducedText: "El movimiento reducido está activo o preferido. Usa el diagrama fijo y el texto de estado actual en lugar de depender de la animación.",
    reducedTitle: "Alternativa con movimiento reducido",
    selectValue: "seleccionado",
    stateLabel: "Estado actual del modelo",
    visualLabel: "Área visual interactiva de"
  }
};

let nextPanelId = 0;

function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function mergeIdRefs(existing, ...ids) {
  return Array.from(new Set(normalizeText(`${existing || ""} ${ids.filter(Boolean).join(" ")}`).split(" ").filter(Boolean))).join(" ");
}

function escapeSelector(value) {
  return window.CSS?.escape ? window.CSS.escape(value) : String(value).replace(/["\\]/g, "\\$&");
}

function getLanguage(root, state) {
  const raw = root.dataset.language || state?.language || root.closest("[lang]")?.getAttribute("lang") || "en";
  return raw.toLowerCase().startsWith("es") ? "es" : "en";
}

function getModelName(root, copy) {
  const blockHeading = root.closest(".content-block")?.querySelector(":scope > h2, :scope > h3, :scope > h4");
  const figureCaption = root.closest("figure")?.querySelector("figcaption");
  const modelLabel = root.getAttribute("aria-label");

  return normalizeText(blockHeading?.textContent || modelLabel || figureCaption?.textContent || copy.genericName);
}

function getNearbyTeachingCard(root) {
  const container = root.closest("figure") ?? root;
  const sibling = container.previousElementSibling;

  return sibling?.classList.contains("model-teaching-card") ? sibling : null;
}

function getTeachingSummary(root, language) {
  const card = getNearbyTeachingCard(root);

  if (!card) {
    return "";
  }

  const modelTypeLabel = language === "es" ? "Tipo de modelo:" : "Model type:";
  const modelTypeLine = Array.from(card.querySelectorAll("p"))
    .find((paragraph) => normalizeText(paragraph.textContent).startsWith(modelTypeLabel));

  return normalizeText(modelTypeLine?.textContent ?? "");
}

function getLabelText(control) {
  const explicitLabel = control.getAttribute("aria-label");

  if (explicitLabel) {
    return normalizeText(explicitLabel);
  }

  if (control.id) {
    const ownerDocument = control.ownerDocument;
    const label = ownerDocument.querySelector(`label[for="${escapeSelector(control.id)}"]`);

    if (label) {
      return normalizeText(label.textContent);
    }
  }

  const wrappingLabel = control.closest("label");

  if (wrappingLabel) {
    return normalizeText(wrappingLabel.textContent).replace(/\s+[+-]?\d+(\.\d+)?\s*$/, "");
  }

  const nearbyLabel = control.previousElementSibling;

  if (nearbyLabel) {
    return normalizeText(nearbyLabel.textContent);
  }

  return normalizeText(control.textContent || control.name || control.dataset.dqParam || control.dataset.dsParam || control.dataset.naParam);
}

function isControlVisible(control) {
  return !control.closest("[hidden], .is-hidden") && control.type !== "hidden";
}

function getRangeLevel(control, copy) {
  const min = Number(control.min);
  const max = Number(control.max);
  const value = Number(control.value);

  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min || !Number.isFinite(value)) {
    return copy.middle;
  }

  const position = (value - min) / (max - min);

  if (position < 0.38) {
    return copy.lower;
  }

  if (position > 0.62) {
    return copy.higher;
  }

  return copy.middle;
}

function describeControl(control, copy) {
  const label = getLabelText(control);

  if (!label) {
    return "";
  }

  if (control instanceof HTMLInputElement && control.type === "range") {
    return `${label}: ${control.value} (${getRangeLevel(control, copy)})`;
  }

  if (control instanceof HTMLInputElement && control.type === "checkbox") {
    return `${label}: ${control.checked ? copy.checkboxOn : copy.checkboxOff}`;
  }

  if (control instanceof HTMLSelectElement) {
    const selected = normalizeText(control.selectedOptions?.[0]?.textContent || control.value);
    return `${label}: ${selected} ${copy.selectValue}`;
  }

  if (control instanceof HTMLButtonElement && control.getAttribute("aria-pressed") === "true") {
    return `${label}: ${copy.active}`;
  }

  return "";
}

function updateControlLabels(root, copy, panelId, summaryId, guidanceId) {
  root.querySelectorAll(CONTROL_SELECTOR).forEach((control, index) => {
    const label = getLabelText(control);

    if (!control.id) {
      control.id = `${panelId}-control-${index + 1}`;
    }

    if (label && !control.hasAttribute("aria-label")) {
      control.setAttribute("aria-label", label);
    }

    control.setAttribute(
      "aria-describedby",
      mergeIdRefs(control.getAttribute("aria-describedby"), summaryId, guidanceId)
    );

    if (control instanceof HTMLInputElement && control.type === "range") {
      control.setAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight ArrowUp ArrowDown Home End");
      control.setAttribute("aria-valuetext", `${label || copy.genericName}: ${control.value}`);
    }
  });
}

function summarizeDoubleSlit(root, copy, language) {
  const wavelength = root.querySelector("[data-ds-param='wavelength']");
  const slitDistance = root.querySelector("[data-ds-param='slitDistance']");

  if (!(wavelength instanceof HTMLInputElement) || !(slitDistance instanceof HTMLInputElement)) {
    return "";
  }

  if (language === "es") {
    return `Estado actual del modelo: longitud de onda ${wavelength.value} (${getRangeLevel(wavelength, copy)}); separación entre rendijas ${slitDistance.value} (${getRangeLevel(slitDistance, copy)}). La separación de las franjas sigue y_m aproximadamente igual a m por lambda por L dividido entre d: aumentar la longitud de onda abre las franjas, y aumentar la separación entre rendijas las acerca.`;
  }

  return `Current model state: wavelength ${wavelength.value} (${getRangeLevel(wavelength, copy)}); slit spacing ${slitDistance.value} (${getRangeLevel(slitDistance, copy)}). Fringe spacing follows y_m approximately equals m times lambda times L divided by d: increasing wavelength spreads fringes apart, and increasing slit spacing pulls them closer.`;
}

function summarizeControls(root, copy, language) {
  const doubleSlitSummary = root.matches("[data-double-slit-simulator]")
    ? summarizeDoubleSlit(root, copy, language)
    : "";

  if (doubleSlitSummary) {
    return doubleSlitSummary;
  }

  const descriptions = Array.from(root.querySelectorAll(CONTROL_SELECTOR))
    .filter(isControlVisible)
    .map((control) => describeControl(control, copy))
    .filter(Boolean);

  return descriptions.length > 0
    ? `${copy.stateLabel}: ${descriptions.slice(0, 6).join("; ")}.`
    : "";
}

function createSvgElement(name, attributes = {}) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", name);

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  return element;
}

function createStaticFallback(modelName, copy, panelId) {
  const svg = createSvgElement("svg", {
    class: "model-accessibility__fallback-svg",
    viewBox: "0 0 320 132",
    role: "img",
    "aria-labelledby": `${panelId}-fallback-title ${panelId}-fallback-desc`
  });
  const title = createSvgElement("title", { id: `${panelId}-fallback-title` });
  const desc = createSvgElement("desc", { id: `${panelId}-fallback-desc` });
  const grid = createSvgElement("g", { class: "model-accessibility__fallback-grid" });
  const path = createSvgElement("path", {
    class: "model-accessibility__fallback-path",
    d: "M18 94 C58 44 88 46 116 72 S176 106 214 56 S272 34 304 74"
  });
  const nodeGroup = createSvgElement("g", { class: "model-accessibility__fallback-nodes" });

  title.textContent = `${copy.fallbackTitle}: ${modelName}`;
  desc.textContent = copy.fallbackDescription;

  for (let x = 36; x <= 288; x += 36) {
    grid.append(createSvgElement("line", { x1: String(x), y1: "18", x2: String(x), y2: "114" }));
  }

  for (let y = 30; y <= 102; y += 24) {
    grid.append(createSvgElement("line", { x1: "18", y1: String(y), x2: "302", y2: String(y) }));
  }

  [
    [58, 44],
    [116, 72],
    [176, 106],
    [214, 56],
    [272, 34]
  ].forEach(([cx, cy]) => {
    nodeGroup.append(createSvgElement("circle", { cx: String(cx), cy: String(cy), r: "6" }));
  });

  svg.append(title, desc, grid, path, nodeGroup);
  return svg;
}

function createParagraph(className, text) {
  const paragraph = document.createElement("p");
  paragraph.className = className;
  paragraph.textContent = text;
  return paragraph;
}

function enhanceVisualAreas(root, modelName, copy, summaryId) {
  const canvases = Array.from(root.querySelectorAll("canvas"));
  const visualAreas = canvases.length > 0 ? canvases : Array.from(root.querySelectorAll(VISUAL_FALLBACK_SELECTOR));

  visualAreas.forEach((area) => {
    if (!area.hasAttribute("tabindex")) {
      area.setAttribute("tabindex", "0");
    }

    if (!area.hasAttribute("role")) {
      area.setAttribute("role", "img");
    }

    if (!area.hasAttribute("aria-label")) {
      area.setAttribute("aria-label", `${copy.visualLabel} ${modelName}`);
    }

    const describedBy = mergeIdRefs(area.getAttribute("aria-describedby"), summaryId);
    area.setAttribute("aria-describedby", describedBy);
  });
}

function createAccessibilityPanel(root, state) {
  if (root.dataset.modelAccessibility === "ready") {
    return null;
  }

  const language = getLanguage(root, state);
  const copy = COPY[language];
  const modelName = getModelName(root, copy);
  const panelId = `model-accessibility-${++nextPanelId}`;
  const summaryId = `${panelId}-summary`;
  const detailsId = `${panelId}-details`;
  const guidanceId = `${panelId}-guidance`;
  const panel = document.createElement("section");
  const header = document.createElement("div");
  const button = document.createElement("button");
  const summary = createParagraph("sr-only model-accessibility__summary", summarizeControls(root, copy, language));
  const visibleSummary = createParagraph("model-accessibility__summary", summary.textContent);
  const details = document.createElement("div");
  const controlsText = createParagraph("model-accessibility__detail-text", copy.controlsText);
  const teachingSummary = getTeachingSummary(root, language);
  const reducedFallback = document.createElement("div");

  panel.className = "model-accessibility";
  panel.setAttribute("aria-label", language === "es" ? `Lectura accesible de ${modelName}` : `Accessible reading for ${modelName}`);
  panel.dataset.modelAccessibilityPanel = "true";

  header.className = "model-accessibility__header";
  button.className = "model-accessibility__button";
  button.type = "button";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", detailsId);
  button.textContent = copy.describe;
  header.append(button);

  summary.id = summaryId;
  summary.setAttribute("aria-live", "polite");
  summary.setAttribute("aria-atomic", "true");
  visibleSummary.hidden = !summary.textContent;

  details.className = "model-accessibility__details";
  details.id = detailsId;
  details.hidden = true;
  controlsText.id = guidanceId;
  details.append(
    visibleSummary,
    createParagraph("model-accessibility__detail-heading", copy.controlsHelp),
    controlsText,
    createParagraph("model-accessibility__detail-heading", language === "es" ? "Qué cambia con los controles" : "What changes with controls"),
    createParagraph("model-accessibility__detail-text", copy.genericExplanation)
  );

  if (teachingSummary) {
    details.append(createParagraph("model-accessibility__detail-text", teachingSummary));
  }

  const fallback = document.createElement("div");
  fallback.className = "model-accessibility__fallback";
  fallback.append(
    createStaticFallback(modelName, copy, panelId),
    createParagraph("model-accessibility__fallback-text", copy.fallbackDescription)
  );
  details.append(fallback);

  reducedFallback.className = "model-accessibility__fallback model-accessibility__fallback--reduced";
  reducedFallback.append(
    createStaticFallback(modelName, copy, `${panelId}-reduced`),
    createParagraph("model-accessibility__fallback-text", `${copy.reducedTitle}: ${copy.reducedText}`)
  );
  details.append(reducedFallback);

  panel.append(header, summary, details);

  button.addEventListener("click", () => {
    const willOpen = details.hidden;
    details.hidden = !willOpen;
    panel.dataset.open = String(willOpen);
    button.setAttribute("aria-expanded", String(willOpen));
    button.textContent = willOpen ? copy.detailsHidden : copy.describe;
  });

  const update = () => {
    updateControlLabels(root, copy, panelId, summaryId, guidanceId);
    summary.textContent = summarizeControls(root, copy, language);
    visibleSummary.textContent = summary.textContent;
    visibleSummary.hidden = !summary.textContent;
  };

  root.addEventListener("input", update);
  root.addEventListener("change", update);
  root.addEventListener("click", () => {
    window.setTimeout(update, 0);
  });

  updateControlLabels(root, copy, panelId, summaryId, guidanceId);
  enhanceVisualAreas(root, modelName, copy, summaryId);
  root.dataset.modelAccessibility = "ready";
  root.setAttribute("aria-describedby", mergeIdRefs(root.getAttribute("aria-describedby"), summaryId, guidanceId));

  return panel;
}

export function enhanceModelAccessibility(root = document, state = {}) {
  root.querySelectorAll(MODEL_SELECTOR).forEach((modelRoot) => {
    const panel = createAccessibilityPanel(modelRoot, state);

    if (!panel) {
      return;
    }

    modelRoot.insertAdjacentElement("afterend", panel);
  });
}
