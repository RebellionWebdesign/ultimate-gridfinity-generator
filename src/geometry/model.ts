// Turns lid parameters into plain mesh data for the preview and the exporters.
// Runs inside the worker; also used directly by the tests.
import type { Manifold } from "manifold-3d";
import { validateLid, type LidParams } from "../model/lidParams";
import type { LabelAssets } from "./label";
import { buildLid } from "./lid";
import { Scope, type Kernel } from "./kernel";

export type PartName = "plate" | "lip" | "text" | "symbol";

export interface PartMesh {
  name: PartName;
  /** x, y, z per vertex */
  positions: Float32Array;
  /** three vertex indices per triangle */
  indices: Uint32Array;
  volume: number;
}

export interface ModelMesh {
  parts: PartMesh[];
  /** overall size in mm: x, y, z */
  size: [number, number, number];
}

const toPartMesh = (name: PartName, m: Manifold): PartMesh => {
  const mesh = m.getMesh();
  const count = mesh.vertProperties.length / mesh.numProp;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = mesh.vertProperties[i * mesh.numProp] ?? 0;
    positions[i * 3 + 1] = mesh.vertProperties[i * mesh.numProp + 1] ?? 0;
    positions[i * 3 + 2] = mesh.vertProperties[i * mesh.numProp + 2] ?? 0;
  }
  return {
    name,
    positions,
    indices: Uint32Array.from(mesh.triVerts),
    volume: m.volume(),
  };
};

export const buildModel = (
  kernel: Kernel,
  params: LidParams,
  assets: LabelAssets = {},
): ModelMesh => {
  const errors = validateLid(params);
  if (errors.length > 0) throw new Error(errors.join(" "));

  const scope = new Scope();
  try {
    const lid = buildLid(kernel, scope, params, assets);
    const named: [PartName, Manifold][] = [["plate", lid.plate]];
    if (lid.lip) named.push(["lip", lid.lip]);
    if (lid.text) named.push(["text", lid.text]);
    if (lid.symbol) named.push(["symbol", lid.symbol]);

    const all = scope.add(kernel.Manifold.compose(named.map(([, m]) => m)));
    const { min, max } = all.boundingBox();
    return {
      parts: named.map(([name, m]) => toPartMesh(name, m)),
      size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]],
    };
  } finally {
    scope.dispose();
  }
};
