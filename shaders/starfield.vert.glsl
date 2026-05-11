#version 300 es
precision highp float;

in vec2 a_position;
in float a_size;
in float a_twinkle;

uniform float u_pixel_ratio;
uniform float u_time;

out float v_alpha;
out float v_twinkle;
out float v_glow;

void main() {
  float phase = a_twinkle * 6.28318 + (a_position.x * 2.7 + a_position.y * 3.9);
  float glow = 0.9
    + 0.08 * sin(u_time * (0.16 + a_twinkle * 0.14) + phase)
    + 0.03 * sin(u_time * (0.31 + a_twinkle * 0.1) + phase * 1.6);

  gl_Position = vec4(a_position, 0.0, 1.0);
  gl_PointSize = a_size * u_pixel_ratio;

  v_alpha = (0.26 + a_twinkle * 0.44) * glow;
  v_twinkle = a_twinkle;
  v_glow = glow;
}
