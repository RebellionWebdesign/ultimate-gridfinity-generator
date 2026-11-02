# ADR-0007: PWA plugin

- **Status:** Accepted (agent decision, 2026-11-02; the owner may overrule)
- **Source:** roadmap B-12; ADR-0002, ADR-0004; vite-plugin-pwa 2.0.0 and workbox-build 7.4.1 package metadata (npm)

## Context

ADR-0004 left the service worker plugin for plain Vite open. The app must work offline (spec 7.1): the page, the worker, `manifold.wasm` (541 kB), the fonts (Inter OTF 610 kB for lid text) and the icon data.

## Decision

- **`vite-plugin-pwa` 2.0.0** (MIT, peer range includes Vite 8) with `workbox-build` 7.4.1 (MIT), both as dev dependencies; mode `generateSW`, `registerType: "autoUpdate"`.
- `workbox.globPatterns` adds `wasm`, `woff`, `woff2`, `otf` and `json` to the defaults, so everything the app loads is precached (21 entries, 2.8 MB). `maximumFileSizeToCacheInBytes` is 4 MB.
- `base: "./"` in `vite.config.ts`: the build runs from any folder of a static server.
- Manifest: name, short name, `start_url "./"`, `display "standalone"`, colours from `brand.md`, icons 192 and 512 px (the mark on the dark tile; PNGs rendered from `public/icon.svg`).
- Checked on the production build with `vite preview`: service worker activated, 18 cache entries, then the server was stopped and the page, the text font and the geometry worker still worked.

## Rejected

| Option | Why not |
|---|---|
| Hand-written service worker | A precache list to keep in step with hashed file names by hand |
| `@vite-pwa/sveltekit` | SvelteKit is not used (ADR-0004) |

## Consequences

- Two new dev dependencies; they build the service worker and are not shipped in the bundle (the generated `workbox-*.js` is).
- `autoUpdate` activates a new version on the next load; a model in the editor is auto-saved in the browser, so an update does not lose work.
- The server must send `application/wasm` for `.wasm` and serve over HTTPS (B-13).
