// Turns lid parameters into plain mesh data for the preview and the exporters.
// Runs inside the worker; also used directly by the tests.
import type { Manifold } from "manifold-3d";
import { validateBaseplate, type BaseplateParams } from "../model/baseplateParams";
import { validateBin, type BinParams } from "../model/binParams";
import { validateLid, type LidParams } from "../model/lidParams";
import { buildBaseplate, tileRegions } from "./baseplate";
import { buildBin } from "./bin";
import { buildBinLabel, placeInBin } from "./binLabel";
import { buildConnector } from "./connector";
import { variantOf, type Connectable } from "../gridfinity/connector";
import { validateLabel, type LabelParams } from "../model/labelParams";
import type { LabelAssets } from "./label";
import { buildLid, type LabelArea } from "./lid";
import { Scope, type Kernel } from "./kernel";

export type PartName = "plate" | "lip" | "text" | "symbol";

export interface PartMesh {
  name: PartName;
  /** a colour of its own, for parts that are only shown (the label in the bin) */
  colour?: string;
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
  /** only shown in the preview, never exported: the label placed in the bin */
  extras?: PartMesh[];
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

/** A connector for baseplates (variant 1: owner, 11 November 2026). */
export const buildConnectorModel = (
  kernel: Kernel,
  variant: Connectable,
): ModelMesh => {
  const v = variantOf(variant);
  if (!v) throw new Error("Choose a connector variant.");
  const scope = new Scope();
  try {
    return toModelMesh(
      kernel,
      scope,
      [["plate", buildConnector(kernel, scope, v)]],
      [],
    );
  } finally {
    scope.dispose();
  }
};

/** The label of a bin (E-09): plate and text as separate parts. */
export const buildLabelModel = (
  kernel: Kernel,
  bin: BinParams,
  label: LabelParams,
  assets: LabelAssets = {},
): ModelMesh => {
  const errors = validateLabel(bin, label);
  if (errors.length > 0) throw new Error(errors.join(" "));

  const scope = new Scope();
  try {
    const parts = buildBinLabel(kernel, scope, bin, label, assets);
    const named: [PartName, Manifold][] = [["plate", parts.plate]];
    if (parts.text) named.push(["text", parts.text]);
    if (parts.symbol) named.push(["symbol", parts.symbol]);
    return toModelMesh(kernel, scope, named, parts.warnings);
  } finally {
    scope.dispose();
  }
};

/**
 * The bin. With `label`, the label is also shown in its place in the bin (preview only: it
 * is not part of the bin's file and does not count in its size).
 */
export const buildBinModel = (
  kernel: Kernel,
  params: BinParams,
  label?: LabelParams,
  assets: LabelAssets = {},
): ModelMesh => {
  const errors = validateBin(params);
  if (errors.length > 0) throw new Error(errors.join(" "));

  const scope = new Scope();
  try {
    const { body, lip } = buildBin(kernel, scope, params);
    const named: [PartName, Manifold][] = [["plate", body]];
    if (lip) named.push(["lip", lip]);
    const model = toModelMesh(kernel, scope, named, []);
    if (label && params.label_slot !== "none") {
      const problems = validateLabel(params, label);
      if (problems.length > 0) {
        model.warnings.push(`The label is not shown: ${problems.join(" ")}`);
      } else {
        let parts;
        try {
          parts = buildBinLabel(kernel, scope, params, label, assets);
        } catch (error) {
          model.warnings.push(
            `The label is not shown: ${error instanceof Error ? error.message : String(error)}`,
          );
          return model;
        }
        const placed = placeInBin(scope, params, parts);
        model.extras = [
          { ...toPartMesh("plate", placed.plate), colour: label.plate_color },
          ...(placed.text
            ? [{ ...toPartMesh("text", placed.text), colour: label.text_color }]
            : []),
          ...(placed.symbol
            ? [{ ...toPartMesh("symbol", placed.symbol), colour: label.symbol_color }]
            : []),
        ];
        model.warnings.push(...parts.warnings);
      }
    }
    return model;
  } finally {
    scope.dispose();
  }
};
