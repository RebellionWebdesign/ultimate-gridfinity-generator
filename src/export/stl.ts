// Binary STL writer (ADR-0003): 80 byte header, triangle count, 50 bytes per triangle.
// STL carries geometry only, so every part is written one after the other.
import type { PartMesh } from "../geometry/model";

const HEADER = "Ultimate Gridfinity Generator";

export const writeStl = (parts: readonly PartMesh[]): ArrayBuffer => {
  const count = parts.reduce((sum, part) => sum + part.indices.length / 3, 0);
  const buffer = new ArrayBuffer(84 + count * 50);
  const view = new DataView(buffer);
  for (let i = 0; i < HEADER.length; i++) view.setUint8(i, HEADER.charCodeAt(i));
  view.setUint32(80, count, true);

  let offset = 84;
  for (const { positions, indices } of parts) {
    for (let t = 0; t < indices.length; t += 3) {
      const a = (indices[t] ?? 0) * 3;
      const b = (indices[t + 1] ?? 0) * 3;
      const c = (indices[t + 2] ?? 0) * 3;
      const p = (i: number) => positions[i] ?? 0;
      const [ux, uy, uz] = [p(b) - p(a), p(b + 1) - p(a + 1), p(b + 2) - p(a + 2)];
      const [vx, vy, vz] = [p(c) - p(a), p(c + 1) - p(a + 1), p(c + 2) - p(a + 2)];
      let nx = uy * vz - uz * vy;
      let ny = uz * vx - ux * vz;
      let nz = ux * vy - uy * vx;
      const length = Math.hypot(nx, ny, nz) || 1;
      nx /= length;
      ny /= length;
      nz /= length;
      for (const value of [nx, ny, nz]) {
        view.setFloat32(offset, value, true);
        offset += 4;
      }
      for (const i of [a, b, c]) {
        for (let k = 0; k < 3; k++) {
          view.setFloat32(offset, p(i + k), true);
          offset += 4;
        }
      }
      view.setUint16(offset, 0, true);
      offset += 2;
    }
  }
  return buffer;
};
