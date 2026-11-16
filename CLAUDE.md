# Crawlers v4: instructions

- Design documents in `docs/` are the source of truth. The owner asked for a prototype on 2026-11-14; code follows the docs, and any number the code invents is [slop] until it is written into the docs and confirmed.
- The game is plain files, no build step: open `index.html`. Scripts load in order: `js/data.js`, `world.js`, `sim.js`, `art.js`, `render.js`, `sound.js`, `ui.js`. Globals are shared; do not name one after a `window` property (`top` broke the page once).
- `render.js` draws with WebGL 2. Headless Chromium needs `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader` to get WebGL in tests. When code changes voxels, call `touch(x,y)` so that chunk's mesh is rebuilt.
- To publish: run `python3 tools/stamp.py` (writes `version.txt`; open pages reload when it changes), commit, push the working branch, then push it to `gh-pages`, which serves https://myrmecbruh.github.io/Crawlers_v4/.
- **Permanent rule from the owner (2026-11-15): every message that reports an update must include the playable link, https://myrmecbruh.github.io/Crawlers_v4/ .**
- **Permanent rule from the owner (2026-11-16): all lists, controls, buttons and clickable things keep a locked size and place. Nothing in the interface may move while someone is trying to click it.** Fixed heights, fixed slots, disable rather than hide.
- All scripts share one global scope, so a name declared in two scripts silently replaces the first (a sound function named `noise` once flattened every world). Run `node tools/check_names.js` before publishing; it must print `no clashes`. Browser tests must also check the world itself (heights, walls, tokens), not only that the page loads.
- Test by running the sim headless in Node (`data`, `world`, `sim` have no DOM use) and by loading `index.html` in Playwright.
- Every design statement carries a tag:
  - **[gospel]**: the owner ordered it (typed it, or picked it from offered options). Never change, weaken or contradict it without the owner saying so.
  - **[slop]**: the assistant proposed it. Placeholder until the owner confirms (then retag [gospel]) or replaces it.
  - **[gospel?]**: the owner said it but flagged it as unsure.
- Never tag your own idea [gospel]. When in doubt, tag [slop].
- Undecided things go in `docs/OPEN-QUESTIONS.md`; remove them when answered.
- This is a new game. Do not copy rules, code or files from earlier Crawlers repositories unless the owner asks.
