// 3MF writer (ADR-0003, ADR-0008): a plain 3MF Core file, no vendor files. The lid is ONE
// object made of components: plate, lip, text and symbol stay separate meshes (never
// merged), each with its colour as a standard `basematerials` entry. Slicers read the
// colours themselves; Bambu Studio, for example, shows its colour-to-filament dialog for
// such files. Reference: 3MF Core Specification (3MF Consortium, BSD-2-Clause).
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

/** `#rrggbb` to the `#RRGGBBAA` form of the 3MF display colour. */
const displayColour = (hex: string): string => `${hex.toUpperCase()}FF`;

const partName = (name: PartName, bodyName: string): string =>
  ({ plate: bodyName, lip: "Stacking lip", text: "Text", symbol: "Symbol" })[name];

/**
 * Resource ids: colour group of part i is `i + 1`, its mesh object is `parts + i + 1`,
 * the assembled object is `2 * parts + 1`.
 */
export const modelXml = (
  parts: readonly PartMesh[],
  colours: PartColours,
  title: string,
  bodyName = "Lid",
): string => {
  const count = parts.length;
  const groups = parts
    .map(
      (part, i) =>
        `  <basematerials id="${i + 1}"><base name="${escapeXml(partName(part.name, bodyName))}" displaycolor="${displayColour(colours[part.name])}"/></basematerials>`,
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
        `  <object id="${count + i + 1}" name="${escapeXml(partName(part.name, bodyName))}" type="model" pid="${i + 1}" pindex="0">\n` +
        `   <mesh><vertices>${vertices.join("")}</vertices><triangles>${triangles.join("")}</triangles></mesh>\n` +
        `  </object>`
      );
    })
    .join("\n");
  const root = 2 * count + 1;
  const components = parts
    .map((_, i) => `<component objectid="${count + i + 1}"/>`)
    .join("");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n` +
    ` <metadata name="Title">${escapeXml(title)}</metadata>\n` +
    ` <metadata name="Application">Ultimate Gridfinity Generator</metadata>\n` +
    ` <resources>\n${groups}\n${objects}\n` +
    `  <object id="${root}" name="${escapeXml(title)}" type="model"><components>${components}</components></object>\n` +
    ` </resources>\n` +
    ` <build><item objectid="${root}"/></build>\n` +
    `</model>\n`
  );
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
