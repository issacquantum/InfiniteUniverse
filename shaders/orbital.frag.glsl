#version 300 es
precision highp float;

in float v_alpha;
in float v_type;
in vec3 v_position;

out vec4 fragColor;

vec3 ramp(float t) {
  vec3 outerPurple = vec3(0.34, 0.00, 0.72);
  vec3 saturatedPurple = vec3(0.56, 0.00, 0.90);
  vec3 electricViolet = vec3(0.70, 0.12, 1.00);
  vec3 brightViolet = vec3(0.88, 0.24, 1.00);

  if (t < 0.42) {
    return mix(outerPurple, saturatedPurple, smoothstep(0.0, 0.42, t));
  }

  if (t < 0.78) {
    return mix(saturatedPurple, electricViolet, smoothstep(0.42, 0.78, t));
  }

  return mix(electricViolet, brightViolet, smoothstep(0.78, 1.0, t));
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
    color = vec3(1.0, 0.0, 0.635);
    alpha = v_alpha * edge * 1.18;
  }

  fragColor = vec4(color * alpha, alpha);
}
