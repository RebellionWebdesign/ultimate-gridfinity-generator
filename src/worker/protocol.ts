import type { ModelMesh } from "../geometry/model";
import type { SvgShapes } from "../geometry/svg";
import type { BaseplateParams } from "../model/baseplateParams";
import type { BinParams } from "../model/binParams";
import type { Connectable } from "../gridfinity/connector";
import type { LabelParams } from "../model/labelParams";
import type { LidParams } from "../model/lidParams";

export type BuildRequest =
  | {
      id: number;
      part: "lid";
      params: LidParams;
      /** the uploaded SVG, already read into shapes (the worker has no DOM parser) */
      svg?: SvgShapes;
    }
  | {
      id: number;
      part: "baseplate";
      params: BaseplateParams;
      /** printable width and depth: a plate with `split_to_bed` is cut to fit */
      maxTile?: [number, number];
    }
  /** with `label`, the label is also shown in the bin (preview only) */
  | {
      id: number;
      part: "bin";
      params: BinParams;
      label?: LabelParams;
      labelSvg?: SvgShapes;
    }
  /** the label of a bin: its size follows the bin */
  | { id: number; part: "connector"; variant: Connectable }
  | { id: number; part: "label"; bin: BinParams; params: LabelParams; svg?: SvgShapes };

export type BuildResponse =
  | { id: number; ok: true; model: ModelMesh }
  /** `input`: the user's file or setting is wrong (shown as a fix), not a crash */
  | { id: number; ok: false; message: string; input: boolean };
