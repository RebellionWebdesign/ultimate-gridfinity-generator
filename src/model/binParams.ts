// Bin parameters. Names follow the reference script (reference/gridfinity_generator.scad).
// The spec value is the minimum and the default; the user can only raise a value, up to
// its limit (spec section 4, ui-spec section 8).
import { CONSTANTS } from "../gridfinity/constants";
import { STONE, type NumberLimit } from "./lidParams";

/** with_lip: stacking lip (+4.4 mm). flat_same_height: no lip, same total height. flat_lower: no lip, 4.4 mm lower. */
export type FootHollow = "none" | "open";

export type LipStyle = "with_lip" | "flat_same_height" | "flat_lower";

export interface BinParams {
  units_x: number;
  units_y: number;
  /** height in 7 mm units, the stacking lip is extra */
  height_units: number;
  lip_style: LipStyle;
  wall_thickness: number;
  /** floor thickness above the 4.75 mm foot */
  bottom_thickness: number;
  /** hollow foot: one straight cavity from below, like on the lid */
  foot_hollow: FootHollow;
  foot_wall: number;
  corner_magnets: boolean;
  corner_magnet_d: number;
  corner_magnet_h: number;
  center_magnet: boolean;
  center_magnet_d: number;
  center_magnet_h: number;
  magnet_clearance: number;
  plate_color: string;
  lip_color_enabled: boolean;
  lip_color: string;
}

const MAG_WALL = 0.75;

export const BIN_LIMITS = {
  units_x: { min: 1, max: 12, step: 1, why: "12 cells is the script's limit" },
  units_y: { min: 1, max: 12, step: 1, why: "12 cells is the script's limit" },
  height_units: {
    min: 1,
    max: 85,
    step: 1,
    why: "85 units fill the largest build height of a custom printer (600 mm); the bed check limits it to your printer",
  },
  wall_thickness: {
    min: 1.2,
    max: 2.5,
    step: 0.1,
    why: "1.2 mm is the project's default; the stacking lip needs a wall below 2.6 mm",
  },
  bottom_thickness: {
    min: 0.8,
    max: 5,
    step: 0.1,
    why: "0.8 mm is the project's default; 5 mm is the script's limit",
  },
  foot_wall: {
    min: 1.2,
    max: 3,
    step: 0.1,
    why: "1.2 mm is the project's default; 3 mm is the script's limit",
  },
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
  center_magnet_d: {
    min: CONSTANTS.magnetPocketDiameter.value,
    max: 10,
    step: 0.1,
    why: "6.1 mm like the corner pocket (owner, 3 November 2026); 10 mm is the largest the foot holds",
  },
  center_magnet_h: {
    min: 2,
    max: 5,
    step: 0.1,
    why: "2 mm is the project's default; 5 mm is the script's limit",
  },
  magnet_clearance: {
    min: 0.2,
    max: 0.6,
    step: 0.05,
    why: "0.2 mm is the project's default; 0.6 mm is the script's limit",
  },
} as const satisfies Record<string, NumberLimit>;

export type BinLimitedKey = keyof typeof BIN_LIMITS;

export const DEFAULT_BIN: BinParams = {
  units_x: 1,
  units_y: 1,
  height_units: 3,
  lip_style: "with_lip",
  wall_thickness: BIN_LIMITS.wall_thickness.min,
  bottom_thickness: BIN_LIMITS.bottom_thickness.min,
  foot_hollow: "none",
  foot_wall: BIN_LIMITS.foot_wall.min,
  corner_magnets: false,
  corner_magnet_d: BIN_LIMITS.corner_magnet_d.min,
  corner_magnet_h: BIN_LIMITS.corner_magnet_h.min,
  center_magnet: false,
  center_magnet_d: BIN_LIMITS.center_magnet_d.min,
  center_magnet_h: BIN_LIMITS.center_magnet_h.min,
  magnet_clearance: BIN_LIMITS.magnet_clearance.min,
  plate_color: STONE,
  lip_color_enabled: false,
  lip_color: STONE,
};

/** Height the top edge adds to the body: the stacking lip, or the same height without a lip. */
export const topExtra = (style: LipStyle): number =>
  style === "flat_lower" ? 0 : CONSTANTS.lipHeight.value;

/** The most height units that fit a build height (at least 1, at most the limit). */
export const maxHeightUnits = (buildHeight: number, style: LipStyle): number =>
  Math.min(
    BIN_LIMITS.height_units.max,
    Math.max(
      BIN_LIMITS.height_units.min,
      Math.floor((buildHeight - topExtra(style) + 1e-9) / CONSTANTS.heightUnit.value),
    ),
  );

/** Material that must stay above the tallest magnet in the floor (script `MAG_ROOF`). */
export const MIN_FLOOR_OVER_MAGNET = 0.8;

/**
 * Height of the cavity floor: the floor above the foot, raised when a magnet pocket is
 * deeper than that, so 0.8 mm of material stays above the tallest magnet.
 */
export const floorZOf = (p: BinParams): number => {
  const pocket = Math.max(
    p.corner_magnets ? p.corner_magnet_h : 0,
    p.center_magnet ? p.center_magnet_h : 0,
  );
  return Math.max(
    CONSTANTS.footHeight.value + p.bottom_thickness,
    pocket > 0 ? pocket + MIN_FLOOR_OVER_MAGNET : 0,
  );
};

/** Error messages for every value outside its limit; empty when the bin is valid. */
export const validateBin = (p: BinParams): string[] => {
  const errors: string[] = [];
  for (const key of Object.keys(BIN_LIMITS) as BinLimitedKey[]) {
    const { min, max } = BIN_LIMITS[key];
    const value = p[key];
    if (!Number.isFinite(value) || value < min - 1e-9 || value > max + 1e-9) {
      errors.push(`${key} must be between ${min} and ${max}, got ${value}.`);
    }
  }
  for (const key of ["plate_color", "lip_color"] as const) {
    if (!/^#[0-9a-fA-F]{6}$/.test(p[key])) {
      errors.push(`${key} must be a #rrggbb colour.`);
    }
  }
  return errors;
};

/** Clamp a value into [min, max] of its limit. Never returns a value below the minimum. */
export const clampBin = (key: BinLimitedKey, value: number): number => {
  const { min, max } = BIN_LIMITS[key];
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};
