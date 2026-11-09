// Bin geometry, a port of the bin part of the reference script (`bin_body`,
// `bin_cavity`, `all_feet`, `pockets`). All coordinates are in mm; the part is built with
// its corner at the origin, then centred on x/y. Spec numbers come from constants.
import type { Manifold } from "manifold-3d";
import { CONSTANTS, holeOffset, outerSize } from "../gridfinity/constants";
import { floorZOf, type BinParams } from "../model/binParams";
import { cavityLayers as footCavityLayers, cellHalf, solidFoot } from "./foot";
import type { Kernel, Scope } from "./kernel";
import { loft, type Layer } from "./loft";

const c = (name: keyof typeof CONSTANTS): number => CONSTANTS[name].value;

/** Segments of a magnet pocket circle (script CYL_FN). */
const CYLINDER_SEGMENTS = 40;

export interface BinParts {
  /** Feet, walls and floor, and the stacking lip unless it has its own colour. */
  body: Manifold;
  /** The stacking lip as its own body, only with `lip_color_enabled`. */
  lip?: Manifold;
}

export interface BinLayout {
  width: number;
  depth: number;
  /** body height without the lip: height units x 7 */
  bodyHeight: number;
  /** z of the highest point */
  top: number;
  /** z of the cavity floor */
  floor: number;
}

export const layoutOf = (p: BinParams): BinLayout => {
  const bodyHeight = p.height_units * c("heightUnit");
  return {
    width: outerSize(p.units_x),
    depth: outerSize(p.units_y),
    bodyHeight,
    top: p.lip_style === "flat_lower" ? bodyHeight : bodyHeight + c("lipHeight"),
    floor: floorZOf(p),
  };
};

/** Centre of cell i along one axis, measured from the bin corner (script `cell_c`). */
const cellCentre = (i: number): number => c("grid") * i + cellHalf();

/** Corner radius of the cavity wall and of the lip at a depth from the outer wall. */
const innerRadius = (depth: number): number =>
  Math.max(c("binCornerRadius") - depth, 0.8);

/**
 * The cavity as a loft: straight walls from the floor up. With a stacking lip the wall
 * widens at 45 degrees into the lip profile (0.7 / 1.8 / 1.9, depth 2.6) and ends in a
 * knife edge; the last ring sits 0.01 above so the cut passes cleanly through the tip.
 */
const cavityLayers = (p: BinParams, layout: BinLayout): Layer[] => {
  const hx = layout.width / 2 - p.wall_thickness;
  const hy = layout.depth / 2 - p.wall_thickness;
  const r = innerRadius(p.wall_thickness);
  if (p.lip_style !== "with_lip") {
    return [
      { z: layout.floor, hx, hy, r },
      { z: layout.top + 0.01, hx, hy, r },
    ];
  }
  const lower = c("lipLowerSlope");
  const upper = lower + c("lipVertical");
  const lipRing = (dz: number, depth: number): Layer => ({
    z: layout.bodyHeight + dz,
    hx: layout.width / 2 - depth,
    hy: layout.depth / 2 - depth,
    r: innerRadius(depth),
  });
  return [
    { z: layout.floor, hx, hy, r },
    { z: layout.bodyHeight - (c("lipDepth") - p.wall_thickness), hx, hy, r },
    lipRing(0, c("lipDepth")),
    lipRing(lower, c("lipUpperSlope")),
    lipRing(upper, c("lipUpperSlope")),
    lipRing(c("lipHeight"), 0),
    lipRing(c("lipHeight") + 0.01, 0),
  ];
};

/** Points per arc of the scoop (the circle of the cavity corners has about 10 per 90 degrees). */
const SCOOP_SEGMENTS = 48;
/** The scoop reaches this far into the walls and below the floor, so the union is clean. */
const SCOOP_OVERLAP = 0.3;

/**
 * Section of the scoop (E-08) in (u, v): u from the inner face of the front wall into the
 * cavity, v up from the cavity floor, in mm. The arc has the owner's radius and meets the
 * floor `scoopLength` from the wall. It stands upright against the wall at the distance of
 * the tip of the 45 degree chamfer under the stacking lip (`lipDepth - wall`; at the wall
 * itself without a lip) and goes up to the tip, the lower edge of the lip step: the height
 * of the body. In a tall bin only the straight piece along the wall grows; in a low bin
 * the arc is cut at the top and a flat face is left. Undefined when there is no room.
 */
export const scoopOutline = (
  p: BinParams,
  layout: BinLayout,
): [number, number][] | undefined => {
  const r = c("scoopRadius");
  const length = c("scoopLength");
  const tip = p.lip_style === "with_lip" ? c("lipDepth") - p.wall_thickness : 0;
  const height = layout.bodyHeight - layout.floor;
  if (height <= 0) return undefined;
  // centre of the circle: r from the upright end, so that the arc passes through the floor point
  const cu = tip + r;
  const cv = Math.sqrt(r * r - (length - cu) ** 2);
  const bottom = Math.atan2(-cv, length - cu) + 2 * Math.PI;
  const top = Math.PI + (height >= cv ? 0 : Math.asin((cv - height) / r));
  const points: [number, number][] = [
    [-SCOOP_OVERLAP, -SCOOP_OVERLAP],
    [length, -SCOOP_OVERLAP],
  ];
  for (let i = 0; i <= SCOOP_SEGMENTS; i++) {
    const a = bottom + ((top - bottom) * i) / SCOOP_SEGMENTS;
    points.push([cu + r * Math.cos(a), cv + r * Math.sin(a)]);
  }
  if (height > cv) points.push([tip, height]);
  points.push([-SCOOP_OVERLAP, height]);
  return points;
};

/** The scoop as a solid across the cavity, in the coordinates of the bin (corner at 0). */
const scoopSolid = (
  kernel: Kernel,
  scope: Scope,
  p: BinParams,
  layout: BinLayout,
): Manifold | undefined => {
  const outline = scoopOutline(p, layout);
  if (!outline) return undefined;
  const across = layout.width - 2 * p.wall_thickness + 2 * SCOOP_OVERLAP;
  const prism = scope.add(
    scope.add(new kernel.CrossSection([outline])).extrude(across),
  );
  // (u, v, along) -> (x = along, y = u, z = v)
  const placed = scope.add(
    prism.transform([0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1]),
  );
  const moved = scope.add(
    placed.translate(p.wall_thickness - SCOOP_OVERLAP, p.wall_thickness, layout.floor),
  );
  // The ends of the prism reach into the walls; at the rounded corners of the bin that would
  // stand out of the outer wall. So it is cut to the shape of the cavity, a little larger
  // (0.05 mm into the wall, enough for a clean union), with the same rounded corners.
  const grow = 0.05;
  const envelope = scope.add(
    loft(kernel, [
      {
        z: layout.floor - SCOOP_OVERLAP,
        hx: layout.width / 2 - p.wall_thickness + grow,
        hy: layout.depth / 2 - p.wall_thickness + grow,
        r: innerRadius(p.wall_thickness) + grow,
      },
      {
        z: layout.bodyHeight + 0.01,
        hx: layout.width / 2 - p.wall_thickness + grow,
        hy: layout.depth / 2 - p.wall_thickness + grow,
        r: innerRadius(p.wall_thickness) + grow,
      },
    ]),
  );
  return scope.add(
    kernel.Manifold.intersection(
      moved,
      scope.add(envelope.translate(layout.width / 2, layout.depth / 2, 0)),
    ),
  );
};

/** Cells that carry a centre magnet: the corner cells of the bin (spec section 3.1). */
const cornerCells = (p: BinParams): [number, number][] => {
  const xs = [...new Set([0, p.units_x - 1])];
  const ys = [...new Set([0, p.units_y - 1])];
  return xs.flatMap((i) => ys.map((j): [number, number] => [i, j]));
};

/** The four outermost corner pocket positions of the whole bin (script `outer_corner`). */
export const cornerMagnetPoints = (p: BinParams): [number, number][] => {
  const o = holeOffset();
  const xs = [cellCentre(0) - o, cellCentre(p.units_x - 1) + o];
  const ys = [cellCentre(0) - o, cellCentre(p.units_y - 1) + o];
  return xs.flatMap((x) => ys.map((y): [number, number] => [x, y]));
};

interface Pocket {
  /** centre relative to the middle of its cell */
  x: number;
  y: number;
  /** diameter and depth of the magnet pocket */
  d: number;
  h: number;
}

/** The magnet pockets in the foot of cell (i, j): corner and centre pockets, if any. */
const cellPockets = (p: BinParams, i: number, j: number): Pocket[] => {
  const o = holeOffset();
  const pockets: Pocket[] = [];
  if (p.corner_magnets) {
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        const outer =
          (sx < 0 ? i === 0 : i === p.units_x - 1) &&
          (sy < 0 ? j === 0 : j === p.units_y - 1);
        if (outer) {
          pockets.push({
            x: sx * o,
            y: sy * o,
            d: p.corner_magnet_d,
            h: p.corner_magnet_h,
          });
        }
      }
    }
  }
  const corner = (i === 0 || i === p.units_x - 1) && (j === 0 || j === p.units_y - 1);
  if (p.center_magnet && corner) {
    pockets.push({
      x: 0,
      y: 0,
      d: p.center_magnet_d + p.magnet_clearance,
      h: p.center_magnet_h,
    });
  }
  return pockets;
};

export const buildBin = (kernel: Kernel, scope: Scope, p: BinParams): BinParts => {
  const layout = layoutOf(p);
  const { width: w, depth: h, bodyHeight, top } = layout;
  const move = (part: Manifold, x: number, y: number, z: number) =>
    scope.add(part.translate(x, y, z));

  const solid = scope.add(solidFoot(kernel));
  /**
   * A hollow foot: one straight cavity from below. Around every magnet pocket a column of
   * the foot stays (the pocket diameter plus the wall on each side), so the magnet has a
   * rim and does not fall into the cavity.
   */
  const hollowFoot = (pockets: Pocket[]): Manifold => {
    const cavity = scope.add(loft(kernel, footCavityLayers(p.foot_wall)));
    const columns = pockets.map((pocket) =>
      move(
        scope.add(
          kernel.Manifold.cylinder(
            c("footHeight"),
            (pocket.d + 2 * p.foot_wall) / 2,
            (pocket.d + 2 * p.foot_wall) / 2,
            CYLINDER_SEGMENTS,
          ),
        ),
        pocket.x,
        pocket.y,
        -1,
      ),
    );
    const opening = scope.add(kernel.Manifold.difference([cavity, ...columns]));
    return scope.add(kernel.Manifold.difference(solid, opening));
  };
  // cells without a pocket share one foot; the few cells with pockets get their own
  const plainFoot = p.foot_hollow === "open" ? hollowFoot([]) : solid;
  const feet: Manifold[] = [];
  for (let i = 0; i < p.units_x; i++) {
    for (let j = 0; j < p.units_y; j++) {
      const pockets = cellPockets(p, i, j);
      const foot =
        p.foot_hollow === "open" && pockets.length > 0
          ? hollowFoot(pockets)
          : plainFoot;
      feet.push(move(foot, cellCentre(i), cellCentre(j), 0));
    }
  }
  const block = move(
    scope.add(
      loft(kernel, [
        { z: 0, hx: w / 2, hy: h / 2, r: c("binCornerRadius") },
        { z: top - c("footHeight"), hx: w / 2, hy: h / 2, r: c("binCornerRadius") },
      ]),
    ),
    w / 2,
    h / 2,
    c("footHeight"),
  );
  const cavity = move(
    scope.add(loft(kernel, cavityLayers(p, layout))),
    w / 2,
    h / 2,
    0,
  );

  const cutters: Manifold[] = [cavity];
  const cylinder = (d: number, height: number, x: number, y: number) =>
    move(
      scope.add(
        kernel.Manifold.cylinder(height + 0.5, d / 2, d / 2, CYLINDER_SEGMENTS),
      ),
      x,
      y,
      -0.5,
    );
  if (p.corner_magnets) {
    for (const [x, y] of cornerMagnetPoints(p)) {
      cutters.push(cylinder(p.corner_magnet_d, p.corner_magnet_h, x, y));
    }
  }
  if (p.center_magnet) {
    for (const [i, j] of cornerCells(p)) {
      cutters.push(
        cylinder(
          p.center_magnet_d + p.magnet_clearance,
          p.center_magnet_h,
          cellCentre(i),
          cellCentre(j),
        ),
      );
    }
  }
  const hollow = scope.add(
    kernel.Manifold.difference([
      scope.add(kernel.Manifold.union([...feet, block])),
      ...cutters,
    ]),
  );
  const scoop = p.scoop ? scoopSolid(kernel, scope, p, layout) : undefined;
  const body = scoop ? scope.add(kernel.Manifold.union(hollow, scoop)) : hollow;

  const place = (part: Manifold) => move(part, -w / 2, -h / 2, 0);
  if (!(p.lip_color_enabled && p.lip_style === "with_lip")) {
    return { body: place(body) };
  }
  // the lip is everything above the body height; the seam is a plane, the parts stay apart
  const slab = (z0: number, height: number) =>
    move(scope.add(kernel.Manifold.cube([w + 2, h + 2, height])), -1, -1, z0);
  const lower = scope.add(kernel.Manifold.intersection(body, slab(-1, bodyHeight + 1)));
  const upper = scope.add(
    kernel.Manifold.intersection(body, slab(bodyHeight, c("lipHeight") + 1)),
  );
  return { body: place(lower), lip: place(upper) };
};
