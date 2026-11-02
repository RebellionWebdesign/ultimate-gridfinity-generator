// Text and symbol on the lid (reference script: `text2d`, `symbol2d`, `label_cuts`,
// `label_adds`, `lb_pos`). Text comes from opentype.js outlines, the built-in symbols
// are Lucide polylines stroked 2 units wide, uploaded SVG shapes are filled outlines.
import type { CrossSection, Manifold } from "manifold-3d";
import type { Font, PathCommand } from "opentype.js";
import type { LabelMode, LidParams } from "../model/lidParams";
import type { Kernel, Scope } from "./kernel";
import type { Contour, Point, SvgShapes } from "./svg";

/** One Lucide icon: polylines in a 24 x 24 box, y down (generated from the script). */
export type IconPolylines = number[][][];

export interface LabelAssets {
  font?: Font;
  icons?: Record<string, IconPolylines>;
  svg?: SvgShapes;
}

/** OpenSCAD sizes text so that its ascent is about `size`: em = size x 100 / 72. */
export const OPENSCAD_EM = 100 / 72;
const CURVE_SEGMENTS = 12;
const LUCIDE_BOX = 24;
const LUCIDE_VISIBLE = 22;

export const hasText = (p: LidParams): boolean =>
  p.text_mode !== "none" && p.text_string.trim().length > 0;
export const hasSymbol = (p: LidParams): boolean => p.symbol_mode !== "none";

/** Flattens opentype path commands into closed contours with y up. */
export const flattenCommands = (commands: PathCommand[]): Contour[] => {
  const contours: Contour[] = [];
  let current: Contour = [];
  let pos: Point = [0, 0];
  const end = () => {
    if (current.length >= 3) contours.push(current);
    current = [];
  };
  for (const cmd of commands) {
    const x = cmd.x ?? 0;
    const y = cmd.y ?? 0;
    if (cmd.type === "M") {
      end();
      pos = [x, y];
      current = [pos];
    } else if (cmd.type === "L") {
      pos = [x, y];
      current.push(pos);
    } else if (cmd.type === "Q") {
      const [cx, cy] = [cmd.x1 ?? 0, cmd.y1 ?? 0];
      for (let i = 1; i <= CURVE_SEGMENTS; i++) {
        const t = i / CURVE_SEGMENTS;
        const u = 1 - t;
        current.push([
          u * u * pos[0] + 2 * u * t * cx + t * t * x,
          u * u * pos[1] + 2 * u * t * cy + t * t * y,
        ]);
      }
      pos = [x, y];
    } else if (cmd.type === "C") {
      const [x1, y1, x2, y2] = [cmd.x1 ?? 0, cmd.y1 ?? 0, cmd.x2 ?? 0, cmd.y2 ?? 0];
      for (let i = 1; i <= CURVE_SEGMENTS; i++) {
        const t = i / CURVE_SEGMENTS;
        const u = 1 - t;
        current.push([
          u ** 3 * pos[0] + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t ** 3 * x,
          u ** 3 * pos[1] + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3 * y,
        ]);
      }
      pos = [x, y];
    } else {
      end();
    }
  }
  end();
  // opentype returns y down; the lid is y up
  return contours.map((c) => c.map(([px, py]): Point => [px, -py]));
};

export const emSize = (textSize: number): number => textSize * OPENSCAD_EM;

/**
 * Glyph by glyph layout with kerning. opentype.js's own `getPath` runs a shaping step
 * that throws on some lookup types in Inter, so ligatures are not applied.
 */
const layout = (font: Font, text: string, em: number) => {
  const scale = em / font.unitsPerEm;
  const commands: PathCommand[] = [];
  let x = 0;
  let previous: ReturnType<Font["charToGlyph"]> | undefined;
  for (const char of text) {
    const glyph = font.charToGlyph(char);
    if (previous) x += font.getKerningValue(previous, glyph) * scale;
    commands.push(...glyph.getPath(x, 0, em).commands);
    x += (glyph.advanceWidth ?? 0) * scale;
    previous = glyph;
  }
  return { commands, advance: x };
};

/** Width of the text in mm, as laid out (used to place the symbol next to it). */
export const textWidth = (font: Font, p: LidParams): number =>
  layout(font, p.text_string, emSize(p.text_size)).advance;

/** Text outlines, centred like OpenSCAD's halign/valign "center". */
export const textContours = (font: Font, p: LidParams): Contour[] => {
  const em = emSize(p.text_size);
  const { commands, advance } = layout(font, p.text_string, em);
  const contours = flattenCommands(commands);
  const ys = contours.flat().map((pt) => pt[1]);
  if (ys.length === 0) return [];
  const dx = -advance / 2;
  const dy = -(Math.min(...ys) + Math.max(...ys)) / 2;
  return contours.map((c) => c.map(([x, y]): Point => [x + dx, y + dy]));
};

export type LabelPositions = [Point, Point];

/** Where text and symbol sit relative to the plate centre (script `lb_pos`). */
export const labelPositions = (
  p: LidParams,
  textW: number,
  symbolSize: number,
): LabelPositions => {
  const both = hasText(p) && hasSymbol(p);
  if (!(p.label_group && both)) {
    return [
      [0, 0],
      [0, 0],
    ];
  }
  const S = symbolSize;
  const Tw = textW;
  const Th = p.text_size;
  const g = p.label_gap;
  const row = p.label_arrange === "icon_left" || p.label_arrange === "icon_right";
  const iconFirst = p.label_arrange === "icon_left" || p.label_arrange === "icon_above";
  const total = row ? S + g + Tw : S + g + Th;
  const at = row
    ? iconFirst
      ? -total / 2 + S + g + Tw / 2
      : -total / 2 + Tw / 2
    : iconFirst
      ? -total / 2 + Th / 2
      : total / 2 - Th / 2;
  const as = row
    ? iconFirst
      ? -total / 2 + S / 2
      : -total / 2 + Tw + g + S / 2
    : iconFirst
      ? total / 2 - S / 2
      : -total / 2 + S / 2;
  const span = row ? Math.max(Th, S) : Math.max(Tw, S);
  const ht = row ? Th : Tw;
  let sgn = 0;
  if (p.label_align === "start") sgn = row ? 1 : -1;
  if (p.label_align === "end") sgn = row ? -1 : 1;
  const ct = sgn * (span / 2 - ht / 2);
  const cs = sgn * (span / 2 - S / 2);
  const pt: Point = row ? [at, ct] : [ct, at];
  const ps: Point = row ? [as, cs] : [cs, as];
  const shift: Point = p.label_center ? [0, 0] : [-pt[0], -pt[1]];
  return [
    [pt[0] + shift[0], pt[1] + shift[1]],
    [ps[0] + shift[0], ps[1] + shift[1]],
  ];
};

/** Visible symbol size in mm for the layout (script `lb_S`; upload: measured). */
export const symbolSize = (p: LidParams, assets: LabelAssets): number => {
  if (p.symbol_source === "lucide") {
    return (p.icon_size * p.symbol_scale * LUCIDE_VISIBLE) / LUCIDE_BOX;
  }
  if (!assets.svg) return p.icon_size * p.symbol_scale;
  const { min, max } = svgBounds(assets.svg);
  return (
    Math.max(max[0] - min[0], max[1] - min[1]) * assets.svg.unitMm * p.symbol_scale
  );
};

const svgBounds = (svg: SvgShapes) => {
  const pts = svg.shapes.flatMap((s) => s.contours.flat());
  const xs = pts.map((pt) => pt[0]);
  const ys = pts.map((pt) => pt[1]);
  return {
    min: [Math.min(...xs), Math.min(...ys)] as Point,
    max: [Math.max(...xs), Math.max(...ys)] as Point,
  };
};

const fromContours = (kernel: Kernel, scope: Scope, contours: Contour[]) =>
  scope.add(new kernel.CrossSection(contours, "NonZero"));

/** Built-in Lucide symbol: each polyline stroked 2 units wide with round caps. */
const lucideShape = (
  kernel: Kernel,
  scope: Scope,
  polylines: IconPolylines,
  size: number,
): CrossSection => {
  const k = size / LUCIDE_BOX;
  const at = ([x, y]: number[]): Point => [((x ?? 0) - 12) * k, -((y ?? 0) - 12) * k];
  const dot = (pt: number[]) =>
    scope.add(kernel.CrossSection.circle(k, 12)).translate(at(pt));
  const pieces: CrossSection[] = [];
  for (const line of polylines) {
    const first = line[0];
    if (!first) continue;
    if (line.length === 1) {
      pieces.push(scope.add(dot(first)));
      continue;
    }
    for (let i = 0; i + 1 < line.length; i++) {
      const [a, b] = [line[i], line[i + 1]];
      if (!a || !b) continue;
      const circles = [scope.add(dot(a)), scope.add(dot(b))];
      pieces.push(scope.add(kernel.CrossSection.hull(circles)));
    }
  }
  return scope.add(kernel.CrossSection.union(pieces));
};

/** Uploaded SVG at its own size (96 dpi), centred on the bounding box, y up. */
const svgShape = (kernel: Kernel, scope: Scope, svg: SvgShapes): CrossSection => {
  const { min, max } = svgBounds(svg);
  const cx = (min[0] + max[0]) / 2;
  const cy = (min[1] + max[1]) / 2;
  const parts = svg.shapes.map((shape) => {
    const contours = shape.contours.map((c) =>
      c.map(([x, y]): Point => [(x - cx) * svg.unitMm, -(y - cy) * svg.unitMm]),
    );
    return scope.add(
      new kernel.CrossSection(contours, shape.evenOdd ? "EvenOdd" : "NonZero"),
    );
  });
  return scope.add(kernel.CrossSection.union(parts));
};

/** Corner radius of the lid outline (spec: 3.75). */
export const LID_CORNER_RADIUS = 3.75;

/**
 * Does the shape come closer to the lid edge than the margin? The free area is the lid
 * outline (rounded corners) moved inward by the margin, so the corners count exactly.
 */
const outsideMargin = (
  kernel: Kernel,
  scope: Scope,
  shape: CrossSection,
  centre: Point,
): boolean => {
  const [w, h] = [2 * centre[0], 2 * centre[1]];
  const r = LID_CORNER_RADIUS;
  const outline = scope.add(
    scope
      .add(kernel.CrossSection.square([w - 2 * r, h - 2 * r], true))
      .offset(r, "Round", 2, 48),
  );
  const free = scope.add(outline.offset(-LABEL_EDGE_MARGIN, "Round", 2, 48));
  const freeAtLid = scope.add(free.translate(centre[0], centre[1]));
  const excess = scope.add(kernel.CrossSection.difference(shape, freeAtLid));
  return excess.area() > 1e-3;
};

export interface LabelBodies {
  /** solids to subtract from the plate (engraved and flush pockets) */
  cuts: Manifold[];
  text?: Manifold;
  symbol?: Manifold;
  /** how far raised elements stand above the plate top */
  raisedExtra: number;
  /** hints for the user, not errors: the lid is built anyway */
  warnings: string[];
  /** a text or symbol is shown, so the edge margin matters */
  hasLabel: boolean;
}

/** Labels keep this distance from the lid edge on every side (owner, 2 November 2026). */
export const LABEL_EDGE_MARGIN = 3;

export const textEdgeWarning = (engraved: boolean): string =>
  `The text comes closer than ${LABEL_EDGE_MARGIN} mm to the lid edge. Use a shorter word, a smaller text height or a larger lid` +
  (engraved
    ? ", or switch the text to Raised or Flush."
    : ", or move it away from the edge.");

export const SYMBOL_EDGE_WARNING = `The symbol comes closer than ${LABEL_EDGE_MARGIN} mm to the lid edge. Use a smaller symbol or a larger lid, or move it away from the edge.`;

export const raisedExtra = (p: LidParams): number =>
  (hasText(p) && p.text_mode === "raised") ||
  (hasSymbol(p) && p.symbol_mode === "raised")
    ? p.emboss_depth
    : 0;

interface Element {
  mode: LabelMode;
  shape: CrossSection;
}

/**
 * Text and symbol solids for a lid whose plate top is at `plateTop` and whose centre
 * is at (cx, cy). `assets` must hold the font, icons or SVG that the parameters need.
 */
export const buildLabel = (
  kernel: Kernel,
  scope: Scope,
  p: LidParams,
  assets: LabelAssets,
  plateTop: number,
  centre: Point,
): LabelBodies => {
  const result: LabelBodies = {
    cuts: [],
    raisedExtra: raisedExtra(p),
    warnings: [],
    hasLabel: false,
  };
  const textOn = hasText(p);
  const symbolOn = hasSymbol(p);
  if (!textOn && !symbolOn) return result;

  let textW = 0;
  if (textOn) {
    if (!assets.font) throw new Error("The text font is not loaded.");
    textW = textWidth(assets.font, p);
  }
  const [textAt, symbolAt] = labelPositions(
    p,
    textW,
    symbolOn ? symbolSize(p, assets) : 0,
  );

  const place = (
    cs: CrossSection,
    rotation: number,
    ox: number,
    oy: number,
    at: Point,
  ) =>
    scope.add(
      cs.rotate(rotation).translate(ox + at[0] + centre[0], oy + at[1] + centre[1]),
    );

  const elements: { name: "text" | "symbol"; element: Element }[] = [];
  if (textOn && assets.font) {
    const contours = textContours(assets.font, p);
    if (contours.length > 0) {
      const base = fromContours(kernel, scope, contours);
      const shape = place(
        base,
        p.text_rotation,
        p.text_offset_x,
        p.text_offset_y,
        textAt,
      );
      elements.push({ name: "text", element: { mode: p.text_mode, shape } });
      if (outsideMargin(kernel, scope, shape, centre)) {
        result.warnings.push(textEdgeWarning(p.text_mode === "engraved"));
      }
    }
  }
  if (symbolOn) {
    let base: CrossSection;
    if (p.symbol_source === "lucide") {
      const icon = assets.icons?.[p.symbol_icon];
      if (!icon) throw new Error(`Unknown symbol "${p.symbol_icon}".`);
      base = lucideShape(kernel, scope, icon, p.icon_size);
    } else {
      if (!assets.svg) throw new Error("No SVG file is loaded for the symbol.");
      base = svgShape(kernel, scope, assets.svg);
    }
    const scaled = scope.add(base.scale(p.symbol_scale));
    elements.push({
      name: "symbol",
      element: {
        mode: p.symbol_mode,
        shape: place(
          scaled,
          p.symbol_rotation,
          p.symbol_offset_x,
          p.symbol_offset_y,
          symbolAt,
        ),
      },
    });
  }

  result.hasLabel = elements.length > 0;
  const symbolElement = elements.find((e) => e.name === "symbol");
  if (
    symbolElement &&
    outsideMargin(kernel, scope, symbolElement.element.shape, centre)
  ) {
    result.warnings.push(SYMBOL_EDGE_WARNING);
  }

  const extrude = (cs: CrossSection, z: number, h: number) =>
    scope.add(scope.add(kernel.Manifold.extrude(cs, h)).translate(0, 0, z));

  for (const { name, element } of elements) {
    const { mode, shape } = element;
    if (mode === "engraved") {
      result.cuts.push(
        extrude(shape, plateTop - p.emboss_depth, p.emboss_depth + 0.01),
      );
    } else if (mode === "flush") {
      // pocket in the plate, and an inlay of exactly the same shape: a separate body
      result.cuts.push(extrude(shape, plateTop - p.flush_depth, p.flush_depth + 0.01));
      result[name] = extrude(shape, plateTop - p.flush_depth, p.flush_depth);
    } else if (mode === "raised") {
      // stands on the plate; a separate body, top at plateTop + emboss_depth
      result[name] = extrude(shape, plateTop, p.emboss_depth);
    }
  }
  return result;
};
