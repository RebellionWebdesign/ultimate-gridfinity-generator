// The service worker and its cache only exist with the user's consent (see consent.ts): the
// app is registered for offline use after "yes", and removed again, with its cache, on
// "no" or when the user switches saving off. Visitors from before this rule, who still have
// a worker, lose it on their next visit until they say yes.
import { readConsent } from "./consent";

export interface OfflineEnv {
  serviceWorker?: {
    getRegistrations(): Promise<readonly { unregister(): Promise<boolean> }[]>;
  };
  caches?: {
    keys(): Promise<string[]>;
    delete(key: string): Promise<boolean>;
  };
}

const browserEnv = (): OfflineEnv => ({
  serviceWorker: "serviceWorker" in navigator ? navigator.serviceWorker : undefined,
  caches: typeof caches === "undefined" ? undefined : caches,
});

/** Registers the service worker; the app then updates itself (`registerType: "autoUpdate"`). */
export const enableOffline = async (): Promise<void> => {
  try {
    const { registerSW } = await import("virtual:pwa-register");
    registerSW({ immediate: true });
  } catch {
    // no service worker in this browser or build: the app works online as before
  }
};

/** Removes the service worker and every cache this site holds. */
export const disableOffline = async (env: OfflineEnv = browserEnv()): Promise<void> => {
  try {
    const registrations = (await env.serviceWorker?.getRegistrations()) ?? [];
    await Promise.all(registrations.map((registration) => registration.unregister()));
    const keys = (await env.caches?.keys()) ?? [];
    await Promise.all(keys.map((key) => env.caches?.delete(key)));
  } catch {
    // nothing to remove when the browser does not allow it
  }
};

/** At every start: offline use with "yes", nothing and a clean-up otherwise. */
export const startOffline = (): Promise<void> =>
  readConsent() === "yes" ? enableOffline() : disableOffline();
