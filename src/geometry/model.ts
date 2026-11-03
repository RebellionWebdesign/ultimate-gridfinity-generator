// Turns lid parameters into plain mesh data for the preview and the exporters.
// Runs inside the worker; also used directly by the tests.
import type { Manifold } from "manifold-3d";
import { validateBaseplate, type BaseplateParams } from "../model/baseplateParams";
import { validateBin, type BinParams } from "../model/binParams";
import { validateLid, type LidParams } from "../model/lidParams";
import { buildBaseplate, tileRegions } from "./baseplate";
import { buildBin } from "./bin";
import type { LabelAssets } from "./label";
import { buildLid, type LabelArea } from "./lid";
import { Scope, type Kernel } from "./kernel";

export type PartName = "plate" | "lip" | "text" | "symbol";

export interface PartMesh {
  name: PartName;
  /** x, y, z per vertex */
  positions: Float32Array;
  /** three vertex indices per triangle */
  indices: Uint32Array;
  volume: number;
}

/** One piece of a split baseplate, as it is exported: in its place in the whole plate. */
export interface TileMesh {
  parts: PartMesh[];
  size: [number, number, number];
}

export interface ModelMesh {
  /** what the preview shows; the pieces of a split plate are moved apart a little */
  parts: PartMesh[];
  /** only for a split baseplate: every piece for export */
  tiles?: TileMesh[];
  /** overall size in mm: x, y, z */
  size: [number, number, number];
  /** hints for the user (for example engraved text that is too wide), not errors */
  warnings: string[];
  /** the plate area labels may use, only when a text or symbol is shown */
  labelArea?: LabelArea;
}

const toPartMesh = (name: PartName, m: Manifold): PartMesh => {
  const mesh = m.getMesh();
  const count = mesh.vertProperties.length / mesh.numProp;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = mesh.vertProperties[i * mesh.numProp] ?? 0;
    positions[i * 3 + 1] = mesh.vertProperties[i * mesh.numProp + 1] ?? 0;
    positions[i * 3 + 2] = mesh.vertProperties[i * mesh.numProp + 2] ?? 0;
  }
  return {
    name,
    positions,
    indices: Uint32Array.from(mesh.triVerts),
    volume: m.volume(),
  };
};

const toModelMesh = (
  kernel: Kernel,
  scope: Scope,
  named: [PartName, Manifold][],
  warnings: string[],
  labelArea?: LabelArea,
): ModelMesh => {
  const all = scope.add(kernel.Manifold.compose(named.map(([, m]) => m)));
  const { min, max } = all.boundingBox();
  return {
    parts: named.map(([name, m]) => toPartMesh(name, m)),
    size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]],
    warnings,
    labelArea,
  };
};

export const buildModel = (
  kernel: Kernel,
  params: LidParams,
  assets: LabelAssets = {},
): ModelMesh => {
  const errors = validateLid(params);
  if (errors.length > 0) throw new Error(errors.join(" "));

  const scope = new Scope();
  try {
    const lid = buildLid(kernel, scope, params, assets);
    const named: [PartName, Manifold][] = [["plate", lid.plate]];
    if (lid.lip) named.push(["lip", lid.lip]);
    if (lid.text) named.push(["text", lid.text]);
    if (lid.symbol) named.push(["symbol", lid.symbol]);
    return toModelMesh(kernel, scope, named, lid.warnings, lid.labelArea);
  } finally {
    scope.dispose();
  }
};

/** How far the pieces of a split plate are moved apart in the preview (mm). */
export const TILE_GAP = 12;

export const shifted = (part: PartMesh, dx: number, dy: number): PartMesh => {
  const positions = Float32Array.from(part.positions);
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = (positions[i] ?? 0) + dx;
    positions[i + 1] = (positions[i + 1] ?? 0) + dy;
  }
  // own copies: the preview and the export parts are sent to the page separately
  return { ...part, positions, indices: Uint32Array.from(part.indices) };
};

/**
 * The baseplate. With `maxTile` (the printable width and depth) and `split_to_bed`, a plate
 * that is larger is cut into pieces that each fit; `size` is then that of the largest piece,
 * so the bed check asks whether one piece fits.
 */
export const buildBaseplateModel = (
  kernel: Kernel,
  params: BaseplateParams,
  maxTile?: [number, number],
): ModelMesh => {
  const errors = validateBaseplate(params);
  if (errors.length > 0) throw new Error(errors.join(" "));

  const scope = new Scope();
  try {
    const regions = params.split_to_bed && maxTile ? tileRegions(params, maxTile) : [];
    if (regions.length <= 1) {
      const plate = buildBaseplate(kernel, scope, params);
      return toModelMesh(kernel, scope, [["plate", plate]], []);
    }
    const tiles: TileMesh[] = [];
    const preview: PartMesh[] = [];
    let size: [number, number, number] = [0, 0, 0];
    for (const region of regions) {
      const tile = buildBaseplate(kernel, scope, params, region);
      const { min, max } = tile.boundingBox();
      const tileSize: [number, number, number] = [
        max[0] - min[0],
        max[1] - min[1],
        max[2] - min[2],
      ];
      size = [
        Math.max(size[0], tileSize[0]),
        Math.max(size[1], tileSize[1]),
        Math.max(size[2], tileSize[2]),
      ];
      const part = toPartMesh("plate", tile);
      tiles.push({ parts: [part], size: tileSize });
      // moved apart from the middle of the plate, so the pieces can be told apart
      preview.push(
        shifted(
          part,
          (region.col - (region.cols - 1) / 2) * TILE_GAP,
          (region.row - (region.rows - 1) / 2) * TILE_GAP,
        ),
      );
    }
    return { parts: preview, tiles, size, warnings: [] };
  } finally {
    scope.dispose();
  }
};

export const buildBinModel = (kernel: Kernel, params: BinParams): ModelMesh => {
  const errors = validateBin(params);
  if (errors.length > 0) throw new Error(errors.join(" "));

  const scope = new Scope();
  try {
    const { body, lip } = buildBin(kernel, scope, params);
    const named: [PartName, Manifold][] = [["plate", body]];
    if (lip) named.push(["lip", lip]);
    return toModelMesh(kernel, scope, named, []);
  } finally {
    scope.dispose();
  }
};
