import { beforeAll, describe, expect, it } from "vitest";
import { CONSTANTS } from "../gridfinity/constants";
import {
  BIN_LIMITS,
  DEFAULT_BIN,
  floorZOf,
  maxHeightUnits,
  validateBin,
  type BinParams,
} from "../model/binParams";
import { buildBin, layoutOf, scoopOutline } from "./bin";
import { initKernel, Scope, type Kernel } from "./kernel";
import { isClosed, sizeOf, vertices } from "./mesh";

let kernel: Kernel;
beforeAll(async () => {
  kernel = await initKernel();
});

const measure = (overrides: Partial<BinParams>) => {
  const scope = new Scope();
  try {
    const { body, lip } = buildBin(kernel, scope, { ...DEFAULT_BIN, ...overrides });
    return {
      size: sizeOf(body),
      volume: body.volume(),
      closed: isClosed(body) && (!lip || isClosed(lip)),
      lipSize: lip ? sizeOf(lip) : undefined,
      lipMinZ: lip?.boundingBox().min[2],
      lipVolume: lip?.volume() ?? 0,
      verts: vertices(body),
    };
  } finally {
    scope.dispose();
  }
};

/** Vertices at height z (read before the scope is freed). */
const at = (m: { verts: [number, number, number][] }, z: number) =>
  m.verts.filter(([, , vz]) => Math.abs(vz - z) < 1e-6);

// area of a regular 40-gon with radius r, times depth: what a pocket removes
const pocketVolume = (d: number, h: number) =>
  0.5 * 40 * (d / 2) ** 2 * Math.sin((2 * Math.PI) / 40) * h;

describe("C-05 bin size (spec 6.2)", () => {
  it("1x1x3 is 41.5 x 41.5 x 25.4 with the lip", () => {
    const m = measure({});
    expect(m.size.x).toBeCloseTo(41.5, 4);
    expect(m.size.y).toBeCloseTo(41.5, 4);
    expect(m.size.z).toBeCloseTo(25.4, 4);
  });

  it("1x1x3 is 21 tall without the lip, and the flat top at full height is 25.4", () => {
    expect(measure({ lip_style: "flat_lower" }).size.z).toBeCloseTo(21, 4);
    expect(measure({ lip_style: "flat_same_height" }).size.z).toBeCloseTo(25.4, 4);
  });

  it("height is 7 per unit plus the 4.4 lip", () => {
    for (const units of [1, 2, 6, 12]) {
      expect(measure({ height_units: units }).size.z).toBeCloseTo(7 * units + 4.4, 4);
    }
  });

  it("2x2 is 83.5 wide and 3x2 is 125.5 x 83.5", () => {
    expect(measure({ units_x: 2, units_y: 2 }).size.x).toBeCloseTo(83.5, 4);
    const m = measure({ units_x: 3, units_y: 2 });
    expect(m.size.x).toBeCloseTo(125.5, 4);
    expect(m.size.y).toBeCloseTo(83.5, 4);
  });

  it("the foot's bottom edge is 35.6 wide", () => {
    const xs = at(measure({}), 0).map(([x]) => x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(35.6, 4);
  });

  it("is centred on x and y, with the foot on z = 0", () => {
    const scope = new Scope();
    try {
      const { body } = buildBin(kernel, scope, DEFAULT_BIN);
      const { min, max } = body.boundingBox();
      expect(min[0] + max[0]).toBeCloseTo(0, 6);
      expect(min[1] + max[1]).toBeCloseTo(0, 6);
      expect(min[2]).toBeCloseTo(0, 6);
    } finally {
      scope.dispose();
    }
  });
});

describe("C-05 walls and floor", () => {
  it("the floor lies 0.8 mm above the 4.75 foot by default", () => {
    expect(layoutOf(DEFAULT_BIN).floor).toBeCloseTo(5.55, 10);
    expect(layoutOf({ ...DEFAULT_BIN, bottom_thickness: 2 }).floor).toBeCloseTo(
      6.75,
      10,
    );
  });

  it("the cavity wall is the wall setting", () => {
    for (const wall of [1.2, 2, 2.5]) {
      const ring = at(
        measure({ wall_thickness: wall, lip_style: "flat_lower" }),
        layoutOf({ ...DEFAULT_BIN, wall_thickness: wall }).floor,
      );
      const half = Math.max(...ring.map(([x]) => Math.abs(x)));
      expect(half).toBeCloseTo(20.75 - wall, 4);
    }
  });

  it("a thicker wall and floor leave more material", () => {
    const base = measure({}).volume;
    expect(measure({ wall_thickness: 2 }).volume).toBeGreaterThan(base);
    expect(measure({ bottom_thickness: 2 }).volume).toBeGreaterThan(base);
  });

  it("the stacking lip adds the 4.4 mm of lip and a tip on the wall", () => {
    const withLip = measure({});
    const flatLower = measure({ lip_style: "flat_lower" });
    expect(withLip.volume).toBeGreaterThan(flatLower.volume);
  });
});

describe("C-05 closed meshes", () => {
  it("every bin from 1x1x1 up to 4x4x6 is closed, for every top edge", () => {
    for (const lip of ["with_lip", "flat_same_height", "flat_lower"] as const) {
      for (const [n, units] of [
        [1, 1],
        [1, 3],
        [2, 2],
        [3, 4],
        [4, 6],
      ] as const) {
        const m = measure({
          units_x: n,
          units_y: n,
          height_units: units,
          lip_style: lip,
        });
        expect(m.closed, `${n}x${n}x${units} ${lip}`).toBe(true);
      }
    }
  });

  it("is closed at the thickest wall and floor", () => {
    expect(measure({ wall_thickness: 2.5, bottom_thickness: 5 }).closed).toBe(true);
  });
});

describe("C-05 stacking lip as its own body", () => {
  it("splits at the body height; the volumes add up", () => {
    const together = measure({});
    const split = measure({ lip_color_enabled: true });
    expect(split.closed).toBe(true);
    expect(split.lipMinZ).toBeCloseTo(21, 6);
    expect(split.lipSize?.z).toBeCloseTo(4.4, 4);
    expect(split.size.z).toBeCloseTo(21, 4);
    expect(split.volume + split.lipVolume).toBeCloseTo(together.volume, 2);
  });

  it("has no lip body without a lip", () => {
    expect(measure({ lip_style: "flat_lower", lip_color_enabled: true }).lipSize).toBe(
      undefined,
    );
  });
});

describe("C-06 magnets", () => {
  it("corner pockets: four in the whole bin, 6.1 x 2.1 each", () => {
    for (const [x, y] of [
      [1, 1],
      [4, 4],
    ]) {
      const plain = measure({ units_x: x, units_y: y });
      const magnets = measure({ units_x: x, units_y: y, corner_magnets: true });
      expect(plain.volume - magnets.volume).toBeCloseTo(4 * pocketVolume(6.1, 2.1), 2);
    }
  });

  it("centre pockets: one in a 1x1, two in a 3x1, four in a 3x3", () => {
    const wide = pocketVolume(6.1 + 0.2, 2);
    for (const [x, y, count] of [
      [1, 1, 1],
      [3, 1, 2],
      [3, 3, 4],
    ] as const) {
      const plain = measure({ units_x: x, units_y: y });
      const magnets = measure({ units_x: x, units_y: y, center_magnet: true });
      expect(plain.volume - magnets.volume, `${x}x${y}`).toBeCloseTo(count * wide, 2);
    }
  });

  it("the floor rises so 0.8 mm stays above the tallest magnet", () => {
    expect(floorZOf(DEFAULT_BIN)).toBeCloseTo(5.55, 10);
    expect(
      floorZOf({ ...DEFAULT_BIN, corner_magnets: true, corner_magnet_h: 3.9 }),
    ).toBe(5.55);
    const deep = { ...DEFAULT_BIN, center_magnet: true, center_magnet_h: 5 };
    expect(floorZOf(deep)).toBeCloseTo(5.8, 10);
    expect(measure({ center_magnet: true, center_magnet_h: 5 }).closed).toBe(true);
  });
});

describe("C-04 bin limits", () => {
  it("accepts the defaults", () => {
    expect(validateBin(DEFAULT_BIN)).toEqual([]);
  });

  it("rejects every value below its minimum and above its maximum", () => {
    for (const key of Object.keys(BIN_LIMITS) as (keyof typeof BIN_LIMITS)[]) {
      const { min, max } = BIN_LIMITS[key];
      expect(validateBin({ ...DEFAULT_BIN, [key]: min - 0.05 }).length).toBe(1);
      expect(validateBin({ ...DEFAULT_BIN, [key]: max + 0.05 }).length).toBe(1);
      expect(validateBin({ ...DEFAULT_BIN, [key]: min })).toEqual([]);
      expect(validateBin({ ...DEFAULT_BIN, [key]: max })).toEqual([]);
    }
  });

  it("the wall stays below the 2.6 mm depth of the stacking lip", () => {
    expect(BIN_LIMITS.wall_thickness.max).toBeLessThan(2.6);
  });
});

describe("C-08 hollow foot (as on the lid)", () => {
  it("is lighter than a solid foot and keeps the outer size", () => {
    const solid = measure({});
    const hollow = measure({ foot_hollow: "open" });
    expect(hollow.volume).toBeLessThan(solid.volume);
    expect(hollow.size.x).toBeCloseTo(solid.size.x, 4);
    expect(hollow.size.z).toBeCloseTo(solid.size.z, 4);
    expect(hollow.closed).toBe(true);
  });

  it("the cavity is one straight cut that ends 1.45 mm below the top of the foot", () => {
    const m = measure({ foot_hollow: "open" });
    // 4.75 - 1.45 = 3.3: the roof of the cavity
    expect(at(m, 3.3).length).toBeGreaterThan(0);
    const roof = at(m, 3.3).map(([x]) => Math.abs(x));
    // inset from the foot's bottom edge (17.8) by the wall
    expect(Math.max(...roof)).toBeCloseTo(17.8 - 1.2, 4);
  });

  it("a thicker foot wall leaves more material", () => {
    const thin = measure({ foot_hollow: "open" });
    const thick = measure({ foot_hollow: "open", foot_wall: 2.5 });
    expect(thick.volume).toBeGreaterThan(thin.volume);
  });

  it("keeps a rim of foot material around every magnet pocket", () => {
    const hollow = measure({ foot_hollow: "open" });
    const magnets = measure({
      foot_hollow: "open",
      corner_magnets: true,
      center_magnet: true,
    });
    // the pockets sit in columns that stay solid: the hollow bin with magnets is heavier
    expect(magnets.volume).toBeGreaterThan(hollow.volume);
    expect(magnets.closed).toBe(true);
  });

  it("is closed for every size, with and without magnets", () => {
    for (const magnets of [false, true]) {
      for (const [x, y] of [
        [1, 1],
        [2, 1],
        [3, 3],
        [4, 4],
      ] as const) {
        const m = measure({
          units_x: x,
          units_y: y,
          foot_hollow: "open",
          corner_magnets: magnets,
          center_magnet: magnets,
        });
        expect(m.closed, `${x}x${y} magnets ${magnets}`).toBe(true);
      }
    }
  });
});

describe("bin height up to the build height", () => {
  it("85 units reach 599.4 mm with the lip, inside a 600 mm build height", () => {
    const m = measure({ height_units: 85 });
    expect(m.size.z).toBeCloseTo(7 * 85 + 4.4, 4);
    expect(m.closed).toBe(true);
  });

  it("the most units a build height allows, with and without the top edge", () => {
    // 256 mm: 7 x 35 + 4.4 = 249.4 with a lip, 7 x 36 = 252 without
    expect(maxHeightUnits(256, "with_lip")).toBe(35);
    expect(maxHeightUnits(256, "flat_same_height")).toBe(35);
    expect(maxHeightUnits(256, "flat_lower")).toBe(36);
    expect(maxHeightUnits(600, "flat_lower")).toBe(85);
    expect(maxHeightUnits(10, "with_lip")).toBe(1);
  });
});

describe("E-08 scoop (the owner's drawing of 9 November 2026)", () => {
  const R = CONSTANTS.scoopRadius.value;
  const L = CONSTANTS.scoopLength.value;
  const wall = 1.2;
  /** the circle of the arc, in (u, v): from the front wall's inner face, up from the floor */
  const circle = (tip: number) => {
    const cu = tip + R;
    return { cu, cv: Math.sqrt(R * R - (L - cu) ** 2) };
  };

  /** Distance from the inner face of the front wall to the front edge of the cavity at v mm above the floor. */
  const frontEdge = (o: Partial<BinParams>, v: number): number => {
    const p = { ...DEFAULT_BIN, ...o, scoop: true };
    const layout = layoutOf(p);
    const scope = new Scope();
    try {
      const { body } = buildBin(kernel, scope, p);
      const section = scope.add(body.slice(layout.floor + v));
      const holes = section.toPolygons().filter(
        (poly) =>
          poly.reduce((sum, [x, y], i) => {
            const [nx, ny] = poly[(i + 1) % poly.length] ?? [0, 0];
            return sum + (x * ny - nx * y);
          }, 0) < 0,
      );
      const ys = holes.flatMap((poly) => poly.map(([, y]) => y));
      return Math.min(...ys) + layout.depth / 2 - p.wall_thickness;
    } finally {
      scope.dispose();
    }
  };
  /** Radius of the circle through three points, found without knowing how the arc is built. */
  const circumradius = (a: number[], b: number[], c: number[]): number => {
    const [ax = 0, ay = 0, bx = 0, by = 0, cx = 0, cy = 0] = [...a, ...b, ...c];
    const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
    const ux =
      ((ax * ax + ay * ay) * (by - cy) +
        (bx * bx + by * by) * (cy - ay) +
        (cx * cx + cy * cy) * (ay - by)) /
      d;
    const uy =
      ((ax * ax + ay * ay) * (cx - bx) +
        (bx * bx + by * by) * (ax - cx) +
        (cx * cx + cy * cy) * (bx - ax)) /
      d;
    return Math.hypot(ax - ux, ay - uy);
  };
  const tip = CONSTANTS.lipDepth.value - wall;
  const stepH = CONSTANTS.lipStepHeight.value;

  /** Vertices where the scoop meets the left side wall, as (u, v). */
  const onSideWall = (o: Partial<BinParams>) => {
    const p = { ...DEFAULT_BIN, ...o };
    const layout = layoutOf(p);
    const m = measure({ ...o, scoop: true });
    // the part is centred on x/y: put its corner back at the origin
    return m.verts
      .filter(([x]) => Math.abs(x + layout.width / 2 - p.wall_thickness) < 1e-6)
      .map(([, y, z]): [number, number] => [
        y + layout.depth / 2 - p.wall_thickness,
        z - layout.floor,
      ]);
  };

  it("is off by default and changes nothing then", () => {
    expect(DEFAULT_BIN.scoop).toBe(false);
    expect(measure({ scoop: false }).volume).toBe(measure({}).volume);
  });

  it("makes a closed solid of the same size, with more material", () => {
    const plain = measure({});
    const m = measure({ scoop: true });
    expect(m.closed).toBe(true);
    expect(m.size.x).toBeCloseTo(plain.size.x, 6);
    expect(m.size.y).toBeCloseTo(plain.size.y, 6);
    expect(m.size.z).toBeCloseTo(plain.size.z, 6);
    expect(m.volume).toBeGreaterThan(plain.volume + 100);
  });

  it("follows a circle with the radius of the drawing (diameter 33.75) along the whole arc", () => {
    const layout = layoutOf(DEFAULT_BIN);
    const height = layout.bodyHeight - stepH - layout.floor;
    const at = (v: number): number[] => [frontEdge({}, v), v];
    expect(circumradius(at(1), at(height / 2), at(height - 0.05))).toBeCloseTo(R, 1);
    expect(circumradius(at(3), at(height * 0.6), at(height - 0.2))).toBeCloseTo(R, 1);
  });

  it("has its points on one circle of that radius where it meets the side wall", () => {
    const arc = onSideWall({})
      .filter(([u, v]) => u > 3 && u < L - 0.01 && v > 0.01)
      .sort((a, b) => a[0] - b[0]);
    expect(arc.length).toBeGreaterThan(20);
    const [first, mid, last] = [
      arc[0],
      arc[Math.floor(arc.length / 2)],
      arc[arc.length - 1],
    ];
    expect(
      circumradius(first as number[], mid as number[], last as number[]),
    ).toBeCloseTo(R, 3);
  });

  it("ends flush with the step under the lip: no ledge sticks out at the top", () => {
    for (const units of [2, 3]) {
      const layout = layoutOf({ ...DEFAULT_BIN, height_units: units });
      const height = layout.bodyHeight - stepH - layout.floor;
      // just below the tip the front edge is at the tip, and just above it still (the step)
      expect(
        frontEdge({ height_units: units }, height - 0.01),
        `${units}u`,
      ).toBeCloseTo(tip, 1);
      expect(
        frontEdge({ height_units: units }, height + 0.01),
        `${units}u`,
      ).toBeCloseTo(tip, 1);
      expect(frontEdge({ height_units: units }, height - 0.2), `${units}u`).toBeCloseTo(
        tip,
        0,
      );
    }
  });

  it("meets the floor 15.84 mm from the wall", () => {
    expect(frontEdge({}, 0.001)).toBeCloseTo(L, 1);
  });

  it("ends at the tip of the chamfer under the lip: the top of the body, 1.4 mm from the wall", () => {
    // 4 units: tall enough for the arc to stand upright; above it only the wall piece
    const p = { ...DEFAULT_BIN, height_units: 4 };
    const layout = layoutOf(p);
    const height = layout.bodyHeight - stepH - layout.floor;
    expect(height).toBeGreaterThan(circle(tip).cv);
    for (const v of [circle(tip).cv + 0.5, 20, height - 0.01]) {
      expect(frontEdge({ height_units: 4 }, v), `v = ${v}`).toBeCloseTo(tip, 2);
    }
    // up the step the wall stays at the tip; above it the lip's 0.7 chamfer opens the cavity again
    expect(frontEdge({ height_units: 4 }, height + stepH - 0.01)).toBeCloseTo(tip, 2);
    expect(frontEdge({ height_units: 4 }, height + stepH + 0.3)).toBeLessThan(tip);
  });

  it("in a tall bin only the piece along the wall grows: the arc stays the same", () => {
    const section = (units: number) => {
      const outline = scoopOutline(
        { ...DEFAULT_BIN, height_units: units },
        layoutOf({ ...DEFAULT_BIN, height_units: units }),
      );
      return outline?.slice(2, -2);
    };
    // the arc points are the same for 4 and 12 units
    expect(section(12)).toEqual(section(4));
  });

  it("works without a lip and with other walls, floors and sizes", () => {
    const cases: Partial<BinParams>[] = [
      { lip_style: "flat_lower" },
      { lip_style: "flat_same_height" },
      { wall_thickness: 2.5 },
      { bottom_thickness: 2 },
      { units_x: 3, units_y: 2, height_units: 6 },
      { corner_magnets: true, center_magnet: true },
      { foot_hollow: "open" },
      { lip_color_enabled: true },
    ];
    for (const o of cases) {
      const m = measure({ ...o, scoop: true });
      expect(m.closed, JSON.stringify(o)).toBe(true);
      expect(m.size.z).toBeCloseTo(measure(o).size.z, 6);
    }
  });

  it("needs nothing under it: no face of the scoop points down", () => {
    const check = (o: Partial<BinParams>) => {
      const p = { ...DEFAULT_BIN, ...o, scoop: true };
      const layout = layoutOf(p);
      const tip =
        p.lip_style === "with_lip" ? CONSTANTS.lipDepth.value - p.wall_thickness : 0;
      const scope = new Scope();
      try {
        const { body } = buildBin(kernel, scope, p);
        const { vertProperties: v, triVerts, numProp } = body.getMesh();
        let seen = 0;
        for (let i = 0; i < triVerts.length; i += 3) {
          const at = (k: number) =>
            [0, 1, 2].map((d) => v[(triVerts[i + k] ?? 0) * numProp + d] ?? 0);
          const [a, b, c] = [at(0), at(1), at(2)] as [number[], number[], number[]];
          const nz =
            (b[0]! - a[0]!) * (c[1]! - a[1]!) - (b[1]! - a[1]!) * (c[0]! - a[0]!);
          const area = Math.abs(nz) / 2;
          const cx = (a[0]! + b[0]! + c[0]!) / 3 + layout.width / 2;
          const cy = (a[1]! + b[1]! + c[1]!) / 3 + layout.depth / 2;
          const cz = (a[2]! + b[2]! + c[2]!) / 3;
          const inScoop =
            // mid-width, away from the rounded corners of the cavity and their chamfer
            cx > p.wall_thickness + 6 &&
            cx < layout.width - p.wall_thickness - 6 &&
            cy > p.wall_thickness + tip + 0.05 &&
            cy < p.wall_thickness + L - 0.01 &&
            cz > layout.floor + 0.005 &&
            cz < layout.bodyHeight - 0.005;
          if (!inScoop || area < 1e-9) continue;
          seen++;
          expect(
            nz,
            `${JSON.stringify(o)} at ${cy.toFixed(2)}, ${cz.toFixed(2)}`,
          ).toBeGreaterThan(-1e-6);
        }
        expect(seen, JSON.stringify(o)).toBeGreaterThan(20);
      } finally {
        scope.dispose();
      }
    };
    for (const o of [
      {},
      { height_units: 2 },
      { height_units: 2 },
      { height_units: 6 },
      { lip_style: "flat_lower" as const },
    ]) {
      check(o);
    }
  });

  it("does not stand out of the rounded outer corners of the bin", () => {
    const corner = CONSTANTS.binCornerRadius.value;
    for (const o of [
      {},
      { height_units: 1, lip_style: "flat_lower" as const },
      { units_x: 2, units_y: 2 },
      { wall_thickness: 2.5 },
    ]) {
      const p = { ...DEFAULT_BIN, ...o, scoop: true };
      const layout = layoutOf(p);
      const outside = measure({ ...o, scoop: true }).verts.filter(([x, y]) => {
        // distance of the point beyond the rounded outline, in the corner zone only
        const dx = layout.width / 2 - Math.abs(x) - corner;
        const dy = layout.depth / 2 - Math.abs(y) - corner;
        return dx < 0 && dy < 0 && Math.hypot(dx, dy) > corner + 1e-3;
      });
      expect(outside, JSON.stringify(o)).toEqual([]);
    }
  });

  it("has rounded front corners where it meets the side walls, like the cavity", () => {
    // at the floor the cavity corner has the radius of the wall's inner corner (2.55 mm)
    const p = { ...DEFAULT_BIN, scoop: true };
    const layout = layoutOf(p);
    const r = CONSTANTS.binCornerRadius.value - p.wall_thickness;
    const m = measure({ scoop: true });
    const front = m.verts.filter(
      ([x, y, z]) =>
        Math.abs(z - layout.floor - 3) < 1 &&
        y + layout.depth / 2 < p.wall_thickness + 1 &&
        x + layout.width / 2 < p.wall_thickness + r + 1,
    );
    // no vertex sits in the square corner outside the rounded one
    for (const [x, y] of front) {
      const dx = x + layout.width / 2 - p.wall_thickness - r;
      const dy = y + layout.depth / 2 - p.wall_thickness - r;
      if (dx < 0 && dy < 0) expect(Math.hypot(dx, dy)).toBeLessThanOrEqual(r + 1e-6);
    }
  });

  it("is refused when the floor is as high as the top of the body", () => {
    expect(
      validateBin({
        ...DEFAULT_BIN,
        height_units: 1,
        bottom_thickness: 5,
        scoop: true,
      }),
    ).toEqual([expect.stringContaining("scoop needs a floor lower")]);
    expect(
      validateBin({ ...DEFAULT_BIN, height_units: 1, bottom_thickness: 5 }),
    ).toEqual([]);
    expect(validateBin({ ...DEFAULT_BIN, scoop: true })).toEqual([]);
    // a 1 unit bin with a stacking lip has no room: the step and the chamfer take 3 mm of 7
    expect(validateBin({ ...DEFAULT_BIN, height_units: 1, scoop: true })).toEqual([
      expect.stringContaining("scoop needs a floor lower"),
    ]);
    expect(
      validateBin({
        ...DEFAULT_BIN,
        height_units: 1,
        lip_style: "flat_lower",
        scoop: true,
      }),
    ).toEqual([]);
  });
});

describe("stacking lip profile (reference drawing of the lip by Stu142)", () => {
  // inset of the cavity wall from the outer wall at a height, read from the vertices
  const insets = (o: Partial<BinParams>, z: number) =>
    at(measure(o), z).map(([x]) => Number((20.75 - Math.abs(x)).toFixed(3)));
  const top = 21; // 1x1x3: the lip starts at the top of the body
  const step = CONSTANTS.lipStepHeight.value;

  it("wall, 45 degree chamfer to depth 2.6, a vertical step of 1.6, then 0.7 / 1.8 / 1.9", () => {
    expect(insets({}, top - step - 1.4)).toContain(1.2); // the chamfer starts at the wall (1.2)
    expect(insets({}, top - step)).toContain(2.6); // 1.4 higher: depth 2.6
    expect(insets({}, top)).toContain(2.6); // the step stands upright up to the top of the body
    expect(insets({}, top + 0.7)).toContain(1.9); // 0.7 at 45 degrees
    expect(insets({}, top + 2.5)).toContain(1.9); // 1.8 vertical
    expect(insets({}, top + 4.4)).toContain(0); // 1.9 at 45 degrees to the knife edge
  });

  it("keeps the height: 7 per unit plus 4.4", () => {
    expect(measure({}).size.z).toBeCloseTo(25.4, 4);
  });

  it("a thicker wall shortens the chamfer, the step stays", () => {
    // wall 2.0: the chamfer is 0.6 high and starts 1.6 + 0.6 below the top
    expect(insets({ wall_thickness: 2 }, top - step - 0.6)).toContain(2);
    expect(insets({ wall_thickness: 2 }, top - step)).toContain(2.6);
  });

  it("a low bin with a high floor starts the cavity on the profile at the floor", () => {
    // 2 units: top 14, the chamfer starts at 11.0, the default floor is at 5.55: unchanged
    expect(measure({ height_units: 2 }).closed).toBe(true);
    // a floor inside the chamfer (2 units, floor 12): the cavity starts on the chamfer
    const m = measure({ height_units: 2, bottom_thickness: 7.25 });
    expect(m.closed).toBe(true);
    const floor = floorZOf({ ...DEFAULT_BIN, height_units: 2, bottom_thickness: 7.25 });
    expect(floor).toBeCloseTo(12, 4);
    // at the floor the wall is already 1.0 mm in on the chamfer (11.0 + 1.0 = 12.0)
    expect(insets({ height_units: 2, bottom_thickness: 7.25 }, floor)).toContain(2.2);
  });
});
