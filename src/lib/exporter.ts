// Turns the built model into a file and hands it to the user.
import { writeStl } from "../export/stl";
import { write3mfPlates } from "../export/slicer3mf";
import type { PartColours } from "../export/threeMf";
import {
  shifted,
  type ModelMesh,
  type PartMesh,
  type TileMesh,
} from "../geometry/model";
import { centreOf, tileOffsets } from "../export/tileLayout";
import { zip } from "../export/zip";

export type Format = "3mf" | "stl";

interface SaveFilePickerWindow {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<{
    createWritable: () => Promise<{
      write: (data: Blob) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
}

export const hasSavePicker = (): boolean =>
  typeof (window as SaveFilePickerWindow).showSaveFilePicker === "function";

const MIME: Record<Format, string> = {
  "3mf": "model/3mf",
  stl: "model/stl",
};

export const buildFile = async (
  format: Format,
  model: ModelMesh,
  colours: PartColours,
  title: string,
  bodyName: string,
  bed: [number, number] = [256, 256],
): Promise<Blob> => {
  const data =
    format === "stl"
      ? new Uint8Array(writeStl(model.parts))
      : await write3mfPlates(
          [{ parts: model.parts, name: title }],
          colours,
          bed,
          title,
          bodyName,
        );
  return new Blob([data as BlobPart], { type: MIME[format] });
};

/**
 * Every piece of a split baseplate in ONE file, each as its own object. In a 3MF every piece
 * has its own plate, in the plate grid of the bed; an STL holds the meshes in a grid with one
 * bed per piece (see `tileOffsets`).
 */
export const buildTilesFile = async (
  format: Format,
  tiles: readonly TileMesh[],
  colours: PartColours,
  title: string,
  bodyName: string,
  bed: [number, number],
): Promise<Blob> => {
  const data =
    format === "stl"
      ? new Uint8Array(
          writeStl(
            tileOffsets(
              tiles.map((tile) => centreOf(tile.parts)),
              bed,
            ).flatMap((offset, i) =>
              (tiles[i]?.parts ?? []).map((part) => shifted(part, ...offset)),
            ),
          ),
        )
      : await write3mfPlates(
          tiles.map((tile, i) => ({
            parts: tile.parts,
            name: `${title} ${i + 1} of ${tiles.length}`,
          })),
          colours,
          bed,
          title,
          bodyName,
        );
  return new Blob([data as BlobPart], { type: MIME[format] });
};

/**
 * Every piece of a split baseplate as its own file, all in one ZIP. The pieces keep their
 * place in the plate; the slicer centres each one itself.
 */
export const buildTilesZip = async (
  format: Format,
  tiles: readonly TileMesh[],
  colours: PartColours,
  title: string,
  bodyName: string,
  fileName: string,
  bed: [number, number] = [256, 256],
): Promise<Blob> => {
  const entries = await Promise.all(
    tiles.map(async (tile, i) => ({
      name: `${fileName}-${i + 1}-of-${tiles.length}.${format}`,
      data:
        format === "stl"
          ? new Uint8Array(writeStl(tile.parts))
          : await write3mfPlates(
              [{ parts: tile.parts, name: `${title} ${i + 1} of ${tiles.length}` }],
              colours,
              bed,
              `${title} ${i + 1} of ${tiles.length}`,
              bodyName,
            ),
    })),
  );
  const archive = await zip(entries);
  return new Blob([archive as BlobPart], { type: "application/zip" });
};

/**
 * Every part of a model as its own STL file, all in one ZIP (STL holds no colours, so the
 * slicer needs plate and text apart to give them filaments): `name-plate.stl`, `name-text.stl`.
 */
export const buildPartsZip = async (
  parts: readonly PartMesh[],
  fileName: string,
): Promise<Blob> => {
  const note = [
    "These STL files are the parts of ONE object (they keep their place to each other).",
    "In Bambu Studio select all of them at once when you import, and answer YES to",
    "'Load as a single object with multiple parts', so that Arrange keeps them together.",
    "The 3MF export holds the same parts as one object already, with their colours.",
    "",
  ].join(String.fromCharCode(10));
  const archive = await zip([
    ...parts.map((part) => ({
      name: `${fileName}-${part.name}.stl`,
      data: new Uint8Array(writeStl([part])),
    })),
    { name: "read-me.txt", data: new TextEncoder().encode(note) },
  ]);
  return new Blob([archive as BlobPart], { type: "application/zip" });
};

/** Saves with the folder picker where the browser has one, else as a download. */
export const saveBlob = async (
  blob: Blob,
  fileName: string,
  description: string,
  mimeToExtensions: Record<string, string[]>,
): Promise<boolean> => {
  const picker = (window as SaveFilePickerWindow).showSaveFilePicker;
  if (picker) {
    try {
      const handle = await picker({
        suggestedName: fileName,
        types: [{ description, accept: mimeToExtensions }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return false;
      throw error;
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return true;
};

export const exportExtensions = (format: Format): Record<string, string[]> => ({
  [MIME[format]]: [`.${format}`],
});
