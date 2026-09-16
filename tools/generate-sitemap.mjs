import './generate-science-pages.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
const urls=JSON.parse(readFileSync('data/public-science-urls.json','utf8'));
writeFileSync('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url=>`  <url><loc>${url.replaceAll('&','&amp;')}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`Sitemap: ${urls.length} public URLs; source fragments are excluded.`);
