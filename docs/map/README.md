# 3D World Map (proof of concept)

This folder holds a standalone Babylon.js proof of concept of the world map.
It answers one question: is a 3D terrain view worth building out fully?
The plan is in [plans/3d-map-plan.md](../../plans/3d-map-plan.md).

The 2D map does not change. The 3D page imports catalogs and presentation data
from `docs/scripts/`. It does not import the 2D renderer classes.

## Run the page

The site uses absolute `/l5r10/` links for the navbar. Serve `docs/` at that path:

```bash
mkdir -p /tmp/site && ln -sfn "$PWD/docs" /tmp/site/l5r10
npx http-server /tmp/site -p 8080 -c-1
```

Then open <http://localhost:8080/l5r10/map/world_map_3d.html>.
The page needs a network connection to load Babylon.js from the CDN.

## Babylon.js version

- The page loads the UMD build of Babylon.js 9.33.0 from jsDelivr.
  The `cdn.babylonjs.com` versioned paths stop at version 8.
- The script tags have Subresource Integrity (SRI) hashes.
- `package.json` pins `@babylonjs/core` and `@babylonjs/materials` to the same version.
  A test in `tests/script-layout.test.mjs` makes sure that the versions stay equal.
  To update, change both places and the SRI hashes.

## Folder layout

| Path | Contents |
| --- | --- |
| `world_map_3d.html` | The page. |
| `css/map-3d.css` | Styles for the 3D canvas. Other styles come from `docs/css/`. |
| `scripts/` | ES modules for the 3D page. Tests are in `tests/map/`. |
| `textures/` | PBR texture sets for the terrain. |

## Coordinates

- One map cell is one world unit. One cell is 5 miles.
- World X is the column. World Z is `rows - row`, so north is far from the default camera.
- Y is up.

## Map data (PR 2)

`scripts/map-data.js` loads `docs/data/world-map-grid.json` into a `MapModel`.

- Each layer has one `Uint8Array` of catalog IDs, in row order (`index = y * columns + x`).
- Missing layers use the 2D defaults: flat, temperate, no vegetation.
- Saved numbers resolve with `LAYERS.<LAYER>.getValue(number)`. Unknown numbers keep the default and are counted.
- River and cliff direction flags become 8-bit direction masks. Bit 0 is north, then clockwise.
- Cells outside the 135 × 196 size are counted and skipped. The saved file has 10 cells in row 196.
- The page shows a debug readout with the counts and the land bounds.

## Terrain surface (PR 3)

The terrain is one continuous surface. It is made from chunk meshes that use one global height sampler.

- `scripts/terrain-height.js` makes the `HeightField`. Each cell has 4 lattice steps on each side (`SUBDIVISIONS`).
- The height at a lattice point blends the 4 nearest cell centers with smoothstep weights.
- Each terrain has a level and a roughness. Ridged noise adds relief to hills and mountains.
- Water cells have a negative level. The shoreline is at height 0 on the edge between land and water.
- A saved cliff direction puts the full height change into one lattice step on the low side of that edge.
- `scripts/river-paths.js` makes river segments with the same connection rule as the 2D map.
  The height field carves a channel below height 0 along each segment.
- `scripts/terrain-chunks.js` cuts the lattice into chunks of 32 × 32 cells (35 chunks).
  Chunks copy positions and normals from the global arrays, so the edges of adjacent chunks are equal.
- All chunks share one material. Until the textures load, the material uses vertex colors from `scripts/terrain-colors.js`.

| Query option | Effect |
| --- | --- |
| `?chunk=16` | Uses chunks of 16 × 16 cells. Use it to compare the chunk sizes. |
