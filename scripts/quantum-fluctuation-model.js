import { bindPinchZoom, isModelPanGesture, panTargetFromPointer } from "./model-pan.js?v=20260524-personal-cosmology-subareas-v1";

const mountedModels = new WeakSet();
let threePromise = null;

const COLORS = {
  hotPink: 0xff00a2,
  strongPink: 0xff58d6,
  electric: 0xbf40ff,
  violet: 0x7700ff,
  indigo: 0x2b006d,
  deep: 0x050008
};

const GRID_SIZE = 9.4;
const GRID_SEGMENTS = 58;
const MODE_INDEX_LIMIT = 7;

export function initQuantumFluctuationModels(root = document) {
  root.querySelectorAll("[data-quantum-fluctuation-model]").forEach((container) => {
    if (mountedModels.has(container)) {
      return;
    }

    mountedModels.add(container);
    new QuantumFluctuationModel(container);
  });
}

class QuantumFluctuationModel {
  constructor(container) {
    this.container = container;
    this.frame = container.querySelector("[data-qf-frame]") ?? container;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "quantum-fluctuation__canvas";
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute("aria-label", this.copy("canvasLabel"));
    this.frame.replaceChildren(this.canvas, this.createHint());

    this.state = {
      scale: Number(container.querySelector("[data-qf-param='scale']")?.value ?? 1.15),
      correlation: Number(container.querySelector("[data-qf-param='correlation']")?.value ?? 1.4),
      cutoff: Number(container.querySelector("[data-qf-param='cutoff']")?.value ?? 3.4),
      yaw: -0.72,
      pitch: 0.42,
      distance: 10.4,
      target: { x: 0, y: 0, z: 0 }
    };

    this.pointer = null;
    this.sampleSeed = 1900;
    this.readoutCache = {};
    this.visible = true;
    this.destroyed = false;
    this.time = 0;
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
        en: "Interactive quantum fluctuation field model.",
        es: "Modelo interactivo de campo con fluctuaciones cuanticas."
      },
      fallback: {
        en: "The quantum fluctuation model could not load in this browser.",
        es: "El modelo de fluctuaciones cuanticas no pudo cargar en este navegador."
      },
      hint: {
        en: "drag to rotate · Shift/Alt or right-drag to move · scroll to zoom",
        es: "arrastra para rotar · Shift/Alt o clic derecho para mover · desplaza para acercar"
      }
    };

    return content[key][this.isSpanish ? "es" : "en"];
  }

  createHint() {
    const hint = document.createElement("span");
    hint.className = "quantum-fluctuation__hint";
    hint.textContent = this.copy("hint");
    return hint;
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
    this.scene.fog = new THREE.FogExp2(COLORS.deep, 0.032);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(44, 1, 0.1, 80);
    this.worldGroup = new THREE.Group();
    this.worldGroup.rotation.y = -0.18;
    this.scene.add(this.worldGroup);

    this.addLights();
    this.addStars();
    this.addField();
    this.bindControls();
    this.bindInteraction();
    this.setupObservers();
    this.resize();
    updateField(this);

    this.render = this.render.bind(this);
    this.animationFrame = requestAnimationFrame(this.render);
  }

  addLights() {
    const { THREE, scene } = this;
    scene.add(new THREE.AmbientLight(0x8f00e6, 0.82));

    const key = new THREE.PointLight(COLORS.hotPink, 5.8, 34);
    key.position.set(-4.6, 5.8, 4.4);
    scene.add(key);

    const rim = new THREE.PointLight(COLORS.violet, 4.4, 34);
    rim.position.set(4.4, 3.6, -5.4);
    scene.add(rim);
  }

  addStars() {
    const { THREE, scene } = this;
    const rng = createRng(2718);
    const count = 260;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const radius = 12 + rng() * 18;
      const theta = rng() * Math.PI * 2;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = -1.2 + rng() * 9.4;
      positions[i * 3 + 2] = Math.sin(theta) * radius;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: COLORS.strongPink,
      size: 0.032,
      transparent: true,
      opacity: 0.56,
      depthWrite: false
    });

    this.stars = new THREE.Points(geometry, material);
    scene.add(this.stars);
  }

  addField() {
    const { THREE, worldGroup } = this;
    const geometry = createFieldGeometry(THREE);
    this.base = geometry.userData.base;
    this.modes = createModes(this.sampleSeed);

    const colors = new Float32Array(geometry.attributes.position.count * 3);
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: true,
      metalness: 0.08,
      roughness: 0.42,
      emissive: COLORS.indigo,
      emissiveIntensity: 0.46,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92
    });

    const wireMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.electric,
      wireframe: true,
      transparent: true,
      opacity: 0.36,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.fieldMesh = new THREE.Mesh(geometry, material);
    this.fieldWire = new THREE.Mesh(geometry, wireMaterial);
    worldGroup.add(this.fieldMesh, this.fieldWire);
  }

  bindControls() {
    this.container.querySelectorAll("[data-qf-param]").forEach((input) => {
      const key = input.dataset.qfParam;
      this.syncValue(key, Number(input.value));
      input.addEventListener("input", () => {
        this.state[key] = Number(input.value);
        this.syncValue(key, this.state[key]);
      });
    });

    this.container.querySelector("[data-qf-action='resample']")?.addEventListener("click", () => {
      this.sampleSeed += 101;
      this.modes = createModes(this.sampleSeed);
      this.time = 0;
      updateField(this);
      this.updateReadout();
    });
  }

  bindInteraction() {
    this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());

    this.canvas.addEventListener("pointerdown", (event) => {
      this.canvas.focus({ preventScroll: true });
      this.pointer = {
        id: event.pointerId,
        mode: isModelPanGesture(event) ? "pan" : "rotate",
        x: event.clientX,
        y: event.clientY,
        yaw: this.state.yaw,
        pitch: this.state.pitch,
        target: { ...this.state.target }
      };
      this.canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
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
          distance: this.state.distance,
          scale: 0.0018
        });
      } else {
        this.state.yaw = this.pointer.yaw - (event.clientX - this.pointer.x) * 0.008;
        this.state.pitch = clamp(this.pointer.pitch + (event.clientY - this.pointer.y) * 0.006, -1.05, 1.05);
      }

      this.updateCamera();
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
      this.state.distance = clamp(this.state.distance + event.deltaY * 0.01, 5.2, 20);
      this.updateCamera();
      event.preventDefault();
    }, { passive: false });

    bindPinchZoom(this.canvas, {
      getValue: () => this.state.distance,
      setValue: (value) => {
        this.state.distance = value;
      },
      min: 5.2,
      max: 20,
      inverted: true,
      onStart: () => {
        this.pointer = null;
      },
      onChange: () => this.updateCamera()
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
    if (!this.renderer || !this.camera) {
      return;
    }

    const rect = this.frame.getBoundingClientRect();
    const width = Math.max(320, Math.floor(rect.width));
    const height = Math.max(270, Math.floor(rect.height || width * 0.62));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.updateCamera();
  }

  updateCamera() {
    const { camera, state } = this;
    if (!camera) {
      return;
    }

    const cp = Math.cos(state.pitch);
    camera.position.set(
      state.target.x + Math.sin(state.yaw) * cp * state.distance,
      state.target.y + Math.sin(state.pitch) * state.distance,
      state.target.z + Math.cos(state.yaw) * cp * state.distance
    );
    camera.lookAt(state.target.x, state.target.y, state.target.z);
  }

  update(deltaTime) {
    const motionScale = document.body.dataset.motion === "reduced" ? 0.45 : 1;
    const scaledDelta = deltaTime * motionScale;

    this.time += scaledDelta;
    this.stars.rotation.y += scaledDelta * 0.012;
    updateField(this);
  }

  render(timestamp) {
    if (this.destroyed) {
      return;
    }

    const deltaTime = this.lastTimestamp ? Math.min((timestamp - this.lastTimestamp) / 1000, 0.05) : 0.016;
    this.lastTimestamp = timestamp;

    if (this.visible) {
      this.update(deltaTime);
      this.updateCamera();
      this.renderer.render(this.scene, this.camera);
    }

    this.animationFrame = requestAnimationFrame(this.render);
  }

  syncValue(key, value) {
    const target = this.container.querySelector(`[data-qf-value='${key}']`);
    if (target) {
      target.textContent = value.toFixed(key === "cutoff" ? 1 : 2);
    }
  }

  updateReadout() {
    if (!this.metrics) {
      return;
    }

    const values = {
      mass: this.metrics.mass.toFixed(2),
      modes: String(this.metrics.activeModes),
      rms: this.metrics.rms.toFixed(2)
    };

    Object.entries(values).forEach(([key, value]) => {
      if (this.readoutCache[key] === value) {
        return;
      }

      const target = this.container.querySelector(`[data-qf-metric='${key}']`);
      if (target) {
        target.textContent = value;
        this.readoutCache[key] = value;
      }
    });
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
        object.material.forEach((material) => material.dispose?.());
      } else {
        object.material?.dispose?.();
      }
    });
    this.renderer?.dispose?.();
  }
}

function createFieldGeometry(THREE) {
  const positions = [];
  const indices = [];
  const base = [];
  const half = GRID_SIZE / 2;
  const step = GRID_SIZE / GRID_SEGMENTS;

  for (let iz = 0; iz <= GRID_SEGMENTS; iz += 1) {
    const z = -half + iz * step;
    for (let ix = 0; ix <= GRID_SEGMENTS; ix += 1) {
      const x = -half + ix * step;
      positions.push(x, 0, z);
      base.push(x, z);
    }
  }

  const row = GRID_SEGMENTS + 1;
  for (let iz = 0; iz < GRID_SEGMENTS; iz += 1) {
    for (let ix = 0; ix < GRID_SEGMENTS; ix += 1) {
      const a = iz * row + ix;
      const b = a + 1;
      const c = a + row;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.userData.base = new Float32Array(base);
  return geometry;
}

function createModes(seed) {
  const rng = createRng(seed);
  const modes = [];
  const kUnit = (2 * Math.PI) / GRID_SIZE;

  for (let nx = -MODE_INDEX_LIMIT; nx <= MODE_INDEX_LIMIT; nx += 1) {
    for (let nz = -MODE_INDEX_LIMIT; nz <= MODE_INDEX_LIMIT; nz += 1) {
      if ((nx === 0 && nz === 0) || nx < 0 || (nx === 0 && nz < 0)) {
        continue;
      }

      const kx = nx * kUnit;
      const kz = nz * kUnit;
      const k = Math.hypot(kx, kz);

      modes.push({
        kx,
        kz,
        k,
        qCos: gaussian(rng),
        qSin: gaussian(rng),
        pCos: gaussian(rng),
        pSin: gaussian(rng)
      });
    }
  }

  return modes.sort((a, b) => a.k - b.k);
}

function updateField(model) {
  const { THREE, fieldMesh, base, modes, state, time } = model;
  const geometry = fieldMesh.geometry;
  const position = geometry.attributes.position;
  const colors = geometry.attributes.color;
  const low = new THREE.Color(COLORS.indigo);
  const mid = new THREE.Color(COLORS.electric);
  const high = new THREE.Color(COLORS.hotPink);
  const color = new THREE.Color();
  const heights = new Float32Array(position.count);
  let maxAbs = 0;
  let squaredHeightSum = 0;
  const mass = 1 / Math.max(0.35, state.correlation);

  for (let i = 0; i < position.count; i += 1) {
    const x = base[i * 2];
    const z = base[i * 2 + 1];
    let field = 0;
    let norm = 0;

    modes.forEach((mode) => {
      const omega = Math.sqrt(mode.k * mode.k + mass * mass);
      const cutoffWeight = Math.exp(-Math.pow(mode.k / state.cutoff, 4));
      const zeroPointWeight = cutoffWeight / Math.sqrt(2 * omega);
      const spatialPhase = mode.kx * x + mode.kz * z;
      const spatialCos = Math.cos(spatialPhase);
      const spatialSin = Math.sin(spatialPhase);
      const oscillatorTime = omega * time * 0.42;
      const freeFieldQuadrature =
        (mode.qCos * spatialCos + mode.qSin * spatialSin) * Math.cos(oscillatorTime) +
        (mode.pCos * spatialCos + mode.pSin * spatialSin) * Math.sin(oscillatorTime);

      field += zeroPointWeight * freeFieldQuadrature;
      norm += zeroPointWeight * zeroPointWeight;
    });

    const normalized = norm > 0 ? field / Math.sqrt(norm) : field;
    const height = state.scale * normalized * 0.58;
    heights[i] = height;
    squaredHeightSum += height * height;
    maxAbs = Math.max(maxAbs, Math.abs(height));
    position.setY(i, height);
  }

  const colorScale = Math.max(0.001, maxAbs);
  for (let i = 0; i < position.count; i += 1) {
    const t = clamp(Math.abs(heights[i]) / colorScale, 0, 1);
    if (heights[i] < 0) {
      color.lerpColors(low, mid, t);
    } else {
      color.lerpColors(mid, high, t);
    }
    colors.setXYZ(i, color.r, color.g, color.b);
  }

  position.needsUpdate = true;
  colors.needsUpdate = true;
  geometry.computeVertexNormals();

  model.metrics = {
    mass,
    activeModes: countActiveModes(modes, state.cutoff),
    rms: Math.sqrt(squaredHeightSum / position.count)
  };
  model.updateReadout();
}

function countActiveModes(modes, cutoff) {
  return modes.reduce((count, mode) => {
    const cutoffWeight = Math.exp(-Math.pow(mode.k / cutoff, 4));
    return count + (cutoffWeight > 0.08 ? 1 : 0);
  }, 0);
}

function loadThree() {
  if (!threePromise) {
    threePromise = import("https://unpkg.com/three@0.160.0/build/three.module.js");
  }

  return threePromise;
}

function createRng(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function gaussian(rng) {
  const u1 = Math.max(Number.EPSILON, rng());
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
