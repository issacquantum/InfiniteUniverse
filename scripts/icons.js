export function refreshIcons() {
  if (!window.lucide || typeof window.lucide.createIcons !== "function") {
    return;
  }

  window.lucide.createIcons({
    attrs: {
      "stroke-width": 1.7
    }
  });

  document.querySelectorAll(".content-window__signature-mark--glint svg *").forEach((node) => {
    if (typeof node.setAttribute === "function") {
      node.setAttribute("vector-effect", "non-scaling-stroke");
    }
  });
}
