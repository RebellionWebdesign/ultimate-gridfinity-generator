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
 * The wall of the cavity under and in a stacking lip, from below as [z, inset from the outer
 * wall]: the wall runs in at 45 degrees to the lip depth (2.6), stands upright for the step
 * (1.6), and then the lip itself follows: 0.7 (45 degrees) / 1.8 vertical / 1.9 (45 degrees)
 * to a knife edge. The lip starts at the top of the body. Reference drawing of the stacking
 * lip (Stu142); the last point sits 0.01 above so the cut passes cleanly through the tip.
 */
const lipWallProfile = (p: BinParams, layout: BinLayout): [number, number][] => {
  const top = layout.bodyHeight;
  const step = c("lipStepHeight");
  const depth = c("lipDepth");
  return [
    [top - step - (depth - p.wall_thickness), p.wall_thickness],
    [top - step, depth],
    [top, depth],
    [top + c("lipLowerSlope"), c("lipUpperSlope")],
    [top + c("lipLowerSlope") + c("lipVertical"), c("lipUpperSlope")],
    [top + c("lipHeight"), 0],
    [top + c("lipHeight") + 0.01, 0],
  ];
};

/** Inset of the wall profile at a height (the wall itself below its first point). */
const insetAt = (profile: [number, number][], z: number): number => {
  const [first] = profile;
  if (!first || z <= first[0]) return first?.[1] ?? 0;
  for (let i = 1; i < profile.length; i++) {
    const [z0, d0] = profile[i - 1] as [number, number];
    const [z1, d1] = profile[i] as [number, number];
    if (z <= z1) return d0 + ((d1 - d0) * (z - z0)) / (z1 - z0);
  }
  return profile[profile.length - 1]?.[1] ?? 0;
};

/**
 * The cavity as a loft: straight walls from the floor up. With a stacking lip the wall goes
 * on as in `lipWallProfile`; when the floor lies above the start of that profile, the cavity
 * starts on it at the floor.
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
  const ring = (z: number, inset: number): Layer => ({
    z,
    hx: layout.width / 2 - inset,
    hy: layout.depth / 2 - inset,
    r: innerRadius(inset),
  });
  const profile = lipWallProfile(p, layout);
  return [
    ring(layout.floor, insetAt(profile, layout.floor)),
    ...profile
      .filter(([z]) => z > layout.floor + 1e-9)
      .map(([z, inset]) => ring(z, inset)),
  ];
};

/** Points per arc of the scoop (the circle of the cavity corners has about 10 per 90 degrees). */
const SCOOP_SEGMENTS = 48;
/** The scoop reaches this far into the walls and below the floor, so the union is clean. */
const SCOOP_OVERLAP = 0.3;

/**
 * Section of the scoop (E-08) in (u, v): u from the inner face of the front wall into the
 * cavity, v up from the cavity floor, in mm. The arc has the owner's radius and meets the
 * floor `scoopLength` from the wall. At the top it ends flush with the step under the stacking
 * lip: at the tip of the 45 degree chamfer, `lipDepth - wall` from the wall (at the wall itself
 * without a lip), at the lower edge of the step. The arc runs through those two points, so
 * nothing sticks out. In a tall bin the arc would need a bigger circle; then it stays as it is,
 * stands upright against the wall at the tip, and only the straight piece along the wall grows.
 * Undefined when there is no room.
 */
export const scoopOutline = (
  p: BinParams,
  layout: BinLayout,
): [number, number][] | undefined => {
  const r = c("scoopRadius");
  const length = c("scoopLength");
  const lip = p.lip_style === "with_lip";
  const tip = lip ? c("lipDepth") - p.wall_thickness : 0;
  // up to the tip of the chamfer, the lower edge of the step; without a lip to the body top
  const height = layout.bodyHeight - (lip ? c("lipStepHeight") : 0) - layout.floor;
  if (height <= 0) return undefined;
  // the circle that stands upright at the tip and passes through the floor point: the tallest arc
  const upright = Math.sqrt(r * r - (length - tip - r) ** 2);
  // the circle of the arc: through the floor point and the tip (or its upright end), centre above
  const top: [number, number] = [tip, Math.min(height, upright)];
  const chord = Math.hypot(top[0] - length, top[1]);
  const lift = Math.sqrt(r * r - (chord * chord) / 4);
  const cu = (length + top[0]) / 2 + (top[1] / chord) * lift;
  const cv = top[1] / 2 + ((length - top[0]) / chord) * lift;
  const first = Math.atan2(0 - cv, length - cu);
  let sweep = Math.atan2(top[1] - cv, top[0] - cu) - first;
  while (sweep > Math.PI) sweep -= 2 * Math.PI;
  while (sweep < -Math.PI) sweep += 2 * Math.PI;
  const points: [number, number][] = [
    [-SCOOP_OVERLAP, -SCOOP_OVERLAP],
    [length, -SCOOP_OVERLAP],
  ];
  for (let i = 0; i <= SCOOP_SEGMENTS; i++) {
    const a = first + (sweep * i) / SCOOP_SEGMENTS;
    points.push([cu + r * Math.cos(a), cv + r * Math.sin(a)]);
  }
  // the points of the arc are exactly the floor point and the top, whatever the rounding
  points[2] = [length, 0];
  points[points.length - 1] = top;
  if (height > top[1]) points.push([tip, height]);
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
  return scope.add(
    kernel.Manifold.intersection(moved, cavityEnvelope(kernel, scope, p, layout)),
  );
};

/**
 * The shape of the cavity, a little larger (0.05 mm into the wall, enough for a clean union),
 * with the same rounded corners, in the coordinates of the bin. Scoop and dividers reach into
 * the walls; at the rounded corners of the bin that would stand out of the outer wall, so they
 * are cut to this.
 */
const cavityEnvelope = (
  kernel: Kernel,
  scope: Scope,
  p: BinParams,
  layout: BinLayout,
): Manifold => {
  const grow = 0.05;
  const ring = (z: number): Layer => ({
    z,
    hx: layout.width / 2 - p.wall_thickness + grow,
    hy: layout.depth / 2 - p.wall_thickness + grow,
    r: innerRadius(p.wall_thickness) + grow,
  });
  const envelope = scope.add(
    loft(kernel, [ring(layout.floor - SCOOP_OVERLAP), ring(layout.bodyHeight + 0.01)]),
  );
  return scope.add(envelope.translate(layout.width / 2, layout.depth / 2, 0));
};

/**
 * The dividers (E-07) as solids, in the coordinates of the bin: each runs across the whole
 * width of the cavity into the side walls, from the floor up to its height.
 */
const dividerSolids = (
  kernel: Kernel,
  scope: Scope,
  p: BinParams,
  layout: BinLayout,
): Manifold[] => {
  if (p.dividers.length === 0) return [];
  const envelope = cavityEnvelope(kernel, scope, p, layout);
  const wall = p.wall_thickness;
  const across = layout.width - 2 * wall + 2 * SCOOP_OVERLAP;
  return p.dividers.map((d) => {
    const edge = wall + d.position - p.divider_thickness / 2;
    const box = scope
      .add(
        kernel.Manifold.cube([across, p.divider_thickness, d.height + SCOOP_OVERLAP]),
      )
      .translate(wall - SCOOP_OVERLAP, edge, layout.floor - SCOOP_OVERLAP);
    return scope.add(kernel.Manifold.intersection(scope.add(box), envelope));
  });
};

/** Height of the underside of the label plate: where the first 45 degree slope of the lip is as far in as the plate edge. */
export const labelRestZ = (layout: BinLayout): number =>
  layout.bodyHeight + (c("lipDepth") - c("labelEdgeInset"));

/**
 * Where the lugs of the label plate sit across the bin, as [from, to] in the frame of the
 * wall (the wall at the far end, `depth` across): 4.33 mm from the edge of the plate on the
 * side of the wall, the plate itself resting 2.0 mm in from that wall. `near` puts the wall
 * at the other end (y = 0).
 */
const labelLugSpan = (depth: number, near: boolean): [number, number] => {
  const e = c("labelEdgeInset");
  const offset = c("labelLugOffset");
  const wide = c("labelLugWidth");
  return near
    ? [e + offset, e + offset + wide]
    : [depth - e - offset - wide, depth - e - offset];
};

/**
 * The two slots (E-09) for the lugs of the label plate, cut into the two walls next to the
 * wall the label sits at: every dimension of the lug plus 0.05 mm, so the plate clicks in
 * cleanly. They reach a little into the cavity so that the cut opens cleanly. The label can
 * sit at any of the four walls (version 1.1): the slots are made for a wall at the back and
 * turned to the wall that was chosen.
 */
const labelSlots = (
  kernel: Kernel,
  scope: Scope,
  p: BinParams,
  layout: BinLayout,
): Manifold[] => {
  if (p.label_slot === "none" || p.lip_style !== "with_lip") return [];
  const side = p.label_slot;
  const alongX = side === "front" || side === "back";
  // the frame of the wall: `length` along it, `across` from the wall to the opposite one
  const length = alongX ? layout.width : layout.depth;
  const across = alongX ? layout.depth : layout.width;
  const e = c("labelEdgeInset");
  const grow = c("labelLugClearance");
  const lug = c("labelLugLength");
  const [y0, y1] = labelLugSpan(across, side === "front");
  const z0 = labelRestZ(layout) - grow / 2;
  const height = c("labelThickness") + grow;
  const reach = 0.1; // into the cavity, which is empty there
  const cut = (x0: number, x1: number) =>
    scope.add(
      scope
        .add(kernel.Manifold.cube([x1 - x0, y1 - y0 + grow, height]))
        .translate(x0, y0 - grow / 2, z0),
    );
  const slots = [
    cut(e - lug - grow, e + reach),
    cut(length - e - reach, length - e + lug + grow),
  ];
  if (side === "right") {
    // the wall at x = width: (x, y) -> (y, length - x)
    return slots.map((s) =>
      scope.add(scope.add(s.rotate(0, 0, -90)).translate(0, length, 0)),
    );
  }
  if (side === "left") {
    // the wall at x = 0: (x, y) -> (across - y, x)
    return slots.map((s) =>
      scope.add(scope.add(s.rotate(0, 0, 90)).translate(across, 0, 0)),
    );
  }
  return slots;
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
  const additions = [
    ...(scoop ? [scoop] : []),
    ...dividerSolids(kernel, scope, p, layout),
  ];
  const joined =
    additions.length > 0
      ? scope.add(kernel.Manifold.union([hollow, ...additions]))
      : hollow;
  const slots = labelSlots(kernel, scope, p, layout);
  const body =
    slots.length > 0
      ? scope.add(kernel.Manifold.difference([joined, ...slots]))
      : joined;

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
