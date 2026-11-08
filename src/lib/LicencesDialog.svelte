<script lang="ts">
  import ibmPlexLicence from "../fonts/LICENSE-IBM-Plex.txt?raw";
  import interLicence from "../fonts/LICENSE-Inter.txt?raw";
  import Icon from "./Icon.svelte";

  let { open = $bindable() }: { open: boolean } = $props();
  let dialog: HTMLDialogElement;

  // Keep in step with the table in skills/licences-and-credits/SKILL.md.
  const components = [
    {
      name: "Inter (font)",
      licence: "SIL OFL 1.1",
      url: "https://github.com/rsms/inter",
    },
    {
      name: "IBM Plex Mono, IBM Plex Sans (fonts)",
      licence: "SIL OFL 1.1",
      url: "https://github.com/IBM/plex",
    },
    {
      name: "Manifold (geometry)",
      licence: "Apache-2.0",
      url: "https://github.com/elalish/manifold",
    },
    {
      name: "opentype.js (text outlines)",
      licence: "MIT",
      url: "https://github.com/opentypejs/opentype.js",
    },
    {
      name: "three.js (preview)",
      licence: "MIT",
      url: "https://github.com/mrdoob/three.js",
    },
    {
      name: "Svelte (interface)",
      licence: "MIT",
      url: "https://github.com/sveltejs/svelte",
    },
    {
      name: "Lucide (icons)",
      licence: "ISC; icons derived from Feather: MIT",
      url: "https://github.com/lucide-icons/lucide",
    },
    {
      name: "Octicons (the GitHub mark on the landing page)",
      licence: "MIT; the logo itself is GitHub's trademark",
      url: "https://github.com/primer/octicons",
    },
    {
      name: "Gridfinity (the standard)",
      licence: "MIT, Zack Freedman and Voidstar Lab LLC",
      url: "https://gridfinity.xyz/specification/",
    },
  ];

  const texts = [
    { name: "Inter", text: interLicence },
    { name: "IBM Plex", text: ibmPlexLicence },
  ];

  $effect(() => {
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  });
</script>

<dialog bind:this={dialog} aria-labelledby="oss-title" onclose={() => (open = false)}>
  <header>
    <h2 id="oss-title" class="t-heading">OSS Licenses</h2>
    <button type="button" aria-label="Close" onclick={() => (open = false)}>
      <Icon name="x" />
    </button>
  </header>
  <p class="t-caption">
    Everything below ships with the app and works offline. The links go to the official
    sources.
  </p>
  <table>
    <thead>
      <tr
        ><th scope="col">Component</th><th scope="col">Licence</th><th scope="col"
          >Source</th
        ></tr
      >
    </thead>
    <tbody>
      {#each components as item (item.name)}
        <tr>
          <th scope="row">{item.name}</th>
          <td>{item.licence}</td>
          <td
            ><a href={item.url} target="_blank" rel="noopener"
              >{item.url.replace("https://", "")}</a
            ></td
          >
        </tr>
      {/each}
    </tbody>
  </table>
  <h3 class="t-strong">Font licence texts</h3>
  {#each texts as item (item.name)}
    <details>
      <summary>{item.name}</summary>
      <pre class="n-s">{item.text}</pre>
    </details>
  {/each}
</dialog>

<style>
  dialog {
    width: min(720px, calc(100% - var(--space-7)));
    max-height: calc(100dvh - var(--space-9));
    padding: var(--space-6);
    border: 0;
    border-radius: var(--radius-panel);
    background: var(--surface);
    color: var(--text);
    box-shadow: var(--shadow-float);
  }
  dialog::backdrop {
    background: var(--scrim);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-3);
  }
  .t-heading {
    font-size: 20px;
    line-height: 28px;
    font-weight: 600;
  }
  header button {
    width: var(--size-control);
    height: var(--size-control);
    border: 0;
    background: none;
    border-radius: var(--radius-control);
    cursor: pointer;
  }
  table {
    width: 100%;
    margin: var(--space-4) 0;
    border-collapse: collapse;
  }
  th,
  td {
    padding: var(--space-2) var(--space-2) var(--space-2) 0;
    border-top: 1px solid var(--line);
    text-align: left;
    vertical-align: top;
    overflow-wrap: anywhere;
  }
  thead th {
    border-top: 0;
    color: var(--text-3);
    font-weight: 500;
  }
  tbody th {
    font-weight: 500;
  }
  a {
    color: var(--accent);
  }
  pre {
    white-space: pre-wrap;
    color: var(--text-2);
  }
  details {
    margin-top: var(--space-2);
  }
</style>
