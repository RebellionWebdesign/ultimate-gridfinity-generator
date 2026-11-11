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
| T0158 | text in an expression | back | |
| T0159 | text in an expression | check | |
| T0160 | text in an expression | plus | |
| T0161 | text in an expression | Hide label | |
| T0162 | text in an expression | Show label | |
| T0163 | text in an expression | Solid | |
| T0164 | text in an expression | open | |
| T0165 | text in an expression | Hollow | |
| T0166 | text | The stacking lip is extra and does not count in the height. | |
| T0167 | text | Stacking lip: +4.4 mm on top, so bins stack. Flat: no lip, same total height. Flat, lower: no lip, 4.4 mm lower. | |
| T0168 | text | The floor is measured above the 4.75 mm foot. | |
| T0169 | text | Arc diameter 33.75 mm, meeting the floor 15.84 mm from the front wall. | |
| T0170 | text | The least gap between two dividers and between a divider and a wall is as large as the thickness. Dividers that would collide with a wall or with another divider are removed when you raise the thickness. | |
| T0171 | text | Divider {…} | |
| T0172 | text | {…} · {…} mm | |
| T0173 | text | Add divider | |
| T0174 | text | Remove dividers | |
| T0175 | text | No room for another divider at this thickness. | |
| T0176 | text | A divider runs across the whole width of the cavity and ends at the side walls. It is measured from the cavity floor, up to the lower edge of the step under the stacking lip at most. | |
| T0177 | text | Custom: even spacing | |
| T0178 | text | not in the standard | |
| T0179 | text | No divider fits with this gap. | |
| T0180 | text | {…} {…}, every gap {…} mm. | |
| T0181 | text | As many dividers are placed as fit with at least this gap, spread evenly, so the gap can come out a little larger, never smaller. The dividers above are replaced. | |
| T0182 | text | Place evenly | |
| T0183 | text | Two small slots in the walls next to the chosen wall, under the stacking lip, for the lugs of a label plate. On a bin that is not square the label can sit on the long or the short side; its length follows that side. Make the label in the Label tab. The slots need the stacking lip. | |
| T0184 | text | With a scoop the label sits at the wall opposite it. | |
| T0185 | text | Shows the label in its place in the bin. Only for looking: it is not part of the bin's file. | |
| T0186 | text | Saves filament: one cut from below. A rim of the foot stays around each magnet pocket. | |
| T0187 | text | The floor is raised to {…} mm so that 0.8 mm of material stays above the tallest magnet. | |

## src/lib/ConnectorPanel.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0188 | attribute label | Variant | |
| T0189 | attribute label | One for every edge cell of the baseplate | |
| T0190 | attribute hint | A connector is plugged onto two baseplates that lie side by side, one for every cell at the edge, on every side: 2 × (width + depth) of the baseplate. | |
| T0191 | attribute label | Connectors | |
| T0192 | attribute why | 200 is the most in one file | |
| T0193 | attribute label | Connector | |
| T0194 | attribute name | How many | |
| T0195 | attribute name | Colours | |
| T0196 | text | Joins two baseplates that have the slots of the same variant ("Connectable" in the baseplate). Size {…}. The slot is {…} mm long, the connector {…} mm. Print it with the flat side down; you need one for every pair of slots you want to join. | |
| T0197 | text | Baseplate {…} × {…}: {…} connectors. | |
| T0198 | text | They lie in rows on the bed, 3 mm apart, as many in a row as fit the bed. | |

## src/lib/ConsentDialog.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0199 | text | Save in this browser? | |
| T0200 | text | The editor can keep your models in this browser (local storage) so they are still there after you reload, and it can store the app's own files so it works offline. Nothing is sent to a server. You can switch this off at any time under "In this browser"; that also removes the saved models. Without it, use Save file to keep a model. | |
| T0201 | text | Privacy statement | |
| T0202 | text | Allow | |
| T0203 | text | No thanks | |

## src/lib/DrawerHeight.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0204 | attribute label | Limit the height to the drawer | |
| T0205 | attribute hint | This limits the maximum height of the bins: base, bin and lid together must fit the drawer, with {…} mm of room above so that nothing rubs. | |
| T0206 | attribute label | Drawer height | |
| T0207 | attribute unit | mm | |
| T0208 | attribute why | 1000 mm is the largest drawer | |
| T0209 | text | Base {…} + bin {…} + lid {…} = {…} mm of {…} mm (drawer minus {…} mm). | |

## src/lib/Field.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0210 | attribute aria-label | {…} colour picker | |
| T0211 | attribute aria-label | Use {…} | |

## src/lib/HeroAnimation.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0212 | attribute aria-label | A 3 by 2 base builds up cell by cell, then bins and two lids with labels drop onto it | |
| T0213 | text in an expression | evenodd | |

## src/lib/LabelPanel.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0214 | attribute unit | mm | |
| T0215 | attribute why | Half the label is the limit. | |
| T0216 | attribute label | Wall | |
| T0217 | attribute label | Text | |
| T0218 | attribute label | Font | |
| T0219 | attribute label | Symbol | |
| T0220 | attribute label | Symbol source | |
| T0221 | attribute label | Icon | |
| T0222 | attribute label | Symbol sits | |
| T0223 | attribute label | Place text and symbol as one group | |
| T0224 | attribute label | Align in group | |
| T0225 | attribute label | Centre the group on the label | |
| T0226 | attribute label | Label | |
| T0227 | attribute hint | Black until you choose a colour. | |
| T0228 | attribute name | Label for this bin | |
| T0229 | attribute name | Position in the bin | |
| T0230 | attribute name | Depth | |
| T0231 | attribute name | Placement | |
| T0232 | attribute name | Colours | |
| T0233 | text in an expression | none | |
| T0234 | text in an expression | Choose a .ttf, .otf or .woff file | |
| T0235 | text in an expression | lucide | |
| T0236 | text in an expression | Built-in | |
| T0237 | text in an expression | upload | |
| T0238 | text in an expression | Your SVG | |
| T0239 | text in an expression | Drop an SVG file or choose one | |
| T0240 | text in an expression | icon_left | |
| T0241 | text in an expression | Left | |
| T0242 | text in an expression | icon_right | |
| T0243 | text in an expression | Right | |
| T0244 | text in an expression | icon_above | |
| T0245 | text in an expression | Above | |
| T0246 | text in an expression | icon_below | |
| T0247 | text in an expression | Below | |
| T0248 | text in an expression | flush | |
| T0249 | text in an expression | raised, engraved | |
| T0250 | text in an expression | as one group | |
| T0251 | text in an expression | free | |
| T0252 | text in an expression | center | |
| T0253 | text in an expression | Centre | |
| T0254 | text in an expression | start | |
| T0255 | text in an expression | Start | |
| T0256 | text in an expression | end | |
| T0257 | text in an expression | End | |
| T0258 | text | A flat plate, {…} × {…} mm and 1 mm thick, for the bin {…} × {…} × {…}. It follows the inner width of the first slope of the stacking lip and rests on it. Two lugs of 0.6 mm click into slots in the side walls. You print it apart from the bin, so a label can be changed without printing the bin again. | |
| T0259 | text | The bin gets two slots in the walls next to this wall, every dimension 0.05 mm larger than the lug so that it clicks in cleanly. With a scoop the label sits at the wall opposite it. Back is the wall at the far side in the preview of the bin. The plate is as long as the side it sits at. | |
| T0260 | text | The label rests on the stacking lip. Choose the stacking lip in the bin. | |
| T0261 | text | The font is saved inside the model file. Use only fonts you may embed and print. | |
| T0262 | text | Filled shapes only. The file is read at 96 dpi (1 px = 0.265 mm), then scaled. It is saved inside the model file. Use only graphics you may print. | |

## src/lib/Landing.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0263 | attribute aria-label | Ultimate Gridfinity Generator | |
| T0264 | attribute aria-label | Page | |
| T0265 | attribute aria-label | Your bed as a square grid, and the part on it | |
| T0266 | attribute aria-label | Smaller bed | |
| T0267 | attribute aria-label | Larger bed | |
| T0268 | attribute label | Format | |
| T0269 | attribute aria-label | Top view of one cell with its four magnet pockets | |
| T0270 | attribute aria-label | Links | |
| T0271 | text in an expression | check | |
| T0272 | text in an expression | triangle-alert | |
| T0273 | text in an expression | Fits your bed | |
| T0274 | text in an expression | Too big: split it | |
| T0275 | text in an expression | 3mf | |
| T0276 | text in an expression | 3MF | |
| T0277 | text in an expression | stl | |
| T0278 | text in an expression | STL | |
| T0279 | text in an expression | grid | |
| T0280 | text in an expression | binTolerance | |
| T0281 | text in an expression | binCornerRadius | |
| T0282 | text in an expression | footRadiusBottom | |
| T0283 | text in an expression | That is how every setting behaves: the spec value is the floor. | |
| T0284 | text in an expression | Try it: drag the slider and watch the pocket and the table below follow. | |
| T0285 | text | Skip to content | |
| T0286 | text | How it works | |
| T0287 | text | The spec | |
| T0288 | text | Open editor | |
| T0289 | text | Gridfinity parts, generated in your browser. | |
| T0290 | text | Set the size in cells, add magnets, a lid label and a symbol, and download a print-ready STL or 3MF. The geometry is computed on your device; no parts or files are uploaded. | |
| T0291 | text | Open the editor | |
| T0292 | text | No account · no parts or files uploaded · offline if you allow it | |
| T0293 | text | 3 × 2 base · four bins · two lids · every part its own colour in one 3MF | |
| T0294 | text | 3 × 2 base | |
| T0295 | text | · four bins | |
| T0296 | text | · two lids | |
| T0297 | text | · every part its own colour in one 3MF | |
| T0298 | text | What it makes | |
| T0299 | text | Base, bin and lid share the same controls: size in cells, foot, magnets, colours. The drawer ties them together. | |
| T0300 | text | Set | |
| T0301 | text | Size in grid cells, then foot, lip, magnets and lid label. Each change shows up in the preview while you type. | |
| T0302 | text | Size | |
| T0303 | text | {…} × {…} cells | |
| T0304 | text | Check | |
| T0305 | text | The outer size is shown in millimetres, and the part is checked against your bed before you export. Size the bed to match your printer. | |
| T0306 | text | {…} × {…} × 5.05 mm | |
| T0307 | text | Your bed | |
| T0308 | text | mm | |
| T0309 | text | Print | |
| T0310 | text | Download STL, or 3MF with plate, text and symbol as separate coloured objects. Save the model as a file to change it later. | |
| T0311 | text | Save | |
| T0312 | text | Made to the spec | |
| T0313 | text | Every default is the Gridfinity value, and it is also the smallest you can set. You can go larger, up to a limit where the part still fits together. | |
| T0314 | text | Pocket diameter | |
| T0315 | text | {…} mm | |
| T0316 | text | {…} min | |
| T0317 | text | {…} limit | |
| T0318 | text | No cloud needed. | |
| T0319 | text | Everything runs on your device. Nothing to sign up for, no parts or files to upload; the model, the geometry and the files stay with you. | |
| T0320 | text | Source available | |
| T0321 | text | The code is public under CC BY-NC-SA 4.0. Read it, check it, report a bug. | |
| T0322 | text | View on GitHub | |
| T0323 | text | Start with a 1 × 1 lid. It takes a minute. | |
| T0324 | text | Gridfinity was created by Zack Freedman (Voidstar Lab LLC). Ultimate Gridfinity Generator is licensed CC BY-NC-SA 4.0. | |
| T0325 | text | © 2026 Daniel Stauffer · The app has no account and uploads no parts. | |
| T0326 | text | Gridfinity specification | |
| T0327 | text | Licenses | |
| T0328 | text | Privacy | |
| T0329 | text | Imprint | |

## src/lib/LicencesDialog.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0330 | attribute aria-label | Close | |
| T0331 | text in an expression | https:// | |
| T0332 | text | OSS Licenses | |
| T0333 | text | Everything below ships with the app and works offline. The links go to the official sources. | |
| T0334 | text | Component | |
| T0335 | text | Licence | |
| T0336 | text | Source | |
| T0337 | text | Font licence texts | |

## src/lib/ModelPanel.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0338 | attribute aria-label | Open a saved model file | |
| T0339 | attribute aria-label | Browser storage in use | |
| T0340 | text in an expression | baseplate | |
| T0341 | text in an expression | base | |
| T0342 | text in an expression | lid | |
| T0343 | text in an expression | download | |
| T0344 | text in an expression | Clear saved models… | |
| T0345 | text in an expression | Switch off saving… | |
| T0346 | text in an expression | Remove all saved models? | |
| T0347 | text in an expression | Switch off saving? | |
| T0348 | text in an expression | and remove the models | |
| T0349 | text | Model | |
| T0350 | text | Save file | |
| T0351 | text | Open file… | |
| T0352 | text | In this browser | |
| T0353 | text | {…} saved | |
| T0354 | text | Nothing saved in this browser yet. | |
| T0355 | text | Open | |
| T0356 | text | This browser did not allow saving here. Use Save file to keep your model. | |
| T0357 | text | The browser may clear this storage when space runs low. Save a file to keep a copy. | |
| T0358 | text | Saving in this browser is off: nothing is kept after you close the page. Use Save file to keep a model. | |
| T0359 | text | Allow saving… | |
| T0360 | text | A .json file with every setting, the text and your SVG. Open it here later to keep working. | |
| T0361 | text | {…} model{…} will be removed from this browser. You can take a ZIP file with all of them first, or remove them without a copy. | |
| T0362 | text | Switching off saving also stops the autosave and removes the offline copy of the app from this browser. You can allow it again at any time. | |
| T0363 | text | Download ZIP, then remove | |
| T0364 | text | Remove without ZIP | |
| T0365 | text | Switch off saving{…} | |
| T0366 | text | Cancel | |

## src/lib/NumberField.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0367 | attribute aria-label | Decrease {…} | |
| T0368 | attribute aria-label | Increase {…} | |
| T0369 | attribute aria-label | {…} slider | |
| T0370 | text in an expression | ${…} ${…} is the minimum${minWhy ? | |
| T0371 | text in an expression | ${…} ${…} is the limit${why ? | |
| T0372 | text in an expression | min | |
| T0373 | text | {…} limit | |
| T0374 | text | default {…} | |

## src/lib/OutputPanel.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0375 | attribute label | Bed width | |
| T0376 | attribute unit | mm | |
| T0377 | attribute why | The largest bed this app checks | |
| T0378 | attribute label | Bed depth | |
| T0379 | attribute label | Build height | |
| T0380 | attribute why | The largest build height this app checks | |
| T0381 | attribute aria-label | File format | |
| T0382 | attribute aria-label | Pieces in the file | |
| T0383 | text in an expression | Fits the bed, turned 90° | |
| T0384 | text in an expression | Fits the bed | |
| T0385 | text in an expression | Too big for this bed, also turned 90° | |
| T0386 | text in an expression | Too tall for this bed | |
| T0387 | text in an expression | Too big and too tall for this bed | |
| T0388 | text in an expression | 3mf | |
| T0389 | text in an expression | baseplate | |
| T0390 | text in an expression | The baseplate is one part with its colour. Your slicer may ask which filament the colour gets. | |
| T0391 | text in an expression | label | |
| T0392 | text in an expression | The label plate and its text stay separate parts of one object, each with its colour. Only the label is in this file; the bin is exported on its own. | |
| T0393 | text in an expression | bin | |
| T0394 | text in an expression | The bin and its stacking lip stay separate parts of one object when the lip has its own colour. Your slicer may ask which filament each colour gets. | |
| T0395 | text in an expression | Lid, text and symbol stay separate parts of one object, each with its colour. Your slicer may ask which filament each colour gets. | |
| T0396 | text in an expression | Geometry only: no colours. Plate and text are separate STL files in one ZIP, so the slicer can give each a filament. Import them together and say yes to one object with several parts; the 3MF already holds them as one object. | |
| T0397 | text in an expression | Geometry only: no colours, all parts in one file. | |
| T0398 | text in an expression | one | |
| T0399 | text in an expression | Every piece is its own object on its own plate: Bambu Studio puts them on the plates. OrcaSlicer loads them without plates: press Arrange there. | |
| T0400 | text in an expression | Every piece is its own object, one printer bed apart. In Bambu Studio press A (Arrange) to put them on plates. | |
| T0401 | text in an expression | One file per piece in a ZIP; import them one by one. | |
| T0402 | text in an expression | zip | |
| T0403 | text in an expression | Fix the size to export | |
| T0404 | text in an expression | computing | |
| T0405 | text in an expression | loader-circle | |
| T0406 | text in an expression | download | |
| T0407 | text in an expression | You choose the folder in the next step. | |
| T0408 | text in an expression | This browser saves straight to your Downloads folder; it cannot ask where. Chrome and Edge can. | |
| T0409 | text | Size | |
| T0410 | text | &nbsp;×&nbsp; | |
| T0411 | text | {…} pieces; this is the largest one. Each piece fits the printer. | |
| T0412 | text | Width × depth × height in mm, lid label included | |
| T0413 | text | Print bed for the bed check | |
| T0414 | text | Default: 256 × 256 × 256 mm. | |
| T0415 | text | Check against the bed | |
| T0416 | text | Bed check is off | |
| T0417 | text | Export | |
| T0418 | text | File name | |

## src/lib/ParamsPanel.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0419 | attribute unit | mm | |
| T0420 | attribute why | Half the lid size is the limit. | |
| T0421 | attribute label | Lid type | |
| T0422 | attribute label | Variant | |
| T0423 | attribute label | Stacking lip | |
| T0424 | attribute label | Foot | |
| T0425 | attribute label | Plate thickness | |
| T0426 | attribute label | Print orientation | |
| T0427 | attribute label | Corner magnets | |
| T0428 | attribute hint | Pockets on the top side, in the four outermost corners of the lid. A 1 × 1 lid has all four corners. | |
| T0429 | attribute label | Text | |
| T0430 | attribute label | Font | |
| T0431 | attribute label | Symbol | |
| T0432 | attribute label | Symbol source | |
| T0433 | attribute label | Icon | |
| T0434 | attribute label | Symbol sits | |
| T0435 | attribute label | Place text and symbol as one group | |
| T0436 | attribute label | Align in group | |
| T0437 | attribute label | Centre the group on the lid | |
| T0438 | attribute hint | Black until you choose a colour. | |
| T0439 | attribute label | Own colour for the stacking lip | |
| T0440 | attribute name | Size | |
| T0441 | attribute name | Shape | |
| T0442 | attribute name | Magnets and foot | |
| T0443 | attribute name | Lid label | |
| T0444 | attribute name | Placement | |
| T0445 | attribute name | Colours | |
| T0446 | text in an expression | foot | |
| T0447 | text in an expression | Sits on a foot | |
| T0448 | text in an expression | sliding | |
| T0449 | text in an expression | Slides in | |
| T0450 | text in an expression | Later | |
| T0451 | text in an expression | dust_cover | |
| T0452 | text in an expression | Dust cover | |
| T0453 | text in an expression | stackable | |
| T0454 | text in an expression | Stackable | |
| T0455 | text in an expression | full | |
| T0456 | text in an expression | All around | |
| T0457 | text in an expression | corners_only | |
| T0458 | text in an expression | Corners only | |
| T0459 | text in an expression | merged | |
| T0460 | text in an expression | Merged | |
| T0461 | text in an expression | per_cell | |
| T0462 | text in an expression | Per cell | |
| T0463 | text in an expression | auto | |
| T0464 | text in an expression | Auto | |
| T0465 | text in an expression | manual | |
| T0466 | text in an expression | Manual | |
| T0467 | text in an expression | foot_down | |
| T0468 | text in an expression | Foot down | |
| T0469 | text in an expression | upside_down | |
| T0470 | text in an expression | Upside down | |
| T0471 | text in an expression | none | |
| T0472 | text in an expression | Solid | |
| T0473 | text in an expression | open | |
| T0474 | text in an expression | Hollow | |
| T0475 | text in an expression | Choose a .ttf, .otf or .woff file | |
| T0476 | text in an expression | lucide | |
| T0477 | text in an expression | Built-in | |
| T0478 | text in an expression | upload | |
| T0479 | text in an expression | Your SVG | |
| T0480 | text in an expression | Drop an SVG file or choose one | |
| T0481 | text in an expression | icon_left | |
| T0482 | text in an expression | Left | |
| T0483 | text in an expression | icon_right | |
| T0484 | text in an expression | Right | |
| T0485 | text in an expression | icon_above | |
| T0486 | text in an expression | Above | |
| T0487 | text in an expression | icon_below | |
| T0488 | text in an expression | Below | |
| T0489 | text in an expression | as one group | |
| T0490 | text in an expression | free | |
| T0491 | text in an expression | center | |
| T0492 | text in an expression | Centre | |
| T0493 | text in an expression | start | |
| T0494 | text in an expression | Start | |
| T0495 | text in an expression | end | |
| T0496 | text in an expression | End | |
| T0497 | text | Merged: one foot under the whole lid. Per cell: one foot per cell, to close several 1 × 1 bins. | |
| T0498 | text | Auto makes the total height a multiple of 7 mm. | |
| T0499 | text | The font is saved inside the model file. Use only fonts you may embed and print. | |
| T0500 | text | Filled shapes only. The file is read at 96 dpi (1 px = 0.265 mm), then scaled. | |

## src/lib/PartDemo.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0501 | text in an expression | base | |
| T0502 | text in an expression | A baseplate of ${…} by ${…} cells | |
| T0503 | text in an expression | A bin being printed layer by layer | |
| T0504 | text in an expression | A bin that is ${…} cells wide | |
| T0505 | text in an expression | evenodd | |

## src/lib/PreviewStage.svelte

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0506 | attribute aria-label | 3D preview of the part | |
| T0507 | attribute aria-label | Preview | |
| T0508 | attribute aria-label | Isometric view (1) | |
| T0509 | attribute aria-label | Fit to view (F) | |
| T0510 | attribute aria-label | Part colours (C) | |
| T0511 | attribute aria-label | View cube: click a face, an edge or a corner, or drag to turn the view | |
| T0512 | attribute title | {…} view | |
| T0513 | text in an expression | iso | |
| T0514 | text in an expression | Show the print bed (E) | |
| T0515 | text in an expression | Endless canvas (E) | |
| T0516 | text in an expression | rectangle-horizontal | |
| T0517 | text in an expression | infinity | |
| T0518 | text | Drag to orbit · Shift-drag to pan · scroll to zoom | |

## src/lib/consent.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0519 | message | \|\| value === | |
| T0520 | message | ? value : | |

## src/lib/exporter.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0521 | message (name) | read-me.txt | |
| T0522 | message | {…} {…} of {…} | |
| T0523 | message | {…}-{…}-of-{…}.{…} | |
| T0524 | message | These STL files are the parts of ONE object (they keep their place to each other). | |
| T0525 | message | In Bambu Studio select all of them at once when you import, and answer YES to | |
| T0526 | message | 'Load as a single object with multiple parts', so that Arrange keeps them together. | |
| T0527 | message | The 3MF export holds the same parts as one object already, with their colours. | |

## src/lib/iso.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0528 | message | + points.map(([x, y]) => proj(x, y, z).join( | |
| T0529 | message | color-mix(in srgb, var(--hue), #000 {…}%) | |
| T0530 | message | color-mix(in srgb, var(--hue), #fff {…}%) | |
| T0531 | message | M{…}L{…} | |
| T0532 | message | , edge: OUTLINE, cls: cls ? `{…} line` : | |

## src/lib/parts.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0533 | message (label) | Label | |
| T0534 | message (short name) | Lid | |
| T0535 | message (short name) | Bin | |
| T0536 | message (short name) | Base | |
| T0537 | message (short name) | Connector | |

## src/lib/printers.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0538 | message (name) | Print bed | |

## src/lib/storage.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0539 | message | {…} MB of about {…} MB | |

## src/lib/store.svelte.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0540 | message (name) | Bin 1 × 1 × 3 | |
| T0541 | message (name) | Lid 1 × 1 | |
| T0542 | message (name) | Base 1 × 1 | |
| T0543 | message (name) | Label 1 × 1 | |
| T0544 | message (name) | Connector | |
| T0545 | message | your print bed | |
| T0546 | message | && this.bin.label_slot === | |
| T0547 | message | \|\| this.current === | |
| T0548 | message | Nothing to export yet | |
| T0549 | message | Fix the size to export | |
| T0550 | message | Upload an SVG file for the symbol, or choose a built-in icon. | |
| T0551 | message | Connector {…} | |
| T0552 | message | && text ? ` · {…}` : | |
| T0553 | message | Label {…} × {…}{…} | |
| T0554 | message | Bin {…} × {…} × {…} | |
| T0555 | message | Base {…} × {…}{…}{…} | |
| T0556 | message | · {…} | |
| T0557 | message | Lid {…} × {…}{…} | |

## src/lib/theme.svelte.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0558 | message | (prefers-color-scheme: dark) | |
| T0559 | message | \|\| value === | |
| T0560 | message | ? value : | |
| T0561 | message | automatic ({…}) | |
| T0562 | message | Theme: {…}. Switch to {…} | |

## src/main.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0563 | message | Missing #app element in index.html | |

## src/model/baseplateParams.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0564 | message | 24 cells are 1008 mm, a drawer of 1 m | |
| T0565 | message | 0.4 mm is the owner's smallest base (the plate is then 5.05 mm tall); 8 mm is the script's limit | |
| T0566 | message | 8.1 keeps 0.75 mm of wall at the foot edge | |
| T0567 | message | 3.9 mm is the script's limit | |
| T0568 | message | 6.1 mm like the corner pocket (owner, 3 November 2026); 10 mm is the largest the cell holds | |
| T0569 | message | 2 mm is the project's default; 5 mm is the script's limit | |
| T0570 | message | 0.1 mm is the owner's smallest clearance on the baseplate; 0.6 mm is the script's limit | |
| T0571 | message | 2 to 10 mm is the script's range | |
| T0572 | message | 0 switches it off; 1000 mm is a drawer of 1 m | |
| T0573 | message | -1 left, 0 both sides, 1 right | |
| T0574 | message | -1 front, 0 both sides, 1 back | |
| T0575 | message | {…} must be between {…} and {…}, got {…}. | |
| T0576 | message | plate_color must be a #rrggbb colour. | |

## src/model/binParams.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0577 | message (label) | None | |
| T0578 | message | 0.8 to 1.6 mm in steps of 0.2 mm; the least gap between dividers and to the walls is the thickness | |
| T0579 | message | up to the lower edge of the step under the stacking lip, like the scoop | |
| T0580 | message | 12 cells is the script's limit | |
| T0581 | message | 85 units fill the largest build height of a custom printer (600 mm); the bed check limits it to your printer | |
| T0582 | message | 1.2 mm is the project's default; the stacking lip needs a wall below 2.6 mm | |
| T0583 | message | 0.8 mm is the project's default; 5 mm is the script's limit | |
| T0584 | message | 1.2 mm is the project's default; 3 mm is the script's limit | |
| T0585 | message | 8.1 keeps 0.75 mm of wall at the foot edge | |
| T0586 | message | 3.9 mm is the script's limit | |
| T0587 | message | 6.1 mm like the corner pocket (owner, 3 November 2026); 10 mm is the largest the foot holds | |
| T0588 | message | 2 mm is the project's default; 5 mm is the script's limit | |
| T0589 | message | 0.2 mm is the project's default; 0.6 mm is the script's limit | |
| T0590 | message | \|\| p.label_slot === | |
| T0591 | message | With a scoop the label sits opposite it | |
| T0592 | message | At most {…} dividers are possible, got {…}. | |
| T0593 | message | Divider {…} | |
| T0594 | message | {…} must be at least {…} mm high. | |
| T0595 | message | {…} is higher than the bin allows ({…} mm, up to the step under the stacking lip). | |
| T0596 | message | {…} needs a position. | |
| T0597 | message | {…} collides with a wall or with another divider: keep at least {…} mm of room. | |
| T0598 | message | {…} must be between {…} and {…}, got {…}. | |
| T0599 | message | {…} must be a #rrggbb colour. | |
| T0600 | message | The scoop needs a floor lower than the top of the body: lower the floor or make the bin taller. | |
| T0601 | message | && p.lip_style !== | |
| T0602 | message | A label needs the stacking lip: its plate rests on the lip. Choose the stacking lip, or switch the label slot off. | |

## src/model/connectorParams.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0603 | message | Choose a connector variant. | |
| T0604 | message | copies must be between {…} and {…}. | |
| T0605 | message | plate_color must be a #rrggbb colour. | |

## src/model/labelParams.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0606 | message (short name) | Text | |
| T0607 | message | the plate is 1 mm thick: 0.4 mm of plate stay under a flush inlay | |
| T0608 | message | {…} must be between {…} and {…}, got {…}. | |
| T0609 | message | {…} is out of range. | |
| T0610 | message | {…} must be a #rrggbb colour. | |
| T0611 | message | Text depth {…} mm is too large for a {…} mm plate: leave at least {…} mm of plate under engraved or flush text. | |
| T0612 | message | The label rests on the stacking lip of the bin. Choose the stacking lip in the bin, then the label fits. | |

## src/model/lidParams.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0613 | message (short name) | Text | |
| T0614 | message (short name) | Inter | |
| T0615 | message | IBM Plex Mono | |
| T0616 | message | IBM Plex Sans SemiBold | |
| T0617 | message | 12 cells is the script's limit | |
| T0618 | message | 2.25 mm is the usable space of the first 7 mm layer (Gridfinity spec) | |
| T0619 | message | 6 units is the script's limit | |
| T0620 | message | 8.1 keeps 0.75 mm of wall at the foot edge | |
| T0621 | message | 3.9 mm is the script's limit | |
| T0622 | message | 30 mm is the script's limit | |
| T0623 | message | 3 mm is the script's limit | |
| T0624 | message | 5 mm is the smallest label text; 30 mm is the script's limit | |
| T0625 | message | 40 mm is the script's limit | |
| T0626 | message | 10 times is the script's limit | |
| T0627 | message | 20 mm is the script's limit | |
| T0628 | message | 0.6 mm is the project's default; 2 mm is the script's limit | |
| T0629 | message | 0.4 mm is two layers; 1.2 mm is the script's limit | |
| T0630 | message | a full turn either way | |
| T0631 | message | {…} must be between {…} and {…}, got {…}. | |
| T0632 | message | {…} is out of range. | |
| T0633 | message | {…} must be a #rrggbb colour. | |
| T0634 | message | Label depth {…} mm is too large for a {…} mm plate: leave at least {…} mm of plate under engraved or flush labels. | |
| T0635 | message | && p.lip_mode === | |
| T0636 | message | corner_len must be at most half of the shorter side. | |

## src/model/modelFile.ts

| ID | Kind | Current text | Your text |
|---|---|---|---|
| T0637 | message | IBM Plex Mono | |
| T0638 | message | IBM Plex Sans SemiBold | |
| T0639 | message | {…} is not a saved model. Open a .json file that this app saved. | |
| T0640 | message | && type !== | |
| T0641 | message | {…} is not a lid, a baseplate or a bin. Only those can be opened in this version. | |
| T0642 | message | {…} has no schema version. It cannot be opened safely. | |
| T0643 | message | {…} was saved by a newer version of the app (schema {…}). Update the app, then open it again. | |
| T0644 | message | ? migrated.svgName : | |
| T0645 | message | ? migrated.name : | |

