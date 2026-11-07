// @ts-check
// Compile this file only. The invalid operations test the type contract.

import { createWorldMapTile } from "../../../docs/scripts/world/data/world-map-data-tile-factory.js";
import { WorldMapDataTile } from "../../../docs/scripts/world/data/world-map-data-tile.js";
import { WorldMapDataTileReadOnly } from "../../../docs/scripts/world/data/world-map-data-tile-read-only.js";

const writable = new WorldMapDataTile(createWorldMapTile(0, 0, { text: "Lake" }));
writable.x = 1;
writable.elevation = 75;
writable.terrain = { id: 1, name: "hills" };
writable.riverDirections[0] = true;
if (writable.label !== null) writable.label.englishText = "Changed";
/** @type {WorldMapDataTileReadOnly} */
const tile = new WorldMapDataTileReadOnly(writable);

/** @type {number} */
const terrainId = tile.terrain.id;
/** @type {number} */
const crimeLevel = tile.crime.value;
/** @type {string} */
const settlementType = tile.settlement.rokuganiType;
new WorldMapDataTile({ ...tile, x: terrainId + crimeLevel, englishName: settlementType });

// @ts-expect-error Coordinates must be numbers.
new WorldMapDataTile({ ...tile, x: "0" });
// @ts-expect-error A tile needs all its fields.
new WorldMapDataTile({ x: 0, y: 0 });
// @ts-expect-error A tile has exactly eight river flags.
new WorldMapDataTile({ ...tile, riverDirections: [false] });
// @ts-expect-error Catalog IDs must be numbers.
new WorldMapDataTile({ ...tile, terrain: { id: "0", name: "flat" } });
// @ts-expect-error A class must be called with new.
WorldMapDataTile(tile);
// @ts-expect-error Tile properties are read-only.
tile.x = 1;
// @ts-expect-error Catalog attributes cannot be reassigned.
tile.terrain = { id: 0, name: "flat" };
// @ts-expect-error Catalog properties are read-only.
tile.terrain.id = 1;
// @ts-expect-error Level properties are read-only.
tile.crime.value = 1;
// @ts-expect-error River flags are read-only.
tile.riverDirections[0] = true;
// @ts-expect-error River flags cannot be appended.
tile.riverDirections.push(true);
// @ts-expect-error Unknown tile properties are not allowed.
tile.extra = true;
if (tile.label !== null) {
  /** @type {number|null} */
  const fontSize = tile.label.fontSize;
  new WorldMapDataTile({ ...tile, label: { ...tile.label, fontSize } });
  // @ts-expect-error Label properties are read-only.
  tile.label.englishText = "Changed";
}
