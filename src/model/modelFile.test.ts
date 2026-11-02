import { describe, expect, it } from "vitest";
import { DEFAULT_LID, validateLid } from "./lidParams";
import {
  ModelFileError,
  SCHEMA_VERSION,
  parseModel,
  sanitizeParams,
  serializeModel,
} from "./modelFile";

describe("B-11 model file", () => {
  it("round-trips every parameter, the text, colours and the SVG string", () => {
    const params = {
      ...DEFAULT_LID,
      units_x: 3,
      text_mode: "raised" as const,
      text_string: "M3 × 8",
      plate_color: "#112233",
      symbol_source: "upload" as const,
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h10v10z"/></svg>',
    };
    const file = parseModel(serializeModel("My lid", params, "logo.svg"));
    expect(file.params).toEqual(params);
    expect(file).toMatchObject({
      type: "lid",
      schemaVersion: SCHEMA_VERSION,
      name: "My lid",
      svgName: "logo.svg",
    });
  });

  it("clamps values below the spec minimum and above the limit; never below the minimum", () => {
    const p = sanitizeParams({
      corner_magnet_d: 3,
      text_size: 2,
      corner_len: 5,
      units_x: 99,
      plate_thickness: 0.6,
    });
    expect(p.corner_magnet_d).toBe(6.1);
    expect(p.text_size).toBe(5);
    expect(p.corner_len).toBe(10);
    expect(p.units_x).toBe(12);
    expect(p.plate_thickness).toBe(2.25);
    expect(validateLid(p)).toEqual([]);
  });

  it("replaces wrong types, unknown choices and bad colours with defaults", () => {
    const p = sanitizeParams({
      variant: "huge",
      units_y: "3",
      plate_color: "red",
      corner_magnets: "yes",
      extra: 1,
    });
    expect(p).toEqual(DEFAULT_LID);
  });

  it("rejects non-JSON, other models and newer schemas with a message that says what to do", () => {
    expect(() => parseModel("nope", "a.json")).toThrow(ModelFileError);
    expect(() => parseModel('{"type":"bin","schemaVersion":1}', "a.json")).toThrow(
      /not a lid/,
    );
    expect(() =>
      parseModel(`{"type":"lid","schemaVersion":${SCHEMA_VERSION + 1}}`, "a.json"),
    ).toThrow(/Update the app/);
    expect(() => parseModel('{"type":"lid"}', "a.json")).toThrow(/schema version/);
  });
});
