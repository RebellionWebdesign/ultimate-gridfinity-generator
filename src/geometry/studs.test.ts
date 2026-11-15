import { beforeAll, describe, expect, it } from "vitest";
import {
  DEFAULT_BASEPLATE,
  validateBaseplate,
  type BaseplateParams,
} from "../model/baseplateParams";
import { DEFAULT_BIN, validateBin, type BinParams } from "../model/binParams";
import { buildBaseplate } from "./baseplate";
import { buildBin } from "./bin";
import { initKernel, Scope, type Kernel } from "./kernel";
import { isClosed, sizeOf } from "./mesh";
import { buildStud, buildStudHole } from "./studs";

let kernel: Kernel;
beforeAll(async () => {
  kernel = await initKernel();
});

const plate = (o: Partial<BaseplateParams>) => {
  const scope = new Scope();
  try {
    const m = buildBaseplate(kernel, scope, { ...DEFAULT_BASEPLATE, ...o });
    return { volume: m.volume(), closed: isClosed(m), z: sizeOf(m).z };
  } finally {
    scope.dispose();
  }
};
const bin = (o: Partial<BinParams>) => {
  const scope = new Scope();
  try {
    const { body } = buildBin(kernel, scope, { ...DEFAULT_BIN, ...o });
    return { volume: body.volume(), closed: isClosed(body) };
  } finally {
    scope.dispose();
  }
};

describe("E-11 snap studs", () => {
  it("a stud is 3 mm tall (0.1 mm of it is the overlap) and as wide as asked", () => {
    for (const d of [3, 5, 8]) {
      const scope = new Scope();
      const stud = buildStud(kernel, scope, d);
      const size = sizeOf(stud);
      expect(size.z).toBeCloseTo(3.1, 6);
      expect(size.x).toBeCloseTo(d, 1);
      expect(isClosed(stud)).toBe(true);
      scope.dispose();
    }
  });

  it("a hole is 3.2 mm deep and as wide as asked", () => {
    const scope = new Scope();
    const hole = buildStudHole(kernel, scope, 5.1);
    const box = hole.boundingBox();
    expect(box.max[2]).toBeCloseTo(3.2, 6);
    expect(sizeOf(hole).x).toBeCloseTo(5.1, 1);
    scope.dispose();
  });

  it("the baseplate gets four corner studs and one centre stud per cell", () => {
    const plain = plate({ units_x: 2, units_y: 1 });
    const corners = plate({ units_x: 2, units_y: 1, corner_studs: true, stud_d: 5 });
    const centre = plate({ units_x: 2, units_y: 1, center_studs: true, stud_d: 5 });
    expect(corners.closed && centre.closed).toBe(true);
    // volume of one stud: between a cylinder of 3 mm and one of 3.1 mm
    const one = (corners.volume - plain.volume) / 8;
    expect(one).toBeGreaterThan(Math.PI * 2.5 ** 2 * 2.5);
    expect(one).toBeLessThan(Math.PI * 2.5 ** 2 * 3.1);
    expect((centre.volume - plain.volume) / 2).toBeCloseTo(one, 1);
  });

  it("the widest stud stands free inside the pocket: nothing of it is lost in the walls", () => {
    const plain = plate({});
    const wide = plate({ corner_studs: true, stud_d: 8 });
    const scope = new Scope();
    const stud = buildStud(kernel, scope, 8);
    // the part of the stud below the pocket floor (0.1 mm) is inside the plate already
    const above = stud.volume() - 0.1 * Math.PI * 4 ** 2;
    scope.dispose();
    expect((wide.volume - plain.volume) / 4).toBeCloseTo(above, 0);
  });

  it("the bin loses material in the holes", () => {
    const plain = bin({ units_x: 2, units_y: 2 });
    const holes = bin({ units_x: 2, units_y: 2, corner_studs: true, stud_hole_d: 5.1 });
    expect(holes.closed).toBe(true);
    const lost = plain.volume - holes.volume;
    expect(lost).toBeGreaterThan(4 * Math.PI * 2.55 ** 2 * 3.0);
    expect(lost).toBeLessThan(4 * Math.PI * 2.55 ** 2 * 3.2);
  });

  it("a skeleton plate keeps a pad under a stud", () => {
    const m = plate({ baseplate_style: "skeleton", corner_studs: true, stud_d: 8 });
    expect(m.closed).toBe(true);
  });

  it("limits: stud 3 to 8, hole 3.1 to 8.1; studs and magnets do not share a place", () => {
    expect(validateBaseplate({ ...DEFAULT_BASEPLATE, stud_d: 8 })).toEqual([]);
    expect(validateBaseplate({ ...DEFAULT_BASEPLATE, stud_d: 8.1 })).not.toEqual([]);
    expect(validateBin({ ...DEFAULT_BIN, stud_hole_d: 8.1 })).toEqual([]);
    expect(validateBin({ ...DEFAULT_BIN, stud_hole_d: 3 })).not.toEqual([]);
    expect(
      validateBaseplate({
        ...DEFAULT_BASEPLATE,
        corner_studs: true,
        corner_magnets: true,
      }),
    ).toHaveLength(1);
    expect(
      validateBin({ ...DEFAULT_BIN, center_studs: true, center_magnet: true }),
    ).toHaveLength(1);
    // studs at the corners and a magnet in the centre are fine
    expect(
      validateBin({ ...DEFAULT_BIN, corner_studs: true, center_magnet: true }),
    ).toEqual([]);
  });
});

describe("skeleton pads", () => {
  it("the four corners of a cell hold the same material, whatever the stud size", () => {
    for (const d of [3, 5, 8]) {
      const scope = new Scope();
      const m = buildBaseplate(kernel, scope, {
        ...DEFAULT_BASEPLATE,
        baseplate_style: "skeleton",
        corner_studs: true,
        stud_d: d,
      });
      const quarter = (sx: number, sy: number) => {
        const box = scope.add(kernel.Manifold.cube([30, 30, 30]));
        const placed = scope.add(box.translate(sx < 0 ? -30 : 0, sy < 0 ? -30 : 0, -1));
        return kernel.Manifold.intersection(m, placed).volume();
      };
      const q = [quarter(1, 1), quarter(-1, 1), quarter(1, -1), quarter(-1, -1)];
      scope.dispose();
      for (const v of q) expect(v, `d ${d}`).toBeCloseTo(q[0]!, 2);
    }
  });
});
