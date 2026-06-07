import { bindPinchZoom, isModelPanGesture, panTargetFromPointer } from "./model-pan.js?v=20260607-site-purpose-close-v1";

const mountedModels = new WeakSet();
let threePromise = null;

const COLORS = {
  brightViolet: 0x8a2be2,
  luminousViolet: 0xbf40ff,
  softLavender: 0xc79bff,
  lavender: 0xe098ff,
  electric: 0xbf40ff,
  violet: 0x7700ff,
  indigo: 0x2b006d,
  hydrogenDeepViolet: 0x2e007a,
  hydrogenVividPurple: 0x8f00e6,
  hydrogenElectricViolet: 0x7a1af5,
  hydrogenElectricIndigo: 0x7700ff,
  deep: 0x050008
};

const MAX_ODE_POINTS = 1400;
const MAX_MONTE_CARLO_POINTS = 18000;
const HEAT_GRID_SIZE = 42;
const HEAT_CELL_SPACING = 0.46;

export function initNumericalMethodsModels(root = document) {
  root.querySelectorAll("[data-numerical-methods-model]").forEach((container) => {
    if (mountedModels.has(container)) {
      return;
    }

    mountedModels.add(container);
    new NumericalMethodsModel(container);
  });
}

class NumericalMethodsModel {
  constructor(container) {
    this.container = container;
    this.frame = container.querySelector("[data-nm-frame]") ?? container;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "numerical-methods__canvas";
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute("aria-label", this.copy("canvasLabel"));
    this.canvas.setAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight ArrowUp ArrowDown + -");
    this.frame.replaceChildren(this.canvas);

    this.state = {
      mode: "ode",
      odeModel: "projectile",
      h: 0.1,
      speed: 1,
      mcBatch: 120,
      heatMode: "point",
      heatBoundary: "insulated",
      alpha: 0.18,
      yaw: -0.55,
      pitch: 0.35,
      distance: 23,
      target: { x: 0, y: 1.5, z: 0 }
    };

    this.pointer = null;
    this.visible = true;
    this.destroyed = false;
    this.lastTimestamp = 0;
    this.odeAccumulator = 0;
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
        en: "Interactive numerical methods sandbox for Euler, Runge Kutta, Monte Carlo, and heat diffusion.",
        es: "Sandbox interactivo de metodos numericos para Euler, Runge Kutta, Monte Carlo y difusion de calor."
      },
      fallback: {
        en: "The numerical methods sandbox could not load in this browser.",
        es: "El sandbox de metodos numericos no pudo cargarse en este navegador."
      },
      odeStatus: {
        en: "Euler and RK4 (Runge-Kutta fourth-order method) step through the same ordinary differential equation.",
        es: "Euler y RK4 (Runge-Kutta de cuarto orden) avanzan por la misma ecuacion diferencial ordinaria."
      },
      mcStatus: {
        en: "Random samples estimate pi; the absolute error should shrink as the sample count grows.",
        es: "Muestras aleatorias estiman pi; el error absoluto deberia reducirse al crecer el numero de muestras."
      },
      heatStatus: {
        en: "Heat mode: click or drag directly on the grid to paint heat. Shift-drag or right-drag moves the view.",
        es: "Modo calor: haz clic o arrastra directamente sobre la red para pintar calor. Shift-arrastrar o clic derecho mueve la vista."
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
    this.scene.fog = new THREE.FogExp2(COLORS.deep, 0.026);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 140);
    this.raycaster = new THREE.Raycaster();
    this.pointerVector = new THREE.Vector2();

    this.worldGroup = new THREE.Group();
    this.odeGroup = new THREE.Group();
    this.mcGroup = new THREE.Group();
    this.heatGroup = new THREE.Group();
    this.worldGroup.add(this.odeGroup, this.mcGroup, this.heatGroup);
    this.scene.add(this.worldGroup);

    this.addLights();
    this.addBackdrop();
    this.bindControls();
    this.bindCanvas();
    this.setupObservers();
    this.resetOde();
    this.resetMonteCarlo();
    this.resetHeat();
    this.switchMode("ode");
    this.resize();
    this.updateCamera();

    this.render = this.render.bind(this);
    this.animationFrame = requestAnimationFrame(this.render);
  }

  addLights() {
    const { THREE, scene } = this;
    scene.add(new THREE.AmbientLight(COLORS.hydrogenElectricViolet, 0.54));

    const brightVioletLight = new THREE.PointLight(COLORS.brightViolet, 2.1, 95);
    brightVioletLight.position.set(-11, 12, 10);
    const violetLight = new THREE.PointLight(COLORS.hydrogenElectricViolet, 3.2, 95);
    violetLight.position.set(12, 8, -10);
    const indigoLight = new THREE.PointLight(COLORS.hydrogenElectricIndigo, 2.2, 95);
    indigoLight.position.set(0, -5, 13);
    const rimLight = new THREE.DirectionalLight(COLORS.softLavender, 1.1);
    rimLight.position.set(-7, 8, 14);
    scene.add(brightVioletLight, violetLight, indigoLight, rimLight);
  }

  addBackdrop() {
    const { THREE, scene } = this;
    const starCount = 760;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i += 1) {
      const radius = 22 + Math.random() * 36;
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = -6 + Math.random() * 22;
      positions[i * 3 + 2] = Math.sin(theta) * radius;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.starfield = new THREE.Points(starGeometry, new THREE.PointsMaterial({
      color: COLORS.luminousViolet,
      size: 0.04,
      transparent: true,
      opacity: 0.62,
      depthWrite: false
    }));
    scene.add(this.starfield);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(44, 32, 16),
      new THREE.MeshBasicMaterial({
        color: COLORS.hydrogenDeepViolet,
        transparent: true,
        opacity: 0.16,
        side: THREE.BackSide,
        depthWrite: false
      })
    );
    scene.add(halo);
  }

  bindControls() {
    this.statusNode = this.container.querySelector("[data-nm-status]");
    this.valueNodes = new Map();
    this.container.querySelectorAll("[data-nm-value]").forEach((node) => {
      this.valueNodes.set(node.dataset.nmValue, node);
    });

    this.displayNodes = new Map();
    this.container.querySelectorAll("[data-nm-display]").forEach((node) => {
      this.displayNodes.set(node.dataset.nmDisplay, node);
    });

    this.container.querySelectorAll("[data-nm-mode]").forEach((button) => {
      button.addEventListener("click", () => this.switchMode(button.dataset.nmMode));
    });

    this.odeSelect = this.container.querySelector("[data-nm-ode-model]");
    this.odeSelect?.addEventListener("change", () => {
      this.state.odeModel = this.odeSelect.value;
      this.resetOde();
      this.syncControlLabels();
    });

    this.heatSelect = this.container.querySelector("[data-nm-heat-mode]");
    this.heatSelect?.addEventListener("change", () => {
      this.state.heatMode = this.heatSelect.value;
      this.resetHeat();
      this.syncControlLabels();
    });

    this.heatBoundarySelect = this.container.querySelector("[data-nm-heat-boundary]");
    this.heatBoundarySelect?.addEventListener("change", () => {
      this.state.heatBoundary = this.heatBoundarySelect.value;
      this.syncControlLabels();
    });

    this.container.querySelectorAll("[data-nm-param]").forEach((control) => {
      control.addEventListener("input", () => {
        const key = control.dataset.nmParam;
        const value = Number(control.value);

        if (key === "h") {
          this.state.h = clamp(value, 0.02, 0.35);
          this.resetOde();
        } else if (key === "speed") {
          this.state.speed = clamp(value, 0.2, 3);
        } else if (key === "mcBatch") {
          this.state.mcBatch = clamp(value, 20, 600);
        } else if (key === "alpha") {
          this.state.alpha = clamp(value, 0.04, 0.24);
        }

        this.syncControlLabels();
      });
    });

    this.container.querySelector("[data-nm-action='reset-ode']")?.addEventListener("click", () => this.resetOde());
    this.container.querySelector("[data-nm-action='reset-mc']")?.addEventListener("click", () => this.resetMonteCarlo());
    this.container.querySelector("[data-nm-action='reset-heat']")?.addEventListener("click", () => this.resetHeat());
    this.syncControlLabels();
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

      if (this.state.mode === "heat") {
        this.pointer = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          paintingHeat: true
        };
        this.canvas.setPointerCapture?.(event.pointerId);
        this.injectHeatFromPointer(event, 215);
        return;
      }

      this.pointer = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        startX: event.clientX,
        startY: event.clientY,
        dragged: false
      };
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

      if (this.pointer.paintingHeat) {
        this.injectHeatFromPointer(event, 195);
        return;
      }

      if (Math.abs(event.clientX - this.pointer.startX) + Math.abs(event.clientY - this.pointer.startY) > 5) {
        this.pointer.dragged = true;
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
      this.state.distance = clamp(this.state.distance + Math.sign(event.deltaY) * 1.5, 9, 62);
      this.updateCamera();
    };

    bindPinchZoom(this.canvas, {
      getValue: () => this.state.distance,
      setValue: (value) => {
        this.state.distance = value;
      },
      min: 9,
      max: 62,
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
        this.state.distance = clamp(this.state.distance - 1.5, 9, 62);
      } else if (event.key === "-" || event.key === "_") {
        this.state.distance = clamp(this.state.distance + 1.5, 9, 62);
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
    if (!["ode", "mc", "heat"].includes(mode)) {
      return;
    }

    this.state.mode = mode;
    this.odeGroup.visible = mode === "ode";
    this.mcGroup.visible = mode === "mc";
    this.heatGroup.visible = mode === "heat";

    this.container.querySelectorAll("[data-nm-mode]").forEach((button) => {
      const isActive = button.dataset.nmMode === mode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    this.container.querySelectorAll("[data-nm-panel]").forEach((panel) => {
      panel.classList.toggle("is-hidden", panel.dataset.nmPanel !== mode);
    });

    this.container.querySelectorAll("[data-nm-metrics]").forEach((panel) => {
      panel.classList.toggle("is-hidden", panel.dataset.nmMetrics !== mode);
    });

    if (mode === "ode") {
      this.setStatus(this.copy("odeStatus"));
      this.canvas.dataset.nmInteraction = "orbit";
      this.setCameraPreset(-0.55, 0.35, 23, 0, 1.5, 0);
    } else if (mode === "mc") {
      this.setStatus(this.copy("mcStatus"));
      this.canvas.dataset.nmInteraction = "orbit";
      this.setCameraPreset(-0.55, 0.48, 12, 0, 1.2, 0);
    } else {
      this.setStatus(this.copy("heatStatus"));
      this.canvas.dataset.nmInteraction = "paint";
      this.setCameraPreset(-0.7, 0.72, 32, 0, 1.2, 0);
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

  syncControlLabels() {
    this.setDisplay("h", this.state.h.toFixed(2));
    this.setDisplay("speed", `${this.state.speed.toFixed(1)}x`);
    this.setDisplay("mcBatch", `${Math.round(this.state.mcBatch)}`);
    this.setDisplay("alpha", this.state.alpha.toFixed(2));
    this.setValue("alpha", this.state.alpha.toFixed(2));
    this.setValue("stability", `${this.state.alpha.toFixed(2)} / 0.25`);
    if (this.isSpanish) {
      this.setValue("boundary", this.state.heatBoundary === "insulated" ? "aislada" : "fria fija");
    } else {
      this.setValue("boundary", this.state.heatBoundary === "insulated" ? "insulated" : "fixed edge");
    }
  }

  setDisplay(key, value) {
    const node = this.displayNodes.get(key);
    if (node) {
      node.textContent = value;
    }
  }

  resetOde() {
    if (!this.THREE) {
      return;
    }

    disposeChildren(this.odeGroup);
    this.odeAccumulator = 0;
    const model = this.getOdeModel();
    this.ode = {
      model,
      t: 0,
      index: 0,
      euler: model.initial.slice(),
      rk4: model.initial.slice()
    };

    this.ode.referenceLine = this.createLine(COLORS.luminousViolet, 0.78);
    this.ode.eulerLine = this.createLine(COLORS.hydrogenVividPurple, 0.82);
    this.ode.rk4Line = this.createLine(COLORS.hydrogenElectricIndigo, 0.92);
    this.ode.errorSegment = this.createSegment(COLORS.brightViolet, 0.56);
    this.odeGroup.add(
      this.createGrid(25, 32, -0.04, 0.24),
      this.createEquationHalo(),
      this.ode.referenceLine,
      this.ode.eulerLine,
      this.ode.rk4Line,
      this.ode.errorSegment
    );

    this.ode.referenceMarker = this.createMarker(COLORS.luminousViolet, 0.14);
    this.ode.eulerMarker = this.createMarker(COLORS.hydrogenVividPurple, 0.18);
    this.ode.rk4Marker = this.createMarker(COLORS.hydrogenElectricIndigo, 0.2);
    this.odeGroup.add(this.ode.referenceMarker, this.ode.eulerMarker, this.ode.rk4Marker);
    this.updateOdeMetrics(0, 0);
  }

  getOdeModel() {
    const selected = this.state.odeModel;

    if (selected === "oscillator") {
      const k = 3.1;
      const c = 0.34;
      return {
        duration: 14,
        initial: [5, 0, 0, 0, 4.6, 0],
        derivative: (_t, y) => [
          y[3],
          y[4],
          y[5],
          -k * y[0] - c * y[3],
          -k * y[1] - c * y[4],
          0
        ],
        position: (y) => [y[0], y[1], y[2]],
        reference: (t) => {
          const omega = Math.sqrt(Math.max(k - (c * c / 4), 0.001));
          const decay = Math.exp(-c * t / 2);
          const solve = (x0, v0) => decay * (x0 * Math.cos(omega * t) + ((v0 + c * x0 / 2) / omega) * Math.sin(omega * t));
          return [solve(5, 0), solve(0, 4.6), 0];
        }
      };
    }

    if (selected === "lorenz") {
      const sigma = 10;
      const rho = 28;
      const beta = 8 / 3;
      return {
        duration: 28,
        maxH: 0.012,
        initial: [0.1, 0, 0],
        derivative: (_t, y) => [
          sigma * (y[1] - y[0]),
          y[0] * (rho - y[2]) - y[1],
          y[0] * y[1] - beta * y[2]
        ],
        position: (y) => [y[0] * 0.38, y[2] * 0.18 - 3, y[1] * 0.38],
        reference: null
      };
    }

    return {
      duration: 3.2,
      initial: [-8, 0, -4, 6.4, 10.8, 3.2],
      derivative: (_t, y) => [y[3], y[4], y[5], 0, -9.8, 0],
      position: (y) => [y[0], y[1], y[2]],
      reference: (t) => [
        -8 + 6.4 * t,
        10.8 * t - 4.9 * t * t,
        -4 + 3.2 * t
      ]
    };
  }

  createLine(color, opacity) {
    const { THREE } = this;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(MAX_ODE_POINTS * 3);
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setDrawRange(0, 0);
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity
    }));
    line.add(new THREE.Points(geometry, new THREE.PointsMaterial({
      color,
      size: 0.105,
      transparent: true,
      opacity: Math.min(opacity + 0.12, 1),
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })));
    return line;
  }

  createSegment(color, opacity) {
    const { THREE } = this;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
    return new THREE.Line(geometry, new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending
    }));
  }

  createEquationHalo() {
    const { THREE } = this;
    const group = new THREE.Group();
    const rings = [
      { radius: 7.5, color: COLORS.hydrogenElectricViolet, opacity: 0.24 },
      { radius: 10.6, color: COLORS.hydrogenDeepViolet, opacity: 0.18 },
      { radius: 13.2, color: COLORS.brightViolet, opacity: 0.1 }
    ];

    rings.forEach(({ radius, color, opacity }, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.018, 8, 160),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -0.03 - index * 0.02;
      group.add(ring);
    });

    return group;
  }

  createMarker(color, radius) {
    const { THREE } = this;
    const group = new THREE.Group();
    group.add(new THREE.Mesh(
      new THREE.SphereGeometry(radius, 18, 14),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.96
      })
    ));
    const glow = this.createGlowSprite(color, radius * 9, 0.5);
    group.add(glow);
    return group;
  }

  createGlowSprite(color, size, opacity) {
    const { THREE } = this;
    if (!this.glowTexture) {
      const canvas = document.createElement("canvas");
      canvas.width = 96;
      canvas.height = 96;
      const context = canvas.getContext("2d");
      const gradient = context.createRadialGradient(48, 48, 0, 48, 48, 48);
      gradient.addColorStop(0, "rgba(199,155,255,1)");
      gradient.addColorStop(0.28, "rgba(199,155,255,0.7)");
      gradient.addColorStop(0.62, "rgba(199,155,255,0.18)");
      gradient.addColorStop(1, "rgba(199,155,255,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 96, 96);
      this.glowTexture = new THREE.CanvasTexture(canvas);
    }

    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this.glowTexture,
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    sprite.scale.set(size, size, 1);
    return sprite;
  }

  updateOde(dt) {
    if (!this.ode) {
      return;
    }

    this.odeAccumulator += dt * this.state.speed;
    let steps = 0;
    const frameInterval = 0.06;

    while (this.odeAccumulator >= frameInterval && steps < 6) {
      this.odeAccumulator -= frameInterval;
      this.stepOde();
      steps += 1;
    }
  }

  stepOde() {
    const { model } = this.ode;

    if (this.ode.index >= MAX_ODE_POINTS || this.ode.t > model.duration) {
      this.resetOde();
      return;
    }

    const t = this.ode.t;
    const eulerPos = model.position(this.ode.euler);
    const rk4Pos = model.position(this.ode.rk4);
    const referencePos = model.reference ? model.reference(t) : rk4Pos;
    this.writeLinePoint(this.ode.eulerLine, this.ode.index, eulerPos);
    this.writeLinePoint(this.ode.rk4Line, this.ode.index, rk4Pos);
    this.writeLinePoint(this.ode.referenceLine, this.ode.index, referencePos);
    this.ode.eulerMarker.position.set(...eulerPos);
    this.ode.rk4Marker.position.set(...rk4Pos);
    this.ode.referenceMarker.position.set(...referencePos);
    this.writeSegment(this.ode.errorSegment, eulerPos, referencePos);

    const eulerError = distance3(eulerPos, referencePos);
    const rk4Error = model.reference ? distance3(rk4Pos, referencePos) : distance3(eulerPos, rk4Pos);
    this.updateOdeMetrics(eulerError, rk4Error);

    const h = Math.min(this.state.h, model.maxH ?? this.state.h);
    const nextEuler = eulerStep(this.ode.euler, t, h, model.derivative);
    const nextRk4 = rk4Step(this.ode.rk4, t, h, model.derivative);

    if (!allFinite(nextEuler) || !allFinite(nextRk4)) {
      this.resetOde();
      return;
    }

    this.ode.euler = nextEuler;
    this.ode.rk4 = nextRk4;
    this.ode.t += h;
    this.ode.index += 1;
  }

  writeLinePoint(line, index, point) {
    const attribute = line.geometry.attributes.position;
    attribute.array[index * 3] = point[0];
    attribute.array[index * 3 + 1] = point[1];
    attribute.array[index * 3 + 2] = point[2];
    attribute.needsUpdate = true;
    line.geometry.setDrawRange(0, index + 1);
  }

  writeSegment(segment, start, end) {
    const attribute = segment.geometry.attributes.position;
    attribute.array[0] = start[0];
    attribute.array[1] = start[1];
    attribute.array[2] = start[2];
    attribute.array[3] = end[0];
    attribute.array[4] = end[1];
    attribute.array[5] = end[2];
    attribute.needsUpdate = true;
  }

  updateOdeMetrics(eulerError, rk4Error) {
    this.setValue("eulerError", eulerError.toFixed(3));
    this.setValue("rk4Error", rk4Error.toFixed(4));
    const ratio = rk4Error > 1e-8 ? eulerError / rk4Error : 0;
    if (ratio > 0) {
      this.setValue("convergence", ratio > 1
        ? (this.isSpanish ? `Euler ≈ ${ratio.toFixed(1)}x mayor` : `Euler ≈ ${ratio.toFixed(1)}x larger`)
        : (this.isSpanish ? "Errores similares en este paso" : "Errors are similar at this step"));
    } else {
      this.setValue("convergence", this.isSpanish ? "Esperando datos" : "Waiting for data");
    }
  }

  resetMonteCarlo() {
    if (!this.THREE) {
      return;
    }

    disposeChildren(this.mcGroup);
    const { THREE } = this;
    this.mc = {
      total: 0,
      inside: 0,
      cursor: 0,
      positions: new Float32Array(MAX_MONTE_CARLO_POINTS * 3),
      colors: new Float32Array(MAX_MONTE_CARLO_POINTS * 3)
    };

    this.mcGroup.add(this.createGrid(9.5, 16, -0.02, 0.2));
    this.mcGroup.add(this.createMonteCarloFloor());
    this.mcGroup.add(this.createSquareOutline(8));
    this.mcGroup.add(this.createCircleOutline(4));

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(this.mc.positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(this.mc.colors, 3));
    geometry.setDrawRange(0, 0);

    this.mc.points = new THREE.Points(geometry, new THREE.PointsMaterial({
      size: 0.095,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    this.mcGroup.add(this.mc.points);
    this.updateMonteCarloMetrics();
  }

  createMonteCarloFloor() {
    const { THREE } = this;
    const group = new THREE.Group();
    const square = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8),
      new THREE.MeshBasicMaterial({
        color: COLORS.hydrogenDeepViolet,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    square.rotation.x = -Math.PI / 2;
    square.position.y = -0.035;

    const circle = new THREE.Mesh(
      new THREE.CircleGeometry(4, 128),
      new THREE.MeshBasicMaterial({
        color: COLORS.brightViolet,
        transparent: true,
        opacity: 0.085,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    circle.rotation.x = -Math.PI / 2;
    circle.position.y = -0.025;
    group.add(square, circle);
    return group;
  }

  createSquareOutline(size) {
    const { THREE } = this;
    const h = size / 2;
    const points = [
      [-h, 0, -h], [h, 0, -h],
      [h, 0, -h], [h, 0, h],
      [h, 0, h], [-h, 0, h],
      [-h, 0, h], [-h, 0, -h]
    ];
    return new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(points.map((point) => new THREE.Vector3(...point))),
      new THREE.LineBasicMaterial({
        color: COLORS.hydrogenElectricViolet,
        transparent: true,
        opacity: 0.68
      })
    );
  }

  createCircleOutline(radius) {
    const { THREE } = this;
    const points = [];

    for (let i = 0; i < 160; i += 1) {
      const a = i / 160 * Math.PI * 2;
      const b = (i + 1) / 160 * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * radius, 0.03, Math.sin(a) * radius));
      points.push(new THREE.Vector3(Math.cos(b) * radius, 0.03, Math.sin(b) * radius));
    }

    return new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({
        color: COLORS.brightViolet,
        transparent: true,
        opacity: 0.56
      })
    );
  }

  updateMonteCarlo() {
    if (!this.mc) {
      return;
    }

    const insideColor = new this.THREE.Color(COLORS.brightViolet);
    const insideAltColor = new this.THREE.Color(COLORS.hydrogenElectricViolet);
    const outsideColor = new this.THREE.Color(COLORS.hydrogenDeepViolet);
    const outsideAltColor = new this.THREE.Color(COLORS.indigo);
    const batch = Math.round(this.state.mcBatch);

    for (let i = 0; i < batch; i += 1) {
      const x = Math.random() * 8 - 4;
      const z = Math.random() * 8 - 4;
      const inside = x * x + z * z <= 16;
      const slot = this.mc.cursor % MAX_MONTE_CARLO_POINTS;
      const color = inside
        ? insideColor.clone().lerp(insideAltColor, Math.random() * 0.55)
        : outsideColor.clone().lerp(outsideAltColor, Math.random() * 0.6);
      const layer = Math.floor((slot % 4200) / 700) * 0.16 + Math.random() * 0.055;

      this.mc.positions[slot * 3] = x;
      this.mc.positions[slot * 3 + 1] = layer;
      this.mc.positions[slot * 3 + 2] = z;
      this.mc.colors[slot * 3] = color.r;
      this.mc.colors[slot * 3 + 1] = color.g;
      this.mc.colors[slot * 3 + 2] = color.b;

      this.mc.total += 1;
      if (inside) {
        this.mc.inside += 1;
      }
      this.mc.cursor += 1;
    }

    this.mc.points.geometry.attributes.position.needsUpdate = true;
    this.mc.points.geometry.attributes.color.needsUpdate = true;
    this.mc.points.geometry.setDrawRange(0, Math.min(this.mc.cursor, MAX_MONTE_CARLO_POINTS));
    this.updateMonteCarloMetrics();
  }

  updateMonteCarloMetrics() {
    const pi = this.mc?.total ? 4 * this.mc.inside / this.mc.total : 0;
    const p = this.mc?.total ? this.mc.inside / this.mc.total : 0;
    const standardError = this.mc?.total ? 4 * Math.sqrt(Math.max(p * (1 - p), 0) / this.mc.total) : 0;
    const interval = standardError ? 1.96 * standardError : 0;
    this.setValue("pi", pi ? pi.toFixed(5) : "0.00000");
    this.setValue("mcError", pi ? Math.abs(pi - Math.PI).toFixed(5) : "0.00000");
    this.setValue("mcCi", interval ? `±${interval.toFixed(4)}` : "±0.0000");
    this.setValue("samples", String(this.mc?.total ?? 0));
  }

  resetHeat() {
    if (!this.THREE) {
      return;
    }

    disposeChildren(this.heatGroup);
    const { THREE } = this;
    const size = HEAT_GRID_SIZE * HEAT_GRID_SIZE;
    this.heat = {
      grid: new Float32Array(size),
      next: new Float32Array(size)
    };

    this.seedHeat();
    this.heatGroup.add(this.createGrid(20.5, HEAT_GRID_SIZE, -0.04, 0.18));

    const geometry = new THREE.CylinderGeometry(0.21, 0.24, 1, 6);
    const material = new THREE.MeshLambertMaterial({
      color: COLORS.hydrogenElectricViolet,
      emissive: COLORS.hydrogenDeepViolet,
      emissiveIntensity: 0.36
    });
    this.heat.mesh = new THREE.InstancedMesh(geometry, material, size);
    this.heat.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.heatGroup.add(this.heat.mesh);
    this.createHeatGlowPoints();
    this.heat.brush = new THREE.Mesh(
      new THREE.TorusGeometry(HEAT_CELL_SPACING * 3.8, 0.018, 8, 96),
      new THREE.MeshBasicMaterial({
        color: COLORS.brightViolet,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    this.heat.brush.rotation.x = Math.PI / 2;
    this.heatGroup.add(this.heat.brush);
    this.updateHeatVisuals();
  }

  createHeatGlowPoints() {
    const { THREE } = this;
    const count = HEAT_GRID_SIZE * HEAT_GRID_SIZE;
    this.heat.glowPositions = new Float32Array(count * 3);
    this.heat.glowColors = new Float32Array(count * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(this.heat.glowPositions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(this.heat.glowColors, 3));
    this.heat.glowPoints = new THREE.Points(geometry, new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.84,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    this.heatGroup.add(this.heat.glowPoints);
  }

  seedHeat() {
    const n = HEAT_GRID_SIZE;
    const center = Math.floor(n / 2);
    this.heat.grid.fill(0);
    this.heat.next.fill(0);

    if (this.state.heatMode === "checker") {
      for (let row = 6; row < n - 6; row += 1) {
        for (let col = 6; col < n - 6; col += 1) {
          this.heat.grid[row * n + col] = (row + col) % 2 === 0 ? 112 : 24;
        }
      }
      return;
    }

    if (this.state.heatMode === "random") {
      for (let row = 2; row < n - 2; row += 1) {
        for (let col = 2; col < n - 2; col += 1) {
          this.heat.grid[row * n + col] = Math.random() * 115;
        }
      }
      return;
    }

    this.injectHeat(center, center, 230);
  }

  updateHeat() {
    if (!this.heat?.mesh) {
      return;
    }

    const n = HEAT_GRID_SIZE;
    const alpha = clamp(this.state.alpha, 0.04, 0.24);

    for (let pass = 0; pass < 2; pass += 1) {
      this.heat.next.fill(0);

      for (let row = 1; row < n - 1; row += 1) {
        for (let col = 1; col < n - 1; col += 1) {
          const index = row * n + col;
          const value = this.heat.grid[index];
          const laplacian = (
            this.heat.grid[index - n]
            + this.heat.grid[index + n]
            + this.heat.grid[index - 1]
            + this.heat.grid[index + 1]
            - 4 * value
          );
          this.heat.next[index] = Math.max(0, (value + alpha * laplacian) * 0.996);
        }
      }

      this.applyHeatBoundary(this.heat.next);

      [this.heat.grid, this.heat.next] = [this.heat.next, this.heat.grid];
    }

    this.updateHeatVisuals();
  }

  updateHeatVisuals() {
    const { THREE } = this;
    const n = HEAT_GRID_SIZE;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const glowColor = new THREE.Color();
    let total = 0;

    for (let row = 0; row < n; row += 1) {
      for (let col = 0; col < n; col += 1) {
        const index = row * n + col;
        const value = this.heat.grid[index];
        const heatT = clamp(value / 190, 0, 1);
        const height = Math.max(0.035, value * 0.055);
        total += value;

        const x = (col - n / 2) * HEAT_CELL_SPACING;
        const z = (row - n / 2) * HEAT_CELL_SPACING;
        dummy.position.set(x, height / 2, z);
        dummy.scale.set(1, height, 1);
        dummy.updateMatrix();
        this.heat.mesh.setMatrixAt(index, dummy.matrix);

        setHeatColor(color, heatT, this.THREE);
        this.heat.mesh.setColorAt(index, color);

        this.heat.glowPositions[index * 3] = x;
        this.heat.glowPositions[index * 3 + 1] = height + 0.08 + heatT * 0.24;
        this.heat.glowPositions[index * 3 + 2] = z;
        setHeatColor(glowColor, clamp(heatT * 1.16, 0, 1), this.THREE);
        const glowStrength = heatT > 0.08 ? heatT : 0;
        this.heat.glowColors[index * 3] = glowColor.r * glowStrength;
        this.heat.glowColors[index * 3 + 1] = glowColor.g * glowStrength;
        this.heat.glowColors[index * 3 + 2] = glowColor.b * glowStrength;
      }
    }

    this.heat.mesh.instanceMatrix.needsUpdate = true;
    if (this.heat.mesh.instanceColor) {
      this.heat.mesh.instanceColor.needsUpdate = true;
    }
    this.heat.glowPoints.geometry.attributes.position.needsUpdate = true;
    this.heat.glowPoints.geometry.attributes.color.needsUpdate = true;

    this.setValue("heatAvg", (total / (n * n)).toFixed(2));
    this.setValue("alpha", this.state.alpha.toFixed(2));
    this.setValue("stability", `${this.state.alpha.toFixed(2)} / 0.25`);
    this.setValue("stabilityNote", this.state.alpha <= 0.25
      ? (this.isSpanish ? "estable para este paso explícito" : "stable for this explicit step")
      : (this.isSpanish ? "fuera del rango estable" : "outside stable range"));
  }

  injectHeatFromPointer(event, intensity = 185) {
    if (!this.heat?.mesh) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    this.pointerVector.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerVector.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    this.raycaster.setFromCamera(this.pointerVector, this.camera);
    const hits = this.raycaster.intersectObject(this.heat.mesh);

    if (!hits.length || hits[0].instanceId == null) {
      return;
    }

    const index = hits[0].instanceId;
    const row = Math.floor(index / HEAT_GRID_SIZE);
    const col = index % HEAT_GRID_SIZE;
    this.injectHeat(row, col, intensity);
    if (this.heat.brush) {
      this.heat.brush.position.set(
        (col - HEAT_GRID_SIZE / 2) * HEAT_CELL_SPACING,
        0.08,
        (row - HEAT_GRID_SIZE / 2) * HEAT_CELL_SPACING
      );
      this.heat.brush.material.opacity = 0.72;
    }
    this.updateHeatVisuals();
  }

  injectHeat(row, col, value) {
    const n = HEAT_GRID_SIZE;
    const radius = 4;

    for (let dr = -radius; dr <= radius; dr += 1) {
      for (let dc = -radius; dc <= radius; dc += 1) {
        const r = row + dr;
        const c = col + dc;

        if (r <= 0 || r >= n - 1 || c <= 0 || c >= n - 1) {
          continue;
        }

        const distance = Math.hypot(dr, dc);
        if (distance > radius) {
          continue;
        }

        const falloff = Math.exp(-(distance * distance) / 7.5);
        const heat = value * falloff;
        this.heat.grid[r * n + c] = Math.max(this.heat.grid[r * n + c], heat);
      }
    }
  }

  applyHeatBoundary(target) {
    if (this.state.heatBoundary !== "insulated") {
      return;
    }

    const n = HEAT_GRID_SIZE;
    for (let col = 1; col < n - 1; col += 1) {
      target[col] = target[n + col];
      target[(n - 1) * n + col] = target[(n - 2) * n + col];
    }

    for (let row = 1; row < n - 1; row += 1) {
      target[row * n] = target[row * n + 1];
      target[row * n + n - 1] = target[row * n + n - 2];
    }

    target[0] = target[n + 1];
    target[n - 1] = target[2 * n - 2];
    target[(n - 1) * n] = target[(n - 2) * n + 1];
    target[n * n - 1] = target[(n - 1) * n - 2];
  }

  createGrid(size, divisions, y, opacity) {
    const { THREE } = this;
    const half = size / 2;
    const minorPositions = [];
    const majorPositions = [];
    const axisPositions = [];
    const axisIndex = divisions / 2;
    const majorInterval = Math.max(2, Math.round(divisions / 8));

    const pushLine = (target, x1, z1, x2, z2) => {
      target.push(x1, y, z1, x2, y, z2);
    };

    for (let i = 0; i <= divisions; i += 1) {
      const a = -half + size * i / divisions;
      const target = i === axisIndex
        ? axisPositions
        : i % majorInterval === 0
          ? majorPositions
          : minorPositions;

      pushLine(target, -half, a, half, a);
      pushLine(target, a, -half, a, half);
    }

    const createLayer = (positions, color, layerOpacity) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: layerOpacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      }));
    };

    const grid = new THREE.Group();
    grid.add(
      createLayer(minorPositions, COLORS.lavender, Math.max(opacity, 0.42)),
      createLayer(majorPositions, COLORS.electric, Math.max(opacity + 0.18, 0.62)),
      createLayer(axisPositions, COLORS.brightViolet, Math.max(opacity + 0.28, 0.76))
    );
    return grid;
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
      if (this.state.mode === "ode") {
        this.updateOde(dt);
      } else if (this.state.mode === "mc") {
        this.updateMonteCarlo();
      } else {
        this.updateHeat();
      }

      if (this.starfield) {
        this.starfield.rotation.y += dt * 0.025;
      }

      if (this.heat?.brush?.material.opacity > 0) {
        this.heat.brush.material.opacity = Math.max(0, this.heat.brush.material.opacity - dt * 1.45);
        this.heat.brush.rotation.z += dt * 0.9;
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

function eulerStep(y, t, h, derivative) {
  const dy = derivative(t, y);
  return y.map((value, index) => value + h * dy[index]);
}

function rk4Step(y, t, h, derivative) {
  const k1 = derivative(t, y);
  const y2 = y.map((value, index) => value + h * k1[index] / 2);
  const k2 = derivative(t + h / 2, y2);
  const y3 = y.map((value, index) => value + h * k2[index] / 2);
  const k3 = derivative(t + h / 2, y3);
  const y4 = y.map((value, index) => value + h * k3[index]);
  const k4 = derivative(t + h, y4);

  return y.map((value, index) => value + h * (k1[index] + 2 * k2[index] + 2 * k3[index] + k4[index]) / 6);
}

function distance3(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function allFinite(values) {
  return values.every((value) => Number.isFinite(value));
}

function setHeatColor(target, t, THREE) {
  const stops = [
    [0, COLORS.deep],
    [0.36, COLORS.hydrogenDeepViolet],
    [0.62, COLORS.hydrogenElectricIndigo],
    [0.82, COLORS.hydrogenElectricViolet],
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
