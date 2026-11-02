# UI specification

Status: decided in the design process (Claude Design canvas "Ultimate Gridfinity Generator UI") and approved by the owner on 2 November 2026. Look, tokens and layout values: `brand.md`. This file says what is where and how it behaves. Open points: `brand.md` section 8.

Handoff: the canvas holds every screen and state as artboards, the stylesheet `project/system.css` (port 1:1) and the parameter definitions per part type in `project/Params.dc.html` (`defs()`, the data source for section 8). The artboards are mockups, not code to copy; build the Svelte components listed in section 9.

Images of the artboards (WebP, lossy, 1× scale) are in `docs/design/mockups/`. Names follow `<screen>-<device>-<theme>-<state>.webp`:
- Foundations and components: `foundations.webp`, `components-light.webp`, `components-dark.webp`.
- Landing: `landing-desktop-light.webp`, `landing-desktop-dark.webp`, `landing-phone-light.webp`, `landing-phone-dark.webp`, `landing-oss-licenses-dialog-dark.webp`.
- Editor, desktop: `editor-desktop-light-ready.webp`, `editor-desktop-dark-ready.webp`, `editor-desktop-light-empty.webp`, `editor-desktop-dark-computing.webp`, `editor-desktop-light-error-bed-check.webp`.
- Editor, phone: `editor-phone-light-ready.webp`, `editor-phone-dark-ready.webp`, `editor-phone-light-export-sheet-no-picker.webp`, `editor-phone-dark-computing.webp`, `editor-phone-dark-error-worker.webp`.
- Parts: `params-lid.webp`, `output-column.webp`, `preview-lid-drawing.webp`.
Exported: every artboard of the canvas except the Bin and Baseplate parameter sets, which stay in the canvas as later work (first version: lid only). The canvas is the source; when it changes, the images are exported again. Fonts in the images are Inter and IBM Plex Mono (latin subset).

## 1. Design language
See `brand.md`. Regions are separated by hairlines; one accent; Lucide icons; Inter for words, IBM Plex Mono for numbers.

## 2. Screens and layout
**Dropped (owner, 2 November 2026): the landing page.** The built app has one screen, the editor; the "OSS Licenses" dialog lives in the editor. Section 2.1 and the landing images are kept only as design record and are not built.

### 2.1 Landing page (dropped, not built)
Content column max 1160 px, gutter 32 px (16 px on phones). Sections are separated by a hairline and padded 64 px top and bottom (48 px on phones). Order:
1. Header, 56 px: logo mark + name, navigation (How it works, The spec, OSS Licenses; hidden below 960 px), light/dark toggle, primary button "Open editor".
2. Hero: two columns (text 1fr, picture 1.15fr, gap 48), one column below 960 px. Display title, lead text, primary CTA "Open the editor" and a quiet "How it works", a mono line "No account · nothing uploaded · works offline". Picture: the lid preview with the label lifted off the plate (plate, text, symbol as three 3MF objects), in a frame with radius 12, caption in mono below. Padding 64 top, 96 bottom (48 / 48 on phones).
3. What it makes: three columns divided by hairlines, 32 px on both sides of each divider; Lid ("First"), Bin and Baseplate ("Next"), each with its line drawing, heading, status tag and one sentence.
4. How it works (surface background): Set, Check, Print, each with a small real component as illustration (stepper, readout pill, format choice + button).
5. Made to the spec: text left with a sample rail (min / limit), spec table right (grid 42, height unit 7, outer size n × 42 − 0.5, foot 4.75, stacking lip 4.4, magnet pocket 6.1 Ø × 2.1, screw hole 3.0 Ø).
6. Yours, on your device (surface background): three facts with Lucide icons (`laptop`, `wifi-off`, `file`).
7. Closing line with "Open the editor".
8. Footer: Gridfinity credit with link to the specification, licence, OSS Licenses, source repository.

### 2.2 Editor
Grid of two rows: top bar (56 px) and the main area.

Desktop (from 1200 px), three columns:
| Region | Width | Content |
|---|---|---|
| Parameters | 340 px | Disclosure groups for the active part type (section 8), closed by default, scrolls on its own |
| Preview | rest | 3D preview with overlays (section 3.2) |
| Output | 340 px | Size, bed check, export, model file (section 5) |

- 720 to 1200 px: parameters 320 px and preview; the output column is hidden and an "Export" button in the top bar opens it as a popover.
- Below 720 px (phone): top bar; preview on top (42 % of the height); parameters below (58 %) with a tab strip of groups (one group visible at a time); Export opens a bottom sheet with the output content.

Top bar, left to right: logo (link to the landing page), model name (click to rename) with save state below, part type switch (segmented Base / Bin / Lid (owner, 2 November 2026: the order of building, plate first, lid last; the label says "Base" for the baseplate), 296 px, centred; on phones a select; in the first version only Lid is active, Bin and Baseplate are disabled and labelled "Later"), then light/dark toggle, Open, and Export where the output column is hidden.

Part type switch: changes the parameter set and the preview; each part type keeps its own values while the session lasts. First version (owner, 2 November 2026): only the lid options are shown and built; Bin and Baseplate are enabled one feature at a time after the owner has tested the previous one.

## 3. Interactions

### 3.1 Editing parameters
- Numbers: NumberField = stepper (− value unit +) plus a range rail below its right half, with the scale "min · default · limit" under the rail (section 4a).
- 2 to 4 choices: segmented control. More, or long labels: select.
- On/off: switch at the right end of the label row.
- Text: text field. Colour: colour field with popover (presets, hex input, system picker). SVG: file drop.
- Dependent fields appear only when they apply (e.g. Stacking lip only for Stackable; centre magnet size only with a centre magnet). Groups that do not apply are hidden.
- Collapsed groups show a one-line summary of their values in mono on the right.
- Every change goes to the worker at once (debounced only while dragging the rail). The preview keeps the previous mesh until the new one is ready, then crossfades (200 ms).

### 3.2 Preview
- Overlays, 16 px from the edges: top left the readout pill (part, size in mm), top right the status pill (Up to date / Computing… with elapsed time / Needs a fix). Bottom centre the floating toolbar. Bottom right on desktop a camera hint.
- Toolbar: Fit to view, view presets Iso / Top / Front / Under, floor grid on/off, part colours on/off.
- Camera: drag to orbit, Shift-drag or two fingers to pan, wheel or pinch to zoom, double-click to fit. View presets animate (240 ms; none with reduced motion).
- The floor shows the 42 mm grid. The model has a 1.5 px black outline (`--part-edge`).

### 3.3 Keyboard
Tab order: top bar, parameters top to bottom, preview toolbar, output. Shortcuts (never while a text field has focus): F fit, 1–4 view presets, G grid, C part colours, Ctrl/⌘ E export, Ctrl/⌘ S save model file, Ctrl/⌘ O open model file, Ctrl/⌘ ↓ next group. In a NumberField: ↑ ↓ one step, Shift ten steps; on the rail ← → one step, Home minimum, End limit; Enter commits a typed value.

## 4. Parameters not part of the Gridfinity spec
No badge or label marks parameters outside the Gridfinity spec (owner, 2 November 2026: the tag was dropped). The groups Label and Placement and single values such as wall and corner length are project parameters; this document and `skills/gridfinity-spec/SKILL.md` list which they are.

## 4a. Minimum, default and limit
- The rail scale shows "6.1 min" on the left and "8.1 limit" on the right; when the default is above the minimum, "default 8.0" in the middle.
- The minus button is disabled at the minimum, the plus button at the limit; the tooltip says why ("6.1 mm is the minimum (Gridfinity spec)").
- Typed values are rounded to the step and clamped on Enter or blur. A note below the field says what changed (see `brand.md` section 7) and stays until the next edit. A value below the minimum never reaches the model or the worker, not even briefly.
- Text that is not a number: the field border turns `--error`, the message "Enter a number between … and …" appears, the last valid value stays in the model.
- A reset chip (`rotate-ccw` + default value) appears on the label row when the value differs from the default.

## 5. Export and save
Output column (or phone sheet), three sections separated by hairlines, each padded 20 px with 12 px between elements:
1. Size: readout W × D × H in mm (label included), printer select for the bed check (from the script's printer list), status "Fits the bed" or "Too big for this bed, also turned 90°".
2. Export: format STL / 3MF (segmented), note for the chosen format (3MF: plate, text and symbol stay separate objects with colours; STL: geometry only), file name field with fixed extension, primary button.
   - With `showSaveFilePicker` (Chrome, Edge): "Save 3MF…", the browser asks for the folder.
   - Without (Firefox, Safari): "Download 3MF" via `<a download>`, note "This browser saves straight to your Downloads folder; it cannot ask where. Chrome and Edge can."
   - While the worker computes: disabled "Computing…" with spinner. When there is no model or an error: disabled, the label says why ("Nothing to export yet", "Fix the size to export").
3. Model: "Save file" (.json with every setting, the text and the SVG) and "Open file…"; list "In this browser" (auto-saved models with name and date, Open per row); note that the browser may clear this storage.
A model .json can also be dropped anywhere on the editor.

## 6. Empty, loading and error states
- Empty (first start, no model): parameters column shows "No part yet" with a hint; preview shows the `grid-2x2` icon, "Start with a lid", size buttons 1 × 1 / 2 × 2 / 3 × 2 and "Open a saved model…"; export disabled; the browser list says "Nothing saved in this browser yet."
- Computing: a 2 px progress bar sweeps along the top edge of the preview (after 150 ms), the old mesh is dimmed to 45 % opacity, status pill "Computing…" with elapsed time, export disabled.
- Error in a value combination (e.g. bed check): alert floating over the preview 64 px from the top (max 520 px wide) with what happened, the numbers and two fixes as buttons; the affected field shows the message too; export disabled.
- Worker error: alert centred in the preview, settings kept, "Try again".
- Warning (e.g. bed check switched off): warning alert (`--warning-soft`, icon `--warning`).
Every message: what happened, then how to fix it (`brand.md` section 7).

## 7. Accessibility and responsiveness
- Contrast: text at least 4.5:1 in both themes (`brand.md` section 3). Status always icon plus words.
- Keyboard: everything reachable and operable; focus visible as a 2 px `--focus` outline with 2 px offset.
- Real controls only: `<button>`, `<a href>`, `<input>` with `<label>`; switches are checkboxes with `role="switch"`; segmented controls use `aria-pressed`; group headers `aria-expanded`; status pill `aria-live="polite"`; alerts `role="alert"`; sheets and dialogs `aria-modal`.
- Touch: with `pointer: coarse` every control is at least 44 px.
- Reduced motion respected (`brand.md` section 5).
- Works from 320 px width up; breakpoints 720 / 960 / 1200 px.

## 8. Parameter sets per part type
Source: the reference script `reference/gridfinity_generator.scad`; minimum = default per `skills/gridfinity-spec/SKILL.md`; limits from the script ranges. Text height: default and minimum 5.0, limit 30 (owner, 2 November 2026). First version: Lid only; the Bin and Baseplate sets below are later work. Groups in order:
- Lid: Size (width, depth in cells) · Shape (lid type, variant, stacking lip, corner piece length, foot layout, plate thickness auto/manual, total height or plate, print orientation) · Magnets and foot (corner magnets on the top side in the four outermost corners with diameter 6.1–8.1 and depth 2.1–3.9, foot solid/hollow, hollow-foot wall 1.2–3; no centre magnet on a lid) · Label (text mode, text, font, text height, symbol mode, source, icon or SVG, SVG scale, symbol size, symbol position, raised height/engraved depth 0.6–2, flush inlay 0.4–1.2) · Placement (group, align, gap, offsets, rotations) · Colours (plate, text, symbol, stacking lip).
- Bin (later): Size (width, depth, height in 7 mm units) · Top edge (stacking lip / flat / flat lower, groove for a sliding lid) · Walls and floor (wall 1.2–2.5, floor 0.8–5) · Magnets and foot (as lid but the corner pockets sit in the foot, plus the centre magnet with diameter 5.0–10, thickness 2.0–5, clearance 0.2–0.6 and only a 1.2 mm rim, no ribs; large bins: corner and centre magnets only in the corner feet; foot open / closed / pads, skin 0.8–2) · Sliding lid (clearance 0.3–0.8, finger recess) · Colours.
- Baseplate (later): Size (width, depth, fit the bed) · Style (solid / skeleton) · Fit a drawer (minimum width and depth in mm, where the extra goes −1…1) · Magnets · Advanced (solid base 0.35–8) · Colours.
Printer and bed check sit in the output column, not in the parameters.

## 8b. Changes made in the built editor (owner, 2 November 2026)
The images in `docs/design/mockups/` predate these changes; where they differ, this list wins (`params-lid.webp` still shows the Screw holes switch, the "not part of the spec" tags and the Advanced group).
- No screw holes on lids. No tag for parameters outside the spec. No `flush_gap` and no Advanced group on the lid.
- Parameter groups are closed by default.
- Font "Other": the user uploads a font file (.ttf, .otf, .woff, up to 2 MB); it is stored in the model file.
- Printer list and bed check from the official Bambu Studio machine profiles (including the keep-out zone where a printer has one); the alert offers "Set Width to N", "Set Depth to N" and "Turn the bed check off".
- Status pill: only "Computing…" (after 150 ms, the preview dims at the same time) and "Needs a fix".
- "In this browser": button "Download as ZIP and clear".
- Colour picker names the part ("Lid", "Bin", "Base"); header says "Base" instead of "Baseplate".
- Report-bug button (links to the repository's issues), thin scrollbars from tokens, camera animation of the views in 240 ms (instant with reduced motion).
- PWA icon and favicon have a transparent background; the SVG favicon follows light and dark mode; no maskable icon.
- Label edge margin (owner, 2 November 2026): text and symbol keep 3 mm from the lid edge on every side. When a label comes closer, a warning alert (`--warning-soft`) over the preview and a note in the Label group name the text or the symbol and suggest a shorter word, a smaller size, a larger lid or moving it (engraved text also: Raised or Flush). The strip between the edge and the margin is drawn on the plate as diagonal bars (about 1.8 mm wide, alternating `#84161C` and `#3F0709`, owner colours), following the rounded lid corners, only while a label crosses it. The warning measures against the same rounded free area. The lid is still built; Engraved stays.
- The preview floor is the print bed of the chosen printer (owner, 2 November 2026): a rectangle of the printable area centred on the origin, with the 42 mm grid through the origin inside it and a marked rectangle for the area a printer keeps free (front left on P1P, P1S, X1, X1C, X1E). The P2S plate is drawn with its real outline: rounded corners, a handle tab at the back and a lip at the front (measured from the owner's picture, about 1 mm accurate; the printable area stays the rectangle). Every printer with a 256 x 256 mm bed (P2S, P1S, P1P, X1, X1C, X1E, A1, X2D) shows this plate; other sizes show a plain rectangle until their plate shape is added. The printer list has an entry "Custom size": the user types the side of a square bed (50 to 600 mm) and the build height (20 to 600 mm); it is drawn as a square with rounded corners. No logos or printer branding. With the bed check off the floor is the plain grid.
- The phone layout with group tabs waits until after deployment (issue 7).

## 9. Components (Svelte)
| Component | Props / states |
|---|---|
| `NumberField` | label, value, min (= default from the spec), def, limit, step, unit, why (limit reason); states: at min, changed (reset chip), clamped note, invalid, focus, disabled |
| `RangeRail` | min, max, step, value; fill in `--accent` up to the value; scale min · default · limit |
| `Segmented` | options, value, disabled options with tooltip; arrow keys move the choice |
| `Switch` | checked, label; `role="switch"` |
| `Select`, `TextField` | `.field` style, 36 px |
| `ColorField` | value, presets, hex input, system picker; popover |
| `FileDrop` | accept; states idle, drag over, loaded (file name, Replace), error |
| `ParamGroup` | name, summary, open (closed by default); disclosure on desktop, tab on phones |
| `Button` | primary, secondary, quiet, icon, small, large; disabled, busy |
| `ExportPanel` | format, file name, picker available or not, state (ready, computing, blocked) |
| `ModelList` | saved models in the browser, Open per row |
| `PreviewStage` | mesh, colours, grid, view, dim while computing |
| `PreviewToolbar` | fit, view presets, grid, part colours |
| `StatusPill`, `ReadoutPill` | ready / computing / needs a fix; size text |
| `Alert` (error, warning), `Note`, `FieldMessage`, `Toast` | text, icon, actions |
| `Sheet`, `Dialog` | modal, scrim, close button, focus trap |
| `ThemeToggle` | light / dark / follow system |
