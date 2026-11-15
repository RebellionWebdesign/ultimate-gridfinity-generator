<script lang="ts">
  // The plate seen from above: its cells, and every bin where it stands (column 1 at the left,
  // row 1 at the back). A click on a bin selects it. Only a picture; nothing is dragged here.
  import { footprint } from "../model/setParams";
  import { editor } from "./store.svelte";

  let { onselect }: { onselect?: (index: number) => void } = $props();

  const CELL = 28;
  const grid = $derived(editor.grid);
  const width = $derived(grid.cols * CELL);
  const height = $derived(grid.rows * CELL);
  const problems = $derived(editor.placement);
</script>

<svg
  class="map"
  viewBox="-1 -1 {width + 2} {height + 2}"
  role="group"
  aria-label="The plate seen from above, {grid.cols} by {grid.rows} cells, with {editor
    .binsNow.length} bins"
>
  <rect class="plate" x="0" y="0" {width} {height} rx="4" />
  {#each { length: grid.cols - 1 }, i (i)}
    <line class="grid" x1={(i + 1) * CELL} y1="0" x2={(i + 1) * CELL} y2={height} />
  {/each}
  {#each { length: grid.rows - 1 }, i (i)}
    <line class="grid" x1="0" y1={(i + 1) * CELL} x2={width} y2={(i + 1) * CELL} />
  {/each}
  {#each editor.binsNow as b, i (b.id)}
    {@const [w, d] = footprint(b.bin, b.turned)}
    {@const bad = (problems[i]?.length ?? 0) > 0}
    <g
      class="bin"
      class:on={i === editor.activeBin}
      class:bad
      role="button"
      tabindex="0"
      aria-label="{b.name}, column {b.col + 1}, row {b.row + 1}, {w} by {d} cells{bad
        ? ', does not fit'
        : ''}"
      onclick={() => onselect?.(i)}
      onkeydown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onselect?.(i);
        }
      }}
    >
      <rect
        x={b.col * CELL + 2}
        y={b.row * CELL + 2}
        width={w * CELL - 4}
        height={d * CELL - 4}
        rx="4"
        style:fill={b.bin.plate_color}
      />
      <text x={b.col * CELL + (w * CELL) / 2} y={b.row * CELL + (d * CELL) / 2}
        >{i + 1}</text
      >
    </g>
  {/each}
</svg>

<style>
  .map {
    width: 100%;
    max-height: 220px;
  }
  .plate {
    fill: var(--surface-2);
    stroke: var(--line-strong);
  }
  .grid {
    stroke: var(--line-strong);
    stroke-width: 0.6;
  }
  .bin {
    cursor: pointer;
    outline: none;
  }
  .bin rect {
    fill-opacity: 0.85;
    stroke: var(--text-3);
    stroke-width: 1;
  }
  .bin.on rect {
    stroke: var(--accent);
    stroke-width: 2.5;
  }
  .bin.bad rect {
    stroke: var(--error);
    stroke-width: 2.5;
    stroke-dasharray: 4 2;
  }
  .bin:focus-visible rect {
    stroke: var(--text);
    stroke-width: 2.5;
  }
  text {
    fill: #111;
    font-size: 12px;
    font-weight: 600;
    text-anchor: middle;
    dominant-baseline: central;
    pointer-events: none;
  }
</style>
