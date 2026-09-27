import { siteContent } from '../data/site-content.js';
export { siteContent };
export const topics = siteContent.knowledgeWorlds.flatMap(domain => domain.topics.map(topic => ({ ...topic, domain: domain.id })));
export function documents(language) {
  return topics.flatMap(topic => {
    const entries = topic.contentFile ? [{ id: topic.id, title: topic.title[language], file: topic.contentFile[language], topic, branch: null }] : [];
    for (const branch of topic.branches ?? []) for (const item of branch.items ?? []) {
      const file = item.contentFile?.[language] ?? (language === 'es' ? item.source?.file?.replace('/big-bang/', '/big-bang-es/') : item.source?.file);
      if (file) entries.push({ id: item.id, title: item.title[language], file, source: item.source, topic, branch: branch.id });
    }
    return entries;
  });
}
// Personal equations share the standalone equation directory with science topics.
export function publicDocuments(language) {
  const entries = documents(language);
  const files = new Set(entries.map(doc => doc.file));
  for (const section of siteContent.personalSections) {
    for (const branch of section.branches ?? []) for (const item of branch.items ?? []) {
      const file = item.contentFile?.[language];
      if (!file?.includes('/equations/') || files.has(file)) continue;
      entries.push({ id: item.id, title: item.title[language], file, section, branch: branch.id });
      files.add(file);
    }
  }
  return entries;
}
export function plain(html) { return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim(); }
export function escape(value) { return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }
