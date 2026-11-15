import { describe, expect, it } from "vitest";
import {
  allPlacementProblems,
  firstFreeSpot,
  footprint,
  freeCount,
  lidOfBin,
  newSetBin,
  placementProblems,
  type SetBin,
} from "./setParams";

const bin = (col: number, row: number, w = 1, d = 1, turned = false): SetBin => {
  const b = newSetBin(col, row);
  b.bin.units_x = w;
  b.bin.units_y = d;
  b.turned = turned;
  b.name = `Bin at ${col},${row}`;
  return b;
};

describe("footprint", () => {
  it("swaps width and depth when the bin is turned", () => {
    expect(footprint({ units_x: 3, units_y: 1 }, false)).toEqual([3, 1]);
    expect(footprint({ units_x: 3, units_y: 1 }, true)).toEqual([1, 3]);
  });
});

describe("placement problems", () => {
  const grid = { cols: 4, rows: 3 };

  it("accepts bins that lie inside and apart", () => {
    expect(
      allPlacementProblems(grid, [bin(0, 0, 2, 1), bin(2, 0, 2, 3), bin(0, 1)]),
    ).toEqual([]);
  });

  it("reports a bin that reaches over the edge", () => {
    const problems = placementProblems(grid, [bin(3, 0, 2, 1)]);
    expect(problems[0]?.[0]).toMatch(/does not fit/);
  });

  it("reports a bin that sticks out only when it is turned", () => {
    expect(allPlacementProblems(grid, [bin(0, 1, 1, 3, false)])).toHaveLength(1);
    expect(allPlacementProblems(grid, [bin(0, 0, 1, 3, false)])).toHaveLength(0);
    // 3 x 1 turned is 1 x 3: it fits the 3 rows at row 0 but not at row 1
    expect(allPlacementProblems(grid, [bin(0, 0, 3, 1, true)])).toHaveLength(0);
    expect(allPlacementProblems(grid, [bin(0, 1, 3, 1, true)])).toHaveLength(1);
  });

  it("reports an overlap for both bins", () => {
    const problems = placementProblems(grid, [bin(0, 0, 2, 2), bin(1, 1)]);
    expect(problems[0]?.length).toBe(1);
    expect(problems[1]?.length).toBe(1);
  });

  it("does not call touching bins an overlap", () => {
    expect(allPlacementProblems(grid, [bin(0, 0, 2, 1), bin(2, 0, 2, 1)])).toEqual([]);
  });

  it("refuses a negative or fractional place", () => {
    expect(allPlacementProblems(grid, [bin(-1, 0)])).toHaveLength(1);
    expect(allPlacementProblems(grid, [bin(0.5, 0)])).toHaveLength(1);
  });
});

describe("the first free place", () => {
  const grid = { cols: 3, rows: 2 };

  it("starts at the back left", () => {
    expect(firstFreeSpot(grid, [])).toEqual({ col: 0, row: 0 });
  });

  it("goes along the row, then to the next", () => {
    expect(firstFreeSpot(grid, [bin(0, 0)])).toEqual({ col: 1, row: 0 });
    expect(firstFreeSpot(grid, [bin(0, 0, 3, 1)])).toEqual({ col: 0, row: 1 });
  });

  it("skips a gap that is too small for the size asked", () => {
    expect(firstFreeSpot(grid, [bin(1, 0)], 2, 1)).toEqual({ col: 0, row: 1 });
  });

  it("is null when the plate is full", () => {
    const full = [bin(0, 0, 3, 1), bin(0, 1, 3, 1)];
    expect(firstFreeSpot(grid, full)).toBeNull();
    expect(freeCount(grid, full)).toBe(0);
  });

  it("counts the free cells", () => {
    expect(freeCount(grid, [bin(0, 0, 2, 1)])).toBe(4);
  });
});

describe("the lid of a bin", () => {
  it("takes the size of the bin", () => {
    const set = bin(0, 0, 3, 2);
    const lid = lidOfBin(set.bin, set.lid);
    expect([lid.units_x, lid.units_y]).toEqual([3, 2]);
  });
});
