import { pick } from "./i18n.js";
import { initDoubleSlitSimulators } from "./double-slit-simulator.js?v=20260511-mobile-pinch-zoom";
import { initGravityFabricModels } from "./gravity-fabric-model.js?v=20260514-fabric-clearance-rotation";
import { initGravityLensingModels } from "./gravity-lensing-model.js?v=20260511-mobile-pinch-zoom";
import { initQuantumEntanglementModels } from "./quantum-entanglement-model.js?v=20260511-mobile-pinch-zoom";
import { initQuantumChannelModels } from "./quantum-channel-model.js?v=20260511-mobile-pinch-zoom";
import { initQuantumModels } from "./quantum-model.js?v=20260514-orbital-purple-nucleus";
import { initOrbitalSelectorModels } from "./orbital-selector-model.js?v=20260514-orbital-purple-nucleus";
import { initWormholeModels } from "./wormhole-model.js?v=20260511-mobile-pinch-zoom";
import { initNumericalMethodsModels } from "./numerical-methods-model.js?v=20260511-mobile-pinch-zoom";
import { initNeuralArchitectModels } from "./neural-architect-model.js?v=20260511-mobile-pinch-zoom";
import { initInformationTheoryModels } from "./information-theory-model.js?v=20260511-mobile-pinch-zoom";
import { initAlgorithmVisualizerModels } from "./algorithm-visualizer-model.js?v=20260511-mobile-pinch-zoom";
import { initQuantumFluctuationModels } from "./quantum-fluctuation-model.js?v=20260514-fluctuation-animates";
import { initBlackHoleModels } from "./black-hole-model.js?v=20260511-mobile-pinch-zoom";
import { getCachedDocument, getCachedDocumentNow, hasCachedDocument } from "./content-cache.js?v=20260520-education-secret-wording";

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
    content.siteNoticeSection
  ].find((section) => section?.id === state.activeSection);
  const activeDomain = content.educationDomains.find((domain) => domain.id === state.activeDomain);
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

async function renderMath(host) {
  if (!window.MathJax?.typesetPromise) {
    return;
  }

  if (typeof window.MathJax.typesetClear === "function") {
    window.MathJax.typesetClear([host]);
  }

  await window.MathJax.typesetPromise([host]);
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

function commitStructuredDocument({
  documentNode,
  host,
  state,
  content,
  requestToken,
  returnNavigation,
  onReturnNavigationApplied
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

  host.replaceChildren(imported);
  host.setAttribute("aria-busy", "false");
  const restored = restoreReturnNavigation(host, state, returnNavigation);

  if (restored) {
    onReturnNavigationApplied?.();
  } else {
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
    void renderMath(host).catch(() => null);
  });

  return true;
}

export async function syncStructuredContent({
  state,
  refs,
  content,
  returnNavigation = null,
  onReturnNavigationApplied = null
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
      onReturnNavigationApplied
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
      onReturnNavigationApplied
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
