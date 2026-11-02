import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { initKernel, type Kernel } from "./kernel";
import { solidFoot } from "./foot";
import { isClosed, sizeOf, vertices } from "./mesh";

let kernel: Kernel;
beforeAll(async () => {
  kernel = await initKernel();
});
afterAll(() => undefined);

describe("foot (B-03)", () => {
  it("is a closed solid", () => {
    const foot = solidFoot(kernel);
    expect(isClosed(foot)).toBe(true);
    expect(foot.genus()).toBe(0);
    foot.delete();
  });

  it("foot bottom edge is 35.6 for 1x1", () => {
    const foot = solidFoot(kernel);
    const bottom = vertices(foot).filter(([, , z]) => Math.abs(z) < 1e-6);
    const xs = bottom.map(([x]) => x);
    const ys = bottom.map(([, y]) => y);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(35.6, 4);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(35.6, 4);
    foot.delete();
  });

  it("foot is 41.5 wide at the top and 4.75 (+0.01 overlap) high", () => {
    const foot = solidFoot(kernel);
    const size = sizeOf(foot);
    expect(size.x).toBeCloseTo(41.5, 4);
    expect(size.y).toBeCloseTo(41.5, 4);
    expect(size.z).toBeCloseTo(4.76, 4);
    foot.delete();
  });

  it("a merged foot is widened by the extra half size", () => {
    const foot = solidFoot(kernel, 21, 0);
    expect(sizeOf(foot).x).toBeCloseTo(83.5, 4);
    expect(sizeOf(foot).y).toBeCloseTo(41.5, 4);
    foot.delete();
  });
});
