// The editor's state: lid parameters, the geometry worker and what it last built.
import type { ModelMesh } from "../geometry/model";
import { parseSvg, SvgError, type SvgShapes } from "../geometry/svg";
import { DEFAULT_LID, validateLid, type LidParams } from "../model/lidParams";
import { parseModel, serializeModel, type ModelFile } from "../model/modelFile";
import { GeometryClient, InputBuildError } from "../worker/client";
import { PRINTERS, checkBed } from "./printers";

const STORAGE_KEY = "ugg.models";
const MAX_STORED = 12;

export interface StoredModel {
  id: string;
  name: string;
  savedAt: string;
  json: string;
}

const readStored = (): StoredModel[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as StoredModel[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

const slug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/\s*×\s*/g, "x")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "lid";

export type Status = "computing" | "ready" | "needs-fix" | "worker-error";

class Editor {
  params = $state<LidParams>({ ...DEFAULT_LID });
  name = $state("Lid 1 × 1");
  model = $state.raw<ModelMesh | null>(null);
  status = $state<Status>("computing");
  message = $state("");
  svgName = $state("");
  svgError = $state("");
  printer = $state(PRINTERS[0]?.name ?? "");
  /** null: the bed check is switched off */
  bedCheck = $state(true);
  startedAt = $state(0);
  fileName = $state("lid-1x1");
  modelId: string = crypto.randomUUID();
  stored = $state<StoredModel[]>(readStored());
  storageFailed = $state(false);
  loadError = $state("");
  /** the user named the model by hand: stop deriving the name from the lid */
  renamed = $state(false);

  private client: GeometryClient | undefined;
  private svgShapes: SvgShapes | undefined;
  private latest = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;

  errors = $derived(validateLid(this.params));

  bed = $derived(PRINTERS.find((p) => p.name === this.printer)?.bed ?? [256, 256, 256]);

  bedResult = $derived(
    this.model ? checkBed(this.model.size, this.bed as [number, number, number]) : null,
  );

  /** What blocks export, in words; empty when export is possible. */
  blocked = $derived.by(() => {
    if (this.status === "computing") return "Computing…";
    if (!this.model) return "Nothing to export yet";
    if (this.status !== "ready") return "Fix the size to export";
    if (this.bedCheck && this.bedResult && !this.bedResult.fits)
      return "Fix the size to export";
    return "";
  });

  /** Reads an uploaded SVG into shapes on the main thread (the worker has no DOM). */
  setSvg(text: string, fileName: string): void {
    try {
      this.svgShapes = parseSvg(text, fileName);
      this.svgError = "";
      this.svgName = fileName;
      this.params.svg = text;
    } catch (error) {
      this.svgShapes = undefined;
      this.svgError = error instanceof SvgError ? error.message : String(error);
    }
    this.requestBuild();
  }

  /** Re-reads the SVG stored in the parameters (after opening a saved model). */
  restoreSvg(fileName: string): void {
    this.svgShapes = undefined;
    this.svgError = "";
    if (this.params.svg) this.setSvg(this.params.svg, fileName || "symbol.svg");
  }

  requestBuild(): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.build(), 60);
  }

  private build(): void {
    const params = $state.snapshot(this.params) as LidParams;
    if (validateLid(params).length > 0) {
      this.status = "needs-fix";
      this.message = validateLid(params).join(" ");
      return;
    }
    if (
      params.symbol_mode !== "none" &&
      params.symbol_source === "upload" &&
      !this.svgShapes
    ) {
      this.status = "needs-fix";
      this.message =
        this.svgError ||
        "Upload an SVG file for the symbol, or choose a built-in icon.";
      return;
    }
    this.client ??= new GeometryClient();
    this.status = "computing";
    this.startedAt = Date.now();
    const { id, result } = this.client.build(params, this.svgShapes);
    this.latest = id;
    result.then(
      (model) => {
        if (id !== this.latest) return;
        this.model = model;
        this.status = "ready";
        this.message = "";
      },
      (error: Error) => {
        if (id !== this.latest) return;
        this.status = error instanceof InputBuildError ? "needs-fix" : "worker-error";
        this.message = error.message;
      },
    );
  }

  /** Name for the model and the file, from what the lid is. */
  describe(): string {
    const p = this.params;
    const label =
      p.text_mode !== "none" && p.text_string.trim()
        ? ` · ${p.text_string.trim()}`
        : "";
    return `Lid ${p.units_x} × ${p.units_y}${label || (p.variant === "stackable" ? " · stackable" : "")}`;
  }

  /** Until the user renames the model, its name and file name follow the lid. */
  syncName(): void {
    if (this.renamed) return;
    this.name = this.describe();
    this.fileName = slug(this.name);
  }

  /** Keeps the current model in this browser (localStorage); the browser may clear it. */
  autosave(): void {
    const json = serializeModel(
      this.name,
      $state.snapshot(this.params) as LidParams,
      this.svgName,
    );
    const entry: StoredModel = {
      id: this.modelId,
      name: this.name,
      savedAt: new Date().toISOString(),
      json,
    };
    const list = [entry, ...this.stored.filter((m) => m.id !== this.modelId)].slice(
      0,
      MAX_STORED,
    );
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      this.storageFailed = false;
    } catch {
      this.storageFailed = true;
    }
    this.stored = list;
  }

  /** The model as a file's text, for "Save file". */
  toFileText(): string {
    return serializeModel(
      this.name,
      $state.snapshot(this.params) as LidParams,
      this.svgName,
    );
  }

  /** Opens saved text; on failure the current model stays and `loadError` says why. */
  open(text: string, fileName: string, id?: string): boolean {
    let file: ModelFile;
    try {
      file = parseModel(text, fileName);
    } catch (error) {
      this.loadError = error instanceof Error ? error.message : String(error);
      return false;
    }
    this.loadError = "";
    Object.assign(this.params, file.params);
    this.name = file.name;
    this.modelId = id ?? crypto.randomUUID();
    this.svgName = file.svgName;
    this.fileName = slug(file.name);
    this.renamed = true;
    this.restoreSvg(file.svgName);
    this.requestBuild();
    return true;
  }

  retry(): void {
    this.client?.terminate();
    this.client = undefined;
    this.requestBuild();
  }
}

export const editor = new Editor();
