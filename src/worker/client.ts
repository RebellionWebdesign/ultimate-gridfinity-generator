// Main-thread side of the geometry worker: one request at a time wins, older ones are
// dropped so a fast slider never queues up work.
import type { ModelMesh } from "../geometry/model";
import type { SvgShapes } from "../geometry/svg";
import type { BaseplateParams } from "../model/baseplateParams";
import type { BinParams } from "../model/binParams";
import type { LidParams } from "../model/lidParams";
import type { BuildRequest, BuildResponse } from "./protocol";

/** The user's input is wrong (a font or SVG file): a fix to show, not a crash. */
export class InputBuildError extends Error {}

export class GeometryClient {
  private worker: Worker;
  private counter = 0;
  private pending = new Map<
    number,
    { resolve: (m: ModelMesh) => void; reject: (e: Error) => void }
  >();

  constructor() {
    this.worker = new Worker(new URL("./geometry.worker.ts", import.meta.url), {
      type: "module",
    });
    this.worker.onmessage = (event: MessageEvent<BuildResponse>) => {
      const reply = event.data;
      const waiting = this.pending.get(reply.id);
      if (!waiting) return;
      this.pending.delete(reply.id);
      if (reply.ok) waiting.resolve(reply.model);
      else if (reply.input) waiting.reject(new InputBuildError(reply.message));
      else waiting.reject(new Error(reply.message));
    };
    this.worker.onerror = (event) => {
      const error = new Error(event.message || "The geometry worker stopped.");
      for (const waiting of this.pending.values()) waiting.reject(error);
      this.pending.clear();
    };
  }

  build(
    params: LidParams,
    svg?: SvgShapes,
  ): { id: number; result: Promise<ModelMesh> } {
    return this.send((id) => ({ id, part: "lid", params, svg }));
  }

  buildBaseplate(
    params: BaseplateParams,
    maxTile?: [number, number],
  ): { id: number; result: Promise<ModelMesh> } {
    return this.send((id) => ({ id, part: "baseplate", params, maxTile }));
  }

  buildBin(params: BinParams): { id: number; result: Promise<ModelMesh> } {
    return this.send((id) => ({ id, part: "bin", params }));
  }

  private send(request: (id: number) => BuildRequest): {
    id: number;
    result: Promise<ModelMesh>;
  } {
    const id = ++this.counter;
    const result = new Promise<ModelMesh>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
    this.worker.postMessage(request(id));
    return { id, result };
  }

  terminate(): void {
    this.worker.terminate();
    this.pending.clear();
  }
}
