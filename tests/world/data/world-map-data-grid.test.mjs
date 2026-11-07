import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { WorldMapDataGrid as WritableGrid } from "../../../docs/scripts/world/data/world-map-data-grid.js";
import { WorldMapDataGridReadOnly } from "../../../docs/scripts/world/data/world-map-data-grid-read-only.js";
import { CLAN, SETTLEMENT, TERRAIN } from "../../../docs/scripts/world/data/world-map-data-layers.js";
import { WorldMapDataTile } from "../../../docs/scripts/world/data/world-map-data-tile.js";
import { MapHeader } from "../../../docs/scripts/world/data/world-map-data-header.js";

const MAP_FILE_URL = new URL("../../../docs/data/world-map-grid.json", import.meta.url);

function createMapFile(tiles = {}) {
  return { name: "Test map", summary: "", seed: 1, maxX: 2, maxY: 1, version: "0.1.0", lastUpdated: "2026/11/07", tiles };
}

function testGrid(name, run) {
  for (const Grid of [WritableGrid, WorldMapDataGridReadOnly]) {
    test(`${Grid.name}: ${name}`, () => run(Grid));
  }
}

testGrid("the grid makes a tile for each coordinate of the map", (WorldMapDataGrid) => {
  // Execution
  const grid = new WorldMapDataGrid(createMapFile({ "1,1": { terrain: 3 } }));

  // Assertion
  assert.equal(grid.columns, 3);
  assert.equal(grid.rows, 2);
  assert.equal(grid.header.name, "Test map");
  assert.ok(grid.header instanceof MapHeader);
  assert.equal(grid.get(1, 1).terrain, TERRAIN.WATER);
  assert.ok(grid.get(1, 1) instanceof WorldMapDataTile);
  assert.ok(grid.get(2, 0) instanceof WorldMapDataTile);
  assert.equal(grid.get(2, 0).terrain, TERRAIN.FLAT);
  assert.deepEqual([grid.get(2, 0).x, grid.get(2, 0).y], [2, 0]);
});

testGrid("get returns null outside the map and rejects coordinates that are not integers", (WorldMapDataGrid) => {
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

testGrid("the grid ignores saved cells outside maxX and maxY", (WorldMapDataGrid) => {
  // Execution
  const grid = new WorldMapDataGrid(createMapFile({ "5,5": { terrain: 3 } }));

  // Assertion
  assert.equal(grid.get(5, 5), null);
});

testGrid("the grid reads JSON text and rejects a bad header", (WorldMapDataGrid) => {
  // Execution
  const grid = new WorldMapDataGrid(JSON.stringify(createMapFile({ "0,0": { clan: 2 } })));

  // Assertion
  assert.equal(grid.get(0, 0).clan, CLAN.CRANE);
  assert.throws(() => new WorldMapDataGrid({ ...createMapFile(), maxX: -1 }), TypeError);
});

testGrid("getGrid9 returns rows of tiles centered on x,y", (WorldMapDataGrid) => {
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

testGrid("getGrid9 uses null for tiles outside the map", (WorldMapDataGrid) => {
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

testGrid("the saved world map loads into a grid", (WorldMapDataGrid) => {
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
test("a writable grid exposes editable header and tile data", () => {
  const grid = new WritableGrid(createMapFile({ "0,0": { text: "Lake" } }));
  grid.header.name = "Changed";
  grid.get(0, 0).terrain = TERRAIN.HILLS;
  grid.get(0, 0).riverDirections[0] = true;
  grid.get(0, 0).label.englishText = "Changed";
  assert.equal(grid.header.name, "Changed");
  assert.equal(grid.getGrid9(0, 0)[1][1].terrain, TERRAIN.HILLS);
  assert.equal(grid.get(0, 0).riverDirections[0], true);
  assert.equal(grid.get(0, 0).label.englishText, "Changed");
});

test("grid dimensions remain fixed until a new grid is constructed", () => {
  const grid = new WritableGrid(createMapFile());
  grid.header.maxX = 0;
  assert.equal(grid.columns, 3);
  assert.equal(grid.isInside(2, 0), true);
  const resized = new WritableGrid({ ...grid.header, tiles: {} });
  assert.equal(resized.columns, 1);
  assert.equal(resized.get(2, 0), null);
});
