// Turns the built model into a file and hands it to the user.
import { writeStl } from "../export/stl";
import { write3mf, type PartColours } from "../export/threeMf";
import type { ModelMesh } from "../geometry/model";

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
): Promise<Blob> => {
  const data =
    format === "stl"
      ? new Uint8Array(writeStl(model.parts))
      : await write3mf(model.parts, colours, title);
  return new Blob([data as BlobPart], { type: MIME[format] });
};

/** Saves with the folder picker where the browser has one, else as a download. */
export const saveBlob = async (
  blob: Blob,
  fileName: string,
  description: string,
  mimeToExtensions: Record<string, string[]>,
): Promise<void> => {
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
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      throw error;
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

export const exportExtensions = (format: Format): Record<string, string[]> => ({
  [MIME[format]]: [`.${format}`],
});
