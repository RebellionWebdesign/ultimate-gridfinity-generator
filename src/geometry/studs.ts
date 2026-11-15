// Snap studs (E-11, owner, 15 November 2026): a round stud on the pocket floor of the baseplate
// and a blind hole in the foot of the bin, at the places of the magnets. The stud is exactly
// as wide as chosen, the hole is as wide as the user chooses (at least 0.1 mm more).
import type { Manifold } from "manifold-3d";
import { CONSTANTS } from "../gridfinity/constants";
import type { Kernel, Scope } from "./kernel";

const SEGMENTS = 40;
/** Steps of the rounded tip. */
const ARC_STEPS = 8;
/** The stud starts this far below its foot so it fuses with the plate. */
const OVERLAP = 0.1;

/** A rounded tip from (r, y0) to (0, y0 + f) as a quarter circle, listed from the side to the middle. */
const tip = (r: number, top: number, fillet: number): [number, number][] => {
  const out: [number, number][] = [];
  for (let k = 0; k <= ARC_STEPS; k++) {
    const a = (k / ARC_STEPS) * (Math.PI / 2);
    out.push([r - fillet + fillet * Math.cos(a), top - fillet + fillet * Math.sin(a)]);
  }
  return out;
};

/**
 * A stud of diameter `d`, standing on z = 0, `studHeight` tall, with a rounded tip. It reaches
 * 0.1 mm below z = 0 so it joins the plate without a coplanar face.
 */
export const buildStud = (kernel: Kernel, scope: Scope, d: number): Manifold => {
  const r = d / 2;
  const h = CONSTANTS.studHeight.value;
  const profile: [number, number][] = [
    [0, -OVERLAP],
    [r, -OVERLAP],
    ...tip(r, h, CONSTANTS.studFillet.value),
    [0, h],
  ];
  const section = scope.add(new kernel.CrossSection([profile]));
  return scope.add(kernel.Manifold.revolve(section, SEGMENTS));
};

/**
 * The cutter of a stud hole of diameter `d` in the foot of a bin: opens from z = 0 (and 0.5 mm
 * below it), `studHoleDepth` deep, with a rounded end.
 */
export const buildStudHole = (kernel: Kernel, scope: Scope, d: number): Manifold => {
  const r = d / 2;
  const depth = CONSTANTS.studHoleDepth.value;
  const profile: [number, number][] = [
    [0, -0.5],
    [r, -0.5],
    ...tip(r, depth, CONSTANTS.studHoleFillet.value),
    [0, depth],
  ];
  const section = scope.add(new kernel.CrossSection([profile]));
  return scope.add(kernel.Manifold.revolve(section, SEGMENTS));
};
