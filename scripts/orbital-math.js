/**
 * Exact hydrogen 3d_z^2 orbital sampling utilities in atomic units.
 *
 * This module targets the real hydrogen 3d_{z^2} orbital, corresponding to
 * n = 3, l = 2, m = 0:
 *
 *   psi_320(r, theta, phi)
 *     = (1 / (81 * sqrt(6 * pi))) r^2 e^{-r / 3} (3 cos^2(theta) - 1)
 *
 * with normalized probability density:
 *
 *   |psi_320|^2
 *     = (1 / (39366 * pi)) r^4 e^{-2r / 3} (3 cos^2(theta) - 1)^2
 *
 * The rendered points sample |psi|^2 dV exactly up to the display radius.
 *
 * Because this is a real m = 0 orbital, its stationary probability current is
 * identically zero, so the model renders density only.
 */

const TAU = Math.PI * 2.0;
const SCALE = 24.0;
const MIN_RADIUS = 1e-6;

const DENSITY_NORMALIZATION = 1.0 / (39366.0 * Math.PI);
const DENSITY_MAX = (4096.0 * Math.exp(-12.0)) / (19683.0 * Math.PI);

const RADIUS_SHAPE = 7;
const GAMMA_SCALE = 1.5;

function makeRng(seed = 42) {
  let state = seed >>> 0;

  return function rng() {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleGammaInteger(shape, scale, rng) {
  let logProduct = 0.0;

  for (let i = 0; i < shape; i += 1) {
    logProduct += Math.log(Math.max(rng(), Number.MIN_VALUE));
  }

  return -scale * logProduct;
}

function sampleClippedRadius(rng) {
  while (true) {
    const radius = sampleGammaInteger(RADIUS_SHAPE, GAMMA_SCALE, rng);

    if (radius <= SCALE) {
      return radius;
    }
  }
}

function samplePolar(rng) {
  while (true) {
    const cosTheta = rng() * 2.0 - 1.0;
    const weight = Math.pow(3.0 * cosTheta * cosTheta - 1.0, 2.0);

    if (rng() * 4.0 <= weight) {
      return {
        cosTheta,
        sinTheta: Math.sqrt(Math.max(0.0, 1.0 - cosTheta * cosTheta))
      };
    }
  }
}

function toCartesian(radius, sinTheta, cosTheta, phi) {
  return {
    x: radius * sinTheta * Math.cos(phi),
    y: radius * cosTheta,
    z: radius * sinTheta * Math.sin(phi)
  };
}

function probabilityDensity(radius, cosTheta) {
  if (radius <= MIN_RADIUS) {
    return 0.0;
  }

  const radialFactor = radius * radius * Math.exp(-radius / 3.0);
  const angularFactor = 3.0 * cosTheta * cosTheta - 1.0;
  return DENSITY_NORMALIZATION * radialFactor * radialFactor * angularFactor * angularFactor;
}

function densityIntensity(radius, cosTheta) {
  const ratio = Math.min(probabilityDensity(radius, cosTheta) / DENSITY_MAX, 1.0);
  return Math.pow(ratio, 0.32);
}

export function buildDensityCloud(count, seed = 1) {
  const rng = makeRng(seed);
  const data = new Float32Array(count * 5);

  for (let i = 0; i < count; i += 1) {
    const radius = sampleClippedRadius(rng);
    const { sinTheta, cosTheta } = samplePolar(rng);
    const phi = rng() * TAU;
    const point = toCartesian(radius, sinTheta, cosTheta, phi);
    const base = i * 5;

    data[base + 0] = point.x;
    data[base + 1] = point.y;
    data[base + 2] = point.z;
    data[base + 3] = densityIntensity(radius, cosTheta);
    data[base + 4] = 0.0;
  }

  return data;
}

export function buildCurrentCloud() {
  return {
    positions: new Float32Array(0),
    meta: new Float32Array(0)
  };
}

export function advanceCurrentCloud() {
  // Intentionally empty. The real 3d_z^2 orbital has zero stationary current.
}

export { SCALE };
