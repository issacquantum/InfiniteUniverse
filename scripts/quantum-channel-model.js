import { bindPinchZoom, isModelPanGesture, panObjectFromPointer } from "./model-pan.js?v=20260530-book-naming-audit-v1";

const mountedModels = new WeakSet();
let threePromise = null;

const COLORS = {
  brightViolet: 0x8a2be2,
  luminousViolet: 0xbf40ff,
  electric: 0xbf40ff,
  violet: 0x7700ff,
  indigo: 0x2b006d,
  deep: 0x050008
};

export function initQuantumChannelModels(root = document) {
  root.querySelectorAll("[data-quantum-channel-model]").forEach((container) => {
    if (mountedModels.has(container)) {
      return;
    }

    mountedModels.add(container);
    new QuantumChannelModel(container);
  });
}

class QuantumChannelModel {
  constructor(container) {
    this.container = container;
    this.frame = container.querySelector("[data-qc-frame]") ?? container;
    this.graphMount = container.querySelector("[data-qc-graph]");
    this.canvas = document.createElement("canvas");
    this.canvas.className = "quantum-channel__canvas";
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute("aria-label", this.copy("canvasLabel"));
    this.canvas.setAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight ArrowUp ArrowDown + -");
    this.frame.replaceChildren(this.canvas);

    this.graphCanvas = document.createElement("canvas");
    this.graphCanvas.className = "quantum-channel__graph-canvas";
    this.graphCanvas.width = 520;
    this.graphCanvas.height = 132;
    this.graphMount?.replaceChildren(this.graphCanvas);
    this.graphContext = this.graphCanvas.getContext("2d");

    this.state = {
      rho: densityPlus(),
      initialState: "plus",
      noiseType: "none",
      noiseLevel: 0,
      speed: 1,
      flowEnabled: true,
      time: 0,
      yaw: -0.2,
      pitch: 0.24,
      distance: 14,
      entropyHistory: Array.from({ length: 120 }, () => 0)
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
        en: "Interactive quantum channel and decoherence visualizer.",
        es: "Visualizador interactivo de canal cuantico y decoherencia."
      },
      fallback: {
        en: "The quantum channel model could not load in this browser.",
        es: "El modelo de canal cuantico no pudo cargarse en este navegador."
      },
      none: {
        en: "Ideal channel: the pure state keeps coherence and entropy stays near zero.",
        es: "Canal ideal: el estado puro conserva coherencia y la entropia queda cerca de cero."
      },
      amplitude: {
        en: "Amplitude damping: energy loss drives the state toward |0>.",
        es: "Amortiguamiento de amplitud: la perdida de energia lleva el estado hacia |0>."
      },
      phase: {
        en: "Phase damping: coherence fades while populations stay fixed.",
        es: "Amortiguamiento de fase: la coherencia se desvanece mientras las poblaciones quedan fijas."
      },
      depolarizing: {
        en: "Depolarizing noise: the state moves toward a maximally mixed density matrix.",
        es: "Ruido despolarizante: el estado se mueve hacia una matriz de densidad maximamente mixta."
      },
      measurement: {
        en: "Projective measurement: superposition is forced toward a classical Z-basis mixture.",
        es: "Medicion proyectiva: la superposicion se fuerza hacia una mezcla clasica en la base Z."
      },
      pass: {
        en: "Pass",
        es: "Pasa"
      },
      fail: {
        en: "Decoherence",
        es: "Decoherencia"
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
    this.scene.fog = new THREE.FogExp2(COLORS.deep, 0.032);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 120);
    this.camera.position.set(0, 5.4, 14);

    this.scene.add(new THREE.AmbientLight(COLORS.electric, 0.75));
    const brightVioletLight = new THREE.PointLight(COLORS.brightViolet, 1.4, 70);
    brightVioletLight.position.set(9, 10, 10);
    const violetLight = new THREE.PointLight(COLORS.violet, 1.1, 70);
    violetLight.position.set(-10, -4, -10);
    this.scene.add(brightVioletLight, violetLight);

    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    this.addFlowField();
    this.addBlochSphere();
    this.addDensityBlob();
    this.addStateArrow();
    this.addNoiseField();
    this.bindControls();
    this.bindCanvas();
    this.setupObservers();
    this.updateDescription();
    this.resize();
    this.updateCamera();

    this.render = this.render.bind(this);
    this.animationFrame = requestAnimationFrame(this.render);
  }

  addFlowField() {
    const { THREE, rootGroup } = this;
    const count = 1100;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let index = 0; index < count; index += 1) {
      const radius = 8 + Math.random() * 20;
      const angle = Math.random() * Math.PI * 2;
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[index * 3 + 2] = Math.sin(angle) * radius;
      speeds[index] = 0.35 + Math.random() * 1.2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: COLORS.violet,
      size: 0.1,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.flowField = new THREE.Points(geometry, material);
    this.flowSpeeds = speeds;
    rootGroup.add(this.flowField);
  }

  addBlochSphere() {
    const { THREE, rootGroup } = this;
    const sphereGeometry = new THREE.SphereGeometry(5, 32, 24);
    const wireGeometry = new THREE.WireframeGeometry(sphereGeometry);
    const wireMaterial = new THREE.LineBasicMaterial({
      color: COLORS.electric,
      transparent: true,
      opacity: 0.18
    });
    this.blochSphere = new THREE.LineSegments(wireGeometry, wireMaterial);
    rootGroup.add(this.blochSphere);

    const axes = [
      [[-6, 0, 0], [6, 0, 0], COLORS.brightViolet],
      [[0, -6, 0], [0, 6, 0], COLORS.luminousViolet],
      [[0, 0, -6], [0, 0, 6], COLORS.violet]
    ];

    axes.forEach(([start, end, color]) => {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...start),
        new THREE.Vector3(...end)
      ]);
      const material = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.46
      });
      rootGroup.add(new THREE.Line(geometry, material));
    });
  }

  addDensityBlob() {
    const { THREE, rootGroup } = this;
    const geometry = new THREE.SphereGeometry(1, 72, 48);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPurity: { value: 1 },
        uNoise: { value: 0 },
        uPrimary: { value: new THREE.Color(COLORS.brightViolet) },
        uSecondary: { value: new THREE.Color(COLORS.electric) }
      },
      vertexShader: `
        varying vec3 vNormal;
        uniform float uTime;
        uniform float uPurity;
        uniform float uNoise;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          float purityRadius = max(0.28, (uPurity - 0.5) * 10.0);
          float ripple =
            sin(position.x * 6.0 + uTime * 1.8) *
            sin(position.y * 5.0 - uTime * 1.3) *
            sin(position.z * 4.0 + uTime);
          vec3 displaced = position * (purityRadius + ripple * (0.08 + uNoise * 0.45));
          gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        uniform float uPurity;
        uniform float uNoise;
        uniform vec3 uPrimary;
        uniform vec3 uSecondary;

        void main() {
          float rim = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 1.8);
          vec3 color = mix(uSecondary, uPrimary, 0.35 + uNoise * 0.55);
          float alpha = mix(0.32, 0.82, rim) * mix(0.74, 0.38, 1.0 - uPurity);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });

    this.blob = new THREE.Mesh(geometry, material);
    rootGroup.add(this.blob);
  }

  addStateArrow() {
    const { THREE, rootGroup } = this;
    this.arrowGroup = new THREE.Group();
    const shaftGeometry = new THREE.CylinderGeometry(0.035, 0.035, 4.4, 18);
    shaftGeometry.rotateZ(Math.PI / 2);
    const headGeometry = new THREE.ConeGeometry(0.22, 0.68, 24);
    headGeometry.rotateZ(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      color: COLORS.luminousViolet,
      transparent: true,
      opacity: 0.94
    });

    const shaft = new THREE.Mesh(shaftGeometry, material);
    shaft.position.x = 2.2;
    const head = new THREE.Mesh(headGeometry, material);
    head.position.x = 4.75;
    this.arrowGroup.add(shaft, head);
    rootGroup.add(this.arrowGroup);
  }

  addNoiseField() {
    const { THREE, rootGroup } = this;
    const count = 320;
    const positions = new Float32Array(count * 3);

    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * 8;
      positions[index * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[index * 3 + 2] = (Math.random() - 0.5) * 8;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: COLORS.brightViolet,
      size: 0.17,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.noiseField = new THREE.Points(geometry, material);
    rootGroup.add(this.noiseField);
  }

  bindControls() {
    this.channelControl = this.container.querySelector("[data-qc-channel]");
    this.initialStateControl = this.container.querySelector("[data-qc-initial-state]");
    this.noiseControl = this.container.querySelector("[data-qc-noise]");
    this.speedControl = this.container.querySelector("[data-qc-speed]");

    this.initialStateControl?.addEventListener("change", () => {
      this.state.initialState = this.initialStateControl.value;
      this.resetState(false);
    });

    this.channelControl?.addEventListener("change", () => {
      this.state.noiseType = this.channelControl.value;
      this.updateDescription();
      this.resetState(false);
    });

    this.noiseControl?.addEventListener("input", () => {
      this.state.noiseLevel = Number(this.noiseControl.value);
      this.syncValue("noise", this.state.noiseLevel.toFixed(2));
    });

    this.speedControl?.addEventListener("input", () => {
      this.state.speed = Number(this.speedControl.value);
      this.syncValue("speed", `${this.state.speed.toFixed(1)}x`);
    });

    this.container.querySelector("[data-qc-action='reset']")?.addEventListener("click", () => this.resetState());
    this.container.querySelector("[data-qc-action='flow']")?.addEventListener("click", (event) => {
      this.state.flowEnabled = !this.state.flowEnabled;
      event.currentTarget.classList.toggle("is-active", this.state.flowEnabled);
      event.currentTarget.setAttribute("aria-pressed", String(this.state.flowEnabled));
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
      this.state.pitch = clamp(this.pointer.pitch + (event.clientY - this.pointer.y) * 0.004, -0.8, 0.8);
      this.updateCamera();
    });

    this.canvas.addEventListener("pointerup", (event) => {
      if (this.pointer?.id === event.pointerId) {
        this.pointer = null;
      }
    });

    this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());

    this.canvas.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "ArrowLeft":
          this.state.yaw -= 0.12;
          break;
        case "ArrowRight":
          this.state.yaw += 0.12;
          break;
        case "ArrowUp":
          this.state.pitch = clamp(this.state.pitch - 0.08, -0.8, 0.8);
          break;
        case "ArrowDown":
          this.state.pitch = clamp(this.state.pitch + 0.08, -0.8, 0.8);
          break;
        case "+":
        case "=":
          this.setSpeed(clamp(this.state.speed + 0.1, 0, 5));
          break;
        case "-":
        case "_":
          this.setSpeed(clamp(this.state.speed - 0.1, 0, 5));
          break;
        default:
          return;
      }

      this.updateCamera();
      event.preventDefault();
    });

    this.canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      this.state.distance = clamp(this.state.distance + Math.sign(event.deltaY) * 0.9, 9, 26);
      this.updateCamera();
    }, { passive: false });

    bindPinchZoom(this.canvas, {
      getValue: () => this.state.distance,
      setValue: (value) => {
        this.state.distance = value;
      },
      min: 9,
      max: 26,
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

  resetState(resetControls = true) {
    this.state.rho = densityFromInitialState(this.state.initialState);
    this.state.time = 0;
    this.state.entropyHistory.fill(0);

    if (resetControls) {
      this.state.noiseLevel = 0;
      this.noiseControl && (this.noiseControl.value = "0");
      this.syncValue("noise", "0.00");
    }
  }

  setSpeed(value) {
    this.state.speed = value;
    if (this.speedControl) {
      this.speedControl.value = String(value);
    }
    this.syncValue("speed", `${value.toFixed(1)}x`);
  }

  updateDescription() {
    const description = this.container.querySelector("[data-qc-description]");
    if (description) {
      description.textContent = this.copy(this.state.noiseType);
    }
  }

  syncValue(key, value) {
    const target = this.container.querySelector(`[data-qc-value='${key}']`);
    if (target) {
      target.textContent = value;
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
      this.updatePhysics(deltaTime);
      this.updateVisuals(deltaTime);
    }

    this.renderer.render(this.scene, this.camera);
    this.animationFrame = requestAnimationFrame(this.render);
  }

  updatePhysics(deltaTime) {
    const dt = deltaTime * this.state.speed;
    this.state.time += dt;

    const angle = 1.65 * dt;
    const rotated = rotateZ(this.state.rho, angle);
    this.state.rho = applyNoise(rotated, this.state.noiseType, this.state.noiseLevel * 4.5, dt);
    normalizeTrace(this.state.rho);
  }

  updateVisuals(deltaTime) {
    const entropy = densityEntropy(this.state.rho);
    const purity = densityPurity(this.state.rho);
    const coherence = densityCoherence(this.state.rho);

    this.syncValue("entropy", entropy.toFixed(3));
    this.syncValue("purity", purity.toFixed(3));
    this.syncValue("coherence", coherence.toFixed(3));
    this.setBar("entropy", entropy);
    this.setBar("purity", purity);
    this.setBar("coherence", coherence);
    this.updateReadout();

    this.state.entropyHistory.push(entropy);
    this.state.entropyHistory.shift();
    this.drawGraph();

    this.blob.material.uniforms.uPurity.value = purity;
    this.blob.material.uniforms.uNoise.value = this.state.noiseLevel;
    this.blob.material.uniforms.uTime.value = this.state.time;
    this.blob.rotation.y += deltaTime * (0.35 + this.state.speed * 0.16);
    this.blochSphere.rotation.y += deltaTime * 0.08;

    this.updateArrow(purity);
    this.updateFlow(entropy, deltaTime);
  }

  updateReadout() {
    const vector = densityBlochVector(this.state.rho);
    const initialRho = densityFromInitialState(this.state.initialState);
    const initialMatrix = {
      "00": formatReal(initialRho.r00, 2),
      "01": formatComplex(initialRho.re, initialRho.im),
      "10": formatComplex(initialRho.re, -initialRho.im),
      "11": formatReal(initialRho.r11, 2)
    };
    const matrix = {
      "00": formatReal(this.state.rho.r00, 2),
      "01": formatComplex(this.state.rho.re, this.state.rho.im),
      "10": formatComplex(this.state.rho.re, -this.state.rho.im),
      "11": formatReal(this.state.rho.r11, 2)
    };

    Object.entries(vector).forEach(([key, value]) => {
      const target = this.container.querySelector(`[data-qc-bloch='${key}']`);
      if (target) {
        target.textContent = formatReal(value, 3);
      }
    });

    Object.entries(matrix).forEach(([key, value]) => {
      const target = this.container.querySelector(`[data-qc-matrix='${key}']`);
      if (target) {
        target.textContent = value;
      }
    });

    Object.entries(initialMatrix).forEach(([key, value]) => {
      const target = this.container.querySelector(`[data-qc-initial-matrix='${key}']`);
      if (target) {
        target.textContent = value;
      }
    });

    const kraus = this.container.querySelector("[data-qc-kraus]");
    if (kraus) {
      kraus.textContent = getKrausLabel(this.state.noiseType, this.isSpanish);
    }

    const radius = Math.hypot(vector.x, vector.y, vector.z);
    const status = this.container.querySelector("[data-qc-fidelity-status]");
    if (status) {
      const isMet = radius >= 0.99;
      status.textContent = `${this.copy(isMet ? "pass" : "fail")} · ${radius.toFixed(3)}`;
      status.classList.toggle("is-met", isMet);
      status.classList.toggle("is-fail", !isMet);
    }
  }

  setBar(key, value) {
    const target = this.container.querySelector(`[data-qc-bar='${key}']`);
    if (target) {
      target.style.width = `${clamp(value, 0, 1) * 100}%`;
    }
  }

  updateArrow(purity) {
    const vector = densityBlochVector(this.state.rho);
    const length = Math.hypot(vector.x, vector.y, vector.z);
    this.arrowGroup.visible = purity > 0.94 && length > 0.02;

    if (!this.arrowGroup.visible) {
      return;
    }

    const direction = new this.THREE.Vector3(vector.x, vector.z, vector.y).normalize();
    const quaternion = new this.THREE.Quaternion();
    quaternion.setFromUnitVectors(new this.THREE.Vector3(1, 0, 0), direction);
    this.arrowGroup.quaternion.copy(quaternion);
  }

  updateFlow(entropy, deltaTime) {
    if (!this.state.flowEnabled) {
      return;
    }

    const positions = this.flowField.geometry.attributes.position.array;
    for (let index = 0; index < this.flowSpeeds.length; index += 1) {
      const base = index * 3;
      const x = positions[base];
      const z = positions[base + 2];
      const radius = Math.max(0.1, Math.hypot(x, z));
      const angle = Math.atan2(z, x) + deltaTime * this.flowSpeeds[index] * (0.22 + this.state.speed * 0.08);
      positions[base] = Math.cos(angle) * radius;
      positions[base + 2] = Math.sin(angle) * radius;
      positions[base + 1] = Math.sin(this.state.time * 1.5 + index * 0.12) * entropy * 2.8;
    }
    this.flowField.geometry.attributes.position.needsUpdate = true;

    const noisePositions = this.noiseField.geometry.attributes.position.array;
    this.noiseField.material.opacity = this.state.noiseLevel * 0.72;
    for (let index = 0; index < noisePositions.length; index += 3) {
      noisePositions[index] += (Math.random() - 0.5) * this.state.noiseLevel * 0.34;
      noisePositions[index + 1] += (Math.random() - 0.5) * this.state.noiseLevel * 0.34;
      noisePositions[index + 2] += (Math.random() - 0.5) * this.state.noiseLevel * 0.34;

      if (Math.abs(noisePositions[index]) > 8) noisePositions[index] *= 0.35;
      if (Math.abs(noisePositions[index + 1]) > 8) noisePositions[index + 1] *= 0.35;
      if (Math.abs(noisePositions[index + 2]) > 8) noisePositions[index + 2] *= 0.35;
    }
    this.noiseField.geometry.attributes.position.needsUpdate = true;
  }

  drawGraph() {
    if (!this.graphContext || !this.graphCanvas) {
      return;
    }

    const { width, height } = this.graphCanvas;
    const ctx = this.graphContext;
    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(119, 0, 255, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 52) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += 22) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    ctx.beginPath();
    this.state.entropyHistory.forEach((value, index) => {
      const x = index / (this.state.entropyHistory.length - 1) * width;
      const y = height - clamp(value, 0, 1) * height;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.strokeStyle = "#8a2be2";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#bf40ff";
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = "rgba(191, 64, 255, 0.12)";
    ctx.fill();
  }

  updateCamera() {
    if (!this.camera) {
      return;
    }

    const distance = this.state.distance;
    this.camera.position.set(
      Math.sin(this.state.yaw) * Math.cos(this.state.pitch) * distance,
      Math.sin(this.state.pitch) * distance,
      Math.cos(this.state.yaw) * Math.cos(this.state.pitch) * distance
    );
    this.camera.lookAt(0, 0, 0);
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

function densityPlus() {
  return { r00: 0.5, r11: 0.5, re: 0.5, im: 0 };
}

function densityZero() {
  return { r00: 1, r11: 0, re: 0, im: 0 };
}

function densityOne() {
  return { r00: 0, r11: 1, re: 0, im: 0 };
}

function densityPlusI() {
  return { r00: 0.5, r11: 0.5, re: 0, im: -0.5 };
}

function densityFromInitialState(key) {
  if (key === "zero") {
    return densityZero();
  }

  if (key === "one") {
    return densityOne();
  }

  if (key === "plus-i") {
    return densityPlusI();
  }

  return densityPlus();
}

function rotateZ(rho, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    r00: rho.r00,
    r11: rho.r11,
    re: rho.re * c + rho.im * s,
    im: rho.im * c - rho.re * s
  };
}

function applyNoise(rho, type, lambda, dt) {
  if (type === "none" || lambda <= 0 || dt <= 0) {
    return { ...rho };
  }

  const p = clamp(1 - Math.exp(-lambda * dt), 0, 0.995);

  if (type === "amplitude") {
    const g = p;
    const f = Math.sqrt(1 - g);
    return {
      r00: rho.r00 + g * rho.r11,
      r11: (1 - g) * rho.r11,
      re: f * rho.re,
      im: f * rho.im
    };
  }

  if (type === "phase" || type === "measurement") {
    const f = type === "measurement" ? (1 - p) ** 2 : 1 - p;
    return {
      r00: rho.r00,
      r11: rho.r11,
      re: f * rho.re,
      im: f * rho.im
    };
  }

  if (type === "depolarizing") {
    return {
      r00: rho.r00 * (1 - p) + 0.5 * p,
      r11: rho.r11 * (1 - p) + 0.5 * p,
      re: rho.re * (1 - p),
      im: rho.im * (1 - p)
    };
  }

  return { ...rho };
}

function normalizeTrace(rho) {
  const trace = rho.r00 + rho.r11;
  if (trace <= 0) {
    rho.r00 = 0.5;
    rho.r11 = 0.5;
    rho.re = 0;
    rho.im = 0;
    return;
  }

  rho.r00 /= trace;
  rho.r11 /= trace;
  rho.re /= trace;
  rho.im /= trace;
}

function densityEigenvalues(rho) {
  const diff = rho.r00 - rho.r11;
  const off = rho.re * rho.re + rho.im * rho.im;
  const disc = Math.sqrt(Math.max(0, diff * diff + 4 * off));
  return [
    clamp((rho.r00 + rho.r11 + disc) / 2, 0, 1),
    clamp((rho.r00 + rho.r11 - disc) / 2, 0, 1)
  ];
}

function densityEntropy(rho) {
  return densityEigenvalues(rho).reduce((total, value) => {
    if (value < 1e-10) {
      return total;
    }
    return total - value * Math.log2(value);
  }, 0);
}

function densityPurity(rho) {
  return clamp(rho.r00 * rho.r00 + rho.r11 * rho.r11 + 2 * (rho.re * rho.re + rho.im * rho.im), 0, 1);
}

function densityCoherence(rho) {
  return clamp(2 * Math.hypot(rho.re, rho.im), 0, 1);
}

function densityBlochVector(rho) {
  return {
    x: 2 * rho.re,
    y: -2 * rho.im,
    z: rho.r00 - rho.r11
  };
}

function formatReal(value, digits) {
  return Math.abs(value) < 10 ** -digits ? (0).toFixed(digits) : value.toFixed(digits);
}

function formatComplex(real, imaginary) {
  const sign = imaginary < 0 ? "-" : "+";
  return `${formatReal(real, 2)} ${sign} ${Math.abs(imaginary).toFixed(2)}i`;
}

function getKrausLabel(type, isSpanish) {
  const labels = {
    none: {
      en: "E0: Identity",
      es: "E0: Identidad"
    },
    amplitude: {
      en: "E0: Relaxation, E1: Energy Loss",
      es: "E0: Relajacion, E1: Perdida de Energia"
    },
    phase: {
      en: "E0/E1: Phase Damping",
      es: "E0/E1: Amortiguamiento de Fase"
    },
    depolarizing: {
      en: "E0: I, E1-E3: Pauli Noise",
      es: "E0: I, E1-E3: Ruido de Pauli"
    },
    measurement: {
      en: "P0/P1: Z Projectors",
      es: "P0/P1: Proyectores Z"
    }
  };

  return labels[type]?.[isSpanish ? "es" : "en"] ?? labels.none[isSpanish ? "es" : "en"];
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
