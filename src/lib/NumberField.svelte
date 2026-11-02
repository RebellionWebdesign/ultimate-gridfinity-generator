<script lang="ts">
  import Icon from "./Icon.svelte";
  import NonSpecTag from "./NonSpecTag.svelte";

  interface Props {
    label: string;
    value: number;
    /** minimum (the spec value; nothing below it can be entered) */
    min: number;
    max: number;
    step: number;
    /** default when it is above the minimum */
    def?: number;
    unit?: string;
    nonSpec?: boolean;
    /** why the limit is what it is, for the tooltip */
    why?: string;
    minWhy?: string;
    /** "min" wording: spec minimum or only the first value */
    signed?: boolean;
    onchange?: (value: number) => void;
  }

  let {
    label,
    value = $bindable(),
    min,
    max,
    step,
    def = min,
    unit = "",
    nonSpec = false,
    why = "",
    minWhy = "",
    signed = false,
    onchange,
  }: Props = $props();

  const id = `nf-${Math.random().toString(36).slice(2, 8)}`;
  const decimals = $derived(Math.max(0, -Math.floor(Math.log10(step) + 1e-9)));
  const fmt = (v: number) => v.toFixed(decimals);

  let text = $state("");
  let editing = $state(false);
  let note = $state("");
  let invalid = $state(false);

  const shown = $derived(editing ? text : fmt(value));

  const set = (next: number) => {
    value = next;
    onchange?.(next);
  };

  const commit = () => {
    editing = false;
    const parsed = Number(text.trim().replace(",", "."));
    if (text.trim() === "" || !Number.isFinite(parsed)) {
      invalid = true;
      note = `Enter a number between ${fmt(min)} and ${fmt(max)}.`;
      return;
    }
    invalid = false;
    const snapped = Math.round((parsed - min) / step) * step + min;
    const rounded = Number(snapped.toFixed(decimals));
    if (rounded < min) {
      note = signed
        ? ""
        : `Raised to ${fmt(min)} ${unit}, the minimum. ${minWhy || "Smaller breaks the Gridfinity fit."}`;
      set(min);
    } else if (rounded > max) {
      note = `Lowered to ${fmt(max)} ${unit}, the limit. ${why}`;
      set(max);
    } else {
      note = "";
      set(rounded);
    }
  };

  const bump = (direction: 1 | -1, times = 1) => {
    invalid = false;
    note = "";
    const next = Number((value + direction * step * times).toFixed(decimals));
    set(Math.min(max, Math.max(min, next)));
  };

  const onkey = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      commit();
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      bump(event.key === "ArrowUp" ? 1 : -1, event.shiftKey ? 10 : 1);
      editing = false;
    }
  };

  const percent = $derived(max === min ? 0 : ((value - min) / (max - min)) * 100);
</script>

<div class="field">
  <div class="row">
    <label class="t-label" for={id}>{label}</label>
    {#if nonSpec}<NonSpecTag />{/if}
    {#if value !== def}
      <button
        class="reset n-s"
        type="button"
        onclick={() => ((note = ""), (invalid = false), set(def))}
      >
        <Icon name="rotate-ccw" size={16} />{fmt(def)}
      </button>
    {/if}
  </div>
  <div class="controls">
    <div class="stepper" class:invalid>
      <button
        type="button"
        aria-label="Decrease {label}"
        title={value <= min
          ? `${fmt(min)} ${unit} is the minimum${minWhy ? ` (${minWhy})` : ""}`
          : ""}
        disabled={value <= min}
        onclick={() => bump(-1)}><Icon name="minus" size={16} /></button
      >
      <input
        {id}
        class="n"
        inputmode="decimal"
        value={shown}
        aria-invalid={invalid}
        onfocus={() => {
          editing = true;
          text = fmt(value);
        }}
        oninput={(event) => (text = event.currentTarget.value)}
        onblur={() => editing && commit()}
        onkeydown={onkey}
      />
      {#if unit}<span class="unit n-s">{unit}</span>{/if}
      <button
        type="button"
        aria-label="Increase {label}"
        title={value >= max
          ? `${fmt(max)} ${unit} is the limit${why ? ` (${why})` : ""}`
          : ""}
        disabled={value >= max}
        onclick={() => bump(1)}><Icon name="plus" size={16} /></button
      >
    </div>
    <div class="rail-wrap">
      <input
        class="rail"
        type="range"
        {min}
        {max}
        {step}
        {value}
        aria-label="{label} slider"
        style:--fill="{percent}%"
        oninput={(event) => {
          note = "";
          invalid = false;
          set(Number(event.currentTarget.value));
        }}
      />
      <div class="scale n-s">
        <span>{fmt(min)} {signed ? "" : "min"}</span>
        {#if def !== min}<span>default {fmt(def)}</span>{/if}
        <span>{fmt(max)} limit</span>
      </div>
    </div>
  </div>
  {#if invalid}
    <p class="msg error" role="alert">{note}</p>
  {:else if note}
    <p class="msg">{note}</p>
  {/if}
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  .row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: var(--size-icon);
  }
  .reset {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    border: 0;
    background: none;
    color: var(--text-3);
    cursor: pointer;
    padding: 0;
  }
  .controls {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--space-3);
    align-items: start;
  }
  .stepper {
    display: flex;
    align-items: center;
    height: var(--size-control);
    background: var(--surface-2);
    border: 1px solid transparent;
    border-radius: var(--radius-control);
    padding: 0 var(--space-0);
  }
  .stepper.invalid {
    border-color: var(--error);
  }
  .stepper button {
    flex: none;
    width: var(--size-control-sm);
    height: var(--size-control-sm);
    display: grid;
    place-items: center;
    border: 0;
    background: none;
    border-radius: calc(var(--radius-control) - var(--space-0));
    cursor: pointer;
    transition: transform var(--dur-press) var(--ease);
  }
  .stepper button:active:not(:disabled) {
    transform: scale(0.92);
  }
  .stepper button:disabled {
    color: var(--text-3);
    opacity: 0.5;
    cursor: not-allowed;
  }
  .stepper input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: none;
    text-align: right;
    padding: 0 var(--space-1);
  }
  .unit {
    color: var(--text-3);
    padding-right: var(--space-1);
  }
  .rail-wrap {
    padding-top: var(--space-1);
  }
  .rail {
    width: 100%;
    margin: 0;
    height: var(--space-4);
    appearance: none;
    background: transparent;
    cursor: pointer;
  }
  .rail::-webkit-slider-runnable-track {
    height: var(--space-1);
    border-radius: var(--radius-round);
    background: linear-gradient(
      to right,
      var(--accent) var(--fill),
      var(--line-strong) var(--fill)
    );
  }
  .rail::-moz-range-track {
    height: var(--space-1);
    border-radius: var(--radius-round);
    background: var(--line-strong);
  }
  .rail::-moz-range-progress {
    height: var(--space-1);
    border-radius: var(--radius-round);
    background: var(--accent);
  }
  .rail::-webkit-slider-thumb {
    appearance: none;
    width: var(--space-4);
    height: var(--space-4);
    margin-top: -6px;
    border-radius: var(--radius-round);
    background: var(--seg-on);
    border: 1px solid var(--line-strong);
    box-shadow: var(--shadow-seg);
  }
  .rail::-moz-range-thumb {
    width: var(--space-4);
    height: var(--space-4);
    border-radius: var(--radius-round);
    background: var(--seg-on);
    border: 1px solid var(--line-strong);
    box-shadow: var(--shadow-seg);
  }
  .scale {
    display: flex;
    justify-content: space-between;
    gap: var(--space-1);
    font-size: 11px;
    color: var(--text-3);
  }
  .msg {
    font-size: 12px;
    line-height: 16px;
    color: var(--text-3);
  }
  .msg.error {
    color: var(--error);
  }
  @media (pointer: coarse) {
    .stepper,
    .stepper button {
      height: var(--size-touch);
    }
    .stepper button {
      width: var(--size-touch);
    }
  }
</style>
