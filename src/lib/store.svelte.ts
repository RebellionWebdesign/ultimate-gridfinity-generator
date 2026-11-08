// The editor's state: lid parameters, the geometry worker and what it last built.
import type { ModelMesh } from "../geometry/model";
import { parseSvg, SvgError, type SvgShapes } from "../geometry/svg";
import {
  DEFAULT_BIN,
  maxHeightUnits,
  validateBin,
  type BinParams,
} from "../model/binParams";
import { lockBin, lockLid } from "../geometry/drawer";
import {
  DEFAULT_BASEPLATE,
  validateBaseplate,
  type BaseplateParams,
} from "../model/baseplateParams";
import { DEFAULT_LID, validateLid, type LidParams } from "../model/lidParams";
import {
  parseModel,
  serializeBaseplate,
  serializeBin,
  serializeModel,
  type ModelFile,
} from "../model/modelFile";
import { GeometryClient, InputBuildError } from "../worker/client";
import { readConsent, writeConsent, type Consent } from "./consent";
import { disableOffline, enableOffline } from "./offline";
import { theme } from "./theme.svelte";
import { mmText, type PartType } from "./parts";
import {
  CUSTOM_LIMITS,
  CUSTOM_PRINTER,
  PRINTERS,
  LID_TOLERANCE,
  checkBed,
  customPrinter,
  maxCells,
  type Printer,
} from "./printers";

const STORAGE_KEY = "ugg.models";
const MAX_STORED = 12;

export interface StoredModel {
  id: string;
  /** missing in entries saved before baseplates existed: those are lids */
  part?: PartType;
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

export const slug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/\s*×\s*/g, "x")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "lid";

export type Status = "computing" | "ready" | "needs-fix" | "worker-error";

class Editor {
  /** the part type being edited */
  private current = $state<PartType>("lid");
  params = $state<LidParams>({ ...DEFAULT_LID });
  baseplate = $state<BaseplateParams>({ ...DEFAULT_BASEPLATE });
  bin = $state<BinParams>({ ...DEFAULT_BIN });
  /** the height of the drawer in mm: bins and lids are kept lower than it (0 = off) */
  drawerHeight = $state(0);
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
  /** computing for longer than 150 ms: only then the preview dims and a progress shows */
  slow = $state(false);
  fileName = $state("lid-1x1");
  modelId: string = crypto.randomUUID();
  /** the user's choice about saving in this browser; nothing is read or written before "yes" */
  consent = $state<Consent>(readConsent());
  /** the consent dialog was asked for by hand (the first visit opens it by itself) */
  consentOpen = $state(false);
  stored = $state<StoredModel[]>(this.consent === "yes" ? readStored() : []);
  storageFailed = $state(false);
  loadError = $state("");
  /** the user named the model by hand: stop deriving the name from the lid */
  renamed = $state(false);

  private client: GeometryClient | undefined;
  private svgShapes: SvgShapes | undefined;
  private latest = 0;
  private slowTimer: ReturnType<typeof setTimeout> | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;

  /** name, file name and id of the part that is not being edited */
  private parked: Record<
    PartType,
    { name: string; fileName: string; renamed: boolean; modelId: string }
  > = {
    bin: {
      name: "Bin 1 × 1 × 3",
      fileName: "bin-1x1x3",
      renamed: false,
      modelId: crypto.randomUUID(),
    },
    lid: { name: "", fileName: "", renamed: false, modelId: "" },
    baseplate: {
      name: "Base 1 × 1",
      fileName: "base-1x1",
      renamed: false,
      modelId: crypto.randomUUID(),
    },
  };

  get part(): PartType {
    return this.current;
  }

  /** Each part keeps its own values and name while the page is open. */
  set part(next: PartType) {
    if (next === this.current) return;
    const here = this.current;
    const [name, fileName, renamed, modelId] = [
      this.name,
      this.fileName,
      this.renamed,
      this.modelId,
    ];
    const saved = this.parked[next];
    this.parked[here] = { name, fileName, renamed, modelId };
    this.current = next;
    Object.assign(this, saved);
    this.message = "";
  }

  /** The values of the part being edited. */
  get active(): LidParams | BaseplateParams | BinParams {
    if (this.current === "baseplate") return this.baseplate;
    return this.current === "bin" ? this.bin : this.params;
  }

  /** Width and depth in cells of the part being edited. */
  get units(): [number, number] {
    const p = this.active;
    return [p.units_x, p.units_y];
  }

  /** How much smaller than its cells the part is: 0.5 mm for a lid, none for a baseplate. */
  private get tolerance(): number {
    return this.current === "baseplate" ? 0 : LID_TOLERANCE;
  }

  /** The printable width and depth when the baseplate is cut to fit the bed, else null. */
  get maxTile(): [number, number] | null {
    return this.current === "baseplate" && this.baseplate.split_to_bed
      ? [this.printerInfo.bed[0], this.printerInfo.bed[1]]
      : null;
  }

  /** The baseplate gets as many cells as fit the bed along each axis (at most 24). */
  fitBed(): void {
    const height = this.model?.size[2] ?? 5;
    const most = (axis: "x" | "y") =>
      maxCells(axis, axis === "x" ? [24, 1] : [1, 24], height, this.printerInfo, 0);
    this.baseplate.units_x = Math.max(1, most("x"));
    this.baseplate.units_y = Math.max(1, most("y"));
  }

  /** The baseplate gets as many whole cells as fit the drawer (the rest becomes filler). */
  fitDrawer(): void {
    const b = this.baseplate;
    if (b.plate_min_x_mm > 0)
      b.units_x = Math.max(1, Math.floor(b.plate_min_x_mm / 42));
    if (b.plate_min_y_mm > 0)
      b.units_y = Math.max(1, Math.floor(b.plate_min_y_mm / 42));
  }

  /** Lowers the lid and the bin to the drawer height where they are taller. */
  lockHeights(): void {
    const drawer = this.drawerHeight;
    if (drawer <= 0) return;
    const lid = lockLid($state.snapshot(this.params) as LidParams, drawer);
    this.params.height_units_auto = lid.height_units_auto;
    this.params.plate_thickness = lid.plate_thickness;
    const bin = lockBin($state.snapshot(this.bin) as BinParams, drawer);
    this.bin.height_units = bin.height_units;
  }

  setUnits(axis: "x" | "y", cells: number): void {
    const p = this.active;
    if (axis === "x") p.units_x = cells;
    else p.units_y = cells;
  }

  errors = $derived(
    this.current === "baseplate"
      ? validateBaseplate(this.baseplate)
      : this.current === "bin"
        ? validateBin(this.bin)
        : validateLid(this.params),
  );

  /** hints about the current model (not errors), shown while it is ready */
  warnings = $derived(
    this.status === "ready" && this.model
      ? [...this.model.warnings, ...this.drawerWarning]
      : [],
  );

  /** The part is taller than the drawer (only when it cannot be lowered any further). */
  private get drawerWarning(): string[] {
    const height = this.model?.size[2] ?? 0;
    return this.drawerHeight > 0 && height > this.drawerHeight + 1e-6
      ? [
          `This ${this.current} is ${mmText(height)} mm tall, the drawer is ${mmText(this.drawerHeight)} mm high.`,
        ]
      : [];
  }

  /** a bed the user typed in: a square with rounded corners, plus the build height */
  customSize = $state<number>(CUSTOM_LIMITS.size.def);
  customHeight = $state<number>(CUSTOM_LIMITS.height.def);

  printerInfo: Printer = $derived(
    this.printer === CUSTOM_PRINTER
      ? customPrinter(this.customSize, this.customHeight)
      : (PRINTERS.find((p) => p.name === this.printer) ?? (PRINTERS[0] as Printer)),
  );

  bed = $derived(this.printerInfo.bed);

  /** colours of the parts for the preview and the 3MF; a baseplate has only its plate */
  colours = $derived(
    this.current === "bin"
      ? {
          plate: this.bin.plate_color,
          lip: this.bin.lip_color,
          text: this.bin.plate_color,
          symbol: this.bin.plate_color,
        }
      : this.current === "baseplate"
        ? {
            plate: this.baseplate.plate_color,
            lip: this.baseplate.plate_color,
            text: this.baseplate.plate_color,
            symbol: this.baseplate.plate_color,
          }
        : {
            plate: this.params.plate_color,
            lip: this.params.lip_color,
            text: this.params.text_color,
            symbol: this.params.symbol_color,
          },
  );

  /** What the part is called in sentences: "lid" or "baseplate". */
  noun = $derived(this.current);

  bedResult = $derived(this.model ? checkBed(this.model.size, this.printerInfo) : null);

  /**
   * Fixes for a lid that does not fit: the most cells along each axis that fit (0 when
   * changing that axis alone does not help), for the buttons of the bed-check alert.
   */
  bedFixes = $derived.by(() => {
    if (!this.model) return { x: 0, y: 0, height: 0 };
    const units = this.units;
    const height = this.model.size[2];
    const fix = (axis: "x" | "y") => {
      const n = maxCells(axis, units, height, this.printerInfo, this.tolerance);
      return n >= 1 && n < units[axis === "x" ? 0 : 1] ? n : 0;
    };
    // a bin may be too tall: the most height units the printer's build height allows
    const tall =
      this.current === "bin"
        ? maxHeightUnits(this.printerInfo.bed[2], this.bin.lip_style)
        : 0;
    return {
      x: fix("x"),
      y: fix("y"),
      height: tall > 0 && tall < this.bin.height_units ? tall : 0,
    };
  });

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
    const lid = this.current === "lid";
    const params = $state.snapshot(this.params) as LidParams;
    const plate = $state.snapshot(this.baseplate) as BaseplateParams;
    const bin = $state.snapshot(this.bin) as BinParams;
    const errors =
      this.current === "baseplate"
        ? validateBaseplate(plate)
        : this.current === "bin"
          ? validateBin(bin)
          : validateLid(params);
    if (errors.length > 0) {
      this.status = "needs-fix";
      this.message = errors.join(" ");
      return;
    }
    if (
      lid &&
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
    this.slow = false;
    clearTimeout(this.slowTimer);
    this.slowTimer = setTimeout(() => {
      if (this.status === "computing") this.slow = true;
    }, 150);
    const { id, result } =
      this.current === "baseplate"
        ? this.client.buildBaseplate(plate, this.maxTile ?? undefined)
        : this.current === "bin"
          ? this.client.buildBin(bin)
          : this.client.build(params, this.svgShapes);
    this.latest = id;
    result.then(
      (model) => {
        if (id !== this.latest) return;
        clearTimeout(this.slowTimer);
        this.slow = false;
        this.model = model;
        this.status = "ready";
        this.message = "";
      },
      (error: Error) => {
        if (id !== this.latest) return;
        clearTimeout(this.slowTimer);
        this.slow = false;
        this.status = error instanceof InputBuildError ? "needs-fix" : "worker-error";
        this.message = error.message;
      },
    );
  }

  /** Name for the model and the file, from what the lid is. */
  describe(): string {
    if (this.current === "bin") {
      const b = this.bin;
      return `Bin ${b.units_x} × ${b.units_y} × ${b.height_units}`;
    }
    if (this.current === "baseplate") {
      const b = this.baseplate;
      const drawer = b.plate_min_x_mm > 0 || b.plate_min_y_mm > 0 ? " · drawer" : "";
      return `Base ${b.units_x} × ${b.units_y}${b.baseplate_style === "skeleton" ? " · skeleton" : ""}${drawer}`;
    }
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
    if (this.consent !== "yes") return;
    const json = this.toFileText();
    const entry: StoredModel = {
      id: this.modelId,
      part: this.current,
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

  /** Removes every model from this browser's storage (the user asked for it). */
  clearStored(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // nothing to clear when storage is blocked
    }
    this.stored = [];
  }

  /** The user said yes: models are kept in this browser and the app works offline. */
  allowSaving(): void {
    writeConsent("yes");
    this.consent = "yes";
    this.stored = readStored();
    this.autosave();
    theme.persist();
    void enableOffline();
  }

  /** The user said no: nothing is saved, and a worker from an earlier visit is removed. */
  declineSaving(): void {
    writeConsent("no");
    this.consent = "no";
    theme.forget();
    void disableOffline();
  }

  /** Switches saving off: removes every saved model, the offline copy and the autosave. */
  switchOffSaving(): void {
    this.clearStored();
    this.declineSaving();
  }

  /** The model as a file's text, for "Save file". */
  toFileText(): string {
    if (this.current === "bin") {
      return serializeBin(
        this.name,
        $state.snapshot(this.bin) as BinParams,
        this.drawerHeight,
      );
    }
    if (this.current === "baseplate") {
      return serializeBaseplate(
        this.name,
        $state.snapshot(this.baseplate) as BaseplateParams,
        this.drawerHeight,
      );
    }
    return serializeModel(
      this.name,
      $state.snapshot(this.params) as LidParams,
      this.svgName,
      this.drawerHeight,
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
    this.part = file.type;
    this.drawerHeight = file.drawerHeight;
    if (file.type === "baseplate") Object.assign(this.baseplate, file.params);
    else if (file.type === "bin") Object.assign(this.bin, file.params);
    else Object.assign(this.params, file.params);
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
