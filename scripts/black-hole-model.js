import { bindPinchZoom } from "./model-pan.js?v=20260607-site-purpose-close-v1";

const mountedModels = new WeakSet();

const COLORS = {
  brightViolet: "#8a2be2",
  luminousViolet: "#bf40ff",
  electric: "#bf40ff",
  violet: "#7700ff",
  indigo: "#2b006d",
  deep: "#050008",
  void: "#020004"
};

function getCanvasContentFont() {
  return getComputedStyle(document.body).fontFamily || "serif";
}

export function initBlackHoleModels(root = document) {
  root.querySelectorAll("[data-black-hole-model]").forEach((container) => {
    if (mountedModels.has(container)) {
      return;
    }

    mountedModels.add(container);
    new BlackHoleModel(container);
  });
}

class BlackHoleModel {
  constructor(container) {
    this.container = container;
    this.frame = container.querySelector("[data-bh-frame]") ?? container;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "black-hole-model__canvas";
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute("aria-label", this.copy("canvasLabel"));
    this.frame.replaceChildren(this.canvas, this.createHint());

    this.state = {
      mass: Number(container.querySelector("[data-bh-param='mass']")?.value ?? 1),
      spin: Number(container.querySelector("[data-bh-param='spin']")?.value ?? 0.72),
      inclination: Number(container.querySelector("[data-bh-param='inclination']")?.value ?? 62),
      brightness: Number(container.querySelector("[data-bh-param='brightness']")?.value ?? 1),
      centerX: 0.5,
      centerY: 0.49,
      angle: -0.16
    };

    this.ctx = this.canvas.getContext("2d", { alpha: false });
    this.pointer = null;
    this.time = 0;
    this.lastTimestamp = 0;
    this.visible = true;
    this.destroyed = false;
    this.stars = createStars(180);
    this.handleResize = () => this.resize();
    this.render = this.render.bind(this);

    this.bindControls();
    this.bindInteraction();
    this.setupObservers();
    this.resize();
    this.animationFrame = requestAnimationFrame(this.render);
  }

  get isSpanish() {
    return this.container.dataset.language === "es" || document.documentElement.lang.startsWith("es");
  }

  copy(key) {
    const content = {
      canvasLabel: {
        en: "Interactive Kerr-inspired black hole shadow model.",
        es: "Modelo interactivo de sombra de agujero negro inspirado en Kerr."
      },
      hint: {
        en: "drag disk to rotate · Shift/Alt or right-drag to move · scroll changes mass",
        es: "arrastra el disco para rotar · Shift/Alt o clic derecho para mover · rueda cambia masa"
      },
      photonRing: { en: "photon ring", es: "anillo de fotones" },
      shadow: { en: "shadow", es: "sombra" }
    };

    return content[key][this.isSpanish ? "es" : "en"];
  }

  createHint() {
    const hint = document.createElement("span");
    hint.className = "black-hole-model__hint";
    hint.textContent = this.copy("hint");
    return hint;
  }

  bindControls() {
    this.container.querySelectorAll("[data-bh-param]").forEach((input) => {
      const key = input.dataset.bhParam;
      this.syncValue(key, Number(input.value));
      input.addEventListener("input", () => {
        this.state[key] = Number(input.value);
        this.syncValue(key, this.state[key]);
      });
    });

    this.container.querySelector("[data-bh-reset]")?.addEventListener("click", () => {
      this.state.centerX = 0.5;
      this.state.centerY = 0.49;
      this.state.angle = -0.16;
    });
  }

  syncValue(key, value) {
    const output = this.container.querySelector(`[data-bh-value='${key}']`);
    if (!output) {
      return;
    }

    output.textContent = key === "spin" ? value.toFixed(2) : value.toFixed(1);
  }

  bindInteraction() {
    this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());

    this.canvas.addEventListener("pointerdown", (event) => {
      this.canvas.focus({ preventScroll: true });
      this.pointer = {
        id: event.pointerId,
        mode: event.button === 1 || event.button === 2 || event.shiftKey || event.altKey ? "move" : "rotate",
        x: event.clientX,
        y: event.clientY,
        centerX: this.state.centerX,
        centerY: this.state.centerY,
        angle: this.state.angle
      };
      this.canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    this.canvas.addEventListener("pointermove", (event) => {
      if (!this.pointer || this.pointer.id !== event.pointerId) {
        return;
      }

      const rect = this.canvas.getBoundingClientRect();
      const dx = event.clientX - this.pointer.x;
      const dy = event.clientY - this.pointer.y;

      if (this.pointer.mode === "move") {
        this.state.centerX = clamp(this.pointer.centerX + dx / rect.width, 0.16, 0.84);
        this.state.centerY = clamp(this.pointer.centerY + dy / rect.height, 0.18, 0.82);
      } else {
        this.state.angle = this.pointer.angle + dx * 0.008;
      }

      event.preventDefault();
    });

    this.canvas.addEventListener("pointerup", (event) => {
      if (this.pointer?.id === event.pointerId) {
        this.pointer = null;
      }
    });

    this.canvas.addEventListener("pointercancel", () => {
      this.pointer = null;
    });

    this.canvas.addEventListener("wheel", (event) => {
      this.state.mass = clamp(this.state.mass + event.deltaY * -0.0015, 0.7, 1.4);
      const input = this.container.querySelector("[data-bh-param='mass']");
      if (input) {
        input.value = String(this.state.mass);
        this.syncValue("mass", this.state.mass);
      }
      event.preventDefault();
    }, { passive: false });

    bindPinchZoom(this.canvas, {
      getValue: () => this.state.mass,
      setValue: (value) => {
        this.state.mass = value;
        const input = this.container.querySelector("[data-bh-param='mass']");
        if (input) {
          input.value = String(value);
        }
        this.syncValue("mass", value);
      },
      min: 0.7,
      max: 1.4,
      onStart: () => {
        this.pointer = null;
      }
    });
  }

  setupObservers() {
    if ("ResizeObserver" in window) {
      this.resizeObserver = new ResizeObserver(this.handleResize);
      this.resizeObserver.observe(this.frame);
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
    if (!this.ctx) {
      return;
    }

    const rect = this.frame.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(320, Math.floor(rect.width));
    const height = Math.max(270, Math.floor(rect.height || width * 0.56));
    this.canvas.width = Math.floor(width * ratio);
    this.canvas.height = Math.floor(height * ratio);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.width = width;
    this.height = height;
  }

  render(timestamp) {
    if (this.destroyed) {
      return;
    }

    const delta = this.lastTimestamp ? Math.min((timestamp - this.lastTimestamp) / 1000, 0.05) : 0;
    this.lastTimestamp = timestamp;

    if (this.visible && document.body.dataset.motion !== "reduced") {
      this.time += delta;
    }

    this.draw();
    this.animationFrame = requestAnimationFrame(this.render);
  }

  draw() {
    const { ctx, width, height } = this;
    if (!ctx || !width || !height) {
      return;
    }

    const cx = width * this.state.centerX;
    const cy = height * this.state.centerY;
    const base = Math.min(width, height) * 0.16 * this.state.mass;
    const inclination = this.state.inclination / 90;
    const diskY = base * (0.88 - inclination * 0.56);
    const diskX = base * (2.15 + this.state.spin * 0.34);
    const shadowRadius = base * (0.76 + this.state.spin * 0.08);
    const wobble = Math.sin(this.time * 1.4) * base * 0.018;

    this.drawBackground(ctx, width, height, cx, cy, base);

    this.drawDisk(ctx, cx, cy + wobble, diskX, diskY, base, true);
    this.drawShadow(ctx, cx, cy + wobble, shadowRadius);
    this.drawDisk(ctx, cx, cy + wobble, diskX, diskY, base, false);
    this.drawLabels(ctx, cx, cy + wobble, base);
  }

  drawBackground(ctx, width, height, cx, cy, base) {
    const bg = ctx.createRadialGradient(cx, cy, base * 0.2, cx, cy, Math.max(width, height) * 0.76);
    bg.addColorStop(0, "#16002f");
    bg.addColorStop(0.46, COLORS.deep);
    bg.addColorStop(1, COLORS.void);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const star of this.stars) {
      const drift = (this.time * star.speed) % 1;
      const x = ((star.x + drift) % 1) * width;
      const y = star.y * height;
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(x, y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawDisk(ctx, cx, cy, diskX, diskY, base, backHalf) {
    const samples = 160;
    const radiusStart = backHalf ? 0 : Math.PI;
    const radiusEnd = backHalf ? Math.PI : Math.PI * 2;
    const spinShift = this.state.spin * 0.42;
    const brightness = this.state.brightness;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.state.angle);
    ctx.globalCompositeOperation = "lighter";

    for (let layer = 0; layer < 8; layer += 1) {
      const layerScale = 0.74 + layer * 0.082;
      const width = Math.max(1.2, base * (0.026 + layer * 0.002));
      ctx.lineWidth = width;
      ctx.beginPath();

      for (let i = 0; i <= samples; i += 1) {
        const t = radiusStart + ((radiusEnd - radiusStart) * i) / samples;
        const ripple = 1 + Math.sin(t * 5 + this.time * 2.6 + layer) * 0.028;
        const x = Math.cos(t) * diskX * layerScale * ripple;
        const y = Math.sin(t) * diskY * layerScale * ripple;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      const nearSide = backHalf ? 0.42 : 0.78;
      const doppler = 0.34 + Math.max(0, Math.cos(this.state.angle + spinShift)) * 0.46;
      ctx.strokeStyle = `rgba(${layer % 2 ? "191, 64, 255" : "138, 43, 226"}, ${Math.min(0.95, nearSide * brightness * (0.64 + doppler))})`;
      ctx.shadowColor = layer % 2 ? COLORS.electric : COLORS.brightViolet;
      ctx.shadowBlur = base * (backHalf ? 0.05 : 0.11) * brightness;
      ctx.stroke();
    }

    if (!backHalf) {
      for (let i = 0; i < 54; i += 1) {
        const t = (i / 54) * Math.PI * 2 + this.time * (0.18 + this.state.spin * 0.12);
        const layer = 0.78 + ((i * 17) % 33) / 100;
        const x = Math.cos(t) * diskX * layer;
        const y = Math.sin(t) * diskY * layer;
        const size = base * (0.012 + ((i * 7) % 9) * 0.001);
        ctx.globalAlpha = 0.32 + ((i * 11) % 17) / 46;
        ctx.fillStyle = i % 3 ? COLORS.luminousViolet : COLORS.electric;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  drawShadow(ctx, cx, cy, radius) {
    const offset = this.state.spin * radius * 0.11;
    const ringRadius = radius * (1.15 + this.state.spin * 0.06);
    const glow = ctx.createRadialGradient(cx + offset, cy, radius * 0.3, cx + offset, cy, ringRadius * 1.35);
    glow.addColorStop(0, "rgba(2, 0, 4, 1)");
    glow.addColorStop(0.58, "rgba(2, 0, 4, 0.98)");
    glow.addColorStop(0.72, "rgba(119, 0, 255, 0.62)");
    glow.addColorStop(0.86, "rgba(138, 43, 226, 0.42)");
    glow.addColorStop(1, "rgba(191, 64, 255, 0)");

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx + offset, cy, ringRadius * 1.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.void;
    ctx.beginPath();
    ctx.arc(cx + offset, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = Math.max(1.3, radius * 0.034);
    ctx.strokeStyle = "rgba(138, 43, 226, 0.72)";
    ctx.shadowColor = COLORS.brightViolet;
    ctx.shadowBlur = radius * 0.22;
    ctx.beginPath();
    ctx.arc(cx + offset, cy, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawLabels(ctx, cx, cy, base) {
    ctx.save();
    ctx.font = `700 11px ${getCanvasContentFont()}`;
    ctx.fillStyle = "rgba(191, 64, 255, 0.86)";
    ctx.shadowColor = COLORS.violet;
    ctx.shadowBlur = 8;
    ctx.fillText(this.copy("shadow"), cx + base * 0.88, cy - base * 0.18);
    ctx.fillText(this.copy("photonRing"), cx + base * 1.05, cy + base * 0.24);
    ctx.restore();
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver?.disconnect();
    this.visibilityObserver?.disconnect();
    this.cleanupObserver?.disconnect();
    window.removeEventListener("resize", this.handleResize);
  }
}

function createStars(count) {
  const rng = createRng(9137);
  return Array.from({ length: count }, (_, index) => ({
    x: rng(),
    y: rng(),
    size: 0.45 + rng() * 1.35,
    alpha: 0.15 + rng() * 0.5,
    speed: 0.002 + rng() * 0.006,
    color: index % 3 === 0 ? COLORS.brightViolet : index % 3 === 1 ? COLORS.electric : COLORS.violet
  }));
}

function createRng(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
