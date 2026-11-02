import { describe, expect, it } from "vitest";
import {
  boundsOf,
  exclusionOutline,
  hatchSegments,
  plateOutline,
  type Point2,
} from "./plate";
import { PRINTERS, customPrinter } from "./printers";

const plateOf = (name: string) => {
  const printer = PRINTERS.find((p) => p.name === name);
  if (!printer?.plate) throw new Error(`No plate for ${name}`);
  return {
    printer,
    outline: plateOutline(printer.plate, printer.bed[0], printer.bed[1]),
  };
};

const signedArea = (points: Point2[]): number =>
  points.reduce((sum, [x, y], i) => {
    const [nx, ny] = points[(i + 1) % points.length] as Point2;
    return sum + (x * ny - nx * y) / 2;
  }, 0);

describe("build plate outlines", () => {
  it("P2S: body 256 x 256, handle tab 8 mm at the back, lip 10 mm at the front", () => {
    const { min, max } = boundsOf(plateOf("Bambu Lab P2S").outline);
    expect(min[0]).toBeCloseTo(-128, 6);
    expect(max[0]).toBeCloseTo(128, 6);
    expect(min[1]).toBeCloseTo(-138, 6);
    expect(max[1]).toBeCloseTo(136, 6);
  });

  it("H2 family: 350 x 320 body, tabs 4.6 mm at the back, lips 15 mm at the front", () => {
    for (const name of ["H2D", "H2D Pro", "H2C", "H2S", "A2L"]) {
      const { min, max } = boundsOf(plateOf(`Bambu Lab ${name}`).outline);
      expect(min[0], name).toBeCloseTo(-175, 6);
      expect(max[0], name).toBeCloseTo(175, 6);
      expect(min[1], name).toBeCloseTo(-175, 6);
      expect(max[1], name).toBeCloseTo(164.6, 6);
    }
  });

  it("H2 family: the front edge is recessed between the two lips", () => {
    const { outline } = plateOf("Bambu Lab H2D");
    const low = outline.filter(([, y]) => y < -160 - 1e-6);
    expect(low.length).toBeGreaterThan(0);
    // no point below the body edge in the middle (x from -49.5 to 49.5)
    expect(low.some(([x]) => Math.abs(x) < 49)).toBe(false);
    // lips at both corners
    expect(low.some(([x]) => x < -100)).toBe(true);
    expect(low.some(([x]) => x > 100)).toBe(true);
  });

  it("A1 mini: body 180 x 180, two tabs at the back, one lip at the front", () => {
    const { min, max } = boundsOf(plateOf("Bambu Lab A1 mini").outline);
    expect(min[0]).toBeCloseTo(-90, 6);
    expect(max[0]).toBeCloseTo(90, 6);
    expect(min[1]).toBeCloseTo(-97.5, 6);
    expect(max[1]).toBeCloseTo(95.5, 6);
  });

  it("a custom bed is a square with rounded corners", () => {
    const custom = customPrinter(200, 180);
    const outline = plateOutline(custom.plate!, 200, 200);
    const { min, max } = boundsOf(outline);
    expect([min[0], min[1], max[0], max[1]]).toEqual([-100, -100, 100, 100]);
    // rounded: no point sits in the sharp corner
    expect(outline.some(([x, y]) => x === 100 && y === 100)).toBe(false);
    // area is a little less than the 200 x 200 square
    expect(signedArea(outline)).toBeLessThan(40000);
    expect(signedArea(outline)).toBeGreaterThan(40000 - (4 - Math.PI) * 36 - 1);
  });

  it("every outline runs counter-clockwise without repeated points", () => {
    for (const printer of PRINTERS) {
      if (!printer.plate) continue;
      const outline = plateOutline(printer.plate, printer.bed[0], printer.bed[1]);
      expect(signedArea(outline), printer.name).toBeGreaterThan(0);
      outline.forEach((p, i) => {
        const next = outline[(i + 1) % outline.length] as Point2;
        expect(p[0] === next[0] && p[1] === next[1], `${printer.name} ${i}`).toBe(
          false,
        );
      });
    }
  });
});

const inside = (point: Point2, polygon: Point2[]): boolean => {
  let result = false;
  polygon.forEach(([x1, y1], i) => {
    const [x2, y2] = polygon[(i + 1) % polygon.length] as Point2;
    if (y1 > point[1] !== y2 > point[1]) {
      const x = ((x2 - x1) * (point[1] - y1)) / (y2 - y1) + x1;
      if (point[0] < x) result = !result;
    }
  });
  return result;
};

describe("area a printer keeps free (P and X series)", () => {
  it("never sticks out of the rounded plate corner", () => {
    for (const name of ["P1S", "P1P", "X1", "X1C", "X1E"]) {
      const { printer, outline } = plateOf(`Bambu Lab ${name}`);
      const zone = exclusionOutline(
        printer.exclude as [number, number],
        printer.plate,
        printer.bed[0],
        printer.bed[1],
      );
      for (const [x, y] of zone) {
        // a point on the zone's edge may touch the plate edge: move it 0.01 mm inward
        const inward: Point2 = [x + 0.01, y + 0.01];
        expect(inside(inward, outline), `${name} ${x.toFixed(2)} ${y.toFixed(2)}`).toBe(
          true,
        );
      }
      const { min, max } = boundsOf(zone);
      expect(max[0] - min[0]).toBeCloseTo(18, 6);
      expect(max[1] - min[1]).toBeCloseTo(28, 6);
    }
  });

  it("its outer corner is rounded like the plate (no point in the sharp corner)", () => {
    const { printer } = plateOf("Bambu Lab P1S");
    const zone = exclusionOutline([18, 28], printer.plate, 256, 256);
    expect(zone.some(([x, y]) => x === -128 && y === -128)).toBe(false);
  });
});

describe("hatching of the keep-free area", () => {
  it("covers the polygon with diagonal lines that stay inside its bounds", () => {
    const zone = exclusionOutline([18, 28], undefined, 256, 256);
    const lines = hatchSegments(zone, 4);
    expect(lines.length).toBeGreaterThan(8);
    const { min, max } = boundsOf(zone);
    for (const [a, b] of lines) {
      for (const [x, y] of [a, b]) {
        expect(x).toBeGreaterThanOrEqual(min[0] - 1e-9);
        expect(x).toBeLessThanOrEqual(max[0] + 1e-9);
        expect(y).toBeGreaterThanOrEqual(min[1] - 1e-9);
        expect(y).toBeLessThanOrEqual(max[1] + 1e-9);
      }
      // 45 degree lines: x + y is the same at both ends
      expect(a[0] + a[1]).toBeCloseTo(b[0] + b[1], 9);
    }
  });
});
