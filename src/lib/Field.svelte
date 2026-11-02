<script lang="ts">
  // Select, text field and colour field share one wrapper style (.field, 36 px).
  type Option = { value: string; label: string };

  let {
    label,
    kind,
    value = $bindable(),
    options = [],
    hint = "",
    maxlength,
  }: {
    label: string;
    kind: "select" | "text" | "color";
    value: string;
    options?: Option[];
    hint?: string;
    maxlength?: number;
  } = $props();

  const id = `fd-${Math.random().toString(36).slice(2, 8)}`;
  const PRESETS = ["#2b2c29", "#e8e8e2", "#b5473b", "#2f5d8c"];

  let hex = $derived(value);
  const hexValid = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);
</script>

<div class="wrap">
  <label class="t-label" for={id}>{label}</label>
  {#if kind === "select"}
    <select {id} bind:value>
      {#each options as option (option.value)}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
  {:else if kind === "text"}
    <input {id} type="text" {maxlength} bind:value />
  {:else}
    <div class="color">
      <input
        class="picker"
        type="color"
        aria-label="{label} colour picker"
        {value}
        oninput={(event) => (value = event.currentTarget.value.toUpperCase())}
      />
      <input
        {id}
        class="n hex"
        type="text"
        maxlength="7"
        bind:value={hex}
        aria-invalid={!hexValid(hex)}
        onblur={() => (hex = value)}
        oninput={() => hexValid(hex) && (value = hex.toUpperCase())}
      />
      {#each PRESETS as preset (preset)}
        <button
          type="button"
          class="swatch"
          aria-label="Use {preset}"
          style:background={preset}
          onclick={() => (value = preset.toUpperCase())}
        ></button>
      {/each}
    </div>
  {/if}
  {#if hint}<p class="t-caption">{hint}</p>{/if}
</div>

<style>
  .wrap {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  select,
  input[type="text"] {
    height: var(--size-control);
    padding: 0 var(--space-3);
    border: 1px solid transparent;
    border-radius: var(--radius-control);
    background: var(--surface-2);
    width: 100%;
  }
  select:hover,
  input[type="text"]:hover {
    background: var(--surface-3);
  }
  .color {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .picker {
    width: var(--size-control);
    height: var(--size-control);
    padding: 0;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-tag);
    background: none;
    cursor: pointer;
  }
  .hex {
    width: 96px;
    flex: none;
  }
  .swatch {
    width: var(--size-icon);
    height: var(--size-icon);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-tag);
    cursor: pointer;
    padding: 0;
  }
  @media (pointer: coarse) {
    select,
    input[type="text"],
    .picker {
      height: var(--size-touch);
    }
  }
</style>
