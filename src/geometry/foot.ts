// Gridfinity foot: 0.8 (45°) / 1.8 vertical / 2.15 (45°), total 4.75, corner radii
// stepped 0.8 -> 1.6 -> 3.75 (spec section 4). `extraX` / `extraY` widen the half size
// for a merged foot (one continuous foot under a multi-cell lid).
import type { Manifold } from "manifold-3d";
import { CONSTANTS, outerSize } from "../gridfinity/constants";
import type { Kernel } from "./kernel";
import { loft, type Layer } from "./loft";

const c = (name: keyof typeof CONSTANTS): number => CONSTANTS[name].value;

/** Overlap into the body above, so the union has no coplanar faces (script: 0.01). */
export const FOOT_OVERLAP = 0.01;

/** Half size of a single 1x1 foot at its top (20.75). */
export const cellHalf = (): number => outerSize(1) / 2;

/** Half size of the foot at height z (before widening). */
export const footHalf = (z: number): number => {
  const bottom = cellHalf() - c("footBottomEdgeInset");
  const z1 = c("footLowerSlope");
  const z2 = z1 + c("footVertical");
  if (z < z1) return bottom + z;
  if (z < z2) return bottom + z1;
  return bottom + z1 + (z - z2);
};

/** Corner radius of the foot at height z. */
export const footRadius = (z: number): number => {
  const z1 = c("footLowerSlope");
  const z2 = z1 + c("footVertical");
  if (z < z1) return c("footRadiusBottom") + z;
  if (z < z2) return c("footRadiusMid");
  return c("footRadiusMid") + (z - z2);
};

export const footLayers = (extraX = 0, extraY = 0): Layer[] => {
  const h = c("footHeight");
  const top = cellHalf();
  const ring = (z: number): Layer => ({
    z,
    hx: footHalf(z) + extraX,
    hy: footHalf(z) + extraY,
    r: footRadius(z),
  });
  return [
    ring(0),
    ring(c("footLowerSlope")),
    ring(c("footLowerSlope") + c("footVertical")),
    { z: h, hx: top + extraX, hy: top + extraY, r: c("binCornerRadius") },
    {
      z: h + FOOT_OVERLAP,
      hx: top + extraX,
      hy: top + extraY,
      r: c("binCornerRadius"),
    },
  ];
};

/**
 * Extra floor inside a hollow foot: the cavity stops this far below the top of the foot, so
 * the plate (or the floor of a bin) and this floor together carry the magnet pockets
 * (owner, 2 November 2026).
 */
export const HOLLOW_FLOOR = 1.45;

/**
 * Cavity of an open hollow foot: one straight cut from below, inset from the narrowest
 * part of the foot (its bottom edge) by the wall, ending `HOLLOW_FLOOR` below the top of
 * the foot. No profile steps, no lip inside (owner, 2 November 2026).
 */
export const cavityLayers = (inset: number, extraX = 0, extraY = 0): Layer[] => {
  const ring = (z: number): Layer => ({
    z,
    hx: footHalf(0) - inset + extraX,
    hy: footHalf(0) - inset + extraY,
    r: Math.max(footRadius(0) - inset, 0.3),
  });
  return [ring(-0.5), ring(c("footHeight") - HOLLOW_FLOOR)];
};

/** Solid foot centred on the x/y origin, z = 0 to 4.76. */
export const solidFoot = (kernel: Kernel, extraX = 0, extraY = 0): Manifold =>
  loft(kernel, footLayers(extraX, extraY));
