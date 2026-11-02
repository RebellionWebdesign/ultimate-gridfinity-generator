# Brand and visual design

Status: decided in the design process (Claude Design canvas "Ultimate Gridfinity Generator UI") and approved by the owner on 2 November 2026. Implementing agents use these values as written; a change needs the owner. Open points are listed in section 8.

The values below are the contents of `project/system.css` in the design canvas. That stylesheet is the one place where colour, type, space, size, radius, depth and motion are defined; port it unchanged into the app's global stylesheet and let components use the tokens only. No component defines its own colour, size or duration.

## 1. Personality
Calm, precise, quietly pleasant. Between Extrudo (too playful) and SolidCraft (a bit too sober).
- Colour is used with restraint: neutral graphite and paper, one accent. The user's part colours are the loudest thing on screen.
- Regions are separated by hairlines, not by cards. No gradients, glows, coloured icon sets or decorative illustration.
- Fun comes from interaction quality: direct feedback, short motion, controls that respond to touch.
- Not wanted: a navy or slate-blue background, a saturated blue or amber accent, multicoloured icons, stock rounded cards with shadows (these are what the reference screenshots share; see `references/`).

## 2. Name, logo, app icon
- Name: Ultimate Gridfinity Generator.
- Logo mark (approved): a rounded square divided into a 2 × 2 grid, the top-right cell filled with the accent. Stroke in `--text`, fill in `--accent`. Drawn in a 40 × 40 viewBox (stroke 2.5 at 40 px and above, 3 at 24 px). The mark is the only hand-drawn graphic besides the part drawings.
- PWA icon and favicon: the mark on a transparent background (owner, 2 November 2026). The SVG favicon follows the light or dark scheme (`--text` strokes, `--accent` cell); the PNG icons use mid-tone colours (`#6B6E66` strokes, `#8FAA2A` cell) that read on light and dark launchers. No maskable icon (it needs an opaque background).

## 3. Colour tokens
Light and dark are both complete. The app follows `prefers-color-scheme`; a toggle in the header overrides it (`data-theme="light|dark"` on the root, remembered per browser).

| Token | Role | Light | Dark |
|---|---|---|---|
| `--bg` | App and page background | `#F4F4F1` | `#111210` |
| `--surface` | Panels, sheets, top bar | `#FFFFFF` | `#191A18` |
| `--surface-2` | Fields, segmented track, hover | `#EDEDE9` | `#222320` |
| `--surface-3` | Hover on fields | `#E3E3DE` | `#2B2C29` |
| `--seg-on` | Selected segment | `#FFFFFF` | `#363833` |
| `--line` | Hairlines | `#E0E0DA` | `#2C2D2A` |
| `--line-strong` | Control borders, rail track | `#C4C4BC` | `#43453F` |
| `--text` | Primary text, values | `#161715` | `#ECEDE8` |
| `--text-2` | Secondary text | `#4E514B` | `#B3B5AD` |
| `--text-3` | Hints, min/limit scale, units | `#63665F` | `#8F928A` |
| `--accent` | Primary button, rail fill, switch on | `#4A6600` | `#C2DB57` |
| `--accent-hover` | Hover on primary | `#3C5400` | `#D2E873` |
| `--accent-ink` | Text on accent | `#FFFFFF` | `#151A02` |
| `--accent-soft` | Drop target, selected row | `#E8EED2` | `#283013` |
| `--focus` | Focus ring | `#4A6600` | `#C2DB57` |
| `--error` | Error text and icon | `#B3261E` | `#FF8B7C` |
| `--error-soft` | Error background | `#FBECE9` | `#361C18` |
| `--error-line` | Error border | `#EBC2BC` | `#5C2C25` |
| `--warning` | Warning icon | `#855700` | `#E6B357` |
| `--warning-soft` | Warning background | `#F6EEDC` | `#31280F` |
| `--success` | Done, fits the bed (= accent) | `#4A6600` | `#C2DB57` |
| `--stage` | 3D preview background | `#EAEAE5` | `#151614` |
| `--stage-grid` | 42 mm floor grid | `#DADAD3` | `#232421` |
| `--part-plate` | Preview default, plate | `#9DA39A` | `#9DA39A` |
| `--part-text` | Preview default, text (black placeholder until the user chooses a colour) | `#000000` | `#000000` |
| `--part-symbol` | Preview default, symbol (follows the text colour) | `#000000` | `#000000` |
| `--part-edge` | Model outline in the preview, 1.5 px | `#000000` | `#000000` |
| `--shadow-float` | Floating elements | `0 1px 2px rgba(22,23,21,.06), 0 8px 24px rgba(22,23,21,.08)` | `0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.45)` |
| `--shadow-seg` | Selected segment, slider thumb, switch knob | `0 1px 2px rgba(22,23,21,.10)` | `0 1px 2px rgba(0,0,0,.5)` |
| `--scrim` | Behind sheets and dialogs | `rgba(22,23,21,.32)` | `rgba(0,0,0,.56)` |

Rules:
- Contrast: every text token reaches at least 4.5:1 on `--bg`, `--surface` and `--surface-2` (lowest pair: `--text-3` on `--surface-2`, 4.9:1).
- Status never relies on colour alone: always an icon and words.
- The accent is used only for the primary action of a region, the rail fill, a switch that is on, focus and success. Nowhere else.
- Part colours are the user's; they are not contrast-checked.

## 4. Typography
Inter for text, IBM Plex Mono for every number, unit, dimension and file name. Self-hosted woff2 with licence texts (no CDN). Weights in use: Inter 400, 500, 600; Plex Mono 400, 500. Numbers use `font-variant-numeric: tabular-nums`. Decimal point, unit `mm`, a space before the unit.

| Class | Font | Size / line height | Weight | Use |
|---|---|---|---|---|
| `t-display` | Inter | 56/60, phone 36/40, tracking −2.8% | 600 | Landing hero only |
| `t-title` | Inter | 32/40, phone 24/32, tracking −2% | 600 | Section titles |
| `t-heading` | Inter | 20/28, tracking −1% | 600 | Sub-headings, sheet and dialog titles |
| `t-lead` | Inter | 17/28 | 400 | Landing paragraphs |
| `t-body` | Inter | 14/20 | 400 | Default UI text |
| `t-strong` | Inter | 14/20 | 600 | Group headers, model name, emphasis |
| `t-label` | Inter | 13/20 | 500 | Field labels, buttons small |
| `t-caption` | Inter | 12/16 | 400 | Hints, notes, messages |
| `n` | Plex Mono | 14/20 | 500 | Values in fields, tables |
| `n-l` | Plex Mono | 20/24 | 500 | Size readout |
| `n-s` | Plex Mono | 12/16 | 400 | File names, dates, readout pill |
| `.scale` | Plex Mono | 11/16 | 400 | Min / default / limit under a rail |

Still to check on the bundled files: the glyphs × Ø ° − in both fonts.

## 5. Space, size, radius, depth, motion

### Grid rule
Every length is a multiple of 4 px. Exceptions: 1 px hairlines and borders, the 2 px inset (segmented control, focus outline offset, progress bar). An inner radius equals the outer radius minus the inset.

### Spacing tokens
| Token | px | Typical use |
|---|---|---|
| `--space-0` | 2 | Inset of the segmented control, outline offset |
| `--space-1` | 4 | Icon to text in tight places, gap label → field |
| `--space-2` | 8 | Gap inside a control or a parameter row, between buttons |
| `--space-3` | 12 | Gap between elements in a panel section, row padding top/bottom |
| `--space-4` | 16 | Distance of floating elements from the preview edge, alert padding |
| `--space-5` | 20 | Side padding of every panel (parameters, output, sheets) |
| `--space-6` | 24 | Gap between blocks inside a hero or sheet bottom padding |
| `--space-7` | 32 | Page gutter desktop, gap between landing columns, gap section title → content |
| `--space-8` | 48 | Hero column gap, section padding on phones |
| `--space-9` | 64 | Section padding desktop, dialog top offset |
| `--space-10` | 96 | Hero bottom padding desktop |

Rhythm, from small to large: inside a control 8 → between controls 12 → between blocks 24 → title to content 32 → between sections 64 (48 on phones).

### Size tokens
| Token | px | Use |
|---|---|---|
| `--size-control-sm` | 32 | Small buttons |
| `--size-control` | 36 | Fields, selects, stepper, segmented control, toolbar buttons |
| `--size-button` | 40 | Buttons, colour field, toast |
| `--size-touch` | 44 | Minimum hit size with `pointer: coarse`; every control grows to it |
| `--size-button-lg` | 48 | Primary export button, landing CTAs |
| `--size-row` | 48 | Group headers, list rows |
| `--size-header` | 56 | Site header and editor top bar |
| `--size-icon-sm` / `--size-icon` / `--size-icon-lg` | 16 / 20 / 24 | Icons in small controls / buttons / feature lists |
| `--page-max` | 1160 | Max content width of the landing page |
| `--col-params` | 340 (320 below 1200 px) | Editor parameter column |
| `--col-output` | 296 | Editor output column |

### Radius
`--radius-tag` 4 (tags, swatches, kbd), `--radius-control` 8 (fields, buttons), `--radius-panel` 12 (toolbar, dialog, sheet top, preview frame), `--radius-round` 999 (switch, slider thumb, pills, dots). No cards.

### Depth
Two levels. Level 0: flat, separated by `--line`. Level 1: `--shadow-float`, only for things floating over other content (preview toolbar, toast, alerts over the preview, sheets, dialogs, popovers).

### Motion
| Token | Duration | Use |
|---|---|---|
| `--dur-press` | 90 ms | Button scale to .97, stepper button .92, slider thumb 1.25 |
| `--dur-state` | 160 ms | Hover, selected segment, colour changes, rail fill |
| `--dur-preview` | 200 ms | New mesh crossfades over the old one; the old one stays until the new one is ready |
| `--dur-move` | 240 ms | Disclosure chevron, switch knob, sheet and dialog, camera to a view preset |
| sweep | 1.1 s loop | Progress bar while the worker computes; shown only after 150 ms |

One easing for everything: `--ease: cubic-bezier(.2, .8, .2, 1)`. With `prefers-reduced-motion: reduce` all durations are 0, sweep and spinner stop, the camera never moves by itself.

### Breakpoints
Fixed values (CSS variables cannot be used in media queries):
- 1200 px: below it the editor's output column is hidden; an Export button appears in the top bar.
- 960 px: the landing page goes to one column; header navigation is hidden.
- 720 px: phone. Editor stacks (preview above, parameters below with group tabs, export as a bottom sheet); display and title type get smaller; page gutter 16 px; section padding 48 px.

## 6. Icons
Lucide, package `lucide-static` (ISC licence, https://github.com/lucide-icons/lucide), version 1.66.0 in the design. Paths unchanged, 24 px grid, stroke 2, round caps and joins, `currentColor`, never multicoloured. Drawn at 16, 20 or 24 px (size tokens). Icon-only buttons carry an `aria-label` and a tooltip. No hand-drawn icons; only the part drawings (lid, bin, baseplate) and the logo mark are our own.

Icons in use: `download`, `upload`, `save`, `file`, `folder-open`, `minus`, `plus`, `rotate-ccw`, `chevron-right`, `maximize`, `grid-2x2`, `palette`, `triangle-alert`, `info`, `check`, `x`, `arrow-right`, `loader-circle`, `sun`, `moon`, `laptop`, `wifi-off`. Lucide must be added to the OSS licence list (`skills/licences-and-credits/SKILL.md`).

## 7. Voice
Interface language English. Short, plain, no exclamation marks, no jokes. Say what happened, then how to fix it. Numbers with units and a decimal point.

Examples:
- Clamped value: "Raised to 6.1 mm, the minimum. Smaller breaks the Gridfinity fit." / "Lowered to 8.1 mm, the limit. 8.1 keeps 0.75 mm of wall at the foot edge."
- Invalid input: "Enter a number between 6.1 and 8.1."
- Bed check: "This lid does not fit the P2S bed. The lid is 293.5 × 41.5 mm, the bed 256 × 256 mm, also when turned 90°. Set Width to 6 cells or fewer, or pick a larger printer."
- Worker: "The preview stopped. The geometry worker ran out of memory on this device. Your settings are kept. Turn off Hollow foot or make the lid smaller, then try again."
- SVG: "logo.svg has no closed shapes. Only outlines can be extruded. Convert strokes to paths in your vector editor, then upload the file again."
- No save picker: "This browser saves straight to your Downloads folder; it cannot ask where. Chrome and Edge can."

## 8. Open points (owner)
1. Decided (owner, 2 November 2026): `text_size` default 5 and minimum 5 (owner, 2 November 2026; it was 8 and too large for words like ENGRAVED). Still open: script defaults above their minimum: `icon_size` 14 (min 4), `label_gap` 3 (min 0), `symbol_scale` 1 (min 0.05), bin `height_units` 3 (min 1). Decided (owner, 2 November 2026): these defaults stay.
2. Signed values (offsets, rotations, `fit_x`, `fit_y`): the min = default rule cannot apply. Offsets have no limit in the script; ± half the lid size stays (owner, 2 November 2026).
3. Decided (owner, 2 November 2026): until the user chooses a colour, the parts stay Stone `#9DA39A`; the text is black as a placeholder (instead of `#F7F7F3`).
4. A separate symbol colour does not exist in the script (one `text_color` for text and symbol).
5. Plate thickness default: Auto (spec) versus Manual (script).
6. Decided (owner, 2 November 2026): the first version shows only the lid options; Bin and Baseplate stay disabled in the part switcher, labelled "Later", until their feature is built. The logo is approved.
