import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../scripts/performance-profile.js", import.meta.url), "utf8").replace(/export /g, "");
function environment(width, touch = false) {
  const rafs = new Map(), timers = new Map(), intersections = [], mutations = [], resizes = [];
  let now = 0, sequence = 0;
  const events = () => ({ handlers: new Map(), addEventListener(name, fn) { this.handlers.set(name, fn); }, removeEventListener(name) { this.handlers.delete(name); } });
  const profile = { ...events(), matches: width <= 1024 || touch };
  const reduced = { ...events(), matches: false };
  const body = { dataset: {}, ...events() };
  const document = { body, hidden: false, ...events() };
  const context = vm.createContext({ document,
    window: { devicePixelRatio: 3, matchMedia: (query) => query.includes("prefers-reduced") ? reduced : profile },
    performance: { now: () => now },
    requestAnimationFrame: (fn) => { rafs.set(++sequence, fn); return sequence; },
    cancelAnimationFrame: (id) => rafs.delete(id),
    setTimeout: (fn, delay) => { timers.set(++sequence, { fn, at: now + delay }); return sequence; },
    clearTimeout: (id) => timers.delete(id),
    IntersectionObserver: class { constructor(fn, options) { this.fn = fn; this.options = options; intersections.push(this); } observe(element) { this.element = element; } unobserve() {} disconnect() {} },
    MutationObserver: class { constructor(fn) { this.fn = fn; mutations.push(this); } observe() {} disconnect() {} },
    ResizeObserver: class { constructor(fn) { this.fn = fn; resizes.push(this); } observe() {} disconnect() {} }
  });
  vm.runInContext(source + '\nthis.api = {isMobilePerformance, modelPixelRatio, modelRendererOptions, requestModelFrame, stopModelAnimation, deferModelInitialization, observeMobileMedia};', context);
  const advance = (duration) => {
    const end = now + duration;
    while (now < end) {
      now += 1;
      for (const [id, timer] of [...timers]) if (timer.at <= now) { timers.delete(id); timer.fn(); }
      if (now % 16 === 0) for (const [id, fn] of [...rafs]) { rafs.delete(id); fn(now); }
    }
  };
  return { api: context.api, body, document, profile, reduced, rafs, timers, intersections, mutations, resizes, advance, events };
}
for (const [width, touch, mobile] of [[375,false,true],[430,false,true],[768,false,true],[820,false,true],[1024,false,true],[1025,false,false],[1440,false,false],[1366,true,true]]) {
  const env = environment(width, touch);
  assert.equal(env.api.isMobilePerformance(), mobile, `${width}, touch=${touch}`);
  assert.equal(env.api.modelPixelRatio(), mobile ? 1 : 2);
  const original = { antialias: true, powerPreference: "high-performance", alpha: false };
  const options = env.api.modelRendererOptions(original);
  if (mobile) { assert.equal(options.antialias, false); assert.equal(options.powerPreference, "low-power"); }
  else assert.equal(options, original, "Desktop options remain the original object");
}
const env = environment(820);
const container = { ...env.events(), isConnected: true };
let frames = 0, destroyed = 0;
const model = { container, render() { frames++; env.api.requestModelFrame(model); }, destroy() { destroyed++; } };
let initialized = 0;
env.api.deferModelInitialization(container, () => initialized++);
assert.equal(initialized, 0);
env.intersections[0].fn([{target: container, isIntersecting: false}]);
assert.equal(initialized, 0);
env.intersections[0].fn([{target: container, isIntersecting: true}]);
assert.equal(initialized, 1);
env.api.requestModelFrame(model);
const visibility = env.intersections[1];
env.advance(1000); assert.equal(frames, 0, "No frame before intersection");
visibility.fn([{isIntersecting: true}]);
env.advance(1000); assert.ok(frames > 0 && frames <= 31, `${frames} frames in one second`);
visibility.fn([{isIntersecting: false}]);
const offscreen = frames; env.advance(1000); assert.equal(frames, offscreen);
assert.equal(env.rafs.size + env.timers.size, 0);
visibility.fn([{isIntersecting: true}]);
for (let cycle = 0; cycle < 5; cycle++) {
  env.document.hidden = true; env.document.handlers.get("visibilitychange")();
  const before = frames; env.advance(100); assert.equal(frames, before);
  assert.equal(env.rafs.size + env.timers.size, 0);
  env.document.hidden = false; env.document.handlers.get("visibilitychange")();
  env.document.handlers.get("visibilitychange")();
  assert.ok(env.rafs.size + env.timers.size <= 1, "Only one scheduled callback on resume");
  env.advance(100);
}
env.body.dataset.motion = "reduced";
env.mutations.at(-1).fn();
env.advance(100); const staticFrames = frames;
env.advance(1000); assert.equal(frames, staticFrames, "No repeated static drawing");
container.handlers.get("input")(); env.advance(100); assert.equal(frames, staticFrames + 1);
assert.equal(env.rafs.size + env.timers.size, 0);
container.isConnected = false; env.mutations[0].fn();
assert.equal(destroyed, 1); assert.equal(container.handlers.size, 0);
assert.equal(env.rafs.size + env.timers.size, 0);
const desktop = environment(1440);
let desktopFrames = 0;
const desktopModel = { render() { desktopFrames++; } };
const frame = desktop.api.requestModelFrame(desktopModel);
assert.ok(desktop.rafs.has(frame)); desktop.advance(16); assert.equal(desktopFrames, 1);
assert.equal(desktop.intersections.length, 0, "Desktop gets no mobile observers");
console.log("Mobile boundaries, desktop configuration, lazy initialization, frame cap, visibility, reduced motion, and cleanup passed.");

const mediaEnv = environment(820);
let plays = 0;
const video = { ...mediaEnv.events(), isConnected: true, paused: false,
  pause() { this.paused = true; }, play() { this.paused = false; plays++; return Promise.resolve(); }
};
mediaEnv.api.observeMobileMedia({ querySelectorAll: () => [video] });
mediaEnv.intersections[0].fn([{isIntersecting:false}]);
assert.equal(video.paused, true);
mediaEnv.intersections[0].fn([{isIntersecting:true}]);
assert.equal(plays, 1);
mediaEnv.document.hidden = true; mediaEnv.document.handlers.get("visibilitychange")();
assert.equal(video.paused, true);
mediaEnv.document.hidden = false; mediaEnv.document.handlers.get("visibilitychange")();
assert.equal(plays, 2);
video.isConnected = false; mediaEnv.mutations[0].fn();
assert.equal(video.paused, true); assert.equal(video.handlers.size, 0);
console.log("Offscreen/hidden native video pause, resume, and cleanup passed.");
