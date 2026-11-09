import { describe, expect, it } from "vitest";
import { boundsOf, outwardOutline, plateOutline, type Point2 } from "./plate";
import { bedPrinter } from "./printers";

const plateOf = (x = 256, y = 256) => {
  const printer = bedPrinter(x, y, 256);
  if (!printer.plate) throw new Error("No plate");
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
  it("a 256 x 256 bed is a plain square, no tabs or lips", () => {
    const { min, max } = boundsOf(plateOf().outline);
    expect([min[0], min[1], max[0], max[1]]).toEqual([-128, -128, 128, 128]);
  });

  it("a custom bed is a square with rounded corners", () => {
    const custom = bedPrinter(200, 200, 180);
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
    for (const printer of [bedPrinter(256, 256, 256), bedPrinter(200, 150, 100)]) {
      if (!printer.plate) continue;
      const outline = plateOutline(printer.plate, printer.bed[0], printer.bed[1]);
      expect(signedArea(outline), `${printer.bed}`).toBeGreaterThan(0);
      outline.forEach((p, i) => {
        const next = outline[(i + 1) % outline.length] as Point2;
        expect(p[0] === next[0] && p[1] === next[1], `${printer.bed} ${i}`).toBe(false);
      });
    }
  });
});

describe("outwardOutline", () => {
  const square: Point2[] = [
    [-10, -10],
    [10, -10],
    [10, 10],
    [-10, 10],
  ];

  it("moves every edge of a square out by the distance", () => {
    const out = outwardOutline(square, 3);
    const xs = out.map(([x]) => x);
    const ys = out.map(([, y]) => y);
    expect(Math.min(...xs)).toBeCloseTo(-13, 10);
    expect(Math.max(...xs)).toBeCloseTo(13, 10);
    expect(Math.min(...ys)).toBeCloseTo(-13, 10);
    expect(Math.max(...ys)).toBeCloseTo(13, 10);
  });

  it("gives the same result for the other winding order", () => {
    const out = outwardOutline([...square].reverse(), 3);
    const xs = out.map(([x]) => x);
    expect(Math.max(...xs)).toBeCloseTo(13, 10);
    expect(Math.min(...xs)).toBeCloseTo(-13, 10);
  });

  it("surrounds a real build plate: every point moves away from the middle", () => {
    const outline = plateOutline(
      bedPrinter(256, 256, 256).plate ?? { cornerRadius: 0 },
      256,
      256,
    );
    const out = outwardOutline(outline, 5);
    expect(out).toHaveLength(outline.length);
    out.forEach(([x, y], i) => {
      const [ox, oy] = outline[i] as Point2;
      expect(Math.hypot(x - ox, y - oy)).toBeGreaterThan(4.9);
    });
  });
});
