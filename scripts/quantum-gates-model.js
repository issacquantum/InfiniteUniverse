const mountedModels = new WeakSet();

const COLORS = {
  hotPink: "#ff00a2",
  strongPink: "#ff58d6",
  electric: "#bf40ff",
  violet: "#7700ff",
  indigo: "#2b006d",
  deep: "#050008",
  softViolet: "#e098ff",
  rail: "rgba(191, 64, 255, 0.48)",
  glass: "rgba(17, 4, 28, 0.62)"
};

const SQRT_HALF = 1 / Math.sqrt(2);
const BASIS = ["00", "01", "10", "11"];
const GATES = {
  X: [[[0, 0], [1, 0]], [[1, 0], [0, 0]]],
  Y: [[[0, 0], [0, -1]], [[0, 1], [0, 0]]],
  Z: [[[1, 0], [0, 0]], [[0, 0], [-1, 0]]],
  H: [[[SQRT_HALF, 0], [SQRT_HALF, 0]], [[SQRT_HALF, 0], [-SQRT_HALF, 0]]],
  S: [[[1, 0], [0, 0]], [[0, 0], [0, 1]]],
  T: [[[1, 0], [0, 0]], [[0, 0], [SQRT_HALF, SQRT_HALF]]]
};

export function initQuantumGateModels(root = document) {
  root.querySelectorAll("[data-quantum-gates-model]").forEach((container) => {
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
    this.frame = container.querySelector("[data-qg-frame]") ?? container;
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.canvas.className = "quantum-gates__canvas";
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute("aria-label", this.copy("canvasLabel"));
    this.canvas.setAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight");
    this.frame.replaceChildren(this.canvas);

    this.state = {
      vector: initialState(),
      activeQubit: 0,
      history: [],
      operations: [],
      lastGate: null,
      rotationAngle: Math.PI / 4,
      pan: 0,
      time: 0
    };

    this.pointer = null;
    this.visible = true;
    this.destroyed = false;
    this.lastTimestamp = 0;
    this.metrics = this.calculateMetrics();
    this.handleResize = () => this.resize();

    this.bindControls();
    this.bindCanvas();
    this.setupObservers();
    this.resize();
    this.syncActiveQubit();
    this.updateVisuals();

    this.render = this.render.bind(this);
    this.animationFrame = requestAnimationFrame(this.render);
  }

  get isSpanish() {
    return this.container.dataset.language === "es" || document.documentElement.lang.startsWith("es");
  }

  copy(key) {
    const content = {
      canvasLabel: {
        en: "Interactive two-qubit quantum circuit and state-vector model.",
        es: "Modelo interactivo de circuito cuántico de dos qubits y vector de estado."
      },
      reset: {
        en: "Reset to |00>.",
        es: "Reiniciado a |00>."
      },
      cnot: {
        en: "Applied CNOT (controlled-NOT): Q0 controls whether Q1 flips.",
        es: "CNOT (controlled-NOT) aplicada: Q0 controla si Q1 se invierte."
      },
      active: {
        en: "Active rail changed.",
        es: "Riel activo cambiado."
      },
      measured: {
        en: "Measured the register and collapsed to a basis state.",
        es: "Registro medido y colapsado a un estado base."
      },
      start: {
        en: "start |00>",
        es: "inicio |00>"
      },
      identity: {
        en: "Identity",
        es: "Identidad"
      }
    };

    return content[key][this.isSpanish ? "es" : "en"];
  }

  bindControls() {
    this.container.querySelectorAll("[data-qg-qubit]").forEach((button) => {
      button.addEventListener("click", () => {
        this.state.activeQubit = Number(button.dataset.qgQubit);
        this.syncActiveQubit();
        this.setStatus(this.copy("active"));
      });
    });

    this.container.querySelectorAll("[data-qg-gate]").forEach((button) => {
      button.addEventListener("click", () => {
        const gate = button.dataset.qgGate;
        if (gate === "CNOT") {
          this.applyCnot();
          this.pushOperation({ gate: "CNOT", qubit: "both" });
          this.setStatus(this.copy("cnot"));
        } else {
          this.applySingleGate(gate);
          this.pushOperation({ gate, qubit: this.state.activeQubit });
          this.setStatus(this.gateStatus(gate));
        }
        this.updateVisuals({ revealEnd: true });
      });
    });

    this.container.querySelectorAll("[data-qg-rotate]").forEach((button) => {
      button.addEventListener("click", () => {
        const axis = button.dataset.qgRotate;
        const gate = `R${axis}`;
        this.applyRotation(axis);
        this.pushOperation({
          gate,
          qubit: this.state.activeQubit,
          detail: formatAngle(this.state.rotationAngle)
        });
        this.setStatus(this.gateStatus(gate));
        this.updateVisuals({ revealEnd: true });
      });
    });

    this.container.querySelector("[data-qg-angle]")?.addEventListener("input", (event) => {
      this.state.rotationAngle = Number(event.target.value);
      this.syncValue("angle", formatAngle(this.state.rotationAngle));
      this.draw();
    });

    this.container.querySelectorAll("[data-qg-preset]").forEach((button) => {
      button.addEventListener("click", () => {
        this.applyPreset(button.dataset.qgPreset);
      });
    });

    this.container.querySelector("[data-qg-measure]")?.addEventListener("click", () => {
      const measured = this.measureRegister();
      this.pushOperation({ gate: "M", qubit: "both", detail: measured });
      this.setStatus(this.copy("measured"));
      this.updateVisuals({ revealEnd: true });
    });

    this.container.querySelector("[data-qg-reset]")?.addEventListener("click", () => {
      this.state.vector = initialState();
      this.state.history = [];
      this.state.operations = [];
      this.state.lastGate = null;
      this.state.pan = 0;
      this.updateVisuals();
      this.setStatus(this.copy("reset"));
    });
  }

  bindCanvas() {
    this.canvas.addEventListener("pointerdown", (event) => {
      this.canvas.focus({ preventScroll: true });
      this.pointer = {
        id: event.pointerId,
        x: event.clientX,
        pan: this.state.pan
      };
      this.canvas.setPointerCapture(event.pointerId);
    });

    this.canvas.addEventListener("pointermove", (event) => {
      if (!this.pointer || this.pointer.id !== event.pointerId) {
        return;
      }

      const nextPan = this.pointer.pan + event.clientX - this.pointer.x;
      this.state.pan = this.clampPan(nextPan);
      this.draw();
    });

    this.canvas.addEventListener("pointerup", (event) => {
      if (this.pointer?.id === event.pointerId) {
        this.pointer = null;
      }
    });

    this.canvas.addEventListener("pointercancel", () => {
      this.pointer = null;
    });

    this.canvas.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }

      const direction = event.key === "ArrowLeft" ? 1 : -1;
      this.state.pan = this.clampPan(this.state.pan + direction * 52);
      this.draw();
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

  applySingleGate(gateName) {
    const gate = GATES[gateName];
    if (!gate) {
      return;
    }

    this.applySingleGateMatrix(gate);
  }

  applyCnot() {
    const next = this.state.vector.map((amp) => [...amp]);
    next[2] = [...this.state.vector[3]];
    next[3] = [...this.state.vector[2]];
    this.state.vector = normalizeState(next);
  }

  applyRotation(axis) {
    const angle = this.state.rotationAngle;
    const half = angle / 2;
    const c = Math.cos(half);
    const s = Math.sin(half);
    let gate;

    if (axis === "X") {
      gate = [[[c, 0], [0, -s]], [[0, -s], [c, 0]]];
    } else if (axis === "Y") {
      gate = [[[c, 0], [-s, 0]], [[s, 0], [c, 0]]];
    } else if (axis === "Z") {
      gate = [[[Math.cos(-half), Math.sin(-half)], [0, 0]], [[0, 0], [Math.cos(half), Math.sin(half)]]];
    } else {
      return;
    }

    this.applySingleGateMatrix(gate);
  }

  applySingleGateMatrix(gate) {
    const next = this.state.vector.map((amp) => [...amp]);
    const pairs = this.state.activeQubit === 0 ? [[0, 2], [1, 3]] : [[0, 1], [2, 3]];

    pairs.forEach(([zeroIndex, oneIndex]) => {
      const zero = this.state.vector[zeroIndex];
      const one = this.state.vector[oneIndex];
      next[zeroIndex] = complexAdd(complexMul(gate[0][0], zero), complexMul(gate[0][1], one));
      next[oneIndex] = complexAdd(complexMul(gate[1][0], zero), complexMul(gate[1][1], one));
    });

    this.state.vector = normalizeState(next);
  }

  applyPreset(name) {
    const presets = getPresets(this.isSpanish);
    const preset = presets[name];

    if (!preset) {
      return;
    }

    this.state.vector = initialState();
    this.state.history = [];
    this.state.operations = [];
    this.state.pan = 0;

    preset.steps.forEach((step) => {
      this.state.activeQubit = step.qubit ?? this.state.activeQubit;
      if (step.gate === "CNOT") {
        this.applyCnot();
        this.pushOperation({ gate: "CNOT", qubit: "both" });
      } else {
        this.applySingleGate(step.gate);
        this.pushOperation({ gate: step.gate, qubit: this.state.activeQubit });
      }
    });

    this.state.activeQubit = preset.activeQubit;
    this.state.lastGate = preset.label;
    this.syncActiveQubit();
    this.updateVisuals({ revealEnd: true });
    this.setStatus(preset.status);
  }

  measureRegister() {
    const threshold = Math.random();
    let cumulative = 0;
    let selected = BASIS.length - 1;

    for (let index = 0; index < BASIS.length; index += 1) {
      cumulative += complexAbs2(this.state.vector[index]);
      if (threshold <= cumulative) {
        selected = index;
        break;
      }
    }

    this.state.vector = BASIS.map((_basis, index) => (index === selected ? [1, 0] : [0, 0]));
    return BASIS[selected];
  }

  pushOperation(operation) {
    const entry = formatOperation(operation);
    this.state.operations.push({ ...operation, entry });
    this.state.history.push(entry);
    this.state.lastGate = entry;

    if (this.state.history.length > 8) {
      this.state.history.shift();
    }
  }

  calculateMetrics() {
    const reductions = [reducedDensity(this.state.vector, 0), reducedDensity(this.state.vector, 1)];
    return {
      reductions,
      entropy: densityEntropy(reductions[0]),
      norm: stateNorm(this.state.vector),
      probabilities: BASIS.map((_basis, index) => complexAbs2(this.state.vector[index]))
    };
  }

  updateVisuals(options = {}) {
    this.metrics = this.calculateMetrics();
    this.syncValue("angle", formatAngle(this.state.rotationAngle));
    this.syncValue("norm", this.metrics.norm.toFixed(3));
    this.syncValue("lastGate", this.state.lastGate ?? this.copy("identity"));

    this.metrics.reductions.forEach((density, index) => {
      const bloch = densityBloch(density);
      this.syncValue(`q${index}x`, bloch.x.toFixed(2));
      this.syncValue(`q${index}y`, bloch.y.toFixed(2));
      this.syncValue(`q${index}z`, bloch.z.toFixed(2));
      this.syncValue(`q${index}purity`, densityPurity(density).toFixed(2));
    });

    BASIS.forEach((basis, index) => {
      const probability = this.metrics.probabilities[index];
      this.syncValue(`p${basis}`, `${Math.round(probability * 100)}%`);
      this.syncValue(`a${basis}`, formatComplex(this.state.vector[index]));
      const bar = this.container.querySelector(`[data-qg-prob-bar='${basis}']`);
      if (bar) {
        bar.style.width = `${probability * 100}%`;
      }
    });

    this.syncValue("entropy", this.metrics.entropy.toFixed(3));
    const entropyBar = this.container.querySelector("[data-qg-entanglement-bar]");
    if (entropyBar) {
      entropyBar.style.width = `${clamp(this.metrics.entropy, 0, 1) * 100}%`;
    }

    this.syncValue("history", this.state.history.length ? this.state.history.join(" -> ") : this.copy("start"));

    if (options.revealEnd) {
      this.revealCircuitEnd();
    }

    this.draw();
  }

  syncActiveQubit() {
    this.container.querySelectorAll("[data-qg-qubit]").forEach((button) => {
      const active = Number(button.dataset.qgQubit) === this.state.activeQubit;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    this.draw();
  }

  syncValue(key, value) {
    const target = this.container.querySelector(`[data-qg-value='${key}']`);
    if (target) {
      target.textContent = value;
    }
  }

  setStatus(text) {
    const status = this.container.querySelector("[data-qg-status]");
    if (status) {
      status.textContent = text;
    }
  }

  gateStatus(gate) {
    const qubit = `Q${this.state.activeQubit}`;
    const descriptions = getGateDescriptions(this.isSpanish);
    if (descriptions[gate]) {
      return descriptions[gate](qubit, formatAngle(this.state.rotationAngle));
    }

    return this.isSpanish ? `${gate} aplicada sobre ${qubit}.` : `Applied ${gate} to ${qubit}.`;
  }

  resize() {
    const rect = this.frame.getBoundingClientRect();
    this.width = Math.max(320, Math.floor(rect.width));
    this.height = Math.max(220, Math.floor(rect.height || this.width * 9 / 16));
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.floor(this.width * this.pixelRatio);
    this.canvas.height = Math.floor(this.height * this.pixelRatio);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    this.state.pan = this.clampPan(this.state.pan);
    this.draw();
  }

  render(timestamp) {
    if (this.destroyed) {
      return;
    }

    const deltaTime = this.lastTimestamp ? Math.min((timestamp - this.lastTimestamp) / 1000, 0.05) : 0.016;
    this.lastTimestamp = timestamp;

    if (this.visible && document.body.dataset.motion !== "reduced") {
      this.state.time += deltaTime;
      this.draw();
    }

    this.animationFrame = requestAnimationFrame(this.render);
  }

  draw() {
    if (!this.ctx || !this.width || !this.height) {
      return;
    }

    const ctx = this.ctx;
    const width = this.width;
    const height = this.height;
    const shimmer = document.body.dataset.motion === "reduced" ? 0 : Math.sin(this.state.time * 1.6) * 0.5 + 0.5;

    ctx.clearRect(0, 0, width, height);
    this.drawBackground(ctx, width, height, shimmer);

    const layout = this.getLayout(width, height);
    this.drawCircuit(ctx, layout, shimmer);
    this.drawStateVector(ctx, layout, shimmer);
  }

  drawBackground(ctx, width, height, shimmer) {
    const gradient = ctx.createRadialGradient(width * 0.5, height * 0.34, 0, width * 0.5, height * 0.5, width * 0.78);
    gradient.addColorStop(0, "rgba(43, 0, 109, 0.92)");
    gradient.addColorStop(0.46, "rgba(12, 1, 28, 0.96)");
    gradient.addColorStop(1, COLORS.deep);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = 0.12 + shimmer * 0.04;
    ctx.strokeStyle = COLORS.violet;
    ctx.lineWidth = 1;
    const step = 34;
    for (let x = -step; x < width + step; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height * 0.28, height);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(255, 0, 162, 0.08)";
    ctx.beginPath();
    ctx.arc(width * 0.15, height * 0.22, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(191, 64, 255, 0.1)";
    ctx.beginPath();
    ctx.arc(width * 0.68, height * 0.72, 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawCircuit(ctx, layout, shimmer) {
    const { circuitLeft, circuitRight, railY, activeY, columnWidth, gateStartX } = layout;
    const railEnd = circuitRight - 18;

    ctx.save();
    ctx.font = "700 13px Cormorant Garamond, Georgia, serif";
    ctx.textBaseline = "middle";

    railY.forEach((y, index) => {
      const isActive = index === this.state.activeQubit;
      ctx.strokeStyle = isActive ? COLORS.hotPink : COLORS.rail;
      ctx.lineWidth = isActive ? 2.4 : 1.4;
      ctx.shadowBlur = isActive ? 16 : 7;
      ctx.shadowColor = isActive ? COLORS.hotPink : COLORS.violet;
      ctx.beginPath();
      ctx.moveTo(circuitLeft, y);
      ctx.lineTo(railEnd, y);
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = isActive ? COLORS.hotPink : COLORS.softViolet;
      ctx.fillText(`q${index}`, 28, y);
      ctx.fillStyle = "rgba(224, 152, 255, 0.72)";
      ctx.fillText("|0>", 52, y);
    });

    ctx.strokeStyle = `rgba(255, 0, 162, ${0.08 + shimmer * 0.08})`;
    ctx.lineWidth = 1;
    for (let x = gateStartX + this.state.pan; x < railEnd; x += columnWidth) {
      if (x < circuitLeft + 18) {
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(x, railY[0] - 54);
      ctx.lineTo(x, railY[1] + 54);
      ctx.stroke();
    }

    this.state.operations.forEach((operation, index) => {
      const x = gateStartX + this.state.pan + index * columnWidth;
      if (x < circuitLeft - columnWidth || x > circuitRight + columnWidth) {
        return;
      }
      this.drawOperation(ctx, operation, x, layout, index);
    });

    if (!this.state.operations.length) {
      ctx.fillStyle = "rgba(224, 152, 255, 0.64)";
      ctx.font = "700 18px Dancing Script, Cormorant Garamond, serif";
      ctx.textAlign = "center";
      ctx.fillText(this.isSpanish ? "Construye el circuito con las compuertas" : "Build the circuit with the gates", (circuitLeft + railEnd) / 2, activeY);
    }

    ctx.fillStyle = "rgba(255, 88, 214, 0.72)";
    ctx.font = "700 11px Cormorant Garamond, Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText(this.isSpanish ? "Arrastra para desplazar el circuito" : "Drag to pan the circuit", circuitLeft, layout.bottomHintY);
    ctx.restore();
  }

  drawOperation(ctx, operation, x, layout, index) {
    const { railY } = layout;
    const pulse = Math.max(0, 1 - (this.state.operations.length - 1 - index) * 0.22);
    const glow = 10 + pulse * 10;

    if (operation.gate === "CNOT") {
      ctx.save();
      ctx.strokeStyle = COLORS.strongPink;
      ctx.lineWidth = 2;
      ctx.shadowBlur = glow;
      ctx.shadowColor = COLORS.hotPink;
      ctx.beginPath();
      ctx.moveTo(x, railY[0]);
      ctx.lineTo(x, railY[1]);
      ctx.stroke();

      ctx.fillStyle = COLORS.hotPink;
      ctx.beginPath();
      ctx.arc(x, railY[0], 5.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = COLORS.softViolet;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(x, railY[1], 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 14, railY[1]);
      ctx.lineTo(x + 14, railY[1]);
      ctx.moveTo(x, railY[1] - 14);
      ctx.lineTo(x, railY[1] + 14);
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = COLORS.strongPink;
      ctx.font = "700 10px Cormorant Garamond, Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("CNOT", x, railY[0] - 34);
      ctx.restore();
      return;
    }

    if (operation.gate === "M") {
      railY.forEach((y) => this.drawGateChip(ctx, x, y, "M", operation.detail, glow, true));
      return;
    }

    const y = railY[operation.qubit];
    this.drawGateChip(ctx, x, y, operation.gate, operation.detail, glow, false);
  }

  drawGateChip(ctx, x, y, label, detail, glow, isMeasurement) {
    const chipWidth = isMeasurement ? 52 : 46;
    const chipHeight = 36;
    ctx.save();
    ctx.shadowBlur = glow;
    ctx.shadowColor = isMeasurement ? COLORS.electric : COLORS.hotPink;
    ctx.fillStyle = isMeasurement ? "rgba(119, 0, 255, 0.38)" : "rgba(17, 4, 28, 0.84)";
    ctx.strokeStyle = isMeasurement ? COLORS.electric : COLORS.hotPink;
    ctx.lineWidth = 1.4;
    roundedRect(ctx, x - chipWidth / 2, y - chipHeight / 2, chipWidth, chipHeight, 8);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = COLORS.softViolet;
    ctx.font = "700 16px Cormorant Garamond, Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x, y - (detail ? 4 : 0));
    if (detail) {
      ctx.fillStyle = COLORS.strongPink;
      ctx.font = "700 9px Cormorant Garamond, Georgia, serif";
      ctx.fillText(detail, x, y + 11);
    }
    ctx.restore();
  }

  drawStateVector(ctx, layout, shimmer) {
    const { readoutLeft, readoutTop, readoutWidth } = layout;
    const rowHeight = Math.max(20, Math.min(43, (layout.readoutHeight - 82) / 4));

    ctx.save();
    roundedRect(ctx, readoutLeft, readoutTop, readoutWidth, layout.readoutHeight, 16);
    ctx.fillStyle = "rgba(5, 0, 8, 0.34)";
    ctx.fill();
    ctx.strokeStyle = "rgba(191, 64, 255, 0.34)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = COLORS.hotPink;
    ctx.font = "700 13px Cormorant Garamond, Georgia, serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(this.isSpanish ? "VECTOR DE ESTADO" : "STATE VECTOR", readoutLeft + 18, readoutTop + 21);

    BASIS.forEach((basis, index) => {
      const y = readoutTop + 52 + index * rowHeight;
      const amp = this.state.vector[index];
      const probability = this.metrics.probabilities[index];
      const phase = Math.atan2(amp[1], amp[0]);
      const barWidth = (readoutWidth - 108) * probability;

      ctx.fillStyle = COLORS.softViolet;
      ctx.font = "700 12px Cormorant Garamond, Georgia, serif";
      ctx.fillText(`|${basis}>`, readoutLeft + 18, y);

      ctx.fillStyle = "rgba(43, 0, 109, 0.58)";
      roundedRect(ctx, readoutLeft + 70, y - 8, readoutWidth - 108, 8, 999);
      ctx.fill();

      const grad = ctx.createLinearGradient(readoutLeft + 70, 0, readoutLeft + 70 + barWidth, 0);
      grad.addColorStop(0, COLORS.violet);
      grad.addColorStop(0.56, COLORS.electric);
      grad.addColorStop(1, COLORS.hotPink);
      if (barWidth > 0.8) {
        ctx.fillStyle = grad;
        roundedRect(ctx, readoutLeft + 70, y - 8, barWidth, 8, 999);
        ctx.fill();
      }

      ctx.strokeStyle = probability > 0.001 ? COLORS.hotPink : "rgba(224, 152, 255, 0.34)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(readoutLeft + readoutWidth - 20, y - 4, 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(readoutLeft + readoutWidth - 20, y - 4);
      ctx.lineTo(readoutLeft + readoutWidth - 20 + Math.cos(phase) * 8, y - 4 + Math.sin(phase) * 8);
      ctx.stroke();

      ctx.fillStyle = COLORS.strongPink;
      ctx.font = "700 10px Cormorant Garamond, Georgia, serif";
      ctx.textAlign = "right";
      ctx.fillText(`${Math.round(probability * 100)}%`, readoutLeft + readoutWidth - 38, y + 12);
      ctx.textAlign = "left";
    });

    ctx.strokeStyle = `rgba(255, 0, 162, ${0.3 + shimmer * 0.22})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(readoutLeft + 18, readoutTop + layout.readoutHeight - 40);
    ctx.lineTo(readoutLeft + readoutWidth - 18, readoutTop + layout.readoutHeight - 40);
    ctx.stroke();

    ctx.fillStyle = COLORS.strongPink;
    ctx.font = "700 11px Cormorant Garamond, Georgia, serif";
    ctx.fillText(`S = ${this.metrics.entropy.toFixed(3)}`, readoutLeft + 18, readoutTop + layout.readoutHeight - 20);
    ctx.fillText(`||ψ|| = ${this.metrics.norm.toFixed(3)}`, readoutLeft + 94, readoutTop + layout.readoutHeight - 20);
    ctx.restore();
  }

  getLayout(width, height) {
    const compact = width < 620;
    const readoutWidth = compact ? Math.max(190, width - 64) : 242;
    const readoutLeft = compact ? 32 : width - readoutWidth - 28;
    const circuitLeft = 80;
    const circuitRight = compact ? width - 28 : readoutLeft - 22;
    const railY = compact ? [height * 0.24, height * 0.42] : [height * 0.36, height * 0.58];
    const readoutTop = compact ? height * 0.5 : 28;
    const readoutHeight = compact ? Math.min(210, height - readoutTop - 26) : height - 56;

    return {
      compact,
      circuitLeft,
      circuitRight,
      railY,
      activeY: (railY[0] + railY[1]) / 2,
      columnWidth: compact ? 66 : 78,
      gateStartX: circuitLeft + 70,
      bottomHintY: compact ? height * 0.47 : height - 28,
      readoutLeft,
      readoutTop,
      readoutWidth,
      readoutHeight
    };
  }

  revealCircuitEnd() {
    const layout = this.getLayout(this.width, this.height);
    const totalWidth = Math.max(0, (this.state.operations.length - 1) * layout.columnWidth);
    const available = Math.max(0, layout.circuitRight - layout.gateStartX - 40);
    this.state.pan = this.clampPan(Math.min(0, available - totalWidth));
  }

  clampPan(value) {
    if (!this.width || !this.height) {
      return value;
    }

    const layout = this.getLayout(this.width, this.height);
    const totalWidth = Math.max(0, (this.state.operations.length - 1) * layout.columnWidth);
    const available = Math.max(0, layout.circuitRight - layout.gateStartX - 40);
    const minPan = Math.min(0, available - totalWidth);
    return clamp(value, minPan, 0);
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

function initialState() {
  return [[1, 0], [0, 0], [0, 0], [0, 0]];
}

function getPresets(isSpanish) {
  return {
    bell: {
      activeQubit: 0,
      label: isSpanish ? "Preset Bell" : "Bell preset",
      status: isSpanish
        ? "Par de Bell preparado: H en Q0 y CNOT (controlled-NOT) para entrelazar el registro."
        : "Bell pair prepared: H on Q0 and CNOT (controlled-NOT) entangle the register.",
      steps: [
        { qubit: 0, gate: "H" },
        { gate: "CNOT" }
      ]
    },
    superposition: {
      activeQubit: 1,
      label: isSpanish ? "Preset superposición" : "Superposition preset",
      status: isSpanish
        ? "Superposición uniforme preparada sobre los cuatro estados base."
        : "Uniform superposition prepared over all four basis states.",
      steps: [
        { qubit: 0, gate: "H" },
        { qubit: 1, gate: "H" }
      ]
    },
    phase: {
      activeQubit: 1,
      label: isSpanish ? "Preset fase" : "Phase preset",
      status: isSpanish
        ? "Estado de fase preparado: mismas probabilidades, distintas fases complejas."
        : "Phase state prepared: same probabilities, different complex phases.",
      steps: [
        { qubit: 0, gate: "H" },
        { qubit: 1, gate: "H" },
        { qubit: 0, gate: "T" },
        { qubit: 1, gate: "S" }
      ]
    },
    interference: {
      activeQubit: 0,
      label: isSpanish ? "Preset interferencia" : "Interference preset",
      status: isSpanish
        ? "Interferencia preparada: HZH convierte una fase oculta en cambio de medición."
        : "Interference prepared: HZH converts hidden phase into a measurement change.",
      steps: [
        { qubit: 0, gate: "H" },
        { qubit: 0, gate: "Z" },
        { qubit: 0, gate: "H" }
      ]
    }
  };
}

function getGateDescriptions(isSpanish) {
  if (isSpanish) {
    return {
      X: (qubit) => `X invierte ${qubit}: intercambia |0> y |1>.`,
      Y: (qubit) => `Y invierte ${qubit} y añade fase imaginaria.`,
      Z: (qubit) => `Z aplica una fase pi sobre |1> en ${qubit}.`,
      H: (qubit) => `H crea o recombina superposición en ${qubit}.`,
      S: (qubit) => `S añade una fase pi/2 sobre |1> en ${qubit}.`,
      T: (qubit) => `T añade una fase pi/4 sobre |1> en ${qubit}.`,
      RX: (qubit, angle) => `RX rota ${qubit} alrededor del eje X por ${angle}.`,
      RY: (qubit, angle) => `RY rota ${qubit} alrededor del eje Y por ${angle}.`,
      RZ: (qubit, angle) => `RZ rota ${qubit} alrededor del eje Z por ${angle}.`
    };
  }

  return {
    X: (qubit) => `X flips ${qubit}: it swaps |0> and |1>.`,
    Y: (qubit) => `Y flips ${qubit} and adds imaginary phase.`,
    Z: (qubit) => `Z applies a pi phase to |1> on ${qubit}.`,
    H: (qubit) => `H creates or recombines superposition on ${qubit}.`,
    S: (qubit) => `S adds a pi/2 phase to |1> on ${qubit}.`,
    T: (qubit) => `T adds a pi/4 phase to |1> on ${qubit}.`,
    RX: (qubit, angle) => `RX rotates ${qubit} around X by ${angle}.`,
    RY: (qubit, angle) => `RY rotates ${qubit} around Y by ${angle}.`,
    RZ: (qubit, angle) => `RZ rotates ${qubit} around Z by ${angle}.`
  };
}

function reducedDensity(vector, qubit) {
  if (qubit === 0) {
    return {
      r00: complexAbs2(vector[0]) + complexAbs2(vector[1]),
      r11: complexAbs2(vector[2]) + complexAbs2(vector[3]),
      off: complexAdd(complexMul(vector[0], complexConj(vector[2])), complexMul(vector[1], complexConj(vector[3])))
    };
  }

  return {
    r00: complexAbs2(vector[0]) + complexAbs2(vector[2]),
    r11: complexAbs2(vector[1]) + complexAbs2(vector[3]),
    off: complexAdd(complexMul(vector[0], complexConj(vector[1])), complexMul(vector[2], complexConj(vector[3])))
  };
}

function densityBloch(density) {
  return {
    x: 2 * density.off[0],
    y: -2 * density.off[1],
    z: density.r00 - density.r11
  };
}

function densityPurity(density) {
  const off = complexAbs2(density.off);
  return clamp(density.r00 * density.r00 + density.r11 * density.r11 + 2 * off, 0, 1);
}

function densityEntropy(density) {
  const off = complexAbs2(density.off);
  const diff = density.r00 - density.r11;
  const disc = Math.sqrt(Math.max(0, diff * diff + 4 * off));
  const eigenvalues = [
    clamp((density.r00 + density.r11 + disc) / 2, 0, 1),
    clamp((density.r00 + density.r11 - disc) / 2, 0, 1)
  ];

  return eigenvalues.reduce((total, value) => {
    if (value < 1e-10) {
      return total;
    }
    return total - value * Math.log2(value);
  }, 0);
}

function normalizeState(vector) {
  const norm = stateNorm(vector);
  if (norm <= 0) {
    return initialState();
  }

  return vector.map((amp) => [amp[0] / norm, amp[1] / norm]);
}

function stateNorm(vector) {
  return Math.sqrt(vector.reduce((total, amp) => total + complexAbs2(amp), 0));
}

function formatOperation(operation) {
  if (operation.gate === "CNOT") {
    return "CNOT";
  }

  if (operation.gate === "M") {
    return `M=${operation.detail}`;
  }

  const detail = operation.detail ? `(${operation.detail})` : "";
  return `${operation.gate}${detail}(Q${operation.qubit})`;
}

function complexAdd(a, b) {
  return [a[0] + b[0], a[1] + b[1]];
}

function complexMul(a, b) {
  return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
}

function complexConj(a) {
  return [a[0], -a[1]];
}

function complexAbs2(a) {
  return a[0] * a[0] + a[1] * a[1];
}

function formatComplex([real, imaginary]) {
  const cleanReal = Math.abs(real) < 0.005 ? 0 : real;
  const cleanImaginary = Math.abs(imaginary) < 0.005 ? 0 : imaginary;

  if (cleanImaginary === 0) {
    return cleanReal.toFixed(2);
  }

  if (cleanReal === 0) {
    return `${cleanImaginary.toFixed(2)}i`;
  }

  const sign = cleanImaginary >= 0 ? "+" : "-";
  return `${cleanReal.toFixed(2)} ${sign} ${Math.abs(cleanImaginary).toFixed(2)}i`;
}

function formatAngle(value) {
  const turns = value / Math.PI;
  if (Math.abs(turns - 0.25) < 0.01) {
    return "pi/4";
  }

  if (Math.abs(turns - 0.5) < 0.01) {
    return "pi/2";
  }

  if (Math.abs(turns - 1) < 0.01) {
    return "pi";
  }

  return `${turns.toFixed(2)}pi`;
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
