// The print bed for the bed check: width (x), depth (y) and height (z) in mm, typed in by the
// user. The start value is 256 x 256 x 256 mm (the owner's choice of 9 November 2026;
// the printer list was removed). The origin of the bed is its front left corner.
import type { PlateShape } from "./plate";

export interface Printer {
  name: string;
  bed: [number, number, number];
  /** outline of the build plate, when it is not just the printable rectangle */
  plate?: PlateShape;
}

/** The bed the editor starts with: 256 x 256 x 256 mm. */
export const DEFAULT_BED: [number, number, number] = [256, 256, 256];

/** What the user may type: width and depth, and the build height. */
export const BED_LIMITS = {
  size: { min: 50, max: 600 },
  height: { min: 20, max: 600 },
} as const;

/** The print bed of the given size, drawn as a plain rectangle with rounded corners (owner, 9 November 2026). */
export const bedPrinter = (x: number, y: number, z: number): Printer => ({
  name: "Print bed",
  bed: [x, y, z],
  plate: { cornerRadius: 6 },
});

export interface BedResult {
  fits: boolean;
  /** it fits only when turned by 90 degrees */
  turned: boolean;
  /** width and depth fit the bed (turned or not) */
  footprintFits: boolean;
  /** the Z check: the part is not taller than the build height */
  heightFits: boolean;
}

/** Does a w x d footprint fit on the bed? */
const footprintFits = (w: number, d: number, printer: Printer): boolean => {
  const [bx, by] = printer.bed;
  return w <= bx && d <= by;
};

/** The part may be turned 90 degrees on the bed; height never changes. */
export const checkBed = (
  size: [number, number, number],
  printer: Printer,
): BedResult => {
  const [x, y, z] = size;
  const straight = footprintFits(x, y, printer);
  const turned = footprintFits(y, x, printer);
  const footprint = straight || turned;
  const height = z <= printer.bed[2];
  return {
    fits: footprint && height,
    turned: !straight && turned,
    footprintFits: footprint,
    heightFits: height,
  };
};

/** Outer size of a part n cells wide: a lid is n x 42 - 0.5, a baseplate n x 42. */
const partSize = (cells: number, tolerance: number): number => cells * 42 - tolerance;

/** The 0.5 mm that lids and bins are smaller than their cells. */
export const LID_TOLERANCE = 0.5;

/** The most cells along one axis that still fit, with the other axis unchanged. */
export const maxCells = (
  axis: "x" | "y",
  units: [number, number],
  height: number,
  printer: Printer,
  tolerance = LID_TOLERANCE,
): number => {
  for (let n = units[axis === "x" ? 0 : 1]; n >= 1; n--) {
    const [ux, uy] = axis === "x" ? [n, units[1]] : [units[0], n];
    if (
      checkBed([partSize(ux, tolerance), partSize(uy, tolerance), height], printer).fits
    )
      return n;
  }
  return 0;
};
