<script lang="ts">
  import { DRAWER_CLEARANCE, DRAWER_HEIGHT_MAX } from "../geometry/drawer";
  import NumberField from "./NumberField.svelte";
  import Switch from "./Switch.svelte";
  import { mmText } from "./parts";
  import { editor } from "./store.svelte";

  // The option is on while the drawer height is above 0 (that is what the model file keeps).
  let enabled = $state(editor.drawerHeight > 0);
  let remembered = 100;
  $effect(() => {
    enabled = editor.drawerHeight > 0;
    if (editor.drawerHeight > 0) remembered = editor.drawerHeight;
  });
  const toggle = () => {
    editor.drawerHeight = enabled ? remembered : 0;
  };

  const d = $derived(editor.drawer);
</script>

<Switch
  label="Limit the height to the drawer"
  bind:checked={enabled}
  onchange={toggle}
  hint="This limits the maximum height of the bins: base, bin and lid together must fit the drawer, with {DRAWER_CLEARANCE} mm of room above so that nothing rubs."
/>
{#if enabled}
  <NumberField
    label="Drawer height"
    bind:value={editor.drawerHeight}
    min={10}
    max={DRAWER_HEIGHT_MAX}
    step={1}
    def={100}
    unit="mm"
    why="1000 mm is the largest drawer"
    minWhy="A drawer lower than this holds no bin"
  />
  <p class="t-caption" class:over={!d.fits}>
    Base {mmText(d.base)} + bin {mmText(d.bin)} + lid {mmText(d.lid)} = {mmText(
      d.total,
    )} mm of {mmText(d.limit)} mm (drawer minus {DRAWER_CLEARANCE} mm).
  </p>
{/if}

<style>
  .over {
    color: var(--error);
  }
</style>
