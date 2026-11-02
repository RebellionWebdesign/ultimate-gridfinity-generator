// Lofts between rounded-rectangle rings, the same construction as the reference script
// (`loft`, `rr_pts`): equal vertex counts per ring, straight sides between rings.
import type { Manifold } from "manifold-3d";
import type { Kernel } from "./kernel";

export interface Layer {
  z: number;
  /** half size in x and y */
  hx: number;
  hy: number;
  /** corner radius */
  r: number;
}

/** Segments per rounded corner (script constant Q). */
export const CORNER_SEGMENTS = 6;

const ringPoints = ({ hx, hy, r }: Layer): [number, number][] => {
  const points: [number, number][] = [];
  for (let k = 0; k < 4; k++) {
    const cx = k === 0 || k === 3 ? hx - r : -(hx - r);
    const cy = k === 0 || k === 1 ? hy - r : -(hy - r);
    for (let s = 0; s <= CORNER_SEGMENTS; s++) {
      const a = ((90 * k + (90 * s) / CORNER_SEGMENTS) * Math.PI) / 180;
      points.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  }
  return points;
};

/** Solid between the rings, centred on the x/y origin, lowest layer first. */
export const loft = (kernel: Kernel, layers: readonly Layer[]): Manifold => {
  const first = layers[0];
  if (!first || layers.length < 2) throw new Error("A loft needs at least two layers");
  const n = ringPoints(first).length;
  const vertices: number[] = [];
  for (const layer of layers) {
    for (const [x, y] of ringPoints(layer)) vertices.push(x, y, layer.z);
  }
  const tris: number[] = [];
  const top = (layers.length - 1) * n;
  // caps: fan triangles (the rings are convex); bottom faces down, top faces up
  for (let j = 1; j < n - 1; j++) {
    tris.push(0, j + 1, j);
    tris.push(top, top + j, top + j + 1);
  }
  for (let i = 0; i < layers.length - 1; i++) {
    for (let j = 0; j < n; j++) {
      const j2 = (j + 1) % n;
      const a = i * n + j;
      const b = i * n + j2;
      const c = (i + 1) * n + j2;
      const d = (i + 1) * n + j;
      tris.push(a, b, c, a, c, d);
    }
  }
  const mesh = new kernel.Mesh({
    numProp: 3,
    vertProperties: Float32Array.from(vertices),
    triVerts: Uint32Array.from(tris),
  });
  const solid = kernel.Manifold.ofMesh(mesh);
  if (solid.status() !== "NoError") {
    const status = solid.status();
    solid.delete();
    throw new Error(`Loft is not a valid solid: ${status}`);
  }
  return solid;
};
