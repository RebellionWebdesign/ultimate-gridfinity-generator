// Bin parameters. Names follow the reference script (reference/gridfinity_generator.scad).
// The spec value is the minimum and the default; the user can only raise a value, up to
// its limit (spec section 4, ui-spec section 8).
import { CONSTANTS, outerSize } from "../gridfinity/constants";
import { STONE, type NumberLimit } from "./lidParams";

/** with_lip: stacking lip (+4.4 mm). flat_same_height: no lip, same total height. flat_lower: no lip, 4.4 mm lower. */
export type FootHollow = "none" | "open";

/**
 * Where a label sits in the bin (E-09): at which wall, with slots for its lugs in the two
 * walls next to it. Version 1.1 (owner, 11 November 2026): any of the four walls, so a bin
 * that is not square can take the label on its long or its short side.
 */
export type LabelSlot = "none" | "front" | "back" | "left" | "right";

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
  /** a curved ramp along the front wall (E-08) */
  scoop: boolean;
  /** thickness of all dividers; also the least gap between two dividers and to a wall (E-07) */
  divider_thickness: number;
  /** walls across the whole cavity (E-07) */
  dividers: Divider[];
  /** slots in the side walls for a label plate (E-09) */
  label_slot: LabelSlot;
}

/**
 * A divider (E-07) runs across the whole width of the cavity and ends at the side walls.
 * Its position is the middle of the divider, measured along the depth from the inner face of
 * the front wall; the height is measured from the cavity floor.
 */
export interface Divider {
  position: number;
  height: number;
}

const MAG_WALL = 0.75;

export const DIVIDER_LIMITS = {
  // owner, 9 November 2026: 0.8 to 1.6 mm in steps of 0.2; the least gap equals the thickness
  thickness: {
    min: 0.8,
    max: 1.6,
    step: 0.2,
    why: "0.8 to 1.6 mm in steps of 0.2 mm; the least gap between dividers and to the walls is the thickness",
  },
  height: {
    min: 1,
    max: 600,
    step: 0.1,
    why: "up to the lower edge of the step under the stacking lip, like the scoop",
  },
  count: { max: 40 },
} as const;

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
  divider_thickness: DIVIDER_LIMITS.thickness,
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
  scoop: false,
  divider_thickness: DIVIDER_LIMITS.thickness.min,
  dividers: [],
  label_slot: "none",
};

/** A fresh copy of the defaults: the divider list must not be shared between bins. */
export const newBin = (): BinParams => ({ ...DEFAULT_BIN, dividers: [] });

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

/** Height of the scoop: from the cavity floor to the lower edge of the lip step (the top of the body without a lip). */
export const scoopHeightOf = (p: BinParams): number =>
  p.height_units * CONSTANTS.heightUnit.value -
  (p.lip_style === "with_lip" ? CONSTANTS.lipStepHeight.value : 0) -
  floorZOf(p);

/** What the size of the label plate depends on: the bin and the wall the label sits at. */
export type LabelBin = Pick<BinParams, "units_x"> &
  Partial<Pick<BinParams, "units_y" | "label_slot">>;

/** Whether the label sits at a wall along y (left or right): its plate then runs along the depth. */
export const labelOnSideWall = (p: Pick<LabelBin, "label_slot">): boolean =>
  p.label_slot === "left" || p.label_slot === "right";

/**
 * Width of the label plate: from edge to edge of the first slope of the lip along its wall,
 * 37.5 on a 1 x 1 bin. At the left or right wall it follows the depth of the bin.
 */
export const labelWidthOf = (p: LabelBin): number =>
  outerSize(labelOnSideWall(p) ? (p.units_y ?? p.units_x) : p.units_x) -
  2 * CONSTANTS.labelEdgeInset.value;

/** The walls a label can sit at, named for the user: "Back (long side)" on a bin that is not square. */
export const labelWallOptions = (
  p: Pick<BinParams, "units_x" | "units_y" | "scoop">,
): { value: LabelSlot; label: string; disabled?: boolean; title?: string }[] => {
  const kind = (alongX: boolean): string =>
    p.units_x === p.units_y
      ? ""
      : alongX === p.units_x > p.units_y
        ? " (long)"
        : " (short)";
  const wall = (value: LabelSlot, name: string, alongX: boolean) => ({
    value,
    label: `${name}${kind(alongX)}`,
    // with a scoop the label sits at the wall opposite it: the scoop is at the front
    disabled: p.scoop && value !== "back",
    title:
      p.scoop && value !== "back"
        ? "With a scoop the label sits opposite it"
        : undefined,
  });
  return [
    { value: "none", label: "None" },
    wall("back", "Back", true),
    wall("front", "Front", true),
    wall("left", "Left", false),
    wall("right", "Right", false),
  ];
};

/** Highest a divider can be: the lower edge of the step under the stacking lip, as for the scoop. */
export const dividerHeightMax = (p: BinParams): number => scoopHeightOf(p);

/** Inner length of the cavity along the depth: the room the dividers stand in. */
export const dividerSpan = (p: BinParams): number =>
  outerSize(p.units_y) - 2 * p.wall_thickness;

const round = (v: number): number => Math.round(v * 1000) / 1000;

/**
 * The dividers that collide: too close to a wall, or to the divider before them (from the
 * front wall backwards). The least gap equals the thickness of the dividers (owner,
 * 9 November 2026). Of two dividers that are too close, the later one collides.
 */
export const collidingDividers = (p: BinParams): Set<Divider> => {
  const t = p.divider_thickness;
  const span = dividerSpan(p);
  const out = new Set<Divider>();
  let end = 0; // the front wall's inner face, then the back edge of the last divider kept
  const ordered = [...p.dividers].sort((a, b) => a.position - b.position);
  for (const d of ordered) {
    const start = d.position - t / 2;
    if (
      !Number.isFinite(d.position) ||
      start < end + t - 1e-9 ||
      d.position + t / 2 > span - t + 1e-9
    ) {
      out.add(d);
    } else {
      end = d.position + t / 2;
    }
  }
  return out;
};

/** The dividers without the ones that collide (what the panel keeps when the thickness grows). */
export const withoutCollisions = (p: BinParams): Divider[] => {
  const bad = collidingDividers(p);
  return p.dividers.filter((d) => !bad.has(d));
};

/**
 * Custom function (not part of the Gridfinity standard): dividers spread evenly. Given the
 * thickness of `p` and the gap the user wants between two dividers (and to the walls), it
 * places as many dividers as fit with at least that gap and spreads them so every gap is
 * the same. The gap that results is a little larger than asked, never smaller.
 */
export const evenDividers = (
  p: BinParams,
  wantedGap: number,
): { dividers: Divider[]; gap: number } => {
  const t = p.divider_thickness;
  const span = dividerSpan(p);
  const wanted = Math.max(wantedGap, t);
  const count = Math.max(
    0,
    Math.min(
      DIVIDER_LIMITS.count.max,
      Math.floor((span - wanted) / (wanted + t) + 1e-9),
    ),
  );
  const gap = (span - count * t) / (count + 1);
  const height = Math.max(DIVIDER_LIMITS.height.min, dividerHeightMax(p));
  return {
    gap,
    dividers: Array.from({ length: count }, (_, i) => ({
      position: gap * (i + 1) + t * i + t / 2,
      height,
    })),
  };
};

/** What is wrong with the dividers: too many, too high, or colliding with a wall or each other. */
export const dividerProblems = (p: BinParams): string[] => {
  const errors: string[] = [];
  const { height, count } = DIVIDER_LIMITS;
  if (p.dividers.length > count.max) {
    errors.push(
      `At most ${count.max} dividers are possible, got ${p.dividers.length}.`,
    );
  }
  const maxHeight = dividerHeightMax(p);
  const bad = collidingDividers(p);
  p.dividers.forEach((d, i) => {
    const name = `Divider ${i + 1}`;
    if (!Number.isFinite(d.height) || d.height < height.min - 1e-9) {
      errors.push(`${name} must be at least ${height.min} mm high.`);
    } else if (d.height > maxHeight + 1e-9) {
      errors.push(
        `${name} is higher than the bin allows (${round(maxHeight)} mm, up to the step under the stacking lip).`,
      );
    }
    if (!Number.isFinite(d.position)) {
      errors.push(`${name} needs a position.`);
    } else if (bad.has(d)) {
      errors.push(
        `${name} collides with a wall or with another divider: keep at least ${p.divider_thickness} mm of room.`,
      );
    }
  });
  return errors;
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
  if (p.scoop && scoopHeightOf(p) <= 0) {
    errors.push(
      "The scoop needs a floor lower than the top of the body: lower the floor or make the bin taller.",
    );
  }
  errors.push(...dividerProblems(p));
  if (p.label_slot !== "none" && p.lip_style !== "with_lip") {
    errors.push(
      "A label needs the stacking lip: its plate rests on the lip. Choose the stacking lip, or switch the label slot off.",
    );
  }
  return errors;
};

/** Clamp a value into [min, max] of its limit. Never returns a value below the minimum. */
export const clampBin = (key: BinLimitedKey, value: number): number => {
  const { min, max } = BIN_LIMITS[key];
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};
