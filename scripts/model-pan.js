export function isModelPanGesture(event) {
  return event.button === 1 || event.button === 2 || event.shiftKey || event.altKey;
}

export function bindPinchZoom(canvas, { getValue, setValue, min, max, inverted = false, onStart, onChange }) {
  let startDistance = null;
  let startValue = null;

  const clampValue = (value) => Math.min(max, Math.max(min, value));
  const distanceFromTouchEvent = (event) => {
    const dx = event.touches[0].clientX - event.touches[1].clientX;
    const dy = event.touches[0].clientY - event.touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  canvas.addEventListener("pointerdown", (event) => {
    if (canvas.dataset.modelPinchZoom !== "active") {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
  }, { capture: true });

  canvas.addEventListener("pointermove", (event) => {
    if (canvas.dataset.modelPinchZoom !== "active") {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
  }, { capture: true });

  canvas.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 2) {
      return;
    }

    event.preventDefault();
    canvas.dataset.modelPinchZoom = "active";
    startDistance = distanceFromTouchEvent(event);
    startValue = getValue();
    onStart?.();
  }, { passive: false });

  canvas.addEventListener("touchmove", (event) => {
    if (event.touches.length !== 2 || startDistance === null || startValue === null) {
      return;
    }

    event.preventDefault();
    const ratio = distanceFromTouchEvent(event) / startDistance;
    const nextValue = inverted ? startValue / ratio : startValue * ratio;
    setValue(clampValue(nextValue));
    onChange?.();
  }, { passive: false });

  const clearPinch = () => {
    startDistance = null;
    startValue = null;
    delete canvas.dataset.modelPinchZoom;
  };

  canvas.addEventListener("touchend", clearPinch, { passive: true });
  canvas.addEventListener("touchcancel", clearPinch, { passive: true });
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
