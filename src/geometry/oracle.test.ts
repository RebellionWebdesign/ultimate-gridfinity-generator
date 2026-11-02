// B-09: the TypeScript geometry against the reference script (tools/oracle). The fixture
// `oracle.json` holds bounding box and volume of every case as rendered by the script.
import { beforeAll, describe, expect, it } from "vitest";
import lucideIcons from "../data/lucideLidIcons.json";
import { DEFAULT_LID, validateLid, type LidParams } from "../model/lidParams";
import oracle from "./oracle.json";
import { prepareAssets, type AssetLoaders } from "./assets";
import { initKernel, type Kernel } from "./kernel";
import { buildModel } from "./model";

const loaders: AssetLoaders = {
  fontBytes: async () => {
    throw new Error("Text cases are not part of the oracle comparison.");
  },
  icons: async () => lucideIcons,
};

/** Relative volume tolerance and absolute size tolerance (mm); see ADR-0006. */
const VOLUME_TOLERANCE = 1e-4;
const SIZE_TOLERANCE = 0.001;

let kernel: Kernel;
beforeAll(async () => {
  kernel = await initKernel();
});

interface Case {
  params: Record<string, string | number | boolean>;
  size: number[];
  volume: number;
  triangles: number;
}

describe("B-09 oracle comparison (reference .scad, at or above the spec minimum)", () => {
  for (const [name, entry] of Object.entries(oracle as Record<string, Case>)) {
    it(name, async () => {
      // the script's default plate is manual 2.25 mm, the app's is auto 1u (= 2.25 mm)
      const params = { ...DEFAULT_LID, ...entry.params } as LidParams;
      expect(validateLid(params), "case is at or above the spec minimum").toEqual([]);
      const model = buildModel(kernel, params, await prepareAssets(params, loaders));
      const volume = model.parts.reduce((sum, part) => sum + part.volume, 0);
      const relative = Math.abs(volume - entry.volume) / entry.volume;
      console.info(
        `${name}: volume ${volume.toFixed(2)} vs ${entry.volume.toFixed(2)} ` +
          `(${(relative * 100).toFixed(4)} %), size ${model.size.map((v) => v.toFixed(3))} ` +
          `vs ${entry.size.map((v) => v.toFixed(3))}`,
      );
      model.size.forEach((v, i) => {
        expect(Math.abs(v - (entry.size[i] ?? 0))).toBeLessThan(SIZE_TOLERANCE);
      });
      expect(relative).toBeLessThan(VOLUME_TOLERANCE);
    });
  }
});
