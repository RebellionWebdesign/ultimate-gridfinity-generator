<script lang="ts" generics="T extends string">
  interface Option {
    value: T;
    label: string;
    /** disabled option: shown with a small note, for example "Later" */
    note?: string;
    disabled?: boolean;
    title?: string;
  }

  let {
    label,
    options,
    value = $bindable(),
    hideLabel = false,
    onchange,
  }: {
    label: string;
    options: Option[];
    value: T;
    hideLabel?: boolean;
    onchange?: (value: T) => void;
  } = $props();

  const pick = (next: T) => {
    value = next;
    onchange?.(next);
  };

  const onkey = (event: KeyboardEvent) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const enabled = options.filter((o) => !o.disabled);
    const at = enabled.findIndex((o) => o.value === value);
    const next = enabled[(at + step + enabled.length) % enabled.length];
    if (next) pick(next.value);
  };
</script>

<div class="wrap">
  <span class="t-label" class:visually-hidden={hideLabel} id="seg-{label}">{label}</span
  >
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div class="seg" role="group" aria-labelledby="seg-{label}" onkeydown={onkey}>
    {#each options as option (option.value)}
      <button
        type="button"
        aria-pressed={value === option.value}
        disabled={option.disabled}
        title={option.title}
        class:on={value === option.value}
        onclick={() => pick(option.value)}
      >
        {option.label}{#if option.note}<span class="note">{option.note}</span>{/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .wrap {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .seg {
    display: flex;
    gap: var(--space-0);
    padding: var(--space-0);
    background: var(--surface-2);
    border-radius: var(--radius-control);
  }
  button {
    flex: 1;
    height: calc(var(--size-control) - 2 * var(--space-0));
    border: 0;
    background: none;
    border-radius: calc(var(--radius-control) - var(--space-0));
    cursor: pointer;
    color: var(--text-2);
    transition: background var(--dur-state) var(--ease);
  }
  button.on {
    background: var(--seg-on);
    color: var(--text);
    box-shadow: var(--shadow-seg);
  }
  button:disabled {
    cursor: not-allowed;
    color: var(--text-3);
  }
  .note {
    margin-left: var(--space-1);
    font-family: var(--font-num);
    font-size: 11px;
  }
  @media (pointer: coarse) {
    button {
      height: var(--size-touch);
    }
  }
</style>
