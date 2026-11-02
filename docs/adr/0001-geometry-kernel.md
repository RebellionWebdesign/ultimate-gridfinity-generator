# ADR-0001: Geometry kernel

- **Status:** Accepted (decided by the owner, 2026-11-01)
- **Source:** spec sections 7.1 and 7.2

## Context

The app computes Gridfinity parts in the browser and exports STL and 3MF. It needs booleans, extrusion, revolve, hull and 2D offset on watertight meshes. The app ships as static files, so size and licence matter. STEP export is not required for now.

## Decision

Use **Manifold WASM** (`manifold-3d`, Apache-2.0, WASM file about 476 kB) in a **Web Worker**. The WASM build is serial and needs no SharedArrayBuffer. Text is built with opentype.js (MIT) into polygons and extruded. SVG symbols are read as paths and converted to polygons the same way. Preview uses three.js.

## Rejected or postponed

| Option | Why not now |
|---|---|
| OpenSCAD WASM | GPL (would put the whole app under GPL), about 14 MB, no STEP |
| OpenCascade.js / occt-wasm | About 4 to 9 MB, LGPL; only if STEP becomes necessary |
| brepkit / brepjs | Rust/WASM, STEP, tried for Gridfinity; AGPL-3.0 or commercial from 3.0.0 (MIT/Apache up to 2.129.x); size not documented |
| truck, SolidCraft kernel | Kernel is being migrated; not usable |
| SolidCraft plugins | Only a design document so far; sensible only when mature (Phase D) |

## Consequences

Geometry exists twice: in the reference OpenSCAD script and in TypeScript. This is a deliberate cost; the script is the test oracle (skill `reference-oracle`). Adding STEP later means revisiting this ADR.
