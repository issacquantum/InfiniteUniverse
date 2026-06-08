import { bindPinchZoom } from "./model-pan.js?v=20260607-static-reading-rail-v1";

const mountedModels = new WeakSet();
const SYMBOL_COUNT = 4;
const LOG2_SYMBOLS = Math.log2(SYMBOL_COUNT);
const COLORS = {
  deep: "#050008",
  panel: "rgba(17, 4, 28, 0.58)",
  grid: "rgba(191, 64, 255, 0.18)",
  violet: "#7700ff",
  electric: "#bf40ff",
  brightViolet: "#8a2be2",
  softLavender: "#bf40ff",
  indigo: "#2b006d",
  text: "#bf40ff"
};

function getCanvasContentFont() {
  return getComputedStyle(document.body).fontFamily || "serif";
}

export function initInformationTheoryModels(root = document) {
  root.querySelectorAll("[data-information-theory-model]").forEach((container) => {
    if (mountedModels.has(container)) {
      return;
    }

    mountedModels.add(container);
    new InformationTheoryModel(container);
  });
}

class InformationTheoryModel {
  constructor(container) {
    this.container = container;
    this.frame = container.querySelector("[data-it-frame]") ?? container;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "information-theory-model__canvas";
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute("aria-label", this.copy("canvasLabel"));
    this.frame.replaceChildren(this.canvas);

    this.state = {
      focus: 0.18,
      noise: 0.16,
      redundancy: 0.35,
      yaw: -0.55,
      pitch: 0.58,
      zoom: 1,
      panX: 0,
      panY: 0,
      order: [0, 1, 2, 3]
    };

    this.pointer = null;
    this.time = 0;
    this.visible = true;
    this.destroyed = false;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.frame);
    this.intersectionObserver = new IntersectionObserver((entries) => {
      this.visible = entries.some((entry) => entry.isIntersecting);
    }, { threshold: 0.01 });
    this.intersectionObserver.observe(this.container);
    this.mutationObserver = new MutationObserver(() => {
      if (!document.body.contains(this.container)) {
        this.destroy();
      }
    });
    this.mutationObserver.observe(document.body, { childList: true, subtree: true });
    this.bindControls();
    this.bindCanvas();
    this.resize();
    this.render = this.render.bind(this);
    this.animationFrame = requestAnimationFrame(this.render);
  }

  get isSpanish() {
    return this.container.dataset.language === "es" || document.documentElement.lang.startsWith("es");
  }

  copy(key) {
    const text = {
      canvasLabel: {
        en: "Interactive entropy, noisy channel, and recovery visualization.",
        es: "Visualizacion interactiva de entropia, canal ruidoso y recuperacion."
      },
      status: {
        en: "Rotate with drag. Shift-drag or right-drag moves the model. Scroll zooms.",
        es: "Arrastra para rotar. Shift-arrastrar o clic derecho mueve el modelo. La rueda acerca."
      }
    };

    return text[key][this.isSpanish ? "es" : "en"];
  }

  bindControls() {
    this.valueNodes = new Map();
    this.container.querySelectorAll("[data-it-value]").forEach((node) => {
      this.valueNodes.set(node.dataset.itValue, node);
    });

    this.container.querySelectorAll("[data-it-param]").forEach((control) => {
      control.addEventListener("input", () => {
        const key = control.dataset.itParam;
        const value = Number(control.value);
        if (key === "focus") {
          this.state.focus = clamp(value, 0, 1);
        } else if (key === "noise") {
          this.state.noise = clamp(value, 0, 0.74);
        } else if (key === "redundancy") {
          this.state.redundancy = clamp(value, 0, 0.9);
        }
        this.syncReadout();
      });
    });

    this.container.querySelector("[data-it-action='randomize']")?.addEventListener("click", () => {
      this.state.order = shuffle([0, 1, 2, 3]);
      this.syncReadout();
    });

    this.container.querySelector("[data-it-action='center']")?.addEventListener("click", () => {
      this.state.yaw = -0.55;
      this.state.pitch = 0.58;
      this.state.zoom = 1;
      this.state.panX = 0;
      this.state.panY = 0;
    });

    this.container.querySelectorAll("[data-it-preset]").forEach((button) => {
      button.addEventListener("click", () => {
        this.applyPreset(button.dataset.itPreset);
      });
    });

    this.setValue("status", this.copy("status"));
    this.syncReadout();
  }

  applyPreset(preset) {
    const presets = {
      uniform: { focus: 0.0, noise: 0.16, redundancy: 0.35 },
      predictable: { focus: 0.86, noise: 0.16, redundancy: 0.35 },
      clean: { focus: 0.18, noise: 0.02, redundancy: 0.25 },
      noisy: { focus: 0.18, noise: 0.58, redundancy: 0.2 },
      redundant: { focus: 0.18, noise: 0.42, redundancy: 0.86 }
    };
    const next = presets[preset];
    if (!next) {
      return;
    }

    this.state.focus = next.focus;
    this.state.noise = next.noise;
    this.state.redundancy = next.redundancy;
    this.syncControls();
    this.syncReadout();
  }

  syncControls() {
    this.container.querySelectorAll("[data-it-param]").forEach((control) => {
      const key = control.dataset.itParam;
      if (Object.hasOwn(this.state, key)) {
        control.value = String(this.state[key]);
      }
    });
  }

  bindCanvas() {
    this.canvas.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 && event.button !== 2) {
        return;
      }

      event.preventDefault();
      this.pointer = {
        id: event.pointerId,
        mode: event.button === 2 || event.shiftKey || event.altKey ? "pan" : "orbit",
        x: event.clientX,
        y: event.clientY,
        yaw: this.state.yaw,
        pitch: this.state.pitch,
        panX: this.state.panX,
        panY: this.state.panY
      };
      this.canvas.setPointerCapture?.(event.pointerId);
    });

    this.canvas.addEventListener("pointermove", (event) => {
      if (!this.pointer || this.pointer.id !== event.pointerId) {
        return;
      }

      const dx = event.clientX - this.pointer.x;
      const dy = event.clientY - this.pointer.y;

      if (this.pointer.mode === "pan") {
        this.state.panX = this.pointer.panX + dx;
        this.state.panY = this.pointer.panY + dy;
      } else {
        this.state.yaw = this.pointer.yaw + dx * 0.008;
        this.state.pitch = clamp(this.pointer.pitch + dy * 0.004, 0.22, 1.08);
      }
    });

    const clearPointer = (event) => {
      if (this.pointer?.id === event.pointerId) {
        this.pointer = null;
        this.canvas.releasePointerCapture?.(event.pointerId);
      }
    };
    this.canvas.addEventListener("pointerup", clearPointer);
    this.canvas.addEventListener("pointercancel", clearPointer);
    this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    this.canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      this.state.zoom = clamp(this.state.zoom + (event.deltaY < 0 ? 0.08 : -0.08), 0.62, 1.65);
    }, { passive: false });

    bindPinchZoom(this.canvas, {
      getValue: () => this.state.zoom,
      setValue: (value) => {
        this.state.zoom = value;
      },
      min: 0.62,
      max: 1.65,
      onStart: () => {
        this.pointer = null;
      }
    });
  }

  resize() {
    const rect = this.frame.getBoundingClientRect();
    const width = Math.max(320, Math.floor(rect.width));
    const height = Math.max(220, Math.floor(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx = this.canvas.getContext("2d");
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = width;
    this.height = height;
  }

  render(timestamp) {
    if (this.destroyed) {
      return;
    }

    this.time = timestamp * 0.001;
    if (this.visible) {
      this.draw();
    }
    this.animationFrame = requestAnimationFrame(this.render);
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.mutationObserver?.disconnect();
  }

  draw() {
    const ctx = this.ctx;
    if (!ctx) {
      return;
    }

    const metrics = this.computeMetrics();
    const source = metrics.source;
    const received = metrics.received;
    const recoveredError = metrics.recoveredError;
    ctx.clearRect(0, 0, this.width, this.height);
    drawBackground(ctx, this.width, this.height);

    const scale = Math.min(this.width, this.height) * 0.085 * this.state.zoom;
    const center = {
      x: this.width * 0.5 + this.state.panX,
      y: this.height * 0.58 + this.state.panY
    };
    const project = (x, y, z) => projectPoint(x, y, z, this.state.yaw, this.state.pitch, scale, center);

    drawGrid(ctx, project);
    drawChannelShell(ctx, project, this.time, this.state.noise);
    drawFlows(ctx, project, metrics.joint, this.time);
    drawDistribution(ctx, project, source, -3.7, "SOURCE", [COLORS.violet, COLORS.electric, COLORS.brightViolet, COLORS.softLavender]);
    drawDistribution(ctx, project, received, 3.7, "RECEIVED", [COLORS.electric, COLORS.violet, COLORS.softLavender, COLORS.brightViolet]);
    drawRecoveryArc(ctx, project, recoveredError, this.time);
    drawHud(ctx, this.width, this.height, metrics);
    this.syncMetricValues(metrics);
  }

  computeMetrics() {
    const source = makeSourceDistribution(this.state.focus, this.state.order);
    const rawNoise = this.state.noise;
    const effectiveNoise = clamp(rawNoise * (1 - this.state.redundancy * 0.82), 0, 0.74);
    const channel = makeSymmetricChannel(effectiveNoise);
    const joint = [];
    const received = new Array(SYMBOL_COUNT).fill(0);

    for (let x = 0; x < SYMBOL_COUNT; x += 1) {
      for (let y = 0; y < SYMBOL_COUNT; y += 1) {
        const value = source[x] * channel[x][y];
        joint.push({ x, y, value });
        received[y] += value;
      }
    }

    const entropy = shannonEntropy(source);
    const receivedEntropy = shannonEntropy(received);
    const mutualInformation = classicalMutualInformation(source, received, joint);
    const capacity = qArySymmetricCapacity(SYMBOL_COUNT, effectiveNoise);

    return {
      source,
      received,
      joint,
      entropy,
      receivedEntropy,
      mutualInformation,
      capacity,
      rawNoise,
      effectiveNoise,
      recoveredError: effectiveNoise
    };
  }

  syncReadout() {
    this.setValue("focus", this.state.focus.toFixed(2));
    this.setValue("noise", this.state.noise.toFixed(2));
    this.setValue("redundancy", this.state.redundancy.toFixed(2));
  }

  syncMetricValues(metrics) {
    this.setValue("entropy", metrics.entropy.toFixed(3));
    this.setValue("mutual", metrics.mutualInformation.toFixed(3));
    this.setValue("capacity", metrics.capacity.toFixed(3));
    this.setValue("error", metrics.effectiveNoise.toFixed(3));
    this.setValue("matrix", `diag ${(1 - metrics.effectiveNoise).toFixed(3)} / off ${(metrics.effectiveNoise / (SYMBOL_COUNT - 1)).toFixed(3)}`);
  }

  setValue(key, value) {
    const node = this.valueNodes.get(key);
    if (node) {
      node.textContent = value;
    }
  }
}

function drawBackground(ctx, width, height) {
  const gradient = ctx.createRadialGradient(width * 0.5, height * 0.5, 20, width * 0.5, height * 0.5, width * 0.72);
  gradient.addColorStop(0, "rgba(119, 0, 255, 0.24)");
  gradient.addColorStop(0.4, "rgba(43, 0, 109, 0.18)");
  gradient.addColorStop(1, COLORS.deep);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(191, 64, 255, 0.06)";
  ctx.lineWidth = 1;
  for (let x = -height; x < width + height; x += 22) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + height, height);
    ctx.stroke();
  }
}

function drawGrid(ctx, project) {
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let i = -5; i <= 5; i += 1) {
    drawLine(ctx, project(-5, 0, i), project(5, 0, i));
    drawLine(ctx, project(i, 0, -3), project(i, 0, 3));
  }
}

function drawChannelShell(ctx, project, time, noise) {
  const center = project(0, 0.65, 0);
  const radius = 32 + noise * 28 + Math.sin(time * 2.3) * 3;
  const gradient = ctx.createRadialGradient(center.x, center.y, 4, center.x, center.y, radius);
  gradient.addColorStop(0, "rgba(138, 43, 226, 0.46)");
  gradient.addColorStop(0.45, "rgba(191, 64, 255, 0.2)");
  gradient.addColorStop(1, "rgba(119, 0, 255, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(191, 64, 255, 0.54)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius * 0.52, 0, Math.PI * 2);
  ctx.stroke();
  drawLabel(ctx, center.x, center.y - radius * 0.72, "NOISY CHANNEL");
}

function drawFlows(ctx, project, joint, time) {
  joint.forEach(({ x, y, value }) => {
    if (value < 0.008) {
      return;
    }

    const start = project(-3.7, 0.34 + x * 0.02, symbolZ(x));
    const end = project(3.7, 0.34 + y * 0.02, symbolZ(y));
    const mid = project(0, 1.15 + value * 2.7, 0);
    ctx.strokeStyle = `rgba(255, ${Math.round(38 + value * 360)}, 214, ${0.12 + value * 1.35})`;
    ctx.lineWidth = 0.55 + value * 7;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.quadraticCurveTo(mid.x, mid.y, end.x, end.y);
    ctx.stroke();

    const t = (time * (0.12 + value * 0.8) + x * 0.11 + y * 0.07) % 1;
    const p = quadraticPoint(start, mid, end, t);
    ctx.fillStyle = value > 0.08 ? COLORS.softLavender : COLORS.electric;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.8 + value * 9, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawDistribution(ctx, project, values, xPosition, title, palette) {
  const parts = [];
  values.forEach((value, index) => {
    const height = 0.12 + value * 3.65;
    parts.push({
      depth: symbolZ(index),
      draw: () => drawBar(ctx, project, xPosition, symbolZ(index), height, palette[index], value, index)
    });
  });
  parts.sort((a, b) => a.depth - b.depth).forEach((part) => part.draw());
  const label = project(xPosition, 0.12, -2.15);
  drawLabel(ctx, label.x, label.y, title);
}

function drawBar(ctx, project, x, z, height, color, value, index) {
  const w = 0.42;
  const baseA = project(x - w, 0, z - w);
  const baseB = project(x + w, 0, z - w);
  const baseC = project(x + w, 0, z + w);
  const baseD = project(x - w, 0, z + w);
  const topA = project(x - w, height, z - w);
  const topB = project(x + w, height, z - w);
  const topC = project(x + w, height, z + w);
  const topD = project(x - w, height, z + w);

  fillPoly(ctx, [baseA, baseB, topB, topA], shade(color, -24));
  fillPoly(ctx, [baseB, baseC, topC, topB], shade(color, -42));
  fillPoly(ctx, [topA, topB, topC, topD], color);
  ctx.strokeStyle = "rgba(191, 64, 255, 0.58)";
  ctx.lineWidth = 0.9;
  strokePoly(ctx, [baseA, baseB, baseC, baseD]);
  strokePoly(ctx, [topA, topB, topC, topD]);
  drawLine(ctx, baseA, topA);
  drawLine(ctx, baseB, topB);
  drawLine(ctx, baseC, topC);
  drawLine(ctx, baseD, topD);

  const text = project(x, height + 0.34, z);
  drawLabel(ctx, text.x, text.y, `s${index + 1}: ${Math.round(value * 100)}%`, 9);
}

function drawRecoveryArc(ctx, project, recoveredError, time) {
  const start = project(3.05, 0.18, 2.35);
  const end = project(-3.05, 0.18, 2.35);
  const mid = project(0, 0.72 + (1 - recoveredError) * 1.6, 2.75);
  ctx.strokeStyle = "rgba(191, 64, 255, 0.32)";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([5, 7]);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.quadraticCurveTo(mid.x, mid.y, end.x, end.y);
  ctx.stroke();
  ctx.setLineDash([]);
  const p = quadraticPoint(start, mid, end, (time * 0.18) % 1);
  ctx.fillStyle = COLORS.brightViolet;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 3.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawHud(ctx, width, height, metrics) {
  ctx.save();
  ctx.fillStyle = "rgba(5, 0, 8, 0.5)";
  ctx.strokeStyle = "rgba(191, 64, 255, 0.3)";
  ctx.lineWidth = 1;
  roundRect(ctx, 12, 12, Math.min(244, width - 24), 82, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORS.text;
  ctx.font = `700 11px ${getCanvasContentFont()}`;
  ctx.fillText(`H(X) ${metrics.entropy.toFixed(3)} bits`, 26, 36);
  ctx.fillText(`I(X;Y) ${metrics.mutualInformation.toFixed(3)} bits`, 26, 57);
  ctx.fillText(`Capacity ${metrics.capacity.toFixed(3)} bits/use`, 26, 78);
  ctx.restore();
}

function projectPoint(x, y, z, yaw, pitch, scale, center) {
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const rx = x * cos - z * sin;
  const rz = x * sin + z * cos;
  const py = rz * Math.sin(pitch) - y;
  return {
    x: center.x + rx * scale,
    y: center.y + py * scale
  };
}

function makeSourceDistribution(focus, order) {
  const dominant = 0.25 + focus * 0.67;
  const rest = (1 - dominant) / (SYMBOL_COUNT - 1);
  const values = new Array(SYMBOL_COUNT).fill(rest);
  values[order[0]] = dominant;
  return values;
}

function makeSymmetricChannel(error) {
  const off = error / (SYMBOL_COUNT - 1);
  return Array.from({ length: SYMBOL_COUNT }, (_, x) => (
    Array.from({ length: SYMBOL_COUNT }, (_, y) => (x === y ? 1 - error : off))
  ));
}

function shannonEntropy(distribution) {
  return distribution.reduce((sum, p) => sum - (p > 0 ? p * Math.log2(p) : 0), 0);
}

function classicalMutualInformation(source, received, joint) {
  return joint.reduce((sum, { x, y, value }) => {
    if (value <= 0 || source[x] <= 0 || received[y] <= 0) {
      return sum;
    }
    return sum + value * Math.log2(value / (source[x] * received[y]));
  }, 0);
}

function qArySymmetricCapacity(q, error) {
  if (error <= 1e-9) {
    return Math.log2(q);
  }
  if (error >= 1 - 1 / q) {
    return 0;
  }
  return Math.max(0, Math.log2(q) + (1 - error) * Math.log2(1 - error) + error * Math.log2(error / (q - 1)));
}

function symbolZ(index) {
  return (index - (SYMBOL_COUNT - 1) / 2) * 0.9;
}

function quadraticPoint(a, b, c, t) {
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * b.x + t * t * c.x,
    y: u * u * a.y + 2 * u * t * b.y + t * t * c.y
  };
}

function drawLine(ctx, a, b) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function fillPoly(ctx, points, fillStyle) {
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.closePath();
  ctx.fill();
}

function strokePoly(ctx, points) {
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.closePath();
  ctx.stroke();
}

function drawLabel(ctx, x, y, text, size = 10) {
  ctx.save();
  ctx.fillStyle = COLORS.text;
  ctx.shadowColor = COLORS.brightViolet;
  ctx.shadowBlur = 8;
  ctx.font = `700 ${size}px ${getCanvasContentFont()}`;
  ctx.textAlign = "center";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function shade(hex, amount) {
  const value = Number.parseInt(hex.slice(1), 16);
  const r = clamp(((value >> 16) & 255) + amount, 0, 255);
  const g = clamp(((value >> 8) & 255) + amount, 0, 255);
  const b = clamp((value & 255) + amount, 0, 255);
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
