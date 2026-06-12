import { readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const SITE_ROOT = "https://issacquantum.github.io/InfiniteUniverse/";
const CONTENT_ROOTS = ["content/site", "content/legacy"];

async function listHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return listHtmlFiles(fullPath);
    }

    return entry.isFile() && entry.name.endsWith(".html") ? [fullPath] : [];
  }));

  return files.flat();
}

function xmlEscape(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function toUrl(filePath) {
  return new URL(filePath.split(path.sep).join("/"), SITE_ROOT).toString();
}

function getPriority(filePath) {
  if (filePath.includes("/equations/")) {
    return "0.55";
  }

  if (filePath.startsWith("content/legacy/")) {
    return "0.55";
  }

  if (filePath.startsWith("content/site/")) {
    return "0.80";
  }

  return "0.60";
}

async function getUrlEntry(filePath) {
  const metadata = await stat(filePath);
  const lastmod = metadata.mtime.toISOString().slice(0, 10);

  return [
    "  <url>",
    `    <loc>${xmlEscape(toUrl(filePath))}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    "    <changefreq>monthly</changefreq>",
    `    <priority>${getPriority(filePath)}</priority>`,
    "  </url>"
  ].join("\n");
}

async function main() {
  const contentFiles = (await Promise.all(CONTENT_ROOTS.map(listHtmlFiles)))
    .flat()
    .sort((left, right) => left.localeCompare(right));
  const contentEntries = await Promise.all(contentFiles.map(getUrlEntry));
  const rootEntry = [
    "  <url>",
    `    <loc>${SITE_ROOT}</loc>`,
    `    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>`,
    "    <changefreq>weekly</changefreq>",
    "    <priority>1.00</priority>",
    "  </url>"
  ].join("\n");
  const sitemap = [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">",
    rootEntry,
    ...contentEntries,
    "</urlset>",
    ""
  ].join("\n");

  await writeFile("sitemap.xml", sitemap, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
