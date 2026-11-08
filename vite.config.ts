/// <reference types="vitest/config" />
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { render } from "svelte/server";
import { createServer, defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const { version } = JSON.parse(readFileSync("./package.json", "utf8")) as {
  version: string;
};

/**
 * Puts the landing page into `index.html` as plain HTML at build time, so crawlers and link
 * previews that do not run JavaScript see its headings and texts (SEO, option C). The page is
 * rendered in Node with Svelte's own server renderer; no new dependency. In the browser the
 * app replaces this markup as soon as it starts (`src/main.ts`). The editor is not rendered:
 * it is a tool, and `#/editor` is the same document.
 */
const prerenderLanding = (): Plugin => ({
  name: "prerender-landing",
  apply: "build",
  async transformIndexHtml(html, ctx) {
    // the legal pages are separate entries without the app's empty #app
    if (basename(ctx.filename) !== "index.html") return html;
    const server = await createServer({
      configFile: false,
      plugins: [svelte()],
      appType: "custom",
      server: { middlewareMode: true, hmr: false, watch: null },
      optimizeDeps: { noDiscovery: true, include: [] },
      logLevel: "silent",
    });
    try {
      const { default: Landing } = await server.ssrLoadModule(
        "/src/lib/Landing.svelte",
      );
      const { body } = render(Landing);
      const empty = '<div id="app"></div>';
      if (!html.includes(empty))
        throw new Error("index.html has no empty #app to fill");
      return html.replace(empty, `<div id="app" data-prerendered>${body}</div>`);
    } finally {
      await server.close();
    }
  },
});

export default defineConfig({
  // the app shows the version of package.json
  define: { __APP_VERSION__: JSON.stringify(version) },
  // relative paths: the build runs from any folder of a static server (B-13)
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        datenschutz: "datenschutz.html",
        privacy: "privacy.html",
        impressum: "impressum.html",
        imprint: "imprint.html",
      },
    },
  },
  plugins: [
    svelte(),
    prerenderLanding(),
    VitePWA({
      registerType: "autoUpdate",
      // the worker is registered by hand, only after the user said yes (src/lib/offline.ts)
      injectRegister: false,
      includeAssets: ["icon.svg"],
      manifest: {
        id: "./",
        name: "Ultimate Gridfinity Generator",
        short_name: "Gridfinity",
        description:
          "Generates Gridfinity lids in the browser and exports STL and 3MF.",
        lang: "en",
        start_url: "./#/editor",
        scope: "./",
        display: "standalone",
        background_color: "#111210",
        theme_color: "#111210",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        // everything the app loads, the 541 kB manifold.wasm and the fonts included
        globPatterns: ["**/*.{js,css,html,svg,png,woff,woff2,otf,wasm,json}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // the preview image is for link previews only; robots.txt and sitemap.xml must come
        // from the server, not from the cached app shell
        globIgnores: [
          "og-image.png",
          "datenschutz.html",
          "privacy.html",
          "impressum.html",
          "imprint.html",
        ],
        navigateFallbackDenylist: [
          /^\/robots\.txt$/,
          /^\/sitemap\.xml$/,
          /^\/(datenschutz|privacy|impressum|imprint)\.html$/,
        ],
      },
    }),
  ],
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
