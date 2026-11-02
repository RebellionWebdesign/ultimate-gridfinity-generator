// SVG upload: reads filled shapes into closed polygons (contours) that can be extruded,
// the same job OpenSCAD's `import()` does in the reference script. Strokes are not
// extruded; a file without any filled shape is reported with a message that says how to
// fix it (brand.md section 7). The pure parts work without a DOM; `parseSvg` needs
// `DOMParser` and therefore runs on the main thread, not in the worker.

export type Point = [number, number];
export type Contour = Point[];

export interface SvgShape {
  contours: Contour[];
  evenOdd: boolean;
}

export interface SvgShapes {
  shapes: SvgShape[];
  /** millimetres per SVG unit (OpenSCAD imports at 96 dpi: 25.4 / 96) */
  unitMm: number;
}

type Matrix = [number, number, number, number, number, number];
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

const multiply = (m: Matrix, n: Matrix): Matrix => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];

const apply = (m: Matrix, [x, y]: Point): Point => [
  m[0] * x + m[2] * y + m[4],
  m[1] * x + m[3] * y + m[5],
];

const numbers = (text: string): number[] =>
  (text.match(/[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) ?? []).map(Number);

/** Parses an SVG `transform` attribute into one matrix. */
export const parseTransform = (text: string | null): Matrix => {
  let result = IDENTITY;
  for (const [, name, args] of (text ?? "").matchAll(/(\w+)\s*\(([^)]*)\)/g)) {
    const v = numbers(args ?? "");
    let m: Matrix = IDENTITY;
    const rad = (deg: number) => (deg * Math.PI) / 180;
    switch (name) {
      case "matrix":
        if (v.length === 6) m = v as Matrix;
        break;
      case "translate":
        m = [1, 0, 0, 1, v[0] ?? 0, v[1] ?? 0];
        break;
      case "scale":
        m = [v[0] ?? 1, 0, 0, v[1] ?? v[0] ?? 1, 0, 0];
        break;
      case "rotate": {
        const a = rad(v[0] ?? 0);
        const rot: Matrix = [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0];
        const [cx, cy] = [v[1] ?? 0, v[2] ?? 0];
        m = multiply(multiply([1, 0, 0, 1, cx, cy], rot), [1, 0, 0, 1, -cx, -cy]);
        break;
      }
      case "skewX":
        m = [1, 0, Math.tan(rad(v[0] ?? 0)), 1, 0, 0];
        break;
      case "skewY":
        m = [1, Math.tan(rad(v[0] ?? 0)), 0, 1, 0, 0];
        break;
    }
    result = multiply(result, m);
  }
  return result;
};

const bezier = (p0: Point, p1: Point, p2: Point, p3: Point, steps: number): Point[] => {
  const out: Point[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    out.push([
      u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
      u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1],
    ]);
  }
  return out;
};

/** Elliptical arc from `from` to `to` (SVG endpoint parameterisation), sampled. */
const arc = (
  from: Point,
  [rx0, ry0, rotation, large, sweep]: number[],
  to: Point,
  steps: number,
): Point[] => {
  let rx = Math.abs(rx0 ?? 0);
  let ry = Math.abs(ry0 ?? 0);
  if (rx === 0 || ry === 0 || (from[0] === to[0] && from[1] === to[1])) return [to];
  const phi = (((rotation ?? 0) % 360) * Math.PI) / 180;
  const [cosP, sinP] = [Math.cos(phi), Math.sin(phi)];
  const dx = (from[0] - to[0]) / 2;
  const dy = (from[1] - to[1]) / 2;
  const x1 = cosP * dx + sinP * dy;
  const y1 = -sinP * dx + cosP * dy;
  const lambda = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }
  const num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
  const den = rx * rx * y1 * y1 + ry * ry * x1 * x1;
  const sign = large === sweep ? -1 : 1;
  const coef = sign * Math.sqrt(Math.max(0, num / den));
  const cx1 = (coef * rx * y1) / ry;
  const cy1 = (-coef * ry * x1) / rx;
  const cx = cosP * cx1 - sinP * cy1 + (from[0] + to[0]) / 2;
  const cy = sinP * cx1 + cosP * cy1 + (from[1] + to[1]) / 2;
  const angle = (ux: number, uy: number, vx: number, vy: number) =>
    Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const theta = angle(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry);
  let delta = angle(
    (x1 - cx1) / rx,
    (y1 - cy1) / ry,
    (-x1 - cx1) / rx,
    (-y1 - cy1) / ry,
  );
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  if (sweep && delta < 0) delta += 2 * Math.PI;
  const out: Point[] = [];
  for (let i = 1; i <= steps; i++) {
    const a = theta + (delta * i) / steps;
    const [ex, ey] = [rx * Math.cos(a), ry * Math.sin(a)];
    out.push([cosP * ex - sinP * ey + cx, sinP * ex + cosP * ey + cy]);
  }
  out[out.length - 1] = to;
  return out;
};

const ARGS: Record<string, number> = {
  M: 2,
  L: 2,
  H: 1,
  V: 1,
  C: 6,
  S: 4,
  Q: 4,
  T: 2,
  A: 7,
  Z: 0,
};

/** SVG path data to closed contours (every subpath is closed, as a fill does). */
export const pathToContours = (d: string, steps = 16): Contour[] => {
  const contours: Contour[] = [];
  let current: Contour = [];
  let pos: Point = [0, 0];
  let start: Point = [0, 0];
  let lastControl: Point | null = null;
  let lastCommand = "";
  const finish = () => {
    if (current.length >= 3) contours.push(current);
    current = [];
  };

  for (const [, letter, rest] of d.matchAll(
    /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g,
  )) {
    const cmd = letter ?? "";
    const upper = cmd.toUpperCase();
    const rel = cmd !== upper;
    let nums: number[];
    if (upper === "A") {
      // flags may be written without separators ("a1 1 0 011 1")
      nums = [];
      const tokens =
        (rest ?? "").match(/[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?|[01]/g) ?? [];
      let k = 0;
      while (k < tokens.length) {
        const group = tokens.slice(k, k + 7).map(Number);
        nums.push(...group);
        k += 7;
      }
    } else {
      nums = numbers(rest ?? "");
    }
    const size = ARGS[upper] ?? 0;
    if (upper === "Z") {
      finish();
      pos = start;
      lastCommand = "Z";
      lastControl = null;
      continue;
    }
    for (let i = 0; i + size <= nums.length; i += size) {
      const a = nums.slice(i, i + size);
      const ox = rel ? pos[0] : 0;
      const oy = rel ? pos[1] : 0;
      let implicit = upper;
      if (upper === "M" && i > 0) implicit = "L";
      switch (implicit) {
        case "M": {
          finish();
          pos = [(a[0] ?? 0) + ox, (a[1] ?? 0) + oy];
          start = pos;
          current = [pos];
          lastControl = null;
          break;
        }
        case "L":
          pos = [(a[0] ?? 0) + ox, (a[1] ?? 0) + oy];
          current.push(pos);
          lastControl = null;
          break;
        case "H":
          pos = [(a[0] ?? 0) + ox, pos[1]];
          current.push(pos);
          lastControl = null;
          break;
        case "V":
          pos = [pos[0], (a[0] ?? 0) + oy];
          current.push(pos);
          lastControl = null;
          break;
        case "C": {
          const c1: Point = [(a[0] ?? 0) + ox, (a[1] ?? 0) + oy];
          const c2: Point = [(a[2] ?? 0) + ox, (a[3] ?? 0) + oy];
          const end: Point = [(a[4] ?? 0) + ox, (a[5] ?? 0) + oy];
          current.push(...bezier(pos, c1, c2, end, steps));
          lastControl = c2;
          pos = end;
          break;
        }
        case "S": {
          const c1: Point =
            lastControl && "CS".includes(lastCommand)
              ? [2 * pos[0] - lastControl[0], 2 * pos[1] - lastControl[1]]
              : pos;
          const c2: Point = [(a[0] ?? 0) + ox, (a[1] ?? 0) + oy];
          const end: Point = [(a[2] ?? 0) + ox, (a[3] ?? 0) + oy];
          current.push(...bezier(pos, c1, c2, end, steps));
          lastControl = c2;
          pos = end;
          break;
        }
        case "Q":
        case "T": {
          let c: Point;
          let end: Point;
          if (implicit === "Q") {
            c = [(a[0] ?? 0) + ox, (a[1] ?? 0) + oy];
            end = [(a[2] ?? 0) + ox, (a[3] ?? 0) + oy];
          } else {
            c =
              lastControl && "QT".includes(lastCommand)
                ? [2 * pos[0] - lastControl[0], 2 * pos[1] - lastControl[1]]
                : pos;
            end = [(a[0] ?? 0) + ox, (a[1] ?? 0) + oy];
          }
          // quadratic as cubic
          const c1: Point = [
            pos[0] + (2 / 3) * (c[0] - pos[0]),
            pos[1] + (2 / 3) * (c[1] - pos[1]),
          ];
          const c2: Point = [
            end[0] + (2 / 3) * (c[0] - end[0]),
            end[1] + (2 / 3) * (c[1] - end[1]),
          ];
          current.push(...bezier(pos, c1, c2, end, steps));
          lastControl = c;
          pos = end;
          break;
        }
        case "A": {
          const end: Point = [(a[5] ?? 0) + ox, (a[6] ?? 0) + oy];
          current.push(...arc(pos, a.slice(0, 5), end, steps));
          pos = end;
          lastControl = null;
          break;
        }
      }
      lastCommand = implicit;
    }
  }
  finish();
  return contours;
};

const rectContour = (x: number, y: number, w: number, h: number): Contour => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];

const ellipseContour = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  n = 48,
): Contour =>
  Array.from({ length: n }, (_, i): Point => {
    const a = (2 * Math.PI * i) / n;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });

export class SvgError extends Error {}

const attr = (el: Element, name: string): number =>
  Number(el.getAttribute(name) ?? 0) || 0;

/** Reads the SVG text; `fileName` only appears in error messages. */
export const parseSvg = (text: string, fileName: string): SvgShapes => {
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const root = doc.documentElement;
  if (root.localName !== "svg" || doc.querySelector("parsererror")) {
    throw new SvgError(
      `${fileName} is not a valid SVG file. Export it again from your vector editor as plain SVG, then upload it again.`,
    );
  }
  const shapes: SvgShape[] = [];
  let strokeOnly = 0;

  const visit = (el: Element, parent: Matrix, inheritedFill: string) => {
    if (
      ["defs", "clipPath", "mask", "symbol", "metadata", "title"].includes(el.localName)
    ) {
      return;
    }
    const matrix = multiply(parent, parseTransform(el.getAttribute("transform")));
    const fill = el.getAttribute("fill") ?? inheritedFill;
    const evenOdd = el.getAttribute("fill-rule") === "evenodd";
    let contours: Contour[] = [];
    switch (el.localName) {
      case "path":
        contours = pathToContours(el.getAttribute("d") ?? "");
        break;
      case "rect":
        contours = [
          rectContour(
            attr(el, "x"),
            attr(el, "y"),
            attr(el, "width"),
            attr(el, "height"),
          ),
        ];
        break;
      case "circle":
        contours = [
          ellipseContour(attr(el, "cx"), attr(el, "cy"), attr(el, "r"), attr(el, "r")),
        ];
        break;
      case "ellipse":
        contours = [
          ellipseContour(
            attr(el, "cx"),
            attr(el, "cy"),
            attr(el, "rx"),
            attr(el, "ry"),
          ),
        ];
        break;
      case "polygon": {
        const v = numbers(el.getAttribute("points") ?? "");
        const points: Contour = [];
        for (let i = 0; i + 1 < v.length; i += 2)
          points.push([v[i] ?? 0, v[i + 1] ?? 0]);
        contours = [points];
        break;
      }
    }
    if (contours.length > 0) {
      if (fill === "none") strokeOnly++;
      else {
        shapes.push({
          contours: contours.map((c) => c.map((pt) => apply(matrix, pt))),
          evenOdd,
        });
      }
    }
    for (const child of Array.from(el.children)) visit(child, matrix, fill);
  };
  visit(root, IDENTITY, "black");

  if (shapes.length === 0) {
    throw new SvgError(
      strokeOnly > 0
        ? `${fileName} has no closed shapes. Only outlines can be extruded. Convert strokes to paths in your vector editor, then upload the file again.`
        : `${fileName} has no shapes to extrude. Check that it contains paths, then upload the file again.`,
    );
  }

  // width / height in px against the viewBox, as OpenSCAD reads it
  const viewBox = numbers(root.getAttribute("viewBox") ?? "");
  const widthText = root.getAttribute("width") ?? "";
  const width = /^\s*[\d.]+\s*(px)?\s*$/.test(widthText) ? parseFloat(widthText) : NaN;
  const scale = viewBox[2] && Number.isFinite(width) ? width / viewBox[2] : 1;
  const unitMm = (25.4 / 96) * scale;
  return { shapes, unitMm };
};
