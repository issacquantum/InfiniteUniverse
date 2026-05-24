import { bigBangLegacyContent } from "../data/legacy-big-bang.js?v=20260524-phone-home-hidden-v1";
import { getCachedDocument, getCachedDocumentNow, hasCachedDocument } from "./content-cache.js?v=20260524-phone-home-hidden-v1";
import { pick } from "./i18n.js?v=20260524-phone-home-hidden-v1";

let activeRequestToken = 0;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getActiveLegacyItem(content, state) {
  const domain = content.knowledgeWorlds.find((entry) => entry.id === state.activeDomain);
  const topic = domain?.topics?.find((entry) => entry.id === state.activeTopic);
  const branch = topic?.branches?.find((entry) => entry.id === state.activeBranch);
  const item = branch?.items?.find((entry) => entry.id === state.activeDetail);

  return item ?? null;
}

async function loadDocument(filePaths) {
  const candidates = Array.isArray(filePaths) ? filePaths : [filePaths];
  let lastError = null;

  for (const filePath of candidates) {
    try {
      return await getCachedDocument(filePath);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Failed to load legacy content.");
}

function createCollectorDocument(documentNode, selector) {
  const source = documentNode.querySelector(selector);
  if (!source) {
    return null;
  }

  return source.cloneNode(true);
}

function extractHistoryIntro(documentNode) {
  const aboutSection = documentNode.querySelector("section.about");
  if (!aboutSection) {
    return null;
  }

  const introRoot = documentNode.createElement("div");
  const heading = aboutSection.querySelector("h2.universe-subtitle");

  let current = heading?.nextElementSibling ?? null;

  while (current && !current.matches("h4.universe-subtitle, .development-notice")) {
    introRoot.appendChild(current.cloneNode(true));
    current = current.nextElementSibling;
  }

  return introRoot;
}

function extractContributorsIntro(documentNode) {
  const aboutSection = documentNode.querySelector("section.about");
  if (!aboutSection) {
    return null;
  }

  const introRoot = documentNode.createElement("div");
  let current = aboutSection.firstElementChild;

  while (current) {
    if (current.matches("section")) {
      break;
    }

    if (!current.matches("a.back-arrow, h2.section-title")) {
      introRoot.appendChild(current.cloneNode(true));
    }

    current = current.nextElementSibling;
  }

  return introRoot;
}

function extractPage(documentNode) {
  const aboutSection = createCollectorDocument(documentNode, "section.about");

  if (!aboutSection) {
    return null;
  }

  aboutSection.querySelectorAll("script, style, canvas").forEach((element) => element.remove());
  aboutSection.querySelector("a.back-arrow")?.remove();
  aboutSection.querySelector("h2.section-title")?.remove();

  return aboutSection;
}

function extractSection(documentNode, sectionId) {
  return createCollectorDocument(documentNode, `section#${sectionId}`);
}

function extractLegacyFragment(documentNode, source) {
  if (source.type === "page") {
    return extractPage(documentNode);
  }

  if (source.type === "section") {
    return extractSection(documentNode, source.sectionId);
  }

  if (source.type === "custom" && source.extractorId === "history-intro") {
    return extractHistoryIntro(documentNode);
  }

  if (source.type === "custom" && source.extractorId === "contributors-intro") {
    return extractContributorsIntro(documentNode);
  }

  return null;
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

function rewriteLink(anchor) {
  const href = anchor.getAttribute("href");

  if (!href) {
    return;
  }

  if (/^(https?:)?\/\//i.test(href)) {
    anchor.setAttribute("target", "_blank");
    anchor.setAttribute("rel", "noopener noreferrer");
    return;
  }

  const normalized = href.startsWith("./") ? href.slice(2) : href;
  const target = bigBangLegacyContent.internalLinkMap[normalized];

  if (target) {
    anchor.setAttribute("href", "#");
    anchor.dataset.action = "select-legacy-item";
    anchor.dataset.branchId = target.branchId;
    anchor.dataset.itemId = target.itemId;
    return;
  }

  anchor.removeAttribute("href");
}

function isStandaloneDisplayEquationParagraph(element) {
  if (!element || element.tagName !== "P") {
    return false;
  }

  const normalized = element.textContent.replace(/\s+/g, " ").trim();
  return normalized.startsWith("$$") && normalized.endsWith("$$");
}

function createEquationLinkWrapper(itemId, title, mathMarkup) {
  const wrapper = document.createElement("div");
  wrapper.className = "equation-link-wrap";

  const button = document.createElement("button");
  button.className = "glass-window equation-link";
  button.type = "button";
  button.dataset.action = "select-legacy-item";
  button.dataset.branchId = "history-of-the-universe-equations";
  button.dataset.itemId = itemId;
  button.setAttribute("aria-label", title);
  button.innerHTML = mathMarkup;

  wrapper.appendChild(button);
  return wrapper;
}

function createLegacyImageTrigger(image, language) {
  image.dataset.galleryTrigger = "";
  image.dataset.gallerySrc = image.getAttribute("src") ?? "";
  image.dataset.galleryAlt = image.getAttribute("alt") ?? "";
  image.tabIndex = 0;
  image.setAttribute("role", "button");
  image.setAttribute(
    "aria-label",
    language === "es"
      ? "Abrir imagen en un visor ampliado con zoom"
      : "Open image in a larger zoomable viewer"
  );
}

function normalizeHistoryImageTriggers(imported, language) {
  imported.querySelectorAll("button[data-gallery-trigger]").forEach((button) => {
    const image = button.querySelector("img");

    if (!image) {
      return;
    }

    createLegacyImageTrigger(image, language);
    button.replaceWith(image);
  });
}

function decorateHistoryImages(imported, language) {
  normalizeHistoryImageTriggers(imported, language);

  imported.querySelectorAll("img").forEach((image) => {
    createLegacyImageTrigger(image, language);
  });
}

function decorateHistoryEquations(imported, legacyItemId) {
  const equationIds = bigBangLegacyContent.historyEquationMap?.[legacyItemId];

  if (!equationIds?.length) {
    return;
  }

  const equationItems = new Map(
    (bigBangLegacyContent.branches.find((branch) => branch.id === "history-of-the-universe-equations")?.items ?? [])
      .map((item) => [item.id, item])
  );

  const displayParagraphs = Array.from(imported.querySelectorAll("p")).filter(isStandaloneDisplayEquationParagraph);

  displayParagraphs.forEach((paragraph, index) => {
    const equationId = equationIds[index];

    if (!equationId) {
      return;
    }

    const equationItem = equationItems.get(equationId);

    if (!equationItem) {
      return;
    }

    paragraph.replaceWith(
      createEquationLinkWrapper(
        equationId,
        pick(equationItem.title, document.documentElement.lang === "es" ? "es" : "en"),
        paragraph.innerHTML.trim()
      )
    );
  });
}

function sanitizeImportedContent(sourceNode, legacyItemId, branchId, language) {
  const imported = document.importNode(sourceNode, true);

  imported.querySelectorAll(".popup-box").forEach((element) => element.remove());
  imported.querySelectorAll(".popup-term").forEach((element) => {
    element.replaceWith(...element.childNodes);
  });

  imported.removeAttribute("style");
  imported.removeAttribute("class");
  imported.removeAttribute("id");

  imported.querySelectorAll("script, style, header, footer, canvas, meta, base, link, object, embed, form").forEach((element) => element.remove());

  imported.querySelectorAll("*").forEach((element) => {
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

      if (name === "src" && !isSafeSrc(value)) {
        element.removeAttribute(attribute.name);
        return;
      }

      if ((name === "action" || name === "formaction") && !isSafeHref(value)) {
        element.removeAttribute(attribute.name);
      }
    });

    element.removeAttribute("style");
    element.removeAttribute("class");
    element.removeAttribute("id");
  });

  imported.querySelectorAll("img").forEach((image) => {
    const currentSource = image.getAttribute("src");

    if (!currentSource) {
      return;
    }

    if (/^https?:\/\//i.test(currentSource)) {
      image.setAttribute("loading", image.getAttribute("loading") || "lazy");
      image.setAttribute("decoding", image.getAttribute("decoding") || "async");
      return;
    }

    const fileName = currentSource.split("/").pop();
    image.setAttribute("src", `Assets2/${fileName}`);
    image.setAttribute("loading", image.getAttribute("loading") || "lazy");
    image.setAttribute("decoding", image.getAttribute("decoding") || "async");
  });

  imported.querySelectorAll("a").forEach(rewriteLink);
  decorateHistoryEquations(imported, legacyItemId);

  if (branchId === "history-of-the-universe") {
    decorateHistoryImages(imported, language);
  }

  if (imported.tagName === "SECTION") {
    const normalizedRoot = document.createElement("div");

    while (imported.firstChild) {
      normalizedRoot.appendChild(imported.firstChild);
    }

    return normalizedRoot;
  }

  return imported;
}

function resolveLegacyFileCandidates(source, language) {
  if (language !== "es") {
    return [source.file];
  }

  const localizedFile = source.file.replace("/big-bang/", "/big-bang-es/");

  if (localizedFile === source.file) {
    return [source.file];
  }

  return [localizedFile, source.file];
}

function createLegacyWrapper(state, language) {
  const wrapper = document.createElement("div");
  wrapper.className = [
    "legacy-content",
    state.activeBranch === "minds-behind-the-big-bang" ? "legacy-content--contributors" : "",
    state.activeBranch === "history-of-the-universe" ? "legacy-content--history" : ""
  ].filter(Boolean).join(" ");
  wrapper.lang = language;
  return wrapper;
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
  const target = host.querySelector("h1, h2, h3, h4, [data-legacy-host]") ?? host.closest(".content-window");

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

function getLegacyReturnTargets(root) {
  if (!root) {
    return [];
  }

  return Array.from(root.querySelectorAll("[data-action='select-legacy-item']"));
}

function restoreReturnNavigation(host, state, returnNavigation) {
  if (
    !returnNavigation
    || state.activeTopic !== returnNavigation.topicId
    || state.activeBranch !== returnNavigation.branchId
    || state.activeDetail !== returnNavigation.itemId
  ) {
    return false;
  }

  const contentWindow = host.closest(".content-window");

  if (!contentWindow) {
    return false;
  }

  const triggers = getLegacyReturnTargets(host);
  const target = triggers[returnNavigation.triggerIndex]
    ?? triggers.find((element) => element.dataset.itemId === returnNavigation.targetItemId);

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

function commitLegacyDocument({
  documentNode,
  legacyItem,
  host,
  state,
  content,
  requestToken,
  returnNavigation,
  onReturnNavigationApplied,
  scrollRestoration,
  onScrollRestorationApplied
}) {
  if (requestToken !== activeRequestToken) {
    return false;
  }

  const extracted = extractLegacyFragment(documentNode, legacyItem.source);

  if (!extracted) {
    host.setAttribute("aria-busy", "false");
    host.innerHTML = `<p class="content-placeholder" role="status">${escapeHtml(pick(content.ui.legacyUnavailable, state.language))}</p>`;
    return true;
  }

  const wrapper = createLegacyWrapper(state, state.language);
  wrapper.appendChild(sanitizeImportedContent(extracted, legacyItem.id, state.activeBranch, state.language));

  host.replaceChildren(wrapper);
  host.setAttribute("aria-busy", "false");
  const restored = restoreReturnNavigation(host, state, returnNavigation);

  if (restored) {
    onReturnNavigationApplied?.();
  } else if (restoreReaderScroll(host, state, scrollRestoration)) {
    onScrollRestorationApplied?.();
  } else {
    focusLoadedContent(host);
  }

  afterContentPaint(() => {
    if (requestToken !== activeRequestToken) {
      return;
    }

    void renderMath(host).catch(() => null);
  });

  return true;
}

export async function syncLegacyContent({
  state,
  refs,
  content,
  returnNavigation = null,
  onReturnNavigationApplied = null,
  scrollRestoration = null,
  onScrollRestorationApplied = null
}) {
  const host = refs.stage.querySelector("[data-legacy-host]");

  if (!host) {
    return;
  }

  const legacyItem = getActiveLegacyItem(content, state);

  if (!legacyItem) {
    host.innerHTML = "";
    return;
  }

  const requestToken = ++activeRequestToken;
  const candidateFiles = resolveLegacyFileCandidates(legacyItem.source, state.language);
  const cachedDocument = candidateFiles.map((filePath) => getCachedDocumentNow(filePath)).find(Boolean);

  if (cachedDocument) {
    host.setAttribute("aria-busy", "true");
    commitLegacyDocument({
      documentNode: cachedDocument,
      legacyItem,
      host,
      state,
      content,
      requestToken,
      returnNavigation,
      onReturnNavigationApplied,
      scrollRestoration,
      onScrollRestorationApplied
    });
    return;
  }

  const shouldDelayLoadingPlaceholder = !candidateFiles.some((filePath) => hasCachedDocument(filePath));
  const hasVisibleContent = host.childElementCount > 0 || host.textContent.trim() !== "";
  let loadingPlaceholderTimer = null;

  host.setAttribute("aria-busy", "true");

  if (shouldDelayLoadingPlaceholder && !hasVisibleContent) {
    loadingPlaceholderTimer = window.setTimeout(() => {
      if (requestToken !== activeRequestToken) {
        return;
      }

      host.innerHTML = `<p class="content-placeholder" role="status">${escapeHtml(pick(content.ui.legacyLoading, state.language))}</p>`;
    }, 120);
  }

  try {
    const documentNode = await loadDocument(candidateFiles);

    if (requestToken !== activeRequestToken) {
      if (loadingPlaceholderTimer !== null) {
        window.clearTimeout(loadingPlaceholderTimer);
      }
      return;
    }

    if (loadingPlaceholderTimer !== null) {
      window.clearTimeout(loadingPlaceholderTimer);
    }

    commitLegacyDocument({
      documentNode,
      legacyItem,
      host,
      state,
      content,
      requestToken,
      returnNavigation,
      onReturnNavigationApplied,
      scrollRestoration,
      onScrollRestorationApplied
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
      host.innerHTML = `<p class="content-placeholder" role="status">${escapeHtml(pick(content.ui.legacyUnavailable, state.language))}</p>`;
    }
  }
}
