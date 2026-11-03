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
- **3MF:** plate, lip, text and symbol are separate parts of one object (ADR-0008); assert the component and mesh count, and assert that each part points to its own colour in an `m:colorgroup`.
- **Minimum values:** the validation rejects every value below its spec minimum (spec section 4, rule of the owner) and accepts the minimum itself and values up to the limit.
- **Magnet corners:** 1x1 has pockets in all four corners; for larger parts (for example 4x4) pockets exist only in the four outermost corners. Lids have no centre magnet and no pockets in the foot; the pockets are on the top side.
- **Material under a lid pocket:** with a solid foot at least 0.8 mm below the pocket floor. With a hollow foot the cavity ends 1.45 mm below the plate (owner, 2 November 2026), so 1.6 mm remain under the default pocket floor.
- **Hollow foot:** the cavity is one straight cut from below (the same outline at every height, inset from the foot's bottom edge by the wall) that ends 1.45 mm below the plate; nothing else is added under the magnet pockets.

- **Baseplate:** 1x1 is 42 × 42 × 5.05 with the default base (0.4); closed mesh for 1x1 to 4x4, solid and skeleton, with and without magnets; four corner pockets and one centre pocket per cell; the base is raised so 0.4 mm of material stays under every pocket; the foot of a lid is 0.25 mm smaller per side than the pocket wall.

Report what you measured and with which tool. Do not report a check as passed that was not run.
