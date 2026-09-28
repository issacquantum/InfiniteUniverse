import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { siteContent } from '../data/site-content.js';
import { parseRoute, routeFor } from '../scripts/routes.js';

const topic = siteContent.knowledgeWorlds.flatMap(d => d.topics).find(t => t.id === 'stars');
const chapters = topic.branches.find(b => b.id === 'stars-chapters');
const equations = topic.branches.find(b => b.id === 'stars-equations');
assert.equal(chapters.items.length, 7);
assert.equal(equations.items.length, 17);
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
console.log('Seven bilingual Stars chapters, seventeen individual equations, parent routes, solar estimates and the TOV limit passed.');

for (const lang of ['en', 'es']) {
  for (const equation of equations.items) {
    const page = readFileSync(`science/${lang}/equations/${equation.id}.html`, 'utf8');
    assert(page.includes(`index.html#/${lang}/science/stars?branch=stars-equations&detail=${equation.id}`), `${equation.id}: canonical Stars entry`);
  }
  const home = readFileSync(`content/site/${lang}/science/stars.html`, 'utf8');
  assert(home.includes('detail=stellar-structure&amp;heading=balance'));
  const foundations = readFileSync(`content/site/${lang}/science/stellar-foundations.html`, 'utf8');
  assert(foundations.includes(lang === 'en' ? 'per unit area per unit time' : 'por unidad de área y por unidad de tiempo'));
  for (const id of ['stellar-hr', 'stellar-seismic-example', 'dinosaur-tree', 'dinosaur-time']) {
    const svg = readFileSync(`Assets2/diagrams/${id}-${lang}.svg`, 'utf8');
    assert(svg.includes('<title') && svg.includes('<desc') && svg.includes('viewBox='));
    assert(!svg.includes('<script'));
  }
  const timeline = readFileSync(`Assets2/diagrams/dinosaur-time-${lang}.svg`, 'utf8');
  const lengths = [...timeline.matchAll(/width="40" height="([\d.]+)"/g)].map(m => Number(m[1]));
  const boundaries = [251.902, 201.4, 143.1, 66];
  assert.equal(lengths.length, 3);
  lengths.forEach((height, i) => assert(Math.abs(height / 2 - (boundaries[i] - boundaries[i + 1])) < 0.001));
}
const density = 1000, radius = 1e9;
const massAt = r => 4 * Math.PI * density * r ** 3 / 3;
const pressureAt = r => 2 * Math.PI * G * density ** 2 * (radius ** 2 - r ** 2) / 3;
assert.equal(pressureAt(radius), 0);
assert(Math.abs(massAt(radius / 2) / massAt(radius) - 0.125) < 1e-14);
for (const fraction of [0.1, 0.5, 0.9]) {
  const r = fraction * radius, h = radius * 1e-6;
  const slope = (pressureAt(r + h) - pressureAt(r - h)) / (2 * h);
  const balance = -G * massAt(r) * density / r ** 2;
  assert(Math.abs(slope / balance - 1) < 1e-8, 'Integrated model satisfies local hydrostatic balance');
}
assert(Math.abs(pressureAt(0) / 1e14 - 1.3979) < 0.0001);
console.log('Pressure units, canonical entry, proportional timeline, accessible figures and coupled stellar model passed.');

// Check plotted coordinates against the coupled model, including both boundaries.
for (const lang of ['en', 'es']) {
  const svg = readFileSync(`Assets2/diagrams/stellar-uniform-profiles-${lang}.svg`, 'utf8');
  for (const [id, bottom, range, scale, fn] of [
    ['mass', 270, 4.5, 1e30, massAt], ['pressure', 521, 1.5, 1e14, pressureAt]
  ]) {
    const points = svg.match(new RegExp(`id="${id}-curve" points="([^"]+)"`))[1].split(' ').map(p => p.split(',').map(Number));
    assert.equal(points.length, 101);
    points.forEach(([x, y], i) => {
      assert(Math.abs(x - (64 + 266 * i / 100)) < 0.001);
      const expected = bottom - 168 * fn(radius * i / 100) / scale / range;
      assert(Math.abs(y - expected) < 0.001, `${id}: plot differs from model at sample ${i}`);
    });
  }
  for (const chapter of ['stellar-formation', 'stellar-structure', 'stellar-evolution', 'stellar-observation', 'stellar-asteroseismology', 'dinosaurs']) {
    const source = readFileSync(`content/site/${lang}/science/${chapter}.html`, 'utf8');
    const output = readFileSync(`science/${lang}/${chapter === 'dinosaurs' ? 'dinosaurs/index' : 'stars/' + chapter}.html`, 'utf8');
    const figures = html => [...html.matchAll(/<figure class="lesson-figure">[\s\S]*?<\/figure>/g)].map(m => m[0]);
    assert.deepEqual(figures(output), figures(source), `${chapter}: static/interactive figure mismatch`);
    for (const figure of figures(source)) {
      const image = figure.match(/<img\b[^>]+>/)[0];
      assert(/width="\d+" height="\d+"/.test(image), 'Reserve intrinsic image dimensions');
      assert(/alt="[^"]+"/.test(image), 'Meaningful alternative text');
      const src = image.match(/src="([^"]+)"/)[1];
      assert(src.startsWith('Assets2/'), 'Lesson figures must be hosted locally');
      const file = readFileSync(src);
      if (src.endsWith('.svg')) {
        const dimensions = file.toString().match(/viewBox="0 0 (\d+) (\d+)"/);
        assert(image.includes(`width="${dimensions[1]}" height="${dimensions[2]}"`));
      } else {
        assert.equal(file.readUInt16BE(0), 0xffd8, 'Photo must be a JPEG, not an error response');
        assert(/creativecommons.org\/licenses\//.test(figure), 'Photo license must accompany the image');
      }
    }
  }
}
console.log('Inline figure parity, intrinsic dimensions, photo licenses and plotted model coordinates passed.');
