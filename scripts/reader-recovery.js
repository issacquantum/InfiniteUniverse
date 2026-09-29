export function showReaderRecovery(host, language) {
  host.setAttribute("aria-busy", "false");
  const es = language === "es";
  host.innerHTML = `<div class="content-placeholder" role="status">
    <p>${es ? "No se pudo cargar este contenido. Puedes volver a intentarlo o abrir el menú de ciencia." : "This content could not load. Try again or open the science menu."}</p>
    <button class="glass-tab" type="button" data-action="retry-content">${es ? "Reintentar" : "Try again"}</button>
    <button class="glass-tab" type="button" data-action="toggle-mobile-knowledge-nav">${es ? "Menú de ciencia" : "Science menu"}</button>
  </div>`;
}

export function runOptionalEnhancement(host, language, initialize) {
  const report = error => {
    console.warn("Optional reader enhancement failed", error);
    if (!host.isConnected || host.querySelector("[data-enhancement-unavailable]")) return;
    const notice = document.createElement("p");
    notice.dataset.enhancementUnavailable = "";
    notice.setAttribute("role", "status");
    notice.textContent = language === "es"
      ? "Un elemento interactivo no pudo iniciarse. El texto y la navegación siguen disponibles."
      : "An interactive element could not start. The text and navigation remain available.";
    host.appendChild(notice);
  };
  try {
    const result = initialize(host);
    if (result?.catch) void result.catch(report);
  } catch (error) {
    report(error);
  }
}
