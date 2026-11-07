# Writable and read-only world map models

Status: Implemented. Viewer and editor migration remains deferred.

## Decisions

- Add the model versions now. Migrate the viewer and editor later.
- Keep writable models in the existing data module files.
- Put read-only models in the matching `-read-only.js` files.
- Share header validation, tile initialization, saved-cell translation, and grid queries.
- Writable tiles allow changes to attributes, labels, and river flags.
- Keep catalog objects shared and frozen in both versions.
- Read-only models are independent snapshots with readonly JSDoc types and frozen data.
- Use small constructors, not proxies or strict write interception.
- Grid size is fixed at construction. Build a new grid to change its bounds.
- Keep the numeric saved-cell format and current drawing and editing behavior.
- Writable header and tile classes are data-only classes. Their read-only versions are project POJOs.

## Small PRs

Each PR must contain no more than 200 changed code lines, excluding unchanged moved lines.

### PR 1: Header models

- Make `MapHeader` writable in `world-map-data-header.js`.
- Add `MapHeaderReadOnly` in `world-map-data-header-read-only.js`.
- Reuse the seven-field validator and constructor.
- Test writable attributes, frozen snapshots, and strict header validation.

### PR 2: Tile models

- Make `WorldMapDataTile` writable in `world-map-data-tile.js`.
- Add `WorldMapDataTileReadOnly` in `world-map-data-tile-read-only.js`.
- Reuse the constructor and saved-cell factory.
- Test nested edits, copied labels and river flags, frozen snapshots, and catalog identity.

### PR 3: Grid models

- Share grid loading and query methods in `world-map-data-grid.js`.
- Add `WorldMapDataGridReadOnly` in `world-map-data-grid-read-only.js`.
- Compose the matching header and tile models.
- Test both versions against the same query cases and the saved map.

### PR 4: Type checks and documentation

- Test writable and readonly JSDoc contracts, including grid query results.
- Keep existing header and tile type-check commands.
- Add a grid type-check command.
- Update the coding glossary and the migration plan.
- Verify imports, targeted tests, lint, and formatting.
