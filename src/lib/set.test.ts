// The set in the editor store (ADR-0009): bins, their places, the plate check and the file.
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// the store starts a worker when it builds; the tests only look at its state
class FakeWorker {
  onmessage: unknown;
  onerror: unknown;
  postMessage(): void {}
  terminate(): void {}
}
vi.stubGlobal("Worker", FakeWorker);

let editor: (typeof import("./store.svelte"))["editor"];
beforeAll(async () => {
  ({ editor } = await import("./store.svelte"));
});

const reset = () => {
  while (editor.slots.length > 1) editor.removeBin(editor.slots.length - 1);
  editor.part = "bin";
  editor.baseplate.units_x = 4;
  editor.baseplate.units_y = 3;
  editor.col = 0;
  editor.row = 0;
  editor.turned = false;
  editor.bin.units_x = 1;
  editor.bin.units_y = 1;
};
beforeEach(() => reset());

describe("bins of a set", () => {
  it("starts with one bin and is no set", () => {
    expect(editor.slots).toHaveLength(1);
    expect(editor.inSet).toBe(false);
  });

  it("adds a bin on the first free cell and makes it the one being edited", () => {
    expect(editor.addBin()).toBe(true);
    expect(editor.slots).toHaveLength(2);
    expect(editor.activeBin).toBe(1);
    expect([editor.col, editor.row]).toEqual([1, 0]);
    expect(editor.inSet).toBe(true);
  });

  it("keeps the values of every bin apart", () => {
    editor.bin.height_units = 5;
    editor.addBin();
    expect(editor.bin.height_units).toBe(3);
    editor.bin.height_units = 2;
    editor.selectBin(0);
    expect(editor.bin.height_units).toBe(5);
    editor.selectBin(1);
    expect(editor.bin.height_units).toBe(2);
  });

  it("keeps the label and the lid of each bin with it", () => {
    editor.label.text_string = "Screws";
    editor.lidOn = true;
    editor.addBin();
    expect(editor.label.text_string).not.toBe("Screws");
    expect(editor.lidOn).toBe(false);
    editor.selectBin(0);
    expect(editor.label.text_string).toBe("Screws");
    expect(editor.lidOn).toBe(true);
  });

  it("gives the lid the size of its bin", () => {
    editor.bin.units_x = 2;
    editor.addBin();
    editor.selectBin(0);
    editor.part = "lid";
    expect(editor.params.units_x).toBe(2);
  });

  it("refuses a bin when the plate is full", () => {
    editor.baseplate.units_x = 2;
    editor.baseplate.units_y = 1;
    expect(editor.addBin()).toBe(true);
    expect(editor.setFull).toBe(true);
    expect(editor.addBin()).toBe(false);
    expect(editor.addNote).toMatch(/plate is full/);
    expect(editor.slots).toHaveLength(2);
  });

  it("reports a bin that lies on another and one that sticks out", () => {
    editor.addBin();
    editor.col = 0; // on bin 1
    expect(editor.activeProblems[0]).toMatch(/lies on bin 1/);
    editor.col = 3;
    editor.bin.units_x = 2; // over the edge of 4 columns
    expect(editor.activeProblems[0]).toMatch(/does not fit/);
    editor.col = 2;
    expect(editor.activeProblems).toEqual([]);
  });

  it("removes a bin but never the last one", () => {
    editor.addBin();
    editor.addBin();
    expect(editor.removeBin(0)).toBe(true);
    expect(editor.slots).toHaveLength(2);
    editor.removeBin(0);
    expect(editor.removeBin(0)).toBe(false);
    expect(editor.slots).toHaveLength(1);
  });

  it("keeps editing the same bin when an earlier one is removed", () => {
    editor.addBin();
    editor.addBin();
    editor.bin.height_units = 6; // the third bin
    editor.removeBin(0);
    expect(editor.activeBin).toBe(1);
    expect(editor.bin.height_units).toBe(6);
  });
});

describe("the file of a set", () => {
  it("is a set file once there are several bins, and opens again with every bin", () => {
    editor.bin.height_units = 4;
    editor.addBin();
    editor.bin.height_units = 2;
    editor.turned = true;
    const text = editor.toFileText();
    expect(JSON.parse(text).type).toBe("set");

    reset();
    expect(editor.open(text, "set.json")).toBe(true);
    expect(editor.slots).toHaveLength(2);
    expect(editor.part).toBe("assembly");
    editor.selectBin(1);
    expect([editor.bin.height_units, editor.turned]).toEqual([2, true]);
    editor.selectBin(0);
    expect(editor.bin.height_units).toBe(4);
  });

  it("is still a single bin file with one bin", () => {
    editor.part = "bin";
    expect(JSON.parse(editor.toFileText()).type).toBe("bin");
  });
});

describe("lid and label only where switched on", () => {
  it("leaves the lid tab when the bin has no lid", () => {
    editor.lidOn = true;
    editor.part = "lid";
    editor.lidOn = false;
    editor.leaveSwitchedOffPart();
    expect(editor.part).toBe("bin");
  });

  it("leaves the lid tab for the bin picked next if that one has no lid", () => {
    editor.lidOn = true;
    editor.addBin();
    editor.selectBin(0);
    editor.part = "lid";
    editor.selectBin(1);
    editor.leaveSwitchedOffPart();
    expect(editor.part).toBe("bin");
  });

  it("leaves the label tab when the label slot is switched off", () => {
    editor.part = "label";
    expect(editor.bin.label_slot).toBe("back");
    editor.bin.label_slot = "none";
    editor.leaveSwitchedOffPart();
    expect(editor.part).toBe("bin");
    editor.bin.label_slot = "none";
  });

  it("keeps the lid tab open for a bin with a lid", () => {
    editor.lidOn = true;
    editor.part = "lid";
    editor.leaveSwitchedOffPart();
    expect(editor.part).toBe("lid");
    editor.lidOn = false;
    editor.part = "bin";
  });
});

describe("holes of the bins follow a size typed on the baseplate", () => {
  it("stud hole = stud + 0.1 mm, in every bin, within the limits", () => {
    editor.addBin();
    editor.carryToBins("stud_d", 5);
    expect(editor.bin.stud_hole_d).toBeCloseTo(5.1, 6);
    editor.selectBin(0);
    expect(editor.bin.stud_hole_d).toBeCloseTo(5.1, 6);
    editor.carryToBins("stud_d", 8);
    expect(editor.bin.stud_hole_d).toBeCloseTo(8.1, 6);
  });

  it("a corner magnet pocket gets 0.1 mm more, the centre magnet its own clearance", () => {
    editor.carryToBins("corner_magnet_d", 6.5);
    expect(editor.bin.corner_magnet_d).toBeCloseTo(6.6, 6);
    editor.carryToBins("center_magnet_d", 7);
    expect(editor.bin.center_magnet_d).toBeCloseTo(7, 6);
  });

  it("nothing changes until a size is typed", () => {
    expect(editor.bin.stud_hole_d).toBeGreaterThanOrEqual(3.1);
  });
});

describe("bins are placed so that they fit", () => {
  it("a bin that grows onto another moves to the first free spot", () => {
    editor.addBin(); // bin 2 at column 2
    editor.col = 1;
    editor.selectBin(0);
    editor.bin.units_x = 2; // now covers columns 1 and 2: on bin 2
    editor.settleBins();
    expect(editor.activeProblems).toEqual([]);
    editor.selectBin(1);
    expect(editor.activeProblems).toEqual([]);
  });

  it("a plate made smaller takes the bins back inside", () => {
    editor.addBin();
    editor.col = 3;
    editor.baseplate.units_x = 2;
    editor.settleBins();
    expect(editor.activeProblems).toEqual([]);
    expect(editor.col).toBeLessThan(2);
  });

  it("a bin that fits stays where it is", () => {
    editor.addBin();
    editor.col = 3;
    editor.row = 2;
    editor.settleBins();
    expect([editor.col, editor.row]).toEqual([3, 2]);
  });

  it("a new bin starts with the hole sizes carried over from the baseplate", () => {
    editor.carryToBins("stud_d", 6);
    editor.addBin();
    expect(editor.bin.stud_hole_d).toBeCloseTo(6.1, 6);
  });
});

describe("colours stay with the model that is shown", () => {
  it("another part is computed: the colours of the old part stay with its model", () => {
    editor.baseplate.plate_color = "#FF0000";
    editor.bin.plate_color = "#00FF00";
    editor.model = {
      parts: [],
      size: [1, 1, 1],
      warnings: [],
    } as unknown as typeof editor.model;
    editor.modelPart = "baseplate";
    editor.part = "bin";
    expect(editor.colours.plate).toBe("#FF0000");
    editor.modelPart = "bin";
    expect(editor.colours.plate).toBe("#00FF00");
    editor.model = null;
    editor.part = "bin";
  });
});
