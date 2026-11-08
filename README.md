# Ultimate Gridfinity Generator

A web app (PWA) that generates [Gridfinity](https://gridfinity.xyz/specification/) parts in the browser and exports them as STL or 3MF. The first part type is the **lid**; bins and baseplates follow later, feature by feature.

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

### SEO

The build puts the landing page into `index.html` as plain HTML (`prerenderLanding` in `vite.config.ts`, Svelte's own server renderer), so crawlers and link previews see its text; in the browser the app replaces it at once. `index.html` also holds the title, description, canonical URL and the Open Graph and Twitter tags; `public/` holds `robots.txt`, `sitemap.xml` and the preview image `og-image.png` (1200 × 630, a screenshot of the landing page). Routing stays on hashes (`/#/`, `/#/editor`), so there is one URL for search engines.

Two things are settings, not code: under Domains in Coolify set "www redirect" to the main domain (both host names must be listed), and in Google Search Console and Bing Webmaster Tools verify the domain and submit `https://ultimategridfinity.app/sitemap.xml`. After a deploy the service worker updates itself (`registerType: "autoUpdate"`), so a browser shows the old version for one load at most.

### Privacy statement and imprint

The privacy statement and the imprint are four plain HTML files in the repository root, with the text written into them: `datenschutz.html` and `impressum.html` (German), `privacy.html` and `imprint.html` (English), each with a language switch at the top. They have no script and no build step; to change a text, edit the HTML. They share `src/legal.css`, are separate entries of the build, and are not in the service worker's cache, so a change shows at once. The privacy statement promises no cookies, local storage only after the consent dialog, and no server logs (nginx `access_log off;` and `error_log /dev/null crit;` in the nginx configuration in Coolify, no access log in the Traefik proxy); keep the code and the server in line with it, or change the statement first. The German privacy statement comes from the IT-Recht Kanzlei and is not to be reworded; the English texts are translations and say so on the page.
