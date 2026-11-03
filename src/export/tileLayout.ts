// Where the pieces of a split baseplate go when they share one file: a grid with one
// printer bed per piece, and the same gap Bambu Studio leaves between its plates (a fifth of
// the bed). The slicer can then put each piece on its own plate (in Bambu Studio: Arrange).
import type { PartMesh } from "../geometry/model";

/** Bambu Studio's gap between two plates, as a share of the plate (PartPlate.cpp). */
export const PLATE_GAP = 1 / 5;

/** The middle of the parts' footprint (mm). */
export const centreOf = (parts: readonly PartMesh[]): [number, number] => {
  let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const part of parts) {
    for (let i = 0; i < part.positions.length; i += 3) {
      const x = part.positions[i] ?? 0;
      const y = part.positions[i + 1] ?? 0;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  return [(minX + maxX) / 2, (minY + maxY) / 2];
};

/**
 * How far to move each piece so that piece k sits in the middle of its own bed-sized cell
 * of a grid (about as many columns as rows, row by row from the front left).
 */
export const tileOffsets = (
  centres: readonly [number, number][],
  bed: [number, number],
): [number, number][] => {
  const cols = Math.max(1, Math.ceil(Math.sqrt(centres.length)));
  const [pitchX, pitchY] = [bed[0] * (1 + PLATE_GAP), bed[1] * (1 + PLATE_GAP)];
  return centres.map(([cx, cy], k) => [
    (k % cols) * pitchX - cx,
    Math.floor(k / cols) * pitchY - cy,
  ]);
};
