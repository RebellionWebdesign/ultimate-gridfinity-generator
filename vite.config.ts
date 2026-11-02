/// <reference types="vitest/config" />
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // relative paths: the build runs from any folder of a static server (B-13)
  base: "./",
  plugins: [
    svelte(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        id: "./",
        name: "Ultimate Gridfinity Generator",
        short_name: "Gridfinity",
        description:
          "Generates Gridfinity lids in the browser and exports STL and 3MF.",
        lang: "en",
        start_url: "./",
        scope: "./",
        display: "standalone",
        background_color: "#111210",
        theme_color: "#111210",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // everything the app loads, the 541 kB manifold.wasm and the fonts included
        globPatterns: ["**/*.{js,css,html,svg,png,woff,woff2,otf,wasm,json}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
