# World

## Voxels
- [gospel] The world is made of 3 ft voxels.
- [gospel] Full 3D, but play rarely leaves the surface.
- [slop] A character is 1 voxel wide and 2 tall.
- [slop] A chunk is 48 x 48 voxels and 16 high.

## Moving in 3D
- [gospel] Characters can walk under overhangs.
- [slop] A standing spot is a tile and a floor height: rock underneath and two voxels of room (a person is two voxels tall). A tile can have several spots, such as the floor under a ledge and the top of the ledge. A step goes to a side neighbour and at most one voxel up or down, with headroom for the climb. Rats follow the same rule.
- [gospel] Tokens and features can sit under rock, and colonists can dig tunnels.
- [slop] The Dig tool marks any voxel you tap: the top of a tile, or the side of a wall or outcrop to tunnel into it. A voxel is dug from a side neighbour standing within one voxel of its height. A dug top lowers the tile; a dug voxel inside rock leaves a hollow. The rock dug out drops as a token where the digger stands.
- [slop] Tokens lie on a floor (the top of a tile or a tunnel floor); tokens on a tile's top move with it when it is dug down or built up. Some zone tunnels hold an iron vein.
- [slop] Building still places voxels on the top of a tile only.
- [slop] The gate is an archway: a two-voxel passage with the wall carried over it. Each zone has three granite outcrops with a tunnel through them, and the plot has one, away from the start.

## Shaping terrain
- [gospel] Voxel by voxel: the player can designate any voxel to dig or place; each is a token of its material.

## Map
- [gospel] The settlement area is procedurally generated.
- [gospel] Start with a small fixed plot of about 48 x 48. Each breached border generates one more chunk.
- [slop] Generation is seeded; the same seed gives the same world.
- [gospel] Zone edges are not square: every area has an interesting, irregular outline.
- [slop] An outline is a wobbly blob with three lobes and one cove, ringed by wall or cliff, with a short straight neck to the gate. The settlement plot is shaped the same way. Beyond an outline there is nothing; unseen ground is not drawn.

## Borders
- [gospel] The settlement has borders or barriers that characters dungeon-crawl into for resources.
- [gospel] All three kinds exist:
  - Walled plot with gates: ruin walls or cliffs ring the plot; each gate opens onto a generated dungeon zone.
  - Hostile fog or blight: a deadly haze; parties push into it, and cleared tiles can be reclaimed.
  - Dungeon below: shafts and stairs lead down into generated levels.
- [slop] A starting plot has one of each within reach.

## Blight
- [gospel] Each tick in the fog risks Stress and a disease.
- [gospel] Tiles are reclaimed by placing lit braziers or wards: tokens that burn down.
- [gospel] The fog creeps back into the settlement unless held off: a standing upkeep pressure.
- [gospel] Tokens left in the fog gain a "blighted" keyword, with risks and uses.
- [slop] The blight border is inside the plot: about a quarter of its ground, on the side farthest from both camp and gate, starts under the fog (never within 10 steps of camp or on the gate passage). A few finds lie hidden in it (scrap, dead trees).
- [slop] Nothing in the fog can be seen or ordered, except a Brazier. A Brazier order takes 1 wood, burns 6 days and clears the fog within 3 tiles.
- [slop] Each dawn the fog spreads into each unheld ground tile beside it with one chance in four; ground within 3 of a lit brazier or 4 of the hearth is held. Stockpile, field, dig and building orders on ground it takes are lost.
- [slop] Every 10 ticks in the fog a colonist rolls Willpower; on a failure they gain a step of stress and have one chance in four to fall sick for 3 days (sick: one die fewer on every roll).
- [slop] Blighted tokens: blighted food sickens whoever eats it (2 days, and stress); blighted wood burns half again as long on the hearth.
- [slop] Fog within 8 tiles of the hearth (or camp) adds half a threat token each dawn.
- [slop] Look: a thick grey-green haze in drifting layers over the ground it holds, with a soft edge.

## Calendar
- [gospel] Four seasons of 6 days: a 24-day year, about 4 minutes a day at normal speed. Winter is the temperature and food test.

## Expeditions
- [gospel] Expeditions are seamless: the dungeon is part of the one world and the colony keeps working on the same ticks.
- [gospel] Areas in the fog are forgotten once the characters withdraw to the settlement.
- [slop] "Forgotten" means the area is discarded and generated afresh on the next visit. Reclaimed tiles are kept.
- [gospel] A party sticks together on a mission, for safety.
- [slop] The first able member leads. The others stay within 4 tiles, work only what is within 5 tiles of the leader, and the leader waits for anyone more than 6 tiles behind. The party leaves together once all are armed, and everyone turns on an enemy that comes within 7 tiles of any member.
- [slop] A leader with no hands free leads the party to the nearest loot so the others can pick it up. A party turns for home when anyone in it is starving (hunger full). Every retreat is announced with a banner giving the reason.
- [slop] Loot is carried home as visible tokens in hands and packs; what cannot be carried is left.

## Raids
- [gospel] Raids come later, with defence mechanics.
- [gospel] A visible threat token track fills from noise, wealth and blight; at the top, a raid happens.
- [gospel] Raids come from the zones you have breached: more exploration means more fronts.
- [gospel] Defend with walls, traps and colonists.
- [slop] The track holds 12 threat tokens, shown under the date. Each dawn from day 2 it gains 1 for time, half a token per 12 tokens lying in the plot (wealth) and 1 while a zone is open (breach); opening a new zone adds 1; failed digging or working rolls add 0.1 each, at most 1 a day (noise).
- [slop] When it is full (never before day 7) raiders come to the gate and the track empties. Raid size: 1, then +1 every second raid, up to 5. Raiders wear armour from the third raid and fight better from the fifth.
- [slop] A shut gate holds them: they knock 1 point off it every 5 ticks; it has 6 points (goals add more). Once broken they come in, go for the nearest colonist, flee at 2 wounds (grabbing a token if they can) and die at 3, dropping their gear. The gate is mended at the next dawn after the raid.
- [slop] Armed colonists fight; unarmed ones fetch a weapon if one lies near, otherwise shelter at the stockpile.
- [slop] Traps: built from 1 metal token anywhere. A raider stepping on one must roll Agility against 2 or take 2 wounds; the trap is spent either way.
