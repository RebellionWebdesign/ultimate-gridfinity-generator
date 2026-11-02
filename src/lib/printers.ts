// Printable area of the Bambu Lab printers: width (x), depth (y) and height (z) in mm.
// Source: Bambu Studio's own machine profiles (bambulab/BambuStudio, resources/profiles/BBL/
// machine, `printable_area`, `printable_height`, `bed_exclude_area`, checked 2 November 2026)
// and the P2S profile of the owner's installed Bambu Studio 02.08.02.61, which also lists
// the P2S as 256 x 256 x 256 with no excluded area. Two-nozzle printers (H2D, H2D Pro, H2C,
// X2D): the area one nozzle reaches (`extruder_printable_area` of the profile; for the H2D the
// single-nozzle volume of Bambu Lab's technical specifications); the wider total needs both
// nozzles with the same filament. Origin of the bed is its front left corner.
import type { PlateShape } from "./plate";

export interface Printer {
  name: string;
  bed: [number, number, number];
  /** reserved rectangle at the front left corner (x and y extent), if any */
  exclude?: [number, number];
  /** outline of the build plate, when it is not just the printable rectangle */
  plate?: PlateShape;
}

/** P1P, P1S, X1, X1C and X1E reserve 18 x 28 mm at the front left and print 250 mm high. */
const CLASSIC_EXCLUDE: [number, number] = [18, 28];

/**
 * The 256 x 256 build plate (owner's picture of the P2S, 2 November 2026). The owner asked
 * to draw it for every printer with the same size. A handle tab at the back, a lip at the
 * front; the body is the printable area.
 */
const PLATE_256: PlateShape = {
  cornerRadius: 6,
  backTabs: [{ from: 93, to: 163, flank: 6.5, height: 8 }],
  frontLips: [{ from: 71, to: 256, flank: 10, depth: 10 }],
};

/**
 * The plate of the H2D, H2D Pro, H2C, H2S and A2L (owner's picture, 2 November 2026): a
 * 350 x 320 mm body, two raised tabs at the back corners and two lips at the front corners.
 * It is drawn at this size for every one of these printers, centred on the printable area.
 */
const PLATE_H2: PlateShape = {
  cornerRadius: 3,
  body: { width: 350, depth: 320 },
  backTabs: [
    { from: 0, to: 46, flank: 5, height: 4.6 },
    { from: 304, to: 350, flank: 5, height: 4.6 },
  ],
  frontLips: [
    { from: 0, to: 125.5, flank: 15, depth: 15 },
    { from: 224.5, to: 350, flank: 15, depth: 15 },
  ],
};

/** The A1 mini plate (owner's picture, 2 November 2026): two tabs at the back, a lip at the front. */
const PLATE_A1_MINI: PlateShape = {
  cornerRadius: 3,
  backTabs: [
    { from: 33, to: 67, flank: 6, height: 5.5 },
    { from: 113, to: 146, flank: 5, height: 5.5 },
  ],
  frontLips: [{ from: 49, to: 180, flank: 7.5, depth: 7.5 }],
};

export const PRINTERS: Printer[] = [
  { name: "Bambu Lab P2S", bed: [256, 256, 256], plate: PLATE_256 },
  {
    name: "Bambu Lab P1S",
    bed: [256, 256, 250],
    exclude: CLASSIC_EXCLUDE,
    plate: PLATE_256,
  },
  {
    name: "Bambu Lab P1P",
    bed: [256, 256, 250],
    exclude: CLASSIC_EXCLUDE,
    plate: PLATE_256,
  },
  {
    name: "Bambu Lab X1",
    bed: [256, 256, 250],
    exclude: CLASSIC_EXCLUDE,
    plate: PLATE_256,
  },
  {
    name: "Bambu Lab X1C",
    bed: [256, 256, 250],
    exclude: CLASSIC_EXCLUDE,
    plate: PLATE_256,
  },
  {
    name: "Bambu Lab X1E",
    bed: [256, 256, 250],
    exclude: CLASSIC_EXCLUDE,
    plate: PLATE_256,
  },
  { name: "Bambu Lab A1", bed: [256, 256, 256], plate: PLATE_256 },
  { name: "Bambu Lab A1 mini", bed: [180, 180, 180], plate: PLATE_A1_MINI },
  { name: "Bambu Lab A2L", bed: [330, 320, 325], plate: PLATE_H2 },
  { name: "Bambu Lab H2D", bed: [325, 320, 325], plate: PLATE_H2 },
  { name: "Bambu Lab H2D Pro", bed: [325, 320, 325], plate: PLATE_H2 },
  { name: "Bambu Lab H2C", bed: [325, 320, 325], plate: PLATE_H2 },
  { name: "Bambu Lab H2S", bed: [340, 320, 340], plate: PLATE_H2 },
  { name: "Bambu Lab X2D", bed: [256, 256, 261], plate: PLATE_256 },
];

/** Name of the entry for a bed the user types in. */
export const CUSTOM_PRINTER = "Custom";

export const CUSTOM_LIMITS = {
  size: { min: 50, max: 600, def: 256 },
  height: { min: 20, max: 600, def: 256 },
} as const;

/** A square bed with rounded corners of the given side and build height (owner: square only). */
export const customPrinter = (side: number, height: number): Printer => ({
  name: CUSTOM_PRINTER,
  bed: [side, side, height],
  plate: { cornerRadius: 6 },
});

export interface BedResult {
  fits: boolean;
  /** it fits only when turned by 90 degrees */
  turned: boolean;
}

/** Does a w x d footprint fit on the bed without touching the reserved corner? */
const footprintFits = (w: number, d: number, printer: Printer): boolean => {
  const [bx, by] = printer.bed;
  if (w > bx || d > by) return false;
  if (!printer.exclude) return true;
  const [ex, ey] = printer.exclude;
  // placed beside the reserved corner (to its right) or in front of it (above it)
  return w <= bx - ex || d <= by - ey;
};

/** The part may be turned 90 degrees on the bed; height never changes. */
export const checkBed = (
  size: [number, number, number],
  printer: Printer,
): BedResult => {
  const [x, y, z] = size;
  const straight = footprintFits(x, y, printer);
  const turned = footprintFits(y, x, printer);
  return {
    fits: (straight || turned) && z <= printer.bed[2],
    turned: !straight && turned,
  };
};

/** Outer size of a lid n cells wide (n x 42 - 0.5). */
const lidSize = (cells: number): number => cells * 42 - 0.5;

/** The most cells along one axis that still fit, with the other axis unchanged. */
export const maxCells = (
  axis: "x" | "y",
  units: [number, number],
  height: number,
  printer: Printer,
): number => {
  for (let n = units[axis === "x" ? 0 : 1]; n >= 1; n--) {
    const [ux, uy] = axis === "x" ? [n, units[1]] : [units[0], n];
    if (checkBed([lidSize(ux), lidSize(uy), height], printer).fits) return n;
  }
  return 0;
};
