# reference/

This folder holds a pinned copy of the finished MakerWorld `.scad` script (the test oracle): `gridfinity_generator.scad`.

- File name without spaces.
- The owner updates the copy when the script changes. Agents edit it only when the owner explicitly allows it (as on 2 November 2026 for the magnet fix).
- Test against it with the OpenSCAD command line (2021.01 syntax as on MakerWorld), exporting STL and comparing dimensions and volumes with the TypeScript output. Details: `skills/reference-oracle/SKILL.md`.
- `gridfinity-reference-drawings/` holds the 11 reference drawings (SVG) of the Gridfinity bin and baseplate dimensions, author Stu142. They are the dimension reference for agents (`skills/gridfinity-spec/SKILL.md`). Licence of the drawings: CC BY-NC-SA 4.0, see `gridfinity-reference-drawings/README.md`. Agents never edit them.
- Design reference images are not stored here. They live in `docs/design/references/`.
