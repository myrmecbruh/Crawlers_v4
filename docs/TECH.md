# Technical

## Stack
- [gospel] Web: HTML and JavaScript on a plain 2D canvas, installable as a PWA. One codebase for phone and desktop browsers.
- [slop] No framework, no build-time dependencies beyond a single bundling script.

## Time
- [gospel] The simulation steps in slow, visible ticks, with pause and speed controls.
- [gospel] Progress happens only while the game is open. No offline catch-up.
- [slop] 1 tick per second at normal speed. A day is 240 ticks.

## System impact
- [gospel] Very low system impact.
- [slop] Draw only when a tick or input changes something; no continuous animation loop.
- [slop] Only loaded chunks simulate. Forgotten areas cost nothing.
- [slop] Targets: under 5% of one core at normal speed on a mid-range phone, under 100 MB memory, under 2 MB download.

## Art
- [gospel] Isometric pixel art. One voxel is a 32 px wide tile (32 x 16 diamond top); characters about 24 x 40.
- [slop] Characters are layered sprites: body, six worn slots, two held items, pack tokens.
- [slop] Material colour is applied by palette swap, not separate art per material.

## Screen
- [gospel] Both orientations. The screen is divided in half into roughly two squares: a visual side (the world) and an interface side.
- [slop] Portrait: world on top, interface below. Landscape: world left, interface right.

## Saves
- [gospel] Autosave to browser storage.
- [slop] Export and import of a save as a file.
