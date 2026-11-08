# UI specification

Status: decided in the design process (Claude Design canvas "Ultimate Gridfinity Generator UI") and approved by the owner on 2 November 2026. Look, tokens and layout values: `brand.md`. This file says what is where and how it behaves. Open points: `brand.md` section 8.

Handoff: the canvas holds every screen and state as artboards, the stylesheet `project/system.css` (port 1:1) and the parameter definitions per part type in `project/Params.dc.html` (`defs()`, the data source for section 8). The artboards are mockups, not code to copy; build the Svelte components listed in section 9.

Images of the artboards (WebP, lossy, 1× scale) are in `docs/design/mockups/`. Names follow `<screen>-<device>-<theme>-<state>.webp`:
- Foundations and components: `foundations.webp`, `components-light.webp`, `components-dark.webp`.
- Landing: `landing-desktop-light.webp`, `landing-desktop-dark.webp`, `landing-phone-light.webp`, `landing-phone-dark.webp`, `landing-oss-licenses-dialog-dark.webp`; `landing-desktop-dark_changes.webp` marks the changes the owner wanted (4 November 2026).
- Editor, desktop: `editor-desktop-light-ready.webp`, `editor-desktop-dark-ready.webp`, `editor-desktop-light-empty.webp`, `editor-desktop-dark-computing.webp`, `editor-desktop-light-error-bed-check.webp`.
- Editor, phone: `editor-phone-light-ready.webp`, `editor-phone-dark-ready.webp`, `editor-phone-light-export-sheet-no-picker.webp`, `editor-phone-dark-computing.webp`, `editor-phone-dark-error-worker.webp`.
- Parts: `params-lid.webp`, `output-column.webp`, `preview-lid-drawing.webp`.
Exported: every artboard of the canvas except the Bin and Baseplate parameter sets, which stay in the canvas as later work (first version: lid only). The canvas is the source; when it changes, the images are exported again. Fonts in the images are Inter and IBM Plex Mono (latin subset).

## 1. Design language
See `brand.md`. Regions are separated by hairlines; one accent; Lucide icons; Inter for words, IBM Plex Mono for numbers.

## 2. Screens and layout
**Landing page (owner, 4 November 2026: dropped on 2 November, then wanted again).** The app has two screens: the landing page (address without a hash, or `#how`, `#spec`) and the editor (`#/editor`). The editor loads only when it is opened, so the landing page does not pull in the geometry kernel. The logo in the editor links to the landing page, and the installed app starts in the editor (`start_url` `./#/editor`). Changes to the first mockups are in `landing-desktop-dark_changes.webp`.

### 2.1 Landing page
Content column max 1160 px, gutter 32 px (16 px on phones). Sections are separated by a hairline and padded 64 px top and bottom (48 px on phones). Order:
1. Header, 56 px: logo mark + name, navigation (How it works, The spec; hidden below 960 px; no Licenses link, owner 6 November 2026: a modal "About" follows after the deploy, see the roadmap), light/dark toggle, primary button "Open editor".
2. Hero: two columns (text 1fr, picture 1.15fr, gap 48), one column below 960 px. Display title, lead text, primary CTA "Open the editor" and a quiet "How it works", a mono line "No account · nothing uploaded · works offline". Picture (owner, 4 November 2026; as the background of the hero, large and without a box, 6 November 2026; the drop has no overshoot, so a part never sinks into another): a looping isometric animation in the same style: a 3 × 2 base builds up cell by cell, bins drop into it and two lids with labels land on top. The parts are drawn from the real Gridfinity dimensions (foot profile, baseplate pockets, stacking lip, wall) and the colours of the editor; it stands still, finished, with reduced motion. Caption in mono below. The mono line under the title is gone from the picture: the words "3 × 2 base · four bins · two lids · every part its own colour in one 3MF" stand beside the animation, turned 90 degrees to the left so they read from the right, and appear one part at a time with the animation (owner, 6 November 2026; below 960 px they lie horizontally under the text).
3. What it makes: eight boxes in two rows of four, divided by hairlines (owner, 6 November 2026): Base, Bin, Lid, Fill a drawer, Split to fit your bed, Height that fits, Exportable colours, Base connectors. Every box has a line drawing in the style of the Base, Bin and Lid drawings, 120 × 80 px; on hover the drawing turns to the accent colour and moves a little (parts lift, move apart or come together; none with reduced motion). The "Soon" tag (connectors are not built yet) is in the accent colour.
4. How it works (surface background): Set, Check, Print as three cards with a step number; each holds a small working control (cell stepper, readout pill that follows it and checks the 256 mm P2S bed, 3MF/STL choice + Save). The Check card (owner, 6 November 2026) has no printer model: a small square grid is the visitor's own bed, sized with a stepper in mm (100 to 400, in steps of 20), the part is drawn on it, and the verdict reads "Fits your bed" or "Too big: split it". Set holds a square baseplate that grows with a slider (1 × 1 up to 7 × 7 cells, one more than the 6 × 6 of a 256 mm bed); the Check card measures the same plate (n × 42 mm, 5.05 mm high) against the visitor's bed, so 6 × 6 fits and 7 × 7 reads "Too big: split it", Print a bin that is printed layer by layer with a nozzle on a bed (still and finished with reduced motion); both are drawn like the hero (`iso.ts`, `PartDemo.svelte`), so the three cards look alike (owner, 6 November 2026).
5. Made to the spec (owner, 6 November 2026): one box. At the start the top view of one cell with its four pockets; beside it, in the top row the text and an invitation to try it ("Try it: drag the slider ...", which changes after the first touch), below that the working slider for the magnet pocket (6.1 up to the limit 8.1); under both, in the same box, the spec table in two columns (grid 42, height unit 7, outer size n × 42 − 0.5, foot 4.75, stacking lip 4.4, magnet pocket, wall at the foot edge, screw hole 3.0 Ø). Moving the slider changes the pocket row and the wall row, which light up.
6. No cloud needed (owner, 6 November 2026; it was "Yours, on your device"; the wording is open for brainstorming): four cards with Lucide icons (`laptop`, `wifi-off`, `file`) and the chips outlined in the accent colour, the last card "Source available" with the logo of the page in the accent colour (owner, 8 November 2026, instead of the GitHub mark) and the button "View on GitHub". The Gridfinity specification link points to https://gridfinity.xyz/specification/ (owner, 8 November 2026).
7. Closing line with "Open the editor".
8. Footer: Gridfinity credit and licence as text; the last line holds two links, right-aligned: Gridfinity specification and Licenses (no link to the repository, it is the last card above; owner, 6 November 2026). The header navigation says "Licenses" as well.

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
Source: the reference script `reference/gridfinity_generator.scad`; minimum = default per `skills/gridfinity-spec/SKILL.md`; limits from the script ranges. Text height: default and minimum 5.0, limit 30 (owner, 2 November 2026). The Lid and the Baseplate are built; the Bin is being built (see below). Groups in order:
- Lid: Size (width, depth in cells) · Shape (lid type, variant, stacking lip, corner piece length, foot layout, plate thickness auto/manual, total height or plate, print orientation) · Magnets and foot (corner magnets on the top side in the four outermost corners with diameter 6.1–8.1 and depth 2.1–3.9, foot solid/hollow, hollow-foot wall 1.2–3; no centre magnet on a lid) · Label (text mode, text, font, text height, symbol mode, source, icon or SVG, SVG scale, symbol size, symbol position, raised height/engraved depth 0.6–2, flush inlay 0.4–1.2) · Placement (group, align, gap, offsets, rotations) · Colours (plate, text, symbol, stacking lip).
- Bin (first part built 3 November 2026: Size, Top edge, Walls and floor, Magnets, Colours; height up to the printer's build height (limit 85 units), owner 3 November 2026; hollow foot as on the lid, no screw holes in bins, owner 3 November 2026): Size (width, depth, height in 7 mm units) · Top edge (stacking lip / flat / flat lower, groove for a sliding lid) · Walls and floor (wall 1.2–2.5, floor 0.8–5) · Magnets and foot (as lid but the corner pockets sit in the foot, plus the centre magnet with diameter 6.1–10, thickness 2.0–5, clearance 0.2–0.6 and only a 1.2 mm rim, no ribs; large bins: corner and centre magnets only in the corner feet; foot open / closed / pads, skin 0.8–2) · Sliding lid (clearance 0.3–0.8, finger recess) · Colours.
- Baseplate: Size (width, depth, a button that fills the bed) · Style (solid / skeleton) · Magnets (corner pockets 6.1–8.1 × 2.1–3.9 in every cell; centre magnet 6.1–10 × 2–5 with clearance 0.1–0.6, owner 3 November 2026; in the skeleton style always four ribs of 2–10 mm under the centre magnet, no option to leave them out, owner 3 November 2026) · Advanced (solid base 0.4–8, raised automatically so 0.4 mm stays under each pocket) · Colours. Built 3 November 2026. Fit a drawer (built 3 November 2026, group "Fit a drawer" after Size): drawer width and depth in mm (0 = off, up to 600), where the filler goes −1…1 per axis (shown only when there is filler), and a button that sets as many whole cells as fit the drawer; where the plate is smaller than the drawer, the rest is solid to the full height. Drawer width and depth go up to 1000 mm. The switch "Split to fit the printer bed" cuts a plate that is larger than the bed into pieces that each fit it (cuts between the cells where possible); the preview shows the pieces moved apart without a bed, the readout says "N baseplates · up to X × Y × Z mm each", and the export is one file with every piece as its own object, one printer bed apart (switch "One file / ZIP of files"; the ZIP has one file per piece) (owner, 3 November 2026).
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
- The preview floor is the print bed of the chosen printer (owner, 2 November 2026; the bed is always dark, in light and dark mode): a rectangle of the printable area centred on the origin, with the 42 mm grid through the origin inside it (the area some printers keep free is not drawn, owner 2 November 2026: fill, hatching and outline all looked like a glitch; the bed check still honours it and the alert names it) (front left on P1P, P1S, X1, X1C, X1E). The P2S plate is drawn with its real outline: rounded corners, a handle tab at the back and a lip at the front (measured from the owner's picture, about 1 mm accurate; the printable area stays the rectangle). Every printer with a 256 x 256 mm bed (P2S, P1S, P1P, X1, X1C, X1E, A1, X2D) shows this plate; H2D, H2D Pro, H2C, H2S and A2L share one plate (350 x 320 mm body, tabs at the back corners, two lips at the front, from the owner's picture); the H3C (330 × 320 × 325 mm, owner, 3 November 2026) has its own, the printable area as body with two back tabs and two front lips (measured from the owner's picture); the A1 mini has its own (two back tabs, one front lip). The printer list has an entry "Custom size": the user types the side of a square bed (50 to 600 mm) and the build height (20 to 600 mm); it is drawn as a square with rounded corners. No logos or printer branding. With the bed check off the floor is the plain grid.
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
- Version and saved models (owner, 3 November 2026): the version of `package.json` (0.2.0 with the baseplate) shows at the bottom of the left panel. "In this browser" is a closed-by-default group like the parameter groups, with a bar under its title for how full the browser storage is (an estimate: about 5 MB for localStorage). Clearing the saved models opens a dialog: download a ZIP and then remove, remove without a ZIP, or cancel.
- Warning band on the print bed (owner, 3 November 2026): when a part does not fit the chosen bed (also turned by 90°, or too tall), the same red bars as the label margin run as a band of 6 mm all around the bed, just outside its edge, on every printer.
- Viewport, support and licences (owner, 3 November 2026): the floor (bed, grid, bars) is drawn first and never takes part in the depth test, so it cannot flicker through the part when zoomed out; zooming out stops at 1.6 times the distance that fits the part or the bed. The "Licenses" link sits at the bottom of the left panel next to the version; the "Support" button to Ko-fi in the top bar was removed on 8 November 2026 (the owner: for now). The bed warning of a baseplate offers "Split into pieces that fit"; the switch "Split to fit the printer bed" is the first control of "Fit a drawer". The drawer height (mm, 0 = off) sits in the Size group of the lid and the bin and in "Fit a drawer"; it is one value for all three parts, saved in the model file, and limits the height of bins and lids (owner, 3 November 2026).
- Theme (owner, 6 November 2026): the switch in the header of the landing page and the editor goes round three modes: automatic (follows the system and changes with it while the page is open; the icon is a monitor), light (sun), dark (moon). Automatic is the default and is not stored; light and dark are stored in this browser. The tooltip and the screen reader label say which mode it is in and what it switches to.
- Saving in this browser (owner, 8 November 2026): nothing of the editor is read from or written to the browser's storage, and no service worker runs, until the user allows it. On the first visit to the editor a dialog asks "Save in this browser?" (Allow / No thanks; Escape counts as No thanks); only the choice itself is stored (`ugg.consent`). With "Allow" the models are autosaved (`ugg.models`) and the service worker is registered, so the app works offline. With "No thanks" the header says "Not saved in this browser", the "In this browser" group says saving is off and offers "Allow saving…", and a worker or cache from an earlier visit is removed at every start. The dialog "Remove all saved models?" has a third action, "Switch off saving and remove the models" (without models: "Switch off saving?"): it removes the models, stops the autosave and removes the worker and its cache. The left panel's footer links Licenses, Privacy and Imprint; the landing page footer links the same two pages, in English (owner, 8 November 2026; the legal pages themselves open in German or English with a switch at the top). The pages are static, in German (`datenschutz.html`, `impressum.html`) and English (`privacy.html`, `imprint.html`), with the text written into them (see the README), each with a language switch at the top; the consent dialog links the English privacy page. The English texts are translations and say so; the German text is the binding one.
