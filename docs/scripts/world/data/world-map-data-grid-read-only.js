// @ts-check

import { WorldMapDataGridBase } from "./world-map-data-grid.js";
import { MapHeaderReadOnly } from "./world-map-data-header-read-only.js";
import { WorldMapDataTileReadOnly } from "./world-map-data-tile-read-only.js";
import { createWorldMapTile } from "./world-map-data-tile-factory.js";

/**
 * An independent, read-only map snapshot with the shared grid queries.
 * @extends {WorldMapDataGridBase<MapHeaderReadOnly, WorldMapDataTileReadOnly>}
 */
export class WorldMapDataGridReadOnly extends WorldMapDataGridBase {
  /** @param {Object|string} data The map file, as parsed JSON or JSON text. */
  constructor(data) {
    super(data, MapHeaderReadOnly, (x, y, cell) => new WorldMapDataTileReadOnly(createWorldMapTile(x, y, cell)));
  }
}
