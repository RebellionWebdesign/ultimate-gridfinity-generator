// Lid geometry, a port of the lid part of the reference script (`foot_lid_body`,
// `all_feet`, `hollow_cut`, `lip_ring`). All coordinates are in mm; the part is built
// with its corner at the origin, then centred on x/y. Spec numbers come from constants.
import type { Manifold } from "manifold-3d";
import { CONSTANTS, holeOffset, outerSize } from "../gridfinity/constants";
import { plateThicknessOf, type LidParams } from "../model/lidParams";
import { cellHalf, footHalf, footRadius, solidFoot } from "./foot";
import type { Kernel, Scope } from "./kernel";
import { buildLabel, raisedExtra, type LabelAssets } from "./label";
import { loft, type Layer } from "./loft";

const c = (name: keyof typeof CONSTANTS): number => CONSTANTS[name].value;

/** Segments of a magnet pocket circle (script CYL_FN). */
const CYLINDER_SEGMENTS = 40;
/** Material that must stay below a lid pocket floor (spec section 3.1, from the script). */
export const MIN_MATERIAL_UNDER_POCKET = 0.8;

export interface LidParts {
  /** Feet, plate and (unless it has its own colour) the stacking lip. */
  plate: Manifold;
  /** Stacking lip as its own body, only with `lip_color_enabled`. */
  lip?: Manifold;
  /** Raised or flush text; a separate body so the slicer can give it a filament. */
  text?: Manifold;
  symbol?: Manifold;
}

export interface LidLayout {
  width: number;
  depth: number;
  plateThickness: number;
  /** z of the plate top, before orientation */
  plateTop: number;
  /** z of the highest point, before orientation (plate top or stacking lip top) */
  topZ: number;
}

export const plateThickness = plateThicknessOf;

export const layoutOf = (p: LidParams): LidLayout => {
  const t = plateThickness(p);
  const plateTop = c("footHeight") + t;
  return {
    width: outerSize(p.units_x),
    depth: outerSize(p.units_y),
    plateThickness: t,
    plateTop,
    topZ: plateTop + (p.variant === "stackable" ? c("lipHeight") : raisedExtra(p)),
  };
};

/** Centre of cell i along one axis, measured from the lid corner (script `cell_c`). */
const cellCentre = (i: number): number => c("grid") * i + cellHalf();

/** The four outermost magnet positions on the lid (script `lid_mag_pts`). */
export const lidMagnetPoints = (p: LidParams): [number, number][] => {
  const o = holeOffset();
  const xs = [cellCentre(0) - o, cellCentre(p.units_x - 1) + o];
  const ys = [cellCentre(0) - o, cellCentre(p.units_y - 1) + o];
  return xs.flatMap((x) => ys.map((y): [number, number] => [x, y]));
};

/** Pocket depth actually cut: at least 0.8 mm of material stays below the floor. */
export const pocketDepth = (p: LidParams): number =>
  Math.min(
    p.corner_magnet_h,
    c("footHeight") + plateThickness(p) - MIN_MATERIAL_UNDER_POCKET,
  );

const move = (scope: Scope, part: Manifold, x: number, y: number, z: number) =>
  scope.add(part.translate(x, y, z));

const cylinderAt = (
  kernel: Kernel,
  scope: Scope,
  d: number,
  at: { x: number; y: number; z: number; h: number },
) => {
  const raw = scope.add(
    kernel.Manifold.cylinder(at.h, d / 2, d / 2, CYLINDER_SEGMENTS),
  );
  return move(scope, raw, at.x, at.y, at.z);
};

/**
 * Extra floor inside a hollow foot: the cavity stops this far below the plate, so the
 * plate and this floor together carry the magnet pockets (owner, 2 November 2026).
 */
export const HOLLOW_FLOOR = 1.45;

/**
 * Cavity of an open hollow foot: one straight cut from below, inset from the narrowest
 * part of the foot (its bottom edge) by the wall, ending `HOLLOW_FLOOR` below the plate.
 * No profile steps, no lip inside (owner, 2 November 2026).
 */
const cavityLayers = (inset: number, extraX: number, extraY: number): Layer[] => {
  const ring = (z: number): Layer => ({
    z,
    hx: footHalf(0) - inset + extraX,
    hy: footHalf(0) - inset + extraY,
    r: Math.max(footRadius(0) - inset, 0.3),
  });
  return [ring(-0.5), ring(c("footHeight") - HOLLOW_FLOOR)];
};

interface FootSpec {
  /** centre of the foot on the lid */
  cx: number;
  cy: number;
  extraX: number;
  extraY: number;
}

const buildFoot = (kernel: Kernel, scope: Scope, p: LidParams, foot: FootSpec) => {
  const solid = scope.add(solidFoot(kernel, foot.extraX, foot.extraY));
  if (p.foot_hollow === "none") return solid;

  const wall = p.foot_wall;
  const cavity = scope.add(loft(kernel, cavityLayers(wall, foot.extraX, foot.extraY)));
  return scope.add(kernel.Manifold.difference(solid, cavity));
};

/** Lip wall on top of the plate, plate top at local z = 0, centred on the origin. */
const lipRing = (
  kernel: Kernel,
  scope: Scope,
  p: LidParams,
  hx: number,
  hy: number,
  zStart: number,
): Manifold => {
  const lipHeight = c("lipHeight");
  const radius = (depth: number) => Math.max(c("binCornerRadius") - depth, 0.8);
  const cutterRing = (z: number, depth: number): Layer => ({
    z,
    hx: hx - depth,
    hy: hy - depth,
    r: radius(depth),
  });
  const lower = c("lipLowerSlope");
  const upper = lower + c("lipVertical");
  const cutter = scope.add(
    loft(kernel, [
      cutterRing(0, c("lipDepth")),
      cutterRing(lower, c("lipUpperSlope")),
      cutterRing(upper, c("lipUpperSlope")),
      cutterRing(lipHeight, 0),
      // slightly above the lip, so the cutter passes cleanly through the tip
      cutterRing(lipHeight + 0.01, 0),
    ]),
  );
  const box = scope.add(
    loft(kernel, [
      { z: zStart, hx, hy, r: c("binCornerRadius") },
      { z: lipHeight, hx, hy, r: c("binCornerRadius") },
    ]),
  );
  const wall = scope.add(kernel.Manifold.difference(box, cutter));
  if (p.lip_mode === "full") return wall;
  const len = p.corner_len;
  const corners = [-1, 1].flatMap((sx) =>
    [-1, 1].map((sy) =>
      move(
        scope,
        scope.add(kernel.Manifold.cube([len, len, lipHeight + 2])),
        sx * (hx - len / 2) - len / 2,
        sy * (hy - len / 2) - len / 2,
        -1,
      ),
    ),
  );
  const mask = scope.add(kernel.Manifold.union(corners));
  return scope.add(kernel.Manifold.intersection(wall, mask));
};

/** Moves a part from "corner at origin" to centred on x/y, and flips it if asked. */
export const placePart = (
  scope: Scope,
  part: Manifold,
  p: LidParams,
  layout: LidLayout,
  topRef: number,
): Manifold => {
  const flipped =
    p.print_orientation === "upside_down"
      ? move(scope, scope.add(part.rotate(180, 0, 0)), 0, layout.depth, topRef)
      : part;
  return move(scope, flipped, -layout.width / 2, -layout.depth / 2, 0);
};

export const buildLid = (
  kernel: Kernel,
  scope: Scope,
  p: LidParams,
  assets: LabelAssets = {},
): LidParts => {
  const layout = layoutOf(p);
  const { width: w, depth: h, plateThickness: t, plateTop } = layout;
  const stackable = p.variant === "stackable";
  const half = cellHalf();

  const merged = p.foot_layout === "merged";
  const footSpecs: FootSpec[] = merged
    ? [{ cx: w / 2, cy: h / 2, extraX: w / 2 - half, extraY: h / 2 - half }]
    : Array.from({ length: p.units_x * p.units_y }, (_, k) => ({
        cx: cellCentre(k % p.units_x),
        cy: cellCentre(Math.floor(k / p.units_x)),
        extraX: 0,
        extraY: 0,
      }));
  const feet = footSpecs.map((f) =>
    move(scope, buildFoot(kernel, scope, p, f), f.cx, f.cy, 0),
  );

  const plateSolid = scope.add(
    loft(kernel, [
      { z: 0, hx: w / 2, hy: h / 2, r: c("binCornerRadius") },
      { z: t, hx: w / 2, hy: h / 2, r: c("binCornerRadius") },
    ]),
  );
  const plate = move(scope, plateSolid, w / 2, h / 2, c("footHeight"));

  const bodyParts: Manifold[] = [...feet, plate];
  let lip: Manifold | undefined;
  if (stackable) {
    // without its own colour the lip sinks 0.01 into the plate so the union is solid
    const ring = lipRing(
      kernel,
      scope,
      p,
      w / 2,
      h / 2,
      p.lip_color_enabled ? 0 : -0.01,
    );
    const placed = move(scope, ring, w / 2, h / 2, plateTop);
    if (p.lip_color_enabled) lip = placed;
    else bodyParts.push(placed);
  }
  let body = scope.add(kernel.Manifold.union(bodyParts));

  if (p.corner_magnets) {
    const depth = pocketDepth(p);
    const pockets = lidMagnetPoints(p).map(([x, y]) =>
      cylinderAt(kernel, scope, p.corner_magnet_d, {
        x,
        y,
        z: plateTop - depth,
        h: depth + 1,
      }),
    );
    body = scope.add(kernel.Manifold.difference([body, ...pockets]));
  }

  const label = buildLabel(kernel, scope, p, assets, plateTop, [w / 2, h / 2]);
  if (label.cuts.length > 0) {
    body = scope.add(kernel.Manifold.difference([body, ...label.cuts]));
  }

  const topRef = layout.topZ;
  const put = (part: Manifold | undefined) =>
    part ? placePart(scope, part, p, layout, topRef) : undefined;
  return {
    plate: placePart(scope, body, p, layout, topRef),
    lip: put(lip),
    text: put(label.text),
    symbol: put(label.symbol),
  };
};
