import { siteContent } from "../data/site-content.js?v=20260921-classical-mechanics-v1";

const documentCache = new Map();
const requestCache = new Map();
const CONTENT_CACHE_VERSION = "20260921-classical-mechanics-v1";

function normalizePath(filePath) {
  if (typeof filePath !== "string") {
    return "";
  }

  return filePath.trim();
}

async function fetchDocument(filePath) {
  const response = await fetch(getVersionedPath(filePath), { cache: "no-cache" });

  if (!response.ok) {
    throw new Error(`Failed to load content: ${filePath}`);
  }

  const rawHtml = await response.text();
  return new DOMParser().parseFromString(rawHtml, "text/html");
}

function getVersionedPath(filePath) {
  try {
    const url = new URL(filePath, window.location.href);
    url.searchParams.set("v", CONTENT_CACHE_VERSION);
    return url.href;
  } catch (_) {
    return filePath;
  }
}

export function hasCachedDocument(filePath) {
  const normalized = normalizePath(filePath);
  return normalized !== "" && documentCache.has(normalized);
}

export function getCachedDocumentNow(filePath) {
  const normalized = normalizePath(filePath);
  return normalized ? documentCache.get(normalized) ?? null : null;
}

export async function getCachedDocument(filePath) {
  const normalized = normalizePath(filePath);

  if (!normalized) {
    throw new Error("Missing content file path.");
  }

  if (documentCache.has(normalized)) {
    return documentCache.get(normalized);
  }

  if (requestCache.has(normalized)) {
    return requestCache.get(normalized);
  }

  const request = fetchDocument(normalized)
    .then((documentNode) => {
      documentCache.set(normalized, documentNode);
      requestCache.delete(normalized);
      return documentNode;
    })
    .catch((error) => {
      requestCache.delete(normalized);
      throw error;
    });

  requestCache.set(normalized, request);
  return request;
}

// Only the active language and nearby destinations are warmed. No corpus-wide crawl.
const warmed = new Set();
let generation = 0;
export function scheduleContentPrewarm(state) {
  if (!state?.activeTopic) return;
  const token = ++generation;
  const domain = siteContent.knowledgeWorlds.find(d => d.id === state.activeDomain);
  const index = domain?.topics.findIndex(t => t.id === state.activeTopic) ?? -1;
  if (index < 0) return;
  const topic = domain.topics[index];
  const language = state.language === "es" ? "es" : "en";
  const paths = [topic.contentFile?.[language], domain.topics[index + 1]?.contentFile?.[language], domain.topics[index - 1]?.contentFile?.[language]];
  // A small bounded set: opening a detail never schedules hundreds of other equations.
  const branch = topic.branches?.find(b => b.id === state.activeBranch) ?? topic.branches?.[0];
  const items = branch?.items ?? [];
  const itemIndex = Math.max(0, items.findIndex(i => i.id === state.activeDetail));
  for (const item of items.slice(itemIndex, itemIndex + 3)) paths.push(item.contentFile?.[language]);
  const connection = navigator.connection;
  if (connection?.saveData || /2g/.test(connection?.effectiveType ?? "")) return;
  const queue = [...new Set(paths.filter(Boolean))].filter(p => !warmed.has(p));
  async function next() {
    if (token !== generation || !queue.length) return;
    const file = queue.shift(); warmed.add(file);
    await getCachedDocument(file).catch(() => warmed.delete(file));
    if (queue.length) schedule();
  }
  function schedule() {
    if (window.requestIdleCallback) window.requestIdleCallback(next, { timeout: 1500 });
    else window.setTimeout(next, 300);
  }
  schedule();
}
