<script lang="ts">
  import { CONNECTOR_VARIANTS, variantOf } from "../gridfinity/connector";
  import Field from "./Field.svelte";
  import ParamGroup from "./ParamGroup.svelte";
  import Segmented from "./Segmented.svelte";
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
