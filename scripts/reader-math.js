import { fitEquationBlocks } from "./equation-fit.js?v=20260927-reader-equations-v3";

let pending = Promise.resolve();
const jobs = new Set();
const yieldToBrowser = () => new Promise(resolve => setTimeout(resolve, 0));

export function clearReaderMath(host) {
  if (!host) return;
  for (const job of jobs) {
    if (job.host === host || host.contains?.(job.host)) job.cancelled = true;
  }
  window.MathJax?.typesetClear?.([host]);
}

async function readyMath() {
  if (!window.MathJax?.typesetPromise) {
    const script = document.querySelector('script[src*="/mathjax@"]');
    if (!script) throw new Error("MathJax script is unavailable");
    await new Promise((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timer);
        script.removeEventListener("load", loaded);
        script.removeEventListener("error", failed);
      };
      const loaded = () => { cleanup(); resolve(); };
      const failed = () => { cleanup(); reject(new Error("MathJax could not load")); };
      const timer = setTimeout(failed, 30000);
      script.addEventListener("load", loaded, { once: true });
      script.addEventListener("error", failed, { once: true });
    });
  }
  const math = window.MathJax;
  await math?.startup?.promise;
  if (!math?.typesetPromise) throw new Error("MathJax is not ready");
  return math;
}

function mathTargets(host) {
  const candidates = [...host.querySelectorAll("p, li, td, th, h2, h3, h4, span, label, .equation-link, .equation-display")]
    .filter(node => /\\\(|\\\[|\$/.test(node.textContent) && !node.closest("mjx-container"));
  // A display nested in a paragraph must be processed once, as part of that paragraph.
  const targets = candidates.filter(node => !candidates.some(parent => parent !== node && parent.contains(node)));
  return targets.length ? targets : [host];
}

export function renderReaderMath(host) {
  for (const old of jobs) if (old.host === host) old.cancelled = true;
  const job = { host, cancelled: false };
  jobs.add(job);
  const current = () => !job.cancelled && host.isConnected;
  const render = async () => {
    let math;
    const processed = [];
    try {
      if (!current()) return;
      math = await readyMath();
      if (!current()) return;
      math.typesetClear?.([host]);
      const targets = mathTargets(host);
      // Source order starts with visible text on entry. All content is completed,
      // including offscreen text, so Find and deep links require no lazy loader.
      for (let index = 0; index < targets.length && current(); index += 2) {
        const batch = targets.slice(index, index + 2);
        processed.push(...batch);
        await math.typesetPromise(batch);
        await yieldToBrowser();
      }
      if (current()) await fitEquationBlocks(host, { isCurrent: current });
      if (current()) await document.fonts?.ready;
    } finally {
      if (!current() && processed.length) math?.typesetClear?.(processed);
      jobs.delete(job);
    }
  };
  const result = pending.then(render);
  // Keep later readers usable after an error; the caller receives the rejection.
  pending = result.catch(() => {});
  return result;
}

export function reportReaderMathError(host, language, error) {
  if (!host.isConnected) return;
  console.error("Equation formatting failed", error);
  const notice = document.createElement("p");
  notice.setAttribute("role", "status");
  notice.textContent = language === "es"
    ? "No se pudo completar el formato de las ecuaciones. La notación original sigue disponible."
    : "Equation formatting could not finish. The original notation remains available.";
  host.append(notice);
}
