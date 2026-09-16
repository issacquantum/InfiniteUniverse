import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { documents, topics, plain, escape } from './site-inventory.mjs';
import { routeFor } from '../scripts/routes.js';
import { bigBangLegacyContent } from '../data/legacy-big-bang.js';
import { topicMetadata } from '../data/topic-metadata.js';
export const siteRoot = 'https://issacquantum.github.io/InfiniteUniverse/';
export function publicPath(doc, language) {
  if (!doc.branch) return `science/${language}/${doc.id}/index.html`;
  return `science/${language}/${doc.file.includes('/equations/') ? 'equations' : doc.topic.id}/${doc.id}.html`;
}
export function route(doc, language) { return routeFor({ language, activeTopic:doc.topic.id, activeBranch:doc.branch, activeDetail:doc.branch ? doc.id : null }); }
function sourceBody(doc) {
  const html = readFileSync(doc.file, 'utf8');
  if (!doc.source) return html;
  if (doc.source.type === 'section') {
    const tokens = [...html.matchAll(/<\/?section\b[^>]*>/g)];
    const start = tokens.findIndex(m => m[0].includes(`id="${doc.source.sectionId}"`));
    if (start < 0) throw new Error(`Missing legacy section ${doc.source.sectionId}`);
    let depth = 0;
    for (const token of tokens.slice(start)) {
      depth += token[0].startsWith('</') ? -1 : 1;
      if (!depth) return html.slice(tokens[start].index, token.index + token[0].length);
    }
    throw new Error(`Unclosed legacy section ${doc.file}`);
  }
  if (doc.source.extractorId === 'contributors-intro') {
    const first = html.indexOf('<section', html.indexOf('<section') + 1);
    return html.slice(0,first) + '</section>';
  }
  if (doc.source.extractorId === 'history-intro') {
    return html.slice(0, html.search(/<h4\b/)) + '</section>';
  }
  return html;
}
const urls = new Set([siteRoot]);
for (const language of ['en','es']) {
  const all = documents(language); const written = new Set();
  for (const doc of all) {
    const html = sourceBody(doc);
    const out = publicPath(doc,language); if (written.has(out)) continue; written.add(out);
    const description = plain(html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? doc.title).slice(0,180);
    const url = siteRoot + out; urls.add(url);
    let body = html.replace(/<button\b([^>]*data-item-id="([^"]+)"[^>]*)>([\s\S]*?)<\/button>/g, (whole,attrs,id,label)=> {
      const target = all.find(d=>d.id===id && d.branch===attrs.match(/data-branch-id="([^"]+)"/)?.[1]) ?? all.find(d=>d.id===id);
      return target ? `<a class="equation-link" href="${publicPath(target,language)}">${label}</a>` : whole;
    });
    body = body.replace(/href="([^":]+\.html)(?:#([^"]+))?"/g, (whole, file, anchor) => {
      if (!doc.source) return whole;
      const mapped = bigBangLegacyContent.internalLinkMap[file + (anchor ? '#' + anchor : '')];
      const target = all.find(d => d.id === mapped?.itemId && d.branch === mapped?.branchId) ?? all.find(d => d.source?.file?.endsWith('/' + file) && (!anchor || d.source.sectionId === anchor));
      return target ? `href="${publicPath(target, language)}"` : '';
    });
    body = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/\son[a-z]+="[^"]*"/gi, '');
    if (doc.source) body = body.replace(/<img\b[^>]*src="([^"]+)"[^>]*>/g, (tag, src) => {
      const asset = 'Assets2/' + src.split('/').pop();
      return existsSync(asset) ? tag.replace(src, asset) : '';
    });
    body = body.replace(/href="#([^"]+)"/g, (_, id) => `href="${out}#${id}"`);
    body = body.split('\n').map(line => line.trimEnd()).join('\n');
    // Static documents carry text and equations; model controls belong to the interactive reader.
    body = body.replace(/<button\b[^>]*>([\s\S]*?)<\/button>/g,'<span>$1</span>');
    const related = [...new Set([...(topicMetadata[doc.topic.id]?.prerequisites ?? []),...(topicMetadata[doc.topic.id]?.related ?? [])])].map(id=>topics.find(t=>t.id===id)).filter(Boolean);
    const links = related.map(t=>`<li><a href="science/${language}/${t.id}/index.html">${escape(t.title[language])}</a></li>`).join('');
    mkdirSync(path.dirname(out),{recursive:true});
    const base = path.relative(path.dirname(out),'.').split(path.sep).join('/')+'/';
    const counterpart = publicPath(doc,language==='en'?'es':'en');
    writeFileSync(out,`<!doctype html>
<html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<base href="${base}"><title>${escape(doc.title)} | Infinite Universe</title>
<meta name="description" content="${escape(description)}"><link rel="canonical" href="${url}">
<link rel="alternate" hreflang="${language==='en'?'es':'en'}" href="${siteRoot+counterpart}"><link rel="alternate" hreflang="${language}" href="${url}">
<meta property="og:title" content="${escape(doc.title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${url}"><meta property="og:type" content="article">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self' https://cdn.jsdelivr.net; connect-src 'self'; frame-src https://www.youtube-nocookie.com; object-src 'none'; base-uri 'self'">
<link rel="stylesheet" href="styles/static-science.css"><script src="scripts/mathjax-config.js"></script><script defer src="https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-mml-chtml.js"></script>
</head><body><a href="${out}#main">${language==='es'?'Saltar al contenido':'Skip to content'}</a><nav><a href="index.html${route(doc,language)}">${language==='es'?'Abrir en el sitio interactivo':'Open in the interactive site'}</a> · <a href="${counterpart}" lang="${language==='en'?'es':'en'}">${language==='en'?'Español':'English'}</a> · <a href="science/${language}/index.html">${language==='es'?'Todos los temas':'All topics'}</a></nav><main id="main"><h1>${escape(doc.title)}</h1>${body}<nav aria-label="${language==='es'?'Temas relacionados':'Related topics'}"><ul>${links}</ul></nav></main></body></html>\n`);
  }
  // Cosmology has no topic fragment: expose its existing branch documents without migrating their renderer.
  for (const topic of topics.filter(t=>!t.contentFile)) {
    const out=`science/${language}/${topic.id}/index.html`;mkdirSync(path.dirname(out),{recursive:true});urls.add(siteRoot+out);
    const entries=all.filter(d=>d.topic.id===topic.id);
    writeFileSync(out,`<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="../../../"><title>${escape(topic.title[language])} | Infinite Universe</title><meta name="description" content="${escape(topic.title[language])}"><meta property="og:title" content="${escape(topic.title[language])}"><meta property="og:description" content="${escape(topic.title[language])}"><link rel="canonical" href="${siteRoot+out}"><link rel="alternate" hreflang="${language==='en'?'es':'en'}" href="${siteRoot}science/${language==='en'?'es':'en'}/${topic.id}/index.html"><link rel="stylesheet" href="styles/static-science.css"></head><body><main><h1>${escape(topic.title[language])}</h1><a href="index.html${routeFor({language,activeTopic:topic.id})}">${language==='es'?'Abrir en el sitio interactivo':'Open in the interactive site'}</a><ul>${entries.map(d=>`<li><a href="${publicPath(d,language)}">${escape(d.title)}</a></li>`).join('')}</ul></main></body></html>\n`);
  }
  const listPath=`science/${language}/index.html`;urls.add(siteRoot+listPath);
  writeFileSync(listPath,`<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="../../"><title>${language==='es'?'Temas científicos':'Science topics'} | Infinite Universe</title><meta name="description" content="${language==='es'?'Índice de temas científicos y ecuaciones':'Index of science topics and equations'}"><meta property="og:title" content="Infinite Universe"><meta property="og:description" content="Science topics / Temas científicos"><link rel="canonical" href="${siteRoot+listPath}"><link rel="alternate" hreflang="${language==='en'?'es':'en'}" href="${siteRoot}science/${language==='en'?'es':'en'}/index.html"><link rel="stylesheet" href="styles/static-science.css"></head><body><main><h1>${language==='es'?'Temas científicos':'Science topics'}</h1><ul>${topics.map(t=>`<li><a href="science/${language}/${t.id}/index.html">${escape(t.title[language])}</a></li>`).join('')}</ul></main></body></html>\n`);
}
writeFileSync('data/public-science-urls.json',JSON.stringify([...urls].sort(),null,2)+'\n');
console.log(`Generated ${urls.size-1} canonical science documents.`);
