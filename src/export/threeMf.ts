// 3MF writer (ADR-0003): every part (plate, lip, text, symbol) is its own <object> with
// a base-material colour, so a slicer can give each one a filament. Parts are never
// merged. Reference: 3MF Core Specification, the `basematerials` resource.
import type { PartMesh, PartName } from "../geometry/model";
import { zip } from "./zip";

export interface PartColours {
  plate: string;
  lip: string;
  text: string;
  symbol: string;
}

const NAMES: Record<PartName, string> = {
  plate: "Plate",
  lip: "Stacking lip",
  text: "Text",
  symbol: "Symbol",
};

const num = (value: number): string => String(Math.round(value * 1e5) / 1e5);

const escapeXml = (text: string): string =>
  text.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** `#rrggbb` to the `#RRGGBBAA` form of the 3MF display colour. */
const displayColour = (hex: string): string => `${hex.toUpperCase()}FF`;

export const modelXml = (
  parts: readonly PartMesh[],
  colours: PartColours,
  title: string,
): string => {
  const materials = parts
    .map(
      (part) =>
        `<base name="${escapeXml(NAMES[part.name])}" displaycolor="${displayColour(colours[part.name])}"/>`,
    )
    .join("");
  const objects = parts
    .map((part, index) => {
      const vertices: string[] = [];
      for (let i = 0; i < part.positions.length; i += 3) {
        const [x, y, z] = [
          part.positions[i],
          part.positions[i + 1],
          part.positions[i + 2],
        ];
        vertices.push(
          `<vertex x="${num(x ?? 0)}" y="${num(y ?? 0)}" z="${num(z ?? 0)}"/>`,
        );
      }
      const triangles: string[] = [];
      for (let i = 0; i < part.indices.length; i += 3) {
        const [v1, v2, v3] = [
          part.indices[i],
          part.indices[i + 1],
          part.indices[i + 2],
        ];
        triangles.push(`<triangle v1="${v1}" v2="${v2}" v3="${v3}"/>`);
      }
      return (
        `<object id="${index + 2}" name="${escapeXml(NAMES[part.name])}" type="model" ` +
        `pid="1" pindex="${index}"><mesh><vertices>${vertices.join("")}</vertices>` +
        `<triangles>${triangles.join("")}</triangles></mesh></object>`
      );
    })
    .join("");
  const items = parts.map((_, index) => `<item objectid="${index + 2}"/>`).join("");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<model unit="millimeter" xml:lang="en-US" ` +
    `xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">` +
    `<metadata name="Title">${escapeXml(title)}</metadata>` +
    `<metadata name="Application">Ultimate Gridfinity Generator</metadata>` +
    `<resources><basematerials id="1">${materials}</basematerials>${objects}</resources>` +
    `<build>${items}</build></model>`
  );
};

const CONTENT_TYPES =
  `<?xml version="1.0" encoding="UTF-8"?>` +
  `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
  `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
  `<Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>` +
  `</Types>`;

const RELS =
  `<?xml version="1.0" encoding="UTF-8"?>` +
  `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
  `<Relationship Target="/3D/3dmodel.model" Id="rel0" ` +
  `Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>`;

export const write3mf = async (
  parts: readonly PartMesh[],
  colours: PartColours,
  title = "Gridfinity lid",
): Promise<Uint8Array> => {
  const encoder = new TextEncoder();
  return zip([
    { name: "[Content_Types].xml", data: encoder.encode(CONTENT_TYPES) },
    { name: "_rels/.rels", data: encoder.encode(RELS) },
    { name: "3D/3dmodel.model", data: encoder.encode(modelXml(parts, colours, title)) },
  ]);
};
