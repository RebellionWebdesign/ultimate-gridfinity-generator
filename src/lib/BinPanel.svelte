<script lang="ts">
  import {
    BIN_LIMITS,
    DEFAULT_BIN,
    floorZOf,
    maxHeightUnits,
    type BinLimitedKey,
  } from "../model/binParams";
  import Field from "./Field.svelte";
  import NumberField from "./NumberField.svelte";
  import ParamGroup from "./ParamGroup.svelte";
  import Segmented from "./Segmented.svelte";
  import Switch from "./Switch.svelte";
  import { PART_NAME, mmText } from "./parts";
  import { editor } from "./store.svelte";

  const p = editor.bin;

  /** The whole build height of the chosen printer may be used (bed check on). */
  const heightMax = $derived(
    editor.bedCheck
      ? Math.max(
          BIN_LIMITS.height_units.min,
          Math.min(
            BIN_LIMITS.height_units.max,
            maxHeightUnits(editor.printerInfo.bed[2], p.lip_style),
          ),
        )
      : BIN_LIMITS.height_units.max,
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
      why={editor.bedCheck
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
</style>
