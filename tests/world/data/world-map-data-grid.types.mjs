// @ts-check

import { WorldMapDataGrid } from "../../../docs/scripts/world/data/world-map-data-grid.js";
import { WorldMapDataGridReadOnly } from "../../../docs/scripts/world/data/world-map-data-grid-read-only.js";
import { TERRAIN } from "../../../docs/scripts/world/data/world-map-data-layers.js";

const data = { name: "Map", summary: "", seed: 1, maxX: 1, maxY: 1, version: "1", lastUpdated: "2026/11/07", tiles: {} };
const writable = new WorldMapDataGrid(data);
writable.header.name = "Changed";
const editableTile = writable.get(0, 0);
if (editableTile !== null) {
  editableTile.terrain = TERRAIN.HILLS;
  editableTile.elevation = 75;
  editableTile.riverDirections[0] = true;
  if (editableTile.label !== null) editableTile.label.englishText = "Changed";
}

const snapshot = new WorldMapDataGridReadOnly(data);
// @ts-expect-error Snapshot headers are read-only.
snapshot.header.name = "Changed";
// @ts-expect-error A grid header cannot be replaced.
snapshot.header = writable.header;
// @ts-expect-error Grid dimensions are fixed.
writable.columns = 5;
const tile = snapshot.get(0, 0);
if (tile !== null) {
  // @ts-expect-error Snapshot tiles are read-only.
  tile.elevation = 75;
  // @ts-expect-error Snapshot river flags are read-only.
  tile.riverDirections[0] = true;
  if (tile.label !== null) {
    // @ts-expect-error Snapshot labels are read-only.
    tile.label.englishText = "Changed";
  }
}
const center = snapshot.getGrid9(0, 0)[1][1];
if (center !== null) {
  // @ts-expect-error Neighborhood queries also return read-only tiles.
  center.terrain = TERRAIN.HILLS;
}
// @ts-expect-error Query coordinates must be numbers.
snapshot.get("0", 0);
