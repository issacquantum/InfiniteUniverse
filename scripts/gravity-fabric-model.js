import { bindPinchZoom, isModelPanGesture, panObjectFromPointer } from "./model-pan.js?v=20260614-personal-process-trim-v1";

const mountedModels = new WeakSet();
let threePromise = null;

export function initGravityFabricModels(root = document) {
  root.querySelectorAll("[data-gravity-fabric-model]").forEach((container) => {
    if (mountedModels.has(container)) {
      return;
    }

    mountedModels.add(container);
    new GravityFabricModel(container);
  });
}

class GravityFabricModel {
  constructor(container) {
    this.container = container;
    this.frame = container.querySelector("[data-gravity-fabric-frame]") ?? container;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "gravity-fabric__canvas";
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute("aria-label", this.copy("canvasLabel"));
    this.frame.replaceChildren(this.canvas);

    this.running = true;
    this.visible = true;
    this.destroyed = false;
    this.pointer = null;
    this.state = {
      massScale: 1
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
        en: "Three dimensional purple planet bending a neon spacetime grid.",
        es: "Planeta morado tridimensional curvando una red neon de espaciotiempo."
      },
      fallback: {
        en: "The curved-spacetime model could not load in this browser.",
        es: "El modelo de espaciotiempo curvo no pudo cargarse en este navegador."
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
    this.scene.background = new THREE.Color(0x050008);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(44, 1, 0.1, 80);
    this.cameraLookAt = new THREE.Vector3(0, -0.46, 0);
    this.cameraZoomRange = { min: 6.4, max: 12.2 };
    this.camera.position.set(0, 5.05, 9.9);
    this.syncCameraLookAt();

    this.modelGroup = new THREE.Group();
    this.modelGroup.rotation.y = -0.42;
    this.scene.add(this.modelGroup);
    this.planetCenter = { x: 0, z: 0 };
    this.fabricYOffset = -0.1;
    this.planetBaseRadius = 0.48;
    this.planetOrbitAngle = 0;
    this.planetOrbitRadiusX = 3.05;
    this.planetOrbitRadiusZ = 1.85;

    this.addLights();
    this.addStarfield();
    this.addFabric();
    this.addPlanet();
    this.addHint();
    this.bindControls();
    this.bindInteraction();
    this.setupObservers();
    this.resize();

    this.lastTimestamp = 0;
    this.render = this.render.bind(this);
    this.animationFrame = requestAnimationFrame(this.render);
  }

  addLights() {
    const { THREE, scene } = this;
    scene.add(new THREE.AmbientLight(0x9b67ff, 0.72));

    const keyLight = new THREE.PointLight(0xbf40ff, 4.2, 28);
    keyLight.position.set(-3.5, 5, 4.8);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x7700ff, 3.2, 28);
    rimLight.position.set(4, 3.2, -3.8);
    scene.add(rimLight);
  }

  addStarfield() {
    const { THREE, scene } = this;
    const count = 360;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const radius = 14 + Math.random() * 18;
      const theta = Math.random() * Math.PI * 2;
      const height = -1 + Math.random() * 10;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(theta) * radius;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xbf40ff,
      size: 0.035,
      transparent: true,
      opacity: 0.72,
      depthWrite: false
    });

    this.starfield = new THREE.Points(geometry, material);
    scene.add(this.starfield);
  }

  addFabric() {
    const { THREE, modelGroup } = this;
    const size = 10;
    const segments = 62;
    const half = size / 2;
    const gridPositions = [];
    const gridBase = [];

    const pushPoint = (x, z) => {
      gridBase.push(x, z);
      gridPositions.push(x, this.fabricHeight(x, z), z);
    };

    for (let i = 0; i <= segments; i += 1) {
      const a = -half + size * i / segments;
      for (let j = 0; j < segments; j += 1) {
        const z1 = -half + size * j / segments;
        const z2 = -half + size * (j + 1) / segments;
        pushPoint(a, z1);
        pushPoint(a, z2);
      }
      for (let j = 0; j < segments; j += 1) {
        const x1 = -half + size * j / segments;
        const x2 = -half + size * (j + 1) / segments;
        pushPoint(x1, a);
        pushPoint(x2, a);
      }
    }

    const gridGeometry = new THREE.BufferGeometry();
    gridGeometry.setAttribute("position", new THREE.Float32BufferAttribute(gridPositions, 3));
    gridGeometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
    this.fabricGridBase = gridBase;
    this.fabricGridGeometry = gridGeometry;

    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0x7700ff,
      transparent: true,
      opacity: 0.62
    });

    this.fabricGrid = new THREE.LineSegments(gridGeometry, gridMaterial);
    this.fabricGrid.position.y = this.fabricYOffset;
    modelGroup.add(this.fabricGrid);

    const surfacePositions = [];
    const surfaceIndices = [];
    const surfaceBase = [];

    for (let row = 0; row <= segments; row += 1) {
      const z = -half + size * row / segments;
      for (let col = 0; col <= segments; col += 1) {
        const x = -half + size * col / segments;
        surfaceBase.push(x, z);
        surfacePositions.push(x, this.fabricHeight(x, z), z);
      }
    }

    for (let row = 0; row < segments; row += 1) {
      for (let col = 0; col < segments; col += 1) {
        const a = row * (segments + 1) + col;
        const b = a + 1;
        const c = a + segments + 1;
        const d = c + 1;
        surfaceIndices.push(a, c, b, b, c, d);
      }
    }

    const surfaceGeometry = new THREE.BufferGeometry();
    surfaceGeometry.setAttribute("position", new THREE.Float32BufferAttribute(surfacePositions, 3));
    surfaceGeometry.setIndex(surfaceIndices);
    surfaceGeometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
    surfaceGeometry.computeVertexNormals();
    this.fabricSurfaceBase = surfaceBase;
    this.fabricSurfaceGeometry = surfaceGeometry;

    const surfaceMaterial = new THREE.MeshBasicMaterial({
      color: 0x16072e,
      transparent: true,
      opacity: 0.44,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.fabricSurface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
    this.fabricSurface.position.y = this.fabricYOffset;
    modelGroup.add(this.fabricSurface);
  }

  fabricHeight(x, z) {
    const dx = x - this.planetCenter.x;
    const dz = z - this.planetCenter.z;
    const radiusSquared = dx * dx + dz * dz;
    const massScale = this.state.massScale;
    const compactWell = 0.72 * massScale * massScale * Math.exp(-radiusSquared / 0.78);
    const broadWell = 1.28 * massScale * Math.exp(-radiusSquared / 2.45);
    const rim = 0.1 * massScale * Math.exp(-radiusSquared / 8.4);
    const centralThroat = 0.34 * Math.max(0, massScale - 1) * Math.exp(-radiusSquared / 0.18);
    const well = compactWell + broadWell + centralThroat;
    const maxVisibleDepth = 3.05;
    const boundedWell = maxVisibleDepth * Math.tanh(well / maxVisibleDepth);

    return -boundedWell + rim;
  }

  addPlanet() {
    const { THREE, modelGroup } = this;
    const geometry = new THREE.SphereGeometry(0.48, 64, 64);
    const texture = this.createPlanetTexture();
    const material = new THREE.MeshStandardMaterial({
      color: 0xb04dff,
      map: texture,
      emissive: 0x4b008f,
      emissiveIntensity: 0.28,
      roughness: 0.72,
      metalness: 0.0
    });

    this.planet = new THREE.Mesh(geometry, material);
    this.planet.scale.setScalar(this.getPlanetScale());
    this.planet.position.set(0, this.getPlanetSeatY(), 0);
    modelGroup.add(this.planet);
  }

  createPlanetTexture() {
    const { THREE } = this;
    const canvas = document.createElement("canvas");
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createRadialGradient(size * 0.34, size * 0.28, 8, size * 0.5, size * 0.5, size * 0.72);
    gradient.addColorStop(0, "#c79bff");
    gradient.addColorStop(0.28, "#c46cff");
    gradient.addColorStop(0.7, "#8f24ff");
    gradient.addColorStop(1, "#5a009e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    for (let y = 0; y < size; y += 1) {
      const band = Math.sin(y * 0.055) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(191, 64, 255, ${0.035 + band * 0.035})`;
      ctx.fillRect(0, y, size, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  updatePlanetAndFabric(deltaTime) {
    this.planetOrbitAngle += deltaTime * 0.105;
    this.planetCenter.x = Math.cos(this.planetOrbitAngle) * this.planetOrbitRadiusX;
    this.planetCenter.z = Math.sin(this.planetOrbitAngle) * this.planetOrbitRadiusZ;

    const planetScale = this.getPlanetScale();
    const planetY = this.getPlanetSeatY();
    this.planet.position.set(this.planetCenter.x, planetY, this.planetCenter.z);
    this.planet.scale.setScalar(planetScale);
    this.planet.rotation.y += deltaTime * 0.58;
    this.planet.rotation.x += deltaTime * 0.08;
    this.updateFabricGeometry();
  }

  updateFabricGeometry() {
    this.updateHeightAttribute(this.fabricGridGeometry, this.fabricGridBase);
    this.updateHeightAttribute(this.fabricSurfaceGeometry, this.fabricSurfaceBase);
    this.fabricSurfaceGeometry.computeVertexNormals();
  }

  getPlanetScale() {
    return 1;
  }

  getPlanetSeatY() {
    const localFabricHeight = this.fabricHeight(this.planetCenter.x, this.planetCenter.z);
    const radius = this.planetBaseRadius * this.getPlanetScale();
    const surfaceClearance = 0.08;
    return this.fabricYOffset + localFabricHeight + radius + surfaceClearance;
  }

  updateHeightAttribute(geometry, baseCoordinates) {
    const position = geometry.attributes.position;

    for (let i = 0; i < baseCoordinates.length / 2; i += 1) {
      const x = baseCoordinates[i * 2];
      const z = baseCoordinates[i * 2 + 1];
      position.setY(i, this.fabricHeight(x, z));
    }

    position.needsUpdate = true;
  }

  addHint() {
    const hint = document.createElement("p");
    hint.className = "gravity-fabric__hint";
    hint.textContent = this.copy("hint");
    this.container.append(hint);
  }

  bindControls() {
    this.container.querySelectorAll("[data-gf-param]").forEach((control) => {
      const key = control.dataset.gfParam;
      this.state[key] = Number(control.value);
      this.syncValue(key);
      control.addEventListener("input", () => {
        this.state[key] = Number(control.value);
        this.syncValue(key);
        this.updatePlanetPlacement();
        this.updateFabricGeometry();
      });
    });
  }

  syncValue(key) {
    const target = this.container.querySelector(`[data-gf-value='${key}']`);
    if (target) {
      target.textContent = this.state[key].toFixed(2);
    }
  }

  bindInteraction() {
    this.canvas.addEventListener("pointerdown", (event) => {
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
        -0.72,
        0.48
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
      const nextZ = this.camera.position.z + Math.sign(event.deltaY) * 0.45;
      this.camera.position.z = clamp(nextZ, this.cameraZoomRange.min, this.cameraZoomRange.max);
      this.syncCameraLookAt();
    }, { passive: false });

    bindPinchZoom(this.canvas, {
      getValue: () => this.camera.position.z,
      setValue: (value) => {
        this.camera.position.z = value;
      },
      min: this.cameraZoomRange.min,
      max: this.cameraZoomRange.max,
      inverted: true,
      onStart: () => {
        this.pointer = null;
      },
      onChange: () => this.syncCameraLookAt()
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
          this.modelGroup.rotation.x = clamp(this.modelGroup.rotation.x - 0.1, -0.72, 0.48);
          break;
        case "ArrowDown":
          this.modelGroup.rotation.x = clamp(this.modelGroup.rotation.x + 0.1, -0.72, 0.48);
          break;
        case "+":
        case "=":
          this.camera.position.z = clamp(
            this.camera.position.z - 0.45,
            this.cameraZoomRange.min,
            this.cameraZoomRange.max
          );
          this.syncCameraLookAt();
          break;
        case "-":
        case "_":
          this.camera.position.z = clamp(
            this.camera.position.z + 0.45,
            this.cameraZoomRange.min,
            this.cameraZoomRange.max
          );
          this.syncCameraLookAt();
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
    const height = Math.max(260, Math.floor(rect.height || width * 9 / 16));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  syncCameraLookAt() {
    this.camera.lookAt(this.cameraLookAt);
  }

  render(timestamp) {
    if (this.destroyed) {
      return;
    }

    const deltaTime = this.lastTimestamp ? Math.min((timestamp - this.lastTimestamp) / 1000, 0.05) : 0.016;
    this.lastTimestamp = timestamp;

    if (this.visible) {
      const motionScale = document.body.dataset.motion === "reduced" ? 0.42 : 1;
      const scaledDelta = deltaTime * motionScale;

      this.updatePlanetAndFabric(scaledDelta);
      this.starfield.rotation.y += scaledDelta * 0.012;
    }

    this.renderer.render(this.scene, this.camera);
    this.animationFrame = requestAnimationFrame(this.render);
  }

  updatePlanetPlacement() {
    if (!this.planet) {
      return;
    }

    this.planet.position.y = this.getPlanetSeatY();
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
        object.material.forEach((material) => {
          material.map?.dispose?.();
          material.dispose?.();
        });
      } else {
        object.material?.map?.dispose?.();
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
