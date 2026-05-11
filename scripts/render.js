import { pick } from "./i18n.js";

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

function hasConfiguredValue(value, placeholder) {
  return typeof value === "string" && value.trim() !== "" && value !== placeholder;
}

function resolveSocialIconSource(assets, item) {
  const folder = assets.socialIconFolder;
  const fileName = item.iconFileName;

  if (!hasConfiguredValue(folder, "PATH_HERE") || !hasConfiguredValue(fileName, "FILE_NAME_HERE")) {
    return "";
  }

  const normalizedFolder = folder.endsWith("/") ? folder.slice(0, -1) : folder;
  return `${normalizedFolder}/${fileName}`;
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

function renderDockItems({ assets, includeCv, language }) {
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

  if (includeCv) {
    const cvLabel = pick(assets.cv.label, language);

    items.push(`
      <button
        class="glass-sphere social-sphere cv-sphere"
        type="button"
        data-action="open-external"
        data-external-id="cv"
        aria-label="${escapeHtml(cvLabel)}"
        title="${escapeHtml(cvLabel)}"
      >
        <i data-lucide="file-text"></i>
      </button>
      <button
        class="glass-sphere social-sphere cv-sphere research-essay-sphere"
        type="button"
        data-action="open-external"
        data-external-id="researchEssay"
        aria-label="${escapeHtml(pick(assets.researchEssay.label, language))}"
        title="${escapeHtml(pick(assets.researchEssay.label, language))}"
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
  closeHint,
  closeAria
}) {
  const buttonLabel = closeAria ? `${label}. ${closeAria}` : label;

  return `
    <div class="focused-path-row" role="group" aria-label="${escapeHtml(ariaLabel)}">
      <button
        class="${classNames("glass-tab", "focused-path-tab", "is-active", closeHint && "focused-path-tab--closable")}"
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
    <div class="tab-row education-row" role="group" aria-label="${escapeHtml(pick(ui.educationDomainsAria, language))}">
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
          class="${classNames("glass-tab", "topic-button", state.activeTopic === topic.id && "is-active")}"
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

  return `
    <div class="topic-grid branch-grid" role="group" aria-label="${escapeHtml(pick(ui.branchNavigationAria, language))}">
      ${visibleBranches.map((branch) => `
        <button
          class="${classNames("glass-tab", "topic-button", state.activeBranch === branch.id && "is-active")}"
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
  return `
    <div class="topic-grid legacy-item-grid" role="group" aria-label="${escapeHtml(pick(ui.legacyItemNavigationAria, language))}">
      ${items.map((item) => `
        <button
          class="${classNames("glass-tab", "topic-button", state.activeDetail === item.id && "is-active")}"
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

function renderStructuredPanel(contentFile, language, ui) {
  const source = pick(contentFile, language);

  if (!source) {
    return "";
  }

  return `
    <article class="glass-window content-window" tabindex="0">
      <div
        class="structured-content-host"
        data-structured-host
        data-source="${escapeHtml(source)}"
      ></div>
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

function renderLegacyPanel(item, language, ui) {
  if (!item) {
    return "";
  }

  return `
    <article class="glass-window content-window" tabindex="0">
      <div class="legacy-content-host" data-legacy-host></div>
      <div class="content-window__infinity" aria-hidden="true">∞</div>
    </article>
  `;
}

export function renderSite({ state, refs, content, assets }) {
  const language = state.language;
  const siteNoticeSection = content.siteNoticeSection ?? null;
  const activeSection = [
    ...content.personalSections,
    siteNoticeSection
  ].find((section) => section?.id === state.activeSection) ?? null;
  const isSiteNoticeOpen = Boolean(siteNoticeSection && activeSection?.id === siteNoticeSection.id);
  const activeDomain = content.educationDomains.find((domain) => domain.id === state.activeDomain) ?? null;
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
  const showPersonalNavigation = state.titleOpen && !hasActiveSciencePath && !isSiteNoticeOpen;
  const showEducationNavigation = !showPersonalNavigation && !activeSection;

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
  if (refs.siteNoticesLink && siteNoticeSection) {
    const label = pick(siteNoticeSection.title, language);
    refs.siteNoticesLink.textContent = label;
    refs.siteNoticesLink.setAttribute("aria-label", label);
    refs.siteNoticesLink.classList.toggle("is-active", isSiteNoticeOpen);
  }

  refs.socialDock.innerHTML = renderDockItems({
    assets,
    includeCv: showPersonalNavigation,
    language
  });

  const personalNavigation = showPersonalNavigation
    ? renderSectionButtons(content.personalSections, state, language, content.ui)
    : "";
  const educationNavigation = showEducationNavigation
    ? renderDomainButtons(content.educationDomains, state, language, content.ui)
    : "";
  const topicNavigation = activeDomain ? renderTopicButtons(topics, state, language, content.ui) : "";
  const branchNavigation = branchSource?.branches && !branchSource.hideBranchNavigation
    ? renderBranchButtons(branchSource.branches, state, language, content.ui)
    : "";
  const legacyItemNavigation = activeBranch && !branchSource?.hideDetailNavigation
    ? renderLegacyItemButtons(legacyItems, state, language, content.ui)
    : "";

  let activePanel = "";

  if (activeDetail?.contentFile) {
    activePanel = renderStructuredPanel(activeDetail.contentFile, language, content.ui);
  } else if (activeTopic?.branches) {
    if (activeDetail) {
      activePanel = renderLegacyPanel(activeDetail, language, content.ui);
    } else if (activeTopic?.contentFile) {
      activePanel = renderStructuredPanel(activeTopic.contentFile, language, content.ui);
    }
  } else if (activeTopic?.contentFile) {
    activePanel = renderEducationPanel(activeTopic, language, content.ui);
  } else if (activeSection?.contentFile) {
    activePanel = renderStructuredPanel(activeSection.contentFile, language, content.ui);
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
        ariaLabel: pick(content.ui.educationDomainsAria, language),
        action: "select-domain",
        dataName: "data-domain-id",
        id: activeDomain.id,
        label: pick(activeDomain.title, language)
      }));

      focusedRows.push(renderFocusedPathRow({
        ariaLabel: pick(content.ui.topicNavigationAria, language),
        action: "select-topic",
        dataName: "data-topic-id",
        id: activeTopic.id,
        label: pick(activeTopic.title, language)
      }));

      if (activeBranch) {
        focusedRows.push(renderFocusedPathRow({
          ariaLabel: pick(content.ui.branchNavigationAria, language),
          action: "select-branch",
          dataName: "data-branch-id",
          id: activeBranch.id,
          label: pick(activeBranch.title, language)
        }));
      }

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
    }
  }

  refs.stage.innerHTML = `
    <div class="stage-column">
      ${useFocusedRows
        ? focusedRows.join("")
        : `${personalNavigation}
      ${educationNavigation}
      ${topicNavigation}
      ${branchNavigation}
      ${legacyItemNavigation}`}
      ${activePanel}
    </div>
  `;
}
