import { siteContent } from '../data/site-content.js?v=20260921-classical-mechanics-v1';
const topics = siteContent.knowledgeWorlds.flatMap(d => d.topics.map(t => ({ ...t, domain: d.id })));
const sections = [...siteContent.personalSections, siteContent.sitePurposeSection];
export function routeFor(state) {
  const language = state.language === 'es' ? 'es' : 'en';
  let path = `#/${language}`;
  if (state.activeSection) path += `/personal/${encodeURIComponent(state.activeSection)}`;
  else if (state.activeTopic) path += `/science/${encodeURIComponent(state.activeTopic)}`;
  else if (state.activeDomain) path += `/domain/${encodeURIComponent(state.activeDomain)}`;
  const params = new URLSearchParams();
  if (state.activeBranch) params.set('branch', state.activeBranch);
  if (state.activeDetail) params.set('detail', state.activeDetail);
  const target = state.equationReturnTarget;
  if (target?.detailId) params.set('from', `${target.branchId}/${target.detailId}`);
  return path + (params.size ? `?${params}` : '');
}
export function parseRoute(hash) {
  const [path, query = ''] = hash.replace(/^#/, '').split('?');
  const parts = path.split('/').filter(Boolean);
  if (!['en','es'].includes(parts[0])) return null;
  const state = { language: parts[0], activeSection: null, activeDomain: null, activeTopic: null, activeBranch: null, activeDetail: null, equationReturnTarget: null, titleOpen: false, showPersonalSectionList: false, mobileKnowledgeNavOpen: false, mobileKnowledgeNavDomain: null };
  const params = new URLSearchParams(query);
  let owner;
  if (parts[1] === 'science') {
    owner = topics.find(t => t.id === parts[2]);
    if (!owner) return null;
    state.activeTopic = owner.id; state.activeDomain = owner.domain;
  } else if (parts[1] === 'personal') {
    owner = sections.find(s => s.id === parts[2]);
    if (!owner) return null;
    state.activeSection = owner.id;
  } else if (parts[1] === 'domain') {
    if (!siteContent.knowledgeWorlds.some(d => d.id === parts[2])) return null;
    state.activeDomain = parts[2]; state.mobileKnowledgeNavOpen = true; state.mobileKnowledgeNavDomain = parts[2];
  } else if (parts.length > 1) return null;
  if (parts.length > 3) return null;
  if (params.has('branch')) {
    const branch = owner?.branches?.find(b => b.id === params.get('branch'));
    if (!branch) return null;
    state.activeBranch = branch.id;
    if (params.has('detail')) {
      if (!branch.items.some(i => i.id === params.get('detail'))) return null;
      state.activeDetail = params.get('detail');
      const [fromBranch, fromDetail] = (params.get('from') ?? '').split('/');
      const from = owner.branches.find(b => b.id === fromBranch)?.items.find(i => i.id === fromDetail);
      state.equationReturnTarget = {
        returnType: from?.source ? 'legacy' : 'structured', domainId: state.activeDomain,
        topicId: state.activeTopic, sectionId: state.activeSection,
        branchId: from ? fromBranch : null, detailId: from ? fromDetail : null,
        label: from?.title[state.language] ?? owner.title[state.language], scrollTop: 0
      };
    }
  } else if (params.has('detail')) return null;
  return state;
}

export function installRoutes(store, beforeRestore = () => {}) {
  let restoring = false;
  const restore = () => {
    const parsed = parseRoute(location.hash);
    // Ordinary document anchors (including the skip link) are not routes.
    if (!parsed && location.hash && !location.hash.startsWith('#/')) return;
    const state = parsed ?? parseRoute('#/en');
    beforeRestore(history.state?.reader ?? null, state);
    history.replaceState({ ...history.state, route: location.hash }, "");
    restoring = true;
    store.setState({ ...state, equationReturnTarget: history.state?.returnTarget ?? state.equationReturnTarget });
    restoring = false;
  };
  const initial = parseRoute(location.hash);
  if (initial) store.setState(initial);
  history.replaceState({ ...history.state, route: routeFor(store.getState()) }, '', initial ? location.hash : routeFor(store.getState()));
  store.subscribe(state => {
    if (restoring) return;
    const next = routeFor(state);
    if (next !== location.hash) history.pushState({ route: next, returnTarget: state.equationReturnTarget }, '', next);
  });
  window.addEventListener('popstate', restore);
  window.addEventListener('hashchange', () => { if (history.state?.route !== location.hash) restore(); });
}
