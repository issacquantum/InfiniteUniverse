const EQUATION_BLOCK_SELECTOR = [
  ".structured-content .equation-link",
  ".structured-content .equation-display",
  ".legacy-content .equation-link",
  ".legacy-content .equation-display"
].join(",");

const MIN_EQUATION_SCALE = 0.32;
const FIT_PADDING = 6;

function measureEquationWidth(mathContainer) {
  const bounds = mathContainer.getBoundingClientRect();
  return Math.max(mathContainer.scrollWidth, bounds.width);
}

function applyEquationFit(block, mathContainer) {
  const availableWidth = Math.max(block.clientWidth - FIT_PADDING, 1);
  const equationWidth = measureEquationWidth(mathContainer);

  if (equationWidth <= availableWidth) {
    return false;
  }

  const scale = Math.max(MIN_EQUATION_SCALE, Math.min(1, availableWidth / equationWidth));
  block.style.setProperty("--equation-fit-scale", scale.toFixed(3));
  block.classList.add("equation-fit--scaled");
  return true;
}

function fitEquationBlock(block) {
  const mathContainer = block.querySelector("mjx-container");

  if (!mathContainer) {
    return;
  }

  block.style.setProperty("--equation-fit-scale", "1");
  block.classList.remove("equation-fit--scaled");

  requestAnimationFrame(() => {
    if (!applyEquationFit(block, mathContainer)) {
      return;
    }

    requestAnimationFrame(() => {
      applyEquationFit(block, mathContainer);
    });
  });
}

export function fitEquationBlocks(host) {
  if (!host) {
    return;
  }

  host.querySelectorAll(EQUATION_BLOCK_SELECTOR).forEach(fitEquationBlock);
}
