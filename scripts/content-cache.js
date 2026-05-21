import { bigBangLegacyContent } from "../data/legacy-big-bang.js";
import { siteContent } from "../data/site-content.js";

const documentCache = new Map();
const requestCache = new Map();
const CONTENT_CACHE_VERSION = "20260520-spanish-personal-wording";
const PREWARM_WORKER_LIMIT = 4;
let prewarmScheduled = false;

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

function addLocalizedFile(fileSet, source) {
  if (!source || typeof source !== "object") {
    return;
  }

  if (typeof source.en === "string") {
    fileSet.add(source.en);
  }

  if (typeof source.es === "string") {
    fileSet.add(source.es);
  }
}

function collectStructuredFiles(fileSet) {
  addLocalizedFile(fileSet, siteContent.siteNoticeSection?.contentFile);
  siteContent.personalSections.forEach((section) => addLocalizedFile(fileSet, section.contentFile));

  siteContent.educationDomains.forEach((domain) => {
    domain.topics.forEach((topic) => {
      addLocalizedFile(fileSet, topic.contentFile);
      topic.branches?.forEach((branch) => {
        branch.items?.forEach((item) => addLocalizedFile(fileSet, item.contentFile));
      });
    });
  });
}

function collectLegacyFiles(fileSet) {
  bigBangLegacyContent.branches.forEach((branch) => {
    branch.items?.forEach((item) => {
      const filePath = normalizePath(item.source?.file);

      if (!filePath) {
        return;
      }

      fileSet.add(filePath);

      if (filePath.includes("/big-bang/")) {
        fileSet.add(filePath.replace("/big-bang/", "/big-bang-es/"));
      }
    });
  });
}

function getAllContentFiles() {
  const fileSet = new Set();
  collectStructuredFiles(fileSet);
  collectLegacyFiles(fileSet);
  return Array.from(fileSet);
}

async function prewarmAllContent() {
  const filePaths = getAllContentFiles();
  const workerCount = Math.min(PREWARM_WORKER_LIMIT, filePaths.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < filePaths.length) {
      const filePath = filePaths[nextIndex];
      nextIndex += 1;
      await waitForIdlePrewarmSlot();
      await getCachedDocument(filePath).catch(() => null);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, worker));
}

function waitForIdlePrewarmSlot() {
  return new Promise((resolve) => {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(resolve, { timeout: 600 });
      return;
    }

    window.setTimeout(resolve, 16);
  });
}

export function scheduleContentPrewarm() {
  if (prewarmScheduled) {
    return;
  }

  prewarmScheduled = true;
  void prewarmAllContent();
}
