<script lang="ts">
  import { onMount, untrack } from "svelte";
  import Icon from "./lib/Icon.svelte";
  import LicencesDialog from "./lib/LicencesDialog.svelte";
  import OutputPanel from "./lib/OutputPanel.svelte";
  import ParamsPanel from "./lib/ParamsPanel.svelte";
  import PreviewStage from "./lib/PreviewStage.svelte";
  import Segmented from "./lib/Segmented.svelte";
  import { editor } from "./lib/store.svelte";

  type Theme = "light" | "dark";
  const systemTheme = (): Theme =>
    matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const storedTheme = (): Theme | null => {
    try {
      const value = localStorage.getItem("ugg.theme");
      return value === "light" || value === "dark" ? value : null;
    } catch {
      return null;
    }
  };

  let theme = $state<Theme>(storedTheme() ?? systemTheme());
  const toggleTheme = () => {
    theme = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("ugg.theme", theme);
    } catch {
      // storage may be blocked; the theme still applies for this visit
    }
  };
  $effect(() => {
    document.documentElement.dataset.theme = theme;
  });

  let part = $state<"lid" | "bin" | "baseplate">("lid");
  let exportDialog: HTMLDialogElement;
  let openInput: HTMLInputElement;
  let dragging = $state(false);
  let renaming = $state(false);
  let now = $state(Date.now());

  // every change goes to the worker; the name follows the lid until it is renamed
  let touched = false;
  $effect(() => {
    JSON.stringify(editor.params);
    untrack(() => {
      editor.syncName();
      editor.requestBuild();
      if (touched) editor.autosave();
      touched = true;
    });
  });

  $effect(() => {
    if (editor.status !== "computing") return;
    const timer = setInterval(() => (now = Date.now()), 200);
    return () => clearInterval(timer);
  });

  onMount(() => editor.requestBuild());

  const elapsed = $derived(((now - editor.startedAt) / 1000).toFixed(1));
  const colours = $derived({
    plate: editor.params.plate_color,
    lip: editor.params.lip_color,
    text: editor.params.text_color,
    symbol: editor.params.symbol_color,
  });
  const readout = $derived(
    editor.model
      ? `${editor.params.units_x} × ${editor.params.units_y} lid · ${editor.model.size.map((v) => v.toFixed(1)).join(" × ")} mm`
      : "Lid",
  );

  const onDrop = async (event: DragEvent) => {
    event.preventDefault();
    dragging = false;
    const file = event.dataTransfer?.files[0];
    if (file?.name.endsWith(".json")) editor.open(await file.text(), file.name);
  };

  const onKey = (event: KeyboardEvent) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    if (event.key === "e") {
      event.preventDefault();
      exportDialog.showModal();
    } else if (event.key === "o") {
      event.preventDefault();
      openInput.click();
    }
  };

  let licences = $state(false);
</script>

<svelte:window onkeydown={onKey} />

<a class="skip-link" href="#main">Skip to content</a>

<div
  class="app"
  role="presentation"
  ondragover={(event) => {
    event.preventDefault();
    dragging = true;
  }}
  ondragleave={() => (dragging = false)}
  ondrop={onDrop}
>
  <header class="topbar">
    <div class="brand">
      <svg viewBox="0 0 40 40" width="28" height="28" aria-hidden="true" fill="none">
        <rect
          x="3"
          y="3"
          width="34"
          height="34"
          rx="8"
          stroke="currentColor"
          stroke-width="3"
        />
        <path d="M20 3v34M3 20h34" stroke="currentColor" stroke-width="3" />
        <rect
          x="20"
          y="3"
          width="17"
          height="17"
          rx="8"
          fill="var(--accent)"
          stroke="currentColor"
          stroke-width="3"
        />
      </svg>
      <div class="name">
        {#if renaming}
          <!-- svelte-ignore a11y_autofocus -->
          <input
            class="t-strong rename"
            aria-label="Model name"
            autofocus
            bind:value={editor.name}
            onblur={() => (renaming = false)}
            oninput={() => (editor.renamed = true)}
            onkeydown={(event) => event.key === "Enter" && (renaming = false)}
          />
        {:else}
          <button
            type="button"
            class="t-strong"
            onclick={() => (renaming = true)}
            title="Rename"
          >
            {editor.name}
          </button>
        {/if}
        <span class="t-caption">
          {editor.storageFailed ? "Not saved in this browser" : "Saved in this browser"}
        </span>
      </div>
    </div>

    <div class="switch">
      <Segmented
        label="Part type"
        hideLabel
        bind:value={part}
        options={[
          { value: "lid", label: "Lid" },
          {
            value: "bin",
            label: "Bin",
            note: "Later",
            disabled: true,
            title: "Bins come in a later version",
          },
          {
            value: "baseplate",
            label: "Baseplate",
            note: "Later",
            disabled: true,
            title: "Baseplates come in a later version",
          },
        ]}
      />
    </div>

    <div class="actions">
      <button
        type="button"
        class="ghost"
        onclick={toggleTheme}
        aria-label="Switch to {theme === 'dark' ? 'light' : 'dark'} theme"
      >
        <Icon name={theme === "dark" ? "sun" : "moon"} />
      </button>
      <button type="button" class="ghost" onclick={() => openInput.click()}>
        <Icon name="folder-open" /><span class="long">Open</span>
      </button>
      <button
        type="button"
        class="ghost export-btn"
        onclick={() => exportDialog.showModal()}
      >
        <Icon name="download" /><span class="long">Export</span>
      </button>
      <button type="button" class="ghost" onclick={() => (licences = true)}>
        <Icon name="info" /><span class="long">Licences</span>
      </button>
      <input
        bind:this={openInput}
        class="visually-hidden"
        type="file"
        accept=".json,application/json"
        tabindex="-1"
        aria-label="Open a saved model file"
        onchange={async (event) => {
          const file = event.currentTarget.files?.[0];
          if (file) editor.open(await file.text(), file.name);
          event.currentTarget.value = "";
        }}
      />
    </div>
  </header>

  <main id="main" class="main">
    <h1 class="visually-hidden">Ultimate Gridfinity Generator: lid editor</h1>
    <aside class="params" aria-label="Parameters">
      <ParamsPanel />
    </aside>

    <section class="preview" aria-label="Preview">
      <PreviewStage
        model={editor.model}
        {colours}
        units={[editor.params.units_x, editor.params.units_y]}
        dimmed={editor.status === "computing" && !!editor.model}
        {theme}
      />
      <p class="pill readout n-s">{readout}</p>
      <p class="pill status n-s" aria-live="polite">
        {#if editor.status === "computing"}
          <Icon name="loader-circle" size={16} /> Computing… {elapsed} s
        {:else if editor.status === "ready"}
          <span class="dot"></span> Up to date
        {:else}
          <Icon name="triangle-alert" size={16} /> Needs a fix
        {/if}
      </p>
      {#if editor.status === "needs-fix"}
        <div class="alert top" role="alert">
          <Icon name="triangle-alert" />
          <p>{editor.message}</p>
        </div>
      {:else if editor.status === "worker-error"}
        <div class="alert centre" role="alert">
          <Icon name="triangle-alert" />
          <div>
            <p>The preview stopped. {editor.message}</p>
            <p>
              Your settings are kept. Make the lid smaller or turn off the hollow foot,
              then try again.
            </p>
            <button type="button" onclick={() => editor.retry()}>Try again</button>
          </div>
        </div>
      {:else if editor.bedCheck && editor.bedResult && !editor.bedResult.fits && editor.model}
        <div class="alert top" role="alert">
          <Icon name="triangle-alert" />
          <p>
            This lid does not fit the {editor.printer} bed. The lid is
            {editor.model.size[0].toFixed(1)} × {editor.model.size[1].toFixed(1)} mm, the
            bed
            {editor.bed[0]} × {editor.bed[1]} mm, also when turned 90°. Reduce Width or Depth,
            or pick a larger printer.
          </p>
        </div>
      {/if}
      {#if editor.status === "computing"}<div class="sweep"></div>{/if}
    </section>

    <aside class="output" aria-label="Output">
      <OutputPanel />
    </aside>
  </main>

  {#if dragging}<div class="drop-overlay t-strong">
      Drop a saved model (.json) to open it
    </div>{/if}
</div>

<dialog bind:this={exportDialog} class="sheet" aria-label="Export and model file">
  <button
    type="button"
    class="ghost close"
    aria-label="Close"
    onclick={() => exportDialog.close()}
  >
    <Icon name="x" />
  </button>
  <OutputPanel />
</dialog>

<LicencesDialog bind:open={licences} />

<style>
  .app {
    display: grid;
    grid-template-rows: var(--size-header) minmax(0, 1fr);
    height: 100dvh;
  }
  .topbar {
    display: grid;
    grid-template-columns: 1fr minmax(0, 296px) 1fr;
    align-items: center;
    gap: var(--space-4);
    padding: 0 var(--space-4);
    background: var(--surface);
    border-bottom: 1px solid var(--line);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
  }
  .name {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .name button,
  .rename {
    border: 0;
    background: none;
    padding: 0;
    text-align: left;
    cursor: text;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-1);
  }
  .ghost {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: var(--size-control);
    min-width: var(--size-control);
    padding: 0 var(--space-2);
    border: 0;
    border-radius: var(--radius-control);
    background: none;
    cursor: pointer;
    justify-content: center;
  }
  .ghost:hover {
    background: var(--surface-2);
  }
  .export-btn {
    display: none;
  }
  .main {
    display: grid;
    grid-template-columns: var(--col-params) minmax(0, 1fr) var(--col-output);
    min-height: 0;
  }
  .params,
  .output {
    overflow-x: hidden;
    overflow-y: auto;
    background: var(--surface);
  }
  .params {
    border-right: 1px solid var(--line);
  }
  .output {
    border-left: 1px solid var(--line);
  }
  .preview {
    position: relative;
    min-height: 0;
  }
  .pill {
    position: absolute;
    top: var(--space-4);
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    height: var(--size-control-sm);
    padding: 0 var(--space-3);
    border-radius: var(--radius-round);
    background: var(--surface);
    box-shadow: var(--shadow-float);
  }
  .readout {
    left: var(--space-4);
  }
  .status {
    right: var(--space-4);
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: var(--radius-round);
    background: var(--success);
  }
  .alert {
    position: absolute;
    display: flex;
    gap: var(--space-3);
    padding: var(--space-4);
    max-width: 520px;
    background: var(--error-soft);
    border: 1px solid var(--error-line);
    border-radius: var(--radius-panel);
    box-shadow: var(--shadow-float);
    color: var(--text);
  }
  .alert :global(.icon) {
    color: var(--error);
  }
  .alert.top {
    top: var(--space-9);
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - var(--space-7));
  }
  .alert.centre {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  .alert button {
    margin-top: var(--space-3);
    min-height: var(--size-control);
    padding: 0 var(--space-4);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-control);
    background: var(--surface);
    cursor: pointer;
  }
  .sweep {
    position: absolute;
    top: 0;
    left: 0;
    height: 2px;
    width: 30%;
    background: var(--accent);
    animation: sweep 1.1s var(--ease) infinite;
  }
  @keyframes sweep {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(340%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .sweep {
      animation: none;
      width: 100%;
    }
  }
  .drop-overlay {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    background: var(--scrim);
    color: var(--text);
    pointer-events: none;
  }
  .sheet {
    width: min(100%, 360px);
    max-height: 100dvh;
    margin: 0 0 0 auto;
    padding: 0;
    border: 0;
    border-radius: var(--radius-panel) 0 0 var(--radius-panel);
    background: var(--surface);
    color: var(--text);
    box-shadow: var(--shadow-float);
  }
  .sheet::backdrop {
    background: var(--scrim);
  }
  .close {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
  }

  @media (min-width: 1200px) {
    .sheet {
      display: none;
    }
  }
  @media (max-width: 1199px) {
    .main {
      grid-template-columns: 320px minmax(0, 1fr);
    }
    .output {
      display: none;
    }
    .export-btn {
      display: inline-flex;
    }
  }
  @media (max-width: 719px) {
    .topbar {
      grid-template-columns: 1fr auto;
    }
    .switch {
      display: none;
    }
    .long {
      display: none;
    }
    .main {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: 42% minmax(0, 1fr);
    }
    .preview {
      order: -1;
    }
    .params {
      border-right: 0;
    }
    .sheet {
      width: 100%;
      margin: auto 0 0;
      max-height: 85dvh;
      border-radius: var(--radius-panel) var(--radius-panel) 0 0;
    }
  }
</style>
