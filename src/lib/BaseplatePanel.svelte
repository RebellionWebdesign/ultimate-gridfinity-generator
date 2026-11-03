<script lang="ts">
  import {
    BASEPLATE_LIMITS,
    DEFAULT_BASEPLATE,
    baseOf,
    type BaseplateLimitedKey,
  } from "../model/baseplateParams";
  import Field from "./Field.svelte";
  import NumberField from "./NumberField.svelte";
  import ParamGroup from "./ParamGroup.svelte";
  import Segmented from "./Segmented.svelte";
  import Switch from "./Switch.svelte";
  import { PART_NAME, mmText } from "./parts";
  import { editor } from "./store.svelte";

  const p = editor.baseplate;

  const mm = (v: number) => `${mmText(v)} mm`;
  const base = $derived(baseOf(p));
  const sizeSummary = $derived(`${p.units_x} × ${p.units_y} cells`);
  const styleSummary = $derived(p.baseplate_style);
  const magnetSummary = $derived(
    [
      p.corner_magnets ? `corners ${p.corner_magnet_d} × ${p.corner_magnet_h}` : "",
      p.center_magnet ? `centre ${p.center_magnet_d} × ${p.center_magnet_h}` : "",
    ]
      .filter(Boolean)
      .join(" · ") || "no magnets",
  );
</script>

{#snippet num(key: BaseplateLimitedKey, label: string, unit: string, minWhy = "")}
  <NumberField
    {label}
    bind:value={p[key]}
    min={BASEPLATE_LIMITS[key].min}
    max={BASEPLATE_LIMITS[key].max}
    step={BASEPLATE_LIMITS[key].step}
    def={DEFAULT_BASEPLATE[key]}
    {unit}
    why={BASEPLATE_LIMITS[key].why}
    {minWhy}
  />
{/snippet}

<div class="panel">
  <ParamGroup name="Size" summary={sizeSummary}>
    {@render num("units_x", "Width", "cells")}
    {@render num("units_y", "Depth", "cells")}
    <button type="button" class="fit" onclick={() => editor.fitBed()}>
      Fill the bed of the chosen printer
    </button>
    <p class="t-caption">
      Sets as many cells as fit the printer you chose under Output, at most 12 along
      each side.
    </p>
  </ParamGroup>

  <ParamGroup name="Style" summary={styleSummary}>
    <Segmented
      label="Floor"
      bind:value={p.baseplate_style}
      options={[
        { value: "solid", label: "Solid" },
        { value: "skeleton", label: "Skeleton" },
      ]}
    />
    <p class="t-caption">
      Solid: a closed floor under every cell. Skeleton: only a frame, which saves
      filament; pads stay under the magnets.
    </p>
  </ParamGroup>

  <ParamGroup name="Magnets" summary={magnetSummary}>
    <Switch
      label="Corner magnets"
      bind:checked={p.corner_magnets}
      hint="Four pockets in every cell, 26 mm apart."
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
      hint="One pocket in the middle of every cell."
    />
    {#if p.center_magnet}
      {@render num("center_magnet_d", "Magnet diameter", "mm")}
      {@render num("center_magnet_h", "Magnet thickness", "mm")}
      {@render num("magnet_clearance", "Clearance", "mm")}
      {#if p.baseplate_style === "skeleton"}
        {@render num("rib_width", "Rib width", "mm")}
        <p class="t-caption">Four ribs tie the magnet's pad to the frame.</p>
      {/if}
    {/if}
  </ParamGroup>

  <ParamGroup name="Advanced" open={false} summary={mm(base)}>
    {@render num("baseplate_base", "Solid base", "mm")}
    <p class="t-caption">
      The base under the cells. With magnets it is raised so that 0.4 mm of material
      stays under each pocket: now {mm(base)}.
    </p>
  </ParamGroup>

  <ParamGroup name="Colours" open={false} summary={p.plate_color}>
    <Field label={PART_NAME.baseplate} kind="color" bind:value={p.plate_color} />
  </ParamGroup>
</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
  }
  .fit {
    min-height: var(--size-control);
    padding: 0 var(--space-4);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-control);
    background: var(--surface);
    color: inherit;
    cursor: pointer;
  }
  .fit:hover {
    background: var(--surface-2);
  }
</style>
