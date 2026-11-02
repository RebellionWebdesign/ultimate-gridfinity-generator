---
name: code-style
description: Use when writing or changing any code, markup or styles in this repository (TypeScript, Svelte, HTML, CSS): coding principles, formatting, accessibility, CSS and JavaScript rules, refactoring.
---

# Code style and refactoring

Source: the owner's own standards (REFACTOR.md and CLAUDE.md from his Django projects), reduced to what fits this stack: TypeScript strict, Svelte, Vitest, Manifold WASM, PWA. What conflicts with this stack is under "Open points": ask the owner, do not pick. The Django, HTMX and Alpine rules of those files are deliberately not part of this one.

## Principles: boring code that just works
- The simplest working solution beats the elegant, clever or "modern" one.
- No abstractions, patterns or configurability for hypothetical future needs. Build only what is needed now.
- No new dependencies, micro-frameworks or libraries without asking, even small ones.
- No animations, transitions, hover effects or visual polish unless they are in the approved design documents (`docs/design/brand.md`, `ui-spec.md`) or the owner asked for them.
- With several solutions, take the least complex, not the technically most interesting.
- Readability and maintainability beat brevity and smart one-liners.

## Refactoring
These standards apply to existing code you change as well as to new code. The owner's files hold few rules about refactoring itself; see Open points.

## Formatting
- Maximum line length 88 characters in TypeScript, Svelte, HTML and CSS. Exception: a single attribute with a long URL or class list where a break would hurt readability; then it is a guideline, not a hard failure. The formatter is Prettier (decided 2 November 2026), `printWidth` set to 88; ESLint is the linter, npm the package manager (roadmap B-01).
- No HTML entities: write characters directly as UTF-8 (ä, ö, ü, &, Ø, ×, °, −). Exception: where Svelte's syntax requires an entity, which is the case for literal curly braces in markup (`&lbrace;` / `&rbrace;`, per the Svelte docs).

## HTML and accessibility
- `index.html` has `<html lang="...">` matching the interface language, `<meta charset="utf-8">` and `<meta name="viewport" content="width=device-width, initial-scale=1.0">`.
- Structure: landmark elements outside (`header`, `nav`, `main`, `footer`, `section`, `aside`), containers for layout only, content elements inside. No div soup: use the semantic element where one exists.
- Headings never skip a level. Exactly one `h1` per screen (landing page, editor).
- Contrast meets WCAG AA: 4.5:1 for normal text, 3:1 for large text and UI components. An agent cannot measure contrast, only estimate it: check critical colour pairs with a contrast checker.
- Never `outline: none` or `outline: 0` on focusable elements (`a`, `button`, `input`) without a clearly visible `:focus-visible` replacement.
- Skip link directly after `<body>`: "Skip to content", pointing to the `id` of `<main>`. Visually hidden but visible on keyboard focus. Never hide it with `display: none` or `visibility: hidden`; that also removes it for keyboard and screen readers.
- `button` for actions, `a` for navigation. No vague link text ("click here", "more"). Avoid redundant `title` or `alt` inside links.
- Every `input`, `select` and `textarea` has a `<label for="...">` tied to the field's `id`. No field without a working label.
- Every `<img>` has an `alt`. Decorative images get `alt=""`, never a missing attribute. No "image of" or "photo of" in alt text.
- Images below the first viewport get `loading="lazy"`.

## CSS
- No inline `style` attributes (see Open points for runtime values).
- No CSS framework (Tailwind, Bootstrap, UI kits); both of the owner's files forbid them.
- First rule of the global stylesheet: `*, *::before, *::after { box-sizing: border-box; }`.
- Colours, spacing and type scales are CSS custom properties in one `:root` block, matching the tokens in `docs/design/brand.md`. No magic numbers elsewhere.
- Fluid type and spacing, fonts included: `font-size: clamp(1rem, 2vw + 0.5rem, 1.75rem);`. Minimum and maximum of a `clamp()` in `rem`, growth in `vw`; never `vw` or `px` as minimum or maximum (it breaks browser zoom). Padding, margin and gap stay fluid through `rem`, `%` and `clamp()`, not viewport units.
- Width and height of sections and containers scale with `vw` / `dvh`, not fixed `px`. Heights use `dvh`, never `vh` (mobile browser bars). Avoid `width: 100vw` (horizontal scrollbar from the scrollbar width); use `width: 100%`. `100dvw` only for deliberate full-bleed outside the document flow. Viewport units size outer containers, not inner spacing.
- No `!important` as a crutch for specificity problems.

## TypeScript and JavaScript
- TypeScript strict. No `var`; `let` and `const` only.
- Modern syntax throughout: arrow functions instead of function expressions where sensible, template literals instead of `+` concatenation, `===` and `!==` instead of `==` and `!=`, `for...of` and array methods (`map`, `filter`, `forEach`) instead of index loops, destructuring instead of manual property or array access. "Boring" refers to scope and architecture, not to outdated syntax.
- No inline JavaScript in markup: no `onclick="..."` strings, no inline script blocks. All logic lives in modules.
- Hand-written `<script>` tags in `index.html` use `defer` in the head, or sit at the end of `<body>`. Bundled app code is not affected.
- Script hooks use a `data-` attribute, never a styling class, so styling and behaviour stay decoupled.

## Applied interpretations (owner to confirm)
- Svelte's own event attribute syntax, `onclick={handler}`, is the documented way to listen to DOM events in Svelte. It is not an inline JavaScript string, so it is allowed.
- The ban on inline JavaScript targets the template; the `<script>` block of a Svelte component is a module, not inline JavaScript.

## Open points (owner decides; agents ask)
1. **Where styles live.** The original puts all CSS into one `main.css`. Svelte `<style>` blocks are scoped to their component by default. Options: global stylesheet only, or global tokens and base plus scoped component styles.
2. **Runtime values.** A value only known at runtime (for example a user-chosen colour in the preview) may have to be set from code, for example as a custom property. Does the inline-style ban allow that?
3. **Class naming.** The Django `CLAUDE.md` demands SMACSS (`l-` layout, `is-`/`has-` state, plain module names) and forbids BEM. Use it here? Svelte scopes class names per component.
4. **Git.** Decided by the owner for now: agents run no `git` command; the owner versions himself (also in `AGENTS.md`). Revisit when contributors join.
5. **Refactoring rules.** The files hold few rules about when and how to restructure code. Add rules if wanted.
6. **`lang` attribute.** The original uses `de`. The interface language of the web app is open (`docs/design/brand.md`, voice); `lang` follows that decision.
