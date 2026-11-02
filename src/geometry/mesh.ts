// Helpers to look at a finished Manifold: bounding box, volume, closedness, vertices.
import type { Manifold } from "manifold-3d";

export interface Size {
  x: number;
  y: number;
  z: number;
}

export const sizeOf = (m: Manifold): Size => {
  const { min, max } = m.boundingBox();
  return { x: max[0] - min[0], y: max[1] - min[1], z: max[2] - min[2] };
};

/** Every vertex as [x, y, z]. */
export const vertices = (m: Manifold): [number, number, number][] => {
  const mesh = m.getMesh();
  const out: [number, number, number][] = [];
  const { vertProperties: v, numProp } = mesh;
  for (let i = 0; i < v.length; i += numProp) {
    out.push([v[i] ?? 0, v[i + 1] ?? 0, v[i + 2] ?? 0]);
  }
  return out;
};

/** True when the solid is a valid, closed (watertight) 2-manifold with volume. */
export const isClosed = (m: Manifold): boolean =>
  m.status() === "NoError" && !m.isEmpty() && m.volume() > 0;
