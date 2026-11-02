---
name: design
description: Use when working on the interface, layout, look, colours, type, icons, interface text, or when writing a technical design document.
---

# Design

- Read `docs/design/README.md`, then `ui-spec.md` and `brand.md` for the part you touch.
- **Decisions are recorded.** Look decisions come from the design process (Claude Design) and the owner's approval, and live in `brand.md` and `ui-spec.md`. If they have no decision for something, ask; do not choose a colour, font, radius or wording on your own while implementing. A design decision must be sane: restrained, consistent, readable, accessible, with a reason.
- **No templated look.** Avoid the defaults that make an interface read as generic or AI-made (stock palette, stock rounded cards, stock gradients and glows, decoration without a reason). Colour is sparing. Do not copy other apps literally (assets, icons, logos, text, code, a screen one-to-one). The reference screenshots (`docs/design/references/`, not in the public repository) are counter-examples for the colour design; arrangement and controls are fine as orientation (`docs/design/README.md`). If there is no mood yet, ask for one; offer two or three clearly different directions as options and let the owner choose.
- Pretty, modern, little visual overhead, similar in spirit to Apple's interfaces, and fun to use. Dark mode and light mode both exist (owner statements, `docs/design/README.md`).
- The look sits between "too playful" and "a bit too sober" (owner statement). When in doubt, choose the restrained option and say so.
- Colours, sizes and durations are defined once as tokens; components use the tokens.
- Parameters outside the Gridfinity spec are labelled "not part of the spec".
- Respect reduced-motion settings; status never relies on colour alone.
- A new technical design starts from `docs/design/_template.md`.
- Fonts and icons need a licence check first (`skills/licences-and-credits/SKILL.md`).
