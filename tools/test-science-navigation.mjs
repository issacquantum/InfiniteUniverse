import assert from 'node:assert/strict';
import { parseRoute, routeFor } from '../scripts/routes.js';
import { topics, siteContent } from './site-inventory.mjs';
for (const language of ['en','es']) {
  for (const topic of topics) {
    const state={language,activeDomain:topic.domain,activeTopic:topic.id};
    const result=parseRoute(routeFor(state));
    assert.equal(result.activeDomain,topic.domain);assert.equal(result.activeTopic,topic.id);
    for (const branch of topic.branches ?? []) for (const item of branch.items) {
      const detail={...state,activeBranch:branch.id,activeDetail:item.id};
      const restored=parseRoute(routeFor(detail));
      assert.equal(restored.activeDetail,item.id);assert.equal(restored.activeBranch,branch.id);
      assert.equal(restored.language,language);assert.equal(restored.equationReturnTarget.topicId,topic.id);
    }
  }
  for (const section of [...siteContent.personalSections,siteContent.sitePurposeSection]) assert.equal(parseRoute(routeFor({language,activeSection:section.id})).activeSection,section.id);
}
for (const hash of ['#/fr/science/quantum-mechanics','#/en/science/missing','#/en/science/quantum-mechanics?detail=missing','#/en/science/quantum-mechanics?branch=missing','#/en/personal/missing']) assert.equal(parseRoute(hash),null);
assert.equal(parseRoute('#/en').activeTopic,null);
console.log('Bilingual topic, equation, personal, home, and invalid-route checks passed.');
