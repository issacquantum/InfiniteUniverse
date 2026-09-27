import { siteContent } from '../data/site-content.js?v=20260926-reader-chapters-v1';
const topics = siteContent.knowledgeWorlds.flatMap(d => d.topics.map(t => ({ ...t, domain: d.id })));
const sections = [...siteContent.personalSections, siteContent.sitePurposeSection];
export function routeFor(state) {
  const language = state.language === 'es' ? 'es' : 'en';
  let path = `#/${language}`;
  if (state.activeSection) path += `/personal/${encodeURIComponent(state.activeSection)}`;
  else if (state.activeTopic) path += `/science/${encodeURIComponent(state.activeTopic)}`;
  else if (state.activeDomain) path += `/domain/${encodeURIComponent(state.activeDomain)}`;
  const params = new URLSearchParams();
  if (state.activeSection === 'origins-interests' && state.activeChapter) params.set('chapter', state.activeChapter);
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
  const state = { language: parts[0], activeSection: null, activeChapter: null, activeDomain: null, activeTopic: null, activeBranch: null, activeDetail: null, equationReturnTarget: null, titleOpen: false, showPersonalSectionList: false, mobileKnowledgeNavOpen: false, mobileKnowledgeNavDomain: null };
  const params = new URLSearchParams(query);
  let owner;
  if (parts[1] === 'science') {
    owner = topics.find(t => t.id === parts[2]);
    if (!owner) return null;
    state.activeTopic = owner.id; state.activeDomain = owner.domain;
  } else if (parts[1] === 'personal') {
    const oldChapter = ['origins', 'music', 'practice-worlds'].includes(parts[2]) ? parts[2] : null;
    owner = sections.find(s => s.id === (oldChapter ? 'origins-interests' : parts[2]));
    if (!owner) return null;
    state.activeSection = owner.id;
    if (owner.chapters) {
      const chapterId = oldChapter ?? params.get('chapter') ?? owner.chapters[0].id;
      if (!owner.chapters.some(chapter => chapter.id === chapterId)) return null;
      state.activeChapter = chapterId;
    }
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

export function installRoutes(store, beforeRestore = () => {}, capturePosition = () => null) {
  let restoring = false;
  let saveTimer = null;
  let lastSave = 0;
  let currentState = store.getState();
  let entryId = history.state?.readerEntryId ?? crypto.randomUUID();
  const positions = new Map();
  const remember = () => {
    const position = capturePosition(currentState);
    if (position) positions.set(entryId, position);
    return position;
  };
  const persist = () => {
    clearTimeout(saveTimer);
    saveTimer = null;
    lastSave = Date.now();
    const reader = remember();
    try {
      history.replaceState({ ...history.state, readerEntryId: entryId, reader }, "");
    } catch (error) {
      // An inactive document can reject a final pagehide history update.
      if (error.name !== 'SecurityError') throw error;
    }
  };
  const restore = () => {
    const parsed = parseRoute(location.hash);
    // Ordinary document anchors (including the skip link) are not routes.
    if (!parsed && location.hash && !location.hash.startsWith('#/')) return;
    clearTimeout(saveTimer);
    saveTimer = null;
    remember();
    const state = parsed ?? parseRoute('#/en');
    entryId = history.state?.readerEntryId ?? crypto.randomUUID();
    beforeRestore(positions.get(entryId) ?? history.state?.reader ?? null, state);
    history.replaceState({ ...history.state, readerEntryId: entryId, route: location.hash }, "");
    restoring = true;
    try {
      store.setState({ ...state, equationReturnTarget: history.state?.returnTarget ?? state.equationReturnTarget });
      currentState = store.getState();
    } finally {
      restoring = false;
    }
  };
  const initial = parseRoute(location.hash);
  if (initial) store.setState(initial);
  currentState = store.getState();
  if (history.state?.reader) beforeRestore(history.state.reader, currentState);
  history.replaceState({ ...history.state, readerEntryId: entryId, route: routeFor(currentState) }, '', initial ? location.hash : routeFor(currentState));
  store.subscribe(state => {
    if (restoring) return;
    const next = routeFor(state);
    if (next !== location.hash) {
      persist();
      entryId = crypto.randomUUID();
      history.pushState({ route: next, readerEntryId: entryId, returnTarget: state.equationReturnTarget }, '', next);
    }
    currentState = state;
  });
  window.addEventListener('popstate', restore);
  window.addEventListener('hashchange', () => { if (history.state?.route !== location.hash) restore(); });
  window.addEventListener('pagehide', persist);
  return () => {
    clearTimeout(saveTimer);
    // One settled-scroll snapshot at most every two seconds, never per frame.
    saveTimer = setTimeout(persist, Math.max(200, 2000 - (Date.now() - lastSave)));
  };
}

