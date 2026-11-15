import { inflateRawSync } from "node:zlib";
import { beforeAll, describe, expect, it } from "vitest";
import { buildAssemblyModel } from "../geometry/assembly";
import { initKernel, type Kernel } from "../geometry/kernel";
import { buildTilesFile, buildTilesZip } from "../lib/exporter";
import { DEFAULT_BASEPLATE } from "../model/baseplateParams";
import { newSetBin } from "../model/setParams";
import { writeStl } from "./stl";

let kernel: Kernel;
beforeAll(async () => {
  kernel = await initKernel();
});

/** The files of a ZIP written by `zip()`. */
const unzip = (bytes: Uint8Array): Record<string, string> => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const files: Record<string, string> = {};
  const end = bytes.length - 22;
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  for (let i = 0; i < count; i++) {
    const method = view.getUint16(at + 10, true);
    const size = view.getUint32(at + 20, true);
    const nameLength = view.getUint16(at + 28, true);
    const offset = view.getUint32(at + 42, true);
    const name = new TextDecoder().decode(
      bytes.subarray(at + 46, at + 46 + nameLength),
    );
    const dataStart = offset + 30 + view.getUint16(offset + 26, true);
    const raw = bytes.subarray(dataStart, dataStart + size);
    files[name] = new TextDecoder().decode(
      method === 8 ? new Uint8Array(inflateRawSync(raw)) : raw,
    );
    at += 46 + nameLength;
  }
  return files;
};

const bytesOf = async (blob: Blob) => new Uint8Array(await blob.arrayBuffer());

const set = () => {
  const screws = newSetBin(0, 0);
  screws.name = "Screws";
  screws.bin.plate_color = "#123456";
  screws.bin.label_slot = "none";
  screws.lidOn = true;
  screws.lid.plate_color = "#abcdef";
  const nuts = newSetBin(1, 0);
  nuts.name = "Nuts";
  nuts.bin.label_slot = "none";
  const model = buildAssemblyModel(kernel, {
    plate: { ...DEFAULT_BASEPLATE, units_x: 3, units_y: 2 },
    bins: [screws, nuts],
  });
  return model;
};

const COLOURS = {
  plate: "#000000",
  lip: "#000000",
  text: "#000000",
  symbol: "#000000",
};
const BED: [number, number] = [256, 256];

describe("exporting a set (ADR-0009)", () => {
  it("as a set: one 3MF, every part its own object with its own name and colours", async () => {
    const model = set();
    const blob = await buildTilesFile(
      "3mf",
      model.tiles ?? [],
      COLOURS,
      "Set",
      "Assembly",
      BED,
    );
    const xml = unzip(await bytesOf(blob))["3D/3dmodel.model"] as string;
    // a root object for each piece: the plate, two bins and one lid
    for (const name of ["Base", "Screws", "Nuts", "Screws lid"]) {
      expect(xml).toContain(`name="${name}" type="model"><components>`);
    }
    expect(xml).toContain('color="#123456"');
    expect(xml).toContain('color="#ABCDEF"');
    // the pieces are small: they all stand on one plate, in the settings of the slicer
    const settings = unzip(await bytesOf(blob))[
      "Metadata/model_settings.config"
    ] as string;
    expect(settings.match(/<plate>/g)).toHaveLength(1);
    expect(settings.match(/<model_instance>/g)).toHaveLength(4);
  });

  it("names the main part of a piece after what it is", async () => {
    const model = set();
    const blob = await buildTilesFile(
      "3mf",
      model.tiles ?? [],
      COLOURS,
      "Set",
      "Assembly",
      BED,
    );
    const xml = unzip(await bytesOf(blob))["3D/3dmodel.model"] as string;
    expect(xml).toContain('name="Base" type="model" pid=');
    expect(xml).toContain('name="Bin" type="model" pid=');
    expect(xml).toContain('name="Lid" type="model" pid=');
  });

  it("loose: one file for every part, in order, in a ZIP", async () => {
    const model = set();
    const blob = await buildTilesZip(
      "3mf",
      model.tiles ?? [],
      COLOURS,
      "Set",
      "Assembly",
      "set",
      BED,
    );
    expect(Object.keys(unzip(await bytesOf(blob)))).toEqual([
      "01-base.3mf",
      "02-screws.3mf",
      "03-screws-lid.3mf",
      "04-nuts.3mf",
    ]);
  });

  it("loose as STL: the same files, each a valid binary STL", async () => {
    const model = set();
    const blob = await buildTilesZip(
      "stl",
      model.tiles ?? [],
      COLOURS,
      "Set",
      "Assembly",
      "set",
      BED,
    );
    const files = unzip(await bytesOf(blob));
    expect(Object.keys(files)).toEqual([
      "01-base.stl",
      "02-screws.stl",
      "03-screws-lid.stl",
      "04-nuts.stl",
    ]);
    // every file holds a mesh (a binary STL has an 80 byte header and 50 bytes per triangle)
    expect(writeStl(model.tiles?.[3]?.parts ?? []).byteLength).toBeGreaterThan(1000);
    for (const text of Object.values(files)) expect(text.length).toBeGreaterThan(1000);
  });

  it("keeps two bins with the same name apart in a ZIP", async () => {
    const a = newSetBin(0, 0);
    const b = newSetBin(1, 0);
    a.bin.label_slot = b.bin.label_slot = "none";
    const model = buildAssemblyModel(kernel, {
      plate: { ...DEFAULT_BASEPLATE, units_x: 2 },
      bins: [a, b],
    });
    const blob = await buildTilesZip(
      "stl",
      model.tiles ?? [],
      COLOURS,
      "Set",
      "Assembly",
      "set",
      BED,
    );
    expect(new Set(Object.keys(unzip(await bytesOf(blob)))).size).toBe(3);
  });
});
