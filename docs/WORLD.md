# World

## Voxels
- [gospel] The world is made of 3 ft voxels.
- [gospel] Full 3D, but play rarely leaves the surface.
- [slop] A character is 1 voxel wide and 2 tall.
- [slop] A chunk is 48 x 48 voxels and 16 high.

## Moving in 3D
- [gospel] Characters can walk under overhangs.
- [slop] A standing spot is a tile and a floor height: rock underneath and two voxels of room (a person is two voxels tall). A tile can have several spots, such as the floor under a ledge and the top of the ledge. A step goes to a side neighbour and at most one voxel up or down, with headroom for the climb. Rats follow the same rule.
- [slop] Tokens, features, digging and building still use the top of each tile. Digging out a tunnel is not possible yet.
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

## Calendar
- [gospel] Four seasons of 6 days: a 24-day year, about 4 minutes a day at normal speed. Winter is the temperature and food test.

## Expeditions
- [gospel] Expeditions are seamless: the dungeon is part of the one world and the colony keeps working on the same ticks.
- [gospel] Areas in the fog are forgotten once the characters withdraw to the settlement.
- [slop] "Forgotten" means the area is discarded and generated afresh on the next visit. Reclaimed tiles are kept.
- [gospel] A party sticks together on a mission, for safety.
- [slop] The first able member leads. The others stay within 4 tiles, work only what is within 5 tiles of the leader, and the leader waits for anyone more than 6 tiles behind. The party leaves together once all are armed, and everyone turns on an enemy that comes within 7 tiles of any member.
- [slop] Loot is carried home as visible tokens in hands and packs; what cannot be carried is left.

## Raids (later)
- [gospel] Raids come later, with defence mechanics.
- [gospel] A visible threat token track fills from noise, wealth and blight; at the top, a raid happens.
- [gospel] Raids come from the zones you have breached: more exploration means more fronts.
- [gospel] Defend with walls, traps and colonists.
