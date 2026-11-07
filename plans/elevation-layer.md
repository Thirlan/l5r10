# Elevation layer (replaces cliff terrain)

Status: Implemented. Not yet committed or split into PRs.

## Goal

Add an `elevation` layer. Remove the `CLIFF` terrain. A cliff exists wherever two neighboring tiles differ in elevation by 75 m or more.

## Decisions from the request

- Elevation is an integer in meters above sea level. A missing value means `1`.
- The builder lets the user type a number to paint with.
- Colors: deep blue (below sea level) to red (1000 m and above). No color for `1`.
- Cliff = elevation difference of at least 75 between neighboring tiles.
- Travel: the elevation difference sets the TN. A bigger difference means a higher TN.
- Migrate the 190 existing cliff tiles (terrain 8, with "cliff direction"):
  - Cliff tile: elevation 100.
  - Tile facing the cliff: elevation 1.
  - Tile behind the cliff: elevation 100 (else it becomes a mesa).
  - Tiles further behind: lower by 10 per step.
- Ocean and coastal water get pseudo-realistic negative elevations: deep far from land, flatter around island chains.

## Assumptions (change if wrong)

- Neighbors are the 8 surrounding tiles.
- Saved field is `elevation`. It is omitted when `1`.
- Migration used one-time tools, removed after validation. No legacy format support remains.
- "Cliff direction" data is deleted. Cliff edges are drawn from elevation differences.
- Ocean depth comes from distance to the nearest land: `-(distance * 20)`, capped at `-4000`. Water within 3 tiles of an island chain is capped at `-200`.

## Confirmed answers

1. TN = 10 plus 5 for each full 25 m of difference above 75. Confirmed.
2. No cliffs between two water tiles (water, coastal water, ocean). Land-to-water pairs can form cliffs (confirmed, for sea cliffs).
3. Migration conflicts: keep original cliff tiles at 100 m first, then front land at 1 m, then rear land at 100 m. Do not raise water.
4. Use physical 3D scale: one tile unit is five miles, or 8046.72 m.
5. Keep existing travel speed restrictions. Cliffs need a road, or a footpath for foot travel.
6. Generate depths only for ocean and coastal water. Leave inland-water elevations unchanged.

## PRs (each 200 lines or fewer)

1. `world-map-data-layers.js`: add `ELEVATION` layer. Add `world-map-data-elevation.js` with the color gradient and `getCliffEdges(grid, x, y)`. Tests.
2. Builder: elevation number input, paint and erase in `world-map-grid.js`, `build_map.html`. Tests.
3. Viewer: elevation overlay checkbox and color render. Update map file read and write.
4. Render cliffs from elevation differences. Replace `drawCliffEdges`. Update `world-map-img-base-layers.js` and tests.
5. Travel: replace `cliff-skill-check.js` and `TERRAIN.CLIFF` rules in `travel-speed.js` with the elevation difference. Update tests.
6. Migration script for the 190 cliff tiles. Update `docs/data/world-map-grid.json`.
7. Ocean depth script. Update the map data.
8. Remove `TERRAIN.CLIFF`, cliff controls, cliff direction code, and cliff sprites. Update `docs/map` 3D terrain height to use elevation. Update the glossary.

## Results

- All eight PR scopes are implemented in the working tree.
- Migration: 190 cliff tiles are now flat terrain at 100 m. No "cliff direction" fields remain.
- Ocean depths: 2,233 coastal and 5,336 ocean tiles. Range is -20 m to -520 m.
- Inland water (374 tiles) is unchanged. All 26,460 tile keys are unchanged.
- Before cleanup, both scripts reproduced the saved map exactly.
- Before tool cleanup, `npm test` passed all 746 tests.
- The one-time migration tools and their tests were removed after validation. The migrated map data is unchanged.
- Changed code passes Prettier and ESLint. Both changed HTML pages pass validation.
- Full formatting and lint checks report existing errors in [shugenja.html](../docs/character_creation/shugenja.html) and [movement.html](../docs/rules/movement.html). HTML validation reports 26 errors.
