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
import { PLATE_GAP, centreOf } from "./tileLayout";
import { modelXmlPieces, type PartColours, type Piece } from "./threeMf";
import { zip } from "./zip";

/** One object of the file: its parts, its name; every piece gets its own plate. */
export interface PlatePiece {
  parts: readonly PartMesh[];
  name: string;
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

const plateSettings = (objectIds: number[]): string => {
  const meta = (key: string, value: string) =>
    `<metadata key="${key}" value="${value}"/>`;
  const plates = objectIds.map(
    (id, k) =>
      `  <plate>\n` +
      `   ${meta("plater_id", String(k + 1))}\n` +
      `   ${meta("plater_name", "")}\n` +
      `   ${meta("locked", "false")}\n` +
      `   <model_instance>\n` +
      `    ${meta("object_id", String(id))}\n` +
      `    ${meta("instance_id", "0")}\n` +
      `    ${meta("identify_id", String(100 + k * 20))}\n` +
      `   </model_instance>\n` +
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
 * colour), every piece on its own plate, the plates in the grid of Bambu Studio for a bed of
 * `bed` mm, each piece in the middle of its plate.
 */
export const write3mfPlates = async (
  pieces: readonly PlatePiece[],
  colours: PartColours,
  bed: [number, number],
  title: string,
  bodyName: string,
): Promise<Uint8Array> => {
  const placed: Piece[] = pieces.map((piece, k) => {
    const [cx, cy] = centreOf(piece.parts);
    const [px, py] = plateCentre(k, pieces.length, bed);
    return { parts: piece.parts, name: piece.name, offset: [px - cx, py - cy] };
  });
  const encoder = new TextEncoder();
  const text = (name: string, data: string) => ({ name, data: encoder.encode(data) });
  return zip([
    text("[Content_Types].xml", CONTENT_TYPES),
    text("_rels/.rels", RELS),
    text("3D/3dmodel.model", modelXmlPieces(placed, colours, title, bodyName)),
    text("Metadata/model_settings.config", plateSettings(objectIdsOf(pieces))),
  ]);
};
