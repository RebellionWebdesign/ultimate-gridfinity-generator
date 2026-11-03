/// <reference types="svelte" />
/// <reference types="vite/client" />

/** The version in package.json, set by Vite at build time. */
declare const __APP_VERSION__: string;

declare module "*.svg?raw" {
  const content: string;
  export default content;
}

declare module "*.txt?raw" {
  const content: string;
  export default content;
}
