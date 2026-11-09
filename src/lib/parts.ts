// Part types of the editor and the short name used in labels and files.
export type PartType = "lid" | "bin" | "baseplate" | "label";

export const PART_NAME: Record<PartType, string> = {
  lid: "Lid",
  bin: "Bin",
  baseplate: "Base",
  label: "Label",
};

/** A length for the screen: at most two decimals, no trailing zeros (5.05, 41.5, 42). */
export const mmText = (value: number): string => String(Math.round(value * 100) / 100);

export const formatSize = (size: readonly number[]): string =>
  size.map(mmText).join(" × ");

export const ISSUES_URL =
  "https://github.com/RebellionWebdesign/ultimate-gridfinity-generator/issues/new";
