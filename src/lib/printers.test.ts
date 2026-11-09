import { describe, expect, it } from "vitest";
import { BED_LIMITS, DEFAULT_BED, bedPrinter, checkBed, maxCells } from "./printers";

describe("bed check (the print bed is typed in, owner 9 November 2026)", () => {
  const p2s = bedPrinter(...DEFAULT_BED);

  it("starts with 256 x 256 x 256 mm, the whole volume printable", () => {
    expect(DEFAULT_BED).toEqual([256, 256, 256]);
    expect(p2s.bed).toEqual([256, 256, 256]);
    expect(checkBed([256, 256, 256], p2s).fits).toBe(true);
    expect(checkBed([256.5, 100, 10], p2s).fits).toBe(false);
    expect(checkBed([100, 100, 257], p2s).fits).toBe(false);
  });

  it("a long part fits when turned 90 degrees on a non-square bed", () => {
    const bed = bedPrinter(325, 320, 325);
    expect(checkBed([320, 300, 10], bed)).toMatchObject({ fits: true, turned: false });
    expect(checkBed([300, 325, 10], bed)).toMatchObject({ fits: true, turned: true });
    expect(checkBed([326, 330, 10], bed)).toMatchObject({ fits: false, turned: false });
  });

  it("the whole bed counts: no corner is reserved", () => {
    expect(checkBed([250, 250, 10], bedPrinter(256, 256, 250)).fits).toBe(true);
    expect(checkBed([256, 256, 250], bedPrinter(256, 256, 250)).fits).toBe(true);
    expect(checkBed([256, 256, 251], bedPrinter(256, 256, 250)).fits).toBe(false);
  });

  it("maxCells: the most cells that fit along one axis", () => {
    // 6 x 42 - 0.5 = 251.5 fits 256, 7 x 42 - 0.5 = 293.5 does not
    expect(maxCells("x", [7, 1], 7, p2s)).toBe(6);
    expect(maxCells("y", [1, 9], 7, p2s)).toBe(6);
    expect(maxCells("x", [3, 1], 7, p2s)).toBe(3);
    // 4 cells (167.5 mm) fit a 200 mm bed, 5 cells (209.5 mm) do not
    expect(maxCells("x", [5, 1], 7, bedPrinter(200, 200, 180))).toBe(4);
  });

  it("the limits of what can be typed", () => {
    expect(BED_LIMITS.size).toEqual({ min: 50, max: 600 });
    expect(BED_LIMITS.height).toEqual({ min: 20, max: 600 });
  });

  it("the Z check: a part taller than the build height does not fit, whatever its footprint", () => {
    expect(checkBed([100, 100, 256], p2s)).toMatchObject({
      heightFits: true,
      fits: true,
    });
    expect(checkBed([100, 100, 256.5], p2s)).toMatchObject({
      heightFits: false,
      footprintFits: true,
      fits: false,
    });
    expect(checkBed([300, 100, 300], p2s)).toMatchObject({
      heightFits: false,
      footprintFits: false,
      fits: false,
    });
    expect(checkBed([300, 100, 10], p2s)).toMatchObject({
      heightFits: true,
      footprintFits: false,
    });
    // a bed with a low ceiling
    expect(checkBed([50, 50, 101], bedPrinter(256, 256, 100)).heightFits).toBe(false);
  });

  it("every bed is drawn as a plain rectangle with rounded corners", () => {
    for (const bed of [bedPrinter(256, 256, 256), bedPrinter(200, 180, 180)]) {
      expect(bed.plate).toEqual({ cornerRadius: 6 });
    }
  });
});
