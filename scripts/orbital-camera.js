function mat4Multiply(a, b) {
  const out = new Float32Array(16);

  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      let sum = 0;

      for (let k = 0; k < 4; k += 1) {
        sum += a[row + k * 4] * b[k + col * 4];
      }

      out[row + col * 4] = sum;
    }
  }

  return out;
}

function mat4Perspective(fovY, aspect, near, far) {
  const f = 1.0 / Math.tan(fovY / 2.0);
  const nf = 1.0 / (near - far);

  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, (2 * far * near) * nf, 0
  ]);
}

function mat4RotationX(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  return new Float32Array([
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1
  ]);
}

function mat4RotationY(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  return new Float32Array([
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1
  ]);
}

function mat4Scale(scale) {
  return new Float32Array([
    scale, 0, 0, 0,
    0, scale, 0, 0,
    0, 0, scale, 0,
    0, 0, 0, 1
  ]);
}

function mat4Translation(x, y, z) {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1
  ]);
}

export class OrbitalCamera {
  constructor(canvas) {
    this.canvas = canvas;
    this.rotationX = 0.0;
    this.rotationY = 0.0;
    this.panX = 0.0;
    this.panY = 0.0;
    this.zoom = 0.76;
    this.minZoom = 0.35;
    this.maxZoom = 3.2;
    this.autoRotateSpeed = 0.08;
    this.dragging = false;
    this.panning = false;
    this.lastX = 0;
    this.lastY = 0;
    this.lastPinchDistance = null;
    this.idle = true;
    this.idleTimer = null;

    this.#bindEvents();
  }

  #bindEvents() {
    this.canvas.addEventListener("mousedown", this.#onMouseDown.bind(this), { passive: true });
    this.canvas.addEventListener("mousemove", this.#onMouseMove.bind(this), { passive: true });
    this.canvas.addEventListener("mouseup", this.#onMouseUp.bind(this), { passive: true });
    this.canvas.addEventListener("mouseleave", this.#onMouseUp.bind(this), { passive: true });
    this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    this.canvas.addEventListener("wheel", this.#onWheel.bind(this), { passive: false });
    this.canvas.addEventListener("touchstart", this.#onTouchStart.bind(this), { passive: true });
    this.canvas.addEventListener("touchmove", this.#onTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener("touchend", this.#onTouchEnd.bind(this), { passive: true });
  }

  #wakeFromIdle() {
    this.idle = false;
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      this.idle = true;
    }, 3200);
  }

  #onMouseDown(event) {
    this.panning = event.button === 1 || event.button === 2 || event.shiftKey || event.altKey;
    this.dragging = !this.panning;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.#wakeFromIdle();
  }

  #onMouseMove(event) {
    if (!this.dragging && !this.panning) {
      return;
    }

    const deltaX = event.clientX - this.lastX;
    const deltaY = event.clientY - this.lastY;

    this.lastX = event.clientX;
    this.lastY = event.clientY;

    if (this.panning) {
      const panScale = 0.0032 / Math.max(this.zoom, 0.35);
      this.panX += deltaX * panScale;
      this.panY -= deltaY * panScale;
      return;
    }

    this.rotationY += deltaX * 0.008;
    this.rotationX += deltaY * 0.008;
    this.rotationX = Math.max(-Math.PI / 2.0, Math.min(Math.PI / 2.0, this.rotationX));
  }

  #onMouseUp() {
    this.dragging = false;
    this.panning = false;
  }

  #onWheel(event) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom + delta));
    this.#wakeFromIdle();
  }

  #onTouchStart(event) {
    if (event.touches.length === 1) {
      this.dragging = true;
      this.lastX = event.touches[0].clientX;
      this.lastY = event.touches[0].clientY;
      this.lastPinchDistance = null;
      this.#wakeFromIdle();
      return;
    }

    if (event.touches.length === 2) {
      this.dragging = false;
      this.lastPinchDistance = this.#pinchDistance(event);
      this.#wakeFromIdle();
    }
  }

  #onTouchMove(event) {
    event.preventDefault();

    if (event.touches.length === 1 && this.dragging) {
      const deltaX = event.touches[0].clientX - this.lastX;
      const deltaY = event.touches[0].clientY - this.lastY;

      this.lastX = event.touches[0].clientX;
      this.lastY = event.touches[0].clientY;
      this.rotationY += deltaX * 0.009;
      this.rotationX += deltaY * 0.009;
      this.rotationX = Math.max(-Math.PI / 2.0, Math.min(Math.PI / 2.0, this.rotationX));
      return;
    }

    if (event.touches.length === 2) {
      const distance = this.#pinchDistance(event);

      if (this.lastPinchDistance !== null) {
        const ratio = distance / this.lastPinchDistance;
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * ratio));
      }

      this.lastPinchDistance = distance;
      this.#wakeFromIdle();
    }
  }

  #onTouchEnd() {
    this.dragging = false;
    this.lastPinchDistance = null;
  }

  #pinchDistance(event) {
    const deltaX = event.touches[0].clientX - event.touches[1].clientX;
    const deltaY = event.touches[0].clientY - event.touches[1].clientY;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  nudgeRotation(deltaX, deltaY) {
    this.rotationY += deltaX;
    this.rotationX += deltaY;
    this.rotationX = Math.max(-Math.PI / 2.0, Math.min(Math.PI / 2.0, this.rotationX));
    this.#wakeFromIdle();
  }

  nudgeZoom(delta) {
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom + delta));
    this.#wakeFromIdle();
  }

  tick(deltaTime) {
    const reducedMotion = document.body.dataset.motion === "reduced";

    if (!reducedMotion && this.idle && !this.dragging && !this.panning) {
      this.rotationY += this.autoRotateSpeed * deltaTime;
    }
  }

  getMvp(aspect, displayScale) {
    const projection = mat4Perspective(0.72, aspect, 0.01, 100.0);
    const view = mat4Translation(this.panX, this.panY, -2.6);
    const rotationX = mat4RotationX(this.rotationX);
    const rotationY = mat4RotationY(this.rotationY);
    const scale = mat4Scale(displayScale * this.zoom);
    const model = mat4Multiply(mat4Multiply(rotationY, rotationX), scale);
    const modelView = mat4Multiply(view, model);
    return mat4Multiply(projection, modelView);
  }
}
