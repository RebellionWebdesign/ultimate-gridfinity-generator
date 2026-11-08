<script lang="ts">
  import { editor } from "./store.svelte";

  let dialog: HTMLDialogElement;

  // the first visit asks by itself; later the "In this browser" panel can ask again
  const wanted = $derived(editor.consent === "unset" || editor.consentOpen);

  $effect(() => {
    if (wanted && dialog && !dialog.open) dialog.showModal();
    if (!wanted && dialog?.open) dialog.close();
  });

  const answer = (yes: boolean) => {
    if (yes) editor.allowSaving();
    else if (editor.consent !== "no") editor.declineSaving();
    editor.consentOpen = false;
  };
</script>

<!-- Escape counts as "No thanks": the choice is made, nothing is saved -->
<dialog
  bind:this={dialog}
  class="confirm"
  aria-labelledby="consent-title"
  oncancel={(event) => {
    event.preventDefault();
    answer(false);
  }}
>
  <h2 id="consent-title" class="t-strong">Save in this browser?</h2>
  <p class="t-caption">
    The editor can keep your models in this browser (local storage) so they are still
    there after you reload, and it can store the app's own files so it works offline.
    Nothing is sent to a server. You can switch this off at any time under "In this
    browser"; that also removes the saved models. Without it, use Save file to keep a
    model.
  </p>
  <p class="t-caption">
    <a href="./datenschutz.html" target="_blank" rel="noopener">Privacy statement</a>
  </p>
  <div class="actions">
    <button type="button" class="primary" onclick={() => answer(true)}>Allow</button>
    <button type="button" onclick={() => answer(false)}>No thanks</button>
  </div>
</dialog>

<style>
  .confirm {
    width: min(100% - var(--space-7), 400px);
    padding: var(--space-5);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-panel);
    background: var(--surface);
    color: var(--text);
    box-shadow: var(--shadow-float);
  }
  .confirm::backdrop {
    background: var(--scrim);
  }
  .confirm[open] {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  a {
    color: var(--text);
    text-underline-offset: 2px;
  }
  .actions {
    display: flex;
    gap: var(--space-2);
  }
  .actions button {
    flex: 1;
    height: var(--size-button);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-control);
    background: var(--surface);
    color: inherit;
    cursor: pointer;
  }
  .actions .primary {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--accent-ink);
  }
</style>
