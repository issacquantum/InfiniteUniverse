import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { topics, documents, siteContent } from './site-inventory.mjs';
import { topicMetadata } from '../data/topic-metadata.js';
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const unique = (values, label) => check(new Set(values).size === values.length, `Duplicate ${label}`);
unique(topics.map(t => t.id), 'topic IDs');
const equationFiles = new Map();
const registered = new Set(siteContent.personalSections.flatMap(s => (s.branches ?? []).flatMap(b => b.items.flatMap(i => Object.values(i.contentFile ?? {})))));
for (const topic of topics) {
  const meta = topicMetadata[topic.id];
  check(meta?.icon && meta?.signature && meta?.mood, `Missing metadata: ${topic.id}`);
  for (const id of [...(meta?.related ?? []), ...(meta?.prerequisites ?? [])]) check(topics.some(t => t.id === id), `Unknown related topic: ${id}`);
  unique((topic.branches ?? []).map(b => b.id), `branches: ${topic.id}`);
  for (const branch of topic.branches ?? []) unique(branch.items.map(i => i.id), `equations within ${branch.id}`);
}
for (const language of ['en', 'es']) for (const doc of documents(language)) {
  if (doc.file.includes('/equations/')) {
    const key = `${language}:${doc.id}`;
    check(!equationFiles.has(key) || equationFiles.get(key) === doc.file, `Conflicting equation ID: ${key}`);
    equationFiles.set(key, doc.file);
  }
  registered.add(doc.file);
  if (!existsSync(doc.file)) { failures.push(`Missing ${doc.file}`); continue; }
  const html = readFileSync(doc.file, 'utf8');
  unique([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]), `HTML IDs: ${doc.file}`);
  const branches = [...topics.flatMap(t => t.branches ?? []), ...siteContent.personalSections.flatMap(t => t.branches ?? [])];
  for (const tag of html.matchAll(/<[^>]+data-item-id="([^"]+)"[^>]*>/g)) {
    const branch = tag[0].match(/data-branch-id="([^"]+)"/)?.[1];
    check(branches.some(b => (!branch || b.id === branch) && b.items.some(i => i.id === tag[1])), `Invalid equation target ${tag[1]} in ${doc.file}`);
  }
  for (const m of html.matchAll(/(?:href|src)="((?:Assets2|content|scripts|styles)\/[^"?#]+)[^"]*"/g)) check(existsSync(m[1]), `Missing internal file ${m[1]} in ${doc.file}`);
  for (const m of html.matchAll(/data-topic-id="([^"]+)"/g)) check(topics.some(t => t.id === m[1]), `Invalid navigation target ${m[1]}`);
}
for (const language of ['en','es']) {
  for (const dir of [`content/site/${language}/science`, `content/site/${language}/science/equations`]) {
    for (const file of readdirSync(dir)) if (file.endsWith('.html')) check(registered.has(`${dir}/${file}`), `Orphan science file: ${dir}/${file}`);
  }
}
console.log(`Checked ${topics.length} topics and ${registered.size} bilingual source files.`);
// Generated documents must be complete, bilingual, and reachable through the sitemap.
if (existsSync('data/public-science-urls.json')) {
  const urls=JSON.parse(readFileSync('data/public-science-urls.json','utf8'));
  const sitemap=readFileSync('sitemap.xml','utf8');
  const sitemapUrls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
  check(JSON.stringify([...urls].sort())===JSON.stringify(sitemapUrls.sort()),'Sitemap/public-page mismatch');
  for (const url of urls) {
    const file=url.replace('https://issacquantum.github.io/InfiniteUniverse/','') || 'index.html';
    check(existsSync(file),`Missing public page ${file}`);
    if (!file.startsWith('science/') || !existsSync(file)) continue;
    const html=readFileSync(file,'utf8');
    check(/<!doctype html>/i.test(html) && /<title>/.test(html) && /rel="canonical"/.test(html) && /hreflang=/.test(html),`Incomplete document ${file}`);
    unique([...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]),`public IDs ${file}`);
    for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(?:https?:|data:|mailto:|tel:|#|\.\.\/)/.test(m[1])) continue;
      const target=m[1].split(/[?#]/)[0];
      check(!target || existsSync(target),`Broken public path ${target} in ${file}`);
    }
  }
  for (const language of ['en','es']) {
    const lab=readFileSync(`content/site/${language}/science/model-lab.html`,'utf8');
    for (const tag of lab.matchAll(/<button\b[^>]*data-model-target="([^"]+)"[^>]*>/g)) {
      const topic=topics.find(t=>t.id===tag[0].match(/data-topic-id="([^"]+)"/)?.[1]);
      check(topic?.contentFile && readFileSync(topic.contentFile[language],'utf8').includes(`data-model-target="${tag[1]}"`),`Missing Model Lab destination ${tag[1]}`);
    }
  }
}
for (const id of ['probability-statistics','mathematical-analysis']) {
  const en = readFileSync(`content/site/en/science/${id}.html`, 'utf8');
  const es = readFileSync(`content/site/es/science/${id}.html`, 'utf8');
  const equations = html => [...html.matchAll(/\$\$([\s\S]*?)\$\$|\\\(([\s\S]*?)\\\)/g)].map(m => (m[1] ?? m[2]).replace(/\s+/g,''));
  const urls = html => [...html.matchAll(/href="(https?:[^"]+)"/g)].map(m => m[1]).sort();
  check(JSON.stringify(equations(en)) === JSON.stringify(equations(es)), `Bilingual equation mismatch: ${id}`);
  check(JSON.stringify(urls(en)) === JSON.stringify(urls(es)), `Bilingual source mismatch: ${id}`);
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode=1; }
else console.log('Generated documents, Model Lab targets, and sitemap passed.');
