import { beforeAll, describe, expect, it } from "vitest";
import {
  BIN_LIMITS,
  DEFAULT_BIN,
  floorZOf,
  maxHeightUnits,
  validateBin,
  type BinParams,
} from "../model/binParams";
import { buildBin, layoutOf } from "./bin";
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
