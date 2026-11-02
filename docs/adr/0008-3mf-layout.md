# ADR-0008: 3MF layout for slicers

- **Status:** Accepted (agent decision after the owner's slicer tests, 2026-11-02; the owner may overrule). Replaces the first version of this ADR (Bambu-style files).
- **Source:** owner tests in Bambu Studio 02.08.02.61; Bambu Studio source, tag v02.08.02.61 (`src/slic3r/GUI/Plater.cpp`, `src/libslic3r/Format/bbs_3mf.cpp`), AGPL-3.0; 3MF Core Specification (3MFConsortium/spec_core, BSD-2-Clause)

## Context

The owner's first 3MF showed in Bambu Studio "The 3mf file has invalid config, load geometry data only", the colour (green) was lost and the parts were independent objects. A second version imitated Bambu's own files (`model_settings.config`, `project_settings.config`); the message stayed and the colours came out swapped (lid black, text red).

What the Bambu Studio source shows (v02.08.02.61):
- The message comes from `Plater.cpp`: a project config is rejected when its printer model is not a Bambu one **and** `check_project_config()` fails. In this version that function returns false whenever `nozzle_diameter` is missing, even for an empty config. Every 3MF from another tool without a Bambu project config therefore shows the message; it is an information notice, the geometry loads. Newer sources (master) return true for an empty config.
- A 3MF counts as Bambu's own only when `<metadata name="Application">` starts with `BambuStudio-`. Our file must not claim that.
- For other 3MF files Bambu reads standard colours (`basematerials` through `pid`/`pindex`) and opens its colour dialog, in which the user maps each colour in the file to a filament. Without a project config the colours of the printer's own filament slots apply (here slot 1 black, slot 2 red), which explains the swapped colours of the second version.
- Supplying a project config that passes the check (with `nozzle_diameter`) would make Bambu apply it as the project's printer and filament settings, replacing the user's presets with defaults. Not acceptable.

## Decision

- Write a **plain 3MF Core file**: `[Content_Types].xml`, `_rels/.rels`, `3D/3dmodel.model`. No vendor files, no `BambuStudio:` metadata, no production extension.
- The lid is **one object made of components**: lid, stacking lip, text and symbol stay separate meshes (never merged, ADR-0003) and stay registered to each other. Each part points to its own `basematerials` colour (`pid`, `pindex`).
- The main body is named after the part type (Lid, Bin, Base).
- No placement transform: slicers centre the object themselves.

## Rejected

| Option | Why not |
|---|---|
| Bambu-style `project_settings.config` / `model_settings.config` | Not an open standard (Bambu Studio's own project format, AGPL source); invalid-config notice stays; risks overwriting the user's printer and filament presets |
| Claiming `Application = BambuStudio-…` | Misrepresents the generator |
| Separate top-level objects (the first version) | Each is placed on its own |

## Consequences

- In Bambu Studio 02.08.02.61 the notice "invalid config, load geometry data only" still appears; it is harmless and also shown for 3MF files from other tools. The colour dialog then lets the user map colours to filaments.
- Not verified in a slicer by the agent; the owner re-tests.
- No Bambu-specific code or text is copied or needed.
