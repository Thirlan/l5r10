# 3D World Map — Babylon.js Proof of Concept: Multi-PR Plan

## Purpose

Evaluate how much effort it takes to render the L5R world map in **3D using
[Babylon.js](https://www.babylonjs.com/)** instead of the current 2D pixel-art
canvas renderer.

This is a **proof of concept**, not a replacement. The goal is to answer a
single question: *is a 3D terrain view worth building out fully?* By the end of
the plan we should have enough of a working prototype to make that call.

### Guiding constraints

- **Standalone.** Everything new lives under `docs/map/`. Nothing here modifies
  the existing 2D map (`docs/rules/world_map.html`, `docs/rules/build_map.html`,
  or any file in `docs/scripts/`).
- **Reuse data, not code.** The 3D map reads the *same* data files the 2D map
  already reads. It does not import or refactor the existing renderer classes.
- **No new backend / build tooling.** The project is a static site served from
  `docs/`. The POC stays static-site friendly (plain HTML + JS modules, CDN or
  vendored Babylon.js). No bundler, no Node build step is required to view it.
- **One continuous terrain surface.** The ground reads as a single unbroken
  surface, never one mesh per cell. Its elevation creates hills, mountains,
  cliffs, lakes, and riverbeds; trees and roads are models placed on top of it.
  Settlements and resources initially reuse the existing images on the surface;
  models can replace them later. How that surface is *built* is an
  implementation detail: a fixed grid of chunk meshes is explicitly allowed (and
  is the approach PR 3 takes) as long as the result has no visible seam.
- **Incremental.** Each PR is independently reviewable, leaves the POC in a
  working (if incomplete) state, and can be abandoned without affecting the 2D
  map.

## Existing data model (what we build on)

The current map is a grid of `16px` cells, **135 columns × 196 rows**, rendered
to a 2D `<canvas>`. The 3D POC consumes the same inputs:

| File | Role | Reused how |
| --- | --- | --- |
| `docs/scripts/world-map-grid.json` | The map itself. Object keyed by `"x,y"`; each cell has optional `terrain`, `climate`, `vegetation`, `cliff`, `river`, `infrastructure`, `settlement`, `resource`, `clan`, `text`, and overlay layers. `cliff`, `riverDirection`, and `infrastructureDirection` hold arrays of edge directions (`n`, `ne`, `e`, `se`, `s`, `sw`, `w`, `nw`). | Source of every tile the 3D scene renders. |
| `docs/scripts/layers.json` | Layer definitions: for each layer, the list of values with `id`, `name`, `color`, and (for terrain/vegetation) `image`. | Maps numeric cell ids to names, colors, and elevation. |
| `docs/scripts/map_tile_img.json` | Maps `terrain,climate,vegetation` combinations to a tile PNG. | Reference for the intended surface appearance, not a per-cell mesh material. |
| `docs/img/map/*.png` | Tile and marker art. | Reference textures and initial settlement/resource images. |

Key facts that make 3D natural:

- **Terrain ids suggest initial heights.** `flat(0)`, `hills(1)`,
  `mountains(2)`, `wetlands(7)`, `city(8)` are land; `water(3)`,
  `coastal water(4)`, `ocean(5)` are water. River cells and water boundaries
  need additional shape/depth rules. Cliffs are not a terrain id either: they
  are a separate `cliff` layer listing the tile edges a cliff faces, so a tile
  with all eight directions is a mesa.
- **The grid is dense and regular**, so it maps cleanly onto a Babylon.js ground
  mesh with heights and surface positions derived from `(x, y)`.
- **Every coordinate exists; only its *properties* are optional.** All
  `135 × 196` keys are present in `world-map-grid.json`, but an individual cell
  may omit any layer. Missing values resolve to defaults, matching
  `world-map-common.js`: `terrain = 0 (flat)`, `climate = 0 (temperate)`,
  `vegetation = 0 (none)`. A cell without a `terrain` key is **flat land, not
  empty space** — roughly 45% of cells omit it, so treating omissions as ocean
  would delete most of the landmass.
- **The enums are small.** `layers.json` defines **7 climates** (temperate,
  tropical, desert, polar, subpolar, wasteland, shadowland — the last two have
  no tile art and fall back to their configured colors), **4 land terrains** (flat, hills, mountains,
  wetlands) plus `city` — which is slated for deprecation — and **3 water
  terrains** (water, coastal water, ocean). Vegetation is effectively **binary**
  (`none(0)` and `Vegetation(3)`). Note that `map_tile_img.json` still contains
  combinations for vegetation ids that no longer exist in `layers.json`, so the
  tile art is *not* a reliable source for the enum sets — read the enums from
  `layers.json`.

---

## PR roadmap

Each PR below lists its **goal**, **scope**, and **done-when** criteria.

### PR 1 — Scaffold a standalone 3D map page

**Goal:** A blank Babylon.js scene renders in the browser at a new URL, wired
into the site nav, touching nothing outside `docs/map/`.

**Scope**
- Add `docs/map/world_map_3d.html`: minimal page following the site's existing
  structure (navbar include, shared CSS from `docs/css/`), containing a
  full-width `<canvas>` for Babylon.js.
- Add `docs/map/scripts/` (new, isolated folder) with an entry script that
  creates a Babylon.js `Engine`, an empty `Scene`, an `ArcRotateCamera`, and a
  `HemisphericLight`, plus the render loop and resize handling.
- Vendor or CDN-reference Babylon.js. Prefer a pinned version; document the
  choice in a short `docs/map/README.md`.
- Add a link to the new page from the existing navigation *only if* it can be
  done without editing shared map files — otherwise leave it unlinked and note
  the URL in the README.

**Done when:** Opening `docs/map/world_map_3d.html` shows an orbitable empty 3D
scene. No existing file's behavior changes.

### PR 2 — Load and normalize the map data

**Goal:** Fetch and parse the same data files the 2D map uses, exposing an
in-memory model the 3D scene can query, with no rendering yet.

**Scope**
- A data-loading module under `docs/map/scripts/` that fetches
  `world-map-grid.json`, `layers.json`, and `map_tile_img.json` (relative paths
  into `docs/scripts/`).
- Normalize cells into a lookup by `(x, y)` and resolve layer ids to names/colors
  using `layers.json` (mirroring how the existing code builds its layer maps,
  but as a fresh, minimal reimplementation — no import of the 2D classes).
- Compute and cache derived data useful for 3D: map bounds, the set of painted
  cells, terrain-id → base elevation, and river/water/vegetation positions.
- Surface a tiny debug readout on the page (e.g. "loaded N cells, bounds …") to
  confirm parsing.

**Done when:** The page logs/verifies correct cell counts and bounds from the
live data files. Still no 3D geometry beyond PR 1.

### PR 3 — Build one continuous elevation mesh

**Goal:** The core of the POC — see the landmass in 3D.

**Scope**
- Build the ground as a **fixed grid of chunk meshes** covering the full map
  bounds, with enough vertices within cells to shape riverbeds and shorelines.
  Start with **32 × 32 cells per chunk** (`5 × 7` chunks for the `135 × 196`
  grid) and evaluate `16 × 16` for finer frustum culling when zoomed in; record
  the chosen size in `docs/map/README.md`.
- Define a **single global height sampler** keyed on world position, used by
  every chunk. Because shared edges are sampled from the same function, adjacent
  chunks produce identical heights by construction; chunks simply duplicate the
  edge vertex row rather than attempting to weld meshes together.
- Compute **normals at chunk borders from that same global sampler**, not from
  a per-chunk `ComputeNormals` call. Matching positions alone still leave a
  visible lighting seam if each chunk derives its edge normals only from its own
  vertices.
- All chunks **share one material instance**, so texturing and lighting stay
  uniform and draw calls batch well.
- Derive **elevation** from the terrain-id → height table (flat low, hills
  raised, mountains higher; wetlands/city near-flat). Shape sharp height
  changes into cliffs; carve lake basins and connected riverbeds below nearby
  land. **Unset terrain is flat land; ocean must come from the explicit ids
  `3`/`4`/`5`.**
- Apply temporary terrain colors from `layers.json`, distinguishing raised
  ground, water bodies, and carved channels without separate ground tiles.
  Keep the ground a single continuous surface; water appearance can be a
  material treatment (a separate water effect is optional if the POC needs one).
- Position the camera to frame the whole map and confirm the silhouette matches
  the 2D map.

**Done when:** Rokugan appears as one continuous ground surface with hills,
mountains, cliffs, lake basins, and connected riverbeds visibly shaped by
elevation, including at cell boundaries — and there is **no visible position or
lighting seam at chunk boundaries at any camera distance**.

### PR 4 — Texture the continuous terrain

**Goal:** Replace flat colors with a coherent map-wide surface treatment that
communicates terrain and climate without creating one material per cell.

**Scope**
- Prototype Babylon.js **TerrainMaterial** with a mix/splat map generated from
  terrain and climate data, blending reusable ground textures across the
  mesh. Its three diffuse texture slots are a constraint, not a direct way to
  assign every `map_tile_img.json` image to a cell.
- Compare that with a single generated map texture/atlas using existing tile
  art, and record which approach better preserves the 2D map's variety without
  visible seams or excessive texture memory. Use terrain colors as a fallback
  for missing art; vegetation models are added in PR 5.
- Compare a third candidate: an **ID map + `Texture2DArray`, indexed per
  fragment, with a slope-driven cliff override**. Because the surface layer is
  chosen by index rather than blended from fixed slots, it sidesteps
  TerrainMaterial's three-diffuse-slot limit and scales to every
  climate × terrain combination the data actually uses.
  - **The ID map** is one `135 × 196` RGBA texture packing terrain, climate,
    vegetation, and feature flags into separate channels — about 26 KB, so its
    size is not a concern. It must be sampled with **`NEAREST` filtering**:
    bilinear interpolation of index values produces meaningless in-between
    indices. Any softening between cells is done by explicitly sampling the
    neighbouring cells and blending the resulting colors, never the indices.
  - **The cliff rule** is `dot(worldNormal, up)`; below a tuned threshold the
    fragment selects the rock/cliff layer instead of its climate layer. Note
    that PR 3's discrete height tiers make the slope distribution nearly binary
    (flat top or vertical wall), so the threshold must be tuned against whatever
    smoothing PR 3 applies rather than copied from noise-terrain examples.
  - This path **requires WebGL2**; the POC should detect and report that
    explicitly rather than failing silently.
  - Author the shader as **GLSL in source** (`ShaderMaterial` /
    `CustomMaterial`), not as a Node Material Editor graph — an NME graph
    serializes to JSON that cannot be meaningfully diffed or code-reviewed.
  - **Do not** give each chunk a climate-specialised shader. Climate boundaries
    run through chunk interiors, so per-chunk variants cause visible
    discontinuity at chunk borders and break batching. Revisit only if PR 8
    measurements show the shared material is the bottleneck.
- Distinguish water, riverbeds, and steep rock from surrounding land with
  material masks or textures; keep water animation optional.

**Done when:** The terrain surface has readable, continuous land/water
texturing across climates, with a documented choice of texturing approach.

### PR 5 — Trees, roads, and surface features

**Goal:** Place models above the terrain while keeping rivers and lakes shaped
into the ground.

**Scope**
- Trace **rivers** from connected river cells and validate that carved channels
  stay continuous over terrain **and chunk** boundaries; use surface
  color/material for water, not floating river ribbons.
- Place reusable **tree models** on appropriate vegetation cells, and reusable
  **road/footpath models** along infrastructure routes, positioned against
  sampled terrain height. Handle crossings over riverbeds without burying or
  floating the road. Roads must stay connected across chunk boundaries.
- **Assign each tree and road segment to its owning chunk** so it is culled
  together with that chunk's ground mesh.
- Handle other infrastructure (such as ports) with simple placeholders if
  needed, and toggle tree/road models independently.

**Done when:** Trees and roads sit on the mesh, roads follow their routes and
stay connected across chunk seams, and rivers remain visibly carved and
connected rather than separate terrain pieces.

### PR 6 — Settlements, resources, and clan regions

**Goal:** Add the point-of-interest and territorial layers.

**Scope**
- Draw the existing **settlement** and **resource** images over the mesh at
  their cell locations (surface-aligned decals or anchored image sprites),
  following local elevation and remaining legible from the camera. Do not
  require new 3D models for these in the POC; replacing images with models is
  a later follow-up.
- Render **clan** ownership as tinted ground regions or colored borders using
  the clan colors from `layers.json`.
- Add optional **settlement name labels** (English/Rokugani) as billboarded text
  or an HTML overlay, mirroring the 2D language toggle.
- **Bucket settlement/resource images, clan tints, and labels by chunk** so they
  cull along with their chunk's ground mesh.

**Done when:** Settlements, resources, and clan territories are visible and
identifiable in 3D.

### PR 7 — Camera, interaction, and UI controls

**Goal:** Make the POC pleasant to explore and comparable to the 2D viewer.

**Scope**
- Camera controls: orbit, pan, zoom, and a "reset/fit" button; sensible limits.
- Layer-visibility checkboxes (terrain always on; rivers, infrastructure,
  settlements, resources, clans, labels toggleable) mirroring the 2D viewer's
  layer panel, but implemented independently in the 3D page.
- Hover/click a tile to show its coordinates and layer values (a lightweight
  inspector), useful for validating the render against the data. Derive the
  inspected `(x, y)` from the **picked world position**, not from chunk-local
  face or vertex indices, so picking stays correct regardless of chunk size.

**Done when:** A reviewer can freely navigate the map and toggle layers from the
page UI.

### PR 8 — Polish, performance pass, and POC write-up

**Goal:** Make the prototype smooth enough to judge, and capture the findings.

**Scope**
- Performance: measure the full terrain surface and its texture memory/draw
  calls; instance repeated tree and road assets or add LOD if needed.
- Measure **draw calls and frame time across chunk-size options** (at least the
  `32 × 32` and `16 × 16` cell variants from PR 3), at both the framed-whole-map
  and zoomed-in camera positions. Add **per-chunk LOD only if those
  measurements demand it**.
- Optional visual polish: simple sky/ambient, soft shadows, subtle water
  animation — only as far as it informs the "is 3D worth it?" question.
- Update `docs/map/README.md` with: how to run it, what was reused vs. rebuilt,
  screenshots/GIFs, measured performance, known gaps, and a **recommendation**
  on whether to invest in a full 3D map.

**Done when:** The POC runs at an acceptable frame rate on the full map and the
README states a clear recommendation with evidence.

---

## Out of scope for the POC

To keep the effort bounded, the following are intentionally **not** part of this
plan (note them as follow-ups if 3D is greenlit):

- Pathfinding / travel routing and the travel-event UI from the 2D viewer.
- An in-browser 3D **editor** (the POC is view-only; editing stays in the 2D
  `build_map.html`).
- Mobile/touch tuning beyond what Babylon.js provides by default.
- Replacing or deprecating the existing 2D map.
- Creating 3D settlement/resource models (retain the existing images for now).
- A build pipeline, framework, or backend service.

## Babylon.js terrain/texturing investigation

- [Ground from a height map](https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set/ground_hmap)
  can make one ground mesh from a height image. For this POC, a generated
  heightmap or explicitly shaped mesh should be compared: riverbeds, cliffs,
  and shorelines require more detail than a single height per map cell.
- The [Terrain Material](https://doc.babylonjs.com/toolsAndResources/assetLibraries/materialsLibrary/terrainMat)
  in the Babylon.js materials library supports a **mix texture** to blend
  **three diffuse textures** (plus optional per-texture bump maps). Generate
  the mix map from grid terrain/climate data for broad land cover. This is a
  candidate for world-map texturing, not an automatic conversion of our many
  `map_tile_img.json` combinations; test its resolution, blending, and behavior
  on steep slopes. See the [TerrainMaterial implementation](https://github.com/BabylonJS/Babylon.js/blob/master/packages/dev/materials/src/terrain/terrainMaterial.ts)
  for its texture slots.
- An atlas or generated canvas texture mapped across the mesh is the alternative
  when preserving more of the existing tile art matters. Evaluate seams,
  filtering, texture size, and zoom quality against the splat-map approach.
- An **ID map sampled against a
  [`Texture2DArray`](https://doc.babylonjs.com/typedoc/classes/BABYLON.RawTexture2DArray)**,
  with cliffs selected by the slope of the surface normal, is the third
  candidate compared in PR 4. It is the one approach that scales past
  TerrainMaterial's three diffuse slots without baking a map-wide atlas. The
  slope test is a dot product against an up vector, expressible either in GLSL
  or with the Node Material Editor's
  [DotProduct block](https://doc.babylonjs.com/toolsAndResources/nme) — but the
  POC authors it as GLSL in source so it can be reviewed as text. Note that this
  technique is usually described for **procedurally generated** worlds, where a
  noise function emits the climate/elevation data maps. Our map is hand-authored,
  so there is nothing to generate: `world-map-grid.json` *is* the data map, and
  only the texturing half of that technique transfers.
- Babylon's [Dynamic Terrain extension](https://github.com/BabylonJS/Extensions/blob/master/DynamicTerrain/documentation/dynamicTerrainDocumentation.md)
  is a camera-following mesh that morphs over a larger data map. It is aimed
  at scrolling/large terrain rather than a fixed full-world view, so defer it
  unless PR 8 measurements show the terrain needs LOD.

## Risks & open questions

- **Mesh detail / performance:** `135 × 196 ≈ 26k` cells, and extra subdivisions
  for rivers/cliffs increase vertex count. Measure mesh resolution and frame
  time early; chunking helps culling but does not remove vertex/texture limits.
- **Texture resolution:** a mix map with three surface types may be too limited
  for all climates; a map-wide atlas may consume too much memory or blur at
  zoom. Compare both — and the ID map / `Texture2DArray` candidate — in PR 4.
- **Chunk seam continuity:** adjacent chunks must agree on both **position and
  normal** at shared edges, or cracks and lighting seams appear. The global
  height sampler is what guarantees this, which makes it a regression risk:
  any change to the sampler (new elevation tiers, river carving, smoothing) can
  reintroduce seams. Re-check chunk borders whenever the sampler changes.
- **ID-map filtering:** bilinear interpolation of index values is invalid — it
  produces indices that correspond to no real terrain or climate. The ID map
  must use nearest sampling, with any softening done by manually sampling
  neighbouring cells and blending their resolved colors.
- **WebGL2 / `Texture2DArray` availability:** the ID-map approach requires
  WebGL2. Decide and document what the POC does when it is unavailable —
  detect and show a clear message, or fall back to the flat terrain colors from
  PR 3 — rather than rendering an untextured or black map.
- **Elevation model:** terrain ids give only coarse height tiers. Cliffs and
  lake/river depth must be inferred from neighboring cells and river data;
  smoothing can erase sharp banks or introduce gaps. Validate continuity and
  legibility at both close and distant camera positions.
- **Asset availability:** tree and road models may need simple reusable
  placeholders for the POC; placement should still be tested on slopes and
  at river crossings.
- **Data drift:** because the 3D map re-implements data loading, changes to
  `layers.json` schema must be mirrored. Keeping the reimplementation minimal
  limits this cost.
