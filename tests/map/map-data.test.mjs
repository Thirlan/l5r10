import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createMapHeader, readMapFile } from "../../docs/scripts/world/world-map-file.js";
import { CLAN, CLIMATE, SETTLEMENT, TERRAIN, VEGETATION } from "../../docs/scripts/world/world-map-layers.js";
import { MapModel, createMapModel, describeMapModel, directionMask, isWaterTerrain, loadMapModel } from "../../docs/map/scripts/map-data.js";

const SIZE = { columns: 3, rows: 2 };
const MAP_FILE_URL = new URL("../../docs/data/world-map-grid.json", import.meta.url);

test("missing layers resolve to flat, temperate, and no vegetation", () => {
  // Setup
  const model = new MapModel({ "0,0": {}, "1,0": { terrain: TERRAIN.HILLS.id } }, SIZE);

  // Execution
  const values = [model.valueAt("terrain", 0, 0), model.valueAt("climate", 0, 0), model.valueAt("vegetation", 2, 1), model.valueAt("terrain", 1, 0)];

  // Assertion
  assert.deepEqual(values, [TERRAIN.FLAT, CLIMATE.TEMPERATE, VEGETATION.NONE, TERRAIN.HILLS]);
});

test("cells outside the map size are counted and skipped", () => {
  // Setup
  const grid = { "0,0": { terrain: TERRAIN.OCEAN.id }, "0,2": { terrain: TERRAIN.OCEAN.id }, "3,0": {} };

  // Execution
  const counts = new MapModel(grid, SIZE).counts();

  // Assertion
  assert.equal(counts.outside, 2);
  assert.equal(counts.water, 1);
});

test("unknown saved numbers keep the default value and are counted", () => {
  // Setup
  const grid = { "0,0": { terrain: 99, climate: CLIMATE.DESERT.id } };

  // Execution
  const model = new MapModel(grid, SIZE);

  // Assertion
  assert.equal(model.valueAt("terrain", 0, 0), TERRAIN.FLAT);
  assert.equal(model.valueAt("climate", 0, 0), CLIMATE.DESERT);
  assert.equal(model.counts().unknown, 1);
});

test("direction flags become a bit mask with north as bit 0", () => {
  // Execution
  const mask = directionMask({ 0: 1, 1: 0, 2: 1, 7: 1, 8: 1 });

  // Assertion
  assert.equal(mask, 0b10000101);
  assert.equal(directionMask(undefined), 0);
  assert.throws(() => directionMask("north"), TypeError);
});

test("settlements keep their clan and both names", () => {
  // Setup
  const grid = { "2,1": { settlement: SETTLEMENT.CASTLE.id, clan: CLAN.CRANE.id, englishName: "Son of the Crane", rokuganiName: "Daidoji" } };

  // Execution
  const [settlement] = new MapModel(grid, SIZE).settlements;

  // Assertion
  assert.deepEqual(settlement, { x: 2, y: 1, settlement: SETTLEMENT.CASTLE, clan: CLAN.CRANE, englishName: "Son of the Crane", rokuganiName: "Daidoji" });
});

test("land bounds ignore water cells", () => {
  // Setup
  const ocean = { terrain: TERRAIN.OCEAN.id };
  const grid = { "0,0": ocean, "1,0": {}, "2,0": ocean, "0,1": ocean, "1,1": ocean, "2,1": ocean };

  // Execution
  const bounds = new MapModel(grid, SIZE).landBounds;

  // Assertion
  assert.deepEqual(bounds, { minX: 1, maxX: 1, minY: 0, maxY: 0 });
  assert.equal(isWaterTerrain(TERRAIN.WETLANDS.id), false);
});

test("the live map file loads with counts that match the saved file", () => {
  // Setup
  const { header, tiles } = readMapFile(JSON.parse(readFileSync(MAP_FILE_URL, "utf8")));
  const inside = Object.entries(tiles).filter(([key]) => {
    const [x, y] = key.split(",").map(Number);
    return x >= 0 && y >= 0 && x <= header.maxX && y <= header.maxY;
  });
  const saved = (field) => inside.filter(([, cell]) => cell[field]).length;

  // Execution
  const model = createMapModel({ ...header, tiles });
  const counts = model.counts();

  // Assertion
  assert.equal(counts.unknown, 0);
  assert.equal(counts.outside, Object.keys(tiles).length - inside.length);
  assert.equal(counts.rivers, saved("river"));
  assert.equal(counts.settlements, saved("settlement"));
  assert.equal(counts.resources, saved("resource"));
  assert.equal(counts.labels, saved("text"));
  assert.equal(counts.infrastructure, saved("infrastructure"));
  assert.equal(counts.cells, (header.maxX + 1) * (header.maxY + 1));
});

test("a map model keeps the header of the map file and takes its size from maxX and maxY", () => {
  // Setup
  const header = createMapHeader({ columns: 3, rows: 2 });
  header.name = "Rokugan 900 IC";
  header.seed = 846894882;

  // Execution
  const model = createMapModel({ ...header, tiles: { "2,1": { terrain: TERRAIN.OCEAN.id } } });

  // Assertion
  assert.deepEqual(model.header, header);
  assert.deepEqual([model.columns, model.rows], [3, 2]);
  assert.equal(model.isWater(2, 1), true);
});

test("a map model rejects the old map format without a header", () => {
  // Execution
  const create = () => createMapModel({ "0,0": { terrain: TERRAIN.OCEAN.id } });

  // Assertion
  assert.throws(create, /needs a "tiles" object/);
});

test("a map model without a header gets a new map header for its size", () => {
  // Execution
  const { header } = new MapModel({}, SIZE);

  // Assertion
  assert.deepEqual([header.maxX, header.maxY, header.seed], [2, 1, 0]);
});

test("a map model rejects a header that is not an object", () => {
  // Execution
  const create = () => new MapModel({}, SIZE, "Rokugan");

  // Assertion
  assert.throws(create, /header must be an object/);
});

test("the map model loader reads the map file from the URL", async (t) => {
  // Setup
  const header = createMapHeader({ columns: 3, rows: 2 });
  const fetching = t.mock.method(globalThis, "fetch", async () => ({ ok: true, json: async () => ({ ...header, tiles: {} }) }));

  // Execution
  const model = await loadMapModel("../data/world-map-grid.json");

  // Assertion
  assert.deepEqual(fetching.mock.calls[0].arguments, ["../data/world-map-grid.json"]);
  assert.deepEqual(model.header, header);
});

test("the map model loader reports a failed request", async (t) => {
  // Setup
  t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 404 }));

  // Execution
  const loading = loadMapModel("../data/world-map-grid.json");

  // Assertion
  await assert.rejects(loading, /Could not load the map file \(404\)/);
});

test("the map readout starts with the name, version, update date, and seed", () => {
  // Setup
  const header = { ...createMapHeader({ columns: 3, rows: 2 }), name: "Rokugan 900 IC", version: "0.9.0", lastUpdated: "2026/10/27", seed: 846894882 };
  const model = createMapModel({ ...header, tiles: {} });

  // Execution
  const [firstLine, secondLine] = describeMapModel(model).split("\n");

  // Assertion
  assert.equal(firstLine, "Rokugan 900 IC, version 0.9.0, updated 2026/10/27, seed 846894882.");
  assert.match(secondLine, /^Loaded 6 cells \(3 × 2\)/);
});
