---
name: gridfinity-spec
description: Use when a task needs any Gridfinity dimension, constant, tolerance or profile; defines where constants live and what to do when a value is missing.
---

# Gridfinity dimensions

Source: spec section 4 (`docs/spec/gridfinity-generator-spec.de.md`). All values in mm.

## Rules
- All constants live in **one module**, each with a source note. Tests check every number below.
- If code needs a dimension that is not listed here, **stop and report it**. Do not guess.
- Values marked "derived" are not owner statements; say so when you use them.
- **The yardstick is the reference drawings plus the official documentation.** Drawings: `reference/gridfinity-reference-drawings/` (SVG, 11 sheets, author Stu142). Official documentation: the Gridfinity specification (Zack Freedman, Printables). The owner treats both like the spec itself. Read the drawing sheet that matches your task: `bin_*` for bins and lids, `baseplate_*` for baseplates. The numbers below agree with them. If a drawing, the official documentation and this table ever differ, stop and report it. Never edit the drawings.

## Constants
| Quantity | Value | Note |
|---|---|---|
| Grid | 42 | base 42 |
| Height unit | 7 | base 7 |
| Bin tolerance | 0.5 total (0.25 per side) | outer size = n × 42 − 0.5 (1x1 = 41.5, 2x2 = 83.5) |
| Bin outer corner radius | 3.75 | diameter 7.5 |
| Foot corner radii (stepped) | 3.75 → 1.6 → 0.8 | plan: 7.5 Ø / 3.2 Ø / 1.6 Ø |
| Baseplate corner radius | 4.0 | 8.0 Ø |
| Foot profile (from below) | 0.8 (45°) / 1.8 vertical / 2.15 (45°) | total height 4.75 |
| Foot bottom edge (1u) | 35.6 | = 41.5 − 2 × 2.95 |
| Usable space of the first 7 mm layer | 2.25 | 7 − 4.75 |
| Stacking lip (from below) | 0.7 (45°) / 1.8 vertical / 1.9 (45°) | height 4.4, depth 2.6, 0.25 offset to the foot; does **not** count toward the 7 mm height |
| Example with lip | 1x1x3 = 25.4 tall; 2u = 18.4 | in practice the lip is also built with 3.75 or 3.69 (0.5 rounding) |
| Baseplate profile | 0.7 / 1.8 / 2.15 | wall 4.65 tall, nominally "~5", 0.25 offset |
| Magnet | 6 × 2 | pocket 6.1 Ø × 2.1 deep as the start value, changeable by the user (owner decision); 6 × 2 plus 0.1 mm clearance, which everyone adds (owner) |
| Screw hole | 3.0 Ø | with screws selected, a 3 mm hole is punched through the centre of the magnet pocket (boolean), nothing more |
| Baseplate radii | R4 outside, R1.85 and R1.15 inside | all corners equal, holes symmetrical |
| Baseplate hole position | 26 spacing, 8 from the cell edge, 5.15 from the foot edge | 8 = (42 − 26) / 2; 5.15 = 8 − 2.85 |
| Baseplate profile widths | 2.85 per side at the bottom, 2.15 per side at the wall; 36.3 and 37.7; ridge 5.7 at the bottom | 36.3 = 42 − 2 × 2.85; 37.7 = 42 − 2 × 2.15 |
| Bin vertical wall width | 37.2 | = 41.5 − 2 × 2.15 |
| Stacking lip variants | round (R0.5) and sharp (no rounding) | same profile 0.7 / 1.8 / 1.9, depth 2.6 |
| Hole centre | 4.8 from the lowest foot edge | derived: 7.75 from the outer wall, 26 mm hole spacing |
| Half grid 21 mm, custom grid size | community extension | not part of the spec |

## Where the magnets go (owner, 2 November 2026)
- **Lid:** corner magnets on the top side (consistent with the other parts, room for a label). No centre magnet, no corner magnets in the foot.
- **Pocket on the lid:** from the top side, 2.1 mm deep (adjustable up to 3.9) into the plate; the plate stays 2.25 mm (spec, automatic). Under the pocket floor at least 0.8 mm of material remains (derived from the script, which keeps 0.8 mm above the tallest magnet): with a solid foot the foot lies below the pocket; with a hollow foot the hollow is routed around the pocket, wall 1.2.
- **Which corners:** magnet pockets only in the four outermost corners of the part. A 1x1 lid has them in all four corners, a 4x4 lid only in the outer four; a large bin with several feet likewise.
- **Centre magnet:** only in feet (bins) and the baseplate. Baseplate: on a hub with four ribs (`center_ribs`). Bin foot: no ribs, only a 1.2 mm rim around the pocket that holds the magnet. On a large bin the centre magnets, like the corner pockets, sit only in the four corner feet (owner, 2 November 2026).
- The reference `.scad` was corrected on 2 November 2026 to this behaviour (lid: top-side corner pockets, no centre magnet; bin: corner pockets in the four outermost corners, centre magnet without ribs). One difference remains: on a large bin the script still puts a centre magnet into every foot; the web app follows this section.

## Owner parameters for the magnet pocket
One pocket, 6.1 Ø × 2.1 deep as the start value; the user sets diameter and depth. With screws selected, a 3 mm hole is punched through the pocket centre, nothing more. There are no larger holes. Other magnet sizes are possible; the upper limits are computed geometry limits, not spec numbers: corner pocket up to 8.1 Ø (keeps 0.75 mm of wall at the foot edge), centre magnet up to 10 Ø. The drawings show other hole sizes (magnet hole 6.5 Ø × 2.4, baseplate screw hole 3.5 Ø, bin screw hole 6 deep); the project does not use them. This owner decision wins over the drawings. The reference `.scad` uses the same defaults (`corner_magnet_d` 6.1, `corner_magnet_h` 2.1, `SCREW_D` 3.0).

## Not part of the spec
Wall thickness, floor thickness, lid plate, clearance, hollow-foot wall, corner lip length, emboss depth. These are parameters; the UI labels them "not part of the spec".

## Default values (confirmed by the owner, 2 November 2026)
| Parameter | Default |
|---|---|
| Hollow-foot wall (`foot_wall`) | 1.2 |
| Skin on hollow bin foot (`foot_skin`) | 0.8 |
| Corner lip length (`corner_len`) | 10 |
| Emboss depth | 0.6 |
| Sliding-lid clearance | 0.3 |
| Centre magnet | 5.0 × 2.0, clearance 0.2 |
| Text height (`text_size`) | 8.0, also the minimum (2 mm is too small); upper limit 30 from the script |
| Colours | Until the user chooses a colour, parts stay Stone `#9DA39A`; text is black (placeholder) |

**Rule (owner):** the spec value is always the minimum and the default. The user can only increase it, up to an upper limit per parameter (a geometry limit where the parts do not collide yet); smaller is not allowed. This applies to every value with a spec or default value (the tables above and below), including the plate thickness (default and minimum from the spec; auto: total height a multiple of 7, 1u gives 2.25; manual only larger) and the magnet pocket (6.1 × 2.1 and up). The UI and the validation must enforce the minimum. The reference script still allows smaller values (for example `plate_thickness` from 0.6, `corner_magnet_d` from 3, `corner_len` from 5, `text_size` from 2); the web app does not follow it there. Compare against the script only at or above the minimum.
