// Build volumes of the printers in the reference script (x, y, z in mm).
export interface Printer {
  name: string;
  bed: [number, number, number];
}

export const PRINTERS: Printer[] = [
  { name: "Bambu Lab P2S", bed: [256, 256, 256] },
  { name: "Bambu Lab P1S", bed: [256, 256, 256] },
  { name: "Bambu Lab P1P", bed: [256, 256, 256] },
  { name: "Bambu Lab X1C", bed: [256, 256, 256] },
  { name: "Bambu Lab X1E", bed: [256, 256, 256] },
  { name: "Bambu Lab A1", bed: [256, 256, 256] },
  { name: "Bambu Lab A1 mini", bed: [180, 180, 180] },
  { name: "Bambu Lab H2D", bed: [325, 320, 325] },
  { name: "Bambu Lab H2S", bed: [340, 320, 340] },
];

export interface BedResult {
  fits: boolean;
  turned: boolean;
}

/** The part may be turned 90 degrees on the bed; height never changes. */
export const checkBed = (
  size: [number, number, number],
  bed: [number, number, number],
) => {
  const [x, y, z] = size;
  const straight = x <= bed[0] && y <= bed[1];
  const turned = x <= bed[1] && y <= bed[0];
  return { fits: (straight || turned) && z <= bed[2], turned: !straight && turned };
};
