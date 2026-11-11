// 3MF writer (ADR-0003, ADR-0008): a plain 3MF Core file, no vendor files. The lid is ONE
// object made of components: plate, lip, text and symbol stay separate meshes (never
// merged), each with its colour in a `colorgroup` of the 3MF Materials Extension (prefix `m`,
// 3MF Consortium, BSD-2-Clause). Bambu Studio reads colours from that element, not from
// `basematerials`, and then shows its dialog that maps each colour to a filament.
import type { PartMesh, PartName } from "../geometry/model";
import { zip } from "./zip";

export interface PartColours {
  plate: string;
  lip: string;
  text: string;
  symbol: string;
}

const num = (value: number): string => String(Math.round(value * 1e5) / 1e5);

const escapeXml = (text: string): string =>
  text.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** The colour as `#RRGGBB`. */
const colourValue = (hex: string): string => hex.toUpperCase();

export const partName = (name: PartName, bodyName: string): string =>
  ({ plate: bodyName, lip: "Stacking lip", text: "Text", symbol: "Symbol" })[name];

/** One object of a 3MF with several: its parts, its name, and where to put it (mm). */
export interface Piece {
  parts: readonly PartMesh[];
  name: string;
  offset?: [number, number];
}

/**
 * The resources and the build item of one piece. Resource ids from `base` on: the colour
 * group of part i is `base + i + 1`, its mesh object `base + parts + i + 1`, the assembled
 * object `base + 2 * parts + 1`.
 */
const pieceXml = (
  piece: Piece,
  colours: PartColours,
  bodyName: string,
  base: number,
): { resources: string; item: string; used: number } => {
  const { parts } = piece;
  const count = parts.length;
  const groups = parts
    .map(
      (part, i) =>
        `  <m:colorgroup id="${base + i + 1}"><m:color color="${colourValue(colours[part.name])}"/></m:colorgroup>`,
    )
    .join("\n");
  const objects = parts
    .map((part, i) => {
      const vertices: string[] = [];
      for (let k = 0; k < part.positions.length; k += 3) {
        const [x, y, z] = [
          part.positions[k],
          part.positions[k + 1],
          part.positions[k + 2],
        ];
        vertices.push(
          `<vertex x="${num(x ?? 0)}" y="${num(y ?? 0)}" z="${num(z ?? 0)}"/>`,
        );
      }
      const triangles: string[] = [];
      for (let k = 0; k < part.indices.length; k += 3) {
        const [v1, v2, v3] = [
          part.indices[k],
          part.indices[k + 1],
          part.indices[k + 2],
        ];
        triangles.push(`<triangle v1="${v1}" v2="${v2}" v3="${v3}"/>`);
      }
      return (
        `  <object id="${base + count + i + 1}" name="${escapeXml(partName(part.name, bodyName))}" type="model" pid="${base + i + 1}" pindex="0">
` +
        `   <mesh><vertices>${vertices.join("")}</vertices><triangles>${triangles.join("")}</triangles></mesh>
` +
        `  </object>`
      );
    })
    .join("\n");
  const root = base + 2 * count + 1;
  const components = parts
    .map((_, i) => `<component objectid="${base + count + i + 1}"/>`)
    .join("");
  const transform = piece.offset
    ? ` transform="1 0 0 0 1 0 0 0 1 ${num(piece.offset[0])} ${num(piece.offset[1])} 0"`
    : "";
  return {
    resources:
      `${groups}
${objects}
` +
      `  <object id="${root}" name="${escapeXml(piece.name)}" type="model"><components>${components}</components></object>`,
    item: `<item objectid="${root}"${transform}/>`,
    used: 2 * count + 1,
  };
};

/** A 3MF with every piece as its own object, each with its parts and colours. */
export const modelXmlPieces = (
  pieces: readonly Piece[],
  colours: PartColours,
  title: string,
  bodyName = "Lid",
): string => {
  let base = 0;
  const built = pieces.map((piece) => {
    const one = pieceXml(piece, colours, bodyName, base);
    base += one.used;
    return one;
  });
  return (
    `<?xml version="1.0" encoding="UTF-8"?>
` +
    `<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
` +
    ` <metadata name="Title">${escapeXml(title)}</metadata>
` +
    ` <metadata name="Application">Ultimate Gridfinity Generator</metadata>
` +
    ` <resources>
${built.map((one) => one.resources).join("\n")}
 </resources>
` +
    ` <build>${built.map((one) => one.item).join("")}</build>
` +
    `</model>
`
  );
};

/** The 3MF of one object, named `title`. */
export const modelXml = (
  parts: readonly PartMesh[],
  colours: PartColours,
  title: string,
  bodyName = "Lid",
): string => modelXmlPieces([{ parts, name: title }], colours, title, bodyName);

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

export const write3mf = async (
  parts: readonly PartMesh[],
  colours: PartColours,
  title = "Gridfinity lid",
  bodyName = "Lid",
): Promise<Uint8Array> => {
  const encoder = new TextEncoder();
  const text = (name: string, data: string) => ({ name, data: encoder.encode(data) });
  return zip([
    text("[Content_Types].xml", CONTENT_TYPES),
    text("_rels/.rels", RELS),
    text("3D/3dmodel.model", modelXml(parts, colours, title, bodyName)),
  ]);
};

const package3mf = async (model: string): Promise<Uint8Array> => {
  const encoder = new TextEncoder();
  const text = (name: string, data: string) => ({ name, data: encoder.encode(data) });
  return zip([
    text("[Content_Types].xml", CONTENT_TYPES),
    text("_rels/.rels", RELS),
    text("3D/3dmodel.model", model),
  ]);
};

/** One 3MF with every piece as its own object, at the given offsets. */
export const write3mfPieces = async (
  pieces: readonly Piece[],
  colours: PartColours,
  title: string,
  bodyName = "Lid",
): Promise<Uint8Array> => package3mf(modelXmlPieces(pieces, colours, title, bodyName));
