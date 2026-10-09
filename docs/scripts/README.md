# Script data notes

## Map page modules

[world-map-builder-page.js](world-map-builder-page.js) starts the map builder.
[world-map-viewer-page.js](world-map-viewer-page.js) starts the viewer.
The pages load these entry points with `type="module"`.
Map instances stay inside their modules.

Controls use data attributes and event listeners instead of inline map handlers.
Builder tools use named catalog keys from [world-map-layers.js](world-map-layers.js).
Viewer travel-paper rows load after clan data is available.
Currency, dice, pathing, travel-engine, and navigation scripts keep their existing loading behavior.

## Map metadata and imports

Both map classes use [world-map-layers.js](world-map-layers.js) directly.
They do not fetch layer JSON or build name-based lookup tables.
Metadata is available before map assets and saved cells load.
Presentation modules supply colors, assets, and labels separately.

Saved cells use numeric identity IDs and numeric ordered level values.
Imports validate these values without changing them.
Invalid imports report the cell and layer, and keep the current map.
Name-based layer values and historical vegetation normalization are not supported.
Terrain and climate zero values remain explicit when painted.
None-valued vegetation and ordered overlays are removed when painted.

## Base map rendering

[world-map-img-base-layers.js](world-map-img-base-layers.js) draws each cell in three steps:

1. Fill the cell with its climate color.
2. Draw a transparent land-terrain image, or fill water terrain with its color.
3. Draw vegetation above either land or water when it is visible.

Cliffs have their own transparent image. Their separate direction lines stay unchanged.
Flat terrain has an empty transparent image. The climate fill supplies its appearance.
Terrain images and vegetation use independent lossless WebP assets.
The renderer loads these images directly. It does not fetch tile-image JSON.
Image loading failures report the asset path and reject page initialization.

Waste and Shadowland retain their previous tile colors.
Polar now uses a solid brown fill instead of brown and white stripes.
Water colors do not depend on climate.
Vegetation visibility does not change saved cells.

The 66 unused composite tiles were removed after a consumer check.
Control images remain until the planned control-generation steps.
The unused legacy tile-image JSON remains until PR 29.
Its retired image paths are historical references, not active asset mappings.

## `travel-time.csv`

- The file keeps `kmph` as the first column for the numeric speed value.
- `-1` still means the travel combination is forbidden.
- The previous `Time to travel` header was replaced, so any importer of this file should now read the `kmph` column.
