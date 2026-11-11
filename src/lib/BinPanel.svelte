<script lang="ts">
  import {
    BIN_LIMITS,
    DEFAULT_BIN,
    DIVIDER_LIMITS,
    dividerHeightMax,
    dividerProblems,
    dividerSpan,
    evenDividers,
    withoutCollisions,
    floorZOf,
    labelWallOptions,
    maxHeightUnits,
    type BinLimitedKey,
    type Divider,
  } from "../model/binParams";
  import { SvelteSet } from "svelte/reactivity";
  import Field from "./Field.svelte";
  import Icon from "./Icon.svelte";
  import NumberField from "./NumberField.svelte";
  import ParamGroup from "./ParamGroup.svelte";
  import Segmented from "./Segmented.svelte";
  import Switch from "./Switch.svelte";
  import { PART_NAME, mmText } from "./parts";
  import { editor } from "./store.svelte";
  import { binMaxUnits } from "../geometry/drawer";

  const p = editor.bin;

  /** The whole build height of the chosen printer may be used (bed check on). */
  const heightMax = $derived(
    Math.min(
      editor.bedCheck
        ? Math.max(
            BIN_LIMITS.height_units.min,
            Math.min(
              BIN_LIMITS.height_units.max,
              maxHeightUnits(editor.printerInfo.bed[2], p.lip_style),
            ),
          )
        : BIN_LIMITS.height_units.max,
      editor.drawer.on
        ? binMaxUnits(p, editor.drawer.binAvailable)
        : BIN_LIMITS.height_units.max,
    ),
  );

  const sizeSummary = $derived(`${p.units_x} × ${p.units_y} × ${p.height_units}`);
  const edgeSummary = $derived(
    { with_lip: "stacking lip", flat_same_height: "flat", flat_lower: "flat, lower" }[
      p.lip_style
    ],
  );
  const wallSummary = $derived(
    `${mmText(p.wall_thickness)} · ${mmText(p.bottom_thickness)} mm`,
  );
  const magnetSummary = $derived(
    [
      p.foot_hollow === "open" ? "hollow foot" : "",
      p.corner_magnets ? `corners ${p.corner_magnet_d} × ${p.corner_magnet_h}` : "",
      p.center_magnet ? `centre ${p.center_magnet_d} × ${p.center_magnet_h}` : "",
    ]
      .filter(Boolean)
      .join(" · ") || "no magnets",
  );
  const raised = $derived(floorZOf(p) > 4.75 + p.bottom_thickness + 1e-9);
  const dividerSummary = $derived(
    p.dividers.length === 0
      ? "none"
      : `${p.dividers.length} ${p.dividers.length === 1 ? "divider" : "dividers"} · ${mmText(p.divider_thickness)} mm`,
  );
  const span = $derived(dividerSpan(p));
  /** the farthest middle of a divider: its thickness of room (1.5 x thickness from the back wall) */
  const positionMax = $derived(span - 1.5 * p.divider_thickness);

  /** the middle of the widest free stretch, and whether a divider fits there */
  const freeSpot = $derived.by(() => {
    const t = p.divider_thickness;
    const edges = [...p.dividers]
      .sort((a, b) => a.position - b.position)
      .flatMap((d) => [d.position - t / 2, d.position + t / 2]);
    const bounds = [0, ...edges, span];
    let best = { width: -1, middle: span / 2 };
    for (let i = 0; i < bounds.length; i += 2) {
      const from = bounds[i] ?? 0;
      const to = bounds[i + 1] ?? span;
      if (to - from > best.width) best = { width: to - from, middle: (from + to) / 2 };
    }
    return best;
  });
  /** a divider needs its thickness on both sides and itself: 3 x thickness */
  const room = $derived(freeSpot.width >= 3 * p.divider_thickness - 1e-9);

  /** the dividers whose fields are shown; the list stays short when they are folded */
  const opened = new SvelteSet<Divider>();

  const removeAll = () => {
    removedNote = "";
    p.dividers = [];
  };

  const addDivider = () => {
    p.dividers.push({
      position: freeSpot.middle,
      height: Math.max(DIVIDER_LIMITS.height.min, dividerHeightMax(p)),
    });
    const added = p.dividers.at(-1);
    if (added) opened.add(added);
  };

  let removedNote = $state("");
  /** A thicker divider needs more room: those that now collide are removed, with a note. */
  const dropColliding = () => {
    const kept = withoutCollisions(p);
    const gone = p.dividers.length - kept.length;
    removedNote =
      gone > 0
        ? `${gone} ${gone === 1 ? "divider was" : "dividers were"} removed because ${gone === 1 ? "it" : "they"} would collide with a wall or another divider.`
        : "";
    if (gone > 0) p.dividers = kept;
  };

  let wantedGap = $state(10);
  const even = $derived(evenDividers(p, wantedGap));
  const placeEvenly = () => {
    removedNote = "";
    p.dividers = even.dividers;
  };

  // with a scoop the label sits at the wall opposite it: the scoop is at the front, so at the back
  $effect(() => {
    if (p.scoop && p.label_slot !== "none" && p.label_slot !== "back")
      p.label_slot = "back";
  });

  // a lower bin lowers the dividers with it
  $effect(() => {
    const most = Math.max(DIVIDER_LIMITS.height.min, dividerHeightMax(p));
    for (const d of p.dividers) if (d.height > most) d.height = most;
  });
</script>

{#snippet num(key: BinLimitedKey, label: string, unit: string, minWhy = "")}
  <NumberField
    {label}
    bind:value={p[key]}
    min={BIN_LIMITS[key].min}
    max={BIN_LIMITS[key].max}
    step={BIN_LIMITS[key].step}
    def={DEFAULT_BIN[key]}
    {unit}
    why={BIN_LIMITS[key].why}
    {minWhy}
  />
{/snippet}

<div class="panel">
  <ParamGroup name="Size" summary={sizeSummary}>
    {@render num("units_x", "Width", "cells")}
    {@render num("units_y", "Depth", "cells")}
    <NumberField
      label="Height"
      bind:value={p.height_units}
      min={BIN_LIMITS.height_units.min}
      max={heightMax}
      step={1}
      def={DEFAULT_BIN.height_units}
      unit="× 7 mm"
      why={editor.drawer.on
        ? `The drawer (${editor.drawerHeight} mm) is the limit: base, bin and lid together, with 1 mm of room above`
        : editor.bedCheck
          ? `The build height of ${editor.printer} (${editor.printerInfo.bed[2]} mm) is the limit`
          : BIN_LIMITS.height_units.why}
    />
    <p class="t-caption">The stacking lip is extra and does not count in the height.</p>
  </ParamGroup>

  <ParamGroup name="Top edge" summary={edgeSummary}>
    <Segmented
      label="Top edge"
      bind:value={p.lip_style}
      options={[
        { value: "with_lip", label: "Stacking lip" },
        { value: "flat_same_height", label: "Flat" },
        { value: "flat_lower", label: "Flat, lower" },
      ]}
    />
    <p class="t-caption">
      Stacking lip: +4.4 mm on top, so bins stack. Flat: no lip, same total height.
      Flat, lower: no lip, 4.4 mm lower.
    </p>
  </ParamGroup>

  <ParamGroup name="Walls and floor" summary={wallSummary}>
    {@render num("wall_thickness", "Wall", "mm")}
    {@render num("bottom_thickness", "Floor", "mm")}
    <p class="t-caption">The floor is measured above the 4.75 mm foot.</p>
  </ParamGroup>

  <ParamGroup name="Scoop" summary={p.scoop ? "on" : "off"}>
    <Switch
      label="Scoop"
      bind:checked={p.scoop}
      hint="A curved ramp along the front wall, across the whole width, so small parts slide out. It rises to the lower edge of the step under the stacking lip. It ends flush with the step. In a tall bin only the piece along the wall grows."
    />
    <p class="t-caption">
      Arc diameter 33.75 mm, meeting the floor 15.84 mm from the front wall.
    </p>
  </ParamGroup>

  <ParamGroup name="Dividers" summary={dividerSummary}>
    <NumberField
      label="Divider thickness"
      bind:value={p.divider_thickness}
      min={DIVIDER_LIMITS.thickness.min}
      max={DIVIDER_LIMITS.thickness.max}
      step={DIVIDER_LIMITS.thickness.step}
      unit="mm"
      why={DIVIDER_LIMITS.thickness.why}
      minWhy="The least the printer can build reliably"
      onchange={dropColliding}
    />
    <p class="t-caption">
      The least gap between two dividers and between a divider and a wall is as large as
      the thickness. Dividers that would collide with a wall or with another divider are
      removed when you raise the thickness.
    </p>
    {#if removedNote}
      <p class="t-caption problem" role="status">{removedNote}</p>
    {/if}

    {#each p.dividers as d, i (i)}
      <div class="divider">
        <div class="divider-head">
          <button
            type="button"
            class="toggle"
            aria-expanded={opened.has(d)}
            onclick={() => (opened.has(d) ? opened.delete(d) : opened.add(d))}
          >
            <span class="chev" class:open={opened.has(d)}
              ><Icon name="chevron-right" size={16} /></span
            >
            <span class="t-label name">Divider {i + 1}</span>
            <span class="n-s info"
              >{d.position.toFixed(1)} · {d.height.toFixed(1)} mm</span
            >
          </button>
          <button
            type="button"
            class="quiet"
            aria-label="Remove divider {i + 1}"
            onclick={() => p.dividers.splice(i, 1)}><Icon name="x" size={16} /></button
          >
        </div>
        {#if opened.has(d)}
          <NumberField
            label="Distance from the front wall"
            bind:value={d.position}
            min={1.5 * p.divider_thickness}
            max={Math.max(1.5 * p.divider_thickness, positionMax)}
            step={0.1}
            noReset
            unit="mm"
            why="The divider keeps its thickness in mm of room to the back wall"
            minWhy="The divider keeps its thickness in mm of room to the front wall"
          />
          <NumberField
            label="Height"
            bind:value={d.height}
            min={DIVIDER_LIMITS.height.min}
            max={Math.max(DIVIDER_LIMITS.height.min, dividerHeightMax(p))}
            step={DIVIDER_LIMITS.height.step}
            def={Math.max(DIVIDER_LIMITS.height.min, dividerHeightMax(p))}
            unit="mm"
            why={DIVIDER_LIMITS.height.why}
          />
        {/if}
      </div>
    {/each}
    {#each dividerProblems(p) as problem (problem)}
      <p class="t-caption problem" role="alert">{problem}</p>
    {/each}
    {#if p.dividers.length < DIVIDER_LIMITS.count.max}
      <div class="add">
        <button type="button" disabled={!room} onclick={addDivider}
          ><Icon name="plus" size={16} />Add divider</button
        >
        {#if p.dividers.length > 0}
          <button type="button" onclick={removeAll}
            ><Icon name="x" size={16} />Remove dividers</button
          >
        {/if}
      </div>
      {#if !room}
        <p class="t-caption">No room for another divider at this thickness.</p>
      {/if}
    {/if}
    <p class="t-caption">
      A divider runs across the whole width of the cavity and ends at the side walls. It
      is measured from the cavity floor, up to the lower edge of the step under the
      stacking lip at most.
    </p>

    <div class="custom">
      <h3 class="t-label">
        Custom: even spacing <span class="tag n-s">not in the standard</span>
      </h3>
      <NumberField
        label="Gap between dividers"
        bind:value={wantedGap}
        min={p.divider_thickness}
        max={Math.max(p.divider_thickness, span)}
        step={0.1}
        def={Math.max(p.divider_thickness, 10)}
        unit="mm"
        why="The gap cannot be wider than the cavity"
        minWhy="The least gap is the thickness of the dividers"
      />
      <p class="t-caption">
        {#if even.dividers.length === 0}
          No divider fits with this gap.
        {:else}
          {even.dividers.length}
          {even.dividers.length === 1 ? "divider" : "dividers"}, every gap {mmText(
            even.gap,
          )} mm.
        {/if}
        As many dividers are placed as fit with at least this gap, spread evenly, so the gap
        can come out a little larger, never smaller. The dividers above are replaced.
      </p>
      <div class="add">
        <button type="button" onclick={placeEvenly}>Place evenly</button>
      </div>
    </div>
  </ParamGroup>

  <ParamGroup
    name="Label slots"
    summary={p.label_slot === "none" ? "none" : p.label_slot}
  >
    <Segmented
      label="Slots for a label"
      bind:value={p.label_slot}
      options={labelWallOptions(p)}
    />
    <p class="t-caption">
      Two small slots in the walls next to the chosen wall, under the stacking lip, for
      the lugs of a label plate. On a bin that is not square the label can sit on the
      long or the short side; its length follows that side. Make the label in the Label
      tab. The slots need the stacking lip.
      {#if p.scoop}
        With a scoop the label sits at the wall opposite it.
      {/if}
    </p>
    <button
      type="button"
      class="show"
      aria-pressed={editor.showLabel}
      onclick={() => {
        editor.showLabel = !editor.showLabel;
        if (editor.showLabel && p.label_slot === "none") p.label_slot = "back";
      }}
    >
      <Icon name={editor.showLabel ? "check" : "plus"} size={16} />
      {editor.showLabel ? "Hide label" : "Show label"}
    </button>
    <p class="t-caption">
      Shows the label in its place in the bin. Only for looking: it is not part of the
      bin's file.
    </p>
  </ParamGroup>

  <ParamGroup name="Magnets and foot" summary={magnetSummary}>
    <Switch
      label="Corner magnets"
      bind:checked={p.corner_magnets}
      hint="Pockets in the foot, in the four outermost corners of the bin."
    />
    {#if p.corner_magnets}
      {@render num(
        "corner_magnet_d",
        "Pocket diameter",
        "mm",
        "Gridfinity magnet 6 mm plus 0.1 mm clearance",
      )}
      {@render num(
        "corner_magnet_h",
        "Pocket depth",
        "mm",
        "Gridfinity magnet 2 mm plus 0.1 mm clearance",
      )}
    {/if}
    <Switch
      label="Centre magnet"
      bind:checked={p.center_magnet}
      hint="One pocket in the middle of each corner foot."
    />
    {#if p.center_magnet}
      {@render num("center_magnet_d", "Magnet diameter", "mm")}
      {@render num("center_magnet_h", "Magnet thickness", "mm")}
      {@render num("magnet_clearance", "Clearance", "mm")}
    {/if}
    <Segmented
      label="Foot"
      bind:value={p.foot_hollow}
      options={[
        { value: "none", label: "Solid" },
        { value: "open", label: "Hollow" },
      ]}
    />
    {#if p.foot_hollow === "open"}
      {@render num("foot_wall", "Hollow foot wall", "mm")}
      <p class="t-caption">
        Saves filament: one cut from below. A rim of the foot stays around each magnet
        pocket.
      </p>
    {/if}
    {#if raised}
      <p class="t-caption">
        The floor is raised to {mmText(floorZOf(p))} mm so that 0.8 mm of material stays above
        the tallest magnet.
      </p>
    {/if}
  </ParamGroup>

  <ParamGroup name="Colours" open={false} summary={p.plate_color}>
    <Field label={PART_NAME.bin} kind="color" bind:value={p.plate_color} />
    {#if p.lip_style === "with_lip"}
      <Switch
        label="Own colour for the stacking lip"
        bind:checked={p.lip_color_enabled}
      />
      {#if p.lip_color_enabled}
        <Field label="Stacking lip" kind="color" bind:value={p.lip_color} />
      {/if}
    {/if}
  </ParamGroup>
</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
  }
  .divider {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-3);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-control);
  }
  .divider-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }
  .toggle {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: var(--size-control-sm);
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
    text-align: left;
  }
  .name {
    white-space: nowrap;
  }
  .info {
    margin-left: auto;
    color: var(--text-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .chev {
    display: inline-flex;
    transition: transform var(--dur-press) var(--ease);
  }
  .chev.open {
    transform: rotate(90deg);
  }
  .quiet {
    display: grid;
    place-items: center;
    width: var(--size-control-sm);
    height: var(--size-control-sm);
    border: 0;
    background: none;
    cursor: pointer;
  }
  .add {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  .add button {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    min-height: var(--size-control);
    padding: 0 var(--space-3);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-control);
    background: var(--surface);
    cursor: pointer;
  }
  .custom {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding-top: var(--space-3);
    border-top: 1px solid var(--line);
  }
  .custom h3 {
    font-size: inherit;
  }
  .tag {
    margin-left: var(--space-2);
    padding: 0 var(--space-2);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-round);
    color: var(--text-3);
    font-weight: 400;
  }
  .add button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .show {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    min-height: var(--size-control);
    padding: 0 var(--space-3);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-control);
    background: var(--surface);
    cursor: pointer;
  }
  .show[aria-pressed="true"] {
    background: var(--accent-soft);
    border-color: var(--accent);
  }
  .problem {
    color: var(--error);
  }
</style>
