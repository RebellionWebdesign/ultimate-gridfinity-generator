<script lang="ts">
  import iconNames from "../data/lucideLidIconNames.json";
  import {
    DEFAULT_LABEL,
    LABEL_LIMITS,
    labelOffsetLimit,
    labelSize,
    type LabelLimitedKey,
  } from "../model/labelParams";
  import Field from "./Field.svelte";
  import Icon from "./Icon.svelte";
  import NumberField from "./NumberField.svelte";
  import ParamGroup from "./ParamGroup.svelte";
  import Segmented from "./Segmented.svelte";
  import Switch from "./Switch.svelte";
  import { editor } from "./store.svelte";
  import { mmText } from "./parts";

  const p = editor.label;
  const bin = editor.bin;

  const textOn = $derived(p.text_mode !== "none");
  const symbolOn = $derived(p.symbol_mode !== "none");
  const both = $derived(textOn && symbolOn);
  const anyRaisedOrEngraved = $derived(
    [p.text_mode, p.symbol_mode].some((m) => m === "raised" || m === "engraved"),
  );
  const anyFlush = $derived([p.text_mode, p.symbol_mode].includes("flush"));
  const size = $derived(labelSize(bin));

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

  const iconOptions = iconNames.map((name) => {
    const [group = "", rest = name] = name.split(/_(.*)/s);
    const pretty = `${group[0]?.toUpperCase()}${group.slice(1)} · ${rest.replaceAll("-", " ")}`;
    return { value: name, label: pretty };
  });

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
  const readSvg = async (file: File | undefined) => {
    if (file) editor.setLabelSvg(await file.text(), file.name);
  };

  const sizeSummary = $derived(`${mmText(size[0])} × ${mmText(size[1])} mm`);
  const textSummary = $derived(
    textOn ? `${p.text_mode} · ${p.text_string.trim() || "empty"}` : "none",
  );
  const symbolSummary = $derived(
    symbolOn
      ? `${p.symbol_mode} · ${p.symbol_source === "upload" ? "your SVG" : "built-in"}`
      : "none",
  );
  const slotSummary = $derived(bin.label_slot === "front" ? "front wall" : "back wall");
</script>

{#snippet num(key: LabelLimitedKey, label: string, unit: string)}
  <NumberField
    {label}
    bind:value={p[key]}
    min={LABEL_LIMITS[key].min}
    max={LABEL_LIMITS[key].max}
    step={LABEL_LIMITS[key].step}
    def={DEFAULT_LABEL[key]}
    {unit}
    why={LABEL_LIMITS[key].why}
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
    min={-labelOffsetLimit(bin, axis)}
    max={labelOffsetLimit(bin, axis)}
    step={0.5}
    def={0}
    unit="mm"
    signed
    why="Half the label is the limit."
  />
{/snippet}

<div class="panel">
  <ParamGroup name="Label for this bin" summary={sizeSummary}>
    <p class="t-caption">
      A flat plate, {mmText(size[0])} × {mmText(size[1])} mm and 1 mm thick, for the bin
      {bin.units_x} × {bin.units_y} × {bin.height_units}. It follows the inner width of
      the first slope of the stacking lip and rests on it. Two lugs of 0.6 mm click into
      slots in the side walls. You print it apart from the bin, so a label can be
      changed without printing the bin again.
    </p>
  </ParamGroup>

  <ParamGroup name="Position in the bin" summary={slotSummary}>
    <Segmented
      label="Wall"
      bind:value={bin.label_slot}
      options={[
        { value: "back", label: "Back" },
        { value: "front", label: "Front" },
      ]}
    />
    <p class="t-caption">
      The bin gets two slots in its side walls at this wall, every dimension 0.05 mm
      larger than the lug so that it clicks in cleanly. Put it at the wall opposite the
      scoop. Back is the wall at the far side in the preview of the bin.
    </p>
    {#if bin.lip_style !== "with_lip"}
      <p class="t-caption error" role="alert">
        The label rests on the stacking lip. Choose the stacking lip in the bin.
      </p>
    {/if}
  </ParamGroup>

  <ParamGroup name="Text" summary={textSummary}>
    <Segmented label="Text" bind:value={p.text_mode} options={[...modes]} />
    {#if textOn}
      <Field label="Text" kind="text" bind:value={p.text_string} maxlength={40} />
      <Field label="Font" kind="select" bind:value={p.font_choice} options={fonts} />
      {#if p.font_choice === "upload"}
        <div class="drop">
          <Icon name="upload" size={20} />
          <label class="t-label" for="label-font-file">
            {p.font_data ? p.font_name : "Choose a .ttf, .otf or .woff file"}
          </label>
          <input
            id="label-font-file"
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
  </ParamGroup>

  <ParamGroup name="Symbol" summary={symbolSummary}>
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
            void readSvg(event.dataTransfer?.files[0]);
          }}
        >
          <Icon name="upload" size={20} />
          <label class="t-label" for="label-svg-file">
            {editor.labelSvgName && !editor.labelSvgError
              ? editor.labelSvgName
              : "Drop an SVG file or choose one"}
          </label>
          <input
            id="label-svg-file"
            type="file"
            accept=".svg,image/svg+xml"
            onchange={(event) => void readSvg(event.currentTarget.files?.[0])}
          />
        </div>
        {#if editor.labelSvgError}
          <p class="t-caption error" role="alert">{editor.labelSvgError}</p>
        {/if}
        <p class="t-caption">
          Filled shapes only. The file is read at 96 dpi (1 px = 0.265 mm), then scaled.
          It is saved inside the model file. Use only graphics you may print.
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
  </ParamGroup>

  {#if anyRaisedOrEngraved || anyFlush || editor.warnings.length > 0}
    <ParamGroup name="Depth" summary={anyFlush ? "flush" : "raised, engraved"}>
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
  {/if}

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
          <Switch label="Centre the group on the label" bind:checked={p.label_center} />
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
    <Field label="Label" kind="color" bind:value={p.plate_color} />
    {#if textOn}<Field label="Text" kind="color" bind:value={p.text_color} />{/if}
    {#if symbolOn}
      <Field
        label="Symbol"
        kind="color"
        bind:value={p.symbol_color}
        hint="Black until you choose a colour."
      />
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
