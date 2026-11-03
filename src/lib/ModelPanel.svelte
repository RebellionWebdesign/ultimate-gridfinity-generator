<script lang="ts">
  import Icon from "./Icon.svelte";
  import { zip } from "../export/zip";
  import { saveBlob } from "./exporter";
  import { storageFill } from "./storage";
  import { editor, slug } from "./store.svelte";

  let input: HTMLInputElement;

  const saveFile = async () => {
    const blob = new Blob([editor.toFileText()], { type: "application/json" });
    await saveBlob(blob, `${editor.fileName}.json`, "Gridfinity model", {
      "application/json": [".json"],
    });
  };

  const openFile = async (file: File | undefined) => {
    if (file) editor.open(await file.text(), file.name);
  };

  const date = (iso: string) => iso.slice(0, 10);

  let dialog: HTMLDialogElement;
  let open = $state(false);
  let clearFailure = $state("");

  const fill = $derived(storageFill(JSON.stringify(editor.stored).length));

  /** The user may take a ZIP of every stored model first, or decline it. */
  const downloadAndClear = async () => {
    clearFailure = "";
    const encoder = new TextEncoder();
    const entries = editor.stored.map((item) => ({
      name: `${slug(item.name)}-${item.id.slice(0, 6)}.json`,
      data: encoder.encode(item.json),
    }));
    try {
      const archive = await zip(entries);
      const saved = await saveBlob(
        new Blob([new Uint8Array(archive)], { type: "application/zip" }),
        "gridfinity-models.zip",
        "ZIP archive",
        { "application/zip": [".zip"] },
      );
      // nothing is removed until the ZIP is saved
      if (saved) editor.clearStored();
    } catch (error) {
      clearFailure = error instanceof Error ? error.message : String(error);
    }
    dialog.close();
  };

  const clearWithoutZip = () => {
    clearFailure = "";
    editor.clearStored();
    dialog.close();
  };
</script>

<section>
  <h2 class="t-label">Model</h2>
  <div class="buttons">
    <button type="button" onclick={saveFile}><Icon name="save" />Save file</button>
    <button type="button" onclick={() => input.click()}
      ><Icon name="folder-open" />Open file…</button
    >
    <input
      bind:this={input}
      class="visually-hidden"
      type="file"
      accept=".json,application/json"
      tabindex="-1"
      aria-label="Open a saved model file"
      onchange={(event) => {
        void openFile(event.currentTarget.files?.[0]);
        event.currentTarget.value = "";
      }}
    />
  </div>
  {#if editor.loadError}<p class="t-caption err" role="alert">
      {editor.loadError}
    </p>{/if}

  <h3 class="t-label">
    <button
      type="button"
      class="toggle"
      aria-expanded={open}
      aria-controls="stored-models"
      onclick={() => (open = !open)}
    >
      <span class="chev" class:open><Icon name="chevron-right" size={16} /></span>
      <span>In this browser</span>
      <span class="count n-s">{editor.stored.length} saved</span>
    </button>
  </h3>
  <div class="fill">
    <progress
      class:warn={fill.warn}
      max="1"
      value={fill.fraction}
      aria-label="Browser storage in use"
    ></progress>
    <p class="t-caption n-s">{fill.text}</p>
  </div>
  {#if open}
    <div id="stored-models" class="stored">
      {#if editor.stored.length === 0}
        <p class="t-caption">Nothing saved in this browser yet.</p>
      {:else}
        <ul>
          {#each editor.stored as item (item.id)}
            <li>
              <div>
                <p class="t-label">{item.name}</p>
                <p class="n-s t-caption">
                  {date(item.savedAt)} · {item.part === "baseplate" ? "base" : "lid"}
                </p>
              </div>
              <button
                type="button"
                class="quiet"
                onclick={() => editor.open(item.json, item.name, item.id)}
              >
                Open
              </button>
            </li>
          {/each}
        </ul>
      {/if}
      {#if editor.storageFailed}
        <p class="t-caption err" role="alert">
          This browser did not allow saving here. Use Save file to keep your model.
        </p>
      {:else}
        <p class="t-caption">
          The browser may clear this storage when space runs low. Save a file to keep a
          copy.
        </p>
      {/if}
    </div>
  {/if}
  {#if editor.stored.length > 0}
    <button type="button" class="clear" onclick={() => dialog.showModal()}>
      <Icon name="download" />Clear saved models…
    </button>
  {/if}
  {#if clearFailure}<p class="t-caption err" role="alert">{clearFailure}</p>{/if}
  <p class="t-caption">
    A .json file with every setting, the text and your SVG. Open it here later to keep
    working.
  </p>
</section>

<dialog bind:this={dialog} class="confirm" aria-labelledby="clear-title">
  <h2 id="clear-title" class="t-strong">Remove all saved models?</h2>
  <p class="t-caption">
    {editor.stored.length} model{editor.stored.length === 1 ? "" : "s"} will be removed from
    this browser. You can take a ZIP file with all of them first, or remove them without a
    copy.
  </p>
  <div class="actions">
    <button type="button" class="primary" onclick={() => void downloadAndClear()}>
      Download ZIP, then remove
    </button>
    <button type="button" onclick={clearWithoutZip}>Remove without ZIP</button>
    <button type="button" onclick={() => dialog.close()}>Cancel</button>
  </div>
</dialog>

<style>
  section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-5);
  }
  .buttons {
    display: flex;
    gap: var(--space-2);
  }
  .buttons button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    height: var(--size-button);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-control);
    background: var(--surface);
    cursor: pointer;
  }
  .clear {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    height: var(--size-button);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-control);
    background: var(--surface);
    cursor: pointer;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: var(--size-row);
    border-top: 1px solid var(--line);
  }
  .quiet {
    border: 0;
    background: none;
    cursor: pointer;
    font-weight: 500;
    min-height: var(--size-control);
    padding: 0 var(--space-2);
  }
  .err {
    color: var(--error);
  }
  h3 {
    font-size: inherit;
  }
  .toggle {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    min-height: var(--size-control);
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    cursor: pointer;
    text-align: left;
  }
  .chev {
    display: inline-flex;
  }
  .chev.open {
    transform: rotate(90deg);
  }
  .count {
    margin-left: auto;
    color: var(--text-3);
  }
  .fill {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  progress {
    width: 100%;
    height: 6px;
    appearance: none;
    border: 0;
    border-radius: var(--radius-round);
    background: var(--surface-2);
    overflow: hidden;
  }
  progress::-webkit-progress-bar {
    background: var(--surface-2);
  }
  progress::-webkit-progress-value {
    background: var(--accent);
  }
  progress::-moz-progress-bar {
    background: var(--accent);
  }
  progress.warn::-webkit-progress-value {
    background: var(--warning);
  }
  progress.warn::-moz-progress-bar {
    background: var(--warning);
  }
  .stored {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .confirm {
    width: min(100% - var(--space-7), 380px);
    padding: var(--space-5);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-panel);
    background: var(--surface);
    color: var(--text);
    box-shadow: var(--shadow-float);
  }
  .confirm::backdrop {
    background: var(--scrim);
  }
  .confirm[open] {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .actions button {
    height: var(--size-button);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-control);
    background: var(--surface);
    color: inherit;
    cursor: pointer;
  }
  .actions .primary {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--accent-ink);
  }
</style>
