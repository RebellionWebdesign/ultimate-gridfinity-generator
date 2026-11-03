import type { ModelMesh } from "../geometry/model";
import type { SvgShapes } from "../geometry/svg";
import type { BaseplateParams } from "../model/baseplateParams";
import type { BinParams } from "../model/binParams";
import type { LidParams } from "../model/lidParams";

export type BuildRequest =
  | {
      id: number;
      part: "lid";
      params: LidParams;
      /** the uploaded SVG, already read into shapes (the worker has no DOM parser) */
      svg?: SvgShapes;
    }
  | { id: number; part: "baseplate"; params: BaseplateParams }
  | { id: number; part: "bin"; params: BinParams };

export type BuildResponse =
  | { id: number; ok: true; model: ModelMesh }
  /** `input`: the user's file or setting is wrong (shown as a fix), not a crash */
  | { id: number; ok: false; message: string; input: boolean };
