// A set (ADR-0009) as one model: what the assembly view shows (every part in its place on the
// baseplate, bins with their labels and lids) and the pieces for export (every part in its
// own print position, as in a split baseplate). Runs inside the worker; the tests call it
// directly.
import type { BaseplateParams } from "../model/baseplateParams";
import type { BinParams } from "../model/binParams";
import { validateLabel, type LabelParams } from "../model/labelParams";
import type { LidParams } from "../model/lidParams";
import { footprint, lidOfBin } from "../model/setParams";
import { layoutOf as plateLayout } from "./baseplate";
import { layoutOf as binLayout } from "./bin";
import {
  buildBaseplateModel,
  buildBinModel,
  buildLabelModel,
  buildModel,
  type ModelMesh,
  type PartMesh,
  type PartName,
  type TileMesh,
} from "./model";
import type { LabelAssets } from "./label";
import { CONSTANTS } from "../gridfinity/constants";

const GRID = CONSTANTS.grid.value;

/** One bin of the set as the worker gets it, with the assets of its label and its lid. */
export interface AssemblyBin {
  name: string;
  bin: BinParams;
  label: LabelParams;
  lidOn: boolean;
  lid: LidParams;
  col: number;
  row: number;
  turned: boolean;
  labelAssets?: LabelAssets;
  lidAssets?: LabelAssets;
  /** the font or SVG of the label (or lid) could not be read: it is left out, with this note */
  labelError?: string;
  lidError?: string;
}

export interface AssemblyInput {
  plate: BaseplateParams;
  bins: readonly AssemblyBin[];
  /** printable width and depth: a baseplate with `split_to_bed` is cut for export */
  maxTile?: [number, number];
}

type Colours = Record<PartName, string>;

/** Moves a part (and turns it by 90 degrees about z first), into fresh buffers. */
const placed = (
  part: PartMesh,
  turn: boolean,
  dx: number,
  dy: number,
  dz: number,
  colour?: string,
): PartMesh => {
  const positions = Float32Array.from(part.positions);
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i] ?? 0;
    const y = positions[i + 1] ?? 0;
    positions[i] = (turn ? -y : x) + dx;
    positions[i + 1] = (turn ? x : y) + dy;
    positions[i + 2] = (positions[i + 2] ?? 0) + dz;
  }
  // a turn by 90 degrees keeps the order of the corners (it is no mirror image)
  return {
    ...part,
    ...(colour ? { colour } : {}),
    positions,
    indices: Uint32Array.from(part.indices),
  };
};

const copyOf = (part: PartMesh): PartMesh => placed(part, false, 0, 0, 0);

const bounds = (parts: readonly PartMesh[]) => {
  let [x0, y0, z0, x1, y1, z1] = [
    Infinity,
    Infinity,
    Infinity,
    -Infinity,
    -Infinity,
    -Infinity,
  ];
  for (const part of parts) {
    for (let i = 0; i < part.positions.length; i += 3) {
      const [x, y, z] = [
        part.positions[i] ?? 0,
        part.positions[i + 1] ?? 0,
        part.positions[i + 2] ?? 0,
      ];
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
      z0 = Math.min(z0, z);
      z1 = Math.max(z1, z);
    }
  }
  return { x0, y0, z0, x1, y1, z1 };
};

const sizeOfParts = (parts: readonly PartMesh[]): [number, number, number] => {
  const b = bounds(parts);
  return [b.x1 - b.x0, b.y1 - b.y0, b.z1 - b.z0];
};

const piece = (
  parts: PartMesh[],
  name: string,
  bodyName: string,
  colours: Colours,
): TileMesh => ({ parts, size: sizeOfParts(parts), name, bodyName, colours });

export const buildAssemblyModel = (
  kernel: Parameters<typeof buildModel>[0],
  input: AssemblyInput,
): ModelMesh => {
  const { plate } = input;
  const warnings: string[] = [];
  const preview: PartMesh[] = [];
  const pieces: TileMesh[] = [];
  const plateColour = plate.plate_color;
  const plateColours: Colours = {
    plate: plateColour,
    lip: plateColour,
    text: plateColour,
    symbol: plateColour,
  };

  // the baseplate: whole in the view; for export cut to the bed when it asks for it
  const whole = buildBaseplateModel(kernel, { ...plate, split_to_bed: false });
  const exportPlate =
    plate.split_to_bed && input.maxTile
      ? buildBaseplateModel(kernel, plate, input.maxTile)
      : whole;
  const tiles = exportPlate.tiles ?? [
    { parts: exportPlate.parts, size: exportPlate.size },
  ];
  tiles.forEach((tile, i) =>
    pieces.push(
      piece(
        tile.parts.map(copyOf),
        tiles.length > 1 ? `Base ${i + 1} of ${tiles.length}` : "Base",
        "Base",
        plateColours,
      ),
    ),
  );
  for (const part of whole.parts)
    preview.push({ ...copyOf(part), colour: plateColour });

  const box = bounds(whole.parts);
  const layout = plateLayout(plate);
  const floorZ = box.z0 + layout.base;

  for (const item of input.bins) {
    const [w, d] = footprint(item.bin, item.turned);
    // the middle of the cells the bin covers; row 0 is the back (the top seen from above)
    const cx = box.x0 + layout.gridX + (item.col + w / 2) * GRID;
    const cy = box.y1 - layout.gridY - (item.row + d / 2) * GRID;
    const hasLabel = item.bin.label_slot !== "none";
    const labelProblems = hasLabel ? validateLabel(item.bin, item.label) : [];
    const showLabel = hasLabel && labelProblems.length === 0 && !item.labelError;

    const bin = buildBinModel(
      kernel,
      item.bin,
      showLabel ? item.label : undefined,
      showLabel ? (item.labelAssets ?? {}) : {},
    );
    warnings.push(...bin.warnings.map((w) => `${item.name}: ${w}`));
    if (hasLabel && !showLabel) {
      const why = item.labelError ?? labelProblems.join(" ");
      warnings.push(`${item.name}: the label is not shown: ${why}`);
    }
    const binColours: Colours = {
      plate: item.bin.plate_color,
      lip: item.bin.lip_color,
      text: item.bin.plate_color,
      symbol: item.bin.plate_color,
    };
    for (const part of bin.parts) {
      preview.push(placed(part, item.turned, cx, cy, floorZ, binColours[part.name]));
    }
    for (const part of bin.extras ?? []) {
      preview.push(placed(part, item.turned, cx, cy, floorZ));
    }
    pieces.push(piece(bin.parts.map(copyOf), item.name, "Bin", binColours));

    if (showLabel) {
      const label = buildLabelModel(
        kernel,
        item.bin,
        item.label,
        item.labelAssets ?? {},
      );
      pieces.push(
        piece(label.parts.map(copyOf), `${item.name} label`, "Label", {
          plate: item.label.plate_color,
          lip: item.label.plate_color,
          text: item.label.text_color,
          symbol: item.label.symbol_color,
        }),
      );
    }

    if (item.lidOn && item.lidError) {
      warnings.push(`${item.name}: the lid is not shown: ${item.lidError}`);
    } else if (item.lidOn) {
      const lid = lidOfBin(item.bin, item.lid);
      const lidColours: Colours = {
        plate: lid.plate_color,
        lip: lid.lip_color,
        text: lid.text_color,
        symbol: lid.symbol_color,
      };
      const printed = buildModel(kernel, lid, item.lidAssets ?? {});
      warnings.push(...printed.warnings.map((w) => `${item.name} lid: ${w}`));
      pieces.push(
        piece(printed.parts.map(copyOf), `${item.name} lid`, "Lid", lidColours),
      );
      // in the view the lid stands on the bin, foot down, whatever way it is printed
      const standing =
        lid.print_orientation === "foot_down"
          ? printed
          : buildModel(
              kernel,
              { ...lid, print_orientation: "foot_down" },
              item.lidAssets ?? {},
            );
      // like a bin on a bin: the foot goes down into the stacking lip, so it stands on the
      // top of the body; a bin without a lip carries the lid on its top edge
      const stack = binLayout(item.bin);
      const topZ =
        floorZ + (item.bin.lip_style === "with_lip" ? stack.bodyHeight : stack.top);
      for (const part of standing.parts) {
        preview.push(placed(part, item.turned, cx, cy, topZ, lidColours[part.name]));
      }
    }
  }

  // the size is that of the largest piece, so the bed check asks whether each piece fits
  const size: [number, number, number] = [0, 0, 0];
  for (const p of pieces) {
    for (let i = 0; i < 3; i++) size[i] = Math.max(size[i] ?? 0, p.size[i] ?? 0);
  }
  return { parts: preview, tiles: pieces, size, warnings };
};
