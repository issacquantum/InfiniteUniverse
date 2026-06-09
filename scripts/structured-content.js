import { pick } from "./i18n.js?v=20260608-spanish-bound-cleanup-v1";
import { initDoubleSlitSimulators } from "./double-slit-simulator.js?v=20260608-spanish-bound-cleanup-v1";
import { initGravityFabricModels } from "./gravity-fabric-model.js?v=20260608-spanish-bound-cleanup-v1";
import { initGravityLensingModels } from "./gravity-lensing-model.js?v=20260608-spanish-bound-cleanup-v1";
import { initQuantumEntanglementModels } from "./quantum-entanglement-model.js?v=20260608-spanish-bound-cleanup-v1";
import { initQuantumChannelModels } from "./quantum-channel-model.js?v=20260608-spanish-bound-cleanup-v1";
import { initQuantumModels } from "./quantum-model.js?v=20260608-spanish-bound-cleanup-v1";
import { initOrbitalSelectorModels } from "./orbital-selector-model.js?v=20260608-spanish-bound-cleanup-v1";
import { initWormholeModels } from "./wormhole-model.js?v=20260608-spanish-bound-cleanup-v1";
import { initNumericalMethodsModels } from "./numerical-methods-model.js?v=20260608-spanish-bound-cleanup-v1";
import { initNeuralArchitectModels } from "./neural-architect-model.js?v=20260608-spanish-bound-cleanup-v1";
import { initInformationTheoryModels } from "./information-theory-model.js?v=20260608-spanish-bound-cleanup-v1";
import { initAlgorithmVisualizerModels } from "./algorithm-visualizer-model.js?v=20260608-spanish-bound-cleanup-v1";
import { initQuantumFluctuationModels } from "./quantum-fluctuation-model.js?v=20260608-spanish-bound-cleanup-v1";
import { initBlackHoleModels } from "./black-hole-model.js?v=20260608-spanish-bound-cleanup-v1";
import { initFoundationModels } from "./foundation-models.js?v=20260608-spanish-bound-cleanup-v1";
import { enhanceModelAccessibility } from "./model-accessibility.js?v=20260608-spanish-bound-cleanup-v1";
import { fitEquationBlocks } from "./equation-fit.js?v=20260608-spanish-bound-cleanup-v1";
import { getCachedDocument, getCachedDocumentNow, hasCachedDocument } from "./content-cache.js?v=20260608-spanish-bound-cleanup-v1";
import { decorateModelBadges, syncReadingConstellation } from "./creative-effects.js?v=20260608-spanish-bound-cleanup-v1";

let activeRequestToken = 0;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getActiveStructuredSource(content, state) {
  const activeSection = [
    ...content.personalSections,
    content.sitePurposeSection
  ].find((section) => section?.id === state.activeSection);
  const activeDomain = content.knowledgeWorlds.find((domain) => domain.id === state.activeDomain);
  const activeTopic = activeDomain?.topics?.find((topic) => topic.id === state.activeTopic);
  const activeBranch = (
    activeTopic?.branches?.find((branch) => branch.id === state.activeBranch)
    ?? activeSection?.branches?.find((branch) => branch.id === state.activeBranch)
  );
  const activeDetail = activeBranch?.items?.find((item) => item.id === state.activeDetail);

  if (activeDetail?.contentFile) {
    return activeDetail.contentFile;
  }

  if (activeSection?.contentFile) {
    return activeSection.contentFile;
  }

  if (activeTopic?.contentFile) {
    return activeTopic.contentFile;
  }

  if (activeTopic?.branches || !activeTopic?.contentFile) {
    return null;
  }

  return activeTopic.contentFile;
}

function extractStructuredFragment(documentNode) {
  return (
    documentNode.querySelector("[data-structured-content]")
    ?? documentNode.querySelector(".structured-content")
    ?? null
  );
}

function normalizeAttributeValue(value) {
  return String(value).replace(/[\u0000-\u001F\u007F\s]+/g, "");
}

function isSafeHref(value) {
  const normalized = normalizeAttributeValue(value);

  if (!normalized) {
    return false;
  }

  if (normalized.startsWith("#")) {
    return true;
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(normalized)) {
    return /^(https?:|mailto:|tel:)/i.test(normalized);
  }

  return !normalized.startsWith("//");
}

function isSafeSrc(value) {
  const normalized = normalizeAttributeValue(value);

  if (!normalized) {
    return false;
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(normalized)) {
    return /^https?:/i.test(normalized);
  }

  return !normalized.startsWith("//");
}

function isAllowedIframeSource(value) {
  try {
    const url = new URL(value, window.location.href);
    return (
      url.origin === "https://www.youtube-nocookie.com"
      && url.pathname.startsWith("/embed/")
    );
  } catch (_error) {
    return false;
  }
}

function sanitizeStructuredContent(sourceNode) {
  const imported = document.importNode(sourceNode, true);

  imported.querySelectorAll("script, style, canvas, meta, base, link, object, embed, form").forEach((element) => element.remove());
  [imported, ...imported.querySelectorAll("*")].forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value;

      if (name === "style" || name === "srcdoc" || name.startsWith("on")) {
        element.removeAttribute(attribute.name);
        return;
      }

      if (name === "href" && !isSafeHref(value)) {
        element.removeAttribute(attribute.name);
        return;
      }

      if (name === "src") {
        if (element.tagName === "IFRAME") {
          if (!isAllowedIframeSource(value)) {
            element.remove();
            return;
          }
        } else if (!isSafeSrc(value)) {
          element.removeAttribute(attribute.name);
          return;
        }
      }

      if ((name === "action" || name === "formaction") && !isSafeHref(value)) {
        element.removeAttribute(attribute.name);
      }
    });

    if (element.tagName === "A" && element.getAttribute("target") === "_blank") {
      element.setAttribute("rel", "noopener noreferrer");
    }

    if (element.tagName === "IMG") {
      element.setAttribute("loading", element.getAttribute("loading") || "lazy");
      element.setAttribute("decoding", element.getAttribute("decoding") || "async");
    }

    if (element.tagName === "IFRAME") {
      element.setAttribute("loading", element.getAttribute("loading") || "lazy");
    }
  });

  return imported;
}

function makeGlossariesCollapsible(root, state) {
  if (state.activeSection === "personal-cosmology") {
    return;
  }

  root.querySelectorAll("section.glossary-section").forEach((section) => {
    if (section.querySelector(":scope > .glossary-disclosure")) {
      return;
    }

    const heading = section.querySelector(":scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6");

    if (!heading) {
      return;
    }

    const details = document.createElement("details");
    const summary = document.createElement("summary");
    const body = document.createElement("div");

    details.className = "glossary-disclosure";
    summary.className = "glossary-disclosure__summary";
    body.className = "glossary-disclosure__body";
    heading.classList.add("glossary-disclosure__heading");

    heading.replaceWith(details);
    summary.append(heading);
    details.append(summary, body);

    while (details.nextSibling) {
      body.append(details.nextSibling);
    }
  });
}

async function renderMath(host) {
  if (!window.MathJax?.typesetPromise) {
    return;
  }

  if (typeof window.MathJax.typesetClear === "function") {
    window.MathJax.typesetClear([host]);
  }

  await window.MathJax.typesetPromise([host]);
  fitEquationBlocks(host);
}

function afterContentPaint(callback) {
  requestAnimationFrame(() => {
    requestAnimationFrame(callback);
  });
}

function focusLoadedContent(host) {
  const target = host.querySelector("h1, h2, h3, [data-structured-content]") ?? host.closest(".content-window");

  if (!target) {
    return;
  }

  if (!target.hasAttribute("tabindex")) {
    target.setAttribute("tabindex", "-1");
  }

  requestAnimationFrame(() => {
    target.focus({ preventScroll: true });
  });
}

function cssEscape(value) {
  return window.CSS?.escape
    ? window.CSS.escape(value)
    : String(value).replace(/["\\]/g, "\\$&");
}

function matchesModelScrollTarget(state, modelScrollTarget) {
  return Boolean(
    modelScrollTarget?.targetId
    && state.activeTopic === modelScrollTarget.topicId
    && !state.activeDetail
  );
}

function applyModelScrollTarget(host, state, modelScrollTarget) {
  if (!matchesModelScrollTarget(state, modelScrollTarget)) {
    return false;
  }

  const target = host.querySelector(`[data-model-target="${cssEscape(modelScrollTarget.targetId)}"]`);
  const contentWindow = host.closest(".content-window");

  if (!target || !contentWindow) {
    return false;
  }

  if (!target.hasAttribute("tabindex")) {
    target.setAttribute("tabindex", "-1");
  }

  requestAnimationFrame(() => {
    const targetBounds = target.getBoundingClientRect();
    const windowBounds = contentWindow.getBoundingClientRect();
    const topOffset = targetBounds.top - windowBounds.top + contentWindow.scrollTop;
    const breathingRoom = Math.max(48, contentWindow.clientHeight * 0.14);

    contentWindow.scrollTo({
      top: Math.max(topOffset - breathingRoom, 0),
      behavior: "auto"
    });
    target.focus({ preventScroll: true });
  });

  return true;
}

function getStructuredReturnTargets(root) {
  if (!root) {
    return [];
  }

  return Array.from(root.querySelectorAll("[data-action='select-legacy-item']"));
}

function restoreReturnNavigation(host, state, returnNavigation) {
  const sameOrigin = returnNavigation?.topicId
    ? state.activeTopic === returnNavigation.topicId
    : state.activeSection === returnNavigation?.sectionId;
  const sameDetail = (state.activeDetail ?? null) === (returnNavigation?.detailId ?? null);

  if (!returnNavigation || !sameOrigin || !sameDetail) {
    return false;
  }

  const contentWindow = host.closest(".content-window");

  if (!contentWindow) {
    return false;
  }

  const triggers = getStructuredReturnTargets(host);
  const target = triggers[returnNavigation.triggerIndex]
    ?? triggers.find((element) => element.dataset.itemId === returnNavigation.itemId);

  if (!target) {
    return false;
  }

  requestAnimationFrame(() => {
    contentWindow.scrollTop = returnNavigation.scrollTop;
    target.focus({ preventScroll: true });
  });

  return true;
}

function matchesReaderState(state, scrollRestoration) {
  return Boolean(scrollRestoration)
    && (state.activeSection ?? null) === scrollRestoration.activeSection
    && (state.activeDomain ?? null) === scrollRestoration.activeDomain
    && (state.activeTopic ?? null) === scrollRestoration.activeTopic
    && (state.activeBranch ?? null) === scrollRestoration.activeBranch
    && (state.activeDetail ?? null) === scrollRestoration.activeDetail;
}

function restoreReaderScroll(host, state, scrollRestoration) {
  if (!matchesReaderState(state, scrollRestoration)) {
    return false;
  }

  const contentWindow = host.closest(".content-window");

  if (!contentWindow) {
    return false;
  }

  const maxScrollTop = Math.max(contentWindow.scrollHeight - contentWindow.clientHeight, 0);
  const fallbackScrollTop = maxScrollTop * (scrollRestoration.scrollRatio ?? 0);
  const targetScrollTop = scrollRestoration.scrollTop ?? fallbackScrollTop;

  requestAnimationFrame(() => {
    const nextMaxScrollTop = Math.max(contentWindow.scrollHeight - contentWindow.clientHeight, 0);
    contentWindow.scrollTop = Math.min(Math.max(targetScrollTop, 0), nextMaxScrollTop);
  });

  return true;
}

function commitStructuredDocument({
  documentNode,
  host,
  state,
  content,
  requestToken,
  returnNavigation,
  onReturnNavigationApplied,
  scrollRestoration,
  onScrollRestorationApplied,
  modelScrollTarget,
  onModelScrollApplied
}) {
  if (requestToken !== activeRequestToken) {
    return false;
  }

  const extracted = extractStructuredFragment(documentNode);

  if (!extracted) {
    host.setAttribute("aria-busy", "false");
    host.innerHTML = `<p class="content-placeholder" role="status">${escapeHtml(pick(content.ui.contentUnavailable, state.language))}</p>`;
    return true;
  }

  const imported = sanitizeStructuredContent(extracted);
  imported.lang = state.language;
  makeGlossariesCollapsible(imported, state);

  host.replaceChildren(imported);
  decorateModelBadges(host, state.language);
  syncReadingConstellation(host, state.language);
  host.setAttribute("aria-busy", "false");
  const restored = restoreReturnNavigation(host, state, returnNavigation);
  const shouldApplyModelScroll = matchesModelScrollTarget(state, modelScrollTarget);

  if (restored) {
    onReturnNavigationApplied?.();
  } else if (!shouldApplyModelScroll && restoreReaderScroll(host, state, scrollRestoration)) {
    onScrollRestorationApplied?.();
  } else if (!shouldApplyModelScroll) {
    focusLoadedContent(host);
  }

  afterContentPaint(() => {
    if (requestToken !== activeRequestToken) {
      return;
    }

    initDoubleSlitSimulators(host);
    initGravityFabricModels(host);
    initGravityLensingModels(host);
    initWormholeModels(host);
    initQuantumEntanglementModels(host);
    initQuantumChannelModels(host);
    initOrbitalSelectorModels(host);
    initNumericalMethodsModels(host);
    initNeuralArchitectModels(host);
    initInformationTheoryModels(host);
    initAlgorithmVisualizerModels(host);
    initQuantumFluctuationModels(host);
    initBlackHoleModels(host);
    initQuantumModels(host);
    initFoundationModels(host);
    enhanceModelAccessibility(host, state);
    const mathReady = renderMath(host).catch(() => null);

    if (shouldApplyModelScroll) {
      void mathReady.then(() => {
        if (requestToken !== activeRequestToken) {
          return;
        }

        if (applyModelScrollTarget(host, state, modelScrollTarget)) {
          onModelScrollApplied?.();
        } else {
          onModelScrollApplied?.();
          focusLoadedContent(host);
        }
      });
    }
  });

  return true;
}

export async function syncStructuredContent({
  state,
  refs,
  content,
  returnNavigation = null,
  onReturnNavigationApplied = null,
  scrollRestoration = null,
  onScrollRestorationApplied = null,
  modelScrollTarget = null,
  onModelScrollApplied = null
}) {
  const host = refs.stage.querySelector("[data-structured-host]");

  if (!host) {
    return;
  }

  const source = getActiveStructuredSource(content, state);

  if (!source) {
    host.innerHTML = "";
    return;
  }

  const requestToken = ++activeRequestToken;
  const filePath = pick(source, state.language);
  const cachedDocument = getCachedDocumentNow(filePath);

  if (cachedDocument) {
    host.setAttribute("aria-busy", "true");
    commitStructuredDocument({
      documentNode: cachedDocument,
      host,
      state,
      content,
      requestToken,
      returnNavigation,
      onReturnNavigationApplied,
      scrollRestoration,
      onScrollRestorationApplied,
      modelScrollTarget,
      onModelScrollApplied
    });
    return;
  }

  const shouldDelayLoadingPlaceholder = !hasCachedDocument(filePath);
  const hasVisibleContent = host.childElementCount > 0 || host.textContent.trim() !== "";
  let loadingPlaceholderTimer = null;

  host.setAttribute("aria-busy", "true");

  if (shouldDelayLoadingPlaceholder && !hasVisibleContent) {
    loadingPlaceholderTimer = window.setTimeout(() => {
      if (requestToken !== activeRequestToken) {
        return;
      }

      host.innerHTML = `<p class="content-placeholder" role="status">${escapeHtml(pick(content.ui.contentLoading, state.language))}</p>`;
    }, 120);
  }

  try {
    const documentNode = await getCachedDocument(filePath);

    if (requestToken !== activeRequestToken) {
      if (loadingPlaceholderTimer !== null) {
        window.clearTimeout(loadingPlaceholderTimer);
      }
      return;
    }

    if (loadingPlaceholderTimer !== null) {
      window.clearTimeout(loadingPlaceholderTimer);
    }

    commitStructuredDocument({
      documentNode,
      host,
      state,
      content,
      requestToken,
      returnNavigation,
      onReturnNavigationApplied,
      scrollRestoration,
      onScrollRestorationApplied,
      modelScrollTarget,
      onModelScrollApplied
    });
  } catch (_error) {
    if (requestToken !== activeRequestToken) {
      if (loadingPlaceholderTimer !== null) {
        window.clearTimeout(loadingPlaceholderTimer);
      }
      return;
    }

    if (loadingPlaceholderTimer !== null) {
      window.clearTimeout(loadingPlaceholderTimer);
    }

    host.setAttribute("aria-busy", "false");
    if (!hasVisibleContent) {
      host.innerHTML = `<p class="content-placeholder" role="status">${escapeHtml(pick(content.ui.contentUnavailable, state.language))}</p>`;
    }
  }
}
