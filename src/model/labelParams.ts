// Parameters of the bin label (E-09): a flat plate with two lugs that clicks into slots in
// the side walls of the bin, with text from the lid text generator. The size of the plate
// comes from the bin (its width), so a label always belongs to the current bin.
import { CONSTANTS } from "../gridfinity/constants";
import { labelWidthOf, type BinParams } from "./binParams";
import {
  BLACK,
  DEFAULT_LID,
  LID_LIMITS,
  STONE,
  type LidParams,
  type NumberLimit,
} from "./lidParams";

/** The text settings of a lid, the same rules (spec of the lid text), plus the two colours. */
export type LabelParams = Pick<
  LidParams,
  | "text_string"
  | "text_mode"
  | "text_size"
  | "font_choice"
  | "font_name"
  | "font_data"
  | "emboss_depth"
  | "flush_depth"
  | "text_offset_x"
  | "text_offset_y"
  | "text_rotation"
  | "symbol_mode"
  | "symbol_source"
  | "symbol_icon"
  | "icon_size"
  | "svg"
  | "symbol_scale"
  | "label_arrange"
  | "label_group"
  | "label_align"
  | "label_gap"
  | "label_center"
  | "symbol_offset_x"
  | "symbol_offset_y"
  | "symbol_rotation"
  | "plate_color"
  | "text_color"
  | "symbol_color"
>;

export const LABEL_LIMITS = {
  text_size: LID_LIMITS.text_size,
  emboss_depth: LID_LIMITS.emboss_depth,
  // the plate is 1 mm: at least 0.4 mm of plate stay under a flush inlay or an engraving
  flush_depth: {
    min: 0.4,
    max: 0.6,
    step: 0.2,
    why: "the plate is 1 mm thick: 0.4 mm of plate stay under a flush inlay",
  },
  text_rotation: LID_LIMITS.text_rotation,
  icon_size: LID_LIMITS.icon_size,
  symbol_scale: LID_LIMITS.symbol_scale,
  label_gap: LID_LIMITS.label_gap,
  symbol_rotation: LID_LIMITS.symbol_rotation,
} as const satisfies Record<string, NumberLimit>;

export type LabelLimitedKey = keyof typeof LABEL_LIMITS;

export const DEFAULT_LABEL: LabelParams = {
  text_string: "Text",
  text_mode: "raised",
  text_size: LABEL_LIMITS.text_size.min,
  font_choice: DEFAULT_LID.font_choice,
  font_name: "",
  font_data: "",
  emboss_depth: LABEL_LIMITS.emboss_depth.min,
  flush_depth: LABEL_LIMITS.flush_depth.min,
  text_offset_x: 0,
  text_offset_y: 0,
  text_rotation: 0,
  symbol_mode: "none",
  symbol_source: DEFAULT_LID.symbol_source,
  symbol_icon: DEFAULT_LID.symbol_icon,
  icon_size: DEFAULT_LID.icon_size,
  svg: "",
  symbol_scale: DEFAULT_LID.symbol_scale,
  label_arrange: DEFAULT_LID.label_arrange,
  label_group: DEFAULT_LID.label_group,
  label_align: DEFAULT_LID.label_align,
  label_gap: DEFAULT_LID.label_gap,
  label_center: DEFAULT_LID.label_center,
  symbol_offset_x: 0,
  symbol_offset_y: 0,
  symbol_rotation: 0,
  plate_color: STONE,
  text_color: BLACK,
  symbol_color: BLACK,
};

/** The text and symbol settings in the form the lid label generator reads. */
export const labelAsLid = (l: LabelParams): LidParams => ({ ...DEFAULT_LID, ...l });

/** Size of the plate in mm: width follows the bin, depth is fixed. */
export const labelSize = (bin: Pick<BinParams, "units_x">): [number, number] => [
  labelWidthOf(bin),
  CONSTANTS.labelDepth.value,
];

/** Offsets of the text: plus or minus half the plate. */
export const labelOffsetLimit = (
  bin: Pick<BinParams, "units_x">,
  axis: "x" | "y",
): number => labelSize(bin)[axis === "x" ? 0 : 1] / 2;

const MIN_PLATE_UNDER_TEXT = 0.4;

/** Error messages for every value outside its limit; empty when the label can be built. */
export const validateLabel = (bin: BinParams, l: LabelParams): string[] => {
  const errors: string[] = [];
  for (const key of Object.keys(LABEL_LIMITS) as LabelLimitedKey[]) {
    const { min, max } = LABEL_LIMITS[key];
    const value = l[key];
    if (!Number.isFinite(value) || value < min - 1e-9 || value > max + 1e-9) {
      errors.push(`${key} must be between ${min} and ${max}, got ${value}.`);
    }
  }
  for (const axis of ["x", "y"] as const) {
    for (const part of ["text", "symbol"] as const) {
      const key = `${part}_offset_${axis}` as const;
      if (!(Math.abs(l[key]) <= labelOffsetLimit(bin, axis))) {
        errors.push(`${key} is out of range.`);
      }
    }
  }
  for (const key of ["plate_color", "text_color", "symbol_color"] as const) {
    if (!/^#[0-9a-fA-F]{6}$/.test(l[key]))
      errors.push(`${key} must be a #rrggbb colour.`);
  }
  const modes = [l.text_mode, l.symbol_mode];
  const cut = Math.max(
    modes.includes("engraved") ? l.emboss_depth : 0,
    modes.includes("flush") ? l.flush_depth : 0,
  );
  const plate = CONSTANTS.labelThickness.value;
  if (cut > plate - MIN_PLATE_UNDER_TEXT + 1e-9) {
    errors.push(
      `Text depth ${cut} mm is too large for a ${plate} mm plate: leave at least ${MIN_PLATE_UNDER_TEXT} mm of plate under engraved or flush text.`,
    );
  }
  if (bin.lip_style !== "with_lip") {
    errors.push(
      "The label rests on the stacking lip of the bin. Choose the stacking lip in the bin, then the label fits.",
    );
  }
  return errors;
};

export const clampLabel = (key: LabelLimitedKey, value: number): number => {
  const { min, max } = LABEL_LIMITS[key];
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};
