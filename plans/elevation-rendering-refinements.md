# Elevation rendering refinements

Status: Implemented and verified locally. Not committed or split into PRs.

## Decisions

- Replace elevation triangles with signed elevation numbers in both 2D maps.
- Keep the existing colors. Show `1` without a color fill when the elevation overlay is visible.
- Builder elevation tools are **Set** and **Delta**, plus the existing erase tool.
- Set writes the input value. Delta adds the signed input value to each tile.
- Delta changes each tile once per click-and-drag stroke. A new stroke can change it again.
- Keep integer validation, map bounds, and the omitted 1 m default.
- Restore the bottom, corner, inward, and slope cliff sprites. Derive directions and neighboring contours from elevation.
- Use the inward sprite for diagonal corners. Do not restore the separate diagonal sprite.
- Do not restore saved cliff directions or cliff terrain.
- Add procedural hills and mountains above the saved elevation in the 3D view only.
- Use the map header seed for repeatable shapes. Hills are rounded; mountains have ridges and peaks.
- Hill relief is from 0 to 600 m. Mountain relief is from 0 to 8000 m.
- Keep physical scale: one tile is 8046.72 m. Do not change saved elevations or travel rules.
- Investigate water flicker numerically. Remove water geometry beneath dry terrain without changing saved map data.
- Verify through tests and numerical output, not screenshots.

## Work units

Each unit targets a PR of at most 200 changed code lines. Split tests into follow-up units when needed.

1. Elevation labels: update the shared drawing helper and overlay renderer.
   - Both maps draw the signed number, including zero and the default 1.
   - Labels stay inside their overlay bands. Colors and other overlay cues are unchanged.
2. Elevation controls: add Set and Delta controls and stroke tracking.
   - Repeated clicks accumulate. Overlapping brush areas change a tile once per stroke.
   - Reject invalid values and overflow before changing any tile in the brush.
3. Cliff contours: restore four WebP assets and neighbor-aware sprite rendering.
   - Test cardinal edges, diagonal edges, corners, and adjacent contours.
   - Water-to-water pairs never create cliff sprites.
4. Seeded terrain: add continuous seeded relief to the shared height sampler.
   - Equal seeds give equal heights. Different seeds change hills and mountains.
   - Verify the 600 m and 8000 m caps above base elevation, including mixed-terrain boundaries.
   - Preserve shared chunk edges, coastlines, river channels, roads, and snow behavior.
5. Water precision: reproduce the depth collision and clip water to the submerged terrain surface.
   - Verify default land, shallow water, and both water materials across camera limits.
6. Regression tests and documentation.
   - Update the map README and directly related glossary entries.
   - Run focused map tests and the required formatting and lint checks.

## Results

- All six work units are complete.
- The four restored sprites are bottom, corner, inward, and slope. The diagonal image is absent.
- A 32-by-32 test region reaches approximately 600 m of hill relief and 7909 m of mountain relief.
- The same seed reproduces heights. Changing the seed changes the relief.
- Numerical checks reproduce the old water/land depth collision at viewing distances of 100 to 500 map units.
- Water polygons now follow submerged terrain. A rounding margin keeps steep shoreline vertices on the wet side.
- Live-map tests find no water triangle centers above the water level.
- All 424 affected map tests pass, including both water material paths.
- Changed-file Prettier, ESLint, and HTML checks pass. Saved map data is unchanged.
- Full formatting and lint checks still report 26 existing HTML errors in unrelated pages.
