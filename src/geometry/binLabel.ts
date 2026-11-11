// The bin label (E-09): a flat plate 1 mm thick with a lug on each short side, that clicks
// into the slots in the side walls of the bin (see `labelSlots` in bin.ts). The text comes
// from the lid text generator (`buildLabel`). Built flat on the bed, centred on x/y, the
// text on the top face.
import type { Manifold } from "manifold-3d";
import { CONSTANTS } from "../gridfinity/constants";
import { labelWidthOf, type BinParams } from "../model/binParams";
import { labelRestZ, layoutOf } from "./bin";
import { labelAsLid, type LabelParams } from "../model/labelParams";
import type { Kernel, Scope } from "./kernel";
import { buildLabel, type LabelAssets } from "./label";
import type { Contour, Point } from "./svg";

const c = (name: keyof typeof CONSTANTS): number => CONSTANTS[name].value;

/** Points per quarter circle of the rounded corners of the plate. */
const CORNER_SEGMENTS = 12;

export interface BinLabelParts {
  plate: Manifold;
  /** raised or flush text, a separate body so the slicer can give it a filament */
  text?: Manifold;
  /** a raised or flush symbol, also a separate body */
  symbol?: Manifold;
  /** hints for the user, not errors */
  warnings: string[];
}

/** Corner radius of the plate on the side of the wall: that of the cavity at the plate edge. */
export const labelCornerRadius = (): number =>
  Math.max(c("binCornerRadius") - c("labelEdgeInset"), 0.8);

/**
 * Outline of the plate, corner at the origin: x along the wall (0 to the width), y from the
 * straight edge (0) to the edge on the side of the wall (the depth), which has the rounded
 * corners of the cavity.
 */
export const labelOutline = (width: number, depth: number): Contour => {
  const r = labelCornerRadius();
  const arc = (cx: number, cy: number, from: number): Point[] =>
    Array.from({ length: CORNER_SEGMENTS + 1 }, (_, i) => {
      const a = ((from + (90 * i) / CORNER_SEGMENTS) * Math.PI) / 180;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    });
  return [
    [0, 0],
    [width, 0],
    ...arc(width - r, depth - r, 0),
    ...arc(r, depth - r, 90),
  ];
};

/**
 * The label as it sits in the bin (for the preview): 2 mm in from the wall it belongs to,
 * its underside on the first slope of the lip. Coordinates of the finished bin (centred on x/y).
 */
export const placeInBin = (
  scope: Scope,
  bin: BinParams,
  parts: BinLabelParts,
): { plate: Manifold; text?: Manifold; symbol?: Manifold } => {
  const layout = layoutOf(bin);
  const front = bin.label_slot === "front";
  const y =
    (front ? -1 : 1) * (layout.depth / 2 - c("labelEdgeInset") - c("labelDepth") / 2);
  const put = (part: Manifold | undefined) => {
    if (!part) return undefined;
    const turned = front ? scope.add(part.rotate(0, 0, 180)) : part;
    return scope.add(turned.translate(0, y, labelRestZ(layout)));
  };
  return {
    plate: put(parts.plate) as Manifold,
    text: put(parts.text),
    symbol: put(parts.symbol),
  };
};

export const buildBinLabel = (
  kernel: Kernel,
  scope: Scope,
  bin: BinParams,
  label: LabelParams,
  assets: LabelAssets = {},
): BinLabelParts => {
  const width = labelWidthOf(bin);
  const depth = c("labelDepth");
  const thickness = c("labelThickness");
  const lug = c("labelLugLength");
  const y1 = depth - c("labelLugOffset");
  const y0 = y1 - c("labelLugWidth");
  const overlap = 0.01; // the lugs sink a little into the plate so the union is solid

  const outline = scope.add(new kernel.CrossSection([labelOutline(width, depth)]));
  const base = scope.add(kernel.Manifold.extrude(outline, thickness));

  // A lug is a section (x, z) pushed along the wall: its upper and lower outer edges have a 45
  // degree chamfer, so the lug slides into the slot more easily.
  const cc = c("labelLugChamfer");
  const section = (side: "left" | "right"): Point[] =>
    side === "left"
      ? [
          [overlap, thickness],
          [-lug + cc, thickness],
          [-lug, thickness - cc],
          [-lug, cc],
          [-lug + cc, 0],
          [overlap, 0],
        ]
      : [
          [width - overlap, 0],
          [width + lug - cc, 0],
          [width + lug, cc],
          [width + lug, thickness - cc],
          [width + lug - cc, thickness],
          [width - overlap, thickness],
        ];
  const lugSolid = (side: "left" | "right") => {
    const prism = scope.add(
      scope.add(new kernel.CrossSection([section(side)])).extrude(y1 - y0),
    );
    // (x, z, along) -> (x, y = -along, z): a quarter turn about x
    const turned = scope.add(
      prism.transform([1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1]),
    );
    return scope.add(turned.translate(0, y1, 0));
  };
  let plate = scope.add(
    kernel.Manifold.union([base, lugSolid("left"), lugSolid("right")]),
  );

  const text = buildLabel(
    kernel,
    scope,
    labelAsLid(label),
    assets,
    thickness,
    [width / 2, depth / 2],
    labelCornerRadius(),
    c("labelTextSink"),
  );
  if (text.cuts.length > 0) {
    plate = scope.add(kernel.Manifold.difference([plate, ...text.cuts]));
  }

  const centre = (part: Manifold | undefined) =>
    part ? scope.add(part.translate(-width / 2, -depth / 2, 0)) : undefined;
  return {
    plate: centre(plate) as Manifold,
    text: centre(text.text),
    symbol: centre(text.symbol),
    warnings: text.warnings,
  };
};
