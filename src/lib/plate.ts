// Outline of a printer's build plate, drawn as the floor of the preview. The plate is a
// rectangle (the body) with tabs along the back and lips along the front; corners where two
// straight edges meet at 90 degrees are rounded. All in mm, centred on the body.
// The shapes are measured from pictures of the plates (about 1 mm accurate).

/** A tab at the back edge: it sticks out `height` from the body. */
export interface PlateTab {
  /** x range of the tab's base, from the left edge of the body */
  from: number;
  to: number;
  /** how far each slanted side (not at the body's edge) moves inward at the top */
  flank: number;
  height: number;
}

/** A lip at the front edge: it sticks out `depth` from the body. */
export interface PlateLip {
  from: number;
  to: number;
  flank: number;
  depth: number;
}

export interface PlateShape {
  cornerRadius: number;
  /** size of the plate body; default: the printable area */
  body?: { width: number; depth: number };
  backTabs?: PlateTab[];
  frontLips?: PlateLip[];
}

export type Point2 = [number, number];

const same = (a: Point2, b: Point2): boolean => a[0] === b[0] && a[1] === b[1];

/** Sharp outline, counter-clockwise, starting at the front left. */
const sharpOutline = (plate: PlateShape, bodyW: number, bodyD: number): Point2[] => {
  const hw = bodyW / 2;
  const hd = bodyD / 2;
  const points: Point2[] = [];

  // front edge, left to right
  const lips = [...(plate.frontLips ?? [])].sort((a, b) => a.from - b.from);
  if (lips[0]?.from !== 0) points.push([-hw, -hd]);
  for (const lip of lips) {
    const a = lip.from - hw;
    const b = lip.to - hw;
    const low = -hd - lip.depth;
    const left = lip.from > 0 ? lip.flank : 0;
    const right = lip.to < bodyW ? lip.flank : 0;
    points.push([a, -hd], [a + left, low], [b - right, low]);
    if (right > 0) points.push([b, -hd]);
  }
  const lastLip = lips[lips.length - 1];
  if (!lastLip || lastLip.to < bodyW) points.push([hw, -hd]);

  // back edge, right to left
  const tabs = [...(plate.backTabs ?? [])].sort((a, b) => b.from - a.from);
  if (!tabs.some((t) => t.to === bodyW)) points.push([hw, hd]);
  for (const tab of tabs) {
    const a = tab.from - hw;
    const b = tab.to - hw;
    const top = hd + tab.height;
    const left = tab.from > 0 ? tab.flank : 0;
    const right = tab.to < bodyW ? tab.flank : 0;
    if (right > 0) points.push([b, hd], [b - right, top]);
    else points.push([hw, top]);
    if (left > 0) points.push([a + left, top], [a, hd]);
    else points.push([-hw, top]);
  }
  if (!tabs.some((t) => t.from === 0)) points.push([-hw, hd]);

  return points.filter((p, i) => !same(p, points[(i + 1) % points.length] ?? p));
};

/** Rounds every convex 90 degree corner between two axis-aligned edges. */
const roundCorners = (points: Point2[], radius: number): Point2[] => {
  if (radius <= 0) return points;
  const out: Point2[] = [];
  const n = points.length;
  points.forEach((v, i) => {
    const prev = points[(i + n - 1) % n] as Point2;
    const next = points[(i + 1) % n] as Point2;
    const e1: Point2 = [v[0] - prev[0], v[1] - prev[1]];
    const e2: Point2 = [next[0] - v[0], next[1] - v[1]];
    const straight = (e: Point2) => e[0] === 0 || e[1] === 0;
    const cross = e1[0] * e2[1] - e1[1] * e2[0];
    if (!straight(e1) || !straight(e2) || cross <= 0) {
      out.push(v);
      return;
    }
    const l1 = Math.hypot(...e1);
    const l2 = Math.hypot(...e2);
    const r = Math.min(radius, l1 / 2, l2 / 2);
    const u1: Point2 = [e1[0] / l1, e1[1] / l1];
    const u2: Point2 = [e2[0] / l2, e2[1] / l2];
    const start: Point2 = [v[0] - u1[0] * r, v[1] - u1[1] * r];
    const centre: Point2 = [start[0] + u2[0] * r, start[1] + u2[1] * r];
    for (let k = 0; k <= 8; k++) {
      const angle = (k / 8) * (Math.PI / 2);
      const [dx, dy] = [start[0] - centre[0], start[1] - centre[1]];
      out.push([
        centre[0] + dx * Math.cos(angle) - dy * Math.sin(angle),
        centre[1] + dx * Math.sin(angle) + dy * Math.cos(angle),
      ]);
    }
  });
  return out;
};

/** Outline of the plate for a printable area of `width` x `depth`, centred on the origin. */
export const plateOutline = (
  plate: PlateShape,
  width: number,
  depth: number,
): Point2[] => {
  const bodyW = plate.body?.width ?? width;
  const bodyD = plate.body?.depth ?? depth;
  return roundCorners(sharpOutline(plate, bodyW, bodyD), plate.cornerRadius);
};

export const boundsOf = (points: Point2[]) => {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return {
    min: [Math.min(...xs), Math.min(...ys)] as Point2,
    max: [Math.max(...xs), Math.max(...ys)] as Point2,
  };
};

/**
 * The outline moved outwards by `distance` (mitred corners, so every edge is exactly
 * `distance` away). Used for a band around the bed. Works for either winding order.
 */
export const outwardOutline = (points: Point2[], distance: number): Point2[] => {
  // drop repeated points, they have no direction
  const pts = points.filter((p, i) => !same(p, points[(i + 1) % points.length] ?? p));
  const n = pts.length;
  let area = 0;
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % n] ?? p;
    area += p[0] * q[1] - q[0] * p[1];
  });
  // for a counter-clockwise outline the outside is to the right of each edge
  const side = area >= 0 ? 1 : -1;
  const normal = (a: Point2, b: Point2): Point2 => {
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
    const len = Math.hypot(dx, dy) || 1;
    return [(side * dy) / len, (-side * dx) / len];
  };
  return pts.map((p, i) => {
    const prev = pts[(i + n - 1) % n] ?? p;
    const next = pts[(i + 1) % n] ?? p;
    const a = normal(prev, p);
    const b = normal(p, next);
    // miter length factor 1 / cos(half the turn); capped on very sharp turns
    const dot = a[0] * b[0] + a[1] * b[1];
    const k = distance / Math.max(1 + dot, 0.25);
    return [p[0] + (a[0] + b[0]) * k, p[1] + (a[1] + b[1]) * k];
  });
};
