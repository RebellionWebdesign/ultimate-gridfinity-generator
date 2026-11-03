// The one place for Gridfinity dimensions (all in mm). Each entry names its source.
// A dimension that is not listed here must not be invented: `dim()` throws for it.
// Sources: spec = docs/spec/gridfinity-generator-spec.de.md section 4,
// drawings = reference/gridfinity-reference-drawings/, owner = decision of the owner.

export interface Constant {
  readonly value: number;
  readonly source: string;
}

const SPEC = "spec section 4";

export const CONSTANTS = {
  grid: { value: 42, source: SPEC },
  heightUnit: { value: 7, source: SPEC },
  binTolerance: { value: 0.5, source: `${SPEC}: 0.25 per side` },
  binCornerRadius: { value: 3.75, source: SPEC },
  footRadiusMid: { value: 1.6, source: `${SPEC}: stepped 3.75, 1.6, 0.8` },
  footRadiusBottom: { value: 0.8, source: `${SPEC}: stepped 3.75, 1.6, 0.8` },
  baseplateCornerRadius: { value: 4.0, source: SPEC },
  footLowerSlope: { value: 0.8, source: `${SPEC}: foot profile, 45 degrees` },
  footVertical: { value: 1.8, source: `${SPEC}: foot profile` },
  footUpperSlope: { value: 2.15, source: `${SPEC}: foot profile, 45 degrees` },
  footHeight: { value: 4.75, source: `${SPEC}: 0.8 + 1.8 + 2.15` },
  footBottomEdgeInset: { value: 2.95, source: `${SPEC}: 41.5 - 2 x 2.95 = 35.6` },
  firstLayerUsable: { value: 2.25, source: `${SPEC}: 7 - 4.75` },
  lipLowerSlope: { value: 0.7, source: `${SPEC}: stacking lip, 45 degrees` },
  lipVertical: { value: 1.8, source: `${SPEC}: stacking lip` },
  lipUpperSlope: { value: 1.9, source: `${SPEC}: stacking lip, 45 degrees` },
  lipHeight: { value: 4.4, source: `${SPEC}: does not count toward the 7 mm height` },
  lipDepth: { value: 2.6, source: SPEC },
  lipFootOffset: { value: 0.25, source: SPEC },
  baseplateProfileLower: {
    value: 0.7,
    source: `${SPEC}: baseplate profile, 45 degrees`,
  },
  baseplateProfileVertical: { value: 1.8, source: `${SPEC}: baseplate profile` },
  baseplateProfileUpper: {
    value: 2.15,
    source: `${SPEC}: baseplate profile, 45 degrees`,
  },
  baseplateProfileHeight: { value: 4.65, source: `${SPEC}: 0.7 + 1.8 + 2.15` },
  baseplateBottomInset: {
    value: 2.85,
    source: `${SPEC}: per side at the bottom, 42 - 2 x 2.85 = 36.3`,
  },
  baseplateWallInset: {
    value: 2.15,
    source: `${SPEC}: per side at the wall, 42 - 2 x 2.15 = 37.7`,
  },
  baseplateRadiusBottom: { value: 1.15, source: `${SPEC}: inside radii R1.85, R1.15` },
  baseplateRadiusWall: { value: 1.85, source: `${SPEC}: inside radii R1.85, R1.15` },
  magnetDiameter: { value: 6, source: `${SPEC}: magnet 6 x 2` },
  magnetThickness: { value: 2, source: `${SPEC}: magnet 6 x 2` },
  magnetPocketDiameter: { value: 6.1, source: `${SPEC}: owner decision, start value` },
  magnetPocketDepth: { value: 2.1, source: `${SPEC}: owner decision, start value` },
  screwHoleDiameter: { value: 3.0, source: SPEC },
  holeSpacing: { value: 26, source: `${SPEC}: 26 mm hole spacing` },
  holeCentreFromFootEdge: { value: 4.8, source: `${SPEC}: derived` },
} as const satisfies Record<string, Constant>;

export type ConstantName = keyof typeof CONSTANTS;

export const dim = (name: string): number => {
  const entry = (CONSTANTS as Record<string, Constant>)[name];
  if (!entry) {
    throw new Error(
      `Unknown Gridfinity dimension "${name}". Not in the spec: do not invent a value, report it.`,
    );
  }
  return entry.value;
};

// Derived values, computed from the table above so they cannot drift.
const c = (name: ConstantName): number => CONSTANTS[name].value;

/** Outer size of a part n cells wide: n x 42 - 0.5 (1x1 = 41.5). */
export const outerSize = (cells: number): number =>
  cells * c("grid") - c("binTolerance");

/** Width of the foot's bottom edge for a single cell (35.6). */
export const footBottomEdge = (): number => outerSize(1) - 2 * c("footBottomEdgeInset");

/** Distance of the magnet hole centre from the cell centre, per axis (13 = 26 / 2). */
export const holeOffset = (): number => c("holeSpacing") / 2;
