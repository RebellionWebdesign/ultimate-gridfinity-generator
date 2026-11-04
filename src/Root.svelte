<script lang="ts">
  import Landing from "./lib/Landing.svelte";

  // Two screens, told apart by the address: `#/editor` is the editor, anything else the
  // landing page (so `#how` and `#spec` still scroll to their sections).
  const isEditor = () => location.hash === "#/editor";
  let editor = $state(isEditor());

  // the editor pulls in the geometry kernel and the preview; load it only when opened
  const loadEditor = () => import("./App.svelte");
</script>

<svelte:window onhashchange={() => (editor = isEditor())} />

{#if editor}
  {#await loadEditor() then { default: App }}
    <App />
  {/await}
{:else}
  <Landing />
{/if}
