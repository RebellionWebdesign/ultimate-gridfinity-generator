// Printable area of the Bambu Lab printers: width (x), depth (y) and height (z) in mm.
// Source: Bambu Studio's own machine profiles (bambulab/BambuStudio, resources/profiles/BBL/
// machine, `printable_area`, `printable_height`, `bed_exclude_area`, checked 2 November 2026)
// and the P2S profile of the owner's installed Bambu Studio 02.08.02.61, which also lists
// the P2S as 256 x 256 x 256 with no excluded area. Two-nozzle printers (H2D, H2D Pro, H2C,
// X2D): the area one nozzle reaches (`extruder_printable_area` of the profile; for the H2D the
// single-nozzle volume of Bambu Lab's technical specifications); the wider total needs both
// nozzles with the same filament. Origin of the bed is its front left corner.
/**
 * Outline of the physical build plate where it differs from the printable rectangle: a
 * handle tab at the back and a lip at the front. Drawn only (the printable area stays the
 * rectangle). Measured from a picture of the plate, about 1 mm accurate; mm, relative to
 * the printable area, whose front left corner is the origin.
 */
export interface PlateShape {
  cornerRadius: number;
  /** centred tab at the back: width of its flat top and of its base, and how far it sticks out */
  backTab?: { top: number; base: number; height: number };
  /** lip along the front: the 45 degree flank starts this far from the left edge */
  frontLip?: { start: number; chamfer: number; depth: number };
}

export interface Printer {
  name: string;
  bed: [number, number, number];
  /** reserved rectangle at the front left corner (x and y extent), if any */
  exclude?: [number, number];
  /** outline of the build plate, when it is not just the printable rectangle */
  plate?: PlateShape;
}

/**
 * The 256 x 256 build plate (owner's picture of the P2S, 2 November 2026). The owner asked
 * to draw it for every printer with the same size.
 */
const PLATE_256: PlateShape = {
  cornerRadius: 6,
  backTab: { top: 57, base: 70, height: 8 },
  frontLip: { start: 71, chamfer: 10, depth: 10 },
};

/** P1P, P1S, X1, X1C and X1E reserve 18 x 28 mm at the front left and print 250 mm high. */
const CLASSIC_EXCLUDE: [number, number] = [18, 28];

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
  { name: "Bambu Lab A1 mini", bed: [180, 180, 180] },
  { name: "Bambu Lab A2L", bed: [330, 320, 325] },
  { name: "Bambu Lab H2D", bed: [325, 320, 325] },
  { name: "Bambu Lab H2D Pro", bed: [325, 320, 325] },
  { name: "Bambu Lab H2C", bed: [325, 320, 325] },
  { name: "Bambu Lab H2S", bed: [340, 320, 340] },
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
