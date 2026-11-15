import { beforeAll, describe, expect, it } from "vitest";
import { DEFAULT_BASEPLATE } from "../model/baseplateParams";
import { newSetBin, type SetBin } from "../model/setParams";
import { buildAssemblyModel, type AssemblyBin } from "./assembly";
import { layoutOf as plateLayout } from "./baseplate";
import { layoutOf as binLayout } from "./bin";
import { initKernel, type Kernel } from "./kernel";

let kernel: Kernel;
beforeAll(async () => {
  kernel = await initKernel();
});

const plate = { ...DEFAULT_BASEPLATE, units_x: 4, units_y: 3 };

const item = (o: Partial<SetBin> & { w?: number; d?: number } = {}): AssemblyBin => {
  const b = newSetBin(o.col ?? 0, o.row ?? 0);
  b.bin.units_x = o.w ?? 1;
  b.bin.units_y = o.d ?? 1;
  b.bin.label_slot = "none";
  b.bin.plate_color = "#123456";
  b.turned = o.turned ?? false;
  b.lidOn = o.lidOn ?? false;
  b.name = o.name ?? "Bin";
  return { ...b, bin: b.bin };
};

const box = (parts: { positions: Float32Array }[]) => {
  const r = {
    x0: Infinity,
    x1: -Infinity,
    y0: Infinity,
    y1: -Infinity,
    z0: Infinity,
    z1: -Infinity,
  };
  for (const p of parts) {
    for (let i = 0; i < p.positions.length; i += 3) {
      const [x, y, z] = [
        p.positions[i] ?? 0,
        p.positions[i + 1] ?? 0,
        p.positions[i + 2] ?? 0,
      ];
      r.x0 = Math.min(r.x0, x);
      r.x1 = Math.max(r.x1, x);
      r.y0 = Math.min(r.y0, y);
      r.y1 = Math.max(r.y1, y);
      r.z0 = Math.min(r.z0, z);
      r.z1 = Math.max(r.z1, z);
    }
  }
  return r;
};

describe("assembly of a set", () => {
  it("makes one piece for the plate and one for each bin", () => {
    const model = buildAssemblyModel(kernel, {
      plate,
      bins: [item({ col: 0 }), item({ col: 1, name: "Second" })],
    });
    expect(model.tiles?.map((t) => t.name)).toEqual(["Base", "Bin", "Second"]);
    expect(model.tiles?.map((t) => t.bodyName)).toEqual(["Base", "Bin", "Bin"]);
  });

  it("stands a bin on the floor of its cell, with the bin's own colour", () => {
    const one = item({ col: 1, row: 0, w: 1, d: 1 });
    one.bin.plate_color = "#123456";
    const model = buildAssemblyModel(kernel, { plate, bins: [one] });
    const base = plateLayout(plate);
    const baseParts = model.parts.filter((p) => p.colour === plate.plate_color);
    const plateBox = box(baseParts);
    const binParts = model.parts.filter((p) => p.colour === "#123456");
    const b = box(binParts);
    // the bin's lowest point is the pocket floor of the plate
    expect(b.z0).toBeCloseTo(plateBox.z0 + base.base, 3);
    // the second cell from the left, in the back row: the middle is 1.5 cells from the left
    expect((b.x0 + b.x1) / 2).toBeCloseTo(plateBox.x0 + base.gridX + 1.5 * 42, 3);
    expect((b.y0 + b.y1) / 2).toBeCloseTo(plateBox.y1 - base.gridY - 0.5 * 42, 3);
  });

  it("counts rows from the back", () => {
    const back = buildAssemblyModel(kernel, { plate, bins: [item({ row: 0 })] });
    const front = buildAssemblyModel(kernel, { plate, bins: [item({ row: 2 })] });
    const y = (m: typeof back) =>
      box(m.parts.filter((p) => p.colour === "#123456").slice(0, 1)).y0;
    expect(y(back)).toBeGreaterThan(y(front));
    expect(y(back) - y(front)).toBeCloseTo(2 * 42, 3);
  });

  it("swaps width and depth of a turned bin", () => {
    const straight = buildAssemblyModel(kernel, {
      plate,
      bins: [item({ w: 3, d: 1 })],
    });
    const turned = buildAssemblyModel(kernel, {
      plate,
      bins: [item({ w: 3, d: 1, turned: true })],
    });
    const of = (m: typeof straight) =>
      box(m.parts.filter((p) => p.colour === "#123456"));
    const [s, t] = [of(straight), of(turned)];
    expect(t.x1 - t.x0).toBeCloseTo(s.y1 - s.y0, 2);
    expect(t.y1 - t.y0).toBeCloseTo(s.x1 - s.x0, 2);
    // the piece for export is not turned: it keeps its print position
    expect(straight.tiles?.[1]?.size[0]).toBeCloseTo(
      turned.tiles?.[1]?.size[0] ?? 0,
      3,
    );
  });

  it("puts the lid on top of the bin, foot down, and adds a piece for it", () => {
    const one = item({ lidOn: true, name: "With lid" });
    one.lid.print_orientation = "upside_down";
    one.lid.plate_color = "#fedcba";
    const model = buildAssemblyModel(kernel, { plate, bins: [one] });
    expect(model.tiles?.map((t) => t.name)).toEqual([
      "Base",
      "With lid",
      "With lid lid",
    ]);
    const base = plateLayout(plate);
    const floor = box(model.parts).z0 + base.base;
    const lidParts = model.parts.filter((p) => p.colour === "#fedcba");
    expect(lidParts.length).toBeGreaterThan(0);
    const lid = box(lidParts);
    // the foot goes down into the stacking lip: it stands on the top of the body
    expect(lid.z0).toBeCloseTo(floor + binLayout(one.bin).bodyHeight, 3);
    expect(lid.z1).toBeGreaterThan(floor + binLayout(one.bin).top);
  });

  it("takes the size of the largest piece for the bed check", () => {
    const model = buildAssemblyModel(kernel, { plate, bins: [item()] });
    const [w, d] = [model.size[0], model.size[1]];
    expect(w).toBeCloseTo(4 * 42, 1);
    expect(d).toBeCloseTo(3 * 42, 1);
  });

  it("gives every piece closed, non-empty parts", () => {
    const model = buildAssemblyModel(kernel, {
      plate,
      bins: [item({ lidOn: true })],
    });
    for (const t of model.tiles ?? []) {
      for (const part of t.parts) {
        expect(part.indices.length).toBeGreaterThan(0);
        expect(part.volume).toBeGreaterThan(0);
      }
    }
  });
});
