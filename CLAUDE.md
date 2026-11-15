# Crawlers v4: instructions

- Design documents in `docs/` are the source of truth. The owner asked for a prototype on 2026-11-14; code follows the docs, and any number the code invents is [slop] until it is written into the docs and confirmed.
- The game is plain files, no build step: open `index.html`. Scripts load in order: `js/data.js`, `world.js`, `sim.js`, `art.js`, `render.js`, `ui.js`. Globals are shared; do not name one after a `window` property (`top` broke the page once).
- Test by running the sim headless in Node (`data`, `world`, `sim` have no DOM use) and by loading `index.html` in Playwright.
- Every design statement carries a tag:
  - **[gospel]**: the owner ordered it (typed it, or picked it from offered options). Never change, weaken or contradict it without the owner saying so.
  - **[slop]**: the assistant proposed it. Placeholder until the owner confirms (then retag [gospel]) or replaces it.
  - **[gospel?]**: the owner said it but flagged it as unsure.
- Never tag your own idea [gospel]. When in doubt, tag [slop].
- Undecided things go in `docs/OPEN-QUESTIONS.md`; remove them when answered.
- This is a new game. Do not copy rules, code or files from earlier Crawlers repositories unless the owner asks.
