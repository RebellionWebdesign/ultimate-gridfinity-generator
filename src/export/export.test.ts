import { readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import { beforeAll, describe, expect, it } from "vitest";
import lucideIcons from "../data/lucideLidIcons.json";
import { prepareAssets, type AssetLoaders } from "../geometry/assets";
import { initKernel, type Kernel } from "../geometry/kernel";
import {
  buildBaseplateModel,
  buildModel,
  type ModelMesh,
  type PartMesh,
} from "../geometry/model";
import { DEFAULT_BASEPLATE } from "../model/baseplateParams";
import { DEFAULT_LID, type LidParams } from "../model/lidParams";
import { writeStl } from "./stl";
import { write3mf, type PartColours } from "./threeMf";
import { crc32 } from "./zip";

const loaders: AssetLoaders = {
  fontBytes: async () => {
    const file = readFileSync(new URL("../fonts/Inter-Regular.otf", import.meta.url));
    return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
  },
  icons: async () => lucideIcons,
};

let kernel: Kernel;
beforeAll(async () => {
  kernel = await initKernel();
});

const model = async (overrides: Partial<LidParams>): Promise<ModelMesh> => {
  const p = { ...DEFAULT_LID, ...overrides };
  return buildModel(kernel, p, await prepareAssets(p, loaders));
};

const colours: PartColours = {
  plate: "#9DA39A",
  lip: "#336699",
  text: "#000000",
  symbol: "#112233",
};

/** Every edge is used by exactly two triangles, in opposite directions: a closed mesh. */
const edgesAreClosed = (part: PartMesh): boolean => {
  const edges = new Map<string, number>();
  for (let t = 0; t < part.indices.length; t += 3) {
    for (let k = 0; k < 3; k++) {
      const a = part.indices[t + k] ?? 0;
      const b = part.indices[t + ((k + 1) % 3)] ?? 0;
      edges.set(`${a}-${b}`, (edges.get(`${a}-${b}`) ?? 0) + 1);
    }
  }
  return [...edges].every(([key, n]) => {
    const [a, b] = key.split("-");
    return n === 1 && edges.get(`${b}-${a}`) === 1;
  });
};

const signedVolume = (part: PartMesh): number => {
  let v = 0;
  const p = part.positions;
  for (let t = 0; t < part.indices.length; t += 3) {
    const [a, b, c] = [
      part.indices[t]! * 3,
      part.indices[t + 1]! * 3,
      part.indices[t + 2]! * 3,
    ];
    v +=
      (p[a]! * (p[b + 1]! * p[c + 2]! - p[b + 2]! * p[c + 1]!) -
        p[a + 1]! * (p[b]! * p[c + 2]! - p[b + 2]! * p[c]!) +
        p[a + 2]! * (p[b]! * p[c + 1]! - p[b + 1]! * p[c]!)) /
      6;
  }
  return v;
};

/** Reads a ZIP written by `zip()` (central directory, stored or deflated). */
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

describe("B-08 STL", () => {
  it("is a valid binary STL with the right triangle count and bounding box", async () => {
    const m = await model({ units_x: 2 });
    const stl = writeStl(m.parts);
    const view = new DataView(stl);
    const triangles = m.parts.reduce((n, p) => n + p.indices.length / 3, 0);
    expect(stl.byteLength).toBe(84 + 50 * triangles);
    expect(view.getUint32(80, true)).toBe(triangles);
    const xs: number[] = [];
    for (let t = 0; t < triangles; t++) {
      for (let v = 0; v < 3; v++)
        xs.push(view.getFloat32(84 + t * 50 + 12 + v * 12, true));
    }
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(83.5, 3);
  });

  it("normals point outwards (volume from the triangles is positive)", async () => {
    const m = await model({ variant: "stackable" });
    const stl = new DataView(writeStl(m.parts));
    // first triangle normal is unit length
    const n = Math.hypot(
      stl.getFloat32(84, true),
      stl.getFloat32(88, true),
      stl.getFloat32(92, true),
    );
    expect(n).toBeCloseTo(1, 4);
    expect(signedVolume(m.parts[0]!)).toBeCloseTo(m.parts[0]!.volume, 2);
  });
});

describe("B-08 3MF", () => {
  const withLabel: Partial<LidParams> = {
    variant: "stackable",
    lip_color_enabled: true,
    text_mode: "raised",
    text_string: "M3",
    symbol_mode: "raised",
    symbol_icon: "tools_bolt",
  };

  it("is a plain 3MF: three package files, no vendor files", async () => {
    const m = await model(withLabel);
    const files = unzip(await write3mf(m.parts, colours));
    expect(Object.keys(files).sort()).toEqual([
      "3D/3dmodel.model",
      "[Content_Types].xml",
      "_rels/.rels",
    ]);
    expect(files["3D/3dmodel.model"]).not.toMatch(/Bambu|requiredextensions/);
  });

  it("is one object of four separate closed parts, never merged", async () => {
    const m = await model(withLabel);
    expect(m.parts.map((p) => p.name)).toEqual(["plate", "lip", "text", "symbol"]);
    for (const part of m.parts) expect(edgesAreClosed(part), part.name).toBe(true);

    const xml = unzip(await write3mf(m.parts, colours))["3D/3dmodel.model"]!;
    expect(xml.match(/<mesh>/g)).toHaveLength(4);
    expect(xml.match(/<component /g)).toHaveLength(4);
    expect(xml.match(/<item /g)).toHaveLength(1);
    // each part has its own vertex list: no shared vertices
    const counts = [...xml.matchAll(/<vertices>(.*?)<\/vertices>/g)].map(
      (v) => v[1]!.match(/<vertex /g)!.length,
    );
    expect(counts).toEqual(m.parts.map((p) => p.positions.length / 3));
  });

  it("carries each part's colour in a colour group the part points to", async () => {
    const m = await model(withLabel);
    const xml = unzip(await write3mf(m.parts, colours))["3D/3dmodel.model"]!;
    expect(xml).toContain(
      'xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02"',
    );
    const groups = [
      ...xml.matchAll(/<m:colorgroup id="(\d+)"><m:color color="(#[0-9A-F]{6})"\/>/g),
    ];
    expect(groups.map((g) => [Number(g[1]), g[2]])).toEqual([
      [1, "#9DA39A"],
      [2, "#336699"],
      [3, "#000000"],
      [4, "#112233"],
    ]);
    const refs = [...xml.matchAll(/<object id="(\d+)"[^>]*pid="(\d+)" pindex="0"/g)];
    expect(refs.map((r) => [Number(r[1]), Number(r[2])])).toEqual([
      [5, 1],
      [6, 2],
      [7, 3],
      [8, 4],
    ]);
  });

  it("names the main body after the part type", async () => {
    const m = await model({});
    const xml = unzip(await write3mf(m.parts, colours, "Gridfinity lid", "Base"))[
      "3D/3dmodel.model"
    ]!;
    expect(xml).toContain('name="Base"');
  });

  it("a lid without a label has exactly one part", async () => {
    const m = await model({});
    const xml = unzip(await write3mf(m.parts, colours))["3D/3dmodel.model"]!;
    expect(xml.match(/<component /g)).toHaveLength(1);
  });

  it("text sits on the plate: touching, not overlapping", async () => {
    const m = await model({ text_mode: "raised", text_string: "M3" });
    const plate = m.parts.find((p) => p.name === "plate")!;
    const text = m.parts.find((p) => p.name === "text")!;
    const plateTop = Math.max(...plate.positions.filter((_, i) => i % 3 === 2));
    const textBottom = Math.min(...text.positions.filter((_, i) => i % 3 === 2));
    expect(textBottom).toBeCloseTo(plateTop, 4);
  });
});

describe("C-02 baseplate meshes and export", () => {
  it("every baseplate from 1x1 to 4x4 is a closed mesh with positive volume", () => {
    for (const style of ["solid", "skeleton"] as const) {
      for (const magnets of [false, true]) {
        for (let n = 1; n <= 4; n++) {
          const m = buildBaseplateModel(kernel, {
            ...DEFAULT_BASEPLATE,
            units_x: n,
            units_y: n,
            baseplate_style: style,
            corner_magnets: magnets,
            center_magnet: magnets,
          });
          const label = `${n}x${n} ${style} magnets ${magnets}`;
          expect(
            m.parts.map((part) => part.name),
            label,
          ).toEqual(["plate"]);
          const part = m.parts[0] as PartMesh;
          expect(edgesAreClosed(part), label).toBe(true);
          // float32 vertices: the two volumes agree to a few parts in 10 million
          const drift = Math.abs(signedVolume(part) - part.volume) / part.volume;
          expect(drift, label).toBeLessThan(1e-5);
          expect(signedVolume(part), label).toBeGreaterThan(0);
        }
      }
    }
  });

  it("writes a 3MF with one object and one colour, and an STL", async () => {
    const m = buildBaseplateModel(kernel, { ...DEFAULT_BASEPLATE, units_x: 2 });
    const stl = writeStl(m.parts);
    expect(stl.byteLength).toBe(
      84 + 50 * ((m.parts[0] as PartMesh).indices.length / 3),
    );
    const file = await write3mf(m.parts, colours, "Base 2 × 1", "Base");
    expect(file.byteLength).toBeGreaterThan(1000);
  });
});
