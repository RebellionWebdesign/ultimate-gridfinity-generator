import { beforeAll, describe, expect, it } from "vitest";
import { CONSTANTS } from "../gridfinity/constants";
import {
  BASEPLATE_LIMITS,
  DEFAULT_BASEPLATE,
  baseOf,
  validateBaseplate,
  type BaseplateParams,
} from "../model/baseplateParams";
import {
  buildBaseplate,
  layoutOf,
  pocketLayers,
  splitPoints,
  tileRegions,
} from "./baseplate";
import { footHalf } from "./foot";
import { initKernel, Scope, type Kernel } from "./kernel";
import { isClosed, sizeOf, vertices } from "./mesh";

let kernel: Kernel;
beforeAll(async () => {
  kernel = await initKernel();
});

interface Measured {
  size: { x: number; y: number; z: number };
  minZ: number;
  volume: number;
  closed: boolean;
}

const measure = (overrides: Partial<BaseplateParams>): Measured => {
  const scope = new Scope();
  try {
    const plate = buildBaseplate(kernel, scope, { ...DEFAULT_BASEPLATE, ...overrides });
    return {
      size: sizeOf(plate),
      minZ: plate.boundingBox().min[2],
      volume: plate.volume(),
      closed: isClosed(plate),
    };
  } finally {
    scope.dispose();
  }
};

// area of a regular 40-gon with radius r, times depth: what a pocket removes
const pocketVolume = (d: number, h: number) =>
  0.5 * 40 * (d / 2) ** 2 * Math.sin((2 * Math.PI) / 40) * h;

describe("C-02 baseplate 1x1", () => {
  it("is 42 x 42 x 5.05 with the default base", () => {
    const m = measure({});
    expect(m.size.x).toBeCloseTo(42, 4);
    expect(m.size.y).toBeCloseTo(42, 4);
    expect(m.size.z).toBeCloseTo(5.05, 4);
    expect(m.minZ).toBeCloseTo(0, 6);
    expect(m.closed).toBe(true);
  });

  it("is centred on x and y", () => {
    const scope = new Scope();
    try {
      const plate = buildBaseplate(kernel, scope, DEFAULT_BASEPLATE);
      const { min, max } = plate.boundingBox();
      expect(min[0] + max[0]).toBeCloseTo(0, 6);
      expect(min[1] + max[1]).toBeCloseTo(0, 6);
    } finally {
      scope.dispose();
    }
  });

  it("a thicker base adds to the height", () => {
    expect(measure({ baseplate_base: 3 }).size.z).toBeCloseTo(3 + 4.65, 4);
  });

  it("the pocket has the profile 0.7 / 1.8 / 2.15 with 0.25 offset to the foot", () => {
    const layers = pocketLayers();
    expect(layers.slice(0, 4).map((l) => l.z)).toEqual(
      [0, 0.7, 2.5, 4.65].map((z) => z),
    );
    // 36.3 at the bottom, 37.7 at the wall, 42 at the rim
    expect(layers[0]?.hx).toBeCloseTo(36.3 / 2, 10);
    expect(layers[1]?.hx).toBeCloseTo(37.7 / 2, 10);
    expect(layers[3]?.hx).toBeCloseTo(21, 10);
    // the foot's vertical section is 0.25 smaller than the pocket wall
    const wall = layers[1]?.hx ?? 0;
    expect(wall - footHalf(1.0)).toBeCloseTo(0.25, 10);
  });
});

describe("C-02 multi-cell baseplates", () => {
  it("2x1 is 84 x 42", () => {
    const m = measure({ units_x: 2 });
    expect(m.size.x).toBeCloseTo(84, 4);
    expect(m.size.y).toBeCloseTo(42, 4);
  });

  it("is closed from 1x1 up to 4x4, in both styles", () => {
    for (const style of ["solid", "skeleton"] as const) {
      for (let n = 1; n <= 4; n++) {
        const m = measure({ units_x: n, units_y: n, baseplate_style: style });
        expect(m.closed, `${n}x${n} ${style}`).toBe(true);
        expect(m.size.x).toBeCloseTo(42 * n, 4);
      }
    }
  });
});

describe("C-02 magnets", () => {
  it("corner pockets: four per cell, each as deep as the setting", () => {
    const base = 3;
    const plain = measure({ units_x: 2, units_y: 2, baseplate_base: base });
    const magnets = measure({
      units_x: 2,
      units_y: 2,
      baseplate_base: base,
      corner_magnets: true,
    });
    const expected = 4 * 4 * pocketVolume(6.1, 2.1);
    expect(plain.volume - magnets.volume).toBeCloseTo(expected, 2);
  });

  it("centre pockets: one per cell, magnet plus clearance wide", () => {
    const base = 3;
    const plain = measure({ units_x: 3, baseplate_base: base });
    const magnets = measure({ units_x: 3, baseplate_base: base, center_magnet: true });
    const expected = 3 * pocketVolume(6.1 + 0.1, 2.0);
    expect(plain.volume - magnets.volume).toBeCloseTo(expected, 2);
  });

  it("raises the base so 0.4 mm stays under the pocket", () => {
    const p = { ...DEFAULT_BASEPLATE, corner_magnets: true };
    expect(baseOf(p)).toBeCloseTo(2.1 + 0.4, 10);
    expect(layoutOf(p).top).toBeCloseTo(2.5 + 4.65, 10);
    const deep = { ...p, center_magnet: true, center_magnet_h: 5 };
    expect(baseOf(deep)).toBeCloseTo(5.4, 10);
    expect(measure(deep).size.z).toBeCloseTo(5.4 + 4.65, 4);
  });

  it("a thick base under magnets is kept", () => {
    expect(
      baseOf({ ...DEFAULT_BASEPLATE, corner_magnets: true, baseplate_base: 4 }),
    ).toBe(4);
  });
});

describe("C-02 skeleton style", () => {
  it("is lighter than the solid plate and has the same size", () => {
    const solid = measure({ units_x: 2 });
    const skeleton = measure({ units_x: 2, baseplate_style: "skeleton" });
    expect(skeleton.volume).toBeLessThan(solid.volume);
    expect(skeleton.size.x).toBeCloseTo(solid.size.x, 4);
    expect(skeleton.size.z).toBeCloseTo(solid.size.z, 4);
  });

  it("keeps pads under the corner magnets and ribs under the centre magnet", () => {
    const frame = measure({ baseplate_style: "skeleton", baseplate_base: 3 });
    const pads = measure({
      baseplate_style: "skeleton",
      baseplate_base: 3,
      corner_magnets: true,
    });
    const centre = measure({
      baseplate_style: "skeleton",
      baseplate_base: 3,
      center_magnet: true,
    });
    expect(pads.closed && centre.closed).toBe(true);
    // the pads and the hub are material the frame alone does not have
    expect(pads.volume).toBeGreaterThan(frame.volume);
    expect(centre.volume).toBeGreaterThan(frame.volume);
    // hub alone is about 515 mm³ of material; the four ribs add much more
    expect(centre.volume - frame.volume).toBeGreaterThan(900);
  });

  it("is closed with every magnet option on a 3x2 plate", () => {
    const m = measure({
      units_x: 3,
      units_y: 2,
      baseplate_style: "skeleton",
      corner_magnets: true,
      center_magnet: true,
    });
    expect(m.closed).toBe(true);
  });
});

describe("C-01 baseplate limits", () => {
  it("accepts the defaults", () => {
    expect(validateBaseplate(DEFAULT_BASEPLATE)).toEqual([]);
  });

  it("rejects every value below its minimum and above its maximum", () => {
    for (const key of Object.keys(
      BASEPLATE_LIMITS,
    ) as (keyof typeof BASEPLATE_LIMITS)[]) {
      const { min, max } = BASEPLATE_LIMITS[key];
      expect(
        validateBaseplate({ ...DEFAULT_BASEPLATE, [key]: min - 0.05 }).length,
      ).toBe(1);
      expect(
        validateBaseplate({ ...DEFAULT_BASEPLATE, [key]: max + 0.05 }).length,
      ).toBe(1);
      expect(validateBaseplate({ ...DEFAULT_BASEPLATE, [key]: min })).toEqual([]);
      expect(validateBaseplate({ ...DEFAULT_BASEPLATE, [key]: max })).toEqual([]);
    }
  });

  it("the magnet limits are the spec's pocket 6.1 x 2.1 and the 0.75 mm wall", () => {
    expect(BASEPLATE_LIMITS.corner_magnet_d.min).toBe(
      CONSTANTS.magnetPocketDiameter.value,
    );
    expect(BASEPLATE_LIMITS.corner_magnet_d.max).toBe(8.1);
    expect(BASEPLATE_LIMITS.corner_magnet_h.min).toBe(
      CONSTANTS.magnetPocketDepth.value,
    );
  });

  it("rejects a colour that is not #rrggbb", () => {
    expect(
      validateBaseplate({ ...DEFAULT_BASEPLATE, plate_color: "red" }),
    ).toHaveLength(1);
  });
});

describe("C-10 solid filler for a drawer", () => {
  const verticesAt = (overrides: Partial<BaseplateParams>, z: number) => {
    const scope = new Scope();
    try {
      const plate = buildBaseplate(kernel, scope, {
        ...DEFAULT_BASEPLATE,
        ...overrides,
      });
      return vertices(plate).filter(([, , vz]) => Math.abs(vz - z) < 1e-6);
    } finally {
      scope.dispose();
    }
  };

  it("a 3x2 plate in a 300 x 250 drawer is 300 x 250 x 5.05", () => {
    const m = measure({
      units_x: 3,
      units_y: 2,
      plate_min_x_mm: 300,
      plate_min_y_mm: 250,
    });
    expect(m.size.x).toBeCloseTo(300, 4);
    expect(m.size.y).toBeCloseTo(250, 4);
    expect(m.size.z).toBeCloseTo(5.05, 4);
    expect(m.closed).toBe(true);
  });

  it("the extra area is solid: the volume grows by the area times the height", () => {
    const plain = measure({ units_x: 3, units_y: 2 });
    const drawer = measure({
      units_x: 3,
      units_y: 2,
      plate_min_x_mm: 300,
      plate_min_y_mm: 250,
    });
    const extra = 300 * 250 - 126 * 84;
    expect(drawer.volume - plain.volume).toBeCloseTo(extra * 5.05, 1);
  });

  it("a drawer smaller than the cells changes nothing", () => {
    const plain = measure({ units_x: 3, units_y: 2 });
    const small = measure({
      units_x: 3,
      units_y: 2,
      plate_min_x_mm: 100,
      plate_min_y_mm: 50,
    });
    expect(small.volume).toBeCloseTo(plain.volume, 6);
    expect(small.size.x).toBeCloseTo(126, 4);
  });

  it("the factor says where the cells sit: -1 right, 0 centred, 1 left", () => {
    // the lowest vertex of the pocket floor is the cell's left edge at the floor, 18.15 left
    // of its centre; the plate is centred, so its left edge is at -150
    const floor = 0.4;
    const left = (fit_x: number) =>
      Math.min(...verticesAt({ plate_min_x_mm: 300, fit_x }, floor).map(([x]) => x));
    expect(left(1)).toBeCloseTo(-150 + 21 - 18.15, 4);
    expect(left(0)).toBeCloseTo(-18.15, 4);
    expect(left(-1)).toBeCloseTo(150 - 21 - 18.15, 4);
  });

  it("works along the depth as well", () => {
    const floor = 0.4;
    const front = Math.min(
      ...verticesAt({ plate_min_y_mm: 200, fit_y: 1 }, floor).map(([, y]) => y),
    );
    expect(front).toBeCloseTo(-100 + 21 - 18.15, 4);
  });

  it("is closed in the skeleton style, with magnets and an off-centre fit", () => {
    const m = measure({
      units_x: 2,
      units_y: 2,
      baseplate_style: "skeleton",
      corner_magnets: true,
      center_magnet: true,
      plate_min_x_mm: 200,
      plate_min_y_mm: 150,
      fit_x: -0.5,
      fit_y: 0.3,
    });
    expect(m.closed).toBe(true);
    expect(m.size.x).toBeCloseTo(200, 4);
  });
});

describe("C-12 splitting a plate to fit the bed", () => {
  it("cuts at cell boundaries and no piece is longer than the maximum", () => {
    // 6 cells = 252 mm on a 130 mm bed: three cells (126 mm) per piece
    expect(splitPoints(252, 0, 6, 130)).toEqual([0, 126, 252]);
    // 10 cells = 420 mm on a 256 mm bed: six and four cells
    expect(splitPoints(420, 0, 10, 256)).toEqual([0, 252, 420]);
  });

  it("is one piece when it fits", () => {
    expect(splitPoints(126, 0, 3, 256)).toEqual([0, 126]);
  });

  it("cuts inside the filler where it is longer than the bed", () => {
    // 2 cells in the middle of a 600 mm drawer, 258 mm of filler on each side
    const cuts = splitPoints(600, 258, 2, 256);
    expect(cuts[0]).toBe(0);
    expect(cuts[cuts.length - 1]).toBe(600);
    for (let i = 1; i < cuts.length; i++) {
      expect((cuts[i] as number) - (cuts[i - 1] as number)).toBeLessThanOrEqual(
        256 + 1e-9,
      );
    }
  });

  it("the number of pieces is about the drawer area over the bed area", () => {
    const p = { ...DEFAULT_BASEPLATE, units_x: 12, units_y: 8 };
    // 504 x 336 mm on a 256 x 256 bed: two across and two deep
    expect(tileRegions(p, [256, 256])).toHaveLength(4);
    // a bed that holds the whole plate: one piece
    expect(tileRegions(p, [600, 600])).toHaveLength(1);
  });

  it("the pieces together are the plate: same volume, every piece closed and within the bed", () => {
    const p: BaseplateParams = {
      ...DEFAULT_BASEPLATE,
      units_x: 5,
      units_y: 3,
      corner_magnets: true,
      plate_min_x_mm: 230,
      plate_min_y_mm: 140,
      fit_x: -0.4,
    };
    const scope = new Scope();
    try {
      const whole = buildBaseplate(kernel, scope, p);
      const regions = tileRegions(p, [100, 100]);
      expect(regions.length).toBeGreaterThan(4);
      let sum = 0;
      for (const region of regions) {
        const tile = buildBaseplate(kernel, scope, p, region);
        const size = sizeOf(tile);
        expect(isClosed(tile)).toBe(true);
        expect(size.x).toBeLessThanOrEqual(100 + 1e-6);
        expect(size.y).toBeLessThanOrEqual(100 + 1e-6);
        sum += tile.volume();
      }
      expect(sum).toBeCloseTo(whole.volume(), 1);
    } finally {
      scope.dispose();
    }
  });

  it("a piece keeps its place in the plate, so the pieces fit together", () => {
    const p: BaseplateParams = { ...DEFAULT_BASEPLATE, units_x: 4 };
    const scope = new Scope();
    try {
      const regions = tileRegions(p, [100, 100]);
      const first = buildBaseplate(kernel, scope, p, regions[0]);
      const { min } = first.boundingBox();
      // the plate is 168 wide and centred: its left edge is at -84
      expect(min[0]).toBeCloseTo(-84, 4);
    } finally {
      scope.dispose();
    }
  });
});
