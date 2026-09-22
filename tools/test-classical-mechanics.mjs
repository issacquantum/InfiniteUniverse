import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../scripts/foundation-models.js', import.meta.url), 'utf8');
const method = (name, next) => source.slice(source.indexOf('  ' + name + '() {'), source.indexOf('  ' + next + '() {'));
class Vector {
  constructor(x = 0, y = 0, z = 0) { Object.assign(this, { x, y, z }); }
  set(x, y, z) { Object.assign(this, { x, y, z }); return this; }
  copy(v) { Object.assign(this, { x: v.x, y: v.y, z: v.z }); return this; }
  clone() { return new Vector().copy(this); }
  multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
  normalize() { return this.multiplyScalar(1 / Math.hypot(this.x, this.y, this.z)); }
}
class Mesh {
  constructor() { this.position = new Vector(); this.rotation = {}; this.scale = { setScalar() {} }; }
}
class Arrow extends Mesh {
  constructor(direction) { super(); this.direction = direction; }
  setDirection(direction) { this.direction = direction; }
}
const THREE = { Vector3: Vector, Mesh, ArrowHelper: Arrow, SphereGeometry: class {}, TorusGeometry: class {} };
const TestModel = vm.runInNewContext(
  'class TestModel { ' + method('addMechanicsModel', 'addElectromagnetismModel') + method('bindInteraction', 'setupObservers') + ' }; TestModel',
  { bindPinchZoom() {}, COLORS: {}, AbortController }
);
const nodes = new Map();
const controls = { addEventListener(name, fn) { this[name] = fn; }, querySelector(selector) {
  if (!nodes.has(selector)) nodes.set(selector, { addEventListener(name, fn) { this[name] = fn; }, setAttribute() {} });
  return nodes.get(selector);
} };
const objects = [];
const model = new TestModel();
Object.assign(model, { container: { dataset: { language: "en" }, querySelector() { return controls; } }, state: {}, THREE, modelGroup: { add(...items) { objects.push(...items); } }, material() {}, addGrid() {} });
model.addMechanicsModel();
const body = objects[2], force = objects[3], velocity = objects[4];
const sample = t => { model.mechanics.phase = t * model.mechanics.parameters.omega; model.dynamic(0, 0); return { r: body.position.clone(), f: force.direction.clone(), v: velocity.direction.clone() }; };
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const h = 1e-3;
for (const t of [0, 0.2, 1, 3, 8, 20]) {
  const before = sample(t - h), at = sample(t), after = sample(t + h);
  assert.ok(Math.abs(Math.hypot(at.r.x, at.r.y, at.r.z) - 1.95) < 1e-12);
  assert.equal(at.r.y, 0);
  assert.ok(Math.abs(dot(at.r, at.v)) < 1e-12);
  const derivative = new Vector(...['x', 'y', 'z'].map(k => (after.r[k] - before.r[k]) / (2 * h)));
  const acceleration = new Vector(...['x', 'y', 'z'].map(k => (after.r[k] - 2 * at.r[k] + before.r[k]) / (h * h)));
  assert.ok(dot(derivative.normalize(), at.v) > 1 - 1e-9, 'velocity follows the actual trajectory');
  assert.ok(dot(acceleration.normalize(), at.f) > 1 - 1e-9, 'force follows the actual acceleration');
}

for (const [mass, radius, omega] of [[1,1.95,.62],[5,2.5,2],[.5,.75,0],[2,1,1]]) {
  for (const [key, value] of Object.entries({ mass, radius, omega })) {
    controls.input({ target: { dataset: { mechanicsParam: key }, value, min: key === 'omega' ? 0 : key === 'radius' ? .75 : .5, max: key === 'omega' ? 2 : key === 'radius' ? 2.5 : 5 } });
  }
  const read = key => Number(nodes.get('[data-mechanics-readout="' + key + '"]').textContent);
  assert.ok(Math.abs(read('speed') - omega * radius) <= .0005);
  assert.ok(Math.abs(read('acceleration') - omega ** 2 * radius) <= .0005);
  assert.ok(Math.abs(read('force') - mass * omega ** 2 * radius) <= .0005);
  assert.equal(model.mechanics.phase, 0);
  assert.equal(force.visible, omega > 0);
  assert.ok(Math.abs(Math.hypot(body.position.x,body.position.z)-radius)<1e-12);
}
const pause = nodes.get('[data-mechanics-pause]');
pause.click(); model.dynamic(100,.05); assert.equal(model.mechanics.phase,0);
pause.click(); model.dynamic(100,.05); assert.ok(model.mechanics.phase>0);
nodes.get('[data-mechanics-reset]').click();
assert.equal(model.mechanics.phase,0); assert.equal(model.mechanics.parameters.mass,1);
assert.equal(model.mechanics.parameters.radius,1.95); assert.equal(model.mechanics.paused,false);

function verlet(step) {
 let x=1,v=0;
 for(let n=0;n<Math.round(1/step);n++){const next=x+v*step-.5*x*step*step;v-=.5*(x+next)*step;x=next;}
 return x;
}
assert.ok(Math.abs(verlet(.2)-.538893)<.0000005);
assert.ok(Math.abs(verlet(.1)-.539951)<.0000005);
const ratio=Math.abs(verlet(.2)-Math.cos(1))/Math.abs(verlet(.1)-Math.cos(1));
assert.ok(ratio>3.9 && ratio<4.1);
const handlers = {};
Object.assign(model, { type: 'mechanics', state: { yaw: -0.42, pitch: 0.28, distance: 7.8 }, canvas: { addEventListener(name, fn) { handlers[name] = fn; } } });
model.bindInteraction();
const press = key => handlers.keydown({ key, preventDefault() {} });
press('ArrowRight'); assert.ok(model.state.yaw > -0.42);
for (let n = 0; n < 200; n++) { press('ArrowDown'); press('+'); }
assert.equal(model.state.pitch, 0.72); assert.equal(model.state.distance, 4.4);
press('Home'); assert.equal(model.state.yaw, -0.42); assert.equal(model.state.distance, 7.8);
delete handlers.keydown;
model.type = 'electromagnetism';
model.bindInteraction();
assert.equal(handlers.keydown, undefined, 'other foundation models retain their controls');
console.log('Circular trajectory, force/velocity directions, keyboard limits and model isolation passed.');

const data = readFileSync(new URL('../data/site-content.js', import.meta.url), 'utf8');
const branch = data.split('const classicalMechanicsEquationBranch = {')[1].split('const electromagnetismEquationBranch')[0];
const equationIds = [...branch.matchAll(/createStructuredItem\("science\/equations", "([^"]+)"/g)].map(match => match[1]);
const mathOf = text => [...text.matchAll(/\\\(([\s\S]*?)\\\)|\$\$([\s\S]*?)\$\$/g)].map(match => match[1] ?? match[2]);
for (const relative of ['classical-mechanics.html', ...equationIds.map(id => 'equations/' + id + '.html')]) {
  const versions = ['en', 'es'].map(language => readFileSync(new URL('../content/site/' + language + '/science/' + relative, import.meta.url), 'utf8'));
  for (const text of versions) {
    let open = null;
    for (const match of text.matchAll(/\\\(|\\\)|\$\$/g)) {
      const token = match[0];
      if (token === '\\(') { assert.equal(open, null, relative + ': nested math'); open = token; }
      else if (token === '\\)') { assert.equal(open, '\\(', relative + ': unmatched close'); open = null; }
      else { assert.ok(open === null || open === '$$', relative + ': nested display'); open = open ? null : '$$'; }
    }
    assert.equal(open, null, relative + ': unclosed math');
  }
  if (relative.startsWith('equations/mechanics-') && ['mechanics-center-of-mass','mechanics-orbital-energy','mechanics-small-oscillations','mechanics-pendulum','mechanics-rotational-energy'].some(id => relative.includes(id))) {
    assert.deepEqual(mathOf(versions[0]), mathOf(versions[1]), relative + ': bilingual formulas differ');
  }
}
console.log('All 18 mechanics equations and both articles have balanced, nonnested math; new equation formulas match across languages.');
