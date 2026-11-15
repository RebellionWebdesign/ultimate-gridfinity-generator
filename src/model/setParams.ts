// A set (ADR-0009): one baseplate with several bins. Every bin brings its label and its lid and
// has a place on the plate: a column and a row, counted in cells on the grid seen from above
// (column 0 at the left, row 0 at the back), and it may be turned by 90 degrees. Nothing here
// moves a bin by itself except `firstFreeSpot`, which only chooses the place of a NEW bin.
import { newBin, type BinParams } from "./binParams";
import { DEFAULT_LABEL, type LabelParams } from "./labelParams";
import { DEFAULT_LID, type LidParams } from "./lidParams";

export interface SetBin {
  id: string;
  name: string;
  bin: BinParams;
  label: LabelParams;
  /** the bin has a lid: it takes the size of the bin */
  lidOn: boolean;
  lid: LidParams;
  /** first cell along x, counted from the left (0-based) */
  col: number;
  /** first cell along the depth, counted from the back, the top of the grid seen from above */
  row: number;
  /** turned by 90 degrees: width and depth swap */
  turned: boolean;
}

/** The cells of the plate that bins may use (the filler of a drawer fit is no cell). */
export interface PlateGrid {
  cols: number;
  rows: number;
}

/** Cells along x and along the depth that a bin covers on the plate. */
export const footprint = (
  bin: Pick<BinParams, "units_x" | "units_y">,
  turned: boolean,
): [number, number] =>
  turned ? [bin.units_y, bin.units_x] : [bin.units_x, bin.units_y];

/** The default name of a bin: its size, as in the bin tab. */
export const binName = (bin: BinParams): string =>
  `Bin ${bin.units_x} × ${bin.units_y} × ${bin.height_units}`;

/** The lid of a bin has the size of the bin. */
export const lidOfBin = (
  bin: Pick<BinParams, "units_x" | "units_y">,
  lid: LidParams,
) => ({
  ...lid,
  units_x: bin.units_x,
  units_y: bin.units_y,
});

export const newSetBin = (col = 0, row = 0): SetBin => {
  const bin = newBin();
  return {
    id: crypto.randomUUID(),
    name: binName(bin),
    bin,
    label: { ...DEFAULT_LABEL },
    lidOn: false,
    lid: { ...DEFAULT_LID },
    col,
    row,
    turned: false,
  };
};

const covers = (b: SetBin): { x0: number; y0: number; x1: number; y1: number } => {
  const [w, d] = footprint(b.bin, b.turned);
  return { x0: b.col, y0: b.row, x1: b.col + w, y1: b.row + d };
};

/**
 * What is wrong with the places of the bins, in words, one list per bin (same order): a bin
 * outside the cells of the plate, and a bin on another bin. A bin that is already reported
 * as outside is not reported again as overlapping.
 */
export const placementProblems = (
  grid: PlateGrid,
  bins: readonly SetBin[],
): string[][] =>
  bins.map((b, i) => {
    const out: string[] = [];
    const a = covers(b);
    const [w, d] = footprint(b.bin, b.turned);
    if (
      !Number.isInteger(b.col) ||
      !Number.isInteger(b.row) ||
      b.col < 0 ||
      b.row < 0 ||
      a.x1 > grid.cols ||
      a.y1 > grid.rows
    ) {
      out.push(
        `Bin ${i + 1} (${b.name}) is ${w} × ${d} cells and does not fit at column ${b.col + 1}, row ${b.row + 1} of a ${grid.cols} × ${grid.rows} plate.`,
      );
      return out;
    }
    for (let j = 0; j < bins.length; j++) {
      if (j === i) continue;
      const other = bins[j] as SetBin;
      const c = covers(other);
      const clear = a.x1 <= c.x0 || c.x1 <= a.x0 || a.y1 <= c.y0 || c.y1 <= a.y0;
      if (!clear)
        out.push(`Bin ${i + 1} (${b.name}) lies on bin ${j + 1} (${other.name}).`);
    }
    return out;
  });

/** All the problems of a set in one list. */
export const allPlacementProblems = (
  grid: PlateGrid,
  bins: readonly SetBin[],
): string[] => placementProblems(grid, bins).flat();

/** The cells that no bin covers, as a grid of booleans (true = free), `rows` lists of `cols`. */
export const freeCells = (grid: PlateGrid, bins: readonly SetBin[]): boolean[][] => {
  const free = Array.from({ length: grid.rows }, () =>
    Array.from({ length: grid.cols }, () => true),
  );
  for (const b of bins) {
    const a = covers(b);
    for (let y = Math.max(0, a.y0); y < Math.min(grid.rows, a.y1); y++) {
      for (let x = Math.max(0, a.x0); x < Math.min(grid.cols, a.x1); x++) {
        (free[y] as boolean[])[x] = false;
      }
    }
  }
  return free;
};

/**
 * The first place for a new bin of `w` x `d` cells: row by row from the back left, the first
 * where it lies on free cells only. Null when the plate has no such place: it is full.
 */
export const firstFreeSpot = (
  grid: PlateGrid,
  bins: readonly SetBin[],
  w = 1,
  d = 1,
): { col: number; row: number } | null => {
  const free = freeCells(grid, bins);
  for (let row = 0; row + d <= grid.rows; row++) {
    for (let col = 0; col + w <= grid.cols; col++) {
      let ok = true;
      for (let y = row; y < row + d && ok; y++) {
        for (let x = col; x < col + w; x++) {
          if (!(free[y] as boolean[])[x]) {
            ok = false;
            break;
          }
        }
      }
      if (ok) return { col, row };
    }
  }
  return null;
};

/** How many cells are free. */
export const freeCount = (grid: PlateGrid, bins: readonly SetBin[]): number =>
  freeCells(grid, bins).flat().filter(Boolean).length;
