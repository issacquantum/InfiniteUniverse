import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { captureReaderPosition, restoreReaderPosition, restoreReaderScroll } from "../scripts/reader-position.js";
import { bindPinchZoom } from "../scripts/model-pan.js";

function reader(width, height, tops, scrollTop = 0) {
  const node = {
    clientWidth: width, clientHeight: 400, scrollHeight: height, scrollTop,
    getBoundingClientRect: () => ({ top: 80 }),
    querySelectorAll: () => tops.map(top => ({
      getClientRects: () => [{}],
      getBoundingClientRect: () => ({ top: 80 + top - node.scrollTop })
    }))
  };
  return node;
}
const previousWindow = globalThis.window;
try {
  globalThis.window = { visualViewport: { scale: 2, offsetTop: 200 } };
  const en = reader(390, 2000, [0, 300, 900, 1600], 500);
  const trigger = {
    getBoundingClientRect: () => ({ top: 80 + 750 - en.scrollTop }),
    focus: () => {}
  };
  const saved = captureReaderPosition(en, "en", trigger);
  en.scrollTop = 0;
  restoreReaderPosition(en, saved, "en", trigger);
  assert.equal(en.scrollTop, 500, "Back retains the exact nested scroll at the same zoom pan");
  window.visualViewport = { scale: 1, offsetTop: 0 };
  restoreReaderPosition(en, saved, "en", trigger);
  assert.equal(en.scrollTop, 620, "Zooming out retains the previously visible content point");
  window.visualViewport = { scale: 3, offsetTop: 280 };
  restoreReaderPosition(en, saved, "en", trigger);
  assert.equal(en.scrollTop, 420, "A different pinch pan preserves the content point");

  for (const [from, to] of [["en", "es"], ["es", "en"]]) {
    en.scrollTop = 500;
    window.visualViewport = { scale: 2, offsetTop: 200 };
    const position = captureReaderPosition(en, from);
    const translated = reader(390, 2600, [0, 400, 1300, 2100]);
    restoreReaderPosition(translated, position, to);
    assert.equal(translated.scrollTop, 760, "Translation retains the visible heading-relative position");
    restoreReaderPosition(en, captureReaderPosition(translated, to), from);
    assert.equal(en.scrollTop, 500, "The reverse language change returns to the same point");
  }
  const landscape = reader(844, 1200, [0, 180, 540, 960]);
  window.visualViewport = { scale: 1, offsetTop: 0 };
  restoreReaderPosition(landscape, saved, "en");
  assert.equal(landscape.scrollTop, 372, "Orientation uses the semantic anchor after reflow");
  const movedTrigger = {
    getBoundingClientRect: () => ({ top: 80 + 450 - landscape.scrollTop }),
    focus: () => {}
  };
  restoreReaderPosition(landscape, saved, "en", movedTrigger);
  assert.equal(landscape.scrollTop, 320, "Equation Back preserves the trigger's visible offset after reflow");

  const source = readFileSync(new URL("../scripts/app.js", import.meta.url), "utf8");
  const listeners = new Map();
  let saves = 0;
  const context = vm.createContext({
    window: { visualViewport: { addEventListener(type, handler, options) {
      assert.equal(options.passive, true);
      listeners.set(type, handler);
    } } },
    scheduleReaderSave: () => { saves++; }
  });
  const registrations = source.match(/^window\.visualViewport\?\.addEventListener\([^\n]+/gm);
  assert.equal(registrations?.length, 2);
  vm.runInContext(registrations.join("\n"), context);
  listeners.get("scroll")();
  listeners.get("resize")();
  assert.equal(saves, 2, "Pinch pan and zoom changes schedule history position saves");

  for (const coarse of [true, false]) {
    window.matchMedia = () => ({ matches: coarse });
    const handlers = [];
    const canvas = { dataset: {}, addEventListener(type, handler, options) { handlers.push({ type, handler, options }); } };
    let modelChanges = 0;
    let prevented = false;
    let stopped = false;
    canvas.addEventListener("wheel", event => { event.preventDefault(); modelChanges++; });
    bindPinchZoom(canvas, { getValue: () => 1, setValue() {}, min: 0, max: 10 });
    function wheel(ctrlKey) {
      stopped = false; prevented = false;
      const event = { ctrlKey, preventDefault() { prevented = true; }, stopImmediatePropagation() { stopped = true; } };
      for (const listener of handlers.filter(h => h.type === "wheel").sort((a, b) => Number(!!b.options?.capture) - Number(!!a.options?.capture))) {
        listener.handler(event);
        if (stopped) break;
      }
    }
    wheel(true);
    assert.equal(prevented, false, "Browser pinch wheel is not canceled");
    assert.equal(modelChanges, 0, "Browser pinch does not change model parameters");
    wheel(false);
    assert.equal(prevented, true);
    assert.equal(modelChanges, 1, "Ordinary model wheel controls still work");
    if (coarse) assert.ok(handlers.filter(h => h.type.startsWith("touch")).every(h => h.options?.passive), "Phone touch handlers leave native gestures available");
  }
} finally {
  if (previousWindow === undefined) delete globalThis.window;
  else globalThis.window = previousWindow;
}
console.log("Zoom pan, bilingual anchors, equation return, orientation, and browser gesture regression checks passed.");

const { parseRoute } = await import("../scripts/routes.js");
const appSource = readFileSync(new URL("../scripts/app.js", import.meta.url), "utf8");
function appFunction(name) {
  const start = appSource.indexOf(`function ${name}(`);
  const end = appSource.indexOf("\nfunction ", start + 1);
  assert.ok(start >= 0 && end > start);
  return appSource.slice(start, end);
}
for (const language of ["en", "es"]) {
  let state = parseRoute(`#/${language}/personal/personal-cosmology`);
  const parent = reader(390, 2000, [0, 300, 900], 500);
  const href = `index.html#/${language}/personal/personal-cosmology?branch=my-work-influences-equations&detail=flrw-metric`;
  const link = {
    href: `https://example.com/${href}`, target: "",
    getAttribute: name => name === "href" ? href : null,
    hasAttribute: () => false,
    getBoundingClientRect: () => ({ top: 330 }),
    closest: selector => selector === "a[href]" ? link : selector === ".content-window" ? parent : null
  };
  const headings = parent.querySelectorAll;
  parent.querySelectorAll = selector => selector === "a[href]" ? [link] : headings();
  let prevented = false;
  const event = { target: link, button: 0, preventDefault() { prevented = true; } };
  const context = vm.createContext({
    URL, parseRoute, captureReaderPosition,
    window: { location: new URL("https://example.com/index.html") },
    store: { getState: () => state, setState: update => { state = typeof update === "function" ? update(state) : { ...state, ...update }; } },
    getReturnTargetLabel: () => language === "en" ? "My Theory" : "Mi teoría",
    pendingReaderScrollRestoration: null, pendingStructuredReturn: null, pendingLegacyReturn: null,
    event
  });
  vm.runInContext(appFunction("clearPendingReturnNavigation") + appFunction("openReaderEquationLink") + appFunction("restoreEquationReturnTarget"), context);
  assert.equal(vm.runInContext("openReaderEquationLink({...event, ctrlKey:true})", context), false, "Modified clicks retain native new-tab behavior");
  assert.equal(vm.runInContext("openReaderEquationLink(event)", context), true);
  assert.equal(prevented, true);
  assert.equal(state.activeDetail, "flrw-metric");
  assert.equal(state.equationReturnTarget.position.scrollTop, 500);
  assert.equal(state.equationReturnTarget.position.triggerRoute, "/personal/personal-cosmology?branch=my-work-influences-equations&detail=flrw-metric");
  assert.equal("equationReturnTarget" in state.equationReturnTarget.position, false);
  vm.runInContext("restoreEquationReturnTarget()", context);
  assert.equal(state.activeSection, "personal-cosmology");
  assert.equal(state.activeDetail, null);
  assert.equal(state.equationReturnTarget, null);
  assert.equal(vm.runInContext("pendingReaderScrollRestoration.scrollTop", context), 500, "Inline equation Back restores its parent snapshot");
}
console.log("English and Spanish inline equation links retain their parent reading position.");

const translatedReader = reader(390, 2400, [0, 300, 900]);
const matchingLinks = [900, 1100].map(top => ({
  getAttribute: () => "index.html#/es/personal/personal-cosmology?branch=my-work-influences-equations&detail=flrw-metric",
  getBoundingClientRect: () => ({ top: 80 + top - translatedReader.scrollTop }),
  focus() {}
}));
const translatedHeadings = translatedReader.querySelectorAll;
translatedReader.querySelectorAll = selector => selector === "a[href]" ? matchingLinks : translatedHeadings();
assert.equal(restoreReaderScroll({ closest: () => translatedReader }, { activeSection: "personal-cosmology", language: "es" }, {
  activeSection: "personal-cosmology", language: "en", scrollTop: 500, scrollRatio: 0.3,
  triggerRoute: "/personal/personal-cosmology?branch=my-work-influences-equations&detail=flrw-metric",
  triggerOccurrence: 1, triggerOffset: 250
}), true);
assert.equal(translatedReader.scrollTop, 850, "Translation returns to the same occurrence of an inline equation link");
