import { pick } from "./i18n.js?v=20260607-cosmology-social-indigo-v1";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

function hasConfiguredValue(value) {
  return typeof value === "string" && value.trim() !== "";
}

function resolveSocialIconSource(assets, item) {
  const folder = assets.socialIconFolder;
  const fileName = item.iconFileName;
  const version = assets.socialIconVersion;

  if (!hasConfiguredValue(folder) || !hasConfiguredValue(fileName)) {
    return "";
  }

  const normalizedFolder = folder.endsWith("/") ? folder.slice(0, -1) : folder;
  const versionSuffix = hasConfiguredValue(version) ? `?v=${encodeURIComponent(version)}` : "";
  return `${normalizedFolder}/${fileName}${versionSuffix}`;
}

function renderSocialSphereInner(assets, item) {
  const iconSource = resolveSocialIconSource(assets, item);

  if (iconSource) {
    return `
      <img
        class="social-sphere__icon"
        src="${escapeHtml(iconSource)}"
        alt=""
        aria-hidden="true"
      />
    `;
  }

  return `<span class="sphere-label">${escapeHtml(item.shortLabel)}</span>`;
}

function renderDockItems({ assets, includeDocuments, language }) {
  const items = assets.social.map((item) => `
    <button
      class="glass-sphere social-sphere"
      type="button"
      data-action="open-external"
      data-external-id="${escapeHtml(item.id)}"
      aria-label="${escapeHtml(item.label)}"
      title="${escapeHtml(item.label)}"
    >
      ${renderSocialSphereInner(assets, item)}
    </button>
  `);

  if (includeDocuments) {
    const knowledgeRecordLabel = pick(assets.knowledgeRecord.label, language);
    const timeInfinityWorkLabel = pick(assets.timeInfinityWork.label, language);

    items.push(`
      <button
        class="glass-sphere social-sphere document-sphere"
        type="button"
        data-action="open-external"
        data-external-id="knowledgeRecord"
        aria-label="${escapeHtml(knowledgeRecordLabel)}"
        title="${escapeHtml(knowledgeRecordLabel)}"
      >
        <i data-lucide="file-text"></i>
      </button>
      <button
        class="glass-sphere social-sphere document-sphere time-infinity-work-sphere"
        type="button"
        data-action="open-external"
        data-external-id="timeInfinityWork"
        aria-label="${escapeHtml(timeInfinityWorkLabel)}"
        title="${escapeHtml(timeInfinityWorkLabel)}"
      >
        <i data-lucide="scroll-text"></i>
      </button>
    `);
  }

  return items.join("");
}

function renderSectionButtons(sections, state, language, ui) {
  return `
    <div class="section-grid" role="group" aria-label="${escapeHtml(pick(ui.personalSectionsAria, language))}">
      ${sections.map((section) => `
        <button
          class="${classNames("glass-tab", "section-button", state.activeSection === section.id && "is-active")}"
          type="button"
          data-action="select-section"
          data-section-id="${escapeHtml(section.id)}"
          aria-pressed="${String(state.activeSection === section.id)}"
        >
          ${escapeHtml(pick(section.title, language))}
        </button>
      `).join("")}
    </div>
  `;
}

function renderFocusedPathRow({
  ariaLabel,
  action,
  dataName,
  id,
  label,
  scope,
  closeHint,
  closeAria
}) {
  const buttonLabel = closeAria ? `${label}. ${closeAria}` : label;

  return `
    <div class="${classNames("focused-path-row", scope === "science" && "focused-path-row--science")}" role="group" aria-label="${escapeHtml(ariaLabel)}">
      <button
        class="${classNames("glass-tab", "focused-path-tab", "is-active", scope === "science" && "focused-path-tab--science", closeHint && "focused-path-tab--closable")}"
        type="button"
        data-action="${escapeHtml(action)}"
        ${escapeHtml(dataName)}="${escapeHtml(id)}"
        aria-pressed="true"
        aria-label="${escapeHtml(buttonLabel)}"
        title="${escapeHtml(buttonLabel)}"
      >
        <span class="focused-path-tab__label">${escapeHtml(label)}</span>
        ${closeHint ? `<span class="focused-path-tab__meta">${escapeHtml(closeHint)}</span>` : ""}
        ${closeHint ? `<span class="focused-path-tab__close" aria-hidden="true">×</span>` : ""}
      </button>
    </div>
  `;
}

function renderDomainButtons(domains, state, language, ui) {
  return `
    <div class="tab-row knowledge-worlds-row" role="group" aria-label="${escapeHtml(pick(ui.knowledgeWorldsAria, language))}">
      ${domains.map((domain) => `
        <button
          class="${classNames("glass-tab", state.activeDomain === domain.id && "is-active")}"
          type="button"
          data-action="select-domain"
          data-domain-id="${escapeHtml(domain.id)}"
          aria-pressed="${String(state.activeDomain === domain.id)}"
        >
          ${escapeHtml(pick(domain.title, language))}
        </button>
      `).join("")}
    </div>
  `;
}

function renderTopicButtons(topics, state, language, ui) {
  return `
    <div class="topic-grid" role="group" aria-label="${escapeHtml(pick(ui.topicNavigationAria, language))}">
      ${topics.map((topic) => `
        <button
          class="${classNames("glass-tab", "topic-button", "topic-button--science-member", state.activeTopic === topic.id && "is-active")}"
          type="button"
          data-action="select-topic"
          data-topic-id="${escapeHtml(topic.id)}"
          aria-pressed="${String(state.activeTopic === topic.id)}"
        >
          ${escapeHtml(pick(topic.title, language))}
        </button>
      `).join("")}
    </div>
  `;
}

function renderBranchButtons(branches, state, language, ui) {
  const visibleBranches = branches.filter((branch) => !branch.hidden);
  const isScienceBranchGroup = Boolean(state.activeTopic);

  return `
    <div class="topic-grid branch-grid" role="group" aria-label="${escapeHtml(pick(ui.branchNavigationAria, language))}">
      ${visibleBranches.map((branch) => `
        <button
          class="${classNames("glass-tab", "topic-button", isScienceBranchGroup && "topic-button--science-member", state.activeBranch === branch.id && "is-active")}"
          type="button"
          data-action="select-branch"
          data-branch-id="${escapeHtml(branch.id)}"
          aria-pressed="${String(state.activeBranch === branch.id)}"
        >
          ${escapeHtml(pick(branch.title, language))}
        </button>
      `).join("")}
    </div>
  `;
}

function renderLegacyItemButtons(items, state, language, ui) {
  const isScienceItemGroup = Boolean(state.activeTopic);

  return `
    <div class="topic-grid legacy-item-grid" role="group" aria-label="${escapeHtml(pick(ui.legacyItemNavigationAria, language))}">
      ${items.map((item) => `
        <button
          class="${classNames("glass-tab", "topic-button", isScienceItemGroup && "topic-button--science-member", state.activeDetail === item.id && "is-active")}"
          type="button"
          data-action="select-detail"
          data-item-id="${escapeHtml(item.id)}"
          aria-pressed="${String(state.activeDetail === item.id)}"
        >
          ${escapeHtml(pick(item.title, language))}
        </button>
      `).join("")}
    </div>
  `;
}

function renderMobileReaderNavigation(navigation, language) {
  if (!navigation) {
    return "";
  }

  const labels = {
    back: language === "es" ? "Volver" : "Back",
    previous: language === "es" ? "Anterior" : "Previous",
    all: language === "es" ? "Todas las secciones" : "All Sections",
    next: language === "es" ? "Siguiente" : "Next"
  };

  const renderStepButton = (item, label, direction) => {
    if (!item) {
      return `<span class="mobile-reader-nav__spacer" aria-hidden="true"></span>`;
    }

    const icon = direction === "previous" ? "arrow-left" : "arrow-right";
    const ariaLabel = `${label}: ${item.label}`;

    return `
      <button
        class="${classNames("glass-tab", "mobile-reader-nav__button", "mobile-reader-nav__button--step", `mobile-reader-nav__button--${direction}`)}"
        type="button"
        data-action="${escapeHtml(item.action)}"
        ${escapeHtml(item.dataName)}="${escapeHtml(item.id)}"
        aria-label="${escapeHtml(ariaLabel)}"
        title="${escapeHtml(ariaLabel)}"
      >
        <i data-lucide="${icon}" aria-hidden="true"></i>
      </button>
    `;
  };

  const returnButton = navigation.returnTo
    ? `
      <button
        class="glass-tab mobile-reader-nav__button mobile-reader-nav__button--return"
        type="button"
        data-action="return-to-origin"
      >
        <span class="mobile-reader-nav__label">${escapeHtml(labels.back)}</span>
      </button>
    `
    : "";

  return `
    <nav class="${classNames("mobile-reader-nav", returnButton && "mobile-reader-nav--with-return")}" aria-label="${escapeHtml(labels.all)}">
      ${returnButton}
      <div class="mobile-reader-nav__steps">
        ${renderStepButton(navigation.previous, labels.previous, "previous")}
        <button
          class="glass-tab mobile-reader-nav__button mobile-reader-nav__button--all"
          type="button"
          data-action="show-mobile-sections"
        >
          ${escapeHtml(labels.all)}
        </button>
        ${renderStepButton(navigation.next, labels.next, "next")}
      </div>
    </nav>
  `;
}

function renderMobileReaderTopNavigation(navigation, language) {
  if (!navigation?.previous && !navigation?.next) {
    return "";
  }

  const labels = {
    previous: language === "es" ? "Anterior" : "Previous",
    next: language === "es" ? "Siguiente" : "Next"
  };

  const renderTopButton = (item, label, direction) => {
    if (!item) {
      return `<span class="mobile-reader-top-nav__spacer" aria-hidden="true"></span>`;
    }

    const icon = direction === "previous" ? "arrow-left" : "arrow-right";
    const ariaLabel = `${label}: ${item.label}`;

    return `
      <button
        class="${classNames("glass-sphere", "mobile-reader-top-nav__button", `mobile-reader-top-nav__button--${direction}`)}"
        type="button"
        data-action="${escapeHtml(item.action)}"
        ${escapeHtml(item.dataName)}="${escapeHtml(item.id)}"
        aria-label="${escapeHtml(ariaLabel)}"
        title="${escapeHtml(ariaLabel)}"
      >
        <i data-lucide="${icon}" aria-hidden="true"></i>
      </button>
    `;
  };

  return `
    <nav class="mobile-reader-top-nav" aria-label="${escapeHtml(language === "es" ? "Navegación de lectura" : "Reader navigation")}">
      ${renderTopButton(navigation.previous, labels.previous, "previous")}
      <span class="mobile-reader-top-nav__center" aria-hidden="true"></span>
      ${renderTopButton(navigation.next, labels.next, "next")}
    </nav>
  `;
}

function renderDesktopReaderNavigation(navigation, language, position) {
  if (!navigation?.previous && !navigation?.next) {
    return "";
  }

  const labels = {
    previous: language === "es" ? "Anterior" : "Previous",
    next: language === "es" ? "Siguiente" : "Next"
  };

  const renderArrowButton = (item, label, direction) => {
    if (!item) {
      return `<span class="desktop-reader-nav__spacer" aria-hidden="true"></span>`;
    }

    const icon = direction === "previous" ? "arrow-left" : "arrow-right";
    const ariaLabel = `${label}: ${item.label}`;

    return `
      <button
        class="${classNames("glass-sphere", "desktop-reader-nav__button", `desktop-reader-nav__button--${direction}`)}"
        type="button"
        data-action="${escapeHtml(item.action)}"
        ${escapeHtml(item.dataName)}="${escapeHtml(item.id)}"
        aria-label="${escapeHtml(ariaLabel)}"
        title="${escapeHtml(ariaLabel)}"
      >
        <i data-lucide="${icon}" aria-hidden="true"></i>
      </button>
    `;
  };

  return `
    <nav
      class="${classNames("desktop-reader-nav", `desktop-reader-nav--${position}`)}"
      aria-label="${escapeHtml(language === "es" ? "Navegación de lectura" : "Reader navigation")}"
    >
      ${renderArrowButton(navigation.previous, labels.previous, "previous")}
      <span class="desktop-reader-nav__center" aria-hidden="true"></span>
      ${renderArrowButton(navigation.next, labels.next, "next")}
    </nav>
  `;
}

function renderMobileKnowledgeNavigation(domains, state, language) {
  const labels = {
    toggle: language === "es" ? "Menú de ciencia" : "Science menu",
    open: language === "es" ? "Abrir menú de ciencia" : "Open science menu",
    close: language === "es" ? "Cerrar menú de ciencia" : "Close science menu",
    topics: language === "es" ? "Temas" : "Topics"
  };
  const isOpen = Boolean(state.mobileKnowledgeNavOpen);
  const expandedDomainId = state.mobileKnowledgeNavDomain ?? null;

  if (!isOpen) {
    return "";
  }

  return `
    <nav class="mobile-knowledge-nav is-open" aria-label="${escapeHtml(labels.toggle)}">
      <div
        class="glass-window mobile-knowledge-nav__panel"
        id="mobile-knowledge-nav-panel"
      >
        <div class="mobile-knowledge-nav__heading">
          <button
            class="glass-sphere mobile-knowledge-nav__close"
            type="button"
            data-action="toggle-mobile-knowledge-nav"
            aria-label="${escapeHtml(labels.close)}"
            title="${escapeHtml(labels.close)}"
          >
            <i data-lucide="x"></i>
          </button>
        </div>
        <div class="mobile-knowledge-nav__domains">
          ${domains.map((domain) => {
            const isExpanded = expandedDomainId === domain.id;
            const topics = domain.topics ?? [];

            return `
              <section class="mobile-knowledge-nav__domain">
                <button
                  class="${classNames("glass-tab", "mobile-knowledge-nav__domain-button", state.activeDomain === domain.id && "is-active")}"
                  type="button"
                  data-action="toggle-mobile-knowledge-domain"
                  data-domain-id="${escapeHtml(domain.id)}"
                  aria-expanded="${String(isExpanded)}"
                >
                  <span>${escapeHtml(pick(domain.title, language))}</span>
                  <i data-lucide="${isExpanded ? "chevron-up" : "chevron-down"}"></i>
                </button>
                <div class="mobile-knowledge-nav__topics" ${isExpanded ? "" : "hidden"} aria-label="${escapeHtml(labels.topics)}">
                  ${topics.map((topic) => `
                    <button
                      class="${classNames("glass-tab", "mobile-knowledge-nav__topic-button", isExpanded && "mobile-knowledge-nav__topic-button--domain-member", state.activeTopic === topic.id && "is-active")}"
                      type="button"
                      data-action="select-mobile-knowledge-topic"
                      data-domain-id="${escapeHtml(domain.id)}"
                      data-topic-id="${escapeHtml(topic.id)}"
                    >
                      ${escapeHtml(pick(topic.title, language))}
                    </button>
                  `).join("")}
                </div>
              </section>
            `;
          }).join("")}
        </div>
      </div>
    </nav>
  `;
}

function renderStructuredPanel(contentFile, language, ui, navigation = null) {
  const source = pick(contentFile, language);

  if (!source) {
    return "";
  }

  return `
    <article class="glass-window content-window" tabindex="0">
      ${renderMobileReaderTopNavigation(navigation, language)}
      ${renderDesktopReaderNavigation(navigation, language, "top")}
      <div
        class="structured-content-host"
        data-structured-host
        data-source="${escapeHtml(source)}"
      ></div>
      ${renderDesktopReaderNavigation(navigation, language, "bottom")}
      ${renderMobileReaderNavigation(navigation, language)}
      <div class="content-window__infinity" aria-hidden="true">∞</div>
    </article>
  `;
}

function renderEducationPanel(topic, language, ui) {
  if (!topic) {
    return "";
  }

  return renderStructuredPanel(topic.contentFile, language, ui);
}

function renderLegacyPanel(item, language, ui, navigation = null) {
  if (!item) {
    return "";
  }

  return `
    <article class="glass-window content-window" tabindex="0">
      ${renderMobileReaderTopNavigation(navigation, language)}
      ${renderDesktopReaderNavigation(navigation, language, "top")}
      <div class="legacy-content-host" data-legacy-host></div>
      ${renderDesktopReaderNavigation(navigation, language, "bottom")}
      ${renderMobileReaderNavigation(navigation, language)}
      <div class="content-window__infinity" aria-hidden="true">∞</div>
    </article>
  `;
}

function createReaderNavItem(item, action, dataName, language) {
  if (!item) {
    return null;
  }

  return {
    action,
    dataName,
    id: item.id,
    label: pick(item.title, language)
  };
}

function createReaderNavigation(items, activeId, action, dataName, language) {
  if (!Array.isArray(items) || items.length < 2 || !activeId) {
    return {
      previous: null,
      next: null
    };
  }

  const activeIndex = items.findIndex((item) => item.id === activeId);

  if (activeIndex === -1) {
    return {
      previous: null,
      next: null
    };
  }

  return {
    previous: createReaderNavItem(items[activeIndex - 1], action, dataName, language),
    next: createReaderNavItem(items[activeIndex + 1], action, dataName, language)
  };
}

export function renderSite({ state, refs, content, assets }) {
  const language = state.language;
  const sitePurposeSection = content.sitePurposeSection ?? null;
  const activeSection = [
    ...content.personalSections,
    sitePurposeSection
  ].find((section) => section?.id === state.activeSection) ?? null;
  const isSitePurposeOpen = Boolean(sitePurposeSection && activeSection?.id === sitePurposeSection.id);
  const activeDomain = content.knowledgeWorlds.find((domain) => domain.id === state.activeDomain) ?? null;
  const topics = activeDomain?.topics ?? [];
  const activeTopic = topics.find((topic) => topic.id === state.activeTopic) ?? null;
  const branchSource = activeTopic ?? activeSection;
  const activeBranch = branchSource?.branches?.find((branch) => branch.id === state.activeBranch) ?? null;
  const legacyItems = activeBranch?.items ?? [];
  const activeDetail = legacyItems.find((item) => item.id === state.activeDetail) ?? null;
  const hasActivePanel = Boolean(
    activeSection?.contentFile
    || activeTopic?.contentFile
    || activeDetail?.contentFile
    || activeDetail
  );
  const hasOpenContent = Boolean(
    (activeTopic && !activeTopic.branches)
    || activeDetail
  );
  const useFocusedRows = hasOpenContent;
  const hasActiveSciencePath = Boolean(activeDomain || activeTopic || activeBranch || activeDetail);
  const mobileKnowledgeMenuOpen = Boolean(state.mobileKnowledgeNavOpen);
  const showPersonalNavigation = !mobileKnowledgeMenuOpen
    && !hasActiveSciencePath
    && !isSitePurposeOpen
    && (!hasActivePanel || state.titleOpen);

  document.documentElement.lang = language;
  document.body.dataset.language = language;

  refs.titleButton.setAttribute("aria-expanded", String(showPersonalNavigation));
  refs.languageToggle.setAttribute("aria-pressed", String(language === "es"));
  refs.languageLabel.textContent = pick(content.ui.languageLabel, language);
  refs.socialDock.setAttribute("aria-label", pick(content.ui.socialAriaLabel, language));
  if (refs.siteInfinity) {
    refs.siteInfinity.hidden = hasActivePanel;
  }

  const year = new Date().getFullYear();
  refs.copyright.textContent = `© ${year} Issac Tabares. ${pick(content.ui.copyright, language)}`;
  if (refs.sitePurposeLink && sitePurposeSection) {
    const label = pick(sitePurposeSection.title, language);
    refs.sitePurposeLink.textContent = label;
    refs.sitePurposeLink.setAttribute("aria-label", label);
    refs.sitePurposeLink.classList.toggle("is-active", isSitePurposeOpen);
  }

  refs.socialDock.innerHTML = renderDockItems({
    assets,
    includeDocuments: showPersonalNavigation,
    language
  });

  const personalNavigation = showPersonalNavigation
    ? renderSectionButtons(content.personalSections, state, language, content.ui)
    : "";
  const knowledgeNavigation = "";
  const topicNavigation = activeDomain && !mobileKnowledgeMenuOpen ? renderTopicButtons(topics, state, language, content.ui) : "";
  const branchNavigation = branchSource?.branches && !branchSource.hideBranchNavigation
    ? renderBranchButtons(branchSource.branches, state, language, content.ui)
    : "";
  const legacyItemNavigation = activeBranch && !branchSource?.hideDetailNavigation
    ? renderLegacyItemButtons(legacyItems, state, language, content.ui)
    : "";
  const mobileKnowledgeNavigation = renderMobileKnowledgeNavigation(content.knowledgeWorlds, state, language);

  let activePanel = "";
  let readerNavigation = null;

  if (activeDetail) {
    readerNavigation = createReaderNavigation(
      legacyItems,
      activeDetail.id,
      "select-detail",
      "data-item-id",
      language
    );
    if (state.equationReturnTarget?.label) {
      readerNavigation.returnTo = state.equationReturnTarget;
    }
  } else if (activeBranch) {
    readerNavigation = createReaderNavigation(
      branchSource.branches,
      activeBranch.id,
      "select-branch",
      "data-branch-id",
      language
    );
  } else if (activeTopic) {
    readerNavigation = createReaderNavigation(
      topics,
      activeTopic.id,
      "select-topic",
      "data-topic-id",
      language
    );
  } else if (activeSection?.contentFile) {
    readerNavigation = createReaderNavigation(
      content.personalSections,
      activeSection.id,
      "select-section",
      "data-section-id",
      language
    );
  }

  if (activeDetail?.contentFile) {
    activePanel = renderStructuredPanel(activeDetail.contentFile, language, content.ui, readerNavigation);
  } else if (activeTopic?.branches) {
    if (activeDetail) {
      activePanel = renderLegacyPanel(activeDetail, language, content.ui, readerNavigation);
    } else if (activeTopic?.contentFile) {
      activePanel = renderStructuredPanel(activeTopic.contentFile, language, content.ui, readerNavigation);
    }
  } else if (activeTopic?.contentFile) {
    activePanel = renderStructuredPanel(activeTopic.contentFile, language, content.ui, readerNavigation);
  } else if (activeSection?.contentFile) {
    activePanel = renderStructuredPanel(activeSection.contentFile, language, content.ui, readerNavigation);
  }

  const focusedRows = [];

  if (useFocusedRows) {
    if (activeSection) {
      focusedRows.push(renderFocusedPathRow({
        ariaLabel: pick(content.ui.personalSectionsAria, language),
        action: "select-section",
        dataName: "data-section-id",
        id: activeSection.id,
        label: pick(activeSection.title, language)
      }));

      if (activeDetail) {
        focusedRows.push(renderFocusedPathRow({
          ariaLabel: pick(content.ui.legacyItemNavigationAria, language),
          action: "select-detail",
          dataName: "data-item-id",
          id: activeDetail.id,
          label: pick(activeDetail.title, language),
          closeHint: pick(content.ui.focusedPathCloseHint, language),
          closeAria: pick(content.ui.focusedPathCloseAria, language)
        }));
      }
    } else if (activeDomain && activeTopic) {
      focusedRows.push(renderFocusedPathRow({
        ariaLabel: pick(content.ui.knowledgeWorldsAria, language),
        action: "select-domain",
        dataName: "data-domain-id",
        id: activeDomain.id,
        label: pick(activeDomain.title, language),
        scope: "science"
      }));

      focusedRows.push(renderFocusedPathRow({
        ariaLabel: pick(content.ui.topicNavigationAria, language),
        action: "select-topic",
        dataName: "data-topic-id",
        id: activeTopic.id,
        label: pick(activeTopic.title, language),
        scope: "science"
      }));

      if (activeBranch) {
        focusedRows.push(renderFocusedPathRow({
          ariaLabel: pick(content.ui.branchNavigationAria, language),
          action: "select-branch",
          dataName: "data-branch-id",
          id: activeBranch.id,
          label: pick(activeBranch.title, language),
          scope: "science"
        }));
      }

      if (activeDetail) {
        focusedRows.push(renderFocusedPathRow({
          ariaLabel: pick(content.ui.legacyItemNavigationAria, language),
          action: "select-detail",
          dataName: "data-item-id",
          id: activeDetail.id,
          label: pick(activeDetail.title, language),
          scope: "science",
          closeHint: pick(content.ui.focusedPathCloseHint, language),
          closeAria: pick(content.ui.focusedPathCloseAria, language)
        }));
      }
    }
  }

  refs.stage.innerHTML = `
    <div class="${classNames("stage-column", hasActivePanel && "stage-column--reader-active")}">
      ${mobileKnowledgeNavigation}
      ${useFocusedRows
        ? focusedRows.join("")
        : `${personalNavigation}
      ${knowledgeNavigation}
      ${topicNavigation}
      ${branchNavigation}
      ${legacyItemNavigation}`}
      ${activePanel}
    </div>
  `;
}
