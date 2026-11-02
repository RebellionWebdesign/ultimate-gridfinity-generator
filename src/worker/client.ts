// Main-thread side of the geometry worker: one request at a time wins, older ones are
// dropped so a fast slider never queues up work.
import type { ModelMesh } from "../geometry/model";
import type { SvgShapes } from "../geometry/svg";
import type { LidParams } from "../model/lidParams";
import type { BuildRequest, BuildResponse } from "./protocol";

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
    const id = ++this.counter;
    const result = new Promise<ModelMesh>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
    const request: BuildRequest = { id, params, svg };
    this.worker.postMessage(request);
    return { id, result };
  }

  terminate(): void {
    this.worker.terminate();
    this.pending.clear();
  }
}
