import { describe, expect, it } from "vitest";
import { DEFAULT_BASEPLATE } from "../model/baseplateParams";
import { DEFAULT_BIN } from "../model/binParams";
import { DEFAULT_LID } from "../model/lidParams";
import {
  DRAWER_CLEARANCE,
  baseHeightOf,
  binHeightOf,
  binMaxUnits,
  drawerCheck,
  drawerMessage,
  lidExtra,
  lidHeightOf,
  lidMaxPlate,
  lidMaxUnits,
} from "./drawer";

describe("heights of the three parts", () => {
  it("a baseplate: its base and the 4.65 mm profile", () => {
    expect(baseHeightOf(DEFAULT_BASEPLATE)).toBeCloseTo(0.4 + 4.65, 10);
    expect(baseHeightOf({ ...DEFAULT_BASEPLATE, baseplate_base: 3 })).toBeCloseTo(
      7.65,
      10,
    );
  });

  it("a bin: 7 mm per unit plus the 4.4 mm stacking lip", () => {
    expect(binHeightOf(DEFAULT_BIN)).toBeCloseTo(3 * 7 + 4.4, 10);
    expect(binHeightOf({ ...DEFAULT_BIN, lip_style: "flat_lower" })).toBe(21);
  });

  it("a lid: foot and plate, plus a lip or a raised label", () => {
    expect(lidHeightOf(DEFAULT_LID)).toBeCloseTo(7, 10);
    expect(lidHeightOf({ ...DEFAULT_LID, variant: "stackable" })).toBeCloseTo(11.4, 10);
  });
});

describe("the bin, the lid and the most height they may have", () => {
  it("a bin: 7 mm per unit plus 4.4 mm for the stacking lip", () => {
    expect(binMaxUnits(DEFAULT_BIN, 100)).toBe(13);
    expect(binMaxUnits({ ...DEFAULT_BIN, lip_style: "flat_lower" }, 100)).toBe(14);
    expect(binMaxUnits(DEFAULT_BIN, 7 * 5 + 4.4)).toBe(5);
    expect(binMaxUnits(DEFAULT_BIN, 7 * 5 + 4.39)).toBe(4);
  });

  it("a lid: a stackable one carries its lip, a raised label its height", () => {
    expect(lidExtra(DEFAULT_LID)).toBe(0);
    expect(lidExtra({ ...DEFAULT_LID, variant: "stackable" })).toBe(4.4);
    expect(
      lidExtra({
        ...DEFAULT_LID,
        text_mode: "raised",
        text_string: "A",
        emboss_depth: 0.8,
      }),
    ).toBe(0.8);
    expect(lidMaxUnits(DEFAULT_LID, 30)).toBe(4);
    expect(lidMaxUnits({ ...DEFAULT_LID, variant: "stackable" }, 30)).toBe(3);
  });

  it("a lid's plate: what is left minus the 4.75 foot, never thinner than 2.25", () => {
    expect(lidMaxPlate(DEFAULT_LID, 10)).toBeCloseTo(5.25, 10);
    expect(lidMaxPlate(DEFAULT_LID, 5)).toBe(2.25);
  });
});

describe("the drawer: base + bin + lid must fit, with 1 mm of room above (owner, 9 November 2026)", () => {
  const base = DEFAULT_BASEPLATE; // 5.05
  const bin = DEFAULT_BIN; // 25.4
  const lid = DEFAULT_LID; // 7
  const total = 5.05 + 25.4 + 7; // 37.45

  it("with the drawer at 0 the option is off and everything fits", () => {
    const d = drawerCheck(0, base, bin, lid);
    expect(d.on).toBe(false);
    expect(d.fits).toBe(true);
    expect(drawerMessage(d, 0)).toBe("");
  });

  it("adds the three heights and leaves 1 mm above", () => {
    expect(DRAWER_CLEARANCE).toBe(1);
    const d = drawerCheck(100, base, bin, lid);
    expect(d.total).toBeCloseTo(total, 10);
    expect(d.limit).toBe(99);
    expect(d.fits).toBe(true);
  });

  it("fits at exactly the stack plus 1 mm, not 0.01 mm less", () => {
    expect(drawerCheck(total + 1, base, bin, lid).fits).toBe(true);
    expect(drawerCheck(total + 1 - 0.01, base, bin, lid).fits).toBe(false);
    // without the 1 mm of room it would just fit: that is not enough
    expect(drawerCheck(total, base, bin, lid).fits).toBe(false);
  });

  it("the bin may use what base and lid leave over", () => {
    const d = drawerCheck(60, base, bin, lid);
    expect(d.binAvailable).toBeCloseTo(59 - 5.05 - 7, 10); // 46.95
    expect(d.binUnitsFit).toBe(6); // 6 x 7 + 4.4 = 46.4
    expect(binMaxUnits(bin, d.binAvailable)).toBe(6);
  });

  it("the lid may use what base and bin leave over", () => {
    const d = drawerCheck(50, base, bin, lid);
    expect(d.lidAvailable).toBeCloseTo(49 - 5.05 - 25.4, 10); // 18.55
    expect(d.lidUnitsFit).toBe(2);
  });

  it("too tall: a warning with the suggestion, and the suggestion makes it fit", () => {
    const d = drawerCheck(40, base, { ...bin, height_units: 10 }, lid);
    expect(d.fits).toBe(false);
    const message = drawerMessage(d, 40);
    expect(message).toMatch(/does not fit like this/);
    expect(message).toMatch(/1 mm of room above/);
    expect(message).toMatch(/Suggestion: a bin of \d+ units? fits/);
    // follow the suggestion: the bin at the proposed height fits, with 1 mm to spare
    const fixed = drawerCheck(40, base, { ...bin, height_units: d.binUnitsFit }, lid);
    expect(fixed.fits).toBe(true);
    expect(fixed.total).toBeLessThanOrEqual(39);
    // one unit more would not
    expect(
      drawerCheck(40, base, { ...bin, height_units: d.binUnitsFit + 1 }, lid).fits,
    ).toBe(false);
  });

  it("the suggestion for the lid fits too", () => {
    const tall = { ...lid, height_units_auto: 6 };
    const d = drawerCheck(45, base, bin, tall);
    expect(d.fits).toBe(false);
    const fixed = drawerCheck(45, base, bin, {
      ...tall,
      height_units_auto: d.lidUnitsFit,
    });
    expect(fixed.fits).toBe(true);
  });

  it("when even the lowest bin and lid do not fit it says so", () => {
    const d = drawerCheck(15, base, bin, lid);
    expect(d.fits).toBe(false);
    expect(d.binFitsAtAll).toBe(false);
    expect(drawerMessage(d, 15)).toMatch(/Even the lowest bin and lid do not fit/);
  });
});
