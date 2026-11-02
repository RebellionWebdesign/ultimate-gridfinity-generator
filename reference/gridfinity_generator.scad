/*
  Parametric Gridfinity generator (lid / bin / baseplate / sliding lid)
  For MakerWorld Parametric Model Maker (PMM) - single file, no includes.

  Credit: Gridfinity by Zack Freedman (Voidstar Lab LLC).
  Dimensions follow the Gridfinity Design Reference v5 (gridfinity.xyz/specification).
  Cross-checked against (not copied from) kennetek/gridfinity-rebuilt-openscad (MIT).

  Gridfinity copyright notice (Voidstar Lab, MIT text):

    MIT License

    Copyright (c) 2023 Zachary Freedman and Voidstar Lab LLC

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.

  Built-in icons: Lucide (https://lucide.dev), flattened to polylines.

    ISC License

    Copyright (c) 2026 Lucide Icons and Contributors

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted, provided that the above
    copyright notice and this permission notice appear in all copies.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
    WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
    MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
    ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
    WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
    ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
    OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

  These built-in icons are derived from Feather:
  (BEGIN FEATHER LIST)
  arrow-down, arrow-left, arrow-right, arrow-up, check, circle-alert, circle-x,
  clock, info, lock, octagon-alert, octagon-x, search, target, trash,
  triangle-alert, x
  (END FEATHER LIST)

    The MIT License (MIT)

    Copyright (c) 2013-present Cole Bemis

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.

  License of this file: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
  (CC BY-NC-SA 4.0), https://creativecommons.org/licenses/by-nc-sa/4.0/
  The Gridfinity Design Reference v5 (gridfinity.xyz) states that Gridfinity is licensed CC BY-NC-SA and that
  derived projects should be licensed accordingly; this generator follows that. The Gridfinity copyright
  notice and the Lucide / Feather notices above stay in force for the material they cover.
  Copyright (c) 2026 [TODO: your name or handle] - generator code and additions.

  PMM notes:
  - Every colored body is its own top-level color() child; no union() across colors.
  - No minkowski, no hull over text. All shapes are lofted polyhedra.
  - No mw_plate_N modules (would disable STL download).
*/

/* [1. What do you want to make?] */
// Part: lid (covers a bin or baseplate), bin (container) or baseplate (the grid bins sit in)
mode = "lid"; // [lid, bin, baseplate]
// Size in grid cells, left to right (1 cell = 42 mm)
units_x = 1; // [1:1:12]
// Size in grid cells, front to back (1 cell = 42 mm)
units_y = 1; // [1:1:12]
// Lid type. foot: normal lid that sits on a bin or baseplate. sliding: slide-in lid (for a bin this cuts the groove, so the bin needs a flat top; for a lid it makes the matching slide-in lid)
lid_style = "foot"; // [foot, sliding]
// Your printer. The part is checked against its print bed (Custom: enter the size under Advanced)
printer = "P2S"; // [P2S, P1S, P1P, X1C, X1E, A1, A1 mini, H2D, H2S, Custom]

/* [2. Lid options (lid only)] */
// dust_cover: plain flat lid. stackable: adds a stacking lip on top so a bin can sit on it
variant = "dust_cover"; // [dust_cover, stackable]
// Stacking lip all around, or only in the corners (stackable lids)
lip_mode = "full"; // [full, corners_only]
// merged: one continuous foot under the whole lid (for one large bin). per_cell: one foot per cell (for several 1x1 bins)
foot_layout = "merged"; // [merged, per_cell]
// How the lid thickness is set. manual: enter it below. auto: choose the total height in 7 mm units
plate_thickness_mode = "manual"; // [manual, auto]
// Lid thickness above the foot, in mm (manual mode)
plate_thickness = 2.25; // [0.6:0.05:20]
// Total lid height in 7 mm units (auto mode)
height_units_auto = 1; // [1:1:6]
// Print orientation. foot_down: as it sits. upside_down: flipped so the top face is on the bed
print_orientation = "foot_down"; // [foot_down, upside_down]

/* [3. Bin options (bin only)] */
// Bin height in 7 mm units (the stacking lip is extra)
height_units = 3; // [1:1:12]
// Top edge. with_lip: stacking lip on top (+4.4 mm). flat_same_height: no lip, same total height. flat_lower: no lip, 4.4 mm lower. (With a sliding lid the lip is switched off automatically)
lip_style = "with_lip"; // [with_lip, flat_same_height, flat_lower]
// Wall thickness in mm
wall_thickness = 1.2; // [0.8:0.1:3]
// Floor thickness above the foot in mm
bottom_thickness = 0.8; // [0.4:0.1:5]
// 3 mm screw holes at the corner magnet positions
screw_holes = false;

/* [4. Baseplate options (baseplate only)] */
// solid: closed floor. skeleton: only a frame, saves material
baseplate_style = "solid"; // [solid, skeleton]
// Use as many cells as fit on your printer bed (ignores the size in part 1)
baseplate_fit_bed = false;
// Fit a drawer: minimum width in mm (0 = off). Extra space is filled solid
plate_min_x_mm = 0;
// Fit a drawer: minimum depth in mm (0 = off)
plate_min_y_mm = 0;
// Fit a drawer: where the extra width goes. -1 = left, 0 = both sides, 1 = right
fit_x = 0; // [-1:0.1:1]
// Fit a drawer: where the extra depth goes. -1 = front, 0 = both sides, 1 = back
fit_y = 0; // [-1:0.1:1]

/* [5. Magnets and hollow foot (lid, bin, baseplate)] */
// Corner magnet pockets. Lid: on the top side, in the 4 outermost corners of the lid (a 1x1 lid has 4, a 4x4 lid only the outer 4). Bin: in the foot, in the 4 outermost corners. Baseplate: in every cell
corner_magnets = false;
// Corner magnet pocket diameter in mm. 6.1 fits a 6 mm magnet, 8.1 an 8 mm magnet. The top value is the largest that keeps 0.75 mm of wall at the foot edge (corner magnets only)
corner_magnet_d = 6.1; // [3:0.1:8.1]
// Corner magnet pocket depth in mm. 2.1 fits a 2 mm thick magnet. On a lid it is cut from the top face and always leaves 0.8 mm of material below the pocket
corner_magnet_h = 2.1; // [1:0.1:3.9]
// Magnet pocket in the middle of every cell (bin foot and baseplate only; a lid has no center magnet)
center_magnet = false;
// Center magnet diameter in mm (max 10)
center_magnet_d = 5.0; // [3:0.1:10]
// Center magnet thickness in mm
center_magnet_h = 2.0; // [1:0.1:5]
// Extra room around the center magnet in mm
magnet_clearance = 0.2; // [0:0.05:0.6]
// Hollow foot to save material. open: cavity open underneath. open_like_baseplate (bin): like open, with the magnets placed like on the baseplate - flush pads in the corners and a ring in the center. skin: closed void (bin)
foot_hollow = "none"; // [none, open, skin, open_like_baseplate]
// Center magnet sits on a rounded square held by 4 ribs (hollow foot and skeleton baseplate)
center_ribs = true;
// Rib width in mm
rib_width = 4.0; // [2:0.5:10]

/* [6. Sliding lid (only with lid type sliding)] */
// Play between lid and bin in mm (0.3 is a good start)
sliding_clearance = 0.3; // [0.1:0.05:0.8]
// Finger recess in the lid for pulling it out (size and position under Advanced)
finger_cutout = false;

/* [7. Label on the lid (lid only)] */
// Label text
text_string = "Text";
// Text style. none: off. raised: sticks out. engraved: cut in. flush: separate colored inlay level with the surface
text_mode = "none"; // [none, raised, engraved, flush]
// Text height in mm
text_size = 8; // [8:0.5:30]
// Font. Choose Other to pick any font below
font_choice = "Inter"; // [Inter, IBM Plex Mono, IBM Plex Sans SemiBold, Other]
// Font to use when the font above is Other (any font installed on MakerWorld)
text_font = "Liberation Sans"; // font
// Style for the Other font, e.g. Bold, SemiBold, Italic (empty = default)
text_font_style = "";
// Symbol style (same options as text)
symbol_mode = "none"; // [none, raised, engraved, flush]
// Symbol: built-in icon or your own SVG file
symbol_source = "lucide"; // [lucide, upload]
// BEGIN LUCIDE LIST
// Built-in icon (when the symbol is a built-in icon)
symbol_icon = "safety_hard-hat"; // [safety_hard-hat, safety_glasses, safety_shield-check, safety_shield-alert, safety_siren, safety_triangle-alert, safety_octagon-alert, safety_octagon-x, safety_ban, safety_hand, safety_flame, safety_zap, safety_biohazard, safety_radiation, safety_fire-extinguisher, safety_briefcase-medical, safety_eye, safety_lock, safety_lock-open, safety_info, safety_circle-alert, quality_circle-check, quality_circle-x, quality_check, quality_x, quality_badge-check, quality_clipboard-check, quality_clipboard-list, quality_list-checks, quality_search, quality_scan-search, quality_microscope, quality_gauge, quality_ruler, quality_scale, quality_thermometer, quality_target, quality_flag, quality_chart-column, quality_chart-line, quality_trending-up, quality_trending-down, inventory_package, inventory_package-check, inventory_package-x, inventory_package-open, inventory_boxes, inventory_container, inventory_warehouse, inventory_archive, inventory_arrow-down-to-line, inventory_arrow-up-to-line, inventory_shopping-cart, inventory_calendar-clock, inventory_barcode, inventory_qr-code, inventory_tag, inventory_layers, flow_arrow-up, flow_arrow-down, flow_arrow-left, flow_arrow-right, flow_arrow-left-right, flow_repeat, flow_refresh-cw, flow_undo-2, flow_recycle, flow_trash, flow_workflow, flow_truck, flow_factory, flow_timer, flow_clock, flow_hourglass, tools_wrench, tools_hammer, tools_drill, tools_scissors, tools_cable, tools_plug, tools_bolt, tools_settings, tools_spray-can, tools_brush-cleaning, tools_sparkles, tools_paintbrush, tools_pipette, tools_magnet, tools_layout-grid, tools_user-check, tools_users, tools_droplet, tools_snowflake]
// END LUCIDE LIST
// Symbol size in mm
icon_size = 14; // [4:1:40]
// Your SVG file (when the symbol is your own SVG)
svg_file = "default.svg";
// With text and symbol together: where the symbol sits
label_arrange = "icon_left"; // [icon_left, icon_right, icon_above, icon_below]
// Height of raised text / depth of engraved text, in mm
emboss_depth = 0.6; // [0.2:0.1:2]

/* [8. Label fine-tuning] */
// Place text and symbol automatically as one group. Off: place them yourself with the offsets below
label_group = true;
// Alignment inside the group: center, or start (top / left) or end (bottom / right)
label_align = "center"; // [center, start, end]
// Gap between text and symbol in mm
label_gap = 3; // [0:0.5:20]
// Center the whole group on the lid. Off: the text stays centered
label_center = true;
// Move the text, left / right in mm
text_offset_x = 0;
// Move the text, front / back in mm
text_offset_y = 0;
// Rotate the text in degrees
text_rotation = 0; // [-180:5:180]
// Move the symbol, left / right in mm
symbol_offset_x = 0;
// Move the symbol, front / back in mm
symbol_offset_y = 0;
// Rotate the symbol in degrees
symbol_rotation = 0; // [-180:5:180]

/* [9. Colors] */
// Main body color
plate_color = "#3A7BD5"; // color
// Text and symbol color
text_color = "#FFFFFF"; // color
// Give the stacking lip its own color (bins with a lip, stackable lids)
lip_color_enabled = false;
// Stacking lip color
lip_color = "#FFFFFF"; // color

/* [10. Advanced (rarely needed)] */
// Print bed check. error: stop with a message if the part does not fit (turning it 90 degrees is allowed). off: no check
bed_check = "error"; // [error, off]
// Custom printer: bed width in mm
custom_bed_x = 256; // [50:1:600]
// Custom printer: bed depth in mm
custom_bed_y = 256; // [50:1:600]
// Custom printer: build height in mm
custom_bed_z = 256; // [20:1:600]
// Baseplate: solid base under the pockets in mm (spec: about 5 mm total height). Raised automatically for magnets
baseplate_base = 0.35; // [0.2:0.05:8]
// Corner stacking lip: length of each corner piece in mm
corner_len = 10; // [5:1:30]
// Hollow foot: wall thickness in mm
foot_wall = 1.2; // [0.4:0.1:3]
// Closed hollow foot (bin): skin thickness in mm
foot_skin = 0.8; // [0.4:0.1:2]
// Hollow foot hub: height of the hub underside above the foot bottom in mm (0 = flush)
hub_z = 0; // [0:0.2:3]
// Your own SVG: scale factor
symbol_scale = 1.0; // [0.05:0.05:10]
// Label group: text width per character = text size x this factor (0 = automatic for the font)
text_width_factor = 0; // [0:0.01:1.2]
// Flush label: pocket depth and inlay thickness in mm (0.4 = 2 layers)
flush_depth = 0.4; // [0.2:0.2:1.2]
// Raised or flush label: gap to the plate in mm, keeps the label a separate body in STL and 3MF
flush_gap = 0.05; // [0.02:0.01:0.2]
// Sliding lid thickness in mm (0 = 2 x wall)
sliding_lid_thickness = 0;
// Sliding lid: minimum wall left beside the groove in mm (0 = half the wall)
sliding_min_wall = 0;
// Sliding lid: width of the ledge under the lid edge in mm (0 = half the lid thickness)
sliding_support = 0;
// Finger recess: width in mm
finger_w = 14; // [4:1:40]
// Finger recess: length in mm
finger_l = 9; // [4:1:30]
// Finger recess: corner radius in mm
finger_r = 4; // [0.5:0.5:10]
// Finger recess: distance from the lid front edge in mm
finger_y = 8; // [4:1:60]
// Finger recess: depth in mm (0 = 60% of the lid thickness)
finger_depth = 0;

/* [Hidden] */
// ---- Gridfinity constants (Design Reference v5) ----
PITCH = 42;
UNIT_H = 7;
CLEAR = 0.5;            // outer size = n*42 - 0.5
R_BIN = 3.75;
FOOT_H = 4.75;
LIP_H = 4.4;
SCREW_D = 3.0;
HOLE_OFF = 13;          // 26 mm hole spacing
BP_R = 4.0;
BP_PROFILE_H = 4.65;
BP_RIDGE_TRIM = 0;      // spec ridge is a knife edge; raise to ~0.1 to flatten it if a slicer/backend rejects the mesh
CYL_FN = 40;
Q = 6;                  // segments per rounded corner

// Corner magnet pockets: the user sets corner_magnet_d / _h (the Gridfinity hole itself is 6.5 mm).
// Safe limits, so a pocket can never break through a wall or run into the center pocket.
// (Top-level variables are evaluated in order, so this must stay below the constants it uses.)
MAG_MIN_WALL = 0.75;    // least material between a corner pocket and the outside or another pocket (8.1 mm pocket for an 8 mm magnet)
cm_d_max = min(2 * (4.8 - MAG_MIN_WALL),                                             // foot bottom: hole center is 4.8 mm from the edge
               mode == "baseplate" ? 2 * (5.15 - MAG_MIN_WALL) : 1000,                // baseplate pocket floor edge
               (center_magnet && mode != "lid") ? 2 * (HOLE_OFF * sqrt(2) - MAG_MIN_WALL - (center_magnet_d + magnet_clearance) / 2) : 1000);   // center pocket
cm_d = min(corner_magnet_d, cm_d_max);
// Lids carry only top-side corner magnets (no center magnet, no magnets in the foot)
corner_mag_foot = corner_magnets && mode != "lid";
center_mag_foot = center_magnet && mode != "lid";
cm_h = min(corner_magnet_h, FOOT_H - 0.8);                                           // leaves 0.8 mm above the pocket in a foot

// Bambu Lab build volumes [x, y, z] in mm (manufacturer specs; H2D/H2S figures from retailer listings - verify)
function bed_dims(p) =
    p == "P2S" ? [256, 256, 256] :
    p == "P1S" ? [256, 256, 256] :
    p == "P1P" ? [256, 256, 256] :
    p == "X1C" ? [256, 256, 256] :
    p == "X1E" ? [256, 256, 256] :
    p == "A1" ? [256, 256, 256] :
    p == "A1 mini" ? [180, 180, 180] :
    p == "H2D" ? [325, 320, 325] :
    p == "H2S" ? [340, 320, 340] :
    [custom_bed_x, custom_bed_y, custom_bed_z];
BED = bed_dims(printer);

W = units_x * PITCH - CLEAR;
H = units_y * PITCH - CLEAR;
// lids on larger grids: one continuous foot under the whole lid (default) or one foot per cell
merged_foot = mode == "lid" && lid_style == "foot" && foot_layout == "merged";
FDX = merged_foot ? W / 2 - 20.75 : 0;
FDY = merged_foot ? H / 2 - 20.75 : 0;

// ---------- geometry helpers ----------
// rounded-rectangle ring, CCW seen from +z
function rr_pts(hx, hy, r, q) = [
    for (k = [0:3]) for (s = [0:q])
        let (a = 90 * k + 90 * s / q,
             cx = (k == 0 || k == 3) ? hx - r : -(hx - r),
             cy = (k == 0 || k == 1) ? hy - r : -(hy - r))
        [cx + r * cos(a), cy + r * sin(a)]
];

// layers: [[z, halfx, halfy, corner_radius], ...] lowest first, centered on x/y origin
module loft(layers) {
    n = 4 * (Q + 1);
    m = len(layers);
    pts = [for (L = layers) for (p = rr_pts(L[1], L[2], L[3], Q)) [p[0], p[1], L[0]]];
    faces = concat(
        [[for (j = [0:n - 1]) j]],
        [[for (j = [n - 1:-1:0]) (m - 1) * n + j]],
        [for (i = [0:m - 2]) for (j = [0:n - 1])
            let (j2 = (j + 1) % n, a = i * n + j, b = i * n + j2,
                 c = (i + 1) * n + j2, d = (i + 1) * n + j)
            each [[a, d, c], [a, c, b]]]
    );
    polyhedron(points = pts, faces = faces, convexity = 6);
}

module rr2d(w, l, r) {
    hull() for (sx = [-1, 1], sy = [-1, 1])
        translate([sx * (w / 2 - r), sy * (l / 2 - r)]) circle(r = r, $fn = 24);
}

// ---------- foot profile (bin / lid) ----------
function foot_hw(z) = z < 0.8 ? 17.8 + z : (z < 2.6 ? 18.6 : 18.6 + (z - 2.6));
function foot_r(z)  = z < 0.8 ? 0.8 + z   : (z < 2.6 ? 1.6  : 1.6 + (z - 2.6));
// FDX / FDY: extra half-size of a merged (one-piece) foot compared with a single 41.5 mm cell foot
function ring_at(z, s) = [z, foot_hw(z) - s + FDX, foot_hw(z) - s + FDY, max(foot_r(z) - s, 0.3)];
function zs(z0, z1) = concat([z0], [for (b = [0.8, 2.6]) if (b > z0 + 0.01 && b < z1 - 0.01) b], [z1]);
// cavity layers inside the foot, inset by s. closed=false: open to the underside
function cav_layers(s, closed) = closed
    ? [for (z = zs(s, FOOT_H)) ring_at(z, s)]
    : concat([[-0.5, foot_hw(0) - s + FDX, foot_hw(0) - s + FDY, max(foot_r(0) - s, 0.3)]],
             [for (z = zs(0, FOOT_H)) ring_at(z, s)]);

// open_like_baseplate is only for bins; on a lid it behaves like open
foot_style = (foot_hollow == "open_like_baseplate" && mode != "bin") ? "open" : foot_hollow;
pads_mode = foot_style == "open_like_baseplate";   // corner magnets in flush pads (as on the skeleton baseplate), center in a ring

// Bin feet: corner pockets only in the 4 outermost corners of the whole bin ($ci/$cj = cell index, set in all_feet)
function outer_corner(sx, sy) = mode != "bin" ? true :
    ((sx < 0 ? $ci == 0 : $ci == units_x - 1) && (sy < 0 ? $cj == 0 : $cj == units_y - 1));

// Lid: top-side magnet positions (x, y on the lid), the 4 outermost corners of the part
function lid_mag_pts() = [for (x = [cell_c(0) - HOLE_OFF, cell_c(units_x - 1) + HOLE_OFF],
                               y = [cell_c(0) - HOLE_OFF, cell_c(units_y - 1) + HOLE_OFF]) [x, y]];
// the same points relative to the foot being built ($fc = centre of that foot on the lid)
function lid_mag_local() = [for (p = lid_mag_pts())
    if (abs(p[0] - $fc[0]) < 20.75 + FDX && abs(p[1] - $fc[1]) < 20.75 + FDY) [p[0] - $fc[0], p[1] - $fc[1]]];

module bosses(s) {
    if (corner_mag_foot) {
        if (pads_mode) {
            for (sx = [-1, 1], sy = [-1, 1]) if (outer_corner(sx, sy))
                translate([0, 0, -1]) linear_extrude(height = 6.5) corner_pad2d(sx, sy);
        } else {
            for (sx = [-1, 1], sy = [-1, 1]) if (outer_corner(sx, sy))
                translate([sx * HOLE_OFF, sy * HOLE_OFF, -1]) cylinder(d = cm_d + 2 * s, h = 6.5, $fn = CYL_FN);
        }
    }
    else if (mode == "bin" && screw_holes)
        for (sx = [-1, 1], sy = [-1, 1])
            translate([sx * HOLE_OFF, sy * HOLE_OFF, -1]) cylinder(d = SCREW_D + 2 * s, h = 6.5, $fn = CYL_FN);
    if (center_mag_foot && !hub_mode)
        translate([0, 0, -1]) cylinder(d = center_magnet_d + magnet_clearance + 2 * s, h = 6.5, $fn = CYL_FN);
}

// hub slab (magnet height + 0.8 mm) with 4 diagonal ribs; extends below z=0 when flush so it stays attached to the open bottom
// ribs only under the baseplate-style hub; the bin foot holds its center magnet with a plain rim (foot_wall)
hub_mode = center_mag_foot && center_ribs && foot_style == "open" && mode != "bin";
hub_t = center_magnet_h + 0.8;
module center_hub(s) {
    zb = hub_z == 0 ? -1 : hub_z;
    t = hub_z + hub_t - zb;
    // rounded square around the magnet (14 mm at the default magnet), same as the skeleton baseplate pad
    translate([0, 0, zb]) linear_extrude(height = t) rr2d(cpad_side, cpad_side, CPAD_R);
    for (a = [45, 135, 225, 315])
        rotate([0, 0, a]) translate([0, -rib_width / 2, zb]) cube([32, rib_width, t]);
}

module pockets() {
    if (corner_mag_foot)
        for (sx = [-1, 1], sy = [-1, 1]) if (outer_corner(sx, sy))
            translate([sx * HOLE_OFF, sy * HOLE_OFF, -0.5]) cylinder(d = cm_d, h = cm_h + 0.5, $fn = CYL_FN);
    if (center_mag_foot)
        translate([0, 0, (hub_mode ? hub_z : 0) - 0.5])
            cylinder(d = center_magnet_d + magnet_clearance, h = center_magnet_h + 0.5, $fn = CYL_FN);
    if (mode == "bin" && screw_holes) {
        top = min(6, FOOT_H + bottom_thickness - 0.4);
        for (sx = [-1, 1], sy = [-1, 1])
            translate([sx * HOLE_OFF, sy * HOLE_OFF, -0.5]) cylinder(d = SCREW_D, h = top + 0.5, $fn = 24);
    }
}

function cell_c(i) = PITCH * i + 20.75;
// cell centers relative to the foot's own center: one entry (the origin) for a single cell foot,
// every cell for a merged foot
CELLS = merged_foot ? [for (i = [0:units_x - 1], j = [0:units_y - 1]) [cell_c(i) - W / 2, cell_c(j) - H / 2]] : [[0, 0]];

module hollow_cut(s, closed) {
    difference() {
        loft(cav_layers(s, closed));
        for (c = CELLS) translate(c) {
            bosses(s);
            if (hub_mode) center_hub(s);
        }
        // lid: solid column around each top-side pocket, so the hollow foot is routed around it
        if (mode == "lid" && corner_magnets)
            for (p = lid_mag_local()) translate([p[0], p[1], -1]) cylinder(d = cm_d + 2 * s, h = 6.5, $fn = CYL_FN);
    }
}

// One foot, centered on x/y origin, z = 0..4.75 (+0.01 overlap into body).
// 41.5 x 41.5 for one cell; the full lid outline when merged (magnets stay per cell)
module foot_cell() {
    difference() {
        loft([[0, 17.8 + FDX, 17.8 + FDY, 0.8], [0.8, 18.6 + FDX, 18.6 + FDY, 1.6], [2.6, 18.6 + FDX, 18.6 + FDY, 1.6],
              [FOOT_H, 20.75 + FDX, 20.75 + FDY, R_BIN], [FOOT_H + 0.01, 20.75 + FDX, 20.75 + FDY, R_BIN]]);
        if (foot_style == "open" || foot_style == "open_like_baseplate") hollow_cut(foot_wall, false);
        if (foot_style == "skin" && mode == "bin") hollow_cut(foot_skin, true);
        for (c = CELLS) translate(c) pockets();
    }
}

module all_feet() {
    if (merged_foot) translate([W / 2, H / 2, 0]) { $fc = [W / 2, H / 2]; foot_cell(); }
    else for (i = [0:units_x - 1], j = [0:units_y - 1])
        translate([cell_c(i), cell_c(j), 0]) { $ci = i; $cj = j; $fc = [cell_c(i), cell_c(j)]; foot_cell(); }
}

// ---------- stacking lip ----------
// [z above lip base, depth from outer wall]. Spec: 0.7 (45 deg) / 1.8 / 1.9 (45 deg), tip is a knife edge.
// The last ring sits 0.01 above the lip so the cutter passes cleanly through the tip.
LIP_PROFILE = [[0, 2.6], [0.7, 1.9], [2.5, 1.9], [4.4, 0], [4.41, 0]];
function rd(d) = max(R_BIN - d, 0.8);
function lip_rings(HX, HY, z0) = [for (p = LIP_PROFILE) [z0 + p[0], HX - p[1], HY - p[1], rd(p[1])]];

module corner_mask(HX, HY) {
    for (sx = [-1, 1], sy = [-1, 1])
        translate([sx * (HX - corner_len / 2) - corner_len / 2, sy * (HY - corner_len / 2) - corner_len / 2, -1])
            cube([corner_len, corner_len, LIP_H + 2]);
}

// lip ring on a plate whose top is at local z=0 (centered on x/y origin)
// z_start = -0.01 sinks the ring slightly into the plate it is unioned with; 0 gives a body that only touches it
module lip_ring(HX, HY, z_start = -0.01) {
    intersection() {
        difference() {
            loft([[z_start, HX, HY, R_BIN], [LIP_H, HX, HY, R_BIN]]);
            loft(lip_rings(HX, HY, 0));
        }
        if (lip_mode == "corners_only") corner_mask(HX, HY);
        else translate([-HX - 1, -HY - 1, -1]) cube([2 * HX + 2, 2 * HY + 2, LIP_H + 2]);
    }
}

// ---------- label system ----------
ELS = ["text", "symbol"];
function el_mode(w) = w == "text" ? text_mode : symbol_mode;

// OpenSCAD font string ("Family:style=Style"). Fonts are not embedded: they must be installed where the script runs
// (MakerWorld provides Google Fonts; locally see the fonts/ folder).
font_spec = font_choice == "Inter" ? "Inter"
          : font_choice == "IBM Plex Mono" ? "IBM Plex Mono"
          : font_choice == "IBM Plex Sans SemiBold" ? "IBM Plex Sans:style=SemiBold"
          : (text_font_style == "" ? text_font : str(text_font, ":style=", text_font_style));

// ---- auto layout of text + symbol. OpenSCAD cannot measure text, so the text width is estimated
// (characters x size x text_width_factor); the text itself is always centered on its own position.
LBL_BOTH = text_mode != "none" && len(text_string) > 0 && symbol_mode != "none";
lb_S = symbol_source == "lucide" ? icon_size * symbol_scale * 22 / 24 : icon_size * symbol_scale;   // visible icon size
// measured average advance per character for the preset fonts (OpenSCAD text size units)
lb_factor = text_width_factor > 0 ? text_width_factor : (font_choice == "IBM Plex Mono" ? 0.8 : 0.65);
lb_Tw = len(text_string) * text_size * lb_factor;
lb_Th = text_size;
lb_row = label_arrange == "icon_left" || label_arrange == "icon_right";
lb_icon_first = label_arrange == "icon_left" || label_arrange == "icon_above";
// [[text x, y], [symbol x, y]] relative to the plate center
function lb_pos() =
    !(label_group && LBL_BOTH) ? [[0, 0], [0, 0]] :
    let (S = lb_S, Tw = lb_Tw, Th = lb_Th, g = label_gap,
         total = lb_row ? S + g + Tw : S + g + Th,
         // position along the arrangement axis (x for a row, y for a column; "above" is +y)
         at = lb_row ? (lb_icon_first ? -total / 2 + S + g + Tw / 2 : -total / 2 + Tw / 2)
                     : (lb_icon_first ? -total / 2 + Th / 2 : total / 2 - Th / 2),
         as = lb_row ? (lb_icon_first ? -total / 2 + S / 2 : -total / 2 + Tw + g + S / 2)
                     : (lb_icon_first ? total / 2 - S / 2 : -total / 2 + S / 2),
         // position across it: start = top (row) / left (column), end = bottom / right
         span = lb_row ? max(Th, S) : max(Tw, S),
         ht = lb_row ? Th : Tw,
         sgn = label_align == "start" ? (lb_row ? 1 : -1) : (label_align == "end" ? (lb_row ? -1 : 1) : 0),
         ct = sgn * (span / 2 - ht / 2),
         cs = sgn * (span / 2 - S / 2),
         pt = lb_row ? [at, ct] : [ct, at],
         ps = lb_row ? [as, cs] : [cs, as],
         sh = label_center ? [0, 0] : -pt)
    [pt + sh, ps + sh];
LB = lb_pos();

module text2d() {
    if (len(text_string) > 0)
        translate([text_offset_x + LB[0][0], text_offset_y + LB[0][1]]) rotate(text_rotation)
            text(text_string, size = text_size, font = font_spec, halign = "center", valign = "center", $fn = 24);
}
module symbol2d() {
    translate([symbol_offset_x + LB[1][0], symbol_offset_y + LB[1][1]]) rotate(symbol_rotation) scale(symbol_scale) {
        if (symbol_source == "lucide") lucide2d(symbol_icon, icon_size);
        else import(svg_file, center = true);
    }
}

// Lucide icon: polylines in a 24x24 box (y down), stroked 2 units wide with round caps/joins
function lucide_index(name) = [for (i = [0:len(LUCIDE_ICONS) - 1]) if (LUCIDE_ICONS[i][0] == name) i][0];
module lucide2d(name, size) {
    idx = lucide_index(name);
    assert(idx != undef, str("Unknown Lucide icon: ", name));
    scale([size / 24, -size / 24]) translate([-12, -12])
        for (pl = LUCIDE_ICONS[idx][1]) {
            if (len(pl) == 1) translate(pl[0]) circle(r = 1, $fn = 12);
            else for (i = [0:len(pl) - 2])
                hull() {
                    translate(pl[i]) circle(r = 1, $fn = 12);
                    translate(pl[i + 1]) circle(r = 1, $fn = 12);
                }
        }
}
module el2d(w) {
    if (w == "text") text2d(); else symbol2d();
}
// z-top = label surface; call inside translate([cx, cy, 0])
module label_cuts(zt) {
    for (w = ELS) {
        if (el_mode(w) == "engraved")
            translate([0, 0, zt - emboss_depth]) linear_extrude(height = emboss_depth + 0.01) el2d(w);
        // flush: pocket of flush_depth; the inlay (label_adds) is a separate body that sits in it
        if (el_mode(w) == "flush")
            translate([0, 0, zt - flush_depth]) linear_extrude(height = flush_depth + 0.01) el2d(w);
    }
}
module label_adds(zt) {
    for (w = ELS) {
        // raised: lifted flush_gap off the plate so it does not touch it and stays a separate body; top at zt + emboss_depth
        if (el_mode(w) == "raised")
            translate([0, 0, zt + flush_gap]) linear_extrude(height = emboss_depth - flush_gap) el2d(w);
        // flush inlay: shrunk by flush_gap on every side and lifted flush_gap off the pocket floor, so it does not
        // touch the plate and the exporter keeps it as its own body; its top is level with the plate surface
        if (el_mode(w) == "flush")
            translate([0, 0, zt - flush_depth + flush_gap]) linear_extrude(height = flush_depth - flush_gap)
                offset(delta = -flush_gap) el2d(w);
    }
}
raised_extra = (text_mode == "raised" || symbol_mode == "raised") ? emboss_depth : 0;
cut_label = (text_mode == "engraved" || text_mode == "flush" || symbol_mode == "engraved" || symbol_mode == "flush");
// deepest cut into the plate, for the thickness checks
cut_depth = max(
    (text_mode == "engraved" ? emboss_depth : 0), (symbol_mode == "engraved" ? emboss_depth : 0),
    (text_mode == "flush" ? flush_depth : 0), (symbol_mode == "flush" ? flush_depth : 0));

// rotates the part 180 deg about X so the deck face (top_z) lands on z=0
module orient(top_z, ext_y) {
    if (print_orientation == "upside_down") translate([0, ext_y, top_z]) rotate([180, 0, 0]) children();
    else children();
}

// ---------- LID (foot) ----------
plate_t = plate_thickness_mode == "auto" ? height_units_auto * UNIT_H - FOOT_H : plate_thickness;
stackable = variant == "stackable";
// Top-side lid pocket: cut down from the top face, at least 0.8 mm of material stays below its floor
cm_h_lid = min(corner_magnet_h, FOOT_H + plate_t - 0.8);

// with_lip = false leaves the stacking lip out (it is then built separately for a second color)
module foot_lid_body(with_lip = true) {
    ztop = FOOT_H + plate_t;
    difference() {
        union() {
            all_feet();
            translate([W / 2, H / 2, FOOT_H]) loft([[0, W / 2, H / 2, R_BIN], [plate_t, W / 2, H / 2, R_BIN]]);
            if (stackable && with_lip) translate([W / 2, H / 2, ztop]) lip_ring(W / 2, H / 2);
        }
        if (cut_label) translate([W / 2, H / 2, 0]) label_cuts(ztop);
        if (corner_magnets)
            for (p = lid_mag_pts())
                translate([p[0], p[1], ztop - cm_h_lid]) cylinder(d = cm_d, h = cm_h_lid + 1, $fn = CYL_FN);
    }
}

// the stacking lip on its own, resting exactly on the plate top
module lid_lip_only() {
    translate([W / 2, H / 2, FOOT_H + plate_t]) lip_ring(W / 2, H / 2, 0);
}

module foot_lid() {
    ztop = FOOT_H + plate_t;
    top_ref = ztop + (stackable ? LIP_H : raised_extra);
    if (stackable && lip_color_enabled) {
        // two bodies: plate + feet, and the lip standing on the plate top
        color(plate_color) ctr() orient(top_ref, H) foot_lid_body(false);
        color(lip_color) ctr() orient(top_ref, H) lid_lip_only();
    }
    else color(plate_color) ctr() orient(top_ref, H) foot_lid_body();
    color(text_color) ctr() orient(top_ref, H) translate([W / 2, H / 2, 0]) label_adds(ztop);
}

// Keeps only the part of the child below (upper = false) or above (upper = true) the plane z = z0.
// The two halves meet exactly on that plane, so a two-color part needs no overlap.
module z_split(z0, upper) {
    intersection() {
        children();
        if (upper) translate([-1000, -1000, z0]) cube([2000, 2000, 1000]);
        else translate([-1000, -1000, -1]) cube([2000, 2000, z0 + 1]);
    }
}

// ---------- BIN ----------
body_h = height_units * UNIT_H;
// a bin made for a sliding lid cannot have a stacking lip (it would block the lid): use a flat top of the same height
lip_eff = (lid_style == "sliding" && lip_style == "with_lip") ? "flat_same_height" : lip_style;
bin_top = lip_eff == "with_lip" ? body_h + LIP_H : (lip_eff == "flat_same_height" ? body_h + LIP_H : body_h);
// The floor follows the magnets: it is raised automatically when a magnet pocket is deeper than the foot,
// so there are always 0.8 mm of material above the tallest magnet.
MAG_ROOF = 0.8;
pocket_top = max(corner_magnets ? cm_h : 0, center_magnet ? center_magnet_h : 0);   // bin only (baseplate and lid do not use floor_z)
floor_z = max(FOOT_H + bottom_thickness, pocket_top > 0 ? pocket_top + MAG_ROOF : 0);
// sliding lid derived values
s_wall = wall_thickness;
s_lt = sliding_lid_thickness > 0 ? sliding_lid_thickness : 2 * s_wall;
s_mw = sliding_min_wall > 0 ? sliding_min_wall : s_wall / 2;
s_sup = sliding_support > 0 ? sliding_support : s_lt / 2;
s_clr = sliding_clearance;
s_gd = s_wall - s_mw;   // groove depth into the wall

module bin_cavity() {
    hx = W / 2 - wall_thickness;
    hy = H / 2 - wall_thickness;
    r = rd(wall_thickness);
    if (lip_eff == "with_lip")
        loft(concat([[floor_z, hx, hy, r], [body_h - (2.6 - wall_thickness), hx, hy, r]],
                    lip_rings(W / 2, H / 2, body_h)));
    else
        loft([[floor_z, hx, hy, r], [bin_top + 0.01, hx, hy, r]]);
}

module ledge(x0, dir, y0, y1, z0, sup) {
    translate([0, y1, 0]) rotate([90, 0, 0]) linear_extrude(height = y1 - y0)
        polygon([[x0 - dir * 0.1, z0], [x0 + dir * sup, z0], [x0 - dir * 0.1, z0 - sup - 0.1]]);
}

module sliding_bin_cuts() {
    zg0 = bin_top - s_lt - s_clr;
    zg1 = bin_top - s_lt / 2 + s_clr;
    // grooves in both side walls, stopping at the back wall inner face
    translate([s_mw, -1, zg0]) cube([s_gd + 0.1, H - s_wall + 1, zg1 - zg0]);
    translate([W - s_wall - 0.1, -1, zg0]) cube([s_gd + 0.1, H - s_wall + 1, zg1 - zg0]);
    // entry opening through the front wall
    translate([s_mw, -1, zg0]) cube([W - 2 * s_mw, s_wall + 1.1, bin_top - zg0 + 1]);
    // clear the rounded front corners of the cavity so the lid can slide in
    rc = rd(s_wall) + 0.1;
    for (x0 = [s_wall, W - s_wall - rc])
        translate([x0, -1, zg0]) cube([rc, s_wall + rc + 1, bin_top - zg0 + 1]);
}

module bin_body() {
    difference() {
        union() {
            all_feet();
            translate([W / 2, H / 2, FOOT_H]) loft([[0, W / 2, H / 2, R_BIN], [bin_top - FOOT_H, W / 2, H / 2, R_BIN]]);
        }
        translate([W / 2, H / 2, 0]) bin_cavity();
        // magnet pockets also reach above the foot when they are deeper than it (the floor is raised to match)
        for (i = [0:units_x - 1], j = [0:units_y - 1]) translate([cell_c(i), cell_c(j), 0]) { $ci = i; $cj = j; pockets(); }
        if (lid_style == "sliding") sliding_bin_cuts();
    }
    if (lid_style == "sliding") {
        zg0 = bin_top - s_lt - s_clr;
        ledge(s_wall, 1, s_wall - 0.1, H - s_wall + 0.1, zg0, s_sup);
        ledge(W - s_wall, -1, s_wall - 0.1, H - s_wall + 0.1, zg0, s_sup);
    }
}

// ---------- BASEPLATE ----------
// pocket profile relative to pocket floor: foot profile offset 0.25
BP_LAYERS = [[0, 18.15, 18.15, 1.15], [0.7, 18.85, 18.85, 1.85], [2.5, 18.85, 18.85, 1.85],
             [BP_PROFILE_H, 21.0, 21.0, 4.0], [BP_PROFILE_H + 0.5, 21.5, 21.5, 4.5]];
bp_ux = baseplate_fit_bed ? max(1, floor(BED[0] / PITCH)) : units_x;
bp_uy = baseplate_fit_bed ? max(1, floor(BED[1] / PITCH)) : units_y;
bp_x = max(bp_ux * PITCH, plate_min_x_mm);
bp_y = max(bp_uy * PITCH, plate_min_y_mm);
bp_padx = bp_x - bp_ux * PITCH;
bp_pady = bp_y - bp_uy * PITCH;
bp_ox = bp_padx * (1 - fit_x) / 2;
bp_oy = bp_pady * (1 - fit_y) / 2;
// solid base below the pocket floor: spec total is ~5 mm, so the default is thin; magnet holes need depth, so it is raised automatically
bp_mag_need = max(corner_magnets ? cm_h + 0.4 : 0, center_magnet ? center_magnet_h + 0.4 : 0);
bp_base = max(baseplate_base, bp_mag_need);
bp_top = bp_base + BP_PROFILE_H - BP_RIDGE_TRIM;

BP_OPEN_R = 3;   // skeleton: corner radius of the openings
CPAD_WALL = 4.4; // center magnet pad: material around the pocket, so 5.2 mm pocket -> 14 mm square
CPAD_R = 3;      // center magnet pad: corner radius
cpad_side = center_magnet_d + magnet_clearance + 2 * CPAD_WALL;
bp_pad_d = cm_d + 4.5;   // skeleton: corner magnet pad diameter (reaches into the frame bars; 11 mm at the 6.5 mm Gridfinity hole)
BP_PAD_REACH = 19.5;   // pad runs this far from the cell center into the frame, staying inside the outer plate corner

// Skeleton corner pad (plan view, relative to the cell center): a square block that runs flush into the
// frame corner with the inner corner rounded around the magnet hole. sx, sy = +-1 pick the corner.
module corner_pad2d(sx, sy) {
    r = bp_pad_d / 2;
    hull() {
        translate([sx * HOLE_OFF, sy * HOLE_OFF]) circle(r = r, $fn = CYL_FN);
        polygon([[sx * BP_PAD_REACH, sy * (HOLE_OFF - r)],
                 [sx * BP_PAD_REACH, sy * BP_PAD_REACH],
                 [sx * (HOLE_OFF - r), sy * BP_PAD_REACH]]);
    }
}

// Skeleton cell, plan view relative to the cell center. The "solid" is what stays inside the window: magnet pads
// (top flush with the pocket floor) and, for a center magnet, a rounded square tied to the frame by diagonal ribs.
module skeleton_solid2d() {
    if (corner_magnets)
        for (sx = [-1, 1], sy = [-1, 1]) corner_pad2d(sx, sy);
    if (center_magnet) {
        rr2d(cpad_side, cpad_side, CPAD_R);
        if (center_ribs)
            for (a = [45, 135, 225, 315])
                rotate(a) translate([0, -rib_width / 2]) square([27, rib_width]);
    }
}
// The openings are the window minus the solid; their corners get radius BP_OPEN_R
// (offset out then in would round concave corners, so it is done the other way: in, then out).
module skeleton_opening2d() {
    offset(r = BP_OPEN_R) offset(r = -BP_OPEN_R)
        difference() {
            rr2d(36.3, 36.3, 1.15);
            skeleton_solid2d();
        }
}

module baseplate_body() {
    skeleton = baseplate_style == "skeleton";
    difference() {
        difference() {
            translate([bp_x / 2, bp_y / 2, 0]) loft([[0, bp_x / 2, bp_y / 2, BP_R], [bp_top, bp_x / 2, bp_y / 2, BP_R]]);
            for (i = [0:bp_ux - 1], j = [0:bp_uy - 1]) {
                translate([bp_ox + PITCH * i + PITCH / 2, bp_oy + PITCH * j + PITCH / 2, bp_base]) {
                    loft(BP_LAYERS);
                    // skeleton: cut the openings straight down through the base; what is left of the base
                    // inside the window (pads, ribs) keeps its top at the pocket floor
                    if (skeleton) translate([0, 0, -bp_base - 1])
                        linear_extrude(height = bp_base + 1.1) skeleton_opening2d();
                }
            }
        }
        for (i = [0:bp_ux - 1], j = [0:bp_uy - 1]) {
            cx = bp_ox + PITCH * i + PITCH / 2;
            cy = bp_oy + PITCH * j + PITCH / 2;
            if (corner_magnets)
                for (sx = [-1, 1], sy = [-1, 1])
                    translate([cx + sx * HOLE_OFF, cy + sy * HOLE_OFF, bp_base - cm_h])
                        cylinder(d = cm_d, h = cm_h + 0.5, $fn = CYL_FN);
            if (center_magnet)
                translate([cx, cy, bp_base - center_magnet_h])
                    cylinder(d = center_magnet_d + magnet_clearance, h = center_magnet_h + 0.5, $fn = CYL_FN);
        }
    }
}

// ---------- SLIDING LID ----------
sl_wi = W - 2 * s_wall;
sl_wc = sl_wi - 2 * s_clr;          // center plate width (full thickness)
sl_wl = sl_wc + 2 * s_gd;           // overall width incl. tongues
sl_ly = H - s_wall - s_clr;         // lid length (slides in along +Y)
sl_fd = finger_depth > 0 ? finger_depth : 0.6 * s_lt;

// rectangle w x l with the two far (+Y) corners rounded to radius r, front edge square
module back_rounded(w, l, r) {
    hull() {
        square([w, 0.01]);
        for (x = [r, w - r]) translate([x, l - r]) circle(r = r, $fn = 40);
    }
}

module sliding_lid_body() {
    difference() {
        union() {
            // tongues (half thickness) and center plate (full thickness, top flush); back corners are rounded
            // so they clear the rounded inner corners of the bin cavity (radius rd(wall))
            linear_extrude(height = s_lt / 2) back_rounded(sl_wl, sl_ly, rd(s_wall) + 2);
            translate([s_gd, 0, 0]) linear_extrude(height = s_lt) back_rounded(sl_wc, sl_ly, rd(s_wall));
        }
        if (finger_cutout)
            translate([sl_wl / 2, finger_y, s_lt - sl_fd]) linear_extrude(height = sl_fd + 1) rr2d(finger_w, finger_l, finger_r);
        if (cut_label) translate([sl_wl / 2, sl_ly / 2, 0]) label_cuts(s_lt);
    }
}

module sliding_lid() {
    top_ref = s_lt + raised_extra;
    color(plate_color) ctr() orient(top_ref, sl_ly) sliding_lid_body();
    color(text_color) ctr() orient(top_ref, sl_ly) translate([sl_wl / 2, sl_ly / 2, 0]) label_adds(s_lt);
}

// ---------- checks ----------
assert(mode == "lid" || mode == "bin" || mode == "baseplate", "mode must be lid, bin or baseplate");
assert(plate_t >= 0.6, "Plate too thin: plate thickness must be >= 0.6 mm (auto mode needs height_units_auto >= 1)");
assert(!(mode == "lid" && lid_style == "foot" && cut_label && cut_depth > plate_t - 0.4),
       "Label depth too large for this plate: leave at least 0.4 mm of plate under engraved/flush labels");
assert(!(mode == "lid" && lid_style == "sliding" && cut_label && cut_depth > s_lt - 0.6),
       "Label depth too large for the sliding lid thickness");
assert(flush_gap < flush_depth / 2 && flush_gap < emboss_depth / 2, "flush_gap must be less than half of flush_depth and of emboss_depth");
assert(!(lid_style == "sliding" && mode != "baseplate" && s_gd < 0.2),
       "sliding_min_wall must be at least 0.2 mm smaller than wall_thickness to leave a groove");
assert(!(lid_style == "sliding" && mode != "baseplate" && s_gd <= s_clr),
       "sliding_clearance must be smaller than the groove depth (wall_thickness - sliding_min_wall)");
assert(!(mode == "bin" && lid_style == "sliding" && body_h - floor_z < s_lt + s_clr + s_sup + 1),
       "Bin too low for the sliding lid: increase height_units or reduce lid thickness");
assert(!(mode == "bin" && lip_eff == "with_lip" && wall_thickness >= 2.6), "wall_thickness must be < 2.6 mm with a stacking lip");
assert(!(mode == "bin" && foot_style == "skin" && bottom_thickness < foot_skin), "bottom_thickness must be >= foot_skin for foot_hollow=skin");
assert(!(hub_mode && hub_z + hub_t > FOOT_H - 0.4), "Hub too tall: reduce hub_z or center_magnet_h");
// part size on the bed (print orientation does not change the footprint)
part_dims = mode == "baseplate" ? [bp_x, bp_y, bp_top]
          : mode == "bin" ? [W, H, bin_top]
          : lid_style == "sliding" ? [sl_wl, sl_ly, s_lt + raised_extra]
          : [W, H, FOOT_H + plate_t + (stackable ? LIP_H : raised_extra)];
fits_bed = ((part_dims[0] <= BED[0] && part_dims[1] <= BED[1]) || (part_dims[0] <= BED[1] && part_dims[1] <= BED[0]))
           && part_dims[2] <= BED[2];
assert(bed_check == "off" || fits_bed,
       str("Part (", part_dims[0], " x ", part_dims[1], " x ", part_dims[2], " mm) does not fit the ", printer,
           " bed (", BED[0], " x ", BED[1], " x ", BED[2], " mm). Reduce the size or set bed_check to off."));
assert(!(stackable && mode == "lid" && lip_mode == "corners_only" && corner_len > min(W, H) / 2),
       "corner_len must be at most half of the shorter side");

// ---------- Lucide icon data (generated by tools/build_icons.py - do not edit by hand) ----------
// BEGIN LUCIDE DATA
LUCIDE_ICONS = [
    ["safety_hard-hat", [[[10,10],[10,5],[10.05,4.69],[10.19,4.41],[10.41,4.19],[10.69,4.05],[11,4],[13,4],[13.31,4.05],[13.59,4.19],[13.81,4.41],[13.95,4.69],[14,5],[14,10]],[[14,6],[14.35,6.01],[14.7,6.04],[15.04,6.09],[15.38,6.16],[15.72,6.25],[16.05,6.36],[16.38,6.49],[16.69,6.64],[17,6.8],[17.3,6.99],[17.58,7.19],[17.86,7.4],[18.12,7.64],[18.36,7.88],[18.6,8.14],[18.81,8.42],[19.01,8.7],[19.2,9],[19.36,9.31],[19.51,9.62],[19.64,9.95],[19.75,10.28],[19.84,10.62],[19.91,10.96],[19.96,11.3],[19.99,11.65],[20,12],[20,15]],[[4,15],[4,12],[4.01,11.65],[4.04,11.3],[4.09,10.96],[4.16,10.62],[4.25,10.28],[4.36,9.95],[4.49,9.62],[4.64,9.31],[4.8,9],[4.99,8.7],[5.19,8.42],[5.4,8.14],[5.64,7.88],[5.88,7.64],[6.14,7.4],[6.42,7.19],[6.7,6.99],[7,6.8],[7.31,6.64],[7.62,6.49],[7.95,6.36],[8.28,6.25],[8.62,6.16],[8.96,6.09],[9.3,6.04],[9.65,6.01],[10,6]],[[3,15],[21,15],[21.31,15.05],[21.59,15.19],[21.81,15.41],[21.95,15.69],[22,16],[22,18],[21.95,18.31],[21.81,18.59],[21.59,18.81],[21.31,18.95],[21,19],[3,19],[2.69,18.95],[2.41,18.81],[2.19,18.59],[2.05,18.31],[2,18],[2,16],[2.05,15.69],[2.19,15.41],[2.41,15.19],[2.69,15.05],[3,15]]]],
    ["safety_glasses", [[[2,15],[2.02,15.35],[2.06,15.69],[2.14,16.04],[2.24,16.37],[2.37,16.69],[2.54,17],[2.72,17.29],[2.94,17.57],[3.17,17.83],[3.43,18.06],[3.71,18.28],[4,18.46],[4.31,18.63],[4.63,18.76],[4.96,18.86],[5.31,18.94],[5.65,18.98],[6,19],[6.35,18.98],[6.69,18.94],[7.04,18.86],[7.37,18.76],[7.69,18.63],[8,18.46],[8.29,18.28],[8.57,18.06],[8.83,17.83],[9.06,17.57],[9.28,17.29],[9.46,17],[9.63,16.69],[9.76,16.37],[9.86,16.04],[9.94,15.69],[9.98,15.35],[10,15],[9.98,14.65],[9.94,14.31],[9.86,13.96],[9.76,13.63],[9.63,13.31],[9.46,13],[9.28,12.71],[9.06,12.43],[8.83,12.17],[8.57,11.94],[8.29,11.72],[8,11.54],[7.69,11.37],[7.37,11.24],[7.04,11.14],[6.69,11.06],[6.35,11.02],[6,11],[5.65,11.02],[5.31,11.06],[4.96,11.14],[4.63,11.24],[4.31,11.37],[4,11.54],[3.71,11.72],[3.43,11.94],[3.17,12.17],[2.94,12.43],[2.72,12.71],[2.54,13],[2.37,13.31],[2.24,13.63],[2.14,13.96],[2.06,14.31],[2.02,14.65],[2,15]],[[14,15],[14.02,15.35],[14.06,15.69],[14.14,16.04],[14.24,16.37],[14.37,16.69],[14.54,17],[14.72,17.29],[14.94,17.57],[15.17,17.83],[15.43,18.06],[15.71,18.28],[16,18.46],[16.31,18.63],[16.63,18.76],[16.96,18.86],[17.31,18.94],[17.65,18.98],[18,19],[18.35,18.98],[18.69,18.94],[19.04,18.86],[19.37,18.76],[19.69,18.63],[20,18.46],[20.29,18.28],[20.57,18.06],[20.83,17.83],[21.06,17.57],[21.28,17.29],[21.46,17],[21.63,16.69],[21.76,16.37],[21.86,16.04],[21.94,15.69],[21.98,15.35],[22,15],[21.98,14.65],[21.94,14.31],[21.86,13.96],[21.76,13.63],[21.63,13.31],[21.46,13],[21.28,12.71],[21.06,12.43],[20.83,12.17],[20.57,11.94],[20.29,11.72],[20,11.54],[19.69,11.37],[19.37,11.24],[19.04,11.14],[18.69,11.06],[18.35,11.02],[18,11],[17.65,11.02],[17.31,11.06],[16.96,11.14],[16.63,11.24],[16.31,11.37],[16,11.54],[15.71,11.72],[15.43,11.94],[15.17,12.17],[14.94,12.43],[14.72,12.71],[14.54,13],[14.37,13.31],[14.24,13.63],[14.14,13.96],[14.06,14.31],[14.02,14.65],[14,15]],[[14,15],[13.97,14.65],[13.88,14.32],[13.73,14],[13.53,13.71],[13.29,13.47],[13,13.27],[12.68,13.12],[12.35,13.03],[12,13],[11.65,13.03],[11.32,13.12],[11,13.27],[10.71,13.47],[10.47,13.71],[10.27,14],[10.12,14.32],[10.03,14.65],[10,15]],[[2.5,13],[5,7],[5.18,6.69],[5.35,6.4],[5.54,6.14],[5.73,5.9],[5.94,5.69],[6.16,5.51],[6.4,5.36],[6.67,5.23],[6.95,5.13],[7.27,5.06],[7.62,5.01],[8,5]],[[21.5,13],[19,7],[18.82,6.69],[18.64,6.4],[18.45,6.14],[18.24,5.9],[18.03,5.69],[17.8,5.51],[17.55,5.36],[17.29,5.23],[17,5.13],[16.69,5.06],[16.36,5.01],[16,5]]]],
    ["safety_shield-check", [[[20,13],[19.99,13.37],[19.97,13.73],[19.94,14.08],[19.9,14.43],[19.84,14.76],[19.77,15.09],[19.69,15.4],[19.6,15.71],[19.5,16.01],[19.39,16.3],[19.27,16.59],[19.13,16.86],[18.99,17.13],[18.84,17.39],[18.67,17.65],[18.5,17.89],[18.32,18.13],[18.13,18.36],[17.94,18.59],[17.73,18.81],[17.52,19.02],[17.3,19.22],[17.07,19.42],[16.83,19.61],[16.59,19.8],[16.34,19.98],[16.09,20.15],[15.83,20.32],[15.56,20.49],[15.29,20.64],[15.02,20.8],[14.73,20.94],[14.45,21.08],[14.16,21.22],[13.86,21.35],[13.57,21.48],[13.26,21.61],[12.96,21.72],[12.65,21.84],[12.34,21.95],[12.12,22],[11.89,21.99],[11.67,21.94],[11.36,21.83],[11.05,21.72],[10.74,21.6],[10.44,21.47],[10.14,21.35],[9.85,21.22],[9.56,21.08],[9.27,20.94],[8.99,20.79],[8.71,20.64],[8.44,20.48],[8.17,20.32],[7.91,20.15],[7.66,19.98],[7.41,19.8],[7.17,19.61],[6.93,19.42],[6.71,19.22],[6.48,19.02],[6.27,18.8],[6.07,18.59],[5.87,18.36],[5.68,18.13],[5.5,17.89],[5.33,17.65],[5.16,17.39],[5.01,17.13],[4.87,16.86],[4.74,16.59],[4.61,16.3],[4.5,16.01],[4.4,15.71],[4.31,15.4],[4.23,15.09],[4.16,14.76],[4.1,14.43],[4.06,14.08],[4.03,13.73],[4.01,13.37],[4,13],[4,6],[4.05,5.69],[4.19,5.41],[4.41,5.19],[4.69,5.05],[5,5],[5.29,4.99],[5.58,4.97],[5.88,4.93],[6.19,4.88],[6.5,4.81],[6.81,4.73],[7.12,4.63],[7.43,4.53],[7.75,4.41],[8.06,4.28],[8.37,4.14],[8.68,3.99],[8.99,3.83],[9.29,3.66],[9.59,3.48],[9.88,3.3],[10.17,3.11],[10.45,2.91],[10.72,2.7],[10.99,2.49],[11.24,2.28],[11.52,2.1],[11.84,2.01],[12.16,2.01],[12.48,2.1],[12.76,2.28],[13.01,2.5],[13.28,2.71],[13.55,2.91],[13.83,3.11],[14.12,3.3],[14.41,3.49],[14.71,3.67],[15.01,3.83],[15.32,3.99],[15.63,4.14],[15.94,4.28],[16.26,4.41],[16.57,4.53],[16.88,4.63],[17.19,4.73],[17.5,4.81],[17.81,4.88],[18.12,4.93],[18.42,4.97],[18.71,4.99],[19,5],[19.31,5.05],[19.59,5.19],[19.81,5.41],[19.95,5.69],[20,6],[20,13]],[[9,12],[11,14],[15,10]]]],
    ["safety_shield-alert", [[[20,13],[19.99,13.37],[19.97,13.73],[19.94,14.08],[19.9,14.43],[19.84,14.76],[19.77,15.09],[19.69,15.4],[19.6,15.71],[19.5,16.01],[19.39,16.3],[19.27,16.59],[19.13,16.86],[18.99,17.13],[18.84,17.39],[18.67,17.65],[18.5,17.89],[18.32,18.13],[18.13,18.36],[17.94,18.59],[17.73,18.81],[17.52,19.02],[17.3,19.22],[17.07,19.42],[16.83,19.61],[16.59,19.8],[16.34,19.98],[16.09,20.15],[15.83,20.32],[15.56,20.49],[15.29,20.64],[15.02,20.8],[14.73,20.94],[14.45,21.08],[14.16,21.22],[13.86,21.35],[13.57,21.48],[13.26,21.61],[12.96,21.72],[12.65,21.84],[12.34,21.95],[12.12,22],[11.89,21.99],[11.67,21.94],[11.36,21.83],[11.05,21.72],[10.74,21.6],[10.44,21.47],[10.14,21.35],[9.85,21.22],[9.56,21.08],[9.27,20.94],[8.99,20.79],[8.71,20.64],[8.44,20.48],[8.17,20.32],[7.91,20.15],[7.66,19.98],[7.41,19.8],[7.17,19.61],[6.93,19.42],[6.71,19.22],[6.48,19.02],[6.27,18.8],[6.07,18.59],[5.87,18.36],[5.68,18.13],[5.5,17.89],[5.33,17.65],[5.16,17.39],[5.01,17.13],[4.87,16.86],[4.74,16.59],[4.61,16.3],[4.5,16.01],[4.4,15.71],[4.31,15.4],[4.23,15.09],[4.16,14.76],[4.1,14.43],[4.06,14.08],[4.03,13.73],[4.01,13.37],[4,13],[4,6],[4.05,5.69],[4.19,5.41],[4.41,5.19],[4.69,5.05],[5,5],[5.29,4.99],[5.58,4.97],[5.88,4.93],[6.19,4.88],[6.5,4.81],[6.81,4.73],[7.12,4.63],[7.43,4.53],[7.75,4.41],[8.06,4.28],[8.37,4.14],[8.68,3.99],[8.99,3.83],[9.29,3.66],[9.59,3.48],[9.88,3.3],[10.17,3.11],[10.45,2.91],[10.72,2.7],[10.99,2.49],[11.24,2.28],[11.52,2.1],[11.84,2.01],[12.16,2.01],[12.48,2.1],[12.76,2.28],[13.01,2.5],[13.28,2.71],[13.55,2.91],[13.83,3.11],[14.12,3.3],[14.41,3.49],[14.71,3.67],[15.01,3.83],[15.32,3.99],[15.63,4.14],[15.94,4.28],[16.26,4.41],[16.57,4.53],[16.88,4.63],[17.19,4.73],[17.5,4.81],[17.81,4.88],[18.12,4.93],[18.42,4.97],[18.71,4.99],[19,5],[19.31,5.05],[19.59,5.19],[19.81,5.41],[19.95,5.69],[20,6],[20,13]],[[12,8],[12,12]],[[12,16],[12.01,16]]]],
    ["safety_siren", [[[7,18],[7,12],[7.01,11.65],[7.05,11.3],[7.11,10.96],[7.19,10.62],[7.3,10.29],[7.43,9.97],[7.59,9.65],[7.76,9.35],[7.95,9.06],[8.17,8.79],[8.4,8.53],[8.65,8.28],[8.92,8.06],[9.2,7.85],[9.5,7.67],[9.81,7.51],[10.13,7.36],[10.45,7.24],[10.79,7.15],[11.13,7.08],[11.48,7.03],[11.83,7],[12.17,7],[12.52,7.03],[12.87,7.08],[13.21,7.15],[13.55,7.24],[13.87,7.36],[14.19,7.51],[14.5,7.67],[14.8,7.85],[15.08,8.06],[15.35,8.28],[15.6,8.53],[15.83,8.79],[16.05,9.06],[16.24,9.35],[16.41,9.65],[16.57,9.97],[16.7,10.29],[16.81,10.62],[16.89,10.96],[16.95,11.3],[16.99,11.65],[17,12],[17,18]],[[5,21],[5.05,21.31],[5.19,21.59],[5.41,21.81],[5.69,21.95],[6,22],[18,22],[18.31,21.95],[18.59,21.81],[18.81,21.59],[18.95,21.31],[19,21],[19,20],[18.97,19.65],[18.88,19.32],[18.73,19],[18.53,18.71],[18.29,18.47],[18,18.27],[17.68,18.12],[17.35,18.03],[17,18],[7,18],[6.65,18.03],[6.32,18.12],[6,18.27],[5.71,18.47],[5.47,18.71],[5.27,19],[5.12,19.32],[5.03,19.65],[5,20],[5,21]],[[21,12],[22,12]],[[18.5,4.5],[18,5]],[[2,12],[3,12]],[[12,2],[12,3]],[[4.93,4.93],[5.64,5.64]],[[12,12],[12,18]]]],
    ["safety_triangle-alert", [[[21.73,18],[13.73,4],[13.55,3.73],[13.32,3.5],[13.07,3.3],[12.78,3.15],[12.47,3.05],[12.15,2.99],[11.83,2.99],[11.51,3.05],[11.2,3.15],[10.91,3.3],[10.66,3.5],[10.43,3.73],[10.25,4],[2.25,18],[2.11,18.29],[2.02,18.6],[1.98,18.92],[2,19.25],[2.06,19.56],[2.18,19.86],[2.34,20.14],[2.55,20.39],[2.79,20.61],[3.06,20.78],[3.36,20.9],[3.68,20.98],[4,21],[20,21],[20.35,20.97],[20.68,20.88],[21,20.73],[21.28,20.53],[21.53,20.28],[21.73,20],[21.88,19.68],[21.97,19.35],[22,19],[21.97,18.65],[21.88,18.32],[21.73,18]],[[12,9],[12,13]],[[12,17],[12.01,17]]]],
    ["safety_octagon-alert", [[[12,16],[12.01,16]],[[12,8],[12,12]],[[15.31,2],[15.62,2.02],[15.93,2.1],[16.22,2.22],[16.49,2.38],[16.73,2.59],[21.41,7.27],[21.62,7.51],[21.78,7.78],[21.9,8.07],[21.98,8.38],[22,8.69],[22,15.31],[21.98,15.62],[21.9,15.93],[21.78,16.22],[21.62,16.49],[21.41,16.73],[16.73,21.41],[16.49,21.62],[16.22,21.78],[15.93,21.9],[15.62,21.98],[15.31,22],[8.69,22],[8.38,21.98],[8.07,21.9],[7.78,21.78],[7.51,21.62],[7.27,21.41],[2.59,16.73],[2.38,16.49],[2.22,16.22],[2.1,15.93],[2.02,15.62],[2,15.31],[2,8.69],[2.02,8.38],[2.1,8.07],[2.22,7.78],[2.38,7.51],[2.59,7.27],[7.27,2.59],[7.51,2.38],[7.78,2.22],[8.07,2.1],[8.38,2.02],[8.69,2],[15.31,2]]]],
    ["safety_octagon-x", [[[15,9],[9,15]],[[2.59,16.73],[2.38,16.49],[2.22,16.22],[2.1,15.93],[2.02,15.62],[2,15.31],[2,8.69],[2.02,8.38],[2.1,8.07],[2.22,7.78],[2.38,7.51],[2.59,7.27],[7.27,2.59],[7.51,2.38],[7.78,2.22],[8.07,2.1],[8.38,2.02],[8.69,2],[15.31,2],[15.62,2.02],[15.93,2.1],[16.22,2.22],[16.49,2.38],[16.73,2.59],[21.41,7.27],[21.62,7.51],[21.78,7.78],[21.9,8.07],[21.98,8.38],[22,8.69],[22,15.31],[21.98,15.62],[21.9,15.93],[21.78,16.22],[21.62,16.49],[21.41,16.73],[16.73,21.41],[16.49,21.62],[16.22,21.78],[15.93,21.9],[15.62,21.98],[15.31,22],[8.69,22],[8.38,21.98],[8.07,21.9],[7.78,21.78],[7.51,21.62],[7.27,21.41],[2.59,16.73]],[[9,9],[15,15]]]],
    ["safety_ban", [[[2,12],[2.01,12.35],[2.02,12.7],[2.05,13.05],[2.1,13.39],[2.15,13.74],[2.22,14.08],[2.3,14.42],[2.39,14.76],[2.49,15.09],[2.6,15.42],[2.73,15.75],[2.86,16.07],[3.01,16.38],[3.17,16.69],[3.34,17],[3.52,17.3],[3.71,17.59],[3.91,17.88],[4.12,18.16],[4.34,18.43],[4.57,18.69],[4.81,18.95],[5.05,19.19],[5.31,19.43],[5.57,19.66],[5.84,19.88],[6.12,20.09],[6.41,20.29],[6.7,20.48],[7,20.66],[7.31,20.83],[7.62,20.99],[7.93,21.14],[8.25,21.27],[8.58,21.4],[8.91,21.51],[9.24,21.61],[9.58,21.7],[9.92,21.78],[10.26,21.85],[10.61,21.9],[10.95,21.95],[11.3,21.98],[11.65,21.99],[12,22],[12.35,21.99],[12.7,21.98],[13.05,21.95],[13.39,21.9],[13.74,21.85],[14.08,21.78],[14.42,21.7],[14.76,21.61],[15.09,21.51],[15.42,21.4],[15.75,21.27],[16.07,21.14],[16.38,20.99],[16.69,20.83],[17,20.66],[17.3,20.48],[17.59,20.29],[17.88,20.09],[18.16,19.88],[18.43,19.66],[18.69,19.43],[18.95,19.19],[19.19,18.95],[19.43,18.69],[19.66,18.43],[19.88,18.16],[20.09,17.88],[20.29,17.59],[20.48,17.3],[20.66,17],[20.83,16.69],[20.99,16.38],[21.14,16.07],[21.27,15.75],[21.4,15.42],[21.51,15.09],[21.61,14.76],[21.7,14.42],[21.78,14.08],[21.85,13.74],[21.9,13.39],[21.95,13.05],[21.98,12.7],[21.99,12.35],[22,12],[21.99,11.65],[21.98,11.3],[21.95,10.95],[21.9,10.61],[21.85,10.26],[21.78,9.92],[21.7,9.58],[21.61,9.24],[21.51,8.91],[21.4,8.58],[21.27,8.25],[21.14,7.93],[20.99,7.62],[20.83,7.31],[20.66,7],[20.48,6.7],[20.29,6.41],[20.09,6.12],[19.88,5.84],[19.66,5.57],[19.43,5.31],[19.19,5.05],[18.95,4.81],[18.69,4.57],[18.43,4.34],[18.16,4.12],[17.88,3.91],[17.59,3.71],[17.3,3.52],[17,3.34],[16.69,3.17],[16.38,3.01],[16.07,2.86],[15.75,2.73],[15.42,2.6],[15.09,2.49],[14.76,2.39],[14.42,2.3],[14.08,2.22],[13.74,2.15],[13.39,2.1],[13.05,2.05],[12.7,2.02],[12.35,2.01],[12,2],[11.65,2.01],[11.3,2.02],[10.95,2.05],[10.61,2.1],[10.26,2.15],[9.92,2.22],[9.58,2.3],[9.24,2.39],[8.91,2.49],[8.58,2.6],[8.25,2.73],[7.93,2.86],[7.62,3.01],[7.31,3.17],[7,3.34],[6.7,3.52],[6.41,3.71],[6.12,3.91],[5.84,4.12],[5.57,4.34],[5.31,4.57],[5.05,4.81],[4.81,5.05],[4.57,5.31],[4.34,5.57],[4.12,5.84],[3.91,6.12],[3.71,6.41],[3.52,6.7],[3.34,7],[3.17,7.31],[3.01,7.62],[2.86,7.93],[2.73,8.25],[2.6,8.58],[2.49,8.91],[2.39,9.24],[2.3,9.58],[2.22,9.92],[2.15,10.26],[2.1,10.61],[2.05,10.95],[2.02,11.3],[2.01,11.65],[2,12]],[[4.93,4.93],[19.07,19.07]]]],
    ["safety_hand", [[[18,11],[18,6],[17.97,5.65],[17.88,5.32],[17.73,5],[17.53,4.71],[17.29,4.47],[17,4.27],[16.68,4.12],[16.35,4.03],[16,4],[15.65,4.03],[15.32,4.12],[15,4.27],[14.71,4.47],[14.47,4.71],[14.27,5],[14.12,5.32],[14.03,5.65],[14,6]],[[14,10],[14,4],[13.97,3.65],[13.88,3.32],[13.73,3],[13.53,2.71],[13.29,2.47],[13,2.27],[12.68,2.12],[12.35,2.03],[12,2],[11.65,2.03],[11.32,2.12],[11,2.27],[10.71,2.47],[10.47,2.71],[10.27,3],[10.12,3.32],[10.03,3.65],[10,4],[10,6]],[[10,10.5],[10,6],[9.97,5.65],[9.88,5.32],[9.73,5],[9.53,4.71],[9.29,4.47],[9,4.27],[8.68,4.12],[8.35,4.03],[8,4],[7.65,4.03],[7.32,4.12],[7,4.27],[6.71,4.47],[6.47,4.71],[6.27,5],[6.12,5.32],[6.03,5.65],[6,6],[6,14]],[[18,8],[18.03,7.65],[18.12,7.32],[18.27,7],[18.47,6.71],[18.71,6.47],[19,6.27],[19.32,6.12],[19.65,6.03],[20,6],[20.35,6.03],[20.68,6.12],[21,6.27],[21.29,6.47],[21.53,6.71],[21.73,7],[21.88,7.32],[21.97,7.65],[22,8],[22,14],[21.99,14.35],[21.97,14.7],[21.93,15.04],[21.88,15.39],[21.81,15.73],[21.73,16.07],[21.63,16.41],[21.52,16.74],[21.39,17.06],[21.25,17.38],[21.1,17.69],[20.93,18],[20.75,18.3],[20.55,18.59],[20.35,18.87],[20.13,19.14],[19.9,19.4],[19.66,19.66],[19.4,19.9],[19.14,20.13],[18.87,20.35],[18.59,20.55],[18.3,20.75],[18,20.93],[17.69,21.1],[17.38,21.25],[17.06,21.39],[16.74,21.52],[16.41,21.63],[16.07,21.73],[15.73,21.81],[15.39,21.88],[15.04,21.93],[14.7,21.97],[14.35,21.99],[14,22],[12,22],[11.59,21.99],[11.19,21.97],[10.81,21.94],[10.44,21.9],[10.09,21.84],[9.75,21.77],[9.43,21.69],[9.11,21.6],[8.81,21.5],[8.51,21.38],[8.23,21.26],[7.96,21.12],[7.69,20.98],[7.43,20.82],[7.18,20.65],[6.94,20.47],[6.7,20.28],[6.46,20.09],[6.24,19.88],[6.01,19.66],[2.41,16.06],[2.21,15.79],[2.05,15.49],[1.95,15.17],[1.9,14.84],[1.91,14.5],[1.97,14.17],[2.09,13.85],[2.26,13.56],[2.48,13.3],[2.74,13.09],[3.03,12.91],[3.35,12.8],[3.68,12.73],[4.02,12.72],[4.35,12.77],[4.67,12.88],[4.97,13.03],[5.24,13.24],[7,15]]]],
    ["safety_flame", [[[12,3],[12.09,3.34],[12.19,3.68],[12.29,4.02],[12.41,4.35],[12.53,4.67],[12.66,4.98],[12.79,5.3],[12.94,5.6],[13.09,5.9],[13.25,6.19],[13.41,6.48],[13.59,6.77],[13.77,7.04],[13.96,7.31],[14.16,7.58],[14.36,7.84],[14.57,8.09],[14.79,8.34],[15.02,8.59],[15.25,8.82],[15.49,9.05],[15.74,9.28],[16,9.5],[16.29,9.75],[16.57,10.01],[16.83,10.26],[17.08,10.52],[17.31,10.78],[17.53,11.04],[17.73,11.31],[17.92,11.58],[18.09,11.85],[18.25,12.12],[18.39,12.4],[18.52,12.68],[18.63,12.96],[18.73,13.25],[18.81,13.53],[18.88,13.82],[18.93,14.11],[18.97,14.41],[18.99,14.7],[19,15],[18.99,15.35],[18.97,15.7],[18.92,16.04],[18.86,16.39],[18.78,16.73],[18.69,17.06],[18.58,17.39],[18.45,17.72],[18.31,18.04],[18.15,18.35],[17.97,18.65],[17.78,18.94],[17.58,19.23],[17.36,19.5],[17.13,19.76],[16.89,20.01],[16.63,20.25],[16.36,20.47],[16.09,20.68],[15.8,20.88],[15.5,21.06],[15.19,21.23],[14.88,21.38],[14.56,21.52],[14.23,21.64],[13.9,21.74],[13.56,21.82],[13.22,21.89],[12.87,21.95],[12.52,21.98],[12.17,22],[11.83,22],[11.48,21.98],[11.13,21.95],[10.78,21.89],[10.44,21.82],[10.1,21.74],[9.77,21.64],[9.44,21.52],[9.12,21.38],[8.81,21.23],[8.5,21.06],[8.2,20.88],[7.91,20.68],[7.64,20.47],[7.37,20.25],[7.11,20.01],[6.87,19.76],[6.64,19.5],[6.42,19.23],[6.22,18.94],[6.03,18.65],[5.85,18.35],[5.69,18.04],[5.55,17.72],[5.42,17.39],[5.31,17.06],[5.22,16.73],[5.14,16.39],[5.08,16.04],[5.03,15.7],[5.01,15.35],[5,15],[5.01,14.68],[5.04,14.36],[5.09,14.04],[5.16,13.73],[5.26,13.42],[5.37,13.12],[5.5,12.82],[5.65,12.54],[5.82,12.26],[6,12],[6.02,12.34],[6.09,12.67],[6.21,13],[6.36,13.3],[6.56,13.58],[6.79,13.83],[7.06,14.04],[7.35,14.22],[7.66,14.36],[7.99,14.45],[8.33,14.49],[8.67,14.49],[9.01,14.45],[9.34,14.36],[9.65,14.22],[9.94,14.04],[10.21,13.83],[10.44,13.58],[10.64,13.3],[10.79,13],[10.91,12.67],[10.98,12.34],[11,12],[10.99,11.66],[10.94,11.33],[10.88,11.02],[10.79,10.73],[10.69,10.44],[10.57,10.17],[10.45,9.9],[10.32,9.63],[10.18,9.37],[10.05,9.1],[9.93,8.83],[9.81,8.56],[9.71,8.27],[9.62,7.98],[9.56,7.67],[9.51,7.34],[9.5,7],[9.51,6.73],[9.54,6.47],[9.6,6.2],[9.68,5.93],[9.78,5.67],[9.9,5.4],[10.04,5.13],[10.21,4.87],[10.4,4.6],[10.61,4.33],[10.84,4.07],[11.1,3.8],[11.38,3.53],[11.68,3.27],[12,3]]]],
    ["safety_zap", [[[15.91,4],[15.99,3.67],[15.99,3.34],[15.92,3.01],[15.77,2.71],[15.56,2.44],[15.3,2.23],[15,2.09],[14.67,2.01],[14.33,2.01],[14.01,2.08],[13.7,2.23],[13.44,2.44],[4.44,11.44],[4.24,11.69],[4.1,11.98],[4.02,12.29],[4,12.61],[4.06,12.92],[4.18,13.22],[4.37,13.48],[4.6,13.7],[4.88,13.86],[5.18,13.97],[5.5,14],[9.5,14],[9.8,14.1],[9.98,14.35],[9.97,14.67],[8.09,20],[8.01,20.33],[8.01,20.66],[8.08,20.99],[8.23,21.29],[8.44,21.56],[8.7,21.77],[9,21.91],[9.33,21.99],[9.67,21.99],[10,21.92],[10.3,21.77],[10.56,21.56],[19.56,12.56],[19.76,12.31],[19.91,12.02],[19.98,11.71],[20,11.39],[19.94,11.08],[19.82,10.78],[19.63,10.52],[19.4,10.3],[19.12,10.14],[18.82,10.03],[18.5,10],[14.5,10],[14.21,9.9],[14.02,9.65],[14.03,9.33],[15.91,4]]]],
    ["safety_biohazard", [[[10,11.9],[10.03,12.25],[10.12,12.58],[10.27,12.9],[10.47,13.19],[10.71,13.43],[11,13.63],[11.32,13.78],[11.65,13.87],[12,13.9],[12.35,13.87],[12.68,13.78],[13,13.63],[13.29,13.43],[13.53,13.19],[13.73,12.9],[13.88,12.58],[13.97,12.25],[14,11.9],[13.97,11.55],[13.88,11.22],[13.73,10.9],[13.53,10.61],[13.29,10.37],[13,10.17],[12.68,10.02],[12.35,9.93],[12,9.9],[11.65,9.93],[11.32,10.02],[11,10.17],[10.71,10.37],[10.47,10.61],[10.27,10.9],[10.12,11.22],[10.03,11.55],[10,11.9]],[[6.7,3.4],[6.6,3.71],[6.51,4.03],[6.45,4.34],[6.4,4.66],[6.37,4.98],[6.35,5.29],[6.36,5.6],[6.38,5.91],[6.42,6.22],[6.48,6.53],[6.55,6.83],[6.64,7.12],[6.74,7.42],[6.86,7.7],[7,7.98],[7.15,8.25],[7.32,8.52],[7.5,8.77],[7.7,9.02],[7.91,9.26],[8.14,9.48],[8.38,9.7],[8.63,9.91],[8.9,10.1],[8.6,9.97],[8.29,9.86],[7.98,9.77],[7.67,9.69],[7.36,9.63],[7.05,9.59],[6.74,9.56],[6.42,9.56],[6.11,9.56],[5.8,9.59],[5.49,9.63],[5.19,9.69],[4.89,9.76],[4.59,9.85],[4.3,9.96],[4.01,10.08],[3.73,10.21],[3.46,10.37],[3.19,10.54],[2.93,10.72],[2.69,10.92],[2.45,11.13],[2.22,11.36],[2,11.6]],[[8.9,10.1],[10.3,10.9]],[[17.3,3.4],[17.4,3.71],[17.49,4.03],[17.55,4.34],[17.6,4.66],[17.63,4.98],[17.65,5.29],[17.64,5.6],[17.62,5.91],[17.58,6.22],[17.52,6.53],[17.45,6.83],[17.36,7.12],[17.26,7.42],[17.14,7.7],[17,7.98],[16.85,8.25],[16.68,8.52],[16.5,8.77],[16.3,9.02],[16.09,9.26],[15.86,9.48],[15.62,9.7],[15.37,9.91],[15.1,10.1],[15.4,9.96],[15.71,9.84],[16.02,9.73],[16.33,9.65],[16.64,9.58],[16.95,9.53],[17.26,9.5],[17.58,9.49],[17.89,9.49],[18.2,9.52],[18.51,9.56],[18.81,9.61],[19.11,9.69],[19.41,9.78],[19.7,9.89],[19.99,10.01],[20.27,10.15],[20.54,10.31],[20.81,10.49],[21.07,10.68],[21.31,10.88],[21.55,11.11],[21.78,11.35],[22,11.6]],[[15.1,10.1],[13.7,10.9]],[[16.7,20.8],[16.38,20.74],[16.06,20.66],[15.76,20.57],[15.46,20.46],[15.16,20.33],[14.88,20.18],[14.61,20.02],[14.35,19.85],[14.1,19.66],[13.86,19.46],[13.63,19.24],[13.41,19.01],[13.21,18.77],[13.02,18.52],[12.85,18.26],[12.69,17.99],[12.54,17.7],[12.41,17.41],[12.3,17.11],[12.2,16.8],[12.12,16.49],[12.06,16.16],[12.02,15.83],[12,15.5],[11.97,15.82],[11.92,16.14],[11.85,16.45],[11.76,16.76],[11.66,17.06],[11.55,17.35],[11.42,17.64],[11.27,17.91],[11.11,18.18],[10.94,18.44],[10.75,18.69],[10.55,18.93],[10.34,19.15],[10.11,19.36],[9.88,19.56],[9.63,19.75],[9.37,19.93],[9.1,20.08],[8.82,20.23],[8.54,20.36],[8.24,20.47],[7.93,20.56],[7.62,20.64],[7.3,20.7]],[[12,13.9],[12,15.5]],[[13.5,5.4],[13.17,5.34],[12.83,5.3],[12.5,5.27],[12.17,5.25],[11.83,5.25],[11.5,5.27],[11.17,5.3],[10.83,5.34],[10.5,5.4]],[[17,16.4],[17.23,16.16],[17.44,15.91],[17.63,15.64],[17.81,15.37],[17.98,15.08],[18.13,14.79],[18.27,14.5],[18.39,14.2],[18.5,13.9]],[[5.5,13.9],[5.61,14.2],[5.73,14.5],[5.87,14.79],[6.02,15.08],[6.19,15.37],[6.37,15.64],[6.56,15.91],[6.77,16.16],[7,16.4]]]],
    ["safety_radiation", [[[12,12],[12.01,12]],[[14,15.46],[13.69,15.63],[13.37,15.76],[13.04,15.86],[12.69,15.94],[12.35,15.98],[12,16],[11.65,15.98],[11.31,15.94],[10.96,15.86],[10.63,15.76],[10.31,15.63],[10,15.46],[7.53,19.75],[7.41,20.06],[7.4,20.39],[7.51,20.71],[7.71,20.98],[7.99,21.16],[8.31,21.29],[8.63,21.42],[8.96,21.53],[9.29,21.62],[9.62,21.71],[9.95,21.79],[10.29,21.85],[10.63,21.91],[10.97,21.95],[11.31,21.98],[11.66,21.99],[12,22],[12.34,21.99],[12.69,21.98],[13.03,21.95],[13.37,21.91],[13.71,21.85],[14.05,21.79],[14.38,21.71],[14.71,21.62],[15.04,21.53],[15.37,21.42],[15.69,21.29],[16.01,21.16],[16.29,20.98],[16.49,20.71],[16.6,20.39],[16.59,20.06],[16.47,19.75],[14,15.46]],[[16,12],[15.98,11.65],[15.94,11.31],[15.86,10.96],[15.76,10.63],[15.63,10.31],[15.46,10],[15.28,9.71],[15.06,9.43],[14.83,9.17],[14.57,8.94],[14.29,8.72],[14,8.54],[16.47,4.25],[16.69,4],[16.97,3.82],[17.3,3.75],[17.63,3.8],[17.93,3.95],[18.21,4.16],[18.47,4.38],[18.73,4.6],[18.98,4.84],[19.22,5.08],[19.45,5.33],[19.68,5.59],[19.89,5.86],[20.1,6.14],[20.3,6.42],[20.48,6.71],[20.66,7],[20.83,7.3],[20.98,7.61],[21.13,7.92],[21.26,8.23],[21.39,8.55],[21.5,8.88],[21.6,9.21],[21.69,9.54],[21.77,9.87],[21.84,10.21],[21.89,10.55],[21.94,10.89],[21.92,11.21],[21.8,11.51],[21.59,11.76],[21.32,11.93],[21,12],[16,12]],[[8,12],[8.02,11.65],[8.06,11.31],[8.14,10.96],[8.24,10.63],[8.37,10.31],[8.54,10],[8.72,9.71],[8.94,9.43],[9.17,9.17],[9.43,8.94],[9.71,8.72],[10,8.54],[7.53,4.25],[7.31,4],[7.03,3.82],[6.7,3.75],[6.37,3.8],[6.07,3.95],[5.79,4.16],[5.53,4.38],[5.27,4.6],[5.02,4.84],[4.78,5.08],[4.55,5.33],[4.32,5.59],[4.11,5.86],[3.9,6.14],[3.7,6.42],[3.52,6.71],[3.34,7],[3.17,7.3],[3.02,7.61],[2.87,7.92],[2.74,8.23],[2.61,8.55],[2.5,8.88],[2.4,9.21],[2.31,9.54],[2.23,9.87],[2.16,10.21],[2.11,10.55],[2.06,10.89],[2.08,11.21],[2.2,11.51],[2.41,11.76],[2.68,11.93],[3,12],[8,12]]]],
    ["safety_fire-extinguisher", [[[15,6.5],[15,3],[14.95,2.69],[14.81,2.41],[14.59,2.19],[14.31,2.05],[14,2],[12,2],[11.69,2.05],[11.41,2.19],[11.19,2.41],[11.05,2.69],[11,3],[11,6.5]],[[9,18],[17,18]],[[18,3],[15,3]],[[11,3],[10.65,3.01],[10.3,3.04],[9.96,3.09],[9.62,3.16],[9.28,3.25],[8.95,3.36],[8.62,3.49],[8.31,3.64],[8,3.8],[7.7,3.99],[7.42,4.19],[7.14,4.4],[6.88,4.64],[6.64,4.88],[6.4,5.14],[6.19,5.42],[5.99,5.7],[5.8,6],[5.64,6.31],[5.49,6.62],[5.36,6.95],[5.25,7.28],[5.16,7.62],[5.09,7.96],[5.04,8.3],[5.01,8.65],[5,9],[5,20]],[[5,13],[9,13]],[[17,10],[16.98,9.65],[16.94,9.31],[16.86,8.96],[16.76,8.63],[16.63,8.31],[16.46,8],[16.28,7.71],[16.06,7.43],[15.83,7.17],[15.57,6.94],[15.29,6.72],[15,6.54],[14.69,6.37],[14.37,6.24],[14.04,6.14],[13.69,6.06],[13.35,6.02],[13,6],[12.65,6.02],[12.31,6.06],[11.96,6.14],[11.63,6.24],[11.31,6.37],[11,6.54],[10.71,6.72],[10.43,6.94],[10.17,7.17],[9.94,7.43],[9.72,7.71],[9.54,8],[9.37,8.31],[9.24,8.63],[9.14,8.96],[9.06,9.31],[9.02,9.65],[9,10],[9,20],[9.03,20.35],[9.12,20.68],[9.27,21],[9.47,21.29],[9.71,21.53],[10,21.73],[10.32,21.88],[10.65,21.97],[11,22],[15,22],[15.35,21.97],[15.68,21.88],[16,21.73],[16.29,21.53],[16.53,21.29],[16.73,21],[16.88,20.68],[16.97,20.35],[17,20],[17,10]]]],
    ["safety_briefcase-medical", [[[12,11],[12,15]],[[14,13],[10,13]],[[16,6],[16,4],[15.97,3.65],[15.88,3.32],[15.73,3],[15.53,2.71],[15.29,2.47],[15,2.27],[14.68,2.12],[14.35,2.03],[14,2],[10,2],[9.65,2.03],[9.32,2.12],[9,2.27],[8.71,2.47],[8.47,2.71],[8.27,3],[8.12,3.32],[8.03,3.65],[8,4],[8,6]],[[18,6],[18,20]],[[6,6],[6,20]],[[4,6],[20,6],[20.35,6.03],[20.68,6.12],[21,6.27],[21.29,6.47],[21.53,6.71],[21.73,7],[21.88,7.32],[21.97,7.65],[22,8],[22,18],[21.97,18.35],[21.88,18.68],[21.73,19],[21.53,19.29],[21.29,19.53],[21,19.73],[20.68,19.88],[20.35,19.97],[20,20],[4,20],[3.65,19.97],[3.32,19.88],[3,19.73],[2.71,19.53],[2.47,19.29],[2.27,19],[2.12,18.68],[2.03,18.35],[2,18],[2,8],[2.03,7.65],[2.12,7.32],[2.27,7],[2.47,6.71],[2.71,6.47],[3,6.27],[3.32,6.12],[3.65,6.03],[4,6]]]],
    ["safety_eye", [[[2.06,12.35],[2.01,12.12],[2.01,11.88],[2.06,11.65],[2.2,11.33],[2.35,11.02],[2.51,10.71],[2.67,10.41],[2.85,10.11],[3.04,9.81],[3.23,9.53],[3.44,9.25],[3.65,8.97],[3.88,8.71],[4.11,8.45],[4.35,8.2],[4.6,7.95],[4.85,7.72],[5.12,7.49],[5.39,7.27],[5.66,7.07],[5.95,6.87],[6.24,6.67],[6.54,6.49],[6.84,6.32],[7.14,6.16],[7.46,6.01],[7.77,5.87],[8.1,5.73],[8.42,5.61],[8.75,5.5],[9.08,5.4],[9.42,5.31],[9.76,5.24],[10.1,5.17],[10.44,5.11],[10.79,5.07],[11.13,5.04],[11.48,5.01],[11.83,5],[12.17,5],[12.52,5.01],[12.87,5.04],[13.21,5.07],[13.56,5.11],[13.9,5.17],[14.24,5.24],[14.58,5.31],[14.92,5.4],[15.25,5.5],[15.58,5.61],[15.9,5.73],[16.23,5.87],[16.54,6.01],[16.86,6.16],[17.16,6.32],[17.46,6.49],[17.76,6.67],[18.05,6.87],[18.34,7.07],[18.61,7.27],[18.88,7.49],[19.15,7.72],[19.4,7.95],[19.65,8.2],[19.89,8.45],[20.12,8.71],[20.35,8.97],[20.56,9.25],[20.77,9.53],[20.96,9.81],[21.15,10.11],[21.33,10.41],[21.49,10.71],[21.65,11.02],[21.8,11.33],[21.94,11.65],[21.99,11.88],[21.99,12.12],[21.94,12.35],[21.8,12.67],[21.65,12.98],[21.49,13.29],[21.33,13.59],[21.15,13.89],[20.96,14.19],[20.77,14.47],[20.56,14.75],[20.35,15.03],[20.12,15.29],[19.89,15.55],[19.65,15.8],[19.4,16.05],[19.15,16.28],[18.88,16.51],[18.61,16.73],[18.34,16.93],[18.05,17.13],[17.76,17.33],[17.46,17.51],[17.16,17.68],[16.86,17.84],[16.54,17.99],[16.23,18.13],[15.9,18.27],[15.58,18.39],[15.25,18.5],[14.92,18.6],[14.58,18.69],[14.24,18.76],[13.9,18.83],[13.56,18.89],[13.21,18.93],[12.87,18.96],[12.52,18.99],[12.17,19],[11.83,19],[11.48,18.99],[11.13,18.96],[10.79,18.93],[10.44,18.89],[10.1,18.83],[9.76,18.76],[9.42,18.69],[9.08,18.6],[8.75,18.5],[8.42,18.39],[8.1,18.27],[7.77,18.13],[7.46,17.99],[7.14,17.84],[6.84,17.68],[6.54,17.51],[6.24,17.33],[5.95,17.13],[5.66,16.93],[5.39,16.73],[5.12,16.51],[4.85,16.28],[4.6,16.05],[4.35,15.8],[4.11,15.55],[3.88,15.29],[3.65,15.03],[3.44,14.75],[3.23,14.47],[3.04,14.19],[2.85,13.89],[2.67,13.59],[2.51,13.29],[2.35,12.98],[2.2,12.67],[2.06,12.35]],[[9,12],[9.02,12.35],[9.08,12.69],[9.18,13.03],[9.32,13.35],[9.49,13.65],[9.7,13.93],[9.94,14.18],[10.21,14.41],[10.5,14.6],[10.81,14.75],[11.14,14.87],[11.48,14.95],[11.83,14.99],[12.17,14.99],[12.52,14.95],[12.86,14.87],[13.19,14.75],[13.5,14.6],[13.79,14.41],[14.06,14.18],[14.3,13.93],[14.51,13.65],[14.68,13.35],[14.82,13.03],[14.92,12.69],[14.98,12.35],[15,12],[14.98,11.65],[14.92,11.31],[14.82,10.97],[14.68,10.65],[14.51,10.35],[14.3,10.07],[14.06,9.82],[13.79,9.59],[13.5,9.4],[13.19,9.25],[12.86,9.13],[12.52,9.05],[12.17,9.01],[11.83,9.01],[11.48,9.05],[11.14,9.13],[10.81,9.25],[10.5,9.4],[10.21,9.59],[9.94,9.82],[9.7,10.07],[9.49,10.35],[9.32,10.65],[9.18,10.97],[9.08,11.31],[9.02,11.65],[9,12]]]],
    ["safety_lock", [[[5,11],[19,11],[19.35,11.03],[19.68,11.12],[20,11.27],[20.29,11.47],[20.53,11.71],[20.73,12],[20.88,12.32],[20.97,12.65],[21,13],[21,20],[20.97,20.35],[20.88,20.68],[20.73,21],[20.53,21.29],[20.29,21.53],[20,21.73],[19.68,21.88],[19.35,21.97],[19,22],[5,22],[4.65,21.97],[4.32,21.88],[4,21.73],[3.71,21.53],[3.47,21.29],[3.27,21],[3.12,20.68],[3.03,20.35],[3,20],[3,13],[3.03,12.65],[3.12,12.32],[3.27,12],[3.47,11.71],[3.71,11.47],[4,11.27],[4.32,11.12],[4.65,11.03],[5,11]],[[7,11],[7,7],[7.01,6.65],[7.05,6.3],[7.11,5.96],[7.19,5.62],[7.3,5.29],[7.43,4.97],[7.59,4.65],[7.76,4.35],[7.95,4.06],[8.17,3.79],[8.4,3.53],[8.65,3.28],[8.92,3.06],[9.2,2.85],[9.5,2.67],[9.81,2.51],[10.13,2.36],[10.45,2.24],[10.79,2.15],[11.13,2.08],[11.48,2.03],[11.83,2],[12.17,2],[12.52,2.03],[12.87,2.08],[13.21,2.15],[13.55,2.24],[13.87,2.36],[14.19,2.51],[14.5,2.67],[14.8,2.85],[15.08,3.06],[15.35,3.28],[15.6,3.53],[15.83,3.79],[16.05,4.06],[16.24,4.35],[16.41,4.65],[16.57,4.97],[16.7,5.29],[16.81,5.62],[16.89,5.96],[16.95,6.3],[16.99,6.65],[17,7],[17,11]]]],
    ["safety_lock-open", [[[5,11],[19,11],[19.35,11.03],[19.68,11.12],[20,11.27],[20.29,11.47],[20.53,11.71],[20.73,12],[20.88,12.32],[20.97,12.65],[21,13],[21,20],[20.97,20.35],[20.88,20.68],[20.73,21],[20.53,21.29],[20.29,21.53],[20,21.73],[19.68,21.88],[19.35,21.97],[19,22],[5,22],[4.65,21.97],[4.32,21.88],[4,21.73],[3.71,21.53],[3.47,21.29],[3.27,21],[3.12,20.68],[3.03,20.35],[3,20],[3,13],[3.03,12.65],[3.12,12.32],[3.27,12],[3.47,11.71],[3.71,11.47],[4,11.27],[4.32,11.12],[4.65,11.03],[5,11]],[[7,11],[7,7],[7.01,6.66],[7.05,6.32],[7.1,5.98],[7.18,5.65],[7.29,5.32],[7.41,5],[7.56,4.7],[7.73,4.4],[7.92,4.11],[8.12,3.84],[8.35,3.58],[8.59,3.34],[8.85,3.11],[9.12,2.91],[9.41,2.72],[9.7,2.55],[10.01,2.41],[10.33,2.28],[10.66,2.18],[10.99,2.1],[11.33,2.04],[11.67,2.01],[12.01,1.99],[12.35,2.01],[12.69,2.04],[13.03,2.1],[13.36,2.18],[13.69,2.29],[14,2.41],[14.31,2.56],[14.61,2.73],[14.9,2.92],[15.17,3.13],[15.43,3.35],[15.67,3.6],[15.89,3.85],[16.1,4.13],[16.28,4.41],[16.45,4.71],[16.59,5.02],[16.72,5.34],[16.82,5.67],[16.9,6]]]],
    ["safety_info", [[[2,12],[2.01,12.35],[2.02,12.7],[2.05,13.05],[2.1,13.39],[2.15,13.74],[2.22,14.08],[2.3,14.42],[2.39,14.76],[2.49,15.09],[2.6,15.42],[2.73,15.75],[2.86,16.07],[3.01,16.38],[3.17,16.69],[3.34,17],[3.52,17.3],[3.71,17.59],[3.91,17.88],[4.12,18.16],[4.34,18.43],[4.57,18.69],[4.81,18.95],[5.05,19.19],[5.31,19.43],[5.57,19.66],[5.84,19.88],[6.12,20.09],[6.41,20.29],[6.7,20.48],[7,20.66],[7.31,20.83],[7.62,20.99],[7.93,21.14],[8.25,21.27],[8.58,21.4],[8.91,21.51],[9.24,21.61],[9.58,21.7],[9.92,21.78],[10.26,21.85],[10.61,21.9],[10.95,21.95],[11.3,21.98],[11.65,21.99],[12,22],[12.35,21.99],[12.7,21.98],[13.05,21.95],[13.39,21.9],[13.74,21.85],[14.08,21.78],[14.42,21.7],[14.76,21.61],[15.09,21.51],[15.42,21.4],[15.75,21.27],[16.07,21.14],[16.38,20.99],[16.69,20.83],[17,20.66],[17.3,20.48],[17.59,20.29],[17.88,20.09],[18.16,19.88],[18.43,19.66],[18.69,19.43],[18.95,19.19],[19.19,18.95],[19.43,18.69],[19.66,18.43],[19.88,18.16],[20.09,17.88],[20.29,17.59],[20.48,17.3],[20.66,17],[20.83,16.69],[20.99,16.38],[21.14,16.07],[21.27,15.75],[21.4,15.42],[21.51,15.09],[21.61,14.76],[21.7,14.42],[21.78,14.08],[21.85,13.74],[21.9,13.39],[21.95,13.05],[21.98,12.7],[21.99,12.35],[22,12],[21.99,11.65],[21.98,11.3],[21.95,10.95],[21.9,10.61],[21.85,10.26],[21.78,9.92],[21.7,9.58],[21.61,9.24],[21.51,8.91],[21.4,8.58],[21.27,8.25],[21.14,7.93],[20.99,7.62],[20.83,7.31],[20.66,7],[20.48,6.7],[20.29,6.41],[20.09,6.12],[19.88,5.84],[19.66,5.57],[19.43,5.31],[19.19,5.05],[18.95,4.81],[18.69,4.57],[18.43,4.34],[18.16,4.12],[17.88,3.91],[17.59,3.71],[17.3,3.52],[17,3.34],[16.69,3.17],[16.38,3.01],[16.07,2.86],[15.75,2.73],[15.42,2.6],[15.09,2.49],[14.76,2.39],[14.42,2.3],[14.08,2.22],[13.74,2.15],[13.39,2.1],[13.05,2.05],[12.7,2.02],[12.35,2.01],[12,2],[11.65,2.01],[11.3,2.02],[10.95,2.05],[10.61,2.1],[10.26,2.15],[9.92,2.22],[9.58,2.3],[9.24,2.39],[8.91,2.49],[8.58,2.6],[8.25,2.73],[7.93,2.86],[7.62,3.01],[7.31,3.17],[7,3.34],[6.7,3.52],[6.41,3.71],[6.12,3.91],[5.84,4.12],[5.57,4.34],[5.31,4.57],[5.05,4.81],[4.81,5.05],[4.57,5.31],[4.34,5.57],[4.12,5.84],[3.91,6.12],[3.71,6.41],[3.52,6.7],[3.34,7],[3.17,7.31],[3.01,7.62],[2.86,7.93],[2.73,8.25],[2.6,8.58],[2.49,8.91],[2.39,9.24],[2.3,9.58],[2.22,9.92],[2.15,10.26],[2.1,10.61],[2.05,10.95],[2.02,11.3],[2.01,11.65],[2,12]],[[12,16],[12,12]],[[12,8],[12.01,8]]]],
    ["safety_circle-alert", [[[2,12],[2.01,12.35],[2.02,12.7],[2.05,13.05],[2.1,13.39],[2.15,13.74],[2.22,14.08],[2.3,14.42],[2.39,14.76],[2.49,15.09],[2.6,15.42],[2.73,15.75],[2.86,16.07],[3.01,16.38],[3.17,16.69],[3.34,17],[3.52,17.3],[3.71,17.59],[3.91,17.88],[4.12,18.16],[4.34,18.43],[4.57,18.69],[4.81,18.95],[5.05,19.19],[5.31,19.43],[5.57,19.66],[5.84,19.88],[6.12,20.09],[6.41,20.29],[6.7,20.48],[7,20.66],[7.31,20.83],[7.62,20.99],[7.93,21.14],[8.25,21.27],[8.58,21.4],[8.91,21.51],[9.24,21.61],[9.58,21.7],[9.92,21.78],[10.26,21.85],[10.61,21.9],[10.95,21.95],[11.3,21.98],[11.65,21.99],[12,22],[12.35,21.99],[12.7,21.98],[13.05,21.95],[13.39,21.9],[13.74,21.85],[14.08,21.78],[14.42,21.7],[14.76,21.61],[15.09,21.51],[15.42,21.4],[15.75,21.27],[16.07,21.14],[16.38,20.99],[16.69,20.83],[17,20.66],[17.3,20.48],[17.59,20.29],[17.88,20.09],[18.16,19.88],[18.43,19.66],[18.69,19.43],[18.95,19.19],[19.19,18.95],[19.43,18.69],[19.66,18.43],[19.88,18.16],[20.09,17.88],[20.29,17.59],[20.48,17.3],[20.66,17],[20.83,16.69],[20.99,16.38],[21.14,16.07],[21.27,15.75],[21.4,15.42],[21.51,15.09],[21.61,14.76],[21.7,14.42],[21.78,14.08],[21.85,13.74],[21.9,13.39],[21.95,13.05],[21.98,12.7],[21.99,12.35],[22,12],[21.99,11.65],[21.98,11.3],[21.95,10.95],[21.9,10.61],[21.85,10.26],[21.78,9.92],[21.7,9.58],[21.61,9.24],[21.51,8.91],[21.4,8.58],[21.27,8.25],[21.14,7.93],[20.99,7.62],[20.83,7.31],[20.66,7],[20.48,6.7],[20.29,6.41],[20.09,6.12],[19.88,5.84],[19.66,5.57],[19.43,5.31],[19.19,5.05],[18.95,4.81],[18.69,4.57],[18.43,4.34],[18.16,4.12],[17.88,3.91],[17.59,3.71],[17.3,3.52],[17,3.34],[16.69,3.17],[16.38,3.01],[16.07,2.86],[15.75,2.73],[15.42,2.6],[15.09,2.49],[14.76,2.39],[14.42,2.3],[14.08,2.22],[13.74,2.15],[13.39,2.1],[13.05,2.05],[12.7,2.02],[12.35,2.01],[12,2],[11.65,2.01],[11.3,2.02],[10.95,2.05],[10.61,2.1],[10.26,2.15],[9.92,2.22],[9.58,2.3],[9.24,2.39],[8.91,2.49],[8.58,2.6],[8.25,2.73],[7.93,2.86],[7.62,3.01],[7.31,3.17],[7,3.34],[6.7,3.52],[6.41,3.71],[6.12,3.91],[5.84,4.12],[5.57,4.34],[5.31,4.57],[5.05,4.81],[4.81,5.05],[4.57,5.31],[4.34,5.57],[4.12,5.84],[3.91,6.12],[3.71,6.41],[3.52,6.7],[3.34,7],[3.17,7.31],[3.01,7.62],[2.86,7.93],[2.73,8.25],[2.6,8.58],[2.49,8.91],[2.39,9.24],[2.3,9.58],[2.22,9.92],[2.15,10.26],[2.1,10.61],[2.05,10.95],[2.02,11.3],[2.01,11.65],[2,12]],[[12,8],[12,12]],[[12,16],[12.01,16]]]],
    ["quality_circle-check", [[[2,12],[2.01,12.35],[2.02,12.7],[2.05,13.05],[2.1,13.39],[2.15,13.74],[2.22,14.08],[2.3,14.42],[2.39,14.76],[2.49,15.09],[2.6,15.42],[2.73,15.75],[2.86,16.07],[3.01,16.38],[3.17,16.69],[3.34,17],[3.52,17.3],[3.71,17.59],[3.91,17.88],[4.12,18.16],[4.34,18.43],[4.57,18.69],[4.81,18.95],[5.05,19.19],[5.31,19.43],[5.57,19.66],[5.84,19.88],[6.12,20.09],[6.41,20.29],[6.7,20.48],[7,20.66],[7.31,20.83],[7.62,20.99],[7.93,21.14],[8.25,21.27],[8.58,21.4],[8.91,21.51],[9.24,21.61],[9.58,21.7],[9.92,21.78],[10.26,21.85],[10.61,21.9],[10.95,21.95],[11.3,21.98],[11.65,21.99],[12,22],[12.35,21.99],[12.7,21.98],[13.05,21.95],[13.39,21.9],[13.74,21.85],[14.08,21.78],[14.42,21.7],[14.76,21.61],[15.09,21.51],[15.42,21.4],[15.75,21.27],[16.07,21.14],[16.38,20.99],[16.69,20.83],[17,20.66],[17.3,20.48],[17.59,20.29],[17.88,20.09],[18.16,19.88],[18.43,19.66],[18.69,19.43],[18.95,19.19],[19.19,18.95],[19.43,18.69],[19.66,18.43],[19.88,18.16],[20.09,17.88],[20.29,17.59],[20.48,17.3],[20.66,17],[20.83,16.69],[20.99,16.38],[21.14,16.07],[21.27,15.75],[21.4,15.42],[21.51,15.09],[21.61,14.76],[21.7,14.42],[21.78,14.08],[21.85,13.74],[21.9,13.39],[21.95,13.05],[21.98,12.7],[21.99,12.35],[22,12],[21.99,11.65],[21.98,11.3],[21.95,10.95],[21.9,10.61],[21.85,10.26],[21.78,9.92],[21.7,9.58],[21.61,9.24],[21.51,8.91],[21.4,8.58],[21.27,8.25],[21.14,7.93],[20.99,7.62],[20.83,7.31],[20.66,7],[20.48,6.7],[20.29,6.41],[20.09,6.12],[19.88,5.84],[19.66,5.57],[19.43,5.31],[19.19,5.05],[18.95,4.81],[18.69,4.57],[18.43,4.34],[18.16,4.12],[17.88,3.91],[17.59,3.71],[17.3,3.52],[17,3.34],[16.69,3.17],[16.38,3.01],[16.07,2.86],[15.75,2.73],[15.42,2.6],[15.09,2.49],[14.76,2.39],[14.42,2.3],[14.08,2.22],[13.74,2.15],[13.39,2.1],[13.05,2.05],[12.7,2.02],[12.35,2.01],[12,2],[11.65,2.01],[11.3,2.02],[10.95,2.05],[10.61,2.1],[10.26,2.15],[9.92,2.22],[9.58,2.3],[9.24,2.39],[8.91,2.49],[8.58,2.6],[8.25,2.73],[7.93,2.86],[7.62,3.01],[7.31,3.17],[7,3.34],[6.7,3.52],[6.41,3.71],[6.12,3.91],[5.84,4.12],[5.57,4.34],[5.31,4.57],[5.05,4.81],[4.81,5.05],[4.57,5.31],[4.34,5.57],[4.12,5.84],[3.91,6.12],[3.71,6.41],[3.52,6.7],[3.34,7],[3.17,7.31],[3.01,7.62],[2.86,7.93],[2.73,8.25],[2.6,8.58],[2.49,8.91],[2.39,9.24],[2.3,9.58],[2.22,9.92],[2.15,10.26],[2.1,10.61],[2.05,10.95],[2.02,11.3],[2.01,11.65],[2,12]],[[16,9],[10.5,14.5],[8,12]]]],
    ["quality_circle-x", [[[2,12],[2.01,12.35],[2.02,12.7],[2.05,13.05],[2.1,13.39],[2.15,13.74],[2.22,14.08],[2.3,14.42],[2.39,14.76],[2.49,15.09],[2.6,15.42],[2.73,15.75],[2.86,16.07],[3.01,16.38],[3.17,16.69],[3.34,17],[3.52,17.3],[3.71,17.59],[3.91,17.88],[4.12,18.16],[4.34,18.43],[4.57,18.69],[4.81,18.95],[5.05,19.19],[5.31,19.43],[5.57,19.66],[5.84,19.88],[6.12,20.09],[6.41,20.29],[6.7,20.48],[7,20.66],[7.31,20.83],[7.62,20.99],[7.93,21.14],[8.25,21.27],[8.58,21.4],[8.91,21.51],[9.24,21.61],[9.58,21.7],[9.92,21.78],[10.26,21.85],[10.61,21.9],[10.95,21.95],[11.3,21.98],[11.65,21.99],[12,22],[12.35,21.99],[12.7,21.98],[13.05,21.95],[13.39,21.9],[13.74,21.85],[14.08,21.78],[14.42,21.7],[14.76,21.61],[15.09,21.51],[15.42,21.4],[15.75,21.27],[16.07,21.14],[16.38,20.99],[16.69,20.83],[17,20.66],[17.3,20.48],[17.59,20.29],[17.88,20.09],[18.16,19.88],[18.43,19.66],[18.69,19.43],[18.95,19.19],[19.19,18.95],[19.43,18.69],[19.66,18.43],[19.88,18.16],[20.09,17.88],[20.29,17.59],[20.48,17.3],[20.66,17],[20.83,16.69],[20.99,16.38],[21.14,16.07],[21.27,15.75],[21.4,15.42],[21.51,15.09],[21.61,14.76],[21.7,14.42],[21.78,14.08],[21.85,13.74],[21.9,13.39],[21.95,13.05],[21.98,12.7],[21.99,12.35],[22,12],[21.99,11.65],[21.98,11.3],[21.95,10.95],[21.9,10.61],[21.85,10.26],[21.78,9.92],[21.7,9.58],[21.61,9.24],[21.51,8.91],[21.4,8.58],[21.27,8.25],[21.14,7.93],[20.99,7.62],[20.83,7.31],[20.66,7],[20.48,6.7],[20.29,6.41],[20.09,6.12],[19.88,5.84],[19.66,5.57],[19.43,5.31],[19.19,5.05],[18.95,4.81],[18.69,4.57],[18.43,4.34],[18.16,4.12],[17.88,3.91],[17.59,3.71],[17.3,3.52],[17,3.34],[16.69,3.17],[16.38,3.01],[16.07,2.86],[15.75,2.73],[15.42,2.6],[15.09,2.49],[14.76,2.39],[14.42,2.3],[14.08,2.22],[13.74,2.15],[13.39,2.1],[13.05,2.05],[12.7,2.02],[12.35,2.01],[12,2],[11.65,2.01],[11.3,2.02],[10.95,2.05],[10.61,2.1],[10.26,2.15],[9.92,2.22],[9.58,2.3],[9.24,2.39],[8.91,2.49],[8.58,2.6],[8.25,2.73],[7.93,2.86],[7.62,3.01],[7.31,3.17],[7,3.34],[6.7,3.52],[6.41,3.71],[6.12,3.91],[5.84,4.12],[5.57,4.34],[5.31,4.57],[5.05,4.81],[4.81,5.05],[4.57,5.31],[4.34,5.57],[4.12,5.84],[3.91,6.12],[3.71,6.41],[3.52,6.7],[3.34,7],[3.17,7.31],[3.01,7.62],[2.86,7.93],[2.73,8.25],[2.6,8.58],[2.49,8.91],[2.39,9.24],[2.3,9.58],[2.22,9.92],[2.15,10.26],[2.1,10.61],[2.05,10.95],[2.02,11.3],[2.01,11.65],[2,12]],[[15,9],[9,15]],[[9,9],[15,15]]]],
    ["quality_check", [[[20,6],[9,17],[4,12]]]],
    ["quality_x", [[[18,6],[6,18]],[[6,6],[18,18]]]],
    ["quality_badge-check", [[[3.85,8.62],[3.79,8.28],[3.76,7.93],[3.76,7.58],[3.79,7.23],[3.85,6.89],[3.94,6.55],[4.06,6.22],[4.21,5.9],[4.38,5.6],[4.58,5.32],[4.81,5.05],[5.06,4.8],[5.32,4.58],[5.61,4.38],[5.91,4.2],[6.23,4.06],[6.56,3.94],[6.9,3.85],[7.24,3.79],[7.59,3.76],[7.94,3.76],[8.29,3.79],[8.63,3.85],[8.83,3.56],[9.05,3.3],[9.3,3.05],[9.57,2.83],[9.85,2.63],[10.16,2.46],[10.47,2.31],[10.8,2.19],[11.14,2.1],[11.48,2.04],[11.83,2.01],[12.17,2.01],[12.52,2.04],[12.86,2.1],[13.2,2.19],[13.53,2.31],[13.84,2.46],[14.15,2.63],[14.43,2.83],[14.7,3.05],[14.95,3.3],[15.17,3.56],[15.37,3.85],[15.7,3.79],[16.03,3.76],[16.37,3.75],[16.7,3.78],[17.04,3.83],[17.36,3.91],[17.68,4.02],[17.99,4.15],[18.28,4.31],[18.56,4.49],[18.83,4.7],[19.08,4.92],[19.3,5.17],[19.51,5.44],[19.69,5.72],[19.85,6.01],[19.98,6.32],[20.09,6.64],[20.17,6.96],[20.22,7.3],[20.25,7.63],[20.24,7.97],[20.21,8.3],[20.15,8.63],[20.44,8.83],[20.7,9.05],[20.95,9.3],[21.17,9.57],[21.37,9.85],[21.54,10.16],[21.69,10.47],[21.81,10.8],[21.9,11.14],[21.96,11.48],[21.99,11.83],[21.99,12.17],[21.96,12.52],[21.9,12.86],[21.81,13.2],[21.69,13.53],[21.54,13.84],[21.37,14.15],[21.17,14.43],[20.95,14.7],[20.7,14.95],[20.44,15.17],[20.15,15.37],[20.21,15.71],[20.24,16.06],[20.24,16.41],[20.21,16.76],[20.15,17.1],[20.06,17.44],[19.94,17.77],[19.8,18.09],[19.62,18.39],[19.42,18.68],[19.2,18.94],[18.95,19.19],[18.68,19.42],[18.4,19.62],[18.1,19.79],[17.78,19.94],[17.45,20.06],[17.11,20.15],[16.77,20.21],[16.42,20.24],[16.07,20.24],[15.72,20.21],[15.38,20.15],[15.18,20.44],[14.96,20.7],[14.71,20.95],[14.44,21.18],[14.16,21.38],[13.85,21.55],[13.54,21.7],[13.21,21.82],[12.87,21.91],[12.53,21.97],[12.18,22],[11.83,22],[11.48,21.97],[11.14,21.91],[10.8,21.82],[10.47,21.7],[10.16,21.55],[9.85,21.38],[9.57,21.18],[9.3,20.95],[9.05,20.7],[8.83,20.44],[8.63,20.15],[8.29,20.21],[7.94,20.24],[7.59,20.24],[7.24,20.21],[6.9,20.15],[6.56,20.06],[6.23,19.94],[5.91,19.8],[5.61,19.62],[5.32,19.42],[5.06,19.2],[4.81,18.95],[4.58,18.68],[4.38,18.4],[4.21,18.1],[4.06,17.78],[3.94,17.45],[3.85,17.11],[3.79,16.77],[3.76,16.42],[3.76,16.07],[3.79,15.72],[3.85,15.38],[3.57,15.19],[3.32,14.98],[3.08,14.74],[2.86,14.49],[2.66,14.22],[2.49,13.93],[2.34,13.63],[2.21,13.32],[2.12,13],[2.05,12.67],[2,12.34],[1.99,12],[2,11.66],[2.05,11.33],[2.12,11],[2.21,10.68],[2.34,10.37],[2.49,10.07],[2.66,9.78],[2.86,9.51],[3.08,9.26],[3.32,9.02],[3.57,8.81],[3.85,8.62]],[[16,9],[10.5,14.5],[8,12]]]],
    ["quality_clipboard-check", [[[9,2],[15,2],[15.31,2.05],[15.59,2.19],[15.81,2.41],[15.95,2.69],[16,3],[16,5],[15.95,5.31],[15.81,5.59],[15.59,5.81],[15.31,5.95],[15,6],[9,6],[8.69,5.95],[8.41,5.81],[8.19,5.59],[8.05,5.31],[8,5],[8,3],[8.05,2.69],[8.19,2.41],[8.41,2.19],[8.69,2.05],[9,2]],[[16,4],[18,4],[18.35,4.03],[18.68,4.12],[19,4.27],[19.29,4.47],[19.53,4.71],[19.73,5],[19.88,5.32],[19.97,5.65],[20,6],[20,20],[19.97,20.35],[19.88,20.68],[19.73,21],[19.53,21.29],[19.29,21.53],[19,21.73],[18.68,21.88],[18.35,21.97],[18,22],[6,22],[5.65,21.97],[5.32,21.88],[5,21.73],[4.71,21.53],[4.47,21.29],[4.27,21],[4.12,20.68],[4.03,20.35],[4,20],[4,6],[4.03,5.65],[4.12,5.32],[4.27,5],[4.47,4.71],[4.71,4.47],[5,4.27],[5.32,4.12],[5.65,4.03],[6,4],[8,4]],[[9,14],[11,16],[15,12]]]],
    ["quality_clipboard-list", [[[9,2],[15,2],[15.31,2.05],[15.59,2.19],[15.81,2.41],[15.95,2.69],[16,3],[16,5],[15.95,5.31],[15.81,5.59],[15.59,5.81],[15.31,5.95],[15,6],[9,6],[8.69,5.95],[8.41,5.81],[8.19,5.59],[8.05,5.31],[8,5],[8,3],[8.05,2.69],[8.19,2.41],[8.41,2.19],[8.69,2.05],[9,2]],[[16,4],[18,4],[18.35,4.03],[18.68,4.12],[19,4.27],[19.29,4.47],[19.53,4.71],[19.73,5],[19.88,5.32],[19.97,5.65],[20,6],[20,20],[19.97,20.35],[19.88,20.68],[19.73,21],[19.53,21.29],[19.29,21.53],[19,21.73],[18.68,21.88],[18.35,21.97],[18,22],[6,22],[5.65,21.97],[5.32,21.88],[5,21.73],[4.71,21.53],[4.47,21.29],[4.27,21],[4.12,20.68],[4.03,20.35],[4,20],[4,6],[4.03,5.65],[4.12,5.32],[4.27,5],[4.47,4.71],[4.71,4.47],[5,4.27],[5.32,4.12],[5.65,4.03],[6,4],[8,4]],[[12,11],[16,11]],[[12,16],[16,16]],[[8,11],[8.01,11]],[[8,16],[8.01,16]]]],
    ["quality_list-checks", [[[13,5],[21,5]],[[13,12],[21,12]],[[13,19],[21,19]],[[3,17],[5,19],[9,15]],[[3,7],[5,9],[9,5]]]],
    ["quality_search", [[[21,21],[16.66,16.66]],[[3,11],[3.01,11.35],[3.03,11.7],[3.07,12.04],[3.12,12.39],[3.19,12.73],[3.27,13.07],[3.37,13.41],[3.48,13.74],[3.61,14.06],[3.75,14.38],[3.9,14.69],[4.07,15],[4.25,15.3],[4.45,15.59],[4.65,15.87],[4.87,16.14],[5.1,16.4],[5.34,16.66],[5.6,16.9],[5.86,17.13],[6.13,17.35],[6.41,17.55],[6.7,17.75],[7,17.93],[7.31,18.1],[7.62,18.25],[7.94,18.39],[8.26,18.52],[8.59,18.63],[8.93,18.73],[9.27,18.81],[9.61,18.88],[9.96,18.93],[10.3,18.97],[10.65,18.99],[11,19],[11.35,18.99],[11.7,18.97],[12.04,18.93],[12.39,18.88],[12.73,18.81],[13.07,18.73],[13.41,18.63],[13.74,18.52],[14.06,18.39],[14.38,18.25],[14.69,18.1],[15,17.93],[15.3,17.75],[15.59,17.55],[15.87,17.35],[16.14,17.13],[16.4,16.9],[16.66,16.66],[16.9,16.4],[17.13,16.14],[17.35,15.87],[17.55,15.59],[17.75,15.3],[17.93,15],[18.1,14.69],[18.25,14.38],[18.39,14.06],[18.52,13.74],[18.63,13.41],[18.73,13.07],[18.81,12.73],[18.88,12.39],[18.93,12.04],[18.97,11.7],[18.99,11.35],[19,11],[18.99,10.65],[18.97,10.3],[18.93,9.96],[18.88,9.61],[18.81,9.27],[18.73,8.93],[18.63,8.59],[18.52,8.26],[18.39,7.94],[18.25,7.62],[18.1,7.31],[17.93,7],[17.75,6.7],[17.55,6.41],[17.35,6.13],[17.13,5.86],[16.9,5.6],[16.66,5.34],[16.4,5.1],[16.14,4.87],[15.87,4.65],[15.59,4.45],[15.3,4.25],[15,4.07],[14.69,3.9],[14.38,3.75],[14.06,3.61],[13.74,3.48],[13.41,3.37],[13.07,3.27],[12.73,3.19],[12.39,3.12],[12.04,3.07],[11.7,3.03],[11.35,3.01],[11,3],[10.65,3.01],[10.3,3.03],[9.96,3.07],[9.61,3.12],[9.27,3.19],[8.93,3.27],[8.59,3.37],[8.26,3.48],[7.94,3.61],[7.62,3.75],[7.31,3.9],[7,4.07],[6.7,4.25],[6.41,4.45],[6.13,4.65],[5.86,4.87],[5.6,5.1],[5.34,5.34],[5.1,5.6],[4.87,5.86],[4.65,6.13],[4.45,6.41],[4.25,6.7],[4.07,7],[3.9,7.31],[3.75,7.62],[3.61,7.94],[3.48,8.26],[3.37,8.59],[3.27,8.93],[3.19,9.27],[3.12,9.61],[3.07,9.96],[3.03,10.3],[3.01,10.65],[3,11]]]],
    ["quality_scan-search", [[[3,7],[3,5],[3.03,4.65],[3.12,4.32],[3.27,4],[3.47,3.71],[3.71,3.47],[4,3.27],[4.32,3.12],[4.65,3.03],[5,3],[7,3]],[[17,3],[19,3],[19.35,3.03],[19.68,3.12],[20,3.27],[20.29,3.47],[20.53,3.71],[20.73,4],[20.88,4.32],[20.97,4.65],[21,5],[21,7]],[[21,17],[21,19],[20.97,19.35],[20.88,19.68],[20.73,20],[20.53,20.29],[20.29,20.53],[20,20.73],[19.68,20.88],[19.35,20.97],[19,21],[17,21]],[[7,21],[5,21],[4.65,20.97],[4.32,20.88],[4,20.73],[3.71,20.53],[3.47,20.29],[3.27,20],[3.12,19.68],[3.03,19.35],[3,19],[3,17]],[[9,12],[9.02,12.35],[9.08,12.69],[9.18,13.03],[9.32,13.35],[9.49,13.65],[9.7,13.93],[9.94,14.18],[10.21,14.41],[10.5,14.6],[10.81,14.75],[11.14,14.87],[11.48,14.95],[11.83,14.99],[12.17,14.99],[12.52,14.95],[12.86,14.87],[13.19,14.75],[13.5,14.6],[13.79,14.41],[14.06,14.18],[14.3,13.93],[14.51,13.65],[14.68,13.35],[14.82,13.03],[14.92,12.69],[14.98,12.35],[15,12],[14.98,11.65],[14.92,11.31],[14.82,10.97],[14.68,10.65],[14.51,10.35],[14.3,10.07],[14.06,9.82],[13.79,9.59],[13.5,9.4],[13.19,9.25],[12.86,9.13],[12.52,9.05],[12.17,9.01],[11.83,9.01],[11.48,9.05],[11.14,9.13],[10.81,9.25],[10.5,9.4],[10.21,9.59],[9.94,9.82],[9.7,10.07],[9.49,10.35],[9.32,10.65],[9.18,10.97],[9.08,11.31],[9.02,11.65],[9,12]],[[16,16],[14.1,14.1]]]],
    ["quality_microscope", [[[6,18],[14,18]],[[3,22],[21,22]],[[14,22],[14.35,21.99],[14.7,21.97],[15.04,21.92],[15.39,21.86],[15.73,21.78],[16.06,21.69],[16.39,21.58],[16.72,21.45],[17.04,21.31],[17.35,21.15],[17.65,20.97],[17.94,20.78],[18.23,20.58],[18.5,20.36],[18.76,20.13],[19.01,19.89],[19.25,19.63],[19.47,19.36],[19.68,19.09],[19.88,18.8],[20.06,18.5],[20.23,18.19],[20.38,17.88],[20.52,17.56],[20.64,17.23],[20.74,16.9],[20.82,16.56],[20.89,16.22],[20.95,15.87],[20.98,15.52],[21,15.17],[21,14.83],[20.98,14.48],[20.95,14.13],[20.89,13.78],[20.82,13.44],[20.74,13.1],[20.64,12.77],[20.52,12.44],[20.38,12.12],[20.23,11.81],[20.06,11.5],[19.88,11.2],[19.68,10.91],[19.47,10.64],[19.25,10.37],[19.01,10.11],[18.76,9.87],[18.5,9.64],[18.23,9.42],[17.94,9.22],[17.65,9.03],[17.35,8.85],[17.04,8.69],[16.72,8.55],[16.39,8.42],[16.06,8.31],[15.73,8.22],[15.39,8.14],[15.04,8.08],[14.7,8.03],[14.35,8.01],[14,8],[13,8]],[[9,14],[11,14]],[[9,12],[8.65,11.97],[8.32,11.88],[8,11.73],[7.71,11.53],[7.47,11.29],[7.27,11],[7.12,10.68],[7.03,10.35],[7,10],[7,6],[13,6],[13,10],[12.97,10.35],[12.88,10.68],[12.73,11],[12.53,11.29],[12.29,11.53],[12,11.73],[11.68,11.88],[11.35,11.97],[11,12],[9,12]],[[12,6],[12,3],[11.95,2.69],[11.81,2.41],[11.59,2.19],[11.31,2.05],[11,2],[9,2],[8.69,2.05],[8.41,2.19],[8.19,2.41],[8.05,2.69],[8,3],[8,6]]]],
    ["quality_gauge", [[[12,14],[16,10]],[[3.34,19],[3.17,18.69],[3.01,18.38],[2.86,18.07],[2.73,17.75],[2.6,17.42],[2.49,17.09],[2.39,16.76],[2.3,16.42],[2.22,16.08],[2.15,15.74],[2.1,15.39],[2.05,15.05],[2.02,14.7],[2.01,14.35],[2,14],[2.01,13.65],[2.02,13.3],[2.05,12.95],[2.1,12.61],[2.15,12.26],[2.22,11.92],[2.3,11.58],[2.39,11.24],[2.49,10.91],[2.6,10.58],[2.73,10.25],[2.86,9.93],[3.01,9.62],[3.17,9.31],[3.34,9],[3.52,8.7],[3.71,8.41],[3.91,8.12],[4.12,7.84],[4.34,7.57],[4.57,7.31],[4.81,7.05],[5.05,6.81],[5.31,6.57],[5.57,6.34],[5.84,6.12],[6.12,5.91],[6.41,5.71],[6.7,5.52],[7,5.34],[7.31,5.17],[7.62,5.01],[7.93,4.86],[8.25,4.73],[8.58,4.6],[8.91,4.49],[9.24,4.39],[9.58,4.3],[9.92,4.22],[10.26,4.15],[10.61,4.1],[10.95,4.05],[11.3,4.02],[11.65,4.01],[12,4],[12.35,4.01],[12.7,4.02],[13.05,4.05],[13.39,4.1],[13.74,4.15],[14.08,4.22],[14.42,4.3],[14.76,4.39],[15.09,4.49],[15.42,4.6],[15.75,4.73],[16.07,4.86],[16.38,5.01],[16.69,5.17],[17,5.34],[17.3,5.52],[17.59,5.71],[17.88,5.91],[18.16,6.12],[18.43,6.34],[18.69,6.57],[18.95,6.81],[19.19,7.05],[19.43,7.31],[19.66,7.57],[19.88,7.84],[20.09,8.12],[20.29,8.41],[20.48,8.7],[20.66,9],[20.83,9.31],[20.99,9.62],[21.14,9.93],[21.27,10.25],[21.4,10.58],[21.51,10.91],[21.61,11.24],[21.7,11.58],[21.78,11.92],[21.85,12.26],[21.9,12.61],[21.95,12.95],[21.98,13.3],[21.99,13.65],[22,14],[21.99,14.35],[21.98,14.7],[21.95,15.05],[21.9,15.39],[21.85,15.74],[21.78,16.08],[21.7,16.42],[21.61,16.76],[21.51,17.09],[21.4,17.42],[21.27,17.75],[21.14,18.07],[20.99,18.38],[20.83,18.69],[20.66,19]]]],
    ["quality_ruler", [[[21.3,15.3],[21.53,15.56],[21.71,15.85],[21.85,16.16],[21.95,16.49],[22,16.83],[22,17.17],[21.95,17.51],[21.85,17.84],[21.71,18.15],[21.53,18.44],[21.3,18.7],[18.7,21.3],[18.44,21.53],[18.15,21.71],[17.84,21.85],[17.51,21.95],[17.17,22],[16.83,22],[16.49,21.95],[16.16,21.85],[15.85,21.71],[15.56,21.53],[15.3,21.3],[2.7,8.7],[2.48,8.44],[2.29,8.15],[2.15,7.84],[2.05,7.51],[2,7.17],[2,6.83],[2.05,6.49],[2.15,6.16],[2.29,5.85],[2.48,5.56],[2.7,5.3],[5.3,2.7],[5.56,2.48],[5.85,2.29],[6.16,2.15],[6.49,2.05],[6.83,2],[7.17,2],[7.51,2.05],[7.84,2.15],[8.15,2.29],[8.44,2.48],[8.7,2.7],[21.3,15.3]],[[14.5,12.5],[16.5,10.5]],[[11.5,9.5],[13.5,7.5]],[[8.5,6.5],[10.5,4.5]],[[17.5,15.5],[19.5,13.5]]]],
    ["quality_scale", [[[12,3],[12,21]],[[19,8],[22,16],[21.72,16.19],[21.43,16.37],[21.13,16.52],[20.82,16.66],[20.5,16.77],[20.17,16.86],[19.84,16.93],[19.51,16.97],[19.17,17],[18.83,17],[18.49,16.97],[18.16,16.93],[17.83,16.86],[17.5,16.77],[17.18,16.66],[16.87,16.52],[16.57,16.37],[16.28,16.19],[16,16],[19,8]],[[19,8],[19,7]],[[3,7],[4,7],[4.35,7],[4.69,6.99],[5.04,6.97],[5.39,6.94],[5.73,6.91],[6.08,6.87],[6.42,6.83],[6.76,6.77],[7.11,6.71],[7.45,6.65],[7.79,6.57],[8.12,6.49],[8.46,6.4],[8.79,6.31],[9.12,6.21],[9.45,6.1],[9.78,5.99],[10.11,5.87],[10.43,5.74],[10.75,5.6],[11.07,5.46],[11.38,5.31],[11.69,5.16],[12,5],[12.31,5.16],[12.62,5.31],[12.93,5.46],[13.25,5.6],[13.57,5.74],[13.89,5.87],[14.22,5.99],[14.55,6.1],[14.88,6.21],[15.21,6.31],[15.54,6.4],[15.88,6.49],[16.21,6.57],[16.55,6.65],[16.89,6.71],[17.24,6.77],[17.58,6.83],[17.92,6.87],[18.27,6.91],[18.61,6.94],[18.96,6.97],[19.31,6.99],[19.65,7],[20,7],[21,7]],[[5,8],[8,16],[7.72,16.19],[7.43,16.37],[7.13,16.52],[6.82,16.66],[6.5,16.77],[6.17,16.86],[5.84,16.93],[5.51,16.97],[5.17,17],[4.83,17],[4.49,16.97],[4.16,16.93],[3.83,16.86],[3.5,16.77],[3.18,16.66],[2.87,16.52],[2.57,16.37],[2.28,16.19],[2,16],[5,8]],[[5,8],[5,7]],[[7,21],[17,21]]]],
    ["quality_thermometer", [[[14,4],[14,14.54],[14.29,14.73],[14.57,14.94],[14.83,15.18],[15.06,15.43],[15.28,15.71],[15.46,16],[15.63,16.31],[15.76,16.64],[15.86,16.97],[15.94,17.31],[15.98,17.66],[16,18],[15.98,18.35],[15.94,18.7],[15.86,19.04],[15.76,19.37],[15.63,19.69],[15.46,20],[15.28,20.3],[15.06,20.58],[14.83,20.83],[14.57,21.07],[14.29,21.28],[14,21.47],[13.69,21.63],[13.37,21.76],[13.04,21.87],[12.69,21.94],[12.35,21.99],[12,22],[11.65,21.99],[11.31,21.94],[10.96,21.87],[10.63,21.76],[10.31,21.63],[10,21.47],[9.71,21.28],[9.43,21.07],[9.17,20.83],[8.94,20.58],[8.72,20.3],[8.54,20],[8.37,19.69],[8.24,19.37],[8.14,19.04],[8.06,18.7],[8.02,18.35],[8,18],[8.02,17.66],[8.06,17.31],[8.14,16.97],[8.24,16.64],[8.37,16.31],[8.54,16],[8.72,15.71],[8.94,15.43],[9.17,15.18],[9.43,14.94],[9.71,14.73],[10,14.54],[10,4],[10.03,3.65],[10.12,3.32],[10.27,3],[10.47,2.71],[10.71,2.47],[11,2.27],[11.32,2.12],[11.65,2.03],[12,2],[12.35,2.03],[12.68,2.12],[13,2.27],[13.29,2.47],[13.53,2.71],[13.73,3],[13.88,3.32],[13.97,3.65],[14,4]]]],
    ["quality_target", [[[2,12],[2.01,12.35],[2.02,12.7],[2.05,13.05],[2.1,13.39],[2.15,13.74],[2.22,14.08],[2.3,14.42],[2.39,14.76],[2.49,15.09],[2.6,15.42],[2.73,15.75],[2.86,16.07],[3.01,16.38],[3.17,16.69],[3.34,17],[3.52,17.3],[3.71,17.59],[3.91,17.88],[4.12,18.16],[4.34,18.43],[4.57,18.69],[4.81,18.95],[5.05,19.19],[5.31,19.43],[5.57,19.66],[5.84,19.88],[6.12,20.09],[6.41,20.29],[6.7,20.48],[7,20.66],[7.31,20.83],[7.62,20.99],[7.93,21.14],[8.25,21.27],[8.58,21.4],[8.91,21.51],[9.24,21.61],[9.58,21.7],[9.92,21.78],[10.26,21.85],[10.61,21.9],[10.95,21.95],[11.3,21.98],[11.65,21.99],[12,22],[12.35,21.99],[12.7,21.98],[13.05,21.95],[13.39,21.9],[13.74,21.85],[14.08,21.78],[14.42,21.7],[14.76,21.61],[15.09,21.51],[15.42,21.4],[15.75,21.27],[16.07,21.14],[16.38,20.99],[16.69,20.83],[17,20.66],[17.3,20.48],[17.59,20.29],[17.88,20.09],[18.16,19.88],[18.43,19.66],[18.69,19.43],[18.95,19.19],[19.19,18.95],[19.43,18.69],[19.66,18.43],[19.88,18.16],[20.09,17.88],[20.29,17.59],[20.48,17.3],[20.66,17],[20.83,16.69],[20.99,16.38],[21.14,16.07],[21.27,15.75],[21.4,15.42],[21.51,15.09],[21.61,14.76],[21.7,14.42],[21.78,14.08],[21.85,13.74],[21.9,13.39],[21.95,13.05],[21.98,12.7],[21.99,12.35],[22,12],[21.99,11.65],[21.98,11.3],[21.95,10.95],[21.9,10.61],[21.85,10.26],[21.78,9.92],[21.7,9.58],[21.61,9.24],[21.51,8.91],[21.4,8.58],[21.27,8.25],[21.14,7.93],[20.99,7.62],[20.83,7.31],[20.66,7],[20.48,6.7],[20.29,6.41],[20.09,6.12],[19.88,5.84],[19.66,5.57],[19.43,5.31],[19.19,5.05],[18.95,4.81],[18.69,4.57],[18.43,4.34],[18.16,4.12],[17.88,3.91],[17.59,3.71],[17.3,3.52],[17,3.34],[16.69,3.17],[16.38,3.01],[16.07,2.86],[15.75,2.73],[15.42,2.6],[15.09,2.49],[14.76,2.39],[14.42,2.3],[14.08,2.22],[13.74,2.15],[13.39,2.1],[13.05,2.05],[12.7,2.02],[12.35,2.01],[12,2],[11.65,2.01],[11.3,2.02],[10.95,2.05],[10.61,2.1],[10.26,2.15],[9.92,2.22],[9.58,2.3],[9.24,2.39],[8.91,2.49],[8.58,2.6],[8.25,2.73],[7.93,2.86],[7.62,3.01],[7.31,3.17],[7,3.34],[6.7,3.52],[6.41,3.71],[6.12,3.91],[5.84,4.12],[5.57,4.34],[5.31,4.57],[5.05,4.81],[4.81,5.05],[4.57,5.31],[4.34,5.57],[4.12,5.84],[3.91,6.12],[3.71,6.41],[3.52,6.7],[3.34,7],[3.17,7.31],[3.01,7.62],[2.86,7.93],[2.73,8.25],[2.6,8.58],[2.49,8.91],[2.39,9.24],[2.3,9.58],[2.22,9.92],[2.15,10.26],[2.1,10.61],[2.05,10.95],[2.02,11.3],[2.01,11.65],[2,12]],[[6,12],[6.01,12.35],[6.04,12.7],[6.09,13.04],[6.16,13.38],[6.25,13.72],[6.36,14.05],[6.49,14.38],[6.64,14.69],[6.8,15],[6.99,15.3],[7.19,15.58],[7.4,15.86],[7.64,16.12],[7.88,16.36],[8.14,16.6],[8.42,16.81],[8.7,17.01],[9,17.2],[9.31,17.36],[9.62,17.51],[9.95,17.64],[10.28,17.75],[10.62,17.84],[10.96,17.91],[11.3,17.96],[11.65,17.99],[12,18],[12.35,17.99],[12.7,17.96],[13.04,17.91],[13.38,17.84],[13.72,17.75],[14.05,17.64],[14.38,17.51],[14.69,17.36],[15,17.2],[15.3,17.01],[15.58,16.81],[15.86,16.6],[16.12,16.36],[16.36,16.12],[16.6,15.86],[16.81,15.58],[17.01,15.3],[17.2,15],[17.36,14.69],[17.51,14.38],[17.64,14.05],[17.75,13.72],[17.84,13.38],[17.91,13.04],[17.96,12.7],[17.99,12.35],[18,12],[17.99,11.65],[17.96,11.3],[17.91,10.96],[17.84,10.62],[17.75,10.28],[17.64,9.95],[17.51,9.62],[17.36,9.31],[17.2,9],[17.01,8.7],[16.81,8.42],[16.6,8.14],[16.36,7.88],[16.12,7.64],[15.86,7.4],[15.58,7.19],[15.3,6.99],[15,6.8],[14.69,6.64],[14.38,6.49],[14.05,6.36],[13.72,6.25],[13.38,6.16],[13.04,6.09],[12.7,6.04],[12.35,6.01],[12,6],[11.65,6.01],[11.3,6.04],[10.96,6.09],[10.62,6.16],[10.28,6.25],[9.95,6.36],[9.62,6.49],[9.31,6.64],[9,6.8],[8.7,6.99],[8.42,7.19],[8.14,7.4],[7.88,7.64],[7.64,7.88],[7.4,8.14],[7.19,8.42],[6.99,8.7],[6.8,9],[6.64,9.31],[6.49,9.62],[6.36,9.95],[6.25,10.28],[6.16,10.62],[6.09,10.96],[6.04,11.3],[6.01,11.65],[6,12]],[[10,12],[10.03,12.35],[10.12,12.68],[10.27,13],[10.47,13.29],[10.71,13.53],[11,13.73],[11.32,13.88],[11.65,13.97],[12,14],[12.35,13.97],[12.68,13.88],[13,13.73],[13.29,13.53],[13.53,13.29],[13.73,13],[13.88,12.68],[13.97,12.35],[14,12],[13.97,11.65],[13.88,11.32],[13.73,11],[13.53,10.71],[13.29,10.47],[13,10.27],[12.68,10.12],[12.35,10.03],[12,10],[11.65,10.03],[11.32,10.12],[11,10.27],[10.71,10.47],[10.47,10.71],[10.27,11],[10.12,11.32],[10.03,11.65],[10,12]]]],
    ["quality_flag", [[[4,22],[4,4],[4.05,3.7],[4.19,3.42],[4.4,3.2],[4.66,3.01],[4.93,2.84],[5.22,2.69],[5.5,2.54],[5.8,2.42],[6.1,2.31],[6.41,2.21],[6.72,2.14],[7.04,2.08],[7.36,2.03],[7.68,2.01],[8,2],[8.37,2.01],[8.73,2.04],[9.08,2.09],[9.42,2.15],[9.76,2.22],[10.08,2.31],[10.4,2.41],[10.72,2.52],[11.02,2.63],[11.33,2.75],[11.62,2.88],[11.92,3],[12.21,3.12],[12.49,3.25],[12.78,3.37],[13.06,3.48],[13.34,3.59],[13.62,3.69],[13.91,3.78],[14.19,3.85],[14.47,3.91],[14.76,3.96],[15.04,3.99],[15.33,4],[15.72,3.99],[16.1,3.97],[16.45,3.93],[16.78,3.87],[17.1,3.8],[17.4,3.71],[17.68,3.61],[17.94,3.49],[18.18,3.35],[18.4,3.2],[18.68,3.05],[18.99,3],[19.3,3.05],[19.58,3.19],[19.81,3.41],[19.95,3.69],[20,4],[20,14],[19.95,14.3],[19.81,14.58],[19.6,14.8],[19.34,14.99],[19.07,15.16],[18.78,15.31],[18.5,15.46],[18.2,15.58],[17.9,15.69],[17.59,15.79],[17.28,15.86],[16.96,15.92],[16.64,15.97],[16.32,15.99],[16,16],[15.66,15.99],[15.32,15.97],[15,15.93],[14.68,15.87],[14.37,15.81],[14.06,15.73],[13.76,15.64],[13.46,15.55],[13.16,15.45],[12.87,15.34],[12.58,15.23],[12.29,15.12],[12,15],[11.71,14.88],[11.42,14.77],[11.13,14.66],[10.84,14.55],[10.54,14.45],[10.24,14.36],[9.94,14.27],[9.63,14.19],[9.32,14.13],[9,14.07],[8.68,14.03],[8.34,14.01],[8,14],[7.66,14.01],[7.33,14.04],[6.99,14.08],[6.66,14.15],[6.34,14.23],[6.02,14.34],[5.7,14.46],[5.4,14.59],[5.1,14.75],[4.81,14.92],[4.53,15.11],[4.26,15.31],[4,15.53]]]],
    ["quality_chart-column", [[[3,3],[3,19],[3.03,19.35],[3.12,19.68],[3.27,20],[3.47,20.29],[3.71,20.53],[4,20.73],[4.32,20.88],[4.65,20.97],[5,21],[21,21]],[[18,17],[18,9]],[[13,17],[13,5]],[[8,17],[8,14]]]],
    ["quality_chart-line", [[[3,3],[3,19],[3.03,19.35],[3.12,19.68],[3.27,20],[3.47,20.29],[3.71,20.53],[4,20.73],[4.32,20.88],[4.65,20.97],[5,21],[21,21]],[[19,9],[14,14],[10,10],[7,13]]]],
    ["quality_trending-up", [[[16,7],[22,7],[22,13]],[[22,7],[13.5,15.5],[8.5,10.5],[2,17]]]],
    ["quality_trending-down", [[[16,17],[22,17],[22,11]],[[22,17],[13.5,8.5],[8.5,13.5],[2,7]]]],
    ["inventory_package", [[[11,21.73],[11.32,21.88],[11.65,21.97],[12,22],[12.35,21.97],[12.68,21.88],[13,21.73],[20,17.73],[20.29,17.53],[20.53,17.28],[20.73,17],[20.88,16.68],[20.97,16.35],[21,16],[21,8],[20.97,7.65],[20.88,7.32],[20.73,7],[20.53,6.72],[20.29,6.47],[20,6.27],[13,2.27],[12.68,2.12],[12.35,2.03],[12,2],[11.65,2.03],[11.32,2.12],[11,2.27],[4,6.27],[3.71,6.47],[3.47,6.72],[3.27,7],[3.12,7.32],[3.03,7.65],[3,8],[3,16],[3.03,16.35],[3.12,16.68],[3.27,17],[3.47,17.28],[3.71,17.53],[4,17.73],[11,21.73]],[[12,22],[12,12]],[[3.29,7],[12,12],[20.71,7]],[[7.5,4.27],[16.5,9.42]]]],
    ["inventory_package-check", [[[12,22],[12,12]],[[16,17],[18,19],[22,15]],[[21,11.13],[21,8],[20.97,7.65],[20.88,7.32],[20.73,7],[20.53,6.72],[20.29,6.47],[20,6.27],[13,2.27],[12.68,2.12],[12.35,2.03],[12,2],[11.65,2.03],[11.32,2.12],[11,2.27],[4,6.27],[3.71,6.47],[3.47,6.72],[3.27,7],[3.12,7.32],[3.03,7.65],[3,8],[3,16],[3.03,16.35],[3.12,16.68],[3.27,17],[3.47,17.28],[3.71,17.53],[4,17.73],[11,21.73],[11.32,21.88],[11.65,21.97],[12,22],[12.35,21.97],[12.68,21.88],[13,21.73],[14.32,20.98]],[[3.29,7],[12,12],[20.71,7]],[[7.5,4.27],[16.5,9.42]]]],
    ["inventory_package-x", [[[12,22],[12,12]],[[16.5,14.5],[21.5,19.5]],[[16.5,19.5],[21.5,14.5]],[[21,10.5],[21,8],[20.97,7.65],[20.88,7.32],[20.73,7],[20.53,6.72],[20.29,6.47],[20,6.27],[13,2.27],[12.68,2.12],[12.35,2.03],[12,2],[11.65,2.03],[11.32,2.12],[11,2.27],[4,6.27],[3.71,6.47],[3.47,6.72],[3.27,7],[3.12,7.32],[3.03,7.65],[3,8],[3,16],[3.03,16.35],[3.12,16.68],[3.27,17],[3.47,17.28],[3.71,17.53],[4,17.73],[11,21.73],[11.32,21.88],[11.65,21.97],[12,22],[12.35,21.97],[12.68,21.88],[13,21.73],[13.13,21.66]],[[3.29,7],[12,12],[20.71,7]],[[7.5,4.27],[16.5,9.42]]]],
    ["inventory_package-open", [[[12,22],[12,13]],[[15.17,2.21],[15.48,2.08],[15.82,2.01],[16.15,2.01],[16.49,2.08],[16.8,2.21],[21,4.57],[21.28,4.76],[21.52,5],[21.72,5.28],[21.86,5.58],[21.95,5.91],[21.98,6.25],[21.95,6.59],[21.86,6.92],[21.72,7.22],[21.52,7.5],[21.28,7.74],[21,7.93],[8.82,14.79],[8.51,14.93],[8.17,15],[7.83,15],[7.49,14.93],[7.18,14.79],[3,12.43],[2.72,12.24],[2.48,12],[2.28,11.72],[2.14,11.42],[2.05,11.09],[2.02,10.75],[2.05,10.41],[2.14,10.08],[2.28,9.78],[2.48,9.5],[2.72,9.26],[3,9.07],[15.17,2.21]],[[20,13],[20,16.87],[19.98,17.19],[19.9,17.5],[19.78,17.8],[19.61,18.07],[19.41,18.32],[19.16,18.53],[18.89,18.7],[12.89,21.78],[12.61,21.9],[12.31,21.97],[12,22],[11.69,21.97],[11.39,21.9],[11.11,21.78],[5.11,18.7],[4.84,18.53],[4.59,18.32],[4.39,18.07],[4.22,17.8],[4.1,17.5],[4.02,17.19],[4,16.87],[4,13]],[[21,12.43],[21.28,12.24],[21.52,12],[21.72,11.72],[21.86,11.42],[21.95,11.09],[21.98,10.75],[21.95,10.41],[21.86,10.08],[21.72,9.78],[21.52,9.5],[21.28,9.26],[21,9.07],[8.83,2.2],[8.52,2.06],[8.19,1.99],[7.84,1.99],[7.51,2.06],[7.2,2.2],[3,4.57],[2.72,4.76],[2.48,5],[2.28,5.28],[2.14,5.58],[2.05,5.91],[2.02,6.25],[2.05,6.59],[2.14,6.92],[2.28,7.22],[2.48,7.5],[2.72,7.74],[3,7.93],[15.18,14.79],[15.49,14.93],[15.82,15],[16.17,15],[16.5,14.93],[16.81,14.79],[21,12.43]]]],
    ["inventory_boxes", [[[2.97,12.92],[2.69,13.12],[2.45,13.37],[2.26,13.65],[2.12,13.96],[2.03,14.29],[2,14.63],[2,17.87],[2.03,18.21],[2.12,18.54],[2.26,18.85],[2.45,19.13],[2.69,19.38],[2.97,19.58],[5.97,21.38],[6.25,21.52],[6.54,21.61],[6.85,21.66],[7.15,21.66],[7.46,21.61],[7.75,21.52],[8.03,21.38],[12,19],[12,13.5],[7,10.5],[2.97,12.92]],[[7,16.5],[2.26,13.65]],[[7,16.5],[12,13.5]],[[7,16.5],[7,21.67]],[[12,13.5],[12,19],[15.97,21.38],[16.25,21.52],[16.54,21.61],[16.85,21.66],[17.15,21.66],[17.46,21.61],[17.75,21.52],[18.03,21.38],[21.03,19.58],[21.31,19.38],[21.55,19.13],[21.74,18.85],[21.88,18.54],[21.97,18.21],[22,17.87],[22,14.63],[21.97,14.29],[21.88,13.96],[21.74,13.65],[21.55,13.37],[21.31,13.12],[21.03,12.92],[17,10.5],[12,13.5]],[[17,16.5],[12,13.5]],[[17,16.5],[21.74,13.65]],[[17,16.5],[17,21.67]],[[7.97,4.42],[7.69,4.62],[7.45,4.87],[7.26,5.15],[7.12,5.46],[7.03,5.79],[7,6.13],[7,10.5],[12,13.5],[17,10.5],[17,6.13],[16.97,5.79],[16.88,5.46],[16.74,5.15],[16.55,4.87],[16.31,4.62],[16.03,4.42],[13.03,2.62],[12.75,2.48],[12.46,2.39],[12.15,2.34],[11.85,2.34],[11.54,2.39],[11.25,2.48],[10.97,2.62],[7.97,4.42]],[[12,8],[7.26,5.15]],[[12,8],[16.74,5.15]],[[12,13.5],[12,8]]]],
    ["inventory_container", [[[22,7.7],[21.97,7.4],[21.88,7.11],[21.75,6.84],[21.59,6.59],[21.4,6.37],[21.2,6.2],[14.9,2.3],[14.63,2.18],[14.34,2.1],[14.05,2.08],[13.76,2.1],[13.47,2.18],[13.2,2.3],[2.9,8.3],[2.66,8.43],[2.44,8.62],[2.26,8.85],[2.12,9.11],[2.03,9.4],[2,9.7],[2,16.3],[2.03,16.56],[2.12,16.84],[2.25,17.12],[2.41,17.39],[2.6,17.62],[2.8,17.8],[9.1,21.7],[9.37,21.82],[9.66,21.9],[9.95,21.92],[10.24,21.9],[10.53,21.82],[10.8,21.7],[21.1,15.7],[21.34,15.52],[21.56,15.29],[21.74,15.02],[21.88,14.74],[21.97,14.46],[22,14.2],[22,7.7]],[[10,21.9],[10,14],[2.1,9.1]],[[10,14],[21.9,7.1]],[[14,19.8],[14,11.7]],[[18,17.5],[18,9.4]]]],
    ["inventory_warehouse", [[[18,21],[18,10],[17.95,9.69],[17.81,9.41],[17.59,9.19],[17.31,9.05],[17,9],[7,9],[6.69,9.05],[6.41,9.19],[6.19,9.41],[6.05,9.69],[6,10],[6,21]],[[22,19],[21.97,19.35],[21.88,19.68],[21.73,20],[21.53,20.29],[21.29,20.53],[21,20.73],[20.68,20.88],[20.35,20.97],[20,21],[4,21],[3.65,20.97],[3.32,20.88],[3,20.73],[2.71,20.53],[2.47,20.29],[2.27,20],[2.12,19.68],[2.03,19.35],[2,19],[2,8],[2.03,7.68],[2.1,7.37],[2.23,7.07],[2.4,6.8],[2.61,6.56],[2.86,6.36],[3.13,6.2],[11.08,2.22],[11.37,2.1],[11.68,2.02],[12,2],[12.32,2.02],[12.63,2.1],[12.92,2.22],[20.87,6.2],[21.14,6.36],[21.39,6.56],[21.6,6.8],[21.77,7.07],[21.9,7.37],[21.97,7.68],[22,8],[22,19]],[[6,13],[18,13]],[[6,17],[18,17]]]],
    ["inventory_archive", [[[3,3],[21,3],[21.31,3.05],[21.59,3.19],[21.81,3.41],[21.95,3.69],[22,4],[22,7],[21.95,7.31],[21.81,7.59],[21.59,7.81],[21.31,7.95],[21,8],[3,8],[2.69,7.95],[2.41,7.81],[2.19,7.59],[2.05,7.31],[2,7],[2,4],[2.05,3.69],[2.19,3.41],[2.41,3.19],[2.69,3.05],[3,3]],[[4,8],[4,19],[4.03,19.35],[4.12,19.68],[4.27,20],[4.47,20.29],[4.71,20.53],[5,20.73],[5.32,20.88],[5.65,20.97],[6,21],[18,21],[18.35,20.97],[18.68,20.88],[19,20.73],[19.29,20.53],[19.53,20.29],[19.73,20],[19.88,19.68],[19.97,19.35],[20,19],[20,8]],[[10,12],[14,12]]]],
    ["inventory_arrow-down-to-line", [[[12,17],[12,3]],[[6,11],[12,17],[18,11]],[[19,21],[5,21]]]],
    ["inventory_arrow-up-to-line", [[[5,3],[19,3]],[[18,13],[12,7],[6,13]],[[12,7],[12,21]]]],
    ["inventory_shopping-cart", [[[2.05,2.05],[3.15,2.02],[3.43,2.05],[3.69,2.16],[3.91,2.34],[4.07,2.57],[4.16,2.84],[6.85,17.18],[6.97,17.51],[7.19,17.77],[7.49,17.94],[7.83,18],[18,18]],[[4.56,5],[21,5],[21.29,5.04],[21.56,5.17],[21.78,5.37],[21.93,5.62],[22,5.91],[21.98,6.2],[20.95,12.43],[20.85,12.76],[20.69,13.06],[20.49,13.34],[20.24,13.57],[19.95,13.76],[19.64,13.9],[19.3,13.98],[18.96,14],[6.25,14]],[[16,20],[16.03,20.35],[16.12,20.68],[16.27,21],[16.47,21.29],[16.71,21.53],[17,21.73],[17.32,21.88],[17.65,21.97],[18,22],[18.35,21.97],[18.68,21.88],[19,21.73],[19.29,21.53],[19.53,21.29],[19.73,21],[19.88,20.68],[19.97,20.35],[20,20],[19.97,19.65],[19.88,19.32],[19.73,19],[19.53,18.71],[19.29,18.47],[19,18.27],[18.68,18.12],[18.35,18.03],[18,18],[17.65,18.03],[17.32,18.12],[17,18.27],[16.71,18.47],[16.47,18.71],[16.27,19],[16.12,19.32],[16.03,19.65],[16,20]],[[6,20],[6.03,20.35],[6.12,20.68],[6.27,21],[6.47,21.29],[6.71,21.53],[7,21.73],[7.32,21.88],[7.65,21.97],[8,22],[8.35,21.97],[8.68,21.88],[9,21.73],[9.29,21.53],[9.53,21.29],[9.73,21],[9.88,20.68],[9.97,20.35],[10,20],[9.97,19.65],[9.88,19.32],[9.73,19],[9.53,18.71],[9.29,18.47],[9,18.27],[8.68,18.12],[8.35,18.03],[8,18],[7.65,18.03],[7.32,18.12],[7,18.27],[6.71,18.47],[6.47,18.71],[6.27,19],[6.12,19.32],[6.03,19.65],[6,20]]]],
    ["inventory_calendar-clock", [[[16,14],[16,16.2],[17.6,17.2]],[[16,2],[16,5]],[[21,7.34],[21,5],[20.97,4.65],[20.88,4.32],[20.73,4],[20.53,3.71],[20.29,3.47],[20,3.27],[19.68,3.12],[19.35,3.03],[19,3],[5,3],[4.65,3.03],[4.32,3.12],[4,3.27],[3.71,3.47],[3.47,3.71],[3.27,4],[3.12,4.32],[3.03,4.65],[3,5],[3,19],[3.03,19.35],[3.12,19.68],[3.27,20],[3.47,20.29],[3.71,20.53],[4,20.73],[4.32,20.88],[4.65,20.97],[5,21],[7.34,21]],[[3,9],[8.86,9]],[[8,2],[8,5]],[[10,16],[10.01,16.35],[10.04,16.7],[10.09,17.04],[10.16,17.38],[10.25,17.72],[10.36,18.05],[10.49,18.38],[10.64,18.69],[10.8,19],[10.99,19.3],[11.19,19.58],[11.4,19.86],[11.64,20.12],[11.88,20.36],[12.14,20.6],[12.42,20.81],[12.7,21.01],[13,21.2],[13.31,21.36],[13.62,21.51],[13.95,21.64],[14.28,21.75],[14.62,21.84],[14.96,21.91],[15.3,21.96],[15.65,21.99],[16,22],[16.35,21.99],[16.7,21.96],[17.04,21.91],[17.38,21.84],[17.72,21.75],[18.05,21.64],[18.38,21.51],[18.69,21.36],[19,21.2],[19.3,21.01],[19.58,20.81],[19.86,20.6],[20.12,20.36],[20.36,20.12],[20.6,19.86],[20.81,19.58],[21.01,19.3],[21.2,19],[21.36,18.69],[21.51,18.38],[21.64,18.05],[21.75,17.72],[21.84,17.38],[21.91,17.04],[21.96,16.7],[21.99,16.35],[22,16],[21.99,15.65],[21.96,15.3],[21.91,14.96],[21.84,14.62],[21.75,14.28],[21.64,13.95],[21.51,13.62],[21.36,13.31],[21.2,13],[21.01,12.7],[20.81,12.42],[20.6,12.14],[20.36,11.88],[20.12,11.64],[19.86,11.4],[19.58,11.19],[19.3,10.99],[19,10.8],[18.69,10.64],[18.38,10.49],[18.05,10.36],[17.72,10.25],[17.38,10.16],[17.04,10.09],[16.7,10.04],[16.35,10.01],[16,10],[15.65,10.01],[15.3,10.04],[14.96,10.09],[14.62,10.16],[14.28,10.25],[13.95,10.36],[13.62,10.49],[13.31,10.64],[13,10.8],[12.7,10.99],[12.42,11.19],[12.14,11.4],[11.88,11.64],[11.64,11.88],[11.4,12.14],[11.19,12.42],[10.99,12.7],[10.8,13],[10.64,13.31],[10.49,13.62],[10.36,13.95],[10.25,14.28],[10.16,14.62],[10.09,14.96],[10.04,15.3],[10.01,15.65],[10,16]]]],
    ["inventory_barcode", [[[3,5],[3,19]],[[8,5],[8,19]],[[12,5],[12,19]],[[17,5],[17,19]],[[21,5],[21,19]]]],
    ["inventory_qr-code", [[[4,3],[7,3],[7.31,3.05],[7.59,3.19],[7.81,3.41],[7.95,3.69],[8,4],[8,7],[7.95,7.31],[7.81,7.59],[7.59,7.81],[7.31,7.95],[7,8],[4,8],[3.69,7.95],[3.41,7.81],[3.19,7.59],[3.05,7.31],[3,7],[3,4],[3.05,3.69],[3.19,3.41],[3.41,3.19],[3.69,3.05],[4,3]],[[17,3],[20,3],[20.31,3.05],[20.59,3.19],[20.81,3.41],[20.95,3.69],[21,4],[21,7],[20.95,7.31],[20.81,7.59],[20.59,7.81],[20.31,7.95],[20,8],[17,8],[16.69,7.95],[16.41,7.81],[16.19,7.59],[16.05,7.31],[16,7],[16,4],[16.05,3.69],[16.19,3.41],[16.41,3.19],[16.69,3.05],[17,3]],[[4,16],[7,16],[7.31,16.05],[7.59,16.19],[7.81,16.41],[7.95,16.69],[8,17],[8,20],[7.95,20.31],[7.81,20.59],[7.59,20.81],[7.31,20.95],[7,21],[4,21],[3.69,20.95],[3.41,20.81],[3.19,20.59],[3.05,20.31],[3,20],[3,17],[3.05,16.69],[3.19,16.41],[3.41,16.19],[3.69,16.05],[4,16]],[[21,16],[18,16],[17.65,16.03],[17.32,16.12],[17,16.27],[16.71,16.47],[16.47,16.71],[16.27,17],[16.12,17.32],[16.03,17.65],[16,18],[16,21]],[[21,21],[21,21.01]],[[12,7],[12,10],[11.97,10.35],[11.88,10.68],[11.73,11],[11.53,11.29],[11.29,11.53],[11,11.73],[10.68,11.88],[10.35,11.97],[10,12],[7,12]],[[3,12],[3.01,12]],[[12,3],[12.01,3]],[[12,16],[12,16.01]],[[16,12],[17,12]],[[21,12],[21,12.01]],[[12,21],[12,20]]]],
    ["inventory_tag", [[[12.59,2.59],[12.35,2.38],[12.08,2.22],[11.79,2.1],[11.48,2.02],[11.17,2],[4,2],[3.65,2.03],[3.32,2.12],[3,2.27],[2.71,2.47],[2.47,2.71],[2.27,3],[2.12,3.32],[2.03,3.65],[2,4],[2,11.17],[2.02,11.48],[2.1,11.79],[2.22,12.08],[2.38,12.35],[2.59,12.59],[11.29,21.29],[11.55,21.52],[11.84,21.7],[12.16,21.84],[12.49,21.94],[12.83,21.99],[13.17,21.99],[13.51,21.94],[13.84,21.84],[14.16,21.7],[14.45,21.52],[14.71,21.29],[21.29,14.71],[21.52,14.45],[21.7,14.16],[21.84,13.84],[21.94,13.51],[21.99,13.17],[21.99,12.83],[21.94,12.49],[21.84,12.16],[21.7,11.84],[21.52,11.55],[21.29,11.29],[12.59,2.59]],[[7,7.5],[7.1,7.79],[7.35,7.98],[7.65,7.98],[7.9,7.79],[8,7.5],[7.9,7.21],[7.65,7.02],[7.35,7.02],[7.1,7.21],[7,7.5]]]],
    ["inventory_layers", [[[12.83,2.18],[12.51,2.07],[12.17,2.01],[11.83,2.01],[11.49,2.07],[11.17,2.18],[2.6,6.08],[2.33,6.26],[2.12,6.52],[2.02,6.83],[2.02,7.16],[2.12,7.47],[2.33,7.73],[2.6,7.91],[11.18,11.82],[11.5,11.93],[11.84,11.99],[12.18,11.99],[12.52,11.93],[12.84,11.82],[21.42,7.92],[21.69,7.74],[21.9,7.48],[22,7.17],[22,6.84],[21.9,6.53],[21.69,6.27],[21.42,6.09],[12.83,2.18]],[[2,12],[2.04,12.28],[2.16,12.54],[2.34,12.76],[2.58,12.91],[11.18,16.82],[11.5,16.93],[11.84,16.99],[12.17,16.99],[12.51,16.93],[12.83,16.82],[21.41,12.92],[21.65,12.77],[21.84,12.55],[21.96,12.29],[22,12]],[[2,17],[2.04,17.28],[2.16,17.54],[2.34,17.76],[2.58,17.91],[11.18,21.82],[11.5,21.93],[11.84,21.99],[12.17,21.99],[12.51,21.93],[12.83,21.82],[21.41,17.92],[21.65,17.77],[21.84,17.55],[21.96,17.29],[22,17]]]],
    ["flow_arrow-up", [[[5,12],[12,5],[19,12]],[[12,19],[12,5]]]],
    ["flow_arrow-down", [[[12,5],[12,19]],[[19,12],[12,19],[5,12]]]],
    ["flow_arrow-left", [[[12,19],[5,12],[12,5]],[[19,12],[5,12]]]],
    ["flow_arrow-right", [[[5,12],[19,12]],[[12,5],[19,12],[12,19]]]],
    ["flow_arrow-left-right", [[[8,3],[4,7],[8,11]],[[4,7],[20,7]],[[16,21],[20,17],[16,13]],[[20,17],[4,17]]]],
    ["flow_repeat", [[[17,2],[21,6],[17,10]],[[3,11],[3,10],[3.02,9.65],[3.06,9.31],[3.14,8.96],[3.24,8.63],[3.37,8.31],[3.54,8],[3.72,7.71],[3.94,7.43],[4.17,7.17],[4.43,6.94],[4.71,6.72],[5,6.54],[5.31,6.37],[5.63,6.24],[5.96,6.14],[6.31,6.06],[6.65,6.02],[7,6],[21,6]],[[7,22],[3,18],[7,14]],[[21,13],[21,14],[20.98,14.35],[20.94,14.69],[20.86,15.04],[20.76,15.37],[20.63,15.69],[20.46,16],[20.28,16.29],[20.06,16.57],[19.83,16.83],[19.57,17.06],[19.29,17.28],[19,17.46],[18.69,17.63],[18.37,17.76],[18.04,17.86],[17.69,17.94],[17.35,17.98],[17,18],[3,18]]]],
    ["flow_refresh-cw", [[[3,12],[3.01,11.66],[3.03,11.31],[3.06,10.97],[3.11,10.63],[3.16,10.29],[3.24,9.95],[3.32,9.62],[3.42,9.28],[3.53,8.96],[3.65,8.64],[3.79,8.32],[3.93,8.01],[4.09,7.7],[4.26,7.4],[4.45,7.11],[4.64,6.82],[4.84,6.54],[5.06,6.27],[5.28,6.01],[5.52,5.76],[5.76,5.52],[6.01,5.28],[6.27,5.06],[6.54,4.84],[6.82,4.64],[7.11,4.45],[7.4,4.26],[7.7,4.09],[8.01,3.93],[8.32,3.79],[8.64,3.65],[8.96,3.53],[9.28,3.42],[9.62,3.32],[9.95,3.24],[10.29,3.16],[10.63,3.11],[10.97,3.06],[11.31,3.03],[11.66,3.01],[12,3],[12.34,3.01],[12.68,3.03],[13.01,3.06],[13.35,3.1],[13.69,3.15],[14.02,3.22],[14.35,3.3],[14.68,3.38],[15,3.48],[15.32,3.6],[15.64,3.72],[15.95,3.85],[16.25,3.99],[16.56,4.15],[16.85,4.31],[17.14,4.49],[17.43,4.67],[17.7,4.87],[17.97,5.07],[18.24,5.29],[18.49,5.51],[18.74,5.74],[21,8]],[[21,3],[21,8],[16,8]],[[21,12],[20.99,12.34],[20.97,12.69],[20.94,13.03],[20.89,13.37],[20.84,13.71],[20.76,14.05],[20.68,14.38],[20.58,14.72],[20.47,15.04],[20.35,15.36],[20.21,15.68],[20.07,15.99],[19.91,16.3],[19.74,16.6],[19.55,16.89],[19.36,17.18],[19.16,17.46],[18.94,17.73],[18.72,17.99],[18.48,18.24],[18.24,18.48],[17.99,18.72],[17.73,18.94],[17.46,19.16],[17.18,19.36],[16.89,19.55],[16.6,19.74],[16.3,19.91],[15.99,20.07],[15.68,20.21],[15.36,20.35],[15.04,20.47],[14.72,20.58],[14.38,20.68],[14.05,20.76],[13.71,20.84],[13.37,20.89],[13.03,20.94],[12.69,20.97],[12.34,20.99],[12,21],[11.66,20.99],[11.32,20.97],[10.99,20.94],[10.65,20.9],[10.31,20.85],[9.98,20.78],[9.65,20.7],[9.32,20.62],[9,20.52],[8.68,20.4],[8.36,20.28],[8.05,20.15],[7.75,20.01],[7.44,19.85],[7.15,19.69],[6.86,19.51],[6.57,19.33],[6.3,19.13],[6.03,18.93],[5.76,18.71],[5.51,18.49],[5.26,18.26],[3,16]],[[8,16],[3,16],[3,21]]]],
    ["flow_undo-2", [[[9,14],[4,9],[9,4]],[[4,9],[14.5,9],[14.85,9.01],[15.19,9.04],[15.53,9.1],[15.87,9.17],[16.2,9.27],[16.52,9.39],[16.84,9.52],[17.15,9.68],[17.45,9.86],[17.73,10.05],[18.01,10.26],[18.27,10.49],[18.51,10.73],[18.74,10.99],[18.95,11.27],[19.14,11.55],[19.32,11.85],[19.48,12.16],[19.61,12.48],[19.73,12.8],[19.83,13.13],[19.9,13.47],[19.96,13.81],[19.99,14.15],[20,14.5],[19.99,14.85],[19.96,15.19],[19.9,15.53],[19.83,15.87],[19.73,16.2],[19.61,16.52],[19.48,16.84],[19.32,17.15],[19.14,17.45],[18.95,17.73],[18.74,18.01],[18.51,18.27],[18.27,18.51],[18.01,18.74],[17.73,18.95],[17.45,19.14],[17.15,19.32],[16.84,19.48],[16.52,19.61],[16.2,19.73],[15.87,19.83],[15.53,19.9],[15.19,19.96],[14.85,19.99],[14.5,20],[11,20]]]],
    ["flow_recycle", [[[7,19],[4.82,19],[4.5,18.97],[4.2,18.9],[3.91,18.77],[3.66,18.59],[3.43,18.37],[3.25,18.12],[3.11,17.84],[3.03,17.54],[3,17.23],[3.03,16.92],[3.11,16.62],[3.24,16.34],[7.2,9.5]],[[11,19],[19.2,19],[19.51,18.97],[19.81,18.89],[20.1,18.76],[20.35,18.58],[20.58,18.36],[20.76,18.11],[20.89,17.83],[20.97,17.53],[21,17.22],[20.97,16.91],[20.89,16.62],[20.76,16.34],[19.53,14.21]],[[14,16],[11,19],[14,22]],[[8.29,13.6],[7.2,9.5],[3.1,10.6]],[[9.34,5.81],[10.44,3.92],[10.62,3.66],[10.84,3.44],[11.09,3.26],[11.37,3.12],[11.67,3.03],[11.98,3],[12.29,3.03],[12.59,3.11],[12.88,3.24],[13.13,3.41],[13.35,3.63],[13.53,3.89],[17.47,10.73]],[[13.38,9.63],[17.47,10.73],[18.57,6.63]]]],
    ["flow_trash", [[[10,11],[10,17]],[[14,11],[14,17]],[[19,6],[19,20],[18.97,20.35],[18.88,20.68],[18.73,21],[18.53,21.29],[18.29,21.53],[18,21.73],[17.68,21.88],[17.35,21.97],[17,22],[7,22],[6.65,21.97],[6.32,21.88],[6,21.73],[5.71,21.53],[5.47,21.29],[5.27,21],[5.12,20.68],[5.03,20.35],[5,20],[5,6]],[[3,6],[21,6]],[[8,6],[8,4],[8.03,3.65],[8.12,3.32],[8.27,3],[8.47,2.71],[8.71,2.47],[9,2.27],[9.32,2.12],[9.65,2.03],[10,2],[14,2],[14.35,2.03],[14.68,2.12],[15,2.27],[15.29,2.47],[15.53,2.71],[15.73,3],[15.88,3.32],[15.97,3.65],[16,4],[16,6]]]],
    ["flow_workflow", [[[5,3],[9,3],[9.35,3.03],[9.68,3.12],[10,3.27],[10.29,3.47],[10.53,3.71],[10.73,4],[10.88,4.32],[10.97,4.65],[11,5],[11,9],[10.97,9.35],[10.88,9.68],[10.73,10],[10.53,10.29],[10.29,10.53],[10,10.73],[9.68,10.88],[9.35,10.97],[9,11],[5,11],[4.65,10.97],[4.32,10.88],[4,10.73],[3.71,10.53],[3.47,10.29],[3.27,10],[3.12,9.68],[3.03,9.35],[3,9],[3,5],[3.03,4.65],[3.12,4.32],[3.27,4],[3.47,3.71],[3.71,3.47],[4,3.27],[4.32,3.12],[4.65,3.03],[5,3]],[[7,11],[7,15],[7.03,15.35],[7.12,15.68],[7.27,16],[7.47,16.29],[7.71,16.53],[8,16.73],[8.32,16.88],[8.65,16.97],[9,17],[13,17]],[[15,13],[19,13],[19.35,13.03],[19.68,13.12],[20,13.27],[20.29,13.47],[20.53,13.71],[20.73,14],[20.88,14.32],[20.97,14.65],[21,15],[21,19],[20.97,19.35],[20.88,19.68],[20.73,20],[20.53,20.29],[20.29,20.53],[20,20.73],[19.68,20.88],[19.35,20.97],[19,21],[15,21],[14.65,20.97],[14.32,20.88],[14,20.73],[13.71,20.53],[13.47,20.29],[13.27,20],[13.12,19.68],[13.03,19.35],[13,19],[13,15],[13.03,14.65],[13.12,14.32],[13.27,14],[13.47,13.71],[13.71,13.47],[14,13.27],[14.32,13.12],[14.65,13.03],[15,13]]]],
    ["flow_truck", [[[14,18],[14,6],[13.97,5.65],[13.88,5.32],[13.73,5],[13.53,4.71],[13.29,4.47],[13,4.27],[12.68,4.12],[12.35,4.03],[12,4],[4,4],[3.65,4.03],[3.32,4.12],[3,4.27],[2.71,4.47],[2.47,4.71],[2.27,5],[2.12,5.32],[2.03,5.65],[2,6],[2,17],[2.05,17.31],[2.19,17.59],[2.41,17.81],[2.69,17.95],[3,18],[5,18]],[[15,18],[9,18]],[[19,18],[21,18],[21.31,17.95],[21.59,17.81],[21.81,17.59],[21.95,17.31],[22,17],[22,13.35],[21.97,13.13],[21.9,12.92],[21.78,12.73],[18.3,8.38],[18.08,8.17],[17.81,8.04],[17.52,8],[14,8]],[[15,18],[15.03,18.35],[15.12,18.68],[15.27,19],[15.47,19.29],[15.71,19.53],[16,19.73],[16.32,19.88],[16.65,19.97],[17,20],[17.35,19.97],[17.68,19.88],[18,19.73],[18.29,19.53],[18.53,19.29],[18.73,19],[18.88,18.68],[18.97,18.35],[19,18],[18.97,17.65],[18.88,17.32],[18.73,17],[18.53,16.71],[18.29,16.47],[18,16.27],[17.68,16.12],[17.35,16.03],[17,16],[16.65,16.03],[16.32,16.12],[16,16.27],[15.71,16.47],[15.47,16.71],[15.27,17],[15.12,17.32],[15.03,17.65],[15,18]],[[5,18],[5.03,18.35],[5.12,18.68],[5.27,19],[5.47,19.29],[5.71,19.53],[6,19.73],[6.32,19.88],[6.65,19.97],[7,20],[7.35,19.97],[7.68,19.88],[8,19.73],[8.29,19.53],[8.53,19.29],[8.73,19],[8.88,18.68],[8.97,18.35],[9,18],[8.97,17.65],[8.88,17.32],[8.73,17],[8.53,16.71],[8.29,16.47],[8,16.27],[7.68,16.12],[7.35,16.03],[7,16],[6.65,16.03],[6.32,16.12],[6,16.27],[5.71,16.47],[5.47,16.71],[5.27,17],[5.12,17.32],[5.03,17.65],[5,18]]]],
    ["flow_factory", [[[12,16],[12.01,16]],[[16,16],[16.01,16]],[[3,19],[3.03,19.35],[3.12,19.68],[3.27,20],[3.47,20.29],[3.71,20.53],[4,20.73],[4.32,20.88],[4.65,20.97],[5,21],[19,21],[19.35,20.97],[19.68,20.88],[20,20.73],[20.29,20.53],[20.53,20.29],[20.73,20],[20.88,19.68],[20.97,19.35],[21,19],[21,8.5],[20.93,8.25],[20.74,8.06],[20.48,8],[20.23,8.08],[15.77,10.92],[15.52,11],[15.26,10.94],[15.07,10.75],[15,10.5],[15,8.5],[14.93,8.25],[14.74,8.06],[14.48,8],[14.23,8.08],[9.77,10.92],[9.52,11],[9.26,10.94],[9.07,10.76],[9,10.5],[9,5],[8.97,4.65],[8.88,4.32],[8.73,4],[8.53,3.71],[8.29,3.47],[8,3.27],[7.68,3.12],[7.35,3.03],[7,3],[5,3],[4.65,3.03],[4.32,3.12],[4,3.27],[3.71,3.47],[3.47,3.71],[3.27,4],[3.12,4.32],[3.03,4.65],[3,5],[3,19]],[[8,16],[8.01,16]]]],
    ["flow_timer", [[[10,2],[14,2]],[[12,14],[15,11]],[[4,14],[4.01,14.35],[4.03,14.7],[4.07,15.04],[4.12,15.39],[4.19,15.73],[4.27,16.07],[4.37,16.41],[4.48,16.74],[4.61,17.06],[4.75,17.38],[4.9,17.69],[5.07,18],[5.25,18.3],[5.45,18.59],[5.65,18.87],[5.87,19.14],[6.1,19.4],[6.34,19.66],[6.6,19.9],[6.86,20.13],[7.13,20.35],[7.41,20.55],[7.7,20.75],[8,20.93],[8.31,21.1],[8.62,21.25],[8.94,21.39],[9.26,21.52],[9.59,21.63],[9.93,21.73],[10.27,21.81],[10.61,21.88],[10.96,21.93],[11.3,21.97],[11.65,21.99],[12,22],[12.35,21.99],[12.7,21.97],[13.04,21.93],[13.39,21.88],[13.73,21.81],[14.07,21.73],[14.41,21.63],[14.74,21.52],[15.06,21.39],[15.38,21.25],[15.69,21.1],[16,20.93],[16.3,20.75],[16.59,20.55],[16.87,20.35],[17.14,20.13],[17.4,19.9],[17.66,19.66],[17.9,19.4],[18.13,19.14],[18.35,18.87],[18.55,18.59],[18.75,18.3],[18.93,18],[19.1,17.69],[19.25,17.38],[19.39,17.06],[19.52,16.74],[19.63,16.41],[19.73,16.07],[19.81,15.73],[19.88,15.39],[19.93,15.04],[19.97,14.7],[19.99,14.35],[20,14],[19.99,13.65],[19.97,13.3],[19.93,12.96],[19.88,12.61],[19.81,12.27],[19.73,11.93],[19.63,11.59],[19.52,11.26],[19.39,10.94],[19.25,10.62],[19.1,10.31],[18.93,10],[18.75,9.7],[18.55,9.41],[18.35,9.13],[18.13,8.86],[17.9,8.6],[17.66,8.34],[17.4,8.1],[17.14,7.87],[16.87,7.65],[16.59,7.45],[16.3,7.25],[16,7.07],[15.69,6.9],[15.38,6.75],[15.06,6.61],[14.74,6.48],[14.41,6.37],[14.07,6.27],[13.73,6.19],[13.39,6.12],[13.04,6.07],[12.7,6.03],[12.35,6.01],[12,6],[11.65,6.01],[11.3,6.03],[10.96,6.07],[10.61,6.12],[10.27,6.19],[9.93,6.27],[9.59,6.37],[9.26,6.48],[8.94,6.61],[8.62,6.75],[8.31,6.9],[8,7.07],[7.7,7.25],[7.41,7.45],[7.13,7.65],[6.86,7.87],[6.6,8.1],[6.34,8.34],[6.1,8.6],[5.87,8.86],[5.65,9.13],[5.45,9.41],[5.25,9.7],[5.07,10],[4.9,10.31],[4.75,10.62],[4.61,10.94],[4.48,11.26],[4.37,11.59],[4.27,11.93],[4.19,12.27],[4.12,12.61],[4.07,12.96],[4.03,13.3],[4.01,13.65],[4,14]]]],
    ["flow_clock", [[[2,12],[2.01,12.35],[2.02,12.7],[2.05,13.05],[2.1,13.39],[2.15,13.74],[2.22,14.08],[2.3,14.42],[2.39,14.76],[2.49,15.09],[2.6,15.42],[2.73,15.75],[2.86,16.07],[3.01,16.38],[3.17,16.69],[3.34,17],[3.52,17.3],[3.71,17.59],[3.91,17.88],[4.12,18.16],[4.34,18.43],[4.57,18.69],[4.81,18.95],[5.05,19.19],[5.31,19.43],[5.57,19.66],[5.84,19.88],[6.12,20.09],[6.41,20.29],[6.7,20.48],[7,20.66],[7.31,20.83],[7.62,20.99],[7.93,21.14],[8.25,21.27],[8.58,21.4],[8.91,21.51],[9.24,21.61],[9.58,21.7],[9.92,21.78],[10.26,21.85],[10.61,21.9],[10.95,21.95],[11.3,21.98],[11.65,21.99],[12,22],[12.35,21.99],[12.7,21.98],[13.05,21.95],[13.39,21.9],[13.74,21.85],[14.08,21.78],[14.42,21.7],[14.76,21.61],[15.09,21.51],[15.42,21.4],[15.75,21.27],[16.07,21.14],[16.38,20.99],[16.69,20.83],[17,20.66],[17.3,20.48],[17.59,20.29],[17.88,20.09],[18.16,19.88],[18.43,19.66],[18.69,19.43],[18.95,19.19],[19.19,18.95],[19.43,18.69],[19.66,18.43],[19.88,18.16],[20.09,17.88],[20.29,17.59],[20.48,17.3],[20.66,17],[20.83,16.69],[20.99,16.38],[21.14,16.07],[21.27,15.75],[21.4,15.42],[21.51,15.09],[21.61,14.76],[21.7,14.42],[21.78,14.08],[21.85,13.74],[21.9,13.39],[21.95,13.05],[21.98,12.7],[21.99,12.35],[22,12],[21.99,11.65],[21.98,11.3],[21.95,10.95],[21.9,10.61],[21.85,10.26],[21.78,9.92],[21.7,9.58],[21.61,9.24],[21.51,8.91],[21.4,8.58],[21.27,8.25],[21.14,7.93],[20.99,7.62],[20.83,7.31],[20.66,7],[20.48,6.7],[20.29,6.41],[20.09,6.12],[19.88,5.84],[19.66,5.57],[19.43,5.31],[19.19,5.05],[18.95,4.81],[18.69,4.57],[18.43,4.34],[18.16,4.12],[17.88,3.91],[17.59,3.71],[17.3,3.52],[17,3.34],[16.69,3.17],[16.38,3.01],[16.07,2.86],[15.75,2.73],[15.42,2.6],[15.09,2.49],[14.76,2.39],[14.42,2.3],[14.08,2.22],[13.74,2.15],[13.39,2.1],[13.05,2.05],[12.7,2.02],[12.35,2.01],[12,2],[11.65,2.01],[11.3,2.02],[10.95,2.05],[10.61,2.1],[10.26,2.15],[9.92,2.22],[9.58,2.3],[9.24,2.39],[8.91,2.49],[8.58,2.6],[8.25,2.73],[7.93,2.86],[7.62,3.01],[7.31,3.17],[7,3.34],[6.7,3.52],[6.41,3.71],[6.12,3.91],[5.84,4.12],[5.57,4.34],[5.31,4.57],[5.05,4.81],[4.81,5.05],[4.57,5.31],[4.34,5.57],[4.12,5.84],[3.91,6.12],[3.71,6.41],[3.52,6.7],[3.34,7],[3.17,7.31],[3.01,7.62],[2.86,7.93],[2.73,8.25],[2.6,8.58],[2.49,8.91],[2.39,9.24],[2.3,9.58],[2.22,9.92],[2.15,10.26],[2.1,10.61],[2.05,10.95],[2.02,11.3],[2.01,11.65],[2,12]],[[12,6],[12,12],[16,14]]]],
    ["flow_hourglass", [[[5,22],[19,22]],[[5,2],[19,2]],[[17,22],[17,17.83],[16.98,17.52],[16.9,17.21],[16.78,16.92],[16.62,16.65],[16.41,16.41],[12,12],[7.59,16.41],[7.38,16.65],[7.22,16.92],[7.1,17.21],[7.02,17.52],[7,17.83],[7,22]],[[7,2],[7,6.17],[7.02,6.48],[7.1,6.79],[7.22,7.08],[7.38,7.35],[7.59,7.59],[12,12],[16.41,7.59],[16.62,7.35],[16.78,7.08],[16.9,6.79],[16.98,6.48],[17,6.17],[17,2]]]],
    ["tools_wrench", [[[14.7,6.3],[14.52,6.55],[14.43,6.85],[14.43,7.15],[14.52,7.45],[14.7,7.7],[16.3,9.3],[16.55,9.48],[16.85,9.57],[17.15,9.57],[17.45,9.48],[17.7,9.3],[20.81,6.19],[21.02,6.05],[21.26,6.01],[21.48,6.05],[21.67,6.19],[21.79,6.41],[21.87,6.75],[21.93,7.09],[21.98,7.44],[22,7.79],[22,8.14],[21.98,8.48],[21.95,8.83],[21.89,9.17],[21.81,9.51],[21.71,9.85],[21.6,10.17],[21.46,10.5],[21.31,10.81],[21.14,11.11],[20.95,11.4],[20.74,11.68],[20.52,11.95],[20.28,12.21],[20.03,12.45],[19.77,12.68],[19.49,12.89],[19.2,13.08],[18.9,13.26],[18.59,13.42],[18.27,13.56],[17.95,13.68],[17.61,13.78],[17.28,13.87],[16.93,13.93],[16.59,13.98],[16.24,14],[15.89,14],[15.54,13.99],[15.2,13.95],[14.85,13.89],[14.51,13.82],[14.18,13.72],[13.85,13.6],[13.53,13.47],[5.62,21.38],[5.37,21.6],[5.08,21.77],[4.78,21.9],[4.45,21.97],[4.12,22],[3.79,21.97],[3.46,21.9],[3.16,21.77],[2.87,21.6],[2.62,21.38],[2.4,21.13],[2.23,20.84],[2.1,20.54],[2.03,20.21],[2,19.88],[2.03,19.55],[2.1,19.22],[2.23,18.92],[2.4,18.63],[2.62,18.38],[10.53,10.47],[10.4,10.15],[10.28,9.82],[10.19,9.49],[10.11,9.15],[10.05,8.8],[10.01,8.46],[10,8.11],[10,7.76],[10.03,7.41],[10.07,7.07],[10.13,6.72],[10.22,6.39],[10.32,6.05],[10.44,5.73],[10.58,5.41],[10.74,5.1],[10.92,4.8],[11.11,4.51],[11.32,4.23],[11.55,3.97],[11.79,3.72],[12.05,3.48],[12.32,3.26],[12.6,3.05],[12.89,2.86],[13.19,2.69],[13.51,2.54],[13.83,2.4],[14.15,2.29],[14.49,2.19],[14.83,2.11],[15.17,2.05],[15.52,2.02],[15.87,2],[16.21,2],[16.56,2.02],[16.91,2.07],[17.25,2.13],[17.59,2.21],[17.81,2.33],[17.95,2.52],[17.99,2.74],[17.95,2.98],[17.81,3.19],[14.7,6.3]]]],
    ["tools_hammer", [[[15,12],[5.63,21.37],[5.37,21.59],[5.09,21.76],[4.78,21.89],[4.46,21.97],[4.13,21.99],[3.79,21.97],[3.47,21.89],[3.16,21.76],[2.88,21.59],[2.63,21.37],[2.41,21.12],[2.24,20.84],[2.11,20.53],[2.03,20.21],[2,19.87],[2.03,19.54],[2.11,19.22],[2.24,18.91],[2.41,18.63],[2.63,18.37],[12,9]],[[18,15],[22,11]],[[21.5,11.5],[19.59,9.59],[19.38,9.35],[19.22,9.08],[19.1,8.79],[19.02,8.48],[19,8.17],[19,7.83],[18.98,7.52],[18.9,7.21],[18.78,6.92],[18.62,6.65],[18.41,6.41],[16.76,4.76],[16.51,4.53],[16.26,4.31],[15.99,4.11],[15.71,3.92],[15.42,3.75],[15.12,3.59],[14.81,3.46],[14.5,3.34],[14.18,3.23],[13.85,3.15],[13.52,3.08],[13.19,3.04],[12.85,3.01],[12.52,3],[9,3],[10.24,4.24],[10.47,4.49],[10.69,4.74],[10.89,5.01],[11.08,5.29],[11.25,5.58],[11.41,5.88],[11.54,6.19],[11.66,6.5],[11.77,6.82],[11.85,7.15],[11.92,7.48],[11.96,7.81],[11.99,8.15],[12,8.48],[12,10],[14,12],[15.17,12],[15.48,12.02],[15.79,12.1],[16.08,12.22],[16.35,12.38],[16.59,12.59],[18.5,14.5]]]],
    ["tools_drill", [[[10,18],[10.31,18.05],[10.59,18.19],[10.81,18.41],[10.95,18.69],[11,19],[11,21],[10.95,21.31],[10.81,21.59],[10.59,21.81],[10.31,21.95],[10,22],[5,22],[4.66,21.98],[4.33,21.92],[4.01,21.83],[3.7,21.7],[3.4,21.54],[3.13,21.35],[2.88,21.12],[2.65,20.87],[2.46,20.6],[2.3,20.3],[2.17,19.99],[2.08,19.67],[2.02,19.34],[2,19],[2.05,18.69],[2.19,18.41],[2.41,18.19],[2.69,18.05],[3,18],[10,18]],[[13,10],[4,10],[3.65,9.97],[3.32,9.88],[3,9.73],[2.71,9.53],[2.47,9.29],[2.27,9],[2.12,8.68],[2.03,8.35],[2,8],[2,4],[2.03,3.65],[2.12,3.32],[2.27,3],[2.47,2.71],[2.71,2.47],[3,2.27],[3.32,2.12],[3.65,2.03],[4,2],[13,2],[13.31,2.05],[13.59,2.19],[13.81,2.41],[13.95,2.69],[14,3],[14,9],[13.95,9.31],[13.81,9.59],[13.59,9.81],[13.31,9.95],[13,10],[12.19,13.24],[12.06,13.54],[11.84,13.79],[11.55,13.95],[11.22,14],[8,14]],[[14,4],[17,4],[17.31,4.05],[17.59,4.19],[17.81,4.41],[17.95,4.69],[18,5],[18,7],[17.95,7.31],[17.81,7.59],[17.59,7.81],[17.31,7.95],[17,8],[14,8]],[[18,6],[22,6]],[[5,10],[3,18]],[[7,18],[9,10]]]],
    ["tools_scissors", [[[3,6],[3.02,6.35],[3.08,6.69],[3.18,7.03],[3.32,7.35],[3.49,7.65],[3.7,7.93],[3.94,8.18],[4.21,8.41],[4.5,8.6],[4.81,8.75],[5.14,8.87],[5.48,8.95],[5.83,8.99],[6.17,8.99],[6.52,8.95],[6.86,8.87],[7.19,8.75],[7.5,8.6],[7.79,8.41],[8.06,8.18],[8.3,7.93],[8.51,7.65],[8.68,7.35],[8.82,7.03],[8.92,6.69],[8.98,6.35],[9,6],[8.98,5.65],[8.92,5.31],[8.82,4.97],[8.68,4.65],[8.51,4.35],[8.3,4.07],[8.06,3.82],[7.79,3.59],[7.5,3.4],[7.19,3.25],[6.86,3.13],[6.52,3.05],[6.17,3.01],[5.83,3.01],[5.48,3.05],[5.14,3.13],[4.81,3.25],[4.5,3.4],[4.21,3.59],[3.94,3.82],[3.7,4.07],[3.49,4.35],[3.32,4.65],[3.18,4.97],[3.08,5.31],[3.02,5.65],[3,6]],[[8.12,8.12],[12,12]],[[20,4],[8.12,15.88]],[[3,18],[3.02,18.35],[3.08,18.69],[3.18,19.03],[3.32,19.35],[3.49,19.65],[3.7,19.93],[3.94,20.18],[4.21,20.41],[4.5,20.6],[4.81,20.75],[5.14,20.87],[5.48,20.95],[5.83,20.99],[6.17,20.99],[6.52,20.95],[6.86,20.87],[7.19,20.75],[7.5,20.6],[7.79,20.41],[8.06,20.18],[8.3,19.93],[8.51,19.65],[8.68,19.35],[8.82,19.03],[8.92,18.69],[8.98,18.35],[9,18],[8.98,17.65],[8.92,17.31],[8.82,16.97],[8.68,16.65],[8.51,16.35],[8.3,16.07],[8.06,15.82],[7.79,15.59],[7.5,15.4],[7.19,15.25],[6.86,15.13],[6.52,15.05],[6.17,15.01],[5.83,15.01],[5.48,15.05],[5.14,15.13],[4.81,15.25],[4.5,15.4],[4.21,15.59],[3.94,15.82],[3.7,16.07],[3.49,16.35],[3.32,16.65],[3.18,16.97],[3.08,17.31],[3.02,17.65],[3,18]],[[14.8,14.8],[20,20]]]],
    ["tools_cable", [[[17,19],[16.69,18.95],[16.41,18.81],[16.19,18.59],[16.05,18.31],[16,18],[16,16],[16.03,15.65],[16.12,15.32],[16.27,15],[16.47,14.71],[16.71,14.47],[17,14.27],[17.32,14.12],[17.65,14.03],[18,14],[20,14],[20.35,14.03],[20.68,14.12],[21,14.27],[21.29,14.47],[21.53,14.71],[21.73,15],[21.88,15.32],[21.97,15.65],[22,16],[22,18],[21.95,18.31],[21.81,18.59],[21.59,18.81],[21.31,18.95],[21,19],[17,19]],[[17,21],[17,19]],[[19,14],[19,6.5],[18.98,6.16],[18.93,5.82],[18.85,5.48],[18.73,5.16],[18.59,4.85],[18.41,4.56],[18.21,4.28],[17.97,4.03],[17.72,3.79],[17.44,3.59],[17.15,3.41],[16.84,3.27],[16.52,3.15],[16.18,3.07],[15.84,3.02],[15.5,3],[15.16,3.02],[14.82,3.07],[14.48,3.15],[14.16,3.27],[13.85,3.41],[13.56,3.59],[13.28,3.79],[13.03,4.03],[12.79,4.28],[12.59,4.56],[12.41,4.85],[12.27,5.16],[12.15,5.48],[12.07,5.82],[12.02,6.16],[12,6.5],[12,17.5],[11.98,17.84],[11.93,18.18],[11.85,18.52],[11.73,18.84],[11.59,19.15],[11.41,19.44],[11.21,19.72],[10.97,19.97],[10.72,20.21],[10.44,20.41],[10.15,20.59],[9.84,20.73],[9.52,20.85],[9.18,20.93],[8.84,20.98],[8.5,21],[8.16,20.98],[7.82,20.93],[7.48,20.85],[7.16,20.73],[6.85,20.59],[6.56,20.41],[6.28,20.21],[6.03,19.97],[5.79,19.72],[5.59,19.44],[5.41,19.15],[5.27,18.84],[5.15,18.52],[5.07,18.18],[5.02,17.84],[5,17.5],[5,10]],[[21,21],[21,19]],[[3,5],[3,3]],[[4,10],[3.65,9.97],[3.32,9.88],[3,9.73],[2.71,9.53],[2.47,9.29],[2.27,9],[2.12,8.68],[2.03,8.35],[2,8],[2,6],[2.05,5.69],[2.19,5.41],[2.41,5.19],[2.69,5.05],[3,5],[7,5],[7.31,5.05],[7.59,5.19],[7.81,5.41],[7.95,5.69],[8,6],[8,8],[7.97,8.35],[7.88,8.68],[7.73,9],[7.53,9.29],[7.29,9.53],[7,9.73],[6.68,9.88],[6.35,9.97],[6,10],[4,10]],[[7,5],[7,3]]]],
    ["tools_plug", [[[12,22],[12,17]],[[15,8],[15,2]],[[17,8],[17.31,8.05],[17.59,8.19],[17.81,8.41],[17.95,8.69],[18,9],[18,13],[17.98,13.35],[17.94,13.69],[17.86,14.04],[17.76,14.37],[17.63,14.69],[17.46,15],[17.28,15.29],[17.06,15.57],[16.83,15.83],[16.57,16.06],[16.29,16.28],[16,16.46],[15.69,16.63],[15.37,16.76],[15.04,16.86],[14.69,16.94],[14.35,16.98],[14,17],[10,17],[9.65,16.98],[9.31,16.94],[8.96,16.86],[8.63,16.76],[8.31,16.63],[8,16.46],[7.71,16.28],[7.43,16.06],[7.17,15.83],[6.94,15.57],[6.72,15.29],[6.54,15],[6.37,14.69],[6.24,14.37],[6.14,14.04],[6.06,13.69],[6.02,13.35],[6,13],[6,9],[6.05,8.69],[6.19,8.41],[6.41,8.19],[6.69,8.05],[7,8],[17,8]],[[9,8],[9,2]]]],
    ["tools_bolt", [[[21,16],[21,8],[20.97,7.65],[20.88,7.32],[20.73,7],[20.53,6.72],[20.29,6.47],[20,6.27],[13,2.27],[12.68,2.12],[12.35,2.03],[12,2],[11.65,2.03],[11.32,2.12],[11,2.27],[4,6.27],[3.71,6.47],[3.47,6.72],[3.27,7],[3.12,7.32],[3.03,7.65],[3,8],[3,16],[3.03,16.35],[3.12,16.68],[3.27,17],[3.47,17.28],[3.71,17.53],[4,17.73],[11,21.73],[11.32,21.88],[11.65,21.97],[12,22],[12.35,21.97],[12.68,21.88],[13,21.73],[20,17.73],[20.29,17.53],[20.53,17.28],[20.73,17],[20.88,16.68],[20.97,16.35],[21,16]],[[8,12],[8.02,12.35],[8.06,12.69],[8.14,13.04],[8.24,13.37],[8.37,13.69],[8.54,14],[8.72,14.29],[8.94,14.57],[9.17,14.83],[9.43,15.06],[9.71,15.28],[10,15.46],[10.31,15.63],[10.63,15.76],[10.96,15.86],[11.31,15.94],[11.65,15.98],[12,16],[12.35,15.98],[12.69,15.94],[13.04,15.86],[13.37,15.76],[13.69,15.63],[14,15.46],[14.29,15.28],[14.57,15.06],[14.83,14.83],[15.06,14.57],[15.28,14.29],[15.46,14],[15.63,13.69],[15.76,13.37],[15.86,13.04],[15.94,12.69],[15.98,12.35],[16,12],[15.98,11.65],[15.94,11.31],[15.86,10.96],[15.76,10.63],[15.63,10.31],[15.46,10],[15.28,9.71],[15.06,9.43],[14.83,9.17],[14.57,8.94],[14.29,8.72],[14,8.54],[13.69,8.37],[13.37,8.24],[13.04,8.14],[12.69,8.06],[12.35,8.02],[12,8],[11.65,8.02],[11.31,8.06],[10.96,8.14],[10.63,8.24],[10.31,8.37],[10,8.54],[9.71,8.72],[9.43,8.94],[9.17,9.17],[8.94,9.43],[8.72,9.71],[8.54,10],[8.37,10.31],[8.24,10.63],[8.14,10.96],[8.06,11.31],[8.02,11.65],[8,12]]]],
    ["tools_settings", [[[9.67,4.14],[9.73,3.8],[9.84,3.47],[9.99,3.16],[10.19,2.88],[10.43,2.63],[10.7,2.41],[11,2.24],[11.32,2.12],[11.66,2.04],[12,2.02],[12.34,2.04],[12.68,2.12],[13,2.24],[13.3,2.41],[13.57,2.63],[13.81,2.88],[14.01,3.16],[14.16,3.47],[14.27,3.8],[14.33,4.14],[14.39,4.48],[14.49,4.81],[14.64,5.11],[14.84,5.4],[15.07,5.65],[15.35,5.86],[15.64,6.04],[15.97,6.16],[16.3,6.24],[16.65,6.27],[16.99,6.25],[17.33,6.17],[17.65,6.05],[17.97,5.93],[18.31,5.86],[18.65,5.84],[19,5.87],[19.33,5.95],[19.65,6.08],[19.95,6.26],[20.22,6.47],[20.45,6.73],[20.64,7.01],[20.79,7.32],[20.9,7.65],[20.95,7.99],[20.95,8.33],[20.9,8.68],[20.81,9.01],[20.66,9.32],[20.47,9.61],[20.24,9.86],[19.98,10.08],[19.71,10.3],[19.48,10.56],[19.29,10.84],[19.14,11.16],[19.04,11.49],[18.99,11.83],[18.99,12.17],[19.04,12.51],[19.14,12.84],[19.29,13.15],[19.48,13.44],[19.71,13.7],[19.98,13.91],[20.24,14.14],[20.47,14.39],[20.66,14.68],[20.81,14.99],[20.9,15.32],[20.95,15.66],[20.95,16.01],[20.9,16.35],[20.79,16.68],[20.64,16.99],[20.45,17.27],[20.22,17.53],[19.95,17.74],[19.65,17.92],[19.33,18.05],[19,18.13],[18.65,18.16],[18.31,18.14],[17.97,18.07],[17.65,17.95],[17.33,17.83],[16.99,17.75],[16.65,17.73],[16.3,17.76],[15.97,17.84],[15.64,17.96],[15.35,18.13],[15.07,18.35],[14.84,18.6],[14.64,18.88],[14.49,19.19],[14.39,19.52],[14.33,19.86],[14.27,20.2],[14.16,20.53],[14.01,20.84],[13.81,21.12],[13.57,21.37],[13.3,21.59],[13,21.76],[12.68,21.88],[12.34,21.96],[12,21.98],[11.66,21.96],[11.32,21.88],[11,21.76],[10.7,21.59],[10.43,21.37],[10.19,21.12],[9.99,20.84],[9.84,20.53],[9.73,20.2],[9.67,19.86],[9.62,19.52],[9.51,19.19],[9.36,18.88],[9.16,18.6],[8.93,18.35],[8.66,18.13],[8.36,17.96],[8.04,17.83],[7.7,17.76],[7.36,17.73],[7.01,17.75],[6.67,17.83],[6.35,17.95],[6.03,18.07],[5.69,18.14],[5.35,18.16],[5,18.13],[4.67,18.05],[4.35,17.92],[4.05,17.74],[3.78,17.53],[3.55,17.27],[3.36,16.99],[3.21,16.68],[3.1,16.35],[3.05,16.01],[3.05,15.66],[3.1,15.32],[3.19,14.99],[3.34,14.68],[3.53,14.39],[3.76,14.14],[4.02,13.91],[4.29,13.7],[4.52,13.44],[4.71,13.15],[4.86,12.84],[4.96,12.51],[5.01,12.17],[5.01,11.83],[4.96,11.49],[4.86,11.16],[4.71,10.84],[4.52,10.56],[4.29,10.3],[4.02,10.08],[3.76,9.86],[3.53,9.61],[3.34,9.32],[3.19,9.01],[3.1,8.68],[3.05,8.34],[3.05,7.99],[3.11,7.65],[3.21,7.32],[3.36,7.01],[3.55,6.73],[3.79,6.48],[4.05,6.26],[4.35,6.08],[4.67,5.96],[5,5.87],[5.35,5.84],[5.69,5.86],[6.03,5.93],[6.35,6.05],[6.67,6.17],[7.01,6.25],[7.35,6.27],[7.7,6.24],[8.03,6.16],[8.35,6.04],[8.65,5.86],[8.92,5.65],[9.16,5.4],[9.36,5.11],[9.51,4.81],[9.61,4.48],[9.67,4.14]],[[9,12],[9.02,12.35],[9.08,12.69],[9.18,13.03],[9.32,13.35],[9.49,13.65],[9.7,13.93],[9.94,14.18],[10.21,14.41],[10.5,14.6],[10.81,14.75],[11.14,14.87],[11.48,14.95],[11.83,14.99],[12.17,14.99],[12.52,14.95],[12.86,14.87],[13.19,14.75],[13.5,14.6],[13.79,14.41],[14.06,14.18],[14.3,13.93],[14.51,13.65],[14.68,13.35],[14.82,13.03],[14.92,12.69],[14.98,12.35],[15,12],[14.98,11.65],[14.92,11.31],[14.82,10.97],[14.68,10.65],[14.51,10.35],[14.3,10.07],[14.06,9.82],[13.79,9.59],[13.5,9.4],[13.19,9.25],[12.86,9.13],[12.52,9.05],[12.17,9.01],[11.83,9.01],[11.48,9.05],[11.14,9.13],[10.81,9.25],[10.5,9.4],[10.21,9.59],[9.94,9.82],[9.7,10.07],[9.49,10.35],[9.32,10.65],[9.18,10.97],[9.08,11.31],[9.02,11.65],[9,12]]]],
    ["tools_spray-can", [[[3,3],[3.01,3]],[[7,5],[7.01,5]],[[11,7],[11.01,7]],[[3,7],[3.01,7]],[[7,9],[7.01,9]],[[3,11],[3.01,11]],[[15,5],[19,5],[19,9],[15,9],[15,5]],[[19,9],[21,11],[21,21],[20.97,21.28],[20.87,21.53],[20.73,21.73],[20.53,21.87],[20.28,21.97],[20,22],[14,22],[13.72,21.97],[13.47,21.87],[13.27,21.73],[13.13,21.53],[13.03,21.28],[13,21],[13,11],[15,9]],[[13,14],[21,12]],[[13,19],[21,17]]]],
    ["tools_brush-cleaning", [[[16,22],[15,18]],[[19,14],[19.31,13.95],[19.59,13.81],[19.81,13.59],[19.95,13.31],[20,13],[20,12],[19.97,11.65],[19.88,11.32],[19.73,11],[19.53,10.71],[19.29,10.47],[19,10.27],[18.68,10.12],[18.35,10.03],[18,10],[15,10],[14.69,9.95],[14.41,9.81],[14.19,9.59],[14.05,9.31],[14,9],[14,4],[13.97,3.65],[13.88,3.32],[13.73,3],[13.53,2.71],[13.29,2.47],[13,2.27],[12.68,2.12],[12.35,2.03],[12,2],[11.65,2.03],[11.32,2.12],[11,2.27],[10.71,2.47],[10.47,2.71],[10.27,3],[10.12,3.32],[10.03,3.65],[10,4],[10,9],[9.95,9.31],[9.81,9.59],[9.59,9.81],[9.31,9.95],[9,10],[6,10],[5.65,10.03],[5.32,10.12],[5,10.27],[4.71,10.47],[4.47,10.71],[4.27,11],[4.12,11.32],[4.03,11.65],[4,12],[4,13],[4.05,13.31],[4.19,13.59],[4.41,13.81],[4.69,13.95],[5,14]],[[19,14],[5,14],[3.03,20.77],[3,21.07],[3.07,21.36],[3.21,21.62],[3.43,21.82],[3.7,21.96],[4,22],[20,22],[20.3,21.96],[20.57,21.82],[20.79,21.62],[20.93,21.36],[21,21.07],[20.97,20.77],[19,14]],[[8,22],[9,18]]]],
    ["tools_sparkles", [[[11.02,2.81],[11.14,2.49],[11.36,2.23],[11.66,2.06],[12,2],[12.34,2.06],[12.64,2.23],[12.86,2.49],[12.98,2.81],[14.03,8.37],[14.13,8.7],[14.27,9.01],[14.47,9.29],[14.71,9.53],[14.99,9.73],[15.3,9.87],[15.63,9.97],[21.19,11.02],[21.51,11.14],[21.77,11.36],[21.94,11.66],[22,12],[21.94,12.34],[21.77,12.64],[21.51,12.86],[21.19,12.98],[15.63,14.03],[15.3,14.13],[14.99,14.27],[14.71,14.47],[14.47,14.71],[14.27,14.99],[14.13,15.3],[14.03,15.63],[12.98,21.19],[12.86,21.51],[12.64,21.77],[12.34,21.94],[12,22],[11.66,21.94],[11.36,21.77],[11.14,21.51],[11.02,21.19],[9.97,15.63],[9.87,15.3],[9.73,14.99],[9.53,14.71],[9.29,14.47],[9.01,14.27],[8.7,14.13],[8.37,14.03],[2.81,12.98],[2.49,12.86],[2.23,12.64],[2.06,12.34],[2,12],[2.06,11.66],[2.23,11.36],[2.49,11.14],[2.81,11.02],[8.37,9.97],[8.7,9.87],[9.01,9.73],[9.29,9.53],[9.53,9.29],[9.73,9.01],[9.87,8.7],[9.97,8.37],[11.02,2.81]],[[20,2],[20,6]],[[22,4],[18,4]],[[2,20],[2.03,20.35],[2.12,20.68],[2.27,21],[2.47,21.29],[2.71,21.53],[3,21.73],[3.32,21.88],[3.65,21.97],[4,22],[4.35,21.97],[4.68,21.88],[5,21.73],[5.29,21.53],[5.53,21.29],[5.73,21],[5.88,20.68],[5.97,20.35],[6,20],[5.97,19.65],[5.88,19.32],[5.73,19],[5.53,18.71],[5.29,18.47],[5,18.27],[4.68,18.12],[4.35,18.03],[4,18],[3.65,18.03],[3.32,18.12],[3,18.27],[2.71,18.47],[2.47,18.71],[2.27,19],[2.12,19.32],[2.03,19.65],[2,20]]]],
    ["tools_paintbrush", [[[14.62,17.9],[3.94,14.98]],[[18.38,2.62],[18.63,2.41],[18.91,2.23],[19.22,2.1],[19.54,2.03],[19.88,2],[20.21,2.03],[20.53,2.1],[20.84,2.23],[21.12,2.41],[21.38,2.62],[21.59,2.88],[21.77,3.16],[21.9,3.47],[21.97,3.79],[22,4.12],[21.97,4.46],[21.9,4.78],[21.77,5.09],[21.59,5.37],[21.38,5.62],[17.36,9.64],[17.23,9.87],[17.23,10.13],[17.36,10.35],[18.3,11.29],[18.53,11.55],[18.72,11.84],[18.86,12.16],[18.95,12.49],[19,12.83],[19,13.17],[18.95,13.51],[18.86,13.84],[18.72,14.15],[18.53,14.44],[18.3,14.7],[17.36,15.65],[17.14,15.78],[16.88,15.78],[16.65,15.65],[8.35,7.35],[8.22,7.12],[8.22,6.87],[8.35,6.64],[9.3,5.7],[9.56,5.47],[9.85,5.29],[10.16,5.14],[10.49,5.05],[10.83,5],[11.17,5],[11.51,5.05],[11.84,5.14],[12.16,5.29],[12.45,5.47],[12.71,5.7],[13.65,6.64],[13.87,6.77],[14.13,6.77],[14.36,6.64],[18.38,2.62]],[[9,8],[8.77,8.33],[8.54,8.64],[8.31,8.93],[8.07,9.2],[7.82,9.45],[7.58,9.69],[7.33,9.91],[7.07,10.12],[6.81,10.31],[6.55,10.49],[6.28,10.65],[6.01,10.81],[5.74,10.95],[5.46,11.08],[5.17,11.2],[4.88,11.31],[4.59,11.41],[4.29,11.51],[3.99,11.59],[3.69,11.67],[3.38,11.75],[3.06,11.82],[2.74,11.89],[2.42,11.95],[2.18,12.06],[2.03,12.27],[2.01,12.53],[2.11,12.77],[9.44,21.65],[9.69,21.85],[9.99,21.95],[10.31,21.95],[10.62,21.85],[10.86,21.68],[11.11,21.5],[11.36,21.3],[11.62,21.08],[11.89,20.85],[12.15,20.61],[12.42,20.36],[12.69,20.1],[12.95,19.83],[13.22,19.56],[13.48,19.27],[13.73,18.99],[13.98,18.7],[14.22,18.41],[14.45,18.12],[14.67,17.83],[14.88,17.54],[15.08,17.25],[15.25,16.97],[15.42,16.69],[15.56,16.42],[15.69,16.16],[15.8,15.9],[15.89,15.66],[15.95,15.43],[15.99,15.21],[16,15]]]],
    ["tools_pipette", [[[12,9],[3.59,17.41],[3.38,17.65],[3.22,17.92],[3.1,18.21],[3.02,18.52],[3,18.83],[3,20.17],[2.98,20.48],[2.9,20.79],[2.78,21.08],[2.62,21.35],[2.41,21.59],[2.65,21.38],[2.92,21.22],[3.21,21.1],[3.52,21.02],[3.83,21],[5.17,21],[5.48,20.98],[5.79,20.9],[6.08,20.78],[6.35,20.62],[6.59,20.41],[15,12]],[[18,9],[18.4,9.4],[18.62,9.65],[18.79,9.94],[18.92,10.24],[19,10.57],[19.02,10.9],[19,11.23],[18.92,11.56],[18.79,11.86],[18.62,12.15],[18.4,12.4],[18.15,12.62],[17.86,12.79],[17.56,12.92],[17.23,13],[16.9,13.02],[16.57,13],[16.24,12.92],[15.94,12.79],[15.65,12.62],[15.4,12.4],[11.6,8.6],[11.38,8.35],[11.21,8.06],[11.08,7.76],[11,7.43],[10.98,7.1],[11,6.77],[11.08,6.44],[11.21,6.14],[11.38,5.85],[11.6,5.6],[11.85,5.38],[12.14,5.21],[12.44,5.08],[12.77,5],[13.1,4.98],[13.43,5],[13.76,5.08],[14.06,5.21],[14.35,5.38],[14.6,5.6],[15,6],[18.4,2.6],[18.65,2.38],[18.94,2.21],[19.24,2.08],[19.57,2],[19.9,1.98],[20.23,2],[20.56,2.08],[20.86,2.21],[21.15,2.38],[21.4,2.6],[21.62,2.85],[21.79,3.14],[21.92,3.44],[22,3.77],[22.02,4.1],[22,4.43],[21.92,4.76],[21.79,5.06],[21.62,5.35],[21.4,5.6],[18,9]],[[2,22],[2.41,21.59]]]],
    ["tools_magnet", [[[12,15],[16,19]],[[2.35,10.65],[2.16,10.9],[2.04,11.19],[2,11.5],[2.04,11.81],[2.16,12.1],[2.35,12.35],[4.65,14.65],[4.9,14.84],[5.19,14.96],[5.5,15],[5.81,14.96],[6.1,14.84],[6.35,14.65],[12.38,8.62],[12.63,8.4],[12.92,8.23],[13.23,8.1],[13.55,8.02],[13.88,8],[14.21,8.02],[14.54,8.1],[14.84,8.23],[15.13,8.4],[15.38,8.62],[15.6,8.87],[15.77,9.16],[15.9,9.46],[15.98,9.79],[16,10.12],[15.98,10.45],[15.9,10.77],[15.77,11.08],[15.6,11.37],[15.38,11.62],[9.35,17.65],[9.16,17.9],[9.04,18.19],[9,18.5],[9.04,18.81],[9.16,19.1],[9.35,19.35],[11.65,21.65],[11.9,21.84],[12.19,21.96],[12.5,22],[12.81,21.96],[13.1,21.84],[13.35,21.65],[19.72,15.28],[19.96,15.03],[20.19,14.77],[20.41,14.49],[20.61,14.21],[20.8,13.92],[20.98,13.62],[21.15,13.31],[21.3,13],[21.44,12.68],[21.56,12.35],[21.67,12.02],[21.76,11.68],[21.84,11.34],[21.9,11],[21.95,10.65],[21.98,10.3],[21.99,9.96],[21.99,9.61],[21.98,9.26],[21.95,8.91],[21.9,8.56],[21.84,8.22],[21.76,7.88],[21.67,7.54],[21.56,7.21],[21.44,6.89],[21.3,6.56],[21.15,6.25],[20.98,5.94],[20.8,5.64],[20.61,5.35],[20.4,5.07],[20.19,4.8],[19.96,4.53],[19.72,4.28],[19.46,4.04],[19.2,3.81],[18.93,3.59],[18.65,3.39],[18.35,3.2],[18.05,3.02],[17.75,2.85],[17.43,2.7],[17.11,2.56],[16.78,2.44],[16.45,2.33],[16.12,2.24],[15.78,2.16],[15.43,2.1],[15.09,2.05],[14.74,2.02],[14.39,2.01],[14.04,2.01],[13.69,2.02],[13.34,2.05],[13,2.1],[12.66,2.16],[12.32,2.24],[11.98,2.33],[11.65,2.44],[11.32,2.56],[11,2.7],[10.68,2.85],[10.38,3.02],[10.08,3.2],[9.79,3.39],[9.5,3.59],[9.23,3.81],[8.97,4.04],[8.72,4.28],[2.35,10.65]],[[5,8],[9,12]]]],
    ["tools_layout-grid", [[[4,3],[9,3],[9.31,3.05],[9.59,3.19],[9.81,3.41],[9.95,3.69],[10,4],[10,9],[9.95,9.31],[9.81,9.59],[9.59,9.81],[9.31,9.95],[9,10],[4,10],[3.69,9.95],[3.41,9.81],[3.19,9.59],[3.05,9.31],[3,9],[3,4],[3.05,3.69],[3.19,3.41],[3.41,3.19],[3.69,3.05],[4,3]],[[15,3],[20,3],[20.31,3.05],[20.59,3.19],[20.81,3.41],[20.95,3.69],[21,4],[21,9],[20.95,9.31],[20.81,9.59],[20.59,9.81],[20.31,9.95],[20,10],[15,10],[14.69,9.95],[14.41,9.81],[14.19,9.59],[14.05,9.31],[14,9],[14,4],[14.05,3.69],[14.19,3.41],[14.41,3.19],[14.69,3.05],[15,3]],[[15,14],[20,14],[20.31,14.05],[20.59,14.19],[20.81,14.41],[20.95,14.69],[21,15],[21,20],[20.95,20.31],[20.81,20.59],[20.59,20.81],[20.31,20.95],[20,21],[15,21],[14.69,20.95],[14.41,20.81],[14.19,20.59],[14.05,20.31],[14,20],[14,15],[14.05,14.69],[14.19,14.41],[14.41,14.19],[14.69,14.05],[15,14]],[[4,14],[9,14],[9.31,14.05],[9.59,14.19],[9.81,14.41],[9.95,14.69],[10,15],[10,20],[9.95,20.31],[9.81,20.59],[9.59,20.81],[9.31,20.95],[9,21],[4,21],[3.69,20.95],[3.41,20.81],[3.19,20.59],[3.05,20.31],[3,20],[3,15],[3.05,14.69],[3.19,14.41],[3.41,14.19],[3.69,14.05],[4,14]]]],
    ["tools_user-check", [[[16,11],[18,13],[22,9]],[[16,21],[16,19],[15.98,18.65],[15.94,18.31],[15.86,17.96],[15.76,17.63],[15.63,17.31],[15.46,17],[15.28,16.71],[15.06,16.43],[14.83,16.17],[14.57,15.94],[14.29,15.72],[14,15.54],[13.69,15.37],[13.37,15.24],[13.04,15.14],[12.69,15.06],[12.35,15.02],[12,15],[6,15],[5.65,15.02],[5.31,15.06],[4.96,15.14],[4.63,15.24],[4.31,15.37],[4,15.54],[3.71,15.72],[3.43,15.94],[3.17,16.17],[2.94,16.43],[2.72,16.71],[2.54,17],[2.37,17.31],[2.24,17.63],[2.14,17.96],[2.06,18.31],[2.02,18.65],[2,19],[2,21]],[[5,7],[5.02,7.35],[5.06,7.69],[5.14,8.04],[5.24,8.37],[5.37,8.69],[5.54,9],[5.72,9.29],[5.94,9.57],[6.17,9.83],[6.43,10.06],[6.71,10.28],[7,10.46],[7.31,10.63],[7.63,10.76],[7.96,10.86],[8.31,10.94],[8.65,10.98],[9,11],[9.35,10.98],[9.69,10.94],[10.04,10.86],[10.37,10.76],[10.69,10.63],[11,10.46],[11.29,10.28],[11.57,10.06],[11.83,9.83],[12.06,9.57],[12.28,9.29],[12.46,9],[12.63,8.69],[12.76,8.37],[12.86,8.04],[12.94,7.69],[12.98,7.35],[13,7],[12.98,6.65],[12.94,6.31],[12.86,5.96],[12.76,5.63],[12.63,5.31],[12.46,5],[12.28,4.71],[12.06,4.43],[11.83,4.17],[11.57,3.94],[11.29,3.72],[11,3.54],[10.69,3.37],[10.37,3.24],[10.04,3.14],[9.69,3.06],[9.35,3.02],[9,3],[8.65,3.02],[8.31,3.06],[7.96,3.14],[7.63,3.24],[7.31,3.37],[7,3.54],[6.71,3.72],[6.43,3.94],[6.17,4.17],[5.94,4.43],[5.72,4.71],[5.54,5],[5.37,5.31],[5.24,5.63],[5.14,5.96],[5.06,6.31],[5.02,6.65],[5,7]]]],
    ["tools_users", [[[16,21],[16,19],[15.98,18.65],[15.94,18.31],[15.86,17.96],[15.76,17.63],[15.63,17.31],[15.46,17],[15.28,16.71],[15.06,16.43],[14.83,16.17],[14.57,15.94],[14.29,15.72],[14,15.54],[13.69,15.37],[13.37,15.24],[13.04,15.14],[12.69,15.06],[12.35,15.02],[12,15],[6,15],[5.65,15.02],[5.31,15.06],[4.96,15.14],[4.63,15.24],[4.31,15.37],[4,15.54],[3.71,15.72],[3.43,15.94],[3.17,16.17],[2.94,16.43],[2.72,16.71],[2.54,17],[2.37,17.31],[2.24,17.63],[2.14,17.96],[2.06,18.31],[2.02,18.65],[2,19],[2,21]],[[16,3.13],[16.33,3.23],[16.64,3.35],[16.94,3.51],[17.23,3.68],[17.51,3.89],[17.76,4.11],[18,4.36],[18.21,4.62],[18.4,4.9],[18.57,5.2],[18.71,5.51],[18.82,5.83],[18.91,6.16],[18.96,6.49],[18.99,6.83],[18.99,7.17],[18.96,7.51],[18.91,7.84],[18.82,8.17],[18.71,8.49],[18.57,8.8],[18.4,9.1],[18.21,9.38],[18,9.64],[17.76,9.89],[17.51,10.11],[17.23,10.32],[16.94,10.49],[16.64,10.65],[16.33,10.77],[16,10.87]],[[22,21],[22,19],[21.99,18.67],[21.95,18.34],[21.88,18.02],[21.78,17.71],[21.66,17.4],[21.52,17.1],[21.35,16.82],[21.16,16.55],[20.95,16.3],[20.72,16.07],[20.47,15.85],[20.2,15.66],[19.92,15.49],[19.62,15.35],[19.32,15.23],[19,15.13]],[[5,7],[5.02,7.35],[5.06,7.69],[5.14,8.04],[5.24,8.37],[5.37,8.69],[5.54,9],[5.72,9.29],[5.94,9.57],[6.17,9.83],[6.43,10.06],[6.71,10.28],[7,10.46],[7.31,10.63],[7.63,10.76],[7.96,10.86],[8.31,10.94],[8.65,10.98],[9,11],[9.35,10.98],[9.69,10.94],[10.04,10.86],[10.37,10.76],[10.69,10.63],[11,10.46],[11.29,10.28],[11.57,10.06],[11.83,9.83],[12.06,9.57],[12.28,9.29],[12.46,9],[12.63,8.69],[12.76,8.37],[12.86,8.04],[12.94,7.69],[12.98,7.35],[13,7],[12.98,6.65],[12.94,6.31],[12.86,5.96],[12.76,5.63],[12.63,5.31],[12.46,5],[12.28,4.71],[12.06,4.43],[11.83,4.17],[11.57,3.94],[11.29,3.72],[11,3.54],[10.69,3.37],[10.37,3.24],[10.04,3.14],[9.69,3.06],[9.35,3.02],[9,3],[8.65,3.02],[8.31,3.06],[7.96,3.14],[7.63,3.24],[7.31,3.37],[7,3.54],[6.71,3.72],[6.43,3.94],[6.17,4.17],[5.94,4.43],[5.72,4.71],[5.54,5],[5.37,5.31],[5.24,5.63],[5.14,5.96],[5.06,6.31],[5.02,6.65],[5,7]]]],
    ["tools_droplet", [[[12,22],[12.34,21.99],[12.69,21.97],[13.03,21.92],[13.37,21.87],[13.7,21.79],[14.03,21.7],[14.36,21.59],[14.68,21.47],[14.99,21.33],[15.3,21.17],[15.6,21],[15.89,20.82],[16.17,20.62],[16.44,20.41],[16.7,20.19],[16.95,19.95],[17.19,19.7],[17.41,19.44],[17.62,19.17],[17.82,18.89],[18,18.6],[18.17,18.3],[18.33,17.99],[18.47,17.68],[18.59,17.36],[18.7,17.03],[18.79,16.7],[18.87,16.37],[18.92,16.03],[18.97,15.69],[18.99,15.34],[19,15],[18.99,14.7],[18.97,14.4],[18.93,14.11],[18.88,13.81],[18.81,13.52],[18.73,13.23],[18.63,12.95],[18.52,12.66],[18.39,12.38],[18.25,12.1],[18.09,11.82],[17.92,11.55],[17.73,11.28],[17.53,11.02],[17.31,10.75],[17.08,10.49],[16.83,10.24],[16.57,9.99],[16.29,9.74],[16,9.5],[15.74,9.29],[15.49,9.06],[15.24,8.83],[15,8.6],[14.77,8.35],[14.55,8.1],[14.33,7.84],[14.12,7.57],[13.91,7.3],[13.72,7.02],[13.53,6.73],[13.35,6.44],[13.18,6.15],[13.02,5.85],[12.86,5.54],[12.72,5.24],[12.59,4.92],[12.46,4.61],[12.35,4.29],[12.25,3.97],[12.15,3.65],[12.07,3.33],[12,3],[11.93,3.33],[11.85,3.65],[11.75,3.97],[11.65,4.29],[11.54,4.61],[11.41,4.92],[11.28,5.24],[11.14,5.54],[10.98,5.85],[10.82,6.15],[10.65,6.44],[10.47,6.73],[10.28,7.02],[10.09,7.3],[9.88,7.57],[9.67,7.84],[9.45,8.1],[9.23,8.35],[9,8.6],[8.76,8.83],[8.51,9.06],[8.26,9.29],[8,9.5],[7.71,9.74],[7.43,9.99],[7.17,10.24],[6.92,10.49],[6.69,10.75],[6.47,11.02],[6.27,11.28],[6.08,11.55],[5.91,11.82],[5.75,12.1],[5.61,12.38],[5.48,12.66],[5.37,12.95],[5.27,13.23],[5.19,13.52],[5.12,13.81],[5.07,14.11],[5.03,14.4],[5.01,14.7],[5,15],[5.01,15.34],[5.03,15.69],[5.08,16.03],[5.13,16.37],[5.21,16.7],[5.3,17.03],[5.41,17.36],[5.53,17.68],[5.67,17.99],[5.83,18.3],[6,18.6],[6.18,18.89],[6.38,19.17],[6.59,19.44],[6.81,19.7],[7.05,19.95],[7.3,20.19],[7.56,20.41],[7.83,20.62],[8.11,20.82],[8.4,21],[8.7,21.17],[9.01,21.33],[9.32,21.47],[9.64,21.59],[9.97,21.7],[10.3,21.79],[10.63,21.87],[10.97,21.92],[11.31,21.97],[11.66,21.99],[12,22]]]],
    ["tools_snowflake", [[[10,20],[8.75,17.5],[6,18]],[[10,4],[8.75,6.5],[6,6]],[[14,20],[15.25,17.5],[18,18]],[[14,4],[15.25,6.5],[18,6]],[[17,21],[14,15],[10,15]],[[17,3],[14,9],[15.5,12]],[[2,12],[8.5,12],[10,9]],[[20,10],[18.5,12],[20,14]],[[22,12],[15.5,12],[14,15]],[[4,10],[5.5,12],[4,14]],[[7,21],[10,15],[8.5,12]],[[7,3],[10,9],[14,9]]]]
];
// END LUCIDE DATA

// Centers the part's X/Y footprint on the origin; the underside stays on z=0 (bed contact).
module ctr() translate([-part_dims[0] / 2, -part_dims[1] / 2, 0]) children();

// ---------- main ----------
if (mode == "lid") {
    if (lid_style == "sliding") sliding_lid();
    else foot_lid();
}
else if (mode == "bin") {
    if (lip_color_enabled && bin_top > body_h) {
        // body below the lip start, and the lip (or the flat top extension) above it, as two colors
        color(plate_color) ctr() z_split(body_h, false) bin_body();
        color(lip_color) ctr() z_split(body_h, true) bin_body();
    }
    else color(plate_color) ctr() bin_body();
}
else if (mode == "baseplate") color(plate_color) ctr() baseplate_body();
