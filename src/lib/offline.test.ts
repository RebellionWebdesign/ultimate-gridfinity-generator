import { describe, expect, it } from "vitest";
import { disableOffline } from "./offline";

describe("disableOffline", () => {
  it("unregisters every worker and deletes every cache", async () => {
    const log: string[] = [];
    await disableOffline({
      serviceWorker: {
        getRegistrations: async () => [
          { unregister: async () => (log.push("worker a"), true) },
          { unregister: async () => (log.push("worker b"), true) },
        ],
      },
      caches: {
        keys: async () => ["precache", "runtime"],
        delete: async (key) => (log.push(`cache ${key}`), true),
      },
    });
    expect(log.sort()).toEqual([
      "cache precache",
      "cache runtime",
      "worker a",
      "worker b",
    ]);
  });

  it("does nothing in a browser without them", async () => {
    await expect(disableOffline({})).resolves.toBeUndefined();
  });

  it("does not throw when the browser refuses", async () => {
    await expect(
      disableOffline({
        serviceWorker: {
          getRegistrations: async () => {
            throw new Error("refused");
          },
        },
      }),
    ).resolves.toBeUndefined();
  });
});
