// Loads what a build needs besides the numbers: the text font and the built-in icons.
// The loaders are passed in, so the worker reads files over HTTP and the tests from disk.
import opentype, { type Font } from "opentype.js";
import { hasSymbol, hasText, type IconPolylines, type LabelAssets } from "./label";
import type { BundledFont, LidParams } from "../model/lidParams";
import type { SvgShapes } from "./svg";

export interface AssetLoaders {
  fontBytes: (choice: BundledFont) => Promise<ArrayBuffer>;
  icons: () => Promise<Record<string, IconPolylines>>;
}

/** The input is wrong, not the app: the message tells the user what to change. */
export class InputError extends Error {}

const fonts = new Map<string, Promise<Font>>();
let icons: Promise<Record<string, IconPolylines>> | undefined;

const loadFont = (choice: BundledFont, loaders: AssetLoaders): Promise<Font> => {
  let font = fonts.get(choice);
  if (!font) {
    font = loaders.fontBytes(choice).then((bytes) => opentype.parse(bytes));
    fonts.set(choice, font);
  }
  return font;
};

let uploaded: { key: string; font: Font } | undefined;

/** The user's own font file: base64 in the parameters. WOFF2 is not readable. */
const loadUploadedFont = (p: LidParams): Font => {
  if (!p.font_data) {
    throw new InputError(
      "Upload a font file for the text, or choose one of the listed fonts.",
    );
  }
  const key = `${p.font_name}:${p.font_data.length}`;
  if (uploaded?.key === key) return uploaded.font;
  try {
    const bytes = Uint8Array.from(atob(p.font_data), (c) => c.charCodeAt(0));
    const font = opentype.parse(bytes.buffer);
    uploaded = { key, font };
    return font;
  } catch {
    throw new InputError(
      `${p.font_name || "The font file"} could not be read as a font. Use a .ttf, .otf or .woff file (.woff2 does not work), then upload it again.`,
    );
  }
};

/** Everything `buildLabel` needs for these parameters, loaded on demand and cached. */
export const prepareAssets = async (
  p: LidParams,
  loaders: AssetLoaders,
  svg?: SvgShapes,
): Promise<LabelAssets> => {
  const assets: LabelAssets = {};
  if (hasText(p)) {
    assets.font =
      p.font_choice === "upload"
        ? loadUploadedFont(p)
        : await loadFont(p.font_choice, loaders);
  }
  if (hasSymbol(p)) {
    if (p.symbol_source === "lucide") {
      icons ??= loaders.icons();
      assets.icons = await icons;
    } else assets.svg = svg;
  }
  return assets;
};
