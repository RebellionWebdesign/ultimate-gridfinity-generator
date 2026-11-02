<script lang="ts">
  let {
    label,
    hint = "",
    checked = $bindable(),
    onchange,
  }: {
    label: string;
    hint?: string;
    checked: boolean;
    onchange?: () => void;
  } = $props();
  const id = `sw-${Math.random().toString(36).slice(2, 8)}`;
</script>

<div class="wrap">
  <div class="row">
    <label class="t-label" for={id}>{label}</label>
    <input {id} type="checkbox" role="switch" bind:checked {onchange} />
  </div>
  {#if hint}<p class="t-caption">{hint}</p>{/if}
</div>

<style>
  .wrap {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: var(--size-control);
  }
  input {
    appearance: none;
    width: 40px;
    height: 24px;
    margin: 0;
    border-radius: var(--radius-round);
    background: var(--line-strong);
    position: relative;
    cursor: pointer;
    transition: background var(--dur-state) var(--ease);
  }
  input::after {
    content: "";
    position: absolute;
    top: var(--space-0);
    left: var(--space-0);
    width: 20px;
    height: 20px;
    border-radius: var(--radius-round);
    background: var(--seg-on);
    box-shadow: var(--shadow-seg);
    transition: transform var(--dur-move) var(--ease);
  }
  input:checked {
    background: var(--accent);
  }
  input:checked::after {
    transform: translateX(16px);
  }
</style>
