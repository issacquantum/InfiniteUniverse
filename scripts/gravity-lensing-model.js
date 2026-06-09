import { bindPinchZoom } from "./model-pan.js?v=20260608-watermark-photon-v1";

const mountedModels = new WeakSet();
const TWO_PI = Math.PI * 2;

function getCanvasContentFont() {
  return getComputedStyle(document.body).fontFamily || "serif";
}

export function initGravityLensingModels(root = document) {
  root.querySelectorAll("[data-gravity-lensing-model]").forEach((container) => {
    if (mountedModels.has(container)) {
      return;
    }

    mountedModels.add(container);
    new GravityLensingModel(container);
  });
}

class GravityLensingModel {
  constructor(container) {
    this.container = container;
    this.frame = container.querySelector("[data-gravity-lensing-frame]") ?? container;
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d", { alpha: true });
    this.frame.replaceChildren(this.canvas);

    this.canvas.className = "gravity-lensing__canvas";
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute("aria-label", this.copy("canvasLabel"));
    this.canvas.setAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight ArrowUp ArrowDown + -");

    this.state = {
      coloredStars: true,
      showRays: true,
      showUnlensed: false,
      motion: false,
      strength: 82
    };
    this.lens = { x: 0.5, y: 0.5 };
    this.targetLens = { x: 0.5, y: 0.5 };
    this.pointer = null;
    this.time = 0;
    this.visible = true;
    this.destroyed = false;
    this.lastTimestamp = 0;
    this.stars = createStars(280);
    this.handleResize = () => this.resize();

    if (!this.ctx) {
      this.frame.replaceChildren(this.createFallback());
      return;
    }

    this.bindControls();
    this.bindCanvas();
    this.setupObservers();
    this.resize();
    this.render = this.render.bind(this);
    this.animationFrame = requestAnimationFrame(this.render);
  }

  get isSpanish() {
    return this.container.dataset.language === "es" || document.documentElement.lang.startsWith("es");
  }

  copy(key) {
    const content = {
      canvasLabel: {
        en: "Interactive gravitational lensing simulator with a movable lens and distorted background stars.",
        es: "Simulador interactivo de lente gravitacional con una lente movible y estrellas de fondo distorsionadas."
      },
      fallback: {
        en: "The gravitational lensing simulator could not load in this browser.",
        es: "El simulador de lente gravitacional no pudo cargarse en este navegador."
      },
      reset: {
        en: "Reset Lens",
        es: "Reiniciar Lente"
      },
      lens: {
        en: "lensing mass",
        es: "masa lente"
      },
      source: {
        en: "source field",
        es: "campo fuente"
      },
      imageArc: {
        en: "apparent images",
        es: "imágenes aparentes"
      },
      rayGuide: {
        en: "bent light paths",
        es: "trayectorias curvadas"
      },
      beta: {
        en: "β source angle",
        es: "β ángulo fuente"
      },
      theta: {
        en: "θ image angles",
        es: "θ ángulos imagen"
      },
      thetaE: {
        en: "θ_E Einstein radius",
        es: "θ_E radio de Einstein"
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
    this.container.querySelectorAll("[data-gl-toggle]").forEach((control) => {
      const key = control.dataset.glToggle;
      this.state[key] = control.checked;
      control.addEventListener("change", () => {
        this.state[key] = control.checked;
      });
    });

    this.container.querySelectorAll("[data-gl-param]").forEach((control) => {
      const key = control.dataset.glParam;
      this.state[key] = Number(control.value);
      this.syncValue(key);
      control.addEventListener("input", () => {
        this.state[key] = Number(control.value);
        this.syncValue(key);
      });
    });

    this.container.querySelector("[data-gl-action='reset']")?.addEventListener("click", () => {
      this.state.motion = false;
      const motionToggle = this.container.querySelector("[data-gl-toggle='motion']");
      if (motionToggle) {
        motionToggle.checked = false;
      }
      this.targetLens = { x: 0.5, y: 0.5 };
    });

    this.container.querySelector("[data-gl-action='ring']")?.addEventListener("click", () => {
      this.state.motion = false;
      const motionToggle = this.container.querySelector("[data-gl-toggle='motion']");
      if (motionToggle) {
        motionToggle.checked = false;
      }
      this.state.strength = 110;
      const strengthInput = this.container.querySelector("[data-gl-param='strength']");
      if (strengthInput) {
        strengthInput.value = String(this.state.strength);
      }
      this.syncValue("strength");
      this.targetLens = { x: 0.5, y: 0.5 };
    });
  }

  syncValue(key) {
    const target = this.container.querySelector(`[data-gl-value='${key}']`);
    if (target) {
      target.textContent = this.state[key].toFixed(0);
    }
  }

  bindCanvas() {
    const disableMotion = () => {
      if (!this.state.motion) {
        return;
      }

      this.state.motion = false;
      const motionToggle = this.container.querySelector("[data-gl-toggle='motion']");
      if (motionToggle) {
        motionToggle.checked = false;
      }
    };

    const moveLens = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.targetLens.x = clamp((event.clientX - rect.left) / rect.width, 0.08, 0.92);
      this.targetLens.y = clamp((event.clientY - rect.top) / rect.height, 0.12, 0.88);
    };

    this.canvas.addEventListener("pointerdown", (event) => {
      this.canvas.focus({ preventScroll: true });
      disableMotion();
      this.pointer = { id: event.pointerId };
      this.canvas.setPointerCapture(event.pointerId);
      moveLens(event);
    });

    this.canvas.addEventListener("pointermove", (event) => {
      if (!this.state.motion && (!this.pointer || this.pointer.id === event.pointerId)) {
        moveLens(event);
      }
    });

    this.canvas.addEventListener("pointerup", (event) => {
      if (this.pointer?.id === event.pointerId) {
        this.pointer = null;
      }
    });

    bindPinchZoom(this.canvas, {
      getValue: () => this.state.strength,
      setValue: (value) => {
        this.state.strength = value;
        const input = this.container.querySelector("[data-gl-param='strength']");
        if (input) {
          input.value = String(value);
        }
        this.syncValue("strength");
      },
      min: 45,
      max: 130,
      onStart: () => {
        this.pointer = null;
        disableMotion();
      }
    });

    this.canvas.addEventListener("keydown", (event) => {
      const step = event.shiftKey ? 0.045 : 0.025;

      switch (event.key) {
        case "ArrowLeft":
          this.targetLens.x = clamp(this.targetLens.x - step, 0.08, 0.92);
          break;
        case "ArrowRight":
          this.targetLens.x = clamp(this.targetLens.x + step, 0.08, 0.92);
          break;
        case "ArrowUp":
          this.targetLens.y = clamp(this.targetLens.y - step, 0.12, 0.88);
          break;
        case "ArrowDown":
          this.targetLens.y = clamp(this.targetLens.y + step, 0.12, 0.88);
          break;
        case "+":
        case "=":
          this.state.strength = clamp(this.state.strength + 4, 45, 130);
          this.syncValue("strength");
          break;
        case "-":
        case "_":
          this.state.strength = clamp(this.state.strength - 4, 45, 130);
          this.syncValue("strength");
          break;
        default:
          return;
      }

      event.preventDefault();
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
    const rect = this.frame.getBoundingClientRect();
    const width = Math.max(320, Math.floor(rect.width));
    const height = Math.max(220, Math.floor(rect.height || width * 9 / 16));
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

    if (this.visible && document.body.dataset.motion !== "reduced") {
      this.time += deltaTime;
      if (this.state.motion) {
        this.targetLens.x = 0.5 + Math.cos(this.time * 0.42) * 0.28;
        this.targetLens.y = 0.5 + Math.sin(this.time * 0.58) * 0.18;
      }
    }

    this.lens.x += (this.targetLens.x - this.lens.x) * 0.12;
    this.lens.y += (this.targetLens.y - this.lens.y) * 0.12;
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

    const lens = {
      x: this.lens.x * this.width,
      y: this.lens.y * this.height
    };
    const thetaE = this.state.strength * Math.min(this.width, this.height) / 520;

    this.drawBackground(ctx);
    if (this.state.showRays) {
      this.drawRayGuides(ctx, lens, thetaE);
    }
    if (this.state.showUnlensed) {
      this.drawSourceStars(ctx);
    }
    this.drawLensedStars(ctx, lens, thetaE);
    this.drawEinsteinRing(ctx, lens, thetaE);
    this.drawLens(ctx, lens, thetaE);
    this.drawLabels(ctx, lens, thetaE);

    ctx.restore();
  }

  drawBackground(ctx) {
    ctx.fillStyle = "#050008";
    ctx.fillRect(0, 0, this.width, this.height);

    const gradient = ctx.createRadialGradient(
      this.width * 0.5,
      this.height * 0.5,
      0,
      this.width * 0.5,
      this.height * 0.5,
      this.width * 0.7
    );
    gradient.addColorStop(0, "#2b006d");
    gradient.addColorStop(0.3, "#17003a");
    gradient.addColorStop(0.68, "#080214");
    gradient.addColorStop(1, "#050008");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    const violetGlow = ctx.createRadialGradient(
      this.width * 0.78,
      this.height * 0.2,
      0,
      this.width * 0.78,
      this.height * 0.2,
      this.width * 0.5
    );
    violetGlow.addColorStop(0, "rgba(119, 0, 255, 0.18)");
    violetGlow.addColorStop(0.48, "rgba(191, 64, 255, 0.08)");
    violetGlow.addColorStop(1, "rgba(5, 0, 8, 0)");
    ctx.fillStyle = violetGlow;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  drawLensedStars(ctx, lens, thetaE) {
    for (const star of this.stars) {
      const source = {
        x: star.x * this.width,
        y: star.y * this.height
      };
      const dx = source.x - lens.x;
      const dy = source.y - lens.y;
      const beta = Math.max(1, Math.hypot(dx, dy));
      const unit = { x: dx / beta, y: dy / beta };
      const root = Math.sqrt(beta * beta + 4 * thetaE * thetaE);
      const thetaPlus = 0.5 * (beta + root);
      const thetaMinus = 0.5 * (beta - root);
      const nearLens = beta < thetaE * 2.7;
      const outer = {
        x: lens.x + unit.x * thetaPlus,
        y: lens.y + unit.y * thetaPlus
      };
      const inner = {
        x: lens.x + unit.x * thetaMinus,
        y: lens.y + unit.y * thetaMinus
      };
      const color = this.getStarColor(star);
      const alpha = clamp(0.28 + thetaE / (beta + thetaE) * 0.62 + star.brightness * 0.18, 0.22, 0.95);
      const stretch = nearLens ? clamp((thetaE * 2.4 - beta) / thetaE, 0, 2.4) : 0;
      const angle = Math.atan2(dy, dx) + Math.PI / 2;

      this.drawStarImage(ctx, outer, star.size, color, alpha, angle, 1 + stretch * 1.9);

      if (nearLens) {
        this.drawStarImage(ctx, inner, star.size * 0.76, color, alpha * 0.52, angle, 1 + stretch * 1.2);
      }
    }
  }

  getStarColor(star) {
    if (!this.state.coloredStars) {
      return "191, 64, 255";
    }

    return star.color;
  }

  drawSourceStars(ctx) {
    for (const star of this.stars) {
      const point = {
        x: star.x * this.width,
        y: star.y * this.height
      };
      this.drawStarImage(ctx, point, star.size * 0.72, this.getStarColor(star), 0.18, 0, 1);
    }
  }

  drawStarImage(ctx, point, size, color, alpha, angle, stretch) {
    if (point.x < -40 || point.x > this.width + 40 || point.y < -40 || point.y > this.height + 40) {
      return;
    }

    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(angle);
    ctx.scale(stretch, 1);
    ctx.fillStyle = `rgba(${color}, ${alpha})`;
    ctx.shadowBlur = 8 * alpha;
    ctx.shadowColor = `rgba(${color}, ${Math.min(0.85, alpha)})`;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, TWO_PI);
    ctx.fill();
    ctx.restore();
  }

  drawEinsteinRing(ctx, lens, thetaE) {
    ctx.save();
    ctx.strokeStyle = "rgba(138, 43, 226, 0.34)";
    ctx.lineWidth = 1.35;
    ctx.setLineDash([7, 8]);
    ctx.shadowBlur = 16;
    ctx.shadowColor = "rgba(191, 64, 255, 0.44)";
    ctx.beginPath();
    ctx.arc(lens.x, lens.y, thetaE, 0, TWO_PI);
    ctx.stroke();
    ctx.restore();
  }

  drawRayGuides(ctx, lens, thetaE) {
    ctx.save();
    ctx.lineWidth = 1.15;
    ctx.setLineDash([8, 10]);
    ctx.strokeStyle = "rgba(191, 64, 255, 0.32)";
    ctx.shadowBlur = 8;
    ctx.shadowColor = "rgba(191, 64, 255, 0.34)";

    const sourceX = this.width * 0.08;
    const imageX = this.width * 0.9;
    const guideOffsets = [-0.48, 0, 0.48];

    for (const offset of guideOffsets) {
      const startY = this.height * (0.5 + offset * 0.34);
      const bendY = lens.y + offset * thetaE * 0.92;
      const endY = this.height * (0.5 - offset * 0.42);

      ctx.beginPath();
      ctx.moveTo(sourceX, startY);
      ctx.quadraticCurveTo(lens.x - thetaE * 0.55, bendY, lens.x, lens.y + offset * thetaE * 0.2);
      ctx.quadraticCurveTo(lens.x + thetaE * 0.55, lens.y - offset * thetaE * 0.28, imageX, endY);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawLens(ctx, lens, thetaE) {
    ctx.save();
    const glow = ctx.createRadialGradient(lens.x, lens.y, 0, lens.x, lens.y, thetaE * 0.95);
    glow.addColorStop(0, "rgba(138, 43, 226, 0.42)");
    glow.addColorStop(0.45, "rgba(119, 0, 255, 0.16)");
    glow.addColorStop(1, "rgba(119, 0, 255, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lens.x, lens.y, thetaE * 0.95, 0, TWO_PI);
    ctx.fill();

    const body = ctx.createRadialGradient(
      lens.x - thetaE * 0.08,
      lens.y - thetaE * 0.12,
      2,
      lens.x,
      lens.y,
      thetaE * 0.27
    );
    body.addColorStop(0, "#7700ff");
    body.addColorStop(0.34, "#bf40ff");
    body.addColorStop(0.66, "#2b006d");
    body.addColorStop(1, "#050008");
    ctx.fillStyle = body;
    ctx.strokeStyle = "rgba(138, 43, 226, 0.84)";
    ctx.lineWidth = 1.4;
    ctx.shadowBlur = 14;
    ctx.shadowColor = "rgba(191, 64, 255, 0.58)";
    ctx.beginPath();
    ctx.arc(lens.x, lens.y, thetaE * 0.24, 0, TWO_PI);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawLabels(ctx, lens, thetaE) {
    ctx.save();
    ctx.fillStyle = "rgba(191, 64, 255, 0.82)";
    ctx.font = `600 13px ${getCanvasContentFont()}`;
    ctx.textAlign = "center";
    ctx.fillText(this.copy("lens"), lens.x, Math.max(18, lens.y - thetaE * 0.42));
    ctx.fillText(this.copy("source"), this.width * 0.14, this.height - 18);
    ctx.fillText(this.copy("imageArc"), this.width * 0.82, this.height - 18);
    ctx.font = `600 11px ${getCanvasContentFont()}`;
    ctx.fillStyle = "rgba(191, 64, 255, 0.8)";
    ctx.fillText(this.copy("thetaE"), lens.x + thetaE * 0.78, lens.y + 14);
    ctx.fillText(this.copy("beta"), this.width * 0.18, this.height * 0.18);
    ctx.fillText(this.copy("theta"), this.width * 0.82, this.height * 0.2);
    if (this.state.showRays) {
      ctx.fillStyle = "rgba(191, 64, 255, 0.76)";
      ctx.fillText(this.copy("rayGuide"), this.width * 0.5, 22);
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

function createStars(count) {
  const random = mulberry32(12261995);
  const colors = [
    "138, 43, 226",
    "191, 64, 255",
    "191, 64, 255",
    "154, 77, 255",
    "119, 0, 255",
    "91, 0, 190",
    "43, 0, 109"
  ];

  return Array.from({ length: count }, () => ({
    x: random(),
    y: random(),
    size: 0.75 + random() * 1.55,
    brightness: random(),
    color: colors[Math.floor(random() * colors.length)]
  }));
}

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
    value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
