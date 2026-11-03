import { describe, expect, it } from "vitest";
import { DEFAULT_BASEPLATE, validateBaseplate } from "./baseplateParams";
import { DEFAULT_BIN, validateBin } from "./binParams";
import { DEFAULT_LID, validateLid } from "./lidParams";
import {
  ModelFileError,
  SCHEMA_VERSION,
  parseModel,
  sanitizeBaseplate,
  sanitizeBin,
  sanitizeParams,
  serializeBaseplate,
  serializeBin,
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
    expect(() =>
      parseModel('{"type":"sliding_lid","schemaVersion":1}', "a.json"),
    ).toThrow(/not a lid/);
    expect(() =>
      parseModel(`{"type":"lid","schemaVersion":${SCHEMA_VERSION + 1}}`, "a.json"),
    ).toThrow(/Update the app/);
    expect(() => parseModel('{"type":"lid"}', "a.json")).toThrow(/schema version/);
  });
});

describe("C-03 baseplate model file", () => {
  it("round-trips every parameter", () => {
    const params = {
      ...DEFAULT_BASEPLATE,
      units_x: 4,
      units_y: 3,
      baseplate_style: "skeleton" as const,
      corner_magnets: true,
      center_magnet: true,
      rib_width: 6,
      plate_color: "#445566",
    };
    const file = parseModel(serializeBaseplate("My base", params));
    expect(file.params).toEqual(params);
    expect(file).toMatchObject({
      type: "baseplate",
      schemaVersion: SCHEMA_VERSION,
      name: "My base",
    });
  });

  it("clamps values below the spec minimum; never below the minimum", () => {
    const p = sanitizeBaseplate({
      corner_magnet_d: 3,
      baseplate_base: 0.3,
      center_magnet_d: 1,
      units_x: 99,
    });
    expect(p.corner_magnet_d).toBe(6.1);
    expect(p.baseplate_base).toBe(0.4);
    expect(p.center_magnet_d).toBe(6.1);
    expect(p.units_x).toBe(24);
    expect(validateBaseplate(p)).toEqual([]);
  });

  it("replaces wrong types, unknown choices and bad colours with defaults", () => {
    const p = sanitizeBaseplate({
      baseplate_style: "lace",
      units_y: "3",
      plate_color: "red",
      corner_magnets: "yes",
    });
    expect(p).toEqual(DEFAULT_BASEPLATE);
  });

  it("a baseplate saved before the drawer options opens with their defaults", () => {
    const { plate_min_x_mm, plate_min_y_mm, fit_x, fit_y, ...old } = DEFAULT_BASEPLATE;
    expect([plate_min_x_mm, plate_min_y_mm, fit_x, fit_y]).toEqual([0, 0, 0, 0]);
    expect(sanitizeBaseplate({ ...old, units_x: 4 })).toEqual({
      ...DEFAULT_BASEPLATE,
      units_x: 4,
    });
  });

  it("clamps the drawer values into their limits", () => {
    const p = sanitizeBaseplate({
      plate_min_x_mm: 9999,
      fit_x: -5,
      plate_min_y_mm: -3,
    });
    expect([p.plate_min_x_mm, p.fit_x, p.plate_min_y_mm]).toEqual([1000, -1, 0]);
  });

  it("opens a lid file as a lid and a baseplate file as a baseplate", () => {
    expect(parseModel(serializeModel("a", DEFAULT_LID, "")).type).toBe("lid");
    expect(parseModel(serializeBaseplate("b", DEFAULT_BASEPLATE)).type).toBe(
      "baseplate",
    );
  });
});

describe("C-07 bin model file", () => {
  it("round-trips every parameter", () => {
    const params = {
      ...DEFAULT_BIN,
      units_x: 3,
      height_units: 5,
      lip_style: "flat_lower" as const,
      wall_thickness: 1.6,
      corner_magnets: true,
      center_magnet: true,
      lip_color_enabled: true,
      plate_color: "#445566",
    };
    const file = parseModel(serializeBin("My bin", params));
    expect(file.params).toEqual(params);
    expect(file).toMatchObject({ type: "bin", name: "My bin" });
  });

  it("clamps values below the spec minimum; never below the minimum", () => {
    const p = sanitizeBin({
      wall_thickness: 0.8,
      bottom_thickness: 0.4,
      corner_magnet_d: 3,
      height_units: 999,
    });
    expect(p.wall_thickness).toBe(1.2);
    expect(p.bottom_thickness).toBe(0.8);
    expect(p.corner_magnet_d).toBe(6.1);
    expect(p.height_units).toBe(85);
    expect(validateBin(p)).toEqual([]);
  });

  it("replaces wrong types, unknown choices and bad colours with defaults", () => {
    const p = sanitizeBin({ lip_style: "tall", units_y: "3", plate_color: "red" });
    expect(p).toEqual(DEFAULT_BIN);
  });
});
