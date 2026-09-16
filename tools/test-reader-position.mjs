import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { captureReaderPosition, restoreReaderPosition, matchesReaderState } from "../scripts/reader-position.js";

function reader(height, tops, scrollTop = 0) {
  const node = {
    scrollTop, scrollHeight: height, clientHeight: 200,
    getBoundingClientRect: () => ({ top: 10 }),
    querySelectorAll: () => tops.map((top) => ({
      getClientRects: () => [{}],
      getBoundingClientRect: () => ({ top: top - node.scrollTop + 10 })
    }))
  };
  return node;
}

const en = reader(1000, [0, 200, 600], 400);
const position = captureReaderPosition(en, "en");
assert.equal(position.scrollRatio, 0.5);
const es = reader(1600, [0, 300, 1100]);
restoreReaderPosition(es, position, "es");
assert.equal(es.scrollTop, 700, "Keep halfway through the corresponding heading interval");
restoreReaderPosition(en, captureReaderPosition(es, "es"), "en");
assert.equal(en.scrollTop, 400, "Reverse translation returns to the original position");
const differentStructure = reader(1600, [0, 400]);
restoreReaderPosition(differentStructure, position, "es");
assert.equal(differentStructure.scrollTop, 700, "Use the ratio if heading structures differ");
restoreReaderPosition(es, position, "en");
assert.equal(es.scrollTop, 400, "Keep exact pixels in the same language");
for (const fraction of [0, 1]) {
  restoreReaderPosition(es, { ...position, scrollRatio: fraction }, "es");
  assert.equal(es.scrollTop, fraction * 1400, "Preserve article endpoints");
}
const empty = reader(100, [], 0);
restoreReaderPosition(empty, position, "es");
assert.equal(empty.scrollTop, 0, "Non-scrollable content remains at zero");
let focused = false;
es.scrollTop = 0;
restoreReaderPosition(es, { ...position, triggerOffset: 80 }, "es", {
  getBoundingClientRect: () => ({ top: 1010 }),
  focus: (options) => { assert.equal(options.preventScroll, true); focused = true; }
});
assert.equal(es.scrollTop, 920, "Keep the original equation's viewport offset after translation");
assert.equal(focused, true);
const state = { activeSection: null, activeDomain: "physical-foundations", activeTopic: "fluid-mechanics-navier-stokes", activeBranch: "fluid-mechanics-navier-stokes-equations", activeDetail: "fluid-energy" };
assert.equal(matchesReaderState(state, { ...state, language: "es" }), true);
for (const key of Object.keys(state)) {
  assert.equal(matchesReaderState(state, { ...state, [key]: "different" }), false, key);
}

// Exercise the actual app functions without loading its DOM and model dependencies.
const source = readFileSync(new URL("../scripts/app.js", import.meta.url), "utf8");
function appFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  const end = source.indexOf("\nfunction ", start + 1);
  assert.ok(start >= 0 && end > start);
  return source.slice(start, end);
}
let current = { ...state, language: "en", equationReturnTarget: { topicId: state.activeTopic, detailId: null, position } };
let captures = 0;
const context = vm.createContext({
  store: { getState: () => current, setState: (updater) => { current = updater(current); } },
  captureReaderScrollRestoration: () => { captures++; },
  getReturnTargetLabel: (_, language) => language,
  pendingStructuredReturn: { topicId: state.activeTopic, detailId: null, itemId: "fluid-energy", position },
  pendingLegacyReturn: null
});
vm.runInContext(appFunction("toggleLanguage"), context);
for (const language of ["es", "en"]) {
  vm.runInContext("toggleLanguage()", context);
  assert.equal(current.language, language);
  for (const key of Object.keys(state)) assert.equal(current[key], state[key], key);
  assert.equal(current.equationReturnTarget.position, position);
  assert.equal(current.equationReturnTarget.label, language);
}
assert.equal(captures, 2);
vm.runInContext(appFunction("createEquationReturnTarget"), context);
const target = vm.runInContext('createEquationReturnTarget({language:"en"})', context);
assert.equal(target.detailId, null, "A parent article's null detail is not the clicked equation ID");
assert.equal(target.itemId, "fluid-energy");
console.log("Reader position, bilingual state, and equation-return regression checks passed.");

const legacySource = readFileSync(new URL("../scripts/legacy-content.js", import.meta.url), "utf8");
let committedDocument;
let requestedFiles;
const legacyContext = vm.createContext({
  activeRequestToken: 0,
  getActiveLegacyItem: () => ({ source: {} }),
  resolveLegacyFileCandidates: () => ["spanish.html", "english.html"],
  getCachedDocumentNow: (file) => file === "english.html" ? "cached English" : null,
  hasCachedDocument: () => false,
  loadDocument: async (files) => { requestedFiles = Array.from(files); return "Spanish"; },
  commitLegacyDocument: ({ documentNode }) => { committedDocument = documentNode; }
});
vm.runInContext(legacySource.slice(legacySource.indexOf("export async function syncLegacyContent")).replace("export ", ""), legacyContext);
legacyContext.options = {
  state: { language: "es" }, content: {},
  refs: { stage: { querySelector: () => ({ isConnected: true, childElementCount: 1, setAttribute() {} }) } }
};
await vm.runInContext("syncLegacyContent(options)", legacyContext);
assert.deepEqual(requestedFiles, ["spanish.html", "english.html"]);
assert.equal(committedDocument, "Spanish", "Cached English must not bypass the Spanish source");
console.log("Legacy language source priority regression check passed.");
