<script lang="ts">
  import { CONNECTOR_VARIANTS, variantOf } from "../gridfinity/connector";
  import { CONNECTOR_COPIES, edgeCells } from "../model/connectorParams";
  import Field from "./Field.svelte";
  import NumberField from "./NumberField.svelte";
  import ParamGroup from "./ParamGroup.svelte";
  import Segmented from "./Segmented.svelte";
  import Switch from "./Switch.svelte";
  import { mmText } from "./parts";
  import { editor } from "./store.svelte";

  const p = editor.connector;
  const variant = $derived(variantOf(p.variant));
  const widths = $derived(variant ? variant.connector.map(([x]) => x) : [0]);
  const heights = $derived(variant ? variant.connector.map(([, z]) => z) : [0]);
  const sizeSummary = $derived(
    variant
      ? `${mmText(Math.max(...widths) - Math.min(...widths))} × ${mmText(variant.connectorLength)} × ${mmText(Math.max(...heights))} mm`
      : "",
  );
</script>

<div class="panel">
  <ParamGroup name="Connector" summary={variant?.name ?? ""}>
    <Segmented
      label="Variant"
      bind:value={p.variant}
      options={CONNECTOR_VARIANTS.map((v) => ({ value: v.id, label: v.name }))}
    />
    <p class="t-caption">
      Joins two baseplates that have the slots of the same variant ("Connectable" in the
      baseplate). Size {sizeSummary}. The slot is {mmText(variant?.slotLength ?? 0)} mm long,
      the connector {mmText(variant?.connectorLength ?? 0)} mm. Print it with the flat side
      down; you need one for every pair of slots you want to join.
    </p>
  </ParamGroup>

  <ParamGroup name="How many" summary={String(editor.connectorCopies)}>
    <Switch
      label="One for every edge cell of the baseplate"
      bind:checked={p.copies_auto}
      hint="A connector is plugged onto two baseplates that lie side by side, one for every cell at the edge, on every side: 2 × (width + depth) of the baseplate."
    />
    {#if p.copies_auto}
      <p class="t-caption">
        Baseplate {editor.baseplate.units_x} × {editor.baseplate.units_y}: {edgeCells(
          editor.baseplate.units_x,
          editor.baseplate.units_y,
        )} connectors.
      </p>
    {:else}
      <NumberField
        label="Connectors"
        bind:value={p.copies}
        min={CONNECTOR_COPIES.min}
        max={CONNECTOR_COPIES.max}
        step={1}
        def={1}
        why="200 is the most in one file"
      />
    {/if}
    <p class="t-caption">
      They lie in rows on the bed, 3 mm apart, as many in a row as fit the bed.
    </p>
  </ParamGroup>

  <ParamGroup name="Colours" open={false} summary={p.plate_color}>
    <Field label="Connector" kind="color" bind:value={p.plate_color} />
  </ParamGroup>
</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
  }
</style>
