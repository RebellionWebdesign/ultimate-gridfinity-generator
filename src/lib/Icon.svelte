<script lang="ts">
  import { icons, type IconName } from "./icons";

  let { name, size = 20 }: { name: IconName; size?: 16 | 20 | 24 } = $props();
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -- bundled Lucide SVG, not user input -->
<span class="icon s{size}" aria-hidden="true">{@html icons[name]}</span>

<style>
  .icon {
    display: inline-flex;
    flex: none;
  }
  .icon :global(svg) {
    width: 100%;
    height: 100%;
  }
  .s16 {
    width: var(--size-icon-sm);
    height: var(--size-icon-sm);
  }
  .s20 {
    width: var(--size-icon);
    height: var(--size-icon);
  }
  .s24 {
    width: 24px;
    height: 24px;
  }
</style>
