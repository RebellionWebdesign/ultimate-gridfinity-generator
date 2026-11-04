<script lang="ts">
  import { onMount } from "svelte";
  import HeroAnimation from "./HeroAnimation.svelte";
  import Icon from "./Icon.svelte";
  import LicencesDialog from "./LicencesDialog.svelte";
  import Segmented from "./Segmented.svelte";
  import { CONSTANTS } from "../gridfinity/constants";
  import { BASEPLATE_LIMITS } from "../model/baseplateParams";
  import { mmText } from "./parts";
  import { theme } from "./theme.svelte";

  const SPEC_URL = "https://www.printables.com/model/417152-gridfinity-specification";
  const REPO_URL =
    "https://github.com/RebellionWebdesign/ultimate-gridfinity-generator";

  let licences = $state(false);

  $effect(() => {
    document.documentElement.dataset.theme = theme.value;
  });

  // a link like `#how` scrolls to its section, also when the page was just mounted
  onMount(() => {
    const id = location.hash.slice(1);
    if (id && !id.startsWith("/")) document.getElementById(id)?.scrollIntoView();
  });

  // "How it works": a small working copy of the controls
  let cells = $state(2);
  let format = $state<"3mf" | "stl">("3mf");
  const side = $derived(cells * 42 - 0.5);
  const fits = $derived(side <= 256);

  interface Feature {
    title: string;
    text: string;
    tag?: string;
    drawing?: "base" | "bin" | "lid";
    icon?: "layout-grid" | "palette" | "puzzle";
  }
  const features: Feature[] = [
    {
      title: "Base",
      drawing: "base",
      text: "Solid or skeleton, as many cells as you need. Corner and centre magnets, padded to fit a drawer, split to fit your print bed.",
    },
    {
      title: "Bin",
      drawing: "bin",
      text: "Height in 7 mm units, with or without a stacking lip. Corner and centre magnets and a hollow foot.",
    },
    {
      title: "Lid",
      drawing: "lid",
      text: "A dust cover or stackable, with a merged or per-cell foot, corner and centre magnets, hollow foot, text and symbol.",
    },
    {
      title: "Fill a drawer",
      icon: "layout-grid",
      text: "Enter the width and depth of your drawer. The base is padded solid where whole cells do not fill it, and bins and lids stay at the height that fits.",
    },
    {
      title: "Exportable colours",
      icon: "palette",
      text: "Plate, lip, text and symbol stay separate parts with their own colour in one 3MF, so your slicer can give each one a filament.",
    },
    {
      title: "Base connectors",
      icon: "puzzle",
      tag: "Soon",
      text: "Studs and sockets in the solid segments of a padded or split base, so the pieces click together.",
    },
  ];

  // "Made to the spec": the slider moves the magnet pocket; the rows it changes light up
  const c = (name: keyof typeof CONSTANTS): number => CONSTANTS[name].value;
  const POCKET = BASEPLATE_LIMITS.corner_magnet_d;
  const EDGE = c("footBottomEdgeInset");
  const HOLE = c("holeCentreFromFootEdge");
  const OUTER = c("grid") - c("binTolerance");
  const HOLE_AT = c("grid") / 2 - c("holeSpacing") / 2;
  const FOOT_EDGE = (c("grid") - (OUTER - 2 * EDGE)) / 2;
  let pocket = $state<number>(POCKET.min);
  let touched = $state(false);
  const pocketShare = $derived(
    ((pocket - POCKET.min) / (POCKET.max - POCKET.min)) * 100,
  );
  const specRows = $derived([
    { name: "Grid", value: `${mmText(c("grid"))} mm` },
    { name: "Height unit", value: `${mmText(c("heightUnit"))} mm` },
    {
      name: "Outer size",
      value: `n × ${mmText(c("grid"))} − ${mmText(c("binTolerance"))} mm`,
    },
    { name: "Foot height", value: `${mmText(c("footHeight"))} mm` },
    { name: "Stacking lip", value: `${mmText(c("lipHeight"))} mm` },
    {
      name: "Magnet pocket",
      value: `${mmText(pocket)} Ø × ${mmText(c("magnetPocketDepth"))} mm`,
      live: true,
    },
    {
      name: "Wall at the foot edge",
      value: `${mmText(HOLE - pocket / 2)} mm`,
      live: true,
    },
    { name: "Screw hole", value: `${c("screwHoleDiameter").toFixed(1)} Ø mm` },
  ]);

  const facts = [
    {
      icon: "laptop",
      title: "Computed on your device",
      text: "The geometry runs in your browser. No server sees your parts.",
      chips: ["WebAssembly", "Web Worker", "0 bytes uploaded"],
    },
    {
      icon: "wifi-off",
      title: "Works offline",
      text: "After the first visit. Chrome and Edge can install it as an app.",
      chips: ["Installable", "No account"],
    },
    {
      icon: "file",
      title: "Files you keep",
      text: "Save a model as a .json file and open it again later, on any device.",
      chips: [".json", ".stl", ".3mf"],
    },
  ] as const;
</script>

<a class="skip-link" href="#main">Skip to content</a>

<header class="bar">
  <div class="wrap bar-row">
    <a class="brand" href="#/" aria-label="Ultimate Gridfinity Generator">
      <svg viewBox="0 0 40 40" width="28" height="28" aria-hidden="true" fill="none">
        <rect
          x="3"
          y="3"
          width="34"
          height="34"
          rx="8"
          stroke="currentColor"
          stroke-width="3"
        />
        <path d="M20 3v34M3 20h34" stroke="currentColor" stroke-width="3" />
        <rect
          x="20"
          y="3"
          width="17"
          height="17"
          rx="8"
          fill="var(--accent)"
          stroke="currentColor"
          stroke-width="3"
        />
      </svg>
      <span class="t-strong">Ultimate Gridfinity Generator</span>
    </a>
    <nav aria-label="Page">
      <a href="#how">How it works</a>
      <a href="#spec">The spec</a>
      <button type="button" onclick={() => (licences = true)}>OSS Licenses</button>
    </nav>
    <button
      type="button"
      class="ghost"
      onclick={() => theme.toggle()}
      aria-label="Switch to {theme.value === 'dark' ? 'light' : 'dark'} theme"
    >
      <Icon name={theme.value === "dark" ? "sun" : "moon"} />
    </button>
    <a class="primary" href="#/editor">Open editor</a>
  </div>
</header>

<main id="main">
  <section class="hero">
    <div class="wrap hero-grid">
      <div class="hero-text">
        <h1 class="t-display">Gridfinity parts, generated in your browser.</h1>
        <p class="t-lead">
          Set the size in cells, add magnets, a label and a symbol, and download a
          print-ready STL or 3MF. The geometry is computed on your device; nothing is
          uploaded.
        </p>
        <div class="cta">
          <a class="primary large" href="#/editor">
            Open the editor <Icon name="arrow-right" />
          </a>
          <a class="quiet" href="#how">How it works</a>
        </div>
        <p class="n-s note">No account · nothing uploaded · works offline</p>
      </div>
      <figure class="hero-figure">
        <div class="frame"><HeroAnimation /></div>
        <figcaption class="n-s">
          3 × 2 base · four bins · two lids · every part its own colour in one 3MF
        </figcaption>
      </figure>
    </div>
  </section>

  <section class="band">
    <div class="wrap">
      <h2 class="t-title">What it makes</h2>
      <p class="t-lead sub">
        Base, bin and lid share the same controls: size in cells, foot, magnets,
        colours.
      </p>
      <ul class="features">
        {#each features as f (f.title)}
          <li>
            <svg
              class="draw"
              viewBox="0 0 72 48"
              width="72"
              height="48"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linejoin="round"
              stroke-linecap="round"
              aria-hidden="true"
              class:hidden={!f.drawing}
            >
              {#if f.drawing === "lid"}
                <path d="M36 12 66 25 36 38 6 25Z M6 25v4l30 13 30-13v-4M36 38v4" />
              {:else if f.drawing === "bin"}
                <path d="M36 3 62 14 36 25 10 14Z M10 14v20l26 11 26-11V14M36 25v20" />
              {:else if f.drawing === "base"}
                <path
                  d="M36 12 66 25 36 38 6 25Z M6 25v4l30 13 30-13v-4M36 38v4M21 18.5l30 13M51 18.5l-30 13"
                />
              {/if}
            </svg>
            {#if f.icon}
              <span class="glyph"><Icon name={f.icon} size={24} /></span>
            {/if}
            <h3 class="t-heading">
              {f.title}{#if f.tag}<span class="tag">{f.tag}</span>{/if}
            </h3>
            <p>{f.text}</p>
          </li>
        {/each}
      </ul>
    </div>
  </section>

  <section id="how" class="surface">
    <div class="wrap">
      <h2 class="t-title">How it works</h2>
      <ol class="steps">
        <li>
          <span class="num n-s">01</span>
          <h3 class="t-heading">Set</h3>
          <p>
            Size in grid cells, then foot, lip, magnets and label. Each change shows up
            in the preview while you type.
          </p>
          <div class="well-box">
            <span class="t-label">Width</span>
            <div class="stepper">
              <button
                type="button"
                aria-label="Fewer cells"
                disabled={cells <= 1}
                onclick={() => cells--}
              >
                <Icon name="minus" />
              </button>
              <span class="n value" aria-live="polite">
                {cells} <span class="unit">cells</span>
              </span>
              <button
                type="button"
                aria-label="More cells"
                disabled={cells >= 8}
                onclick={() => cells++}
              >
                <Icon name="plus" />
              </button>
            </div>
          </div>
        </li>
        <li>
          <span class="num n-s">02</span>
          <h3 class="t-heading">Check</h3>
          <p>
            The outer size is shown in millimetres, and the part is checked against your
            printer's bed before you export.
          </p>
          <div class="well-box">
            <span class="pill n-s">{side} × {side} × 7.6 mm</span>
            <p class="verdict" class:bad={!fits} role="status">
              <Icon name={fits ? "check" : "triangle-alert"} size={16} />
              {fits ? "Fits the P2S bed" : "Too big for the P2S bed"}
            </p>
          </div>
        </li>
        <li>
          <span class="num n-s">03</span>
          <h3 class="t-heading">Print</h3>
          <p>
            Download STL, or 3MF with plate, text and symbol as separate coloured
            objects. Save the model as a file to change it later.
          </p>
          <div class="well-box row">
            <div class="seg">
              <Segmented
                label="Format"
                hideLabel
                bind:value={format}
                options={[
                  { value: "3mf", label: "3MF" },
                  { value: "stl", label: "STL" },
                ]}
              />
            </div>
            <a class="primary" href="#/editor"><Icon name="download" size={16} />Save</a
            >
          </div>
        </li>
      </ol>
    </div>
  </section>

  <section id="spec" class="band">
    <div class="wrap spec-grid">
      <div>
        <h2 class="t-title">Made to the spec</h2>
        <p class="t-lead sub">
          Every default is the Gridfinity value, and it is also the smallest you can
          set. You can go larger, up to a limit where the part still fits together.
        </p>
        <div class="sample">
          <svg
            class="cell"
            viewBox="0 0 {c('grid')} {c('grid')}"
            role="img"
            aria-label="Top view of one cell with its four magnet pockets"
          >
            <rect
              class="outer"
              x={c("binTolerance") / 2}
              y={c("binTolerance") / 2}
              width={OUTER}
              height={OUTER}
              rx={c("binCornerRadius")}
            />
            <rect
              class="foot"
              x={FOOT_EDGE}
              y={FOOT_EDGE}
              width={OUTER - 2 * EDGE}
              height={OUTER - 2 * EDGE}
              rx={c("footRadiusBottom")}
            />
            {#each [HOLE_AT, c("grid") - HOLE_AT] as x (x)}
              {#each [HOLE_AT, c("grid") - HOLE_AT] as y (y)}
                <circle class="pocket" cx={x} cy={y} r={pocket / 2} />
              {/each}
            {/each}
            <line
              class="wall"
              x1={FOOT_EDGE}
              y1={HOLE_AT}
              x2={HOLE_AT - pocket / 2}
              y2={HOLE_AT}
            />
          </svg>
          <label class="sample-head" for="pocket">
            <span class="t-label">Pocket diameter</span>
            <span class="n-s">{mmText(pocket)} mm</span>
          </label>
          <input
            id="pocket"
            class="range"
            type="range"
            min={POCKET.min}
            max={POCKET.max}
            step={POCKET.step}
            bind:value={pocket}
            oninput={() => (touched = true)}
            style="--share: {pocketShare}%"
          />
          <div class="scale">
            <span>{mmText(POCKET.min)} min</span><span>{mmText(POCKET.max)} limit</span>
          </div>
        </div>
      </div>
      <dl class="table">
        {#each specRows as row (row.name)}
          <div class:live={touched && row.live}>
            <dt>{row.name}</dt>
            <dd class="n">{row.value}</dd>
          </div>
        {/each}
      </dl>
    </div>
  </section>

  <section class="surface">
    <div class="wrap">
      <h2 class="t-title">Yours, on your device</h2>
      <p class="t-lead sub">
        Nothing to sign up for, nothing to upload. The model, the geometry and the files
        stay with you.
      </p>
      <ul class="facts">
        {#each facts as f (f.title)}
          <li>
            <span class="tile"><Icon name={f.icon} size={24} /></span>
            <h3 class="t-heading">{f.title}</h3>
            <p>{f.text}</p>
            <div class="chips">
              {#each f.chips as chip (chip)}<span class="chip n-s">{chip}</span>{/each}
            </div>
          </li>
        {/each}
      </ul>
    </div>
  </section>

  <section class="closing">
    <div class="wrap closing-row">
      <h2 class="t-title">Start with a 1 × 1 lid. It takes a minute.</h2>
      <a class="primary large" href="#/editor">
        Open the editor <Icon name="arrow-right" />
      </a>
    </div>
  </section>
</main>

<footer>
  <div class="wrap">
    <p class="t-caption">
      Gridfinity was created by Zack Freedman (Voidstar Lab LLC). Ultimate Gridfinity
      Generator is licensed CC BY-NC-SA 4.0.
    </p>
    <div class="foot-row">
      <p class="t-caption">
        © 2026 Daniel Stauffer · The app has no account and uploads no parts.
      </p>
      <nav aria-label="Links">
        <a href={SPEC_URL} target="_blank" rel="noopener">Gridfinity specification</a>
        <button type="button" onclick={() => (licences = true)}>OSS Licenses</button>
        <a href={REPO_URL} target="_blank" rel="noopener">Source repository</a>
      </nav>
    </div>
  </div>
</footer>

<LicencesDialog bind:open={licences} />

<style>
  :global(html),
  :global(body) {
    height: auto;
    scroll-behavior: smooth;
  }
  @media (prefers-reduced-motion: reduce) {
    :global(html),
    :global(body) {
      scroll-behavior: auto;
    }
  }
  :global(html) {
    scroll-padding-top: var(--size-header);
  }

  .wrap {
    width: 100%;
    max-width: calc(1160px + 2 * var(--space-7));
    margin: 0 auto;
    padding: 0 var(--space-7);
  }

  /* typography of the landing page */
  .t-display {
    font-size: 56px;
    line-height: 60px;
    letter-spacing: -0.028em;
    font-weight: 600;
  }
  .t-title {
    font-size: 32px;
    line-height: 40px;
    letter-spacing: -0.02em;
    font-weight: 600;
  }
  .t-heading {
    font-size: 20px;
    line-height: 28px;
    letter-spacing: -0.01em;
    font-weight: 600;
  }
  .t-lead {
    font-size: 17px;
    line-height: 28px;
    color: var(--text-2);
  }

  /* buttons and links */
  a {
    color: inherit;
  }
  .primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    height: var(--size-control);
    padding: 0 var(--space-3);
    border-radius: var(--radius-control);
    background: var(--accent);
    color: var(--accent-ink);
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
    white-space: nowrap;
    transition: background var(--dur-state);
  }
  .primary:hover {
    background: var(--accent-hover);
  }
  .primary.large {
    height: var(--size-button-lg);
    padding: 0 var(--space-6);
    font-size: 14px;
  }
  .quiet {
    display: inline-flex;
    align-items: center;
    height: var(--size-button-lg);
    padding: 0 var(--space-4);
    border-radius: var(--radius-control);
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
  }
  .quiet:hover,
  .ghost:hover,
  nav a:hover,
  nav button:hover {
    background: var(--surface-2);
  }
  .ghost {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--size-control);
    height: var(--size-control);
    border: 0;
    border-radius: var(--radius-control);
    background: none;
    cursor: pointer;
  }

  /* header */
  .bar {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--bg);
    border-bottom: 1px solid var(--line);
  }
  .bar-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    height: var(--size-header);
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: var(--space-3);
    margin-right: auto;
    text-decoration: none;
    min-width: 0;
  }
  .brand span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .bar nav {
    display: flex;
    gap: var(--space-1);
    margin-right: var(--space-2);
  }
  nav a,
  nav button {
    display: inline-flex;
    align-items: center;
    height: var(--size-control);
    padding: 0 var(--space-3);
    border: 0;
    border-radius: var(--radius-control);
    background: none;
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
  }

  /* sections */
  section {
    border-bottom: 1px solid var(--line);
    padding: var(--space-9) 0;
  }
  .surface {
    background: var(--surface);
  }
  .sub {
    margin-top: var(--space-3);
    max-width: 640px;
  }

  .hero {
    padding: var(--space-9) 0 96px;
  }
  .hero-grid {
    display: grid;
    grid-template-columns: 1fr 1.15fr;
    gap: var(--space-8);
    align-items: center;
  }
  .hero-text .t-lead {
    margin-top: var(--space-6);
  }
  .cta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    margin-top: var(--space-7);
  }
  .note {
    margin-top: var(--space-6);
    color: var(--text-3);
  }
  .hero-figure {
    margin: 0;
  }
  .frame {
    padding: var(--space-6) var(--space-4) 0;
    border: 1px solid var(--line);
    border-radius: var(--radius-panel);
    background: var(--stage);
    overflow: hidden;
  }
  figcaption {
    margin-top: var(--space-3);
    color: var(--text-3);
  }

  /* what it makes */
  .features {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1px;
    margin: var(--space-8) 0 0;
    padding: 0;
    list-style: none;
    background: var(--line);
  }
  .features li {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-7);
    background: var(--bg);
  }
  .features li:nth-child(3n + 1) {
    padding-left: 0;
  }
  .features li:nth-child(3n) {
    padding-right: 0;
  }
  .features li:nth-child(n + 4) {
    padding-top: var(--space-7);
  }
  .draw {
    color: var(--text);
  }
  .draw.hidden {
    display: none;
  }
  .glyph {
    display: inline-flex;
    align-items: center;
    height: 48px;
    color: var(--text);
  }
  .features h3 {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .features p {
    color: var(--text-2);
  }
  .tag {
    padding: 0 var(--space-2);
    border-radius: var(--radius-tag);
    background: var(--surface-3);
    color: var(--text-2);
    font-size: 12px;
    line-height: 20px;
    font-weight: 500;
    letter-spacing: 0;
  }

  /* how it works */
  .steps {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-4);
    margin: var(--space-8) 0 0;
    padding: 0;
    list-style: none;
    counter-reset: step;
  }
  .steps li {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-6);
    border: 1px solid var(--line);
    border-radius: var(--radius-panel);
    background: var(--bg);
  }
  /* an arrow between the cards */
  .steps li:not(:last-child)::after {
    content: "";
    position: absolute;
    top: 50%;
    right: calc(-1 * var(--space-4) - 5px);
    width: 9px;
    height: 9px;
    border-top: 1.5px solid var(--line-strong);
    border-right: 1.5px solid var(--line-strong);
    transform: translateY(-50%) rotate(45deg);
    background: transparent;
  }
  .num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    align-self: flex-start;
    height: 24px;
    padding: 0 var(--space-2);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-round);
    color: var(--text-2);
  }
  .steps p {
    color: var(--text-2);
  }
  .well-box {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
    margin-top: auto;
    padding: var(--space-4);
    border-radius: var(--radius-control);
    background: var(--surface-2);
  }
  .well-box.row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }
  .seg {
    width: 144px;
  }
  .stepper {
    display: flex;
    align-items: center;
    width: 100%;
    max-width: 220px;
    height: var(--size-control);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-control);
    background: var(--surface);
  }
  .stepper button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--size-control);
    height: 100%;
    border: 0;
    background: none;
    cursor: pointer;
    color: var(--text-2);
  }
  .stepper button:hover:not(:disabled) {
    color: var(--text);
    background: var(--surface-2);
  }
  .stepper button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .stepper .value {
    flex: 1;
    text-align: right;
    padding-right: var(--space-2);
  }
  .unit {
    font-size: 11px;
    font-weight: 400;
    color: var(--text-3);
  }
  .pill {
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-round);
    border: 1px solid var(--line-strong);
    background: var(--surface);
  }
  .verdict {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-size: 12px;
    color: var(--success);
  }
  .verdict.bad {
    color: var(--error);
  }

  /* spec */
  .spec-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-8);
    align-items: start;
  }
  .sample {
    margin-top: var(--space-7);
    padding: var(--space-4);
    max-width: 320px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-control);
    background: var(--surface);
  }
  .cell {
    display: block;
    width: 100%;
    margin-bottom: var(--space-4);
    border-radius: var(--radius-control);
    background: var(--surface-2);
  }
  .cell .outer {
    fill: none;
    stroke: var(--line-strong);
    stroke-width: 0.3;
  }
  .cell .foot {
    fill: none;
    stroke: var(--text-3);
    stroke-width: 0.2;
    stroke-dasharray: 0.8 0.6;
  }
  .cell .pocket {
    fill: var(--accent-soft);
    stroke: var(--accent);
    stroke-width: 0.25;
  }
  .cell .wall {
    stroke: var(--text);
    stroke-width: 0.35;
  }
  .sample-head {
    display: flex;
    justify-content: space-between;
    color: var(--text-3);
  }
  .sample-head .t-label {
    color: var(--text);
  }
  .range {
    -webkit-appearance: none;
    appearance: none;
    display: block;
    width: 100%;
    height: 20px;
    margin: var(--space-2) 0 var(--space-1);
    background: none;
    cursor: pointer;
  }
  .range::-webkit-slider-runnable-track {
    height: 4px;
    border-radius: var(--radius-round);
    background: linear-gradient(
      to right,
      var(--accent) var(--share),
      var(--surface-3) var(--share)
    );
  }
  .range::-moz-range-track {
    height: 4px;
    border-radius: var(--radius-round);
    background: linear-gradient(
      to right,
      var(--accent) var(--share),
      var(--surface-3) var(--share)
    );
  }
  .range::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    margin-top: -6px;
    border-radius: 50%;
    border: 2px solid var(--accent);
    background: var(--surface);
  }
  .range::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid var(--accent);
    background: var(--surface);
  }
  .scale {
    display: flex;
    justify-content: space-between;
    font: 400 11px/16px var(--font-num);
    color: var(--text-3);
  }
  .table {
    margin: 0;
    border-top: 1px solid var(--line);
  }
  .table div {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: var(--size-row);
    border-bottom: 1px solid var(--line);
  }
  .table div.live {
    background: var(--accent-soft);
  }
  .table div {
    padding: 0 var(--space-2);
    margin: 0 calc(-1 * var(--space-2));
    transition: background var(--dur-state);
  }
  .table dt {
    color: var(--text-2);
  }
  .table dd {
    margin: 0;
  }

  /* facts */
  .facts {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-4);
    margin: var(--space-8) 0 0;
    padding: 0;
    list-style: none;
  }
  .facts > li {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-6);
    border: 1px solid var(--line);
    border-radius: var(--radius-panel);
    background: var(--bg);
  }
  .tile {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    align-self: flex-start;
    width: 48px;
    height: 48px;
    margin-bottom: var(--space-2);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-panel);
    background: var(--surface-2);
    color: var(--text);
  }
  .facts p {
    color: var(--text-2);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: auto;
    padding-top: var(--space-4);
    border-top: 1px solid var(--line);
  }
  .chip {
    padding: var(--space-1) var(--space-3);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-round);
    color: var(--text-2);
  }

  .closing-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-6);
  }

  footer {
    padding: var(--space-7) 0 var(--space-8);
  }
  footer .wrap {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .foot-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2) var(--space-6);
  }
  footer nav {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--space-1) var(--space-5);
    margin-left: auto;
  }
  footer nav a,
  footer nav button {
    height: auto;
    padding: 0;
    background: none;
    color: var(--text-2);
    font-size: 12px;
    line-height: 16px;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  footer nav a:hover,
  footer nav button:hover {
    background: none;
    color: var(--text);
  }

  @media (max-width: 960px) {
    .bar nav {
      display: none;
    }
    .hero-grid,
    .spec-grid {
      grid-template-columns: 1fr;
    }
    .features,
    .steps,
    .facts {
      grid-template-columns: 1fr;
    }
    .features li,
    .features li:nth-child(n) {
      padding: var(--space-6) 0;
    }
    .features li:first-child {
      padding-top: 0;
    }
    .steps li:not(:last-child)::after {
      display: none;
    }
    .closing-row {
      flex-direction: column;
      align-items: flex-start;
    }
  }
  @media (max-width: 720px) {
    .wrap {
      padding: 0 var(--space-4);
    }
    section {
      padding: var(--space-8) 0;
    }
    .hero {
      padding: var(--space-8) 0;
    }
    .t-display {
      font-size: 36px;
      line-height: 40px;
    }
    .t-title {
      font-size: 24px;
      line-height: 32px;
    }
    .foot-row {
      flex-direction: column;
      align-items: flex-start;
    }
    footer nav {
      margin-left: 0;
      justify-content: flex-start;
    }
  }
</style>
