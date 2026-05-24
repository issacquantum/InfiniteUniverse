const mountedModels = new WeakSet();
const SQRT1_2 = 1 / Math.sqrt(2);
const COLORS = {
  deep: "#050008",
  violet: "#7700ff",
  electric: "#bf40ff",
  pink: "#ff00a2",
  lavender: "#d6a2ff",
  text: "#ff8ae5"
};

export function initQuantumCircuitModels(root = document) {
  root.querySelectorAll("[data-quantum-circuit-model]").forEach((container) => {
    if (mountedModels.has(container)) {
      return;
    }

    mountedModels.add(container);
    new QuantumCircuitModel(container);
  });
}

class QuantumCircuitModel {
  constructor(container) {
    this.container = container;
    this.frame = container.querySelector("[data-qcm-frame]") ?? container;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "quantum-circuit-model__canvas";
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute("aria-label", this.copy("canvasLabel"));
    this.frame.replaceChildren(this.canvas);
    this.state = {
      alpha: complex(1, 0),
      beta: complex(0, 0),
      pair: [complex(1, 0), complex(0, 0), complex(0, 0), complex(0, 0)]
    };
    this.values = new Map();
    this.container.querySelectorAll("[data-qcm-value]").forEach((node) => {
      this.values.set(node.dataset.qcmValue, node);
    });
    this.bindControls();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.frame);
    this.resize();
    this.draw();
  }

  get isSpanish() {
    return this.container.dataset.language === "es" || document.documentElement.lang.startsWith("es");
  }

  copy(key) {
    const text = {
      canvasLabel: {
        en: "Interactive single-qubit gate and two-qubit CNOT teaching model.",
        es: "Modelo educativo interactivo de compuertas de un qubit y CNOT de dos qubits."
      },
      collapsed: {
        en: "measured",
        es: "medido"
      },
      ready: {
        en: "coherent",
        es: "coherente"
      }
    };
    return text[key][this.isSpanish ? "es" : "en"];
  }

  bindControls() {
    this.container.querySelectorAll("[data-qcm-gate]").forEach((button) => {
      button.addEventListener("click", () => {
        this.applyGate(button.dataset.qcmGate);
      });
    });
    this.container.querySelectorAll("[data-qcm-pair-action]").forEach((button) => {
      button.addEventListener("click", () => {
        this.applyPairAction(button.dataset.qcmPairAction);
      });
    });
  }

  applyGate(gate) {
    if (gate === "reset") {
      this.state.alpha = complex(1, 0);
      this.state.beta = complex(0, 0);
    } else if (gate === "measure") {
      const p0 = abs2(this.state.alpha);
      if (Math.random() < p0) {
        this.state.alpha = complex(1, 0);
        this.state.beta = complex(0, 0);
      } else {
        this.state.alpha = complex(0, 0);
        this.state.beta = complex(1, 0);
      }
    } else {
      [this.state.alpha, this.state.beta] = applySingleQubitGate(this.state.alpha, this.state.beta, gate);
    }
    this.draw();
  }

  applyPairAction(action) {
    if (action === "reset") {
      this.state.pair = [complex(1, 0), complex(0, 0), complex(0, 0), complex(0, 0)];
    } else if (action === "h-control") {
      const [a00, a01, a10, a11] = this.state.pair;
      this.state.pair = [
        scale(add(a00, a10), SQRT1_2),
        scale(add(a01, a11), SQRT1_2),
        scale(subtract(a00, a10), SQRT1_2),
        scale(subtract(a01, a11), SQRT1_2)
      ];
    } else if (action === "cnot") {
      const [a00, a01, a10, a11] = this.state.pair;
      this.state.pair = [a00, a01, a11, a10];
    }
    this.draw();
  }

  resize() {
    const rect = this.frame.getBoundingClientRect();
    const width = Math.max(320, Math.floor(rect.width));
    const height = Math.max(250, Math.floor(rect.height || width * 0.62));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx = this.canvas.getContext("2d");
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = width;
    this.height = height;
    this.draw();
  }

  draw() {
    if (!this.ctx) {
      return;
    }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    drawBackground(ctx, this.width, this.height);
    const bloch = blochVector(this.state.alpha, this.state.beta);
    drawBloch(ctx, this.width * 0.32, this.height * 0.52, Math.min(this.width, this.height) * 0.28, bloch);
    drawProbabilities(ctx, this.width * 0.62, this.height * 0.27, this.state.alpha, this.state.beta);
    drawPair(ctx, this.width * 0.62, this.height * 0.62, this.state.pair);
    this.syncReadout(bloch);
  }

  syncReadout(bloch) {
    const p0 = abs2(this.state.alpha);
    const p1 = abs2(this.state.beta);
    this.setValue("state", `${formatComplex(this.state.alpha)}|0> + ${formatComplex(this.state.beta)}|1>`);
    this.setValue("prob0", `${Math.round(p0 * 100)}%`);
    this.setValue("prob1", `${Math.round(p1 * 100)}%`);
    this.setValue("bloch", `x ${bloch.x.toFixed(2)}, y ${bloch.y.toFixed(2)}, z ${bloch.z.toFixed(2)}`);
    this.setValue("pair", formatPairState(this.state.pair));
  }

  setValue(key, value) {
    const node = this.values.get(key);
    if (node) {
      node.textContent = value;
    }
  }
}

function applySingleQubitGate(alpha, beta, gate) {
  if (gate === "h") {
    return [scale(add(alpha, beta), SQRT1_2), scale(subtract(alpha, beta), SQRT1_2)];
  }
  if (gate === "x") {
    return [beta, alpha];
  }
  if (gate === "y") {
    return [multiply(complex(0, -1), beta), multiply(complex(0, 1), alpha)];
  }
  if (gate === "z") {
    return [alpha, scale(beta, -1)];
  }
  if (gate === "s") {
    return [alpha, multiply(complex(0, 1), beta)];
  }
  if (gate === "t") {
    return [alpha, multiply(complex(Math.SQRT1_2, Math.SQRT1_2), beta)];
  }
  return [alpha, beta];
}

function blochVector(alpha, beta) {
  const cross = multiply(conjugate(alpha), beta);
  return {
    x: 2 * cross.re,
    y: 2 * cross.im,
    z: abs2(alpha) - abs2(beta)
  };
}

function drawBackground(ctx, width, height) {
  const gradient = ctx.createRadialGradient(width * 0.5, height * 0.5, 20, width * 0.5, height * 0.5, width * 0.7);
  gradient.addColorStop(0, "rgba(119, 0, 255, 0.25)");
  gradient.addColorStop(1, COLORS.deep);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawBloch(ctx, cx, cy, radius, bloch) {
  ctx.save();
  ctx.strokeStyle = "rgba(214, 162, 255, 0.45)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius, radius * 0.34, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - radius, cy);
  ctx.lineTo(cx + radius, cy);
  ctx.moveTo(cx, cy - radius);
  ctx.lineTo(cx, cy + radius);
  ctx.stroke();

  const endX = cx + bloch.x * radius * 0.78;
  const endY = cy - bloch.z * radius * 0.78;
  ctx.strokeStyle = COLORS.pink;
  ctx.fillStyle = COLORS.pink;
  ctx.lineWidth = 3;
  ctx.shadowColor = COLORS.pink;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(endX, endY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.text;
  ctx.font = `700 12px ${getCanvasFont()}`;
  ctx.textAlign = "center";
  ctx.fillText("|0>", cx, cy - radius - 10);
  ctx.fillText("|1>", cx, cy + radius + 18);
  ctx.restore();
}

function drawProbabilities(ctx, x, y, alpha, beta) {
  const bars = [
    ["P(0)", abs2(alpha), COLORS.electric],
    ["P(1)", abs2(beta), COLORS.pink]
  ];
  ctx.save();
  ctx.font = `700 12px ${getCanvasFont()}`;
  bars.forEach(([label, value, color], index) => {
    const top = y + index * 36;
    ctx.fillStyle = "rgba(214, 162, 255, 0.2)";
    roundRect(ctx, x, top, 170, 14, 7);
    ctx.fill();
    ctx.fillStyle = color;
    roundRect(ctx, x, top, 170 * value, 14, 7);
    ctx.fill();
    ctx.fillStyle = COLORS.text;
    ctx.fillText(`${label}: ${Math.round(value * 100)}%`, x, top - 6);
  });
  ctx.restore();
}

function drawPair(ctx, x, y, pair) {
  const labels = ["|00>", "|01>", "|10>", "|11>"];
  ctx.save();
  ctx.font = `700 12px ${getCanvasFont()}`;
  labels.forEach((label, index) => {
    const value = abs2(pair[index]);
    const top = y + index * 28;
    ctx.fillStyle = COLORS.text;
    ctx.fillText(label, x, top + 10);
    ctx.fillStyle = "rgba(214, 162, 255, 0.18)";
    roundRect(ctx, x + 45, top, 135, 12, 6);
    ctx.fill();
    ctx.fillStyle = index % 2 === 0 ? COLORS.electric : COLORS.pink;
    roundRect(ctx, x + 45, top, 135 * value, 12, 6);
    ctx.fill();
  });
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

function complex(re, im) {
  return { re, im };
}

function add(a, b) {
  return complex(a.re + b.re, a.im + b.im);
}

function subtract(a, b) {
  return complex(a.re - b.re, a.im - b.im);
}

function scale(a, scalar) {
  return complex(a.re * scalar, a.im * scalar);
}

function multiply(a, b) {
  return complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
}

function conjugate(a) {
  return complex(a.re, -a.im);
}

function abs2(a) {
  return a.re * a.re + a.im * a.im;
}

function formatComplex(a) {
  const re = Math.abs(a.re) < 0.001 ? 0 : a.re;
  const im = Math.abs(a.im) < 0.001 ? 0 : a.im;
  if (im === 0) {
    return re.toFixed(2);
  }
  if (re === 0) {
    return `${im.toFixed(2)}i`;
  }
  return `${re.toFixed(2)}${im >= 0 ? "+" : ""}${im.toFixed(2)}i`;
}

function formatPairState(pair) {
  const labels = ["|00>", "|01>", "|10>", "|11>"];
  const terms = pair
    .map((amp, index) => ({ amp, label: labels[index] }))
    .filter(({ amp }) => abs2(amp) > 0.001)
    .map(({ amp, label }) => `${formatComplex(amp)}${label}`);
  return terms.length ? terms.join(" + ") : "0";
}

function getCanvasFont() {
  return getComputedStyle(document.body).fontFamily || "serif";
}
