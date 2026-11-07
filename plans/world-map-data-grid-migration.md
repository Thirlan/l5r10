# World map data grid migration

Status: Header composition is implemented. The read-only consumer migration is planned.

## Goal

Use [WorldMapDataGrid](../docs/scripts/world/data/world-map-data-grid.js) for map queries in the viewer and game rules.
Remove repeated catalog lookups, default values, coordinate keys, and neighbor searches from those consumers.
Keep travel results and presentation behavior unchanged for valid map files.

## Confirmed decisions

- Migrate the read-only viewer and game-rule consumers first.
- Do not migrate shared drawing, the editor, or the 3D map in this phase.
- A project POJO is a data-only, read-only class with a constructor.
- Keep [MapHeader](../docs/scripts/world/data/world-map-data-header.js) composed as `grid.header`.
- Keep only the seven declared header fields.
- Reject unknown header fields during construction, loading, and saving.
- Keep [WorldMapTile](../docs/scripts/world/data/world-map-data-tile.js) instances and catalog values read-only.
- The later editor phase will support grid tile replacement, not mutation of tile attributes.
- The grid collection may then change while existing tile and header POJOs remain read-only.
- Keep current sparse-cell routing behavior until a separate behavior change is approved.
- Keep current travel costs, target numbers, modes, checks, route tie-breaking, and event output.
- Keep numeric lookup APIs that do not retrieve map cells.
- Use native JavaScript with checked JSDoc types.
- Each implementation PR must contain no more than 200 lines of code.
- Update related documentation and tests in each PR.

## Review findings

### Neighbor lookup and direction are different concerns

[getGrid9](../docs/scripts/world/data/world-map-data-grid.js) returns a row-ordered 3x3 matrix.
It includes the center and uses null for coordinates outside the map.

[NEIGHBOR_OFFSETS](../docs/scripts/world/data/world-map-data.const.js) defines eight directions clockwise from north.
It also supplies the offsets for saved river directions.
[Cliff drawing](../docs/scripts/world/draw/world-map-common.js) depends on those direction indexes.
[3D terrain relief](../docs/map/scripts/terrain-height.js) uses the offsets to calculate spatial distances.

Use the matrix to retrieve tiles.
Keep direction metadata where geometry or saved direction indexes require it.
Do not replace a clockwise neighbor array with a flattened matrix.

[Pathing](../docs/scripts/world/game-rules/pathing.js) has a different neighbor search order.
Its order is east, west, south, north, southeast, northeast, southwest, northwest.
Keep this order when using the matrix, because equal-cost routes depend on it.

### Saved cells and POJOs have different shapes

[The viewer](../docs/scripts/world/draw/world-map-viewer.js) still retrieves saved cells containing numeric IDs.
POJO layers contain catalog objects. Read their `id`, `value`, or `name` attributes instead.
Saved river flags are numeric object fields. POJO river flags are an eight-element boolean array.
Rule modules must receive the correct representation, not a raw-or-POJO union.

The grid creates default tiles for every missing coordinate inside the map.
The viewer currently returns null for an unsaved cell and prevents routes through it.
The migration needs saved-cell presence information to preserve that behavior.

[Travel validation](../docs/scripts/world/game-rules/travel-skill-rules.js) also rejects malformed saved river flags.
The factory currently loses malformed flag details when converting them to booleans.
Validate their saved format before conversion. Keep transport-specific river constraints in the rule layer.

### Drawing and editing remain separate for this phase

[The shared renderer](../docs/scripts/world/draw/world-map-common.js) still draws saved numeric cells.
[The editor](../docs/scripts/world/draw/world-map-grid.js) directly changes those cells.
The viewer will temporarily retain saved data for drawing and use the data grid for queries.

Absent river directions have a legacy drawing fallback.
That differs from explicit flags that are all off.
Preserve the distinction before migrating river drawing in a later phase.
Do not change river flow, shorelines, cliffs, overlays, or labels during this data-query migration.

## Small PRs

### PR 1: Header composition

Status: Implemented in the current worktree.

Acceptance:
- Create [world-map-data-header.js](../docs/scripts/world/data/world-map-data-header.js) with the `MapHeader` constructor.
- Define all seven header attributes as read-only.
- Reject header fields that are not declared.
- Compose the class into `WorldMapDataGrid.header`.
- Keep [map-file helpers](../docs/scripts/world/data/world-map-data-file.js) on the raw `MapHeaderData` representation.
- Verify header values, class identity, unknown-field rejection, file round trips, and compile-time readonly checks.

### PR 2: Complete grid query information

Acceptance:
- Add `hasSavedTile(x, y)` to the data grid, with coordinate checks matching `get`.
- Return false for unsaved and outside-map coordinates without changing default tile creation.
- Validate saved river flag keys and values in [the tile factory](../docs/scripts/world/data/world-map-data-tile-factory.js).
- Accept missing flag fields; reject malformed saved flags explicitly.
- Test sparse maps, corners, invalid coordinates, and flag conversion.

### PR 3: Viewer queries

Depends on PR 2.

Acceptance:
- Construct a candidate data grid when loading a map into `WorldMapViewer`.
- Keep the current map and data grid if validation fails.
- Migrate `cellTerrain`, `cellClan`, `cellInfrastructure`, and `tileCostKey` to POJO queries.
- Preserve null results for unsaved cells with `hasSavedTile`.
- Keep saved cells for shared drawing and the existing pathing callback until PR 9.
- Test layer defaults, neutral values, sparse cells, invalid loads, and unchanged tile costs.

### PR 4: Typed travel boundaries

Acceptance:
- Add `validateTileTravelInput` and `validateTileTravelNeighborhood` in the travel rule helpers.
- Accept tile POJOs and a 3x3 neighborhood with a required center and destination.
- Convert matrix positions to the existing clockwise direction indexes in one place.
- Keep transport, direction, water-layer, and active-river validation.
- Share modifier and crossing calculations; do not duplicate rule algorithms.
- Add a typed cliff-difference entry point using the existing calculation.
- Keep the raw cliff helper for the renderer and 3D map.
- Test null neighbors, malformed neighborhoods, water exceptions, and the exact 75 m cliff threshold.

### PR 5: Terrain checks

Depends on PR 4.

Acceptance:
- Migrate [terrain-skill-check.js](../docs/scripts/world/game-rules/terrain-skill-check.js) to tile POJOs.
- Remove saved-cell copying and catalog default resolution from that module.
- Preserve every skill, trait, target number, bridge rule, and invalid-transport result.
- Update its callers and [tests](../tests/world/game-rules/terrain-skill-check.test.mjs).

### PR 6: Border checks

Acceptance:
- Migrate [border-skill-check.js](../docs/scripts/world/game-rules/border-skill-check.js) to current and destination POJOs.
- Remove duplicate catalog resolution without changing border or continuous-road rules.
- Preserve neutral territory and alternative check results.
- Update its callers and [tests](../tests/world/game-rules/border-skill-check.test.mjs).

### PR 7: River crossings

Depends on PR 4.

Acceptance:
- Migrate [river-skill-check.js](../docs/scripts/world/game-rules/river-skill-check.js) to the typed neighborhood.
- Use boolean river flags and the existing clockwise direction meanings.
- Preserve diagonal flank selection, incoming connections, bridge bypasses, and upstream checks.
- Update its callers and [tests](../tests/world/game-rules/river-skill-check.test.mjs).

### PR 8: Cliff crossings

Depends on PR 4.

Acceptance:
- Migrate [cliff-skill-check.js](../docs/scripts/world/game-rules/cliff-skill-check.js) to the typed neighborhood.
- Use the shared typed cliff calculation.
- Preserve water exceptions, infrastructure bypasses, and each target-number threshold.
- Update its callers and [tests](../tests/world/game-rules/cliff-skill-check.test.mjs).

### PR 9: Pathing map access

Depends on PRs 3 and 4.

Acceptance:
- Pass the data grid to `L5RPathing` instead of terrain, raw-cell, clan, and infrastructure callbacks.
- Retain the derived tile-cost callback and existing event engine.
- Use tile metadata and the shared typed crossing calculations.
- Preserve sparse-cell blocking, mode transitions, costs, checks, and travel output.
- Remove the viewer's raw pathing-cell callback after updating every caller and test fixture.
- Do not switch pathing to different skill algorithms as part of this data migration.

### PR 10: Pathing neighbors

Depends on PR 9.

Acceptance:
- Retrieve neighbors through `getGrid9`.
- Exclude the center, outside-map positions, and unsaved cells.
- Preserve the existing search order and diagonal cost multiplier.
- Test exact paths and equal-cost tie-breaking, not only destination reachability.

### PR 11: Cleanup and integration

Depends on PRs 5 through 10.

Acceptance:
- Remove unused raw travel validators and duplicated query helpers after confirming that no callers remain.
- Retain raw file, renderer, and 3D APIs that are outside this phase.
- Extend JSDoc checks for the migrated data-query boundaries.
- Run the combined affected rule, viewer, and data tests.
- Verify browser page text, console errors, and drawing data without screenshots.

## Validation and size limits

- Run the smallest combined test selection covering each PR.
- Run header and tile type checks after changing shared data contracts.
- Run JavaScript lint and the repository format/lint script.
- Preserve unrelated worktree changes when formatting.
- Report existing HTML validation failures separately.
- Split a PR again if its actual code changes exceed 200 lines.
- Do not consider the migration complete until all scoped consumers use the data grid and behavior is verified.

## Later editor phase

Plan this phase separately after the read-only consumers are migrated.
Add grid tile-replacement operations while keeping each POJO immutable.
Define travel-cache and drawing invalidation for replacements.
Decide header replacement and map resizing separately; do not mutate header attributes.
The shared renderer and 3D map need separate migration and performance acceptance tests.
