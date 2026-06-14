import { bindPinchZoom, isModelPanGesture, panTargetFromPointer } from "./model-pan.js?v=20260614-photon-tabs-equations-icons-v1";

const mountedModels = new WeakSet();
let threePromise = null;

const COLORS = {
  brightViolet: 0x8a2be2,
  luminousViolet: 0xbf40ff,
  electric: 0xbf40ff,
  violet: 0x7700ff,
  indigo: 0x2b006d,
  hydrogenDeepViolet: 0x2e007a,
  hydrogenVividPurple: 0x8f00e6,
  hydrogenElectricViolet: 0x7a1af5,
  hydrogenElectricIndigo: 0x7700ff,
  attentionBase: 0x2e007a,
  attentionViolet: 0x7700ff,
  attentionPurple: 0xbf40ff,
  attentionMagenta: 0xd32dff,
  attentionViolet: 0xbf40ff,
  deep: 0x050008
};

const LAYERS = [9, 13, 16, 14, 10, 7];
const NETWORK_PULSE_COUNT = 108;
const NETWORK_CONNECTION_STRIDE = 29;
const MAX_ATTENTION_TOKENS = 16;
const MAX_ATTENTION_HEADS = 8;
const ATTENTION_CELL_SPACING = 0.9;
const LANDSCAPE_SIZE = 48;

export function initNeuralArchitectModels(root = document) {
  root.querySelectorAll("[data-neural-architect-model]").forEach((container) => {
    if (mountedModels.has(container)) {
      return;
    }

    mountedModels.add(container);
    new NeuralArchitectModel(container);
  });
}

class NeuralArchitectModel {
  constructor(container) {
    this.container = container;
    this.frame = container.querySelector("[data-na-frame]") ?? container;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "neural-architect__canvas";
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute("aria-label", this.copy("canvasLabel"));
    this.canvas.setAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight ArrowUp ArrowDown + -");
    this.frame.replaceChildren(this.canvas);

    this.state = {
      mode: "network",
      learningRate: 0.05,
      training: true,
      detail: "weights",
      attentionLength: 8,
      attentionHeads: 4,
      attentionTemperature: 1,
      attentionPattern: "evolve",
      complexity: 1.5,
      momentum: 0.8,
      yaw: -0.58,
      pitch: 0.34,
      distance: 20,
      target: { x: 0, y: 0, z: 0 }
    };

    this.pointer = null;
    this.visible = true;
    this.destroyed = false;
    this.lastTimestamp = 0;
    this.handleResize = () => this.resize();

    this.setup().catch(() => {
      this.frame.replaceChildren(this.createFallback());
    });
  }

  get isSpanish() {
    return this.container.dataset.language === "es" || document.documentElement.lang.startsWith("es");
  }

  copy(key) {
    const content = {
      canvasLabel: {
        en: "Interactive neural network, attention map, and gradient landscape visualization.",
        es: "Visualizacion interactiva de red neuronal, mapa de atencion y paisaje de gradiente."
      },
      fallback: {
        en: "The neural architecture model could not load in this browser.",
        es: "El modelo de arquitectura neuronal no pudo cargarse en este navegador."
      },
      networkStatus: {
        en: "Layer activations move through weighted connections while loss decreases during training.",
        es: "Las activaciones avanzan por conexiones ponderadas mientras la perdida disminuye durante el entrenamiento."
      },
      attentionStatus: {
        en: "The matrix shows multi-head token-to-token attention after scaled query-key comparison.",
        es: "La matriz muestra atención multi-head entre tokens despues de comparar consulta y clave escaladas."
      },
      landscapeStatus: {
        en: "Gradient descent follows the local slope of a non-convex loss surface.",
        es: "El descenso de gradiente sigue la pendiente local de una superficie de perdida no convexa."
      },
      train: { en: "Train", es: "Entrenar" },
      pause: { en: "Pause", es: "Pausar" }
    };

    return content[key][this.isSpanish ? "es" : "en"];
  }

  createFallback() {
    const fallback = document.createElement("p");
    fallback.className = "content-placeholder";
    fallback.textContent = this.copy("fallback");
    return fallback;
  }

  async setup() {
    const THREE = await loadThree();
    this.THREE = THREE;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.deep);
    this.scene.fog = new THREE.FogExp2(COLORS.deep, 0.024);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 140);
    this.worldGroup = new THREE.Group();
    this.networkGroup = new THREE.Group();
    this.attentionGroup = new THREE.Group();
    this.landscapeGroup = new THREE.Group();
    this.worldGroup.add(this.networkGroup, this.attentionGroup, this.landscapeGroup);
    this.scene.add(this.worldGroup);

    this.addLights();
    this.addBackdrop();
    this.bindControls();
    this.bindCanvas();
    this.setupObservers();
    this.buildNetwork();
    this.buildAttention();
    this.buildLandscape();
    this.switchMode("network");
    this.resize();
    this.updateCamera();

    this.render = this.render.bind(this);
    this.animationFrame = requestAnimationFrame(this.render);
  }

  addLights() {
    const { THREE, scene } = this;
    scene.add(new THREE.AmbientLight(COLORS.hydrogenElectricViolet, 0.78));

    const brightVioletLight = new THREE.PointLight(COLORS.brightViolet, 1.25, 80);
    brightVioletLight.position.set(-8, 10, 9);
    const violetLight = new THREE.PointLight(COLORS.hydrogenElectricViolet, 2.35, 80);
    violetLight.position.set(9, 6, -8);
    const indigoLight = new THREE.PointLight(COLORS.hydrogenElectricIndigo, 2.1, 80);
    indigoLight.position.set(0, -5, 12);
    scene.add(brightVioletLight, violetLight, indigoLight);
  }

  addBackdrop() {
    const { THREE, scene } = this;
    const positions = new Float32Array(420 * 3);

    for (let i = 0; i < 420; i += 1) {
      const radius = 22 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = -7 + Math.random() * 24;
      positions[i * 3 + 2] = Math.sin(theta) * radius;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.starfield = new THREE.Points(geometry, new THREE.PointsMaterial({
      color: COLORS.luminousViolet,
      size: 0.034,
      transparent: true,
      opacity: 0.5,
      depthWrite: false
    }));
    scene.add(this.starfield);
  }

  bindControls() {
    this.statusNode = this.container.querySelector("[data-na-status]");
    this.valueNodes = new Map();
    this.displayNodes = new Map();

    this.container.querySelectorAll("[data-na-value]").forEach((node) => {
      this.valueNodes.set(node.dataset.naValue, node);
    });
    this.container.querySelectorAll("[data-na-display]").forEach((node) => {
      this.displayNodes.set(node.dataset.naDisplay, node);
    });

    this.container.querySelectorAll("[data-na-mode]").forEach((button) => {
      button.addEventListener("click", () => this.switchMode(button.dataset.naMode));
    });

    this.trainButton = this.container.querySelector("[data-na-action='train']");
    this.trainButton?.addEventListener("click", () => {
      this.state.training = !this.state.training;
      this.syncTrainingButton();
    });

    this.container.querySelector("[data-na-action='reset-network']")?.addEventListener("click", () => this.resetTraining());
    this.container.querySelector("[data-na-action='recompute-attention']")?.addEventListener("click", () => {
      this.attentionSeed = Math.random() * 1000;
      this.rebuildAttentionVectors();
      this.updateAttentionMatrix(0);
    });
    this.container.querySelector("[data-na-action='reset-landscape']")?.addEventListener("click", () => this.resetOptimizer());
    this.container.querySelector("[data-na-action='perturb-landscape']")?.addEventListener("click", () => this.perturbOptimizer());

    this.detailSelect = this.container.querySelector("[data-na-detail]");
    this.detailSelect?.addEventListener("change", () => {
      this.state.detail = this.detailSelect.value;
      this.applyNetworkDetail();
    });

    this.patternSelect = this.container.querySelector("[data-na-attention-pattern]");
    this.patternSelect?.addEventListener("change", () => {
      this.state.attentionPattern = this.patternSelect.value;
      this.attentionSeed = Math.random() * 1000;
      this.rebuildAttentionVectors();
      this.updateAttentionMatrix(0);
    });

    this.container.querySelectorAll("[data-na-param]").forEach((control) => {
      control.addEventListener("input", () => {
        const key = control.dataset.naParam;
        const value = Number(control.value);

        if (key === "learningRate") {
          this.state.learningRate = clamp(value, 0.005, 0.3);
        } else if (key === "attentionLength") {
          this.state.attentionLength = Math.round(clamp(value, 4, MAX_ATTENTION_TOKENS));
          this.buildAttention();
        } else if (key === "attentionHeads") {
          this.state.attentionHeads = Math.round(clamp(value, 1, MAX_ATTENTION_HEADS));
          this.rebuildAttentionVectors();
          this.updateAttentionMatrix(0);
        } else if (key === "attentionTemperature") {
          this.state.attentionTemperature = clamp(value, 0.4, 2);
          this.updateAttentionMatrix(0);
        } else if (key === "complexity") {
          this.state.complexity = clamp(value, 0, 3);
          this.rebuildLandscapeSurface();
        } else if (key === "momentum") {
          this.state.momentum = clamp(value, 0, 0.95);
        }

        this.syncControlLabels();
      });
    });

    this.syncControlLabels();
    this.syncTrainingButton();
  }

  bindCanvas() {
    this.boundPointerDown = (event) => {
      if (event.button !== 0) {
        if (!isModelPanGesture(event)) {
          return;
        }
      }

      if (isModelPanGesture(event)) {
        event.preventDefault();
        this.pointer = {
          id: event.pointerId,
          mode: "pan",
          x: event.clientX,
          y: event.clientY,
          target: { ...this.state.target }
        };
        this.canvas.setPointerCapture?.(event.pointerId);
        return;
      }

      this.pointer = { id: event.pointerId, mode: "orbit", x: event.clientX, y: event.clientY };
      this.canvas.setPointerCapture?.(event.pointerId);
    };

    this.boundPointerMove = (event) => {
      if (!this.pointer || this.pointer.id !== event.pointerId) {
        return;
      }

      const dx = event.clientX - this.pointer.x;
      const dy = event.clientY - this.pointer.y;
      this.pointer.x = event.clientX;
      this.pointer.y = event.clientY;

      if (this.pointer.mode === "pan") {
        panTargetFromPointer({
          THREE: this.THREE,
          camera: this.camera,
          target: this.state.target,
          startTarget: this.pointer.target,
          startX: event.clientX - dx,
          startY: event.clientY - dy,
          event,
          distance: this.state.distance
        });
        this.pointer.target = { ...this.state.target };
        this.updateCamera();
        return;
      }

      this.state.yaw -= dx * 0.006;
      this.state.pitch = clamp(this.state.pitch + dy * 0.004, -1.08, 1.08);
      this.updateCamera();
    };

    this.boundPointerUp = (event) => {
      if (!this.pointer || this.pointer.id !== event.pointerId) {
        return;
      }

      this.pointer = null;
      this.canvas.releasePointerCapture?.(event.pointerId);
    };

    this.boundWheel = (event) => {
      event.preventDefault();
      this.state.distance = clamp(this.state.distance + Math.sign(event.deltaY) * 1.4, 9, 58);
      this.updateCamera();
    };

    bindPinchZoom(this.canvas, {
      getValue: () => this.state.distance,
      setValue: (value) => {
        this.state.distance = value;
      },
      min: 9,
      max: 58,
      inverted: true,
      onStart: () => {
        this.pointer = null;
      },
      onChange: () => this.updateCamera()
    });

    this.boundKeyDown = (event) => {
      if (event.key === "ArrowLeft") {
        this.state.yaw += 0.08;
      } else if (event.key === "ArrowRight") {
        this.state.yaw -= 0.08;
      } else if (event.key === "ArrowUp") {
        this.state.pitch = clamp(this.state.pitch + 0.06, -1.08, 1.08);
      } else if (event.key === "ArrowDown") {
        this.state.pitch = clamp(this.state.pitch - 0.06, -1.08, 1.08);
      } else if (event.key === "+" || event.key === "=") {
        this.state.distance = clamp(this.state.distance - 1.4, 9, 58);
      } else if (event.key === "-" || event.key === "_") {
        this.state.distance = clamp(this.state.distance + 1.4, 9, 58);
      } else {
        return;
      }

      event.preventDefault();
      this.updateCamera();
    };

    this.canvas.addEventListener("pointerdown", this.boundPointerDown);
    this.canvas.addEventListener("pointermove", this.boundPointerMove);
    this.canvas.addEventListener("pointerup", this.boundPointerUp);
    this.canvas.addEventListener("pointercancel", this.boundPointerUp);
    this.canvas.addEventListener("wheel", this.boundWheel, { passive: false });
    this.canvas.addEventListener("keydown", this.boundKeyDown);
    this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  setupObservers() {
    this.resizeObserver = new ResizeObserver(this.handleResize);
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
  }

  switchMode(mode) {
    if (!["network", "attention", "landscape"].includes(mode)) {
      return;
    }

    this.state.mode = mode;
    this.networkGroup.visible = mode === "network";
    this.attentionGroup.visible = mode === "attention";
    this.landscapeGroup.visible = mode === "landscape";

    this.container.querySelectorAll("[data-na-mode]").forEach((button) => {
      const isActive = button.dataset.naMode === mode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    this.container.querySelectorAll("[data-na-panel]").forEach((panel) => {
      panel.classList.toggle("is-hidden", panel.dataset.naPanel !== mode);
    });
    this.container.querySelectorAll("[data-na-metrics]").forEach((panel) => {
      panel.classList.toggle("is-hidden", panel.dataset.naMetrics !== mode);
    });

    if (mode === "network") {
      this.setStatus(this.copy("networkStatus"));
      this.setCameraPreset(-0.58, 0.34, 21.5, 0, 0.1, 0);
    } else if (mode === "attention") {
      this.setStatus(this.copy("attentionStatus"));
      this.setCameraPreset(-0.65, 0.56, 13.5, 0, 0, 0);
    } else {
      this.setStatus(this.copy("landscapeStatus"));
      this.setCameraPreset(-0.72, 0.62, 22, 0, 0.4, 0);
    }
  }

  setCameraPreset(yaw, pitch, distance, x, y, z) {
    this.state.yaw = yaw;
    this.state.pitch = pitch;
    this.state.distance = distance;
    this.state.target = { x, y, z };
    this.updateCamera();
  }

  setStatus(text) {
    if (this.statusNode) {
      this.statusNode.textContent = text;
    }
  }

  setValue(key, value) {
    const node = this.valueNodes.get(key);
    if (node) {
      node.textContent = value;
    }
  }

  setDisplay(key, value) {
    const node = this.displayNodes.get(key);
    if (node) {
      node.textContent = value;
    }
  }

  syncControlLabels() {
    this.setDisplay("learningRate", this.state.learningRate.toFixed(3));
    this.setDisplay("attentionLength", String(this.state.attentionLength));
    this.setDisplay("attentionHeads", String(this.state.attentionHeads));
    this.setDisplay("attentionTemperature", this.state.attentionTemperature.toFixed(2));
    this.setDisplay("complexity", this.state.complexity.toFixed(1));
    this.setDisplay("momentum", this.state.momentum.toFixed(2));
    this.setValue("momentum", this.state.momentum.toFixed(2));
    this.setValue("attentionHeads", String(this.state.attentionHeads));
  }

  syncTrainingButton() {
    if (!this.trainButton) {
      return;
    }

    this.trainButton.textContent = this.state.training ? this.copy("pause") : this.copy("train");
    this.trainButton.classList.toggle("is-active", this.state.training);
    this.trainButton.setAttribute("aria-pressed", String(this.state.training));
  }

  buildNetwork() {
    disposeChildren(this.networkGroup);
    const { THREE } = this;
    this.network = {
      epoch: 0,
      loss: 1,
      accuracy: 0,
      time: 0,
      nodes: [],
      connections: [],
      pulses: []
    };

    const nodeMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.hydrogenElectricViolet,
      transparent: true,
      opacity: 0.92
    });
    const activeMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.brightViolet,
      transparent: true,
      opacity: 0.95
    });

    LAYERS.forEach((count, layerIndex) => {
      const x = (layerIndex - (LAYERS.length - 1) / 2) * 2.55;
      const layerHeight = 7.8;
      const nodes = [];

      for (let i = 0; i < count; i += 1) {
        const y = count === 1 ? 0 : (i / (count - 1) - 0.5) * layerHeight;
        const z = Math.sin(i * 1.7 + layerIndex) * 0.52;
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.15, 18, 12),
          (layerIndex === LAYERS.length - 1 ? activeMaterial : nodeMaterial).clone()
        );
        mesh.position.set(x, y, z);
        this.networkGroup.add(mesh);
        nodes.push(mesh);
      }

      this.network.nodes.push(nodes);
    });

    for (let layerIndex = 0; layerIndex < this.network.nodes.length - 1; layerIndex += 1) {
      this.network.nodes[layerIndex].forEach((fromNode, fromIndex) => {
        this.network.nodes[layerIndex + 1].forEach((toNode, toIndex) => {
          const weight = Math.sin((fromIndex + 1) * 1.9 + (toIndex + 1) * 0.7 + layerIndex);
          const line = this.createConnection(fromNode.position, toNode.position, weight);
          this.network.connections.push({ fromNode, toNode, line, weight });
          this.networkGroup.add(line);
        });
      });
    }

    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.brightViolet,
      transparent: true,
      opacity: 0.9
    });

    const pulseCount = Math.min(NETWORK_PULSE_COUNT, this.network.connections.length);
    for (let i = 0; i < pulseCount; i += 1) {
      const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), pulseMaterial.clone());
      const connectionIndex = (i * NETWORK_CONNECTION_STRIDE) % this.network.connections.length;
      const connection = this.network.connections[connectionIndex];
      this.network.pulses.push({
        mesh: pulse,
        connection,
        connectionIndex,
        phase: i / pulseCount,
        speed: 0.18 + (i % 13) * 0.014
      });
      this.networkGroup.add(pulse);
    }

    this.networkGroup.add(this.createGrid(17, 20, -4.4, 0.14));
    this.applyNetworkDetail();
    this.updateNetworkMetrics();
  }

  createConnection(from, to, weight) {
    const { THREE } = this;
    const color = new THREE.Color(weight >= 0 ? COLORS.hydrogenElectricIndigo : COLORS.hydrogenVividPurple);
    const geometry = new THREE.BufferGeometry().setFromPoints([from.clone(), to.clone()]);
    return new THREE.Line(geometry, new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.08 + Math.abs(weight) * 0.24
    }));
  }

  applyNetworkDetail() {
    if (!this.network) {
      return;
    }

    const showFlow = this.state.detail === "flow";
    this.network.connections.forEach(({ line, weight }) => {
      line.material.opacity = showFlow ? 0.08 : 0.08 + Math.abs(weight) * 0.24;
    });
    this.network.pulses.forEach(({ mesh }) => {
      mesh.visible = true;
      mesh.material.opacity = showFlow ? 0.96 : 0.72;
    });
  }

  resetTraining() {
    if (!this.network) {
      return;
    }

    this.network.epoch = 0;
    this.network.loss = 1;
    this.network.accuracy = 0;
    this.state.training = true;
    this.syncTrainingButton();
    this.updateNetworkMetrics();
  }

  updateNetwork(dt) {
    if (!this.network) {
      return;
    }

    this.network.time += dt;

    if (this.state.training) {
      const rate = this.state.learningRate * 1.9;
      this.network.epoch += dt * (10 + this.state.learningRate * 65);
      this.network.loss = Math.max(0.035, this.network.loss * Math.exp(-rate * dt) + Math.sin(this.network.time * 1.7) * 0.0008);
      this.network.accuracy = clamp(1 - this.network.loss + 0.04 * Math.sin(this.network.time * 0.8), 0, 0.985);
    }

    this.network.nodes.forEach((layer, layerIndex) => {
      layer.forEach((node, nodeIndex) => {
        const activation = 0.56 + 0.44 * Math.sin(this.network.time * 2.2 + nodeIndex * 0.9 + layerIndex);
        const scale = 0.82 + activation * 0.42;
        node.scale.setScalar(scale);
        node.material.opacity = 0.58 + activation * 0.38;
      });
    });

    this.network.connections.forEach((connection, index) => {
      connection.weight = Math.sin(this.network.time * 0.45 + index * 0.37) * 0.55 + connection.weight * 0.45;
      connection.line.material.color.setHex(connection.weight >= 0 ? COLORS.hydrogenElectricIndigo : COLORS.hydrogenVividPurple);
      if (this.state.detail !== "flow") {
        connection.line.material.opacity = 0.08 + Math.abs(connection.weight) * 0.3;
      }
    });

    this.network.pulses.forEach((pulse, index) => {
      const previousPhase = pulse.phase;
      pulse.phase = (pulse.phase + dt * (pulse.speed + this.state.learningRate * 0.38)) % 1;

      if (pulse.phase < previousPhase) {
        pulse.connectionIndex = (pulse.connectionIndex + NETWORK_CONNECTION_STRIDE + index) % this.network.connections.length;
        pulse.connection = this.network.connections[pulse.connectionIndex];
      }

      pulse.mesh.position.lerpVectors(pulse.connection.fromNode.position, pulse.connection.toNode.position, pulse.phase);
      pulse.mesh.material.color.setHex(pulse.phase > 0.78 ? COLORS.brightViolet : COLORS.hydrogenElectricViolet);
      pulse.mesh.material.opacity = 0.38 + Math.sin(pulse.phase * Math.PI) * 0.54;
      pulse.mesh.scale.setScalar(0.85 + Math.sin(pulse.phase * Math.PI) * 0.55);
    });

    this.updateNetworkMetrics();
  }

  updateNetworkMetrics() {
    this.setValue("epoch", Math.floor(this.network?.epoch ?? 0).toString());
    this.setValue("loss", (this.network?.loss ?? 1).toFixed(4));
    this.setValue("accuracy", `${Math.round((this.network?.accuracy ?? 0) * 100)}%`);
  }

  buildAttention() {
    if (!this.THREE) {
      return;
    }

    disposeChildren(this.attentionGroup);
    const { THREE } = this;
    const n = this.state.attentionLength;
    this.attentionSeed = this.attentionSeed ?? Math.random() * 1000;
    this.attentionTime = 0;
    this.attention = {
      matrix: new Float32Array(n * n),
      tokenMeshes: [],
      headDim: 8,
      qHeads: [],
      kHeads: []
    };
    this.rebuildAttentionVectors();

    this.attentionGroup.add(this.createGrid(13.4, n, -0.06, 0.18));

    const geometry = new THREE.BoxGeometry(0.28, 1, 0.28);
    const material = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      emissive: COLORS.attentionBase,
      emissiveIntensity: 0.48,
      vertexColors: true,
      transparent: true,
      opacity: 0.96
    });
    this.attention.mesh = new THREE.InstancedMesh(geometry, material, n * n);
    this.attention.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.attention.mesh.renderOrder = 1;
    this.attentionGroup.add(this.attention.mesh);

    const edgeMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.attentionViolet,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
      depthWrite: false
    });
    this.attention.edgeMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.302, 1.004, 0.302), edgeMaterial, n * n);
    this.attention.edgeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.attention.edgeMesh.renderOrder = 2;
    this.attentionGroup.add(this.attention.edgeMesh);

    const tokenMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.attentionViolet,
      transparent: true,
      opacity: 0.94
    });
    for (let i = 0; i < n; i += 1) {
      const offset = (i - (n - 1) / 2) * ATTENTION_CELL_SPACING;
      const rowToken = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 12), tokenMaterial.clone());
      rowToken.position.set(-6.85, 0.25, offset);
      const colToken = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 12), tokenMaterial.clone());
      colToken.position.set(offset, 0.25, -6.85);
      this.attention.tokenMeshes.push(rowToken, colToken);
      this.attentionGroup.add(rowToken, colToken);
    }

    this.updateAttentionMatrix(0);
  }

  rebuildAttentionVectors() {
    if (!this.attention) {
      return;
    }

    const n = this.state.attentionLength;
    const dim = this.attention.headDim ?? 8;
    const seed = this.attentionSeed ?? 1;
    const pattern = this.state.attentionPattern;
    const heads = Math.round(clamp(this.state.attentionHeads, 1, MAX_ATTENTION_HEADS));
    this.attention.qHeads = [];
    this.attention.kHeads = [];

    for (let head = 0; head < heads; head += 1) {
      this.attention.qHeads.push(createAttentionVectors(n, dim, seed + head * 19.7, pattern, "query"));
      this.attention.kHeads.push(createAttentionVectors(n, dim, seed + 31.7 + head * 23.3, pattern, "key"));
    }
  }

  updateAttention(dt) {
    if (!this.attention?.mesh) {
      return;
    }

    this.updateAttentionMatrix(dt);
  }

  updateAttentionMatrix(dt) {
    const { THREE } = this;
    const n = this.state.attentionLength;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const time = (this.attentionTime = (this.attentionTime ?? 0) + dt);
    const heads = Math.max(1, this.attention.qHeads?.length || 1);
    const temperature = clamp(this.state.attentionTemperature, 0.4, 2);
    let norm = 0;
    let entropy = 0;

    for (let row = 0; row < n; row += 1) {
      const rowValues = new Array(n).fill(0);

      for (let head = 0; head < heads; head += 1) {
        let maxLogit = -Infinity;
        const logits = [];
        const q = dynamicAttentionVector(
          this.attention.qHeads[head][row],
          row,
          time,
          this.state.attentionPattern,
          head * 0.23
        );

        for (let col = 0; col < n; col += 1) {
          const k = dynamicAttentionVector(
            this.attention.kHeads[head][col],
            col,
            time,
            this.state.attentionPattern,
            1 + head * 0.19
          );
          const logit = dotVector(q, k) / Math.sqrt(this.attention.headDim) / temperature;
          logits.push(logit);
          maxLogit = Math.max(maxLogit, logit);
        }

        const rowExp = logits.map((logit) => Math.exp(logit - maxLogit));
        const rowSum = rowExp.reduce((sum, value) => sum + value, 0) || 1;

        for (let col = 0; col < n; col += 1) {
          rowValues[col] += rowExp[col] / rowSum / heads;
        }
      }

      const rowPeak = rowValues.reduce((max, value) => Math.max(max, value), 0) || 1;

      for (let col = 0; col < n; col += 1) {
        const index = row * n + col;
        const value = rowValues[col];
        const visualValue = clamp(Math.pow(value / rowPeak, 1.35), 0, 1);
        this.attention.matrix[index] = value;
        norm += value * value;
        entropy -= value > 1e-9 ? value * Math.log2(value) : 0;

        const height = 0.04 + visualValue * 4.65;
        const x = (col - (n - 1) / 2) * ATTENTION_CELL_SPACING;
        const z = (row - (n - 1) / 2) * ATTENTION_CELL_SPACING;
        dummy.position.set(x, height / 2, z);
        dummy.scale.set(1, height, 1);
        dummy.updateMatrix();
        this.attention.mesh.setMatrixAt(index, dummy.matrix);
        this.attention.edgeMesh.setMatrixAt(index, dummy.matrix);
        setAttentionColor(color, visualValue, THREE);
        this.attention.mesh.setColorAt(index, color);
      }
    }

    this.attention.mesh.instanceMatrix.needsUpdate = true;
    this.attention.edgeMesh.instanceMatrix.needsUpdate = true;
    if (this.attention.mesh.instanceColor) {
      this.attention.mesh.instanceColor.needsUpdate = true;
    }

    this.attention.tokenMeshes.forEach((mesh, index) => {
      mesh.scale.setScalar(0.8 + 0.28 * Math.sin(time * 2 + index));
    });
    this.setValue("headNorm", Math.sqrt(norm).toFixed(3));
    this.setValue("attentionHeads", String(heads));
    this.setValue("attentionEntropy", (entropy / n).toFixed(3));
  }

  buildLandscape() {
    disposeChildren(this.landscapeGroup);
    this.landscape = {
      position: { x: 4.2, z: -3.7 },
      velocity: { x: 0, z: 0 },
      trail: []
    };

    this.rebuildLandscapeSurface();
    this.resetOptimizer();
  }

  rebuildLandscapeSurface() {
    if (!this.THREE || !this.landscapeGroup) {
      return;
    }

    if (this.landscapeSurface) {
      this.landscapeGroup.remove(this.landscapeSurface);
      disposeObject(this.landscapeSurface);
    }

    const { THREE } = this;
    const positions = [];
    const colors = [];
    const indices = [];
    const color = new THREE.Color();
    const half = 6;

    for (let row = 0; row <= LANDSCAPE_SIZE; row += 1) {
      const z = -half + (row / LANDSCAPE_SIZE) * half * 2;
      for (let col = 0; col <= LANDSCAPE_SIZE; col += 1) {
        const x = -half + (col / LANDSCAPE_SIZE) * half * 2;
        const y = this.lossSurface(x, z);
        positions.push(x, y, z);
        setRampColor(color, clamp((y + 1.2) / 4.2, 0, 1), THREE);
        colors.push(color.r, color.g, color.b);
      }
    }

    for (let row = 0; row < LANDSCAPE_SIZE; row += 1) {
      for (let col = 0; col < LANDSCAPE_SIZE; col += 1) {
        const a = row * (LANDSCAPE_SIZE + 1) + col;
        const b = a + 1;
        const c = a + LANDSCAPE_SIZE + 1;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    this.landscapeSurface = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide
    }));
    this.landscapeGroup.add(this.landscapeSurface);

    if (!this.landscapeBall) {
      this.landscapeBall = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 22, 16),
        new THREE.MeshBasicMaterial({ color: COLORS.brightViolet })
      );
      this.landscapeTrail = this.createTrailLine();
      this.landscapeGroup.add(this.landscapeTrail, this.landscapeBall);
    } else {
      this.landscapeGroup.add(this.landscapeTrail, this.landscapeBall);
    }
  }

  createTrailLine() {
    const { THREE } = this;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(180 * 3), 3));
    geometry.setDrawRange(0, 0);
    return new THREE.Line(geometry, new THREE.LineBasicMaterial({
      color: COLORS.brightViolet,
      transparent: true,
      opacity: 0.72
    }));
  }

  resetOptimizer() {
    if (!this.landscape) {
      return;
    }

    this.landscape.position = { x: 4.2, z: -3.7 };
    this.landscape.velocity = { x: 0, z: 0 };
    this.landscape.trail = [];
    this.updateOptimizerVisuals();
  }

  perturbOptimizer() {
    if (!this.landscape) {
      return;
    }

    this.landscape.position.x = -5 + Math.random() * 10;
    this.landscape.position.z = -5 + Math.random() * 10;
    this.landscape.velocity = { x: 0, z: 0 };
    this.landscape.trail = [];
    this.updateOptimizerVisuals();
  }

  updateLandscape(dt) {
    if (!this.landscape) {
      return;
    }

    const grad = this.gradientAt(this.landscape.position.x, this.landscape.position.z);
    const step = 1.35 * dt;
    this.landscape.velocity.x = this.state.momentum * this.landscape.velocity.x - grad.x * step;
    this.landscape.velocity.z = this.state.momentum * this.landscape.velocity.z - grad.z * step;
    this.landscape.position.x = clamp(this.landscape.position.x + this.landscape.velocity.x, -5.7, 5.7);
    this.landscape.position.z = clamp(this.landscape.position.z + this.landscape.velocity.z, -5.7, 5.7);
    this.updateOptimizerVisuals();
  }

  updateOptimizerVisuals() {
    const x = this.landscape.position.x;
    const z = this.landscape.position.z;
    const y = this.lossSurface(x, z);
    this.landscapeBall?.position.set(x, y + 0.24, z);
    this.landscape.trail.push([x, y + 0.26, z]);

    if (this.landscape.trail.length > 180) {
      this.landscape.trail.shift();
    }

    if (this.landscapeTrail) {
      const attribute = this.landscapeTrail.geometry.attributes.position;
      this.landscape.trail.forEach((point, index) => {
        attribute.array[index * 3] = point[0];
        attribute.array[index * 3 + 1] = point[1];
        attribute.array[index * 3 + 2] = point[2];
      });
      attribute.needsUpdate = true;
      this.landscapeTrail.geometry.setDrawRange(0, this.landscape.trail.length);
    }

    this.setValue("landscapeLoss", y.toFixed(3));
    this.setValue("momentum", this.state.momentum.toFixed(2));
  }

  lossSurface(x, z) {
    const bowl = 0.045 * (x * x + z * z);
    const waves = this.state.complexity * 0.34 * (Math.sin(x * 1.6) * Math.cos(z * 1.25));
    const valley = -0.9 * Math.exp(-((x + 1.8) ** 2 + (z - 1.1) ** 2) / 4.8);
    const ridge = 0.55 * Math.exp(-((x - 2.2) ** 2 + (z + 2.4) ** 2) / 2.6);
    return bowl + waves + valley + ridge + 0.9;
  }

  gradientAt(x, z) {
    const eps = 0.035;
    return {
      x: (this.lossSurface(x + eps, z) - this.lossSurface(x - eps, z)) / (2 * eps),
      z: (this.lossSurface(x, z + eps) - this.lossSurface(x, z - eps)) / (2 * eps)
    };
  }

  createGrid(size, divisions, y, opacity) {
    const { THREE } = this;
    const half = size / 2;
    const positions = [];

    for (let i = 0; i <= divisions; i += 1) {
      const a = -half + size * i / divisions;
      positions.push(-half, y, a, half, y, a);
      positions.push(a, y, -half, a, y, half);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
      color: COLORS.indigo,
      transparent: true,
      opacity
    }));
  }

  updateCamera() {
    if (!this.camera) {
      return;
    }

    const { yaw, pitch, distance, target } = this.state;
    const cosPitch = Math.cos(pitch);
    this.camera.position.set(
      target.x + Math.sin(yaw) * cosPitch * distance,
      target.y + Math.sin(pitch) * distance,
      target.z + Math.cos(yaw) * cosPitch * distance
    );
    this.camera.lookAt(target.x, target.y, target.z);
  }

  resize() {
    if (!this.renderer || !this.camera) {
      return;
    }

    const rect = this.frame.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  render(timestamp) {
    if (this.destroyed) {
      return;
    }

    const dt = Math.min((timestamp - this.lastTimestamp) / 1000 || 0, 0.05);
    this.lastTimestamp = timestamp;

    if (this.visible && document.body.dataset.motion !== "reduced") {
      if (this.state.mode === "network") {
        this.updateNetwork(dt);
      } else if (this.state.mode === "attention") {
        this.updateAttention(dt);
      } else {
        this.updateLandscape(dt);
      }

      if (this.starfield) {
        this.starfield.rotation.y += dt * 0.022;
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.animationFrame = requestAnimationFrame(this.render);
  }

  destroy() {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.mutationObserver?.disconnect();
    this.canvas.removeEventListener("pointerdown", this.boundPointerDown);
    this.canvas.removeEventListener("pointermove", this.boundPointerMove);
    this.canvas.removeEventListener("pointerup", this.boundPointerUp);
    this.canvas.removeEventListener("pointercancel", this.boundPointerUp);
    this.canvas.removeEventListener("wheel", this.boundWheel);
    this.canvas.removeEventListener("keydown", this.boundKeyDown);
    disposeObject(this.scene);
    this.renderer?.dispose();
  }
}

function setRampColor(target, t, THREE) {
  const stops = [
    [0, COLORS.deep],
    [0.28, COLORS.hydrogenDeepViolet],
    [0.55, COLORS.hydrogenElectricIndigo],
    [0.78, COLORS.hydrogenElectricViolet],
    [1, COLORS.brightViolet]
  ];

  for (let i = 0; i < stops.length - 1; i += 1) {
    const [startT, startColor] = stops[i];
    const [endT, endColor] = stops[i + 1];

    if (t >= startT && t <= endT) {
      target.copy(new THREE.Color(startColor)).lerp(new THREE.Color(endColor), (t - startT) / (endT - startT));
      return;
    }
  }

  target.setHex(COLORS.brightViolet);
}

function setAttentionColor(target, t, THREE) {
  const stops = [
    [0, COLORS.attentionBase],
    [0.28, COLORS.attentionViolet],
    [0.58, COLORS.attentionPurple],
    [0.82, COLORS.attentionMagenta],
    [0.96, COLORS.attentionViolet],
    [1, COLORS.brightViolet]
  ];

  for (let i = 0; i < stops.length - 1; i += 1) {
    const [startT, startColor] = stops[i];
    const [endT, endColor] = stops[i + 1];

    if (t >= startT && t <= endT) {
      const amount = (t - startT) / (endT - startT);
      target.copy(new THREE.Color(startColor)).lerp(new THREE.Color(endColor), amount);
      return;
    }
  }

  target.setHex(COLORS.brightViolet);
}

function createAttentionVectors(count, dim, seed, pattern, kind) {
  const vectors = [];

  for (let token = 0; token < count; token += 1) {
    const vector = [];

    for (let axis = 0; axis < dim; axis += 1) {
      let value;

      if (pattern === "static") {
        const phase = (token + 1) * (axis + 1) * 0.42;
        value = Math.cos(phase) + Math.sin((token + axis + 1) * 0.31);
      } else if (pattern === "chaos") {
        value = seededNoise(seed, token, axis, kind) * 2 - 1;
      } else {
        const phase = seed * 0.017 + token * 0.71 + axis * 0.43;
        const roleOffset = kind === "query" ? 0 : 0.37;
        value = Math.sin(phase + roleOffset) + 0.68 * Math.cos((token + 1) * (axis + 1) * 0.19 + roleOffset);
      }

      vector.push(value);
    }

    vectors.push(normalizeVector(vector));
  }

  return vectors;
}

function dynamicAttentionVector(base, token, time, pattern, role) {
  if (pattern === "static") {
    return base;
  }

  const strength = pattern === "chaos" ? 0.5 : 0.22;
  const vector = base.map((value, axis) => (
    value
    + strength * Math.sin(time * (0.34 + role * 0.11) + token * 0.47 + axis * 0.73 + role)
  ));

  return normalizeVector(vector);
}

function normalizeVector(vector) {
  const norm = Math.hypot(...vector);
  if (norm < 1e-9) {
    return vector.map(() => 0);
  }

  return vector.map((value) => value / norm);
}

function dotVector(a, b) {
  let sum = 0;
  const length = Math.min(a.length, b.length);

  for (let index = 0; index < length; index += 1) {
    sum += a[index] * b[index];
  }

  return sum;
}

function seededNoise(seed, token, axis, kind) {
  const role = kind === "query" ? 17.13 : 41.79;
  const value = Math.sin(seed * 12.9898 + token * 78.233 + axis * 37.719 + role) * 43758.5453;
  return value - Math.floor(value);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function disposeChildren(group) {
  while (group.children.length) {
    const child = group.children[0];
    group.remove(child);
    disposeObject(child);
  }
}

function disposeObject(object) {
  object.traverse?.((child) => {
    child.geometry?.dispose?.();

    if (Array.isArray(child.material)) {
      child.material.forEach((material) => material.dispose?.());
    } else {
      child.material?.dispose?.();
    }
  });
}

function loadThree() {
  if (!threePromise) {
    threePromise = import("https://unpkg.com/three@0.160.0/build/three.module.js");
  }

  return threePromise;
}
