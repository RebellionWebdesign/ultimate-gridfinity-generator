<script lang="ts">
  // The assembly (ADR-0009): the plate with all its bins, labels and lids. Here the bins are
  // placed on the plate (column, row, turn); everything else about a bin is changed in its own
  // tab. The view itself cannot be edited.
  import PlaceFields from "./PlaceFields.svelte";
  import PlateMap from "./PlateMap.svelte";
  import { editor } from "./store.svelte";
</script>

<div class="panel">
  <section>
    <h2 class="t-label">Assembly</h2>
    <p class="t-caption">
      The baseplate with every bin, its label and its lid, as they stand together. Pick
      a bin on the plate and place it here. Its size, label and lid are changed in its
      own tab.
    </p>
    <PlateMap onselect={(i) => editor.selectBin(i)} />
    <button type="button" class="add" onclick={() => editor.addBin()}>Add a bin</button>
    {#if editor.addNote}
      <p class="t-caption problem" role="alert">{editor.addNote}</p>
    {:else if editor.setFull && editor.inSet}
      <p class="t-caption">The plate is full: every cell is in use.</p>
    {/if}
    {#each editor.placement.flat() as problem (problem)}
      <p class="t-caption problem" role="alert">{problem}</p>
    {/each}
  </section>

  <section>
    <PlaceFields />
    <button type="button" class="edit" onclick={() => (editor.part = "bin")}>
      Edit this bin
    </button>
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
