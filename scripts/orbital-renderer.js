export class OrbitalRenderer {
  constructor(canvas, gl) {
    this.canvas = canvas;
    this.gl = gl;
    this.program = null;
    this.locations = {};
    this.densityBuffer = null;
    this.currentBuffer = null;
    this.densityCount = 0;
    this.currentCount = 0;
  }

  buildProgram(vertexSource, fragmentSource) {
    const gl = this.gl;
    const vertexShader = this.#compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.#compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteProgram(program);
      throw new Error(`Shader link failed: ${message}`);
    }

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    this.program = program;
    this.locations = {
      position: gl.getAttribLocation(program, "a_position"),
      alpha: gl.getAttribLocation(program, "a_alpha"),
      type: gl.getAttribLocation(program, "a_type"),
      mvp: gl.getUniformLocation(program, "u_mvp"),
      pointSize: gl.getUniformLocation(program, "u_pointSize"),
      dpr: gl.getUniformLocation(program, "u_dpr")
    };
  }

  #compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Shader compile failed: ${message}`);
    }

    return shader;
  }

  setDensityCloud(data) {
    const gl = this.gl;

    if (!this.densityBuffer) {
      this.densityBuffer = gl.createBuffer();
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.densityBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    this.densityCount = data.length / 5;
  }

  setCurrentCloud(data) {
    const gl = this.gl;

    if (!this.currentBuffer) {
      this.currentBuffer = gl.createBuffer();
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.currentBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    this.currentCount = data.length / 5;
  }

  updateCurrentCloud(data) {
    const gl = this.gl;

    if (!this.currentBuffer) {
      this.setCurrentCloud(data);
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.currentBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
    this.currentCount = data.length / 5;
  }

  resize(dpr) {
    const width = Math.round(this.canvas.clientWidth * dpr);
    const height = Math.round(this.canvas.clientHeight * dpr);

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }
  }

  clear() {
    const gl = this.gl;
    gl.clearColor(5 / 255, 0, 8 / 255, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  draw(mvp, dpr) {
    const gl = this.gl;
    const stride = 5 * 4;

    gl.useProgram(this.program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);

    gl.uniformMatrix4fv(this.locations.mvp, false, mvp);
    gl.uniform1f(this.locations.dpr, dpr);

    if (this.densityBuffer && this.densityCount > 0) {
      gl.uniform1f(this.locations.pointSize, 2.5);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.densityBuffer);
      this.#bindAttributes(stride);
      gl.drawArrays(gl.POINTS, 0, this.densityCount);
    }

    if (this.currentBuffer && this.currentCount > 0) {
      gl.uniform1f(this.locations.pointSize, 2.8);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.currentBuffer);
      this.#bindAttributes(stride);
      gl.drawArrays(gl.POINTS, 0, this.currentCount);
    }
  }

  #bindAttributes(stride) {
    const gl = this.gl;

    gl.enableVertexAttribArray(this.locations.position);
    gl.vertexAttribPointer(this.locations.position, 3, gl.FLOAT, false, stride, 0);

    gl.enableVertexAttribArray(this.locations.alpha);
    gl.vertexAttribPointer(this.locations.alpha, 1, gl.FLOAT, false, stride, 12);

    gl.enableVertexAttribArray(this.locations.type);
    gl.vertexAttribPointer(this.locations.type, 1, gl.FLOAT, false, stride, 16);
  }

  destroy() {
    const gl = this.gl;

    if (this.densityBuffer) {
      gl.deleteBuffer(this.densityBuffer);
    }

    if (this.currentBuffer) {
      gl.deleteBuffer(this.currentBuffer);
    }

    if (this.program) {
      gl.deleteProgram(this.program);
    }
  }
}
