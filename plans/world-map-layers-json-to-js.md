# World map layer migration

Status: In progress. PRs 1–11 are complete; PR 12 onward remains.

## Goal

Replace [layers.json](../docs/data/layers.json) with class-based JavaScript definitions.
Replace cryptic layer IDs and comparisons with named constants.
Separate layer identity from images, colors, and drawing code.
Use a direct migration without backward-compatibility code.

## Confirmed decisions

- Use [world-map-layers.js](../docs/scripts/world-map-layers.js) for layer identity and value definitions.
- Named constants return metadata instances, not numeric IDs.
- `TERRAIN.FLAT.id` returns `0`. `TERRAIN.FLAT.name` returns `"flat"`.
- Keep images and colors outside these metadata instances.
- Replace the JSON image mappings with JavaScript mappings in [world-map-img-base-layers.js](../docs/scripts/world-map-img-base-layers.js).
- Use the plural filenames [world-map-img-settlements.js](../docs/scripts/world-map-img-settlements.js) and [world-map-img-resources.js](../docs/scripts/world-map-img-resources.js).
- The current canvas output is the source of truth for presentation.
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
| [map_tile_img.json](../docs/data/map_tile_img.json) | Defines 66 terrain, climate, and vegetation image combinations. |
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
- Animal, spirit, shadowland, and crime each have 5 values. Fertility has 4 values.
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
| `SettlementValue` | Extend `LayerValue` with `englishType` and `rokuganiType`. |
| `LayerDefinition` | Store layer `id`, `name`, and its value collection. Resolve stored values by ID. |

Export named value collections:

`TERRAIN`, `CLIMATE`, `VEGETATION`, `RIVER`, `INFRASTRUCTURE`, `CLAN`, `SETTLEMENT`, `RESOURCE`, `ANIMAL`, `SPIRIT`, `SHADOWLAND`, `CRIME`, and `FERTILITY`.

Each collection contains immutable class instances under uppercase keys.
Examples include `TERRAIN.COASTAL_WATER`, `INFRASTRUCTURE.SMALL_PORT`, and `SETTLEMENT.LARGE_SHRINE`.
Use `NONE` for existing none values. Use `PRESENT` for binary vegetation and river values.
Use `LOW`, `MEDIUM`, `HIGH`, and `EXTREME` where those values exist.
Do not add `EXTREME` to fertility.

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

Provide `LayerDefinition.getValue(id)` for numeric IDs in the current map data.
Invalid values must use explicit diagnostics at the import or tool-selection boundary.
Do not add case-insensitive legacy name lookup or historical vegetation normalization.
Use named metadata instances directly in application code.

### Presentation ownership

All paths below are relative to the repository root.

| Module | Owns |
|---|---|
| [world-map-img-base-layers.js](../docs/scripts/world-map-img-base-layers.js) | Composite tile mappings, base control images, and cliff drawing settings and code. |
| `docs/scripts/world-map-img-river.js` | River stripe colors, widths, connections, isolated river drawing, and control images. |
| `docs/scripts/world-map-img-infrastructure.js` | Road and footpath drawing, port markers, colors, widths, and control images. |
| [clan-colors.js](../docs/scripts/clan-colors.js) | Clan border and fill colors only. |
| [world-map-img-settlements.js](../docs/scripts/world-map-img-settlements.js) | Settlement asset mappings, programmatic markers, tinting rules, label sizes, and control images. |
| [world-map-img-resources.js](../docs/scripts/world-map-img-resources.js) | Resource image mappings, marker sizes, and resource control images. |
| `docs/scripts/world-map-img-animal.js` | Animal colors, circle cue drawing, and control images. |
| `docs/scripts/world-map-img-spirit.js` | Spirit colors, vertical cue drawing, and control images. |
| `docs/scripts/world-map-img-shadowland.js` | Shadowland colors, diagonal cue drawing, and control images. |
| `docs/scripts/world-map-img-crime.js` | Crime colors, horizontal cue drawing, and control images. |
| `docs/scripts/world-map-img-fertility.js` | Fertility colors, cross cue drawing, and control images. |

Use metadata constants when defining mappings. Do not repeat raw layer IDs.
Use existing valid PNG and WebP assets. Do not rename PNG paths to nonexistent WebP files.
This migration does not convert every existing image.

Put settlement asset mappings at the top of the settlement module.
Start with the small and large shrine entries, then the small and large temple entries.
Put programmatic settlement drawing below those mappings.
Resolve asset-backed markers first. This allows a later asset to replace a drawn marker.
Keep shrine scaling, temple sizing, and clan tinting unchanged.

Use `getTileImage(terrain, climate, vegetation)` in the base-layer module.
Its parameters are metadata instances. Its result is the configured asset URL.
For example, pass `TERRAIN.FLAT`, `CLIMATE.TEMPERATE`, and `VEGETATION.NONE`.
Use each instance's ID only when creating the internal lookup key.
Preserve all 66 mappings without inventing missing combinations.
Keep water vegetation disabled. Keep cliff tiles based on flat terrain.

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
Keep fertility's red, orange, and green palette.
Preserve equal-width bands when multiple overlays are visible.

### Draw order and saved data

Keep draw order in [world-map-common.js](../docs/scripts/world-map-common.js), using layer definitions instead of repeated layer strings.
Keep the existing order: terrain, vegetation, river, infrastructure, settlement, resource, clan, then text.
Keep the current separate placement of cliffs, optional overlays, grid lines, route marks, and labels.
Text and erase remain tools. Do not invent numeric value catalogs for them.

Use numeric IDs in saved cells, not metadata objects.
Painting uses `selectedValue.id`.
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

Add `tools/generate-world-map-controls.html` as a local development utility.
Use browser canvas and `canvas.toBlob()` with `image/webp`.
The utility imports the presentation modules. It does not contain duplicate drawing algorithms.
Serve it locally over HTTP so native module imports work.
Provide previews and downloads for each generated control asset.

Save generated files under [docs/img/map/](../docs/img/map/) with descriptive `control_*.webp` names.
Generate controls for rivers, infrastructure, optional overlays, and programmatic settlements.
Also provide controls for cliff, waste, and shadowland base tools from current canvas output.
Use a fixed preview size and zoom. Use the existing neutral palette for settlement previews.
Use representative connected cells for river and road previews.
Wait for required base images before exporting climate previews.
Confirm exported blobs are WebP, not a browser fallback format.
Document regeneration steps in [docs/scripts/README.md](../docs/scripts/README.md).

## Pull request sequence

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
| 12a-12e | 04 | Add one optional-overlay module per PR. Test its palette and cue, including fertility's separate palette. |
| 13a-13c | 04, 05 | Convert renderer and page entry points to modules in bounded batches. Replace map action handlers with module listeners. |
| 14 | 13a-13c | Replace layer JSON loading with `LAYERS` directly. Remove legacy lookup and normalization logic. Do not add an adapter. |
| 15 | 14, 05 | Replace tile-map JSON loading. Use named terrain, climate, and vegetation values. Preserve cliff and water tile selection. |
| 16 | 15 | Extract cliff drawing into the base module. Keep direction behavior and render placement unchanged. |
| 17 | 14, 07 | Delegate river drawing and remove old river code and settings. |
| 18 | 14, 08 | Delegate infrastructure drawing and remove old infrastructure code and settings. |
| 19 | 14, 06 | Connect clan colors in builder, viewer, and settlement rendering. Remove metadata color access. |
| 20a-20c | 14, 09, 10, 11, 19 | Delegate settlement markers in separate circular, square, and asset-backed batches. Remove each replaced branch. |
| 21 | 14, 06 | Delegate resource markers. Remove resource type-label access. Test language-independent resource names. |
| 22a-22b | 14, 12a-12e | Delegate optional-overlay colors and cues in separate batches. Preserve band layout and visibility behavior. |
| 23 | 15, 16, 17, 18, 20a-20c, 22a-22b | Add the control-generation utility. Verify imports, previews, and WebP downloads. |
| 24a-24c | 23 | Generate base, river/infrastructure/overlay, and settlement control assets in separate batches. Add their module mappings. |
| 25a-25d | 14, 24a-24c | Wire base, infrastructure/clan, settlement/resource, and overlay buttons in separate PRs. Remove duplicate visual definitions. |
| 26 | 14 | Replace semantic layer comparisons in viewer and pathing with metadata references. Preserve travel inputs and outcomes. |
| 27a-27c | 20a-20c, 25a-25d | Remove unused settlement and base icon CSS in bounded batches. Preserve shared layout classes. |
| 28 | 15, 17, 18, 19, 20a-20c, 21, 22a-22b, 25a-25d, 26 | Check completed page integration. Remove remaining obsolete lookups and handlers. Identity definitions contain no presentation data. |
| 29a-29g | 14, 15 | Retire replaced JSON in bounded batches. No runtime consumer needs to remain functional during retirement. |
| 30a-30b | 29a-29g | Update script documentation, resource-output references, and affected plan references in separate bounded PRs. |

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

- Compare every new ID and name against the original JSON before its retirement.
- Verify all 13 layers and their exact value counts.
- Verify settlement labels. Verify resources have no English or Rokugani type fields.
- Verify identity instances have no presentation fields.
- Verify unique IDs within each layer, numeric ID lookup, and immutable constants.
- Verify all 66 tile mappings and every referenced asset path.
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
- Cover cliff directions, water vegetation suppression, waste climate, and shadowland climate.
- Cover individual overlays, combined bands, cue contrast, and fertility colors.
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

- New terrain, settlement, resource, or overlay values.
- New travel rules or fixes to unrelated existing travel behavior.
- A 3D renderer or Babylon.js migration.
- New settlement artwork or replacement resource artwork.
- Conversion of all existing PNG images to WebP.
- Changes to unrelated user files.
- Backward compatibility, legacy format readers, temporary adapters, and production rollout safeguards.

Approval applies to this design and its staged migration.
This planning change does not implement the migration or create pull requests.
