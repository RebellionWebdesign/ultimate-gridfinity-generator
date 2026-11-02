// Printable area of the Bambu Lab printers: width (x), depth (y) and height (z) in mm.
// Source: Bambu Studio's own machine profiles (bambulab/BambuStudio, resources/profiles/BBL/
// machine, `printable_area`, `printable_height`, `bed_exclude_area`, checked 2 November 2026)
// and the P2S profile of the owner's installed Bambu Studio 02.08.02.61, which also lists
// the P2S as 256 x 256 x 256 with no excluded area. Two-nozzle printers (H2D, H2D Pro, H2C,
// X2D): the area one nozzle reaches (`extruder_printable_area` of the profile; for the H2D the
// single-nozzle volume of Bambu Lab's technical specifications); the wider total needs both
// nozzles with the same filament. Origin of the bed is its front left corner.
export interface Printer {
  name: string;
  bed: [number, number, number];
  /** reserved rectangle at the front left corner (x and y extent), if any */
  exclude?: [number, number];
}

/** P1P, P1S, X1, X1C and X1E reserve 18 x 28 mm at the front left and print 250 mm high. */
const CLASSIC_EXCLUDE: [number, number] = [18, 28];

export const PRINTERS: Printer[] = [
  { name: "Bambu Lab P2S", bed: [256, 256, 256] },
  { name: "Bambu Lab P1S", bed: [256, 256, 250], exclude: CLASSIC_EXCLUDE },
  { name: "Bambu Lab P1P", bed: [256, 256, 250], exclude: CLASSIC_EXCLUDE },
  { name: "Bambu Lab X1", bed: [256, 256, 250], exclude: CLASSIC_EXCLUDE },
  { name: "Bambu Lab X1C", bed: [256, 256, 250], exclude: CLASSIC_EXCLUDE },
  { name: "Bambu Lab X1E", bed: [256, 256, 250], exclude: CLASSIC_EXCLUDE },
  { name: "Bambu Lab A1", bed: [256, 256, 256] },
  { name: "Bambu Lab A1 mini", bed: [180, 180, 180] },
  { name: "Bambu Lab A2L", bed: [330, 320, 325] },
  { name: "Bambu Lab H2D", bed: [325, 320, 325] },
  { name: "Bambu Lab H2D Pro", bed: [325, 320, 325] },
  { name: "Bambu Lab H2C", bed: [325, 320, 325] },
  { name: "Bambu Lab H2S", bed: [340, 320, 340] },
  { name: "Bambu Lab X2D", bed: [256, 256, 261] },
];

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
