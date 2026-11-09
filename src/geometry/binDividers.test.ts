import { beforeAll, describe, expect, it } from "vitest";
import {
  DEFAULT_BIN,
  DIVIDER_LIMITS,
  collidingDividers,
  dividerHeightMax,
  dividerProblems,
  dividerSpan,
  evenDividers,
  newBin,
  validateBin,
  withoutCollisions,
  type BinParams,
  type Divider,
} from "../model/binParams";
import { sanitizeBin } from "../model/modelFile";
import { buildBin, layoutOf } from "./bin";
import { initKernel, Scope, type Kernel } from "./kernel";
import { isClosed, sizeOf } from "./mesh";

let kernel: Kernel;
beforeAll(async () => {
  kernel = await initKernel();
});

const bin = (overrides: Partial<BinParams>): BinParams => ({
  ...newBin(),
  ...overrides,
});
const divider = (over: Partial<Divider> = {}): Divider => ({
  position: 20,
  height: 10,
  ...over,
});

const measure = (p: BinParams) => {
  const scope = new Scope();
  try {
    const { body } = buildBin(kernel, scope, p);
    return { size: sizeOf(body), volume: body.volume(), closed: isClosed(body) };
  } finally {
    scope.dispose();
  }
};

/** Number of separate openings (compartments) in the section at height z above the cavity floor. */
const compartments = (p: BinParams, above: number): number => {
  const scope = new Scope();
  try {
    const { body } = buildBin(kernel, scope, p);
    const section = scope.add(body.slice(layoutOf(p).floor + above));
    // a hole has the opposite winding of the outer contour
    return section.toPolygons().filter(
      (poly) =>
        poly.reduce((sum, [x, y], i) => {
          const [nx, ny] = poly[(i + 1) % poly.length] ?? [0, 0];
          return sum + (x * ny - nx * y);
        }, 0) < 0,
    ).length;
  } finally {
    scope.dispose();
  }
};

describe("E-07 dividers (owner, 9 November 2026)", () => {
  const base = bin({ units_x: 2, units_y: 2, height_units: 4 });

  it("a bin has none by default and the default list is not shared", () => {
    expect(DEFAULT_BIN.dividers).toEqual([]);
    expect(DEFAULT_BIN.divider_thickness).toBe(0.8);
    newBin().dividers.push(divider());
    expect(newBin().dividers).toEqual([]);
    expect(DEFAULT_BIN.dividers).toEqual([]);
  });

  it("thickness runs from 0.8 to 1.6 mm in steps of 0.2", () => {
    expect(DIVIDER_LIMITS.thickness).toMatchObject({ min: 0.8, max: 1.6, step: 0.2 });
    expect(validateBin({ ...base, divider_thickness: 1.8 })).not.toEqual([]);
    expect(validateBin({ ...base, divider_thickness: 0.6 })).not.toEqual([]);
    for (const t of [0.8, 1, 1.2, 1.4, 1.6]) {
      expect(validateBin({ ...base, divider_thickness: t })).toEqual([]);
    }
  });

  it("one divider keeps the mesh closed and the size, and adds its volume", () => {
    const plain = measure(base);
    for (const t of [0.8, 1.6]) {
      const p = { ...base, divider_thickness: t, dividers: [divider({ height: 12 })] };
      const m = measure(p);
      expect(m.closed).toBe(true);
      expect(m.size).toEqual(plain.size);
      const width = layoutOf(p).width - 2 * p.wall_thickness;
      expect(m.volume - plain.volume).toBeGreaterThan(t * (width - 0.6) * 12 * 0.97);
      expect(m.volume - plain.volume).toBeLessThan(t * width * 12 * 1.02);
    }
  });

  it("is as thick as set: a section shows two openings with the divider between", () => {
    const p = {
      ...base,
      divider_thickness: 1.6,
      dividers: [divider({ position: 20 })],
    };
    expect(compartments(p, 5)).toBe(2);
  });

  it("splits the cavity up to its height and not above it", () => {
    const p = { ...base, dividers: [divider({ height: 10 })] };
    expect(compartments(p, 9.9)).toBe(2);
    expect(compartments(p, 10.1)).toBe(1);
  });

  it("three dividers make four compartments", () => {
    const p = {
      ...base,
      dividers: [10, 25, 40].map((position) => divider({ position })),
    };
    expect(validateBin(p)).toEqual([]);
    expect(compartments(p, 5)).toBe(4);
    expect(measure(p).closed).toBe(true);
  });

  it("goes to the lower edge of the step like the scoop, with a stacking lip and without", () => {
    for (const lip_style of ["with_lip", "flat_lower"] as const) {
      const p = bin({ units_x: 2, units_y: 2, height_units: 4, lip_style });
      const high = dividerHeightMax(p);
      p.dividers.push(divider({ height: high }));
      expect(validateBin(p)).toEqual([]);
      expect(measure(p).closed).toBe(true);
      expect(compartments(p, high - 0.05)).toBe(2);
    }
    const tooHigh = bin({
      height_units: 4,
      dividers: [divider({ height: dividerHeightMax(bin({ height_units: 4 })) + 0.5 })],
    });
    expect(validateBin(tooHigh).join(" ")).toMatch(/higher than the bin allows/);
  });

  it("does not poke out of the rounded outer corners in a tall bin with magnets and a scoop", () => {
    const p = bin({
      units_x: 1,
      units_y: 1,
      height_units: 6,
      corner_magnets: true,
      center_magnet: true,
      scoop: true,
      divider_thickness: 1.6,
      dividers: [divider({ position: 18, height: 20 })],
    });
    const plain = measure({ ...p, dividers: [] });
    const m = measure(p);
    expect(m.closed).toBe(true);
    expect(m.size).toEqual(plain.size);
  });
});

describe("E-07 the least gap equals the thickness (owner, 9 November 2026)", () => {
  const base = bin({ units_x: 2, units_y: 2, height_units: 4 });
  const span = dividerSpan(base);
  const colliding = (t: number, ...dividers: Divider[]) =>
    collidingDividers({ ...base, divider_thickness: t, dividers }).size;

  for (const t of [0.8, 1, 1.2, 1.4, 1.6]) {
    it(`thickness ${t}: exactly ${t} mm of room is fine, a little less collides`, () => {
      // to the wall, front and back
      expect(colliding(t, divider({ position: t + t / 2 }))).toBe(0);
      expect(colliding(t, divider({ position: t + t / 2 - 0.05 }))).toBe(1);
      expect(colliding(t, divider({ position: span - t - t / 2 }))).toBe(0);
      expect(colliding(t, divider({ position: span - t - t / 2 + 0.05 }))).toBe(1);
      // between two dividers
      const a = 20;
      expect(
        colliding(t, divider({ position: a }), divider({ position: a + 2 * t })),
      ).toBe(0);
      expect(
        colliding(t, divider({ position: a }), divider({ position: a + 2 * t - 0.05 })),
      ).toBe(1);
    });
  }

  it("a larger gap is free: any distance above the least is fine", () => {
    expect(colliding(0.8, divider({ position: 10 }), divider({ position: 30.3 }))).toBe(
      0,
    );
  });

  it("of two dividers too close, the later one collides, also in any list order", () => {
    const a = divider({ position: 30 });
    const b = divider({ position: 10 });
    const c = divider({ position: 30.5 });
    const bad = collidingDividers({ ...base, dividers: [a, b, c] });
    expect([...bad]).toEqual([c]);
  });

  it("reports a collision as a problem and the bin as invalid", () => {
    const p = { ...base, divider_thickness: 1.6, dividers: [divider({ position: 1 })] };
    expect(dividerProblems(p).join(" ")).toMatch(
      /collides with a wall or with another divider/,
    );
    expect(validateBin(p)).not.toEqual([]);
  });

  it("raising the thickness removes the dividers that no longer fit", () => {
    const p = {
      ...base,
      dividers: [
        divider({ position: 1.2 }),
        divider({ position: 10 }),
        divider({ position: 12 }),
      ],
    };
    expect(validateBin(p)).toEqual([]);
    const thicker = { ...p, divider_thickness: 1.6 };
    // 1.2 is too near the wall (needs 2.4), 12 too near 10 (needs 1.6 of gap: 3.2 apart)
    expect(withoutCollisions(thicker)).toEqual([divider({ position: 10 })]);
  });

  it("refuses too many dividers and a missing position", () => {
    const many = Array.from({ length: DIVIDER_LIMITS.count.max + 1 }, (_, i) =>
      divider({ position: 2 + i * 0.001 }),
    );
    expect(dividerProblems({ ...base, dividers: many }).join(" ")).toMatch(/At most/);
    expect(
      dividerProblems({ ...base, dividers: [divider({ position: Number.NaN })] }).join(
        " ",
      ),
    ).toMatch(/needs a position/);
  });
});

describe("E-07 custom function: even spacing", () => {
  const base = bin({ units_x: 2, units_y: 2, height_units: 4 });
  const span = dividerSpan(base);

  for (const t of [0.8, 1, 1.2, 1.4, 1.6]) {
    for (const wanted of [t, 5, 10, 17.3]) {
      it(`thickness ${t}, gap ${wanted}: no collision, equal gaps, never below the gap asked`, () => {
        const p = { ...base, divider_thickness: t };
        const { dividers, gap } = evenDividers(p, wanted);
        expect(collidingDividers({ ...p, dividers }).size).toBe(0);
        expect(gap).toBeGreaterThanOrEqual(wanted - 1e-9);
        // every gap, including the first and the last, is the same
        const edges = [
          0,
          ...dividers.flatMap((d) => [d.position - t / 2, d.position + t / 2]),
          span,
        ];
        for (let i = 0; i < edges.length; i += 2) {
          expect((edges[i + 1] ?? 0) - (edges[i] ?? 0)).toBeCloseTo(gap, 9);
        }
        // and one more divider would not fit (unless the limit of the count is reached)
        if (dividers.length < DIVIDER_LIMITS.count.max) {
          expect(
            (dividers.length + 1) * t + (dividers.length + 2) * wanted,
          ).toBeGreaterThan(span);
        }
      });
    }
  }

  it("places no divider when none fits, and the dividers get the full height", () => {
    expect(evenDividers(base, span).dividers).toEqual([]);
    const { dividers } = evenDividers(base, 10);
    expect(dividers.length).toBeGreaterThan(0);
    expect(dividers.every((d) => d.height === dividerHeightMax(base))).toBe(true);
  });

  it("a gap below the thickness is raised to the thickness", () => {
    const p = { ...base, divider_thickness: 1.6 };
    expect(evenDividers(p, 0.8).gap).toBeGreaterThanOrEqual(1.6);
  });

  it("builds a closed bin with the right number of compartments", () => {
    const p = { ...base, divider_thickness: 1.2 };
    const { dividers } = evenDividers(p, 8);
    const built = { ...p, dividers };
    expect(validateBin(built)).toEqual([]);
    expect(measure(built).closed).toBe(true);
    expect(compartments(built, 5)).toBe(dividers.length + 1);
  });
});

describe("E-07 dividers in a saved file", () => {
  it("an old file without dividers opens with none and the least thickness", () => {
    const p = sanitizeBin({ units_x: 2 });
    expect(p.dividers).toEqual([]);
    expect(p.divider_thickness).toBe(0.8);
  });

  it("keeps well-formed dividers, drops broken ones and dividers along the depth", () => {
    const p = sanitizeBin({
      divider_thickness: 1.2,
      dividers: [
        { position: 12.5, height: 9 },
        { axis: "y", position: 12.5, height: 9 },
        { position: "1", height: 1 },
        null,
        { axis: "x", position: 30, thickness: 0.5, height: 5 },
      ],
    });
    expect(p.divider_thickness).toBe(1.2);
    expect(p.dividers).toEqual([
      { position: 12.5, height: 9 },
      { position: 30, height: 5 },
    ]);
  });

  it("clamps the thickness into 0.8 to 1.6 and keeps at most the allowed number", () => {
    expect(sanitizeBin({ divider_thickness: 3 }).divider_thickness).toBe(1.6);
    expect(sanitizeBin({ divider_thickness: 0.1 }).divider_thickness).toBe(0.8);
    const many = Array.from({ length: 60 }, (_, i) => ({ position: i, height: 5 }));
    expect(sanitizeBin({ dividers: many }).dividers).toHaveLength(
      DIVIDER_LIMITS.count.max,
    );
  });
});
