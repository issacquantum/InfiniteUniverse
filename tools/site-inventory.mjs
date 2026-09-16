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
export function plain(html) { return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim(); }
export function escape(value) { return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }
