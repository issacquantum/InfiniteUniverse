function canCreateContext(type) {
  const canvas = document.createElement("canvas");

  try {
    return Boolean(canvas.getContext(type));
  } catch (_error) {
    return false;
  }
}

export function getWebGLAvailability() {
  const webgl2 = canCreateContext("webgl2");
  const webgl = webgl2 || canCreateContext("webgl");

  return { webgl, webgl2 };
}

export function markWebGLAvailability() {
  const availability = getWebGLAvailability();

  document.body.dataset.webgl = availability.webgl2
    ? "webgl2"
    : (availability.webgl ? "webgl" : "unavailable");
  document.body.classList.toggle("webgl-unavailable", !availability.webgl);

  return availability;
}
