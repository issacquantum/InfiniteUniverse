import { siteAssets } from "../data/site-assets.js?v=20260531-literal-parenthesis-natural-v1";
import { siteContent } from "../data/site-content.js?v=20260531-literal-parenthesis-natural-v1";
import { createReadingSettingsController } from "./reading-settings.js?v=20260531-literal-parenthesis-natural-v1";
import { initBackground } from "./background.js?v=20260531-literal-parenthesis-natural-v1";
import { refreshIcons } from "./icons.js?v=20260531-literal-parenthesis-natural-v1";
import { pick } from "./i18n.js?v=20260531-literal-parenthesis-natural-v1";
import { syncLegacyContent } from "./legacy-content.js?v=20260531-literal-parenthesis-natural-v1";
import { createMusicController, syncMusicUi } from "./music.js?v=20260531-literal-parenthesis-natural-v1";
import { renderSite } from "./render.js?v=20260531-literal-parenthesis-natural-v1";
import { createState } from "./state.js?v=20260531-literal-parenthesis-natural-v1";
import { syncStructuredContent } from "./structured-content.js?v=20260531-literal-parenthesis-natural-v1";

const refs = {
  siteShell: document.querySelector(".site-shell"),
  titleButton: document.getElementById("site-title"),
  languageToggle: document.getElementById("language-toggle"),
  languageLabel: document.getElementById("language-label"),
  readingSettingsToggle: document.getElementById("reading-settings-toggle"),
  readingSettingsPanel: document.getElementById("reading-settings-panel"),
  statusAnnouncer: document.getElementById("status-announcer"),
  stage: document.getElementById("site-stage"),
  siteInfinity: document.getElementById("site-infinity"),
  socialDock: document.getElementById("social-dock"),
  copyright: document.getElementById("site-copyright"),
  sitePurposeLink: document.getElementById("site-purpose-link"),
  musicButtons: [
    document.getElementById("music-button-mobile"),
    document.getElementById("music-button-desktop")
  ],
  mobileKnowledgeToggle: document.getElementById("mobile-knowledge-toggle"),
  desktopHomeToggle: document.getElementById("desktop-home-toggle"),
  desktopTrackName: document.getElementById("desktop-track-name"),
  backgroundCanvas: document.getElementById("starfield-canvas"),
  galleryLightbox: document.getElementById("gallery-lightbox"),
  galleryLightboxImage: document.getElementById("gallery-lightbox-image"),
  galleryLightboxViewport: document.getElementById("gallery-lightbox-viewport"),
  galleryLightboxPanel: document.querySelector(".gallery-lightbox__panel")
};

const store = createState({
  language: "en",
  titleOpen: false,
  activeSection: null,
  showPersonalSectionList: false,
  activeDomain: null,
  activeTopic: null,
  activeBranch: null,
  activeDetail: null,
  equationReturnTarget: null,
  mobileKnowledgeNavOpen: false,
  mobileKnowledgeNavDomain: null
});

function resolveMusicContext(state) {
  if (state.activeSection === "tekken" || state.activeSection === "practice-worlds") {
    return "tekken";
  }

  return "default";
}

let musicController = null;
let readingSettingsController = null;
let activeMusicContext = resolveMusicContext(store.getState());
let musicUiState = {
  isPlaying: false,
  currentTrackName: ""
};

function syncMobileKnowledgeToggle(state) {
  if (!refs.mobileKnowledgeToggle) {
    return;
  }

  const isOpen = Boolean(state.mobileKnowledgeNavOpen);
  const isSpanish = state.language === "es";
  const label = isOpen
    ? (isSpanish ? "Cerrar menú de ciencia" : "Close science menu")
    : (isSpanish ? "Abrir menú de ciencia" : "Open science menu");
  const title = isSpanish ? "Menú de ciencia" : "Science menu";

  refs.mobileKnowledgeToggle.setAttribute("aria-expanded", String(isOpen));
  refs.mobileKnowledgeToggle.setAttribute("aria-label", label);
  refs.mobileKnowledgeToggle.setAttribute("title", title);
  refs.mobileKnowledgeToggle.innerHTML = `<i data-lucide="${isOpen ? "x" : "menu"}"></i>`;
}

function syncDesktopHomeToggle(state) {
  if (!refs.desktopHomeToggle) {
    return;
  }

  const label = state.language === "es" ? "Inicio" : "Home";

  refs.desktopHomeToggle.setAttribute("aria-label", label);
  refs.desktopHomeToggle.setAttribute("title", label);
}

let galleryItems = [];
let activeGalleryIndex = -1;
let galleryTouchStartX = null;
let galleryTouchStartY = null;
let galleryWheelLockUntil = 0;
let galleryZoomLevel = 0;
let galleryInitialScale = 0.28;
let galleryTriggerWidth = 0;
let lastGalleryTrigger = null;
let lastAnnouncement = "";
let pendingStructuredReturn = null;
let pendingLegacyReturn = null;
let pendingReaderScrollRestoration = null;
let pendingModelScrollTarget = null;
const GALLERY_MAX_ZOOM_LEVEL = 7;

function clearPendingReturnNavigation() {
  pendingStructuredReturn = null;
  pendingLegacyReturn = null;
  pendingReaderScrollRestoration = null;
  pendingModelScrollTarget = null;
}

function clearPendingReaderScrollRestoration() {
  pendingReaderScrollRestoration = null;
}

function clearPendingModelScrollTarget() {
  pendingModelScrollTarget = null;
}

function captureReaderScrollRestoration() {
  const contentWindow = refs.stage.querySelector(".content-window");

  if (!contentWindow) {
    pendingReaderScrollRestoration = null;
    return;
  }

  const state = store.getState();
  const scrollTop = contentWindow.scrollTop;
  const maxScrollTop = Math.max(contentWindow.scrollHeight - contentWindow.clientHeight, 0);

  pendingReaderScrollRestoration = {
    activeSection: state.activeSection ?? null,
    activeDomain: state.activeDomain ?? null,
    activeTopic: state.activeTopic ?? null,
    activeBranch: state.activeBranch ?? null,
    activeDetail: state.activeDetail ?? null,
    scrollTop,
    scrollRatio: maxScrollTop > 0 ? scrollTop / maxScrollTop : 0
  };
}

function getReturnTargetLabel(returnTarget, language) {
  if (!returnTarget) {
    return "";
  }

  const section = [
    ...siteContent.personalSections,
    siteContent.sitePurposeSection
  ].find((item) => item?.id === returnTarget.sectionId);
  const domain = siteContent.knowledgeWorlds.find((item) => item.id === returnTarget.domainId);
  const topic = domain?.topics?.find((item) => item.id === returnTarget.topicId);
  const branchSource = topic ?? section;
  const branch = branchSource?.branches?.find((item) => item.id === returnTarget.branchId);
  const detail = branch?.items?.find((item) => item.id === returnTarget.detailId);

  return pick(detail?.title ?? branch?.title ?? topic?.title ?? section?.title ?? { en: "", es: "" }, language);
}

function createEquationReturnTarget(state) {
  const returnNavigation = pendingStructuredReturn ?? pendingLegacyReturn;

  if (!returnNavigation) {
    return null;
  }

  const returnType = pendingLegacyReturn ? "legacy" : "structured";
  const target = {
    returnType,
    domainId: returnNavigation.domainId ?? null,
    topicId: returnNavigation.topicId ?? null,
    sectionId: returnNavigation.sectionId ?? null,
    branchId: returnNavigation.branchId ?? null,
    detailId: returnNavigation.detailId ?? returnNavigation.itemId ?? null,
    itemId: returnNavigation.itemId ?? null,
    targetItemId: returnNavigation.targetItemId ?? null,
    triggerIndex: returnNavigation.triggerIndex ?? -1,
    scrollTop: returnNavigation.scrollTop ?? 0
  };
  const label = getReturnTargetLabel(target, state.language);

  return {
    ...target,
    label
  };
}

function restoreEquationReturnTarget() {
  store.setState((state) => {
    const target = state.equationReturnTarget;

    if (!target) {
      return state;
    }

    if (target.returnType === "legacy") {
      pendingLegacyReturn = {
        domainId: target.domainId,
        topicId: target.topicId,
        branchId: target.branchId,
        itemId: target.detailId,
        triggerIndex: target.triggerIndex,
        scrollTop: target.scrollTop,
        targetItemId: target.targetItemId
      };
      pendingStructuredReturn = null;
    } else {
      pendingStructuredReturn = {
        domainId: target.domainId,
        topicId: target.topicId,
        sectionId: target.sectionId,
        branchId: target.branchId,
        detailId: target.detailId,
        triggerIndex: target.triggerIndex,
        scrollTop: target.scrollTop,
        itemId: target.itemId
      };
      pendingLegacyReturn = null;
    }

    return {
      ...state,
      titleOpen: false,
      activeSection: target.sectionId,
      showPersonalSectionList: false,
      activeDomain: target.domainId,
      activeTopic: target.topicId,
      activeBranch: target.branchId,
      activeDetail: target.detailId,
      equationReturnTarget: null
    };
  });
}

function getStructuredReturnTargets(root) {
  if (!root) {
    return [];
  }

  return Array.from(root.querySelectorAll("[data-action='select-legacy-item']"));
}

function captureStructuredReturn(actionTarget) {
  const state = store.getState();
  const contentWindow = actionTarget.closest(".content-window");
  const triggers = getStructuredReturnTargets(contentWindow);
  const triggerIndex = triggers.indexOf(actionTarget);

  if (!contentWindow || triggerIndex === -1 || (!state.activeTopic && !state.activeSection)) {
    pendingStructuredReturn = null;
    return;
  }

  pendingStructuredReturn = {
    domainId: state.activeDomain,
    topicId: state.activeTopic,
    sectionId: state.activeSection,
    branchId: state.activeBranch,
    detailId: state.activeDetail,
    triggerIndex,
    scrollTop: contentWindow.scrollTop,
    itemId: actionTarget.dataset.itemId
  };
}

function getLegacyReturnTargets(root) {
  if (!root) {
    return [];
  }

  return Array.from(root.querySelectorAll("[data-action='select-legacy-item']"));
}

function captureLegacyReturn(actionTarget) {
  const state = store.getState();
  const contentWindow = actionTarget.closest(".content-window");
  const legacyRoot = actionTarget.closest(".legacy-content");
  const triggers = getLegacyReturnTargets(legacyRoot);
  const triggerIndex = triggers.indexOf(actionTarget);

  if (
    !contentWindow
    || !legacyRoot
    || triggerIndex === -1
    || !state.activeTopic
    || !state.activeBranch
    || !state.activeDetail
  ) {
    pendingLegacyReturn = null;
    return;
  }

  pendingLegacyReturn = {
    domainId: state.activeDomain,
    topicId: state.activeTopic,
    branchId: state.activeBranch,
    itemId: state.activeDetail,
    triggerIndex,
    scrollTop: contentWindow.scrollTop,
    targetItemId: actionTarget.dataset.itemId
  };
}

function captureReturnNavigation(actionTarget) {
  if (actionTarget.closest(".legacy-content")) {
    captureLegacyReturn(actionTarget);
    return;
  }

  if (actionTarget.closest("[data-structured-host]")) {
    captureStructuredReturn(actionTarget);
    return;
  }

  clearPendingReturnNavigation();
}

function getFocusableElements(container) {
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll(
    "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex='-1'])"
  )).filter((element) => !element.hidden && element.getAttribute("aria-hidden") !== "true");
}

function trapFocus(event, container) {
  if (event.key !== "Tab") {
    return false;
  }

  const focusable = getFocusableElements(container);

  if (focusable.length === 0) {
    event.preventDefault();
    return true;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
    return true;
  }

  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
    return true;
  }

  return false;
}

function isGalleryZoomed() {
  return galleryZoomLevel > 0;
}

function syncGalleryControls() {
  if (!refs.galleryLightbox) {
    return;
  }

  const canNavigate = galleryItems.length > 1 && !isGalleryZoomed();
  const zoomOutDisabled = galleryZoomLevel <= 0;
  const zoomInDisabled = galleryZoomLevel >= GALLERY_MAX_ZOOM_LEVEL;

  refs.galleryLightbox
    .querySelectorAll("[data-gallery-prev], [data-gallery-next]")
    .forEach((button) => {
      button.disabled = !canNavigate;
      button.setAttribute("aria-disabled", String(!canNavigate));
    });

  refs.galleryLightbox
    .querySelectorAll("[data-gallery-zoom-out]")
    .forEach((button) => {
      button.disabled = zoomOutDisabled;
      button.setAttribute("aria-disabled", String(zoomOutDisabled));
    });

  refs.galleryLightbox
    .querySelectorAll("[data-gallery-zoom-in]")
    .forEach((button) => {
      button.disabled = zoomInDisabled;
      button.setAttribute("aria-disabled", String(zoomInDisabled));
    });
}

function syncUi(state = store.getState()) {
  renderSite({
    state,
    refs,
    content: siteContent,
    assets: siteAssets
  });

  syncMusicUi({
    refs,
    isPlaying: musicUiState.isPlaying,
    currentTrackName: musicUiState.currentTrackName
  });

  syncMobileKnowledgeToggle(state);
  syncDesktopHomeToggle(state);

  syncStructuredContent({
    state,
    refs,
    content: siteContent,
    returnNavigation: pendingStructuredReturn,
    onReturnNavigationApplied: clearPendingReturnNavigation,
    scrollRestoration: pendingReaderScrollRestoration,
    onScrollRestorationApplied: clearPendingReaderScrollRestoration,
    modelScrollTarget: pendingModelScrollTarget,
    onModelScrollApplied: clearPendingModelScrollTarget
  });

  syncLegacyContent({
    state,
    refs,
    content: siteContent,
    returnNavigation: pendingLegacyReturn,
    onReturnNavigationApplied: clearPendingReturnNavigation,
    scrollRestoration: pendingReaderScrollRestoration,
    onScrollRestorationApplied: clearPendingReaderScrollRestoration
  });

  readingSettingsController?.syncLanguage(state.language);
  refreshIcons();
}

function getActiveLabel(state) {
  const activeSection = [
    ...siteContent.personalSections,
    siteContent.sitePurposeSection
  ].find((section) => section?.id === state.activeSection);

  const activeDomain = siteContent.knowledgeWorlds.find((domain) => domain.id === state.activeDomain);
  const activeTopic = activeDomain?.topics?.find((topic) => topic.id === state.activeTopic);
  const activeBranch = (
    activeTopic?.branches?.find((branch) => branch.id === state.activeBranch)
    ?? activeSection?.branches?.find((branch) => branch.id === state.activeBranch)
  );
  const activeDetail = activeBranch?.items?.find((item) => item.id === state.activeDetail);

  return (
    pick(activeDetail?.title ?? { en: "", es: "" }, state.language)
    || pick(activeBranch?.title ?? { en: "", es: "" }, state.language)
    || pick(activeSection?.title ?? { en: "", es: "" }, state.language)
    || pick(activeTopic?.title ?? { en: "", es: "" }, state.language)
    || pick(activeDomain?.title ?? { en: "", es: "" }, state.language)
  );
}

function announceNavigation(state) {
  if (!refs.statusAnnouncer) {
    return;
  }

  const activeLabel = getActiveLabel(state);

  if (!activeLabel) {
    return;
  }

  const message = `${pick(siteContent.ui.openedLabel, state.language)}: ${activeLabel}`;

  if (message === lastAnnouncement) {
    return;
  }

  lastAnnouncement = message;
  refs.statusAnnouncer.textContent = "";
  requestAnimationFrame(() => {
    refs.statusAnnouncer.textContent = message;
  });
}

function toggleTitle() {
  clearPendingReturnNavigation();
  store.setState((state) => {
    if (state.titleOpen) {
      return {
        ...state,
        titleOpen: false,
        activeSection: null,
        showPersonalSectionList: false,
        mobileKnowledgeNavOpen: false
      };
    }

    return {
      ...state,
      titleOpen: true,
      activeSection: null,
      showPersonalSectionList: false,
      activeDomain: null,
      activeTopic: null,
      activeBranch: null,
      activeDetail: null,
      equationReturnTarget: null,
      mobileKnowledgeNavOpen: false
    };
  });
}

function showHome() {
  clearPendingReturnNavigation();
  store.setState((state) => ({
    ...state,
    titleOpen: true,
    activeSection: null,
    showPersonalSectionList: false,
    activeDomain: null,
    activeTopic: null,
    activeBranch: null,
    activeDetail: null,
    equationReturnTarget: null,
    mobileKnowledgeNavOpen: false
  }));
}

function selectSection(sectionId) {
  clearPendingReturnNavigation();
  store.setState((state) => {
    if (state.activeSection === sectionId) {
      return {
        ...state,
        titleOpen: false,
        activeSection: null,
        showPersonalSectionList: false,
        activeDomain: null,
        activeTopic: null,
        activeBranch: null,
        activeDetail: null,
        equationReturnTarget: null,
        mobileKnowledgeNavOpen: false
      };
    }

    return {
      ...state,
      titleOpen: true,
      activeSection: sectionId,
      showPersonalSectionList: false,
      activeDomain: null,
      activeTopic: null,
      activeBranch: null,
      activeDetail: null,
      equationReturnTarget: null,
      mobileKnowledgeNavOpen: false
    };
  });
}

function selectDomain(domainId) {
  clearPendingReturnNavigation();
  store.setState((state) => {
    if (state.activeDomain === domainId) {
      return returnToKnowledgeDomain(state, domainId, {
        openMobileMenu: true
      });
    }

    return {
      ...state,
      titleOpen: false,
      activeSection: null,
      showPersonalSectionList: false,
      activeDomain: domainId,
      activeTopic: null,
      activeBranch: null,
      activeDetail: null,
      equationReturnTarget: null,
      mobileKnowledgeNavOpen: false,
      mobileKnowledgeNavDomain: domainId
    };
  });
}

function findDomainIdForTopic(topicId) {
  return siteContent.knowledgeWorlds.find((domain) => (
    domain.topics?.some((topic) => topic.id === topicId)
  ))?.id ?? null;
}

function domainContainsTopic(domainId, topicId) {
  return Boolean(siteContent.knowledgeWorlds.find((domain) => (
    domain.id === domainId
    && domain.topics?.some((topic) => topic.id === topicId)
  )));
}

function returnToKnowledgeDomain(state, domainId, { openMobileMenu = false } = {}) {
  const nextDomainId = domainId ?? state.activeDomain ?? state.mobileKnowledgeNavDomain ?? null;

  return {
    ...state,
    titleOpen: false,
    activeSection: null,
    showPersonalSectionList: false,
    activeDomain: nextDomainId,
    activeTopic: null,
    activeBranch: null,
    activeDetail: null,
    equationReturnTarget: null,
    mobileKnowledgeNavOpen: openMobileMenu,
    mobileKnowledgeNavDomain: nextDomainId
  };
}

function selectTopic(topicId, modelTarget = null) {
  clearPendingReturnNavigation();
  pendingModelScrollTarget = modelTarget
    ? {
      topicId,
      targetId: modelTarget
    }
    : null;

  store.setState((state) => {
    const domainId = domainContainsTopic(state.activeDomain, topicId)
      ? state.activeDomain
      : findDomainIdForTopic(topicId);

    if (state.activeTopic === topicId && !modelTarget) {
      return returnToKnowledgeDomain(state, domainId, {
        openMobileMenu: true
      });
    }

    return {
      ...state,
      titleOpen: false,
      activeSection: null,
      showPersonalSectionList: false,
      activeDomain: domainId,
      activeTopic: topicId,
      activeBranch: null,
      activeDetail: null,
      equationReturnTarget: null,
      mobileKnowledgeNavOpen: false,
      mobileKnowledgeNavDomain: domainId ?? state.mobileKnowledgeNavDomain
    };
  });
}

function selectBranch(branchId) {
  clearPendingReturnNavigation();
  store.setState((state) => {
    if (state.activeBranch === branchId) {
      if (state.activeDetail) {
        return {
          ...state,
          titleOpen: false,
          activeSection: null,
          showPersonalSectionList: false,
          activeDetail: null,
          equationReturnTarget: null,
          mobileKnowledgeNavOpen: false
        };
      }

      return {
        ...state,
        titleOpen: false,
        activeSection: null,
        showPersonalSectionList: false,
        activeBranch: null,
        activeDetail: null,
        equationReturnTarget: null,
        mobileKnowledgeNavOpen: false
      };
    }

    return {
      ...state,
      titleOpen: false,
      activeSection: null,
      showPersonalSectionList: false,
      activeBranch: branchId,
      activeDetail: null,
      equationReturnTarget: null,
      mobileKnowledgeNavOpen: false
    };
  });
}

function selectDetail(itemId) {
  store.setState((state) => {
    if (state.activeDetail === itemId && pendingStructuredReturn) {
      return {
        ...state,
        titleOpen: false,
        activeSection: pendingStructuredReturn.sectionId,
        showPersonalSectionList: false,
        activeDomain: pendingStructuredReturn.domainId,
        activeTopic: pendingStructuredReturn.topicId,
        activeBranch: pendingStructuredReturn.branchId,
        activeDetail: pendingStructuredReturn.detailId,
        equationReturnTarget: null,
        mobileKnowledgeNavOpen: false
      };
    }

    if (
      state.activeDetail === itemId
      && pendingLegacyReturn
    ) {
      return {
        ...state,
        titleOpen: false,
        activeSection: null,
        showPersonalSectionList: false,
        activeDomain: pendingLegacyReturn.domainId,
        activeTopic: pendingLegacyReturn.topicId,
        activeBranch: pendingLegacyReturn.branchId,
        activeDetail: pendingLegacyReturn.itemId,
        equationReturnTarget: null,
        mobileKnowledgeNavOpen: false
      };
    }

    return {
      ...state,
      titleOpen: false,
      activeSection: null,
      showPersonalSectionList: false,
      activeDetail: state.activeDetail === itemId ? null : itemId,
      equationReturnTarget: state.activeDetail === itemId ? null : state.equationReturnTarget,
      mobileKnowledgeNavOpen: false
    };
  });
}

function selectLegacyItem(branchId, itemId) {
  store.setState((state) => {
    const sectionOwnsBranch = siteContent.personalSections.some((section) => (
      section.id === state.activeSection
      && section.branches?.some((branch) => branch.id === branchId)
    ));
    const equationReturnTarget = createEquationReturnTarget(state);

    return {
      ...state,
      titleOpen: false,
      activeSection: sectionOwnsBranch ? state.activeSection : null,
      showPersonalSectionList: false,
      activeBranch: branchId,
      activeDetail: itemId,
      equationReturnTarget,
      mobileKnowledgeNavOpen: false
    };
  });
}

function showMobileSections() {
  clearPendingReturnNavigation();
  store.setState((state) => {
    if (state.activeDomain || state.activeTopic) {
      return returnToKnowledgeDomain(state, state.activeDomain ?? findDomainIdForTopic(state.activeTopic), {
        openMobileMenu: true
      });
    }

    if (state.activeSection) {
      return {
        ...state,
        titleOpen: true,
        activeSection: null,
        activeBranch: null,
        activeDetail: null,
        equationReturnTarget: null,
        mobileKnowledgeNavOpen: false
      };
    }

    return state;
  });
}

function toggleMobileKnowledgeNav() {
  store.setState((state) => {
    const opening = !state.mobileKnowledgeNavOpen;
    const activeScienceDomainId = state.activeDomain
      ?? findDomainIdForTopic(state.activeTopic)
      ?? state.mobileKnowledgeNavDomain
      ?? null;

    if (!opening) {
      return {
        ...state,
        mobileKnowledgeNavOpen: false,
        mobileKnowledgeNavDomain: null
      };
    }

    return {
      ...state,
      titleOpen: false,
      activeSection: null,
      showPersonalSectionList: false,
      activeDomain: activeScienceDomainId,
      activeTopic: null,
      activeBranch: null,
      activeDetail: null,
      equationReturnTarget: null,
      mobileKnowledgeNavOpen: true,
      mobileKnowledgeNavDomain: activeScienceDomainId
    };
  });
}

function toggleMobileKnowledgeDomain(domainId) {
  store.setState((state) => ({
    ...state,
    mobileKnowledgeNavOpen: true,
    mobileKnowledgeNavDomain: state.mobileKnowledgeNavDomain === domainId ? null : domainId
  }));
}

function selectMobileKnowledgeTopic(domainId, topicId) {
  clearPendingReturnNavigation();
  store.setState((state) => {
    if (state.activeDomain === domainId && state.activeTopic === topicId) {
      return returnToKnowledgeDomain(state, domainId, {
        openMobileMenu: true
      });
    }

    return {
      ...state,
      titleOpen: false,
      activeSection: null,
      showPersonalSectionList: false,
      activeDomain: domainId,
      activeTopic: topicId,
      activeBranch: null,
      activeDetail: null,
      equationReturnTarget: null,
      mobileKnowledgeNavOpen: false,
      mobileKnowledgeNavDomain: domainId
    };
  });
}

function toggleLanguage() {
  captureReaderScrollRestoration();
  store.setState((state) => ({
    ...state,
    language: state.language === "en" ? "es" : "en"
  }));
}

function openExternal(id) {
  const isMobileDevice = navigator.userAgentData?.mobile
    ?? /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
  const hasUrl = (value) => typeof value === "string" && value.trim() !== "";

  if (id === "cv" || id === "timeInfinityBook") {
    const documentAsset = id === "cv" ? siteAssets.cv : siteAssets.timeInfinityBook;
    const cvPath = pick(documentAsset.path, store.getState().language);

    if (hasUrl(cvPath)) {
      window.open(cvPath, "_blank", "noopener,noreferrer");
    }

    return;
  }

  const asset = siteAssets.social.find((item) => item.id === id);

  if (asset && hasUrl(asset.url)) {
    if (isMobileDevice) {
      // Use same-tab navigation on phones so iOS/Android can hand off the HTTPS
      // URL to the installed app without leaving behind a blank extra tab.
      window.location.assign(asset.url);
      return;
    }

    window.open(asset.url, "_blank", "noopener,noreferrer");
  }
}

function updateMusicState(nextMusicState) {
  if (
    musicUiState.isPlaying === nextMusicState.isPlaying
    && musicUiState.currentTrackName === nextMusicState.currentTrackName
  ) {
    return;
  }

  musicUiState = {
    isPlaying: nextMusicState.isPlaying,
    currentTrackName: nextMusicState.currentTrackName
  };

  syncMusicUi({
    refs,
    isPlaying: musicUiState.isPlaying,
    currentTrackName: musicUiState.currentTrackName
  });

  refreshIcons();
}

function renderGalleryImage() {
  if (
    !refs.galleryLightbox
    || !refs.galleryLightboxImage
    || activeGalleryIndex < 0
    || activeGalleryIndex >= galleryItems.length
  ) {
    return;
  }

  const activeItem = galleryItems[activeGalleryIndex];
  refs.galleryLightboxImage.src = activeItem.src;
  refs.galleryLightboxImage.alt = activeItem.alt;

  if (refs.galleryLightboxImage.complete && refs.galleryLightboxImage.naturalWidth > 0) {
    applyGalleryZoom(true);
  }
}

function applyGalleryZoom(resetScroll = false) {
  if (!refs.galleryLightboxImage || !refs.galleryLightboxViewport) {
    syncGalleryControls();
    return;
  }

  const naturalWidth = refs.galleryLightboxImage.naturalWidth;
  const naturalHeight = refs.galleryLightboxImage.naturalHeight;
  const viewportWidth = refs.galleryLightboxViewport.clientWidth;
  const viewportHeight = refs.galleryLightboxViewport.clientHeight;

  if (!naturalWidth || !naturalHeight || !viewportWidth || !viewportHeight) {
    syncGalleryControls();
    return;
  }

  const fitScale = Math.min(viewportWidth / naturalWidth, viewportHeight / naturalHeight, 1);
  const aspectRatio = naturalWidth / naturalHeight;
  const presentationBoost = viewportWidth <= 540 && aspectRatio >= 1.65 ? 1.42 : 1;
  const fullscreenWidth = naturalWidth * fitScale * presentationBoost;
  const scaledStartWidth = fullscreenWidth * galleryInitialScale;
  const preferredStartWidth = galleryInitialScale > 0.35
    ? scaledStartWidth
    : (galleryTriggerWidth || scaledStartWidth);
  const initialWidth = Math.min(
    Math.max(preferredStartWidth, 120),
    fullscreenWidth
  );
  const zoomProgress = galleryZoomLevel / GALLERY_MAX_ZOOM_LEVEL;
  const fittedWidth = initialWidth + (fullscreenWidth - initialWidth) * zoomProgress;

  refs.galleryLightbox.style.setProperty("--gallery-zoom", String(zoomProgress));
  refs.galleryLightboxImage.style.width = `${fittedWidth}px`;
  refs.galleryLightboxImage.style.cursor = galleryZoomLevel >= GALLERY_MAX_ZOOM_LEVEL
    ? "zoom-out"
    : "zoom-in";

  if (resetScroll || refs.galleryLightboxViewport.scrollWidth > refs.galleryLightboxViewport.clientWidth) {
    requestAnimationFrame(() => {
      const centeredLeft = Math.max(
        (refs.galleryLightboxViewport.scrollWidth - refs.galleryLightboxViewport.clientWidth) / 2,
        0
      );
      refs.galleryLightboxViewport.scrollTo({ top: 0, left: centeredLeft });
    });
  }

  syncGalleryControls();
}

function setGalleryZoomLevel(nextLevel) {
  galleryZoomLevel = Math.min(Math.max(nextLevel, 0), GALLERY_MAX_ZOOM_LEVEL);
  applyGalleryZoom();
}

function getGalleryTriggerImage(trigger) {
  if (!(trigger instanceof Element)) {
    return null;
  }

  if (trigger.tagName === "IMG") {
    return trigger;
  }

  return trigger.querySelector("img");
}

function openGalleryImage(items, index, trigger = null, initialScale = 0.28) {
  if (!refs.galleryLightbox || !refs.galleryLightboxImage || !Array.isArray(items) || items.length === 0) {
    return;
  }

  lastGalleryTrigger = trigger;
  galleryItems = items;
  activeGalleryIndex = Math.min(Math.max(index, 0), items.length - 1);
  galleryZoomLevel = 0;
  galleryInitialScale = Math.min(Math.max(initialScale, 0.1), 1);
  galleryTriggerWidth = getGalleryTriggerImage(trigger)?.getBoundingClientRect().width ?? 0;
  refs.galleryLightbox.hidden = false;
  document.body.style.overflow = "hidden";
  if (refs.siteShell) {
    refs.siteShell.inert = true;
  }
  renderGalleryImage();
  requestAnimationFrame(() => {
    applyGalleryZoom(true);
  });
  refreshIcons();
  requestAnimationFrame(() => {
    refs.galleryLightbox?.querySelector("[data-gallery-close]")?.focus();
  });
}

function stepGalleryImage(direction) {
  if (isGalleryZoomed() || galleryItems.length < 2 || activeGalleryIndex < 0) {
    return;
  }

  activeGalleryIndex = (activeGalleryIndex + direction + galleryItems.length) % galleryItems.length;
  galleryZoomLevel = 0;
  renderGalleryImage();
  applyGalleryZoom();
}

function closeGalleryImage() {
  if (!refs.galleryLightbox || !refs.galleryLightboxImage) {
    return;
  }

  refs.galleryLightbox.hidden = true;
  refs.galleryLightboxImage.removeAttribute("src");
  refs.galleryLightboxImage.alt = "";
  refs.galleryLightboxImage.style.removeProperty("width");
  galleryItems = [];
  activeGalleryIndex = -1;
  galleryTouchStartX = null;
  galleryTouchStartY = null;
  galleryZoomLevel = 0;
  galleryInitialScale = 0.28;
  galleryTriggerWidth = 0;
  refs.galleryLightbox?.style.removeProperty("--gallery-zoom");
  document.body.style.overflow = "";
  if (refs.siteShell) {
    refs.siteShell.inert = false;
  }
  syncGalleryControls();
  if (lastGalleryTrigger && document.contains(lastGalleryTrigger)) {
    lastGalleryTrigger.focus();
  }
  lastGalleryTrigger = null;
}

function openGalleryFromTrigger(galleryTrigger) {
  const galleryRoot = galleryTrigger.closest(".tekken-gallery");
  const rawInitialScale = Number(galleryRoot?.dataset.galleryInitialScale);
  const initialScale = Number.isFinite(rawInitialScale) ? rawInitialScale : 0.28;
  const galleryTriggers = galleryRoot
    ? Array.from(galleryRoot.querySelectorAll("[data-gallery-trigger]"))
    : [galleryTrigger];
  const nextGalleryItems = galleryTriggers
    .map((trigger) => ({
      src: trigger.dataset.gallerySrc,
      alt: trigger.dataset.galleryAlt ?? ""
    }))
    .filter((item) => typeof item.src === "string" && item.src.trim() !== "");
  const nextIndex = Math.max(galleryTriggers.indexOf(galleryTrigger), 0);
  openGalleryImage(nextGalleryItems, nextIndex, galleryTrigger, initialScale);
}

document.addEventListener("click", (event) => {
  const galleryTrigger = event.target.closest("[data-gallery-trigger]");

  if (galleryTrigger) {
    if (!(event.target instanceof Element) || event.target.tagName !== "IMG") {
      return;
    }

    event.preventDefault();
    openGalleryFromTrigger(galleryTrigger);
    return;
  }

  if (event.target === refs.galleryLightboxImage) {
    event.preventDefault();
    if (galleryZoomLevel >= GALLERY_MAX_ZOOM_LEVEL) {
      closeGalleryImage();
      return;
    }

    setGalleryZoomLevel(galleryZoomLevel + 1);
    return;
  }

  if (event.target.closest("[data-gallery-close]")) {
    event.preventDefault();
    closeGalleryImage();
    return;
  }

  if (event.target.closest("[data-gallery-zoom-in]")) {
    event.preventDefault();
    setGalleryZoomLevel(galleryZoomLevel + 1);
    return;
  }

  if (event.target.closest("[data-gallery-zoom-out]")) {
    event.preventDefault();
    setGalleryZoomLevel(galleryZoomLevel - 1);
    return;
  }

  if (event.target.closest("[data-gallery-prev]")) {
    event.preventDefault();
    stepGalleryImage(-1);
    return;
  }

  if (event.target.closest("[data-gallery-next]")) {
    event.preventDefault();
    stepGalleryImage(1);
    return;
  }

  const actionTarget = event.target.closest("[data-action]");

  if (actionTarget) {
    const { action } = actionTarget.dataset;

    if (action === "select-section") {
      const nextSectionId = actionTarget.dataset.sectionId;

      selectSection(nextSectionId);
      return;
    }

    if (action === "select-domain") {
      selectDomain(actionTarget.dataset.domainId);
      return;
    }

    if (action === "select-topic") {
      selectTopic(actionTarget.dataset.topicId, actionTarget.dataset.modelTarget ?? null);
      return;
    }

    if (action === "toggle-mobile-knowledge-nav") {
      toggleMobileKnowledgeNav();
      return;
    }

    if (action === "show-home") {
      showHome();
      return;
    }

    if (action === "toggle-mobile-knowledge-domain") {
      toggleMobileKnowledgeDomain(actionTarget.dataset.domainId);
      return;
    }

    if (action === "select-mobile-knowledge-topic") {
      selectMobileKnowledgeTopic(actionTarget.dataset.domainId, actionTarget.dataset.topicId);
      return;
    }

    if (action === "select-branch") {
      selectBranch(actionTarget.dataset.branchId);
      return;
    }

    if (action === "select-detail") {
      selectDetail(actionTarget.dataset.itemId);
      return;
    }

    if (action === "select-legacy-item") {
      captureReturnNavigation(actionTarget);
      selectLegacyItem(actionTarget.dataset.branchId, actionTarget.dataset.itemId);
      return;
    }

    if (action === "show-mobile-sections") {
      showMobileSections();
      return;
    }

    if (action === "return-to-origin") {
      restoreEquationReturnTarget();
      return;
    }

    if (action === "open-external") {
      openExternal(actionTarget.dataset.externalId);
      return;
    }
  }

  if (event.target.closest("#site-title")) {
    toggleTitle();
    return;
  }

  if (event.target.closest("#language-toggle")) {
    toggleLanguage();
  }
});

document.addEventListener("keydown", (event) => {
  if (
    event.target instanceof Element
    && event.target.matches("[data-gallery-trigger]")
    && (event.key === "Enter" || event.key === " ")
  ) {
    event.preventDefault();
    openGalleryFromTrigger(event.target);
    return;
  }

  if (refs.galleryLightbox?.hidden === false && trapFocus(event, refs.galleryLightboxPanel)) {
    return;
  }

  if (event.key === "Escape") {
    closeGalleryImage();
    return;
  }

  if (refs.galleryLightbox?.hidden === false && event.key === "ArrowLeft") {
    if (isGalleryZoomed()) {
      return;
    }

    event.preventDefault();
    stepGalleryImage(-1);
    return;
  }

  if (refs.galleryLightbox?.hidden === false && event.key === "ArrowRight") {
    if (isGalleryZoomed()) {
      return;
    }

    event.preventDefault();
    stepGalleryImage(1);
    return;
  }

  if (refs.galleryLightbox?.hidden === false && event.key === "+") {
    event.preventDefault();
    setGalleryZoomLevel(galleryZoomLevel + 1);
    return;
  }

  if (refs.galleryLightbox?.hidden === false && event.key === "-") {
    event.preventDefault();
    setGalleryZoomLevel(galleryZoomLevel - 1);
  }
});

refs.galleryLightbox?.addEventListener("touchstart", (event) => {
  const touch = event.touches[0];

  if (!touch) {
    return;
  }

  galleryTouchStartX = touch.clientX;
  galleryTouchStartY = touch.clientY;
}, { passive: true });

refs.galleryLightbox?.addEventListener("touchend", (event) => {
  if (galleryTouchStartX === null || galleryTouchStartY === null) {
    return;
  }

  const touch = event.changedTouches[0];

  if (!touch) {
    galleryTouchStartX = null;
    galleryTouchStartY = null;
    return;
  }

  const deltaX = touch.clientX - galleryTouchStartX;
  const deltaY = touch.clientY - galleryTouchStartY;

  galleryTouchStartX = null;
  galleryTouchStartY = null;

  if (isGalleryZoomed()) {
    return;
  }

  if (Math.abs(deltaX) < 42 || Math.abs(deltaX) <= Math.abs(deltaY)) {
    return;
  }

  stepGalleryImage(deltaX > 0 ? -1 : 1);
}, { passive: true });

refs.galleryLightbox?.addEventListener("wheel", (event) => {
  if (refs.galleryLightbox?.hidden !== false) {
    return;
  }

  const absDeltaX = Math.abs(event.deltaX);
  const absDeltaY = Math.abs(event.deltaY);
  const isHorizontalIntent = absDeltaX > absDeltaY || (event.shiftKey && absDeltaY > 10);

  if (isGalleryZoomed()) {
    return;
  }

  const now = Date.now();

  if (now < galleryWheelLockUntil) {
    return;
  }

  if (!isHorizontalIntent) {
    return;
  }

  const delta = absDeltaX > absDeltaY ? event.deltaX : event.deltaY;

  if (Math.abs(delta) < 18) {
    return;
  }

  event.preventDefault();
  galleryWheelLockUntil = now + 260;
  stepGalleryImage(delta > 0 ? 1 : -1);
}, { passive: false });

refs.galleryLightboxImage?.addEventListener("load", () => {
  if (refs.galleryLightbox?.hidden === false) {
    applyGalleryZoom(true);
  }
});

window.addEventListener("resize", () => {
  if (refs.galleryLightbox?.hidden === false) {
    applyGalleryZoom();
  }
});

store.subscribe((state) => {
  syncUi(state);
  announceNavigation(state);
  const nextMusicContext = resolveMusicContext(state);

  if (nextMusicContext !== activeMusicContext) {
    activeMusicContext = nextMusicContext;
    musicController?.setContext(nextMusicContext);
  }
});

musicController = createMusicController({
  refs,
  assets: siteAssets,
  onStateChange: updateMusicState
});

readingSettingsController = createReadingSettingsController({
  refs,
  content: siteContent,
  language: store.getState().language
});

musicController.setContext(activeMusicContext);
syncUi();
initBackground(refs.backgroundCanvas);

if (!window.lucide) {
  window.addEventListener("load", refreshIcons, { once: true });
}
