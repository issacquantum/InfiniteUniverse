export function refreshIcons() {
  if (!window.lucide || typeof window.lucide.createIcons !== "function") {
    return;
  }

  window.lucide.createIcons({
    attrs: {
      "stroke-width": 1.7
    }
  });

  document.querySelectorAll(".content-window__signature-mark--glint svg *").forEach((node, index) => {
    if (typeof node.setAttribute !== "function") {
      return;
    }

    node.setAttribute("pathLength", "1");
    node.style.setProperty("--signature-glint-delay", `${(index % 7) * 0.34}s`);
  });
}
