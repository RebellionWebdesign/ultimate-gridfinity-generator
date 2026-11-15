<script lang="ts">
  // The bins of the plate (ADR-0009): pick the one to edit, add one with the Plus button, remove
  // one. Shown above the panels of the bin, its label and its lid.
  import Icon from "./Icon.svelte";
  import Switch from "./Switch.svelte";
  import { editor } from "./store.svelte";

  let confirming = $state(false);
  // a bin is picked or removed: the question about removing goes away
  $effect(() => {
    void editor.activeBin;
    confirming = false;
  });
</script>

<div class="bins" role="group" aria-label="Bins on this plate">
  <ul>
    {#each editor.binsNow as b, i (b.id)}
      <li>
        <button
          type="button"
          class="chip"
          class:on={i === editor.activeBin}
          class:bad={(editor.placement[i]?.length ?? 0) > 0}
          aria-pressed={i === editor.activeBin}
          title={b.name}
          onclick={() => editor.selectBin(i)}
        >
          <span class="n-s">{i + 1}</span>
          <span class="nm">{b.name}</span>
        </button>
      </li>
    {/each}
    <li>
      <button
        type="button"
        class="chip plus"
        aria-label="Add a bin"
        title={editor.setFull
          ? "The plate is full"
          : "Add a bin on the first free cell"}
        onclick={() => editor.addBin()}
      >
        <Icon name="plus" size={16} />
      </button>
    </li>
  </ul>

  {#if editor.addNote}
    <p class="t-caption problem" role="alert">{editor.addNote}</p>
  {:else if editor.setFull && editor.inSet}
    <p class="t-caption">The plate is full: every cell is in use.</p>
  {/if}

  <Switch
    label="This bin has a lid"
    bind:checked={editor.lidOn}
    hint="On: the Lid tab opens for it. The lid has the size of the bin and stands on it in the assembly."
  />

  {#if editor.slots.length > 1}
    {#if confirming}
      <div class="confirm" role="alert">
        <span class="t-caption"
          >Remove “{editor.binsNow[editor.activeBin]?.name}” with its label and lid?</span
        >
        <button
          type="button"
          class="small danger"
          onclick={() => {
            editor.removeBin(editor.activeBin);
            confirming = false;
          }}>Remove</button
        >
        <button type="button" class="small" onclick={() => (confirming = false)}
          >Keep</button
        >
      </div>
    {:else}
      <button type="button" class="small" onclick={() => (confirming = true)}>
        Remove this bin
      </button>
    {/if}
  {/if}
</div>

<style>
  .bins {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--line);
  }
  ul {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    max-width: 180px;
    min-height: var(--size-control);
    padding: 0 var(--space-3);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-control);
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
  }
  .chip:hover {
    background: var(--surface-2);
  }
  .chip.on {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .chip.bad {
    border-color: var(--error);
  }
  .chip.plus {
    justify-content: center;
    min-width: var(--size-control);
    padding: 0;
  }
  .nm {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .problem {
    color: var(--error);
  }
  .small {
    align-self: flex-start;
    min-height: var(--size-control);
    padding: 0 var(--space-4);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-control);
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
  }
  .small:hover {
    background: var(--surface-2);
  }
  .danger {
    border-color: var(--error);
    color: var(--error);
  }
  .confirm {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }
</style>
