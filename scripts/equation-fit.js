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

function applyEquationFit(block, mathContainer) {
  const style = getComputedStyle(block);
  const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const availableWidth = Math.max(block.clientWidth - padding - FIT_PADDING, 1);
  const equationWidth = measureEquationWidth(mathContainer);

  if (equationWidth <= availableWidth) {
    return false;
  }

  const currentScale = Number(block.style.getPropertyValue("--equation-fit-scale")) || 1;
  const scale = Math.max(MIN_EQUATION_SCALE, Math.min(1, currentScale * availableWidth / equationWidth));
  block.style.setProperty("--equation-fit-scale", scale.toFixed(3));
  block.classList.add("equation-fit--scaled");
  return true;
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

function fitEquationBlock(block) {
  const mathContainer = block.querySelector("mjx-container");

  if (!mathContainer) {
    return;
  }

  block.style.setProperty("--equation-fit-scale", "1");
  block.classList.remove("equation-fit--scaled");

  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      if (!applyEquationFit(block, mathContainer)) {
        updateEquationScrollAccess(block, mathContainer);
        resolve();
        return;
      }

      requestAnimationFrame(() => {
        applyEquationFit(block, mathContainer);
        requestAnimationFrame(() => {
          updateEquationScrollAccess(block, mathContainer);
          resolve();
        });
      });
    });
  });
}

export function fitEquationBlocks(host) {
  if (!host) {
    return;
  }

  return Promise.all(Array.from(host.querySelectorAll(EQUATION_BLOCK_SELECTOR), fitEquationBlock));
}
