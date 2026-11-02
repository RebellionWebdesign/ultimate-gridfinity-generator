// Loads what a build needs besides the numbers: the text font and the built-in icons.
// The loaders are passed in, so the worker reads files over HTTP and the tests from disk.
import opentype, { type Font } from "opentype.js";
import { hasSymbol, hasText, type IconPolylines, type LabelAssets } from "./label";
import type { FontChoice, LidParams } from "../model/lidParams";
import type { SvgShapes } from "./svg";

export interface AssetLoaders {
  fontBytes: (choice: FontChoice) => Promise<ArrayBuffer>;
  icons: () => Promise<Record<string, IconPolylines>>;
}

const fonts = new Map<FontChoice, Promise<Font>>();
let icons: Promise<Record<string, IconPolylines>> | undefined;

const loadFont = (choice: FontChoice, loaders: AssetLoaders): Promise<Font> => {
  let font = fonts.get(choice);
  if (!font) {
    font = loaders.fontBytes(choice).then((bytes) => opentype.parse(bytes));
    fonts.set(choice, font);
  }
  return font;
};

/** Everything `buildLabel` needs for these parameters, loaded on demand and cached. */
export const prepareAssets = async (
  p: LidParams,
  loaders: AssetLoaders,
  svg?: SvgShapes,
): Promise<LabelAssets> => {
  const assets: LabelAssets = {};
  if (hasText(p)) assets.font = await loadFont(p.font_choice, loaders);
  if (hasSymbol(p)) {
    if (p.symbol_source === "lucide") {
      icons ??= loaders.icons();
      assets.icons = await icons;
    } else assets.svg = svg;
  }
  return assets;
};
