// Baseplate geometry, a port of the baseplate part of the reference script
// (`baseplate_body`, `skeleton_opening2d`, `corner_pad2d`). All coordinates are in mm; the
// part is built with its corner at the origin, then centred on x/y. Spec numbers come
// from constants.
import type { CrossSection, Manifold } from "manifold-3d";
import { CONSTANTS, holeOffset } from "../gridfinity/constants";
import { baseOf, type BaseplateParams } from "../model/baseplateParams";
import type { Kernel, Scope } from "./kernel";
import { loft, ringPoints, type Layer } from "./loft";

const c = (name: keyof typeof CONSTANTS): number => CONSTANTS[name].value;

/** Segments of a magnet pocket circle (script CYL_FN). */
const CYLINDER_SEGMENTS = 40;
/** Corner radius of the skeleton openings (script BP_OPEN_R). */
const OPENING_RADIUS = 3;
/** Segments of a full circle at that radius (OpenSCAD's default for R3). */
const OPENING_SEGMENTS = 10;
/** Material around the centre pocket, so a 5.2 mm pocket gives a 14 mm square (script). */
const CENTRE_PAD_WALL = 4.4;
const CENTRE_PAD_RADIUS = 3;
/** A skeleton corner pad is this much wider than its magnet pocket (script). */
const CORNER_PAD_EXTRA = 4.5;
/** The pad runs this far from the cell centre into the frame (script BP_PAD_REACH). */
const CORNER_PAD_REACH = 19.5;
/** A rib runs this far from the cell centre (script). */
const RIB_LENGTH = 27;

export interface BaseplateLayout {
  width: number;
  depth: number;
  /** solid base under the pocket floor, after the automatic raise for magnets */
  base: number;
  /** z of the highest point */
  top: number;
}

export const layoutOf = (p: BaseplateParams): BaseplateLayout => {
  const base = baseOf(p);
  return {
    width: p.units_x * c("grid"),
    depth: p.units_y * c("grid"),
    base,
    top: base + c("baseplateProfileHeight"),
  };
};

/**
 * One cell's pocket, relative to its floor: the foot profile with 0.25 mm offset. The last
 * layer goes 0.5 above the rim, 45 degrees on, so the cutter passes cleanly through.
 */
export const pocketLayers = (): Layer[] => {
  const half = c("grid") / 2;
  const bottom = half - c("baseplateBottomInset");
  const wall = half - c("baseplateWallInset");
  const lower = c("baseplateProfileLower");
  const upper = lower + c("baseplateProfileVertical");
  const height = c("baseplateProfileHeight");
  const ring = (z: number, h: number, r: number): Layer => ({ z, hx: h, hy: h, r });
  return [
    ring(0, bottom, c("baseplateRadiusBottom")),
    ring(lower, wall, c("baseplateRadiusWall")),
    ring(upper, wall, c("baseplateRadiusWall")),
    ring(height, half, c("baseplateCornerRadius")),
    ring(height + 0.5, half + 0.5, c("baseplateCornerRadius") + 0.5),
  ];
};

/** Centre of cell i along one axis, measured from the plate corner. */
const cellCentre = (i: number): number => c("grid") * i + c("grid") / 2;

const polygon = (kernel: Kernel, scope: Scope, points: [number, number][]) =>
  scope.add(new kernel.CrossSection([points]));

const roundedSquare = (kernel: Kernel, scope: Scope, side: number, r: number) =>
  polygon(kernel, scope, ringPoints({ z: 0, hx: side / 2, hy: side / 2, r }));

/** The corner pad of a skeleton cell, plan view relative to the cell centre. */
const cornerPad = (
  kernel: Kernel,
  scope: Scope,
  p: BaseplateParams,
  sx: number,
  sy: number,
): CrossSection => {
  const r = (p.corner_magnet_d + CORNER_PAD_EXTRA) / 2;
  const o = holeOffset();
  const circle = scope.add(
    kernel.CrossSection.circle(r, CYLINDER_SEGMENTS).translate(sx * o, sy * o),
  );
  const wedge = polygon(kernel, scope, [
    [sx * CORNER_PAD_REACH, sy * (o - r)],
    [sx * CORNER_PAD_REACH, sy * CORNER_PAD_REACH],
    [sx * (o - r), sy * CORNER_PAD_REACH],
  ]);
  return scope.add(kernel.CrossSection.hull([circle, wedge]));
};

/**
 * What stays inside a skeleton window: magnet pads and, for a centre magnet, a rounded
 * square tied to the frame by four diagonal ribs.
 */
const skeletonSolid = (kernel: Kernel, scope: Scope, p: BaseplateParams) => {
  const parts: CrossSection[] = [];
  if (p.corner_magnets) {
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) parts.push(cornerPad(kernel, scope, p, sx, sy));
    }
  }
  if (p.center_magnet) {
    const side = p.center_magnet_d + p.magnet_clearance + 2 * CENTRE_PAD_WALL;
    parts.push(roundedSquare(kernel, scope, side, CENTRE_PAD_RADIUS));
    // the ribs are not optional: without them the pad would be a loose part
    for (const angle of [45, 135, 225, 315]) {
      const rib = kernel.CrossSection.square([RIB_LENGTH, p.rib_width]);
      parts.push(scope.add(rib.translate(0, -p.rib_width / 2).rotate(angle)));
    }
  }
  return parts;
};

/**
 * The openings of a skeleton cell: the window minus what stays, with rounded corners
 * (rounded inwards first, then outwards, so the concave corners stay sharp).
 */
const skeletonOpening = (
  kernel: Kernel,
  scope: Scope,
  p: BaseplateParams,
): CrossSection => {
  const window = roundedSquare(
    kernel,
    scope,
    c("grid") - 2 * c("baseplateBottomInset"),
    c("baseplateRadiusBottom"),
  );
  const solid = skeletonSolid(kernel, scope, p);
  const stays =
    solid.length > 0 ? scope.add(kernel.CrossSection.union(solid)) : undefined;
  const open = stays
    ? scope.add(kernel.CrossSection.difference(window, stays))
    : window;
  const inward = scope.add(open.offset(-OPENING_RADIUS, "Round", 2, OPENING_SEGMENTS));
  return scope.add(inward.offset(OPENING_RADIUS, "Round", 2, OPENING_SEGMENTS));
};

export const buildBaseplate = (
  kernel: Kernel,
  scope: Scope,
  p: BaseplateParams,
): Manifold => {
  const { width: w, depth: h, base, top } = layoutOf(p);
  const move = (part: Manifold, x: number, y: number, z: number) =>
    scope.add(part.translate(x, y, z));

  const block = move(
    scope.add(
      loft(kernel, [
        { z: 0, hx: w / 2, hy: h / 2, r: c("baseplateCornerRadius") },
        { z: top, hx: w / 2, hy: h / 2, r: c("baseplateCornerRadius") },
      ]),
    ),
    w / 2,
    h / 2,
    0,
  );
  const pocket = scope.add(loft(kernel, pocketLayers()));
  const skeleton = p.baseplate_style === "skeleton";
  // the openings go straight down through the base and 0.1 above the pocket floor
  const opening = skeleton
    ? scope.add(skeletonOpening(kernel, scope, p).extrude(base + 1.1))
    : undefined;

  const cutters: Manifold[] = [];
  const cylinder = (d: number, depth: number, x: number, y: number) =>
    move(
      scope.add(kernel.Manifold.cylinder(depth + 0.5, d / 2, d / 2, CYLINDER_SEGMENTS)),
      x,
      y,
      base - depth,
    );
  for (let i = 0; i < p.units_x; i++) {
    for (let j = 0; j < p.units_y; j++) {
      const cx = cellCentre(i);
      const cy = cellCentre(j);
      cutters.push(move(pocket, cx, cy, base));
      if (opening) cutters.push(move(opening, cx, cy, -1));
      if (p.corner_magnets) {
        const o = holeOffset();
        for (const sx of [-1, 1]) {
          for (const sy of [-1, 1]) {
            cutters.push(
              cylinder(p.corner_magnet_d, p.corner_magnet_h, cx + sx * o, cy + sy * o),
            );
          }
        }
      }
      if (p.center_magnet) {
        cutters.push(
          cylinder(p.center_magnet_d + p.magnet_clearance, p.center_magnet_h, cx, cy),
        );
      }
    }
  }
  const body = scope.add(kernel.Manifold.difference([block, ...cutters]));
  return move(body, -w / 2, -h / 2, 0);
};
