import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { siteContent } from '../data/site-content.js';
import { parseRoute, routeFor } from '../scripts/routes.js';

const topic = siteContent.knowledgeWorlds.flatMap(d => d.topics).find(t => t.id === 'stars');
const chapters = topic.branches.find(b => b.id === 'stars-chapters');
const equations = topic.branches.find(b => b.id === 'stars-equations');
assert.equal(chapters.items.length, 7);
assert.equal(equations.items.length, 14);
const displays = html => [...html.matchAll(/\$\$([\s\S]*?)\$\$/g)].map(m => m[1]);
for (const chapter of chapters.items) {
  const texts = ['en', 'es'].map(lang => readFileSync(chapter.contentFile[lang], 'utf8'));
  assert.deepEqual(displays(texts[0]), displays(texts[1]), `${chapter.id}: formula parity`);
  for (const [index, lang] of ['en', 'es'].entries()) {
    const html = texts[index];
    assert(!/[\u2013\u2014]/u.test(html), `${chapter.id}: long dash`);
    const triggers = [...html.matchAll(/<button[^>]*data-branch-id="stars-equations"[^>]*data-item-id="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g)];
    assert.equal(triggers.length, displays(html).length, `${chapter.id}: unlinked display`);
    for (const [, id, body] of triggers) {
      const eq = equations.items.find(e => e.id === id);
      assert(eq, `${chapter.id}: missing ${id}`);
      assert.deepEqual(displays(body), displays(readFileSync(eq.contentFile[lang], 'utf8')));
      const parent = {language: lang, activeTopic: 'stars', activeBranch: chapters.id, activeDetail: chapter.id};
      const state = {...parent, activeBranch: equations.id, activeDetail: id,
        equationReturnTarget: {topicId: 'stars', branchId: chapters.id, detailId: chapter.id}};
      const restored = parseRoute(routeFor(state));
      assert.equal(restored.activeDetail, id);
      assert.equal(restored.equationReturnTarget.detailId, chapter.id);
    }
  }
}
const G = 6.67430e-11, M = 1.99e30, R = 6.96e8, L = 3.83e26;
const year = 365.25 * 86400;
assert(Math.abs(Math.sqrt(R ** 3 / (G * M)) - 1593) < 3);
assert(Math.abs(G * M ** 2 / (R * L) / year / 1e6 - 31.4) < 0.2);
assert(Math.abs(0.07 * 0.007 * M * 299792458 ** 2 / L / year / 1e9 - 7.25) < 0.1);
assert.equal(1 / (2 * 4000) * 1e6, 125);
const rho = 1000, r = 1e8, mass = 1e30, P = 1e6, c = 299792458;
const newton = -G * rho * mass / r ** 2;
const tov = -G * (rho + P / c ** 2) * (mass + 4 * Math.PI * r ** 3 * P / c ** 2)
  / (r ** 2 * (1 - 2 * G * mass / (r * c ** 2)));
assert(Math.abs(tov / newton - 1) < 0.0001, 'TOV weak-field limit');
for (const lang of ['en', 'es']) {
  const origins = readFileSync(`content/site/${lang}/personal/origins.html`, 'utf8');
  assert(origins.includes(lang === 'en' ? 'I was not bullied there' : 'pero no sufrí acoso'));
}
console.log('Seven bilingual Stars chapters, fourteen individual equations, parent routes, solar estimates and the TOV limit passed.');
