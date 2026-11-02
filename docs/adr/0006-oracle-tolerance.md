# ADR-0006: Oracle comparison and tolerance

- **Status:** Accepted (agent decision, 2026-11-02; the owner may overrule)
- **Source:** roadmap B-09; `skills/reference-oracle/SKILL.md`; `reference/gridfinity_generator.scad`

## Context

The TypeScript geometry is compared with the reference script by bounding box and volume (spec 7.1). The script runs on MakerWorld's OpenSCAD 2021.01; no OpenSCAD is installed on the development machine.

## Decision

- **Method:** `tools/oracle/run-oracle.mjs` renders the cases in `tools/oracle/cases.mjs` with `openscad-wasm` 0.0.4 (GPL-2.0, installed outside the repository, never bundled) and writes `src/geometry/oracle.json` (size and volume per case). `src/geometry/oracle.test.ts` builds the same cases with the TypeScript code and compares. The fixture is committed, so the test needs no OpenSCAD.
- **Cases:** 25, all at or above the spec minimum: 1x1, 2x1, 4x4 merged, 3x2 per cell, manual and automatic plate, upside down, stackable (full and corners-only lip, corner length 15), magnets (1x1, 4x4, 3x2 per cell, 8.1 × 3.9), hollow foot (1x1, 2x2, wall 2.5, with magnets, per cell, stackable) and Lucide symbols (raised, engraved, flush, scaled and rotated, upside down).
- **Tolerance:** bounding box 0.001 mm per axis, volume 0.01 % of the script's volume (summed over all bodies). Observed: every case agrees to 5 significant digits (relative difference below 1e-6), because the TypeScript code uses the same ring construction and segment counts as the script.
- **Not compared:** text. The script uses fonts installed where it runs, the app bundles Inter, IBM Plex Mono and IBM Plex Sans SemiBold. Text is covered by the closed-mesh, depth and position tests only. The text size scaling (OpenSCAD: ascent about `size`, em = size × 100/72) is an assumption and should be checked on MakerWorld with the same font.
- **Not checked:** MakerWorld's OpenSCAD 2021.01 itself (same limit as noted in the reference-oracle skill).

## Rejected

| Option | Why not |
|---|---|
| `openscad-wasm` as a dev dependency | GPL-2.0 in the dependency tree; the fixture makes it unnecessary |
| Looser tolerance (0.2 %) | The numbers agree far better; a loose limit would hide real errors |

## Consequences

- Changing the reference script or a geometry rule means re-running the oracle tool and reviewing the diff of `oracle.json`.
- A deliberate difference from the script (the spec wins) needs its own test and a line here.
