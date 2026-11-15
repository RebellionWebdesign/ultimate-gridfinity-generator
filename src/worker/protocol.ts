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
  | {
      id: number;
      part: "connector";
      variant: Connectable;
      copies: number;
      maxWidth: number;
    }
  | { id: number; part: "label"; bin: BinParams; params: LabelParams; svg?: SvgShapes }
  /** a set (ADR-0009): the baseplate and every bin with its label and lid, placed */
  | {
      id: number;
      part: "assembly";
      plate: BaseplateParams;
      bins: AssemblyRequestBin[];
      maxTile?: [number, number];
    };

/** A bin of a set for the worker; the SVG files are read on the main thread (no DOM there). */
export interface AssemblyRequestBin {
  name: string;
  bin: BinParams;
  label: LabelParams;
  lidOn: boolean;
  lid: LidParams;
  col: number;
  row: number;
  turned: boolean;
  labelSvg?: SvgShapes;
  lidSvg?: SvgShapes;
}

export type BuildResponse =
  | { id: number; ok: true; model: ModelMesh }
  /** `input`: the user's file or setting is wrong (shown as a fix), not a crash */
  | { id: number; ok: false; message: string; input: boolean };
