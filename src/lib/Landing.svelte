<script lang="ts">
  import { onMount } from "svelte";
  import HeroAnimation from "./HeroAnimation.svelte";
  import Icon from "./Icon.svelte";
  import PartDemo from "./PartDemo.svelte";
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
  /** how far the hero animation has come; the words beside it appear with it */
  let stage = $state(0);

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
  /** a baseplate has no tolerance: n cells are n x 42 mm */
  const side = $derived(cells * 42);
  /** the visitor sizes the bed themselves: a plain square, no printer model */
  let bed = $state(256);
  const fits = $derived(side <= bed);
  const BED_PX = 104;
  const scale = $derived(BED_PX / bed);

  type Drawing =
    "base" | "bin" | "lid" | "drawer" | "split" | "height" | "colours" | "connectors";
  interface Feature {
    title: string;
    text: string;
    tag?: string;
    drawing: Drawing;
  }
  const features: Feature[] = [
    {
      title: "Base",
      drawing: "base",
      text: "Solid or skeleton, as many cells as you need, with corner and centre magnets.",
    },
    {
      title: "Bin",
      drawing: "bin",
      text: "Height in 7 mm units, with or without a stacking lip. Corner and centre magnets and a hollow foot.",
    },
    {
      title: "Lid",
      drawing: "lid",
      text: "A dust cover or stackable, with a merged or per-cell foot, magnets, hollow foot, text and symbol.",
    },
    {
      title: "Fill a drawer",
      drawing: "drawer",
      text: "Enter the width and depth of your drawer, up to 1 m. The base is padded solid where whole cells do not fill it.",
    },
    {
      title: "Split to fit your bed",
      drawing: "split",
      text: "A base larger than your print bed is cut into pieces that each fit, between the cells. All pieces go into one 3MF.",
    },
    {
      title: "Height that fits",
      drawing: "height",
      text: "Give the height of the drawer, and bins and lids stay as tall as fits, never taller.",
    },
    {
      title: "Exportable colours",
      drawing: "colours",
      text: "Plate, lip, text and symbol stay separate parts with their own colour in one 3MF, so your slicer can give each one a filament.",
    },
    {
      title: "Base connectors",
      drawing: "connectors",
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
    </nav>
    <button
      type="button"
      class="ghost"
      onclick={() => theme.toggle()}
      aria-label={theme.label}
      title={theme.label}
    >
      <Icon name={theme.icon} />
    </button>
    <a class="primary" href="#/editor">Open editor</a>
  </div>
</header>

<main id="main">
  <section class="hero">
    <div class="hero-bg"><HeroAnimation bind:stage /></div>
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
    </div>
    <p class="n-s hero-caption">
      <span class="visually-hidden">
        3 × 2 base · four bins · two lids · every part its own colour in one 3MF
      </span>
      <span aria-hidden="true" class="words">
        <span class="w" class:on={stage >= 1}>3 × 2 base</span>
        <span class="w" class:on={stage >= 2}> · four bins</span>
        <span class="w" class:on={stage >= 3}> · two lids</span>
        <span class="w" class:on={stage >= 4}>
          · every part its own colour in one 3MF</span
        >
      </span>
    </p>
  </section>

  <section class="band">
    <div class="wrap">
      <h2 class="t-title">What it makes</h2>
      <p class="t-lead sub">
        Base, bin and lid share the same controls: size in cells, foot, magnets,
        colours. The drawer ties them together.
      </p>
      <ul class="features">
        {#each features as f (f.title)}
          <li>
            <svg
              class="draw"
              viewBox="0 0 72 48"
              width="120"
              height="80"
              fill="none"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linejoin="round"
              stroke-linecap="round"
              aria-hidden="true"
            >
              {#if f.drawing === "lid"}
                <g class="lift">
                  <path d="M36 12 66 25 36 38 6 25Z M6 25v4l30 13 30-13v-4M36 38v4" />
                </g>
              {:else if f.drawing === "bin"}
                <g class="lift">
                  <path
                    d="M36 3 62 14 36 25 10 14Z M10 14v20l26 11 26-11V14M36 25v20"
                  />
                </g>
              {:else if f.drawing === "base"}
                <g class="lift">
                  <path
                    d="M36 12 66 25 36 38 6 25Z M6 25v4l30 13 30-13v-4M36 38v4M21 18.5l30 13M51 18.5l-30 13"
                  />
                </g>
              {:else if f.drawing === "drawer"}
                <path class="dash" d="M36 5 69 19.5 36 34 3 19.5Z" />
                <g class="lift">
                  <path d="M26 15 46 24 31 31 11 22Z M11 22v3l20 9 15-7v-3M31 31v4" />
                </g>
                <path class="fill" d="M50 22.5l9-4M52 26l9-4M54 29.5l9-4" />
              {:else if f.drawing === "split"}
                <g class="piece-a">
                  <path d="M36 12 66 25 51 31.5 21 18.5Z M66 25v4l-15 6.5v-4" />
                </g>
                <g class="piece-b">
                  <path
                    d="M21 18.5 51 31.5 36 38 6 25Z M6 25v4l30 13 15-6.5v-4M36 38v4"
                  />
                </g>
              {:else if f.drawing === "height"}
                <g class="lift">
                  <path d="M28 5 50 15 28 25 6 15Z M6 15v18l22 10 22-10V15M28 25v18" />
                </g>
                <g class="arrow">
                  <path d="M64 8v32M60 12l4-4 4 4M60 36l4 4 4-4" />
                </g>
              {:else if f.drawing === "colours"}
                <g class="top">
                  <path d="M36 3 62 14 36 25 10 14Z M10 14v3l26 11 26-11v-3" />
                </g>
                <g class="mid">
                  <path d="M10 23v3l26 11 26-11v-3M10 23l26 11 26-11" />
                </g>
                <g class="low">
                  <path d="M10 32v3l26 11 26-11v-3M10 32l26 11 26-11" />
                </g>
              {:else if f.drawing === "connectors"}
                <g class="piece-a">
                  <path d="M20 13 36 20 20 27 4 20Z M4 20v4l16 7 16-7v-4" />
                  <ellipse cx="30" cy="20" rx="3.5" ry="1.7" />
                </g>
                <g class="piece-b">
                  <path d="M52 21 68 28 52 35 36 28Z M36 28v4l16 7 16-7v-4" />
                  <ellipse class="dash" cx="42" cy="28" rx="3.5" ry="1.7" />
                </g>
              {/if}
            </svg>
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
            <PartDemo kind="base" hue="var(--accent)" {cells} />
            <label class="demo-head" for="cells">
              <span class="t-label">Size</span>
              <span class="n-s">{cells} × {cells} cells</span>
            </label>
            <input
              id="cells"
              class="range"
              type="range"
              min="1"
              max="7"
              step="1"
              bind:value={cells}
              style="--share: {((cells - 1) / 6) * 100}%"
            />
          </div>
        </li>
        <li>
          <span class="num n-s">02</span>
          <h3 class="t-heading">Check</h3>
          <p>
            The outer size is shown in millimetres, and the part is checked against your
            bed before you export. Size the bed to match your printer.
          </p>
          <div class="well-box">
            <span class="pill n-s">{side} × {side} × 5.05 mm</span>
            <svg
              class="bed"
              viewBox="0 0 {BED_PX + 24} {BED_PX + 24}"
              role="img"
              aria-label="Your bed as a square grid, and the part on it"
            >
              <rect class="bed-plate" x="12" y="12" width={BED_PX} height={BED_PX} />
              {#each Array.from({ length: Math.floor(bed / 42) }, (_, k) => k + 1) as k (k)}
                <path
                  class="bed-grid"
                  d="M{12 + k * 42 * scale} 12v{BED_PX}M12 {12 +
                    k * 42 * scale}h{BED_PX}"
                />
              {/each}
              <rect
                class="bed-part"
                class:bad={!fits}
                x="12"
                y={12 + BED_PX - side * scale}
                width={side * scale}
                height={side * scale}
              />
            </svg>
            <p class="verdict" class:bad={!fits} role="status">
              <Icon name={fits ? "check" : "triangle-alert"} size={16} />
              {fits ? "Fits your bed" : "Too big: split it"}
            </p>
            <span class="t-label">Your bed</span>
            <div class="stepper">
              <button
                type="button"
                aria-label="Smaller bed"
                disabled={bed <= 100}
                onclick={() => (bed -= 20)}
              >
                <Icon name="minus" />
              </button>
              <span class="n value" aria-live="polite">
                {bed} <span class="unit">mm</span>
              </span>
              <button
                type="button"
                aria-label="Larger bed"
                disabled={bed >= 400}
                onclick={() => (bed += 20)}
              >
                <Icon name="plus" />
              </button>
            </div>
          </div>
        </li>
        <li>
          <span class="num n-s">03</span>
          <h3 class="t-heading">Print</h3>
          <p>
            Download STL, or 3MF with plate, text and symbol as separate coloured
            objects. Save the model as a file to change it later.
          </p>
          <div class="well-box">
            <PartDemo printing hue="var(--accent)" />
            <div class="print-row">
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
              <a class="primary" href="#/editor"
                ><Icon name="download" size={16} />Save</a
              >
            </div>
          </div>
        </li>
      </ol>
    </div>
  </section>

  <section id="spec" class="band">
    <div class="wrap">
      <div class="spec-card">
        <div class="spec-top">
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
          <div class="spec-side">
            <h2 class="t-title">Made to the spec</h2>
            <p class="t-lead">
              Every default is the Gridfinity value, and it is also the smallest you can
              set. You can go larger, up to a limit where the part still fits together.
            </p>
            <p class="try" class:done={touched}>
              {touched
                ? "That is how every setting behaves: the spec value is the floor."
                : "Try it: drag the slider and watch the pocket and the table below follow."}
            </p>
            <div class="sample">
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
                <span>{mmText(POCKET.min)} min</span><span
                  >{mmText(POCKET.max)} limit</span
                >
              </div>
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
    </div>
  </section>

  <section class="surface">
    <div class="wrap">
      <h2 class="t-title">No cloud needed.</h2>
      <p class="t-lead sub">
        Everything runs on your device. Nothing to sign up for, nothing to upload; the
        model, the geometry and the files stay with you.
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
        <li>
          <span class="tile accent">
            <!-- the GitHub mark (Octicons mark-github, MIT licence) -->
            <svg
              viewBox="0 0 16 16"
              width="24"
              height="24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
              />
            </svg>
          </span>
          <h3 class="t-heading">Free and open source</h3>
          <p>The code is public. Read it, check it, report a bug, or build on it.</p>
          <div class="chips">
            <a class="primary" href={REPO_URL} target="_blank" rel="noopener">
              View on GitHub
            </a>
          </div>
        </li>
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
        <button type="button" onclick={() => (licences = true)}>Licenses</button>
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
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 680px;
    overflow: hidden;
    padding: var(--space-9) 0 var(--space-8);
  }
  /* the animation runs behind the text, large, with no frame */
  .hero-bg {
    position: absolute;
    top: 50%;
    right: max(calc((100% - 1160px) / 2 + 48px), 48px);
    width: min(740px, 70vw);
    transform: translateY(-50%);
    pointer-events: none;
  }
  .hero-grid {
    position: relative;
    z-index: 1;
  }
  .hero-text {
    max-width: 480px;
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
  /* turned 90 degrees to the left, so it reads from the right, beside the animation */
  .hero-caption {
    position: absolute;
    z-index: 1;
    top: 50%;
    right: max(calc((100% - 1160px) / 2), var(--space-5));
    margin: 0;
    color: var(--text-2);
    white-space: nowrap;
    writing-mode: vertical-rl;
    transform: translateY(-50%) rotate(180deg);
  }
  .hero-caption .w {
    opacity: 0;
    transition: opacity 450ms ease-out;
  }
  .hero-caption .w.on {
    opacity: 1;
  }
  @media (prefers-reduced-motion: reduce) {
    .hero-caption .w {
      transition: none;
    }
  }

  /* what it makes */
  .features {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
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
    padding: var(--space-7) var(--space-6);
    background: var(--bg);
  }
  .features li:nth-child(4n + 1) {
    padding-left: 0;
  }
  .features li:nth-child(4n) {
    padding-right: 0;
  }
  .draw {
    width: 120px;
    height: 80px;
    margin-bottom: var(--space-2);
    overflow: visible;
    color: var(--text);
    transition: color 200ms ease-out;
  }
  .draw .dash {
    stroke: var(--text-3);
    stroke-dasharray: 3 3;
  }
  .draw .fill {
    stroke: var(--text-3);
  }
  .draw g {
    transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .features li:hover .draw {
    color: var(--accent);
  }
  /* a little motion, not too much: parts lift, move apart or come together */
  @media (prefers-reduced-motion: no-preference) {
    .features li:hover .lift {
      transform: translateY(-3px);
    }
    .features li:hover .piece-a {
      transform: translate(3px, -2px);
    }
    .features li:hover .piece-b {
      transform: translate(-3px, 2px);
    }
    .features li:hover .arrow {
      transform: scaleY(1.1);
      transform-origin: 64px 24px;
    }
    .features li:hover .top {
      transform: translateY(-4px);
    }
    .features li:hover .low {
      transform: translateY(4px);
    }
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
    border: 1px solid var(--accent);
    border-radius: var(--radius-tag);
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 12px;
    line-height: 18px;
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
  .seg {
    width: 144px;
  }
  .demo-head {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }
  .print-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    width: 100%;
  }
  .bed {
    align-self: center;
    width: 128px;
    height: 128px;
  }
  .bed-plate {
    fill: var(--surface);
    stroke: var(--line-strong);
    stroke-width: 1;
  }
  .bed-grid {
    fill: none;
    stroke: var(--line);
    stroke-width: 0.6;
  }
  .bed-part {
    fill: var(--accent-soft);
    stroke: var(--accent);
    stroke-width: 1.2;
  }
  .bed-part.bad {
    fill: color-mix(in srgb, var(--error) 18%, transparent);
    stroke: var(--error);
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

  /* spec: one box, the picture beside the text and the slider, the table below */
  .spec-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    padding: var(--space-8);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-panel);
    background: var(--surface);
  }
  .spec-top {
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr);
    gap: var(--space-8);
    align-items: center;
  }
  .spec-side .t-lead {
    margin-top: var(--space-3);
  }
  .try {
    margin-top: var(--space-4);
    color: var(--accent);
    font-size: 14px;
    line-height: 22px;
    font-weight: 500;
  }
  .try.done {
    color: var(--text-2);
  }
  .sample {
    margin-top: var(--space-5);
    padding: var(--space-4);
    max-width: 480px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-control);
    background: var(--bg);
  }
  .spec-card .table {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: var(--space-8);
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
    grid-template-columns: repeat(4, minmax(0, 1fr));
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
  .tile.accent {
    border-color: var(--accent);
    color: var(--accent);
  }
  .chip {
    padding: var(--space-1) var(--space-3);
    border: 1px solid var(--accent);
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
    .hero-caption {
      position: relative;
      top: auto;
      right: auto;
      width: 100%;
      max-width: calc(1160px + 2 * var(--space-7));
      margin: var(--space-6) auto 0;
      padding: 0 var(--space-4);
      writing-mode: horizontal-tb;
      transform: none;
      white-space: normal;
    }
    .hero-bg {
      right: 50%;
      width: 130%;
      opacity: 0.35;
      transform: translate(50%, -50%);
    }
    .spec-top,
    .spec-card .table {
      grid-template-columns: 1fr;
    }
    .spec-top .cell {
      max-width: 280px;
    }
    .steps {
      grid-template-columns: 1fr;
    }
    .features,
    .facts {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .features li,
    .features li:nth-child(n) {
      padding: var(--space-6) var(--space-5);
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
    .features,
    .facts {
      grid-template-columns: 1fr;
    }
    .features li,
    .features li:nth-child(n) {
      padding: var(--space-6) 0;
    }
    .spec-card {
      padding: var(--space-5);
    }
  }
</style>
