// The editor's state: lid parameters, the geometry worker and what it last built.
import type { ModelMesh, PartName } from "../geometry/model";
import { parseSvg, SvgError, type SvgShapes } from "../geometry/svg";
import {
  clampBin,
  newBin,
  maxHeightUnits,
  validateBin,
  type BinParams,
} from "../model/binParams";
import { drawerCheck, drawerMessage, lidMaxPlate } from "../geometry/drawer";
import { variantOf } from "../gridfinity/connector";
import {
  DEFAULT_BASEPLATE,
  validateBaseplate,
  type BaseplateParams,
} from "../model/baseplateParams";
import { DEFAULT_LABEL, validateLabel, type LabelParams } from "../model/labelParams";
import {
  DEFAULT_CONNECTOR,
  validateConnector,
  copiesOf,
  type ConnectorParams,
} from "../model/connectorParams";
import { DEFAULT_LID, validateLid, type LidParams } from "../model/lidParams";
import {
  parseModel,
  serializeBaseplate,
  serializeBin,
  serializeModel,
  serializeSet,
  type ModelFile,
} from "../model/modelFile";
import {
  allPlacementProblems,
  binName,
  firstFreeSpot,
  lidOfBin,
  newSetBin,
  placementProblems,
  settleBins,
  type SetBin,
} from "../model/setParams";
import type { AssemblyRequestBin } from "../worker/protocol";
import { GeometryClient, InputBuildError } from "../worker/client";
import { readConsent, writeConsent, type Consent } from "./consent";
import { disableOffline, enableOffline } from "./offline";
import { theme } from "./theme.svelte";
import type { PartType } from "./parts";
import {
  DEFAULT_BED,
  LID_TOLERANCE,
  bedPrinter,
  checkBed,
  maxCells,
  type Printer,
} from "./printers";

const STORAGE_KEY = "ugg.models";
const MAX_STORED = 12;

export interface StoredModel {
  id: string;
  /** missing in entries saved before baseplates existed: those are lids; "set" is a baseplate with its bins */
  part?: PartType | "set";
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
  private current = $state<PartType>("baseplate");
  params = $state<LidParams>({ ...DEFAULT_LID });
  baseplate = $state<BaseplateParams>({ ...DEFAULT_BASEPLATE });
  bin = $state<BinParams>(newBin());
  /** the label of the bin (E-09): its size follows the bin, so it always belongs to this bin */
  label = $state<LabelParams>({ ...DEFAULT_LABEL });
  /** the connector of the baseplates (owner, 11 November 2026) */
  connector = $state<ConnectorParams>({ ...DEFAULT_CONNECTOR });

  /** how many connectors the Connector tab makes: one for every edge cell of the baseplate, or as set */
  get connectorCopies(): number {
    return copiesOf(this.connector, this.baseplate.units_x, this.baseplate.units_y);
  }
  /** the bin view also shows the label in its place (a view setting, not saved) */
  showLabel = $state(false);

  // The set (ADR-0009): one baseplate, several bins. The bin being edited lives in the working
  // copies (`bin`, `label`, `params` for its lid, and the place below); `slots` holds all the
  // bins, and `syncActive` writes the working copies back into their slot.
  setId: string = crypto.randomUUID();
  slots = $state<SetBin[]>([newSetBin()]);
  activeBin = $state(0);
  /** the place of the bin being edited: first column and row (0-based), and turned by 90 degrees */
  col = $state(0);
  row = $state(0);
  turned = $state(false);
  /** the bin being edited has a lid */
  lidOn = $state(false);
  /** why the last "add a bin" was refused; empty when it worked */
  addNote = $state("");
  /** the height of the drawer in mm: bins and lids are kept lower than it (0 = off) */
  drawerHeight = $state(0);
  name = $state("Base 1 × 1");
  model = $state.raw<ModelMesh | null>(null);
  /** the part the shown model was built for: its colours go with it while another part is computed */
  modelPart: PartType = $state("lid");
  status = $state<Status>("computing");
  message = $state("");
  svgName = $state("");
  svgError = $state("");
  labelSvgName = $state("");
  labelSvgError = $state("");
  /** how the bed is called in sentences */
  readonly printer = "your print bed";
  /** null: the bed check is switched off */
  bedCheck = $state(true);
  startedAt = $state(0);
  /** computing for longer than 150 ms: only then the preview dims and a progress shows */
  slow = $state(false);
  fileName = $state("base-1x1");
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
  private labelSvgShapes: SvgShapes | undefined;
  private latest = 0;
  private slowTimer: ReturnType<typeof setTimeout> | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;

  /** name, file name and id of the part that is not being edited */
  private parked: Record<
    PartType,
    { name: string; fileName: string; renamed: boolean; modelId: string }
  > = {
    assembly: {
      name: "Set 1 × 1 · 1 bin",
      fileName: "set-1x1-1-bin",
      renamed: false,
      modelId: crypto.randomUUID(),
    },
    bin: {
      name: "Bin 1 × 1 × 3",
      fileName: "bin-1x1x3",
      renamed: false,
      modelId: crypto.randomUUID(),
    },
    lid: {
      name: "Lid 1 × 1",
      fileName: "lid-1x1",
      renamed: false,
      modelId: crypto.randomUUID(),
    },
    baseplate: {
      name: "Base 1 × 1",
      fileName: "base-1x1",
      renamed: false,
      modelId: crypto.randomUUID(),
    },
    label: {
      name: "Label 1 × 1",
      fileName: "label-1x1",
      renamed: false,
      modelId: crypto.randomUUID(),
    },
    connector: {
      name: "Connector",
      fileName: "connector",
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
    // making a label means the bin gets the slots for its lugs
    if (next === "label" && this.bin.label_slot === "none")
      this.bin.label_slot = "back";
    // in a set the lid has the size of its bin
    if (next === "lid" && this.inSet) {
      this.params.units_x = this.bin.units_x;
      this.params.units_y = this.bin.units_y;
    }
  }

  /**
   * A tab that needs something switched on in the left panel is locked until it is: the lid,
   * the label of the bin and the connector. `title` is the tooltip that says where. The tab
   * being edited is never locked, so a user who switches the part off can still leave it by
   * the tabs.
   */
  partLock(part: PartType): { disabled?: boolean; title?: string } {
    if (part === this.current) return {};
    const reason =
      part === "lid" && !this.lidOn
        ? "Switch on “This bin has a lid” in the left panel (Bin tab) to use a lid."
        : part === "label" && this.bin.label_slot === "none"
          ? "Choose a wall under “Label slots” in the left panel (Bin tab) to use a label."
          : part === "connector" && this.baseplate.connectable === "none"
            ? "Switch on “Connectable” in the left panel (Base tab) to use connectors."
            : "";
    return reason ? { disabled: true, title: reason } : {};
  }

  /**
   * The lid or the label being edited belongs to a bin that has none (the user picked another
   * bin, or switched the lid or the label off): back to the bin. Without this the lid tab
   * would show a lid for a bin that has no lid.
   */
  leaveSwitchedOffPart(): void {
    const lidGone = this.current === "lid" && !this.lidOn;
    const labelGone = this.current === "label" && this.bin.label_slot === "none";
    if (lidGone || labelGone) this.part = "bin";
  }

  /** The plate holds more than one bin: the lid follows the size of its bin. */
  get inSet(): boolean {
    return this.slots.length > 1;
  }

  /** The cells of the plate that bins may use. */
  get grid() {
    return { cols: this.baseplate.units_x, rows: this.baseplate.units_y };
  }

  /** The bins as they are now: the bin being edited with its working values. */
  binsNow = $derived.by(
    (): SetBin[] =>
      this.slots.map((slot, i) =>
        i === this.activeBin
          ? {
              id: slot.id,
              name: this.binNameNow(),
              bin: $state.snapshot(this.bin) as BinParams,
              label: $state.snapshot(this.label) as LabelParams,
              lid: $state.snapshot(this.params) as LidParams,
              lidOn: this.lidOn,
              col: this.col,
              row: this.row,
              turned: this.turned,
            }
          : $state.snapshot(slot),
      ) as SetBin[],
  );

  /** What is wrong with the places of the bins, one list per bin. */
  placement = $derived(placementProblems(this.grid, this.binsNow));

  /** Problems of the bin being edited, in words. */
  get activeProblems(): string[] {
    return this.placement[this.activeBin] ?? [];
  }

  /** All the bins are placed and no cell is left for another one: the plate is full. */
  setFull = $derived(firstFreeSpot(this.grid, this.binsNow) === null);

  /** The name of the bin being edited (it is kept with the bin's tab, or parked on another). */
  private binNameNow(): string {
    return this.current === "bin" ? this.name : this.parked.bin.name;
  }

  /** Writes the working copies back into the slot of the bin being edited. */
  syncActive(): void {
    const now = this.binsNow[this.activeBin];
    if (now) this.slots[this.activeBin] = now;
  }

  /** the hole sizes carried over from the baseplate so far: a bin made later starts with them */
  private carried: Partial<
    Record<"corner_magnet_d" | "center_magnet_d" | "stud_hole_d", number>
  > = {};

  /**
   * The user typed a size for a magnet pocket or a stud on the baseplate: the holes of the bins
   * start from it, plus the play (0.1 mm for the holes of the corner magnets and the studs; the
   * centre magnet has its own clearance). Within the limits of the bin; the user can change them
   * there afterwards. Nothing is carried over until a size has been entered.
   */
  carryToBins(
    key: "corner_magnet_d" | "center_magnet_d" | "stud_d",
    value: number,
  ): void {
    const play = 0.1;
    const target = key === "stud_d" ? "stud_hole_d" : key;
    const next = clampBin(
      target,
      Math.round((key === "center_magnet_d" ? value : value + play) * 100) / 100,
    );
    this.carried[target] = next;
    this.bin[target] = next;
    for (const [i, slot] of this.slots.entries()) {
      if (i !== this.activeBin) slot.bin[target] = next;
    }
  }

  /** Makes the bin in slot `i` the one being edited. */
  private loadSlot(i: number): void {
    const slot = this.slots[i];
    if (!slot) return;
    this.activeBin = i;
    Object.assign(this.bin, $state.snapshot(slot.bin));
    Object.assign(this.label, $state.snapshot(slot.label));
    Object.assign(this.params, $state.snapshot(slot.lid));
    this.lidOn = slot.lidOn;
    this.col = slot.col;
    this.row = slot.row;
    this.turned = slot.turned;
    // a name that is only the size follows the size, as before; a chosen name stays
    const chosen = slot.name !== binName(slot.bin);
    if (this.current === "bin") {
      this.name = slot.name;
      this.fileName = slug(slot.name);
      this.renamed = chosen;
      this.modelId = slot.id;
    } else {
      this.parked.bin = {
        name: slot.name,
        fileName: slug(slot.name),
        renamed: chosen,
        modelId: slot.id,
      };
    }
    if (this.inSet) {
      this.params.units_x = this.bin.units_x;
      this.params.units_y = this.bin.units_y;
    }
    this.restoreLabelSvg();
    this.restoreSvg(this.svgName);
    this.requestBuild();
  }

  /**
   * Puts every bin where it fits (see `settleBins`), after the size of a bin or of the plate
   * changed. A bin that fits stays; the others move to the first free spot.
   */
  settleBins(): void {
    const spots = settleBins(this.grid, this.binsNow);
    // nothing to move: write nothing (an effect that calls this must not trigger itself)
    const moved = this.binsNow.some((b, i) => {
      const at = spots[i];
      return !!at && (at.col !== b.col || at.row !== b.row || at.turned !== b.turned);
    });
    if (!moved) return;
    this.syncActive();
    this.slots.forEach((slot, i) => {
      const at = spots[i];
      if (at) Object.assign(slot, at);
    });
    const active = this.slots[this.activeBin];
    if (active) {
      this.col = active.col;
      this.row = active.row;
      this.turned = active.turned;
    }
  }

  /** Edit another bin of the set. */
  selectBin(i: number): void {
    if (i === this.activeBin || !this.slots[i]) return;
    this.syncActive();
    this.loadSlot(i);
  }

  /**
   * A new bin of one cell on the first free cell of the plate. Refused (false, and `addNote`
   * says why) when the plate is full: full is full.
   */
  addBin(): boolean {
    this.syncActive();
    const spot = firstFreeSpot(this.grid, this.binsNow);
    if (!spot) {
      this.addNote = `The plate is full: all ${this.grid.cols * this.grid.rows} cells are in use. Make a bin smaller, remove one, or make the baseplate larger.`;
      return false;
    }
    this.addNote = "";
    const fresh = newSetBin(spot.col, spot.row);
    Object.assign(fresh.bin, this.carried);
    this.slots.push(fresh);
    this.loadSlot(this.slots.length - 1);
    return true;
  }

  /** Removes a bin; the last one stays. */
  removeBin(i: number): boolean {
    if (this.slots.length <= 1 || !this.slots[i]) return false;
    this.syncActive();
    this.slots.splice(i, 1);
    this.addNote = "";
    if (i < this.activeBin) {
      this.activeBin -= 1;
    } else if (i === this.activeBin) {
      this.loadSlot(Math.min(i, this.slots.length - 1));
    }
    return true;
  }

  /** The values of the part being edited. */
  get active():
    LidParams | BaseplateParams | BinParams | LabelParams | ConnectorParams {
    if (this.current === "connector") return this.connector;
    if (this.current === "label") return this.label;
    if (this.current === "baseplate" || this.current === "assembly")
      return this.baseplate;
    return this.current === "bin" ? this.bin : this.params;
  }

  /** Width and depth in cells of the part being edited. */
  get units(): [number, number] {
    const p = this.current === "label" ? this.bin : this.active;
    if (!("units_x" in p)) return [1, 1];
    return [p.units_x, p.units_y];
  }

  /** How much smaller than its cells the part is: 0.5 mm for a lid, none for a baseplate. */
  private get tolerance(): number {
    return this.current === "baseplate" || this.current === "assembly"
      ? 0
      : LID_TOLERANCE;
  }

  /** The printable width and depth when the baseplate is cut to fit the bed, else null. */
  get maxTile(): [number, number] | null {
    return (this.current === "baseplate" || this.current === "assembly") &&
      this.baseplate.split_to_bed
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

  /** Brings the bin (or the lid, on its tab) to the height that fits the drawer. */
  fitHeightToDrawer(): void {
    const d = this.drawer;
    if (!d.on) return;
    if (this.current === "bin" && d.binFitsAtAll) this.bin.height_units = d.binUnitsFit;
    if (this.current === "lid" && d.lidFitsAtAll) {
      if (this.params.plate_thickness_mode === "auto") {
        this.params.height_units_auto = d.lidUnitsFit;
      } else {
        this.params.plate_thickness = lidMaxPlate(
          $state.snapshot(this.params) as LidParams,
          d.lidAvailable,
        );
      }
    }
  }

  /** Base, bin and lid against the drawer height (an option of the baseplate; 0 = off). */
  drawer = $derived(
    drawerCheck(this.drawerHeight, this.baseplate, this.bin, this.params),
  );

  setUnits(axis: "x" | "y", cells: number): void {
    const p = this.current === "label" ? this.bin : this.active;
    if (!("units_x" in p)) return;
    if (axis === "x") p.units_x = cells;
    else p.units_y = cells;
  }

  errors = $derived(
    this.current === "connector"
      ? validateConnector(this.connector)
      : this.current === "label"
        ? validateLabel(this.bin, this.label)
        : this.current === "baseplate"
          ? validateBaseplate(this.baseplate)
          : this.current === "assembly"
            ? this.setErrors()
            : this.current === "bin"
              ? validateBin(this.bin)
              : validateLid(this.params),
  );

  /** What stops the whole set from being built: the plate, every bin and every lid in use. */
  private setErrors(): string[] {
    const out = [...validateBaseplate(this.baseplate)];
    for (const b of this.binsNow) {
      out.push(...validateBin(b.bin).map((m) => `${b.name}: ${m}`));
      if (b.lidOn)
        out.push(
          ...validateLid(lidOfBin(b.bin, b.lid)).map((m) => `${b.name} lid: ${m}`),
        );
    }
    return out;
  }

  /** hints about the current model (not errors), shown while it is ready */
  warnings = $derived(
    this.status === "ready" && this.model
      ? [...this.model.warnings, ...this.drawerWarning, ...this.placementWarning]
      : [],
  );

  /** The bins do not sit right on the plate: for the bin being edited, or for all in the assembly. */
  private get placementWarning(): string[] {
    if (this.current === "assembly")
      return allPlacementProblems(this.grid, this.binsNow);
    if (this.current === "bin" || this.current === "label" || this.current === "lid")
      return this.inSet ? this.activeProblems : [];
    return [];
  }

  /** Base, bin and lid together are taller than the drawer allows, with the way out. */
  private get drawerWarning(): string[] {
    if (this.current === "label") return [];
    const message = drawerMessage(this.drawer, this.drawerHeight);
    return message ? [message] : [];
  }

  /** the print bed, typed in by the user: width, depth and build height in mm (default 256 x 256 x 256) */
  bedX = $state<number>(DEFAULT_BED[0]);
  bedY = $state<number>(DEFAULT_BED[1]);
  bedZ = $state<number>(DEFAULT_BED[2]);

  printerInfo: Printer = $derived(bedPrinter(this.bedX, this.bedY, this.bedZ));

  bed = $derived(this.printerInfo.bed);

  /** colours of the parts for the preview and the 3MF; a baseplate has only its plate */
  colours = $derived(this.coloursOf(this.model ? this.modelPart : this.current));

  private coloursOf(part: PartType): Record<PartName, string> {
    return part === "connector"
      ? {
          plate: this.connector.plate_color,
          lip: this.connector.plate_color,
          text: this.connector.plate_color,
          symbol: this.connector.plate_color,
        }
      : part === "label"
        ? {
            plate: this.label.plate_color,
            lip: this.label.plate_color,
            text: this.label.text_color,
            symbol: this.label.symbol_color,
          }
        : part === "bin"
          ? {
              plate: this.bin.plate_color,
              lip: this.bin.lip_color,
              text: this.bin.plate_color,
              symbol: this.bin.plate_color,
            }
          : part === "baseplate" || part === "assembly"
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
              };
  }

  /** The built model carries colours (the set, a bin with its label), so a colour needs a rebuild. */
  get bakesColours(): boolean {
    return (
      this.current === "assembly" ||
      (this.current === "bin" && this.showLabel && this.bin.label_slot !== "none")
    );
  }

  /** What the part is called in sentences: "lid" or "baseplate". */
  noun = $derived(this.current);

  bedResult = $derived(this.model ? checkBed(this.model.size, this.printerInfo) : null);

  /**
   * Fixes for a lid that does not fit: the most cells along each axis that fit (0 when
   * changing that axis alone does not help), for the buttons of the bed-check alert.
   */
  bedFixes = $derived.by(() => {
    if (
      !this.model ||
      this.current === "label" ||
      this.current === "connector" ||
      this.current === "assembly"
    )
      return { x: 0, y: 0, height: 0 };
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
    if (
      this.current === "assembly" &&
      allPlacementProblems(this.grid, this.binsNow).length > 0
    )
      return "Fix the places to export";
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

  /** Reads an uploaded SVG for the label (E-09), like `setSvg` for the lid. */
  setLabelSvg(text: string, fileName: string): void {
    try {
      this.labelSvgShapes = parseSvg(text, fileName);
      this.labelSvgError = "";
      this.labelSvgName = fileName;
      this.label.svg = text;
    } catch (error) {
      this.labelSvgShapes = undefined;
      this.labelSvgError = error instanceof SvgError ? error.message : String(error);
    }
    this.requestBuild();
  }

  /** Re-reads the label's SVG stored in its parameters (after opening a saved model). */
  restoreLabelSvg(): void {
    this.labelSvgShapes = undefined;
    this.labelSvgError = "";
    if (this.label.svg)
      this.setLabelSvg(this.label.svg, this.labelSvgName || "symbol.svg");
  }

  requestBuild(wait = 60): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.build(), wait);
  }

  private build(): void {
    const lid = this.current === "lid";
    const params = $state.snapshot(this.params) as LidParams;
    const plate = $state.snapshot(this.baseplate) as BaseplateParams;
    const bin = $state.snapshot(this.bin) as BinParams;
    const label = $state.snapshot(this.label) as LabelParams;
    // in a set the lid has the size of its bin
    if (lid && this.inSet) {
      params.units_x = bin.units_x;
      params.units_y = bin.units_y;
    }
    const errors =
      this.current === "connector"
        ? validateConnector(this.connector)
        : this.current === "label"
          ? validateLabel(bin, label)
          : this.current === "baseplate"
            ? validateBaseplate(plate)
            : this.current === "assembly"
              ? this.setErrors()
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
    if (
      this.current === "label" &&
      label.symbol_mode !== "none" &&
      label.symbol_source === "upload" &&
      !this.labelSvgShapes
    ) {
      this.status = "needs-fix";
      this.message =
        this.labelSvgError ||
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
      this.current === "connector"
        ? this.client.buildConnector(
            this.connector.variant,
            this.connectorCopies,
            this.bedX,
          )
        : this.current === "label"
          ? this.client.buildLabel(bin, label, this.labelSvgShapes)
          : this.current === "baseplate"
            ? this.client.buildBaseplate(plate, this.maxTile ?? undefined)
            : this.current === "assembly"
              ? this.client.buildAssembly(
                  plate,
                  this.assemblyBins(),
                  this.maxTile ?? undefined,
                )
              : this.current === "bin"
                ? this.client.buildBin(
                    bin,
                    this.showLabel ? label : undefined,
                    this.labelSvgShapes,
                  )
                : this.client.build(params, this.svgShapes);
    this.latest = id;
    const builtFor = this.current;
    result.then(
      (model) => {
        if (id !== this.latest) return;
        this.modelPart = builtFor;
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

  /** The bins for the worker, with the SVG files of their labels and lids read into shapes. */
  private assemblyBins(): AssemblyRequestBin[] {
    const shapes = (use: boolean, text: string, name: string) => {
      if (!use || !text) return undefined;
      try {
        return parseSvg(text, name);
      } catch {
        return undefined;
      }
    };
    return this.binsNow.map((b) => {
      const lidSized = lidOfBin(b.bin, b.lid);
      return {
        name: b.name,
        bin: b.bin,
        label: b.label,
        lidOn: b.lidOn,
        lid: lidSized,
        col: b.col,
        row: b.row,
        turned: b.turned,
        labelSvg: shapes(
          b.label.symbol_mode !== "none" && b.label.symbol_source === "upload",
          b.label.svg,
          "label symbol.svg",
        ),
        lidSvg: shapes(
          b.lidOn &&
            lidSized.symbol_mode !== "none" &&
            lidSized.symbol_source === "upload",
          lidSized.svg,
          "lid symbol.svg",
        ),
      };
    });
  }

  /** Name for the model and the file, from what the lid is. */
  describe(): string {
    if (this.current === "assembly") {
      const b = this.baseplate;
      const n = this.slots.length;
      return `Set ${b.units_x} × ${b.units_y} · ${n} bin${n === 1 ? "" : "s"}`;
    }
    if (this.current === "connector") {
      return `Connector ${variantOf(this.connector.variant)?.name ?? ""}`.trim();
    }
    if (this.current === "label") {
      const text = this.label.text_string.trim();
      const shown = this.label.text_mode !== "none" && text ? ` · ${text}` : "";
      return `Label ${this.bin.units_x} × ${this.bin.units_y}${shown}`;
    }
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

  /** The name of the set as a saved model. */
  get setName(): string {
    const b = this.baseplate;
    const n = this.slots.length;
    return `Set ${b.units_x} × ${b.units_y} · ${n} bin${n === 1 ? "" : "s"}`;
  }

  /** A set of several bins is saved as one entry; a single bin is saved as before. */
  private get savesSet(): boolean {
    return this.inSet || this.current === "assembly";
  }

  /** Keeps the current model in this browser (localStorage); the browser may clear it. */
  autosave(): void {
    if (this.consent !== "yes") return;
    if (this.savesSet) {
      const entry: StoredModel = {
        id: this.setId,
        part: "set",
        name: this.setName,
        savedAt: new Date().toISOString(),
        json: this.toFileText(),
      };
      // the room in the browser decides how many sets there are; the limit counts single parts
      let singles = 0;
      const list = [entry, ...this.stored.filter((m) => m.id !== entry.id)].filter(
        (m) => m.part === "set" || ++singles <= MAX_STORED,
      );
      this.keep(list);
      return;
    }
    const json = this.toFileText();
    // a label is saved with its bin and a connector with its baseplate: one entry, the host's
    const host =
      this.current === "label"
        ? "bin"
        : this.current === "connector"
          ? "baseplate"
          : undefined;
    const entry: StoredModel = {
      id: host ? this.parked[host].modelId : this.modelId,
      part: host ?? this.current,
      name: host ? this.parked[host].name : this.name,
      savedAt: new Date().toISOString(),
      json,
    };
    let singles = 0;
    const list = [entry, ...this.stored.filter((m) => m.id !== entry.id)].filter(
      (m) => m.part === "set" || ++singles <= MAX_STORED,
    );
    this.keep(list);
  }

  /** Writes the list to the browser's storage; the editor says so when the browser refuses. */
  private keep(list: StoredModel[]): void {
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
    if (this.savesSet) {
      return serializeSet(
        this.setName,
        $state.snapshot(this.baseplate) as BaseplateParams,
        this.binsNow,
        this.drawerHeight,
      );
    }
    if (this.current === "baseplate" || this.current === "connector") {
      return serializeBaseplate(
        this.current === "connector" ? this.parked.baseplate.name : this.name,
        $state.snapshot(this.baseplate) as BaseplateParams,
        this.drawerHeight,
      );
    }
    if (this.current === "bin" || this.current === "label") {
      return serializeBin(
        this.current === "label" ? this.parked.bin.name : this.name,
        $state.snapshot(this.bin) as BinParams,
        this.drawerHeight,
        $state.snapshot(this.label) as LabelParams,
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
    if (file.type === "set") {
      this.part = "assembly";
      this.drawerHeight = file.drawerHeight;
      Object.assign(this.baseplate, file.baseplate);
      this.slots = file.bins.map((b) => ({ ...b }));
      this.setId = id ?? crypto.randomUUID();
      this.loadSlot(0);
      this.name = this.describe();
      this.fileName = slug(this.name);
      this.renamed = false;
      this.modelId = this.setId;
      this.addNote = "";
      this.requestBuild();
      return true;
    }
    this.part = file.type;
    this.drawerHeight = file.drawerHeight;
    if (file.type === "baseplate") Object.assign(this.baseplate, file.params);
    else if (file.type === "bin") {
      Object.assign(this.bin, file.params);
      if (file.label) {
        Object.assign(this.label, file.label);
        this.restoreLabelSvg();
      }
    } else Object.assign(this.params, file.params);
    // a lid file is a lid: its tab stays open
    if (file.type === "lid") this.lidOn = true;
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
