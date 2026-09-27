export function isModelPanGesture(event) {
  return event.button === 1 || event.button === 2 || event.shiftKey || event.altKey;
}

export function bindPinchZoom(canvas, { onStart }) {
  // A trackpad pinch arrives as Ctrl+wheel. Leave its browser default intact.
  canvas.addEventListener("wheel", event => {
    if (event.ctrlKey) event.stopImmediatePropagation();
  }, { capture: true, passive: true });

  // Touchscreen zoom belongs to the browser; model controls provide model zoom.
  let touchStarted = null;
  canvas.addEventListener("pointerdown", event => {
    if (event.pointerType === "touch") touchStarted = performance.now();
  }, { capture: true, passive: true });
  canvas.addEventListener("pointerup", event => {
    if (event.pointerType === "touch" && touchStarted !== null && performance.now() - touchStarted >= 500) onStart?.();
    touchStarted = null;
  }, { capture: true, passive: true });
  canvas.addEventListener("pointercancel", () => {
    touchStarted = null;
    onStart?.();
  }, { capture: true, passive: true });
  canvas.addEventListener("touchstart", event => {
    if (event.touches.length > 1) onStart?.();
  }, { passive: true });
}

export function panObjectFromPointer({ THREE, camera, object, startPosition, startX, startY, event, distance, scale = 0.0016 }) {
  if (!THREE || !camera || !object || !startPosition) {
    return;
  }

  const offset = getCameraPlaneOffset(THREE, camera, startX, startY, event, distance, scale, 1);
  object.position.copy(startPosition).add(offset);
}

export function panTargetFromPointer({ THREE, camera, target, startTarget, startX, startY, event, distance, scale = 0.0016 }) {
  if (!THREE || !camera || !target || !startTarget) {
    return;
  }

  const offset = getCameraPlaneOffset(THREE, camera, startX, startY, event, distance, scale, -1);
  target.x = startTarget.x + offset.x;
  target.y = startTarget.y + offset.y;
  target.z = startTarget.z + offset.z;
}

function getCameraPlaneOffset(THREE, camera, startX, startY, event, distance, scale, direction) {
  const dx = event.clientX - startX;
  const dy = event.clientY - startY;
  const panScale = Math.max(0.002, distance * scale);
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();

  camera.getWorldDirection(forward);
  right.crossVectors(forward, camera.up).normalize();
  up.crossVectors(right, forward).normalize();

  return right.multiplyScalar(dx * panScale * direction).add(up.multiplyScalar(-dy * panScale * direction));
}
