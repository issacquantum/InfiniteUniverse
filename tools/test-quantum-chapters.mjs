import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { siteContent } from '../data/site-content.js';
import { parseRoute, routeFor } from '../scripts/routes.js';

const topic = siteContent.knowledgeWorlds.flatMap(domain => domain.topics).find(topic => topic.id === 'quantum-mechanics');
const branch = topic.branches.find(branch => branch.id === 'quantum-mechanics-chapters');
assert.deepEqual(branch.items.map(item => item.id), ['quantum-applications', 'quantum-biology']);
const headings = html => [...html.matchAll(/<h3 id="([^"]+)"/g)].map(match => match[1]);
const links = html => [...html.matchAll(/href="([^"]+)"/g)].map(match => match[1].replace('/es/', '/en/'));
for (const item of branch.items) {
  const en = readFileSync(item.contentFile.en, 'utf8');
  const es = readFileSync(item.contentFile.es, 'utf8');
  assert.deepEqual(headings(es), headings(en), `${item.id}: bilingual section parity`);
  assert.deepEqual(links(es), links(en), `${item.id}: bilingual link parity`);
  for (const language of ['en', 'es']) {
    const html = language === 'en' ? en : es;
    assert(!/<canvas|<svg|<figure|data-model|<script|[\u2013\u2014]/.test(html), 'Text-only chapters');
    assert(new Set(headings(html)).size === headings(html).length, 'Unique reading anchors');
    const route = routeFor({ language, activeTopic: topic.id, activeBranch: branch.id, activeDetail: item.id });
    assert.equal(parseRoute(route).activeDetail, item.id);
    const output = readFileSync(`science/${language}/quantum-mechanics/${item.id}.html`, 'utf8');
    assert(output.includes(`index.html${route.replaceAll('&', '&amp;')}`) || output.includes(`index.html${route}`));
    assert.deepEqual(headings(output), headings(html));
    assert(output.includes(html.trim()), 'Standalone chapter preserves source content');
  }
}
console.log('Quantum chapter routes, bilingual headings and links, static content, and generated pages passed.');
