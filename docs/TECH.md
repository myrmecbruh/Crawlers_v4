# Technical

## Stack
- [gospel] Web: HTML and JavaScript, installable as a PWA. One codebase for phone and desktop browsers.
- [gospel] The world is drawn in live 3D with WebGL (changed from a plain 2D canvas on 2026-11-16).
- [slop] WebGL 2, no libraries.
- [slop] No framework, no build-time dependencies beyond a single bundling script.

## Time
- [gospel] The simulation steps in slow, visible ticks, with pause and speed controls.
- [gospel] Progress happens only while the game is open. No offline catch-up.
- [slop] 1 tick per second at normal speed. A day is 240 ticks (the gospel 4 minutes).

## System impact
- [gospel] Very low system impact, kept strict after the switch to 3D: the 3D scene is drawn at low resolution and only redrawn on ticks or camera moves.
- [slop] Exception, because walking animation is also [gospel]: while someone walks at 1x or 4x the scene is redrawn about 12 times a second. Nothing else animates between ticks.
- [slop] The terrain mesh is built once and rebuilt only for the 16 x 16 chunk whose voxels changed.
- [slop] Only loaded chunks simulate. Forgotten areas cost nothing.
- [slop] Targets: under 5% of one core at normal speed on a mid-range phone, under 100 MB memory, under 2 MB download.

## Art
- [gospel] Isometric pixel art. One voxel is a 32 px wide tile (32 x 16 diamond top); characters about 24 x 40.
- [gospel] Low-resolution pixel 3D: the real 3D scene is rendered small, one canvas pixel per game pixel, and scaled up with crisp pixels, flat-shaded, so it still reads as pixel art. The scale is unchanged: a tile is 32 px wide, a voxel 16 px tall.
- [gospel] The camera orbits freely around the point you look at, at a fixed isometric pitch, with a second, steeper pitch. (Earlier: quarter turns only.)
- [slop] The steeper pitch draws the ground tile 32 x 28; voxels stay 16 px tall at both. Turn by dragging with two fingers, the right mouse button or shift; the turn buttons and Q and E turn 45 degrees; R tilts.
- [gospel] Characters stay pixel sprites, with visible gear, skin tones, eyes, hair and beards, standing in the 3D world in correct isometric perspective at the same pixel scale as before.
- [slop] Every sprite (characters, rats, features, tokens) stands upright at its spot; rock in front of it hides it. Colonists hidden by rock show through as a pale outline.
- [gospel] Characters animate walking with planted feet (no sliding) and face the way they move or work, in true isometric directions that follow the camera.
- [slop] Two half-steps per tile; walking is drawn at about 12 frames a second, only while someone moves at 1x or 4x speed. At 16x characters step tile to tile.
- [gospel] Voxels have ambient occlusion.
- [gospel] Each voxel keeps a fair amount of bulk, so the terrain still reads as a game grid, while flowing more naturally.
- [gospel] Every voxel is shaped by all 26 of its neighbours, so overhangs, arches, windows and undercut cliffs are drawn properly.
- [slop] How: the solid is a smooth field in which each voxel's faces fade over a width set by its material. It is sampled four times per voxel and turned into a mesh (surface nets). Lone edges round off, inside corners fill in, flat faces stay on the grid. Mesh corners are lit by ambient occlusion from the field.
- [gospel] Every material has its own voxel geometry: ash must not look like stone or glass.
- [gospel] Every voxel has variations and a random rotation, and every variation joins seamlessly with all 26 possible neighbours.
- [slop] Each voxel gets one of four variants and one of four quarter-turns about the vertical, from a hash of its position. The variant sets how far each exposed face bulges out or sinks in (up to about a tenth of a voxel), whether one exposed top corner is chipped off (three in four voxels), and, turned by the rotation, the pattern its surface is pushed into. Each voxel also gets its own slight tone.
- [slop] How they join: faces against another voxel never move; a mesh corner's push is the blend of the patterns of every voxel among its 26 neighbours that reaches it, weighted by how far each reaches, so two different variants or turns never tear where they meet.
- [slop] Real geometry, not just surface: ash rounds over 0.4 of a voxel and slumps into soft mounds; rubble's surface is pushed into knobbly lumps up to a fifth of a voxel; granite keeps firm blocks with small bevelled edges and blotchy mottling; slag-glass (the ruin walls) is pushed into flat tilted facets, brighter, with rare sparkles. Anything else: a plain cube.
- [slop] The shaping is looks only: walking, digging and building still work on whole voxels.
- [slop] Ruin walls get window holes and zone cliffs get undercut ledges.
- [gospel] There is a real distance fog.
- [gospel] Everything has a shadow under it, in the same style as the ambient occlusion.
- [slop] Fog starts 4 rows behind the point you are looking at and reaches 72% haze 22 rows further back. Shadows are three-band soft dark ellipses on the ground.
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
