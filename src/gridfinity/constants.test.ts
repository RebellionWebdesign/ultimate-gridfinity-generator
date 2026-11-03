import { describe, expect, it } from "vitest";
import { CONSTANTS, dim, footBottomEdge, holeOffset, outerSize } from "./constants";

// One expectation per number in spec section 4 (and skills/gridfinity-spec).
describe("Gridfinity constants match the spec", () => {
  const table: [keyof typeof CONSTANTS, number][] = [
    ["grid", 42],
    ["heightUnit", 7],
    ["binTolerance", 0.5],
    ["binCornerRadius", 3.75],
    ["footRadiusMid", 1.6],
    ["footRadiusBottom", 0.8],
    ["baseplateCornerRadius", 4.0],
    ["footLowerSlope", 0.8],
    ["footVertical", 1.8],
    ["footUpperSlope", 2.15],
    ["footHeight", 4.75],
    ["footBottomEdgeInset", 2.95],
    ["firstLayerUsable", 2.25],
    ["lipLowerSlope", 0.7],
    ["lipVertical", 1.8],
    ["lipUpperSlope", 1.9],
    ["lipHeight", 4.4],
    ["lipDepth", 2.6],
    ["lipFootOffset", 0.25],
    ["baseplateProfileLower", 0.7],
    ["baseplateProfileVertical", 1.8],
    ["baseplateProfileUpper", 2.15],
    ["baseplateProfileHeight", 4.65],
    ["baseplateBottomInset", 2.85],
    ["baseplateWallInset", 2.15],
    ["baseplateRadiusBottom", 1.15],
    ["baseplateRadiusWall", 1.85],
    ["magnetDiameter", 6],
    ["magnetThickness", 2],
    ["magnetPocketDiameter", 6.1],
    ["magnetPocketDepth", 2.1],
    ["screwHoleDiameter", 3.0],
    ["holeSpacing", 26],
    ["holeCentreFromFootEdge", 4.8],
  ];

  it.each(table)("%s = %d", (name, value) => {
    expect(CONSTANTS[name].value).toBe(value);
  });

  it("every constant has a source", () => {
    for (const entry of Object.values(CONSTANTS)) {
      expect(entry.source.length).toBeGreaterThan(0);
    }
  });

  it("foot height is the sum of the profile", () => {
    const sum = CONSTANTS.footLowerSlope.value + CONSTANTS.footVertical.value;
    expect(sum + CONSTANTS.footUpperSlope.value).toBeCloseTo(
      CONSTANTS.footHeight.value,
    );
  });

  it("baseplate profile height is the sum of the profile", () => {
    const { baseplateProfileLower: a, baseplateProfileVertical: b } = CONSTANTS;
    const sum = a.value + b.value + CONSTANTS.baseplateProfileUpper.value;
    expect(sum).toBeCloseTo(CONSTANTS.baseplateProfileHeight.value);
  });

  it("baseplate profile widths are 36.3 and 37.7", () => {
    const { grid, baseplateBottomInset: bottom, baseplateWallInset: wall } = CONSTANTS;
    expect(grid.value - 2 * bottom.value).toBeCloseTo(36.3, 10);
    expect(grid.value - 2 * wall.value).toBeCloseTo(37.7, 10);
  });

  it("first layer usable space is 7 - 4.75", () => {
    const { heightUnit, footHeight, firstLayerUsable } = CONSTANTS;
    expect(heightUnit.value - footHeight.value).toBeCloseTo(firstLayerUsable.value);
  });

  it("outer size is n x 42 - 0.5", () => {
    expect(outerSize(1)).toBe(41.5);
    expect(outerSize(2)).toBe(83.5);
  });

  it("foot bottom edge is 35.6", () => {
    expect(footBottomEdge()).toBeCloseTo(35.6, 10);
  });

  it("hole offset is 13", () => {
    expect(holeOffset()).toBe(13);
  });

  it("stops with an error for a dimension that is not defined", () => {
    expect(dim("grid")).toBe(42);
    expect(() => dim("wallThickness")).toThrow(/Unknown Gridfinity dimension/);
  });
});
