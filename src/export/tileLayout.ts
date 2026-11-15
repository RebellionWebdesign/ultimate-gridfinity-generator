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

/** The width and depth of the footprint of the parts (mm). */
export const sizeOfFootprint = (parts: readonly PartMesh[]): [number, number] => {
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
  return [maxX - minX, maxY - minY];
};

/** Gap between two pieces on one plate, and the margin to the edge of the plate (mm). */
export const PACK_GAP = 5;
export const PACK_MARGIN = 5;

/** Where a piece goes: its plate (0-based) and the middle of the piece on that plate (mm from the plate's corner). */
export interface Packed {
  plate: number;
  cx: number;
  cy: number;
}

interface Shelf {
  y: number;
  h: number;
  x: number;
}
interface Plate {
  /** taken by a piece that is too large to share: nothing else goes on it */
  full: boolean;
  shelves: Shelf[];
  items: { i: number; x: number; y: number }[];
}

/**
 * Pieces of the given footprints (width, depth) onto plates of the size of the bed: in rows,
 * the deep pieces first, as many on a plate as fit with a gap between them. A piece that
 * fills the plate gets one of its own. The pieces on a plate are moved together so that the
 * group sits in the middle of the plate. A piece larger than the plate sits alone and
 * centred (it does not fit; the bed check says so). The result is in the order of `sizes`.
 */
export const packPieces = (
  sizes: readonly [number, number][],
  bed: [number, number],
): Packed[] => {
  const plates: Plate[] = [];
  const [maxW, maxH] = [bed[0] - 2 * PACK_MARGIN, bed[1] - 2 * PACK_MARGIN];
  const order = sizes
    .map((size, i) => ({ size, i }))
    .sort((a, b) => b.size[1] - a.size[1] || b.size[0] - a.size[0]);
  const placeOn = (plate: Plate, i: number, [w, d]: [number, number]): boolean => {
    if (plate.full) return false;
    for (const shelf of plate.shelves) {
      if (d <= shelf.h + 1e-9 && shelf.x + w <= maxW + 1e-9) {
        plate.items.push({ i, x: shelf.x, y: shelf.y });
        shelf.x += w + PACK_GAP;
        return true;
      }
    }
    const last = plate.shelves.at(-1);
    const y = last ? last.y + last.h + PACK_GAP : 0;
    if (w <= maxW + 1e-9 && y + d <= maxH + 1e-9) {
      plate.shelves.push({ y, h: d, x: w + PACK_GAP });
      plate.items.push({ i, x: 0, y });
      return true;
    }
    return false;
  };
  for (const { size, i } of order) {
    let done = false;
    for (const plate of plates) {
      done = placeOn(plate, i, size);
      if (done) break;
    }
    if (!done) {
      const plate: Plate = { full: false, shelves: [], items: [] };
      plates.push(plate);
      // too large for any plate: alone, centred
      if (!placeOn(plate, i, size)) {
        plate.items.push({ i, x: 0, y: 0 });
        plate.full = true;
      }
    }
  }
  const result: Packed[] = sizes.map(() => ({ plate: 0, cx: 0, cy: 0 }));
  plates.forEach((plate, p) => {
    let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
    for (const { i, x, y } of plate.items) {
      const [w, d] = sizes[i] as [number, number];
      [x0, y0] = [Math.min(x0, x), Math.min(y0, y)];
      [x1, y1] = [Math.max(x1, x + w), Math.max(y1, y + d)];
    }
    const shiftX = (bed[0] - (x1 - x0)) / 2 - x0;
    const shiftY = (bed[1] - (y1 - y0)) / 2 - y0;
    for (const { i, x, y } of plate.items) {
      const [w, d] = sizes[i] as [number, number];
      result[i] = { plate: p, cx: x + shiftX + w / 2, cy: y + shiftY + d / 2 };
    }
  });
  return result;
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
