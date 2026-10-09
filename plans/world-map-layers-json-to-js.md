# World map layer migration

Status: In progress. PRs 1–24 are complete; PR 25 onward remains.

## Goal

Replace [layers.json](../docs/data/layers.json) with class-based JavaScript definitions.
Replace cryptic layer IDs and comparisons with named constants.
Separate layer identity from images, colors, and drawing code.
Use a direct migration without backward-compatibility code.

## Confirmed decisions

- Optional overlays use ordered levels: None, Very Low, Low, Medium, High, and Very High (0–5).
- Use `SHADOWLAND.LOW.value` and `.name`; compare numeric `.value` fields.
- Rename Fertility to Resource Level (`RESOURCE_LEVEL`, saved field `resourceLevel`).
- Keep the Resource layer for mines and farms unchanged.
- Keep existing saved level numbers. Accept their new meanings; rename the saved Fertility field only.
- Severity colors run from yellow to purple. Resource Level uses the reverse sequence.
- Use `rgba(255, 255, 0, 0.55)` for Low severity and High Resource Level.

- Use [world-map-layers.js](../docs/scripts/world-map-layers.js) for layer identity and value definitions.
- Named constants return metadata instances, not numeric IDs.
- `TERRAIN.FLAT.id` returns `0`. `TERRAIN.FLAT.name` returns `"flat"`.
- Keep images and colors outside these metadata instances.
- Replace composite terrain, climate, and vegetation tile images with separately rendered layers.
- Render climate as a base color. Render land terrain as a transparent image; draw water, coastal water, and ocean as colors over climate. Render vegetation as an image above terrain.
- Allow vegetation to render above cliffs. Do not normalize cliff terrain to flat terrain.
- Draw vegetation above water as well as terrain.
- Keep the separate climate, terrain, and vegetation presentation data in [world-map-img-base-layers.js](../docs/scripts/world-map-img-base-layers.js).
- Use the plural filenames [world-map-img-settlements.js](../docs/scripts/world-map-img-settlements.js) and [world-map-img-resources.js](../docs/scripts/world-map-img-resources.js).
- The current canvas output is the source of truth for presentation.
- PR 15 preserves tile colors for Waste (`#4A4A4A`) and Shadowland (`#1A590F`).
- Polar uses a solid brown climate fill (`#8B5A2B`), replacing its brown and white stripes.
- Cliffs use a neutral gray transparent cliff-face image. Keep the separate direction lines unchanged.
- Update button controls to match the canvas output.
- Generate programmatic control images during development. Save them as WebP assets.
- Do not generate button images during normal page loading.
- The project is not in production. Assume no client impact from this migration.
- Do not support legacy input formats, compatibility adapters, or temporary browser-global bridges.
- Intermediate PRs do not need to keep both map pages functional.
- Verify the completed migration before considering the work complete.

The request used singular and plural filenames. The decisions above resolve that conflict.
The request also repeated the JSON image-map path. The JavaScript base-layer module replaces that JSON file.

## Current code

| File | Current responsibility |
|---|---|
| [layers.json](../docs/data/layers.json) | Defines 13 layers. Mixes identity, labels, colors, and image paths. |
| [map_tile_img.json](../docs/data/map_tile_img.json) | Unused historical mapping for 66 retired composite tiles. Keep it until PR 29. |
| [world-map-common.js](../docs/scripts/world-map-common.js) | Loads tile images. Builds layer lookups. Draws most map features. |
| [world-map-grid.js](../docs/scripts/world-map-grid.js) | Loads layer JSON. Handles painting, import, export, and builder clan borders. |
| [world-map-viewer.js](../docs/scripts/world-map-viewer.js) | Loads layer JSON. Handles visibility, routes, and viewer clan shapes. |
| [build_map.html](../docs/world/build_map.html) | Defines tools with repeated names, paths, colors, and inline handlers. |
| [world_map.html](../docs/world/world_map.html) | Loads classic scripts. Defines visibility and travel controls. |
| [pathing.js](../docs/scripts/pathing.js) | Uses terrain and infrastructure names for travel decisions. |
| [world-map-grid.css](../docs/css/world-map-grid.css) | Defines several button icons with separate shapes and colors. |

### Verified data

- Layer value counts are: terrain 8, climate 6, vegetation 2, river 2, infrastructure 5, clan 19.
- Settlement has 15 values. Resource has 40 values.
- Animal, spirit, shadowland, crime, and Resource Level each have 6 ordered values.
- Terrain IDs are `0, 1, 2, 3, 4, 5, 7, 8`.
- Settlement IDs are `0, 1, 2, 3, 4, 5, 6, 10, 11, 12, 13, 14, 15, 16, 17`.
- Preserve these gaps. Do not assign new IDs by array position.
- Four terrain image paths are invalid: `plain.png`, `hills.png`, `mountain.png`, and `wetlands.png`.
- All 66 composite tile image paths currently exist.
- All settlement, resource, and builder image paths checked currently exist.
- The saved map contains 26,470 cells and uses numeric layer IDs.

The starter JavaScript modules are untracked user files.
Most are empty. The layer starter contains unscoped numeric assignments.
Read them again before implementation. Preserve any new user changes.
Do not change the unrelated travel files.

## Architecture

### Identity classes and constants

Create these classes in [world-map-layers.js](../docs/scripts/world-map-layers.js):

| Class | Responsibility |
|---|---|
| `LayerValue` | Store immutable `id` and `name` fields. |
| `LevelValue` | Store immutable numeric `value` and display `name` fields for ordered levels. |
| `SettlementValue` | Extend `LayerValue` with `englishType` and `rokuganiType`. |
| `LayerDefinition` | Store layer `id`, `name`, and its value collection. Resolve stored values by ID. |

Export named value collections:

`TERRAIN`, `CLIMATE`, `VEGETATION`, `RIVER`, `INFRASTRUCTURE`, `CLAN`, `SETTLEMENT`, `RESOURCE`, `ANIMAL`, `SPIRIT`, `SHADOWLAND`, `CRIME`, and `RESOURCE_LEVEL`.

Each collection contains immutable class instances under uppercase keys.
Examples include `TERRAIN.COASTAL_WATER`, `INFRASTRUCTURE.SMALL_PORT`, and `SETTLEMENT.LARGE_SHRINE`.
Use `NONE` for existing none values. Use `PRESENT` for binary vegetation and river values.
Optional overlays use `NONE`, `VERY_LOW`, `LOW`, `MEDIUM`, `HIGH`, and `VERY_HIGH`.
These values use `LevelValue`, not identity metadata. Compare their numeric `.value` fields.

Export `LAYERS` as the collection of `LayerDefinition` instances.
For example, `LAYERS.TERRAIN.id` returns `"terrain"`.
These layer definitions also supply UI headings and ordered value lists.

Preserve existing names and their capitalization.
Use existing lower-camel-case fields `englishType` and `rokuganiType`.
These fields represent the requested EnglishType and RokuganiType.
Use empty strings for the none settlement's type labels.
Remove both type fields from resources.

Metadata must not contain `image`, `img`, `color`, `border`, `fill`, `lineWidth`, or marker drawing settings.
`TERRAIN.IMG` is therefore not part of the identity API.
Image access belongs to the base-layer presentation module.
Do not store canvas objects or image caches in layer definitions.

Provide `LayerDefinition.getValue(number)` for saved identity IDs or ordered level values.
Invalid values must use explicit diagnostics at the import or tool-selection boundary.
Do not add case-insensitive legacy name lookup or historical vegetation normalization.
Use named metadata instances directly in application code.

### Presentation ownership

All paths below are relative to the repository root.

| Module | Owns |
|---|---|
| [world-map-img-base-layers.js](../docs/scripts/world-map-img-base-layers.js) | Climate and water terrain colors, transparent land terrain and vegetation image mappings, base control images, and cliff drawing settings and code. |
| `docs/scripts/world-map-img-river.js` | River stripe colors, widths, connections, isolated river drawing, and control images. |
| `docs/scripts/world-map-img-infrastructure.js` | Road and footpath drawing, port markers, colors, widths, and control images. |
| [clan-colors.js](../docs/scripts/clan-colors.js) | Clan border and fill colors only. |
| [world-map-img-settlements.js](../docs/scripts/world-map-img-settlements.js) | Settlement asset mappings, programmatic markers, tinting rules, label sizes, and control images. |
| [world-map-img-resources.js](../docs/scripts/world-map-img-resources.js) | Resource image mappings, marker sizes, and resource control images. |
| `docs/scripts/world-map-img-animal.js` | Animal colors, circle cue drawing, and control images. |
| `docs/scripts/world-map-img-spirit.js` | Spirit colors, vertical cue drawing, and control images. |
| `docs/scripts/world-map-img-shadowland.js` | Shadowland colors, diagonal cue drawing, and control images. |
| `docs/scripts/world-map-img-crime.js` | Crime colors, horizontal cue drawing, and control images. |
| [world-map-img-resource-level.js](../docs/scripts/world-map-img-resource-level.js) | Inverted Resource Level colors, cross cue drawing, and control images. |

Use metadata constants when defining mappings. Do not repeat raw layer IDs.
Use existing valid PNG and WebP assets. Do not rename PNG paths to nonexistent WebP files.
This migration does not convert every existing image.

Put settlement asset mappings at the top of the settlement module.
Start with the small and large shrine entries, then the small and large temple entries.
Put programmatic settlement drawing below those mappings.
Resolve asset-backed markers first. This allows a later asset to replace a drawn marker.
Keep shrine scaling, temple sizing, and clan tinting unchanged.

Render climate first as a base color. Select the color from the climate metadata value.
For land terrain, draw its transparent image over the climate color.
For water, coastal water, and ocean, draw the terrain color over the climate color instead of a terrain image.
Draw the vegetation image over land or water when vegetation is present.
Do not use a three-value terrain, climate, and vegetation lookup.
Do not map cliffs to flat terrain. A cliff image must support vegetation above it.
Use metadata values as mapping keys. Use IDs only for saved data or internal lookup keys.
Do not suppress vegetation on water.
Replace the composite tile mappings and retire only image assets that have no remaining consumer.

Use `getClanColors(clan)` in the clan module.
Keep the existing neutral settlement palette explicit for cells without a clan.
Keep clan polygon geometry and stroke widths in the existing renderer classes.

Each programmatic presentation module exports its drawing function and control image mapping.
Use the same drawing function for map features and development-time control generation.
Pass canvas context, dimensions, zoom, and required neighbor data explicitly.
Modules must not import builder or viewer classes.
Shared image loading and caches can remain in the common renderer.

Keep generic overlay band layout, clipping, and contrast calculation in the common renderer.
Move each layer's colors and cue drawing into its dedicated module.
Resource Level uses the reverse severity palette. None has no color.
Preserve equal-width bands when multiple overlays are visible.

### Draw order and saved data

Keep draw order in [world-map-common.js](../docs/scripts/world-map-common.js), using layer definitions instead of repeated layer strings.
Keep the existing order: terrain, vegetation, river, infrastructure, settlement, resource, clan, then text.
Keep the current separate placement of cliffs, optional overlays, grid lines, route marks, and labels.
Text and erase remain tools. Do not invent numeric value catalogs for them.

Use numeric IDs in saved cells, not metadata objects.
Painting identity layers uses `selectedValue.id`. Painting ordered overlays uses `selectedValue.value`.
This is the selected data format, not a backward-compatibility requirement.
Use the current [world-map-grid.json](../docs/data/world-map-grid.json) as development data.
Update that data and directly related resource mappings if the new implementation requires changes.
Do not add readers for historical exports or alternate name-based formats.
Retain current IDs and fields where useful. Do not renumber data without an implementation need.

Use constants for semantic comparisons in rendering, tools, and travel decisions.
Keep coordinate keys, direction indices, dimensions, travel modes, and CSV column names unchanged.
They are not layer IDs.
Keep pathing's name-based interface. Obtain terrain and infrastructure names from metadata constants.
Do not combine this migration with a travel algorithm rewrite.

### Modules and page initialization

Use native ECMAScript imports and exports.
Export the common renderer, builder class, and viewer class.
Load builder and viewer entry scripts with `type="module"`.
Keep unrelated currency, dice, travel-engine, and navigation scripts unchanged where possible.

Remove both layer JSON fetches and the tile-map JSON fetch.
Initialize metadata before map normalization, painting, or viewer control setup.
Start image loading after metadata initialization.
Make asset failures visible through explicit error messages.
Do not silently substitute a different terrain or marker.

Move map-dependent page initialization into the corresponding module entry point.
Initialize travel-paper rows after clan metadata is available.
Preserve skill controls, visibility defaults, settlement language controls, and route actions.
Replace map-related inline handlers with module event listeners, including zoom, files, routes, and viewer controls.
Do not add `window.mapGrid` or `window.mapViewer` bridges.
Keep map instances and metadata constants inside modules.

For tool buttons, replace inline name-based selection with declarative data attributes and module event listeners.
Resolve attribute keys against named metadata collections. Do not treat display text as an identifier.
Preserve button order, labels, active state, erase behavior, and keyboard operation.
Set button image URLs from the appropriate presentation module.
Remove duplicated icon paths and colors from HTML and unused icon-specific CSS.
Keep clan controls as color swatches supplied by the clan-color module.
Resources use `name` for labels in both language modes.

### Development-time control images

Generate images directly during development, as confirmed after reverting the original PR 23.
Do not add a permanent generation utility, GUI, package manifest, or browser preview page.
Use existing presentation drawing functions through temporary headless browser execution.
Use canvas and `canvas.toBlob()` with `image/webp`; verify the output format.
Inspect the saved images manually in VS Code.

Save generated files under [docs/img/map/](../docs/img/map/) with descriptive `control_*.webp` names.
Generate controls for rivers, infrastructure, optional overlays, and programmatic settlements.
Also provide controls for cliff, waste, and shadowland base tools from current canvas output.
Use a fixed preview size and zoom. Use the existing neutral palette for settlement previews.
Use representative connected cells for river and road previews.
Wait for required base images before exporting climate previews.
Confirm exported blobs are WebP, not a browser fallback format.
For regeneration, request the affected controls and run their presentation functions in a temporary headless browser.
Write the verified WebP bytes directly to their existing control paths.
Remove temporary generation scripts after validation.
Keep these instructions in this plan; do not restore the removed script README.
None controls are transparent, except vegetation None, which shows the climate background.
Existing PNG control files remain until PR 25 replaces their HTML consumers.

## Pull request sequence

### Ordered overlay follow-up

Apply these bounded changes before renderer integration. Each batch must stay below 200 changed implementation lines.

| Batch | Acceptance criteria |
|---|---|
| Level A | **Done** — Add immutable ordered level metadata and numeric lookup. Replace optional catalogs with six levels. Test validation and lookup. Verify numeric ordering. |
| Level B1 | **Done** — Update animal, spirit, shadowland, and crime palettes. Keep existing cue geometry. |
| Level B2 | **Done** — Rename the fertility presentation module to Resource Level and invert its palette. |
| Level B3 | **Done** — Rename and update the Resource Level tests. Do not duplicate static palette values in unit tests. |
| Level C1-C5 | **Done** — Update one optional layer per batch in the currently used layer JSON. Keep numeric values and update level labels and palettes. |
| Level D | **Done** — Update builder tools, viewer visibility, and common renderer references to Resource Level and six levels. |
| Level E1-E2 | **Done** — Rename saved fertility fields to resourceLevel in two batches of at most 90 cells. Keep every numeric value unchanged. |

Count added and deleted source, data, test, HTML, and CSS lines.
Each implementation PR must stay at or below 200 changed lines.
Use a 180-line working budget to leave room for review fixes.
Include targeted tests within each budget. Split a row further if required.
Binary image files are reviewed separately and must have preview evidence.
Do not compact code unnaturally to meet the limit.
PR boundaries are review boundaries, not production releases.
Do not add transitional code solely to keep intermediate stages operational.
Run targeted checks for completed components. Run full page checks after integration.

| PR | Depends on | Scope and acceptance criteria |
|---|---|---|
| 01 | None | **Done** — Create `LayerValue`, `SettlementValue`, and `LayerDefinition`. Test immutable fields, lookup, and invalid values. |
| 02 | 01 | **Done** — Add terrain, climate, vegetation, river, and infrastructure catalogs. Preserve IDs and names. |
| 03 | 01 | **Done** — Add clan and settlement catalogs. Preserve all settlement type labels and ID gaps. |
| 04 | 01 | **Done** — Add resource and optional-overlay catalogs. Resources contain only ID and name. Export complete `LAYERS`. |
| 05 | 02 | **Done** — Populate the base image module with 66 mappings and existing control image paths. Check asset existence and tuple uniqueness. |
| 06 | 03, 04 | **Done** — Populate clan colors and resource images. Preserve all colors and 39 resource assets. |
| 07 | 02 | **Done** — Add river drawing exports. Capture connection and isolated-cell tests before integration. |
| 08 | 02 | **Done** — Add infrastructure drawing exports. Cover roads, footpaths, and both ports. |
| 09 | 03, 06 | **Done** — Add settlement asset lookup and circular markers, including ruins. Preserve asset-first selection. |
| 10 | 09 | **Done** — Add square settlement markers and watchtower drawing. Preserve all marker dimensions. |
| 11 | 09 | **Done** — Add shrine and temple drawing, tinting integration, and label-size mappings. |
| 12a-12e | 04 | **Done** — Add one optional-overlay module per PR: animal, spirit, shadowland, crime, and Resource Level. Each exports its palette lookup, cue drawing function, and control image mapping. Test palette behavior and cue geometry; Resource Level uses the reverse severity palette. |
| 13a-13c | 04, 05 | **Done** — Convert renderer and page entry points to modules using the bounded batches below. Replace map action handlers with module listeners. |
| 14a-14f | 13a-13c | **Done** — Replace layer JSON loading with `LAYERS` directly using the bounded batches below. Remove legacy lookup and normalization logic. Do not add an adapter. |
| 15a | 14 | **Done** — Add climate base-color rendering using named climate values. Preserve tile colors; use the confirmed solid Polar fill. |
| 15b | 15a | **Done** — Add transparent land-terrain images and colored rendering for water, coastal water, and ocean. Preserve cliff terrain; do not normalize cliffs to flat terrain. |
| 15c | 15a, 15b | **Done** — Draw vegetation above land and water, including cliffs. Remove tuple mapping and tile JSON loading. Retire 66 unused composite images after checking consumers. |
| 16 | 15b | **Done** — Extract cliff drawing into the base module. Keep direction behavior and render placement unchanged. |
| 17 | 14, 07 | **Done** — Delegate river drawing and remove old river code and settings. Verify isolated and cardinal connections. |
| 18 | 14, 08 | **Done** — Delegate infrastructure drawing and remove old infrastructure code and settings. Verify mixed-type connections, water crossings, and ports. |
| 19 | 14, 06 | **Done** — Verify clan colors in builder, viewer, and settlement rendering. PR 14 already removed metadata color access. Remove redundant palette fallbacks and retain explicit neutral settlement colors. |
| 20a-20c | 14, 09, 10, 11, 19 | **Done** — Delegate circular, square, and asset-backed settlement markers. Remove replaced renderer branches and duplicate asset-tinting methods. |
| 21 | 14, 06 | **Done** — Delegate resource markers. PR 14 already removed resource type-label access. Test language-independent resource names. |
| 22a-22b | 14, 12a-12e | **Done** — Route optional-overlay colors and cues through their presentation modules. Preserve band layout and visibility behavior. |
| 23 | 15a-15c, 16, 17, 18, 20a-20c, 22a-22b | **Done** — Generate controls directly through temporary headless browser execution. No permanent utility or GUI. Verify WebP output and save images for manual inspection. |
| 24a-24c | 23 | **Done** — Generate 16 base, 37 river/infrastructure/overlay, and 15 settlement WebP assets. Add frozen metadata-based presentation mappings. Keep page wiring for PR 25. |
| 25a-25d | 14, 24a-24c | Wire base, infrastructure/clan, settlement/resource, and overlay buttons in separate PRs. Remove duplicate visual definitions. |
| 26 | 14 | Replace semantic layer comparisons in viewer and pathing with metadata references. Preserve travel inputs and outcomes. |
| 27a-27c | 20a-20c, 25a-25d | Remove unused settlement and base icon CSS in bounded batches. Preserve shared layout classes. |
| 28 | 15a-15c, 17, 18, 19, 20a-20c, 21, 22a-22b, 25a-25d, 26 | Check completed page integration. Remove remaining obsolete lookups and handlers. Identity definitions contain no presentation data. |
| 29a-29g | 14, 15a-15c | Retire replaced JSON in bounded batches. No runtime consumer needs to remain functional during retirement. |
| 30a-30b | 29a-29g | Update script documentation, resource-output references, and affected plan references in separate bounded PRs. |

### PR 13 implementation batches

The page handler changes exceed three 200-line batches. Use these smaller review boundaries.
Do not create browser-global map instances or add compatibility bridges.
Layer and tile JSON loading remains until PRs 14 and 15.

| Batch | Scope and acceptance criteria |
|---|---|
| 13a1 | **Done** — Export renderer, builder, and viewer classes. Import the renderer explicitly. Remove automatic class-file initialization. Test explicit viewer loading failures. |
| 13a2 | **Done** — Add shared zoom and settlement-language listeners in `world-map-controls.js`, with focused tests. |
| 13b1 | **Done** — Add the builder module entry point. Move builder page initialization and file, brush, font, and cliff handlers into listeners. |
| 13b2 | **Done** — Convert terrain, climate, vegetation, river, infrastructure, and clan tool attributes to named catalog keys. |
| 13b3 | **Done** — Convert settlement and resource tool attributes to named catalog keys. |
| 13b4 | **Done** — Convert ordered-overlay, text, erase, zoom, and file controls. Remove builder inline map scripts. |
| 13c1 | **Done** — Add viewer module entry point and listeners. Replace viewer static inline action attributes and script tags. |
| 13c2 | **Done** — Add viewer skill and clan control creation. Wait for loaded clan data before creating travel-paper rows. |
| 13c3 | **Done** — Remove the old viewer inline initialization script. Keep the unrelated navigation script. |
| 13c4 | **Done** — Add focused viewer-control tests. Verify numeric and checkbox skills, Swim TN, travel papers, and route recomputation. |

### PR 14 implementation batches

| Batch | Scope and acceptance criteria |
|---|---|
| 14a | **Done** — Remove common renderer lookup tables and name normalization. Resolve numeric metadata directly and validate imported cells. |
| 14b | **Done** — Update builder and viewer initialization and numeric metadata access. Remove both layer JSON requests. |
| 14c | **Done** — Replace removed metadata presentation access with existing clan, settlement, resource, and overlay modules. Preserve drawing geometry. |
| 14d | **Done** — Remove builder name-based tool lookup. Validate numeric selections and preserve zero-valued defaults. |
| 14e1 | **Done** — Add common-renderer import-validation and presentation-routing tests. |
| 14e2 | **Done** — Add builder tool-selection, zero-default, and numeric round-trip tests. |
| 14e3 | **Done** — Update viewer initialization tests. Verify metadata-first travel papers and current-format imports. |
| 14f | **Done** — Verify all 26,470 saved cells, simulated renderer initialization and drawing, 88 asset paths, and numeric export/import. Update related documentation. Browser visual verification remains for page integration. |

### PR 23 and 24 validation

Generated all 68 control images directly with existing presentation functions in a temporary headless browser.
No generation utility, GUI, or package dependency was added to the repository.
All assets decode as 32-by-32 WebP images. All non-None controls contain visible pixels.
All 68 frozen metadata-based mappings resolve to existing files.
All 88 presentation-module tests pass.
Manual image inspection remains with the user. Page wiring remains for PR 25.

### PR 22 implementation batches

| Batch | Scope and acceptance criteria |
|---|---|
| 22a | **Done** — Pair each overlay color lookup and cue drawing function in the renderer routing table. Keep numeric level resolution in the renderer. PR 14 already connected the color modules. |
| 22b | **Done** — Delegate all five cues. Remove duplicate cue geometry. Keep band selection, equal widths, clipping, contrast, and zoom-dependent line widths in the shared renderer. |

All 66 targeted renderer and overlay-module tests pass.
All 90 pre-delegation cue output traces match across five layers, two contrast colors, three zoom levels, and three band widths.
None-valued and absent overlays do not occupy bands.
Only requested overlays render; builder and viewer visibility selection remains unchanged.
Presentation modules own cue geometry and palette colors.
The renderer retains band layout, clipping, and contrast calculation.

### PR 21 validation

[world-map-img-resources.js](../docs/scripts/world-map-img-resources.js) now owns resource marker size and image drawing.
The shared renderer resolves metadata, loads source images, and passes marker centers.
Markers remain centered 12-by-12 images. Pending or failed images are not drawn.
Source-image loading, load callbacks, error logging, and resource visibility remain unchanged.
Resource labels use metadata names in both settlement languages. Their placement remains unchanged.
All 44 targeted resource and renderer tests pass.
All 120 resource and cell-size combinations preserve the previous marker output.
All 39 resource asset paths exist.

### PR 20 implementation batches

| Batch | Scope and acceptance criteria |
|---|---|
| 20a | **Done** — Delegate villages, cities, capitals, and village ruins to the settlement module. Remove circular renderer branches. |
| 20b | **Done** — Delegate fortifications, castles, Kyuden, castle ruins, academies, and watchtowers. Remove square renderer branches. |
| 20c | **Done** — Delegate shrines and temples through asset-first marker selection. Remove duplicate shrine, temple, and tint drawing methods. Verify dimensions, centering, loading, and cache reuse. |

The shared renderer resolves metadata, clan colors, and source images before delegation.
[world-map-img-settlements.js](../docs/scripts/world-map-img-settlements.js) owns all marker drawing and asset tinting.
Asset-backed markers take priority over procedural shapes.
Pending assets wait for their image load callback; they do not draw substitute shapes.
The renderer keeps source-image loading and the tinted-image cache.
Settlement labels retain their current language and placement.
All 54 targeted settlement and renderer tests pass.
All 900 pre-delegation output cases match, covering every settlement, all clans, no clan, and three zoom levels.
Geometry, shrine scales, temple dimensions, neutral colors, and clan tinting remain unchanged.

### PR 19 validation

PR 14 connected `getClanColors` to all three rendering surfaces.
PR 19 removes redundant fallback colors and adds focused integration coverage.
All 51 targeted clan, renderer, builder, and viewer tests pass.
All 18 non-none clans have complete palettes; removing fallbacks preserves their output.
Absent and none-valued clans keep neutral settlement colors and do not draw territories.
Clan polygon geometry, line widths, and asset tinting remain unchanged.

### PR 17 and 18 validation

All 43 targeted renderer, river, and infrastructure tests pass.
All 290 pre-delegation drawing traces match exactly, including the complete saved map.
The traces cover every neighbor combination at cell sizes 8, 16, and 32.
Drawing order and connections between different infrastructure types remain unchanged.
The renderer no longer owns river stripes, road styles, or port drawing.

### PR 16 implementation batches

| Batch | Scope and acceptance criteria |
|---|---|
| 16a | **Done** — Extract cliff direction drawing into the base module. Pass context, coordinates, size, zoom, and saved flags. Keep renderer calls in place. |
| 16b | **Done** — Add focused direction, rectangle, flag, and zoom tests. All 44 targeted tests pass. Verify all 2,304 pre-extraction drawing traces match at three sizes and three zoom levels. Update documentation. |

### PR 15 implementation batches

Keep each implementation and test review batch below 200 changed lines.

| Batch | Scope and acceptance criteria |
|---|---|
| 15a | **Done** — Replace tuple mappings with climate colors and independent terrain and vegetation presentation. |
| 15b1 | **Done** — Add six transparent lossless WebP images for land terrain and vegetation, including the gray cliff face. Recover existing feature transparency from two climate backgrounds. Maximum reconstruction error is one color-channel unit. |
| 15b2 | **Done** — Load base assets directly in the shared renderer. Remove tile JSON requests from both pages. |
| 15c1 | **Done** — Draw climate, terrain, and vegetation in order. Honor vegetation visibility on land and water. Keep cliff direction placement unchanged. |
| 15c2 | **Done** — Replace obsolete base-layer tests with focused compositing behavior tests. |
| 15c3 | **Done** — Update shared-renderer loading, failure, visibility, default, and loading-state tests. Update viewer initialization tests. All 117 unit tests pass. |
| 15c4 | **Done** — Check consumers and retire 66 unused composite tiles. Keep control images and historical tile JSON until their planned retirement. |
| 15c5 | **Done** — Verify simulated builder and viewer startup with all 26,470 saved cells, all 96 base combinations, numeric data preservation, and image transparency. Inspect a composited asset preview. Update documentation. Browser visual verification remains for page integration. |

The JSON files exceed the PR limit.
Retirement therefore requires several PRs after the JSON loading code is replaced.
Intermediate retired files do not need to remain usable.
Determine exact retirement batch boundaries from the final diff.
Do not treat large file deletions as exempt from the limit.

## Validation and acceptance

No package manifest, configured test suite, or task file was found during inspection.
Use dependency-free Node tests for metadata and mappings.
Use local browser checks for canvas rendering and page integration.
Do not introduce a framework or build system for this migration.

- Compare identity IDs and names against the original JSON before its retirement. Ordered overlays follow the new six-level design.
- Verify all 13 layers and their exact value counts.
- Verify settlement labels. Verify resources have no English or Rokugani type fields.
- Verify identity instances have no presentation fields.
- Verify unique IDs within each layer, numeric ID lookup, and immutable constants.
- Verify climate and water-terrain colors, plus land-terrain and vegetation image mappings, against the current visual reference.
- Verify land terrain and vegetation images render as separate layers, including vegetation over cliffs and water.
- Verify no retired composite image has a remaining runtime consumer.
- Verify module imports do not start image loading during metadata-only tests.
- Test zero-valued defaults separately from none-valued layers.
- Load the development map. Verify its cells resolve to the new definitions and render correctly.
- Test current-format numeric imports and export/import round trips.
- Do not test historical exports or legacy names for compatibility.
- Verify invalid values and failed asset loads produce explicit diagnostics.
- Compare completed canvas output with the current visual reference.
- Cover river isolation, straight connections, corners, and junctions.
- Cover infrastructure connections, ports, water crossings, and footpaths.
- Cover all settlement marker types, clan tinting, shrine scaling, and temple sizing.
- Cover cliff directions, vegetation over cliffs and water, waste climate, and shadowland climate.
- Cover individual overlays, combined bands, cue contrast, and Resource Level colors.
- Verify generated control images match the shared renderer at the selected preview size.
- Check every builder tool, active button, brush size, erase tool, import, export, and zoom action.
- Check viewer visibility, names, travel papers, skill controls, route calculation, and waypoint actions.
- Verify both pages have no module errors, missing control assets, or retired JSON requests.
- Search runtime code for raw semantic layer IDs, duplicated names, image paths, and presentation colors.
- Allow raw values only in canonical definitions, external data, tests, and non-layer concerns.
- Confirm no remaining runtime references to either retired JSON file.
- Update [resource_output_type.json](../docs/data/resource_output_type.json) without changing its numeric resource mappings.
- Correct affected references in [economy.md](economy.md) and [3d-map-plan.md](3d-map-plan.md).

## Out of scope

- New terrain, settlement, or resource-site values beyond the confirmed ordered overlay changes.
- New travel rules or fixes to unrelated existing travel behavior.
- A 3D renderer or Babylon.js migration.
- New settlement artwork or replacement resource artwork.
- Conversion of all existing PNG images to WebP.
- Changes to unrelated user files.
- Backward compatibility, legacy format readers, temporary adapters, and production rollout safeguards.

Approval applies to this design and its staged migration.
This planning change does not implement the migration or create pull requests.
