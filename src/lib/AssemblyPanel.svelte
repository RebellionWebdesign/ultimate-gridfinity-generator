<script lang="ts">
  // The assembly (ADR-0009): the plate with all its bins, labels and lids. Here the bins are
  // placed on the plate (column, row, turn); everything else about a bin is changed in its own
  // tab. The view itself cannot be edited.
  import { footprint } from "../model/setParams";
  import PlaceFields from "./PlaceFields.svelte";
  import PlateMap from "./PlateMap.svelte";
  import { editor } from "./store.svelte";
</script>

<div class="panel">
  <section>
    <h2 class="t-label">Assembly</h2>
    <p class="t-caption">
      The baseplate with every bin, its label and its lid, as they stand together. Pick
      a bin on the plate or in the list and place it here. Its size, label and lid are
      changed in its own tab.
    </p>
    <PlateMap onselect={(i) => editor.selectBin(i)} />
    {#if editor.setFull && editor.inSet}
      <p class="t-caption">The plate is full: every cell is in use.</p>
    {/if}
  </section>

  <section>
    <PlaceFields />
    <button type="button" class="edit" onclick={() => (editor.part = "bin")}>
      Edit this bin
    </button>
  </section>

  <section>
    <h2 class="t-label">Bins</h2>
    <ol>
      {#each editor.binsNow as b, i (b.id)}
        {@const [w, d] = footprint(b.bin, b.turned)}
        <li>
          <button
            type="button"
            class="row"
            class:on={i === editor.activeBin}
            aria-pressed={i === editor.activeBin}
            onclick={() => editor.selectBin(i)}
          >
            <span class="n-s no">{i + 1}</span>
            <span class="name">
              <span class="t-strong">{b.name}</span>
              <span class="t-caption">
                column {b.col + 1}, row {b.row + 1} · {w} × {d} cells{b.turned
                  ? ", turned"
                  : ""}{b.bin.label_slot !== "none" ? " · label" : ""}{b.lidOn
                  ? " · lid"
                  : ""}
              </span>
            </span>
          </button>
          {#each editor.placement[i] ?? [] as problem (problem)}
            <p class="t-caption problem" role="alert">{problem}</p>
          {/each}
        </li>
      {/each}
    </ol>
    <button type="button" class="add" onclick={() => editor.addBin()}>Add a bin</button>
    {#if editor.addNote}
      <p class="t-caption problem" role="alert">{editor.addNote}</p>
    {/if}
  </section>
</div>

<style>
  section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-5);
    border-bottom: 1px solid var(--line);
  }
  ol {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--line);
    border-radius: var(--radius-control);
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
    text-align: left;
  }
  .row:hover {
    background: var(--surface-2);
  }
  .row.on {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .no {
    flex: none;
    min-width: 1.5em;
    text-align: center;
  }
  .name {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .add,
  .edit {
    align-self: flex-start;
    min-height: var(--size-control);
    padding: 0 var(--space-4);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-control);
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
  }
  .problem {
    color: var(--error);
  }
</style>
