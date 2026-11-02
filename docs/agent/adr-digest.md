# ADR digest: what each decision means for a change

One paragraph per ADR with the rules a change must keep. The ADRs in `docs/adr/` are the full record.

**ADR-0001, geometry kernel.** Manifold WASM (`manifold-3d`, Apache-2.0) runs in a Web Worker; the UI thread never computes geometry. Text goes through opentype.js, SVG through path-to-polygon conversion, then extrusion. Do not add OpenSCAD WASM (GPL), OpenCascade (LGPL, large) or brepkit (AGPL from 3.0.0) without a new ADR that the owner accepts. No STEP export for now. Keep geometry testable against the reference `.scad`.

**ADR-0002, platform.** Static PWA, HTTPS only, everything computed in the browser, nothing about the user's models stored on a server. Saving files uses `<a download>`; `showSaveFilePicker` may only be an addition because Firefox and Safari lack it. Svelte for the UI, three.js for the preview. No Electron, Tauri or Neutralinojs work.

**ADR-0003, export and storage.** Export is STL (own binary writer) and 3MF. In the 3MF, plate, lip, text and symbol are separate parts of one object (ADR-0008) with colour and must never be merged. Saved models are JSON with a schema version; a schema change needs a version bump and a migration.

**ADR-0005, loading manifold.wasm.** The worker imports `manifold-3d/manifold.wasm?url` and passes it to `Module({ locateFile })`. Geometry code takes the kernel as an argument (testable in Node without a worker) and frees native objects through a `Scope`. The service worker must precache the hashed `.wasm`.

**ADR-0006, oracle tolerance.** The TypeScript lid is compared with the reference script through a committed fixture (`src/geometry/oracle.json`, made by `tools/oracle/` with `openscad-wasm` kept outside the repository). Tolerance: 0.001 mm per axis, 0.01 % volume. Changing geometry or the script means regenerating the fixture and reviewing the diff. Text is not compared (different fonts).

**ADR-0007, PWA plugin.** `vite-plugin-pwa` (generateSW, autoUpdate) with `workbox-build`, dev dependencies only; `base: "./"`; precache must include wasm, fonts and json (checked offline). A new runtime asset type needs its extension in `workbox.globPatterns`.

**ADR-0008, 3MF layout.** A plain 3MF Core file (no Bambu or other vendor files, no `BambuStudio:` tag): one object of component parts, each with a `basematerials` colour. Bambu Studio 02.08.02.61 shows an "invalid config" notice for every 3MF without its project config; it is harmless. Never write a project config that overrides the user's presets. Re-test in a slicer after changing the writer.

**ADR-0004, toolchain.** Vite with Svelte (TypeScript strict, no SvelteKit), Prettier with `printWidth` 88, ESLint, Vitest, npm. Do not add SvelteKit, a router library, a CSS framework or another formatter, linter or package manager without a new ADR that the owner accepts. Keep `manifold.wasm` loadable under the bundler (static asset plus `locateFile`).
