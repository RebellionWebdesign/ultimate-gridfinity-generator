<script lang="ts">
  import { onMount } from "svelte";
  import {
    AmbientLight,
    BoxGeometry,
    BufferAttribute,
    BufferGeometry,
    CanvasTexture,
    Color,
    DirectionalLight,
    DoubleSide,
    EdgesGeometry,
    Group,
    LineBasicMaterial,
    LineLoop,
    LineSegments,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    NearestFilter,
    Path,
    PerspectiveCamera,
    Quaternion,
    RepeatWrapping,
    Scene,
    Shape,
    ShapeGeometry,
    SRGBColorSpace,
    Vector2,
    Vector3,
    WebGLRenderer,
  } from "three";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
  import type { LabelArea } from "../geometry/lid";
  import type { ModelMesh, PartName } from "../geometry/model";
  import { outwardOutline, plateOutline, type PlateShape } from "./plate";
  import Icon from "./Icon.svelte";
  import { PART_NAME, type PartType } from "./parts";
  import { editor } from "./store.svelte";

  // the part choice of the narrow layout (the switch in the top bar is hidden there)
  const partChoices: PartType[] = ["baseplate", "bin", "label", "connector", "lid"];
  let partMenu = $state(false);
  const choosePart = (part: PartType) => {
    editor.part = part;
    partMenu = false;
  };

  type View = "iso" | "top" | "front" | "under" | "right" | "back" | "left";

  let {
    model,
    colours,
    labelArea,
    bed,
    bedFits = true,
    units,
    drawer = null,
    dimmed = false,
    theme,
  }: {
    model: ModelMesh | null;
    colours: Record<PartName, string>;
    /** the plate area labels may use; the margin is drawn hatched when a label crosses it */
    labelArea?: LabelArea;
    /** the printable area of the chosen printer, drawn as the floor (none: plain grid) */
    bed?: { x: number; y: number; plate?: PlateShape };
    /** the part fits the bed (also turned by 90 degrees); when not, a red band runs around the bed */
    bedFits?: boolean;
    units: [number, number];
    /** the inside of the drawer in mm (width, depth, height; height 0: only the floor), drawn as a box */
    drawer?: { x: number; y: number; z: number } | null;
    dimmed?: boolean;
    theme: string;
  } = $props();

  let canvas: HTMLCanvasElement;
  let host: HTMLDivElement;
  let view = $state<View | "custom">("iso");
  let lastView: View | [number, number, number] = "iso";
  let showColours = $state(true);
  /** the floor is an endless canvas in the design of the bed instead of the bed of the printer */
  let endless = $state(false);
  // the drawer box appears: the view changes to the endless canvas by itself (once)
  let hadDrawer = false;
  $effect(() => {
    const has = drawer !== null;
    if (has && !hadDrawer) {
      endless = true;
      // bring the whole box into view
      if (camera) queueMicrotask(() => fit());
    }
    hadDrawer = has;
  });

  let renderer: WebGLRenderer;
  let camera: PerspectiveCamera;
  let controls: OrbitControls;
  const scene = new Scene();
  const partsGroup = new Group();
  const gridGroup = new Group();
  const bandGroup = new Group();
  const drawerGroup = new Group();
  scene.add(partsGroup, gridGroup, bandGroup, drawerGroup);

  const css = (name: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  let frame = 0;
  const draw = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      renderer?.render(scene, camera);
      turnCube();
    });
  };

  /**
   * The view cube: six faces, each a button that turns the camera to that side. Its faces
   * are placed with the rotation of the camera, so the cube shows how the model is seen.
   * `up` is the direction that is up on the face, `normal` points out of it.
   */
  const CUBE = 76;
  type Direction = [number, number, number];
  const cubeFaces: {
    id: View;
    label: string;
    normal: [number, number, number];
    up: [number, number, number];
  }[] = [
    { id: "front", label: "Front", normal: [0, -1, 0], up: [0, 0, 1] },
    { id: "back", label: "Back", normal: [0, 1, 0], up: [0, 0, 1] },
    { id: "right", label: "Right", normal: [1, 0, 0], up: [0, 0, 1] },
    { id: "left", label: "Left", normal: [-1, 0, 0], up: [0, 0, 1] },
    { id: "top", label: "Top", normal: [0, 0, 1], up: [0, 1, 0] },
    { id: "under", label: "Under", normal: [0, 0, -1], up: [0, -1, 0] },
  ];
  const faceElements: HTMLDivElement[] = [];

  /** "Front · Top" for a direction that is a face, an edge or a corner of the cube */
  const nameOf = (d: Direction) =>
    [
      d[0] > 0 ? "Right" : d[0] < 0 ? "Left" : "",
      d[1] > 0 ? "Back" : d[1] < 0 ? "Front" : "",
      d[2] > 0 ? "Top" : d[2] < 0 ? "Under" : "",
    ]
      .filter(Boolean)
      .join(" · ");

  /**
   * The 3 x 3 zones of a face: the middle is the face itself, the four zones along its sides
   * are the edges (a view from between two faces), the four corners are the corner views
   * (from between three). The same edge or corner lies on two or three faces: all of its
   * zones share the direction, and light up together.
   */
  const zonesOf = (face: (typeof cubeFaces)[number]) => {
    const normal = new Vector3(...face.normal);
    const up = new Vector3(...face.up);
    const right = up.clone().cross(normal);
    const zones: { key: string; dir: Direction; centre: boolean; name: string }[] = [];
    for (const b of [1, 0, -1]) {
      for (const a of [-1, 0, 1]) {
        const d = normal
          .clone()
          .add(right.clone().multiplyScalar(a))
          .add(up.clone().multiplyScalar(b));
        const dir: Direction = [d.x, d.y, d.z];
        zones.push({
          key: dir.join(","),
          dir,
          centre: a === 0 && b === 0,
          name: nameOf(dir),
        });
      }
    }
    return zones;
  };
  const cubeZones = cubeFaces.map(zonesOf);
  let hot = $state("");
  let cubeDragged = false;

  /** Drag on the cube turns the camera round the model, like a drag on the preview. */
  const cubeDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    cubeDragged = false;
    let x = event.clientX;
    let y = event.clientY;
    const move = (e: PointerEvent) => {
      const dx = e.clientX - x;
      const dy = e.clientY - y;
      if (
        !cubeDragged &&
        Math.hypot(e.clientX - event.clientX, e.clientY - event.clientY) < 4
      )
        return;
      cubeDragged = true;
      x = e.clientX;
      y = e.clientY;
      cancelAnimationFrame(animation);
      const offset = camera.position.clone().sub(controls.target);
      const r = offset.length();
      const theta = Math.atan2(offset.y, offset.x) - dx * 0.01;
      const phi = Math.min(
        Math.PI - 0.02,
        Math.max(0.02, Math.acos(offset.z / r) - dy * 0.01),
      );
      camera.position.set(
        controls.target.x + r * Math.sin(phi) * Math.cos(theta),
        controls.target.y + r * Math.sin(phi) * Math.sin(theta),
        controls.target.z + r * Math.cos(phi),
      );
      controls.update();
      draw();
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const zoneClick = (
    face: (typeof cubeFaces)[number],
    zone: { dir: Direction; centre: boolean },
  ) => {
    if (cubeDragged) return;
    setView(zone.centre ? face.id : zone.dir);
  };
  const turnCube = () => {
    if (!camera) return;
    camera.updateMatrixWorld();
    const view = camera.matrixWorldInverse;
    // world direction -> CSS direction of the cube (x right, y down, z towards the viewer)
    const css = (v: Vector3): Vector3 => {
      const c = v.clone().transformDirection(view);
      return new Vector3(c.x, -c.y, c.z);
    };
    cubeFaces.forEach((face, i) => {
      const element = faceElements[i];
      if (!element) return;
      const normal = new Vector3(...face.normal);
      const up = new Vector3(...face.up);
      const right = up.clone().cross(normal);
      const ex = css(right);
      const ey = css(up.clone().negate());
      const ez = css(normal);
      const t = ez.clone().multiplyScalar(CUBE / 2);
      element.style.transform = `matrix3d(${[
        ex.x,
        ex.y,
        ex.z,
        0,
        ey.x,
        ey.y,
        ey.z,
        0,
        ez.x,
        ez.y,
        ez.z,
        0,
        t.x,
        t.y,
        t.z,
        1,
      ].join(",")})`;
    });
  };

  const DIRECTIONS: Record<View, [number, number, number, number]> = {
    iso: [1, -1.1, 0.9, 1],
    top: [0, -0.0001, 1, 1],
    front: [0, -1, 0.0001, 1],
    under: [0, -0.0001, -1, 1],
    right: [1, 0, 0.0001, 1],
    back: [0, 1, 0.0001, 1],
    left: [-1, 0, 0.0001, 1],
  };

  /**
   * Radius of a sphere around the view target that holds everything shown: every vertex of
   * the model (the pieces of a split plate included) and the whole bed with its tabs. Seen
   * from any side, nothing leaves the viewport while the sphere fits.
   */
  const sceneRadius = () => {
    const z0 = model ? model.size[2] / 2 : 3.5;
    let r = model ? 0 : radius();
    for (const part of model?.parts ?? []) {
      const p = part.positions;
      for (let i = 0; i < p.length; i += 3) {
        r = Math.max(r, Math.hypot(p[i] ?? 0, p[i + 1] ?? 0, (p[i + 2] ?? 0) - z0));
      }
    }
    // the endless canvas zooms out as far as the bed does
    if (bed) r = Math.max(r, Math.hypot(bed.x / 2, bed.y / 2, z0) + 15);
    if (drawer) r = Math.max(r, Math.hypot(drawer.x / 2, drawer.y / 2, drawer.z) + 15);
    return r;
  };

  /** Distance at which a sphere of radius r fits the narrower side of the viewport. */
  const fitSphere = (r: number) => {
    const half = (camera.fov * Math.PI) / 360;
    const narrow = Math.min(half, Math.atan(Math.tan(half) * camera.aspect));
    return r / Math.sin(narrow);
  };

  /**
   * How far the camera may go: far enough that the whole scene fits with a margin all
   * around, so it does not hide behind the panels over the preview, but no farther, or the
   * scene shrinks to a speck.
   */
  const updateLimits = () => {
    controls.minDistance = 8;
    controls.maxDistance = fitSphere(sceneRadius()) * 1.4;
    camera.far = controls.maxDistance * 4;
    camera.updateProjectionMatrix();
    controls.update();
  };

  const radius = () => {
    const [x, y, z] = model?.size ?? [41.5, 41.5, 7];
    const inDrawer = drawer ? Math.hypot(drawer.x, drawer.y, drawer.z) / 2 : 0;
    return Math.max(Math.hypot(x, y, z) / 2, inDrawer);
  };

  const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  let animation = 0;

  /** Eases the camera to a view in 240 ms; at once with reduced motion (ui-spec 3.2). */
  const setView = (next: View | Direction, animate = true) => {
    // a name, or a direction from the view cube (an edge or a corner)
    lastView = next;
    view = typeof next === "string" ? next : "custom";
    const [dx, dy, dz] = typeof next === "string" ? DIRECTIONS[next] : next;
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

  const fit = () => setView(lastView);

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
    for (const part of [...model.parts, ...(model.extras ?? [])]) {
      const geometry = new BufferGeometry();
      geometry.setAttribute("position", new BufferAttribute(part.positions, 3));
      geometry.setIndex(new BufferAttribute(part.indices, 1));
      const flat = geometry.toNonIndexed();
      flat.computeVertexNormals();
      const colour = showColours
        ? (part.colour ?? colours[part.name])
        : part.colour
          ? "#c9cfc5"
          : "#9da39a";
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

  /** Rounded rectangle path, centred on the origin. */
  const roundedRect = (shape: Shape | Path, hw: number, hd: number, r: number) => {
    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.absarc(hw - r, -hd + r, r, -Math.PI / 2, 0, false);
    shape.lineTo(hw, hd - r);
    shape.absarc(hw - r, hd - r, r, 0, Math.PI / 2, false);
    shape.lineTo(-hw + r, hd);
    shape.absarc(-hw + r, hd - r, r, Math.PI / 2, Math.PI, false);
    shape.lineTo(-hw, -hd + r);
    shape.absarc(-hw + r, -hd + r, r, Math.PI, Math.PI * 1.5, false);
  };

  // Diagonal bars for the label margin (colours from the owner, 2 November 2026)
  const BAR_COLOURS = ["#84161C", "#3F0709"];
  /** period of the bars along x in mm: each bar is about 1.8 mm wide */
  const BAR_PERIOD = 5;
  const barTexture = () => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const image = ctx.createImageData(size, size);
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const colour = BAR_COLOURS[(x + y) % size < size / 2 ? 0 : 1] ?? "#000000";
          const at = (y * size + x) * 4;
          image.data[at] = parseInt(colour.slice(1, 3), 16);
          image.data[at + 1] = parseInt(colour.slice(3, 5), 16);
          image.data[at + 2] = parseInt(colour.slice(5, 7), 16);
          image.data[at + 3] = 255;
        }
      }
      ctx.putImageData(image, 0, 0);
    }
    const texture = new CanvasTexture(canvas);
    // the bar colours are sRGB values: without this they render lighter
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.magFilter = NearestFilter;
    // ShapeGeometry uses x and y in mm as texture coordinates: one tile = BAR_PERIOD mm
    texture.repeat.set(1 / BAR_PERIOD, 1 / BAR_PERIOD);
    return texture;
  };

  /** Dark red diagonal bars on the strip between the lid edge and the label margin. */
  const rebuildBand = () => {
    for (const child of [...bandGroup.children]) {
      bandGroup.remove(child);
      const mesh = child as Mesh;
      mesh.geometry.dispose();
      const material = mesh.material as MeshBasicMaterial;
      material.map?.dispose();
      material.dispose();
    }
    if (!labelArea?.violated) return draw();
    const { width, depth, margin, radius, z, down } = labelArea;
    const ring = new Shape();
    roundedRect(ring, width / 2, depth / 2, radius);
    const hole = new Path();
    roundedRect(
      hole,
      width / 2 - margin,
      depth / 2 - margin,
      Math.max(radius - margin, 0.5),
    );
    ring.holes.push(hole);
    const mesh = new Mesh(
      new ShapeGeometry(ring, 24),
      new MeshBasicMaterial({
        map: barTexture(),
        side: DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    );
    mesh.position.z = z + (down ? -0.03 : 0.03);
    bandGroup.add(mesh);
    draw();
  };

  // The print bed is always dark, in light and dark mode (owner, 2 November 2026): the dark
  // theme's surface, line and grid values.
  const BED_FILL = "#222320";
  /**
   * The accent colour of the dark theme (#C2DB57), paler: about 45 % of it over the bed, for
   * the bed outline and the 42 mm grid (owner, 11 November 2026: they were too loud).
   */
  const BED_ACCENT = "#6B773A";
  /** the 42 mm lines stay this far from the bed edge, so they do not run next to its outline */
  const BED_LINE_MARGIN = 8;
  /** the fine division in the dark grey: 7 mm, the height unit; 42 mm is six of them */
  const BED_GRID = "#393A35";
  const BED_STEP = 7;
  /** width of the red band around the bed when the part does not fit (mm) */
  const BED_BAND = 6;
  /** the endless canvas: how far the grid runs from the origin in every direction (mm) */
  const ENDLESS_REACH = 2520;

  /** The inside of the drawer as a box in the dark grey of the bed grid. */
  const rebuildDrawer = () => {
    for (const child of [...drawerGroup.children]) {
      drawerGroup.remove(child);
      const item = child as Mesh | LineSegments;
      item.geometry.dispose();
      (item.material as MeshBasicMaterial | LineBasicMaterial).dispose();
    }
    if (drawer) {
      const height = Math.max(drawer.z, 0.1);
      const geometry = new BoxGeometry(drawer.x, drawer.y, height);
      geometry.translate(0, 0, height / 2);
      const faces = new Mesh(
        geometry,
        new MeshBasicMaterial({
          color: new Color(BED_GRID),
          transparent: true,
          opacity: 0.4,
          side: DoubleSide,
          depthWrite: false,
        }),
      );
      const edges = new LineSegments(
        new EdgesGeometry(geometry),
        new LineBasicMaterial({ color: new Color(BED_GRID) }),
      );
      drawerGroup.add(faces, edges);
    }
    draw();
  };

  const rebuildGrid = () => {
    for (const child of [...gridGroup.children]) {
      gridGroup.remove(child);
      const item = child as Mesh | LineSegments | LineLoop;
      item.geometry.dispose();
      const material = item.material as LineBasicMaterial | MeshBasicMaterial;
      if ("map" in material) material.map?.dispose();
      material.dispose();
    }
    const flat = (x1: number, y1: number, x2: number, y2: number, z: number) => [
      x1,
      y1,
      z,
      x2,
      y2,
      z,
    ];
    const lineGeometry = (points: number[]) => {
      const geometry = new BufferGeometry();
      geometry.setAttribute(
        "position",
        new BufferAttribute(Float32Array.from(points), 3),
      );
      return geometry;
    };

    // the endless canvas has no bed: the grid of the bed, drawn far out in every direction
    const shown = endless ? undefined : bed;
    const designed = !!shown || endless;

    // the print bed of the chosen printer, centred on the origin (the lid centre is X0 Y0)
    if (shown) {
      const bed = shown;
      const outline = plateOutline(bed.plate ?? { cornerRadius: 0 }, bed.x, bed.y).map(
        ([x, y]) => new Vector2(x, y),
      );
      const fillShape = new Shape(outline);
      const fill = new Mesh(
        new ShapeGeometry(fillShape),
        new MeshBasicMaterial({ color: new Color(BED_FILL) }),
      );
      fill.position.z = -0.1;
      gridGroup.add(fill);
      const edge: number[] = [];
      outline.forEach((point, i) => {
        const next = outline[(i + 1) % outline.length] ?? point;
        edge.push(...flat(point.x, point.y, next.x, next.y, -0.04));
      });
      gridGroup.add(
        new LineSegments(
          lineGeometry(edge),
          new LineBasicMaterial({ color: new Color(BED_ACCENT) }),
        ),
      );
    }

    // the part does not fit the bed: the red bars of the label margin run around the whole
    // bed, just outside its edge
    if (shown && !bedFits) {
      const bed = shown;
      const inner = plateOutline(bed.plate ?? { cornerRadius: 0 }, bed.x, bed.y);
      const band = new Shape(
        outwardOutline(inner, BED_BAND).map(([x, y]) => new Vector2(x, y)),
      );
      band.holes.push(new Path(inner.map(([x, y]) => new Vector2(x, y))));
      const bars = new Mesh(
        new ShapeGeometry(band),
        new MeshBasicMaterial({ map: barTexture(), side: DoubleSide }),
      );
      bars.position.z = -0.03;
      gridGroup.add(bars);
    }

    {
      // the 42 mm grid passes through the origin; on a bed it stays inside the bed
      const [nx, ny] = units;
      const span = Math.max(nx, ny) + 3;
      const [reachX, reachY] = shown
        ? [shown.x / 2, shown.y / 2]
        : endless
          ? [ENDLESS_REACH, ENDLESS_REACH]
          : [span * 42, span * 42];
      const points: number[] = [];
      // on a bed the lines close to its edge are left out: they ran just inside the outline
      const margin = shown ? BED_LINE_MARGIN : 0;
      for (let k = -Math.floor(reachX / 42); k <= Math.floor(reachX / 42); k++) {
        if (Math.abs(42 * k) > reachX - margin) continue;
        points.push(...flat(42 * k, -reachY, 42 * k, reachY, -0.05));
      }
      for (let k = -Math.floor(reachY / 42); k <= Math.floor(reachY / 42); k++) {
        if (Math.abs(42 * k) > reachY - margin) continue;
        points.push(...flat(-reachX, 42 * k, reachX, 42 * k, -0.05));
      }
      if (designed) {
        // on a bed: the fine division in the dark grey below, the 42 mm cells in the accent colour
        const fine: number[] = [];
        for (
          let k = -Math.floor(reachX / BED_STEP);
          k <= Math.floor(reachX / BED_STEP);
          k++
        ) {
          if (k % 6 !== 0)
            fine.push(...flat(BED_STEP * k, -reachY, BED_STEP * k, reachY, -0.06));
        }
        for (
          let k = -Math.floor(reachY / BED_STEP);
          k <= Math.floor(reachY / BED_STEP);
          k++
        ) {
          if (k % 6 !== 0)
            fine.push(...flat(-reachX, BED_STEP * k, reachX, BED_STEP * k, -0.06));
        }
        gridGroup.add(
          new LineSegments(
            lineGeometry(fine),
            new LineBasicMaterial({ color: new Color(BED_GRID) }),
          ),
        );
      }
      gridGroup.add(
        new LineSegments(
          lineGeometry(points),
          new LineBasicMaterial({
            color: designed ? new Color(BED_ACCENT) : css("--stage-grid") || "#dadad3",
          }),
        ),
      );
    }
    // The floor never takes part in the depth test: it is drawn first, and the part is drawn
    // over it. Floor and part are a fraction of a millimetre apart; zoomed far out the depth
    // buffer cannot tell them apart and the floor flickers through the part.
    gridGroup.children.forEach((child, index) => {
      const item = child as Mesh | LineSegments;
      const material = item.material as LineBasicMaterial | MeshBasicMaterial;
      material.depthTest = false;
      material.depthWrite = false;
      // in the order they were made: bed, outline, bars, fine grid, grid
      item.renderOrder = -100 + index;
    });
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
      updateLimits();
      // setSize clears the canvas: draw in the same frame, or the preview flashes
      renderer.render(scene, camera);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    setView("iso", false);
    turnCube();
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
    const deps = [labelArea, theme];
    if (renderer && deps.length > 0) rebuildBand();
  });
  $effect(() => {
    const deps = [model, bed, endless, drawer];
    if (controls && deps.length > 0) updateLimits();
  });
  $effect(() => {
    const deps = [units[0], units[1], theme, bed, bedFits, endless];
    if (renderer && deps.length > 0) rebuildGrid();
  });
  $effect(() => {
    const deps = [drawer?.x, drawer?.y, drawer?.z, theme];
    if (renderer && deps.length > 0) rebuildDrawer();
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
    else if (event.key === "c") showColours = !showColours;
    else if (event.key === "e") endless = !endless;
    else if (views[index]) setView(views[index].id);
  };
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === "Escape") partMenu = false;
    onkey(event);
  }}
  onpointerdown={(event) => {
    if (partMenu && !(event.target as HTMLElement).closest(".part-pick"))
      partMenu = false;
  }}
/>

<div class="stage" class:endless bind:this={host}>
  <canvas
    bind:this={canvas}
    class:dimmed
    aria-label="3D preview of the part"
    ondblclick={fit}
  ></canvas>
  <div class="toolbar" role="toolbar" aria-label="Preview">
    <div class="part-pick">
      <button
        type="button"
        class="part-btn"
        aria-haspopup="true"
        aria-expanded={partMenu}
        aria-label="Part: {PART_NAME[editor.part]}. Choose a part"
        onclick={() => (partMenu = !partMenu)}
      >
        {PART_NAME[editor.part]}
        <Icon name="chevron-up" />
      </button>
      {#if partMenu}
        <ul class="part-menu" aria-label="Part type">
          {#each partChoices as part (part)}
            <li>
              <button
                type="button"
                class:on={editor.part === part}
                aria-current={editor.part === part}
                onclick={() => choosePart(part)}
              >
                {PART_NAME[part]}
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
    <button
      type="button"
      class="icon"
      aria-label="Isometric view (1)"
      title="Isometric view (1)"
      onclick={() => setView("iso")}
    >
      <Icon name="box" />
    </button>
    <button
      type="button"
      class="icon fit"
      aria-label="Fit to view (F)"
      title="Fit to view (F)"
      onclick={fit}
    >
      <Icon name="maximize" />
    </button>
    <button
      type="button"
      class="icon colours"
      class:off={!showColours}
      aria-pressed={showColours}
      aria-label="Part colours (C)"
      title="Part colours (C)"
      onclick={() => (showColours = !showColours)}
    >
      <Icon name="palette" />
    </button>
    <button
      type="button"
      class="icon"
      aria-pressed={endless}
      aria-label={endless ? "Show the print bed (E)" : "Endless canvas (E)"}
      title={endless ? "Show the print bed (E)" : "Endless canvas (E)"}
      onclick={() => (endless = !endless)}
    >
      <Icon name={endless ? "rectangle-horizontal" : "infinity"} />
    </button>
  </div>
  <div
    class="cube"
    role="group"
    aria-label="View cube: click a face, an edge or a corner, or drag to turn the view"
    style:--cube="{CUBE}px"
    onpointerdown={cubeDown}
  >
    {#each cubeFaces as face, i (face.id)}
      <div class="face" bind:this={faceElements[i]}>
        {#each cubeZones[i] ?? [] as zone (zone.key)}
          <button
            type="button"
            class="zone"
            class:centre={zone.centre}
            class:on={zone.centre && view === face.id}
            class:hot={hot === zone.key}
            title="{zone.name} view"
            aria-label="{zone.name} view"
            onpointerenter={() => (hot = zone.key)}
            onpointerleave={() => (hot = "")}
            onclick={() => zoneClick(face, zone)}
          >
            {zone.centre ? face.label : ""}
          </button>
        {/each}
      </div>
    {/each}
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
  /* the endless canvas is dark like the bed, in light and dark mode */
  .stage.endless {
    background: #222320;
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
    left: var(--space-4);
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
  .toolbar button:hover {
    background: var(--surface-2);
  }
  /* part colours off: the icon is struck through (no background change) */
  .toolbar button.colours {
    position: relative;
  }
  .toolbar button.colours.off::after {
    content: "";
    position: absolute;
    width: 24px;
    height: 2px;
    border-radius: 1px;
    background: currentColor;
    transform: rotate(-45deg);
    box-shadow: 0 0 0 2px var(--surface);
  }
  /* the part choice: only in the narrow layout, where the top bar has no switch; it opens upwards */
  .part-pick {
    display: none;
    position: relative;
  }
  .toolbar button.part-btn {
    gap: var(--space-2);
    grid-auto-flow: column;
    font-weight: 600;
  }
  .part-menu {
    position: absolute;
    bottom: calc(100% + var(--space-2));
    left: 0;
    min-width: 160px;
    margin: 0;
    padding: var(--space-1);
    list-style: none;
    background: var(--surface);
    border-radius: var(--radius-panel);
    box-shadow: var(--shadow-float);
  }
  .part-menu button {
    width: 100%;
    justify-content: start;
    text-align: left;
    place-items: center start;
  }
  .part-menu button.on {
    background: var(--accent-soft);
  }
  @media (max-width: 719px) {
    .part-pick {
      display: block;
    }
    .toolbar button.fit {
      display: none;
    }
  }
  .cube {
    position: absolute;
    /* the corners of the turned cube reach beyond its box: in the first (iso) view they stand
       16 px from the right and the bottom edge, as far as the toolbar from the left and bottom */
    right: 32px;
    bottom: 38px;
    width: var(--cube);
    height: var(--cube);
    transform-style: preserve-3d;
  }
  .face {
    position: absolute;
    left: 0;
    top: 0;
    width: var(--cube);
    height: var(--cube);
    transform-origin: calc(var(--cube) / 2) calc(var(--cube) / 2);
    backface-visibility: hidden;
    display: grid;
    grid-template-columns: 22% 1fr 22%;
    grid-template-rows: 22% 1fr 22%;
    border: 1px solid var(--line-strong);
    background: var(--line-strong);
    gap: 1px;
    touch-action: none;
  }
  .zone {
    display: grid;
    place-items: center;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: var(--surface-2);
    color: var(--text-2);
    font: inherit;
    font-size: 11px;
    font-weight: 600;
    cursor: grab;
  }
  .zone.centre {
    background: var(--surface);
  }
  .zone.hot,
  .zone.on {
    background: var(--accent-soft);
    color: var(--text);
  }
  .cube:active .zone {
    cursor: grabbing;
  }
  .hint {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
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
