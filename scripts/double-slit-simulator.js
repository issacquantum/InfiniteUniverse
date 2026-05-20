import { bindPinchZoom, isModelPanGesture } from "./model-pan.js?v=20260511-mobile-pinch-zoom";

const mountedSimulators = new WeakSet();
const TWO_PI = Math.PI * 2;

export function initDoubleSlitSimulators(root = document) {
  root.querySelectorAll("[data-double-slit-simulator]").forEach((container) => {
    if (mountedSimulators.has(container)) {
      return;
    }

    mountedSimulators.add(container);
    new ElectronDiffractionSimulator(container);
  });
}

class ElectronDiffractionSimulator {
  constructor(container) {
    this.container = container;
    this.viewport = container.querySelector("[data-ds-viewport]") ?? container;
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d", { alpha: true });
    this.fieldCanvas = document.createElement("canvas");
    this.fieldCtx = this.fieldCanvas.getContext("2d", { alpha: true });
    this.animationFrame = null;
    this.lastTimestamp = 0;
    this.phase = 0;
    this.visible = true;
    this.destroyed = false;
    this.pointer = null;
    this.cachedFieldKey = "";
    this.fieldSamples = null;
    this.scatterers = [];
    this.state = {
      wavelength: 16,
      slitDistance: 8,
      showWavefronts: true,
      showMaxima: true,
      showScale: true,
      showHits: true,
      detectorMode: false,
      showPattern: false,
      panX: 0,
      panY: 0,
      zoom: 1
    };

    this.handleResize = () => this.resize();

    if (!this.ctx || !this.fieldCtx) {
      this.viewport.replaceChildren(this.createFallback());
      return;
    }

    this.canvas.className = "ds-canvas";
    this.canvas.setAttribute("aria-label", this.copy("canvasLabel"));
    this.viewport.replaceChildren(this.canvas);
    this.bindControls();
    this.bindCanvas();
    this.resize();
    this.setupObservers();
    this.render = this.render.bind(this);
    this.animationFrame = requestAnimationFrame(this.render);
  }

  get isSpanish() {
    return this.container.dataset.language === "es" || document.documentElement.lang.startsWith("es");
  }

  copy(key) {
    const content = {
      canvasLabel: {
        en: "Animated electron diffraction simulation with a crystal lattice and Bohr-radius axes.",
        es: "Simulacion animada de difraccion de electrones con red cristalina y ejes en radios de Bohr."
      },
      fallback: {
        en: "The electron diffraction simulation could not load in this browser.",
        es: "La simulacion de difraccion de electrones no pudo cargarse en este navegador."
      },
      showPattern: {
        en: "Boost Diffraction",
        es: "Intensificar Difraccion"
      },
      hidePattern: {
        en: "Normalize Diffraction",
        es: "Normalizar Difraccion"
      },
      xAxis: {
        en: "x [Bohr radius]",
        es: "x [radio de Bohr]"
      },
      yAxis: {
        en: "y [Bohr radius]",
        es: "y [radio de Bohr]"
      },
      source: {
        en: "electron source",
        es: "fuente de electrones"
      },
      lattice: {
        en: "crystal lattice",
        es: "red cristalina"
      },
      bragg: {
        en: "diffracted orders",
        es: "ordenes difractados"
      }
    };

    return content[key][this.isSpanish ? "es" : "en"];
  }

  createFallback() {
    const fallback = document.createElement("p");
    fallback.className = "content-placeholder";
    fallback.textContent = this.copy("fallback");
    return fallback;
  }

  bindControls() {
    this.container.querySelectorAll("[data-ds-param]").forEach((control) => {
      const param = control.dataset.dsParam;
      this.state[param] = Number(control.value);
      this.syncValue(param);
      control.addEventListener("input", () => {
        this.state[param] = Number(control.value);
        this.cachedFieldKey = "";
        this.syncValue(param);
      });
    });

    this.container.querySelectorAll("[data-ds-toggle]").forEach((control) => {
      const toggle = control.dataset.dsToggle;
      this.state[toggle] = control.checked;
      control.addEventListener("change", () => {
        this.state[toggle] = control.checked;
      });
    });

    this.container.querySelector("[data-ds-action='pattern']")?.addEventListener("click", (event) => {
      this.state.showPattern = !this.state.showPattern;
      this.cachedFieldKey = "";
      event.currentTarget.textContent = this.state.showPattern
        ? this.copy("hidePattern")
        : this.copy("showPattern");
    });

    this.container.querySelector("[data-ds-action='clearHits']")?.addEventListener("click", () => {
      this.state.panX = 0;
      this.state.panY = 0;
      this.state.zoom = 1;
    });
  }

  syncValue(param) {
    const target = this.container.querySelector(`[data-ds-value='${param}']`);
    if (target) {
      target.textContent = this.state[param].toFixed(0);
    }
  }

  bindCanvas() {
    this.canvas.addEventListener("pointerdown", (event) => {
      if (!isModelPanGesture(event)) {
        return;
      }

      event.preventDefault();
      this.pointer = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        panX: this.state.panX,
        panY: this.state.panY
      };
      this.canvas.setPointerCapture?.(event.pointerId);
    });

    this.canvas.addEventListener("pointermove", (event) => {
      if (!this.pointer || this.pointer.id !== event.pointerId) {
        return;
      }

      this.state.panX = clamp(this.pointer.panX + event.clientX - this.pointer.x, -this.width * 0.22, this.width * 0.22);
      this.state.panY = clamp(this.pointer.panY + event.clientY - this.pointer.y, -this.height * 0.22, this.height * 0.22);
    });

    this.canvas.addEventListener("pointerup", (event) => {
      if (this.pointer?.id === event.pointerId) {
        this.pointer = null;
      }
    });

    this.canvas.addEventListener("pointercancel", (event) => {
      if (this.pointer?.id === event.pointerId) {
        this.pointer = null;
      }
    });

    this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());

    bindPinchZoom(this.canvas, {
      getValue: () => this.state.zoom,
      setValue: (value) => {
        this.state.zoom = value;
        this.cachedFieldKey = "";
      },
      min: 0.78,
      max: 1.58,
      onStart: () => {
        this.pointer = null;
      }
    });
  }

  setupObservers() {
    if ("ResizeObserver" in window) {
      this.resizeObserver = new ResizeObserver(this.handleResize);
      this.resizeObserver.observe(this.viewport);
    } else {
      window.addEventListener("resize", this.handleResize);
    }

    if ("IntersectionObserver" in window) {
      this.visibilityObserver = new IntersectionObserver((entries) => {
        this.visible = Boolean(entries[0]?.isIntersecting);
      }, { threshold: 0.08 });
      this.visibilityObserver.observe(this.container);
    }

    if ("MutationObserver" in window && document.body) {
      this.cleanupObserver = new MutationObserver(() => {
        if (!document.contains(this.container)) {
          this.destroy();
        }
      });
      this.cleanupObserver.observe(document.body, { childList: true, subtree: true });
    }
  }

  resize() {
    const rect = this.viewport.getBoundingClientRect();
    const width = Math.max(320, Math.floor(rect.width));
    const height = Math.max(230, Math.floor(rect.height || width * 9 / 16));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.fieldScale = width < 520 ? 0.5 : 0.44;
    this.fieldWidth = Math.max(220, Math.floor(width * this.fieldScale));
    this.fieldHeight = Math.max(150, Math.floor(height * this.fieldScale));
    this.fieldCanvas.width = this.fieldWidth;
    this.fieldCanvas.height = this.fieldHeight;
    this.cachedFieldKey = "";
  }

  render(timestamp) {
    if (this.destroyed) {
      return;
    }

    const deltaTime = this.lastTimestamp ? Math.min((timestamp - this.lastTimestamp) / 1000, 0.05) : 0.016;
    this.lastTimestamp = timestamp;

    if (this.visible && document.body.dataset.motion !== "reduced") {
      this.phase = (this.phase + deltaTime * 5.2) % TWO_PI;
    }

    this.draw();
    this.animationFrame = requestAnimationFrame(this.render);
  }

  draw() {
    if (!this.width || !this.height) {
      return;
    }

    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);
    ctx.clearRect(0, 0, this.width, this.height);

    const transform = this.getTransform();
    this.drawBackground(ctx);
    this.drawField(ctx, transform);
    if (this.state.showScale) {
      this.drawAxes(ctx, transform);
    }
    if (this.state.showWavefronts) {
      this.drawWavefrontContours(ctx, transform);
    }
    if (this.state.showMaxima) {
      this.drawBraggGuides(ctx, transform);
    }
    if (this.state.showHits) {
      this.drawCrystalLattice(ctx, transform);
    }
    this.drawSource(ctx, transform);
    this.drawLabels(ctx, transform);

    ctx.restore();
  }

  getTransform() {
    const zoom = this.state.zoom;
    const worldSize = 92 / zoom;
    const scale = Math.min(this.width, this.height) / worldSize;
    const cx = this.width / 2 + this.state.panX;
    const cy = this.height / 2 + this.state.panY;

    return {
      scale,
      cx,
      cy,
      left: -this.width / (2 * scale) - this.state.panX / scale,
      right: this.width / (2 * scale) - this.state.panX / scale,
      top: this.height / (2 * scale) + this.state.panY / scale,
      bottom: -this.height / (2 * scale) + this.state.panY / scale
    };
  }

  worldToScreen(x, y, transform) {
    return {
      x: transform.cx + x * transform.scale,
      y: transform.cy - y * transform.scale
    };
  }

  screenToWorld(x, y, transform) {
    return {
      x: (x - transform.cx) / transform.scale,
      y: (transform.cy - y) / transform.scale
    };
  }

  drawBackground(ctx) {
    const gradient = ctx.createRadialGradient(
      this.width * 0.58,
      this.height * 0.48,
      0,
      this.width * 0.58,
      this.height * 0.48,
      this.width * 0.78
    );
    gradient.addColorStop(0, "#160536");
    gradient.addColorStop(0.46, "#080214");
    gradient.addColorStop(1, "#030005");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#ff00a2";
    for (let i = 0; i < 90; i += 1) {
      const x = (i * 137.5) % this.width;
      const y = (i * 91.7) % this.height;
      const size = 0.55 + ((i * 17) % 7) * 0.12;
      ctx.fillRect(x, y, size, size);
    }
    ctx.restore();
  }

  drawField(ctx, transform) {
    this.updateFieldImage(transform);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(this.fieldCanvas, 0, 0, this.width, this.height);
    ctx.restore();
  }

  updateFieldImage(transform) {
    const samples = this.getFieldSamples(transform);
    const image = this.fieldCtx.createImageData(this.fieldWidth, this.fieldHeight);
    const data = image.data;

    for (let index = 0; index < samples.intensity.length; index += 1) {
      const intensity = samples.intensity[index];
      const localPhase = samples.phase[index] - this.phase;
      const signed = Math.sin(localPhase * 2 + intensity * 4.5);
      const edge = Math.pow(intensity, this.state.detectorMode ? 0.62 : 0.82);
      const chroma = 0.52 + 0.48 * signed;
      const alpha = clamp(edge * 1.18, 0, 1);
      const pixel = index * 4;

      data[pixel] = Math.floor((18 + 205 * chroma) * alpha);
      data[pixel + 1] = Math.floor((2 + 34 * (1 - chroma)) * alpha);
      data[pixel + 2] = Math.floor((64 + 190 * (1 - chroma * 0.35)) * alpha);
      data[pixel + 3] = Math.floor(255 * clamp(alpha * 1.14, 0, 1));
    }

    this.fieldCtx.putImageData(image, 0, 0);
  }

  getFieldSamples(transform) {
    const wavelength = Math.max(7, this.state.wavelength * 0.42);
    const spacing = Math.max(4, this.state.slitDistance * 0.58);
    const key = [
      this.fieldWidth,
      this.fieldHeight,
      this.width,
      this.height,
      this.state.zoom.toFixed(3),
      this.state.panX.toFixed(1),
      this.state.panY.toFixed(1),
      wavelength.toFixed(2),
      spacing.toFixed(2),
      this.state.showPattern ? "boost" : "normal"
    ].join(":");

    if (key === this.cachedFieldKey && this.fieldSamples) {
      return this.fieldSamples;
    }

    this.scatterers = this.buildScatterers(spacing);
    const intensitySamples = new Float32Array(this.fieldWidth * this.fieldHeight);
    const phaseSamples = new Float32Array(this.fieldWidth * this.fieldHeight);
    const k = TWO_PI / wavelength;
    const sourceX = 47;
    const sourceY = 0;
    const boost = this.state.showPattern ? 1.28 : 1;
    const latticeStart = 13;

    for (let py = 0; py < this.fieldHeight; py += 1) {
      for (let px = 0; px < this.fieldWidth; px += 1) {
        const screenX = (px + 0.5) / this.fieldWidth * this.width;
        const screenY = (py + 0.5) / this.fieldHeight * this.height;
        const world = this.screenToWorld(screenX, screenY, transform);
        let real = 0;
        let imag = 0;

        const sourceEnvelope = Math.exp(-((world.y - sourceY) ** 2) / 420) * smoothstep(45, 12, world.x);
        const incidentPhase = k * (sourceX - world.x);
        real += Math.cos(incidentPhase) * sourceEnvelope * 0.55;
        imag += Math.sin(incidentPhase) * sourceEnvelope * 0.55;

        for (const atom of this.scatterers) {
          const distance = Math.hypot(world.x - atom.x, world.y - atom.y);
          const leftGate = smoothstep(latticeStart + 5, latticeStart - 8, world.x);
          const radialEnvelope = Math.exp(-distance * 0.022) / Math.sqrt(distance + 1.2);
          const phase = k * distance + atom.seed;
          const amplitude = atom.weight * radialEnvelope * leftGate * boost;
          real += Math.cos(phase) * amplitude;
          imag += Math.sin(phase) * amplitude;
        }

        const intensity = Math.min(1, Math.sqrt(real * real + imag * imag) * 0.82);
        const index = py * this.fieldWidth + px;
        intensitySamples[index] = intensity;
        phaseSamples[index] = Math.atan2(imag, real);
      }
    }

    this.cachedFieldKey = key;
    this.fieldSamples = {
      intensity: intensitySamples,
      phase: phaseSamples
    };
    return this.fieldSamples;
  }

  buildScatterers(spacing) {
    const points = [];
    const columns = 5;
    const rows = 9;
    const startX = 16;
    const startY = -spacing * (rows - 1) / 2;

    for (let col = 0; col < columns; col += 1) {
      for (let row = 0; row < rows; row += 1) {
        const stagger = col % 2 ? spacing * 0.5 : 0;
        const y = startY + row * spacing + stagger;
        if (Math.abs(y) > 35) {
          continue;
        }

        points.push({
          x: startX + col * spacing * 0.95,
          y,
          seed: (col * 0.73 + row * 0.39) % TWO_PI,
          weight: 0.82 + 0.1 * Math.cos(row * 1.7)
        });
      }
    }

    return points;
  }

  drawAxes(ctx, transform) {
    ctx.save();
    ctx.lineWidth = 1;
    ctx.font = "600 11px Cormorant Garamond, Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (let value = -40; value <= 40; value += 10) {
      const verticalA = this.worldToScreen(value, -40, transform);
      const verticalB = this.worldToScreen(value, 40, transform);
      const horizontalA = this.worldToScreen(-40, value, transform);
      const horizontalB = this.worldToScreen(40, value, transform);
      const isAxis = value === 0;

      ctx.strokeStyle = isAxis ? "rgba(255, 255, 255, 0.22)" : "rgba(255, 255, 255, 0.085)";
      ctx.beginPath();
      ctx.moveTo(verticalA.x, verticalA.y);
      ctx.lineTo(verticalB.x, verticalB.y);
      ctx.moveTo(horizontalA.x, horizontalA.y);
      ctx.lineTo(horizontalB.x, horizontalB.y);
      ctx.stroke();

      if (value % 20 === 0) {
        ctx.fillStyle = "rgba(255, 232, 252, 0.62)";
        const xTick = this.worldToScreen(value, -40, transform);
        const yTick = this.worldToScreen(-40, value, transform);
        ctx.fillText(String(value), xTick.x, xTick.y + 5);
        ctx.textAlign = "right";
        ctx.fillText(String(value), yTick.x - 6, yTick.y - 6);
        ctx.textAlign = "center";
      }
    }

    const xLabel = this.worldToScreen(27, -40, transform);
    const yLabel = this.worldToScreen(-40, 34, transform);
    ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
    ctx.fillText(this.copy("xAxis"), xLabel.x, xLabel.y + 20);
    ctx.save();
    ctx.translate(yLabel.x - 28, yLabel.y);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(this.copy("yAxis"), 0, 0);
    ctx.restore();
    ctx.restore();
  }

  drawWavefrontContours(ctx, transform) {
    const wavelength = Math.max(7, this.state.wavelength * 0.42);
    const maxRadius = 76;

    ctx.save();
    ctx.lineWidth = Math.max(0.8, transform.scale * 0.055);
    ctx.globalCompositeOperation = "lighter";

    for (const atom of this.scatterers) {
      const origin = this.worldToScreen(atom.x, atom.y, transform);
      for (let radius = ((this.phase / TWO_PI) * wavelength) % wavelength; radius < maxRadius; radius += wavelength) {
        const screenRadius = radius * transform.scale;
        if (screenRadius < 3) {
          continue;
        }

        const fade = clamp(1 - radius / maxRadius, 0, 1);
        ctx.strokeStyle = `rgba(255, 0, 162, ${0.015 + 0.075 * fade})`;
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, screenRadius, 0, TWO_PI);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  drawBraggGuides(ctx, transform) {
    const origin = this.worldToScreen(15, 0, transform);
    const length = 58 * transform.scale;

    ctx.save();
    ctx.setLineDash([8, 10]);
    ctx.lineWidth = 1.2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(255, 0, 162, 0.38)";

    [-0.44, -0.25, 0, 0.25, 0.44].forEach((angle, index) => {
      const alpha = index === 2 ? 0.42 : 0.22;
      ctx.strokeStyle = `rgba(255, 88, 214, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(origin.x - Math.cos(angle) * length, origin.y - Math.sin(angle) * length);
      ctx.stroke();
    });

    ctx.restore();
  }

  drawCrystalLattice(ctx, transform) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (const atom of this.scatterers) {
      const point = this.worldToScreen(atom.x, atom.y, transform);
      const radius = clamp(transform.scale * 0.52, 2.6, 5.8);
      const glow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius * 3.2);
      glow.addColorStop(0, "rgba(255, 255, 255, 0.98)");
      glow.addColorStop(0.2, "rgba(255, 232, 252, 0.92)");
      glow.addColorStop(0.48, "rgba(255, 0, 162, 0.28)");
      glow.addColorStop(1, "rgba(119, 0, 255, 0)");

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius * 3.2, 0, TWO_PI);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, TWO_PI);
      ctx.fill();
    }

    ctx.restore();
  }

  drawSource(ctx, transform) {
    const source = this.worldToScreen(45, 0, transform);
    const pulse = 0.5 + 0.5 * Math.sin(this.phase * 2.4);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(255, 0, 162, 0.5)";
    ctx.fillStyle = "rgba(191, 64, 255, 0.34)";
    ctx.lineWidth = 1.3;
    ctx.shadowBlur = 18;
    ctx.shadowColor = "rgba(255, 0, 162, 0.56)";
    ctx.beginPath();
    ctx.arc(source.x, source.y, 9 + pulse * 4, 0, TWO_PI);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 232, 252, 0.7)";
    ctx.beginPath();
    ctx.moveTo(source.x - 8, source.y);
    ctx.lineTo(source.x - 24, source.y);
    ctx.lineTo(source.x - 18, source.y - 5);
    ctx.moveTo(source.x - 24, source.y);
    ctx.lineTo(source.x - 18, source.y + 5);
    ctx.stroke();
    ctx.restore();
  }

  drawLabels(ctx, transform) {
    const lattice = this.worldToScreen(25, -35, transform);
    const source = this.worldToScreen(45, 8, transform);
    const bragg = this.worldToScreen(-18, 30, transform);

    ctx.save();
    ctx.font = "700 13px Cormorant Garamond, Georgia, serif";
    ctx.fillStyle = "rgba(255, 232, 252, 0.78)";
    ctx.textAlign = "center";
    ctx.fillText(this.copy("source"), source.x, source.y);
    ctx.fillText(this.copy("lattice"), lattice.x, lattice.y);
    if (this.state.showMaxima) {
      ctx.fillStyle = "rgba(255, 88, 214, 0.82)";
      ctx.fillText(this.copy("bragg"), bragg.x, bragg.y);
    }
    ctx.restore();
  }

  destroy() {
    this.destroyed = true;

    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.resizeObserver?.disconnect();
    this.visibilityObserver?.disconnect();
    this.cleanupObserver?.disconnect();
    window.removeEventListener("resize", this.handleResize);
  }
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
