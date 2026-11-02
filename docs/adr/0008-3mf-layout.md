# ADR-0008: 3MF layout for slicers

- **Status:** Accepted (agent decision after the owner's slicer test, 2026-11-02; the owner may overrule)
- **Source:** owner test in Bambu Studio 02.08 (error "The 3mf file has invalid config, load geometry data only", colour chosen green, sliced blue); a 3MF saved by Bambu Studio (`correct 3mf.3mf`, read for structure only, not copied); 3MF Core Specification and production extension

## Context

The first writer put each part (plate, text, symbol) into its own `<object>` with `basematerials`. Bambu Studio showed a config error, loaded geometry only, ignored the colours and placed the parts as independent objects (so it noticed their different heights).

## Decision

- The lid is **one object made of components**: plate, stacking lip, text and symbol stay separate meshes (never merged, ADR-0003) but the slicer keeps them registered. One model file per part (`3D/Objects/object_N.model`), the object in `3D/3dmodel.model` references them (production extension, `p:UUID`).
- Bambu Studio's own files are followed: `BambuStudio:3mfVersion`, `Metadata/model_settings.config` (object, parts, one `extruder` per part, plate with the instance) and `Metadata/project_settings.config` (JSON with `filament_colour`, `filament_type`). Parts with the same colour share a filament slot.
- Standard `basematerials` colours stay in each part file for other slicers.
- The object is placed at the centre of a 256 mm bed (most Bambu Lab printers); other slicers re-centre.
- Raised and flush labels sit directly on the plate or in their pocket (no gap, owner decision): they touch the plate but are separate meshes.

## Rejected

| Option | Why not |
|---|---|
| Separate objects (the first version) | Each object is dropped on the bed on its own; colours not read |
| Copying Bambu's full `project_settings.config` (580 keys, printer specific) | Third-party printer profile; the file needs only the filament colours |

## Consequences

- Not verified in Bambu Studio by the agent. The owner re-tests; if the "invalid config" message stays, the keys Bambu requires in `project_settings.config` have to be added from the owner's export.
- ADR-0003's "separate objects" now reads "separate parts of one object".
