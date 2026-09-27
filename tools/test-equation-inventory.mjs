import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { documents, publicDocuments, siteContent } from './site-inventory.mjs';
import { parseRoute, routeFor } from '../scripts/routes.js';
import { bigBangLegacyContent } from '../data/legacy-big-bang.js';

// This checks publication and notation consistency, not scientific validity.
const read = file => readFileSync(file, 'utf8');
const equations = html => [...html.matchAll(/\$\$([\s\S]*?)\$\$/g)].map(m => m[1]);
const normalize = tex => tex.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\\(?:,|;|!|quad|qquad)/g, '').replace(/\\(?:left|right)/g, '')
  .replace(/\\mathrm\{Tr\}/g, '\\operatorname{Tr}').replace(/\^\{\\prime\}/g, "'")
  .replace(/\\geq\b/g, '\\ge').replace(/\s+/g, '');
const translatedLabels = new Map([
  ['acepta', 'accepts'], ['correcto', 'correct'], ['confianza', 'confidence'],
  ['ADN', 'DNA'], ['ARN', 'RNA'], ['proteína', 'protein'],
  ['productos', 'products'], ['reactivos', 'reactants']
]);
const untranslatedMath = tex => normalize(tex
  .replace(/\\text\{[^}]*\}/g, '')
  .replace(/\\mathrm\{([^}]+)\}/g, (whole, label) => `\\mathrm{${translatedLabels.get(label) ?? label}}`));

let windows = 0;
for (const language of ['en', 'es']) {
  const directory = `content/site/${language}/science/equations`;
  const sources = readdirSync(directory).filter(file => file.endsWith('.html'));
  const counterparts = readdirSync(`content/site/${language === 'en' ? 'es' : 'en'}/science/equations`).filter(file => file.endsWith('.html'));
  assert.deepEqual(sources.sort(), counterparts.sort(), 'Every equation and compatibility index has both languages');
  const all = publicDocuments(language);
  for (const file of sources) {
    const id = file.slice(0, -5);
    const source = read(`${directory}/${file}`);
    assert(source.includes('equation-detail-page'), `${language}/${id}: display wrapper`);
    if (source.includes('data-equation-index')) {
      assert.equal(equations(source).length,0, 'Compatibility indexes must not retain bundled equations');
      const targets = [...source.matchAll(/data-item-id="([^"]+)"/g)].map(m=>m[1]);
      assert(targets.length > 1 && !targets.includes(id), `${id}: index must name its individual equations`);
      for (const target of targets) assert(all.some(doc=>doc.id===target), `${id}: unknown indexed equation ${target}`);
    } else assert(source.includes('equation-display'), `${language}/${id}: equation window`);
    const generated = `science/${language}/equations/${file}`;
    assert(existsSync(generated), `${language}/${id}: standalone page missing`);
    const published = read(generated);
    for (const eq of equations(source)) assert(normalize(published).includes(normalize(eq)), `${generated}: stale formula`);
    const doc = all.find(doc => doc.file === `${directory}/${file}`);
    assert(doc, `${language}/${id}: missing registration`);
    const state = parseRoute(routeFor({ language, activeTopic: doc.topic?.id, activeSection: doc.section?.id, activeBranch: doc.branch, activeDetail: id }));
    assert.equal(state?.activeDetail, id, `${language}/${id}: interactive route`);
    const counterpart = read(`content/site/${language === 'en' ? 'es' : 'en'}/science/equations/${file}`);
    assert.deepEqual(equations(source).map(untranslatedMath), equations(counterpart).map(untranslatedMath), `${id}: bilingual display difference`);
  }
  for (const area of ['science', 'personal']) {
    const folder = `content/site/${language}/${area}`;
    for (const file of readdirSync(folder).filter(file => file.endsWith('.html'))) {
      const html = read(`${folder}/${file}`);
      for (const button of html.matchAll(/<button\b([^>]*data-item-id="([^"]+)"[^>]*)>([\s\S]*?)<\/button>/g)) {
        const displays = equations(button[3]);
        if (!displays.length) continue;
        const detail = read(`${directory}/${button[2]}.html`);
        for (const eq of displays) assert(normalize(detail).includes(normalize(eq)), `${language}/${file}: ${button[2]} differs from detail`);
        const branchId = button[1].match(/data-branch-id="([^"]+)"/)?.[1];
        const owners = [...siteContent.personalSections, ...siteContent.knowledgeWorlds.flatMap(d => d.topics)];
        assert(owners.some(owner => owner.branches?.some(branch => branch.id === branchId && branch.items.some(item => item.id === button[2]))), `${file}: unregistered equation button`);
        windows += displays.length;
      }
    }
  }
  for (const doc of documents(language).filter(doc => doc.source && bigBangLegacyContent.historyEquationMap[doc.id])) {
    const displays = equations(read(doc.file));
    bigBangLegacyContent.historyEquationMap[doc.id].forEach((id, index) => {
      assert(displays[index], `${doc.id}: legacy equation missing`);
      assert(normalize(read(`${directory}/${id}.html`)).includes(normalize(displays[index])), `${language}/${doc.id}: legacy ${id} differs`);
    });
  }
}
console.log(`Bilingual equation pairs, compatibility indexes, standalone pages, routes and ${windows} topic displays verified.`);

// Numerical checks for the examples and sign conventions revised in this audit.
function verlet(step) {
  let x = 1, v = 0;
  for (let n = 0; n < Math.round(1 / step); n += 1) {
    const next = x + v * step - 0.5 * x * step ** 2;
    v -= 0.5 * (x + next) * step;
    x = next;
  }
  return x;
}
assert(Math.abs(verlet(0.2) - 0.538893) < 0.0000005);
assert(Math.abs(verlet(0.1) - 0.539951) < 0.0000005);
const amplification = (lambda, angle) => 1 - 4 * lambda * Math.sin(angle / 2) ** 2;
for (const angle of [0, Math.PI / 4, Math.PI / 2, Math.PI]) assert(Math.abs(amplification(0.5, angle)) <= 1);
assert(Math.abs(amplification(0.51, Math.PI)) > 1);
const normalizedRedshift = (emitterRadius, observerRadius, rs) => Math.sqrt((1 - rs / emitterRadius) / (1 - rs / observerRadius)) - 1;
const exact = normalizedRedshift(10000, 20000, 1);
const weak = 0.5 * (1 / 20000 - 1 / 10000);
assert(exact < 0 && Math.abs(exact - weak) < 3e-9, 'Higher static observer sees lower frequency');
for (const language of ['en', 'es']) {
  const source = id => read(`content/site/${language}/science/equations/${id}.html`);
  assert(source('normalization-condition').includes('\\int_{\\mathbb R^3}'));
  assert(source('scalar-field-lagrangian').includes('\\mathcal{L}=-\\frac{1}{2}'));
  assert(source('trapped-surface-condition').includes('\\theta_{(n)} < 0'));
  assert(!/State clearly whether|Debe quedar claro si/.test(source('finite-difference-heat-equation')));
}
console.log('Verlet example, FTCS threshold, gravitational-redshift sign and corrected-formula regressions passed.');
