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
- [gospel] The page never zooms on mobile: no double-tap zoom, no pinch zoom of the page.
- [gospel] The view stays pixel perfect while scrolling.
- [slop] One game pixel always covers a whole number of physical screen pixels (zoom levels are rounded to fit the screen), and the world is shifted by under a pixel each frame so its grid lands on whole pixels wherever the camera stops.
- [gospel] The camera orbits freely around the point you look at, at a fixed isometric pitch, with a second, steeper pitch. (Earlier: quarter turns only.)
- [slop] The steeper pitch draws the ground tile 32 x 28; voxels stay 16 px tall at both. Turn by dragging with two fingers, the right mouse button or shift; the turn buttons and Q and E make a quarter turn; R tilts.
- [gospel] Quarter turns are animated, easing out of the start and into the stop.
- [gospel] Raising and lowering the view (tilt) is animated the same way as the quarter turns.
- [slop] Rock is hit by a tap only through a face that is drawn; rock seen from behind and the faded top of a high wall let the tap through.
- [slop] A quarter turn takes 0.45 s with a cubic ease in and out; frames are drawn only while it turns.
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
- [gospel] Only voxel sides that touch the air of walkable areas are drawn (the first game's rule), so near-side walls do not hide what is behind them. There is nothing outside the world's walls: no flat stone beyond them.
- [slop] Walkable air is the air over ground tiles and the air hollowed inside rock (tunnels). So the outer faces of walls and the tops of walls and outcrops are not drawn, and taps pass through rock that is not drawn.
- [gospel] High walls fade out between the 2nd and 3rd metre above the floor they face (lowered 1 m from the 3rd–4th on 2026-11-18), as in the first game (no cutaway).
- [gospel] The fade is smooth, not dithered.
- [slop] A voxel is 3 ft (0.9144 m), so the fade runs from about 2.2 to 3.3 voxels up. The rock below is drawn solid first; the band is blended over everything after the characters, so anyone behind it shows only as much as the wall has faded.
- [slop] The floor a wall fades from is the nearest walkable ground to its column (the lowest, if several are as near), the same for the whole column, so thick walls fade through to clear too, and so bumpy faces (glass) fade evenly instead of leaving flecks. Air sealed inside a wall is not drawn.
- [gospel] There is a real distance fog.
- [gospel] Everything has a shadow under it, in the same style as the ambient occlusion.
- [slop] Fog starts 2 rows behind the point you are looking at and reaches 75% haze 14 rows further back. Shadows are three-band soft dark ellipses on the ground.
- [gospel] Height differences must be readable from above, including a ledge seen against lower ground behind it.
- [gospel] Elevation is shown by a strong height tint with no outlines: higher ground is lighter.
- [slop] The tint is 13% per voxel, measured from the height of the point you are looking at: higher is lighter, lower darker.
- [gospel] Every item has a different shape and texture for each material it can be made of.
- [slop] Shapes vary by material family (a metal pick, a stone pick, a bone pick); textures vary by material (scrap is rust-patched, iron is clean). Token icons are 8 x 8.
- [gospel] Skin, hair and eye colours are randomised per character.
- [slop] Picked from 8 skin tones, 9 hair colours and 6 eye colours.
- [gospel] Characters have hairstyles and beards; fewer than half have a beard.
- [slop] Six hairstyles (cropped, long, bald, topknot, shaggy, tail). 40% have a beard: stubble, full or long.
- [slop] Characters are layered sprites: body, six worn slots, two held items, pack tokens.
- [slop] Material colour is applied by palette swap, not separate art per material.

## Screen
- [gospel] The interface uses the 'small' font from the first Crawlers game: Tiny5 (SIL Open Font License).
- [slop] Always at 16 px in the panels (two screen pixels per font pixel) and 8 px for labels on the map (one game pixel per font pixel), so it stays crisp.
- [gospel] All lists, controls, buttons and clickable things keep a locked size and place: the interface must never move while someone is trying to tap it.
- [slop] How: every box has a fixed height (long text is cut or scrolls inside it), lists keep a slot for every possible entry (six colonist slots, every material on the workbench), and buttons are disabled rather than hidden. The camera bar is one fixed row; the date sits on its own line below it.
- [gospel] Buttons flash when tapped, as feedback.
- [slop] A button lights up while pressed and flashes the accent colour for a quarter second when it acts.
- [gospel] Workbench buttons whose material is on hand are highlighted.
- [slop] Highlighted in green when you hold at least the item's cost in that material.
- [slop] Workbench items can be queued without the materials; queued items wait for them. Each material button shows how many are queued (+n) and how many tokens you have.
- [slop] Each workbench item shows, on the right, how many are queued (+n) and how many have been made (lying in the plot, worn or held).
- [slop] The Cards tab lists every kind of card in a fixed row: what it does, whether it is a boon or bane, how long it lasts, and how many are in the draw pile, in the discard and in play today.
- [gospel] An FPS counter is on screen.
- [slop] It sits after the date under the top bar: frames drawn in the last second and how long each took on average. The world is only drawn when something changes, so an idle game shows 0 fps.
- [gospel] Colonist cards are square, with each need on its own line; the token list sits at the bottom of the Colony tab and is never cut off.
- [slop] Six card slots in two columns; the token box is tall enough for every material.
- [slop] The camera cannot be dragged off the plot (or the zone while it is open), and a ⌂ button brings it back to the camp.
- [gospel] Both orientations. The screen is divided in half into roughly two squares: a visual side (the world) and an interface side.
- [slop] Portrait: world on top, interface below. Landscape: world left, interface right.

## Sound
- [gospel] Full sound, plus mood music and stingers.
- [slop] Everything is synthesised with WebAudio, nothing is downloaded: dice, blows, digging, making, the gate, falls, raids, goals and dawn. The mood track is a low drone with slow notes from a minor scale, sparser at night and pulsing in a raid. The ♪ button turns all sound on or off; browsers allow sound only after a tap, so until then (including after each update's reload) the ♪ button has a dashed gold border, and any tap starts the music. The drone sits at 110-220 Hz so phone speakers can play it.
- [slop] Feedback: banners across the map for raids, falls, broken gates and goals; short labels float up where something is gained or someone is hurt.

## Updates
- [gospel] The game refreshes itself when an update is published.
- [slop] An open page checks every two minutes, and whenever it comes back into view; it saves first, then reloads.

## Fullscreen
- [gospel] The game can be played fullscreen on mobile.
- [slop] A Fullscreen button on the Colony tab (next to New world) works on Android and desktop. iPhones do not allow it for web pages: there the button explains to use Share, Add to Home Screen; opened from the Home Screen the game runs with no browser bars (the manifest asks for fullscreen, and the page has the Apple web-app tags).

## Saves
- [gospel] Autosave to browser storage.
- [gospel] Opening the playable link always gives a fresh load with a new game.
- [gospel] Every update also starts a new world and a new game.
- [slop] So every load starts fresh; the autosave is still written but is not read back for now.
- [slop] Export and import of a save as a file.
