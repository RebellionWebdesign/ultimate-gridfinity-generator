// The height of the drawer locks the height of bins and lids to what fits in it (spec 3.2,
// owner 3 November 2026). A drawer height of 0 switches the lock off.
import { CONSTANTS } from "../gridfinity/constants";
import { BIN_LIMITS, maxHeightUnits, type BinParams } from "../model/binParams";
import { LID_LIMITS, type LidParams } from "../model/lidParams";
import { raisedExtra } from "./label";

/** The tallest drawer the app accepts (mm). */
export const DRAWER_HEIGHT_MAX = 1000;

const c = (name: keyof typeof CONSTANTS): number => CONSTANTS[name].value;

/** What a lid adds above its plate: the stacking lip, or a raised label. */
export const lidExtra = (p: LidParams): number =>
  p.variant === "stackable" ? c("lipHeight") : raisedExtra(p);

/** The most height units (auto mode) a lid may have in a drawer of this height. */
export const lidMaxUnits = (p: LidParams, drawer: number): number =>
  Math.min(
    LID_LIMITS.height_units_auto.max,
    Math.max(
      LID_LIMITS.height_units_auto.min,
      Math.floor((drawer - lidExtra(p) + 1e-9) / c("heightUnit")),
    ),
  );

/** The thickest plate (manual mode) a lid may have in a drawer of this height. */
export const lidMaxPlate = (p: LidParams, drawer: number): number =>
  Math.min(
    LID_LIMITS.plate_thickness.max,
    Math.max(LID_LIMITS.plate_thickness.min, drawer - c("footHeight") - lidExtra(p)),
  );

/** The most height units a bin may have in a drawer of this height. */
export const binMaxUnits = (p: BinParams, drawer: number): number =>
  Math.min(BIN_LIMITS.height_units.max, maxHeightUnits(drawer, p.lip_style));

/** The lid with its height brought down to the drawer; the same lid when nothing is too tall. */
export const lockLid = (p: LidParams, drawer: number): LidParams =>
  drawer > 0
    ? {
        ...p,
        height_units_auto: Math.min(p.height_units_auto, lidMaxUnits(p, drawer)),
        plate_thickness: Math.min(p.plate_thickness, lidMaxPlate(p, drawer)),
      }
    : p;

/** The bin with its height brought down to the drawer. */
export const lockBin = (p: BinParams, drawer: number): BinParams =>
  drawer > 0
    ? { ...p, height_units: Math.min(p.height_units, binMaxUnits(p, drawer)) }
    : p;
