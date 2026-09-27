import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installTouchActivationGuard } from '../scripts/touch-activation.js';
import { bindPinchZoom } from '../scripts/model-pan.js';
import { renderReaderMath, clearReaderMath } from '../scripts/reader-math.js';

class Surface {
  handlers = new Map();
  dataset = {};
  addEventListener(type, handler, options) {
    const list = this.handlers.get(type) ?? [];
    list.push({handler, options}); this.handlers.set(type, list);
  }
  emit(type, extra = {}) {
    const event = {type, pointerId:1, pointerType:'touch', clientX:0, clientY:0, detail:1,
      target:{closest:()=>true}, prevented:false, stopped:false,
      preventDefault(){this.prevented=true;}, stopImmediatePropagation(){this.stopped=true;}, ...extra};
    for (const {handler} of this.handlers.get(type) ?? []) { handler(event); if(event.stopped) break; }
    return event;
  }
}
let time = 0;
const surface = new Surface();
installTouchActivationGuard(surface, () => time);
const begin = () => { time += 2000; surface.emit('pointerdown'); };
begin();time+=50;surface.emit('pointerup');time+=500;
assert.equal(surface.emit('click').prevented,false,'A delayed genuine tap still works');
begin();time+=700;assert.equal(surface.emit('pointerup').prevented,false);
assert.equal(surface.emit('click').prevented,true,'Long press cannot activate a navigation control');
assert.equal(surface.emit('click',{detail:0}).prevented,false,'Keyboard and accessibility activation remain available');
begin();assert.equal(surface.emit('pointermove',{clientY:100}).prevented,false);surface.emit('pointerup');
assert.equal(surface.emit('click').prevented,true,'Scroll cannot become a click');
begin();surface.emit('pointerdown',{pointerId:2});surface.emit('pointerup',{pointerId:2});surface.emit('pointerup');
assert.equal(surface.emit('click').prevented,true,'Pinch cannot become a click');
begin();surface.emit('pointercancel');assert.equal(surface.emit('click').prevented,true);
begin();assert.equal(surface.emit('contextmenu').prevented,false,'Native text selection/context menu is untouched');surface.emit('pointerup');
assert.equal(surface.emit('click').prevented,true);
begin();time+=20;surface.emit('pointerup');assert.equal(surface.emit('click').prevented,false,'Next deliberate tap works');
surface.emit('pointerdown',{pointerType:'mouse'});assert.equal(surface.emit('click',{pointerType:'mouse'}).prevented,false);

const canvas = new Surface();let cancelled=0, modelZoom=1;
globalThis.window = {matchMedia:()=>({matches:true})};
bindPinchZoom(canvas,{getValue:()=>modelZoom,setValue:v=>modelZoom=v,min:0,max:2,onStart:()=>cancelled++});
assert.equal(canvas.emit('touchstart',{touches:[{},{}]}).prevented,false);
assert.equal(canvas.emit('touchmove',{touches:[{},{}]}).prevented,false);
assert.equal(modelZoom,1,'Touch pinch remains browser zoom');
canvas.emit('pointercancel');assert.equal(cancelled,2,'Pinch and browser cancellation clear model drag state');
for(const handlers of canvas.handlers.values()) for(const {options} of handlers) assert.equal(options.passive,true);

// Simulate retained MathItems and navigation during an asynchronous typeset.
const records = new Set();let active=0, maximum=0, release;
window.MathJax = {
  startup:{promise:Promise.resolve()},
  typesetClear(hosts){ for(const host of hosts) records.delete(host); },
  async typesetPromise([host]) { active++;maximum=Math.max(maximum,active);records.add(host);
    if(host.wait) await new Promise(resolve=>release=resolve);
    active--;if(host.fail) throw Error('test typeset failure'); }
};
globalThis.document = {fonts:{ready:Promise.resolve()}};
const host = extra => ({isConnected:true,querySelectorAll:()=>[],...extra});
const first=host({wait:true}), stale=host({isConnected:false}), next=host();
const job=renderReaderMath(first);
while(!release) await Promise.resolve();
clearReaderMath(first);first.isConnected=false;
const skip=renderReaderMath(stale), subsequent=renderReaderMath(next);release();
await Promise.all([job,skip,subsequent]);
assert.equal(maximum,1,'Reader typesets never overlap');
assert.deepEqual([...records],[next],'Detached readers do not retain math records');
clearReaderMath(next);await assert.rejects(renderReaderMath(host({fail:true})));
await renderReaderMath(host());
for(let i=0;i<30;i++){const h=host();await renderReaderMath(h);clearReaderMath(h);h.isConnected=false;}
assert.equal(records.size,2,'Repeated reader navigation does not grow the registry');
const app=readFileSync(new URL('../scripts/app.js',import.meta.url),'utf8');
assert.ok(app.indexOf('clearReaderMath(refs.stage)')<app.indexOf('  renderSite({'),'Outgoing math is cleared before replacing reader DOM');
console.log('Touch activation, native model pinch, cancellation, serialized math, detached cleanup and repeated navigation passed.');

const {default:vm}=await import('node:vm');
let galleryResets=0;
const galleryViewport={clientWidth:300,clientHeight:400,scrollWidth:600,scrollTo(){galleryResets++;}};
const galleryContext=vm.createContext({
  refs:{galleryLightbox:{style:{setProperty(){}}},galleryLightboxImage:{naturalWidth:1200,naturalHeight:600,style:{}},galleryLightboxViewport:galleryViewport},
  galleryInitialScale:1,galleryTriggerWidth:300,galleryZoomLevel:1,GALLERY_MAX_ZOOM_LEVEL:2,
  syncGalleryControls(){},requestAnimationFrame:fn=>fn()
});
vm.runInContext(app.slice(app.indexOf('function applyGalleryZoom('),app.indexOf('function setGalleryZoomLevel(')),galleryContext);
vm.runInContext('applyGalleryZoom(false, true)',galleryContext);
assert.equal(galleryResets,0,'Toolbar/orientation resize does not reset an overflowing gallery');
vm.runInContext('applyGalleryZoom(true)',galleryContext);
assert.equal(galleryResets,1,'Opening a new gallery image still resets its initial position');
assert.match(app,/window.addEventListener\("resize",[\s\S]*?applyGalleryZoom\(false, true\)/);
console.log('Gallery viewport resize retains position; new-image centering remains available.');
