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

### Server: Coolify with nginx, and SEO

The build puts the landing page into `index.html` as plain HTML (`prerenderLanding` in `vite.config.ts`, Svelte's own server renderer), so crawlers and link previews see its text; in the browser the app replaces it at once. `index.html` also holds the title, description, canonical URL and the Open Graph and Twitter tags; `public/` holds `robots.txt`, `sitemap.xml` and the preview image `og-image.png` (1200 × 630, a screenshot of the landing page). Routing stays on hashes (`/#/`, `/#/editor`), so there is one URL for search engines.

Coolify (Static site, publish directory `/dist`): under *General > Build pipeline > Custom Nginx configuration* put the file below, then redeploy (the config is copied into the image). It fixes the type of `manifest.webmanifest`, caches the hashed files under `/assets/` for a year and never caches the entry files, compresses text, JSON, SVG and WASM, and sends HSTS. `add_header` does not inherit into a block that sets its own, so HSTS is repeated.

```nginx
worker_processes auto;

events {
  worker_connections 1024;
}

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;
  sendfile on;

  gzip on;
  gzip_comp_level 6;
  gzip_min_length 1024;
  gzip_vary on;
  gzip_types text/plain text/css text/javascript application/javascript application/json application/manifest+json application/xml image/svg+xml application/wasm;

  server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    add_header Strict-Transport-Security "max-age=31536000" always;

    # hashed files never change under their name
    location /assets/ {
      add_header Cache-Control "public, max-age=31536000, immutable";
      add_header Strict-Transport-Security "max-age=31536000" always;
      try_files $uri =404;
    }

    # the entry files and the service worker must always be checked again
    location = /index.html {
      add_header Cache-Control "no-cache";
      add_header Strict-Transport-Security "max-age=31536000" always;
    }
    location = /sw.js {
      add_header Cache-Control "no-cache";
      add_header Strict-Transport-Security "max-age=31536000" always;
    }
    location = /registerSW.js {
      add_header Cache-Control "no-cache";
      add_header Strict-Transport-Security "max-age=31536000" always;
    }
    location = /manifest.webmanifest {
      default_type application/manifest+json;
      add_header Cache-Control "no-cache";
      add_header Strict-Transport-Security "max-age=31536000" always;
    }

    location / {
      add_header Cache-Control "no-cache";
      add_header Strict-Transport-Security "max-age=31536000" always;
      try_files $uri $uri/ =404;
    }
  }
}
```

Two things are settings, not code: under Domains in Coolify set "www redirect" to the main domain (both host names must be listed), and in Google Search Console and Bing Webmaster Tools verify the domain and submit `https://ultimategridfinity.app/sitemap.xml`. After a deploy the service worker updates itself (`registerType: "autoUpdate"`), so a browser shows the old version for one load at most.
