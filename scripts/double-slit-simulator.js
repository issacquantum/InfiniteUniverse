import { bindPinchZoom, isModelPanGesture } from "./model-pan.js?v=20260531-literal-reading-cleanup-v1";

const mountedSimulators = new WeakSet();
const TWO_PI = Math.PI * 2;

function getCanvasContentFont() {
  return getComputedStyle(document.body).fontFamily || "serif";
}

export function initDoubleSlitSimulators(root = document) {
  root.querySelectorAll("[data-double-slit-simulator]").forEach((container) => {
    if (mountedSimulators.has(container)) {
      return;
    }

    mountedSimulators.add(container);
    new DoubleSlitInterference(container);
  });
}

class DoubleSlitInterference {
  constructor(container) {
    this.container = container;
    this.viewport = container.querySelector("[data-ds-viewport]") ?? container;
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d", { alpha: true });
    this.animationFrame = null;
    this.lastTimestamp = 0;
    this.phase = 0;
    this.hitAccumulator = 0;
    this.hits = [];
    this.visible = true;
    this.destroyed = false;
    this.state = {
      wavelength: 32,
      slitDistance: 84,
      screenDistance: 220,
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
    this.pointer = null;

    this.handleResize = () => this.resize();

    if (!this.ctx) {
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
        en: "Double-slit interference simulation showing wavefronts, maxima, vertical scale, and screen intensity.",
        es: "Simulacion de interferencia de doble rendija con frentes de onda, maximos, escala vertical e intensidad en pantalla."
      },
      fallback: {
        en: "The double-slit simulation could not load in this browser.",
        es: "La simulacion de doble rendija no pudo cargarse en este navegador."
      },
      showPattern: {
        en: "Show Interference Pattern",
        es: "Mostrar Patron de Interferencia"
      },
      hidePattern: {
        en: "Hide Interference Pattern",
        es: "Ocultar Patron de Interferencia"
      },
      wavelength: {
        en: "wavelength",
        es: "longitud de onda"
      },
      slitDistance: {
        en: "slit distance",
        es: "distancia entre rendijas"
      },
      firstBand: {
        en: "First bright band",
        es: "Primera banda brillante"
      },
      modelUnits: {
        en: "model units from center",
        es: "unidades del modelo desde el centro"
      },
      screen: {
        en: "screen",
        es: "pantalla"
      },
      slitPlane: {
        en: "slits",
        es: "rendijas"
      },
      centralMaximum: {
        en: "central maximum",
        es: "maximo central"
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

  getDeviceMotionFactor() {
    const narrowViewport = window.matchMedia?.("(max-width: 760px)")?.matches ?? window.innerWidth <= 760;
    const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
    return narrowViewport || coarsePointer ? 0.42 : 1;
  }

  bindControls() {
    this.container.querySelectorAll("[data-ds-param]").forEach((control) => {
      const param = control.dataset.dsParam;
      this.state[param] = Number(control.value);
      this.syncValue(param);
      control.addEventListener("input", () => {
        this.state[param] = Number(control.value);
        this.hits = [];
        this.syncValue(param);
        this.syncEquation();
      });
    });

    this.container.querySelectorAll("[data-ds-toggle]").forEach((control) => {
      const toggle = control.dataset.dsToggle;
      this.state[toggle] = control.checked;
      control.addEventListener("change", () => {
        this.state[toggle] = control.checked;
        if (toggle === "detectorMode") {
          this.hits = [];
        }
      });
    });

    this.container.querySelector("[data-ds-action='pattern']")?.addEventListener("click", (event) => {
      this.state.showPattern = !this.state.showPattern;
      event.currentTarget.textContent = this.state.showPattern
        ? this.copy("hidePattern")
        : this.copy("showPattern");
    });

    this.container.querySelector("[data-ds-action='clearHits']")?.addEventListener("click", () => {
      this.hits = [];
    });

    this.syncEquation();
  }

  syncValue(param) {
    const target = this.container.querySelector(`[data-ds-value='${param}']`);
    if (target) {
      target.textContent = this.state[param].toFixed(0);
    }
  }

  syncEquation() {
    const target = this.container.querySelector("[data-ds-equation]");
    if (!target) {
      return;
    }

    const firstBand = this.state.wavelength * this.state.screenDistance / Math.max(1, this.state.slitDistance);
    target.textContent = `${this.copy("firstBand")}: y1 ≈ ${firstBand.toFixed(1)} ${this.copy("modelUnits")}.`;
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

      this.state.panX = clamp(this.pointer.panX + event.clientX - this.pointer.x, -this.width * 0.24, this.width * 0.12);
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
      },
      min: 0.72,
      max: 1.55,
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
  }

  render(timestamp) {
    if (this.destroyed) {
      return;
    }

    const deltaTime = this.lastTimestamp ? Math.min((timestamp - this.lastTimestamp) / 1000, 0.05) : 0.016;
    this.lastTimestamp = timestamp;

    if (this.visible) {
      const deviceMotionFactor = this.getDeviceMotionFactor();
      const motionFactor = (document.body.dataset.motion === "reduced" ? 0.35 : 1) * deviceMotionFactor;
      this.phase = (this.phase + deltaTime * 34 * motionFactor) % this.state.wavelength;
      this.updateHits(deltaTime * deviceMotionFactor);
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

    const layout = this.getLayout();
    this.drawBackground(ctx);
    this.drawIncomingWaves(ctx, layout);
    if (this.state.showWavefronts) {
      this.drawInterferenceWaveField(ctx, layout);
      this.drawDiffractedWavefronts(ctx, layout);
    }
    if (this.state.showMaxima) {
      this.drawMaxima(ctx, layout);
    }
    this.drawSlitBarrier(ctx, layout);
    this.drawScreen(ctx, layout);
    if (this.state.showHits) {
      this.drawHits(ctx, layout);
    }
    if (this.state.showPattern) {
      this.drawInterferencePattern(ctx, layout);
    }
    if (this.state.showScale) {
      this.drawScale(ctx, layout);
    }
    this.drawLabels(ctx, layout);

    ctx.restore();
  }

  getLayout() {
    const zoom = this.state.zoom;
    const centerX = this.width / 2;
    const centerY = this.height / 2 + this.state.panY;
    const barrierX = centerX + (this.width * 0.38 - centerX) * zoom + this.state.panX;
    const screenDistance = scaleByHeight(this.state.screenDistance, this.height, 320) * zoom;
    const screenX = clamp(barrierX + screenDistance, barrierX + this.width * 0.22, this.width - 86);
    const slitDistance = scaleByHeight(this.state.slitDistance, this.height, 320) * zoom;
    const slitGap = Math.max(14, Math.min(24, this.height * 0.07));
    const slitA = centerY - slitDistance / 2;
    const slitB = centerY + slitDistance / 2;

    return {
      centerY,
      barrierX,
      screenX,
      slitDistance,
      slitGap,
      slitA,
      slitB,
      sourceX: centerX + (this.width * 0.1 - centerX) * zoom + this.state.panX,
      top: 18 + this.state.panY,
      bottom: this.height - 18 + this.state.panY
    };
  }

  drawBackground(ctx) {
    const gradient = ctx.createRadialGradient(
      this.width * 0.52,
      this.height * 0.5,
      0,
      this.width * 0.52,
      this.height * 0.5,
      this.width * 0.68
    );
    gradient.addColorStop(0, "#120528");
    gradient.addColorStop(0.62, "#080214");
    gradient.addColorStop(1, "#050008");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  drawIncomingWaves(ctx, layout) {
    ctx.save();
    ctx.strokeStyle = "rgba(119, 0, 255, 0.16)";
    ctx.lineWidth = 1;

    for (let x = layout.sourceX; x < layout.barrierX - 10; x += this.state.wavelength) {
      const shiftedX = x + this.phase;
      if (shiftedX > layout.barrierX - 10) {
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(shiftedX, layout.top);
      ctx.lineTo(shiftedX, layout.bottom);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawDiffractedWavefronts(ctx, layout) {
    const maxRadius = layout.screenX - layout.barrierX + this.height * 0.35;

    ctx.save();
    ctx.lineWidth = 1.25;
    ctx.strokeStyle = "rgba(119, 0, 255, 0.22)";

    for (let radius = this.phase; radius < maxRadius; radius += this.state.wavelength) {
      const alpha = Math.max(0.04, 0.25 * (1 - radius / maxRadius));
      ctx.strokeStyle = `rgba(119, 0, 255, ${alpha})`;
      this.strokeWaveArc(ctx, layout.barrierX, layout.slitA, radius);
      this.strokeWaveArc(ctx, layout.barrierX, layout.slitB, radius);
    }

    ctx.restore();
  }

  drawInterferenceWaveField(ctx, layout) {
    const wavelength = Math.max(8, this.state.wavelength);
    const k = TWO_PI / wavelength;
    const startX = layout.barrierX + 12;
    const endX = layout.screenX - 8;
    const step = Math.max(6, Math.min(10, this.width / 80));

    if (endX <= startX) {
      return;
    }

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (let x = startX; x <= endX; x += step) {
      for (let y = layout.top + step; y <= layout.bottom - step; y += step) {
        const r1 = Math.hypot(x - layout.barrierX, y - layout.slitA);
        const r2 = Math.hypot(x - layout.barrierX, y - layout.slitB);
        const waveA = Math.sin(k * (r1 - this.phase * 1.8));
        const waveB = Math.sin(k * (r2 - this.phase * 1.8));
        const combined = (waveA + waveB) * 0.5;
        const brightness = Math.abs(combined);

        if (brightness < 0.28) {
          continue;
        }

        const alpha = 0.035 + brightness * 0.13;
        ctx.fillStyle = combined >= 0
          ? `rgba(138, 43, 226, ${alpha})`
          : `rgba(191, 64, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.2 + brightness * 1.8, 0, TWO_PI);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  strokeWaveArc(ctx, x, y, radius) {
    if (radius <= 2) {
      return;
    }

    ctx.beginPath();
    ctx.arc(x, y, radius, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  }

  drawMaxima(ctx, layout) {
    const distanceToScreen = layout.screenX - layout.barrierX;
    const orderLimit = 5;

    ctx.save();
    ctx.lineWidth = 1.25;
    ctx.setLineDash([6, 8]);

    for (let order = -orderLimit; order <= orderLimit; order += 1) {
      const sinTheta = order * this.state.wavelength / this.state.slitDistance;
      if (Math.abs(sinTheta) >= 0.96) {
        continue;
      }

      const y = layout.centerY + distanceToScreen * sinTheta / Math.sqrt(1 - sinTheta ** 2);
      if (y < layout.top || y > layout.bottom) {
        continue;
      }

      ctx.strokeStyle = order === 0 ? "rgba(191, 64, 255, 0.58)" : "rgba(191, 64, 255, 0.24)";
      ctx.beginPath();
      ctx.moveTo(layout.barrierX, layout.centerY);
      ctx.lineTo(layout.screenX, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawSlitBarrier(ctx, layout) {
    ctx.save();
    ctx.strokeStyle = "rgba(224, 152, 255, 0.62)";
    ctx.lineWidth = 4;
    ctx.shadowBlur = 12;
    ctx.shadowColor = "rgba(191, 64, 255, 0.36)";

    ctx.beginPath();
    ctx.moveTo(layout.barrierX, layout.top);
    ctx.lineTo(layout.barrierX, layout.slitA - layout.slitGap / 2);
    ctx.moveTo(layout.barrierX, layout.slitA + layout.slitGap / 2);
    ctx.lineTo(layout.barrierX, layout.slitB - layout.slitGap / 2);
    ctx.moveTo(layout.barrierX, layout.slitB + layout.slitGap / 2);
    ctx.lineTo(layout.barrierX, layout.bottom);
    ctx.stroke();

    ctx.fillStyle = "#8a2be2";
    ctx.shadowBlur = 14;
    for (const y of [layout.slitA, layout.slitB]) {
      ctx.beginPath();
      ctx.arc(layout.barrierX, y, 3.8, 0, TWO_PI);
      ctx.fill();
    }

    ctx.restore();
  }

  drawScreen(ctx, layout) {
    ctx.save();
    ctx.fillStyle = "rgba(224, 152, 255, 0.16)";
    ctx.fillRect(layout.screenX, layout.top, 3, layout.bottom - layout.top);
    ctx.strokeStyle = "rgba(191, 64, 255, 0.42)";
    ctx.lineWidth = 1;
    ctx.strokeRect(layout.screenX - 2, layout.top, 7, layout.bottom - layout.top);
    ctx.restore();
  }

  drawInterferencePattern(ctx, layout) {
    const patternWidth = this.getPatternWidth(layout);
    const startX = layout.screenX + 10;

    ctx.save();
    for (let y = Math.ceil(layout.top); y <= layout.bottom; y += 1) {
      const intensity = this.intensityAt(y, layout);
      const width = Math.max(1, patternWidth * intensity);
      const alpha = 0.14 + 0.76 * intensity;

      ctx.fillStyle = `rgba(138, 43, 226, ${alpha})`;
      ctx.fillRect(startX, y, width, 1);
    }
    ctx.restore();
  }

  updateHits(deltaTime) {
    if (!this.state.showHits || !this.width || !this.height) {
      return;
    }

    const layout = this.getLayout();
    this.hitAccumulator += deltaTime * (this.state.detectorMode ? 34 : 42);

    while (this.hitAccumulator >= 1) {
      this.hitAccumulator -= 1;
      const hit = this.sampleHit(layout);
      if (hit) {
        this.hits.push(hit);
      }
    }

    if (this.hits.length > 900) {
      this.hits.splice(0, this.hits.length - 900);
    }
  }

  sampleHit(layout) {
    for (let attempt = 0; attempt < 70; attempt += 1) {
      const y = layout.top + Math.random() * (layout.bottom - layout.top);
      if (Math.random() <= this.intensityAt(y, layout)) {
        return {
          y,
          x: layout.screenX + 12 + Math.random() * Math.max(8, this.getPatternWidth(layout) - 12),
          radius: 1.2 + Math.random() * 1.2
        };
      }
    }

    return null;
  }

  intensityAt(y, layout) {
    if (this.state.detectorMode) {
      const peakWidth = Math.max(14, this.height * 0.07);
      const peakA = Math.exp(-((y - layout.slitA) ** 2) / (2 * peakWidth ** 2));
      const peakB = Math.exp(-((y - layout.slitB) ** 2) / (2 * peakWidth ** 2));
      return clamp((peakA + peakB) * 0.74, 0.02, 1);
    }

    const offset = y - layout.centerY;
    const distanceToScreen = layout.screenX - layout.barrierX;
    const sinTheta = offset / Math.sqrt(offset ** 2 + distanceToScreen ** 2);
    const phase = Math.PI * this.state.slitDistance * sinTheta / this.state.wavelength;
    const aperture = 18;
    const envelopeArg = Math.PI * aperture * sinTheta / this.state.wavelength;
    const envelope = sinc(envelopeArg) ** 2;
    return clamp(Math.cos(phase) ** 2 * envelope, 0.02, 1);
  }

  getPatternWidth(layout) {
    return Math.min(84, this.width - layout.screenX - 24);
  }

  drawHits(ctx, layout) {
    ctx.save();
    for (const hit of this.hits) {
      ctx.fillStyle = this.state.detectorMode
        ? "rgba(191, 64, 255, 0.62)"
        : "rgba(138, 43, 226, 0.68)";
      ctx.shadowBlur = 6;
      ctx.shadowColor = this.state.detectorMode
        ? "rgba(191, 64, 255, 0.5)"
        : "rgba(191, 64, 255, 0.48)";
      ctx.beginPath();
      ctx.arc(hit.x, hit.y, hit.radius, 0, TWO_PI);
      ctx.fill();
    }
    ctx.restore();
  }

  drawScale(ctx, layout) {
    const x = layout.screenX - 28;
    const tick = Math.max(20, this.height * 0.08);

    ctx.save();
    ctx.strokeStyle = "rgba(191, 64, 255, 0.34)";
    ctx.fillStyle = "rgba(159, 92, 255, 0.92)";
    ctx.lineWidth = 1;
    ctx.font = `600 12px ${getCanvasContentFont()}`;
    ctx.textAlign = "right";

    ctx.beginPath();
    ctx.moveTo(x, layout.top);
    ctx.lineTo(x, layout.bottom);
    ctx.stroke();

    for (let y = layout.centerY; y >= layout.top; y -= tick) {
      this.drawScaleTick(ctx, x, y, Math.round((layout.centerY - y) / tick));
    }
    for (let y = layout.centerY + tick; y <= layout.bottom; y += tick) {
      this.drawScaleTick(ctx, x, y, -Math.round((y - layout.centerY) / tick));
    }

    ctx.restore();
  }

  drawScaleTick(ctx, x, y, label) {
    ctx.beginPath();
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x + 4, y);
    ctx.stroke();
    ctx.fillText(String(label), x - 8, y + 4);
  }

  drawLabels(ctx, layout) {
    ctx.save();
    ctx.font = `700 13px ${getCanvasContentFont()}`;
    ctx.fillStyle = "rgba(159, 92, 255, 0.94)";
    ctx.textAlign = "center";
    ctx.fillText(this.copy("slitPlane"), layout.barrierX, layout.bottom + 14);
    ctx.fillText(this.copy("screen"), layout.screenX, layout.bottom + 14);

    if (this.state.showMaxima) {
      ctx.fillStyle = "#bf40ff";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(191, 64, 255, 0.48)";
      ctx.fillText(this.copy("centralMaximum"), (layout.barrierX + layout.screenX) / 2, layout.centerY - 10);
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

function scaleByHeight(value, height, baseHeight) {
  return value * Math.max(0.75, Math.min(1.35, height / baseHeight));
}

function sinc(value) {
  return Math.abs(value) < 0.0001 ? 1 : Math.sin(value) / value;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
