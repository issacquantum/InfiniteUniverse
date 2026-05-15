#version 300 es
precision highp float;

in float v_alpha;
in float v_type;
in vec3 v_position;

out vec4 fragColor;

vec3 ramp(float t) {
  vec3 deepPurple = vec3(0.22, 0.00, 0.48);
  vec3 dominantPurple = vec3(0.50, 0.00, 0.84);
  vec3 saturatedPurple = vec3(0.62, 0.00, 0.92);
  vec3 coreViolet = vec3(0.47, 0.00, 1.00);

  if (t < 0.58) {
    return mix(deepPurple, dominantPurple, smoothstep(0.0, 0.58, t));
  }

  if (t < 0.88) {
    return mix(dominantPurple, saturatedPurple, smoothstep(0.58, 0.88, t));
  }

  return mix(saturatedPurple, coreViolet, smoothstep(0.88, 1.0, t));
}

void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float radiusSq = dot(uv, uv);

  if (radiusSq > 1.0) {
    discard;
  }

  vec3 color;
  float alpha;

  if (v_type < 0.5) {
    float edge = 1.0 - smoothstep(0.42, 1.0, radiusSq);
    float glow = clamp(v_alpha, 0.0, 1.0);

    color = ramp(glow);
    alpha = edge * (0.045 + 0.22 * glow);
  } else {
    float edge = 1.0 - smoothstep(0.28, 1.0, radiusSq);
    color = vec3(0.47, 0.0, 1.0);
    alpha = v_alpha * edge * 1.18;
  }

  fragColor = vec4(color * alpha, alpha);
}
