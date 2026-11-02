import { describe, expect, it } from "vitest";
import {
  CUSTOM_PRINTER,
  PRINTERS,
  checkBed,
  customPrinter,
  maxCells,
  type Printer,
} from "./printers";

const printer = (name: string): Printer => {
  const found = PRINTERS.find((p) => p.name === name);
  if (!found) throw new Error(`No printer ${name}`);
  return found;
};

describe("bed check", () => {
  const p2s = printer("Bambu Lab P2S");
  const p1s = printer("Bambu Lab P1S");

  it("P2S: the whole 256 x 256 x 256 volume is printable (Bambu Studio profile)", () => {
    expect(p2s.bed).toEqual([256, 256, 256]);
    expect(p2s.exclude).toBeUndefined();
    expect(checkBed([256, 256, 256], p2s).fits).toBe(true);
    expect(checkBed([256.5, 100, 10], p2s).fits).toBe(false);
    expect(checkBed([100, 100, 257], p2s).fits).toBe(false);
  });

  it("a long part fits when turned 90 degrees on a non-square bed", () => {
    const h2d = printer("Bambu Lab H2D");
    expect(checkBed([320, 300, 10], h2d)).toEqual({ fits: true, turned: false });
    expect(checkBed([300, 325, 10], h2d)).toEqual({ fits: true, turned: true });
    expect(checkBed([326, 330, 10], h2d)).toEqual({ fits: false, turned: false });
    const h2s = printer("Bambu Lab H2S");
    expect(checkBed([320, 335, 10], h2s)).toEqual({ fits: true, turned: true });
  });

  it("P1S, P1P, X1C and X1E: 250 mm high and 18 x 28 mm reserved at the front left", () => {
    for (const name of [
      "Bambu Lab P1S",
      "Bambu Lab P1P",
      "Bambu Lab X1C",
      "Bambu Lab X1E",
    ]) {
      const p = printer(name);
      expect(p.bed[2]).toBe(250);
      expect(p.exclude).toEqual([18, 28]);
    }
    expect(checkBed([100, 100, 251], p1s).fits).toBe(false);
  });

  it("a part that spans the reserved corner in both directions does not fit", () => {
    // 250 x 250: beside the corner needs 18 + 250 > 256, in front of it 28 + 250 > 256
    expect(checkBed([250, 250, 10], p1s).fits).toBe(false);
    expect(checkBed([250, 250, 10], p2s).fits).toBe(true);
    // 238 wide fits beside the corner, 228 deep fits in front of it
    expect(checkBed([238, 256, 10], p1s).fits).toBe(true);
    expect(checkBed([256, 228, 10], p1s).fits).toBe(true);
    expect(checkBed([239, 239, 10], p1s).fits).toBe(false);
  });

  it("A2L, H2D Pro, H2C, X1 and X2D follow Bambu Studio's machine profiles", () => {
    expect(printer("Bambu Lab A2L").bed).toEqual([330, 320, 325]);
    expect(printer("Bambu Lab H2D Pro").bed).toEqual([325, 320, 325]);
    expect(printer("Bambu Lab H2C").bed).toEqual([325, 320, 325]);
    expect(printer("Bambu Lab X2D").bed).toEqual([256, 256, 261]);
    expect(printer("Bambu Lab X1")).toMatchObject({
      bed: [256, 256, 250],
      exclude: [18, 28],
    });
  });

  it("maxCells: the most cells that fit along one axis", () => {
    // 6 x 42 - 0.5 = 251.5 fits 256, 7 x 42 - 0.5 = 293.5 does not
    expect(maxCells("x", [7, 1], 7, p2s)).toBe(6);
    expect(maxCells("y", [1, 9], 7, p2s)).toBe(6);
    expect(maxCells("x", [3, 1], 7, p2s)).toBe(3);
    // 6 x 6 fits the P2S, not the P1S (251.5 > 238 and > 228)
    expect(maxCells("x", [6, 6], 7, p1s)).toBe(5);
  });

  it("every printer with a 256 x 256 mm bed gets the same plate outline", () => {
    const same = PRINTERS.filter((p) => p.bed[0] === 256 && p.bed[1] === 256);
    expect(same.map((p) => p.name)).toEqual([
      "Bambu Lab P2S",
      "Bambu Lab P1S",
      "Bambu Lab P1P",
      "Bambu Lab X1",
      "Bambu Lab X1C",
      "Bambu Lab X1E",
      "Bambu Lab A1",
      "Bambu Lab X2D",
    ]);
    for (const p of same) expect(p.plate, p.name).toBe(p2s.plate);
    expect(p2s.plate?.backTab).toBeDefined();
    // other sizes keep the plain rectangle
    expect(printer("Bambu Lab A1 mini").plate).toBeUndefined();
  });

  it("a custom bed is a square with rounded corners and its own height", () => {
    const custom = customPrinter(200, 180);
    expect(custom.name).toBe(CUSTOM_PRINTER);
    expect(custom.bed).toEqual([200, 200, 180]);
    expect(custom.plate).toEqual({ cornerRadius: 6 });
    expect(checkBed([199, 199, 180], custom).fits).toBe(true);
    expect(checkBed([201, 100, 10], custom).fits).toBe(false);
    expect(checkBed([100, 100, 181], custom).fits).toBe(false);
    // 4 cells (167.5 mm) fit a 200 mm bed, 5 cells (209.5 mm) do not
    expect(maxCells("x", [5, 1], 7, custom)).toBe(4);
  });
});
