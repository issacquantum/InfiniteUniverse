import { bindPinchZoom, isModelPanGesture, panTargetFromPointer } from "./model-pan.js?v=20260614-outline-photon-v1";

const mountedModels = new WeakSet();
let threePromise = null;

const COLORS = {
  brightViolet: 0x8a2be2,
  luminousViolet: 0xbf40ff,
  electric: 0xbf40ff,
  violet: 0x7700ff,
  indigo: 0x2b006d,
  deepViolet: 0x2e007a,
  vividPurple: 0x8f00e6,
  electricViolet: 0x7a1af5,
  electricIndigo: 0x7700ff,
  deep: 0x050008
};

function getCanvasContentFont() {
  return getComputedStyle(document.body).fontFamily || "serif";
}

const GRAPH_COLUMNS = 13;
const GRAPH_ROWS = 9;
const GRAPH_NODES = createDijkstraNodes();
const GRAPH_EDGES = createDijkstraEdges(GRAPH_NODES);

const SORT_VALUES = [14, 4, 19, 7, 22, 11, 3, 17, 9, 20, 6, 15, 2, 13, 8, 18];
const BIG_O_SERIES = [
  { key: "constant", label: "O(1)", color: COLORS.luminousViolet, z: -3.2, fn: () => 1.8 },
  { key: "log", label: "O(log n)", color: COLORS.electric, z: -1.6, fn: (n) => Math.log2(n + 1) * 1.05 },
  { key: "linear", label: "O(n)", color: COLORS.violet, z: 0, fn: (n) => n * 0.23 },
  { key: "nlogn", label: "O(n log n)", color: COLORS.electricViolet, z: 1.6, fn: (n) => n * Math.log2(n + 1) * 0.05 },
  { key: "square", label: "O(n²)", color: COLORS.brightViolet, z: 3.2, fn: (n) => n * n * 0.012 }
];

export function initAlgorithmVisualizerModels(root = document) {
  root.querySelectorAll("[data-algorithm-visualizer-model]").forEach((container) => {
    if (mountedModels.has(container)) {
      return;
    }

    mountedModels.add(container);
    new AlgorithmVisualizerModel(container);
  });
}

class AlgorithmVisualizerModel {
  constructor(container) {
    this.container = container;
    this.frame = container.querySelector("[data-av-frame]") ?? container;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "algorithm-visualizer__canvas";
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute("aria-label", this.copy("canvasLabel"));
    this.canvas.setAttribute("aria-keyshortcuts", "Space s r ArrowLeft ArrowRight ArrowUp ArrowDown + -");
    this.frame.replaceChildren(this.canvas);

    this.state = {
      mode: "path",
      running: false,
      speed: 1,
      yaw: -0.42,
      pitch: 0.34,
      distance: 22.5,
      target: { x: 0, y: 1.25, z: 0 }
    };

    this.pointer = null;
    this.visible = true;
    this.destroyed = false;
    this.lastTimestamp = 0;
    this.autoAccumulator = 0;
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
        en: "Interactive 3D algorithms visualizer for Dijkstra, sorting, and Big O growth.",
        es: "Visualizador 3D interactivo de algoritmos para Dijkstra, ordenamiento y crecimiento Big O."
      },
      fallback: {
        en: "The algorithm visualizer could not load in this browser.",
        es: "El visualizador de algoritmos no pudo cargarse en este navegador."
      },
      pathStatus: {
        en: "Dijkstra explores the lowest known nonnegative distance first, relaxes edges, then locks the final shortest path.",
        es: "Dijkstra explora primero la menor distancia no negativa conocida, relaja aristas y luego fija el camino mínimo final."
      },
      sortStatus: {
        en: "Bubble sort compares neighboring bars and swaps them when the order is wrong.",
        es: "Bubble sort compara barras vecinas y las intercambia cuando el orden es incorrecto."
      },
      bigOStatus: {
        en: "Growth curves separate as input size increases; asymptotic cost eventually dominates.",
        es: "Las curvas de crecimiento se separan al aumentar la entrada; el costo asintótico termina dominando."
      },
      running: {
        en: "Pause",
        es: "Pausar"
      },
      paused: {
        en: "Run",
        es: "Ejecutar"
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

  async setup() {
    const THREE = await loadThree();
    this.THREE = THREE;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.deep);
    this.scene.fog = new THREE.FogExp2(COLORS.deep, 0.025);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 120);
    this.worldGroup = new THREE.Group();
    this.pathGroup = new THREE.Group();
    this.sortGroup = new THREE.Group();
    this.bigOGroup = new THREE.Group();
    this.worldGroup.add(this.pathGroup, this.sortGroup, this.bigOGroup);
    this.scene.add(this.worldGroup);

    this.addLights();
    this.addBackdrop();
    this.bindControls();
    this.bindCanvas();
    this.setupObservers();
    this.resetPath();
    this.resetSort();
    this.resetBigO();
    this.switchMode("path");
    this.resize();
    this.updateCamera();

    this.render = this.render.bind(this);
    this.animationFrame = requestAnimationFrame(this.render);
  }

  addLights() {
    const { THREE, scene } = this;
    scene.add(new THREE.AmbientLight(COLORS.electricViolet, 0.72));

    const brightVioletLight = new THREE.PointLight(COLORS.brightViolet, 1.6, 70);
    brightVioletLight.position.set(-8, 9, 9);
    const violetLight = new THREE.PointLight(COLORS.electric, 2.1, 80);
    violetLight.position.set(8, 8, -7);
    const indigoLight = new THREE.PointLight(COLORS.electricIndigo, 1.7, 80);
    indigoLight.position.set(0, -3, 11);
    scene.add(brightVioletLight, violetLight, indigoLight);
  }

  addBackdrop() {
    const { THREE, scene } = this;
    const count = 420;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color(COLORS.brightViolet),
      new THREE.Color(COLORS.luminousViolet),
      new THREE.Color(COLORS.electric),
      new THREE.Color(COLORS.violet),
      new THREE.Color(COLORS.electricIndigo)
    ];

    for (let index = 0; index < count; index += 1) {
      const radius = 18 + Math.random() * 32;
      const theta = Math.random() * Math.PI * 2;
      const color = palette[index % palette.length];
      positions[index * 3] = Math.cos(theta) * radius;
      positions[index * 3 + 1] = -6 + Math.random() * 19;
      positions[index * 3 + 2] = Math.sin(theta) * radius;
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    this.backdrop = new THREE.Points(geometry, new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.42,
      depthWrite: false
    }));
    scene.add(this.backdrop);
  }

  bindControls() {
    this.statusNode = this.container.querySelector("[data-av-status]");
    this.runButton = this.container.querySelector("[data-av-action='run']");
    this.valueNodes = new Map();
    this.container.querySelectorAll("[data-av-value]").forEach((node) => {
      this.valueNodes.set(node.dataset.avValue, node);
    });

    this.container.querySelectorAll("[data-av-mode]").forEach((button) => {
      button.addEventListener("click", () => this.switchMode(button.dataset.avMode));
    });

    this.container.querySelector("[data-av-action='step']")?.addEventListener("click", () => this.stepActiveMode());
    this.runButton?.addEventListener("click", () => {
      this.state.running = !this.state.running;
      this.syncUi();
    });
    this.container.querySelector("[data-av-action='reset']")?.addEventListener("click", () => this.resetActiveMode());

    this.container.querySelector("[data-av-param='speed']")?.addEventListener("input", (event) => {
      this.state.speed = Number.parseFloat(event.target.value);
      this.syncUi();
    });
  }

  bindCanvas() {
    this.canvas.addEventListener("pointerdown", (event) => {
      this.canvas.focus({ preventScroll: true });
      if (isModelPanGesture(event)) {
        event.preventDefault();
        this.pointer = {
          id: event.pointerId,
          mode: "pan",
          x: event.clientX,
          y: event.clientY,
          target: { ...this.state.target }
        };
        this.canvas.setPointerCapture(event.pointerId);
        return;
      }

      this.pointer = {
        id: event.pointerId,
        mode: "orbit",
        x: event.clientX,
        y: event.clientY,
        yaw: this.state.yaw,
        pitch: this.state.pitch
      };
      this.canvas.setPointerCapture(event.pointerId);
    });

    this.canvas.addEventListener("pointermove", (event) => {
      if (!this.pointer || this.pointer.id !== event.pointerId) {
        return;
      }

      if (this.pointer.mode === "pan") {
        panTargetFromPointer({
          THREE: this.THREE,
          camera: this.camera,
          target: this.state.target,
          startTarget: this.pointer.target,
          startX: this.pointer.x,
          startY: this.pointer.y,
          event,
          distance: this.state.distance
        });
        this.updateCamera();
        return;
      }

      this.state.yaw = this.pointer.yaw + (event.clientX - this.pointer.x) * 0.006;
      this.state.pitch = clamp(this.pointer.pitch + (event.clientY - this.pointer.y) * 0.004, -0.72, 0.82);
      this.updateCamera();
    });

    this.canvas.addEventListener("pointerup", (event) => {
      if (this.pointer?.id === event.pointerId) {
        this.pointer = null;
      }
    });

    this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());

    this.canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      this.state.distance = clamp(this.state.distance + Math.sign(event.deltaY) * 1.1, 13, 44);
      this.updateCamera();
    }, { passive: false });

    bindPinchZoom(this.canvas, {
      getValue: () => this.state.distance,
      setValue: (value) => {
        this.state.distance = value;
      },
      min: 13,
      max: 44,
      inverted: true,
      onStart: () => {
        this.pointer = null;
      },
      onChange: () => this.updateCamera()
    });

    this.canvas.addEventListener("keydown", (event) => {
      switch (event.key) {
        case " ":
          this.state.running = !this.state.running;
          this.syncUi();
          break;
        case "s":
        case "S":
          this.stepActiveMode();
          break;
        case "r":
        case "R":
          this.resetActiveMode();
          break;
        case "ArrowLeft":
          this.state.yaw -= 0.12;
          break;
        case "ArrowRight":
          this.state.yaw += 0.12;
          break;
        case "ArrowUp":
          this.state.pitch = clamp(this.state.pitch - 0.08, -0.72, 0.82);
          break;
        case "ArrowDown":
          this.state.pitch = clamp(this.state.pitch + 0.08, -0.72, 0.82);
          break;
        case "+":
        case "=":
          this.state.distance = clamp(this.state.distance - 1.1, 13, 44);
          break;
        case "-":
        case "_":
          this.state.distance = clamp(this.state.distance + 1.1, 13, 44);
          break;
        default:
          return;
      }

      this.updateCamera();
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

  switchMode(mode) {
    this.state.mode = mode;
    this.pathGroup.visible = mode === "path";
    this.sortGroup.visible = mode === "sort";
    this.bigOGroup.visible = mode === "bigo";

    this.container.querySelectorAll("[data-av-mode]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.avMode === mode);
    });

    this.syncUi();
  }

  resetActiveMode() {
    if (this.state.mode === "path") {
      this.resetPath();
    } else if (this.state.mode === "sort") {
      this.resetSort();
    } else {
      this.resetBigO();
    }
    this.syncUi();
  }

  stepActiveMode() {
    if (this.state.mode === "path") {
      this.stepPath();
    } else if (this.state.mode === "sort") {
      this.stepSort();
    } else {
      this.stepBigO();
    }
    this.syncUi();
  }

  resetPath() {
    clearGroup(this.pathGroup);
    this.pathStep = 0;
    this.pathStates = buildDijkstraStates();
    this.pathNodeMeshes = [];
    this.pathEdgeLines = [];

    const { THREE } = this;
    GRAPH_EDGES.forEach(([from, to, weight]) => {
      const a = GRAPH_NODES[from];
      const b = GRAPH_NODES[to];
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(a.x, a.y, a.z),
        new THREE.Vector3(b.x, b.y, b.z)
      ]);
      const material = new THREE.LineBasicMaterial({
        color: COLORS.indigo,
        transparent: true,
        opacity: 0.28
      });
      const line = new THREE.Line(geometry, material);
      line.userData = { from, to, weight };
      this.pathEdgeLines.push(line);
      this.pathGroup.add(line);
    });

    GRAPH_NODES.forEach((node, index) => {
      const material = new THREE.MeshBasicMaterial({
        color: index === 0 ? COLORS.brightViolet : COLORS.electric,
        transparent: true,
        opacity: 0.92
      });
      const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 2), material);
      mesh.position.set(node.x, node.y, node.z);
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 18, 12),
        new THREE.MeshBasicMaterial({
          color: COLORS.violet,
          transparent: true,
          opacity: 0.1,
          depthWrite: false
        })
      );
      halo.position.copy(mesh.position);
      this.pathNodeMeshes[index] = { mesh, halo };
      this.pathGroup.add(halo, mesh);
    });

    this.applyPathState();
  }

  stepPath() {
    this.pathStep = (this.pathStep + 1) % this.pathStates.length;
    this.applyPathState();
  }

  applyPathState() {
    const state = this.pathStates[this.pathStep] ?? this.pathStates[0];
    const finalEdges = new Set(state.finalEdges);
    const relaxedEdges = new Set(state.relaxedEdges);
    const settled = new Set(state.settled);

    this.pathEdgeLines.forEach((line) => {
      const edgeKey = edgeId(line.userData.from, line.userData.to);
      if (finalEdges.has(edgeKey)) {
        line.material.color.setHex(COLORS.brightViolet);
        line.material.opacity = 0.96;
      } else if (relaxedEdges.has(edgeKey)) {
        line.material.color.setHex(COLORS.electricViolet);
        line.material.opacity = 0.76;
      } else {
        line.material.color.setHex(COLORS.indigo);
        line.material.opacity = 0.22;
      }
    });

    this.pathNodeMeshes.forEach(({ mesh, halo }, index) => {
      if (state.finalPath.includes(index)) {
        mesh.material.color.setHex(COLORS.brightViolet);
        halo.material.color.setHex(COLORS.brightViolet);
        halo.material.opacity = 0.24;
        mesh.scale.setScalar(1.24);
      } else if (index === state.current) {
        mesh.material.color.setHex(COLORS.luminousViolet);
        halo.material.color.setHex(COLORS.luminousViolet);
        halo.material.opacity = 0.22;
        mesh.scale.setScalar(1.18);
      } else if (settled.has(index)) {
        mesh.material.color.setHex(COLORS.electric);
        halo.material.color.setHex(COLORS.electric);
        halo.material.opacity = 0.16;
        mesh.scale.setScalar(1.04);
      } else {
        mesh.material.color.setHex(COLORS.violet);
        halo.material.color.setHex(COLORS.indigo);
        halo.material.opacity = 0.08;
        mesh.scale.setScalar(1);
      }
    });
  }

  resetSort() {
    clearGroup(this.sortGroup);
    this.sortValues = [...SORT_VALUES];
    this.sortSteps = buildBubbleSortSteps(this.sortValues);
    this.sortStep = 0;
    this.sortBars = [];

    const { THREE } = this;
    const width = 0.46;
    const gap = 0.16;
    const totalWidth = this.sortValues.length * (width + gap);
    this.sortValues.forEach((value, index) => {
      const height = value * 0.18;
      const geometry = new THREE.BoxGeometry(width, height, width);
      const material = new THREE.MeshBasicMaterial({
        color: COLORS.electric,
        transparent: true,
        opacity: 0.9
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(index * (width + gap) - totalWidth / 2, height / 2, 0);
      this.sortBars.push(mesh);
      this.sortGroup.add(mesh);
    });

    const base = new THREE.GridHelper(12, 24, COLORS.indigo, COLORS.deepViolet);
    base.position.y = -0.02;
    this.sortGroup.add(base);
    this.applySortState();
  }

  stepSort() {
    this.sortStep = (this.sortStep + 1) % this.sortSteps.length;
    this.applySortState();
  }

  applySortState() {
    const state = this.sortSteps[this.sortStep] ?? this.sortSteps[0];
    const compare = new Set(state.compare);
    const sortedFrom = state.sortedFrom;
    const width = 0.46;
    const gap = 0.16;
    const totalWidth = state.values.length * (width + gap);

    this.sortBars.forEach((mesh, index) => {
      const value = state.values[index];
      const height = value * 0.18;
      mesh.scale.y = height / mesh.geometry.parameters.height;
      mesh.position.set(index * (width + gap) - totalWidth / 2, height / 2, 0);
      if (index >= sortedFrom) {
        mesh.material.color.setHex(COLORS.brightViolet);
      } else if (compare.has(index)) {
        mesh.material.color.setHex(state.swapped ? COLORS.luminousViolet : COLORS.electricViolet);
      } else {
        mesh.material.color.setHex(COLORS.electric);
      }
    });
  }

  resetBigO() {
    clearGroup(this.bigOGroup);
    this.bigOStep = 0;
    this.bigOMarkers = [];
    const { THREE } = this;

    BIG_O_SERIES.forEach((series) => {
      const points = [];
      for (let n = 1; n <= 36; n += 1) {
        points.push(new THREE.Vector3(n * 0.36 - 6.8, series.fn(n) * 0.44, series.z));
      }

      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({
          color: series.color,
          transparent: true,
          opacity: 0.78
        })
      );
      this.bigOGroup.add(line);

      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 18, 12),
        new THREE.MeshBasicMaterial({
          color: series.color,
          transparent: true,
          opacity: 0.95
        })
      );
      marker.userData = { series };
      this.bigOMarkers.push(marker);
      this.bigOGroup.add(marker);

      const label = this.createTextSprite(series.label, series.color);
      label.position.set(7, series.fn(36) * 0.44, series.z);
      label.scale.set(1.05, 0.42, 1);
      this.bigOGroup.add(label);
    });

    const grid = new THREE.GridHelper(16, 18, COLORS.indigo, COLORS.deepViolet);
    grid.position.set(0, -0.02, 0);
    this.bigOGroup.add(grid);
    this.applyBigOState();
  }

  stepBigO() {
    this.bigOStep = (this.bigOStep + 1) % 36;
    this.applyBigOState();
  }

  applyBigOState() {
    const n = this.bigOStep + 1;
    this.bigOMarkers.forEach((marker) => {
      const { series } = marker.userData;
      marker.position.set(n * 0.36 - 6.8, series.fn(n) * 0.44, series.z);
      marker.scale.setScalar(series.key === "square" ? 1.2 : 1);
    });
  }

  createTextSprite(text, color) {
    const { THREE } = this;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 96;
    const ctx = canvas.getContext("2d");
    const hex = `#${color.toString(16).padStart(6, "0")}`;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `700 34px ${getCanvasContentFont()}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowBlur = 14;
    ctx.shadowColor = hex;
    ctx.fillStyle = hex;
    ctx.fillText(text, 128, 48);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Sprite(new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false
    }));
  }

  syncUi() {
    this.runButton.textContent = this.copy(this.state.running ? "running" : "paused");
    this.setValue("mode", this.activeModeLabel());
    this.setValue("speed", `${this.state.speed.toFixed(1)}x`);
    this.setValue("step", String(this.activeStep()));
    this.setValue("metric", this.activeMetric());
    const details = this.activeTeachingDetails();
    this.setValue("focus", details.focus);
    this.setValue("operation", details.operation);
    this.setValue("axis", details.axis);

    if (this.statusNode) {
      const key = this.state.mode === "path" ? "pathStatus" : this.state.mode === "sort" ? "sortStatus" : "bigOStatus";
      this.statusNode.textContent = this.copy(key);
    }
  }

  activeModeLabel() {
    if (this.state.mode === "path") {
      return "Dijkstra";
    }
    if (this.state.mode === "sort") {
      return "Sorting";
    }
    return "Big O";
  }

  activeStep() {
    if (this.state.mode === "path") {
      return this.pathStep;
    }
    if (this.state.mode === "sort") {
      return this.sortStep;
    }
    return this.bigOStep + 1;
  }

  activeMetric() {
    if (this.state.mode === "path") {
      const state = this.pathStates[this.pathStep] ?? this.pathStates[0];
      return state.finalPath.length ? "shortest path locked" : `${state.settled.length}/${GRAPH_NODES.length} settled, ${state.relaxedEdges.length} relaxed`;
    }
    if (this.state.mode === "sort") {
      const state = this.sortSteps[this.sortStep] ?? this.sortSteps[0];
      return state.swapped ? "swap" : "compare";
    }
    return `n = ${this.bigOStep + 1}`;
  }

  activeTeachingDetails() {
    if (this.state.mode === "path") {
      const state = this.pathStates[this.pathStep] ?? this.pathStates[0];
      const current = GRAPH_NODES[state.current]?.id ?? "N1";
      return {
        focus: this.isSpanish ? `Nodo actual: ${current}` : `Current node: ${current}`,
        operation: state.finalPath.length
          ? (this.isSpanish ? "Camino final marcado" : "Final path marked")
          : (this.isSpanish ? "Relajar aristas vecinas" : "Relax neighboring edges"),
        axis: this.isSpanish ? "Tabla: nodo, distancia, previo, estado" : "Table idea: node, distance, previous, status"
      };
    }

    if (this.state.mode === "sort") {
      const state = this.sortSteps[this.sortStep] ?? this.sortSteps[0];
      const pair = state.compare.length ? `${state.compare[0] + 1}-${state.compare[1] + 1}` : "-";
      return {
        focus: this.isSpanish ? "Algoritmo: bubble sort" : "Algorithm: bubble sort",
        operation: state.swapped
          ? (this.isSpanish ? `Comparacion ${pair}: intercambiar` : `Comparison ${pair}: swap`)
          : (this.isSpanish ? `Comparacion ${pair}: sin intercambio` : `Comparison ${pair}: no swap`),
        axis: this.isSpanish ? "Las barras ordenadas se fijan al final" : "Sorted bars lock at the end"
      };
    }

    const n = this.bigOStep + 1;
    return {
      focus: this.isSpanish ? `Tamano de entrada n = ${n}` : `Input size n = ${n}`,
      operation: this.isSpanish ? "Compara crecimiento de operaciones" : "Compare operation growth",
      axis: this.isSpanish ? "x: n, y: operaciones relativas" : "x-axis: n, y-axis: relative operations"
    };
  }

  setValue(key, value) {
    const node = this.valueNodes.get(key);
    if (node) {
      node.textContent = value;
    }
  }

  resize() {
    if (!this.renderer || !this.camera) {
      return;
    }

    const rect = this.frame.getBoundingClientRect();
    const width = Math.max(320, Math.floor(rect.width));
    const height = Math.max(220, Math.floor(rect.height || width * 9 / 16));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  render(timestamp) {
    if (this.destroyed) {
      return;
    }

    const deltaTime = this.lastTimestamp ? Math.min((timestamp - this.lastTimestamp) / 1000, 0.05) : 0.016;
    this.lastTimestamp = timestamp;

    if (this.visible && document.body.dataset.motion !== "reduced") {
      this.animate(deltaTime);
    }

    this.renderer.render(this.scene, this.camera);
    this.animationFrame = requestAnimationFrame(this.render);
  }

  animate(deltaTime) {
    this.backdrop.rotation.y += deltaTime * 0.018;

    if (this.state.running) {
      this.autoAccumulator += deltaTime * this.state.speed;
      if (this.autoAccumulator >= 0.54) {
        this.autoAccumulator = 0;
        this.stepActiveMode();
      }
    }
  }

  updateCamera() {
    if (!this.camera) {
      return;
    }

    const target = this.state.target;
    this.camera.position.set(
      target.x + Math.sin(this.state.yaw) * Math.cos(this.state.pitch) * this.state.distance,
      target.y + Math.sin(this.state.pitch) * this.state.distance,
      target.z + Math.cos(this.state.yaw) * Math.cos(this.state.pitch) * this.state.distance
    );
    this.camera.lookAt(target.x, target.y, target.z);
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

    this.scene?.traverse((object) => {
      object.geometry?.dispose?.();
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => disposeMaterial(material));
      } else {
        disposeMaterial(object.material);
      }
    });
    this.renderer?.dispose?.();
  }
}

function buildDijkstraStates() {
  const nodeCount = GRAPH_NODES.length;
  const adjacency = Array.from({ length: nodeCount }, () => []);
  GRAPH_EDGES.forEach(([from, to, weight]) => {
    adjacency[from].push({ node: to, weight });
    adjacency[to].push({ node: from, weight });
  });

  const distances = Array(nodeCount).fill(Infinity);
  const previous = Array(nodeCount).fill(null);
  const settled = new Set();
  const states = [{
    current: 0,
    settled: [],
    relaxedEdges: [],
    finalEdges: [],
    finalPath: []
  }];
  distances[0] = 0;

  while (settled.size < nodeCount) {
    let current = -1;
    let best = Infinity;
    for (let index = 0; index < nodeCount; index += 1) {
      if (!settled.has(index) && distances[index] < best) {
        best = distances[index];
        current = index;
      }
    }

    if (current === -1) {
      break;
    }

    settled.add(current);
    const relaxedEdges = [];
    adjacency[current].forEach(({ node, weight }) => {
      if (settled.has(node)) {
        return;
      }

      relaxedEdges.push(edgeId(current, node));
      const candidate = distances[current] + weight;
      if (candidate < distances[node]) {
        distances[node] = candidate;
        previous[node] = current;
      }
    });

    states.push({
      current,
      settled: Array.from(settled),
      relaxedEdges,
      finalEdges: [],
      finalPath: []
    });
  }

  const finalPath = [];
  const finalEdges = [];
  let cursor = nodeCount - 1;
  while (cursor !== null) {
    finalPath.unshift(cursor);
    const parent = previous[cursor];
    if (parent !== null) {
      finalEdges.push(edgeId(parent, cursor));
    }
    cursor = parent;
  }

  states.push({
    current: nodeCount - 1,
    settled: Array.from({ length: nodeCount }, (_, index) => index),
    relaxedEdges: [],
    finalEdges,
    finalPath
  });

  return states;
}

function createDijkstraNodes() {
  const nodes = [];

  for (let row = 0; row < GRAPH_ROWS; row += 1) {
    for (let col = 0; col < GRAPH_COLUMNS; col += 1) {
      const index = row * GRAPH_COLUMNS + col;
      nodes.push({
        id: `N${index + 1}`,
        row,
        col,
        x: (col - (GRAPH_COLUMNS - 1) / 2) * 1.45,
        y: 0.45 + ((row * 5 + col * 3) % 7) * 0.18 + Math.sin(row * 1.15 + col * 0.72) * 0.24,
        z: (row - (GRAPH_ROWS - 1) / 2) * 1.18
      });
    }
  }

  return nodes;
}

function createDijkstraEdges(nodes) {
  const edges = [];
  const seen = new Set();
  const indexAt = (row, col) => row * GRAPH_COLUMNS + col;
  const exists = (row, col) => row >= 0 && row < GRAPH_ROWS && col >= 0 && col < GRAPH_COLUMNS;

  const addEdge = (from, to) => {
    if (from === to) {
      return;
    }

    const key = edgeId(from, to);
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    const a = nodes[from];
    const b = nodes[to];
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    const terrain = ((from * 7 + to * 11) % 6) + 1;
    const weight = Math.max(1, Math.round(Math.hypot(dx, dy, dz) * 2 + terrain));
    edges.push([from, to, weight]);
  };

  for (let row = 0; row < GRAPH_ROWS; row += 1) {
    for (let col = 0; col < GRAPH_COLUMNS; col += 1) {
      const current = indexAt(row, col);

      if (exists(row, col + 1)) {
        addEdge(current, indexAt(row, col + 1));
      }
      if (exists(row + 1, col)) {
        addEdge(current, indexAt(row + 1, col));
      }
      if (exists(row + 1, col + 1)) {
        addEdge(current, indexAt(row + 1, col + 1));
      }
      if (exists(row + 1, col - 1)) {
        addEdge(current, indexAt(row + 1, col - 1));
      }
      if ((row + col) % 3 === 0 && exists(row, col + 2)) {
        addEdge(current, indexAt(row, col + 2));
      }
      if ((row * 2 + col) % 4 === 0 && exists(row + 2, col)) {
        addEdge(current, indexAt(row + 2, col));
      }
    }
  }

  return edges;
}

function buildBubbleSortSteps(values) {
  const working = [...values];
  const steps = [{ values: [...working], compare: [], swapped: false, sortedFrom: working.length }];

  for (let pass = 0; pass < working.length - 1; pass += 1) {
    for (let index = 0; index < working.length - pass - 1; index += 1) {
      let swapped = false;
      if (working[index] > working[index + 1]) {
        [working[index], working[index + 1]] = [working[index + 1], working[index]];
        swapped = true;
      }
      steps.push({
        values: [...working],
        compare: [index, index + 1],
        swapped,
        sortedFrom: working.length - pass - 1
      });
    }
  }

  steps.push({ values: [...working], compare: [], swapped: false, sortedFrom: 0 });
  return steps;
}

function edgeId(a, b) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function clearGroup(group) {
  while (group.children.length > 0) {
    const child = group.children[0];
    group.remove(child);
    child.traverse?.((object) => {
      object.geometry?.dispose?.();
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => disposeMaterial(material));
      } else {
        disposeMaterial(object.material);
      }
    });
  }
}

function disposeMaterial(material) {
  if (!material) {
    return;
  }

  material.map?.dispose?.();
  material.dispose?.();
}

function loadThree() {
  if (!threePromise) {
    threePromise = import("https://unpkg.com/three@0.160.0/build/three.module.js");
  }

  return threePromise;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
