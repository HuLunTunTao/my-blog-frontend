import type { AgingVisual, NoteDerived } from './types';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function smooth(v: number, lo: number, hi: number): number {
  if (hi === lo) return 0;
  return clamp((v - lo) / (hi - lo), 0, 1);
}

const PRISTINE: AgingVisual = {
  stage: 0,
  wrinkleStrength: 0,
  curlStrength: 0,
  sepia: 0,
  brightness: 1,
  saturate: 1,
  extraRotate: 0,
  rotateX: 0,
  scale: 1,
  translate: { x: 0, y: 0 },
  opacity: 1,
};

export function getPristineVisual(): AgingVisual {
  return { ...PRISTINE, translate: { x: 0, y: 0 } };
}

export function computeAging(age: number, derived: NoteDerived): AgingVisual {
  if (age <= 0) return getPristineVisual();
  const a = Math.min(age, 1);

  const s1 = smooth(a, 0.15, 0.35);
  const s2 = smooth(a, 0.35, 0.55);
  const s3 = smooth(a, 0.55, 0.75);
  const s4 = smooth(a, 0.75, 0.92);
  const s5 = smooth(a, 0.92, 1.0);

  const sepia = 0.05 * s1 + 0.1 * s2 + 0.1 * s3 + 0.05 * s4;
  const brightness = lerp(1, 0.82, s4 * 0.7 + s5 * 0.3);
  const saturate = lerp(1, 0.55, s1 * 0.1 + s2 * 0.25 + s3 * 0.25 + s4 * 0.3 + s5 * 0.1);
  const wrinkleStrength = clamp(s2 * 0.6 + s3 * 0.3 + s4 * 0.1, 0, 1);
  const opacity = lerp(1, 0, s5);

  let curlStrength = 0;
  let extraRotate = 0;
  let rotateX = 0;
  let scale = 1;
  let tx = 0;
  let ty = 0;

  const fd = derived.fall;
  const dirSign = fd.dRot !== 0 ? Math.sign(fd.dRot) : 1;

  switch (derived.fallStyle) {
    case 0: {
      curlStrength = clamp(s3 * 0.75 + s4 * 0.25, 0, 1);
      extraRotate =
        3 * s3 * dirSign +
        (8 + Math.abs(fd.dRot) * 0.15) * s4 * dirSign +
        fd.dRot * s5;
      tx = fd.dx * 0.15 * s4 + fd.dx * s5;
      ty = fd.dy * 0.08 * s4 + fd.dy * s5;
      break;
    }
    case 1: {
      rotateX = -12 * s3 - 38 * s4 - 55 * s5;
      ty = 8 * s3 + 55 * s4 + 260 * s5;
      tx = fd.dx * 0.04 * s4 + fd.dx * 0.35 * s5;
      extraRotate = 2 * s3 * dirSign + fd.dRot * 0.35 * s5;
      curlStrength = clamp(s4 * 0.3 + s5 * 0.25, 0, 1);
      break;
    }
    case 2: {
      scale = lerp(1, 0.92, s3) * lerp(1, 0.68, s4) * lerp(1, 0.18, s5);
      extraRotate =
        6 * s3 * dirSign +
        20 * s4 * dirSign +
        fd.dRot * 1.2 * s5;
      tx = fd.dx * 0.06 * s4 + fd.dx * 0.15 * s5;
      ty = 6 * s4 + 80 * s5;
      curlStrength = clamp(s3 * 0.45 + s4 * 0.65 + s5 * 0.35, 0, 1);
      break;
    }
    case 3: {
      const slideDir = fd.dx >= 0 ? 1 : -1;
      tx =
        22 * slideDir * s3 +
        130 * slideDir * s4 +
        900 * slideDir * s5;
      ty = 4 * s3 + 18 * s4 + 90 * s5;
      extraRotate =
        3 * slideDir * s3 +
        12 * slideDir * s4 +
        28 * slideDir * s5 +
        fd.dRot * 0.3 * s5;
      curlStrength = clamp(s4 * 0.25, 0, 1);
      break;
    }
  }

  let stage: AgingVisual['stage'] = 0;
  if (a >= 0.92) stage = 5;
  else if (a >= 0.75) stage = 4;
  else if (a >= 0.55) stage = 3;
  else if (a >= 0.35) stage = 2;
  else if (a >= 0.15) stage = 1;

  return {
    stage,
    wrinkleStrength,
    curlStrength,
    sepia,
    brightness,
    saturate,
    extraRotate,
    rotateX,
    scale,
    translate: { x: tx, y: ty },
    opacity,
  };
}
