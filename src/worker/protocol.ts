import type { ModelMesh } from "../geometry/model";
import type { SvgShapes } from "../geometry/svg";
import type { LidParams } from "../model/lidParams";

export interface BuildRequest {
  id: number;
  params: LidParams;
  /** the uploaded SVG, already read into shapes (the worker has no DOM parser) */
  svg?: SvgShapes;
}

export type BuildResponse =
  | { id: number; ok: true; model: ModelMesh }
  /** `input`: the user's file or setting is wrong (shown as a fix), not a crash */
  | { id: number; ok: false; message: string; input: boolean };
