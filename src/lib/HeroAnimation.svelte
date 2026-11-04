<script lang="ts">
  import { onMount } from "svelte";
  import { CONSTANTS } from "../gridfinity/constants";
  import { footHalf, footRadius } from "../geometry/foot";
  import { BASEPLATE_LIMITS } from "../model/baseplateParams";

  // A 3 × 2 base builds up cell by cell, then bins drop into it and two lids with labels
  // land on top. The parts are drawn from the real Gridfinity dimensions (foot profile,
  // baseplate pockets, stacking lip, wall thickness), isometric, in SVG. The loop is driven
  // by timers, so it can be shown finished (and still) when the user asks for less motion.
  const c = (name: keyof typeof CONSTANTS): number => CONSTANTS[name].value;
  const GRID = c("grid");
  const TOL = c("binTolerance") / 2;
  const FOOT_H = c("footHeight");
  const BIN_R = c("binCornerRadius");
  const UNIT = c("heightUnit");
  const LIP_H = c("lipHeight");
  const PLATE_H = c("baseplateProfileHeight") + BASEPLATE_LIMITS.baseplate_base.min;
  const WALL = 1.2; // the thinnest wall the editor allows
  const FLOOR = 0.8;

  // projection: x runs right and down, y left and down, z up; the scene is centred
  const S = 76 / GRID; // px per mm
  const COS = 0.866;
  const OX = 227;
  const OY = 100;
  const proj = (x: number, y: number, z: number): [number, number] => [
    OX + (x - y) * COS * S,
    OY + (x + y) * 0.5 * S - z * S,
  ];

  type P = [number, number];
  type R4 = [number, number, number, number];
  interface Ring {
    z: number;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    r: R4;
  }
  interface Op {
    d: string;
    fill: string;
    edge?: string;
    evenodd?: boolean;
    cls?: string;
  }

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

  /** A baseplate tile; corners on the outside of the plate are rounded, inner ones square. */
  const tile = (X: number, Y: number): Op[] => {
    const [x0, y0] = [X * GRID, Y * GRID];
    const [x1, y1] = [x0 + GRID, y0 + GRID];
    const round = c("baseplateCornerRadius");
    const rr: R4 = [
      X === 0 && Y === 0 ? round : 0,
      X === 2 && Y === 0 ? round : 0,
      X === 2 && Y === 1 ? round : 0,
      X === 0 && Y === 1 ? round : 0,
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

  interface BinSpec {
    id: string;
    cx: number;
    cy: number;
    w: number;
    d: number;
    units: number;
    lip: boolean;
    at: number;
  }

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

  /** A lid for one cell: foot below, flat plate above. */
  const lid = (cx: number, cy: number, z0: number): Op[] => {
    const x0 = cx * GRID + TOL;
    const y0 = cy * GRID + TOL;
    const x1 = (cx + 1) * GRID - TOL;
    const y1 = (cy + 1) * GRID - TOL;
    const ring = (z: number) => box(x0, y0, x1, y1, same(BIN_R), z);
    return [
      ...foot(cellCentre(cx), cellCentre(cy), z0),
      ...sides(ring(z0 + FOOT_H), ring(z0 + UNIT)),
      cap(ring(z0 + UNIT), undefined, 1),
    ];
  };

  interface Block {
    id: string;
    kind: "tile" | "bin" | "lid";
    ops: Op[];
    /** ms after the start of the loop */
    at: number;
    /** front-most cell, for the drawing order */
    depth: number;
    z: number;
    label?: { text: string; transform: string; x: number; y: number };
  }

  const FLOOR_Z = PLATE_H - c("baseplateProfileHeight");
  const blocks: Block[] = [];
  let step = 0;
  for (let Y = 0; Y < 2; Y++) {
    for (let X = 0; X < 3; X++) {
      blocks.push({
        id: `tile-${X}-${Y}`,
        kind: "tile",
        ops: tile(X, Y),
        at: 150 * step++,
        depth: X + Y,
        z: 0,
      });
    }
  }
  const bins: BinSpec[] = [
    { id: "bin-a", cx: 0, cy: 0, w: 1, d: 2, units: 3, lip: true, at: 1400 },
    { id: "bin-b", cx: 1, cy: 0, w: 1, d: 1, units: 2, lip: false, at: 1900 },
    { id: "bin-c", cx: 1, cy: 1, w: 1, d: 1, units: 2, lip: false, at: 2400 },
    { id: "bin-d", cx: 2, cy: 0, w: 1, d: 2, units: 2, lip: true, at: 2900 },
  ];
  for (const b of bins) {
    blocks.push({
      id: b.id,
      kind: "bin",
      ops: bin(b, FLOOR_Z),
      at: b.at,
      depth: b.cx + b.w - 1 + (b.cy + b.d - 1),
      z: 1,
    });
  }
  const lids = [
    { id: "lid-b", cx: 1, cy: 0, text: "M3 × 8", at: 3900 },
    { id: "lid-c", cx: 1, cy: 1, text: "M4 × 12", at: 4500 },
  ];
  for (const l of lids) {
    const z0 = FLOOR_Z + 2 * UNIT;
    const [e, f] = proj(0, 0, z0 + UNIT);
    blocks.push({
      id: l.id,
      kind: "lid",
      ops: lid(l.cx, l.cy, z0),
      at: l.at,
      depth: l.cx + l.cy,
      z: 2,
      label: {
        text: l.text,
        transform: `matrix(${COS * S} ${0.5 * S} ${-COS * S} ${0.5 * S} ${e} ${f})`,
        x: cellCentre(l.cx),
        y: cellCentre(l.cy) + 2.3,
      },
    });
  }
  // the base first, then bins and lids from back to front, lids after their bin
  const ordered = blocks
    .map((b, i) => ({ b, i }))
    .sort(
      (p, q) =>
        Number(p.b.kind !== "tile") - Number(q.b.kind !== "tile") ||
        p.b.depth - q.b.depth ||
        p.b.z - q.b.z ||
        p.i - q.i,
    )
    .map((e) => e.b);

  const HOLD = 9200; // everything is in place until here
  const LOOP = 10600;

  let shown = $state<string[]>([]);
  let leaving = $state(false);
  let timers: ReturnType<typeof setTimeout>[] = [];

  const run = () => {
    timers = [];
    shown = [];
    leaving = false;
    for (const b of blocks) {
      timers.push(setTimeout(() => (shown = [...shown, b.id]), 300 + b.at));
    }
    timers.push(setTimeout(() => (leaving = true), HOLD));
    timers.push(
      setTimeout(() => {
        shown = [];
        leaving = false;
      }, HOLD + 700),
    );
    timers.push(setTimeout(run, LOOP));
  };

  onMount(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      shown = blocks.map((b) => b.id);
      return;
    }
    run();
    return () => timers.forEach(clearTimeout);
  });
</script>

<svg
  viewBox="60 24 400 280"
  role="img"
  aria-label="A 3 by 2 base builds up cell by cell, then bins and two lids with labels drop onto it"
>
  {#each ordered as b (b.id)}
    <g class="block {b.kind}" class:in={shown.includes(b.id)} class:leaving>
      {#each b.ops as op, i (i)}
        <path
          class={op.cls}
          d={op.d}
          fill-rule={op.evenodd ? "evenodd" : undefined}
          style="--f: {op.fill}; --e: {op.edge ?? op.fill}"
        />
      {/each}
      {#if b.label}
        <text
          class="label"
          transform={b.label.transform}
          x={b.label.x}
          y={b.label.y}
          font-size="6.5"
        >
          {b.label.text}
        </text>
      {/if}
    </g>
  {/each}
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }
  path {
    fill: var(--f);
    stroke: var(--e);
    stroke-width: 0.6;
    stroke-linejoin: round;
  }
  /* base and lids in the accent colour of the page, bins in dark grey so the outlines show */
  .tile,
  .lid {
    --hue: var(--accent);
  }
  .bin {
    --hue: #5a5d56;
  }
  path.line {
    stroke-width: 0.9;
    stroke-linecap: round;
  }
  .block {
    opacity: 0;
    transform: translateY(-200px);
    transition:
      transform 650ms cubic-bezier(0.34, 1.35, 0.5, 1),
      opacity 220ms ease-out;
  }
  .block.tile {
    transform: translateY(-70px);
  }
  .block.in {
    opacity: 1;
    transform: none;
  }
  .block.in.leaving {
    opacity: 0;
    transition: opacity 600ms ease-in;
  }
  /* a bin's feet sink into the pockets of the base as it lands */
  .bin .foot {
    transition: opacity 120ms 480ms;
  }
  .bin.in .foot {
    opacity: 0;
  }
  .label {
    fill: var(--accent-ink);
    font-family: var(--font-num);
    font-weight: 500;
    text-anchor: middle;
  }
  @media (prefers-reduced-motion: reduce) {
    .block,
    .bin .foot {
      transition: none;
    }
  }
</style>
