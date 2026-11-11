import { readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import { beforeAll, describe, expect, it } from "vitest";
import lucideIcons from "../data/lucideLidIcons.json";
import { prepareAssets, type AssetLoaders } from "../geometry/assets";
import { initKernel, type Kernel } from "../geometry/kernel";
import { buildLabelModel, type PartMesh } from "../geometry/model";
import { newBin } from "../model/binParams";
import { DEFAULT_LABEL, labelAsLid } from "../model/labelParams";
import { buildFile, buildTilesFile, buildTilesZip } from "../lib/exporter";
import { objectIdsOf, plateCentre, write3mfPlates } from "./slicer3mf";
import type { PartColours } from "./threeMf";
import { crc32 } from "./zip";

const loaders: AssetLoaders = {
  fontBytes: async () => {
    const file = readFileSync(new URL("../fonts/Inter-Regular.otf", import.meta.url));
    return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
  },
  icons: async () => lucideIcons,
};

let kernel: Kernel;
let parts: PartMesh[];
beforeAll(async () => {
  kernel = await initKernel();
  const label = { ...DEFAULT_LABEL, text_mode: "raised" as const, text_string: "M3" };
  parts = buildLabelModel(
    kernel,
    newBin(),
    label,
    await prepareAssets(labelAsLid(label), loaders),
  ).parts;
});

const colours: PartColours = {
  plate: "#9DA39A",
  lip: "#9DA39A",
  text: "#112233",
  symbol: "#112233",
};

const unzip = (bytes: Uint8Array): Record<string, string> => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const files: Record<string, string> = {};
  const end = bytes.length - 22;
  expect(view.getUint32(end, true)).toBe(0x06054b50);
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  for (let i = 0; i < count; i++) {
    const method = view.getUint16(at + 10, true);
    const crc = view.getUint32(at + 16, true);
    const size = view.getUint32(at + 20, true);
    const nameLength = view.getUint16(at + 28, true);
    const offset = view.getUint32(at + 42, true);
    const name = new TextDecoder().decode(
      bytes.subarray(at + 46, at + 46 + nameLength),
    );
    const dataStart = offset + 30 + view.getUint16(offset + 26, true);
    const raw = bytes.subarray(dataStart, dataStart + size);
    const data = method === 8 ? new Uint8Array(inflateRawSync(raw)) : raw;
    expect(crc32(data)).toBe(crc);
    files[name] = new TextDecoder().decode(data);
    at += 46 + nameLength;
  }
  return files;
};

const BED: [number, number] = [256, 256];
const piece = (name: string) => ({ parts, name });
const blobBytes = async (blob: Blob) => new Uint8Array(await blob.arrayBuffer());

describe("the 3MF: colours as before, plus a plate per piece (owner, 11 November 2026)", () => {
  it("carries the colours of the parts and the plates, but no printer or filament settings", async () => {
    const files = unzip(
      await write3mfPlates([piece("Label")], colours, BED, "Label", "Label"),
    );
    expect(Object.keys(files).sort()).toEqual([
      "3D/3dmodel.model",
      "Metadata/model_settings.config",
      "[Content_Types].xml",
      "_rels/.rels",
    ]);
    const model = files["3D/3dmodel.model"] as string;
    // the colours the user chose: plate and text each in a colour group, as before
    expect(model).toContain('<m:color color="#9DA39A"/>');
    expect(model).toContain('<m:color color="#112233"/>');
    expect(model.match(/<m:colorgroup /g)).toHaveLength(2);
    // nothing that sets filaments or profiles of the user, and no claim to be a slicer's file
    const all = Object.values(files).join("\n");
    expect(all).not.toMatch(
      /project_settings|filament_colour|filament_settings|raft_first_layer|penetration|key="extruder"|BambuStudio|OrcaSlicer/,
    );
    expect(model).toContain("Ultimate Gridfinity Generator");
  });

  it("plate and text are ONE object with two parts", async () => {
    const files = unzip(
      await write3mfPlates([piece("Label 1")], colours, BED, "Label 1", "Label"),
    );
    const model = files["3D/3dmodel.model"] as string;
    expect(model.match(/<item /g)).toHaveLength(1);
    expect(model.match(/<component /g)).toHaveLength(2);
    expect(model.match(/<mesh>/g)).toHaveLength(2);
    const ids = [...model.matchAll(/<object id="(\d+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every piece has a plate that points at its object in the build", async () => {
    const pieces = [piece("A"), piece("B"), piece("C")];
    const files = unzip(await write3mfPlates(pieces, colours, BED, "T", "Label"));
    const model = files["3D/3dmodel.model"] as string;
    const settings = files["Metadata/model_settings.config"] as string;
    const built = [...model.matchAll(/<item objectid="(\d+)"/g)].map((m) =>
      Number(m[1]),
    );
    expect(built).toEqual(objectIdsOf(pieces));
    expect(settings.match(/<plate>/g)).toHaveLength(3);
    expect(
      [...settings.matchAll(/key="plater_id" value="(\d+)"/g)].map((m) => m[1]),
    ).toEqual(["1", "2", "3"]);
    const plates = settings.split("<plate>").slice(1);
    plates.forEach((plate, k) => {
      expect(plate).toContain(`key="object_id" value="${built[k]}"`);
    });
    // the objects exist in the resources, as objects with components
    for (const id of built) {
      expect(model).toMatch(new RegExp(`<object id="${id}"[^>]*><components>`));
    }
  });

  it("plates sit in the grid of the slicer: a fifth of the bed between them, row by row", () => {
    expect(plateCentre(0, 4, BED)).toEqual([128, 128]);
    expect(plateCentre(1, 4, BED)[0]).toBeCloseTo(435.2, 9);
    expect(plateCentre(2, 4, BED)[1]).toBeCloseTo(-179.2, 9);
    expect(plateCentre(3, 4, BED)).toEqual([
      expect.closeTo(435.2, 9),
      expect.closeTo(-179.2, 9),
    ]);
    expect(plateCentre(2, 3, BED)[0]).toBe(128);
    expect(plateCentre(2, 5, BED)[0]).toBeCloseTo(2 * 307.2 + 128, 9);
    expect(plateCentre(1, 2, [374, 250])[0]).toBeCloseTo(448.8 + 187, 9);
  });

  it("each piece lands in the middle of its plate", async () => {
    const files = unzip(
      await write3mfPlates([piece("A"), piece("B")], colours, BED, "T", "Label"),
    );
    const items = [
      ...(files["3D/3dmodel.model"] as string).matchAll(
        /<item objectid="\d+" transform="1 0 0 0 1 0 0 0 1 ([-\d.e]+) ([-\d.e]+) 0"/g,
      ),
    ];
    expect(items).toHaveLength(2);
    // the parts are centred on x and y: the offset is the middle of the plate
    expect(Number(items[0]?.[1])).toBeCloseTo(128, 1);
    expect(Number(items[1]?.[1])).toBeCloseTo(435.2, 1);
    expect(Number(items[1]?.[2])).toBeCloseTo(128, 1);
  });

  it("the exporter makes the same file for every part; an STL stays geometry only", async () => {
    const model = buildLabelModel(kernel, newBin(), {
      ...DEFAULT_LABEL,
      text_mode: "none",
    });
    const file = unzip(
      await blobBytes(await buildFile("3mf", model, colours, "Label", "Label", BED)),
    );
    expect(file["Metadata/model_settings.config"]).toContain("<plate>");
    expect(file["3D/3dmodel.model"]).toContain("colorgroup");
    const stl = await buildFile("stl", model, colours, "Label", "Label", BED);
    expect(stl.type).toBe("model/stl");
  });

  it("a split baseplate: one plate per piece, in one file and in a ZIP of files", async () => {
    const tile = (): { parts: PartMesh[]; size: [number, number, number] } => ({
      parts: [parts[0] as PartMesh],
      size: [10, 10, 1],
    });
    const tiles = [tile(), tile()];
    const one = unzip(
      await blobBytes(await buildTilesFile("3mf", tiles, colours, "Base", "Base", BED)),
    );
    expect(
      (one["Metadata/model_settings.config"] as string).match(/<plate>/g),
    ).toHaveLength(2);
    const archive = unzip(
      await blobBytes(
        await buildTilesZip("3mf", tiles, colours, "Base", "Base", "base", BED),
      ),
    );
    expect(Object.keys(archive)).toHaveLength(2);
  });
});
