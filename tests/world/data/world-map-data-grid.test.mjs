import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { WorldMapDataGrid } from "../../../docs/scripts/world/data/world-map-data-grid.js";
import { CLAN, SETTLEMENT, TERRAIN } from "../../../docs/scripts/world/data/world-map-layers.js";
import { WorldMapTile } from "../../../docs/scripts/world/data/world-map-tile.js";

const MAP_FILE_URL = new URL("../../../docs/data/world-map-grid.json", import.meta.url);

function createMapFile(tiles = {}) {
  return { name: "Test map", summary: "", seed: 1, maxX: 2, maxY: 1, version: "0.1.0", lastUpdated: "2026/11/07", tiles };
}

test("the grid makes a tile for each coordinate of the map", () => {
  // Execution
  const grid = new WorldMapDataGrid(createMapFile({ "1,1": { terrain: 3 } }));

  // Assertion
  assert.equal(grid.columns, 3);
  assert.equal(grid.rows, 2);
  assert.equal(grid.header.name, "Test map");
  assert.equal(grid.get(1, 1).terrain, TERRAIN.WATER);
  assert.ok(grid.get(1, 1) instanceof WorldMapTile);
  assert.ok(grid.get(2, 0) instanceof WorldMapTile);
  assert.equal(grid.get(2, 0).terrain, TERRAIN.FLAT);
  assert.deepEqual([grid.get(2, 0).x, grid.get(2, 0).y], [2, 0]);
});

test("get returns null outside the map and rejects coordinates that are not integers", () => {
  // Setup
  const grid = new WorldMapDataGrid(createMapFile());

  // Assertion
  [
    [-1, 0],
    [0, -1],
    [3, 0],
    [0, 2],
  ].forEach(([x, y]) => assert.equal(grid.get(x, y), null));
  assert.throws(() => grid.get(0.5, 0), TypeError);
  assert.throws(() => grid.get("1", 0), TypeError);
});

test("the grid ignores saved cells outside maxX and maxY", () => {
  // Execution
  const grid = new WorldMapDataGrid(createMapFile({ "5,5": { terrain: 3 } }));

  // Assertion
  assert.equal(grid.get(5, 5), null);
});

test("the grid reads JSON text and rejects a bad header", () => {
  // Execution
  const grid = new WorldMapDataGrid(JSON.stringify(createMapFile({ "0,0": { clan: 2 } })));

  // Assertion
  assert.equal(grid.get(0, 0).clan, CLAN.CRANE);
  assert.throws(() => new WorldMapDataGrid({ ...createMapFile(), maxX: -1 }), TypeError);
});

test("getGrid9 returns rows of tiles centered on x,y", () => {
  // Setup
  const grid = new WorldMapDataGrid({ ...createMapFile(), maxY: 2 });

  // Execution
  const grid9 = grid.getGrid9(1, 1);

  // Assertion
  assert.deepEqual(
    grid9.map((row) => row.map((tile) => `${tile.x},${tile.y}`)),
    [
      ["0,0", "1,0", "2,0"],
      ["0,1", "1,1", "2,1"],
      ["0,2", "1,2", "2,2"],
    ],
  );
});

test("getGrid9 uses null for tiles outside the map", () => {
  // Setup
  const grid = new WorldMapDataGrid(createMapFile());

  // Execution
  const grid9 = grid.getGrid9(0, 0);

  // Assertion
  assert.deepEqual(
    grid9.map((row) => row.map((tile) => (tile ? `${tile.x},${tile.y}` : null))),
    [
      [null, null, null],
      [null, "0,0", "1,0"],
      [null, "0,1", "1,1"],
    ],
  );
  assert.throws(() => grid.getGrid9(0, Number.NaN), TypeError);
});

test("the saved world map loads into a grid", () => {
  // Setup
  const data = JSON.parse(readFileSync(MAP_FILE_URL, "utf8"));

  // Execution
  const grid = new WorldMapDataGrid(data);

  // Assertion
  assert.equal(grid.columns, data.maxX + 1);
  assert.equal(grid.rows, data.maxY + 1);
  assert.equal(grid.get(86, 84).settlement, SETTLEMENT.CASTLE);
  assert.equal(grid.get(86, 84).englishName, "Son of the Crane");
  assert.equal(grid.get(82, 85).label.englishText, "Fukou Lake");
  assert.equal(grid.get(20, 11).label.rokuganiText, "Sorrow's Path");
  assert.equal(grid.get(data.maxX, data.maxY).y, data.maxY);
});
