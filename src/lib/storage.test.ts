import { describe, expect, it } from "vitest";
import { STORAGE_LIMIT_CHARS, storageFill } from "./storage";

describe("storage fill", () => {
  it("is empty, half full and full", () => {
    expect(storageFill(0)).toMatchObject({ fraction: 0, text: "0 MB of about 5 MB" });
    expect(storageFill(STORAGE_LIMIT_CHARS / 2).fraction).toBe(0.5);
    expect(storageFill(STORAGE_LIMIT_CHARS).warn).toBe(true);
  });

  it("never goes past 100 % and warns from 80 %", () => {
    expect(storageFill(STORAGE_LIMIT_CHARS * 3).fraction).toBe(1);
    expect(storageFill(STORAGE_LIMIT_CHARS * 0.79).warn).toBe(false);
    expect(storageFill(STORAGE_LIMIT_CHARS * 0.8).warn).toBe(true);
  });

  it("shows one decimal", () => {
    expect(storageFill(1.26 * 1024 * 1024).text).toBe("1.3 MB of about 5 MB");
  });
});
