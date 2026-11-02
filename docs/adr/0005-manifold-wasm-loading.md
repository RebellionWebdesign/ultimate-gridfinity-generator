# ADR-0005: Loading manifold.wasm under Vite

- **Status:** Accepted (agent decision within ADR-0001 and ADR-0004, 2026-11-02; the owner may overrule)
- **Source:** roadmap B-03; Manifold repository discussion 1372; `manifold-3d` 3.5.4 typings (`Module(config?: {locateFile})`)

## Context

ADR-0004 left open how the bundler finds `manifold.wasm`. The package exports the file as `manifold-3d/manifold.wasm`. `Module()` accepts a `locateFile` option. In Node (tests) the module finds the file next to `manifold.js` on its own.

## Decision

- The worker imports the file as a static asset URL: `import wasmUrl from "manifold-3d/manifold.wasm?url"` and calls `Module({ locateFile: () => wasmUrl })` (`src/geometry/kernel.ts`, `src/worker/geometry.worker.ts`).
- The geometry code (`src/geometry/*`) takes the kernel as an argument and does not import the worker. Vitest runs it in Node without a worker; the worker only wraps `buildModel`.
- Native Manifold objects are freed through a `Scope` (`delete()` after each build), because the WASM heap is not garbage collected.
- Checked: `npm run build` emits `geometry.worker-*.js` and `manifold-*.wasm` (541 kB, 208 kB gzip); the dev server computes a stackable 1x1 lid in the worker in the browser pane (size 41.50 × 41.50 × 11.40). Vite prints the warning that `manifold.js` references `node:module`; that branch only runs under Node and the app works.

## Rejected

| Option | Why not |
|---|---|
| Inline the WASM as base64 | Larger bundle, no caching of the 541 kB file |
| Copy the file to `public/` by hand | A second copy to keep in step with the package version |

## Consequences

- The service worker (B-12) has to precache the hashed `.wasm` asset for offline use.
- `manifold-3d` is pinned through `package-lock.json`; an upgrade re-runs the geometry tests.
