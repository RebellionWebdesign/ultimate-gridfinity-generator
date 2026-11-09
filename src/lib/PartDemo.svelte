<script lang="ts">
  import { onMount } from "svelte";
  import { FOOT_H, GRID, LIP_H, PLATE_H, UNIT, createIso, type BinSpec } from "./iso";

  // A small isometric part for the "How it works" cards, drawn like the hero animation.
  // `kind="base"` is a square baseplate of `cells` by `cells` (the Set card). A bin has
  // `cells` for its width; with `printing` it is printed layer by layer on a bed, with a
  // nozzle moving at the top (the Print card); it stands still, finished, with reduced
  // motion.
  let {
    cells = 2,
    kind = "bin",
    printing = false,
    hue = "#5a5d56",
  }: {
    cells?: number;
    kind?: "bin" | "base";
    printing?: boolean;
    hue?: string;
  } = $props();

  const MAX_CELLS = 8;
  /** the largest plate of the Set card: one cell more than the 6 x 6 of a 256 mm bed */
  const MAX_PLATE = 7;
  const DEPTH = 1;
  const UNITS = 2;
  const S = 1.15; // px per mm
  const iso = createIso(S, 0, 0);

  const width = $derived(printing ? 2 : cells);
  const BODY = UNITS * UNIT;
  const LAYER = 0.5; // mm per printed layer
  /** the first picture of a print: the foot and the floor are already there */
  const FIRST = FOOT_H + 0.8 + 0.5;
  const LAYERS = Math.round((BODY - FIRST) / LAYER);

  // printing: 0 to LAYERS layers, then the lip, then a pause
  let layer = $state(0);
  let still = $state(false);

  const PAUSE = 10;
  let tick = 0;
  onMount(() => {
    if (!printing) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      still = true;
      layer = LAYERS + 1;
      return;
    }
    const timer = setInterval(() => {
      tick = (tick + 1) % (LAYERS + 2 + PAUSE);
      layer = Math.min(tick, LAYERS + 1);
      // after the pause the bin goes and the print starts again
      if (tick >= LAYERS + 2 + PAUSE - 2) layer = -1;
    }, 150);
    return () => clearInterval(timer);
  });

  const spec = (units: number, lip: boolean): BinSpec => ({
    id: "demo",
    cx: 0,
    cy: 0,
    w: width,
    d: DEPTH,
    units,
    lip,
    at: 0,
  });
  const height = $derived(layer >= LAYERS ? BODY : FIRST + Math.max(layer, 0) * LAYER);
  const ops = $derived(
    kind === "base"
      ? // back to front: the tiles in front cover the ones behind
        Array.from({ length: cells * cells }, (_, k) => [
          k % cells,
          Math.floor(k / cells),
        ])
          .sort((p, q) => (p[0] ?? 0) + (p[1] ?? 0) - ((q[0] ?? 0) + (q[1] ?? 0)))
          .flatMap(([x, y]) => iso.tile(x ?? 0, y ?? 0, cells, cells))
      : !printing
        ? iso.bin(spec(UNITS, true), 0)
        : layer < 0
          ? []
          : iso.bin(spec(height / UNIT, layer > LAYERS), 0),
  );

  // the nozzle runs to and fro along the width at the height of the last layer
  const nozzle = $derived.by(() => {
    if (!printing || still || layer < 0 || layer > LAYERS) return undefined;
    const wave = (layer * 0.37) % 2;
    const t = wave < 1 ? wave : 2 - wave;
    const [x, y] = iso.proj(8 + t * (width * GRID - 16), DEPTH * GRID - 8, height);
    return `translate(${x} ${y})`;
  });

  // the picture is as large as the widest bin, so the card does not jump
  const view = $derived.by(() => {
    const reach = (printing ? 2 : MAX_CELLS) * GRID + (printing ? 10 : 0);
    const plate = MAX_PLATE * GRID;
    const corners =
      kind === "base"
        ? [
            iso.proj(0, 0, PLATE_H),
            iso.proj(plate, 0, 0),
            iso.proj(0, plate, 0),
            iso.proj(plate, plate, 0),
          ]
        : [
            iso.proj(0, 0, BODY + LIP_H + 14),
            iso.proj(reach, 0, 0),
            iso.proj(-10, DEPTH * GRID + 10, 0),
            iso.proj(reach, DEPTH * GRID + 10, 0),
          ];
    const pad = 8;
    const minX = Math.min(...corners.map((p) => p[0])) - pad;
    const maxX = Math.max(...corners.map((p) => p[0])) + pad;
    const minY = Math.min(...corners.map((p) => p[1])) - pad;
    const maxY = Math.max(...corners.map((p) => p[1])) + pad;
    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  });
  // the bed under a printing bin
  const bed = (() => {
    const [a, b] = [-10, 2 * GRID + 10];
    return (
      "M" +
      [
        iso.proj(a, a, 0),
        iso.proj(b, a, 0),
        iso.proj(b, DEPTH * GRID + 10, 0),
        iso.proj(a, DEPTH * GRID + 10, 0),
      ]
        .map((p) => p.join(","))
        .join("L") +
      "Z"
    );
  })();
</script>

<svg
  class="demo"
  viewBox={view}
  style="--hue: {hue}"
  role="img"
  aria-label={kind === "base"
    ? `A baseplate of ${cells} by ${cells} cells`
    : printing
      ? "A bin being printed layer by layer"
      : `A bin that is ${cells} cells wide`}
>
  {#if printing}<path class="bed" d={bed} />{/if}
  {#each ops as op, i (i)}
    <path
      class={op.cls}
      d={op.d}
      fill-rule={op.evenodd ? "evenodd" : undefined}
      style="--f: {op.fill}; --e: {op.edge ?? op.fill}"
    />
  {/each}
  {#if nozzle}
    <g class="nozzle" transform={nozzle}>
      <path d="M-3 -2 3 -2 0.8 4 -0.8 4Z M-5 -8 5 -8 5 -2 -5 -2Z" />
    </g>
  {/if}
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }
  path {
    fill: var(--f);
    stroke: var(--e);
    stroke-width: 0.6;
    stroke-linejoin: round;
  }
  path.line {
    stroke-width: 0.9;
    stroke-linecap: round;
  }
  .bed {
    fill: var(--surface-3);
    stroke: var(--line-strong);
    stroke-width: 0.8;
  }
  .nozzle path {
    fill: var(--text-2);
    stroke: var(--bg);
    stroke-width: 0.5;
  }
</style>
