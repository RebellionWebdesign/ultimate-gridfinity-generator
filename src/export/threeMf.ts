// 3MF writer (ADR-0003, ADR-0008). The lid is ONE object made of separate parts (plate,
// lip, text, symbol): the parts are never merged, and the slicer keeps them registered
// to each other. The layout follows what Bambu Studio itself writes (production
// extension, one model file per part, `Metadata/model_settings.config` with a filament
// per part, `Metadata/project_settings.config` with the filament colours), so Bambu
// Studio loads the colours instead of "geometry data only". Other slicers read the
// standard `basematerials` colours and the components.
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

/** Where the object sits on the bed: the centre of a 256 mm bed (most Bambu Lab printers). */
const BED_CENTRE = 128;

const num = (value: number): string => String(Math.round(value * 1e5) / 1e5);

const escapeXml = (text: string): string =>
  text.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** `#rrggbb` to the `#RRGGBBAA` form of the 3MF display colour. */
const displayColour = (hex: string): string => `${hex.toUpperCase()}FF`;

const hex8 = (n: number): string => n.toString(16).padStart(8, "0");
/** Stable UUIDs in the form the production extension wants (`p:UUID`). */
const uuid = (kind: number, n: number): string =>
  `${hex8(kind * 0x10000 + n)}-61cb-4c03-9d28-80fed5dfa1dc`;

const NS =
  `xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" ` +
  `xmlns:BambuStudio="http://schemas.bambulab.com/package/2021" ` +
  `xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06" ` +
  `requiredextensions="p"`;

/** Filament slot (1, 2, ...) per part: parts with the same colour share a slot. */
export const filamentSlots = (
  parts: readonly PartMesh[],
  colours: PartColours,
): { slots: number[]; palette: string[] } => {
  const palette: string[] = [];
  const slots = parts.map((part) => {
    const colour = colours[part.name].toUpperCase();
    let at = palette.indexOf(colour);
    if (at < 0) {
      palette.push(colour);
      at = palette.length - 1;
    }
    return at + 1;
  });
  return { slots, palette };
};

/** One part as its own model file (production extension: object ids 1..n). */
export const partModelXml = (part: PartMesh, id: number, colour: string): string => {
  const vertices: string[] = [];
  for (let i = 0; i < part.positions.length; i += 3) {
    const [x, y, z] = [part.positions[i], part.positions[i + 1], part.positions[i + 2]];
    vertices.push(`<vertex x="${num(x ?? 0)}" y="${num(y ?? 0)}" z="${num(z ?? 0)}"/>`);
  }
  const triangles: string[] = [];
  for (let i = 0; i < part.indices.length; i += 3) {
    const [v1, v2, v3] = [part.indices[i], part.indices[i + 1], part.indices[i + 2]];
    triangles.push(`<triangle v1="${v1}" v2="${v2}" v3="${v3}"/>`);
  }
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<model unit="millimeter" xml:lang="en-US" ${NS}>\n` +
    ` <metadata name="BambuStudio:3mfVersion">1</metadata>\n` +
    ` <resources>\n` +
    `  <basematerials id="${id + 100}"><base name="${escapeXml(NAMES[part.name])}" displaycolor="${displayColour(colour)}"/></basematerials>\n` +
    `  <object id="${id}" p:UUID="${uuid(1, id)}" type="model" pid="${id + 100}" pindex="0">\n` +
    `   <mesh><vertices>${vertices.join("")}</vertices><triangles>${triangles.join("")}</triangles></mesh>\n` +
    `  </object>\n` +
    ` </resources>\n` +
    ` <build/>\n` +
    `</model>\n`
  );
};

export const modelXml = (count: number, title: string): string => {
  const root = count + 1;
  const components = Array.from(
    { length: count },
    (_, i) =>
      `<component p:path="/3D/Objects/object_${i + 1}.model" objectid="${i + 1}" ` +
      `p:UUID="${uuid(2, i + 1)}" transform="1 0 0 0 1 0 0 0 1 0 0 0"/>`,
  ).join("\n    ");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<model unit="millimeter" xml:lang="en-US" ${NS}>\n` +
    ` <metadata name="Application">Ultimate Gridfinity Generator</metadata>\n` +
    ` <metadata name="BambuStudio:3mfVersion">1</metadata>\n` +
    ` <metadata name="Title">${escapeXml(title)}</metadata>\n` +
    ` <resources>\n` +
    `  <object id="${root}" p:UUID="${uuid(3, root)}" type="model">\n` +
    `   <components>\n    ${components}\n   </components>\n` +
    `  </object>\n` +
    ` </resources>\n` +
    ` <build p:UUID="${uuid(4, 1)}">\n` +
    `  <item objectid="${root}" p:UUID="${uuid(5, root)}" ` +
    `transform="1 0 0 0 1 0 0 0 1 ${BED_CENTRE} ${BED_CENTRE} 0" printable="1"/>\n` +
    ` </build>\n` +
    `</model>\n`
  );
};

export const modelSettingsXml = (
  parts: readonly PartMesh[],
  slots: readonly number[],
  title: string,
): string => {
  const root = parts.length + 1;
  const partXml = parts
    .map(
      (part, i) =>
        `    <part id="${i + 1}" subtype="normal_part">\n` +
        `      <metadata key="name" value="${escapeXml(NAMES[part.name])}"/>\n` +
        `      <metadata key="matrix" value="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1"/>\n` +
        `      <metadata key="extruder" value="${slots[i]}"/>\n` +
        `    </part>`,
    )
    .join("\n");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n<config>\n` +
    `  <object id="${root}">\n` +
    `    <metadata key="name" value="${escapeXml(title)}"/>\n` +
    `    <metadata key="extruder" value="${slots[0] ?? 1}"/>\n` +
    `${partXml}\n  </object>\n` +
    `  <plate>\n` +
    `    <metadata key="plater_id" value="1"/>\n` +
    `    <metadata key="plater_name" value=""/>\n` +
    `    <metadata key="locked" value="false"/>\n` +
    `    <model_instance>\n` +
    `      <metadata key="object_id" value="${root}"/>\n` +
    `      <metadata key="instance_id" value="0"/>\n` +
    `    </model_instance>\n` +
    `  </plate>\n</config>\n`
  );
};

export const projectSettings = (palette: readonly string[]): string =>
  JSON.stringify(
    {
      from: "project",
      name: "project_settings",
      filament_colour: palette,
      filament_type: palette.map(() => "PLA"),
    },
    null,
    2,
  );

const CONTENT_TYPES =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n` +
  ` <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n` +
  ` <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>\n` +
  `</Types>\n`;

const MODEL_REL = "http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel";

const rels = (targets: { target: string; id: string }[]): string =>
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n` +
  targets
    .map(
      (t) => ` <Relationship Target="${t.target}" Id="${t.id}" Type="${MODEL_REL}"/>\n`,
    )
    .join("") +
  `</Relationships>\n`;

export const write3mf = async (
  parts: readonly PartMesh[],
  colours: PartColours,
  title = "Gridfinity lid",
): Promise<Uint8Array> => {
  const encoder = new TextEncoder();
  const { slots, palette } = filamentSlots(parts, colours);
  const text = (name: string, data: string) => ({ name, data: encoder.encode(data) });
  return zip([
    text("[Content_Types].xml", CONTENT_TYPES),
    text("_rels/.rels", rels([{ target: "/3D/3dmodel.model", id: "rel-1" }])),
    text("3D/3dmodel.model", modelXml(parts.length, title)),
    text(
      "3D/_rels/3dmodel.model.rels",
      rels(
        parts.map((_, i) => ({
          target: `/3D/Objects/object_${i + 1}.model`,
          id: `rel-${i + 1}`,
        })),
      ),
    ),
    ...parts.map((part, i) =>
      text(
        `3D/Objects/object_${i + 1}.model`,
        partModelXml(part, i + 1, colours[part.name]),
      ),
    ),
    text("Metadata/model_settings.config", modelSettingsXml(parts, slots, title)),
    text("Metadata/project_settings.config", projectSettings(palette)),
  ]);
};
