const EQUATION_BLOCK_SELECTOR = [
  ".structured-content .equation-link",
  ".structured-content .equation-display",
  ".legacy-content .equation-link",
  ".legacy-content .equation-display"
].join(",");

// Keep long expressions readable; the math container scrolls beyond this limit.
const MIN_EQUATION_SCALE = 0.85;
const FIT_PADDING = 6;

function measureEquationWidth(mathContainer) {
  const bounds = mathContainer.getBoundingClientRect();
  return Math.max(mathContainer.scrollWidth, bounds.width);
}

function updateEquationScrollAccess(block, mathContainer) {
  if (block.tagName === "BUTTON") return;
  const scrollable = mathContainer.scrollWidth > mathContainer.clientWidth + 1;
  if (scrollable && !mathContainer.hasAttribute("tabindex")) {
    mathContainer.tabIndex = 0;
    mathContainer.dataset.equationScroll = "";
  } else if (!scrollable && mathContainer.hasAttribute("data-equation-scroll")) {
    mathContainer.removeAttribute("tabindex");
    mathContainer.removeAttribute("data-equation-scroll");
  }
}

const frame = () => new Promise(resolve => requestAnimationFrame(resolve));

export async function fitEquationBlocks(host, { isCurrent = () => true } = {}) {
  if (!host) return;
  const pairs = [...host.querySelectorAll(EQUATION_BLOCK_SELECTOR)]
    .map(block => ({ block, math: block.querySelector("mjx-container") }))
    .filter(pair => pair.math);
  for (let index = 0; index < pairs.length && isCurrent(); index += 8) {
    const batch = pairs.slice(index, index + 8);
    for (const { block } of batch) {
      block.style.setProperty("--equation-fit-scale", "1");
      block.classList.remove("equation-fit--scaled");
    }
    await frame();
    if (!isCurrent()) return;
    const measurements = batch.map(({block, math}) => {
      const style = getComputedStyle(block);
      const available = Math.max(block.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - FIT_PADDING, 1);
      return { block, scale: Math.max(MIN_EQUATION_SCALE, Math.min(1, available / measureEquationWidth(math))) };
    });
    for (const { block, scale } of measurements) {
      if (scale < 1) {
        block.style.setProperty("--equation-fit-scale", scale.toFixed(3));
        block.classList.add("equation-fit--scaled");
      }
    }
    await frame();
    if (!isCurrent()) return;
    for (const { block, math } of batch) updateEquationScrollAccess(block, math);
  }
}
