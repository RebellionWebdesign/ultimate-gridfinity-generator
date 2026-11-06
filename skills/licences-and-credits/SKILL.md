---
name: licences-and-credits
description: Use when adding a dependency, font, asset or library, changing the project licence, or writing credits and notices.
---

# Licences and credits

Source: spec section 5. This is not legal advice.

## Facts from the spec
- Gridfinity was originally CC BY-NC-SA 4.0 and was, according to several sources, later changed by Zack Freedman to **MIT**. His files state "Copyright (c) 2023 Zachary Freedman and Voidstar Lab LLC". The Design Reference v5 sheet still says CC BY-NC-SA.
- MIT allows use, modification, distribution and sale but requires the copyright and licence notice in all copies or substantial parts (in the `.scad` file header and in the MakerWorld description).
- A forum post says MIT grants more rights than MakerWorld's "Standard Digital File License", which may collide. That is a forum opinion, not a statement from MakerWorld.
- Checked 2 November 2026 in the original sources: the Printables page of the Gridfinity specification states MIT; gridfinity-rebuilt-openscad says "licensed under the same license as Gridfinity, being a MIT License". Zack Freedman's announcement of the change is only documented through a video and a GitHub issue (kennetek/gridfinity-rebuilt-openscad #96). No licence text or written addendum from him was found.
- The reference drawings in `reference/gridfinity-reference-drawings/` are by Stu142 (repository Stu142/Gridfinity-Documentation) and are, according to that repository's LICENSE file, **CC BY-NC-SA 4.0** (attribution, non-commercial, share-alike). They stay in the repository as reference for agents. Keep the author and licence note next to them; do not adapt or republish them as part of a product.
- The project's own licence is **CC BY-NC-SA 4.0** (owner decision, 2 November 2026). Reason: the source is open to read, third parties must not sell the software, only the owner may exploit it commercially (the licensor may sell their own work). Notes: Creative Commons itself advises against CC licences for software, and NC licences are not "open source" in the OSI sense. Open: whether the licence covers files the app outputs, how contributions by others are handled. Do not add a `LICENSE` file; ask the owner first.

## Libraries (spec)
| Library | Licence |
|---|---|
| gridfinity-rebuilt-openscad | MIT |
| OpenSCAD itself | GPL (an embedded WASM build would put the whole app under GPL) |
| brepkit | AGPL-3.0 or commercial from 3.0.0 (MIT/Apache up to 2.129.x) |
| Manifold | Apache-2.0 |
| opentype.js | MIT |

## Fonts (spec 7.3)
- Host font files locally; do not load them from a Google CDN. The Regional Court Munich I (LG München I, 20.01.2022, 3 O 17493/20) ruled the dynamic embedding of Google Fonts without consent unlawful (damages EUR 100). Locally hosted fonts are not affected. This is not legal advice. It also fits the offline PWA.
- Current fonts (owner decision, 2 November 2026): Inter for text and IBM Plex Mono for numbers in the app. IBM Plex Sans (SemiBold) is only a script option for the lid text. Inter: SIL Open Font License 1.1, "Copyright (c) 2016 The Inter Project Authors" (LICENSE.txt in rsms/inter). IBM Plex: OFL-1.1 according to the IBM/plex repository page; that page does not list the weights, so check that SemiBold of Plex Sans is in the files you bundle. Bundle the font files with their licence texts.
- The lid-text font should be a Google Font installed on MakerWorld, so the `.scad` and the web app match (font list: "Font Index" in the unofficial PMM docs).

## OSS licence list (shown in the app on the "OSS Licenses" page)
The app shows a page that links to the official sites; this table is the source for it. Keep it complete: every bundled font and runtime package. Check the licence in the official repository when adding a row.

| Component | Licence | Official source |
|---|---|---|
| Inter | SIL OFL 1.1 | https://github.com/rsms/inter |
| IBM Plex (Mono; Sans only if bundled) | OFL-1.1 | https://github.com/IBM/plex |
| Manifold | Apache-2.0 | https://github.com/elalish/manifold |
| opentype.js | MIT | https://github.com/opentypejs/opentype.js |
| Lucide (interface icons, `lucide-static`; the reference script also bundles Lucide symbols) | ISC (icons derived from Feather: MIT) | https://github.com/lucide-icons/lucide |
| Octicons (only the GitHub mark on the landing page, inline SVG path; the logo itself is GitHub's trademark, used as a link to the repository, owner's wish of 6 November 2026) | MIT | https://github.com/primer/octicons |
| Svelte | MIT (checked in `node_modules/svelte/package.json`, 2 November 2026) | https://github.com/sveltejs/svelte |
| three.js | MIT (checked in the package, 2 November 2026) | https://github.com/mrdoob/three.js |
| Gridfinity (credit) | MIT, Zack Freedman and Voidstar Lab LLC | https://www.printables.com/model/417152-gridfinity-specification |
| Further packages | add when chosen | official repository of each |

The app's "OSS Licenses" dialog (`src/lib/LicencesDialog.svelte`) repeats this table; change both together. Plex Sans SemiBold is in the bundled files (`src/fonts/IBMPlexSans-SemiBold.woff`). Font files and their licence texts are in `src/fonts/`.

The root `README.md` points here. Font files are bundled together with their licence texts.

## Rules
- Every dependency and bundled font is checked against an allow-list before it is added; the font licence must permit bundling and redistribution in the app.
- Keep the Gridfinity notice where the spec demands it.
- A new licence in the dependency tree needs an ADR the owner accepts.
