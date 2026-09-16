import { siteContent } from '../data/site-content.js';
import { topicMetadata } from '../data/topic-metadata.js';
import { routeFor } from './routes.js';
const topics = siteContent.knowledgeWorlds.flatMap(d => d.topics.map(t => ({ ...t, domain: d.id })));
export function enhanceScienceReader(host, state) {
  if (!state.activeTopic || host.querySelector('[data-science-tools]')) return;
  const headings = [...host.querySelectorAll('h2,h3')];
  const used = new Set([...host.querySelectorAll('[id]')].map(e => e.id));
  for (const [index, heading] of headings.entries()) {
    if (!heading.id) {
      let id = `reading-${index + 1}`;
      while (used.has(id)) id += '-heading';
      heading.id = id; used.add(id);
    }
    heading.tabIndex = -1;
  }
  const tools = document.createElement('div'); tools.dataset.scienceTools = ''; tools.className = 'science-reader-tools';
  if (headings.length >= 6 && host.textContent.trim().length >= 2400) {
    const toc = document.createElement('details'); toc.className = 'science-toc';
    const summary = document.createElement('summary'); summary.textContent = state.language === 'es' ? 'Contenido de esta página' : 'On this page'; toc.append(summary);
    const list = document.createElement('ol');
    for (const heading of headings) {
      const li = document.createElement('li'); li.className = `toc-${heading.tagName.toLowerCase()}`;
      const link = document.createElement('a'); link.href = `${routeFor(state)}&heading=${encodeURIComponent(heading.id)}`.replace('?&','?');
      if (!routeFor(state).includes('?')) link.href = `${routeFor(state)}?heading=${encodeURIComponent(heading.id)}`;
      link.textContent = heading.textContent;
      link.addEventListener('click', event => {
        event.preventDefault(); heading.scrollIntoView({ block: 'start', behavior: 'instant' }); heading.focus({ preventScroll: true });
        history.replaceState({ ...history.state, route: link.getAttribute('href') }, '', link.getAttribute('href'));
      });
      li.append(link); list.append(li);
    }
    toc.append(list); tools.append(toc);
  }
  host.prepend(tools);
  if (!state.activeDetail) {
    const metadata = topicMetadata[state.activeTopic];
    const nav = document.createElement('nav'); nav.className = 'science-related'; nav.dataset.scienceTools = '';
    nav.setAttribute('aria-label', state.language === 'es' ? 'Temas relacionados y conocimientos previos' : 'Related topics and prerequisites');
    for (const [key, labels] of [['prerequisites',['Prerequisites','Conocimientos previos']],['related',['Related topics','Temas relacionados']]]) {
      if (!metadata?.[key]?.length) continue;
      const label = document.createElement('p'); label.textContent = labels[state.language === 'es' ? 1 : 0]; nav.append(label);
      const list = document.createElement('ul');
      for (const id of metadata[key]) {
        const topic = topics.find(t => t.id === id); if (!topic) continue;
        const li = document.createElement('li'); const link = document.createElement('a');
        link.href = routeFor({ language: state.language, activeTopic: id }); link.textContent = topic.title[state.language];
        li.append(link); list.append(li);
      }
      nav.append(list);
    }
    host.append(nav);
  }
}
export function restoreHeading(host) {
  const id = new URLSearchParams(location.hash.split('?')[1] ?? '').get('heading');
  if (id) {
    const target = [...host.querySelectorAll('[id]')].find(e => e.id === id);
    target?.scrollIntoView({ block:'start', behavior:'instant' });
  }
}
