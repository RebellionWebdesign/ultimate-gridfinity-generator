<script lang="ts">
  import { onMount } from "svelte";
  import {
    AmbientLight,
    BufferAttribute,
    BufferGeometry,
    Color,
    DirectionalLight,
    EdgesGeometry,
    Group,
    LineBasicMaterial,
    LineSegments,
    Mesh,
    MeshStandardMaterial,
    PerspectiveCamera,
    Quaternion,
    Scene,
    Vector3,
    WebGLRenderer,
  } from "three";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
  import type { ModelMesh, PartName } from "../geometry/model";
  import Icon from "./Icon.svelte";

  type View = "iso" | "top" | "front" | "under";

  let {
    model,
    colours,
    units,
    dimmed = false,
    theme,
  }: {
    model: ModelMesh | null;
    colours: Record<PartName, string>;
    units: [number, number];
    dimmed?: boolean;
    theme: string;
  } = $props();

  let canvas: HTMLCanvasElement;
  let host: HTMLDivElement;
  let view = $state<View>("iso");
  let showGrid = $state(true);
  let showColours = $state(true);

  let renderer: WebGLRenderer;
  let camera: PerspectiveCamera;
  let controls: OrbitControls;
  const scene = new Scene();
  const partsGroup = new Group();
  const gridGroup = new Group();
  scene.add(partsGroup, gridGroup);

  const css = (name: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  let frame = 0;
  const draw = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => renderer?.render(scene, camera));
  };

  const DIRECTIONS: Record<View, [number, number, number, number]> = {
    iso: [1, -1.1, 0.9, 1],
    top: [0, -0.0001, 1, 1],
    front: [0, -1, 0.0001, 1],
    under: [0, -0.0001, -1, 1],
  };

  const radius = () => {
    const [x, y, z] = model?.size ?? [41.5, 41.5, 7];
    return Math.hypot(x, y, z) / 2;
  };

  const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  let animation = 0;

  /** Eases the camera to a view in 240 ms; at once with reduced motion (ui-spec 3.2). */
  const setView = (next: View, animate = true) => {
    view = next;
    const [dx, dy, dz] = DIRECTIONS[next];
    const distance = (radius() / Math.sin((camera.fov * Math.PI) / 360)) * 1.15;
    const target = new Vector3(0, 0, model ? model.size[2] / 2 : 3.5);
    const direction = new Vector3(dx, dy, dz).normalize();
    cancelAnimationFrame(animation);

    if (!animate || reducedMotion()) {
      controls.target.copy(target);
      camera.position.copy(direction.multiplyScalar(distance).add(target));
      controls.update();
      draw();
      return;
    }
    const fromTarget = controls.target.clone();
    const offset = camera.position.clone().sub(fromTarget);
    const fromDistance = offset.length();
    const fromDirection = offset.normalize();
    const turn = new Quaternion().setFromUnitVectors(fromDirection, direction);
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 240);
      const eased = 1 - (1 - t) ** 3;
      const rotation = new Quaternion().slerp(turn, eased);
      const here = fromDirection.clone().applyQuaternion(rotation);
      const length = fromDistance + (distance - fromDistance) * eased;
      controls.target.lerpVectors(fromTarget, target, eased);
      camera.position.copy(here.multiplyScalar(length).add(controls.target));
      controls.update();
      draw();
      if (t < 1) animation = requestAnimationFrame(step);
    };
    animation = requestAnimationFrame(step);
  };

  const fit = () => setView(view);

  const rebuild = () => {
    for (const child of [...partsGroup.children]) {
      partsGroup.remove(child);
      child.traverse((o) => {
        if (o instanceof Mesh || o instanceof LineSegments) {
          o.geometry.dispose();
          (o.material as MeshStandardMaterial).dispose();
        }
      });
    }
    if (!model) return;
    for (const part of model.parts) {
      const geometry = new BufferGeometry();
      geometry.setAttribute("position", new BufferAttribute(part.positions, 3));
      geometry.setIndex(new BufferAttribute(part.indices, 1));
      const flat = geometry.toNonIndexed();
      flat.computeVertexNormals();
      const colour = showColours ? colours[part.name] : "#9da39a";
      const mesh = new Mesh(
        flat,
        new MeshStandardMaterial({
          color: new Color(colour),
          roughness: 0.7,
          // push the faces back, so the outline on a pocket's lower edge is not hidden
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1,
        }),
      );
      const edges = new LineSegments(
        new EdgesGeometry(geometry, 35),
        new LineBasicMaterial({ color: css("--part-edge") || "#000000" }),
      );
      partsGroup.add(mesh, edges);
      geometry.dispose();
    }
    draw();
  };

  const rebuildGrid = () => {
    for (const child of [...gridGroup.children]) {
      gridGroup.remove(child);
      (child as LineSegments).geometry.dispose();
    }
    if (!showGrid) return draw();
    const [nx, ny] = units;
    const span = Math.max(nx, ny) + 3;
    const points: number[] = [];
    for (let k = -span; k <= span; k++) {
      const x = -nx * 21 + 42 * k;
      const y = -ny * 21 + 42 * k;
      points.push(x, -ny * 21 - span * 42, -0.05, x, -ny * 21 + span * 42, -0.05);
      points.push(-nx * 21 - span * 42, y, -0.05, -nx * 21 + span * 42, y, -0.05);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new BufferAttribute(Float32Array.from(points), 3),
    );
    gridGroup.add(
      new LineSegments(
        geometry,
        new LineBasicMaterial({ color: css("--stage-grid") || "#dadad3" }),
      ),
    );
    draw();
  };

  onMount(() => {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    camera = new PerspectiveCamera(35, 1, 1, 5000);
    camera.up.set(0, 0, 1);
    scene.add(new AmbientLight(0xffffff, 1.4));
    const sun = new DirectionalLight(0xffffff, 2.2);
    sun.position.set(80, -120, 200);
    scene.add(sun);
    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = false;
    controls.addEventListener("change", draw);
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = host;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      // setSize clears the canvas: draw in the same frame, or the preview flashes
      renderer.render(scene, camera);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    setView("iso", false);
    return () => {
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
    };
  });

  let first = true;
  $effect(() => {
    // read everything the scene depends on, so the effect re-runs when it changes
    const deps = [model, showColours, colours.plate, colours.lip, colours.text];
    deps.push(colours.symbol, theme);
    if (!renderer || deps.length === 0) return;
    rebuild();
    if (first && model) {
      first = false;
      setView("iso", false);
    }
  });
  $effect(() => {
    const deps = [showGrid, units[0], units[1], theme];
    if (renderer && deps.length > 0) rebuildGrid();
  });

  const views: { id: View; label: string }[] = [
    { id: "iso", label: "Iso" },
    { id: "top", label: "Top" },
    { id: "front", label: "Front" },
    { id: "under", label: "Under" },
  ];

  const onkey = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    if (
      ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName) ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    const index = Number(event.key) - 1;
    if (event.key === "f") fit();
    else if (event.key === "g") showGrid = !showGrid;
    else if (event.key === "c") showColours = !showColours;
    else if (views[index]) setView(views[index].id);
  };
</script>

<svelte:window onkeydown={onkey} />

<div class="stage" bind:this={host}>
  <canvas
    bind:this={canvas}
    class:dimmed
    aria-label="3D preview of the lid"
    ondblclick={fit}
  ></canvas>
  <div class="toolbar" role="toolbar" aria-label="Preview">
    <button
      type="button"
      class="icon"
      aria-label="Fit to view (F)"
      title="Fit to view (F)"
      onclick={fit}
    >
      <Icon name="maximize" />
    </button>
    <span class="sep"></span>
    {#each views as v, i (v.id)}
      <button
        type="button"
        class:on={view === v.id}
        aria-pressed={view === v.id}
        title="{v.label} ({i + 1})"
        onclick={() => setView(v.id)}
      >
        {v.label}
      </button>
    {/each}
    <span class="sep"></span>
    <button
      type="button"
      class="icon"
      class:on={showGrid}
      aria-pressed={showGrid}
      aria-label="Floor grid (G)"
      title="Floor grid (G)"
      onclick={() => (showGrid = !showGrid)}
    >
      <Icon name="grid-2x2" />
    </button>
    <button
      type="button"
      class="icon"
      class:on={showColours}
      aria-pressed={showColours}
      aria-label="Part colours (C)"
      title="Part colours (C)"
      onclick={() => (showColours = !showColours)}
    >
      <Icon name="palette" />
    </button>
  </div>
  <p class="hint t-caption">Drag to orbit · Shift-drag to pan · scroll to zoom</p>
</div>

<style>
  .stage {
    position: relative;
    width: 100%;
    height: 100%;
    background: var(--stage);
    overflow: hidden;
  }
  canvas {
    width: 100%;
    height: 100%;
    display: block;
    transition: opacity var(--dur-preview) var(--ease);
  }
  canvas.dimmed {
    opacity: 0.45;
  }
  .toolbar {
    position: absolute;
    bottom: var(--space-4);
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1);
    background: var(--surface);
    border-radius: var(--radius-panel);
    box-shadow: var(--shadow-float);
  }
  .toolbar button {
    height: var(--size-control);
    min-width: var(--size-control);
    padding: 0 var(--space-3);
    border: 0;
    border-radius: var(--radius-control);
    background: none;
    cursor: pointer;
    display: grid;
    place-items: center;
  }
  .toolbar button.icon {
    padding: 0;
  }
  .toolbar button.on {
    background: var(--surface-2);
  }
  .sep {
    width: 1px;
    height: var(--space-5);
    background: var(--line);
    margin: 0 var(--space-1);
  }
  .hint {
    position: absolute;
    right: var(--space-4);
    bottom: var(--space-4);
  }
  @media (max-width: 1199px) {
    .hint {
      display: none;
    }
  }
  @media (pointer: coarse) {
    .toolbar button {
      height: var(--size-touch);
      min-width: var(--size-touch);
    }
  }
</style>
