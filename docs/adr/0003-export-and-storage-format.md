# ADR-0003: Export and storage format

- **Status:** Accepted (decided by the owner, 2026-11-01)
- **Source:** spec sections 3.1, 6.1, 7.1

## Context

In MakerWorld's Parametric Model Maker, colours arrive only in the 3MF, not in the STL, and each colour body must be its own top-level object (spec 6.1). The web app keeps the parts separate for the same reason: so the slicer can assign filaments per part (spec 7.1).

## Decision

- **Export formats:** STL and 3MF only (no STEP for now).
- **STL:** own binary writer.
- **3MF:** parts (plate, text, symbol) are separate meshes, each with its colour (changed by ADR-0008: one object made of components, colours as `m:colorgroup`; originally planned as separate objects with a base-material colour). They must not merge into one body. Manifold ships `lib/export-3mf`; alternative is JSZip (3MF is a ZIP of XML files). Bambu Studio stores its filament assignment in its own metadata (`project_settings.config`), so the mapping of colours is slicer-dependent.
- **Saved models:** JSON with model type, schema version, parameters, text, colours and the SVG as a string. For now in the browser (localStorage or IndexedDB) and as a file to download and load. Sharing by URL state is possible later.

## Consequences

The schema carries a version so saved files can be migrated. Colour handling in slicers can differ and must be checked per slicer.
