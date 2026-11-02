<script lang="ts">
  import type { Snippet } from "svelte";
  import Icon from "./Icon.svelte";

  let {
    name,
    summary = "",
    open = $bindable(false),
    children,
  }: {
    name: string;
    summary?: string;
    open?: boolean;
    children: Snippet;
  } = $props();

  const id = `pg-${Math.random().toString(36).slice(2, 8)}`;
</script>

<section class="group">
  <h3>
    <button
      type="button"
      aria-expanded={open}
      aria-controls={id}
      onclick={() => (open = !open)}
    >
      <span class="chev" class:open><Icon name="chevron-right" size={16} /></span>
      <span class="t-strong">{name}</span>
      {#if !open && summary}<span class="summary n-s">{summary}</span>{/if}
    </button>
  </h3>
  {#if open}
    <div class="body" {id}>{@render children()}</div>
  {/if}
</section>

<style>
  .group {
    border-bottom: 1px solid var(--line);
  }
  h3 {
    font-size: inherit;
  }
  button {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    min-height: var(--size-row);
    padding: 0 var(--space-5);
    border: 0;
    background: none;
    cursor: pointer;
    text-align: left;
  }
  .chev {
    display: inline-flex;
    transition: transform var(--dur-move) var(--ease);
  }
  .chev.open {
    transform: rotate(90deg);
  }
  .t-strong {
    flex: none;
    white-space: nowrap;
  }
  .summary {
    min-width: 0;
    margin-left: auto;
    color: var(--text-3);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .body {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-1) var(--space-5) var(--space-6);
  }
</style>
