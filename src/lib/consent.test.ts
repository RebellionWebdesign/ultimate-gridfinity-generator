import { describe, expect, it } from "vitest";
import { CONSENT_KEY, readConsent, writeConsent, type ChoiceStore } from "./consent";

const memory = (): ChoiceStore & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
};

describe("consent", () => {
  it("is unset until the user has chosen", () => {
    expect(readConsent(memory())).toBe("unset");
    expect(readConsent(undefined)).toBe("unset");
  });

  it("remembers yes and no", () => {
    const store = memory();
    expect(writeConsent("yes", store)).toBe(true);
    expect(readConsent(store)).toBe("yes");
    writeConsent("no", store);
    expect(readConsent(store)).toBe("no");
  });

  it("treats anything else in the store as unset", () => {
    const store = memory();
    store.data.set(CONSENT_KEY, "maybe");
    expect(readConsent(store)).toBe("unset");
  });

  it("survives a browser that blocks storage", () => {
    const blocked: ChoiceStore = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readConsent(blocked)).toBe("unset");
    expect(writeConsent("yes", blocked)).toBe(false);
    expect(writeConsent("yes", undefined)).toBe(false);
  });
});
