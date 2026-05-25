import { bindPinchZoom, isModelPanGesture, panObjectFromPointer } from "./model-pan.js?v=20260524-source-markers-v1";

const mountedModels = new WeakSet();
let threePromise = null;

export function initWormholeModels(root = document) {
  root.querySelectorAll("[data-wormhole-model]").forEach((container) => {
    if (mountedModels.has(container)) {
      return;
    }

    mountedModels.add(container);
    new WormholeModel(container);
  });
}

class WormholeModel {
  constructor(container) {
    this.container = container;
    this.frame = container.querySelector("[data-wormhole-frame]") ?? container;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "wormhole-model__canvas";
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute("aria-label", this.copy("canvasLabel"));
    this.canvas.setAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight ArrowUp ArrowDown + -");
    this.frame.replaceChildren(this.canvas);

    this.state = {
      autoTraverse: true,
      flySpeed: 0.5,
      throatRadius: 0.72,
      mouthRadius: 2.6,
      tunnelLength: 5.8,
      flareShape: 0.65,
      redshiftGlow: 0.75,
      exoticStress: 0.75,
      twist: 0
    };
    this.pointer = null;
    this.visible = true;
    this.destroyed = false;
    this.lastTimestamp = 0;
    this.traverse = -0.5;
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
        en: "Interactive three dimensional Einstein Rosen bridge model with two curved spacetime sheets and a luminous throat.",
        es: "Modelo interactivo tridimensional de puente de Einstein Rosen con dos laminas curvas de espaciotiempo y una garganta luminosa."
      },
      fallback: {
        en: "The wormhole model could not load in this browser.",
        es: "El modelo de agujero de gusano no pudo cargarse en este navegador."
      },
      readout: {
        en: "Distance to throat center",
        es: "Distancia al centro de la garganta"
      },
      units: {
        en: "units",
        es: "unidades"
      },
      hint: {
        en: "drag to rotate · Shift/Alt or right-drag to move · scroll to zoom",
        es: "arrastra para rotar · Shift/Alt o clic derecho para mover · desplaza para acercar"
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
    this.scene.background = new THREE.Color(0x030007);
    this.scene.fog = new THREE.FogExp2(0x030007, 0.032);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 120);
    this.camera.position.set(0, 4.4, 13.2);
    this.camera.lookAt(0, 0, 0);

    this.modelGroup = new THREE.Group();
    this.modelGroup.rotation.x = -0.34;
    this.modelGroup.rotation.y = -0.55;
    this.modelGroup.scale.setScalar(0.9);
    this.scene.add(this.modelGroup);

    this.addLights();
    this.addStarfield();
    this.addBridge();
    this.addTraveler();
    this.addHint();
    this.bindControls();
    this.bindCanvas();
    this.setupObservers();
    this.resize();

    this.render = this.render.bind(this);
    this.animationFrame = requestAnimationFrame(this.render);
  }

  addLights() {
    const { THREE, scene } = this;
    scene.add(new THREE.AmbientLight(0xe0c4ff, 0.7));

    const keyLight = new THREE.DirectionalLight(0xbf40ff, 2.2);
    keyLight.position.set(3.5, 6, 5);
    scene.add(keyLight);

    this.throatLight = new THREE.PointLight(0x8a2be2, 4.8, 22);
    this.throatLight.position.set(0, 0, 0);
    scene.add(this.throatLight);

    this.violetLight = new THREE.PointLight(0x7700ff, 3.8, 32);
    this.violetLight.position.set(-4, 3, 4);
    scene.add(this.violetLight);
  }

  addStarfield() {
    const { THREE, scene } = this;
    const count = 520;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const radius = 18 + Math.random() * 24;
      const theta = Math.random() * Math.PI * 2;
      const y = -9 + Math.random() * 18;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * radius;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xe098ff,
      size: 0.045,
      transparent: true,
      opacity: 0.68,
      depthWrite: false
    });

    this.starfield = new THREE.Points(geometry, material);
    scene.add(this.starfield);
  }

  addBridge() {
    const { THREE, modelGroup } = this;

    this.sheetMaterial = new THREE.MeshStandardMaterial({
      color: 0x7700ff,
      emissive: 0x210044,
      emissiveIntensity: 0.52,
      roughness: 0.5,
      metalness: 0.12,
      transparent: true,
      opacity: 0.76,
      side: THREE.DoubleSide
    });

    this.gridMaterial = new THREE.LineBasicMaterial({
      color: 0xe098ff,
      transparent: true,
      opacity: 0.64
    });

    this.throatMaterial = new THREE.MeshStandardMaterial({
      color: 0xbf40ff,
      emissive: 0x8a2be2,
      emissiveIntensity: 0.72,
      roughness: 0.38,
      metalness: 0.18,
      transparent: true,
      opacity: 0.68,
      side: THREE.DoubleSide
    });

    this.throatGridMaterial = new THREE.LineBasicMaterial({
      color: 0xbf40ff,
      transparent: true,
      opacity: 0.72
    });

    this.glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x8a2be2,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.topSheet = new THREE.Mesh(this.createSheetGeometry(1), this.sheetMaterial);
    this.bottomSheet = new THREE.Mesh(this.createSheetGeometry(-1), this.sheetMaterial.clone());
    this.topGrid = new THREE.LineSegments(this.createSheetGridGeometry(1), this.gridMaterial);
    this.bottomGrid = new THREE.LineSegments(this.createSheetGridGeometry(-1), this.gridMaterial.clone());
    this.throat = new THREE.Mesh(this.createThroatGeometry(), this.throatMaterial);
    this.throatGrid = new THREE.LineSegments(this.createThroatGridGeometry(), this.throatGridMaterial);
    this.centerGlow = new THREE.Mesh(this.createGlowGeometry(), this.glowMaterial);

    this.topMouthRing = this.createGuideRing(1, 0x8a2be2, 0.9, 1);
    this.bottomMouthRing = this.createGuideRing(1, 0x8a2be2, 0.9, -1);
    this.topOuterRing = this.createGuideRing(2, 0xe098ff, 0.46, 1);
    this.bottomOuterRing = this.createGuideRing(2, 0xe098ff, 0.46, -1);

    modelGroup.add(
      this.topSheet,
      this.bottomSheet,
      this.topGrid,
      this.bottomGrid,
      this.throat,
      this.throatGrid,
      this.centerGlow,
      this.topMouthRing,
      this.bottomMouthRing,
      this.topOuterRing,
      this.bottomOuterRing
    );
    this.updateRingGeometry();
    this.updateVisualParameters();
  }

  getBridgeMetrics() {
    const throatRadius = clamp(this.state.throatRadius, 0.35, 1.8);
    const mouthRadius = Math.max(this.state.mouthRadius, throatRadius + 0.8);
    const separation = clamp(this.state.tunnelLength, 3.6, 10);
    const sheetY = separation / 2;
    const throatHalf = Math.min(sheetY * 0.62, Math.max(0.86, throatRadius * 1.08));
    const sheetSize = Math.max(7.2, mouthRadius * 2.75);
    const influenceRadius = Math.min(sheetSize * 0.68, Math.max(mouthRadius, throatRadius + 1.35));
    const holeRadius = throatRadius * 1.02;

    return {
      throatRadius,
      mouthRadius,
      separation,
      sheetY,
      throatHalf,
      sheetSize,
      influenceRadius,
      holeRadius
    };
  }

  sheetHeight(sign, radius) {
    const metrics = this.getBridgeMetrics();
    const t = smoothstep(metrics.holeRadius, metrics.influenceRadius, radius);
    const shaped = Math.pow(t, Math.max(0.2, this.state.flareShape));
    return sign * (metrics.throatHalf + (metrics.sheetY - metrics.throatHalf) * shaped);
  }

  throatPoint(v, angle) {
    const metrics = this.getBridgeMetrics();
    const edge = Math.abs(v);
    const radius = metrics.throatRadius * (0.58 + 0.5 * Math.pow(edge, 1.7));
    const twistedAngle = angle + this.state.twist * v;

    return {
      x: Math.cos(twistedAngle) * radius,
      y: v * metrics.throatHalf,
      z: Math.sin(twistedAngle) * radius
    };
  }

  createSheetGeometry(sign) {
    const { THREE } = this;
    const metrics = this.getBridgeMetrics();
    const gridSteps = 72;
    const halfSize = metrics.sheetSize / 2;
    const positions = [];
    const indices = [];

    for (let row = 0; row <= gridSteps; row += 1) {
      const z = -halfSize + (metrics.sheetSize * row) / gridSteps;

      for (let col = 0; col <= gridSteps; col += 1) {
        const x = -halfSize + (metrics.sheetSize * col) / gridSteps;
        const radius = Math.max(Math.hypot(x, z), metrics.holeRadius);
        positions.push(x, this.sheetHeight(sign, radius), z);
      }
    }

    const columns = gridSteps + 1;
    const outsideHole = (x, z) => Math.hypot(x, z) >= metrics.holeRadius * 1.02;

    for (let row = 0; row < gridSteps; row += 1) {
      const z1 = -halfSize + (metrics.sheetSize * row) / gridSteps;
      const z2 = -halfSize + (metrics.sheetSize * (row + 1)) / gridSteps;

      for (let col = 0; col < gridSteps; col += 1) {
        const x1 = -halfSize + (metrics.sheetSize * col) / gridSteps;
        const x2 = -halfSize + (metrics.sheetSize * (col + 1)) / gridSteps;
        if (
          !outsideHole(x1, z1) ||
          !outsideHole(x2, z1) ||
          !outsideHole(x1, z2) ||
          !outsideHole(x2, z2)
        ) {
          continue;
        }

        const a = row * columns + col;
        const b = a + 1;
        const c = a + columns;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  createSheetGridGeometry(sign) {
    const { THREE } = this;
    const metrics = this.getBridgeMetrics();
    const halfSize = metrics.sheetSize / 2;
    const positions = [];

    const pushPoint = (x, z) => {
      const radius = Math.max(Math.hypot(x, z), metrics.holeRadius);
      positions.push(
        x,
        this.sheetHeight(sign, radius) + sign * 0.014,
        z
      );
    };

    const pushSegment = (x1, z1, x2, z2) => {
      if (
        Math.hypot(x1, z1) < metrics.holeRadius * 1.05 ||
        Math.hypot(x2, z2) < metrics.holeRadius * 1.05
      ) {
        return;
      }

      pushPoint(x1, z1);
      pushPoint(x2, z2);
    };

    const gridLines = 18;
    const lineSamples = 156;
    for (let line = 0; line <= gridLines; line += 1) {
      const fixed = -halfSize + (metrics.sheetSize * line) / gridLines;

      for (let sample = 0; sample < lineSamples; sample += 1) {
        const start = -halfSize + (metrics.sheetSize * sample) / lineSamples;
        const end = -halfSize + (metrics.sheetSize * (sample + 1)) / lineSamples;
        pushSegment(start, fixed, end, fixed);
        pushSegment(fixed, start, fixed, end);
      }
    }

    const mouthSegments = 96;
    const mouthRadius = metrics.holeRadius * 1.08;
    for (let segment = 0; segment < mouthSegments; segment += 1) {
      const angle1 = (Math.PI * 2 * segment) / mouthSegments;
      const angle2 = (Math.PI * 2 * (segment + 1)) / mouthSegments;
      pushPoint(Math.cos(angle1) * mouthRadius, Math.sin(angle1) * mouthRadius);
      pushPoint(Math.cos(angle2) * mouthRadius, Math.sin(angle2) * mouthRadius);
    }

    const contourCount = 3;
    const contourSegments = 112;
    for (let ring = 0; ring < contourCount; ring += 1) {
      const radius = metrics.holeRadius + ((metrics.influenceRadius - metrics.holeRadius) * (ring + 1)) / (contourCount + 1);
      for (let segment = 0; segment < contourSegments; segment += 1) {
        const angle1 = (Math.PI * 2 * segment) / contourSegments;
        const angle2 = (Math.PI * 2 * (segment + 1)) / contourSegments;
        pushPoint(Math.cos(angle1) * radius, Math.sin(angle1) * radius);
        pushPoint(Math.cos(angle2) * radius, Math.sin(angle2) * radius);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }

  createThroatGeometry() {
    const { THREE } = this;
    const radialSegments = 68;
    const heightSegments = 54;
    const positions = [];
    const indices = [];

    for (let row = 0; row <= heightSegments; row += 1) {
      const v = -1 + (2 * row) / heightSegments;

      for (let col = 0; col <= radialSegments; col += 1) {
        const angle = (Math.PI * 2 * col) / radialSegments;
        const point = this.throatPoint(v, angle);
        positions.push(point.x, point.y, point.z);
      }
    }

    const columns = radialSegments + 1;
    for (let row = 0; row < heightSegments; row += 1) {
      for (let col = 0; col < radialSegments; col += 1) {
        const a = row * columns + col;
        const b = a + 1;
        const c = a + columns;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  createThroatGridGeometry() {
    const { THREE } = this;
    const radialSegments = 56;
    const heightSegments = 42;
    const positions = [];

    const pushPoint = (v, angle) => {
      const point = this.throatPoint(v, angle);
      positions.push(point.x, point.y, point.z);
    };

    for (let row = 0; row <= heightSegments; row += 3) {
      const v = -1 + (2 * row) / heightSegments;
      for (let col = 0; col < radialSegments; col += 1) {
        pushPoint(v, (Math.PI * 2 * col) / radialSegments);
        pushPoint(v, (Math.PI * 2 * (col + 1)) / radialSegments);
      }
    }

    for (let col = 0; col < radialSegments; col += 4) {
      const angle = (Math.PI * 2 * col) / radialSegments;
      for (let row = 0; row < heightSegments; row += 1) {
        pushPoint(-1 + (2 * row) / heightSegments, angle);
        pushPoint(-1 + (2 * (row + 1)) / heightSegments, angle);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }

  createGlowGeometry() {
    const { THREE } = this;
    const metrics = this.getBridgeMetrics();
    return new THREE.SphereGeometry(metrics.throatRadius * 0.72, 36, 36);
  }

  createGuideRing(radius, color, opacity, y) {
    const { THREE } = this;
    const geometry = new THREE.TorusGeometry(radius, 0.026, 12, 120);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    return ring;
  }

  updateRingGeometry() {
    const metrics = this.getBridgeMetrics();
    const mouthRingRadius = metrics.throatRadius * 1.04;
    const outerRingRadius = metrics.influenceRadius * 0.92;

    this.replaceGeometry(this.topMouthRing, new this.THREE.TorusGeometry(mouthRingRadius, 0.026, 12, 120));
    this.replaceGeometry(this.bottomMouthRing, new this.THREE.TorusGeometry(mouthRingRadius, 0.026, 12, 120));
    this.replaceGeometry(this.topOuterRing, new this.THREE.TorusGeometry(outerRingRadius, 0.016, 10, 128));
    this.replaceGeometry(this.bottomOuterRing, new this.THREE.TorusGeometry(outerRingRadius, 0.016, 10, 128));
    this.topMouthRing.position.y = metrics.throatHalf;
    this.bottomMouthRing.position.y = -metrics.throatHalf;
    this.topOuterRing.position.y = metrics.sheetY + 0.018;
    this.bottomOuterRing.position.y = -metrics.sheetY - 0.018;
  }

  replaceGeometry(object, geometry) {
    object.geometry.dispose();
    object.geometry = geometry;
  }

  addTraveler() {
    const { THREE, modelGroup } = this;
    const geometry = new THREE.SphereGeometry(0.13, 24, 24);
    const material = new THREE.MeshStandardMaterial({
      color: 0xbf40ff,
      emissive: 0x8a2be2,
      emissiveIntensity: 0.95,
      roughness: 0.32,
      metalness: 0.08
    });

    this.traveler = new THREE.Mesh(geometry, material);
    this.travelerGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 24, 24),
      new THREE.MeshBasicMaterial({
        color: 0xbf40ff,
        transparent: true,
        opacity: 0.24,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    modelGroup.add(this.travelerGlow, this.traveler);
  }

  updateVisualParameters() {
    if (!this.sheetMaterial || !this.gridMaterial || !this.throatMaterial) {
      return;
    }

    const redshiftGlow = clamp(this.state.redshiftGlow, 0, 1);
    const exoticStress = clamp(this.state.exoticStress, 0.1, 1);

    this.sheetMaterial.emissiveIntensity = 0.28 + redshiftGlow * 0.42;
    this.sheetMaterial.opacity = 0.58 + redshiftGlow * 0.18;
    this.bottomSheet.material.emissiveIntensity = this.sheetMaterial.emissiveIntensity;
    this.bottomSheet.material.opacity = this.sheetMaterial.opacity;
    this.gridMaterial.opacity = 0.26 + exoticStress * 0.52;
    this.bottomGrid.material.opacity = this.gridMaterial.opacity;
    this.throatMaterial.emissiveIntensity = 0.42 + redshiftGlow * 0.88;
    this.throatMaterial.opacity = 0.52 + redshiftGlow * 0.22;
    this.throatGridMaterial.opacity = 0.26 + exoticStress * 0.58;
    this.glowMaterial.opacity = 0.1 + redshiftGlow * 0.18;
    this.centerGlow.scale.setScalar(1 + redshiftGlow * 0.18);

    if (this.throatLight) {
      this.throatLight.intensity = 2.7 + redshiftGlow * 3.3;
    }

    if (this.violetLight) {
      this.violetLight.intensity = 2.5 + exoticStress * 1.9;
    }
  }

  rebuildGeometry() {
    this.replaceGeometry(this.topSheet, this.createSheetGeometry(1));
    this.replaceGeometry(this.bottomSheet, this.createSheetGeometry(-1));
    this.replaceGeometry(this.topGrid, this.createSheetGridGeometry(1));
    this.replaceGeometry(this.bottomGrid, this.createSheetGridGeometry(-1));
    this.replaceGeometry(this.throat, this.createThroatGeometry());
    this.replaceGeometry(this.throatGrid, this.createThroatGridGeometry());
    this.replaceGeometry(this.centerGlow, this.createGlowGeometry());
    this.updateRingGeometry();
    this.updateVisualParameters();
  }

  addHint() {
    const hint = document.createElement("p");
    hint.className = "wormhole-model__hint";
    hint.textContent = this.copy("hint");
    this.frame.after(hint);
  }

  bindControls() {
    const geometryParams = new Set(["throatRadius", "mouthRadius", "tunnelLength", "flareShape", "twist"]);
    const visualParams = new Set(["redshiftGlow", "exoticStress"]);

    this.container.querySelectorAll("[data-wm-param]").forEach((control) => {
      const key = control.dataset.wmParam;
      this.state[key] = Number(control.value);
      this.syncValue(key);
      control.addEventListener("input", () => {
        this.state[key] = Number(control.value);
        this.syncValue(key);
        if (geometryParams.has(key)) {
          this.rebuildGeometry();
        }
        if (visualParams.has(key)) {
          this.updateVisualParameters();
        }
      });
    });

    this.container.querySelectorAll("[data-wm-toggle]").forEach((control) => {
      const key = control.dataset.wmToggle;
      this.state[key] = control.checked;
      control.addEventListener("change", () => {
        this.state[key] = control.checked;
      });
    });

    this.container.querySelector("[data-wm-action='reset']")?.addEventListener("click", () => {
      this.modelGroup.position.set(0, 0, 0);
      this.modelGroup.rotation.x = -0.34;
      this.modelGroup.rotation.y = -0.55;
      this.modelGroup.scale.setScalar(0.9);
      this.camera.position.set(0, 4.4, 13.2);
      this.camera.lookAt(this.modelGroup.position);
    });
  }

  syncValue(key) {
    const target = this.container.querySelector(`[data-wm-value='${key}']`);
    if (!target) {
      return;
    }

    const precision = key === "throatRadius" || key === "tunnelLength" || key === "flareShape" || key === "twist"
      ? 2
      : 1;
    target.textContent = this.state[key].toFixed(precision);
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
          position: this.modelGroup.position.clone()
        };
        this.canvas.setPointerCapture(event.pointerId);
        return;
      }

      this.pointer = {
        id: event.pointerId,
        mode: "orbit",
        x: event.clientX,
        y: event.clientY,
        rotationX: this.modelGroup.rotation.x,
        rotationY: this.modelGroup.rotation.y
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
          object: this.modelGroup,
          startPosition: this.pointer.position,
          startX: this.pointer.x,
          startY: this.pointer.y,
          event,
          distance: this.camera.position.distanceTo(this.modelGroup.position)
        });
        return;
      }

      this.modelGroup.rotation.y = this.pointer.rotationY + (event.clientX - this.pointer.x) * 0.008;
      this.modelGroup.rotation.x = clamp(
        this.pointer.rotationX + (event.clientY - this.pointer.y) * 0.006,
        -1.1,
        1.1
      );
    });

    this.canvas.addEventListener("pointerup", (event) => {
      if (this.pointer?.id === event.pointerId) {
        this.pointer = null;
      }
    });

    this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());

    this.canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      this.camera.position.z = clamp(this.camera.position.z + Math.sign(event.deltaY) * 0.55, 7, 24);
      this.camera.lookAt(this.modelGroup.position);
    }, { passive: false });

    bindPinchZoom(this.canvas, {
      getValue: () => this.camera.position.z,
      setValue: (value) => {
        this.camera.position.z = value;
      },
      min: 7,
      max: 24,
      inverted: true,
      onStart: () => {
        this.pointer = null;
      },
      onChange: () => this.camera.lookAt(this.modelGroup.position)
    });

    this.canvas.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "ArrowLeft":
          this.modelGroup.rotation.y -= 0.12;
          break;
        case "ArrowRight":
          this.modelGroup.rotation.y += 0.12;
          break;
        case "ArrowUp":
          this.modelGroup.rotation.x = clamp(this.modelGroup.rotation.x - 0.1, -1.1, 1.1);
          break;
        case "ArrowDown":
          this.modelGroup.rotation.x = clamp(this.modelGroup.rotation.x + 0.1, -1.1, 1.1);
          break;
        case "+":
        case "=":
          this.camera.position.z = clamp(this.camera.position.z - 0.55, 7, 24);
          this.camera.lookAt(this.modelGroup.position);
          break;
        case "-":
        case "_":
          this.camera.position.z = clamp(this.camera.position.z + 0.55, 7, 24);
          this.camera.lookAt(this.modelGroup.position);
          break;
        default:
          return;
      }

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
    const height = Math.max(200, Math.floor(rect.height || width * 9 / 16));
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
    const metrics = this.getBridgeMetrics();

    if (this.visible && document.body.dataset.motion !== "reduced") {
      this.starfield.rotation.y += deltaTime * 0.01;
      this.throatGrid.rotation.y += deltaTime * 0.05;
      this.centerGlow.rotation.y += deltaTime * 0.3;

      if (this.state.autoTraverse) {
        this.traverse += deltaTime * this.state.flySpeed * 0.12;
        if (this.traverse > 0.5) {
          this.traverse = -0.5;
        }
      }
    }

    const y = this.traverse * metrics.separation;
    const orbitRadius = metrics.throatRadius * 0.26 * (1 - Math.min(Math.abs(this.traverse) * 1.4, 0.8));
    const phase = timestamp * 0.002;
    const x = Math.cos(phase) * orbitRadius;
    const z = Math.sin(phase) * orbitRadius;
    this.traveler.position.set(x, y, z);
    this.travelerGlow.position.copy(this.traveler.position);
    this.updateReadout(Math.abs(y));
    this.renderer.render(this.scene, this.camera);
    this.animationFrame = requestAnimationFrame(this.render);
  }

  updateReadout(distance) {
    const readout = this.container.querySelector("[data-wm-readout]");
    if (readout) {
      readout.textContent = `${this.copy("readout")}: ${distance.toFixed(1)} ${this.copy("units")}`;
    }
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

function loadThree() {
  if (!threePromise) {
    threePromise = import("https://unpkg.com/three@0.160.0/build/three.module.js");
  }

  return threePromise;
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
