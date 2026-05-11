async function loadShaderSource(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Unable to load shader: ${url}`);
  }

  return response.text();
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message || "Shader compilation failed.");
  }

  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(message || "Program linking failed.");
  }

  return program;
}

function createStars(count) {
  const values = new Float32Array(count * 4);

  for (let index = 0; index < count; index += 1) {
    const offset = index * 4;
    values[offset] = Math.random() * 2 - 1;
    values[offset + 1] = Math.random() * 2 - 1;
    values[offset + 2] = 1.5 + Math.random() * 3.5;
    values[offset + 3] = 0.25 + Math.random() * 0.75;
  }

  return values;
}

export async function initBackground(canvas) {
  const gl = canvas.getContext("webgl2", { alpha: true, antialias: true });

  if (!gl) {
    document.body.classList.add("background-fallback");
    return;
  }

  try {
    const vertexUrl = new URL("../shaders/starfield.vert.glsl", import.meta.url);
    const fragmentUrl = new URL("../shaders/starfield.frag.glsl", import.meta.url);
    const [vertexSource, fragmentSource] = await Promise.all([
      loadShaderSource(vertexUrl),
      loadShaderSource(fragmentUrl)
    ]);

    const program = createProgram(gl, vertexSource, fragmentSource);
    const stars = createStars(320);
    const buffer = gl.createBuffer();
    let animationTime = 0;
    let lastFrame = null;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, stars, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const sizeLocation = gl.getAttribLocation(program, "a_size");
    const twinkleLocation = gl.getAttribLocation(program, "a_twinkle");
    const pixelRatioLocation = gl.getUniformLocation(program, "u_pixel_ratio");
    const timeLocation = gl.getUniformLocation(program, "u_time");

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);

    gl.enableVertexAttribArray(sizeLocation);
    gl.vertexAttribPointer(sizeLocation, 1, gl.FLOAT, false, 16, 8);

    gl.enableVertexAttribArray(twinkleLocation);
    gl.vertexAttribPointer(twinkleLocation, 1, gl.FLOAT, false, 16, 12);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.floor(canvas.clientWidth * pixelRatio);
      const height = Math.floor(canvas.clientHeight * pixelRatio);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.uniform1f(pixelRatioLocation, pixelRatio);
    };

    const render = (timestamp) => {
      if (lastFrame === null) {
        lastFrame = timestamp;
      }

      const freezeMotion = document.body.dataset.motion === "reduced";
      const frameDelta = Math.min(timestamp - lastFrame, 32);
      lastFrame = timestamp;

      if (!freezeMotion) {
        animationTime += frameDelta * 0.001;
      }

      resize();
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform1f(timeLocation, animationTime);
      gl.drawArrays(gl.POINTS, 0, stars.length / 4);
      window.requestAnimationFrame(render);
    };

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        lastFrame = null;
      }
    });
    window.requestAnimationFrame(render);
  } catch (error) {
    console.error(error);
    document.body.classList.add("background-fallback");
  }
}
