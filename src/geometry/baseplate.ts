// Baseplate geometry, a port of the baseplate part of the reference script
// (`baseplate_body`, `skeleton_opening2d`, `corner_pad2d`). All coordinates are in mm; the
// part is built with its corner at the origin, then centred on x/y. Spec numbers come
// from constants.
import type { CrossSection, Manifold } from "manifold-3d";
import { CONSTANTS, holeOffset } from "../gridfinity/constants";
import { variantOf } from "../gridfinity/connector";
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
  /** the whole plate: the cells, or the drawer when that is larger */
  width: number;
  depth: number;
  /** where the grid of cells starts, measured from the plate corner */
  gridX: number;
  gridY: number;
  /** solid base under the pocket floor, after the automatic raise for magnets */
  base: number;
  /** z of the highest point */
  top: number;
}

export const layoutOf = (p: BaseplateParams): BaseplateLayout => {
  const base = baseOf(p);
  const [cellsX, cellsY] = [p.units_x * c("grid"), p.units_y * c("grid")];
  const [width, depth] = [
    Math.max(cellsX, p.plate_min_x_mm),
    Math.max(cellsY, p.plate_min_y_mm),
  ];
  return {
    width,
    depth,
    // the extra width goes to the left at -1, to both sides at 0, to the right at 1
    gridX: ((width - cellsX) * (1 - p.fit_x)) / 2,
    gridY: ((depth - cellsY) * (1 - p.fit_y)) / 2,
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

/** A part of the plate, in mm from the plate corner (the whole plate when left out). */
export interface Region {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * Where to cut a length so no piece is longer than `maxLength`: at the boundaries of the
 * cells where possible (so every cell stays whole), inside the filler where a stretch
 * without a boundary is longer than that. Returns the cut positions including 0 and the
 * length. Greedy: every piece is as long as it may be, so there are as few as possible.
 */
export const splitPoints = (
  length: number,
  gridStart: number,
  cells: number,
  maxLength: number,
): number[] => {
  const boundaries = [
    0,
    ...Array.from({ length: cells + 1 }, (_, k) => gridStart + c("grid") * k),
    length,
  ]
    .filter((b) => b >= 0 && b <= length + 1e-9)
    .sort((a, b) => a - b);
  const cuts = [0];
  let at = 0;
  while (at < length - 1e-9) {
    const reach = boundaries.filter((b) => b > at + 1e-9 && b - at <= maxLength + 1e-9);
    const next =
      reach.length > 0 ? Math.max(...reach) : Math.min(at + maxLength, length);
    cuts.push(next);
    at = next;
  }
  return cuts;
};

/** A piece of a split plate with its place in the grid of pieces. */
export interface Tile extends Region {
  col: number;
  row: number;
  cols: number;
  rows: number;
}

/** The pieces a plate is cut into so that each fits `max` (width, depth); row by row from the front left. */
export const tileRegions = (p: BaseplateParams, max: [number, number]): Tile[] => {
  const { width, depth, gridX, gridY } = layoutOf(p);
  const xs = splitPoints(width, gridX, p.units_x, max[0]);
  const ys = splitPoints(depth, gridY, p.units_y, max[1]);
  const regions: Tile[] = [];
  for (let j = 0; j < ys.length - 1; j++) {
    for (let i = 0; i < xs.length - 1; i++) {
      regions.push({
        col: i,
        row: j,
        cols: xs.length - 1,
        rows: ys.length - 1,
        x0: xs[i] as number,
        x1: xs[i + 1] as number,
        y0: ys[j] as number,
        y1: ys[j + 1] as number,
      });
    }
  }
  return regions;
};

/** The slot of a connector reaches this far beyond the plate edge, so the cut opens cleanly. */
const SLOT_OVERSHOOT = 0.2;

/**
 * The slots for connectors (owner, 11 November 2026): one in every edge of the piece for
 * every row or column of cells that reaches it, in the middle of that cell's edge. The slot
 * of one plate and that of its neighbour are mirror images: together they hold a connector.
 * Coordinates in mm from the plate corner.
 */
const slotCutters = (
  kernel: Kernel,
  scope: Scope,
  p: BaseplateParams,
  edges: { x0: number; y0: number; x1: number; y1: number },
  rows: number[],
  cols: number[],
): Manifold[] => {
  const variant = variantOf(p.connectable);
  if (!variant) return [];
  const length = variant.slotLength;
  // profile (u inward from the edge, z up), the edge side pushed out a little
  const profile = variant.slot.map(([u, z]): [number, number] => [
    u === 0 ? -SLOT_OVERSHOOT : u,
    z,
  ]);
  const prism = scope.add(
    scope.add(new kernel.CrossSection([profile])).extrude(length),
  );
  // (u, z, along) -> (x = u, y = -along, z): a quarter turn about x; then the slot runs
  // along y, centred on 0, its inward side towards +x (the left edge)
  const upright = scope.add(
    prism.transform([1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1]),
  );
  const alongY = scope.add(upright.translate(0, length / 2, 0));
  const place = (angle: number, x: number, y: number) =>
    scope.add(scope.add(alongY.rotate(0, 0, angle)).translate(x, y, 0));
  const { x0, y0, x1, y1 } = edges;
  return [
    ...rows.flatMap((cy) => [place(0, x0, cy), place(180, x1, cy)]),
    ...cols.flatMap((cx) => [place(90, cx, y0), place(-90, cx, y1)]),
  ];
};

/**
 * The baseplate, or only a `region` of it, centred on the middle of the whole plate (so
 * the pieces of a split plate fit together). A region keeps the cells that lie inside it
 * and cuts the outline with straight sides; the rounded corners stay on the plate's own.
 */
export const buildBaseplate = (
  kernel: Kernel,
  scope: Scope,
  p: BaseplateParams,
  region?: Region,
): Manifold => {
  const { width: w, depth: h, base, top, gridX, gridY } = layoutOf(p);
  const move = (part: Manifold, x: number, y: number, z: number) =>
    scope.add(part.translate(x, y, z));

  const whole = move(
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
  const block = region
    ? scope.add(
        kernel.Manifold.intersection(
          whole,
          move(
            scope.add(
              kernel.Manifold.cube([
                region.x1 - region.x0,
                region.y1 - region.y0,
                top + 2,
              ]),
            ),
            region.x0,
            region.y0,
            -1,
          ),
        ),
      )
    : whole;
  const inside = (i: number, j: number): boolean =>
    !region ||
    (gridX + c("grid") * i >= region.x0 - 1e-6 &&
      gridX + c("grid") * (i + 1) <= region.x1 + 1e-6 &&
      gridY + c("grid") * j >= region.y0 - 1e-6 &&
      gridY + c("grid") * (j + 1) <= region.y1 + 1e-6);
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
      if (!inside(i, j)) continue;
      const cx = gridX + cellCentre(i);
      const cy = gridY + cellCentre(j);
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
  if (p.connectable !== "none") {
    const rows: number[] = [];
    const cols: number[] = [];
    for (let j = 0; j < p.units_y; j++) {
      if (Array.from({ length: p.units_x }, (_, i) => i).some((i) => inside(i, j))) {
        rows.push(gridY + cellCentre(j));
      }
    }
    for (let i = 0; i < p.units_x; i++) {
      if (Array.from({ length: p.units_y }, (_, j) => j).some((j) => inside(i, j))) {
        cols.push(gridX + cellCentre(i));
      }
    }
    const edges = region ?? { x0: 0, y0: 0, x1: w, y1: h };
    cutters.push(...slotCutters(kernel, scope, p, edges, rows, cols));
  }
  const body = scope.add(kernel.Manifold.difference([block, ...cutters]));
  return move(body, -w / 2, -h / 2, 0);
};
