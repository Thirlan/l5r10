import assert from "node:assert/strict";
import test from "node:test";
import { createWorldMapTile } from "../../../docs/scripts/world/data/world-map-data-tile-factory.js";
import { WorldMapDataTileReadOnly } from "../../../docs/scripts/world/data/world-map-data-tile-read-only.js";

test("a read-only tile is an independent snapshot with frozen nested data", () => {
  const writable = createWorldMapTile(3, 4, { text: "Lake" });
  const tile = new WorldMapDataTileReadOnly(writable);
  assert.ok(tile instanceof WorldMapDataTileReadOnly);
  assert.deepEqual(Object.getOwnPropertyNames(WorldMapDataTileReadOnly.prototype), ["constructor"]);
  assert.deepEqual({ ...tile }, { ...writable });
  assert.equal(tile.terrain, writable.terrain);
  assert.notEqual(tile.riverDirections, writable.riverDirections);
  assert.notEqual(tile.label, writable.label);
  assert.ok(Object.isFrozen(tile));
  Object.entries(tile).forEach(([field, value]) => {
    assert.throws(() => {
      tile[field] = null;
    }, TypeError);
    if (value !== null && typeof value === "object") assert.ok(Object.isFrozen(value));
  });
  assert.throws(() => {
    tile.riverDirections[0] = true;
  }, TypeError);
  assert.throws(() => {
    tile.label.englishText = "Changed";
  }, TypeError);
  writable.elevation = 75;
  writable.riverDirections[0] = true;
  writable.label.englishText = "Changed";
  assert.equal(tile.elevation, 1);
  assert.equal(tile.riverDirections[0], false);
  assert.equal(tile.label.englishText, "Lake");
  assert.equal(new WorldMapDataTileReadOnly(createWorldMapTile(0, 0)).label, null);
});
