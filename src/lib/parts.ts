// Part types of the editor and the short name used in labels and files.
export type PartType = "lid" | "bin" | "baseplate";

export const PART_NAME: Record<PartType, string> = {
  lid: "Lid",
  bin: "Bin",
  baseplate: "Base",
};

export const ISSUES_URL =
  "https://github.com/RebellionWebdesign/ultimate-gridfinity-generator/issues/new";
