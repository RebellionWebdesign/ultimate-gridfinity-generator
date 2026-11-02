# Ultimate Gridfinity Generator

A web app (PWA) that generates [Gridfinity](https://www.printables.com/model/417152-gridfinity-specification) parts in the browser and exports them as STL or 3MF. The first part type is the **lid**; bins and baseplates follow later, feature by feature.

**Status:** Phase B (web app, lids only) is built; the owner is testing it. The complete MakerWorld Parametric Model Maker script (OpenSCAD) exists in `ultimate-gridfinity-generator\reference\gridfinity_generator.scad` and serves as the reference for this app's geometry.

## What is here

| Path | Content |
|---|---|
| `docs/spec/gridfinity-generator-spec.de.md` | Full specification and planning record (German) |
| `docs/roadmap.md` | Phases and tasks with acceptance criteria |
| `docs/adr/` | Architecture decision records |
| `docs/agent/adr-digest.md` | One paragraph per ADR: the rules a change must keep |
| `docs/design/` | UI spec, brand and technical design documents (skeletons, content from the owner) |
| `skills/` | Short instructions for AI agents, one per kind of work |
| `AGENTS.md`, `CLAUDE.md` | Agent entry point |
| `reference/` | Pinned copy of the reference `.scad`, `gridfinity_generator.scad` (test oracle, see `reference/README.md`) |

## Licence

Planned: **CC BY-NC-SA 4.0** (owner decision, 2 November 2026). No `LICENSE` file exists yet; the owner decides when it is added. Gridfinity was created by Zack Freedman. What the notices must contain, and the list of bundled third-party licences (fonts and packages, shown in the app on the "OSS Licenses" page), are in `skills/licences-and-credits/SKILL.md`.

## Develop and build

Needs Node.js 20.19+ or 22.12+.

| Command | What it does |
|---|---|
| `npm install` | install dependencies |
| `npm run dev` | dev server |
| `npm test` | Vitest: constants, geometry, oracle comparison, export, model file |
| `npm run check` / `npm run lint` / `npm run format:check` | types, ESLint, Prettier |
| `npm run build` | static site in `dist/` |

Serving `dist/`: any static server over HTTPS (needed for the service worker and installing the app), the folder may be anywhere (relative paths). The server must send `application/wasm` for `.wasm` files. The oracle fixture is regenerated with `tools/oracle/` (see ADR-0006).
