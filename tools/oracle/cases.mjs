// Label cases use flush_gap 0: the app puts raised and flush labels directly on the plate
// (owner, 2 November 2026). Hollow foot with magnets is not compared: the app does not route the
// hollow around the pockets, the script does.
// Cases compared with the reference script, at or above the spec minimum (skills/reference-oracle).
// Keys are script parameter names. Text cases are left out: the script's fonts are those installed
// where it runs, the app bundles its own (the symbol cases cover the label code).
export const ORACLE_CASES = {
  lid_1x1: {},
  lid_2x1: { units_x: 2 },
  lid_4x4_merged: { units_x: 4, units_y: 4 },
  lid_3x2_per_cell: { units_x: 3, units_y: 2, foot_layout: "per_cell" },
  lid_manual_plate_3_5: { plate_thickness_mode: "manual", plate_thickness: 3.5 },
  lid_auto_2u: { plate_thickness_mode: "auto", height_units_auto: 2 },
  lid_upside_down: { print_orientation: "upside_down" },
  stackable_1x1: { variant: "stackable" },
  stackable_corners_only_2x2: {
    variant: "stackable",
    lip_mode: "corners_only",
    units_x: 2,
    units_y: 2,
  },
  stackable_corner_len_15: {
    variant: "stackable",
    lip_mode: "corners_only",
    corner_len: 15,
  },
  magnets_1x1: { corner_magnets: true },
  magnets_4x4: { corner_magnets: true, units_x: 4, units_y: 4 },
  magnets_3x2_per_cell: {
    corner_magnets: true,
    units_x: 3,
    units_y: 2,
    foot_layout: "per_cell",
  },
  magnets_8_1_x_3_9: {
    corner_magnets: true,
    corner_magnet_d: 8.1,
    corner_magnet_h: 3.9,
  },
  hollow_1x1: { foot_hollow: "open" },
  hollow_2x2: { foot_hollow: "open", units_x: 2, units_y: 2 },
  hollow_wall_2_5: { foot_hollow: "open", foot_wall: 2.5 },
  symbol_raised: { flush_gap: 0, symbol_mode: "raised", symbol_icon: "tools_wrench" },
  symbol_engraved: {
    flush_gap: 0,
    symbol_mode: "engraved",
    symbol_icon: "tools_wrench",
  },
  symbol_flush: { flush_gap: 0, symbol_mode: "flush", symbol_icon: "tools_wrench" },
  symbol_raised_scaled_rotated: {
    flush_gap: 0,
    symbol_mode: "raised",
    symbol_icon: "safety_hard-hat",
    icon_size: 20,
    symbol_scale: 1.5,
    symbol_rotation: 45,
    symbol_offset_x: 3,
    symbol_offset_y: -2,
  },
  symbol_upside_down_raised: {
    flush_gap: 0,
    symbol_mode: "raised",
    symbol_icon: "tools_bolt",
    print_orientation: "upside_down",
  },
};
