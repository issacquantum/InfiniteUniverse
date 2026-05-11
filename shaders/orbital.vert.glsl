#version 300 es
precision highp float;

in vec3 a_position;
in float a_alpha;
in float a_type;

uniform mat4 u_mvp;
uniform float u_pointSize;
uniform float u_dpr;

out float v_alpha;
out float v_type;
out vec3 v_position;

void main() {
  vec4 clip = u_mvp * vec4(a_position, 1.0);
  gl_Position = clip;

  float depthScale = clamp(1.0 - clip.z / clip.w * 0.5, 0.42, 1.18);
  gl_PointSize = u_pointSize * depthScale * u_dpr;

  v_alpha = a_alpha;
  v_type = a_type;
  v_position = a_position;
}
