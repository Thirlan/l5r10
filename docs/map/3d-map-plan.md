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
- **Incremental.** Each PR is independently reviewable, leaves the POC in a
  working (if incomplete) state, and can be abandoned without affecting the 2D
  map.

## Existing data model (what we build on)

The current map is a grid of `16px` cells, **135 columns × 196 rows**, rendered
to a 2D `<canvas>`. The 3D POC consumes the same inputs:

| File | Role | Reused how |
| --- | --- | --- |
| `docs/scripts/world-map-grid.json` | The map itself. Object keyed by `"x,y"`; each cell has optional `terrain`, `climate`, `vegetation`, `river`, `infrastructure`, `settlement`, `resource`, `clan`, `text`, and overlay layers. | Source of every tile the 3D scene renders. |
| `docs/scripts/layers.json` | Layer definitions: for each layer, the list of values with `id`, `name`, `color`, and (for terrain/vegetation) `image`. | Maps numeric cell ids to names, colors, and elevation. |
| `docs/scripts/map_tile_img.json` | Maps `terrain,climate,vegetation` combinations to a tile PNG. | Optional source for tile textures on the 3D ground. |
| `docs/img/map/*.png` | Tile and marker art. | Optional textures / billboards. |

Key facts that make 3D natural:

- **Terrain ids already imply height.** `flat(0)`, `hills(1)`, `mountains(2)`,
  `wetlands(7)`, `city(8)` are land; `water(3)`, `coastal water(4)`,
  `ocean(5)` are water. A simple id→elevation table gives an immediate
  heightmap.
- **The grid is dense and regular**, so it maps cleanly onto a Babylon.js ground
  mesh / instanced tiles indexed by `(x, y)`.
- **Cells are sparse** (only painted cells appear in the JSON), so unpainted
  coordinates can be treated as empty/ocean.

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
  cells, and a terrain-id → elevation table.
- Surface a tiny debug readout on the page (e.g. "loaded N cells, bounds …") to
  confirm parsing.

**Done when:** The page logs/verifies correct cell counts and bounds from the
live data files. Still no 3D geometry beyond PR 1.

### PR 3 — Render base terrain as a 3D heightmap

**Goal:** The core of the POC — see the landmass in 3D.

**Scope**
- Build ground geometry from the grid: one tile per painted land cell (start
  with instanced boxes/quads keyed by `(x, y)`; a single merged mesh is a later
  optimization).
- Apply per-cell **elevation** from the terrain-id → height table (flat low,
  hills mid, mountains high; wetlands/city near-flat).
- Color each tile by terrain using the `color` values from `layers.json`
  (textures come later). Water terrains render as a flat translucent plane at
  sea level.
- Position the camera to frame the whole map and confirm the silhouette matches
  the 2D map.

**Done when:** The recognizable shape of Rokugan appears in 3D with mountains
raised above plains and water at sea level.

### PR 4 — Apply terrain textures and climate/vegetation variation

**Goal:** Replace flat colors with the existing tile art so the 3D map reads
like the 2D one.

**Scope**
- Use `map_tile_img.json` to pick a texture per `terrain,climate,vegetation`
  combination and apply it to each tile (matching the 2D `drawBaseTiles`
  logic: water ignores vegetation).
- Handle missing combinations gracefully by falling back to the terrain color
  from PR 3.
- Add basic material tuning (e.g. water shader/animated plane optional, kept
  simple) so land vs. water is visually distinct.

**Done when:** The 3D terrain surface visually resembles the 2D map's base
tiles across climates.

### PR 5 — Rivers, roads, and infrastructure overlays

**Goal:** Layer the linear/point features onto the 3D terrain.

**Scope**
- Render **rivers** as ribbons/lines following cells whose `river` layer is set,
  connecting to river neighbors (same adjacency idea as the 2D river drawing).
- Render **infrastructure** (roads, ports, bridges from the `infrastructure`
  layer) as simple ground decals, lines, or markers.
- Keep each overlay as its own toggleable module so they can be enabled/disabled
  independently.

**Done when:** Rivers and roads appear correctly positioned on the 3D surface
and can be toggled.

### PR 6 — Settlements, resources, and clan regions

**Goal:** Add the point-of-interest and territorial layers.

**Scope**
- Render **settlements** and **resources** as billboarded sprites or simple 3D
  markers at their cell centers, reusing the existing `docs/img/map/` art where
  practical.
- Render **clan** ownership as tinted ground regions or colored borders using
  the clan colors from `layers.json`.
- Add optional **settlement name labels** (English/Rokugani) as billboarded text
  or an HTML overlay, mirroring the 2D language toggle.

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
  inspector), useful for validating the render against the data.

**Done when:** A reviewer can freely navigate the map and toggle layers from the
page UI.

### PR 8 — Polish, performance pass, and POC write-up

**Goal:** Make the prototype smooth enough to judge, and capture the findings.

**Scope**
- Performance: merge static tiles into fewer meshes / use thin instances,
  frustum-cull or LOD if needed, and measure frame time on the full map.
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
- A build pipeline, framework, or backend service.

## Risks & open questions

- **Tile count / performance:** up to `135 × 196 ≈ 26k` cells; naive per-tile
  meshes will be slow. Instancing/merging (PR 3 & PR 8) is the main technical
  risk to validate early.
- **Texture atlasing:** many small PNGs may need atlasing to avoid draw-call
  and memory overhead; flagged for PR 4/PR 8.
- **Elevation model:** terrain ids give only coarse height tiers. Whether that
  looks good enough, or whether a smoothed/noise-based heightmap is needed, is a
  key thing the POC should answer.
- **Data drift:** because the 3D map re-implements data loading, changes to
  `layers.json` schema must be mirrored. Keeping the reimplementation minimal
  limits this cost.
