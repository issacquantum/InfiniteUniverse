import { bigBangLegacyContent } from '../data/legacy-big-bang.js';

// Match the standalone display paragraphs decorated by the interactive legacy reader.
export function linkLegacyEquations(html, itemId, equationUrl) {
  const ids = bigBangLegacyContent.historyEquationMap[itemId];
  if (!ids) return html;
  let index = 0;
  const result = html.replace(/<p\b[^>]*>\s*(\$\$[\s\S]*?\$\$)\s*<\/p>/g, (paragraph, math) => {
    const id = ids[index++];
    if (!id) throw new Error(`Unmapped legacy equation in ${itemId}`);
    const href = equationUrl(id);
    if (!href) throw new Error(`Missing legacy equation destination ${id}`);
    return `<div class="equation-link-wrap"><a class="glass-window equation-link" href="${href}">${math}</a></div>`;
  });
  if (index !== ids.length) {
    throw new Error(`Legacy equation count differs for ${itemId}: ${index} displays, ${ids.length} destinations`);
  }
  return result;
}
