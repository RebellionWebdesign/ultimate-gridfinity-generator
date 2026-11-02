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
import { SYMBOL_EDGE_WARNING, labelPositions, textEdgeWarning } from "./label";
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

  it("a capital letter is about as high as the text size", async () => {
    for (const size of [5, 8]) {
      const r = await build({ text_mode: "raised", text_string: "H", text_size: size });
      expect(r.sizes.text?.y).toBeGreaterThan(size * 0.65);
      expect(r.sizes.text?.y).toBeLessThan(size * 1.05);
    }
  });

  it("at the minimum size 5 the word ENGRAVED fits a 1x1 lid", async () => {
    const small = await build({ text_mode: "raised", text_string: "ENGRAVED" });
    expect(DEFAULT_LID.text_size).toBe(5);
    expect(small.sizes.text!.x).toBeLessThan(41.5 - 2 * 2);
    // at the old minimum of 8 it was wider than the lid
    const old = await build({
      text_mode: "raised",
      text_string: "ENGRAVED",
      text_size: 8,
    });
    expect(old.sizes.text!.x).toBeGreaterThan(41.5 - 2 * 2);
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

  it("text below 5 mm is rejected, 5 is accepted", () => {
    expect(validateLid({ ...DEFAULT_LID, text_size: 4.5 })).not.toEqual([]);
    expect(validateLid({ ...DEFAULT_LID, text_size: 5 })).toEqual([]);
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

describe("label edge margin (3 mm)", () => {
  const lidWith = async (overrides: Partial<LidParams>) => {
    const p = { ...DEFAULT_LID, ...overrides };
    const scope = new Scope();
    const lid = buildLid(kernel, scope, p, await prepareAssets(p, loaders));
    const result = { warnings: lid.warnings, area: lid.labelArea };
    scope.dispose();
    return result;
  };
  const wide = { text_string: "ENGRAVED", text_size: 8 } as const;

  it("warns when text comes closer than 3 mm to the lid edge, with the Raised or Flush hint for engraved text", async () => {
    const engraved = await lidWith({ ...wide, text_mode: "engraved" });
    expect(engraved.warnings).toEqual([textEdgeWarning(true)]);
    expect(engraved.warnings[0]).toMatch(/shorter word.*Raised or Flush/);
    // other modes warn as well, without that hint
    const raised = await lidWith({ ...wide, text_mode: "raised" });
    expect(raised.warnings).toEqual([textEdgeWarning(false)]);
    expect(raised.warnings[0]).not.toMatch(/Raised or Flush/);
  });

  it("does not warn for a short word in any mode", async () => {
    for (const mode of ["raised", "engraved", "flush"] as const) {
      expect((await lidWith({ text_mode: mode, text_string: "M3" })).warnings).toEqual(
        [],
      );
    }
  });

  it("warns when an offset pushes a short word into the margin, and not just inside it", async () => {
    // lid is 41.5 wide; the word must stay between x = 3 and x = 38.5
    expect(
      (await lidWith({ text_mode: "raised", text_string: "M3", text_offset_x: 16 }))
        .warnings,
    ).toEqual([textEdgeWarning(false)]);
    expect(
      (await lidWith({ text_mode: "raised", text_string: "M3", text_offset_x: 8 }))
        .warnings,
    ).toEqual([]);
  });

  it("warns for a symbol that comes closer than 3 mm", async () => {
    expect((await lidWith({ symbol_mode: "raised", icon_size: 40 })).warnings).toEqual([
      SYMBOL_EDGE_WARNING,
    ]);
    expect((await lidWith({ symbol_mode: "raised", icon_size: 14 })).warnings).toEqual(
      [],
    );
  });

  it("the rounded lid corners count: a square inside the margin box but outside the rounded free area warns", async () => {
    // a 4 mm square, centred by the importer; offsets put its lower left corner on the lid
    const square: SvgShapes = {
      shapes: [{ contours: pathToContours("M0 0 H4 V4 H0 Z"), evenOdd: false }],
      unitMm: 1,
    };
    const place = async (corner: number) => {
      const p = {
        ...DEFAULT_LID,
        symbol_mode: "raised",
        symbol_source: "upload",
        symbol_offset_x: corner + 2 - 20.75,
        symbol_offset_y: corner + 2 - 20.75,
      } as LidParams;
      const scope = new Scope();
      const lid = buildLid(kernel, scope, p, await prepareAssets(p, loaders, square));
      const warnings = lid.warnings;
      scope.dispose();
      return warnings;
    };
    // corner at (3.05, 3.05): inside the 3 mm box, but 0.99 mm from the centre of the
    // rounded free corner (radius 0.75), so it reaches into the margin
    expect(await place(3.05)).toEqual([SYMBOL_EDGE_WARNING]);
    // corner at (4, 4): 0.35 mm from that centre, inside the free area
    expect(await place(4)).toEqual([]);
  });

  it("a larger lid takes the same word without a warning", async () => {
    expect(
      (await lidWith({ ...wide, text_mode: "engraved", units_x: 3 })).warnings,
    ).toEqual([]);
  });

  it("describes the label area for the preview, only when a label is shown", async () => {
    expect((await lidWith({})).area).toBeUndefined();
    const ok = (await lidWith({ text_mode: "raised", text_string: "M3" })).area;
    expect(ok).toMatchObject({
      width: 41.5,
      depth: 41.5,
      z: 7,
      down: false,
      margin: 3,
      violated: false,
    });
    const bad = (await lidWith({ ...wide, text_mode: "raised" })).area;
    expect(bad?.violated).toBe(true);
    // printed upside down the plate surface faces down and lies 0.6 mm above the bed
    const flipped = (
      await lidWith({
        text_mode: "raised",
        text_string: "M3",
        print_orientation: "upside_down",
      })
    ).area;
    expect(flipped).toMatchObject({ down: true });
    expect(flipped?.z).toBeCloseTo(0.6, 6);
  });

  it("the warning does not stop the build", async () => {
    const r = await build({ ...wide, text_mode: "engraved" });
    expect(r.closed.plate).toBe(true);
  });
});
