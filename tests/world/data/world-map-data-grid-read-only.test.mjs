import assert from "node:assert/strict";
import test from "node:test";
import { WorldMapDataGridReadOnly } from "../../../docs/scripts/world/data/world-map-data-grid-read-only.js";
import { MapHeaderReadOnly } from "../../../docs/scripts/world/data/world-map-data-header-read-only.js";
import { WorldMapDataTileReadOnly } from "../../../docs/scripts/world/data/world-map-data-tile-read-only.js";
import { createMapHeader } from "../../../docs/scripts/world/data/world-map-data-file.js";

test("a read-only grid owns frozen header and tile snapshots", () => {
  const source = { ...createMapHeader({ columns: 2, rows: 2 }), tiles: { "0,0": { text: "Lake" } } };
  const grid = new WorldMapDataGridReadOnly(source);
  assert.ok(grid.header instanceof MapHeaderReadOnly);
  assert.ok(grid.get(0, 0) instanceof WorldMapDataTileReadOnly);
  assert.ok(Object.isFrozen(grid));
  assert.ok(Object.isFrozen(grid.header));
  assert.ok(Object.isFrozen(grid.get(0, 0)));
  assert.throws(() => {
    grid.header.name = "Changed";
  }, TypeError);
  assert.throws(() => {
    grid.header = source;
  }, TypeError);
  assert.throws(() => {
    grid.get(0, 0).label.englishText = "Changed";
  }, TypeError);
  source.name = "Changed";
  source.tiles["0,0"].text = "Changed";
  assert.equal(grid.header.name, "Untitled map");
  assert.equal(grid.get(0, 0).label.englishText, "Lake");
  const neighbors = grid.getGrid9(0, 0);
  neighbors[1][1] = null;
  assert.notEqual(grid.get(0, 0), null);
});
