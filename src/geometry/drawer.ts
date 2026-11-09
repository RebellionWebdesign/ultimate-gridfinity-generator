// The drawer height (owner, 9 November 2026): an option of the baseplate. With it on, the
// height of the baseplate, the bin and the lid together must fit the drawer, with 1 mm of
// room above so that nothing rubs. A drawer height of 0 means the option is off.
import { CONSTANTS } from "../gridfinity/constants";
import { baseOf, type BaseplateParams } from "../model/baseplateParams";
import { BIN_LIMITS, maxHeightUnits, type BinParams } from "../model/binParams";
import { LID_LIMITS, type LidParams } from "../model/lidParams";
import { layoutOf as binLayout } from "./bin";
import { raisedExtra } from "./label";
import { layoutOf as lidLayout } from "./lid";

/** The tallest drawer the app accepts (mm). */
export const DRAWER_HEIGHT_MAX = 1000;

/** Room that stays above the stack in the drawer (owner, 9 November 2026). */
export const DRAWER_CLEARANCE = 1;

const c = (name: keyof typeof CONSTANTS): number => CONSTANTS[name].value;

/** Height of the baseplate: its base and the profile on top. */
export const baseHeightOf = (p: BaseplateParams): number =>
  baseOf(p) + c("baseplateProfileHeight");

/** Height of the bin with its stacking lip. */
export const binHeightOf = (p: BinParams): number => binLayout(p).top;

/** Height of the lid: its foot, its plate and what stands above (a lip or a raised label). */
export const lidHeightOf = (p: LidParams): number => lidLayout(p).topZ;

/** What a lid adds above its plate: the stacking lip, or a raised label. */
export const lidExtra = (p: LidParams): number =>
  p.variant === "stackable" ? c("lipHeight") : raisedExtra(p);

/** The most height units (auto mode) a lid may have when this much height is left for it. */
export const lidMaxUnits = (p: LidParams, available: number): number =>
  Math.min(
    LID_LIMITS.height_units_auto.max,
    Math.max(
      LID_LIMITS.height_units_auto.min,
      Math.floor((available - lidExtra(p) + 1e-9) / c("heightUnit")),
    ),
  );

/** The thickest plate (manual mode) a lid may have when this much height is left for it. */
export const lidMaxPlate = (p: LidParams, available: number): number =>
  Math.min(
    LID_LIMITS.plate_thickness.max,
    Math.max(LID_LIMITS.plate_thickness.min, available - c("footHeight") - lidExtra(p)),
  );

/** The most height units a bin may have when this much height is left for it. */
export const binMaxUnits = (p: BinParams, available: number): number =>
  Math.min(BIN_LIMITS.height_units.max, maxHeightUnits(available, p.lip_style));

export interface DrawerCheck {
  /** the option is on (drawer height above 0) */
  on: boolean;
  /** height of the stack: base, bin and lid added up */
  base: number;
  bin: number;
  lid: number;
  total: number;
  /** what the stack may be at most: the drawer minus 1 mm of room */
  limit: number;
  fits: boolean;
  /** height left for the bin, for the lid, with the other two as they are */
  binAvailable: number;
  lidAvailable: number;
  /** the most height units that fit (at least 1: then it may still not fit) */
  binUnitsFit: number;
  lidUnitsFit: number;
  /** a bin of one unit, or a lid of one unit, would still not fit */
  binFitsAtAll: boolean;
  lidFitsAtAll: boolean;
}

/** Do base, bin and lid fit the drawer together, with 1 mm of room above? */
export const drawerCheck = (
  drawer: number,
  base: BaseplateParams,
  bin: BinParams,
  lid: LidParams,
): DrawerCheck => {
  const heights = {
    base: baseHeightOf(base),
    bin: binHeightOf(bin),
    lid: lidHeightOf(lid),
  };
  const total = heights.base + heights.bin + heights.lid;
  const limit = drawer - DRAWER_CLEARANCE;
  const binAvailable = limit - heights.base - heights.lid;
  const lidAvailable = limit - heights.base - heights.bin;
  const binUnits = binMaxUnits(bin, binAvailable);
  const lidUnits = lidMaxUnits(lid, lidAvailable);
  return {
    on: drawer > 0,
    ...heights,
    total,
    limit,
    fits: drawer <= 0 || total <= limit + 1e-9,
    binAvailable,
    lidAvailable,
    binUnitsFit: binUnits,
    lidUnitsFit: lidUnits,
    binFitsAtAll:
      binAvailable + 1e-9 >=
      c("heightUnit") + (bin.lip_style === "flat_lower" ? 0 : c("lipHeight")),
    lidFitsAtAll:
      lidAvailable + 1e-9 >=
      c("heightUnit") * LID_LIMITS.height_units_auto.min + lidExtra(lid),
  };
};

const mm = (v: number): string => String(Math.round(v * 100) / 100);

/** The warning for a stack that is too tall, with the way out; empty when it fits. */
export const drawerMessage = (d: DrawerCheck, drawer: number): string => {
  if (!d.on || d.fits) return "";
  const sum = `Base ${mm(d.base)} + bin ${mm(d.bin)} + lid ${mm(d.lid)} = ${mm(d.total)} mm, but the drawer (${mm(drawer)} mm) allows ${mm(d.limit)} mm with ${DRAWER_CLEARANCE} mm of room above. It does not fit like this.`;
  const units = (n: number) => `${n} ${n === 1 ? "unit" : "units"}`;
  const ways = [
    d.binFitsAtAll ? `a bin of ${units(d.binUnitsFit)}` : "",
    d.lidFitsAtAll ? `a lid of ${units(d.lidUnitsFit)}` : "",
  ].filter(Boolean);
  if (ways.length > 0) return `${sum} Suggestion: ${ways.join(" or ")} fits.`;
  return `${sum} Even the lowest bin and lid do not fit: choose a higher drawer or a lower baseplate.`;
};
