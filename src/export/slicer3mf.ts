// The 3MF of the app (owner, 11 November 2026): the file of ADR-0008 (every piece one object
// made of components, each part with its colour in a `colorgroup`) plus one plate per piece in
// `Metadata/model_settings.config`, the pieces placed in the plate grid of Bambu Studio.
//
// Bambu Studio reads the colours and asks which filament each colour gets, and puts every
// piece on its own plate. OrcaSlicer loads geometry and colours; it applies the plates of a
// file only when the file carries project settings (Orca: `load_config`), and such settings
// would replace the user's printer and process setup, so there are none: in Orca the user
// arranges the pieces. There is no difference between the slicers in the file.
//
// What the file leaves out on purpose: `project_settings.config`. It would carry the whole
// printer, process and filament profile of the machine that wrote it, and the other slicer
// rejects values of it (Orca into Bambu: colour penetration layers 0, line widths in percent;
// Bambu into Orca: raft expansion -1, relative extruder without G92 E0).
//
// The plate layout was read from files that both slicers saved, and from the open
// repositories (BambuStudio, OrcaSlicer: Format/bbs_3mf.cpp). No code of them is used here.
import type { PartMesh } from "../geometry/model";
import { PLATE_GAP, centreOf, packPieces, sizeOfFootprint } from "./tileLayout";
import { modelXmlPieces, type PartColours, type Piece } from "./threeMf";
import { zip } from "./zip";

/** One object of the file: its parts and its name. */
export interface PlatePiece {
  parts: readonly PartMesh[];
  name: string;
  /** a piece of a set has its own colours and the name of its main part */
  colours?: PartColours;
  bodyName?: string;
}

/** Where plate k (0-based) has its middle: a grid from the front left, with a gap of a fifth of the bed. */
export const plateCentre = (
  k: number,
  count: number,
  bed: [number, number],
): [number, number] => {
  const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
  return [
    (k % cols) * bed[0] * (1 + PLATE_GAP) + bed[0] / 2,
    bed[1] / 2 - Math.floor(k / cols) * bed[1] * (1 + PLATE_GAP),
  ];
};

/**
 * The ids `modelXmlPieces` gives the objects that hold the parts: a piece with n parts uses
 * 2 n + 1 ids (n colour groups, n meshes, the object), and its object is the last of them.
 */
export const objectIdsOf = (pieces: readonly PlatePiece[]): number[] => {
  let base = 0;
  return pieces.map((piece) => {
    const count = piece.parts.length;
    const id = base + 2 * count + 1;
    base += 2 * count + 1;
    return id;
  });
};

/** The plates of the file: `onPlate[k]` lists the ids of the objects that stand on plate k. */
const plateSettings = (onPlate: number[][]): string => {
  const meta = (key: string, value: string) =>
    `<metadata key="${key}" value="${value}"/>`;
  let n = 0;
  const plates = onPlate.map(
    (ids, k) =>
      `  <plate>\n` +
      `   ${meta("plater_id", String(k + 1))}\n` +
      `   ${meta("plater_name", "")}\n` +
      `   ${meta("locked", "false")}\n` +
      ids
        .map(
          (id) =>
            `   <model_instance>\n` +
            `    ${meta("object_id", String(id))}\n` +
            `    ${meta("instance_id", "0")}\n` +
            `    ${meta("identify_id", String(100 + n++ * 20))}\n` +
            `   </model_instance>\n`,
        )
        .join("") +
      `  </plate>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<config>\n${plates.join("\n")}\n</config>\n`;
};

const CONTENT_TYPES =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n` +
  ` <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n` +
  ` <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>\n` +
  `</Types>\n`;

const RELS =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n` +
  ` <Relationship Target="/3D/3dmodel.model" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>\n` +
  `</Relationships>\n`;

/**
 * The 3MF: every piece is one object (its parts stay separate parts of it, each with its
 * colour), laid on the plate of a bed of `bed` mm side by side with a gap, the group in the
 * middle of the plate. A piece that fills a plate, or what does not fit, goes on the next
 * plate; the plates sit in the grid of Bambu Studio.
 */
export const write3mfPlates = async (
  pieces: readonly PlatePiece[],
  colours: PartColours,
  bed: [number, number],
  title: string,
  bodyName: string,
): Promise<Uint8Array> => {
  // as many pieces on a plate as fit, the group centred on it; a piece that fills a plate gets
  // a plate of its own (owner, 15 November 2026: the pieces must hit the plate)
  const packed = packPieces(
    pieces.map((piece) => sizeOfFootprint(piece.parts)),
    bed,
  );
  const plateCount = Math.max(1, ...packed.map((p) => p.plate + 1));
  const placed: Piece[] = pieces.map((piece, k) => {
    const [cx, cy] = centreOf(piece.parts);
    const at = packed[k] as (typeof packed)[number];
    // the place of the plate in the grid of Bambu Studio, then the piece on that plate
    const [px, py] = plateCentre(at.plate, plateCount, bed);
    return {
      parts: piece.parts,
      name: piece.name,
      offset: [px - bed[0] / 2 + at.cx - cx, py - bed[1] / 2 + at.cy - cy],
      ...(piece.colours ? { colours: piece.colours } : {}),
      ...(piece.bodyName ? { bodyName: piece.bodyName } : {}),
    };
  });
  const ids = objectIdsOf(pieces);
  const onPlate: number[][] = Array.from({ length: plateCount }, () => []);
  packed.forEach((p, k) => onPlate[p.plate]?.push(ids[k] as number));
  const encoder = new TextEncoder();
  const text = (name: string, data: string) => ({ name, data: encoder.encode(data) });
  return zip([
    text("[Content_Types].xml", CONTENT_TYPES),
    text("_rels/.rels", RELS),
    text("3D/3dmodel.model", modelXmlPieces(placed, colours, title, bodyName)),
    text("Metadata/model_settings.config", plateSettings(onPlate)),
  ]);
};
