// The only place where geometry is computed in the browser (ADR-0001): Manifold WASM in
// a Web Worker. The WASM file is a bundled static asset, found through `locateFile`.
import wasmUrl from "manifold-3d/manifold.wasm?url";
import { InputError, prepareAssets, type AssetLoaders } from "../geometry/assets";
import { initKernel } from "../geometry/kernel";
import {
  buildBaseplateModel,
  buildBinModel,
  buildConnectorModel,
  buildLabelModel,
  buildModel,
} from "../geometry/model";
import { labelAsLid } from "../model/labelParams";
import type { BundledFont } from "../model/lidParams";
import type { BuildRequest, BuildResponse } from "./protocol";

const kernel = initKernel(wasmUrl);

const fontUrls: Record<BundledFont, string> = {
  Inter: new URL("../fonts/Inter-Regular.otf", import.meta.url).href,
  "IBM Plex Mono": new URL("../fonts/IBMPlexMono-Regular.woff", import.meta.url).href,
  "IBM Plex Sans SemiBold": new URL(
    "../fonts/IBMPlexSans-SemiBold.woff",
    import.meta.url,
  ).href,
};

const loaders: AssetLoaders = {
  fontBytes: async (choice) => {
    const response = await fetch(fontUrls[choice]);
    if (!response.ok) throw new Error(`The font ${choice} could not be loaded.`);
    return response.arrayBuffer();
  },
  icons: async () => (await import("../data/lucideLidIcons.json")).default,
};

/**
 * The bin, and with the request's `label` also the label in its place. If the label's font
 * or SVG cannot be loaded the bin is built without it and a note says why: a wrong label
 * must not stop the bin.
 */
const buildBinWithLabel = async (
  k: Awaited<typeof kernel>,
  request: Extract<BuildRequest, { part: "bin" }>,
) => {
  const { label } = request;
  if (!label) return buildBinModel(k, request.params);
  let assets;
  try {
    assets = await prepareAssets(labelAsLid(label), loaders, request.labelSvg);
  } catch (error) {
    const model = buildBinModel(k, request.params);
    model.warnings.push(
      `The label is not shown: ${error instanceof Error ? error.message : String(error)}`,
    );
    return model;
  }
  return buildBinModel(k, request.params, label, assets);
};

self.onmessage = async (event: MessageEvent<BuildRequest>) => {
  const request = event.data;
  const { id } = request;
  let response: BuildResponse;
  const transfer: Transferable[] = [];
  try {
    const model =
      request.part === "baseplate"
        ? buildBaseplateModel(await kernel, request.params, request.maxTile)
        : request.part === "bin"
          ? await buildBinWithLabel(await kernel, request)
          : request.part === "connector"
            ? buildConnectorModel(
                await kernel,
                request.variant,
                request.copies,
                request.maxWidth,
              )
            : request.part === "label"
              ? buildLabelModel(
                  await kernel,
                  request.bin,
                  request.params,
                  await prepareAssets(labelAsLid(request.params), loaders, request.svg),
                )
              : buildModel(
                  await kernel,
                  request.params,
                  await prepareAssets(request.params, loaders, request.svg),
                );
    for (const part of [
      ...model.parts,
      ...(model.extras ?? []),
      ...(model.tiles ?? []).flatMap((t) => t.parts),
    ]) {
      transfer.push(part.positions.buffer, part.indices.buffer);
    }
    response = { id, ok: true, model };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    response = { id, ok: false, message, input: error instanceof InputError };
  }
  self.postMessage(response, transfer);
};
