import { pick } from "./i18n.js?v=20260524-authorized-text-colors-v1";

const STORAGE_KEY = "issac-tabares-reading-settings";

function prefersReducedMotion() {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

function prefersHighContrast() {
  return Boolean(window.matchMedia?.("(prefers-contrast: more)").matches);
}

function getDefaultPreferences() {
  return {
    textSize: "default",
    readingMode: false,
    reducedMotion: prefersReducedMotion(),
    highContrast: prefersHighContrast(),
    mediaNotes: false,
    readableFont: false,
    linkVisibility: false
  };
}

function normalizePreferences(rawValue) {
  const defaults = getDefaultPreferences();
  const textSize = typeof rawValue?.textSize === "string" && ["default", "large", "x-large"].includes(rawValue.textSize)
    ? rawValue.textSize
    : defaults.textSize;

  return {
    textSize,
    readingMode: Boolean(rawValue?.readingMode),
    reducedMotion: Boolean(rawValue?.reducedMotion),
    highContrast: Boolean(rawValue?.highContrast),
    mediaNotes: Boolean(rawValue?.mediaNotes),
    readableFont: Boolean(rawValue?.readableFont),
    linkVisibility: Boolean(rawValue?.linkVisibility)
  };
}

function loadPreferences() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return getDefaultPreferences();
    }

    return normalizePreferences(JSON.parse(stored));
  } catch (_error) {
    return getDefaultPreferences();
  }
}

function persistPreferences(preferences) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (_error) {
    // Ignore persistence failures so the UI keeps working.
  }
}

function applyPreferences(preferences) {
  document.body.dataset.textSize = preferences.textSize;
  document.body.dataset.readingMode = preferences.readingMode ? "on" : "off";
  document.body.dataset.motion = preferences.reducedMotion ? "reduced" : "default";
  document.body.dataset.contrast = preferences.highContrast ? "high" : "default";
  document.body.dataset.mediaNotes = preferences.mediaNotes ? "on" : "off";
  document.body.dataset.readableFont = preferences.readableFont ? "on" : "off";
  document.body.dataset.linkVisibility = preferences.linkVisibility ? "enhanced" : "default";
}

function syncControlState(panel, preferences) {
  if (!panel) {
    return;
  }

  panel.querySelectorAll("[data-reading-settings-setting='textSize']").forEach((button) => {
    const isActive = button.dataset.value === preferences.textSize;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  panel.querySelectorAll("[data-reading-settings-toggle-setting]").forEach((button) => {
    const key = button.dataset.readingSettingsToggleSetting;
    const isActive = Boolean(preferences[key]);
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function syncCopy(toggleButton, panel, ui, language) {
  if (toggleButton) {
    toggleButton.setAttribute("aria-label", pick(ui.readingSettingsButtonLabel, language));
  }

  document.getElementById("skip-link")?.replaceChildren(document.createTextNode(pick(ui.skipToContent, language)));

  if (!panel) {
    return;
  }

  const copyMap = {
    title: ui.readingSettingsTitle,
    description: ui.readingSettingsDescription,
    textSizeLabel: ui.readingSettingsTextSizeLabel,
    textSizeDefault: ui.readingSettingsTextSizeDefault,
    textSizeLarge: ui.readingSettingsTextSizeLarge,
    textSizeXLarge: ui.readingSettingsTextSizeXLarge,
    readingModeLabel: ui.readingSettingsReadingModeLabel,
    reducedMotionLabel: ui.readingSettingsReducedMotionLabel,
    highContrastLabel: ui.readingSettingsHighContrastLabel,
    mediaNotesLabel: ui.readingSettingsMediaNotesLabel,
    readableFontLabel: ui.readingSettingsReadableFontLabel,
    linkVisibilityLabel: ui.readingSettingsLinkVisibilityLabel,
    resetLabel: ui.readingSettingsResetLabel
  };

  panel.querySelectorAll("[data-reading-settings-copy]").forEach((node) => {
    const key = node.dataset.readingSettingsCopy;
    const value = copyMap[key];

    if (!value) {
      return;
    }

    node.textContent = pick(value, language);
  });
}

function getFocusableElements(container) {
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll(
    "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
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

function announce(refs, message) {
  if (!refs.statusAnnouncer || !message) {
    return;
  }

  refs.statusAnnouncer.textContent = "";
  requestAnimationFrame(() => {
    refs.statusAnnouncer.textContent = message;
  });
}

export function createReadingSettingsController({ refs, content, language }) {
  const toggleButton = refs.readingSettingsToggle;
  const panel = refs.readingSettingsPanel;

  if (!toggleButton || !panel) {
    return {
      syncLanguage() {}
    };
  }

  let preferences = loadPreferences();
  let isOpen = false;
  let lastFocusedElement = null;

  function closePanel({ restoreFocus = true } = {}) {
    isOpen = false;
    panel.hidden = true;
    toggleButton.setAttribute("aria-expanded", "false");
    if (refs.siteShell) {
      refs.siteShell.inert = false;
    }
    if (!restoreFocus) {
      return;
    }
    const focusTarget = lastFocusedElement && document.contains(lastFocusedElement)
      ? lastFocusedElement
      : toggleButton;
    focusTarget?.focus();
  }

  function openPanel() {
    lastFocusedElement = document.activeElement;
    isOpen = true;
    panel.hidden = false;
    toggleButton.setAttribute("aria-expanded", "true");
    if (refs.siteShell) {
      refs.siteShell.inert = true;
    }
    requestAnimationFrame(() => {
      getFocusableElements(panel)[0]?.focus();
    });
  }

  function togglePanel() {
    if (isOpen) {
      closePanel();
      return;
    }

    openPanel();
  }

  function updatePreferences(nextPreferences, announcement) {
    preferences = normalizePreferences(nextPreferences);
    applyPreferences(preferences);
    persistPreferences(preferences);
    syncControlState(panel, preferences);
    announce(refs, announcement);
  }

  toggleButton.addEventListener("click", (event) => {
    event.preventDefault();
    togglePanel();
  });

  panel.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-reading-settings]")) {
      closePanel({ restoreFocus: false });
      return;
    }

    const sizeButton = event.target.closest("[data-reading-settings-setting='textSize']");

    if (sizeButton) {
      event.preventDefault();
      updatePreferences({
        ...preferences,
        textSize: sizeButton.dataset.value
      }, sizeButton.textContent.trim());
      return;
    }

    const toggleSettingButton = event.target.closest("[data-reading-settings-toggle-setting]");

    if (toggleSettingButton) {
      event.preventDefault();
      const key = toggleSettingButton.dataset.readingSettingsToggleSetting;
      const nextValue = !preferences[key];
      updatePreferences({
        ...preferences,
        [key]: nextValue
      }, toggleSettingButton.textContent.trim());
      return;
    }

    if (event.target.closest("[data-reading-settings-reset]")) {
      event.preventDefault();
      updatePreferences(getDefaultPreferences(), event.target.textContent.trim());
    }
  });

  document.addEventListener("click", (event) => {
    if (!isOpen) {
      return;
    }

    if (panel.contains(event.target) || toggleButton.contains(event.target)) {
      return;
    }

    closePanel();
  });

  document.addEventListener("keydown", (event) => {
    if (isOpen && trapFocus(event, panel)) {
      return;
    }

    if (event.key === "Escape") {
      closePanel();
    }
  });

  applyPreferences(preferences);
  syncControlState(panel, preferences);
  syncCopy(toggleButton, panel, content.ui, language);

  return {
    syncLanguage(nextLanguage) {
      syncCopy(toggleButton, panel, content.ui, nextLanguage);
    }
  };
}
