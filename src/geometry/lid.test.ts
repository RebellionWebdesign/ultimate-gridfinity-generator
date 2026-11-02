import { beforeAll, describe, expect, it } from "vitest";
import { DEFAULT_LID, type LidParams } from "../model/lidParams";
import { initKernel, Scope, type Kernel } from "./kernel";
import { HOLLOW_FLOOR, buildLid, lidMagnetPoints, pocketDepth } from "./lid";
import { isClosed, sizeOf } from "./mesh";

let kernel: Kernel;
beforeAll(async () => {
  kernel = await initKernel();
});

interface Measured {
  size: { x: number; y: number; z: number };
  minZ: number;
  volume: number;
  closed: boolean;
  genus: number;
}

const measure = (overrides: Partial<LidParams>): Measured => {
  const scope = new Scope();
  try {
    const { plate } = buildLid(kernel, scope, { ...DEFAULT_LID, ...overrides });
    return {
      size: sizeOf(plate),
      minZ: plate.boundingBox().min[2],
      volume: plate.volume(),
      closed: isClosed(plate),
      genus: plate.genus(),
    };
  } finally {
    scope.dispose();
  }
};

const pocketCrossSection = (d: number) =>
  0.5 * 40 * (d / 2) ** 2 * Math.sin((2 * Math.PI) / 40);

// area of a regular 40-gon with radius r, times depth: what a pocket removes
const pocketVolume = (d: number, h: number) =>
  0.5 * 40 * (d / 2) ** 2 * Math.sin((2 * Math.PI) / 40) * h;

describe("B-04 lid 1x1", () => {
  it("bounding box is 41.5 x 41.5 x 7.0", () => {
    const m = measure({});
    expect(m.size.x).toBeCloseTo(41.5, 4);
    expect(m.size.y).toBeCloseTo(41.5, 4);
    expect(m.size.z).toBeCloseTo(7.0, 4);
    expect(m.minZ).toBeCloseTo(0, 6);
    expect(m.closed).toBe(true);
  });

  it("automatic plate thickness gives a multiple of 7 (1u = 2.25)", () => {
    for (const units of [1, 2, 3, 6]) {
      const m = measure({ plate_thickness_mode: "auto", height_units_auto: units });
      expect(m.size.z).toBeCloseTo(7 * units, 4);
    }
  });

  it("manual plate thickness is added to the 4.75 foot", () => {
    const m = measure({ plate_thickness_mode: "manual", plate_thickness: 3 });
    expect(m.size.z).toBeCloseTo(7.75, 4);
  });

  it("printing upside down keeps the size and puts the top on z = 0", () => {
    const m = measure({ print_orientation: "upside_down" });
    expect(m.size.z).toBeCloseTo(7.0, 4);
    expect(m.minZ).toBeCloseTo(0, 6);
    expect(m.volume).toBeCloseTo(measure({}).volume, 3);
  });

  it("is centred on x/y", () => {
    const scope = new Scope();
    const { plate } = buildLid(kernel, scope, DEFAULT_LID);
    const { min, max } = plate.boundingBox();
    expect(min[0] + max[0]).toBeCloseTo(0, 4);
    expect(min[1] + max[1]).toBeCloseTo(0, 4);
    scope.dispose();
  });
});

describe("B-05 multi-cell lids", () => {
  it("2x1 is 83.5 x 41.5", () => {
    const m = measure({ units_x: 2 });
    expect(m.size.x).toBeCloseTo(83.5, 4);
    expect(m.size.y).toBeCloseTo(41.5, 4);
  });

  it("merged foot has no cross: its volume is the continuous foot", () => {
    // per-cell feet leave a 0.5 mm gap between cells, so they hold less material
    const merged = measure({ units_x: 2, foot_layout: "merged" });
    const perCell = measure({ units_x: 2, foot_layout: "per_cell" });
    expect(merged.volume).toBeGreaterThan(perCell.volume);
  });

  it("is a closed mesh from 1x1 to 4x4, merged and per cell", () => {
    for (const layout of ["merged", "per_cell"] as const) {
      for (let n = 1; n <= 4; n++) {
        for (let m = 1; m <= 4; m++) {
          const r = measure({ units_x: n, units_y: m, foot_layout: layout });
          expect(r.closed, `${n}x${m} ${layout}`).toBe(true);
          expect(r.size.x).toBeCloseTo(n * 42 - 0.5, 3);
          expect(r.size.y).toBeCloseTo(m * 42 - 0.5, 3);
        }
      }
    }
  });
});

describe("B-06 stackable, hollow foot, top-side corner magnets", () => {
  it("stackable 1x1 with the 2.25 plate is 11.4 high", () => {
    const m = measure({ variant: "stackable" });
    expect(m.size.z).toBeCloseTo(11.4, 4);
    expect(m.closed).toBe(true);
  });

  it("corners_only lip holds less material than the full lip", () => {
    const full = measure({ variant: "stackable", lip_mode: "full" });
    const corners = measure({ variant: "stackable", lip_mode: "corners_only" });
    expect(corners.volume).toBeLessThan(full.volume);
    expect(corners.size.z).toBeCloseTo(11.4, 4);
    expect(corners.closed).toBe(true);
  });

  it("a separate lip colour makes the lip its own closed body", () => {
    const scope = new Scope();
    const parts = buildLid(kernel, scope, {
      ...DEFAULT_LID,
      variant: "stackable",
      lip_color_enabled: true,
    });
    expect(parts.lip).toBeDefined();
    expect(isClosed(parts.lip!)).toBe(true);
    expect(sizeOf(parts.plate).z).toBeCloseTo(7, 4);
    scope.dispose();
  });

  it("1x1 has pockets in all four corners (volume = 4 pockets)", () => {
    const base = measure({});
    const mag = measure({ corner_magnets: true });
    expect(base.volume - mag.volume).toBeCloseTo(4 * pocketVolume(6.1, 2.1), 1);
    expect(mag.closed).toBe(true);
  });

  it("4x4 has pockets only in the four outermost corners", () => {
    const params = { ...DEFAULT_LID, units_x: 4, units_y: 4 };
    expect(lidMagnetPoints(params)).toHaveLength(4);
    const base = measure({ units_x: 4, units_y: 4 });
    const mag = measure({ units_x: 4, units_y: 4, corner_magnets: true });
    expect(base.volume - mag.volume).toBeCloseTo(4 * pocketVolume(6.1, 2.1), 1);
  });

  it("3x2 per cell: still only four pockets", () => {
    const o = { units_x: 3, units_y: 2, foot_layout: "per_cell" } as const;
    const base = measure(o);
    const mag = measure({ ...o, corner_magnets: true });
    expect(base.volume - mag.volume).toBeCloseTo(4 * pocketVolume(6.1, 2.1), 1);
  });

  it("pockets are on the top side: corner positions sit 7.75 from the edge", () => {
    const pts = lidMagnetPoints(DEFAULT_LID);
    expect(pts.map((p) => p[0]).sort((a, b) => a - b)).toEqual([
      7.75, 7.75, 33.75, 33.75,
    ]);
  });

  it("a larger pocket (8.1 x 3.9) still removes exactly its own volume", () => {
    const base = measure({});
    const mag = measure({
      corner_magnets: true,
      corner_magnet_d: 8.1,
      corner_magnet_h: 3.9,
    });
    expect(base.volume - mag.volume).toBeCloseTo(4 * pocketVolume(8.1, 3.9), 1);
  });

  it("pocket depth never leaves less than 0.8 mm below the floor", () => {
    const p = { ...DEFAULT_LID, corner_magnet_h: 3.9 };
    expect(4.75 + 2.25 - pocketDepth(p)).toBeGreaterThanOrEqual(0.8);
  });

  const columnVolume = (overrides: Partial<LidParams>): number => {
    // solid material in a cylinder directly under each pocket floor, from z = 0
    const scope = new Scope();
    try {
      const p = { ...DEFAULT_LID, corner_magnets: true, ...overrides };
      const { plate } = buildLid(kernel, scope, p);
      const floor = 4.75 + 2.25 - pocketDepth(p);
      let total = 0;
      for (const [x, y] of lidMagnetPoints(p)) {
        const cyl = scope.add(
          kernel.Manifold.cylinder(
            floor,
            p.corner_magnet_d / 2,
            p.corner_magnet_d / 2,
            40,
          ).translate(x - 20.75, y - 20.75, 0),
        );
        const inside = scope.add(kernel.Manifold.intersection(plate, cyl));
        total += inside.volume();
      }
      return total / pocketVolume(p.corner_magnet_d, floor) / 4;
    } finally {
      scope.dispose();
    }
  };

  it("solid foot: full material under the pocket floor", () => {
    expect(columnVolume({})).toBeCloseTo(1, 3);
  });

  it("hollow foot: the cavity stops 1.45 mm below the plate, 1.6 mm of material under the pocket floor", () => {
    // owner, 2 November 2026: extra floor of 1.45 mm inside the hollow foot
    expect(HOLLOW_FLOOR).toBe(1.45);
    const scope = new Scope();
    const p = {
      ...DEFAULT_LID,
      foot_hollow: "open",
      corner_magnets: true,
    } as LidParams;
    const { plate } = buildLid(kernel, scope, p);
    const ceiling = 4.75 - HOLLOW_FLOOR;
    // above the cavity ceiling the foot is solid: no void at z = 3.4, a void at z = 3.2
    const solid = buildLid(kernel, scope, DEFAULT_LID).plate;
    const voidAt = (z: number) =>
      scope.add(solid.slice(z)).area() - scope.add(plate.slice(z)).area();
    expect(voidAt(ceiling + 0.1)).toBeLessThan(0.5 * pocketCrossSection(6.1) * 4 + 1);
    expect(voidAt(ceiling - 0.1)).toBeGreaterThan(1000);
    // between the ceiling and the pocket floor (4.9) nothing is missing under the pockets
    const floorZ = 4.75 + 2.25 - pocketDepth(p);
    expect(floorZ - ceiling).toBeCloseTo(1.6, 6);
    for (const [x, y] of lidMagnetPoints(p)) {
      const cyl = scope.add(
        kernel.Manifold.cylinder(floorZ - ceiling, 3.05, 3.05, 40).translate(
          x - 20.75,
          y - 20.75,
          ceiling,
        ),
      );
      const kept = scope.add(kernel.Manifold.intersection(plate, cyl)).volume();
      expect(kept / cyl.volume()).toBeCloseTo(1, 3);
    }
    // the pockets still remove exactly their own volume
    const noMagnets = measure({ foot_hollow: "open" });
    const withPockets = measure({ foot_hollow: "open", corner_magnets: true });
    expect(noMagnets.volume - withPockets.volume).toBeCloseTo(
      4 * pocketVolume(6.1, 2.1),
      1,
    );
    expect(withPockets.closed).toBe(true);
    scope.dispose();
  });

  it("hollow foot saves material and stays closed", () => {
    const solid = measure({ units_x: 2 });
    const hollow = measure({ units_x: 2, foot_hollow: "open" });
    expect(hollow.volume).toBeLessThan(solid.volume);
    expect(hollow.closed).toBe(true);
    expect(hollow.size.z).toBeCloseTo(7, 4);
  });

  it("hollow foot: the cavity is one straight cut, the same at every height", () => {
    // owner, 2 November 2026: no profile steps and no lip inside the open foot
    const scope = new Scope();
    const solid = buildLid(kernel, scope, DEFAULT_LID).plate;
    const hollow = buildLid(kernel, scope, {
      ...DEFAULT_LID,
      foot_hollow: "open",
    }).plate;
    // inner square: bottom edge half 17.8 minus the 1.2 wall, corner radius 0.3
    const expected = 33.2 * 33.2 - (4 - Math.PI) * 0.3 * 0.3;
    for (const z of [0.2, 0.5, 1.5, 2.5, 3.2]) {
      const void_ =
        scope.add(solid.slice(z)).area() - scope.add(hollow.slice(z)).area();
      expect(void_, `z = ${z}`).toBeCloseTo(expected, 0);
    }
    scope.dispose();
  });

  it("hollow foot with magnets is closed for 1x1 to 4x4, merged and per cell", () => {
    for (const layout of ["merged", "per_cell"] as const) {
      for (let n = 1; n <= 4; n++) {
        const r = measure({
          units_x: n,
          units_y: n,
          foot_layout: layout,
          foot_hollow: "open",
          corner_magnets: true,
          variant: "stackable",
        });
        expect(r.closed, `${n}x${n} ${layout}`).toBe(true);
      }
    }
  });
});
