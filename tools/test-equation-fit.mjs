import assert from 'node:assert/strict';
import { fitEquationBlocks } from '../scripts/equation-fit.js';

const originalRAF = globalThis.requestAnimationFrame;
const originalStyle = globalThis.getComputedStyle;
globalThis.requestAnimationFrame = callback => queueMicrotask(callback);
globalThis.getComputedStyle = () => ({ paddingLeft: '10', paddingRight: '10' });
function fixture(tagName, naturalWidth) {
  const properties = new Map();
  const attributes = new Map();
  const block = {
    tagName, clientWidth: 260,
    style: { getPropertyValue: name => properties.get(name), setProperty: (name, value) => properties.set(name, value) },
    classList: { add() {}, remove() {} },
    querySelector: () => math
  };
  const math = {
    dataset: {},
    get scrollWidth() { return naturalWidth * Number(properties.get('--equation-fit-scale') || 1); },
    get clientWidth() { return Math.min(this.scrollWidth, block.clientWidth - 20); },
    getBoundingClientRect() { return { width: this.clientWidth }; },
    hasAttribute: name => name === 'data-equation-scroll' ? 'equationScroll' in math.dataset : attributes.has(name),
    removeAttribute(name) {
      if (name === 'data-equation-scroll') delete math.dataset.equationScroll;
      else attributes.delete(name);
    },
    set tabIndex(value) { attributes.set('tabindex', value); },
    get tabIndex() { return attributes.get('tabindex'); }
  };
  return { block, math, host: { querySelectorAll: () => [block] } };
}
try {
  const long = fixture('DIV', 1000);
  await fitEquationBlocks(long.host);
  assert.equal(Number(long.block.style.getPropertyValue('--equation-fit-scale')), 0.85);
  assert.equal(long.math.tabIndex, 0, 'Overflowing explanation formulas support keyboard scrolling');
  long.block.clientWidth = 1200;
  await fitEquationBlocks(long.host);
  assert.equal(Number(long.block.style.getPropertyValue('--equation-fit-scale')), 1);
  assert.equal(long.math.tabIndex, undefined, 'No extra focus stop after the formula fits');
  const button = fixture('BUTTON', 1000);
  await fitEquationBlocks(button.host);
  assert.equal(button.math.tabIndex, undefined, 'No nested focusable element inside an equation button');
  const existingFocus = fixture('DIV', 1000);
  existingFocus.math.tabIndex = 0;
  await fitEquationBlocks(existingFocus.host);
  existingFocus.block.clientWidth = 1200;
  await fitEquationBlocks(existingFocus.host);
  assert.equal(existingFocus.math.tabIndex, 0, 'Preserve MathJax keyboard behavior when it owns the focus stop');
  const short = fixture('DIV', 100);
  await fitEquationBlocks(short.host);
  assert.equal(Number(short.block.style.getPropertyValue('--equation-fit-scale')), 1);
  assert.equal(short.math.tabIndex, undefined);
  await fitEquationBlocks(null);
  console.log('Equation readability floor, overflow focus and resize reset passed.');
} finally {
  if (originalRAF === undefined) delete globalThis.requestAnimationFrame;
  else globalThis.requestAnimationFrame = originalRAF;
  if (originalStyle === undefined) delete globalThis.getComputedStyle;
  else globalThis.getComputedStyle = originalStyle;
}
