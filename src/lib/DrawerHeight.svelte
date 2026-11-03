<script lang="ts">
  import { DRAWER_HEIGHT_MAX } from "../geometry/drawer";
  import NumberField from "./NumberField.svelte";
  import { editor } from "./store.svelte";
</script>

<NumberField
  label="Drawer height"
  bind:value={editor.drawerHeight}
  min={0}
  max={DRAWER_HEIGHT_MAX}
  step={1}
  def={0}
  unit="mm"
  why="0 switches it off; 1000 mm is the largest drawer"
/>
<p class="t-caption">
  0 switches it off. Bins and lids cannot be taller than the drawer; a taller one is
  lowered to fit.
</p>
