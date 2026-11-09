// Saved model: JSON with model type, schema version, parameters, text, colours and the
// SVG as a string (ADR-0003). A schema change needs a version bump and a migration step.
import {
  BIN_LIMITS,
  DEFAULT_BIN,
  DIVIDER_LIMITS,
  clampBin,
  type BinLimitedKey,
  type BinParams,
  type Divider,
} from "./binParams";
import {
  BASEPLATE_LIMITS,
  DEFAULT_BASEPLATE,
  clampBaseplate,
  type BaseplateLimitedKey,
  type BaseplateParams,
} from "./baseplateParams";
import {
  DEFAULT_LID,
  LID_LIMITS,
  clampToLimit,
  offsetLimit,
  type LidParams,
  type LimitedKey,
} from "./lidParams";

export const SCHEMA_VERSION = 1;

interface ModelFileBase {
  /** the drawer height that locks bins and lids (mm, 0 = off); files without it have 0 */
  drawerHeight: number;
  schemaVersion: number;
  name: string;
  savedAt: string;
  svgName: string;
}

export type ModelFile =
  | (ModelFileBase & { type: "lid"; params: LidParams })
  | (ModelFileBase & { type: "baseplate"; params: BaseplateParams })
  | (ModelFileBase & { type: "bin"; params: BinParams });

export class ModelFileError extends Error {}

const ENUMS: Partial<Record<string, readonly string[]>> = {
  baseplate_style: ["solid", "skeleton"],
  lip_style: ["with_lip", "flat_same_height", "flat_lower"],
  variant: ["dust_cover", "stackable"],
  lip_mode: ["full", "corners_only"],
  foot_layout: ["merged", "per_cell"],
  plate_thickness_mode: ["auto", "manual"],
  print_orientation: ["foot_down", "upside_down"],
  foot_hollow: ["none", "open"],
  text_mode: ["none", "raised", "engraved", "flush"],
  symbol_mode: ["none", "raised", "engraved", "flush"],
  font_choice: ["Inter", "IBM Plex Mono", "IBM Plex Sans SemiBold", "upload"],
  symbol_source: ["lucide", "upload"],
  label_arrange: ["icon_left", "icon_right", "icon_above", "icon_below"],
  label_align: ["center", "start", "end"],
};

/**
 * Parameters of unknown origin to valid ones: wrong types and unknown choices fall back
 * to the default, numbers are clamped into their limit (never below the spec minimum).
 */
export const sanitizeParams = (raw: unknown): LidParams => {
  const input = (typeof raw === "object" && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;
  const out = { ...DEFAULT_LID } as Record<string, unknown>;
  for (const [key, fallback] of Object.entries(DEFAULT_LID)) {
    const value = input[key];
    if (typeof fallback === "number") {
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      out[key] = key in LID_LIMITS ? clampToLimit(key as LimitedKey, value) : value;
    } else if (typeof fallback === "boolean") {
      if (typeof value === "boolean") out[key] = value;
    } else if (typeof value === "string") {
      const choices = ENUMS[key];
      if (choices ? choices.includes(value) : true) out[key] = value;
    }
  }
  const lid = out as unknown as LidParams;
  for (const key of [
    "plate_color",
    "text_color",
    "symbol_color",
    "lip_color",
  ] as const) {
    if (!/^#[0-9a-fA-F]{6}$/.test(lid[key])) lid[key] = DEFAULT_LID[key];
  }
  for (const key of ["text_offset_x", "symbol_offset_x"] as const) {
    lid[key] = Math.max(
      -offsetLimit(lid, "x"),
      Math.min(offsetLimit(lid, "x"), lid[key]),
    );
  }
  for (const key of ["text_offset_y", "symbol_offset_y"] as const) {
    lid[key] = Math.max(
      -offsetLimit(lid, "y"),
      Math.min(offsetLimit(lid, "y"), lid[key]),
    );
  }
  return lid;
};

/** Baseplate parameters of unknown origin to valid ones, like `sanitizeParams`. */
export const sanitizeBaseplate = (raw: unknown): BaseplateParams => {
  const input = (typeof raw === "object" && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;
  const out = { ...DEFAULT_BASEPLATE } as Record<string, unknown>;
  for (const [key, fallback] of Object.entries(DEFAULT_BASEPLATE)) {
    const value = input[key];
    if (typeof fallback === "number") {
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      out[key] =
        key in BASEPLATE_LIMITS
          ? clampBaseplate(key as BaseplateLimitedKey, value)
          : value;
    } else if (typeof fallback === "boolean") {
      if (typeof value === "boolean") out[key] = value;
    } else if (typeof value === "string") {
      const choices = ENUMS[key];
      if (choices ? choices.includes(value) : true) out[key] = value;
    }
  }
  const plate = out as unknown as BaseplateParams;
  if (!/^#[0-9a-fA-F]{6}$/.test(plate.plate_color)) {
    plate.plate_color = DEFAULT_BASEPLATE.plate_color;
  }
  return plate;
};

/**
 * Dividers of unknown origin: only well-formed entries stay, at most the allowed number.
 * Their values are kept as they are; the check of the bin reports a collision or a value out
 * of range, so a file never changes a divider silently.
 */
const sanitizeDividers = (raw: unknown): Divider[] => {
  if (!Array.isArray(raw)) return [];
  const out: Divider[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const { axis, position, height } = item as Record<string, unknown>;
    if (axis === "y") continue; // dividers along the depth were dropped (owner, 9 November 2026)
    if (typeof position !== "number" || !Number.isFinite(position)) continue;
    if (typeof height !== "number" || !Number.isFinite(height)) continue;
    out.push({ position, height });
  }
  return out.slice(0, DIVIDER_LIMITS.count.max);
};

/** Bin parameters of unknown origin to valid ones, like `sanitizeParams`. */
export const sanitizeBin = (raw: unknown): BinParams => {
  const input = (typeof raw === "object" && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;
  const out = { ...DEFAULT_BIN } as Record<string, unknown>;
  for (const [key, fallback] of Object.entries(DEFAULT_BIN)) {
    if (key === "dividers") continue;
    const value = input[key];
    if (typeof fallback === "number") {
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      out[key] = key in BIN_LIMITS ? clampBin(key as BinLimitedKey, value) : value;
    } else if (typeof fallback === "boolean") {
      if (typeof value === "boolean") out[key] = value;
    } else if (typeof value === "string") {
      const choices = ENUMS[key];
      if (choices ? choices.includes(value) : true) out[key] = value;
    }
  }
  const bin = out as unknown as BinParams;
  bin.dividers = sanitizeDividers(input.dividers);
  for (const key of ["plate_color", "lip_color"] as const) {
    if (!/^#[0-9a-fA-F]{6}$/.test(bin[key])) bin[key] = DEFAULT_BIN[key];
  }
  return bin;
};

export const serializeModel = (
  name: string,
  params: LidParams,
  svgName: string,
  drawerHeight = 0,
): string => {
  const file: ModelFile = {
    drawerHeight,
    type: "lid",
    schemaVersion: SCHEMA_VERSION,
    name,
    savedAt: new Date().toISOString(),
    svgName,
    params,
  };
  return JSON.stringify(file, null, 2);
};

export const serializeBin = (
  name: string,
  params: BinParams,
  drawerHeight = 0,
): string => {
  const file: ModelFile = {
    drawerHeight,
    type: "bin",
    schemaVersion: SCHEMA_VERSION,
    name,
    savedAt: new Date().toISOString(),
    svgName: "",
    params,
  };
  return JSON.stringify(file, null, 2);
};

export const serializeBaseplate = (
  name: string,
  params: BaseplateParams,
  drawerHeight = 0,
): string => {
  const file: ModelFile = {
    drawerHeight,
    type: "baseplate",
    schemaVersion: SCHEMA_VERSION,
    name,
    savedAt: new Date().toISOString(),
    svgName: "",
    params,
  };
  return JSON.stringify(file, null, 2);
};

/** Older schema versions are migrated here, one step at a time. */
const migrate = (file: Record<string, unknown>): Record<string, unknown> => {
  // version 1 is the first; later versions add `if (version < n) { ... }` steps
  return file;
};

export const parseModel = (text: string, fileName = "the file"): ModelFile => {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ModelFileError(
      `${fileName} is not a saved model. Open a .json file that this app saved.`,
    );
  }
  const type = (data as { type?: unknown } | null)?.type;
  if (
    typeof data !== "object" ||
    (type !== "lid" && type !== "baseplate" && type !== "bin")
  ) {
    throw new ModelFileError(
      `${fileName} is not a lid, a baseplate or a bin. Only those can be opened in this version.`,
    );
  }
  const file = data as Record<string, unknown>;
  const version = file.schemaVersion;
  if (typeof version !== "number" || version < 1) {
    throw new ModelFileError(
      `${fileName} has no schema version. It cannot be opened safely.`,
    );
  }
  if (version > SCHEMA_VERSION) {
    throw new ModelFileError(
      `${fileName} was saved by a newer version of the app (schema ${version}). Update the app, then open it again.`,
    );
  }
  const migrated = migrate(file);
  const drawer = migrated.drawerHeight;
  const base = {
    drawerHeight:
      typeof drawer === "number" && Number.isFinite(drawer)
        ? Math.min(1000, Math.max(0, drawer))
        : 0,
    schemaVersion: SCHEMA_VERSION,
    savedAt:
      typeof migrated.savedAt === "string"
        ? migrated.savedAt
        : new Date().toISOString(),
    svgName: typeof migrated.svgName === "string" ? migrated.svgName : "",
  };
  const name = typeof migrated.name === "string" ? migrated.name : "";
  if (type === "bin") {
    return { ...base, type, name: name || "Bin", params: sanitizeBin(migrated.params) };
  }
  if (type === "baseplate") {
    return {
      ...base,
      type,
      name: name || "Base",
      params: sanitizeBaseplate(migrated.params),
    };
  }
  return {
    ...base,
    type,
    name: name || "Lid",
    params: sanitizeParams(migrated.params),
  };
};
