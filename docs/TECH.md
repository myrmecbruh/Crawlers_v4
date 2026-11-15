# Technical

## Stack
- [gospel] Web: HTML and JavaScript on a plain 2D canvas, installable as a PWA. One codebase for phone and desktop browsers.
- [slop] No framework, no build-time dependencies beyond a single bundling script.

## Time
- [gospel] The simulation steps in slow, visible ticks, with pause and speed controls.
- [gospel] Progress happens only while the game is open. No offline catch-up.
- [slop] 1 tick per second at normal speed. A day is 240 ticks (the gospel 4 minutes).

## System impact
- [gospel] Very low system impact.
- [slop] Draw only when a tick or input changes something; no continuous animation loop.
- [slop] Only loaded chunks simulate. Forgotten areas cost nothing.
- [slop] Targets: under 5% of one core at normal speed on a mid-range phone, under 100 MB memory, under 2 MB download.

## Art
- [gospel] Isometric pixel art. One voxel is a 32 px wide tile (32 x 16 diamond top); characters about 24 x 40.
- [gospel] The camera turns in quarter turns and has a second, steeper angle.
- [slop] The steeper angle draws the ground diamond 32 x 28; voxel sides stay 16 px tall at both angles. Keys: Q and E turn, R tilts.
- [gospel] Characters animate walking with planted feet (no sliding) and face the way they move or work, in true isometric directions that follow the camera.
- [slop] Two half-steps per tile; walking is drawn at about 12 frames a second, only while someone moves at 1x or 4x speed. At 16x characters step tile to tile.
- [gospel] Voxels have ambient occlusion.
- [gospel] Terrain is shaped in 3D but drawn in 2D: each voxel's shape comes from the voxels around it, and each column is rendered once into a cached picture and drawn as before.
- [gospel] Each voxel keeps a fair amount of bulk, so the terrain still reads as a game grid, while flowing more naturally.
- [slop] A voxel's top rounds off toward lower neighbours and a small skirt piles against higher ones; the middle stays flat. How far it rounds is per material (`soft`): ash 0.24 of a voxel, rubble 0.2, granite 0.13, everything else 0 (hard cubes, so ruin walls stay square).
- [slop] The shaping is looks only: walking, digging and building still work on whole voxels.
- [slop] Every column is a stack with no overhangs yet, so in practice a voxel is shaped by the eight columns around it. Caves and overhangs would need the picture maker extended.
- [gospel] There is a real distance fog.
- [gospel] Everything has a shadow under it, in the same style as the ambient occlusion.
- [slop] Fog starts 4 rows behind the point you are looking at and reaches 72% haze 22 rows further back. Shadows are three-band dark ellipses in the ambient occlusion colour.
- [gospel] Height differences must be readable from above, including a ledge seen against lower ground behind it.
- [gospel] Elevation is shown by a strong height tint with no outlines: higher ground is lighter.
- [slop] The tint is 10% per voxel of height.
- [gospel] Every item has a different shape and texture for each material it can be made of.
- [slop] Shapes vary by material family (a metal pick, a stone pick, a bone pick); textures vary by material (scrap is rust-patched, iron is clean). Token icons are 8 x 8.
- [gospel] Skin, hair and eye colours are randomised per character.
- [slop] Picked from 8 skin tones, 9 hair colours and 6 eye colours.
- [gospel] Characters have hairstyles and beards; fewer than half have a beard.
- [slop] Six hairstyles (cropped, long, bald, topknot, shaggy, tail). 40% have a beard: stubble, full or long.
- [slop] Characters are layered sprites: body, six worn slots, two held items, pack tokens.
- [slop] Material colour is applied by palette swap, not separate art per material.

## Screen
- [gospel] Both orientations. The screen is divided in half into roughly two squares: a visual side (the world) and an interface side.
- [slop] Portrait: world on top, interface below. Landscape: world left, interface right.

## Sound
- [gospel] Full sound, plus mood music and stingers.
- [slop] Sound is generated or uses very short samples, to stay inside the download budget; music is sparse and can be switched off.

## Updates
- [gospel] The game refreshes itself when an update is published.
- [slop] An open page checks every two minutes, and whenever it comes back into view; it saves first, then reloads.

## Saves
- [gospel] Autosave to browser storage.
- [slop] Export and import of a save as a file.
