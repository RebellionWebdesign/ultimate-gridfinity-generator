<script lang="ts">
  import Icon from "./Icon.svelte";
  import { zip } from "../export/zip";
  import { saveBlob } from "./exporter";
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

  let confirming = $state(false);
  let clearFailure = $state("");

  /** Offers every stored model as one ZIP, and empties the storage only after it is saved. */
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
      if (saved) editor.clearStored();
    } catch (error) {
      clearFailure = error instanceof Error ? error.message : String(error);
    }
    confirming = false;
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
  <p class="t-caption">
    A .json file with every setting, the text and your SVG. Open it here later to keep
    working.
  </p>
  {#if editor.loadError}<p class="t-caption err" role="alert">
      {editor.loadError}
    </p>{/if}

  <h3 class="t-label">In this browser</h3>
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
  {#if editor.stored.length > 0}
    {#if confirming}
      <p class="t-caption">
        This saves all {editor.stored.length} models as one ZIP file, then removes them from
        this browser.
      </p>
      <div class="buttons">
        <button type="button" onclick={() => void downloadAndClear()}
          >Download and clear</button
        >
        <button type="button" onclick={() => (confirming = false)}>Cancel</button>
      </div>
    {:else}
      <button type="button" class="clear" onclick={() => (confirming = true)}>
        <Icon name="download" />Download as ZIP and clear
      </button>
    {/if}
    {#if clearFailure}<p class="t-caption err" role="alert">{clearFailure}</p>{/if}
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
</section>

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
</style>
