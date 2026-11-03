// Turns the built model into a file and hands it to the user.
import { writeStl } from "../export/stl";
import { write3mf, write3mfPieces, type PartColours } from "../export/threeMf";
import { shifted, type ModelMesh, type TileMesh } from "../geometry/model";
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
): Promise<Blob> => {
  const data =
    format === "stl"
      ? new Uint8Array(writeStl(model.parts))
      : await write3mf(model.parts, colours, title, bodyName);
  return new Blob([data as BlobPart], { type: MIME[format] });
};

/**
 * Every piece of a split baseplate in ONE file, each as its own object, in a grid with one
 * bed per piece (see `tileOffsets`). A 3MF keeps the colours; an STL holds the meshes.
 */
export const buildTilesFile = async (
  format: Format,
  tiles: readonly TileMesh[],
  colours: PartColours,
  title: string,
  bodyName: string,
  bed: [number, number],
): Promise<Blob> => {
  const offsets = tileOffsets(
    tiles.map((tile) => centreOf(tile.parts)),
    bed,
  );
  const data =
    format === "stl"
      ? new Uint8Array(
          writeStl(
            tiles.flatMap((tile, i) =>
              tile.parts.map((part) =>
                shifted(part, ...(offsets[i] as [number, number])),
              ),
            ),
          ),
        )
      : await write3mfPieces(
          tiles.map((tile, i) => ({
            parts: tile.parts,
            name: `${title} ${i + 1} of ${tiles.length}`,
            offset: offsets[i],
          })),
          colours,
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
): Promise<Blob> => {
  const entries = await Promise.all(
    tiles.map(async (tile, i) => ({
      name: `${fileName}-${i + 1}-of-${tiles.length}.${format}`,
      data:
        format === "stl"
          ? new Uint8Array(writeStl(tile.parts))
          : await write3mf(
              tile.parts,
              colours,
              `${title} ${i + 1} of ${tiles.length}`,
              bodyName,
            ),
    })),
  );
  const archive = await zip(entries);
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
