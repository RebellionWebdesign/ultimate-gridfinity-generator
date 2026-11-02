---
name: workflow
description: Use when starting or finishing a roadmap task, writing an ADR, updating the roadmap, or unsure whether code may be written.
---

# Workflow

1. **Is code allowed?** Not until the owner says so. If unsure, ask.
2. **Pick the task:** first unchecked task in `docs/roadmap.md` whose dependencies are done.
3. **Read before changing:** the skills for the area and the matching paragraphs in `docs/agent/adr-digest.md`.
4. **Gaps:** if the spec, ADRs and code do not settle a question, look in official sources (original repositories, releases, documentation, guides). If that does not settle it, ask the owner. Do not write "not verified" and stop; look it up or ask.
5. **Decisions:** a new dependency, a different approach, a changed number or a rejected alternative gets an ADR (`docs/adr/NNNN-title.md`, with Status, Context, Decision, Rejected, Consequences) and a paragraph in the digest. Every other change goes into the existing relevant file; do not create new files for it.
6. **Finish:** run the checks that exist, tick the task, update "Open decisions" if one was resolved. Report what was checked, what failed and what is still open.
7. **Keep the always-loaded files short.** `CLAUDE.md` and `AGENTS.md` are loaded every session; target under 200 lines each. An `@` import loads the imported file in full and saves no tokens; it only organises. Detail goes into skills and `docs/`, which load on demand. Do not let two instruction files contradict each other (Claude may pick one arbitrarily).
8. **Style:** short answers, answer first. Facts and options; the owner decides.
