import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { siteContent } from '../data/site-content.js';
import { parseRoute, routeFor } from '../scripts/routes.js';
import { toggleScienceMenu, toggleScienceCategory, selectScienceMenuTopic, visibleScienceCategories } from '../scripts/science-menu.js';
import { showReaderRecovery, runOptionalEnhancement } from '../scripts/reader-recovery.js';
const domains = siteContent.knowledgeWorlds;
for (const lang of ['en', 'es']) {
  let state = parseRoute(`#/${lang}/science/quantum-mechanics?branch=quantum-mechanics-chapters&detail=quantum-biology`);
  const route = routeFor(state);
  state = toggleScienceMenu(state);
  assert.equal(routeFor(state), route, 'Opening a menu retains the article');
  for (let i=0; i<30; i++) {
    state = toggleScienceCategory(state, state.mobileKnowledgeNavDomain);
    assert.equal(visibleScienceCategories(domains, state.mobileKnowledgeNavDomain).length, domains.length);
    const domain = domains[i % domains.length];
    state = toggleScienceCategory(state, domain.id);
    assert.deepEqual(visibleScienceCategories(domains, state.mobileKnowledgeNavDomain), [domain]);
    assert.equal(routeFor(state), route, 'Category changes are not article navigation');
  }
  const chosen = domains[0];
  state = selectScienceMenuTopic(state, chosen.id, chosen.topics[0].id);
  assert.equal(state.mobileKnowledgeNavOpen, false);
  state = toggleScienceMenu(state);
  assert.equal(state.mobileKnowledgeNavDomain, chosen.id, 'Reopen the selected article category');
  const host = { setAttribute(){}, innerHTML:'' };
  showReaderRecovery(host, lang);
  assert(host.innerHTML.includes('data-action="retry-content"'));
  assert(host.innerHTML.includes('data-action="toggle-mobile-knowledge-nav"'));
  assert(host.innerHTML.includes(lang === 'es' ? 'Reintentar' : 'Try again'));
}
const notices=[];
globalThis.document = {createElement:()=>({dataset:{},setAttribute(){}})};
const host={isConnected:true,querySelector:()=>notices[0]??null,appendChild:n=>notices.push(n)};
const warn=console.warn; console.warn=()=>{};
try {
  runOptionalEnhancement(host,'es',()=>{throw Error('model failure');});
  let continued=false;
  runOptionalEnhancement(host,'es',()=>{continued=true;});
  assert(continued, 'One optional failure does not stop later work');
  runOptionalEnhancement(host,'es',()=>Promise.reject(Error('async failure')));
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(notices.length,1);
  assert(notices[0].textContent.includes('navegación'));
} finally {console.warn=warn; delete globalThis.document;}
// A two-level Hamiltonian changes interference, not energy populations.
for (const angle of [0, Math.PI/2, Math.PI]) {
  const a=1/Math.sqrt(2), br=Math.cos(angle)/Math.sqrt(2), bi=-Math.sin(angle)/Math.sqrt(2);
  assert(Math.abs(a*a+br*br+bi*bi-1)<1e-12);
  const plus=((a+br)**2+bi*bi)/2;
  assert(Math.abs(plus-(1+Math.cos(angle))/2)<1e-12);
}
for (const lang of ['en','es']) {
  const text=readFileSync(`content/site/${lang}/science/equations/hamiltonian-time-evolution.html`,'utf8');
  assert(text.includes('e^{-i\\pi}=-1'));
  assert(text.includes('\\Delta/2'));
  assert(!text.includes('Ejemplo o interpretación') && !text.includes('Worked example or interpretation'));
}
console.log('Independent menu state, repeated transitions, localized recovery, optional failure isolation, and phase probabilities passed.');
