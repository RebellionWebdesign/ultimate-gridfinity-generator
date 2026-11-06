// Isometric line drawings of Gridfinity parts in SVG, shared by the landing page: the hero
// animation and the small demos. The parts are drawn from the real Gridfinity dimensions
// (foot profile, stacking lip, wall thickness). `createIso` fixes the scale and the origin of
// the projection and returns the drawing functions.
import { CONSTANTS } from "../gridfinity/constants";
import { footHalf, footRadius } from "../geometry/foot";
import { BASEPLATE_LIMITS } from "../model/baseplateParams";

export const c = (name: keyof typeof CONSTANTS): number => CONSTANTS[name].value;
export const GRID = c("grid");
export const TOL = c("binTolerance") / 2;
export const FOOT_H = c("footHeight");
export const BIN_R = c("binCornerRadius");
export const UNIT = c("heightUnit");
export const LIP_H = c("lipHeight");
export const WALL = 1.2; // the thinnest wall the editor allows
export const FLOOR = 0.8;
export const COS = 0.866;
/** Height of a baseplate with the thinnest base: pocket profile plus base (0.4 mm). */
export const PLATE_H =
  c("baseplateProfileHeight") + BASEPLATE_LIMITS.baseplate_base.min;

export type P = [number, number];
export type R4 = [number, number, number, number];
export interface Ring {
  z: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  r: R4;
}
export interface Op {
  d: string;
  fill: string;
  edge?: string;
  evenodd?: boolean;
  cls?: string;
}

export interface BinSpec {
  id: string;
  cx: number;
  cy: number;
  w: number;
  d: number;
  units: number;
  lip: boolean;
  at: number;
}

/**
 * x runs right and down, y left and down, z up. `S` is the number of pixels per mm, `OX` and
 * `OY` the pixel position of the point (0, 0, 0).
 */
export const createIso = (S: number, OX: number, OY: number) => {
  const proj = (x: number, y: number, z: number): [number, number] => [
    OX + (x - y) * COS * S,
    OY + (x + y) * 0.5 * S - z * S,
  ];

  const K = 4; // points per rounded corner
  const box = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    r: R4,
    z: number,
  ): Ring => ({
    z,
    x0,
    y0,
    x1,
    y1,
    r,
  });
  const same = (r: number): R4 => [r, r, r, r];

  /** Ring outline, always 4 × (K + 1) points, so rings of one part match point by point. */
  const outline = (g: Ring): P[] => {
    const corners: [number, number, number][] = [
      [g.x0 + g.r[0], g.y0 + g.r[0], 180],
      [g.x1 - g.r[1], g.y0 + g.r[1], 270],
      [g.x1 - g.r[2], g.y1 - g.r[2], 0],
      [g.x0 + g.r[3], g.y1 - g.r[3], 90],
    ];
    const points: P[] = [];
    corners.forEach(([cx, cy, from], k) => {
      const r = Math.max(g.r[k] ?? 0, 0.001);
      for (let i = 0; i <= K; i++) {
        const a = ((from + (90 * i) / K) * Math.PI) / 180;
        points.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
      }
    });
    return points;
  };

  const path = (points: P[], z: number): string =>
    "M" + points.map(([x, y]) => proj(x, y, z).join(",")).join("L") + "Z";

  const tone = (f: number): string =>
    f <= 1
      ? `color-mix(in srgb, var(--hue), #000 ${Math.round((1 - f) * 100)}%)`
      : `color-mix(in srgb, var(--hue), #fff ${Math.round((f - 1) * 100)}%)`;

  // light from the upper left front: the top is the stone colour, sides are darker
  const LIGHT = [0.25, 0.45, 0.85];
  const shade = (nx: number, ny: number, nz: number): number => {
    const dot = Math.max(0, nx * LIGHT[0]! + ny * LIGHT[1]! + nz * LIGHT[2]!);
    return 0.4 + (0.6 * dot) / 0.855;
  };

  const OUTLINE = "#000";

  /** The black outline along the edges of a ring that face the viewer. */
  const rim = (points: P[], z: number, inward: boolean, cls?: string): Op => {
    let d = "";
    for (let i = 0; i < points.length; i++) {
      const [ax, ay] = points[i] as P;
      const [bx, by] = points[(i + 1) % points.length] as P;
      const len = Math.hypot(bx - ax, by - ay);
      if (len < 1e-3) continue;
      const facing = ((by - ay) / len - (bx - ax) / len) * (inward ? -1 : 1);
      if (facing < -0.02) continue;
      d += `M${proj(ax, ay, z).join(",")}L${proj(bx, by, z).join(",")}`;
    }
    return { d, fill: "none", edge: OUTLINE, cls: cls ? `${cls} line` : "line" };
  };

  /**
   * The sides between two rings. `inward`: the rings are the wall of a hole, so the surface
   * faces the inside. Faces that turn away from the viewer are left out.
   */
  const sides = (a: Ring, b: Ring, inward = false, cls?: string): Op[] => {
    const pa = outline(a);
    const pb = outline(b);
    const rise = (b.x0 - a.x0) / (b.z - a.z); // how fast the wall leans inward going up
    const ops: Op[] = [];
    for (let i = 0; i < pa.length; i++) {
      const j = (i + 1) % pa.length;
      const [ax, ay] = pa[i] as P;
      const [bx, by] = pa[j] as P;
      const len = Math.hypot(bx - ax, by - ay);
      if (len < 1e-3) continue;
      let nx = (by - ay) / len;
      let ny = -(bx - ax) / len;
      let nz = rise;
      if (inward) [nx, ny, nz] = [-nx, -ny, -nz];
      const m = Math.hypot(nx, ny, nz);
      [nx, ny, nz] = [nx / m, ny / m, nz / m];
      if (nx + ny + nz <= 0.02) continue;
      const [cx, cy] = pb[j] as P;
      const [dx, dy] = pb[i] as P;
      ops.push({
        d:
          "M" +
          [proj(ax, ay, a.z), proj(bx, by, a.z), proj(cx, cy, b.z), proj(dx, dy, b.z)]
            .map((p) => p.join(","))
            .join("L") +
          "Z",
        fill: tone(shade(nx, ny, nz)),
        cls,
      });
    }
    ops.push(rim(pa, a.z, inward, cls), rim(pb, b.z, inward, cls));
    return ops;
  };

  /** A flat face, optionally with a hole in it. */
  const cap = (outer: Ring, hole: Ring | undefined, f: number, edge = true): Op => ({
    d: path(outline(outer), outer.z) + (hole ? path(outline(hole), hole.z) : ""),
    fill: tone(f),
    edge: edge ? OUTLINE : undefined,
    evenodd: true,
  });

  const chain = (rings: Ring[], inward: boolean, cls?: string): Op[] =>
    rings.slice(1).flatMap((ring, i) => sides(rings[i] as Ring, ring, inward, cls));

  const ringAt = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    inset: number,
    z: number,
    r: number,
  ) =>
    box(
      x0 + inset,
      y0 + inset,
      x1 - inset,
      y1 - inset,
      same(Math.max(r - inset, 0.3)),
      z,
    );

  /** The foot of one cell, as on bins and lids. */
  const foot = (cx: number, cy: number, z0: number, cls?: string): Op[] => {
    const levels = [
      0,
      c("footLowerSlope"),
      c("footLowerSlope") + c("footVertical"),
      FOOT_H,
    ];
    return chain(
      levels.map((zz) => {
        const h = footHalf(zz);
        const r = zz >= FOOT_H ? BIN_R : footRadius(zz);
        return box(cx - h, cy - h, cx + h, cy + h, same(r), z0 + zz);
      }),
      false,
      cls,
    );
  };

  const cellCentre = (cell: number): number => cell * GRID + GRID / 2;

  /** An open bin: feet, walls, floor and, with a lip, the stacking lip. */
  const bin = (b: BinSpec, z0: number): Op[] => {
    const x0 = b.cx * GRID + TOL;
    const y0 = b.cy * GRID + TOL;
    const x1 = (b.cx + b.w) * GRID - TOL;
    const y1 = (b.cy + b.d) * GRID - TOL;
    const bodyTop = z0 + b.units * UNIT;
    const top = b.lip ? bodyTop + LIP_H : bodyTop;
    const inner = (inset: number, z: number) => ringAt(x0, y0, x1, y1, inset, z, BIN_R);
    const floorZ = z0 + FOOT_H + FLOOR;
    const lipDepth = c("lipDepth");
    const lipUpper = c("lipUpperSlope");
    const wall = b.lip
      ? chain(
          [
            inner(WALL, floorZ),
            inner(WALL, bodyTop - (lipDepth - WALL)),
            inner(lipDepth, bodyTop),
            inner(lipUpper, bodyTop + c("lipLowerSlope")),
            inner(lipUpper, bodyTop + c("lipLowerSlope") + c("lipVertical")),
            inner(0, top),
          ],
          true,
        )
      : sides(inner(WALL, floorZ), inner(WALL, top), true);
    const cells: [number, number][] = [];
    for (let i = 0; i < b.w; i++) for (let j = 0; j < b.d; j++) cells.push([i, j]);
    cells.sort((p, q) => p[0] + p[1] - (q[0] + q[1]));
    return [
      cap(inner(WALL, floorZ), undefined, 0.55, false),
      ...wall,
      ...cells.flatMap(([i, j]) =>
        foot(cellCentre(b.cx + i), cellCentre(b.cy + j), z0, "foot"),
      ),
      ...sides(inner(0, z0 + FOOT_H), inner(0, top)),
      ...(b.lip ? [] : [cap(inner(0, top), inner(WALL, top), 1)]),
    ];
  };

  /** A baseplate tile; corners on the outside of the plate are rounded, inner ones square. */
  const tile = (X: number, Y: number, nx = 3, ny = 2): Op[] => {
    const [x0, y0] = [X * GRID, Y * GRID];
    const [x1, y1] = [x0 + GRID, y0 + GRID];
    const round = c("baseplateCornerRadius");
    const rr: R4 = [
      X === 0 && Y === 0 ? round : 0,
      X === nx - 1 && Y === 0 ? round : 0,
      X === nx - 1 && Y === ny - 1 ? round : 0,
      X === 0 && Y === ny - 1 ? round : 0,
    ];
    const outer = (z: number) => box(x0, y0, x1, y1, rr, z);
    const up = c("baseplateProfileUpper");
    const wall = c("baseplateWallInset");
    const pocket = [
      ringAt(x0, y0, x1, y1, 0, PLATE_H, round),
      ringAt(x0, y0, x1, y1, wall, PLATE_H - up, c("baseplateRadiusWall") + wall),
      ringAt(
        x0,
        y0,
        x1,
        y1,
        wall,
        PLATE_H - up - c("baseplateProfileVertical"),
        c("baseplateRadiusWall") + wall,
      ),
      ringAt(
        x0,
        y0,
        x1,
        y1,
        c("baseplateBottomInset"),
        PLATE_H - c("baseplateProfileHeight"),
        c("baseplateRadiusBottom") + c("baseplateBottomInset"),
      ),
    ];
    pocket[0] = { ...pocket[0]!, r: same(round) };
    return [
      cap(pocket[3] as Ring, undefined, 0.55, false),
      ...chain(pocket, true),
      ...sides(outer(0), outer(PLATE_H)),
      cap(outer(PLATE_H), pocket[0], 1),
    ];
  };

  return { S, proj, box, same, ringAt, chain, sides, cap, foot, cellCentre, bin, tile };
};
