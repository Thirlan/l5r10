# Altitude layer (replaces cliff terrain)

Status: Planned. Open questions answered. No code written yet.

## Goal

Add an `altitude` layer. Remove the `CLIFF` terrain. A cliff exists wherever two neighboring tiles differ in altitude by 75 m or more.

## Decisions from the request

- Altitude is an integer in meters above sea level. A missing value means `1`.
- The builder lets the user type a number to paint with.
- Colors: deep blue (below sea level) to red (1000 m and above). No color for `1`.
- Cliff = altitude difference of at least 75 between neighboring tiles.
- Travel: the altitude difference sets the TN. A bigger difference means a higher TN.
- Migrate the 190 existing cliff tiles (terrain 8, with "cliff direction"):
  - Cliff tile: altitude 100.
  - Tile facing the cliff: altitude 1.
  - Tile behind the cliff: altitude 100 (else it becomes a mesa).
  - Tiles further behind: lower by 10 per step.
- Ocean and coastal water get pseudo-realistic negative altitudes: deep far from land, flatter around island chains.

## Assumptions (change if wrong)

- Neighbors are the 8 surrounding tiles.
- Saved field is `altitude`. It is omitted when `1`.
- Migration is a one-time script in `tools/`. No legacy format support remains afterward.
- "Cliff direction" data is deleted. Cliff edges are drawn from altitude differences.
- Ocean depth comes from distance to the nearest land: `-(distance * 20)`, capped at `-4000`. Water within 3 tiles of an island chain is capped at `-200`.

## Confirmed answers

1. TN = 10 plus 5 for each full 25 m of difference above 75. Confirmed.
2. No cliffs between two water tiles (water, coastal water, ocean). Land-to-water pairs can form cliffs (assumed from "water to water"). Change if wrong.

## PRs (each 200 lines or fewer)

1. `world-map-layers.js`: add `ALTITUDE` layer. Add `world-map-altitude.js` with the color gradient and `getCliffEdges(grid, x, y)`. Tests.
2. Builder: altitude number input, paint and erase in `world-map-grid.js`, `build_map.html`. Tests.
3. Viewer: altitude overlay checkbox and color render. Update map file read and write.
4. Render cliffs from altitude differences. Replace `drawCliffEdges`. Update `world-map-img-base-layers.js` and tests.
5. Travel: replace `cliff-skill-check.js` and `TERRAIN.CLIFF` rules in `travel-speed.js` with the altitude difference. Update tests.
6. Migration script for the 190 cliff tiles. Update `docs/data/world-map-grid.json`.
7. Ocean depth script. Update the map data.
8. Remove `TERRAIN.CLIFF`, cliff controls, cliff direction code, and cliff sprites. Update `docs/map` 3D terrain height to use altitude. Update the glossary.
