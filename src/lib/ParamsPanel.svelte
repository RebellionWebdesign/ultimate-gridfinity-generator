<script lang="ts">
  import iconNames from "../data/lucideLidIconNames.json";
  import {
    DEFAULT_LID,
    LID_LIMITS,
    offsetLimit,
    type LimitedKey,
  } from "../model/lidParams";
  import Field from "./Field.svelte";
  import Icon from "./Icon.svelte";
  import NumberField from "./NumberField.svelte";
  import ParamGroup from "./ParamGroup.svelte";
  import Segmented from "./Segmented.svelte";
  import Switch from "./Switch.svelte";
  import { PART_NAME } from "./parts";
  import { editor } from "./store.svelte";
  import { lidMaxPlate, lidMaxUnits } from "../geometry/drawer";

  const p = editor.params;

  const textOn = $derived(p.text_mode !== "none");
  const symbolOn = $derived(p.symbol_mode !== "none");
  const both = $derived(textOn && symbolOn);
  const anyRaisedOrEngraved = $derived(
    [p.text_mode, p.symbol_mode].some((m) => m === "raised" || m === "engraved"),
  );
  const anyFlush = $derived([p.text_mode, p.symbol_mode].includes("flush"));
  const multi = $derived(p.units_x > 1 || p.units_y > 1);

  const iconOptions = iconNames.map((name) => {
    const [group = "", rest = name] = name.split(/_(.*)/s);
    const pretty = `${group[0]?.toUpperCase()}${group.slice(1)} · ${rest.replaceAll("-", " ")}`;
    return { value: name, label: pretty };
  });

  const modes = [
    { value: "none", label: "None" },
    { value: "raised", label: "Raised" },
    { value: "engraved", label: "Engraved" },
    { value: "flush", label: "Flush" },
  ] as const;

  const fonts = [
    { value: "Inter", label: "Inter" },
    { value: "IBM Plex Mono", label: "IBM Plex Mono" },
    { value: "IBM Plex Sans SemiBold", label: "IBM Plex Sans SemiBold" },
    { value: "upload", label: "Your font file" },
  ];

  const MAX_FONT_BYTES = 2 * 1024 * 1024;
  let fontError = $state("");
  const readFont = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_FONT_BYTES) {
      fontError = `${file.name} is larger than 2 MB. Use a smaller font file, for example one weight of the family.`;
      return;
    }
    fontError = "";
    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    p.font_data = url.slice(url.indexOf(",") + 1);
    p.font_name = file.name;
  };

  let dragging = $state(false);
  const readFile = async (file: File | undefined) => {
    if (file) editor.setSvg(await file.text(), file.name);
  };

  const sizeSummary = $derived(`${p.units_x} × ${p.units_y} cells`);
  const shapeSummary = $derived(
    `${p.variant === "stackable" ? "stackable" : "dust cover"} · ${p.plate_thickness_mode}`,
  );
  const magnetSummary = $derived(
    `${p.corner_magnets ? `${p.corner_magnet_d} × ${p.corner_magnet_h}` : "no magnets"} · ${p.foot_hollow === "open" ? "hollow" : "solid"}`,
  );
  const labelSummary = $derived(
    [textOn ? `text ${p.text_mode}` : "", symbolOn ? `symbol ${p.symbol_mode}` : ""]
      .filter(Boolean)
      .join(" · ") || "none",
  );
</script>

{#snippet num(
  key: LimitedKey,
  label: string,
  unit: string,
  minWhy = "",
  max = LID_LIMITS[key].max,
)}
  <NumberField
    {label}
    bind:value={p[key]}
    min={LID_LIMITS[key].min}
    {max}
    step={LID_LIMITS[key].step}
    def={DEFAULT_LID[key]}
    {unit}
    why={LID_LIMITS[key].why}
    {minWhy}
  />
{/snippet}

{#snippet offset(
  key: "text_offset_x" | "text_offset_y" | "symbol_offset_x" | "symbol_offset_y",
  label: string,
  axis: "x" | "y",
)}
  <NumberField
    {label}
    bind:value={p[key]}
    min={-offsetLimit(p, axis)}
    max={offsetLimit(p, axis)}
    step={0.5}
    def={0}
    unit="mm"
    signed
    why="Half the lid size is the limit."
  />
{/snippet}

<div class="panel">
  <ParamGroup name="Size" summary={sizeSummary}>
    {@render num("units_x", "Width", "cells")}
    {@render num("units_y", "Depth", "cells")}
  </ParamGroup>

  <ParamGroup name="Shape" summary={shapeSummary}>
    <Segmented
      label="Lid type"
      value="foot"
      options={[
        { value: "foot", label: "Sits on a foot" },
        { value: "sliding", label: "Slides in", note: "Later", disabled: true },
      ]}
    />
    <Segmented
      label="Variant"
      bind:value={p.variant}
      options={[
        { value: "dust_cover", label: "Dust cover" },
        { value: "stackable", label: "Stackable" },
      ]}
    />
    {#if p.variant === "stackable"}
      <Segmented
        label="Stacking lip"
        bind:value={p.lip_mode}
        options={[
          { value: "full", label: "All around" },
          { value: "corners_only", label: "Corners only" },
        ]}
      />
      {#if p.lip_mode === "corners_only"}
        {@render num("corner_len", "Corner piece length", "mm")}
      {/if}
    {/if}
    {#if multi}
      <Segmented
        label="Foot"
        bind:value={p.foot_layout}
        options={[
          { value: "merged", label: "Merged" },
          { value: "per_cell", label: "Per cell" },
        ]}
      />
      <p class="t-caption">
        Merged: one foot under the whole lid. Per cell: one foot per cell, to close
        several 1 × 1 bins.
      </p>
    {/if}
    <Segmented
      label="Plate thickness"
      bind:value={p.plate_thickness_mode}
      options={[
        { value: "auto", label: "Auto" },
        { value: "manual", label: "Manual" },
      ]}
    />
    {#if p.plate_thickness_mode === "auto"}
      {@render num(
        "height_units_auto",
        "Total height",
        "× 7 mm",
        "",
        editor.drawer.on
          ? lidMaxUnits(p, editor.drawer.lidAvailable)
          : LID_LIMITS.height_units_auto.max,
      )}
      <p class="t-caption">Auto makes the total height a multiple of 7 mm.</p>
    {:else}
      {@render num(
        "plate_thickness",
        "Plate",
        "mm",
        "2.25 mm is what is left of the first 7 mm layer",
        editor.drawer.on
          ? lidMaxPlate(p, editor.drawer.lidAvailable)
          : LID_LIMITS.plate_thickness.max,
      )}
    {/if}
    <Segmented
      label="Print orientation"
      bind:value={p.print_orientation}
      options={[
        { value: "foot_down", label: "Foot down" },
        { value: "upside_down", label: "Upside down" },
      ]}
    />
  </ParamGroup>

  <ParamGroup name="Magnets and foot" summary={magnetSummary}>
    <Switch
      label="Corner magnets"
      bind:checked={p.corner_magnets}
      hint="Pockets on the top side, in the four outermost corners of the lid. A 1 × 1 lid has all four corners."
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
    {/if}
  </ParamGroup>

  <ParamGroup name="Label" summary={labelSummary}>
    <Segmented label="Text" bind:value={p.text_mode} options={[...modes]} />
    {#if textOn}
      <Field label="Text" kind="text" bind:value={p.text_string} maxlength={40} />
      <Field label="Font" kind="select" bind:value={p.font_choice} options={fonts} />
      {#if p.font_choice === "upload"}
        <div class="drop">
          <Icon name="upload" size={20} />
          <label class="t-label" for="font-file">
            {p.font_data ? p.font_name : "Choose a .ttf, .otf or .woff file"}
          </label>
          <input
            id="font-file"
            type="file"
            accept=".ttf,.otf,.woff,font/ttf,font/otf,font/woff"
            onchange={(event) => void readFont(event.currentTarget.files?.[0])}
          />
        </div>
        {#if fontError}<p class="t-caption error" role="alert">{fontError}</p>{/if}
        <p class="t-caption">
          The font is saved inside the model file. Use only fonts you may embed and
          print.
        </p>
      {/if}
      {@render num("text_size", "Text height", "mm")}
    {/if}
    <Segmented label="Symbol" bind:value={p.symbol_mode} options={[...modes]} />
    {#if symbolOn}
      <Segmented
        label="Symbol source"
        bind:value={p.symbol_source}
        options={[
          { value: "lucide", label: "Built-in" },
          { value: "upload", label: "Your SVG" },
        ]}
      />
      {#if p.symbol_source === "lucide"}
        <Field
          label="Icon"
          kind="select"
          bind:value={p.symbol_icon}
          options={iconOptions}
        />
        {@render num("icon_size", "Symbol size", "mm")}
      {:else}
        <div
          class="drop"
          class:dragging
          role="presentation"
          ondragover={(event) => {
            event.preventDefault();
            dragging = true;
          }}
          ondragleave={() => (dragging = false)}
          ondrop={(event) => {
            event.preventDefault();
            dragging = false;
            void readFile(event.dataTransfer?.files[0]);
          }}
        >
          <Icon name="upload" size={20} />
          <label class="t-label" for="svg-file">
            {editor.svgName && !editor.svgError
              ? editor.svgName
              : "Drop an SVG file or choose one"}
          </label>
          <input
            id="svg-file"
            type="file"
            accept=".svg,image/svg+xml"
            onchange={(event) => void readFile(event.currentTarget.files?.[0])}
          />
        </div>
        {#if editor.svgError}<p class="t-caption error" role="alert">
            {editor.svgError}
          </p>{/if}
        <p class="t-caption">
          Filled shapes only. The file is read at 96 dpi (1 px = 0.265 mm), then scaled.
        </p>
        {@render num("symbol_scale", "SVG scale", "×")}
      {/if}
      {#if both}
        <Segmented
          label="Symbol sits"
          bind:value={p.label_arrange}
          options={[
            { value: "icon_left", label: "Left" },
            { value: "icon_right", label: "Right" },
            { value: "icon_above", label: "Above" },
            { value: "icon_below", label: "Below" },
          ]}
        />
      {/if}
    {/if}
    {#if anyRaisedOrEngraved}
      {@render num("emboss_depth", "Raised height, engraved depth", "mm")}
    {/if}
    {#if anyFlush}
      {@render num("flush_depth", "Flush inlay depth", "mm")}
    {/if}
    {#each editor.warnings as warning (warning)}
      <p class="t-caption warn">{warning}</p>
    {/each}
  </ParamGroup>

  {#if textOn || symbolOn}
    <ParamGroup
      name="Placement"
      open={false}
      summary={both && p.label_group ? "as one group" : "free"}
    >
      {#if both}
        <Switch
          label="Place text and symbol as one group"
          bind:checked={p.label_group}
        />
        {#if p.label_group}
          <Segmented
            label="Align in group"
            bind:value={p.label_align}
            options={[
              { value: "center", label: "Centre" },
              { value: "start", label: "Start" },
              { value: "end", label: "End" },
            ]}
          />
          <Switch label="Centre the group on the lid" bind:checked={p.label_center} />
        {/if}
        {@render num("label_gap", "Gap", "mm")}
      {/if}
      {#if textOn}
        {@render offset("text_offset_x", "Text left / right", "x")}
        {@render offset("text_offset_y", "Text front / back", "y")}
        {@render num("text_rotation", "Text rotation", "°")}
      {/if}
      {#if symbolOn}
        {@render offset("symbol_offset_x", "Symbol left / right", "x")}
        {@render offset("symbol_offset_y", "Symbol front / back", "y")}
        {@render num("symbol_rotation", "Symbol rotation", "°")}
      {/if}
    </ParamGroup>
  {/if}

  <ParamGroup name="Colours" open={false} summary={p.plate_color}>
    <Field label={PART_NAME[editor.part]} kind="color" bind:value={p.plate_color} />
    {#if textOn}<Field label="Text" kind="color" bind:value={p.text_color} />{/if}
    {#if symbolOn}
      <Field
        label="Symbol"
        kind="color"
        bind:value={p.symbol_color}
        hint="Black until you choose a colour."
      />
    {/if}
    {#if p.variant === "stackable"}
      <Switch
        label="Own colour for the stacking lip"
        bind:checked={p.lip_color_enabled}
      />
      {#if p.lip_color_enabled}<Field
          label="Stacking lip"
          kind="color"
          bind:value={p.lip_color}
        />{/if}
    {/if}
  </ParamGroup>
</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
  }
  .drop {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3);
    border: 1px dashed var(--line-strong);
    border-radius: var(--radius-control);
    position: relative;
  }
  .drop.dragging {
    background: var(--accent-soft);
    border-color: var(--accent);
  }
  .drop input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
  .warn {
    color: var(--warning);
  }
  .error {
    color: var(--error);
  }
</style>
