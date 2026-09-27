window.MathJax = {
  startup: { typeset: !document.currentScript?.hasAttribute("data-reader-managed") },
  tex: {
    inlineMath: [["$", "$"], ["\\(", "\\)"]],
    displayMath: [["$$", "$$"], ["\\[", "\\]"]]
  }
};
