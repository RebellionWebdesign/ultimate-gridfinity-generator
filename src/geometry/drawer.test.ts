import { describe, expect, it } from "vitest";
import { DEFAULT_BIN } from "../model/binParams";
import { DEFAULT_LID } from "../model/lidParams";
import {
  binMaxUnits,
  lidExtra,
  lidMaxPlate,
  lidMaxUnits,
  lockBin,
  lockLid,
} from "./drawer";

describe("C-13 drawer height locks bins and lids", () => {
  it("a bin: 7 mm per unit plus 4.4 mm for the stacking lip", () => {
    // 100 mm: 7 x 13 + 4.4 = 95.4 fits, 7 x 14 + 4.4 = 102.4 does not
    expect(binMaxUnits(DEFAULT_BIN, 100)).toBe(13);
    expect(binMaxUnits({ ...DEFAULT_BIN, lip_style: "flat_lower" }, 100)).toBe(14);
    expect(binMaxUnits(DEFAULT_BIN, 7 * 5 + 4.4)).toBe(5);
    expect(binMaxUnits(DEFAULT_BIN, 7 * 5 + 4.39)).toBe(4);
  });

  it("a bin is lowered to the drawer, never raised, and never below one unit", () => {
    expect(lockBin({ ...DEFAULT_BIN, height_units: 20 }, 100).height_units).toBe(13);
    expect(lockBin({ ...DEFAULT_BIN, height_units: 3 }, 100).height_units).toBe(3);
    expect(lockBin({ ...DEFAULT_BIN, height_units: 3 }, 5).height_units).toBe(1);
  });

  it("drawer height 0 leaves everything as it is", () => {
    const bin = { ...DEFAULT_BIN, height_units: 40 };
    expect(lockBin(bin, 0)).toBe(bin);
    expect(lockLid(DEFAULT_LID, 0)).toBe(DEFAULT_LID);
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

  it("a lid's plate: the drawer minus the 4.75 foot", () => {
    expect(lidMaxPlate(DEFAULT_LID, 10)).toBeCloseTo(5.25, 10);
    // never thinner than the 2.25 mm the foot leaves
    expect(lidMaxPlate(DEFAULT_LID, 5)).toBe(2.25);
  });

  it("a lid is lowered to the drawer", () => {
    const tall = { ...DEFAULT_LID, height_units_auto: 6, plate_thickness: 12 };
    const locked = lockLid(tall, 15);
    expect(locked.height_units_auto).toBe(2);
    expect(locked.plate_thickness).toBeCloseTo(10.25, 10);
  });
});
