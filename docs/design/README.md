# Design documents

Two kinds live here. Both are written before the code they describe. None of the values below are decided unless a file says so.

| File | Kind | Content |
|---|---|---|
| `ui-spec.md` | Interface | Layout, interactions, states, error messages |
| `brand.md` | Look | Personality, colour tokens, type, shape, motion, icons, voice |
| `mockups/` | Images | WebP export of the design canvas artboards (screens, states, components); index in `ui-spec.md` |
| `_template.md` | Technical design | Template for an implementation design (problem, options, design, tests) |
| `references/` | Counter-examples | Screenshots of other apps for Claude Design: counter-examples for the colour design; arrangement of the UI and controls are fine as orientation. Listed in `.gitignore`, so not in the public repository |

Technical designs get their own file here (`docs/design/<topic>.md`) when a feature needs more than an ADR. An ADR records a decision; a design document explains how something is built.

## Direction for the look (owner statement, 2026-11-01)

Between two reference projects. Extrudo is too playful for the owner; SolidCraft is a bit too sober. The target sits in between. Values are decided by the owner and recorded in `brand.md`.

Further statements by the owner:
- In the end it should look very good, but not like a Christmas tree: colour is used with restraint.
- Both reference apps look good, but they look too similar to each other, and one can tell they were made with Claude. This project must have its own identity and must not read as a templated or generic AI-made interface.
- The look is designed with Claude Design, which may make design decisions. The decisions must be sane: restrained, consistent, readable, accessible, each with a reason. The owner approves them; they are then written into `brand.md` and `ui-spec.md`.
- The owner wants a pretty, modern design with little visual overhead, similar in spirit to Apple's interfaces (calm, clear, few elements, generous spacing). No Apple assets, icons, logos or fonts.
- The app should be fun to use: direct feedback, pleasant motion, controls that invite touching. This comes from craft and interaction quality, not from loud colour.
- There is a dark mode and a light mode (owner, 2 November 2026); both are designed fully.
- Screenshots of other programs are given to Claude Design as **counter-examples for the colour design only** (owner, 2 November 2026): their colours and colour use must not be repeated. Their arrangement of the UI and, if sensible, their controls are fine as orientation. Claude Design must analyse them before designing: for each screenshot note what makes its colour design generic or templated and what works in its arrangement, then design something whose colours differ from all of them. Still copy nothing literally: no assets, icons, logos, text or code, and no screen one-to-one. They are third-party material; the folder `references/` is listed in `.gitignore` and is not part of the public repository (see `references/README.md`). `brand.md` may name the programs and what was learned from each.

## Levers: what the two references do (read from their documents, not from the running apps)

| Lever | Extrudo (`docs/05-brand.md`, `docs/04-ui-spec.md`) | SolidCraft (`assets/icons/ui/STYLE_GUIDE.md`, `docs/ui-kit.md`) |
|---|---|---|
| Personality | "Fast, precise, friendly"; "doesn't take itself too seriously"; playfulness from motion, colour-coded icons, glow and copy | Binding, rule-based specification; icon categories with fixed shape language |
| Colour | Amber accent; colour per tool category (blue, green, coral, violet, teal, pink, yellow) | Per-tab accent tokens; 20 shipped theme files |
| Motion | 120 to 200 ms; playful moments: save pulse, chip "extrudes" into place, animated empty states | Not read |
| Shape | Radius 6 to 16 px, shadows on raised surfaces only | Theme corner radii and a border hierarchy in `ui-kit.md` |
| Type | Instrument Sans and JetBrains Mono, both OFL and bundled | Not read |
| Copy | Short, plain, friendly; says what happened and how to fix it | Not read |

"Not read" means the document was not read for that lever. It does not mean the project lacks it.

## Brief for Claude Design

Planned flow (owner): Claude Design produces the UI from the design rules in this repository and the counter-example screenshots; the handoff goes to Claude Code, which completes the Svelte UI so that it works.

What the official documentation says (checked 2 November 2026) and what it does not:
- Claude Design can read a repository (components, styles) and uploaded files, and can hand a design over to Claude Code as a handoff bundle. In Claude Code, `/design-sync` reads design tokens and components.
- No markdown format for design rules is documented. Whether it reads `brand.md` and `ui-spec.md` as rules is therefore unverified; upload them to the Claude Design project to be safe.
- Export of Svelte components is not documented. Treat "Claude Design exports correct Svelte components" as unverified; Claude Code ports the result to Svelte.

What to give Claude Design: this README, `brand.md`, `ui-spec.md` (once filled), the images in `references/` (counter-examples for the colour design; arrangement and controls as orientation; nothing copied literally) and the rules that parameters below the spec minimum cannot be entered (roadmap B-10). Fonts: Inter for text, IBM Plex Mono for numbers.
