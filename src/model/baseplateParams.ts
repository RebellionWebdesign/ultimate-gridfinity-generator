// Baseplate parameters. Names follow the reference script (reference/gridfinity_generator.scad)
// so that the TypeScript output can be compared with it. The spec value is the minimum and
// the default; the user can only raise a value, up to its limit (spec section 4).
import { CONSTANTS } from "../gridfinity/constants";
import { STONE, type NumberLimit } from "./lidParams";

export type BaseplateStyle = "solid" | "skeleton";

export interface BaseplateParams {
  units_x: number;
  units_y: number;
  baseplate_style: BaseplateStyle;
  /** solid base under the pocket floor; raised automatically under magnets */
  baseplate_base: number;
  corner_magnets: boolean;
  corner_magnet_d: number;
  corner_magnet_h: number;
  center_magnet: boolean;
  center_magnet_d: number;
  center_magnet_h: number;
  magnet_clearance: number;
  /** skeleton style: the centre magnet's pad is held to the frame by four ribs */
  rib_width: number;
  /** fit to a drawer: the plate is at least this wide and deep (mm, 0 = off), the rest is solid */
  plate_min_x_mm: number;
  plate_min_y_mm: number;
  /** where the extra goes: -1 left / front, 0 both sides, 1 right / back */
  fit_x: number;
  fit_y: number;
  /** cut the plate into pieces that each fit the printer bed (one file per piece) */
  split_to_bed: boolean;
  plate_color: string;
}

const MAG_WALL = 0.75;

export const BASEPLATE_LIMITS = {
  units_x: { min: 1, max: 24, step: 1, why: "24 cells are 1008 mm, a drawer of 1 m" },
  units_y: { min: 1, max: 24, step: 1, why: "24 cells are 1008 mm, a drawer of 1 m" },
  baseplate_base: {
    min: 0.4,
    max: 8,
    step: 0.05,
    why: "0.4 mm is the owner's smallest base (the plate is then 5.05 mm tall); 8 mm is the script's limit",
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
    why: "6.1 mm like the corner pocket (owner, 3 November 2026); 10 mm is the largest the cell holds",
  },
  center_magnet_h: {
    min: 2,
    max: 5,
    step: 0.1,
    why: "2 mm is the project's default; 5 mm is the script's limit",
  },
  magnet_clearance: {
    min: 0.1,
    max: 0.6,
    step: 0.05,
    why: "0.1 mm is the owner's smallest clearance on the baseplate; 0.6 mm is the script's limit",
  },
  rib_width: {
    min: 2,
    max: 10,
    step: 0.5,
    why: "2 to 10 mm is the script's range",
  },
  plate_min_x_mm: {
    min: 0,
    max: 1000,
    step: 0.5,
    why: "0 switches it off; 1000 mm is a drawer of 1 m",
  },
  plate_min_y_mm: {
    min: 0,
    max: 1000,
    step: 0.5,
    why: "0 switches it off; 1000 mm is a drawer of 1 m",
  },
  fit_x: { min: -1, max: 1, step: 0.1, why: "-1 left, 0 both sides, 1 right" },
  fit_y: { min: -1, max: 1, step: 0.1, why: "-1 front, 0 both sides, 1 back" },
} as const satisfies Record<string, NumberLimit>;

export type BaseplateLimitedKey = keyof typeof BASEPLATE_LIMITS;

export const DEFAULT_BASEPLATE: BaseplateParams = {
  units_x: 1,
  units_y: 1,
  baseplate_style: "solid",
  baseplate_base: BASEPLATE_LIMITS.baseplate_base.min,
  corner_magnets: false,
  corner_magnet_d: BASEPLATE_LIMITS.corner_magnet_d.min,
  corner_magnet_h: BASEPLATE_LIMITS.corner_magnet_h.min,
  center_magnet: false,
  center_magnet_d: BASEPLATE_LIMITS.center_magnet_d.min,
  center_magnet_h: BASEPLATE_LIMITS.center_magnet_h.min,
  magnet_clearance: BASEPLATE_LIMITS.magnet_clearance.min,
  rib_width: 4,
  plate_min_x_mm: 0,
  plate_min_y_mm: 0,
  fit_x: 0,
  fit_y: 0,
  split_to_bed: false,
  plate_color: STONE,
};

/** Material that must stay under a magnet pocket floor (script: `cm_h + 0.4`). */
export const MIN_BASE_UNDER_MAGNET = 0.4;

/** Solid base actually built: raised so every magnet pocket keeps its floor. */
export const baseOf = (p: BaseplateParams): number =>
  Math.max(
    p.baseplate_base,
    p.corner_magnets ? p.corner_magnet_h + MIN_BASE_UNDER_MAGNET : 0,
    p.center_magnet ? p.center_magnet_h + MIN_BASE_UNDER_MAGNET : 0,
  );

/** Error messages for every value outside its limit; empty when the baseplate is valid. */
export const validateBaseplate = (p: BaseplateParams): string[] => {
  const errors: string[] = [];
  for (const key of Object.keys(BASEPLATE_LIMITS) as BaseplateLimitedKey[]) {
    const { min, max } = BASEPLATE_LIMITS[key];
    const value = p[key];
    if (!Number.isFinite(value) || value < min - 1e-9 || value > max + 1e-9) {
      errors.push(`${key} must be between ${min} and ${max}, got ${value}.`);
    }
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(p.plate_color)) {
    errors.push("plate_color must be a #rrggbb colour.");
  }
  return errors;
};

/** Clamp a value into [min, max] of its limit. Never returns a value below the minimum. */
export const clampBaseplate = (key: BaseplateLimitedKey, value: number): number => {
  const { min, max } = BASEPLATE_LIMITS[key];
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};
