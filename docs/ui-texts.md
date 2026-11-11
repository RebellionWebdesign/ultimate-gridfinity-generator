# Texts in the user interface

One table per source file. Column "Your text" is empty: write your wording there and give the table back; the ID stays. `{…}` marks a value the app fills in (a number, a name). "Kind": `text` is shown on the page, `attribute …` is a tooltip, a hint or a label that belongs to a control, `message` is a text built in code (warnings, errors, names). Some entries from code are not shown anywhere; delete those rows.

Generated on 11 November 2026 from the source in `src/`; the static pages (privacy statement, imprint) are not included.

## src/App.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0001 | attribute aria-label | Ultimate Gridfinity Generator, home | |
| T0002 | attribute aria-label | Model name | |
| T0003 | attribute title | Rename | |
| T0004 | attribute label | Part type | |
| T0005 | attribute aria-label | Open a saved model file | |
| T0006 | attribute aria-label | Parameters | |
| T0007 | attribute aria-label | Preview | |
| T0008 | attribute aria-label | Output | |
| T0009 | attribute aria-label | Export and model file | |
| T0010 | attribute aria-label | Close | |
| T0011 | text in an expression | Enter | |
| T0012 | text in an expression | yes | |
| T0013 | text in an expression | Not saved in this browser | |
| T0014 | text in an expression | Saved in this browser | |
| T0015 | text in an expression | baseplate | |
| T0016 | text in an expression | bin | |
| T0017 | text in an expression | label | |
| T0018 | text in an expression | connector | |
| T0019 | text in an expression | lid | |
| T0020 | text in an expression | Lid | |
| T0021 | text in an expression | Set Height to ${…} | |
| T0022 | text in an expression | Lower the lid to fit | |
| T0023 | text | Skip to content | |
| T0024 | text | Open | |
| T0025 | text | Report bug | |
| T0026 | text | Export | |
| T0027 | text | Ultimate Gridfinity Generator: {…} editor | |
| T0028 | text | Version {…} | |
| T0029 | text | Licenses | |
| T0030 | text | Privacy | |
| T0031 | text | Imprint | |
| T0032 | text | Computing… {…} s | |
| T0033 | text | The preview stopped. {…} | |
| T0034 | text | Your settings are kept. Make the {…} smaller, then try again. | |
| T0035 | text | Try again | |
| T0036 | text | This {…} does not fit {…}. | |
| T0037 | text | Z check: this {…} is {…} mm tall, {…} is only {…} mm high. | |
| T0038 | text | Split into pieces that fit | |
| T0039 | text | Set Width to {…} | |
| T0040 | text | Set Height to {…} | |
| T0041 | text | Set Depth to {…} | |
| T0042 | text | Drop a saved model (.json) to open it | |

## src/export/slicer3mf.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0043 | message | <metadata key="{…}" value="{…}"/> | |
| T0044 | message | {…}\n | |
| T0045 | message | <?xml version="1.0" encoding="UTF-8"?>\n<config>\n{…}\n</config>\n | |
| T0046 | message | <?xml version="1.0" encoding="UTF-8"?>\n | |
| T0047 | message | <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n | |
| T0048 | message | <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n | |
| T0049 | message | <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>\n | |
| T0050 | message | ; const RELS = | |
| T0051 | message | <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n | |
| T0052 | message | <Relationship Target="/3D/3dmodel.model" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>\n | |

## src/export/stl.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0053 | message | Ultimate Gridfinity Generator | |

## src/export/threeMf.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0054 | message (short name) | Stacking lip | |
| T0055 | message (short name) | Text | |
| T0056 | message (short name) | Symbol | |
| T0057 | message | , symbol: | |
| T0058 | message | <m:colorgroup id="{…}"><m:color color="{…}"/></m:colorgroup> | |
| T0059 | message | <vertex x="{…}" y="{…}" z="{…}"/> | |
| T0060 | message | <triangle v1="{…}" v2="{…}" v3="{…}"/> | |
| T0061 | message | <object id="{…}" name="{…}" type="model" pid="{…}" pindex="0"> | |
| T0062 | message | <component objectid="{…}"/> | |
| T0063 | message | transform="1 0 0 0 1 0 0 0 1 {…} {…} 0" | |
| T0064 | message | {…} {…} | |
| T0065 | message | <object id="{…}" name="{…}" type="model"><components>{…}</components></object> | |
| T0066 | message | <item objectid="{…}"{…}/> | |
| T0067 | message | <?xml version="1.0" encoding="UTF-8"?> | |
| T0068 | message | <model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02"> | |
| T0069 | message | <metadata name="Title">{…}</metadata> | |
| T0070 | message | <metadata name="Application">Ultimate Gridfinity Generator</metadata> | |
| T0071 | message | <resources> {…} </resources> | |
| T0072 | message | <build>{…}</build> | |
| T0073 | message | ); }; export const modelXml = ( parts: readonly PartMesh[], colours: PartColours, title: string, bodyName = "Lid", ): string => modelXmlPieces([{ parts, name: title }], colours, title, bodyName); const CONTENT_TYPES = | |
| T0074 | message | <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n | |
| T0075 | message | <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n | |
| T0076 | message | <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>\n | |
| T0077 | message | ; const RELS = | |
| T0078 | message | <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n | |
| T0079 | message | <Relationship Target="/3D/3dmodel.model" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>\n | |
| T0080 | message | Gridfinity lid | |

## src/geometry/drawer.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0081 | message | Base {…} + bin {…} + lid {…} = {…} mm, but the drawer ({…} mm) allows {…} mm with {…} mm of room above. It does not fit like this. | |
| T0082 | message | {…} {…} | |
| T0083 | message | a bin of {…} | |
| T0084 | message | a lid of {…} | |
| T0085 | message | {…} Suggestion: {…} fits. | |
| T0086 | message | {…} Even the lowest bin and lid do not fit: choose a higher drawer or a lower baseplate. | |

## src/lib/BaseplatePanel.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0087 | attribute label | Split to fit the printer bed | |
| T0088 | attribute hint | A plate larger than the bed is cut into pieces that each fit {…}. The cuts run between the cells where possible. | |
| T0089 | attribute label | Floor | |
| T0090 | attribute label | Slots for connectors | |
| T0091 | attribute label | Corner magnets | |
| T0092 | attribute hint | Four pockets in every cell, 26 mm apart. | |
| T0093 | attribute label | Centre magnet | |
| T0094 | attribute hint | One pocket in the middle of every cell. | |
| T0095 | attribute name | Size | |
| T0096 | attribute name | Fit a drawer | |
| T0097 | attribute name | Style | |
| T0098 | attribute name | Connectable | |
| T0099 | attribute name | Magnets | |
| T0100 | attribute name | Advanced | |
| T0101 | attribute name | Colours | |
| T0102 | text in an expression | solid | |
| T0103 | text in an expression | Solid | |
| T0104 | text in an expression | skeleton | |
| T0105 | text in an expression | Skeleton | |
| T0106 | text in an expression | off | |
| T0107 | text in an expression | none | |
| T0108 | text in an expression | Off | |
| T0109 | text in an expression | edge_slot | |
| T0110 | text | Fill the bed of the chosen printer | |
| T0111 | text | Sets as many cells as fit the printer you chose under Output, at most 24 along each side. | |
| T0112 | text | {…} pieces. | |
| T0113 | text | 0 switches the width and depth off. Where the plate is smaller than the drawer, the rest is filled solid. | |
| T0114 | text | Use as many cells as fit the drawer | |
| T0115 | text | -1 puts the filler on the left (front), 1 on the right (back), 0 on both sides. | |
| T0116 | text | Solid: a closed floor under every cell. Skeleton: only a frame, which saves filament; pads stay under the magnets. | |
| T0117 | text | Cuts a slot into every edge of the plate, one for every cell along the edge, in the middle of it, {…} mm long. Two plates with the same variant are joined by a connector; make it in the Connector tab. A plate that is cut to fit the printer bed gets the slots on its cut edges too. | |
| T0118 | text | Four ribs tie the magnet's pad to the frame. | |
| T0119 | text | The base under the cells. With magnets it is raised so that 0.4 mm of material stays under each pocket: now {…}. | |

## src/lib/BinPanel.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0120 | attribute label | Height | |
| T0121 | attribute unit | × 7 mm | |
| T0122 | attribute label | Top edge | |
| T0123 | attribute label | Scoop | |
| T0124 | attribute hint | A curved ramp along the front wall, across the whole width, so small parts slide out. It rises to the lower edge of the step under the stacking lip. It ends flush with the step. In a tall bin only the piece along the wall grows. | |
| T0125 | attribute label | Divider thickness | |
| T0126 | attribute unit | mm | |
| T0127 | attribute aria-label | Remove divider {…} | |
| T0128 | attribute label | Distance from the front wall | |
| T0129 | attribute why | The divider keeps its thickness in mm of room to the back wall | |
| T0130 | attribute label | Gap between dividers | |
| T0131 | attribute why | The gap cannot be wider than the cavity | |
| T0132 | attribute label | Slots for a label | |
| T0133 | attribute label | Corner magnets | |
| T0134 | attribute hint | Pockets in the foot, in the four outermost corners of the bin. | |
| T0135 | attribute label | Centre magnet | |
| T0136 | attribute hint | One pocket in the middle of each corner foot. | |
| T0137 | attribute label | Foot | |
| T0138 | attribute label | Own colour for the stacking lip | |
| T0139 | attribute label | Stacking lip | |
| T0140 | attribute name | Size | |
| T0141 | attribute name | Walls and floor | |
| T0142 | attribute name | Dividers | |
| T0143 | attribute name | Label slots | |
| T0144 | attribute name | Magnets and foot | |
| T0145 | attribute name | Colours | |
| T0146 | text in an expression | The drawer (${…} mm) is the limit: base, bin and lid together, with 1 mm of room above | |
| T0147 | text in an expression | The build height of ${…} (${…} mm) is the limit | |
| T0148 | text in an expression | with_lip | |
| T0149 | text in an expression | flat_same_height | |
| T0150 | text in an expression | Flat | |
| T0151 | text in an expression | flat_lower | |
| T0152 | text in an expression | Flat, lower | |
| T0153 | text in an expression | on | |
| T0154 | text in an expression | off | |
| T0155 | text in an expression | divider | |
| T0156 | text in an expression | dividers | |
| T0157 | text in an expression | none | |
| T0158 | text in an expression | None | |
| T0159 | text in an expression | back | |
| T0160 | text in an expression | Back | |
| T0161 | text in an expression | front | |
| T0162 | text in an expression | Front | |
| T0163 | text in an expression | check | |
| T0164 | text in an expression | plus | |
| T0165 | text in an expression | Hide label | |
| T0166 | text in an expression | Show label | |
| T0167 | text in an expression | Solid | |
| T0168 | text in an expression | open | |
| T0169 | text in an expression | Hollow | |
| T0170 | text | The stacking lip is extra and does not count in the height. | |
| T0171 | text | Stacking lip: +4.4 mm on top, so bins stack. Flat: no lip, same total height. Flat, lower: no lip, 4.4 mm lower. | |
| T0172 | text | The floor is measured above the 4.75 mm foot. | |
| T0173 | text | Arc diameter 33.75 mm, meeting the floor 15.84 mm from the front wall. | |
| T0174 | text | The least gap between two dividers and between a divider and a wall is as large as the thickness. Dividers that would collide with a wall or with another divider are removed when you raise the thickness. | |
| T0175 | text | Divider {…} | |
| T0176 | text | {…} · {…} mm | |
| T0177 | text | Add divider | |
| T0178 | text | Remove dividers | |
| T0179 | text | No room for another divider at this thickness. | |
| T0180 | text | A divider runs across the whole width of the cavity and ends at the side walls. It is measured from the cavity floor, up to the lower edge of the step under the stacking lip at most. | |
| T0181 | text | Custom: even spacing | |
| T0182 | text | not in the standard | |
| T0183 | text | No divider fits with this gap. | |
| T0184 | text | {…} {…}, every gap {…} mm. | |
| T0185 | text | As many dividers are placed as fit with at least this gap, spread evenly, so the gap can come out a little larger, never smaller. The dividers above are replaced. | |
| T0186 | text | Place evenly | |
| T0187 | text | Two small slots in the side walls under the stacking lip, for the lugs of a label plate. Make the label in the Label tab; it takes its size from this bin. The slots need the stacking lip. | |
| T0188 | text | Shows the label in its place in the bin. Only for looking: it is not part of the bin's file. | |
| T0189 | text | Saves filament: one cut from below. A rim of the foot stays around each magnet pocket. | |
| T0190 | text | The floor is raised to {…} mm so that 0.8 mm of material stays above the tallest magnet. | |

## src/lib/ConnectorPanel.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0191 | attribute label | Variant | |
| T0192 | attribute label | One for every edge cell of the baseplate | |
| T0193 | attribute hint | A connector is plugged onto two baseplates that lie side by side, one for every cell at the edge, on every side: 2 × (width + depth) of the baseplate. | |
| T0194 | attribute label | Connectors | |
| T0195 | attribute why | 200 is the most in one file | |
| T0196 | attribute label | Connector | |
| T0197 | attribute name | How many | |
| T0198 | attribute name | Colours | |
| T0199 | text | Joins two baseplates that have the slots of the same variant ("Connectable" in the baseplate). Size {…}. The slot is {…} mm long, the connector {…} mm. Print it with the flat side down; you need one for every pair of slots you want to join. | |
| T0200 | text | Baseplate {…} × {…}: {…} connectors. | |
| T0201 | text | They lie in rows on the bed, 3 mm apart, as many in a row as fit the bed. | |

## src/lib/ConsentDialog.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0202 | text | Save in this browser? | |
| T0203 | text | The editor can keep your models in this browser (local storage) so they are still there after you reload, and it can store the app's own files so it works offline. Nothing is sent to a server. You can switch this off at any time under "In this browser"; that also removes the saved models. Without it, use Save file to keep a model. | |
| T0204 | text | Privacy statement | |
| T0205 | text | Allow | |
| T0206 | text | No thanks | |

## src/lib/DrawerHeight.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0207 | attribute label | Limit the height to the drawer | |
| T0208 | attribute hint | This limits the maximum height of the bins: base, bin and lid together must fit the drawer, with {…} mm of room above so that nothing rubs. | |
| T0209 | attribute label | Drawer height | |
| T0210 | attribute unit | mm | |
| T0211 | attribute why | 1000 mm is the largest drawer | |
| T0212 | text | Base {…} + bin {…} + lid {…} = {…} mm of {…} mm (drawer minus {…} mm). | |

## src/lib/Field.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0213 | attribute aria-label | {…} colour picker | |
| T0214 | attribute aria-label | Use {…} | |

## src/lib/HeroAnimation.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0215 | attribute aria-label | A 3 by 2 base builds up cell by cell, then bins and two lids with labels drop onto it | |
| T0216 | text in an expression | evenodd | |

## src/lib/LabelPanel.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0217 | attribute unit | mm | |
| T0218 | attribute why | Half the label is the limit. | |
| T0219 | attribute label | Wall | |
| T0220 | attribute label | Text | |
| T0221 | attribute label | Font | |
| T0222 | attribute label | Symbol | |
| T0223 | attribute label | Symbol source | |
| T0224 | attribute label | Icon | |
| T0225 | attribute label | Symbol sits | |
| T0226 | attribute label | Place text and symbol as one group | |
| T0227 | attribute label | Align in group | |
| T0228 | attribute label | Centre the group on the label | |
| T0229 | attribute label | Label | |
| T0230 | attribute hint | Black until you choose a colour. | |
| T0231 | attribute name | Label for this bin | |
| T0232 | attribute name | Position in the bin | |
| T0233 | attribute name | Depth | |
| T0234 | attribute name | Placement | |
| T0235 | attribute name | Colours | |
| T0236 | text in an expression | back | |
| T0237 | text in an expression | Back | |
| T0238 | text in an expression | front | |
| T0239 | text in an expression | Front | |
| T0240 | text in an expression | Choose a .ttf, .otf or .woff file | |
| T0241 | text in an expression | lucide | |
| T0242 | text in an expression | Built-in | |
| T0243 | text in an expression | upload | |
| T0244 | text in an expression | Your SVG | |
| T0245 | text in an expression | Drop an SVG file or choose one | |
| T0246 | text in an expression | icon_left | |
| T0247 | text in an expression | Left | |
| T0248 | text in an expression | icon_right | |
| T0249 | text in an expression | Right | |
| T0250 | text in an expression | icon_above | |
| T0251 | text in an expression | Above | |
| T0252 | text in an expression | icon_below | |
| T0253 | text in an expression | Below | |
| T0254 | text in an expression | flush | |
| T0255 | text in an expression | raised, engraved | |
| T0256 | text in an expression | as one group | |
| T0257 | text in an expression | free | |
| T0258 | text in an expression | center | |
| T0259 | text in an expression | Centre | |
| T0260 | text in an expression | start | |
| T0261 | text in an expression | Start | |
| T0262 | text in an expression | end | |
| T0263 | text in an expression | End | |
| T0264 | text | A flat plate, {…} × {…} mm and 1 mm thick, for the bin {…} × {…} × {…}. It follows the inner width of the first slope of the stacking lip and rests on it. Two lugs of 0.6 mm click into slots in the side walls. You print it apart from the bin, so a label can be changed without printing the bin again. | |
| T0265 | text | The bin gets two slots in its side walls at this wall, every dimension 0.05 mm larger than the lug so that it clicks in cleanly. Put it at the wall opposite the scoop. Back is the wall at the far side in the preview of the bin. | |
| T0266 | text | The label rests on the stacking lip. Choose the stacking lip in the bin. | |
| T0267 | text | The font is saved inside the model file. Use only fonts you may embed and print. | |
| T0268 | text | Filled shapes only. The file is read at 96 dpi (1 px = 0.265 mm), then scaled. It is saved inside the model file. Use only graphics you may print. | |

## src/lib/Landing.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0269 | attribute aria-label | Ultimate Gridfinity Generator | |
| T0270 | attribute aria-label | Page | |
| T0271 | attribute aria-label | Your bed as a square grid, and the part on it | |
| T0272 | attribute aria-label | Smaller bed | |
| T0273 | attribute aria-label | Larger bed | |
| T0274 | attribute label | Format | |
| T0275 | attribute aria-label | Top view of one cell with its four magnet pockets | |
| T0276 | attribute aria-label | Links | |
| T0277 | text in an expression | check | |
| T0278 | text in an expression | triangle-alert | |
| T0279 | text in an expression | Fits your bed | |
| T0280 | text in an expression | Too big: split it | |
| T0281 | text in an expression | 3mf | |
| T0282 | text in an expression | 3MF | |
| T0283 | text in an expression | stl | |
| T0284 | text in an expression | STL | |
| T0285 | text in an expression | grid | |
| T0286 | text in an expression | binTolerance | |
| T0287 | text in an expression | binCornerRadius | |
| T0288 | text in an expression | footRadiusBottom | |
| T0289 | text in an expression | That is how every setting behaves: the spec value is the floor. | |
| T0290 | text in an expression | Try it: drag the slider and watch the pocket and the table below follow. | |
| T0291 | text | Skip to content | |
| T0292 | text | How it works | |
| T0293 | text | The spec | |
| T0294 | text | Open editor | |
| T0295 | text | Gridfinity parts, generated in your browser. | |
| T0296 | text | Set the size in cells, add magnets, a lid label and a symbol, and download a print-ready STL or 3MF. The geometry is computed on your device; no parts or files are uploaded. | |
| T0297 | text | Open the editor | |
| T0298 | text | No account · no parts or files uploaded · offline if you allow it | |
| T0299 | text | 3 × 2 base · four bins · two lids · every part its own colour in one 3MF | |
| T0300 | text | 3 × 2 base | |
| T0301 | text | · four bins | |
| T0302 | text | · two lids | |
| T0303 | text | · every part its own colour in one 3MF | |
| T0304 | text | What it makes | |
| T0305 | text | Base, bin and lid share the same controls: size in cells, foot, magnets, colours. The drawer ties them together. | |
| T0306 | text | Set | |
| T0307 | text | Size in grid cells, then foot, lip, magnets and lid label. Each change shows up in the preview while you type. | |
| T0308 | text | Size | |
| T0309 | text | {…} × {…} cells | |
| T0310 | text | Check | |
| T0311 | text | The outer size is shown in millimetres, and the part is checked against your bed before you export. Size the bed to match your printer. | |
| T0312 | text | {…} × {…} × 5.05 mm | |
| T0313 | text | Your bed | |
| T0314 | text | mm | |
| T0315 | text | Print | |
| T0316 | text | Download STL, or 3MF with plate, text and symbol as separate coloured objects. Save the model as a file to change it later. | |
| T0317 | text | Save | |
| T0318 | text | Made to the spec | |
| T0319 | text | Every default is the Gridfinity value, and it is also the smallest you can set. You can go larger, up to a limit where the part still fits together. | |
| T0320 | text | Pocket diameter | |
| T0321 | text | {…} mm | |
| T0322 | text | {…} min | |
| T0323 | text | {…} limit | |
| T0324 | text | No cloud needed. | |
| T0325 | text | Everything runs on your device. Nothing to sign up for, no parts or files to upload; the model, the geometry and the files stay with you. | |
| T0326 | text | Source available | |
| T0327 | text | The code is public under CC BY-NC-SA 4.0. Read it, check it, report a bug. | |
| T0328 | text | View on GitHub | |
| T0329 | text | Start with a 1 × 1 lid. It takes a minute. | |
| T0330 | text | Gridfinity was created by Zack Freedman (Voidstar Lab LLC). Ultimate Gridfinity Generator is licensed CC BY-NC-SA 4.0. | |
| T0331 | text | © 2026 Daniel Stauffer · The app has no account and uploads no parts. | |
| T0332 | text | Gridfinity specification | |
| T0333 | text | Licenses | |
| T0334 | text | Privacy | |
| T0335 | text | Imprint | |

## src/lib/LicencesDialog.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0336 | attribute aria-label | Close | |
| T0337 | text in an expression | https:// | |
| T0338 | text | OSS Licenses | |
| T0339 | text | Everything below ships with the app and works offline. The links go to the official sources. | |
| T0340 | text | Component | |
| T0341 | text | Licence | |
| T0342 | text | Source | |
| T0343 | text | Font licence texts | |

## src/lib/ModelPanel.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0344 | attribute aria-label | Open a saved model file | |
| T0345 | attribute aria-label | Browser storage in use | |
| T0346 | text in an expression | baseplate | |
| T0347 | text in an expression | base | |
| T0348 | text in an expression | lid | |
| T0349 | text in an expression | download | |
| T0350 | text in an expression | Clear saved models… | |
| T0351 | text in an expression | Switch off saving… | |
| T0352 | text in an expression | Remove all saved models? | |
| T0353 | text in an expression | Switch off saving? | |
| T0354 | text in an expression | and remove the models | |
| T0355 | text | Model | |
| T0356 | text | Save file | |
| T0357 | text | Open file… | |
| T0358 | text | In this browser | |
| T0359 | text | {…} saved | |
| T0360 | text | Nothing saved in this browser yet. | |
| T0361 | text | Open | |
| T0362 | text | This browser did not allow saving here. Use Save file to keep your model. | |
| T0363 | text | The browser may clear this storage when space runs low. Save a file to keep a copy. | |
| T0364 | text | Saving in this browser is off: nothing is kept after you close the page. Use Save file to keep a model. | |
| T0365 | text | Allow saving… | |
| T0366 | text | A .json file with every setting, the text and your SVG. Open it here later to keep working. | |
| T0367 | text | {…} model{…} will be removed from this browser. You can take a ZIP file with all of them first, or remove them without a copy. | |
| T0368 | text | Switching off saving also stops the autosave and removes the offline copy of the app from this browser. You can allow it again at any time. | |
| T0369 | text | Download ZIP, then remove | |
| T0370 | text | Remove without ZIP | |
| T0371 | text | Switch off saving{…} | |
| T0372 | text | Cancel | |

## src/lib/NumberField.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0373 | attribute aria-label | Decrease {…} | |
| T0374 | attribute aria-label | Increase {…} | |
| T0375 | attribute aria-label | {…} slider | |
| T0376 | text in an expression | ${…} ${…} is the minimum${minWhy ? | |
| T0377 | text in an expression | ${…} ${…} is the limit${why ? | |
| T0378 | text in an expression | min | |
| T0379 | text | {…} limit | |
| T0380 | text | default {…} | |

## src/lib/OutputPanel.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0381 | attribute label | Bed width | |
| T0382 | attribute unit | mm | |
| T0383 | attribute why | The largest bed this app checks | |
| T0384 | attribute label | Bed depth | |
| T0385 | attribute label | Build height | |
| T0386 | attribute why | The largest build height this app checks | |
| T0387 | attribute aria-label | File format | |
| T0388 | attribute aria-label | Pieces in the file | |
| T0389 | text in an expression | Fits the bed, turned 90° | |
| T0390 | text in an expression | Fits the bed | |
| T0391 | text in an expression | Too big for this bed, also turned 90° | |
| T0392 | text in an expression | Too tall for this bed | |
| T0393 | text in an expression | Too big and too tall for this bed | |
| T0394 | text in an expression | 3mf | |
| T0395 | text in an expression | baseplate | |
| T0396 | text in an expression | The baseplate is one part with its colour. Your slicer may ask which filament the colour gets. | |
| T0397 | text in an expression | label | |
| T0398 | text in an expression | The label plate and its text stay separate parts of one object, each with its colour. Only the label is in this file; the bin is exported on its own. | |
| T0399 | text in an expression | bin | |
| T0400 | text in an expression | The bin and its stacking lip stay separate parts of one object when the lip has its own colour. Your slicer may ask which filament each colour gets. | |
| T0401 | text in an expression | Lid, text and symbol stay separate parts of one object, each with its colour. Your slicer may ask which filament each colour gets. | |
| T0402 | text in an expression | Geometry only: no colours. Plate and text are separate STL files in one ZIP, so the slicer can give each a filament. Import them together and say yes to one object with several parts; the 3MF already holds them as one object. | |
| T0403 | text in an expression | Geometry only: no colours, all parts in one file. | |
| T0404 | text in an expression | one | |
| T0405 | text in an expression | Every piece is its own object on its own plate: Bambu Studio puts them on the plates. OrcaSlicer loads them without plates: press Arrange there. | |
| T0406 | text in an expression | Every piece is its own object, one printer bed apart. In Bambu Studio press A (Arrange) to put them on plates. | |
| T0407 | text in an expression | One file per piece in a ZIP; import them one by one. | |
| T0408 | text in an expression | zip | |
| T0409 | text in an expression | Fix the size to export | |
| T0410 | text in an expression | computing | |
| T0411 | text in an expression | loader-circle | |
| T0412 | text in an expression | download | |
| T0413 | text in an expression | You choose the folder in the next step. | |
| T0414 | text in an expression | This browser saves straight to your Downloads folder; it cannot ask where. Chrome and Edge can. | |
| T0415 | text | Size | |
| T0416 | text | &nbsp;×&nbsp; | |
| T0417 | text | {…} pieces; this is the largest one. Each piece fits the printer. | |
| T0418 | text | Width × depth × height in mm, lid label included | |
| T0419 | text | Print bed for the bed check | |
| T0420 | text | Default: 256 × 256 × 256 mm. | |
| T0421 | text | Check against the bed | |
| T0422 | text | Bed check is off | |
| T0423 | text | Export | |
| T0424 | text | File name | |

## src/lib/ParamsPanel.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0425 | attribute unit | mm | |
| T0426 | attribute why | Half the lid size is the limit. | |
| T0427 | attribute label | Lid type | |
| T0428 | attribute label | Variant | |
| T0429 | attribute label | Stacking lip | |
| T0430 | attribute label | Foot | |
| T0431 | attribute label | Plate thickness | |
| T0432 | attribute label | Print orientation | |
| T0433 | attribute label | Corner magnets | |
| T0434 | attribute hint | Pockets on the top side, in the four outermost corners of the lid. A 1 × 1 lid has all four corners. | |
| T0435 | attribute label | Text | |
| T0436 | attribute label | Font | |
| T0437 | attribute label | Symbol | |
| T0438 | attribute label | Symbol source | |
| T0439 | attribute label | Icon | |
| T0440 | attribute label | Symbol sits | |
| T0441 | attribute label | Place text and symbol as one group | |
| T0442 | attribute label | Align in group | |
| T0443 | attribute label | Centre the group on the lid | |
| T0444 | attribute hint | Black until you choose a colour. | |
| T0445 | attribute label | Own colour for the stacking lip | |
| T0446 | attribute name | Size | |
| T0447 | attribute name | Shape | |
| T0448 | attribute name | Magnets and foot | |
| T0449 | attribute name | Lid label | |
| T0450 | attribute name | Placement | |
| T0451 | attribute name | Colours | |
| T0452 | text in an expression | foot | |
| T0453 | text in an expression | Sits on a foot | |
| T0454 | text in an expression | sliding | |
| T0455 | text in an expression | Slides in | |
| T0456 | text in an expression | Later | |
| T0457 | text in an expression | dust_cover | |
| T0458 | text in an expression | Dust cover | |
| T0459 | text in an expression | stackable | |
| T0460 | text in an expression | Stackable | |
| T0461 | text in an expression | full | |
| T0462 | text in an expression | All around | |
| T0463 | text in an expression | corners_only | |
| T0464 | text in an expression | Corners only | |
| T0465 | text in an expression | merged | |
| T0466 | text in an expression | Merged | |
| T0467 | text in an expression | per_cell | |
| T0468 | text in an expression | Per cell | |
| T0469 | text in an expression | auto | |
| T0470 | text in an expression | Auto | |
| T0471 | text in an expression | manual | |
| T0472 | text in an expression | Manual | |
| T0473 | text in an expression | foot_down | |
| T0474 | text in an expression | Foot down | |
| T0475 | text in an expression | upside_down | |
| T0476 | text in an expression | Upside down | |
| T0477 | text in an expression | none | |
| T0478 | text in an expression | Solid | |
| T0479 | text in an expression | open | |
| T0480 | text in an expression | Hollow | |
| T0481 | text in an expression | Choose a .ttf, .otf or .woff file | |
| T0482 | text in an expression | lucide | |
| T0483 | text in an expression | Built-in | |
| T0484 | text in an expression | upload | |
| T0485 | text in an expression | Your SVG | |
| T0486 | text in an expression | Drop an SVG file or choose one | |
| T0487 | text in an expression | icon_left | |
| T0488 | text in an expression | Left | |
| T0489 | text in an expression | icon_right | |
| T0490 | text in an expression | Right | |
| T0491 | text in an expression | icon_above | |
| T0492 | text in an expression | Above | |
| T0493 | text in an expression | icon_below | |
| T0494 | text in an expression | Below | |
| T0495 | text in an expression | as one group | |
| T0496 | text in an expression | free | |
| T0497 | text in an expression | center | |
| T0498 | text in an expression | Centre | |
| T0499 | text in an expression | start | |
| T0500 | text in an expression | Start | |
| T0501 | text in an expression | end | |
| T0502 | text in an expression | End | |
| T0503 | text | Merged: one foot under the whole lid. Per cell: one foot per cell, to close several 1 × 1 bins. | |
| T0504 | text | Auto makes the total height a multiple of 7 mm. | |
| T0505 | text | The font is saved inside the model file. Use only fonts you may embed and print. | |
| T0506 | text | Filled shapes only. The file is read at 96 dpi (1 px = 0.265 mm), then scaled. | |

## src/lib/PartDemo.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0507 | text in an expression | base | |
| T0508 | text in an expression | A baseplate of ${…} by ${…} cells | |
| T0509 | text in an expression | A bin being printed layer by layer | |
| T0510 | text in an expression | A bin that is ${…} cells wide | |
| T0511 | text in an expression | evenodd | |

## src/lib/PreviewStage.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0512 | attribute aria-label | 3D preview of the part | |
| T0513 | attribute aria-label | Preview | |
| T0514 | attribute aria-label | Isometric view (1) | |
| T0515 | attribute aria-label | Fit to view (F) | |
| T0516 | attribute aria-label | Part colours (C) | |
| T0517 | attribute aria-label | View cube: click a face, an edge or a corner, or drag to turn the view | |
| T0518 | attribute title | {…} view | |
| T0519 | text in an expression | iso | |
| T0520 | text in an expression | Show the print bed (E) | |
| T0521 | text in an expression | Endless canvas (E) | |
| T0522 | text in an expression | rectangle-horizontal | |
| T0523 | text in an expression | infinity | |
| T0524 | text | Drag to orbit · Shift-drag to pan · scroll to zoom | |

## src/lib/consent.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0525 | message | \|\| value === | |
| T0526 | message | ? value : | |

## src/lib/exporter.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0527 | message (name) | read-me.txt | |
| T0528 | message | {…} {…} of {…} | |
| T0529 | message | {…}-{…}-of-{…}.{…} | |
| T0530 | message | These STL files are the parts of ONE object (they keep their place to each other). | |
| T0531 | message | In Bambu Studio select all of them at once when you import, and answer YES to | |
| T0532 | message | 'Load as a single object with multiple parts', so that Arrange keeps them together. | |
| T0533 | message | The 3MF export holds the same parts as one object already, with their colours. | |

## src/lib/iso.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0534 | message | + points.map(([x, y]) => proj(x, y, z).join( | |
| T0535 | message | color-mix(in srgb, var(--hue), #000 {…}%) | |
| T0536 | message | color-mix(in srgb, var(--hue), #fff {…}%) | |
| T0537 | message | M{…}L{…} | |
| T0538 | message | , edge: OUTLINE, cls: cls ? `{…} line` : | |

## src/lib/parts.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0539 | message (label) | Label | |
| T0540 | message (short name) | Lid | |
| T0541 | message (short name) | Bin | |
| T0542 | message (short name) | Base | |
| T0543 | message (short name) | Connector | |

## src/lib/printers.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0544 | message (name) | Print bed | |

## src/lib/storage.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0545 | message | {…} MB of about {…} MB | |

## src/lib/store.svelte.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0546 | message (name) | Bin 1 × 1 × 3 | |
| T0547 | message (name) | Lid 1 × 1 | |
| T0548 | message (name) | Base 1 × 1 | |
| T0549 | message (name) | Label 1 × 1 | |
| T0550 | message (name) | Connector | |
| T0551 | message | your print bed | |
| T0552 | message | && this.bin.label_slot === | |
| T0553 | message | \|\| this.current === | |
| T0554 | message | Nothing to export yet | |
| T0555 | message | Fix the size to export | |
| T0556 | message | Upload an SVG file for the symbol, or choose a built-in icon. | |
| T0557 | message | Connector {…} | |
| T0558 | message | && text ? ` · {…}` : | |
| T0559 | message | Label {…} × {…}{…} | |
| T0560 | message | Bin {…} × {…} × {…} | |
| T0561 | message | Base {…} × {…}{…}{…} | |
| T0562 | message | · {…} | |
| T0563 | message | Lid {…} × {…}{…} | |

## src/lib/theme.svelte.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0564 | message | (prefers-color-scheme: dark) | |
| T0565 | message | \|\| value === | |
| T0566 | message | ? value : | |
| T0567 | message | automatic ({…}) | |
| T0568 | message | Theme: {…}. Switch to {…} | |

## src/main.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0569 | message | Missing #app element in index.html | |

## src/model/baseplateParams.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0570 | message | 24 cells are 1008 mm, a drawer of 1 m | |
| T0571 | message | 0.4 mm is the owner's smallest base (the plate is then 5.05 mm tall); 8 mm is the script's limit | |
| T0572 | message | 8.1 keeps 0.75 mm of wall at the foot edge | |
| T0573 | message | 3.9 mm is the script's limit | |
| T0574 | message | 6.1 mm like the corner pocket (owner, 3 November 2026); 10 mm is the largest the cell holds | |
| T0575 | message | 2 mm is the project's default; 5 mm is the script's limit | |
| T0576 | message | 0.1 mm is the owner's smallest clearance on the baseplate; 0.6 mm is the script's limit | |
| T0577 | message | 2 to 10 mm is the script's range | |
| T0578 | message | 0 switches it off; 1000 mm is a drawer of 1 m | |
| T0579 | message | -1 left, 0 both sides, 1 right | |
| T0580 | message | -1 front, 0 both sides, 1 back | |
| T0581 | message | {…} must be between {…} and {…}, got {…}. | |
| T0582 | message | plate_color must be a #rrggbb colour. | |

## src/model/binParams.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0583 | message | 0.8 to 1.6 mm in steps of 0.2 mm; the least gap between dividers and to the walls is the thickness | |
| T0584 | message | up to the lower edge of the step under the stacking lip, like the scoop | |
| T0585 | message | 12 cells is the script's limit | |
| T0586 | message | 85 units fill the largest build height of a custom printer (600 mm); the bed check limits it to your printer | |
| T0587 | message | 1.2 mm is the project's default; the stacking lip needs a wall below 2.6 mm | |
| T0588 | message | 0.8 mm is the project's default; 5 mm is the script's limit | |
| T0589 | message | 1.2 mm is the project's default; 3 mm is the script's limit | |
| T0590 | message | 8.1 keeps 0.75 mm of wall at the foot edge | |
| T0591 | message | 3.9 mm is the script's limit | |
| T0592 | message | 6.1 mm like the corner pocket (owner, 3 November 2026); 10 mm is the largest the foot holds | |
| T0593 | message | 2 mm is the project's default; 5 mm is the script's limit | |
| T0594 | message | 0.2 mm is the project's default; 0.6 mm is the script's limit | |
| T0595 | message | At most {…} dividers are possible, got {…}. | |
| T0596 | message | Divider {…} | |
| T0597 | message | {…} must be at least {…} mm high. | |
| T0598 | message | {…} is higher than the bin allows ({…} mm, up to the step under the stacking lip). | |
| T0599 | message | {…} needs a position. | |
| T0600 | message | {…} collides with a wall or with another divider: keep at least {…} mm of room. | |
| T0601 | message | {…} must be between {…} and {…}, got {…}. | |
| T0602 | message | {…} must be a #rrggbb colour. | |
| T0603 | message | The scoop needs a floor lower than the top of the body: lower the floor or make the bin taller. | |
| T0604 | message | && p.lip_style !== | |
| T0605 | message | A label needs the stacking lip: its plate rests on the lip. Choose the stacking lip, or switch the label slot off. | |

## src/model/connectorParams.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0606 | message | Choose a connector variant. | |
| T0607 | message | copies must be between {…} and {…}. | |
| T0608 | message | plate_color must be a #rrggbb colour. | |

## src/model/labelParams.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0609 | message (short name) | Text | |
| T0610 | message | the plate is 1 mm thick: 0.4 mm of plate stay under a flush inlay | |
| T0611 | message | {…} must be between {…} and {…}, got {…}. | |
| T0612 | message | {…} is out of range. | |
| T0613 | message | {…} must be a #rrggbb colour. | |
| T0614 | message | Text depth {…} mm is too large for a {…} mm plate: leave at least {…} mm of plate under engraved or flush text. | |
| T0615 | message | The label rests on the stacking lip of the bin. Choose the stacking lip in the bin, then the label fits. | |

## src/model/lidParams.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0616 | message (short name) | Text | |
| T0617 | message (short name) | Inter | |
| T0618 | message | IBM Plex Mono | |
| T0619 | message | IBM Plex Sans SemiBold | |
| T0620 | message | 12 cells is the script's limit | |
| T0621 | message | 2.25 mm is the usable space of the first 7 mm layer (Gridfinity spec) | |
| T0622 | message | 6 units is the script's limit | |
| T0623 | message | 8.1 keeps 0.75 mm of wall at the foot edge | |
| T0624 | message | 3.9 mm is the script's limit | |
| T0625 | message | 30 mm is the script's limit | |
| T0626 | message | 3 mm is the script's limit | |
| T0627 | message | 5 mm is the smallest label text; 30 mm is the script's limit | |
| T0628 | message | 40 mm is the script's limit | |
| T0629 | message | 10 times is the script's limit | |
| T0630 | message | 20 mm is the script's limit | |
| T0631 | message | 0.6 mm is the project's default; 2 mm is the script's limit | |
| T0632 | message | 0.4 mm is two layers; 1.2 mm is the script's limit | |
| T0633 | message | a full turn either way | |
| T0634 | message | {…} must be between {…} and {…}, got {…}. | |
| T0635 | message | {…} is out of range. | |
| T0636 | message | {…} must be a #rrggbb colour. | |
| T0637 | message | Label depth {…} mm is too large for a {…} mm plate: leave at least {…} mm of plate under engraved or flush labels. | |
| T0638 | message | && p.lip_mode === | |
| T0639 | message | corner_len must be at most half of the shorter side. | |

## src/model/modelFile.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0640 | message | IBM Plex Mono | |
| T0641 | message | IBM Plex Sans SemiBold | |
| T0642 | message | {…} is not a saved model. Open a .json file that this app saved. | |
| T0643 | message | && type !== | |
| T0644 | message | {…} is not a lid, a baseplate or a bin. Only those can be opened in this version. | |
| T0645 | message | {…} has no schema version. It cannot be opened safely. | |
| T0646 | message | {…} was saved by a newer version of the app (schema {…}). Update the app, then open it again. | |
| T0647 | message | ? migrated.svgName : | |
| T0648 | message | ? migrated.name : | |

