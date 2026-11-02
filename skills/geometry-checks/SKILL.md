---
name: geometry-checks
description: Use when writing or running checks on generated meshes: bounding boxes, closed meshes, fit tests, 3MF object separation.
---

# Geometry checks

Checks the spec asks for (section 6.2). They become automated tests once code exists; until then they are the acceptance criteria in `docs/roadmap.md`.

- **Bounding boxes** against the table in `skills/reference-oracle/SKILL.md`.
- **Closed (watertight) mesh** for every output from 1x1 to 4x4 and for every text mode (`raised`, `engraved`, `flush`).
- **Fit test:** lid and bin (or baseplate) without overlap; gap about 0.25.
- **Foot bottom edge** 35.6 for 1x1.
- **Plate thickness:** in automatic mode the total height is a multiple of 7 mm (1u gives a 2.25 plate).
- **3MF:** plate, text and symbol are separate objects; assert the object count, and assert that colours are carried as base materials.
- **Minimum values:** the validation rejects every value below its spec minimum (spec section 4, rule of the owner) and accepts the minimum itself and values up to the limit.
- **Magnet corners:** 1x1 has pockets in all four corners; for larger parts (for example 4x4) pockets exist only in the four outermost corners. Lids have no centre magnet and no pockets in the foot; the pockets are on the top side.
- **Material under a lid pocket:** at least 0.8 mm below the pocket floor, also with a hollow foot (the hollow is routed around the pocket).
- **Hollow foot:** the cavity follows the foot profile; magnet pockets keep a wall.

Report what you measured and with which tool. Do not report a check as passed that was not run.
