import { bindPinchZoom, isModelPanGesture, panObjectFromPointer } from "./model-pan.js?v=20260524-science-audit-v1";

const mountedModels = new WeakSet();
let threePromise = null;

const COLORS = {
  brightViolet: 0x8a2be2,
  luminousViolet: 0xbf40ff,
  electric: 0xbf40ff,
  violet: 0x7700ff,
  indigo: 0x2b006d,
  hydrogenDeepPurple: 0x320064,
  hydrogenVividPurple: 0x8f00e6,
  hydrogenSaturatedPurple: 0xa000f2,
  hydrogenNucleusViolet: 0x7700ff,
  deep: 0x050008
};

const MAX_N = 5;
const LOW_POWER_POINTS = 10000;
const DEFAULT_POINTS = 18000;
const TAU = Math.PI * 2;

export function initOrbitalSelectorModels(root = document) {
  root.querySelectorAll("[data-orbital-selector-model]").forEach((container) => {
    if (mountedModels.has(container)) {
      return;
    }

    mountedModels.add(container);
    new OrbitalSelectorModel(container);
  });
}

class OrbitalSelectorModel {
  constructor(container) {
    this.container = container;
    this.frame = container.querySelector("[data-os-frame]") ?? container;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "orbital-selector__canvas";
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute("aria-label", this.copy("canvasLabel"));
    this.canvas.setAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight ArrowUp ArrowDown + -");
    this.frame.replaceChildren(this.canvas);

    this.state = {
      n: 3,
      l: 2,
      m: 0,
      cutoff: 0.035,
      phaseMode: "real",
      phaseOffset: 0,
      phaseContrast: 0.72,
      learningView: "advanced",
      autoRotate: true,
      yaw: -0.42,
      pitch: 0.24,
      distance: 21,
      time: 0
    };

    this.pointer = null;
    this.visible = true;
    this.destroyed = false;
    this.lastTimestamp = 0;
    this.pendingGeneration = null;
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
        en: "Interactive hydrogen orbital probability-cloud selector.",
        es: "Selector interactivo de nubes de probabilidad orbitales del hidrogeno."
      },
      fallback: {
        en: "The orbital selector model could not load in this browser.",
        es: "El selector de orbitales no pudo cargarse en este navegador."
      },
      loading: {
        en: "sampling cloud",
        es: "muestreando nube"
      },
      ready: {
        en: "live",
        es: "activo"
      },
      positive: {
        en: "positive phase",
        es: "fase positiva"
      },
      negative: {
        en: "negative phase",
        es: "fase negativa"
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

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 120);
    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    this.addLights();
    this.addReferenceFrame();
    this.addNucleus();
    this.bindControls();
    this.bindCanvas();
    this.setupObservers();
    this.syncControlsFromState();
    this.queueGeneration();
    this.resize();
    this.updateCamera();

    this.render = this.render.bind(this);
    this.animationFrame = requestAnimationFrame(this.render);
  }

  addLights() {
    const { THREE, scene } = this;
    scene.add(new THREE.AmbientLight(COLORS.hydrogenVividPurple, 0.78));

    const purpleLight = new THREE.PointLight(COLORS.hydrogenSaturatedPurple, 1.15, 70);
    purpleLight.position.set(9, 10, 10);
    const violetLight = new THREE.PointLight(COLORS.hydrogenNucleusViolet, 2.25, 70);
    violetLight.position.set(-10, -6, -8);
    const deepPurpleLight = new THREE.PointLight(COLORS.hydrogenDeepPurple, 2.15, 70);
    deepPurpleLight.position.set(0, 7, -12);
    scene.add(purpleLight, violetLight, deepPurpleLight);
  }

  addReferenceFrame() {
    const { THREE, rootGroup } = this;
    const axes = [
      [[-10, 0, 0], [10, 0, 0], COLORS.hydrogenVividPurple],
      [[0, -10, 0], [0, 10, 0], COLORS.hydrogenSaturatedPurple],
      [[0, 0, -10], [0, 0, 10], COLORS.hydrogenNucleusViolet]
    ];

    axes.forEach(([start, end, color]) => {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...start),
        new THREE.Vector3(...end)
      ]);
      rootGroup.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.25
      })));
    });

    const ringGeometry = new THREE.TorusGeometry(10, 0.012, 8, 128);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.hydrogenDeepPurple,
      transparent: true,
      opacity: 0.42
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    rootGroup.add(ring);
  }

  addNucleus() {
    const { THREE, rootGroup } = this;
    const nucleus = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.34, 2),
      new THREE.MeshBasicMaterial({
        color: COLORS.hydrogenNucleusViolet,
        transparent: true,
        opacity: 0.96
      })
    );

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 24, 18),
      new THREE.MeshBasicMaterial({
        color: COLORS.hydrogenNucleusViolet,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );

    this.nucleusGroup = new THREE.Group();
    this.nucleusGroup.add(nucleus, glow);
    rootGroup.add(this.nucleusGroup);
  }

  bindControls() {
    this.nControl = this.container.querySelector("[data-os-param='n']");
    this.lControl = this.container.querySelector("[data-os-param='l']");
    this.mControl = this.container.querySelector("[data-os-param='m']");
    this.cutoffControl = this.container.querySelector("[data-os-param='cutoff']");
    this.phaseModeControl = this.container.querySelector("[data-os-param='phaseMode']");
    this.phaseOffsetControl = this.container.querySelector("[data-os-param='phaseOffset']");
    this.phaseContrastControl = this.container.querySelector("[data-os-param='phaseContrast']");

    [
      this.nControl,
      this.lControl,
      this.mControl,
      this.cutoffControl,
      this.phaseOffsetControl,
      this.phaseContrastControl
    ].forEach((control) => {
      control?.addEventListener("input", () => {
        this.readControls();
        this.queueGeneration();
      });
    });

    this.phaseModeControl?.addEventListener("change", () => {
      this.readControls();
      this.queueGeneration();
    });

    this.container.querySelector("[data-os-action='rotate']")?.addEventListener("click", (event) => {
      this.state.autoRotate = !this.state.autoRotate;
      event.currentTarget.classList.toggle("is-active", this.state.autoRotate);
      event.currentTarget.setAttribute("aria-pressed", String(this.state.autoRotate));
    });

    this.container.querySelector("[data-os-action='resetView']")?.addEventListener("click", () => {
      this.state.yaw = -0.42;
      this.state.pitch = 0.24;
      this.state.distance = 25;
      this.updateCamera();
    });

    this.container.querySelectorAll("[data-os-preset]").forEach((button) => {
      button.addEventListener("click", () => {
        const [n, l, m, phaseMode] = button.dataset.osPreset.split(",");
        this.state.n = Number(n);
        this.state.l = Number(l);
        this.state.m = Number(m);
        this.state.phaseMode = phaseMode || this.state.phaseMode;
        this.syncControlsFromState();
        this.queueGeneration();
      });
    });

    this.container.querySelectorAll("[data-os-view]").forEach((button) => {
      button.addEventListener("click", () => {
        this.state.learningView = button.dataset.osView;
        if (this.state.learningView === "beginner") {
          this.state.phaseMode = "density";
        }
        this.syncControlsFromState();
        this.queueGeneration();
      });
    });
  }

  readControls() {
    this.state.n = clamp(Number(this.nControl?.value ?? this.state.n), 1, MAX_N);
    const maxL = this.state.n - 1;
    if (this.lControl) {
      this.lControl.max = String(maxL);
    }
    this.state.l = clamp(Number(this.lControl?.value ?? this.state.l), 0, maxL);
    if (this.lControl) {
      this.lControl.value = String(this.state.l);
    }

    if (this.mControl) {
      this.mControl.min = String(-this.state.l);
      this.mControl.max = String(this.state.l);
    }
    this.state.m = clamp(Number(this.mControl?.value ?? this.state.m), -this.state.l, this.state.l);
    if (this.mControl) {
      this.mControl.value = String(this.state.m);
    }
    this.state.cutoff = clamp(Number(this.cutoffControl?.value ?? this.state.cutoff), 0.004, 0.18);
    this.state.phaseMode = this.phaseModeControl?.value ?? this.state.phaseMode;
    this.state.phaseOffset = clamp(Number(this.phaseOffsetControl?.value ?? this.state.phaseOffset), 0, 360);
    this.state.phaseContrast = clamp(Number(this.phaseContrastControl?.value ?? this.state.phaseContrast), 0, 1);

    this.syncControlsFromState();
  }

  syncControlsFromState() {
    this.syncValue("n", String(this.state.n));
    this.syncValue("l", String(this.state.l));
    this.syncValue("m", String(this.state.m));
    this.syncValue("cutoff", this.state.cutoff.toFixed(3));
    this.syncValue("phaseOffset", `${Math.round(this.state.phaseOffset)}°`);
    this.syncValue("phaseContrast", this.state.phaseContrast.toFixed(2));
    this.syncValue("phaseView", phaseModeLabel(this.state.phaseMode, this.isSpanish));
    this.syncValue("orbital", orbitalName(this.state.n, this.state.l, this.state.m));
    this.syncValue("radialNodes", String(this.state.n - this.state.l - 1));
    this.syncValue("angularNodes", String(this.state.l));
    this.syncValue("capacity", String(2 * (2 * this.state.l + 1)));

    if (this.nControl) {
      this.nControl.value = String(this.state.n);
    }
    if (this.lControl) {
      this.lControl.max = String(this.state.n - 1);
      this.lControl.value = String(this.state.l);
    }
    if (this.mControl) {
      this.mControl.min = String(-this.state.l);
      this.mControl.max = String(this.state.l);
      this.mControl.value = String(this.state.m);
    }
    if (this.phaseModeControl) {
      this.phaseModeControl.value = this.state.phaseMode;
    }
    if (this.phaseOffsetControl) {
      this.phaseOffsetControl.value = String(this.state.phaseOffset);
    }
    if (this.phaseContrastControl) {
      this.phaseContrastControl.value = String(this.state.phaseContrast);
    }

    this.container.querySelectorAll("[data-os-advanced]").forEach((element) => {
      element.hidden = this.state.learningView === "beginner";
    });
    this.container.querySelectorAll("[data-os-view]").forEach((button) => {
      const active = button.dataset.osView === this.state.learningView;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  syncValue(key, value) {
    const target = this.container.querySelector(`[data-os-value='${key}']`);
    if (target) {
      target.textContent = value;
    }
  }

  setStatus(text) {
    const status = this.container.querySelector("[data-os-status]");
    if (status) {
      status.textContent = text;
    }
  }

  queueGeneration() {
    window.clearTimeout(this.pendingGeneration);
    this.setStatus(this.copy("loading"));
    this.pendingGeneration = window.setTimeout(() => {
      this.generateCloud(0);
      this.setStatus(this.copy("ready"));
    }, 60);
  }

  generateCloud(retryCount = 0) {
    const { THREE } = this;
    const particleCount = isLowPowerDevice() ? LOW_POWER_POINTS : DEFAULT_POINTS;
    const seed = this.state.n * 1000 + this.state.l * 100 + (this.state.m + 8) * 11;
    const rng = makeRng(seed);
    const sampleRadius = Math.min(30, 5.2 * this.state.n * this.state.n);
    const probeCount = 7000;
    const candidates = [];
    let maxProbability = 0;

    for (let index = 0; index < probeCount; index += 1) {
      const point = randomPointInSphere(rng, sampleRadius);
      const psi = hydrogenPsi(this.state.n, this.state.l, this.state.m, point.x, point.y, point.z);
      const probability = psi * psi;
      maxProbability = Math.max(maxProbability, probability);
      candidates.push({ point, psi, probability });
    }

    const positions = [];
    const colors = [];
    const mixedColor = new THREE.Color();
    const attempts = particleCount * 28;

    for (let index = 0; index < attempts && positions.length / 3 < particleCount; index += 1) {
      const sample = index < candidates.length
        ? candidates[index]
        : (() => {
            const point = randomPointInSphere(rng, sampleRadius);
            const psi = hydrogenPsi(this.state.n, this.state.l, this.state.m, point.x, point.y, point.z);
            return { point, psi, probability: psi * psi };
          })();

      const normalized = maxProbability > 0 ? sample.probability / maxProbability : 0;
      if (normalized < this.state.cutoff || rng() > Math.min(1, normalized * 1.65)) {
        continue;
      }

      const displayScale = 8.5 / sampleRadius;
      positions.push(sample.point.x * displayScale, sample.point.y * displayScale, sample.point.z * displayScale);
      mixedColor.copy(phaseColor(this.THREE, this.state, sample, normalized));
      colors.push(mixedColor.r, mixedColor.g, mixedColor.b);
    }

    if (positions.length < 900 && retryCount < 3) {
      this.state.cutoff = Math.max(0.004, this.state.cutoff * 0.65);
      if (this.cutoffControl) {
        this.cutoffControl.value = String(this.state.cutoff);
      }
      this.syncValue("cutoff", this.state.cutoff.toFixed(3));
      this.generateCloud(retryCount + 1);
      return;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.085,
      vertexColors: true,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    if (this.cloud) {
      this.rootGroup.remove(this.cloud);
      this.cloud.geometry.dispose();
      this.cloud.material.dispose();
    }

    this.cloud = new THREE.Points(geometry, material);
    this.rootGroup.add(this.cloud);
    this.syncValue("points", String(positions.length / 3));
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
          position: this.rootGroup.position.clone()
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
        panObjectFromPointer({
          THREE: this.THREE,
          camera: this.camera,
          object: this.rootGroup,
          startPosition: this.pointer.position,
          startX: this.pointer.x,
          startY: this.pointer.y,
          event,
          distance: this.state.distance
        });
        return;
      }

      this.state.yaw = this.pointer.yaw + (event.clientX - this.pointer.x) * 0.006;
      this.state.pitch = clamp(this.pointer.pitch + (event.clientY - this.pointer.y) * 0.004, -0.82, 0.82);
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
      this.state.distance = clamp(this.state.distance + Math.sign(event.deltaY) * 1.1, 13, 38);
      this.updateCamera();
    }, { passive: false });

    bindPinchZoom(this.canvas, {
      getValue: () => this.state.distance,
      setValue: (value) => {
        this.state.distance = value;
      },
      min: 13,
      max: 38,
      inverted: true,
      onStart: () => {
        this.pointer = null;
      },
      onChange: () => this.updateCamera()
    });

    this.canvas.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "ArrowLeft":
          this.state.yaw -= 0.12;
          break;
        case "ArrowRight":
          this.state.yaw += 0.12;
          break;
        case "ArrowUp":
          this.state.pitch = clamp(this.state.pitch - 0.08, -0.82, 0.82);
          break;
        case "ArrowDown":
          this.state.pitch = clamp(this.state.pitch + 0.08, -0.82, 0.82);
          break;
        case "+":
        case "=":
          this.state.distance = clamp(this.state.distance - 1, 13, 38);
          break;
        case "-":
        case "_":
          this.state.distance = clamp(this.state.distance + 1, 13, 38);
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
      this.state.time += deltaTime;
      this.nucleusGroup.scale.setScalar(1 + Math.sin(this.state.time * 3) * 0.04);
      if (this.state.autoRotate && !this.pointer) {
        this.rootGroup.rotation.y += deltaTime * 0.18;
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.animationFrame = requestAnimationFrame(this.render);
  }

  updateCamera() {
    if (!this.camera) {
      return;
    }

    this.camera.position.set(
      Math.sin(this.state.yaw) * Math.cos(this.state.pitch) * this.state.distance,
      Math.sin(this.state.pitch) * this.state.distance,
      Math.cos(this.state.yaw) * Math.cos(this.state.pitch) * this.state.distance
    );
    this.camera.lookAt(0, 0, 0);
  }

  destroy() {
    this.destroyed = true;
    window.clearTimeout(this.pendingGeneration);

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

function hydrogenPsi(n, l, m, x, y, z) {
  const radius = Math.hypot(x, y, z);
  if (radius < 1e-8) {
    return l === 0 ? radialPart(n, l, radius) * realSphericalHarmonic(l, m, 1, 0) : 0;
  }

  const cosTheta = z / radius;
  const phi = Math.atan2(y, x);
  return radialPart(n, l, radius) * realSphericalHarmonic(l, m, cosTheta, phi);
}

function radialPart(n, l, radius) {
  const rho = 2 * radius / n;
  const k = n - l - 1;
  const alpha = 2 * l + 1;
  return Math.exp(-rho / 2) * rho ** l * associatedLaguerre(k, alpha, rho);
}

function associatedLaguerre(k, alpha, x) {
  let total = 0;
  for (let index = 0; index <= k; index += 1) {
    const sign = index % 2 === 0 ? 1 : -1;
    total += sign * binomial(k + alpha, k - index) * x ** index / factorial(index);
  }
  return total;
}

function realSphericalHarmonic(l, m, cosTheta, phi) {
  const absM = Math.abs(m);
  const normalized = Math.sqrt(
    (2 * l + 1) / (4 * Math.PI) * factorial(l - absM) / factorial(l + absM)
  ) * associatedLegendre(l, absM, clamp(cosTheta, -1, 1));

  if (m === 0) {
    return normalized;
  }

  const phaseFactor = Math.SQRT2 * normalized;
  return m > 0
    ? phaseFactor * Math.cos(absM * phi)
    : phaseFactor * Math.sin(absM * phi);
}

function associatedLegendre(l, m, x) {
  let pmm = 1;
  if (m > 0) {
    const somx2 = Math.sqrt(Math.max(0, (1 - x) * (1 + x)));
    let factor = 1;
    for (let index = 1; index <= m; index += 1) {
      pmm *= -factor * somx2;
      factor += 2;
    }
  }

  if (l === m) {
    return pmm;
  }

  let pmmp1 = x * (2 * m + 1) * pmm;
  if (l === m + 1) {
    return pmmp1;
  }

  let pll = 0;
  for (let ll = m + 2; ll <= l; ll += 1) {
    pll = ((2 * ll - 1) * x * pmmp1 - (ll + m - 1) * pmm) / (ll - m);
    pmm = pmmp1;
    pmmp1 = pll;
  }
  return pll;
}

function orbitalName(n, l, m) {
  const shells = ["s", "p", "d", "f", "g"];
  return `${n}${shells[l] ?? `l${l}`}${orientationSuffix(l, m)}`;
}

function orientationSuffix(l, m) {
  if (l === 0) return "";
  if (l === 1) return m === 0 ? "z" : (m > 0 ? "x" : "y");
  if (l === 2) {
    if (m === 0) return "z2";
    if (m === 1) return "xz";
    if (m === -1) return "yz";
    if (m === 2) return "x2-y2";
    return "xy";
  }
  if (l === 3) {
    if (m === 0) return "z3";
    return m > 0 ? `c${m}` : `s${Math.abs(m)}`;
  }
  return m === 0 ? "0" : `${m > 0 ? "+" : ""}${m}`;
}

function randomPointInSphere(rng, radius) {
  const u = rng() * 2 - 1;
  const theta = rng() * Math.PI * 2;
  const r = radius * Math.cbrt(rng());
  const horizontal = Math.sqrt(Math.max(0, 1 - u * u));

  return {
    x: r * horizontal * Math.cos(theta),
    y: r * horizontal * Math.sin(theta),
    z: r * u
  };
}

function phaseColor(THREE, state, sample, intensity) {
  if (state.phaseMode === "density") {
    return densityRampColor(THREE, intensity);
  }

  const densityLow = sample.psi >= 0 ? COLORS.hydrogenVividPurple : COLORS.hydrogenDeepPurple;
  const densityHigh = sample.psi >= 0 ? COLORS.hydrogenSaturatedPurple : COLORS.hydrogenNucleusViolet;
  const signedDensityColor = new THREE.Color(densityLow).lerp(new THREE.Color(densityHigh), Math.min(1, intensity));
  const phase = phaseForSample(state, sample);
  const phaseColorValue = cyclicPhaseColor(THREE, phase);
  const contrast = state.phaseMode === "real" ? Math.max(0.58, state.phaseContrast) : state.phaseContrast;
  return signedDensityColor.lerp(phaseColorValue, contrast);
}

function densityRampColor(THREE, intensity) {
  const glow = Math.min(1, intensity);
  const low = new THREE.Color(COLORS.hydrogenDeepPurple);
  const mid = new THREE.Color(COLORS.hydrogenVividPurple);
  const high = new THREE.Color(COLORS.hydrogenSaturatedPurple);

  if (glow < 0.54) {
    return low.lerp(mid, smoothStep(0, 0.54, glow));
  }

  return mid.lerp(high, smoothStep(0.54, 1, glow));
}

function phaseForSample(state, sample) {
  const offset = state.phaseOffset / 360 * TAU;

  if (state.phaseMode === "azimuthal") {
    const phi = Math.atan2(sample.point.y, sample.point.x);
    return wrapPhase(state.m * phi + offset);
  }

  if (state.phaseMode === "radial") {
    const radius = Math.hypot(sample.point.x, sample.point.y, sample.point.z);
    const radialPhase = radialPart(state.n, state.l, radius) >= 0 ? 0 : Math.PI;
    return wrapPhase(radialPhase + offset);
  }

  const realPhase = sample.psi >= 0 ? 0 : Math.PI;
  return wrapPhase(realPhase + offset);
}

function cyclicPhaseColor(THREE, phase) {
  const t = wrapPhase(phase) / TAU;
  const stops = [
    COLORS.hydrogenDeepPurple,
    COLORS.hydrogenVividPurple,
    COLORS.hydrogenSaturatedPurple,
    COLORS.hydrogenNucleusViolet,
    COLORS.hydrogenSaturatedPurple,
    COLORS.hydrogenVividPurple,
    COLORS.hydrogenDeepPurple
  ];
  const scaled = t * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(scaled));
  const localT = scaled - index;
  return new THREE.Color(stops[index]).lerp(new THREE.Color(stops[index + 1]), localT);
}

function wrapPhase(phase) {
  return ((phase % TAU) + TAU) % TAU;
}

function smoothStep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function phaseModeLabel(mode, isSpanish) {
  const labels = {
    density: {
      en: "density only",
      es: "solo densidad"
    },
    real: {
      en: "real phase",
      es: "fase real"
    },
    radial: {
      en: "radial phase",
      es: "fase radial"
    },
    azimuthal: {
      en: "azimuthal phase",
      es: "fase azimutal"
    }
  };
  return (labels[mode] ?? labels.real)[isSpanish ? "es" : "en"];
}

function makeRng(seed) {
  let state = seed >>> 0;
  return function rng() {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function factorial(value) {
  let result = 1;
  for (let index = 2; index <= value; index += 1) {
    result *= index;
  }
  return result;
}

function binomial(n, k) {
  if (k < 0 || k > n) {
    return 0;
  }
  return factorial(n) / (factorial(k) * factorial(n - k));
}

function isLowPowerDevice() {
  return (navigator.deviceMemory && navigator.deviceMemory < 4)
    || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
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
