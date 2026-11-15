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
import { PACK_GAP, packPieces, sizeOfFootprint } from "./tileLayout";
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
/** a flat piece of 250 x 250 mm: it fills a plate of the bed */
const big = (): PartMesh => ({
  name: "plate",
  positions: Float32Array.from([
    -125, -125, 0, 125, -125, 0, 125, 125, 0, -125, 125, 0,
  ]),
  indices: Uint32Array.from([0, 1, 2, 0, 2, 3]),
  volume: 0,
});
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
    // three small pieces fit on one plate
    expect(settings.match(/<plate>/g)).toHaveLength(1);
    for (const id of built) {
      expect(settings).toContain(`key="object_id" value="${id}"`);
    }
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
    const [w, d] = sizeOfFootprint(parts);
    const xs = items.map((m) => Number(m[1]));
    const ys = items.map((m) => Number(m[2]));
    // both stand on the first plate (0 to 256), not in another cell of the grid
    for (const x of xs) {
      expect(x - w / 2).toBeGreaterThanOrEqual(0);
      expect(x + w / 2).toBeLessThanOrEqual(256);
    }
    for (const y of ys) {
      expect(y - d / 2).toBeGreaterThanOrEqual(0);
      expect(y + d / 2).toBeLessThanOrEqual(256);
    }
    // the group of the two is centred on the plate
    expect((Math.min(...xs) + Math.max(...xs)) / 2).toBeCloseTo(128, 1);
    expect((Math.min(...ys) + Math.max(...ys)) / 2).toBeCloseTo(128, 1);
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

  it("a split baseplate: a piece that fills the plate gets a plate of its own, in one file and in a ZIP of files", async () => {
    const tile = (): { parts: PartMesh[]; size: [number, number, number] } => ({
      parts: [big()],
      size: [250, 250, 1],
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

describe("packing pieces onto plates (owner, 15 November 2026)", () => {
  const sizes: [number, number][] = [
    [100, 50],
    [80, 40],
    [60, 60],
  ];

  it("small pieces share one plate and stay inside it", () => {
    const at = packPieces(sizes, [256, 256]);
    expect(new Set(at.map((p) => p.plate))).toEqual(new Set([0]));
    sizes.forEach(([w, d], i) => {
      const p = at[i] as (typeof at)[number];
      expect(p.cx - w / 2).toBeGreaterThanOrEqual(0);
      expect(p.cx + w / 2).toBeLessThanOrEqual(256);
      expect(p.cy - d / 2).toBeGreaterThanOrEqual(0);
      expect(p.cy + d / 2).toBeLessThanOrEqual(256);
    });
  });

  it("a piece that fills the plate gets one of its own; the small ones stay together", () => {
    const at = packPieces(
      [
        [250, 250],
        [40, 40],
        [40, 40],
      ],
      [256, 256],
    );
    expect(at[0]?.plate).not.toBe(at[1]?.plate);
    expect(at[1]?.plate).toBe(at[2]?.plate);
    expect(at[0]?.cx).toBeCloseTo(128, 6);
    expect(at[0]?.cy).toBeCloseTo(128, 6);
  });

  it("no two pieces on a plate overlap or come closer than the gap", () => {
    const many: [number, number][] = [
      [120, 80],
      [120, 80],
      [120, 80],
      [60, 60],
      [60, 60],
      [200, 30],
    ];
    const at = packPieces(many, [256, 256]);
    for (let i = 0; i < many.length; i++) {
      for (let j = i + 1; j < many.length; j++) {
        const [a, b] = [at[i], at[j]] as [(typeof at)[number], (typeof at)[number]];
        if (a.plate !== b.plate) continue;
        const [sa, sb] = [many[i], many[j]] as [[number, number], [number, number]];
        const apartX = Math.abs(a.cx - b.cx) >= (sa[0] + sb[0]) / 2 + PACK_GAP - 1e-6;
        const apartY = Math.abs(a.cy - b.cy) >= (sa[1] + sb[1]) / 2 + PACK_GAP - 1e-6;
        expect(apartX || apartY, i + " and " + j).toBe(true);
      }
    }
  });
});
