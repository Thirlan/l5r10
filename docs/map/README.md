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
- A seal pass walks along each river segment after the carve. Where the surface is above `RIVER_SEAL`,
  it lowers that lattice quad. Without it, 60 points on steep mountain rivers were above the water.
  Tests check every live river path and every river crossing of a chunk border.
- `scripts/terrain-chunks.js` cuts the lattice into chunks of 32 × 32 cells (35 chunks).
  Chunks copy positions and normals from the global arrays, so the edges of adjacent chunks are equal.
- All chunks share one material. Until the textures load, the material uses vertex colors from `scripts/terrain-colors.js`.

| Query option | Effect |
| --- | --- |
| `?chunk=16` | Uses chunks of 16 × 16 cells. Use it to compare the chunk sizes. |
| `?textureSize=256` | Decodes the texture layers at 256, 512 (default), or 1024 pixels. |
| `?water=simple` | Uses a plain see-through water material instead of the WaterMaterial. |

## Terrain textures (PR 4)

### Texture sets

`textures/` holds raw 1k PBR sets (diffuse JPG, displacement PNG, OpenGL normal EXR, roughness EXR or JPG).
`scripts/surface-layers.js` gives each set one layer index. Each climate gives a set for each role:

| Climate | Flat | Hills | Mountains, cliffs, and steep slopes | Snow on mountain tops |
| --- | --- | --- | --- | --- |
| Temperate | grass_ground | rocky_terrain_02 | marble_cliff_05 | snow_02 |
| Polar | default | default | marble_rock_03 | snow_02 |
| Tropical | leafy_grass | default | aerial_rocks_02 | — |
| Desert | sand_01 | marble_cliff_02 | rock_06 | — |
| Waste | mud_cracked_dry_riverbed_002 | rocks_ground_05 | rock_boulder_dry | — |
| Shadowland | brown_mud_03 | default | dark_rock | — |

- The default set is moon_dusted_01. Wetlands and every role without a set use it.
- road_damaged (footpaths) and pavement_04 (roads) are in the same arrays, for PR 5.
- brown_mud_03 has no roughness map. Its roughness is a constant.

### Decoding

- `scripts/texture-arrays.js` decodes the sets in a pool of module workers (`scripts/pbr-layer-worker.js`).
- The EXR files use DWAA compression, which Babylon.js cannot read.
  The workers decode them with the three.js `EXRLoader` from jsDelivr (version pinned in `package.json`).
- The workers pack two RGBA texture arrays with mipmaps:
  albedo (diffuse RGB + displacement) and shading (normal X, normal Y, roughness).
- The map shows the vertex colors until the arrays are ready.

### Comparison of the texturing approaches

| Approach | Result |
| --- | --- |
| `TerrainMaterial` with a mix map | Rejected. It has 3 diffuse slots. The map needs 18 sets, and climate borders go through the chunks. |
| One generated map texture (atlas) | Rejected. At 16 px for each cell, the 135 × 196 map is 2160 × 3136 px and blurs when you zoom in. A sharper atlas needs too much memory. |
| Cell ID texture + `Texture2DArray` (chosen) | One shared GLSL `ShaderMaterial`. Any climate and terrain pair can use any layer. The cost is WebGL2. |

The chosen shader (`scripts/terrain-material.js`):

- Reads the cell ID texture with `texelFetch` (NEAREST). It blends the colors of the 4 nearest cells, never the layer indices.
- Selects the steep-slope layer when `dot(normal, up)` is less than about 0.62–0.8 (the cliff rule).
- Covers mountain cells with snow above the snow line of the climate.
- Uses the displacement to make height-based blends between layers.
- Uses world-space UVs, so the texture does not change at chunk borders.
- Is authored as GLSL text, not as a Node Material Editor graph, so that it can be reviewed.
- Supports clip planes, so that the water reflection pass can render it.

Without WebGL2, the page keeps the vertex colors and shows a message.

### Water

- `scripts/water-surface.js` puts one plane at `WATER_LEVEL` (just below 0) over the full map.
- The terrain is under the plane only in lakes, seas, and river channels, so the plane shows only there.
- The default material is the Babylon.js `WaterMaterial` from `babylonjs-materials`. It reflects and refracts the terrain chunks.
  The bump texture is procedural, so it needs no image file.
- The terrain shader tints the ground under the water with the water class color (lake and river, coastal, ocean).
  The refraction shows this tint, so coastal water and ocean look different.

## Roads and surface features (PR 5)

### Roads and footpaths

- `scripts/road-paths.js` makes road links with the same rule as the 2D infrastructure layer.
  A road or footpath cell links east, south, south-east, and north-east to each neighbor with infrastructure.
- A link uses the kind of its start cell. A junction cap at each cell fills the gap where links meet.
- Each link is a ribbon of 3 vertex lines, with a vertex row every 1/8 cell.
  Each vertex uses the cover height: the highest surface on the lines to its neighbor vertices.
  Thus the flat triangles between vertices do not go into the terrain.
- Over a river or water cell, the road stays on the bridge deck (`BRIDGE_DECK`), above the water plane.
- The road is a little higher than the footpath, so the two do not flicker where they meet.
- `scripts/road-meshes.js` makes one mesh for each chunk and kind (42 meshes). UVs are planar world positions,
  so overlapping ribbons and caps show the same texture.
- A test checks the clearance of every road triangle on the live map. The lowest clearance is 0.022.

### Trees

- `scripts/tree-placement.js` gives each vegetation cell 6 candidate trees from a hash of the cell.
  The placement is the same on each page load.
- A candidate is removed when:
  - the surface is below `TREE_MIN_HEIGHT` (river banks and shores);
  - the slope is steep (`TREE_MIN_NORMAL`), where the shader shows rock;
  - it is near the snow line of a mountain cell;
  - it is near a road link (`ROAD_MARGIN`), or in a settlement clearing (`SETTLEMENT_CLEARING`).
- The climate and terrain select the tree kind (conifer or broadleaf) and the canopy color.
  Polar cells have only conifers. Hills and mountains have more conifers. Wetlands have none.
- `scripts/tree-meshes.js` makes one thin-instance mesh for each chunk and kind (17,969 trees in 52 meshes).
  Each mesh has its own copy of the small prototype geometry, because thin-instance buffers go on the geometry.
- The instance color sets the canopy color. The trunk vertices are dark, so the trunk is a dark shade of the canopy.
- Trees are not in the water reflection list, to keep the reflection pass cheap.

### Ports and layer toggles

- `scripts/port-meshes.js` puts a placeholder dock on each small or large port cell.
  The dock points to the first water neighbor and stays above the bridge deck. Large ports use a larger dock.
- The live map has no ports yet. The tests use a small synthetic map, and the Ports checkbox is disabled when there are none.
- `scripts/layer-toggles.js` connects each checkbox with a `data-map-layer` attribute to its mesh group.
  The Roads, Trees, and Ports checkboxes work independently. PR 7 adds the other layers.

## Settlements, resources, and clans (PR 6)

### Markers

- `scripts/marker-layout.js` makes one billboard quad for each settlement and resource, at its cell center.
  The anchor is on the surface, or on the bridge deck over water.
- `scripts/marker-meshes.js` draws each icon kind once into an atlas canvas. It uses the 2D drawing code:
  - settlements use `drawSettlementMarker` with the clan colors (neutral colors for no clan);
  - resources use the 2D resource image.
- There is one mesh for each chunk and layer, so markers are culled with their chunk.
- `scripts/marker-material.js` turns each quad to face the camera in the vertex shader.
  - A far marker keeps a minimum angular size (`minAngle`), so it stays legible on the whole-map view.
  - The quad moves toward the camera along the view ray, so it does not go into nearby hills. Its screen shape does not change.
  - Transparent pixels are discarded, so the markers need no sorting.
- The Settlements and Resources checkboxes show or hide each layer.

### Labels

- `scripts/label-layout.js` makes one label for each named settlement (name and type) and each map text cell.
  The text and the font sizes are the same as on the 2D map.
- `scripts/label-meshes.js` draws all labels into one atlas canvas, in the 2D style (bold Arial, black fill, white outline).
  The labels use the marker billboard material and one mesh for each chunk.
- A settlement label is above its marker and grows with it, so they do not overlap.
  It shows only near the camera. Larger settlements show their labels from farther away.
- Map labels show at all distances.
- The Settlement Names radio buttons rebuild the labels in English or Rokugani, as on the 2D map.
- The Labels checkbox shows or hides all labels.
