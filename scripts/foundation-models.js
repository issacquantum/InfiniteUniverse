import { bindPinchZoom } from "./model-pan.js?v=20260607-life-watermark-restore-v1";

const mountedModels = new WeakSet();
let threePromise = null;

const COLORS = {
  brightViolet: 0x8a2be2,
  luminousViolet: 0xbf40ff,
  violet: 0x7700ff,
  electric: 0xbf40ff,
  indigo: 0x2b006d,
  deep: 0x050008
};

export function initFoundationModels(root = document) {
  root.querySelectorAll("[data-foundation-model]").forEach((container) => {
    if (mountedModels.has(container)) {
      return;
    }

    mountedModels.add(container);
    new FoundationModel(container);
  });
}

class FoundationModel {
  constructor(container) {
    this.container = container;
    this.type = container.dataset.foundationModel;
    this.frame = container.querySelector("[data-foundation-model-frame]") ?? container;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "foundation-model__canvas";
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute("aria-label", this.copy("canvasLabel"));
    this.frame.replaceChildren(this.canvas);

    this.visible = true;
    this.destroyed = false;
    this.pointer = null;
    this.dynamic = null;
    this.state = {
      yaw: -0.42,
      pitch: 0.28,
      distance: 7.8
    };
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
        en: "Three dimensional educational science model.",
        es: "Modelo científico educativo tridimensional."
      },
      fallback: {
        en: "This 3D model could not load in this browser.",
        es: "Este modelo 3D no pudo cargarse en este navegador."
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
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 80);
    this.modelGroup = new THREE.Group();
    this.scene.add(this.modelGroup);

    this.addLights();
    this.addStars();
    this.addModelByType();
    this.bindInteraction();
    this.setupObservers();
    this.resize();

    this.lastTimestamp = 0;
    this.render = this.render.bind(this);
    this.animationFrame = requestAnimationFrame(this.render);
  }

  addLights() {
    const { THREE, scene } = this;
    scene.add(new THREE.AmbientLight(0x9f5cff, 0.88));
    const key = new THREE.PointLight(COLORS.brightViolet, 2.2, 28);
    key.position.set(3.5, 4.2, 5);
    scene.add(key);
    const fill = new THREE.PointLight(COLORS.electric, 1.5, 22);
    fill.position.set(-4.5, -1.5, -3.5);
    scene.add(fill);
  }

  addStars() {
    const { THREE, scene } = this;
    const count = 160;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 26;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 26;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: COLORS.luminousViolet,
      size: 0.025,
      transparent: true,
      opacity: 0.78
    });
    scene.add(new THREE.Points(geometry, material));
  }

  addModelByType() {
    const modelMap = {
      mechanics: () => this.addMechanicsModel(),
      electromagnetism: () => this.addElectromagnetismModel(),
      thermodynamics: () => this.addThermodynamicsModel(),
      mathematics: () => this.addMathematicsModel(),
      qft: () => this.addQftModel(),
      chemistry: () => this.addChemistryModel(),
      biology: () => this.addBiologyModel(),
      neuroscience: () => this.addNeuroscienceModel(),
      complex: () => this.addComplexSystemsModel()
    };

    (modelMap[this.type] ?? modelMap.mathematics)();
  }

  addGrid(size = 5.2, divisions = 16, y = -1.1) {
    const { THREE, modelGroup } = this;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const half = size / 2;

    for (let i = 0; i <= divisions; i += 1) {
      const v = -half + (size * i) / divisions;
      positions.push(-half, y, v, half, y, v);
      positions.push(v, y, -half, v, y, half);
    }

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: COLORS.violet,
      transparent: true,
      opacity: 0.45
    });
    const grid = new THREE.LineSegments(geometry, material);
    modelGroup.add(grid);
    return grid;
  }

  addMechanicsModel() {
    const { THREE, modelGroup } = this;
    this.addGrid(5.6, 18, -0.9);

    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 32, 16),
      this.material(COLORS.brightViolet, 0.38)
    );
    modelGroup.add(center);

    const orbit = new THREE.Mesh(
      new THREE.TorusGeometry(1.95, 0.012, 12, 96),
      this.material(COLORS.luminousViolet, 0.34)
    );
    orbit.rotation.x = Math.PI / 2;
    modelGroup.add(orbit);

    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 28, 14),
      this.material(COLORS.electric, 0.42)
    );
    modelGroup.add(body);

    const forceArrow = new THREE.ArrowHelper(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(), 0.9, COLORS.brightViolet, 0.16, 0.08);
    const velocityArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 0.85, COLORS.luminousViolet, 0.16, 0.08);
    modelGroup.add(forceArrow, velocityArrow);

    this.dynamic = (time) => {
      const angle = time * 0.62;
      const position = new THREE.Vector3(Math.cos(angle) * 1.95, 0.22, Math.sin(angle) * 1.95);
      body.position.copy(position);
      forceArrow.position.copy(position);
      forceArrow.setDirection(position.clone().multiplyScalar(-1).normalize());
      velocityArrow.position.copy(position);
      velocityArrow.setDirection(new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle)).normalize());
    };
  }

  addElectromagnetismModel() {
    const { THREE, modelGroup } = this;
    this.state.yaw = -0.78;
    this.state.pitch = 0.32;
    this.state.distance = 7.1;
    modelGroup.scale.setScalar(1.08);

    const span = 7;
    const halfSpan = span / 2;
    const samples = 150;
    const amplitude = 1.04;
    const waveNumber = 2.65;
    const angularSpeed = 2.15;
    const electricColor = 0xa64dff;
    const magneticColor = 0x5b2bff;
    const phaseColor = 0x7f35ff;
    const energyColor = 0xc084ff;
    const eGeometry = new THREE.BufferGeometry();
    const bGeometry = new THREE.BufferGeometry();
    const ePositions = new Float32Array(samples * 3);
    const bPositions = new Float32Array(samples * 3);
    const eSurfaceGeometry = new THREE.BufferGeometry();
    const bSurfaceGeometry = new THREE.BufferGeometry();
    const surfaceVertexCount = samples * 2;
    const eSurfacePositions = new Float32Array(surfaceVertexCount * 3);
    const bSurfacePositions = new Float32Array(surfaceVertexCount * 3);
    const surfaceIndices = [];
    const eLine = new THREE.Line(eGeometry, new THREE.LineBasicMaterial({
      color: electricColor,
      transparent: true,
      opacity: 0.98
    }));
    const bLine = new THREE.Line(bGeometry, new THREE.LineBasicMaterial({
      color: magneticColor,
      transparent: true,
      opacity: 0.98
    }));
    const arrows = [];
    const phaseFronts = [];
    const energyPulses = [];

    eGeometry.setAttribute("position", new THREE.BufferAttribute(ePositions, 3));
    bGeometry.setAttribute("position", new THREE.BufferAttribute(bPositions, 3));
    eSurfaceGeometry.setAttribute("position", new THREE.BufferAttribute(eSurfacePositions, 3));
    bSurfaceGeometry.setAttribute("position", new THREE.BufferAttribute(bSurfacePositions, 3));

    for (let i = 0; i < samples - 1; i += 1) {
      const a = i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      surfaceIndices.push(a, c, b, b, c, d);
    }

    eSurfaceGeometry.setIndex(surfaceIndices);
    bSurfaceGeometry.setIndex(surfaceIndices);

    const eSurface = new THREE.Mesh(eSurfaceGeometry, new THREE.MeshBasicMaterial({
      color: electricColor,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
      depthWrite: false
    }));
    const bSurface = new THREE.Mesh(bSurfaceGeometry, new THREE.MeshBasicMaterial({
      color: magneticColor,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false
    }));

    modelGroup.add(this.createEmFieldGrid("xy", electricColor), this.createEmFieldGrid("xz", magneticColor));
    modelGroup.add(eSurface, bSurface, eLine, bLine);

    const axis = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-halfSpan - 0.35, 0, 0), new THREE.Vector3(halfSpan + 0.48, 0, 0)]),
      new THREE.LineBasicMaterial({ color: energyColor, transparent: true, opacity: 0.52 })
    );
    const propagationArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-halfSpan - 0.38, -1.18, -1.05),
      span + 0.76,
      energyColor,
      0.22,
      0.11
    );
    modelGroup.add(axis, propagationArrow);

    for (let i = 0; i < 15; i += 1) {
      const x = -halfSpan + (i / 14) * span;
      const eArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(x, 0, 0),
        0.45,
        electricColor,
        0.12,
        0.055
      );
      const bArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(x, 0, 0),
        0.45,
        magneticColor,
        0.12,
        0.055
      );
      arrows.push({ x, eArrow, bArrow });
      modelGroup.add(eArrow, bArrow);
    }

    const frontGeometry = new THREE.PlaneGeometry(1.95, 1.95, 1, 1);
    const frontEdgeGeometry = new THREE.EdgesGeometry(frontGeometry);

    for (let i = 0; i < 5; i += 1) {
      const plane = new THREE.Mesh(frontGeometry, new THREE.MeshBasicMaterial({
        color: phaseColor,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
        depthWrite: false
      }));
      const edge = new THREE.LineSegments(frontEdgeGeometry, new THREE.LineBasicMaterial({
        color: phaseColor,
        transparent: true,
        opacity: 0.6
      }));
      const group = new THREE.Group();
      group.rotation.y = Math.PI / 2;
      group.userData.offset = i / 5;
      group.add(plane, edge);
      phaseFronts.push(group);
      modelGroup.add(group);
    }

    for (let i = 0; i < 8; i += 1) {
      const pulse = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 18, 10),
        new THREE.MeshBasicMaterial({
          color: energyColor,
          transparent: true,
          opacity: 0.8,
          depthWrite: false
        })
      );
      pulse.userData.offset = i / 8;
      energyPulses.push(pulse);
      modelGroup.add(pulse);
    }

    const glowMaterial = new THREE.MeshBasicMaterial({
      color: energyColor,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const glow = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, span, 64, 1, true), glowMaterial);
    glow.rotation.z = Math.PI / 2;
    modelGroup.add(glow);

    this.dynamic = (time) => {
      const phase = -time * angularSpeed;

      for (let i = 0; i < samples; i += 1) {
        const ratio = i / (samples - 1);
        const x = -halfSpan + ratio * span;
        const wave = Math.sin(x * waveNumber + phase);
        const y = wave * amplitude;
        const z = wave * amplitude;

        ePositions[i * 3] = x;
        ePositions[i * 3 + 1] = y;
        ePositions[i * 3 + 2] = 0;
        bPositions[i * 3] = x;
        bPositions[i * 3 + 1] = 0;
        bPositions[i * 3 + 2] = z;

        eSurfacePositions[i * 6] = x;
        eSurfacePositions[i * 6 + 1] = 0;
        eSurfacePositions[i * 6 + 2] = 0;
        eSurfacePositions[i * 6 + 3] = x;
        eSurfacePositions[i * 6 + 4] = y;
        eSurfacePositions[i * 6 + 5] = 0;

        bSurfacePositions[i * 6] = x;
        bSurfacePositions[i * 6 + 1] = 0;
        bSurfacePositions[i * 6 + 2] = 0;
        bSurfacePositions[i * 6 + 3] = x;
        bSurfacePositions[i * 6 + 4] = 0;
        bSurfacePositions[i * 6 + 5] = z;
      }

      eGeometry.attributes.position.needsUpdate = true;
      bGeometry.attributes.position.needsUpdate = true;
      eSurfaceGeometry.attributes.position.needsUpdate = true;
      bSurfaceGeometry.attributes.position.needsUpdate = true;

      arrows.forEach(({ x, eArrow, bArrow }) => {
        const wave = Math.sin(x * waveNumber + phase);
        const length = 0.12 + Math.abs(wave) * 0.78;
        const direction = Math.sign(wave) || 1;
        eArrow.position.set(x, 0, 0);
        eArrow.setDirection(new THREE.Vector3(0, direction, 0));
        eArrow.setLength(length, 0.12, 0.055);
        bArrow.position.set(x, 0, 0);
        bArrow.setDirection(new THREE.Vector3(0, 0, direction));
        bArrow.setLength(length, 0.12, 0.055);
      });

      phaseFronts.forEach((front) => {
        const travel = (time * 0.16 + front.userData.offset) % 1;
        const x = -halfSpan + travel * span;
        front.position.set(x, 0, 0);
        front.scale.setScalar(0.82 + Math.sin(time * 1.2 + front.userData.offset * Math.PI * 2) * 0.04);
        front.children.forEach((child) => {
          child.material.opacity = child.isMesh
            ? 0.07 + (1 - travel) * 0.12
            : 0.34 + (1 - travel) * 0.34;
        });
      });

      energyPulses.forEach((pulse) => {
        const travel = (time * 0.21 + pulse.userData.offset) % 1;
        const x = -halfSpan + travel * span;
        const wave = Math.sin(x * waveNumber + phase);
        pulse.position.set(x, wave * amplitude * 0.32, wave * amplitude * 0.32);
        pulse.scale.setScalar(0.8 + Math.abs(wave) * 0.65);
        pulse.material.opacity = 0.28 + (1 - Math.abs(travel - 0.5) * 2) * 0.58;
      });
    };
  }

  createEmFieldGrid(plane, color) {
    const { THREE } = this;
    const size = 4.2;
    const span = 7;
    const divisions = 10;
    const positions = [];
    const half = size / 2;
    const halfSpan = span / 2;

    for (let i = 0; i <= divisions; i += 1) {
      const x = -halfSpan + (span * i) / divisions;
      if (plane === "xy") {
        positions.push(x, -half, 0, x, half, 0);
      } else {
        positions.push(x, 0, -half, x, 0, half);
      }
    }

    for (let i = 0; i <= divisions; i += 1) {
      const v = -half + (size * i) / divisions;
      if (plane === "xy") {
        positions.push(-halfSpan, v, 0, halfSpan, v, 0);
      } else {
        positions.push(-halfSpan, 0, v, halfSpan, 0, v);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.24
    }));
  }

  addThermodynamicsModel() {
    const { THREE, modelGroup } = this;
    const box = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(3.8, 2.5, 2.5)),
      new THREE.LineBasicMaterial({ color: COLORS.violet, transparent: true, opacity: 0.62 })
    );
    modelGroup.add(box);

    const particles = [];
    for (let i = 0; i < 34; i += 1) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 12, 8),
        this.material(i % 3 === 0 ? COLORS.brightViolet : COLORS.electric, 0.24)
      );
      particle.position.set((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 1.8, (Math.random() - 0.5) * 1.8);
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.026,
        (Math.random() - 0.5) * 0.026,
        (Math.random() - 0.5) * 0.026
      );
      particles.push(particle);
      modelGroup.add(particle);
    }

    this.dynamic = () => {
      particles.forEach((particle) => {
        particle.position.add(particle.userData.velocity);
        [["x", 1.86], ["y", 1.2], ["z", 1.2]].forEach(([axis, limit]) => {
          if (Math.abs(particle.position[axis]) > limit) {
            particle.position[axis] = Math.sign(particle.position[axis]) * limit;
            particle.userData.velocity[axis] *= -1;
          }
        });
      });
    };
  }

  addMathematicsModel() {
    const { THREE, modelGroup } = this;
    const original = new THREE.ArrowHelper(new THREE.Vector3(1, 0.4, 0.25).normalize(), new THREE.Vector3(-1.5, -0.6, 0), 1.3, COLORS.electric, 0.16, 0.08);
    const transformed = new THREE.ArrowHelper(new THREE.Vector3(0.45, 1, 0.35).normalize(), new THREE.Vector3(0.4, -0.6, 0), 1.75, COLORS.brightViolet, 0.18, 0.09);
    modelGroup.add(original, transformed);

    const grid = this.addGrid(4.6, 10, -0.85);
    const positions = grid.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += positions[i + 2] * 0.28;
      positions[i + 1] += Math.sin(positions[i] * 1.4) * 0.08;
    }
    grid.geometry.attributes.position.needsUpdate = true;

    this.dynamic = (time) => {
      transformed.setDirection(new THREE.Vector3(0.5 + Math.sin(time) * 0.18, 1, 0.3).normalize());
      transformed.setLength(1.55 + Math.sin(time * 0.8) * 0.2, 0.18, 0.09);
    };
  }

  addQftModel() {
    const { THREE, modelGroup } = this;
    const size = 32;
    const segmentCount = size * (size - 1) * 2;
    const positions = new Float32Array(segmentCount * 2 * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const lattice = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: COLORS.luminousViolet, transparent: true, opacity: 0.62 }));
    modelGroup.add(lattice);

    this.dynamic = (time) => {
      let cursor = 0;
      const span = 5;
      for (let i = 0; i < size; i += 1) {
        const a = -span / 2 + (span * i) / (size - 1);
        for (let j = 0; j < size - 1; j += 1) {
          const b1 = -span / 2 + (span * j) / (size - 1);
          const b2 = -span / 2 + (span * (j + 1)) / (size - 1);
          cursor = this.writeFieldSegment(positions, cursor, a, b1, a, b2, time);
          cursor = this.writeFieldSegment(positions, cursor, b1, a, b2, a, time);
        }
      }
      geometry.attributes.position.needsUpdate = true;
    };
  }

  writeFieldSegment(positions, cursor, x1, z1, x2, z2, time) {
    positions[cursor++] = x1;
    positions[cursor++] = Math.sin(x1 * 2.2 + z1 * 1.4 + time) * 0.28 + Math.cos(z1 * 2 - time * 0.7) * 0.18;
    positions[cursor++] = z1;
    positions[cursor++] = x2;
    positions[cursor++] = Math.sin(x2 * 2.2 + z2 * 1.4 + time) * 0.28 + Math.cos(z2 * 2 - time * 0.7) * 0.18;
    positions[cursor++] = z2;
    return cursor;
  }

  addChemistryModel() {
    const { THREE, modelGroup } = this;
    const central = this.atom(0.24, COLORS.brightViolet);
    modelGroup.add(central);
    const positions = [
      new THREE.Vector3(1, 1, 1),
      new THREE.Vector3(-1, -1, 1),
      new THREE.Vector3(-1, 1, -1),
      new THREE.Vector3(1, -1, -1)
    ].map((point) => point.normalize().multiplyScalar(1.22));

    positions.forEach((position, index) => {
      const atom = this.atom(0.14, index % 2 ? COLORS.electric : COLORS.luminousViolet);
      atom.position.copy(position);
      modelGroup.add(atom);
      modelGroup.add(this.bond(new THREE.Vector3(), position));
    });

    this.dynamic = (_time, delta) => {
      modelGroup.rotation.y += delta * 0.22;
      modelGroup.rotation.x = 0.18;
    };
  }

  addBiologyModel() {
    const { THREE, modelGroup } = this;
    const leftPoints = [];
    const rightPoints = [];
    const turns = 2.8;
    const steps = 56;

    for (let i = 0; i < steps; i += 1) {
      const t = (i / (steps - 1)) * Math.PI * 2 * turns;
      const y = -1.7 + (i / (steps - 1)) * 3.4;
      leftPoints.push(new THREE.Vector3(Math.cos(t) * 0.72, y, Math.sin(t) * 0.72));
      rightPoints.push(new THREE.Vector3(Math.cos(t + Math.PI) * 0.72, y, Math.sin(t + Math.PI) * 0.72));
    }

    modelGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(leftPoints), new THREE.LineBasicMaterial({ color: COLORS.brightViolet })));
    modelGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(rightPoints), new THREE.LineBasicMaterial({ color: COLORS.electric })));

    for (let i = 0; i < steps; i += 4) {
      const rung = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([leftPoints[i], rightPoints[i]]),
        new THREE.LineBasicMaterial({ color: COLORS.luminousViolet, transparent: true, opacity: 0.7 })
      );
      modelGroup.add(rung);
      const beadA = this.atom(0.055, COLORS.brightViolet);
      const beadB = this.atom(0.055, COLORS.electric);
      beadA.position.copy(leftPoints[i]);
      beadB.position.copy(rightPoints[i]);
      modelGroup.add(beadA, beadB);
    }

    this.dynamic = (_time, delta) => {
      modelGroup.rotation.y += delta * 0.28;
    };
  }

  addNeuroscienceModel() {
    const { THREE, modelGroup } = this;
    const nodes = [
      [-1.9, 0.9, 0], [-0.9, -0.55, 0.55], [0.3, 0.65, -0.45], [1.4, -0.35, 0.25], [2, 0.85, -0.2],
      [-1.4, -1.1, -0.45], [0.8, -1.05, 0.6]
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z));
    const edges = [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 6], [6, 3], [0, 2], [2, 6]];
    const pulses = [];

    nodes.forEach((position, index) => {
      const node = this.atom(index === 2 ? 0.18 : 0.13, index % 2 ? COLORS.electric : COLORS.brightViolet);
      node.position.copy(position);
      modelGroup.add(node);
    });
    edges.forEach(([a, b], index) => {
      modelGroup.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([nodes[a], nodes[b]]),
        new THREE.LineBasicMaterial({ color: COLORS.violet, transparent: true, opacity: 0.56 })
      ));
      const pulse = this.atom(0.055, COLORS.luminousViolet);
      pulse.userData = { a: nodes[a], b: nodes[b], offset: index / edges.length };
      pulses.push(pulse);
      modelGroup.add(pulse);
    });

    this.dynamic = (time) => {
      pulses.forEach((pulse) => {
        const t = (time * 0.28 + pulse.userData.offset) % 1;
        pulse.position.copy(pulse.userData.a).lerp(pulse.userData.b, t);
      });
    };
  }

  addComplexSystemsModel() {
    const { THREE, modelGroup } = this;
    const nodes = [];
    const edges = [];

    for (let i = 0; i < 24; i += 1) {
      const cluster = i % 3;
      const angle = (i / 8) * Math.PI * 2;
      const center = new THREE.Vector3((cluster - 1) * 1.55, Math.sin(cluster) * 0.3, Math.cos(cluster) * 0.35);
      const position = center.add(new THREE.Vector3(Math.cos(angle) * 0.65, Math.sin(angle * 1.7) * 0.52, Math.sin(angle) * 0.65));
      nodes.push(position);
      const node = this.atom(i % 7 === 0 ? 0.13 : 0.08, i % 2 ? COLORS.electric : COLORS.brightViolet);
      node.position.copy(position);
      modelGroup.add(node);
    }

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        if ((i * 17 + j * 11) % 13 < 3) {
          edges.push([i, j]);
        }
      }
    }

    edges.slice(0, 42).forEach(([a, b]) => {
      modelGroup.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([nodes[a], nodes[b]]),
        new THREE.LineBasicMaterial({ color: COLORS.violet, transparent: true, opacity: 0.42 })
      ));
    });

    this.dynamic = (_time, delta) => {
      modelGroup.rotation.y += delta * 0.18;
    };
  }

  atom(radius, color) {
    return new this.THREE.Mesh(new this.THREE.SphereGeometry(radius, 24, 12), this.material(color, 0.34));
  }

  bond(from, to) {
    const { THREE } = this;
    const midpoint = from.clone().add(to).multiplyScalar(0.5);
    const direction = to.clone().sub(from);
    const length = direction.length();
    const cylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, length, 12),
      this.material(COLORS.violet, 0.18)
    );

    cylinder.position.copy(midpoint);
    cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return cylinder;
  }

  material(color, opacity = 0.5) {
    return new this.THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: opacity,
      roughness: 0.35,
      metalness: 0.18
    });
  }

  bindInteraction() {
    this.canvas.addEventListener("pointerdown", (event) => {
      this.canvas.setPointerCapture(event.pointerId);
      this.pointer = {
        x: event.clientX,
        y: event.clientY,
        yaw: this.state.yaw,
        pitch: this.state.pitch
      };
    });

    this.canvas.addEventListener("pointermove", (event) => {
      if (!this.pointer) {
        return;
      }

      const dx = event.clientX - this.pointer.x;
      const dy = event.clientY - this.pointer.y;
      this.state.yaw = this.pointer.yaw + dx * 0.006;
      this.state.pitch = Math.max(-0.72, Math.min(0.72, this.pointer.pitch + dy * 0.004));
    });

    this.canvas.addEventListener("pointerup", () => {
      this.pointer = null;
    });
    this.canvas.addEventListener("pointercancel", () => {
      this.pointer = null;
    });

    this.canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      this.state.distance = Math.max(4.4, Math.min(11.5, this.state.distance + event.deltaY * 0.006));
    }, { passive: false });

    bindPinchZoom(this.canvas, {
      getValue: () => this.state.distance,
      setValue: (value) => {
        this.state.distance = value;
      },
      min: 4.4,
      max: 11.5,
      inverted: true
    });
  }

  setupObservers() {
    window.addEventListener("resize", this.handleResize, { passive: true });

    this.resizeObserver = new ResizeObserver(this.handleResize);
    this.resizeObserver.observe(this.frame);

    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
    }, { threshold: 0.05 });
    this.intersectionObserver.observe(this.container);
  }

  resize() {
    if (!this.renderer || !this.frame) {
      return;
    }

    const rect = this.frame.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  updateCamera() {
    const { THREE, camera, state } = this;
    const radius = state.distance;
    const cosPitch = Math.cos(state.pitch);
    camera.position.set(
      Math.sin(state.yaw) * radius * cosPitch,
      Math.sin(state.pitch) * radius + 0.6,
      Math.cos(state.yaw) * radius * cosPitch
    );
    camera.lookAt(new THREE.Vector3(0, 0, 0));
  }

  render(timestamp = 0) {
    if (this.destroyed) {
      return;
    }

    const time = timestamp * 0.001;
    const delta = Math.min(0.05, Math.max(0, time - this.lastTimestamp));
    this.lastTimestamp = time;

    if (this.visible) {
      const reduced = document.body.dataset.motion === "reduced";
      const motionScale = reduced ? 0.35 : 1;
      this.dynamic?.(time * motionScale, delta * motionScale);
      this.updateCamera();
      this.renderer.render(this.scene, this.camera);
    }

    this.animationFrame = requestAnimationFrame(this.render);
  }
}

function loadThree() {
  if (!threePromise) {
    threePromise = import("https://unpkg.com/three@0.160.0/build/three.module.js");
  }

  return threePromise;
}
