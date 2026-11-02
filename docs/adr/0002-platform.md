# ADR-0002: Platform and hosting

- **Status:** Accepted (decided by the owner, 2026-11-01)
- **Source:** spec sections 1, 2, 7.1 and 7.2

## Context

The app should stay independent of third-party roadmaps and need no certificates or code signing. It is served from the owner's own server.

## Decision

- A **web app as PWA**, delivered as static files.
- **Computation in the user's browser.** No server-side computation, no server storage for STL or 3MF files.
- **UI:** Svelte. **Preview:** three.js.
- HTTPS is mandatory (service worker and installability). The manifest needs `name`, `icons`, `start_url`, `display`. Offline use needs a service worker.
- **Saving files:** `<a download>` works in all common browsers. `showSaveFilePicker` exists only in Chrome and Edge (from version 86), so a fallback is required.
- Desktop PWA installation works in Chrome and Edge; Firefox and Safari do not install PWAs on the desktop (Safari on macOS 14: "Add to Dock").
- Accounts and server storage only when paid features arrive (Django with allauth would be one route).

## Rejected or postponed

| Option | Why not now |
|---|---|
| Electron | Includes Chromium, installers about 60 to 290 MB; possible later |
| Tauri 2 | Small, but needs the Rust toolchain |
| Neutralinojs | Small, no Rust; quirks of the system WebView |

## Consequences

The hosting load is static delivery only. Sharing by URL state is possible later without a server.
