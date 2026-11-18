# Changelog

What changed in each published build, newest first. Play: https://myrmecbruh.github.io/Crawlers_v4/

## 2026-11-18

- WASD camera; close slits at wall height steps; smooth fade floor between columns
- Version beside the fps; changelog and data spreadsheets in docs
- Thick walls fade through to clear at the top
- Resize the map's height when only the height changes (fullscreen)
- Even wall fade (no glass flecks), taps through unseen rock, eased tilt, fullscreen fills the view
- Lower the wall fade to 2-3 m, blend it over characters, unblock fields on spent plants

## 2026-11-17

- Fade high walls smoothly between 3 and 4 metres
- Fade high walls out between 3 and 4 metres above the floor they face
- Draw only rock that faces walkable air (near-side walls and wall tops vanish); nothing below the void outside the walls
- Announce every party retreat with its reason; add fullscreen (button, and Home Screen web-app mode on iPhone)
- Fix parties stuck idling on missions: count free hands correctly, lead to loot, send hungry parties home

## 2026-11-16

- Square colonist cards with one need per line; token list at the bottom, never cut off
- Use Tiny5, the small font from the first game, across the interface and map labels
- Stop double-tap and pinch zoom of the page on mobile
- Stay pixel perfect: whole-number upscaling and a camera snapped to whole pixels
- Animate quarter turns with an ease in and out
- Start sound on any tap, make the music audible on phone speakers, show when sound is waiting for a tap
- Highlight workbench buttons whose material is on hand
- Fix flat worlds (a sound function replaced the terrain noise); add personalities, bonds, breakdowns, fields and spoilage; add a name-clash check
- Add raids with a threat track and traps, a goal ladder with rewards, synthesised sound and music, banners and popups
- Show item totals and a card reference; add an FPS counter
- Flash buttons on tap; let workbench items queue without materials and show queued and held counts
- Stop hauling tokens back onto the stockpile; stronger fog and height tint; act on taps when the finger lifts
- Fix the map never drawing; lock every control's size and place; keep the camera over the world, add a Home button
- Start a new world on every load, including update reloads
- Start a new game whenever the link is opened; keep the save only across update reloads
- Give every voxel a variant and a random turn, blended across all 26 neighbours
- Dig any voxel to make tunnels; let tokens and features sit under rock
- Draw the world in live 3D with WebGL: low-resolution pixel 3D, free orbit, per-material geometry
- Let characters walk under overhangs; give each material its own voxel geometry

## 2026-11-15

- Record the owner's rule: give the playable link with every update
- Shape every voxel from its 26 neighbours; add wall windows and undercut cliffs
- Shape terrain from neighbouring voxels and draw it from cached column pictures
- Keep parties together on missions
- Add hairstyles and beards; reload open pages when an update is published
- Randomise skin, hair and eye colours per character
- Add distance fog and shadows under objects
- Show elevation with a strong height tint instead of rims
- Make height differences readable: lighter high ground and rims on drop-off edges
- Give the plot and zones irregular outlines instead of squares
- Add five more party goals and close gaps in walking legs
- Add ambient occlusion and per-material item shapes and textures

## 2026-11-14

- Swing arms while walking; keep panel buttons clickable at high speed
- Animate walking with planted feet, add isometric facing, close voxel edge gaps
- Add quarter-turn camera rotation and a raised view angle
- Replace confirm dialog with in-page confirmation
- Add prototype screenshots
- Add slice-1 prototype: plot, colonists, tokens, dice, gate zone, cards
- Add draft content lists and retag accepted rules
- Record creatures, scars, blight, calendar, food, bonds and sound
- Record skill, recall, arrivals, terraforming and first-slice decisions
- Add first-draft design documents
