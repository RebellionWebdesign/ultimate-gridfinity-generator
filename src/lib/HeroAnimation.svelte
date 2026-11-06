<script lang="ts">
  import { onMount } from "svelte";
  import { BASEPLATE_LIMITS } from "../model/baseplateParams";
  import {
    BIN_R,
    COS,
    GRID,
    TOL,
    UNIT,
    FOOT_H,
    c,
    createIso,
    type BinSpec,
    type Op,
  } from "./iso";

  // A 3 × 2 base builds up cell by cell, then bins drop into it and two lids with labels
  // land on top. The parts are drawn from the real Gridfinity dimensions (foot profile,
  // baseplate pockets, stacking lip, wall thickness), isometric, in SVG. The loop is driven
  // by timers, so it can be shown finished (and still) when the user asks for less motion.
  const { S, proj, box, same, sides, cap, foot, cellCentre, bin, tile } = createIso(
    76 / GRID,
    227,
    100,
  );
  const PLATE_H = c("baseplateProfileHeight") + BASEPLATE_LIMITS.baseplate_base.min;

  /** A lid for one cell: foot below, flat plate above. */
  const lid = (cx: number, cy: number, z0: number): Op[] => {
    const x0 = cx * GRID + TOL;
    const y0 = cy * GRID + TOL;
    const x1 = (cx + 1) * GRID - TOL;
    const y1 = (cy + 1) * GRID - TOL;
    const ring = (z: number) => box(x0, y0, x1, y1, same(BIN_R), z);
    return [
      ...foot(cellCentre(cx), cellCentre(cy), z0),
      ...sides(ring(z0 + FOOT_H), ring(z0 + UNIT)),
      cap(ring(z0 + UNIT), undefined, 1),
    ];
  };

  interface Block {
    id: string;
    kind: "tile" | "bin" | "lid";
    ops: Op[];
    /** ms after the start of the loop */
    at: number;
    /** front-most cell, for the drawing order */
    depth: number;
    z: number;
    label?: { text: string; transform: string; x: number; y: number };
  }

  const FLOOR_Z = PLATE_H - c("baseplateProfileHeight");
  const blocks: Block[] = [];
  let step = 0;
  for (let Y = 0; Y < 2; Y++) {
    for (let X = 0; X < 3; X++) {
      blocks.push({
        id: `tile-${X}-${Y}`,
        kind: "tile",
        ops: tile(X, Y),
        at: 150 * step++,
        depth: X + Y,
        z: 0,
      });
    }
  }
  const bins: BinSpec[] = [
    { id: "bin-a", cx: 0, cy: 0, w: 1, d: 2, units: 3, lip: true, at: 1400 },
    { id: "bin-b", cx: 1, cy: 0, w: 1, d: 1, units: 2, lip: false, at: 1900 },
    { id: "bin-c", cx: 1, cy: 1, w: 1, d: 1, units: 2, lip: false, at: 2400 },
    { id: "bin-d", cx: 2, cy: 0, w: 1, d: 2, units: 2, lip: true, at: 2900 },
  ];
  for (const b of bins) {
    blocks.push({
      id: b.id,
      kind: "bin",
      ops: bin(b, FLOOR_Z),
      at: b.at,
      depth: b.cx + b.w - 1 + (b.cy + b.d - 1),
      z: 1,
    });
  }
  const lids = [
    { id: "lid-b", cx: 1, cy: 0, text: "M3 × 8", at: 3900 },
    { id: "lid-c", cx: 1, cy: 1, text: "M4 × 12", at: 4500 },
  ];
  for (const l of lids) {
    const z0 = FLOOR_Z + 2 * UNIT;
    const [e, f] = proj(0, 0, z0 + UNIT);
    blocks.push({
      id: l.id,
      kind: "lid",
      ops: lid(l.cx, l.cy, z0),
      at: l.at,
      depth: l.cx + l.cy,
      z: 2,
      label: {
        text: l.text,
        transform: `matrix(${COS * S} ${0.5 * S} ${-COS * S} ${0.5 * S} ${e} ${f})`,
        x: cellCentre(l.cx),
        y: cellCentre(l.cy) + 2.3,
      },
    });
  }
  // the base first, then bins and lids from back to front, lids after their bin
  const ordered = blocks
    .map((b, i) => ({ b, i }))
    .sort(
      (p, q) =>
        Number(p.b.kind !== "tile") - Number(q.b.kind !== "tile") ||
        p.b.depth - q.b.depth ||
        p.b.z - q.b.z ||
        p.i - q.i,
    )
    .map((e) => e.b);

  const HOLD = 9200; // everything is in place until here
  const LOOP = 10600;

  /**
   * How far the story has come, for the words beside the animation: 1 the base, 2 the bins,
   * 3 the lids, 4 the colours. 0 while nothing is there.
   */
  let { stage = $bindable() }: { stage?: number } = $props();

  let shown = $state<string[]>([]);
  let leaving = $state(false);
  let timers: ReturnType<typeof setTimeout>[] = [];

  const run = () => {
    timers = [];
    shown = [];
    leaving = false;
    stage = 0;
    for (const b of blocks) {
      timers.push(setTimeout(() => (shown = [...shown, b.id]), 300 + b.at));
    }
    // the words follow the picture: base, bins, lids, then all the colours
    const first = (kind: Block["kind"]) =>
      Math.min(...blocks.filter((b) => b.kind === kind).map((b) => b.at));
    const last = Math.max(...blocks.map((b) => b.at));
    [
      [1, first("tile")],
      [2, first("bin")],
      [3, first("lid")],
      [4, last + 900],
    ].forEach(([next, at]) => {
      timers.push(setTimeout(() => (stage = next as number), 300 + (at as number)));
    });
    timers.push(setTimeout(() => (leaving = true), HOLD));
    timers.push(
      setTimeout(() => {
        shown = [];
        leaving = false;
        stage = 0;
      }, HOLD + 700),
    );
    timers.push(setTimeout(run, LOOP));
  };

  onMount(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      shown = blocks.map((b) => b.id);
      stage = 4;
      return;
    }
    run();
    return () => timers.forEach(clearTimeout);
  });
</script>

<svg
  viewBox="60 24 400 280"
  data-stage={stage}
  role="img"
  aria-label="A 3 by 2 base builds up cell by cell, then bins and two lids with labels drop onto it"
>
  {#each ordered as b (b.id)}
    <g class="block {b.kind}" class:in={shown.includes(b.id)} class:leaving>
      {#each b.ops as op, i (i)}
        <path
          class={op.cls}
          d={op.d}
          fill-rule={op.evenodd ? "evenodd" : undefined}
          style="--f: {op.fill}; --e: {op.edge ?? op.fill}"
        />
      {/each}
      {#if b.label}
        <text
          class="label"
          transform={b.label.transform}
          x={b.label.x}
          y={b.label.y}
          font-size="6.5"
        >
          {b.label.text}
        </text>
      {/if}
    </g>
  {/each}
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
  /* base and lids in the accent colour of the page, bins in dark grey so the outlines show */
  .tile,
  .lid {
    --hue: var(--accent);
  }
  .bin {
    --hue: #5a5d56;
  }
  path.line {
    stroke-width: 0.9;
    stroke-linecap: round;
  }
  .block {
    opacity: 0;
    transform: translateY(-200px);
    transition:
      transform 650ms cubic-bezier(0.22, 1, 0.36, 1),
      opacity 220ms ease-out;
  }
  .block.tile {
    transform: translateY(-70px);
  }
  .block.in {
    opacity: 1;
    transform: none;
  }
  .block.in.leaving {
    opacity: 0;
    transition: opacity 600ms ease-in;
  }
  /* a bin's feet sink into the pockets of the base as it lands */
  .bin .foot {
    transition: opacity 120ms 480ms;
  }
  .bin.in .foot {
    opacity: 0;
  }
  .label {
    fill: var(--accent-ink);
    font-family: var(--font-num);
    font-weight: 500;
    text-anchor: middle;
  }
  @media (prefers-reduced-motion: reduce) {
    .block,
    .bin .foot {
      transition: none;
    }
  }
</style>
