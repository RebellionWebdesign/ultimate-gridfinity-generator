import { beforeAll, describe, expect, it } from "vitest";
import { CONNECTOR_VARIANTS, EDGE_SLOT, variantOf } from "../gridfinity/connector";
import { DEFAULT_BASEPLATE, validateBaseplate } from "../model/baseplateParams";
import { buildBaseplate, tileRegions } from "./baseplate";
import { buildConnector } from "./connector";
import { initKernel, Scope, type Kernel } from "./kernel";
import { isClosed, sizeOf } from "./mesh";

let kernel: Kernel;
beforeAll(async () => {
  kernel = await initKernel();
});

/** Area of a polygon (shoelace), counter-clockwise positive. */
const area = (pts: [number, number][]): number =>
  Math.abs(
    pts.reduce((sum, [x, y], i) => {
      const [nx, ny] = pts[(i + 1) % pts.length] ?? [0, 0];
      return sum + (x * ny - nx * y) / 2;
    }, 0),
  );

describe("connector variant 1 (owner's drawing and STEP file, 11 November 2026)", () => {
  it("the slot has the dimensions of the drawing", () => {
    const s = EDGE_SLOT.slot;
    // 1.3 wide bar, 2.0 high; 0.5 above the notch; 0.4 notch high; 0.5 long diagonal
    expect(s[6]?.[0]).toBeCloseTo(1.3, 9);
    expect(s[6]?.[1]).toBeCloseTo(2.0, 9);
    expect((s[6]?.[1] ?? 0) - (s[5]?.[1] ?? 0)).toBeCloseTo(0.5, 9);
    expect((s[4]?.[1] ?? 0) - (s[3]?.[1] ?? 0)).toBeCloseTo(0.4, 9);
    expect(
      Math.hypot(
        (s[5]?.[0] ?? 0) - (s[4]?.[0] ?? 0),
        (s[5]?.[1] ?? 0) - (s[4]?.[1] ?? 0),
      ),
    ).toBeCloseTo(0.5, 9);
    // the flange: 2.85 deep, 0.7 high, a 45 degree end
    expect(s[1]).toEqual([2.85, 0]);
    expect(s[2]).toEqual([2.15, 0.7]);
    expect(2.85 - 2.15).toBeCloseTo(0.7, 9);
    expect(EDGE_SLOT.slotLength).toBe(20);
  });

  it("the connector has the dimensions of the drawing", () => {
    const c = EDGE_SLOT.connector;
    const xs = c.map(([x]) => x);
    const zs = c.map(([, z]) => z);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(4.3, 9);
    expect(c[1]?.[1]).toBeCloseTo(1.65, 9); // wall
    expect(Math.max(...zs)).toBeCloseTo(3.5879, 4);
    // the roof is 45 degrees: from (2.15, 1.65) to (0.2121, 3.5879)
    expect(2.15 - 0.2121).toBeCloseTo(3.5879 - 1.65, 4);
    // the channel: 2.1 at the opening 0.25 high, 2.9 wide, 0.57 high between, 0.67 long diagonal
    expect((c[3]?.[0] ?? 0) * -2).toBeCloseTo(2.1, 9);
    expect(c[4]?.[1]).toBeCloseTo(0.25, 9);
    expect((c[6]?.[0] ?? 0) * -2).toBeCloseTo(2.9, 9);
    expect((c[6]?.[1] ?? 0) - (c[5]?.[1] ?? 0)).toBeCloseTo(0.567, 3);
    expect(
      Math.hypot(
        (c[5]?.[0] ?? 0) - (c[4]?.[0] ?? 0),
        (c[5]?.[1] ?? 0) - (c[4]?.[1] ?? 0),
      ),
    ).toBeCloseTo(0.667, 2);
    expect(EDGE_SLOT.connectorLength).toBe(19.6);
  });

  it("is the first variant of the menu", () => {
    expect(CONNECTOR_VARIANTS.map((v) => v.id)).toEqual(["edge_slot"]);
    expect(variantOf("edge_slot")).toBe(EDGE_SLOT);
    expect(variantOf("none")).toBeUndefined();
  });

  it("the connector solid is closed, 4.3 wide, 19.6 long and 3.5879 high, flat side down", () => {
    const scope = new Scope();
    try {
      const solid = buildConnector(kernel, scope, EDGE_SLOT);
      expect(isClosed(solid)).toBe(true);
      const size = sizeOf(solid);
      expect(size.x).toBeCloseTo(4.3, 4);
      expect(size.y).toBeCloseTo(19.6, 4);
      expect(size.z).toBeCloseTo(3.5879, 3);
      expect(solid.boundingBox().min[2]).toBeCloseTo(0, 6);
      expect(solid.volume()).toBeCloseTo(area(EDGE_SLOT.connector) * 19.6, 2);
    } finally {
      scope.dispose();
    }
  });
});

describe("baseplate with slots for connectors", () => {
  const measure = (
    overrides = {},
    region?: { x0: number; y0: number; x1: number; y1: number },
  ) => {
    const scope = new Scope();
    try {
      const body = buildBaseplate(
        kernel,
        scope,
        { ...DEFAULT_BASEPLATE, ...overrides },
        region,
      );
      return { volume: body.volume(), closed: isClosed(body), size: sizeOf(body) };
    } finally {
      scope.dispose();
    }
  };
  const BASE = DEFAULT_BASEPLATE.baseplate_base;
  const H = 4.65;
  /** The frame of a plate at its edge (u inward from the edge, z up) on a floor of `level`. */
  const frameOf = (scope: Scope, level: number) =>
    scope.add(
      new kernel.CrossSection([
        [
          [0, level],
          [2.85, level],
          [2.15, level + 0.7],
          [2.15, level + 2.5],
          [0, level + H],
        ],
      ]),
    );
  /** What stays of the frame at a cut: the mushroom, and what lies beyond the cut. */
  const platesOf = (scope: Scope, level: number) => {
    const mushroom = scope.add(
      new kernel.CrossSection([
        EDGE_SLOT.slot.map(([u, z]): [number, number] => [u, level + z]),
      ]),
    );
    const flange = 0.7;
    const gone = scope.add(
      kernel.CrossSection.difference(
        scope.add(
          new kernel.CrossSection([
            [
              [0, level + flange],
              [2.3, level + flange],
              [2.3, level + H],
              [0, level + H],
            ],
          ]),
        ),
        mushroom,
      ),
    );
    return {
      gone,
      kept: scope.add(kernel.CrossSection.difference(frameOf(scope, level), gone)),
    };
  };
  /** The frame material one cut takes, times its length. */
  const slotVolume = () => {
    const scope = new Scope();
    try {
      const { gone } = platesOf(scope, BASE);
      return (
        kernel.CrossSection.intersection(frameOf(scope, BASE), gone).area() *
        EDGE_SLOT.slotLength
      );
    } finally {
      scope.dispose();
    }
  };

  it("what goes is the frame above the flange and around the mushroom (owner's section: green stays, red goes)", () => {
    expect(slotVolume()).toBeGreaterThan(40);
    const scope = new Scope();
    try {
      const { kept } = platesOf(scope, 0);
      const mushroom = scope.add(new kernel.CrossSection([EDGE_SLOT.slot]));
      // what stays is the mushroom, nothing else (the frame of this model has no more under the flange)
      expect(kept.area()).toBeCloseTo(mushroom.area(), 6);
    } finally {
      scope.dispose();
    }
  });

  it("the connector hangs over two mushrooms and does not overlap them, roof up, on the flange", () => {
    const scope = new Scope();
    try {
      const { kept } = platesOf(scope, 0);
      const plates = scope.add(
        kernel.CrossSection.union(scope.add(kept.mirror([1, 0])), kept),
      );
      const pin = scope.add(
        new kernel.CrossSection([EDGE_SLOT.connector]).translate(0, 0.7),
      );
      expect(kernel.CrossSection.intersection(pin, plates).area()).toBeLessThan(0.001);
      // and it lies wholly in what was cut away: it does not stick out of the plates
      const gone = scope.add(
        kernel.CrossSection.union(
          scope.add(platesOf(scope, 0).gone.mirror([1, 0])),
          platesOf(scope, 0).gone,
        ),
      );
      expect(kernel.CrossSection.difference(pin, gone).area()).toBeLessThan(0.001);
    } finally {
      scope.dispose();
    }
  });

  it("is off by default, and the plate is as before", () => {
    expect(DEFAULT_BASEPLATE.connectable).toBe("none");
    expect(
      validateBaseplate({ ...DEFAULT_BASEPLATE, connectable: "edge_slot" }),
    ).toEqual([]);
  });

  it("a 1 x 1 plate gets a slot in each of its four edges, nothing else changes", () => {
    const plain = measure();
    const slotted = measure({ connectable: "edge_slot" });
    expect(slotted.closed).toBe(true);
    expect(slotted.size).toEqual(plain.size);
    expect(plain.volume - slotted.volume).toBeCloseTo(4 * slotVolume(), 1);
  });

  it("one slot per cell along every edge: 2 x 1 cells make 2 + 2 + 1 + 1 slots", () => {
    const plain = measure({ units_x: 2 });
    const slotted = measure({ units_x: 2, connectable: "edge_slot" });
    expect(slotted.closed).toBe(true);
    expect(plain.volume - slotted.volume).toBeCloseTo(6 * slotVolume(), 1);
  });

  it("a piece of a split plate has slots in its cut edges too", () => {
    const p = {
      ...DEFAULT_BASEPLATE,
      units_x: 3,
      units_y: 1,
      connectable: "edge_slot" as const,
    };
    const tiles = tileRegions(p, [90, 100]);
    expect(tiles.length).toBe(2);
    for (const tile of tiles) {
      const plain = measure({ units_x: 3, units_y: 1 }, tile);
      const slotted = measure(
        { units_x: 3, units_y: 1, connectable: "edge_slot" },
        tile,
      );
      expect(slotted.closed).toBe(true);
      const cells = Math.round((tile.x1 - tile.x0) / 42);
      // one slot on each of the two cut or outer sides along x, and one per cell top and bottom
      expect(plain.volume - slotted.volume).toBeCloseTo(
        (2 + 2 * cells) * slotVolume(),
        1,
      );
    }
  });

  it("works with a skeleton plate and with magnets: still closed", () => {
    for (const extra of [
      { baseplate_style: "skeleton" as const },
      { corner_magnets: true, center_magnet: true },
    ]) {
      const m = measure({ connectable: "edge_slot", units_x: 2, units_y: 2, ...extra });
      expect(m.closed).toBe(true);
    }
  });
});

describe("several connectors (owner, 11 November 2026: one per edge cell on every side)", () => {
  it("counts the edge cells of a plate on every side", async () => {
    const { edgeCells, copiesOf, DEFAULT_CONNECTOR } =
      await import("../model/connectorParams");
    expect(edgeCells(1, 1)).toBe(4);
    expect(edgeCells(2, 2)).toBe(8);
    expect(edgeCells(3, 2)).toBe(10);
    expect(copiesOf(DEFAULT_CONNECTOR, 3, 2)).toBe(10);
    expect(
      copiesOf({ ...DEFAULT_CONNECTOR, copies_auto: false, copies: 7 }, 3, 2),
    ).toBe(7);
    expect(copiesOf(DEFAULT_CONNECTOR, 24, 24)).toBe(96);
  });

  it("makes that many closed bodies, in rows that fit the bed, not touching", async () => {
    const { buildConnectors } = await import("./connector");
    const scope = new Scope();
    try {
      const one = buildConnectors(kernel, scope, EDGE_SLOT, 1, 256);
      for (const copies of [2, 8, 10]) {
        const many = buildConnectors(kernel, scope, EDGE_SLOT, copies, 256);
        expect(isClosed(many)).toBe(true);
        expect(many.volume()).toBeCloseTo(one.volume() * copies, 2);
        expect(many.decompose().length).toBe(copies);
        expect(sizeOf(many).x).toBeLessThanOrEqual(256);
      }
      // 8 connectors in a 40 mm wide area: 4.3 + 3 per column, so 5 columns do not fit, 5 do at 37
      const narrow = buildConnectors(kernel, scope, EDGE_SLOT, 8, 40);
      expect(sizeOf(narrow).x).toBeLessThanOrEqual(40);
      expect(sizeOf(narrow).y).toBeGreaterThan(40);
    } finally {
      scope.dispose();
    }
  });
});
