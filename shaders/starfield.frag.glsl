#version 300 es
precision highp float;

in float v_alpha;
in float v_twinkle;
in float v_glow;

out vec4 out_color;

void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float distance_from_center = dot(uv, uv);

  if (distance_from_center > 1.0) {
    discard;
  }

  float disc = smoothstep(1.0, 0.0, distance_from_center);
  float core = smoothstep(0.24, 0.0, distance_from_center);
  float bloom = smoothstep(1.0, 0.08, distance_from_center);
  float halo = smoothstep(1.0, 0.24, distance_from_center);
  vec3 violet = vec3(0.47, 0.0, 1.0);
  vec3 pink = vec3(1.0, 0.0, 0.635);
  vec3 color = mix(violet, pink, v_twinkle);

  float alpha = (core * 0.68 + disc * bloom * 0.18 + halo * 0.16 * v_glow) * v_alpha;
  out_color = vec4(color, alpha);
}
