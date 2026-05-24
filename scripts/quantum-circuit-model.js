const mountedModels = new WeakSet();
const SQRT1_2 = 1 / Math.sqrt(2);
const COLORS = {
  deep: "#050008",
  violet: "#7700ff",
  electric: "#bf40ff",
  pink: "#ff00a2",
  cyan: "#60e7ff",
  amber: "#ffd36a",
  lavender: "#d6a2ff",
  text: "#ff58d6"
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
    this.time = 0;
    this.lastTimestamp = 0;
    this.lastGate = "I";
    this.lastPairAction = "init";
    this.render = this.render.bind(this);
    this.values = new Map();
    this.container.querySelectorAll("[data-qcm-value]").forEach((node) => {
      this.values.set(node.dataset.qcmValue, node);
    });
    this.bindControls();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.frame);
    this.resize();
    this.animationFrame = requestAnimationFrame(this.render);
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
      this.lastGate = "I";
    } else if (gate === "measure") {
      const p0 = abs2(this.state.alpha);
      if (Math.random() < p0) {
        this.state.alpha = complex(1, 0);
        this.state.beta = complex(0, 0);
      } else {
        this.state.alpha = complex(0, 0);
        this.state.beta = complex(1, 0);
      }
      this.lastGate = "M";
    } else {
      [this.state.alpha, this.state.beta] = applySingleQubitGate(this.state.alpha, this.state.beta, gate);
      this.lastGate = gate.toUpperCase();
    }
    this.draw();
  }

  applyPairAction(action) {
    if (action === "reset") {
      this.state.pair = [complex(1, 0), complex(0, 0), complex(0, 0), complex(0, 0)];
      this.lastPairAction = "init";
    } else if (action === "h-control") {
      const [a00, a01, a10, a11] = this.state.pair;
      this.state.pair = [
        scale(add(a00, a10), SQRT1_2),
        scale(add(a01, a11), SQRT1_2),
        scale(subtract(a00, a10), SQRT1_2),
        scale(subtract(a01, a11), SQRT1_2)
      ];
      this.lastPairAction = "h-control";
    } else if (action === "cnot") {
      const [a00, a01, a10, a11] = this.state.pair;
      this.state.pair = [a00, a01, a11, a10];
      this.lastPairAction = "cnot";
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

  render(timestamp) {
    const deltaTime = this.lastTimestamp ? Math.min((timestamp - this.lastTimestamp) / 1000, 0.05) : 0.016;
    this.lastTimestamp = timestamp;
    const motionFactor = document.body.dataset.motion === "reduced" ? 0.18 : 1;
    this.time += deltaTime * motionFactor;
    this.draw();
    this.animationFrame = requestAnimationFrame(this.render);
  }

  draw() {
    if (!this.ctx) {
      return;
    }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    drawBackground(ctx, this.width, this.height, this.time);
    const bloch = blochVector(this.state.alpha, this.state.beta);
    const compact = this.width < 680;
    const blochRadius = compact
      ? Math.min(this.width * 0.28, this.height * 0.19)
      : Math.min(this.width * 0.2, this.height * 0.29);
    const blochCenter = compact
      ? { x: this.width * 0.5, y: this.height * 0.28 }
      : { x: this.width * 0.28, y: this.height * 0.42 };

    drawBloch(ctx, blochCenter.x, blochCenter.y, blochRadius, bloch, this.time, this.lastGate, this.isSpanish);
    if (compact) {
      drawProbabilities(ctx, this.width * 0.09, this.height * 0.49, this.width * 0.34, this.height * 0.22, this.state.alpha, this.state.beta, this.isSpanish);
      drawPair(ctx, this.width * 0.56, this.height * 0.49, this.width * 0.35, this.height * 0.22, this.state.pair, this.time, this.isSpanish);
      drawCircuitScene(ctx, this.width * 0.08, this.height * 0.78, this.width * 0.84, this.height * 0.17, this.lastGate, this.lastPairAction, this.time, this.isSpanish);
    } else {
      drawProbabilities(ctx, this.width * 0.54, this.height * 0.14, this.width * 0.36, this.height * 0.25, this.state.alpha, this.state.beta, this.isSpanish);
      drawPair(ctx, this.width * 0.54, this.height * 0.49, this.width * 0.36, this.height * 0.25, this.state.pair, this.time, this.isSpanish);
      drawCircuitScene(ctx, this.width * 0.14, this.height * 0.78, this.width * 0.72, this.height * 0.16, this.lastGate, this.lastPairAction, this.time, this.isSpanish);
    }
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

function drawBackground(ctx, width, height, time) {
  const gradient = ctx.createRadialGradient(width * 0.45, height * 0.28, 10, width * 0.5, height * 0.52, width * 0.84);
  gradient.addColorStop(0, "rgba(255, 0, 162, 0.2)");
  gradient.addColorStop(0.42, "rgba(119, 0, 255, 0.24)");
  gradient.addColorStop(1, COLORS.deep);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let index = 0; index < 42; index += 1) {
    const x = ((index * 83.7 + time * 10) % (width + 90)) - 45;
    const y = (index * 47.3) % height;
    const alpha = 0.05 + ((index % 7) / 7) * 0.08;
    ctx.fillStyle = `rgba(214, 162, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, 0.8 + (index % 3) * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBloch(ctx, cx, cy, radius, bloch, time, lastGate, isSpanish) {
  ctx.save();
  const sphere = ctx.createRadialGradient(cx - radius * 0.35, cy - radius * 0.42, radius * 0.08, cx, cy, radius * 1.15);
  sphere.addColorStop(0, "rgba(255, 255, 255, 0.16)");
  sphere.addColorStop(0.38, "rgba(119, 0, 255, 0.1)");
  sphere.addColorStop(1, "rgba(5, 0, 8, 0.62)");
  ctx.fillStyle = sphere;
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius, radius * 0.86, 0, 0, Math.PI * 2);
  ctx.fill();

  drawSphereGrid(ctx, cx, cy, radius, time);
  drawBlochAxis(ctx, cx, cy, radius, "X", [1, 0, 0], "rgba(96, 231, 255, 0.62)");
  drawBlochAxis(ctx, cx, cy, radius, "Y", [0, 1, 0], "rgba(191, 64, 255, 0.62)");
  drawBlochAxis(ctx, cx, cy, radius, "Z", [0, 0, 1], "rgba(255, 0, 162, 0.72)");

  const origin = projectPoint(cx, cy, radius, 0, 0, 0);
  const end = projectPoint(cx, cy, radius, bloch.x, bloch.y, bloch.z);
  const glow = ctx.createLinearGradient(origin.x, origin.y, end.x, end.y);
  glow.addColorStop(0, "rgba(255, 0, 162, 0.3)");
  glow.addColorStop(1, "rgba(96, 231, 255, 0.95)");
  ctx.strokeStyle = glow;
  ctx.fillStyle = COLORS.cyan;
  ctx.lineWidth = Math.max(3, radius * 0.035);
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(end.x, end.y, Math.max(5, radius * 0.055), 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = COLORS.pink;
  ctx.shadowBlur = 18;
  ctx.strokeStyle = "rgba(255, 0, 162, 0.82)";
  ctx.beginPath();
  ctx.ellipse(end.x, end.y, radius * 0.11, radius * 0.035, time * 1.2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  const north = projectPoint(cx, cy, radius, 0, 0, 1.08);
  const south = projectPoint(cx, cy, radius, 0, 0, -1.08);
  ctx.fillStyle = COLORS.text;
  ctx.font = `700 ${Math.max(11, radius * 0.11)}px ${getCanvasFont()}`;
  ctx.textAlign = "center";
  ctx.fillText("|0>", north.x, north.y - 8);
  ctx.fillText("|1>", south.x, south.y + 16);

  drawFloatingTag(ctx, cx - radius * 0.62, cy - radius * 0.94, `${isSpanish ? "Compuerta" : "Gate"} ${lastGate}`, COLORS.pink);
  ctx.restore();
}

function drawSphereGrid(ctx, cx, cy, radius, time) {
  const circles = [
    { plane: "xy", alpha: 0.38 },
    { plane: "xz", alpha: 0.32 },
    { plane: "yz", alpha: 0.28 }
  ];
  ctx.save();
  circles.forEach(({ plane, alpha }) => {
    ctx.strokeStyle = `rgba(214, 162, 255, ${alpha})`;
    ctx.lineWidth = 1;
    drawProjectedCurve(ctx, 96, (angle) => {
      const a = angle + (plane === "xy" ? time * 0.08 : 0);
      if (plane === "xy") return [Math.cos(a), Math.sin(a), 0];
      if (plane === "xz") return [Math.cos(a), 0, Math.sin(a)];
      return [0, Math.cos(a), Math.sin(a)];
    }, cx, cy, radius);
  });

  [-0.55, 0, 0.55].forEach((z) => {
    ctx.strokeStyle = "rgba(96, 231, 255, 0.16)";
    drawProjectedCurve(ctx, 96, (angle) => {
      const ringRadius = Math.sqrt(Math.max(0, 1 - z * z));
      return [Math.cos(angle) * ringRadius, Math.sin(angle) * ringRadius, z];
    }, cx, cy, radius);
  });
  ctx.restore();
}

function drawBlochAxis(ctx, cx, cy, radius, label, axis, color) {
  const start = projectPoint(cx, cy, radius, -axis[0], -axis[1], -axis[2]);
  const end = projectPoint(cx, cy, radius, axis[0], axis[1], axis[2]);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.15;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = `700 ${Math.max(10, radius * 0.085)}px ${getCanvasFont()}`;
  ctx.textAlign = "center";
  ctx.fillText(label, end.x, end.y - 6);
  ctx.restore();
}

function drawProjectedCurve(ctx, segments, pointFactory, cx, cy, radius) {
  ctx.beginPath();
  for (let index = 0; index <= segments; index += 1) {
    const point = pointFactory((index / segments) * Math.PI * 2);
    const projected = projectPoint(cx, cy, radius, point[0], point[1], point[2]);
    if (index === 0) {
      ctx.moveTo(projected.x, projected.y);
    } else {
      ctx.lineTo(projected.x, projected.y);
    }
  }
  ctx.stroke();
}

function drawProbabilities(ctx, x, y, width, height, alpha, beta, isSpanish) {
  const bars = [
    ["P(0)", abs2(alpha), COLORS.electric, "|0>"],
    ["P(1)", abs2(beta), COLORS.pink, "|1>"]
  ];
  ctx.save();
  drawPanelPlate(ctx, x, y, width, height, isSpanish ? "Probabilidades de medición" : "Measurement probabilities");
  const columnWidth = Math.min(50, width * 0.18);
  const baseY = y + height * 0.78;
  const maxHeight = height * 0.46;
  bars.forEach(([label, value, color, stateLabel], index) => {
    const cx = x + width * (0.34 + index * 0.32);
    drawProbabilityColumn(ctx, cx, baseY, columnWidth, maxHeight, value, color);
    ctx.fillStyle = COLORS.text;
    ctx.font = `700 ${Math.max(10, width * 0.032)}px ${getCanvasFont()}`;
    ctx.textAlign = "center";
    ctx.fillText(stateLabel, cx, baseY + 24);
    ctx.fillStyle = color;
    ctx.fillText(`${label}: ${Math.round(value * 100)}%`, cx, y + height * 0.34);
  });
  ctx.restore();
}

function drawPair(ctx, x, y, width, height, pair, time, isSpanish) {
  const labels = ["|00>", "|01>", "|10>", "|11>"];
  ctx.save();
  drawPanelPlate(ctx, x, y, width, height, isSpanish ? "Amplitudes de dos qubits" : "Two-qubit amplitudes");
  const baseY = y + height * 0.75;
  const baseX = x + width * 0.18;
  const spacing = width * 0.2;
  const columnWidth = Math.min(38, width * 0.12);
  const maxHeight = height * 0.43;
  const centers = [];

  labels.forEach((label, index) => {
    const amp = pair[index];
    const value = abs2(amp);
    const phase = Math.atan2(amp.im, amp.re);
    const color = phaseColor(phase, value);
    const cx = baseX + spacing * index;
    centers.push({ x: cx, y: baseY - maxHeight * value, value });
    drawProbabilityColumn(ctx, cx, baseY, columnWidth, maxHeight, value, color);
    drawPhaseDisc(ctx, cx, baseY - maxHeight * value - 8, Math.max(8, columnWidth * 0.32), phase, color, value, time);
    ctx.fillStyle = COLORS.text;
    ctx.font = `700 ${Math.max(10, width * 0.028)}px ${getCanvasFont()}`;
    ctx.textAlign = "center";
    ctx.fillText(label, cx, baseY + 24);
  });

  if (centers[0].value > 0.18 && centers[3].value > 0.18) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(255, 0, 162, 0.62)";
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 8]);
    ctx.beginPath();
    ctx.moveTo(centers[0].x, centers[0].y - 16);
    ctx.bezierCurveTo(
      centers[0].x + width * 0.18,
      y + height * 0.12 + Math.sin(time * 2) * 4,
      centers[3].x - width * 0.18,
      y + height * 0.12 - Math.sin(time * 2) * 4,
      centers[3].x,
      centers[3].y - 16
    );
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawCircuitScene(ctx, x, y, width, height, lastGate, lastPairAction, time, isSpanish) {
  ctx.save();
  drawPanelPlate(ctx, x, y, width, height, isSpanish ? "Ruta del circuito" : "Circuit path");
  const railA = y + height * 0.42;
  const railB = y + height * 0.68;
  const startX = x + width * 0.08;
  const endX = x + width * 0.92;
  ctx.strokeStyle = "rgba(214, 162, 255, 0.48)";
  ctx.lineWidth = 2;
  [railA, railB].forEach((railY) => {
    ctx.beginPath();
    ctx.moveTo(startX, railY);
    ctx.lineTo(endX, railY);
    ctx.stroke();
  });

  const gates = ["H", "X", "Y", "Z", "S", "T"];
  gates.forEach((gate, index) => {
    const gx = startX + ((index + 1) / (gates.length + 1)) * (endX - startX) * 0.58;
    drawGateBlock(ctx, gx, railA, gate, gate === lastGate, time);
  });

  const cnotX = startX + (endX - startX) * 0.78;
  const hActive = lastPairAction === "h-control" || lastPairAction === "cnot";
  const cnotActive = lastPairAction === "cnot";
  drawGateBlock(ctx, cnotX - width * 0.12, railB, "H", hActive, time);
  drawCnotGlyph(ctx, cnotX, railA, railB, cnotActive, time);

  ctx.fillStyle = "rgba(159, 92, 255, 0.9)";
  ctx.font = `700 ${Math.max(10, width * 0.022)}px ${getCanvasFont()}`;
  ctx.textAlign = "left";
  ctx.fillText("q0", startX - 26, railA + 4);
  ctx.fillText("q1", startX - 26, railB + 4);
  ctx.restore();
}

function drawPanelPlate(ctx, x, y, width, height, title) {
  ctx.save();
  const plate = ctx.createLinearGradient(x, y, x + width, y + height);
  plate.addColorStop(0, "rgba(23, 0, 42, 0.52)");
  plate.addColorStop(0.58, "rgba(83, 0, 132, 0.18)");
  plate.addColorStop(1, "rgba(5, 0, 8, 0.16)");
  ctx.fillStyle = plate;
  roundRect(ctx, x, y, width, height, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(191, 64, 255, 0.22)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = COLORS.text;
  ctx.font = `700 ${Math.max(11, width * 0.032)}px ${getCanvasFont()}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(title, x + 14, y + 22);
  ctx.restore();
}

function drawProbabilityColumn(ctx, cx, baseY, width, maxHeight, value, color) {
  const height = Math.max(2, maxHeight * value);
  const depth = width * 0.42;
  const left = cx - width / 2;
  const right = cx + width / 2;
  const top = baseY - height;

  ctx.save();
  ctx.fillStyle = "rgba(214, 162, 255, 0.14)";
  drawColumnFaces(ctx, left, top, right, baseY, depth);
  ctx.fill();

  const front = ctx.createLinearGradient(left, top, right, baseY);
  front.addColorStop(0, tint(color, 0.2));
  front.addColorStop(1, color);
  ctx.fillStyle = front;
  drawColumnFront(ctx, left, top, right, baseY);
  ctx.fill();

  ctx.fillStyle = shade(color, 0.72);
  drawColumnSide(ctx, right, top, baseY, depth);
  ctx.fill();

  ctx.fillStyle = tint(color, 0.42);
  drawColumnTop(ctx, left, top, right, depth);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.lineWidth = 1;
  drawColumnFaces(ctx, left, top, right, baseY, depth);
  ctx.stroke();
  ctx.restore();
}

function drawColumnFaces(ctx, left, top, right, baseY, depth) {
  drawColumnFront(ctx, left, top, right, baseY);
  drawColumnSide(ctx, right, top, baseY, depth);
  drawColumnTop(ctx, left, top, right, depth);
}

function drawColumnFront(ctx, left, top, right, baseY) {
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(right, top);
  ctx.lineTo(right, baseY);
  ctx.lineTo(left, baseY);
  ctx.closePath();
}

function drawColumnSide(ctx, right, top, baseY, depth) {
  ctx.beginPath();
  ctx.moveTo(right, top);
  ctx.lineTo(right + depth, top - depth * 0.42);
  ctx.lineTo(right + depth, baseY - depth * 0.42);
  ctx.lineTo(right, baseY);
  ctx.closePath();
}

function drawColumnTop(ctx, left, top, right, depth) {
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(right, top);
  ctx.lineTo(right + depth, top - depth * 0.42);
  ctx.lineTo(left + depth, top - depth * 0.42);
  ctx.closePath();
}

function drawPhaseDisc(ctx, cx, cy, radius, phase, color, value, time) {
  if (value < 0.004) {
    return;
  }

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + value * 0.12})`;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius * 1.35, radius * 0.52, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = tint(color, 0.35);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(phase + time * 0.08) * radius * 1.2, cy + Math.sin(phase + time * 0.08) * radius * 0.48);
  ctx.stroke();
  ctx.restore();
}

function drawGateBlock(ctx, cx, cy, label, active, time) {
  const width = 30;
  const height = 28;
  const depth = 9;
  const x = cx - width / 2;
  const y = cy - height / 2;
  const color = active ? COLORS.pink : COLORS.violet;
  ctx.save();
  ctx.shadowColor = active ? COLORS.pink : "transparent";
  ctx.shadowBlur = active ? 16 + Math.sin(time * 5) * 4 : 0;
  ctx.fillStyle = shade(color, 0.72);
  drawBlockSide(ctx, x, y, width, height, depth);
  ctx.fill();
  ctx.fillStyle = active ? "rgba(255, 0, 162, 0.78)" : "rgba(119, 0, 255, 0.54)";
  roundRect(ctx, x, y, width, height, 8);
  ctx.fill();
  ctx.strokeStyle = active ? "rgba(255, 255, 255, 0.62)" : "rgba(214, 162, 255, 0.34)";
  ctx.stroke();
  ctx.fillStyle = COLORS.text;
  ctx.font = `800 13px ${getCanvasFont()}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, cx, cy + 1);
  ctx.restore();
}

function drawBlockSide(ctx, x, y, width, height, depth) {
  ctx.beginPath();
  ctx.moveTo(x + width, y);
  ctx.lineTo(x + width + depth, y - depth * 0.45);
  ctx.lineTo(x + width + depth, y + height - depth * 0.45);
  ctx.lineTo(x + width, y + height);
  ctx.closePath();
}

function drawCnotGlyph(ctx, x, yControl, yTarget, active, time) {
  ctx.save();
  ctx.strokeStyle = active ? COLORS.pink : "rgba(214, 162, 255, 0.48)";
  ctx.fillStyle = active ? COLORS.pink : "rgba(214, 162, 255, 0.78)";
  ctx.lineWidth = active ? 2.5 : 1.7;
  ctx.shadowColor = active ? COLORS.pink : "transparent";
  ctx.shadowBlur = active ? 18 + Math.sin(time * 5) * 4 : 0;
  ctx.beginPath();
  ctx.moveTo(x, yControl);
  ctx.lineTo(x, yTarget);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, yControl, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, yTarget, 13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 13, yTarget);
  ctx.lineTo(x + 13, yTarget);
  ctx.moveTo(x, yTarget - 13);
  ctx.lineTo(x, yTarget + 13);
  ctx.stroke();
  ctx.restore();
}

function drawFloatingTag(ctx, x, y, text, color) {
  ctx.save();
  ctx.fillStyle = "rgba(5, 0, 8, 0.58)";
  roundRect(ctx, x, y, 92, 24, 12);
  ctx.fill();
  ctx.strokeStyle = "rgba(214, 162, 255, 0.28)";
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = `700 11px ${getCanvasFont()}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + 46, y + 12);
  ctx.restore();
}

function projectPoint(cx, cy, radius, x, y, z) {
  const yaw = -0.62;
  const pitch = 0.46;
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const x1 = x * cosY - y * sinY;
  const y1 = x * sinY + y * cosY;
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  const y2 = y1 * cosP - z * sinP;
  const z2 = y1 * sinP + z * cosP;
  const perspective = 1 / (1 + z2 * 0.24);
  return {
    x: cx + x1 * radius * perspective,
    y: cy - y2 * radius * perspective,
    z: z2,
    scale: perspective
  };
}

function phaseColor(phase, value) {
  if (value < 0.004) {
    return COLORS.lavender;
  }
  const normalized = (phase + Math.PI) / (Math.PI * 2);
  if (normalized < 0.25) return COLORS.cyan;
  if (normalized < 0.5) return COLORS.electric;
  if (normalized < 0.75) return COLORS.pink;
  return COLORS.amber;
}

function tint(color, amount) {
  const rgb = hexToRgb(color);
  return `rgb(${Math.round(rgb.r + (255 - rgb.r) * amount)}, ${Math.round(rgb.g + (255 - rgb.g) * amount)}, ${Math.round(rgb.b + (255 - rgb.b) * amount)})`;
}

function shade(color, amount) {
  const rgb = hexToRgb(color);
  return `rgb(${Math.round(rgb.r * amount)}, ${Math.round(rgb.g * amount)}, ${Math.round(rgb.b * amount)})`;
}

function hexToRgb(color) {
  const clean = color.replace("#", "");
  const value = Number.parseInt(clean, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
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
