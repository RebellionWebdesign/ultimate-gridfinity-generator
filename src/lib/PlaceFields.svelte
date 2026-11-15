<script lang="ts">
  // Where the selected bin stands on the plate (ADR-0009): column, row and a turn by 90 degrees.
  // Shown in the assembly tab, below the picture of the plate.
  import { footprint } from "../model/setParams";
  import NumberField from "./NumberField.svelte";
  import Switch from "./Switch.svelte";
  import { editor } from "./store.svelte";

  const size = $derived(footprint(editor.bin, editor.turned));
  const grid = $derived(editor.grid);
  const name = $derived(editor.binsNow[editor.activeBin]?.name ?? "");
</script>

<div class="fields">
  <h3 class="t-label">Place bin {editor.activeBin + 1}: {name}</h3>
  <p class="t-caption">
    Column 1 is at the left, row 1 at the back. The plate has {grid.cols} × {grid.rows}
    cells; this bin covers {size[0]} × {size[1]}.
  </p>
  <NumberField
    label="Column"
    bind:value={() => editor.col + 1, (v) => (editor.col = v - 1)}
    min={1}
    max={Math.max(1, grid.cols - size[0] + 1)}
    step={1}
    def={1}
    why="Counted from the left, in cells; the bin has to stay on the plate"
  />
  <NumberField
    label="Row"
    bind:value={() => editor.row + 1, (v) => (editor.row = v - 1)}
    min={1}
    max={Math.max(1, grid.rows - size[1] + 1)}
    step={1}
    def={1}
    why="Counted from the back, in cells; the bin has to stay on the plate"
  />
  <Switch
    label="Turn by 90°"
    bind:checked={editor.turned}
    hint="Width and depth swap on the plate. The bin itself is printed the same way."
  />
  {#each editor.activeProblems as problem (problem)}
    <p class="t-caption problem" role="alert">{problem}</p>
  {/each}
</div>

<style>
  .fields {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  h3 {
    font-size: inherit;
  }
  .problem {
    color: var(--error);
  }
</style>
