# Roadmap

Source: spec sections 2, 3, 6.2, 7 (incl. 7.3) and 9 (`docs/spec/gridfinity-generator-spec.de.md`).

## How agents work from this plan

1. Take the first unchecked task whose dependencies are done.
2. Read `AGENTS.md`, then the skills and ADR-digest paragraphs for the area.
3. No code is written until the owner says so (spec section 10). Tasks below describe the work; the owner starts each coding phase.
4. A task is done only when its acceptance criteria are met and the checks that exist at that point pass. Tick it here.
5. Flow (owner, 2 November 2026): Claude Code builds the app with the lids and shows only the lid options. The owner tests. When it is good, Claude Code takes the next feature (Phase C, one feature at a time).
6. A significant decision (new dependency, different approach, a rejected alternative) gets an ADR in `docs/adr/` and a paragraph in `docs/agent/adr-digest.md`.

## Phases

| Phase | Content | State |
|---|---|---|
| A | MakerWorld script (OpenSCAD, Parametric Model Maker) | Done by the owner (outside this repo); serves as oracle |
| B | Web app (PWA), lids | This repository, not started |
| C | Bins and baseplates, sliding lid, filler for free space; one feature at a time | Later |
| D | SolidCraft plugin | Later, only when the plugin system is mature |

Rejected or postponed (spec section 2): desktop app with Tauri or Electron.

## Phase B: web app

- [x] **B-01 Toolchain decision and skeleton.** TypeScript strict, Vitest, Svelte (spec 7.1, owner's choice). Decided (owner, 2 November 2026): Vite with Svelte (template `svelte-ts`, no SvelteKit), Prettier, ESLint, npm; see ADR-0004. Depends on: owner's go for code. *AC:* a build and a test run succeed on an empty project.
- [x] **B-02 Constants module with sources.** One place for all Gridfinity constants (spec section 4), each with its source. *AC:* a test per spec number; the code stops with an error for a dimension that is not defined.
- [x] **B-03 Geometry core.** Manifold WASM in a Web Worker; foot profile 0.8 (45°) / 1.8 vertical / 2.15 (45°), total 4.75; stepped corner radii 3.75 → 1.6 → 0.8. Depends on: B-02. *AC:* foot bottom edge 35.6 for 1x1.
- [x] **B-04 Lid 1x1.** Foot plus plate, dust-protection variant. Depends on: B-03. *AC:* bounding box 41.5 × 41.5 × 7.0 (spec 6.2); plate thickness manual or automatic (total height a multiple of 7; 1u gives 2.25).
- [x] **B-05 Multi-cell lids and foot layout.** `merged` (default, continuous foot, no cross) and `per_cell`; corner magnets only in the four outermost corners of the lid (1x1 has all four corners, 4x4 only the outer four). Depends on: B-04. *AC:* 2x1 bounding box 83.5 × 41.5; closed mesh for 1x1 up to 4x4.
- [x] **B-06 Stackable variant and hollow foot.** Stacking lip `full | corners_only` (corner length parameter), hollow foot `none | open`, corner magnets on the top side of the lid (pocket 6.1 Ø × 2.1, user-changeable), in the four outermost corners only, 2.1 mm deep from the top into the 2.25 mm plate, with at least 0.8 mm of material under the pocket floor (the foot below a solid foot; with a hollow foot a flat pad instead of cylinders, owner, 2 November 2026); no centre magnet and no corner magnets in the foot on lids (owner, 2 November 2026). Depends on: B-05. *AC:* stackable 1x1 with 2.25 plate has height 11.4; the hollow space is one straight cut from below to the plate (owner, 2 November 2026) and magnet pockets keep 0.8 mm of material (pad under the pocket).
- [x] **B-07 Text and symbol.** Text via opentype.js, SVG paths to polygons, then extrusion; modes `none | raised | engraved | flush` per element; offset, rotation, scale. Depends on: B-04. *AC:* all four modes produce closed meshes; fonts bundled with licence checked.
- [x] **B-08 Export.** Binary STL writer; 3MF with plate, text and symbol as separate objects with base-material colour. Depends on: B-04, B-07. *AC:* parts do not merge into one body; file opens in a slicer.
- [x] **B-09 Oracle comparison.** Compare the TypeScript output with the reference `.scad` (same parameter names, dimensions, volumes). Depends on: B-06. The reference script is in the repository: `reference/gridfinity_generator.scad`. *AC:* agreed tolerance documented in an ADR; passes for the cases in `skills/reference-oracle/SKILL.md`, compared at or above the spec minimum.
- [x] **B-10 UI and preview.** Svelte UI, three.js preview. Depends on: B-06; design in `docs/design/ui-spec.md` and `brand.md`. *AC:* only the lid options are shown (bin and baseplate stay disabled, labelled "Later"); every lid parameter reachable; values below the spec minimum cannot be entered. (The "not part of the spec" label was dropped by the owner, 2 November 2026.)
- [x] **B-11 Save and load.** Model JSON (type, schema version, parameters, text, colours, SVG as string) in browser storage and as a file; fallback where the save-file picker is missing. Depends on: B-10.
- [x] **B-12 PWA.** HTTPS, manifest, service worker for offline use. Depends on: B-10.
- [x] **B-13 Static hosting.** Dropped (owner, 2 November 2026): hosting is not a task of this repository. `npm run build` makes the static site; see the README for what the server needs. Depends on: B-12.
- [x] **B-14 OSS Licenses page.** A page in the app that lists bundled fonts and packages with licence and a link to the official source; the list is kept in `skills/licences-and-credits/SKILL.md`. Licence texts are bundled with the font files. Depends on: B-10. *AC:* every bundled font and runtime package appears with name, licence and link; the page works offline.

Status 2 November 2026: B-01 to B-12 and B-14 built, B-13 dropped (owner decisions made in testing: `docs/spec/gridfinity-generator-spec.de.md` 7.1, "Stand Phase B"). Open: issue 7 (phone layout, after deployment); text size against MakerWorld not checked; the owner has not yet released the lid for the next feature.

## Phase C (later)

Bins and baseplates in the standard, sliding lid, filler for free space. Bin scope is given by the grid (Open decision 3). Filler: the user enters the width and length of the drawer, the baseplate is generated and, where it is too small, filled solid (fit to drawer, as in the script); later the drawer height is added so that the height of bins and lids stays locked to what fits. The reference script already contains more than Phase B (bin, baseplate, sliding lid, label); the owner accepts that. Extras come once the web app runs, and some may be paid.

## Open decisions (spec section 9)

1. ~~Placeholder values~~ Decided (2 November 2026): hollow-foot wall 1.2, skin 0.8, corner lip length 10, emboss depth 0.6, sliding-lid clearance 0.3, centre magnet 5.0 × 2.0 with clearance 0.2 are the defaults (spec section 4).
2. ~~Manual plate thickness~~ Decided: default and minimum from the spec, the user can only increase it. Rule: the spec value is always the minimum and the default; smaller is not allowed.
3. ~~Bin scope~~ Decided (2 November 2026): given by the grid: width and depth in cells, height in 7 mm units, plus the script's options (lip style, foot, magnets, walls and floor). No compartments, scoop or label tab.
4. ~~Filler variant~~ Decided (2 November 2026): fit to drawer as in the reference script (drawer width and length, the rest filled solid). Later: drawer height locks the height of bins and lids. Extended bins and half-cell pockets are not planned.
5. ~~Centre magnet and hollow foot~~ Decided (2 November 2026): the centre magnet goes only into feet (bins) and the baseplate, not into lids; lids have corner magnets on the top side. In the baseplate the centre magnet sits on a hub with four ribs (`center_ribs`); in the bin foot there are no ribs, only a 1.2 mm rim that holds the magnet.
6. ~~UI font~~ Decided for now (2 November 2026): Inter for text, IBM Plex Mono for numbers, until the owner says otherwise. IBM Plex Sans (SemiBold) stays only an option for the lid text in the script. The shortlist in spec 7.3 is parked.
7. ~~The project's own licence~~ Decided (2 November 2026): CC BY-NC-SA 4.0. Open: whether it covers the files the app outputs, contributions by others, and when a `LICENSE` file is added (ask the owner first). See `skills/licences-and-credits/SKILL.md`.
8. ~~Which spec is the yardstick~~ Decided: the reference drawings in `reference/gridfinity-reference-drawings/` and the official documentation.
9. ~~Prompt for the web app~~ Written (2 November 2026); code released for Phase B.

Added by this setup (not in the spec): Vite with Svelte, Prettier, ESLint and npm are decided (2 November 2026, ADR-0004).
