<script lang="ts">
  import Icon from "./Icon.svelte";
  import NumberField from "./NumberField.svelte";
  import { CUSTOM_LIMITS, CUSTOM_PRINTER, PRINTERS } from "./printers";
  import { PART_NAME, formatSize } from "./parts";
  import { editor } from "./store.svelte";
  import {
    buildFile,
    exportExtensions,
    hasSavePicker,
    saveBlob,
    type Format,
  } from "./exporter";
  import ModelPanel from "./ModelPanel.svelte";

  let format = $state<Format>("3mf");
  let busy = $state(false);
  let failure = $state("");

  const sizeText = $derived(editor.model ? formatSize(editor.model.size) : "—");
  const picker = hasSavePicker();

  const save = async () => {
    if (!editor.model || editor.blocked) return;
    busy = true;
    failure = "";
    try {
      const blob = await buildFile(
        format,
        editor.model,
        editor.colours,
        editor.name,
        PART_NAME[editor.part],
      );
      await saveBlob(
        blob,
        `${editor.fileName}.${format}`,
        format === "3mf" ? "3MF model" : "STL model",
        exportExtensions(format),
      );
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
    } finally {
      busy = false;
    }
  };

  const label = $derived(
    editor.blocked ||
      (busy
        ? "Saving…"
        : `${picker ? "Save" : "Download"} ${format.toUpperCase()}${picker ? "…" : ""}`),
  );
</script>

<div class="output">
  <section>
    <h2 class="t-label">Size</h2>
    <p class="n-l n" aria-live="polite">{sizeText}</p>
    <p class="t-caption">Width × depth × height in mm, label included</p>
    <label class="t-label" for="printer">Printer for the bed check</label>
    <select id="printer" bind:value={editor.printer} disabled={!editor.bedCheck}>
      {#each PRINTERS as printer (printer.name)}
        <option value={printer.name}>{printer.name} · {printer.bed.join(" × ")}</option>
      {/each}
      <option value={CUSTOM_PRINTER}>Custom size</option>
    </select>
    {#if editor.printer === CUSTOM_PRINTER && editor.bedCheck}
      <NumberField
        label="Bed size, square"
        bind:value={editor.customSize}
        min={CUSTOM_LIMITS.size.min}
        max={CUSTOM_LIMITS.size.max}
        step={1}
        def={CUSTOM_LIMITS.size.def}
        unit="mm"
        why="Width and depth are the same; the corners are rounded."
        minWhy="A bed smaller than this is not a printer bed."
      />
      <NumberField
        label="Build height"
        bind:value={editor.customHeight}
        min={CUSTOM_LIMITS.height.min}
        max={CUSTOM_LIMITS.height.max}
        step={1}
        def={CUSTOM_LIMITS.height.def}
        unit="mm"
        minWhy="A build height smaller than this is not a printer."
      />
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
          Too big for this bed, also turned 90°
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
          : editor.part === "bin"
            ? "The bin and its stacking lip stay separate parts of one object when the lip has its own colour. Your slicer may ask which filament each colour gets."
            : "Lid, text and symbol stay separate parts of one object, each with its colour. Your slicer may ask which filament each colour gets."
        : "Geometry only: no colours, all parts in one file."}
    </p>
    <label class="t-label" for="file-name">File name</label>
    <div class="name">
      <input id="file-name" class="n-s" bind:value={editor.fileName} />
      <span class="n-s ext">.{format}</span>
    </div>
    <button
      type="button"
      class="primary"
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
  select,
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
</style>
