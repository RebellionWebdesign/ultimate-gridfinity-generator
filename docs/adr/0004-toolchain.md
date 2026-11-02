# ADR-0004: Toolchain

- **Status:** Accepted (decided by the owner, 2026-11-02)
- **Source:** roadmap B-01; Svelte, Vite, SvelteKit, Biome and Prettier documentation

## Context

The app is a static PWA with exactly two screens, computed entirely in the browser (ADR-0002). The Svelte documentation recommends SvelteKit for new projects and names plain Svelte with Vite (`vite-plugin-svelte`, `npm create vite@latest`, template `svelte-ts`) as an alternative. The code style asks for 88 characters per line (`skills/code-style/SKILL.md`).

## Decision

- **Scaffold and bundler:** Vite with Svelte, TypeScript strict (template `svelte-ts`). No SvelteKit: no server rendering and no file-based routing are needed for two screens.
- **Formatter:** Prettier, `printWidth` 88, with `prettier-plugin-svelte`.
- **Linter:** ESLint.
- **Tests:** Vitest (spec 7.1).
- **Package manager:** npm.
- Vite needs Node.js 20.19+ or 22.12+.

## Rejected or postponed

| Option | Why not now |
|---|---|
| SvelteKit | Recommended by the Svelte docs for general apps; not needed for two static screens |
| Biome instead of Prettier and ESLint | Svelte support is experimental and must be enabled explicitly (Biome docs) |
| pnpm, yarn, bun, deno | Supported by the tools; no reason found to prefer them |

## Consequences

- The two screens are switched without a router library; a library needs the owner's approval (no new dependencies without asking).
- The PWA service worker needs a plugin for plain Vite; which one is decided in B-12 with an ADR. The vite-pwa documentation page checked for this ADR covers SvelteKit only.
- `manifold.wasm` must be served so that the bundler finds it (known issue in the Manifold repository, discussion 1372: serve it as a static asset and load it with `locateFile`). To be settled in B-03.
