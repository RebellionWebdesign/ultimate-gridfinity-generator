---
name: reference-oracle
description: Use when comparing the TypeScript geometry with the finished MakerWorld OpenSCAD script, or when parameter names, dimensions or volumes must match it.
---

# The reference script as test oracle

The finished Parametric Model Maker script is the reference for parameter names, dimensions and volumes (spec 7.1, "Test-Orakel"). The pinned copy is `reference/gridfinity_generator.scad` (the owner provides and updates it; agents edit it only when the owner explicitly allows it, as on 2 November 2026 for the magnet fix).

## How it is used
- Same parameter names and the same dimensions in TypeScript and `.scad`.
- Build the same case with the OpenSCAD command line and with the TypeScript code, export STL, compare bounding box and volume.
- Compare only at or above the spec minimum. The script allows smaller values for some parameters (for example `plate_thickness` from 0.6, `corner_magnet_d` from 3, `corner_len` from 5); the web app does not (spec: the spec value is the minimum).
- **Magnet errors in the script were fixed on 2 November 2026** (lid: corner magnets on the top side in the four outermost corners, no centre magnet and no magnets in the foot, ≥0.8 mm material under the pocket floor, hollow foot routed around the pocket; bin: centre magnet without ribs, corner pockets only in the four outermost corners; `text_size` minimum 8; the app allows 5 since the owner's change of 2 November 2026, text is not part of the oracle comparison). The behaviour is in `skills/gridfinity-spec/SKILL.md` ("Where the magnets go"). Checked with OpenSCAD WASM (volume difference = 4 pockets for 1x1, 4x4 merged, 3x2 per cell); not yet checked on MakerWorld's 2021.01.
- Do not adopt any other script behaviour that contradicts the spec or the drawings; the spec wins. Report the deviation. If the owner names further script errors, list them here.
- Tolerance and method: ADR-0006 (bounding box 0.001 mm, volume 0.01 %; fixture `src/geometry/oracle.json` from `tools/oracle/`). Text is not compared because the fonts differ.

## Constraints of the reference (spec 6.1)
- Runs on MakerWorld's OpenSCAD **2021.01**. One file, no `include`/`use`, no local files, no external libraries.
- Colour bodies are separate top-level `color()` children; no `union()` across colours.
- Avoid `minkowski` and `hull` over text (render time).

## Comparison cases (from spec 6.2)
| Case | Expected |
|---|---|
| Lid 1x1 | bounding box 41.5 × 41.5 × 7.0 |
| Lid 2x1 | 83.5 × 41.5 |
| Foot bottom edge | 35.6 |
| Stackable 1x1, plate 2.25 | height 11.4 |
| Bin 1x1x3 | 21 tall, 25.4 with lip (Phase C) |
| Fit test | no overlap, gap about 0.25 |
| Mesh | closed for 1x1 up to 4x4 |

Because geometry exists twice, a deviation is either a bug in the TypeScript, a bug in the script, or a spec question. Report it; do not "fix" it by changing the reference.
