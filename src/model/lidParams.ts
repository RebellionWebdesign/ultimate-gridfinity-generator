// Lid parameters. Names follow the reference script (reference/gridfinity_generator.scad)
// so that the TypeScript output can be compared with it. The spec value is the minimum
// and the default; the user can only raise a value, up to its limit (spec section 4).
import { CONSTANTS } from "../gridfinity/constants";

export type Variant = "dust_cover" | "stackable";
export type LipMode = "full" | "corners_only";
export type FootLayout = "merged" | "per_cell";
export type PlateThicknessMode = "auto" | "manual";
export type PrintOrientation = "foot_down" | "upside_down";
export type FootHollow = "none" | "open";
export type LabelMode = "none" | "raised" | "engraved" | "flush";
export type BundledFont = "Inter" | "IBM Plex Mono" | "IBM Plex Sans SemiBold";
/** a bundled font, or `upload`: the user's own font file (`font_data`) */
export type FontChoice = BundledFont | "upload";
export type SymbolSource = "lucide" | "upload";
export type LabelArrange = "icon_left" | "icon_right" | "icon_above" | "icon_below";
export type LabelAlign = "center" | "start" | "end";

export interface LidParams {
  units_x: number;
  units_y: number;
  variant: Variant;
  lip_mode: LipMode;
  corner_len: number;
  foot_layout: FootLayout;
  plate_thickness_mode: PlateThicknessMode;
  plate_thickness: number;
  height_units_auto: number;
  print_orientation: PrintOrientation;
  corner_magnets: boolean;
  corner_magnet_d: number;
  corner_magnet_h: number;
  foot_hollow: FootHollow;
  foot_wall: number;
  text_string: string;
  text_mode: LabelMode;
  text_size: number;
  font_choice: FontChoice;
  /** name of the uploaded font file */
  font_name: string;
  /** the uploaded font file, base64 (the user is responsible for its licence) */
  font_data: string;
  symbol_mode: LabelMode;
  symbol_source: SymbolSource;
  symbol_icon: string;
  icon_size: number;
  /** contents of the uploaded SVG file (script: `svg_file`) */
  svg: string;
  symbol_scale: number;
  label_arrange: LabelArrange;
  emboss_depth: number;
  label_group: boolean;
  label_align: LabelAlign;
  label_gap: number;
  label_center: boolean;
  text_offset_x: number;
  text_offset_y: number;
  text_rotation: number;
  symbol_offset_x: number;
  symbol_offset_y: number;
  symbol_rotation: number;
  flush_depth: number;
  plate_color: string;
  text_color: string;
  symbol_color: string;
  lip_color_enabled: boolean;
  lip_color: string;
}

export interface NumberLimit {
  /** Spec value: minimum and default (script default where noted in the docs). */
  min: number;
  max: number;
  step: number;
  /** Why the limit is what it is, shown next to the field. */
  why: string;
  /** Not part of the Gridfinity spec: the UI tags it. */
  nonSpec?: boolean;
}

const MAG_WALL = 0.75;
const plateMin = CONSTANTS.firstLayerUsable.value;

export const LID_LIMITS = {
  units_x: { min: 1, max: 12, step: 1, why: "12 cells is the script's limit" },
  units_y: { min: 1, max: 12, step: 1, why: "12 cells is the script's limit" },
  plate_thickness: {
    min: plateMin,
    max: 20,
    step: 0.05,
    why: "2.25 mm is the usable space of the first 7 mm layer (Gridfinity spec)",
    nonSpec: true,
  },
  height_units_auto: { min: 1, max: 6, step: 1, why: "6 units is the script's limit" },
  corner_magnet_d: {
    min: CONSTANTS.magnetPocketDiameter.value,
    // 2 x (4.8 - 0.75), rounded against float noise
    max:
      Math.round(2 * (CONSTANTS.holeCentreFromFootEdge.value - MAG_WALL) * 100) / 100,
    step: 0.1,
    why: "8.1 keeps 0.75 mm of wall at the foot edge",
  },
  corner_magnet_h: {
    min: CONSTANTS.magnetPocketDepth.value,
    max: 3.9,
    step: 0.1,
    why: "3.9 mm is the script's limit",
  },
  corner_len: {
    min: 10,
    max: 30,
    step: 1,
    why: "30 mm is the script's limit",
    nonSpec: true,
  },
  foot_wall: {
    min: 1.2,
    max: 3,
    step: 0.1,
    why: "3 mm is the script's limit",
    nonSpec: true,
  },
  text_size: {
    min: 8,
    max: 30,
    step: 0.5,
    why: "8 mm is the smallest text that prints cleanly; 30 mm is the script's limit",
    nonSpec: true,
  },
  icon_size: {
    min: 4,
    max: 40,
    step: 1,
    why: "40 mm is the script's limit",
    nonSpec: true,
  },
  symbol_scale: {
    min: 0.05,
    max: 10,
    step: 0.05,
    why: "10 times is the script's limit",
    nonSpec: true,
  },
  label_gap: {
    min: 0,
    max: 20,
    step: 0.5,
    why: "20 mm is the script's limit",
    nonSpec: true,
  },
  emboss_depth: {
    min: 0.6,
    max: 2,
    step: 0.1,
    why: "0.6 mm is the project's default; 2 mm is the script's limit",
    nonSpec: true,
  },
  flush_depth: {
    min: 0.4,
    max: 1.2,
    step: 0.2,
    why: "0.4 mm is two layers; 1.2 mm is the script's limit",
    nonSpec: true,
  },
  text_rotation: {
    min: -180,
    max: 180,
    step: 5,
    why: "a full turn either way",
    nonSpec: true,
  },
  symbol_rotation: {
    min: -180,
    max: 180,
    step: 5,
    why: "a full turn either way",
    nonSpec: true,
  },
} as const satisfies Record<string, NumberLimit>;

export type LimitedKey = keyof typeof LID_LIMITS;

export const STONE = "#9DA39A";
export const BLACK = "#000000";

export const DEFAULT_LID: LidParams = {
  units_x: 1,
  units_y: 1,
  variant: "dust_cover",
  lip_mode: "full",
  corner_len: LID_LIMITS.corner_len.min,
  foot_layout: "merged",
  plate_thickness_mode: "auto",
  plate_thickness: LID_LIMITS.plate_thickness.min,
  height_units_auto: 1,
  print_orientation: "foot_down",
  corner_magnets: false,
  corner_magnet_d: LID_LIMITS.corner_magnet_d.min,
  corner_magnet_h: LID_LIMITS.corner_magnet_h.min,
  foot_hollow: "none",
  foot_wall: LID_LIMITS.foot_wall.min,
  text_string: "Text",
  text_mode: "none",
  text_size: LID_LIMITS.text_size.min,
  font_choice: "Inter",
  font_name: "",
  font_data: "",
  symbol_mode: "none",
  symbol_source: "lucide",
  symbol_icon: "safety_hard-hat",
  icon_size: 14,
  svg: "",
  symbol_scale: 1,
  label_arrange: "icon_left",
  emboss_depth: LID_LIMITS.emboss_depth.min,
  label_group: true,
  label_align: "center",
  label_gap: 3,
  label_center: true,
  text_offset_x: 0,
  text_offset_y: 0,
  text_rotation: 0,
  symbol_offset_x: 0,
  symbol_offset_y: 0,
  symbol_rotation: 0,
  flush_depth: LID_LIMITS.flush_depth.min,
  plate_color: STONE,
  text_color: BLACK,
  symbol_color: BLACK,
  lip_color_enabled: false,
  lip_color: STONE,
};

/** Offsets of text and symbol: plus or minus half the lid, a placeholder (brand.md 8.2). */
export const offsetLimit = (p: LidParams, axis: "x" | "y"): number =>
  (p[axis === "x" ? "units_x" : "units_y"] * 42 - 0.5) / 2;

const PLATE_MIN_FOR_LABEL = 0.4;

/** Error messages for every value outside its limit; empty when the lid is valid. */
export const validateLid = (p: LidParams): string[] => {
  const errors: string[] = [];
  for (const key of Object.keys(LID_LIMITS) as LimitedKey[]) {
    const { min, max } = LID_LIMITS[key];
    const value = p[key];
    if (!Number.isFinite(value) || value < min - 1e-9 || value > max + 1e-9) {
      errors.push(`${key} must be between ${min} and ${max}, got ${value}.`);
    }
  }
  for (const key of ["text_offset_x", "symbol_offset_x"] as const) {
    if (!(Math.abs(p[key]) <= offsetLimit(p, "x")))
      errors.push(`${key} is out of range.`);
  }
  for (const key of ["text_offset_y", "symbol_offset_y"] as const) {
    if (!(Math.abs(p[key]) <= offsetLimit(p, "y")))
      errors.push(`${key} is out of range.`);
  }
  for (const key of [
    "plate_color",
    "text_color",
    "symbol_color",
    "lip_color",
  ] as const) {
    if (!/^#[0-9a-fA-F]{6}$/.test(p[key]))
      errors.push(`${key} must be a #rrggbb colour.`);
  }
  const plate = plateThicknessOf(p);
  const cut = Math.max(
    ...[
      [p.text_mode, p.symbol_mode].includes("engraved") ? p.emboss_depth : 0,
      [p.text_mode, p.symbol_mode].includes("flush") ? p.flush_depth : 0,
    ],
  );
  if (cut > plate - PLATE_MIN_FOR_LABEL + 1e-9) {
    errors.push(
      `Label depth ${cut} mm is too large for a ${plate} mm plate: leave at least ${PLATE_MIN_FOR_LABEL} mm of plate under engraved or flush labels.`,
    );
  }
  if (p.variant === "stackable" && p.lip_mode === "corners_only") {
    const half = Math.min(p.units_x, p.units_y) * 42 - 0.5;
    if (p.corner_len > half / 2) {
      errors.push("corner_len must be at most half of the shorter side.");
    }
  }
  return errors;
};

/** Plate thickness above the 4.75 foot (auto: total height is a multiple of 7). */
export const plateThicknessOf = (p: LidParams): number =>
  p.plate_thickness_mode === "auto"
    ? p.height_units_auto * CONSTANTS.heightUnit.value - CONSTANTS.footHeight.value
    : p.plate_thickness;

/** Clamp a value into [min, max] of its limit. Never returns a value below the minimum. */
export const clampToLimit = (key: LimitedKey, value: number): number => {
  const { min, max } = LID_LIMITS[key];
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};
