import { bindPinchZoom, isModelPanGesture, panObjectFromPointer } from "./model-pan.js?v=20260607-static-reading-rail-v1";

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

function getCanvasContentFont() {
  return getComputedStyle(document.body).fontFamily || "serif";
}

const SPIN_COLORS = {
  PLUS: COLORS.brightViolet,
  MINUS: COLORS.electric
};

const PARTICLE_OFFSET = 8.4;
const POSSIBLE_DIRECTION_COUNT = 220;

export function initQuantumEntanglementModels(root = document) {
  root.querySelectorAll("[data-quantum-entanglement-model]").forEach((container) => {
    if (mountedModels.has(container)) {
      return;
    }

    mountedModels.add(container);
    new QuantumEntanglementModel(container);
  });
}

class QuantumEntanglementModel {
  constructor(container) {
    this.container = container;
    this.frame = container.querySelector("[data-qe-frame]") ?? container;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "quantum-entanglement__canvas";
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute("aria-label", this.copy("canvasLabel"));
    this.canvas.setAttribute("aria-keyshortcuts", "m r ArrowLeft ArrowRight ArrowUp ArrowDown + -");
    this.frame.replaceChildren(this.canvas);

    this.state = {
      measured: false,
      yaw: -0.22,
      pitch: 0.14,
      distance: 20.5,
      time: 0,
      totalMeasurements: 0,
      plusMinus: 0,
      minusPlus: 0,
      detectorAngleA: 0,
      detectorAngleB: Math.PI / 4,
      bellTrials: 0,
      sameAxisResults: 0,
      oppositeAxisResults: 0,
      correlationSum: 0,
      bellAlicePlus: 0,
      bellBobPlus: 0,
      chshValue: null,
      measurementAxis: null
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
        en: "Interactive Bell singlet quantum entanglement model.",
        es: "Modelo interactivo de entrelazamiento cuantico con estado singlete de Bell."
      },
      fallback: {
        en: "The entanglement model could not load in this browser.",
        es: "El modelo de entrelazamiento no pudo cargarse en este navegador."
      },
      entangled: {
        en: "entangled",
        es: "entrelazado"
      },
      measured: {
        en: "measured",
        es: "medido"
      },
      upDown: {
        en: "A +n, B -n",
        es: "A +n, B -n"
      },
      downUp: {
        en: "A -n, B +n",
        es: "A -n, B +n"
      },
      reset: {
        en: "Pair re-entangled. Counts preserved.",
        es: "Par reentrelazado. Conteos preservados."
      },
      measurePrompt: {
        en: "Click any point on either sphere or press Measure Pair.",
        es: "Haz clic en cualquier punto de una esfera o presiona Medir Par."
      },
      axisUnknown: {
        en: "unfixed",
        es: "sin fijar"
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
    this.scene.fog = new THREE.FogExp2(COLORS.deep, 0.036);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
    this.raycaster = new THREE.Raycaster();
    this.pointerVector = new THREE.Vector2();
    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    this.addLights();
    this.addBackgroundField();
    this.addReferenceGrid();
    this.particleA = this.createParticle("A", -PARTICLE_OFFSET, COLORS.brightViolet);
    this.particleB = this.createParticle("B", PARTICLE_OFFSET, COLORS.electric);
    this.bindControls();
    this.bindCanvas();
    this.setupObservers();
    this.syncUi();
    this.resize();
    this.updateCamera();

    this.render = this.render.bind(this);
    this.animationFrame = requestAnimationFrame(this.render);
  }

  addLights() {
    const { THREE, scene } = this;
    scene.add(new THREE.AmbientLight(COLORS.electric, 0.74));

    const brightVioletLight = new THREE.PointLight(COLORS.brightViolet, 2.3, 70);
    brightVioletLight.position.set(-8, 8, 8);
    const violetLight = new THREE.PointLight(COLORS.violet, 2.1, 70);
    violetLight.position.set(9, 6, -9);
    scene.add(brightVioletLight, violetLight);
  }

  addBackgroundField() {
    const { THREE, rootGroup } = this;
    const count = 760;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color(COLORS.brightViolet),
      new THREE.Color(COLORS.luminousViolet),
      new THREE.Color(COLORS.electric),
      new THREE.Color(COLORS.violet),
      new THREE.Color(COLORS.indigo)
    ];

    for (let index = 0; index < count; index += 1) {
      const radius = 7 + Math.random() * 20;
      const angle = Math.random() * Math.PI * 2;
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = (Math.random() - 0.5) * 9;
      positions[index * 3 + 2] = Math.sin(angle) * radius;

      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.backgroundField = new THREE.Points(geometry, material);
    rootGroup.add(this.backgroundField);
  }

  addReferenceGrid() {
    const { THREE, rootGroup } = this;
    const points = [];
    const extent = 22;
    const step = 1.5;

    for (let value = -extent; value <= extent; value += step) {
      points.push(
        new THREE.Vector3(-extent, -3.1, value),
        new THREE.Vector3(extent, -3.1, value),
        new THREE.Vector3(value, -3.1, -extent),
        new THREE.Vector3(value, -3.1, extent)
      );
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: COLORS.indigo,
      transparent: true,
      opacity: 0.28
    });
    this.grid = new THREE.LineSegments(geometry, material);
    rootGroup.add(this.grid);
  }

  createParticle(label, offsetX, baseColor) {
    const { THREE, rootGroup } = this;
    const group = new THREE.Group();
    group.position.x = offsetX;

    const radius = 2.15;
    const hitbox = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 36, 24),
      new THREE.MeshBasicMaterial({
        color: COLORS.indigo,
        transparent: true,
        opacity: 0.05,
        depthWrite: false
      })
    );
    group.add(hitbox);

    const shell = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.SphereGeometry(radius, 42, 28)),
      new THREE.LineBasicMaterial({
        color: baseColor,
        transparent: true,
        opacity: 0.28
      })
    );
    group.add(shell);

    [
      [0, 0, 0, COLORS.brightViolet],
      [Math.PI / 2, 0, 0, COLORS.luminousViolet],
      [0, Math.PI / 2, 0, COLORS.violet]
    ].forEach(([x, y, z, color]) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 1.02, 0.018, 10, 120),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.34
        })
      );
      ring.rotation.set(x, y, z);
      group.add(ring);
    });

    const directionField = this.createDirectionField(radius);
    group.add(directionField.points);

    const spinner = new THREE.Group();
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 2.45, 14),
      new THREE.MeshBasicMaterial({
        color: baseColor,
        transparent: true,
        opacity: 0.9
      })
    );
    shaft.position.y = 1.08;
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.55, 18),
      shaft.material
    );
    cone.position.y = 2.48;
    spinner.add(shaft, cone);
    spinner.rotation.z = Math.random() * Math.PI * 2;
    spinner.rotation.x = Math.random() * Math.PI * 2;
    group.add(spinner);

    const axisMarker = this.createAxisMarker(radius);
    axisMarker.group.visible = false;
    group.add(axisMarker.group);

    const cloud = this.createCloud(baseColor);
    group.add(cloud.points);

    const labelSprite = this.createTextSprite(label, baseColor);
    labelSprite.position.set(0, -2.95, 0);
    group.add(labelSprite);

    rootGroup.add(group);
    return {
      group,
      hitbox,
      shell,
      spinner,
      axisMarker,
      shaftMaterial: shaft.material,
      directionField,
      cloud,
      baseColor,
      outcome: null,
      targetQuaternion: null
    };
  }

  createCloud(colorValue) {
    const { THREE } = this;
    const count = 220;
    const positions = new Float32Array(count * 3);

    for (let index = 0; index < count; index += 1) {
      const point = randomPointInSphere(1.72);
      positions[index * 3] = point.x;
      positions[index * 3 + 1] = point.y;
      positions[index * 3 + 2] = point.z;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: colorValue,
      size: 0.07,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    return {
      points: new THREE.Points(geometry, material),
      material
    };
  }

  createDirectionField(radius) {
    const { THREE } = this;
    const positions = new Float32Array(POSSIBLE_DIRECTION_COUNT * 3);
    const colors = new Float32Array(POSSIBLE_DIRECTION_COUNT * 3);
    const palette = [
      new THREE.Color(COLORS.violet),
      new THREE.Color(COLORS.electric),
      new THREE.Color(COLORS.indigo),
      new THREE.Color(COLORS.luminousViolet)
    ];

    for (let index = 0; index < POSSIBLE_DIRECTION_COUNT; index += 1) {
      const point = fibonacciSpherePoint(index, POSSIBLE_DIRECTION_COUNT, radius * 1.18);
      const color = palette[index % palette.length];
      positions[index * 3] = point.x;
      positions[index * 3 + 1] = point.y;
      positions[index * 3 + 2] = point.z;
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    return {
      points: new THREE.Points(geometry, material),
      material
    };
  }

  createAxisMarker(radius) {
    const { THREE } = this;
    const group = new THREE.Group();
    const outcomeMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.brightViolet,
      transparent: true,
      opacity: 0.96
    });
    const oppositeMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.electric,
      transparent: true,
      opacity: 0.42
    });
    const outcomeDot = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 12), outcomeMaterial);
    const oppositeDot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 10), oppositeMaterial);
    outcomeDot.position.y = radius * 1.34;
    oppositeDot.position.y = -radius * 1.34;
    group.add(outcomeDot, oppositeDot);

    return {
      group,
      outcomeMaterial,
      oppositeMaterial
    };
  }

  createTextSprite(text, color) {
    const { THREE } = this;
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `700 30px ${getCanvasContentFont()}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowBlur = 14;
    ctx.shadowColor = `#${color.toString(16).padStart(6, "0")}`;
    ctx.fillStyle = ctx.shadowColor;
    ctx.fillText(text, 64, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.62, 0.32, 1);
    return sprite;
  }

  bindControls() {
    this.container.querySelector("[data-qe-action='measure']")?.addEventListener("click", () => {
      this.measurePair();
    });

    this.container.querySelector("[data-qe-action='run-trials']")?.addEventListener("click", () => {
      this.runBellTrials(256);
    });

    this.container.querySelector("[data-qe-action='run-chsh']")?.addEventListener("click", () => {
      this.runChshDemo();
    });

    this.container.querySelector("[data-qe-action='reset']")?.addEventListener("click", () => {
      this.resetPair();
      this.setStatus(this.copy("reset"));
    });

    this.container.querySelectorAll("[data-qe-angle]").forEach((control) => {
      control.addEventListener("input", () => {
        const key = control.dataset.qeAngle;
        this.state[key] = Number(control.value);
        this.resetBellStats();
        this.syncUi();
      });
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
          position: this.rootGroup.position.clone(),
          dragged: true
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
        pitch: this.state.pitch,
        dragged: false
      };
      this.canvas.setPointerCapture(event.pointerId);
    });

    this.canvas.addEventListener("pointermove", (event) => {
      if (!this.pointer || this.pointer.id !== event.pointerId) {
        return;
      }

      const dx = event.clientX - this.pointer.x;
      const dy = event.clientY - this.pointer.y;
      this.pointer.dragged ||= Math.hypot(dx, dy) > 5;

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

      this.state.yaw = this.pointer.yaw + dx * 0.006;
      this.state.pitch = clamp(this.pointer.pitch + dy * 0.004, -0.78, 0.78);
      this.updateCamera();
    });

    this.canvas.addEventListener("pointerup", (event) => {
      if (this.pointer?.id !== event.pointerId) {
        return;
      }

      const wasDrag = this.pointer.dragged;
      this.pointer = null;
      if (!wasDrag) {
        this.tryParticleMeasurement(event);
      }
    });

    this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());

    this.canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      this.state.distance = clamp(this.state.distance + Math.sign(event.deltaY) * 1.1, 17, 42);
      this.updateCamera();
    }, { passive: false });

    bindPinchZoom(this.canvas, {
      getValue: () => this.state.distance,
      setValue: (value) => {
        this.state.distance = value;
      },
      min: 17,
      max: 42,
      inverted: true,
      onStart: () => {
        this.pointer = null;
      },
      onChange: () => this.updateCamera()
    });

    this.canvas.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "m":
        case "M":
          this.measurePair();
          break;
        case "r":
        case "R":
          this.resetPair();
          break;
        case "ArrowLeft":
          this.state.yaw -= 0.12;
          break;
        case "ArrowRight":
          this.state.yaw += 0.12;
          break;
        case "ArrowUp":
          this.state.pitch = clamp(this.state.pitch - 0.08, -0.78, 0.78);
          break;
        case "ArrowDown":
          this.state.pitch = clamp(this.state.pitch + 0.08, -0.78, 0.78);
          break;
        case "+":
        case "=":
          this.state.distance = clamp(this.state.distance - 1.1, 17, 42);
          break;
        case "-":
        case "_":
          this.state.distance = clamp(this.state.distance + 1.1, 17, 42);
          break;
        default:
          return;
      }

      this.updateCamera();
      event.preventDefault();
    });
  }

  tryParticleMeasurement(event) {
    if (this.state.measured) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    this.pointerVector.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerVector.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointerVector, this.camera);

    const intersections = this.raycaster.intersectObjects([
      this.particleA.hitbox,
      this.particleB.hitbox
    ]);

    if (intersections.length > 0) {
      const hit = intersections[0];
      const particle = hit.object === this.particleA.hitbox ? this.particleA : this.particleB;
      const axis = particle.group.worldToLocal(hit.point.clone()).normalize();
      if (axis.lengthSq() > 0) {
        this.measurePair(axis);
      } else {
        this.measurePair();
      }
    }
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

  measurePair(selectedAxis) {
    if (this.state.measured) {
      return;
    }

    const axis = selectedAxis?.clone?.().normalize?.() ?? randomUnitVector(this.THREE);
    const aPlus = Math.random() >= 0.5;
    const resultA = aPlus ? "PLUS" : "MINUS";
    const resultB = aPlus ? "MINUS" : "PLUS";
    const axisA = aPlus ? axis.clone() : axis.clone().multiplyScalar(-1);
    const axisB = axisA.clone().multiplyScalar(-1);
    this.state.measured = true;
    this.state.measurementAxis = axis;
    this.state.totalMeasurements += 1;
    if (aPlus) {
      this.state.plusMinus += 1;
    } else {
      this.state.minusPlus += 1;
    }

    this.applyOutcome(this.particleA, resultA, axisA);
    this.applyOutcome(this.particleB, resultB, axisB);
    this.setStatus(aPlus ? this.copy("upDown") : this.copy("downUp"));
    this.syncUi();
  }

  runBellTrials(count) {
    this.state.measured = true;
    const axisA = axisFromAngle(this.THREE, this.state.detectorAngleA);
    const axisB = axisFromAngle(this.THREE, this.state.detectorAngleB);
    const expected = -Math.cos(this.state.detectorAngleA - this.state.detectorAngleB);
    const sameProbability = clamp((1 + expected) / 2, 0, 1);
    let lastA = 1;
    let lastB = -1;

    for (let trial = 0; trial < count; trial += 1) {
      const a = Math.random() < 0.5 ? 1 : -1;
      const same = Math.random() < sameProbability;
      const b = same ? a : -a;
      this.state.bellTrials += 1;
      this.state.correlationSum += a * b;
      if (a > 0) {
        this.state.bellAlicePlus += 1;
      }
      if (b > 0) {
        this.state.bellBobPlus += 1;
      }

      if (same) {
        this.state.sameAxisResults += 1;
      } else {
        this.state.oppositeAxisResults += 1;
      }

      lastA = a;
      lastB = b;
    }

    this.applyOutcome(this.particleA, lastA > 0 ? "PLUS" : "MINUS", axisA.clone().multiplyScalar(lastA));
    this.applyOutcome(this.particleB, lastB > 0 ? "PLUS" : "MINUS", axisB.clone().multiplyScalar(lastB));
    this.setStatus(`E(a,b) = ${this.empiricalCorrelation().toFixed(3)}`);
    this.syncUi();
  }

  runChshDemo() {
    const settings = [
      [0, Math.PI / 4, 1],
      [0, -Math.PI / 4, 1],
      [Math.PI / 2, Math.PI / 4, 1],
      [Math.PI / 2, -Math.PI / 4, -1]
    ];
    const estimates = settings.map(([angleA, angleB]) => this.sampleCorrelation(angleA, angleB, 512));
    this.state.chshValue = Math.abs(estimates.reduce((sum, value, index) => sum + value * settings[index][2], 0));
    this.state.detectorAngleA = 0;
    this.state.detectorAngleB = Math.PI / 4;
    const angleAControl = this.container.querySelector("[data-qe-angle='detectorAngleA']");
    const angleBControl = this.container.querySelector("[data-qe-angle='detectorAngleB']");
    if (angleAControl) {
      angleAControl.value = String(this.state.detectorAngleA);
    }
    if (angleBControl) {
      angleBControl.value = String(this.state.detectorAngleB);
    }
    this.setStatus(`CHSH S = ${this.state.chshValue.toFixed(3)}`);
    this.syncUi();
  }

  sampleCorrelation(angleA, angleB, count) {
    const expected = -Math.cos(angleA - angleB);
    const sameProbability = clamp((1 + expected) / 2, 0, 1);
    let total = 0;

    for (let trial = 0; trial < count; trial += 1) {
      const a = Math.random() < 0.5 ? 1 : -1;
      const same = Math.random() < sameProbability;
      const b = same ? a : -a;
      total += a * b;
    }

    return total / count;
  }

  resetBellStats() {
    this.state.bellTrials = 0;
    this.state.sameAxisResults = 0;
    this.state.oppositeAxisResults = 0;
    this.state.correlationSum = 0;
    this.state.bellAlicePlus = 0;
    this.state.bellBobPlus = 0;
    this.state.chshValue = null;
    this.resetPair();
  }

  empiricalCorrelation() {
    return this.state.bellTrials ? this.state.correlationSum / this.state.bellTrials : 0;
  }

  applyOutcome(particle, outcome, axis) {
    particle.outcome = outcome;
    particle.targetQuaternion = quaternionFromAxis(this.THREE, axis);
    const color = SPIN_COLORS[outcome];
    particle.shaftMaterial.color.setHex(color);
    particle.cloud.material.color.setHex(color);
    particle.shell.material.color.setHex(color);
    particle.shell.material.opacity = 0.52;
    particle.axisMarker.group.visible = true;
    particle.axisMarker.group.quaternion.copy(particle.targetQuaternion);
    particle.axisMarker.outcomeMaterial.color.setHex(color);
    particle.axisMarker.oppositeMaterial.color.setHex(outcome === "PLUS" ? COLORS.electric : COLORS.brightViolet);
  }

  resetPair() {
    this.state.measured = false;
    this.state.measurementAxis = null;
    this.resetParticle(this.particleA);
    this.resetParticle(this.particleB);
    this.syncUi();
  }

  resetParticle(particle) {
    particle.outcome = null;
    particle.targetQuaternion = null;
    particle.spinner.rotation.z = Math.random() * Math.PI * 2;
    particle.spinner.rotation.x = Math.random() * Math.PI * 2;
    particle.shaftMaterial.color.setHex(particle.baseColor);
    particle.cloud.material.color.setHex(particle.baseColor);
    particle.shell.material.color.setHex(particle.baseColor);
    particle.shell.material.opacity = 0.28;
    particle.axisMarker.group.visible = false;
  }

  setStatus(text) {
    const status = this.container.querySelector("[data-qe-status]");
    if (status) {
      status.textContent = text;
    }
  }

  syncUi() {
    const total = this.state.totalMeasurements;
    const upPct = total ? Math.round(this.state.plusMinus / total * 100) : 0;
    const downPct = total ? Math.round(this.state.minusPlus / total * 100) : 0;
    const bellTotal = this.state.bellTrials;
    const samePct = bellTotal ? Math.round(this.state.sameAxisResults / bellTotal * 100) : 0;
    const oppositePct = bellTotal ? Math.round(this.state.oppositeAxisResults / bellTotal * 100) : 0;
    const aliceLocalPct = bellTotal ? Math.round(this.state.bellAlicePlus / bellTotal * 100) : 50;
    const bobLocalPct = bellTotal ? Math.round(this.state.bellBobPlus / bellTotal * 100) : 50;
    const expected = -Math.cos(this.state.detectorAngleA - this.state.detectorAngleB);
    this.syncValue("state", this.state.measured ? this.copy("measured") : this.copy("entangled"));
    this.syncValue("upDown", `${upPct}%`);
    this.syncValue("downUp", `${downPct}%`);
    this.syncValue("total", String(total));
    this.syncValue("anticorrelation", total ? "100%" : "0%");
    this.syncValue("axis", formatAxis(this.state.measurementAxis, this.copy("axisUnknown")));
    this.syncValue("angleA", formatAngleDegrees(this.state.detectorAngleA));
    this.syncValue("angleB", formatAngleDegrees(this.state.detectorAngleB));
    this.syncValue("trialTotal", String(bellTotal));
    this.syncValue("same", `${samePct}%`);
    this.syncValue("opposite", `${oppositePct}%`);
    this.syncValue("expectedE", expected.toFixed(3));
    this.syncValue("empiricalE", this.empiricalCorrelation().toFixed(3));
    this.syncValue("aliceLocal", `${aliceLocalPct}%`);
    this.syncValue("bobLocal", `${bobLocalPct}%`);
    this.syncValue("chsh", this.state.chshValue === null ? (this.isSpanish ? "sin ejecutar" : "not run") : this.state.chshValue.toFixed(3));
    this.syncBar("upDown", upPct);
    this.syncBar("downUp", downPct);
    this.syncBar("same", samePct);
    this.syncBar("opposite", oppositePct);

    const prompt = this.container.querySelector("[data-qe-prompt]");
    if (prompt) {
      prompt.textContent = this.state.measured ? "" : this.copy("measurePrompt");
      prompt.hidden = this.state.measured;
    }

    if (!this.state.measured) {
      this.setStatus(this.copy("entangled"));
    }
  }

  syncValue(key, value) {
    const target = this.container.querySelector(`[data-qe-value='${key}']`);
    if (target) {
      target.textContent = value;
    }
  }

  syncBar(key, value) {
    const target = this.container.querySelector(`[data-qe-bar='${key}']`);
    if (target) {
      target.style.width = `${clamp(value, 0, 100)}%`;
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
      this.animateModel(deltaTime);
    }

    this.renderer.render(this.scene, this.camera);
    this.animationFrame = requestAnimationFrame(this.render);
  }

  animateModel(deltaTime) {
    const time = this.state.time;

    [this.particleA, this.particleB].forEach((particle, index) => {
      particle.group.position.y = Math.sin(time * 0.9 + index) * 0.28;
      particle.cloud.points.rotation.y += deltaTime * (0.34 + index * 0.08);
      particle.cloud.points.rotation.x += deltaTime * 0.12;

      if (this.state.measured) {
        if (particle.targetQuaternion) {
          particle.spinner.quaternion.slerp(particle.targetQuaternion, 0.16);
        }
      } else {
        particle.spinner.rotation.z = Math.sin(time * (2.4 + index * 0.11)) * 0.55 + Math.cos(time * 3.8 + index);
        particle.spinner.rotation.x = Math.sin(time * (2.1 + index * 0.08)) * 0.48;
      }
    });
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

function randomPointInSphere(radius) {
  const u = Math.random() * 2 - 1;
  const theta = Math.random() * Math.PI * 2;
  const r = radius * Math.cbrt(Math.random());
  const horizontal = Math.sqrt(Math.max(0, 1 - u * u));
  return {
    x: r * horizontal * Math.cos(theta),
    y: r * horizontal * Math.sin(theta),
    z: r * u
  };
}

function fibonacciSpherePoint(index, count, radius) {
  const y = 1 - index / Math.max(1, count - 1) * 2;
  const radial = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = index * Math.PI * (3 - Math.sqrt(5));
  return {
    x: Math.cos(theta) * radial * radius,
    y: y * radius,
    z: Math.sin(theta) * radial * radius
  };
}

function randomUnitVector(THREE) {
  const z = Math.random() * 2 - 1;
  const theta = Math.random() * Math.PI * 2;
  const horizontal = Math.sqrt(Math.max(0, 1 - z * z));
  return new THREE.Vector3(
    horizontal * Math.cos(theta),
    z,
    horizontal * Math.sin(theta)
  ).normalize();
}

function axisFromAngle(THREE, angle) {
  return new THREE.Vector3(
    Math.cos(angle),
    Math.sin(angle),
    0
  ).normalize();
}

function quaternionFromAxis(THREE, axis) {
  return new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    axis.clone().normalize()
  );
}

function formatAngleDegrees(angle) {
  return `${Math.round(angle * 180 / Math.PI)} deg`;
}

function formatAxis(axis, fallback) {
  if (!axis) {
    return fallback;
  }

  return `(${axis.x.toFixed(2)}, ${axis.y.toFixed(2)}, ${axis.z.toFixed(2)})`;
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
