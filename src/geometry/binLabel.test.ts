import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import lucideIcons from "../data/lucideLidIcons.json";
import { CONSTANTS } from "../gridfinity/constants";
import { newBin, validateBin, labelWidthOf, type BinParams } from "../model/binParams";
import {
  DEFAULT_LABEL,
  labelAsLid,
  validateLabel,
  type LabelParams,
} from "../model/labelParams";
import type { BundledFont } from "../model/lidParams";
import { prepareAssets, type AssetLoaders } from "./assets";
import { buildBin, labelRestZ, layoutOf } from "./bin";
import { buildBinLabel, labelCornerRadius } from "./binLabel";
import { modelXml } from "../export/threeMf";
import { textEdgeWarning } from "./label";
import type { SvgShapes } from "./svg";
import { initKernel, Scope, type Kernel } from "./kernel";
import { isClosed, sizeOf, vertices } from "./mesh";

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

const bin = (o: Partial<BinParams> = {}): BinParams => ({ ...newBin(), ...o });
const label = (o: Partial<LabelParams> = {}): LabelParams => ({
  ...DEFAULT_LABEL,
  text_mode: "none",
  ...o,
});

const build = async (b: BinParams, l: LabelParams) => {
  const scope = new Scope();
  try {
    const assets = await prepareAssets(labelAsLid(l), loaders);
    const parts = buildBinLabel(kernel, scope, b, l, assets);
    return {
      size: sizeOf(parts.plate),
      textSize: parts.text ? sizeOf(parts.text) : undefined,
      volume: parts.plate.volume(),
      closed: isClosed(parts.plate) && (!parts.text || isClosed(parts.text)),
      warnings: parts.warnings,
      verts: vertices(parts.plate),
      hasText: !!parts.text,
      textVolume: parts.text?.volume() ?? 0,
      overlap: parts.text
        ? kernel.Manifold.intersection(parts.plate, parts.text).volume()
        : 0,
    };
  } finally {
    scope.dispose();
  }
};

const { labelEdgeInset: INSET, labelLugLength: LUG } = CONSTANTS;

describe("E-09 label plate (the owner's drawing of 9 November 2026)", () => {
  it("is 37.5 wide and 14 deep on a 1 x 1 bin, 1 mm thick, with a 0.6 mm lug on each side", async () => {
    const m = await build(bin(), label());
    expect(labelWidthOf(bin())).toBeCloseTo(37.5, 9);
    expect(m.size.x).toBeCloseTo(37.5 + 2 * LUG.value, 4);
    expect(m.size.y).toBeCloseTo(14, 4);
    expect(m.size.z).toBeCloseTo(1, 4);
    expect(m.closed).toBe(true);
  });

  it("follows the inner width of the first slope on larger bins", async () => {
    for (const units_x of [2, 3, 5]) {
      const m = await build(bin({ units_x }), label());
      const edge = units_x * 42 - 0.5 - 2 * INSET.value;
      expect(m.size.x).toBeCloseTo(edge + 2 * LUG.value, 4);
      expect(m.size.y).toBeCloseTo(14, 4);
    }
  });

  it("the lugs are 7 mm wide, 4.33 mm from the rounded edge", async () => {
    const m = await build(bin(), label());
    const half = 37.5 / 2;
    const lugVerts = m.verts.filter(([x]) => Math.abs(x) > half + 0.3);
    expect(lugVerts.length).toBeGreaterThan(0);
    const ys = lugVerts.map(([, y]) => y);
    // plate centred: the rounded edge is at y = +7
    expect(Math.max(...ys)).toBeCloseTo(7 - 4.33, 4);
    expect(Math.min(...ys)).toBeCloseTo(7 - 4.33 - 7, 4);
    expect(Math.max(...lugVerts.map(([x]) => Math.abs(x)))).toBeCloseTo(half + 0.6, 4);
  });

  it("has a 0.3 mm chamfer on the upper and the lower outer edge of each lug, so it goes into the slot more easily", async () => {
    const plain = await build(bin(), label());
    const half = 37.5 / 2;
    const tip = plain.verts.filter(
      ([x]) => Math.abs(Math.abs(x) - (half + 0.6)) < 1e-4,
    );
    // at the outer end of the lug only the part between the two chamfers is left
    expect(Math.min(...tip.map(([, , z]) => z))).toBeCloseTo(0.3, 4);
    expect(Math.max(...tip.map(([, , z]) => z))).toBeCloseTo(0.7, 4);
    // at the top and at the bottom the lug ends 0.3 mm earlier
    for (const atTop of [true, false]) {
      const face = plain.verts.filter(
        ([x, , z]) => Math.abs(x) > half + 0.1 && (atTop ? z > 1 - 1e-6 : z < 1e-6),
      );
      expect(Math.max(...face.map(([x]) => Math.abs(x)))).toBeCloseTo(half + 0.3, 4);
    }
    expect(plain.closed).toBe(true);
  });

  it("is rounded on the side of the wall like the cavity, straight on the other", async () => {
    const m = await build(bin(), label());
    const half = 37.5 / 2;
    const r = labelCornerRadius();
    expect(r).toBeCloseTo(3.75 - 2, 9);
    const back = m.verts.filter(([, y]) => Math.abs(y - 7) < 1e-4);
    expect(Math.max(...back.map(([x]) => Math.abs(x)))).toBeLessThanOrEqual(
      half - r + 1e-3,
    );
    const front = m.verts.filter(([, y]) => Math.abs(y + 7) < 1e-4);
    expect(Math.max(...front.map(([x]) => Math.abs(x)))).toBeCloseTo(half, 4);
  });

  it("raised text stands on the plate as its own body; engraved text is cut into it", async () => {
    const plain = await build(bin(), label());
    const raised = await build(
      bin(),
      label({ text_mode: "raised", text_string: "M3" }),
    );
    expect(raised.hasText).toBe(true);
    expect(raised.closed).toBe(true);
    // let into a 0.4 mm pocket of the plate and 0.6 mm above it: 1.0 mm in all
    expect(raised.textSize?.z).toBeCloseTo(1, 4);
    // the plate is cut out for the text, the text fills the pocket: nothing overlaps
    expect(raised.volume).toBeLessThan(plain.volume - 0.1);
    expect(raised.overlap).toBeLessThan(1e-3);
    // what is gone from the plate is the lower 0.4 of the 1.0 mm of text
    expect(plain.volume - raised.volume).toBeCloseTo(raised.textVolume * 0.4, 2);

    const engraved = await build(
      bin(),
      label({ text_mode: "engraved", text_string: "M3" }),
    );
    expect(engraved.hasText).toBe(false);
    expect(engraved.closed).toBe(true);
    expect(engraved.volume).toBeLessThan(plain.volume);
    expect(engraved.size.z).toBeCloseTo(1, 4);

    const flush = await build(bin(), label({ text_mode: "flush", text_string: "M3" }));
    expect(flush.hasText).toBe(true);
    expect(flush.closed).toBe(true);
    expect(flush.size.z).toBeCloseTo(1, 4);
    expect(flush.textSize?.z).toBeCloseTo(0.4, 4);
  });

  it("uses the same rules as the lid text: a text too near the edge is warned about", async () => {
    const m = await build(
      bin(),
      label({ text_mode: "raised", text_string: "WIDE TEXT", text_size: 12 }),
    );
    expect(m.warnings).toContain(textEdgeWarning(false));
    const fine = await build(bin(), label({ text_mode: "raised", text_string: "M3" }));
    expect(fine.warnings).toEqual([]);
  });

  it("checks the label: text depth, offsets, colours and the stacking lip", () => {
    const b = bin();
    expect(validateLabel(b, label())).toEqual([]);
    expect(
      validateLabel(b, label({ text_mode: "engraved", emboss_depth: 0.8 })).join(" "),
    ).toMatch(/too large for a 1 mm plate/);
    expect(
      validateLabel(b, label({ text_mode: "engraved", emboss_depth: 0.6 })),
    ).toEqual([]);
    expect(validateLabel(b, label({ text_offset_y: 8 })).join(" ")).toMatch(
      /text_offset_y/,
    );
    expect(validateLabel(b, label({ text_color: "red" })).join(" ")).toMatch(
      /text_color/,
    );
    expect(validateLabel(bin({ lip_style: "flat_lower" }), label()).join(" ")).toMatch(
      /stacking lip/,
    );
  });
});

/** The label placed in the bin: rest height, 2 mm in from the wall it belongs to. */
const labelInBin = async (b: BinParams, l: LabelParams) => {
  const scope = new Scope();
  try {
    const layout = layoutOf(b);
    const { body } = buildBin(kernel, scope, b);
    const parts = buildBinLabel(kernel, scope, b, l, {});
    const front = b.label_slot === "front";
    const y = (front ? -1 : 1) * (layout.depth / 2 - INSET.value - 7);
    let plate = parts.plate;
    if (front) plate = scope.add(plate.rotate(0, 0, 180));
    plate = scope.add(plate.translate(0, y, labelRestZ(layout)));
    const touching = scope.add(kernel.Manifold.intersection(plate, body));
    return {
      overlap: touching.volume(),
      bodyVolume: body.volume(),
      bodyClosed: isClosed(body),
      bodySize: sizeOf(body),
    };
  } finally {
    scope.dispose();
  }
};

describe("E-09 slots in the bin for the label", () => {
  it("a bin has no slots by default and the label slot needs the stacking lip", () => {
    expect(newBin().label_slot).toBe("none");
    expect(
      validateBin(bin({ label_slot: "back", lip_style: "flat_same_height" })).join(" "),
    ).toMatch(/stacking lip/);
    expect(validateBin(bin({ label_slot: "back" }))).toEqual([]);
  });

  it("the slots only take away a little material, keep the mesh closed and the size", async () => {
    const plain = await labelInBin(bin(), label());
    for (const label_slot of ["back", "front"] as const) {
      const m = await labelInBin(bin({ label_slot }), label());
      expect(m.bodyClosed).toBe(true);
      expect(m.bodySize).toEqual(plain.bodySize);
      const removed = plain.bodyVolume - m.bodyVolume;
      expect(removed).toBeGreaterThan(2 * 0.3 * 7 * 1);
      expect(removed).toBeLessThan(2 * 0.8 * 7.2 * 1.1);
    }
  });

  it("the plate sits in the bin with its lugs in the slots: it touches nothing", async () => {
    for (const label_slot of ["back", "front"] as const) {
      for (const units_x of [1, 2, 4]) {
        for (const wall_thickness of [1.2, 2.5]) {
          const m = await labelInBin(
            bin({ label_slot, units_x, wall_thickness }),
            label(),
          );
          expect(m.overlap).toBeLessThan(1e-3);
        }
      }
    }
  });

  it("without the slots the lugs would sit in the wall", async () => {
    const m = await labelInBin(bin({ label_slot: "none" }), label());
    // two lugs of 0.6 x 7 x 1, less what the slope gives
    expect(m.overlap).toBeGreaterThan(2);
  });

  it("with the label in its slots, the lugs have 0.05 mm more room in every dimension", async () => {
    // a plate whose lugs are 0.1 mm longer would touch the wall at the bottom of the slot
    const scope = new Scope();
    try {
      const b = bin({ label_slot: "back" });
      const layout = layoutOf(b);
      const { body } = buildBin(kernel, scope, b);
      const parts = buildBinLabel(kernel, scope, b, label(), {});
      const wide = scope.add(
        parts.plate.scale([(37.5 + 2 * 0.7) / (37.5 + 2 * 0.6), 1, 1]),
      );
      const y = layout.depth / 2 - INSET.value - 7;
      const placed = scope.add(wide.translate(0, y, labelRestZ(layout)));
      expect(
        scope.add(kernel.Manifold.intersection(placed, body)).volume(),
      ).toBeGreaterThan(0.1);
    } finally {
      scope.dispose();
    }
  });
});

describe("E-09 the label shown in the bin view (preview only)", () => {
  it("adds the label as extra parts, not to the bin's parts, size or volume", async () => {
    const { buildBinModel } = await import("./model");
    const b = bin({ label_slot: "back" });
    const plain = buildBinModel(kernel, b);
    const shown = buildBinModel(
      kernel,
      b,
      label({ text_mode: "raised", text_string: "M3" }),
      await prepareAssets(labelAsLid(label({ text_mode: "raised" })), loaders),
    );
    expect(plain.extras).toBeUndefined();
    expect(shown.parts.map((p) => p.name)).toEqual(plain.parts.map((p) => p.name));
    expect(shown.size).toEqual(plain.size);
    expect(shown.extras?.map((p) => p.name)).toEqual(["plate", "text"]);
    expect(shown.extras?.map((p) => p.colour)).toEqual(["#9DA39A", "#000000"]);
    expect(shown.warnings).toEqual([]);
  });

  it("shows nothing without a slot, and says why when the label is wrong", async () => {
    const { buildBinModel } = await import("./model");
    expect(
      buildBinModel(kernel, bin({ label_slot: "none" }), label()).extras,
    ).toBeUndefined();
    const wrong = buildBinModel(
      kernel,
      bin({ label_slot: "back" }),
      label({ text_color: "red" }),
    );
    expect(wrong.extras).toBeUndefined();
    expect(wrong.warnings.join(" ")).toMatch(/The label is not shown/);
  });
});

describe("E-09 symbols and uploaded SVG on the label", () => {
  /** a hexagon nut as an SVG shape (a hexagon with a round hole), 20 units across */
  const nut: SvgShapes = {
    unitMm: 25.4 / 96,
    shapes: [
      {
        evenOdd: true,
        contours: [
          Array.from({ length: 6 }, (_, i): [number, number] => [
            10 * Math.cos((i * Math.PI) / 3),
            10 * Math.sin((i * Math.PI) / 3),
          ]),
          Array.from({ length: 24 }, (_, i): [number, number] => [
            4 * Math.cos((i * Math.PI) / 12),
            4 * Math.sin((i * Math.PI) / 12),
          ]),
        ],
      },
    ],
  };

  const buildWith = async (l: LabelParams, svg?: SvgShapes) => {
    const scope = new Scope();
    try {
      const assets = await prepareAssets(labelAsLid(l), loaders, svg);
      const parts = buildBinLabel(kernel, scope, bin(), l, assets);
      return {
        symbol: parts.symbol
          ? { size: sizeOf(parts.symbol), closed: isClosed(parts.symbol) }
          : undefined,
        plateClosed: isClosed(parts.plate),
        warnings: parts.warnings,
      };
    } finally {
      scope.dispose();
    }
  };

  it("puts a built-in symbol on the plate as its own body", async () => {
    const m = await buildWith(label({ symbol_mode: "raised", icon_size: 8 }));
    expect(m.symbol?.closed).toBe(true);
    expect(m.symbol?.size.z).toBeCloseTo(1, 4);
    expect(m.plateClosed).toBe(true);
  });

  it("puts the user's own SVG on the plate, raised, flush or engraved", async () => {
    for (const symbol_mode of ["raised", "flush", "engraved"] as const) {
      const m = await buildWith(
        label({ symbol_mode, symbol_source: "upload", symbol_scale: 0.8 }),
        nut,
      );
      expect(m.plateClosed).toBe(true);
      expect(m.symbol !== undefined).toBe(symbol_mode !== "engraved");
      if (m.symbol) expect(m.symbol.closed).toBe(true);
    }
  });

  it("keeps text and symbol apart as a group and warns about the edge margin like on the lid", async () => {
    const m = await buildWith(
      label({
        text_mode: "raised",
        text_string: "M3",
        symbol_mode: "raised",
        symbol_source: "upload",
        symbol_scale: 0.8,
      }),
      nut,
    );
    expect(m.symbol?.closed).toBe(true);
    const big = await buildWith(
      label({ symbol_mode: "raised", symbol_source: "upload", symbol_scale: 3 }),
      nut,
    );
    expect(big.warnings.length).toBeGreaterThan(0);
  });

  it("an uploaded SVG is missing: the generator says so", async () => {
    await expect(
      buildWith(label({ symbol_mode: "raised", symbol_source: "upload" })),
    ).rejects.toThrow(/SVG/);
  });
});

describe("E-09 the label sits flush in the bin: at most 0.1 mm of gap (owner, 9 November 2026)", () => {
  /** x and y extent of the opening of the bin at a height (the cavity), centred */
  const opening = async (b: BinParams, z: number) => {
    const scope = new Scope();
    try {
      const { body } = buildBin(kernel, scope, b);
      const section = scope.add(body.slice(z));
      const holes = section.toPolygons().filter(
        (poly) =>
          poly.reduce((sum, [x, y], i) => {
            const [nx, ny] = poly[(i + 1) % poly.length] ?? [0, 0];
            return sum + (x * ny - nx * y);
          }, 0) < 0,
      );
      const pts = holes.flat();
      return {
        halfX: Math.max(...pts.map(([x]) => Math.abs(x))),
        maxY: Math.max(...pts.map(([, y]) => y)),
        minY: Math.min(...pts.map(([, y]) => y)),
      };
    } finally {
      scope.dispose();
    }
  };

  for (const units_x of [1, 2, 3]) {
    for (const label_slot of ["back", "front"] as const) {
      it(`${units_x} wide, slot ${label_slot}: the gap to the lip wall is 0.1 mm at the sides and at the wall`, async () => {
        const b = bin({ units_x, label_slot });
        const layout = layoutOf(b);
        // just above the plate (and its slots) the wall of the lip stands upright
        const z = labelRestZ(layout) + 1.2;
        const o = await opening(b, z);
        const plateHalf = labelWidthOf(b) / 2;
        expect(o.halfX - plateHalf).toBeGreaterThan(0.05);
        expect(o.halfX - plateHalf).toBeLessThanOrEqual(0.1 + 1e-3);
        // along the depth: the edge of the plate on the side of the wall, 2 mm from the outer face
        const wallEdge =
          (layout.depth / 2 - INSET.value) * (label_slot === "back" ? 1 : -1);
        const gap = label_slot === "back" ? o.maxY - wallEdge : wallEdge - o.minY;
        expect(gap).toBeGreaterThan(0.05);
        expect(gap).toBeLessThanOrEqual(0.1 + 1e-3);
      });
    }
  }
});

describe("E-09 export: plate and text are ONE object with two parts", () => {
  it("the 3MF has one build item made of two components, with their colours", async () => {
    const { buildLabelModel } = await import("./model");
    const l = label({ text_mode: "raised", text_string: "M3", text_color: "#112233" });
    const model = buildLabelModel(
      kernel,
      bin(),
      l,
      await prepareAssets(labelAsLid(l), loaders),
    );
    expect(model.parts.map((p) => p.name)).toEqual(["plate", "text"]);
    const xml = modelXml(
      model.parts,
      {
        plate: l.plate_color,
        lip: l.plate_color,
        text: l.text_color,
        symbol: l.symbol_color,
      },
      "Label",
      "Label",
    );
    expect(xml.match(/<item /g)).toHaveLength(1);
    expect(xml.match(/<component /g)).toHaveLength(2);
    expect(xml).toContain("#112233");
    expect(xml).toContain("#9DA39A");
  });
});
