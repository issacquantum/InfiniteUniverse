import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../scripts/model-accessibility.js',import.meta.url),'utf8');
const start=source.indexOf('function getLabelText(');
const end=source.indexOf('\nfunction isControlVisible',start);
const context=vm.createContext({normalizeText:value=>String(value??'').replace(/\s+/g,' ').trim()});
vm.runInContext(source.slice(start,end)+'\nthis.label=getLabelText;',context);
for(const [own,previous] of [['Center','Randomize'],['Clean channel','Predictable source'],['Centrar','Aleatorio'],['Canal limpio','Fuente predecible']]){
 const button={tagName:'BUTTON',textContent:own,previousElementSibling:{textContent:previous},getAttribute:()=>null,closest:()=>null};
 assert.equal(context.label(button),own,'A button must use its own visible label');
 assert.equal(context.label({...button,getAttribute:()=> 'Explicit label'}),'Explicit label');
}
const slider={tagName:'INPUT',textContent:'',previousElementSibling:{textContent:'Noise'},getAttribute:()=>null,closest:()=>null};
assert.equal(context.label(slider),'Noise','Nearby labels still name inputs');
console.log('English and Spanish model buttons retain their own accessible names; explicit and input labels remain supported.');
