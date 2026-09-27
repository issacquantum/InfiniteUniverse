import { fitEquationBlocks } from "./equation-fit.js?v=20260926-equation-audit-v1";

let pending = Promise.resolve();

export function clearReaderMath(host) {
  if (host) window.MathJax?.typesetClear?.([host]);
}

export function renderReaderMath(host) {
  const render = async () => {
    const math = window.MathJax;
    if (!math?.typesetPromise) return;
    await math.startup?.promise;
    if (!host.isConnected) return;
    clearReaderMath(host);
    try {
      await math.typesetPromise([host]);
      if (!host.isConnected) return;
      await fitEquationBlocks(host);
      await document.fonts?.ready;
    } finally {
      // Navigation can detach a reader while asynchronous typesetting finishes.
      if (!host.isConnected) clearReaderMath(host);
    }
  };
  const result = pending.then(render);
  pending = result.catch(() => {});
  return result;
}
