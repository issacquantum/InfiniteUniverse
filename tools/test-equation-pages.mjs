import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { documents, siteContent } from './site-inventory.mjs';
import { bigBangLegacyContent } from '../data/legacy-big-bang.js';
import { linkLegacyEquations } from './legacy-equation-links.mjs';
import { parseRoute, routeFor } from '../scripts/routes.js';

assert.throws(() => linkLegacyEquations('<p>$$a=b$$</p>', 'age-of-the-universe', id => id), /count differs/);
assert.throws(() => linkLegacyEquations('<p>$$a=b$$</p>', 'early-expansion-of-the-universe', () => null), /Missing/);
const unrelated = '<p>Ordinary prose.</p>';
assert.equal(linkLegacyEquations(unrelated, 'not-a-legacy-item', () => null), unrelated);

let legacyLinks = 0;
for (const language of ['en', 'es']) {
  for (const doc of documents(language).filter(d => d.source && bigBangLegacyContent.historyEquationMap[d.id])) {
    const source = readFileSync(doc.file, 'utf8');
    const result = linkLegacyEquations(source, doc.id, id => `science/${language}/equations/${id}.html`);
    for (const id of bigBangLegacyContent.historyEquationMap[doc.id]) {
      const target = `science/${language}/equations/${id}.html`;
      assert.ok(result.includes(`href="${target}"`), `${doc.file}: ${id}`);
      assert.ok(existsSync(target));
      const generated = readFileSync(`science/${language}/${doc.topic.id}/${doc.id}.html`, 'utf8');
      assert.ok(generated.includes(`href="${target}"`), `Generated page: ${doc.id}, ${id}`);
      legacyLinks++;
    }
  }
  const personal = siteContent.personalSections.find(s => s.id === 'personal-cosmology');
  const branch = personal.branches.find(b => b.id === 'my-work-influences-equations');
  const item = branch.items.find(i => i.id === 'mode-indexed-ontology');
  const state = { language, activeSection: personal.id, activeBranch: branch.id, activeDetail: item.id };
  const restored = parseRoute(routeFor(state));
  assert.equal(restored.activeDetail, item.id);
  assert.equal(restored.activeSection, personal.id);
  const article = readFileSync(personal.contentFile[language], 'utf8');
  assert(!article.includes('data-item-id="mode-indexed-ontology"'), 'Article formulas must link directly to individual definitions');
  const index = readFileSync(item.contentFile[language], 'utf8');
  assert(index.includes('data-equation-index'));
  for (const id of ['ultimate-totality-union', 'mode-indexed-content', 'law-compatible-physical-reality']) {
    assert.equal(article.split(`data-item-id="${id}"`).length - 1, 2);
    assert(index.includes(`data-item-id="${id}"`));
    const definition = branch.items.find(entry => entry.id === id);
    assert(definition);
    const detail = readFileSync(definition.contentFile[language], 'utf8');
    const displays = [...detail.matchAll(/\$\$([\s\S]*?)\$\$/g)];
    assert.equal(displays.length, 1);
    assert(article.includes(displays[0][1]), 'Ontology expressions must remain unchanged');
    assert.equal(parseRoute(routeFor({...state, activeDetail:id})).activeDetail,id);
  }
}
const hbar = 6.62607015e-34 / (2 * Math.PI);
const electronvolt = 1.602176634e-19;
const electronMass = 9.1093837139e-31;
const energy = hbar ** 2 * Math.PI ** 2 / (2 * electronMass * (1e-9) ** 2);
assert.ok(Math.abs(energy / electronvolt - 0.376) < 0.0001);
assert.ok(Math.abs(electronvolt * 1e-15 / hbar - 1.52) < 0.005);
assert.equal((1 * 0 + 3 * 4) / 4, 3);
console.log(`${legacyLinks} legacy equation links, bilingual ontology routes and numerical examples passed.`);
