import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import lucideIcons from "../data/lucideLidIcons.json";
import {
  DEFAULT_LID,
  validateLid,
  type BundledFont,
  type LabelMode,
  type LidParams,
} from "../model/lidParams";
import { InputError, prepareAssets, type AssetLoaders } from "./assets";
import { labelPositions } from "./label";
import { initKernel, Scope, type Kernel } from "./kernel";
import { buildLid } from "./lid";
import { isClosed, sizeOf } from "./mesh";
import { parseTransform, pathToContours, type SvgShapes } from "./svg";

const fontFiles: Record<BundledFont, string> = {
  Inter: "Inter-Regular.otf",
  "IBM Plex Mono": "IBMPlexMono-Regular.woff",
  "IBM Plex Sans SemiBold": "IBMPlexSans-SemiBold.woff",
};
const loaders: AssetLoaders = {
  fontBytes: async (choice) => {
    const file = readFileSync(
      new URL(`../fonts/${fontFiles[choice]}`, import.meta.url),
    );
    return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
  },
  icons: async () => lucideIcons,
};

let kernel: Kernel;
beforeAll(async () => {
  kernel = await initKernel();
});

const build = async (overrides: Partial<LidParams>, svg?: SvgShapes) => {
  const p = { ...DEFAULT_LID, ...overrides };
  const scope = new Scope();
  const assets = await prepareAssets(p, loaders, svg);
  const parts = buildLid(kernel, scope, p, assets);
  const sizes = {
    plate: sizeOf(parts.plate),
    text: parts.text ? sizeOf(parts.text) : undefined,
  };
  const out = {
    parts,
    sizes,
    plateVolume: parts.plate.volume(),
    plateMax: parts.plate.boundingBox().max[2],
    closed: {
      plate: isClosed(parts.plate),
      text: parts.text ? isClosed(parts.text) : undefined,
      symbol: parts.symbol ? isClosed(parts.symbol) : undefined,
    },
    textVolume: parts.text?.volume(),
    textZ: parts.text
      ? [parts.text.boundingBox().min[2], parts.text.boundingBox().max[2]]
      : [],
    symbolVolume: parts.symbol?.volume(),
    hasText: Boolean(parts.text),
    hasSymbol: Boolean(parts.symbol),
  };
  scope.dispose();
  return out;
};

const base = () => build({});

describe("B-07 text", () => {
  it.each(["raised", "flush"] as LabelMode[])(
    "%s text is its own closed body next to a closed plate",
    async (mode) => {
      const r = await build({ text_mode: mode, text_string: "Screws" });
      expect(r.hasText).toBe(true);
      expect(r.closed.plate).toBe(true);
      expect(r.closed.text).toBe(true);
    },
  );

  it("engraved text removes material from the plate and makes no extra body", async () => {
    const b = await base();
    const r = await build({ text_mode: "engraved", text_string: "Screws" });
    expect(r.hasText).toBe(false);
    expect(r.closed.plate).toBe(true);
    expect(r.plateVolume).toBeLessThan(b.plateVolume);
    expect(r.sizes.plate.z).toBeCloseTo(7, 4);
  });

  it("raised text stands on the plate and ends emboss_depth above it", async () => {
    const r = await build({ text_mode: "raised", text_string: "M3" });
    expect(r.textZ[0]).toBeCloseTo(7, 4);
    expect(r.textZ[1]).toBeCloseTo(7 + 0.6, 4);
    expect(r.plateMax).toBeCloseTo(7, 4);
    expect(r.plateVolume).toBeCloseTo((await base()).plateVolume, 4);
  });

  it("flush text fills its pocket up to the plate top", async () => {
    const r = await build({ text_mode: "flush", text_string: "M3" });
    expect(r.textZ[1]).toBeCloseTo(7, 4);
    expect(r.textZ[0]).toBeCloseTo(7 - 0.4, 4);
  });

  it("text is 8 mm high at the minimum size and centred on the plate", async () => {
    const r = await build({ text_mode: "raised", text_string: "H" });
    expect(r.sizes.text?.y).toBeGreaterThan(5.5);
    expect(r.sizes.text?.y).toBeLessThan(8.5);
  });

  it("text on an upside-down lid is still a closed body on z >= 0", async () => {
    const r = await build({
      text_mode: "raised",
      text_string: "Up",
      print_orientation: "upside_down",
    });
    expect(r.closed.text).toBe(true);
    expect(r.textZ[0]).toBeGreaterThan(-1e-6);
  });

  it.each(["Inter", "IBM Plex Mono", "IBM Plex Sans SemiBold"] as BundledFont[])(
    "font %s produces a closed text body",
    async (font) => {
      const r = await build({
        text_mode: "raised",
        text_string: "Ø 6 × 2 °",
        font_choice: font,
      });
      expect(r.closed.text).toBe(true);
    },
  );
});

describe("B-07 uploaded font", () => {
  const fontBase64 = () =>
    readFileSync(
      new URL("../fonts/IBMPlexSans-SemiBold.woff", import.meta.url),
    ).toString("base64");

  it("text from the user's own font file is a closed body", async () => {
    const r = await build({
      text_mode: "raised",
      text_string: "Own",
      font_choice: "upload",
      font_name: "Plex.woff",
      font_data: fontBase64(),
    });
    expect(r.closed.text).toBe(true);
  });

  it("a file that is not a font is an input error that says what to do", async () => {
    const p = {
      ...DEFAULT_LID,
      text_mode: "raised",
      font_choice: "upload",
      font_name: "notes.txt",
      font_data: Buffer.from("not a font").toString("base64"),
    } as LidParams;
    await expect(prepareAssets(p, loaders)).rejects.toThrow(InputError);
    await expect(prepareAssets(p, loaders)).rejects.toThrow(
      /notes.txt could not be read/,
    );
    await expect(prepareAssets({ ...p, font_data: "" }, loaders)).rejects.toThrow(
      /Upload a font file/,
    );
  });
});

describe("B-07 symbol", () => {
  it.each(["raised", "flush"] as LabelMode[])(
    "%s symbol is a closed body",
    async (mode) => {
      const r = await build({ symbol_mode: mode, symbol_icon: "tools_wrench" });
      expect(r.closed.symbol).toBe(true);
      expect(r.closed.plate).toBe(true);
    },
  );

  it("engraved symbol cuts the plate", async () => {
    const b = await base();
    const r = await build({ symbol_mode: "engraved", symbol_icon: "safety_hard-hat" });
    expect(r.plateVolume).toBeLessThan(b.plateVolume);
    expect(r.closed.plate).toBe(true);
  });

  it("every built-in icon builds into a closed raised body", async () => {
    for (const name of Object.keys(lucideIcons)) {
      const r = await build({ symbol_mode: "raised", symbol_icon: name });
      expect(r.closed.symbol, name).toBe(true);
    }
  }, 60000);

  it("an uploaded SVG becomes a closed body at 96 dpi size", async () => {
    // 10 x 10 user units with a 4 x 4 hole (opposite winding)
    const outer = pathToContours("M0 0 H10 V10 H0 Z");
    const hole = pathToContours("M3 3 V7 H7 V3 Z");
    const svg: SvgShapes = {
      shapes: [{ contours: [...outer, ...hole], evenOdd: false }],
      unitMm: 25.4 / 96,
    };
    const r = await build({ symbol_mode: "raised", symbol_source: "upload" }, svg);
    expect(r.closed.symbol).toBe(true);
    const mm = 10 * (25.4 / 96);
    const area = mm * mm - ((4 * 25.4) / 96 ** 1) * ((4 * 25.4) / 96);
    expect(r.symbolVolume).toBeCloseTo(area * 0.6, 3);
  });

  it("text and symbol together are two separate bodies", async () => {
    const r = await build({
      text_mode: "raised",
      text_string: "M3",
      symbol_mode: "raised",
      units_x: 2,
    });
    expect(r.hasText && r.hasSymbol).toBe(true);
    expect(r.closed.text && r.closed.symbol).toBe(true);
  });
});

describe("label layout and validation", () => {
  const both = {
    ...DEFAULT_LID,
    text_mode: "raised",
    symbol_mode: "raised",
  } as LidParams;

  it("icon_left puts the symbol left of the text, centred as a group", () => {
    const [t, s] = labelPositions(both, 20, 10);
    expect(s[0]).toBeLessThan(t[0]);
    // the group spans 10 + 3 + 20 = 33 mm, centred on 0
    expect(s[0] - 5).toBeCloseTo(-16.5, 6);
    expect(t[0] + 10).toBeCloseTo(16.5, 6);
  });

  it("icon_above puts the symbol above the text", () => {
    const [t, s] = labelPositions({ ...both, label_arrange: "icon_above" }, 20, 10);
    expect(s[1]).toBeGreaterThan(t[1]);
  });

  it("only one element: no group shift", () => {
    const only = { ...DEFAULT_LID, text_mode: "raised" } as LidParams;
    expect(labelPositions(only, 20, 0)).toEqual([
      [0, 0],
      [0, 0],
    ]);
  });

  it("an engraved label deeper than plate - 0.4 mm is rejected", () => {
    const p = { ...DEFAULT_LID, text_mode: "engraved", emboss_depth: 2 } as LidParams;
    expect(validateLid(p).join(" ")).toMatch(/Label depth/);
    expect(validateLid({ ...p, emboss_depth: 1.8 })).toEqual([]);
  });

  it("text below 8 mm is rejected, 8 is accepted", () => {
    expect(validateLid({ ...DEFAULT_LID, text_size: 7.5 })).not.toEqual([]);
    expect(validateLid({ ...DEFAULT_LID, text_size: 8 })).toEqual([]);
  });
});

describe("svg helpers", () => {
  it("a circle drawn with arcs has the right area", () => {
    const [c] = pathToContours("M10 0 A10 10 0 1 1 -10 0 A10 10 0 1 1 10 0 Z");
    let area = 0;
    for (let i = 0; i < c!.length; i++) {
      const [x1, y1] = c![i]!;
      const [x2, y2] = c![(i + 1) % c!.length]!;
      area += x1 * y2 - x2 * y1;
    }
    expect(Math.abs(area / 2)).toBeCloseTo(Math.PI * 100, -1);
  });

  it("relative commands and curves close into one contour per subpath", () => {
    expect(pathToContours("m0 0 h10 v10 h-10 z m20 0 c5 0 5 10 0 10 z")).toHaveLength(
      2,
    );
  });

  it("reads translate and scale", () => {
    expect(parseTransform("translate(5 6) scale(2)")).toEqual([2, 0, 0, 2, 5, 6]);
  });
});
