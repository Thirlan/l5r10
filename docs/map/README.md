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

The map file is one JSON object. It has a header, then the tiles:

| Field | Meaning |
| --- | --- |
| `name`, `summary` | Text that describes the map. |
| `seed` | A whole number for the terrain noise. The terrain does not use it yet. |
| `maxX`, `maxY` | The highest tile indexes. The map has `maxX + 1` columns and `maxY + 1` rows. |
| `version` | The version of the map, for example `0.9.0`. |
| `lastUpdated` | The date of the last save, as `YYYY/MM/DD`. The map builder sets it on each save. |
| `tiles` | The saved cells, keyed by `"x,y"`. |

- `world-map-file.js` in `docs/scripts/world/` reads and writes this format. The 2D pages and the 3D page share it.
- `createMapModel(data)` takes the size from `maxX` and `maxY`. The `MapModel` keeps the header in `model.header`.
- The old format has no header, so the loaders reject it.
- Each layer has one `Uint8Array` of catalog IDs, in row order (`index = y * columns + x`).
- Missing layers use the 2D defaults: flat, temperate, no vegetation.
- Saved numbers resolve with `LAYERS.<LAYER>.getValue(number)`. Unknown numbers keep the default and are counted.
- River and cliff direction flags become 8-bit direction masks. Bit 0 is north, then clockwise.
- Tiles outside `maxX` and `maxY` are counted and skipped. The loaders do not remove them. The map builder does not create them.
- The page shows a debug readout. It starts with the name, the version, the update date, and the seed. Then it shows the counts and the land bounds.

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
| `?stats=1` | Shows the frame statistics overlay (see PR 8). |

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

### Clan regions

- `scripts/clan-regions.js` packs one clan ID for each cell into a NEAREST texture, and the fill and border colors of each clan into a palette.
  The colors come from `scripts/clan-colors.js`, as on the 2D map.
- The terrain shader:
  - tints each clan cell with the clan fill color (alpha 0.15, as on the 2D map);
  - draws the clan border color in a band where the next cell (also diagonal) has a different clan, with a thin dark line on the edge;
  - gives the band a minimum width in screen pixels, so the borders show on the whole-map view.
- Clan regions are part of the terrain shader, so they are culled with the terrain chunks.
- The Clans checkbox sets the `clanStrength` uniform. Clans need the WebGL2 terrain shader, so the checkbox is disabled on WebGL1.

## Camera and interaction (PR 7)

### Camera

- Drag to orbit, right-drag or Ctrl+drag to pan, and use the wheel to zoom.
- `scripts/camera-limits.js` sets the limits:
  - the nearest zoom is 2 cells; the farthest zoom is 1.5 × the radius that fits the full map;
  - the orbit angle stays above the horizon (`maxBeta` 1.35 radians);
  - `clampTarget` keeps the orbit target inside the map area. The scene applies it before each frame.
- The Reset view button frames the full map again.

### Cell inspector

- `scripts/cell-inspector.js` shows the cell under the pointer: coordinates, terrain height, and each layer value.
  A named settlement also shows its English and Rokugani names.
- The cell comes from the picked world position (`cellAtWorld`), not from mesh faces or vertices.
  So it is correct for each chunk size.
- Only the terrain chunks are picked. Hover picks are throttled to one each 80 ms, because each chunk has many triangles.
- A click pins the cell, so the pointer can move away. The next click releases it.

### Layer toggles

| Layer | Toggle | Notes |
| --- | --- | --- |
| Terrain | Always on | |
| Roads, trees, ports | Checkbox | Infrastructure and vegetation |
| Settlements, resources, labels, clans | Checkbox | Labels also have the language radio buttons |
| Rivers | None | Known gap. The river channels are carved into the terrain and filled by the water plane. A toggle needs a terrain rebuild. |

## Performance and findings (PR 8)

### Frame statistics

- The `?stats=1` option shows an overlay at the bottom left (`scripts/frame-stats.js`):
  frame rate, CPU frame time, draw calls, active meshes, triangles, and an estimate of the texture memory.
- The draw calls and triangles include the water reflection and refraction passes.
- The CPU frame time is the JavaScript time of one frame. It does not include the GPU time.

### Measurements

Setup: headless Chromium with SwiftShader (software WebGL2), 2 CPU cores, canvas 1200 × 975 pixels, `textureSize` 512.
Each value is one frame after 3 frames at the view.

| Chunk cells | Water | View | Draw calls | Active meshes | Triangles | CPU frame time |
| --- | --- | --- | --- | --- | --- | --- |
| 32 × 32 | WaterMaterial | Full map (Reset view) | 343 | 189 of 189 | 3.62 M | 12.2 ms |
| 32 × 32 | WaterMaterial | Oblique (radius 90, beta 1.2) | 307 | 153 of 189 | 3.39 M | 7.8 ms |
| 32 × 32 | WaterMaterial | Zoomed (radius 20, beta 0.9) | 246 | 92 of 189 | 2.85 M | 8.6 ms |
| 16 × 16 | WaterMaterial | Full map | 1048 | 576 of 576 | 3.62 M | 24.3 ms |
| 16 × 16 | WaterMaterial | Oblique | 908 | 436 of 576 | 3.23 M | 28.5 ms |
| 16 × 16 | WaterMaterial | Zoomed | 610 | 138 of 576 | 2.27 M | 13.0 ms |
| 32 × 32 | `?water=simple` | Full map | 189 | 189 of 189 | 1.72 M | 6.6 ms |
| 32 × 32 | `?water=simple` | Oblique | 153 | 153 of 189 | 1.49 M | 3.6 ms |
| 32 × 32 | `?water=simple` | Zoomed | 92 | 92 of 189 | 0.95 M | 2.1 ms |

Triangles in one pass of the full map:

| Meshes | Triangles |
| --- | --- |
| Terrain chunks | 0.85 M |
| Trees (thin instances) | 0.76 M |
| Roads and footpaths | 0.10 M |
| Markers and labels | less than 0.01 M |

- The WaterMaterial renders the terrain and the roads 2 more times (reflection and refraction).
  This adds 1.9 M triangles and about 150 draw calls.
- The texture memory is about 106 MB at 512 px. The two terrain arrays are 50 MB of it. At 1024 px, they are 201 MB.
- The 18 texture sets decode in about 50 s on this 2-core container. Most of the time is the EXR decoding.
- SwiftShader renders on the CPU, so its frame rate (0.1–0.2 fps) does not show the speed on a GPU.
  The draw calls, triangles, and memory do not change with the GPU.

### Chunk size

- 32 × 32 cells stays the default.
- 16 × 16 cells makes about 3 times the draw calls and 1.5 to 3.7 times the CPU frame time.
  It removes no triangles on the full map and only 20% on the zoomed view.
- Per-chunk LOD is not added. The full-map view shows all chunks, and the terrain is only 0.85 M triangles.
  The water passes and the trees cost more than the terrain detail.

### What was reused and what was rebuilt

| Reused from `docs/scripts/` | Rebuilt for 3D in `docs/map/scripts/` |
| --- | --- |
| Map file format (`world-map-file.js`), map data (`world-map-grid.json`), and the layer catalogs (`world-map-layers.js`) | Height field, terrain chunks, and the terrain shader |
| Clan colors (`clan-colors.js`) | Clan regions in the terrain shader |
| Settlement marker drawing, resource images, and label sizes | Billboard material, marker atlases, and label atlas |
| River offsets (`world-map-img-river.js`) and water colors | River channels, water surface, roads, trees, and ports |

### Known gaps

- Rivers have no toggle (see the layer table above).
- The map data has no port cells yet, so only the unit tests show the port meshes.
- Labels can overlap on the full-map view. There is no label collision test.
- The textures and the clan regions need WebGL2. Without it, the terrain uses flat colors.
- The page loads Babylon.js and the EXR decoder from a CDN, and the first load decodes all EXR files.
- There are no measurements on a GPU yet.

### Recommendation

Continue with the 3D map, as a second view next to the 2D map, not as a replacement.

Evidence:

- The 3D view shows relief, rivers, forests, clans, and names together. The 2D map cannot show the relief.
- The full map is 343 draw calls and 3.6 M triangles with the WaterMaterial, or 189 draw calls and 1.7 M triangles with simple water.
  This is a normal load for a desktop GPU. A laptop or phone GPU needs a test.
- The 3D page reuses the map data and catalogs, so the 2D editor stays the one source of the map.

Before more 3D work:

1. Open `?stats=1` on a laptop with an integrated GPU. The goal is 30 fps or more on the full map.
2. If it is slower, make simple water the default on small GPUs, or render the reflection with the terrain only at a lower size.
3. Convert the PBR sets to compressed KTX2 textures. This cuts the 50 s decode and the texture memory.
4. Add trees with a distance limit, then terrain LOD, only if the GPU measurements show the need.
