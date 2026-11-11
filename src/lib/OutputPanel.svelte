<script lang="ts">
  import Icon from "./Icon.svelte";
  import NumberField from "./NumberField.svelte";
  import { BED_LIMITS, DEFAULT_BED } from "./printers";
  import { PART_NAME, formatSize } from "./parts";
  import { editor } from "./store.svelte";
  import {
    buildFile,
    buildPartsZip,
    buildTilesFile,
    buildTilesZip,
    exportExtensions,
    hasSavePicker,
    saveBlob,
    type Format,
  } from "./exporter";
  import ModelPanel from "./ModelPanel.svelte";

  let format = $state<Format>("3mf");
  /** a split baseplate: all pieces in one file, or one file per piece in a ZIP */
  let tileFile = $state<"one" | "zip">("one");
  let busy = $state(false);
  let failure = $state("");

  const sizeParts = $derived(editor.model?.size.map((v) => formatSize([v])) ?? []);
  /** The numbers that cause a warning turn red: width, depth, height. */
  const tooBig = $derived.by((): [boolean, boolean, boolean] => {
    const size = editor.model?.size;
    if (!size) return [false, false, false];
    const [w, d] = size as [number, number, number];
    const [bx, by] = editor.bed;
    let width = false;
    let depth = false;
    if (editor.bedCheck && editor.bedResult && !editor.bedResult.footprintFits) {
      // the way round (as it is or turned by 90 degrees) with fewer numbers too large
      const normal = [w > bx, d > by];
      const turned = [w > by, d > bx];
      const count = (a: boolean[]) => a.filter(Boolean).length;
      [width, depth] = count(turned) < count(normal) ? turned : normal;
    }
    const height =
      (editor.bedCheck && !!editor.bedResult && !editor.bedResult.heightFits) ||
      (editor.drawer.on && !editor.drawer.fits);
    return [width as boolean, depth as boolean, height];
  });
  const picker = hasSavePicker();

  const save = async () => {
    if (!editor.model || editor.blocked) return;
    busy = true;
    failure = "";
    try {
      const tiles = editor.model.tiles;
      if (tiles && tileFile === "one") {
        // a split baseplate: every piece is its own object in one file
        const blob = await buildTilesFile(
          format,
          tiles,
          editor.colours,
          editor.name,
          PART_NAME[editor.part],
          [editor.printerInfo.bed[0], editor.printerInfo.bed[1]],
        );
        await saveBlob(
          blob,
          `${editor.fileName}.${format}`,
          format === "3mf" ? "3MF model" : "STL model",
          exportExtensions(format),
        );
      } else if (tiles) {
        // a split baseplate: one file per piece, in one ZIP
        const blob = await buildTilesZip(
          format,
          tiles,
          editor.colours,
          editor.name,
          PART_NAME[editor.part],
          editor.fileName,
          [editor.printerInfo.bed[0], editor.printerInfo.bed[1]],
        );
        await saveBlob(blob, `${editor.fileName}.zip`, "ZIP archive", {
          "application/zip": [".zip"],
        });
      } else if (editor.part === "label" && format === "stl") {
        // the label: plate and text as separate STL files in one ZIP
        const blob = await buildPartsZip(editor.model.parts, editor.fileName);
        await saveBlob(blob, `${editor.fileName}.zip`, "ZIP archive", {
          "application/zip": [".zip"],
        });
      } else {
        const blob = await buildFile(
          format,
          editor.model,
          editor.colours,
          editor.name,
          PART_NAME[editor.part],
          [editor.printerInfo.bed[0], editor.printerInfo.bed[1]],
        );
        await saveBlob(
          blob,
          `${editor.fileName}.${format}`,
          format === "3mf" ? "3MF model" : "STL model",
          exportExtensions(format),
        );
      }
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
    } finally {
      busy = false;
    }
  };

  /** the label as STL: plate and text are separate files in a ZIP */
  const zipsParts = $derived(editor.part === "label" && format === "stl");

  const label = $derived(
    editor.blocked ||
      (busy
        ? "Saving…"
        : `${picker ? "Save" : "Download"} ${(editor.model?.tiles && tileFile === "zip") || zipsParts ? "ZIP" : format.toUpperCase()}${picker ? "…" : ""}`),
  );
</script>

<div class="output">
  <section>
    <h2 class="t-label">Size</h2>
    <p class="n-l n" aria-live="polite">
      {#if sizeParts.length === 0}—{/if}
      {#each sizeParts as part, i (i)}
        {#if i > 0}&nbsp;×&nbsp;{/if}<span class:bad={tooBig[i]}>{part}</span>
      {/each}
    </p>
    {#if editor.model?.tiles}
      <p class="t-caption">
        {editor.model.tiles.length} pieces; this is the largest one. Each piece fits the printer.
      </p>
    {:else}
      <p class="t-caption">Width × depth × height in mm, lid label included</p>
    {/if}
    <h3 class="t-label bed-title">Print bed for the bed check</h3>
    {#if editor.bedCheck}
      <NumberField
        label="Bed width"
        bind:value={editor.bedX}
        min={BED_LIMITS.size.min}
        max={BED_LIMITS.size.max}
        step={1}
        def={DEFAULT_BED[0]}
        unit="mm"
        why="The largest bed this app checks"
        minWhy="A bed smaller than this is not a printer bed."
      />
      <NumberField
        label="Bed depth"
        bind:value={editor.bedY}
        min={BED_LIMITS.size.min}
        max={BED_LIMITS.size.max}
        step={1}
        def={DEFAULT_BED[1]}
        unit="mm"
        why="The largest bed this app checks"
        minWhy="A bed smaller than this is not a printer bed."
      />
      <NumberField
        label="Build height"
        bind:value={editor.bedZ}
        min={BED_LIMITS.height.min}
        max={BED_LIMITS.height.max}
        step={1}
        def={DEFAULT_BED[2]}
        unit="mm"
        why="The largest build height this app checks"
        minWhy="A build height smaller than this is not a printer."
      />
      <p class="t-caption">Default: 256 × 256 × 256 mm.</p>
    {/if}
    <label class="check t-caption">
      <input type="checkbox" bind:checked={editor.bedCheck} /> Check against the bed
    </label>
    {#if editor.bedCheck && editor.bedResult}
      {#if editor.bedResult.fits}
        <p class="status ok t-label">
          <Icon name="check" size={16} />
          {editor.bedResult.turned ? "Fits the bed, turned 90°" : "Fits the bed"}
        </p>
      {:else}
        <p class="status err t-label" role="alert">
          <Icon name="triangle-alert" size={16} />
          {editor.bedResult.heightFits
            ? "Too big for this bed, also turned 90°"
            : editor.bedResult.footprintFits
              ? "Too tall for this bed"
              : "Too big and too tall for this bed"}
        </p>
      {/if}
    {:else if !editor.bedCheck}
      <p class="status warn t-label">
        <Icon name="triangle-alert" size={16} /> Bed check is off
      </p>
    {/if}
  </section>

  <section>
    <h2 class="t-label">Export</h2>
    <div class="seg" role="group" aria-label="File format">
      {#each ["3mf", "stl"] as const as f (f)}
        <button
          type="button"
          class:on={format === f}
          aria-pressed={format === f}
          onclick={() => (format = f)}
        >
          {f.toUpperCase()}
        </button>
      {/each}
    </div>
    <p class="t-caption">
      {format === "3mf"
        ? editor.part === "baseplate"
          ? "The baseplate is one part with its colour. Your slicer may ask which filament the colour gets."
          : editor.part === "label"
            ? "The label plate and its text stay separate parts of one object, each with its colour. Only the label is in this file; the bin is exported on its own."
            : editor.part === "bin"
              ? "The bin and its stacking lip stay separate parts of one object when the lip has its own colour. Your slicer may ask which filament each colour gets."
              : "Lid, text and symbol stay separate parts of one object, each with its colour. Your slicer may ask which filament each colour gets."
        : editor.part === "label"
          ? "Geometry only: no colours. Plate and text are separate STL files in one ZIP, so the slicer can give each a filament. Import them together and say yes to one object with several parts; the 3MF already holds them as one object."
          : "Geometry only: no colours, all parts in one file."}
    </p>
    {#if editor.model?.tiles}
      <div class="seg" role="group" aria-label="Pieces in the file">
        {#each [["one", "One file"], ["zip", "ZIP of files"]] as const as [value, text] (value)}
          <button
            type="button"
            class:on={tileFile === value}
            aria-pressed={tileFile === value}
            onclick={() => (tileFile = value)}
          >
            {text}
          </button>
        {/each}
      </div>
      <p class="t-caption">
        {tileFile === "one"
          ? format === "3mf"
            ? "Every piece is its own object on its own plate: Bambu Studio puts them on the plates. OrcaSlicer loads them without plates: press Arrange there."
            : "Every piece is its own object, one printer bed apart. In Bambu Studio press A (Arrange) to put them on plates."
          : "One file per piece in a ZIP; import them one by one."}
      </p>
    {/if}
    <label class="t-label" for="file-name">File name</label>
    <div class="name">
      <input id="file-name" class="n-s" bind:value={editor.fileName} />
      <span class="n-s ext"
        >.{(editor.model?.tiles && tileFile === "zip") || zipsParts
          ? "zip"
          : format}</span
      >
    </div>
    <button
      type="button"
      class="primary"
      class:warn={editor.blocked === "Fix the size to export" ||
        editor.warnings.length > 0}
      disabled={!!editor.blocked || busy}
      onclick={save}
    >
      <Icon name={editor.status === "computing" ? "loader-circle" : "download"} />
      {label}
    </button>
    {#if failure}<p class="t-caption err" role="alert">{failure}</p>{/if}
    <p class="t-caption">
      {picker
        ? "You choose the folder in the next step."
        : "This browser saves straight to your Downloads folder; it cannot ask where. Chrome and Edge can."}
    </p>
  </section>

  <ModelPanel />
</div>

<style>
  .bad {
    color: var(--error);
  }
  .output {
    display: flex;
    flex-direction: column;
  }
  section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-5);
    border-bottom: 1px solid var(--line);
  }
  .n-l {
    font-size: 20px;
    line-height: 24px;
  }
  .bed-title {
    font-size: inherit;
  }
  .name {
    height: var(--size-control);
    padding: 0 var(--space-3);
    border: 0;
    border-radius: var(--radius-control);
    background: var(--surface-2);
    width: 100%;
  }
  .name {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .name input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: none;
  }
  .ext {
    color: var(--text-3);
  }
  .check {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .status {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .ok {
    color: var(--success);
  }
  .err {
    color: var(--error);
  }
  .warn {
    color: var(--warning);
  }
  .seg {
    display: flex;
    gap: var(--space-0);
    padding: var(--space-0);
    background: var(--surface-2);
    border-radius: var(--radius-control);
  }
  .seg button {
    flex: 1;
    height: 32px;
    border: 0;
    background: none;
    border-radius: calc(var(--radius-control) - var(--space-0));
    cursor: pointer;
    color: var(--text-2);
  }
  .seg button.on {
    background: var(--seg-on);
    color: var(--text);
    box-shadow: var(--shadow-seg);
  }
  .primary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    height: var(--size-button-lg);
    border: 0;
    border-radius: var(--radius-control);
    background: var(--accent);
    color: var(--accent-ink);
    font-weight: 500;
    cursor: pointer;
    transition:
      background var(--dur-state) var(--ease),
      transform var(--dur-press) var(--ease);
  }
  .primary:hover:not(:disabled) {
    background: var(--accent-hover);
  }
  .primary:active:not(:disabled) {
    transform: scale(0.97);
  }
  .primary:disabled {
    background: var(--surface-3);
    color: var(--text-3);
    cursor: not-allowed;
  }
  /* a warning is showing: the text is red, as the number in the size */
  .primary.warn,
  .primary.warn:disabled {
    color: var(--error);
  }
</style>
