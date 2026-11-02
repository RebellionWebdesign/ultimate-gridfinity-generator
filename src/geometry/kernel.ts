// Loads the Manifold WASM module and keeps native objects from leaking.
// The browser passes the bundled .wasm URL (see the worker); Node (tests) finds it itself.
import Module, { type ManifoldToplevel } from "manifold-3d";

export type Kernel = ManifoldToplevel;

export const initKernel = async (wasmUrl?: string): Promise<Kernel> => {
  const kernel = await Module(wasmUrl ? { locateFile: () => wasmUrl } : undefined);
  kernel.setup();
  return kernel;
};

interface Disposable {
  delete(): void;
}

/** Collects Manifold and CrossSection objects and frees them together. */
export class Scope {
  private items: Disposable[] = [];

  add<T extends Disposable>(item: T): T {
    this.items.push(item);
    return item;
  }

  dispose(): void {
    for (const item of this.items) item.delete();
    this.items = [];
  }
}
