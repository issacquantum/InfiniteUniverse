import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { installRoutes, parseRoute, routeFor } from '../scripts/routes.js';
import { createState } from '../scripts/state.js';
import { guardReaderRestoration, matchesReaderState } from '../scripts/reader-position.js';
import { siteContent } from '../data/site-content.js';

const section = siteContent.personalSections.find(s => s.id === 'origins-interests');
assert.deepEqual(section.chapters.map(c => c.id), ['origins', 'learning-path', 'music', 'practice-worlds']);
for (const language of ['en', 'es']) {
  for (const chapter of section.chapters) {
    const state = parseRoute(`#/${language}/personal/${chapter.id}`);
    assert.equal(state.activeSection, section.id);
    assert.equal(state.activeChapter, chapter.id);
    assert.equal(parseRoute(routeFor(state)).activeChapter, chapter.id);
    assert.ok(existsSync(chapter.contentFile[language]));
  }
  assert.equal(parseRoute(`#/${language}/personal/origins-interests`).activeChapter, 'origins');
  assert.equal(parseRoute(`#/${language}/personal/origins-interests?chapter=missing`), null);
}
assert.equal(matchesReaderState({activeChapter:'music'}, {activeChapter:'origins'}), false);
const reader = new EventTarget();
let allowed = guardReaderRestoration(reader);
assert.equal(allowed(), true);
for (const type of ['wheel', 'touchstart', 'pointerdown', 'keydown']) {
  allowed = guardReaderRestoration(reader);
  reader.dispatchEvent(new Event(type));
  assert.equal(allowed(), false, `${type} takes priority over late typesetting`);
}

const events = new Map();
globalThis.window = {addEventListener(type, fn) { events.set(type, fn); }};
globalThis.location = {hash: '#/en/personal/origins-interests?chapter=origins'};
globalThis.crypto ??= {randomUUID};
let writes = 0, index = 0;
const entries = [{state:null, hash:location.hash}];
globalThis.history = {
  get state() { return entries[index].state; },
  replaceState(state, _, url) { writes++; entries[index] = {state, hash:url ?? location.hash}; location.hash = entries[index].hash; },
  pushState(state, _, url) { writes++; entries.splice(++index, entries.length, {state, hash:url}); location.hash = url; }
};
const store = createState({language:'en'});
let top = 0, restored;
const timers = new Map();
let timerId = 0;
const realSetTimeout = globalThis.setTimeout;
const realClearTimeout = globalThis.clearTimeout;
globalThis.setTimeout = (fn, delay) => { timers.set(++timerId, {fn,delay}); return timerId; };
globalThis.clearTimeout = id => timers.delete(id);
const scheduleSave = installRoutes(store, position => { restored = position; }, state => ({...state,scrollTop:top}));
const initialWrites = writes;
for (let i = 0; i < 10000; i++) {
  top = i;
  scheduleSave();
}
assert.equal(writes, initialWrites, 'Scroll events never synchronously mutate history');
assert.equal(timers.size,1,'A scroll burst has only one pending snapshot');
const settled = [...timers.values()][0];
settled.fn();
assert.equal(writes,initialWrites+1,'A settled burst writes once');
scheduleSave();
assert.ok([...timers.values()][0].delay >= 1900,'Subsequent scroll snapshots are rate-limited');
store.setState({activeChapter:'music'});
assert.equal(entries[0].state.reader.scrollTop, 9999);
top = 420;
index = 0; location.hash = entries[index].hash; events.get('popstate')();
assert.equal(restored.scrollTop,9999);
assert.equal(store.getState().activeChapter,'origins');
top = 9999;
index = 1; location.hash = entries[index].hash; events.get('popstate')();
assert.equal(restored.scrollTop,420, 'Forward retains the outgoing Back position in memory');
assert.equal(store.getState().activeChapter,'music');
events.get('pagehide')();
assert.equal(history.state.reader.activeChapter,'music');
globalThis.setTimeout = realSetTimeout;
globalThis.clearTimeout = realClearTimeout;
const app = readFileSync(new URL('../scripts/app.js',import.meta.url),'utf8');
assert.doesNotMatch(app,/addEventListener\("scroll",[\s\S]{0,400}history\.replaceState/);
assert.match(app,/lastGalleryTrigger\.focus\(\{ preventScroll: true \}\)/);
console.log('Chapter aliases, bilingual routes, interaction priority, scroll bursts, Back/Forward and history persistence passed.');

const { default: vm } = await import('node:vm');
const touchHandlers = new Map();
let steps = 0;
const viewport = {scale:1};
const context = vm.createContext({
  refs: {galleryLightbox:{addEventListener(type, handler) { touchHandlers.set(type,handler); }}},
  window: {visualViewport:viewport},
  galleryTouchStartX:null, galleryTouchStartY:null,
  isGalleryZoomed:()=>false, stepGalleryImage:()=>steps++
});
vm.runInContext(app.slice(app.indexOf('refs.galleryLightbox?.addEventListener("touchstart"'), app.indexOf('refs.galleryLightbox?.addEventListener("wheel"')),context);
const finger = (x) => ({clientX:x,clientY:0});
const start = touches => touchHandlers.get('touchstart')({touches});
const end = x => touchHandlers.get('touchend')({touches:[],changedTouches:[finger(x)]});
start([finger(100)]); start([finger(100),finger(200)]); end(250);
assert.equal(steps,0,'A pinch cannot change images');
start([finger(100)]); touchHandlers.get('touchcancel')(); end(250);
assert.equal(steps,0,'A cancelled gesture cannot change images');
start([finger(100)]); end(100);
assert.equal(steps,0,'A stationary long press cannot change images');
start([finger(100)]); end(250);
assert.equal(steps,1,'Single-finger swipe still works');
viewport.scale=2;start([finger(100)]);end(250);
assert.equal(steps,1,'Panning a browser-zoomed image cannot change images');
console.log('Gallery pinch, cancellation, stationary touch, swipe and browser-zoom guards passed.');

assert.deepEqual(siteContent.personalSections.map(s => s.id), ['origins-interests', 'systems-work', 'personal-cosmology', 'library-influences']);
for (const language of ['en', 'es']) {
  const learning = parseRoute(`#/${language}/personal/learning-path`);
  assert.equal(learning.activeSection, 'origins-interests');
  assert.equal(learning.activeChapter, 'learning-path');
  const library = parseRoute(`#/${language}/personal/learning-path?chapter=library-influences`);
  assert.equal(library.activeSection, 'library-influences');
  assert.equal(library.activeChapter, null);
}
