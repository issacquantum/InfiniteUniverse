export function toggleScienceMenu(state) {
  return { ...state, mobileKnowledgeNavOpen: !state.mobileKnowledgeNavOpen };
}

export function toggleScienceCategory(state, domainId) {
  return { ...state, mobileKnowledgeNavOpen: true,
    mobileKnowledgeNavDomain: state.mobileKnowledgeNavDomain === domainId ? null : domainId };
}

export function selectScienceMenuTopic(state, domainId, topicId) {
  return { ...state, titleOpen: false, activeSection: null, activeChapter: null,
    showPersonalSectionList: false, activeDomain: domainId, activeTopic: topicId,
    activeBranch: null, activeDetail: null, equationReturnTarget: null,
    mobileKnowledgeNavOpen: false, mobileKnowledgeNavDomain: domainId };
}

export function visibleScienceCategories(domains, selectedId) {
  const selected = domains.find(domain => domain.id === selectedId);
  return selected ? [selected] : domains;
}
