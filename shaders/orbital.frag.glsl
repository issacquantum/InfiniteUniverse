#version 300 es
precision highp float;

in float v_alpha;
in float v_type;
in vec3 v_position;

out vec4 fragColor;

vec3 ramp(float t) {
  vec3 deepViolet = vec3(0.18, 0.00, 0.48);
  vec3 vividPurple = vec3(0.56, 0.00, 0.90);
  vec3 electricViolet = vec3(0.48, 0.10, 0.96);
  vec3 electricIndigo = vec3(0.30, 0.16, 0.92);

  if (t < 0.42) {
    return mix(deepViolet, vividPurple, smoothstep(0.0, 0.42, t));
  }

  if (t < 0.78) {
    return mix(vividPurple, electricViolet, smoothstep(0.42, 0.78, t));
  }

  return mix(electricViolet, electricIndigo, smoothstep(0.78, 1.0, t));
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
