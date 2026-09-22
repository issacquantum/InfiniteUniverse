import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../scripts/foundation-models.js', import.meta.url), 'utf8');
const method = (name, next) => source.slice(source.indexOf('  ' + name + '() {'), source.indexOf('  ' + next + '() {'));
class Vector {
  constructor(x = 0, y = 0, z = 0) { Object.assign(this, { x, y, z }); }
  copy(v) { Object.assign(this, { x: v.x, y: v.y, z: v.z }); return this; }
  clone() { return new Vector().copy(this); }
  multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
  normalize() { return this.multiplyScalar(1 / Math.hypot(this.x, this.y, this.z)); }
}
class Mesh {
  constructor() { this.position = new Vector(); this.rotation = {}; }
}
class Arrow extends Mesh {
  constructor(direction) { super(); this.direction = direction; }
  setDirection(direction) { this.direction = direction; }
}
const THREE = { Vector3: Vector, Mesh, ArrowHelper: Arrow, SphereGeometry: class {}, TorusGeometry: class {} };
const TestModel = vm.runInNewContext(
  'class TestModel { ' + method('addMechanicsModel', 'addElectromagnetismModel') + method('bindInteraction', 'setupObservers') + ' }; TestModel',
  { bindPinchZoom() {}, COLORS: {} }
);
const objects = [];
const model = new TestModel();
Object.assign(model, { THREE, modelGroup: { add(...items) { objects.push(...items); } }, material() {}, addGrid() {} });
model.addMechanicsModel();
const body = objects[2], force = objects[3], velocity = objects[4];
const sample = t => { model.dynamic(t); return { r: body.position.clone(), f: force.direction.clone(), v: velocity.direction.clone() }; };
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
