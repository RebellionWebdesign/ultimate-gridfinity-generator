// Saved model: JSON with model type, schema version, parameters, text, colours and the
// SVG as a string (ADR-0003). A schema change needs a version bump and a migration step.
import {
  DEFAULT_LID,
  LID_LIMITS,
  clampToLimit,
  offsetLimit,
  type LidParams,
  type LimitedKey,
} from "./lidParams";

export const SCHEMA_VERSION = 1;

export interface ModelFile {
  type: "lid";
  schemaVersion: number;
  name: string;
  savedAt: string;
  svgName: string;
  params: LidParams;
}

export class ModelFileError extends Error {}

const ENUMS: Partial<Record<keyof LidParams, readonly string[]>> = {
  variant: ["dust_cover", "stackable"],
  lip_mode: ["full", "corners_only"],
  foot_layout: ["merged", "per_cell"],
  plate_thickness_mode: ["auto", "manual"],
  print_orientation: ["foot_down", "upside_down"],
  foot_hollow: ["none", "open"],
  text_mode: ["none", "raised", "engraved", "flush"],
  symbol_mode: ["none", "raised", "engraved", "flush"],
  font_choice: ["Inter", "IBM Plex Mono", "IBM Plex Sans SemiBold"],
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
      const choices = ENUMS[key as keyof LidParams];
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

export const serializeModel = (
  name: string,
  params: LidParams,
  svgName: string,
): string => {
  const file: ModelFile = {
    type: "lid",
    schemaVersion: SCHEMA_VERSION,
    name,
    savedAt: new Date().toISOString(),
    svgName,
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
  if (
    typeof data !== "object" ||
    data === null ||
    (data as { type?: unknown }).type !== "lid"
  ) {
    throw new ModelFileError(
      `${fileName} is not a lid. Only lids can be opened in this version.`,
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
  return {
    type: "lid",
    schemaVersion: SCHEMA_VERSION,
    name: typeof migrated.name === "string" && migrated.name ? migrated.name : "Lid",
    savedAt:
      typeof migrated.savedAt === "string"
        ? migrated.savedAt
        : new Date().toISOString(),
    svgName: typeof migrated.svgName === "string" ? migrated.svgName : "",
    params: sanitizeParams(migrated.params),
  };
};
