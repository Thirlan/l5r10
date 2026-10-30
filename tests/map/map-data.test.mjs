import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CLAN, CLIMATE, SETTLEMENT, TERRAIN, VEGETATION } from "../../docs/scripts/world/world-map-layers.js";
import { MapModel, describeMapModel, directionMask, isWaterTerrain } from "../../docs/map/scripts/map-data.js";

const SIZE = { columns: 3, rows: 2 };

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

test("the live map grid loads with counts that match the saved file", () => {
  // Setup
  const grid = JSON.parse(readFileSync(new URL("../../docs/data/world-map-grid.json", import.meta.url), "utf8"));
  const inside = Object.entries(grid).filter(([key]) => {
    const [x, y] = key.split(",").map(Number);
    return x >= 0 && y >= 0 && x < 135 && y < 196;
  });
  const saved = (field) => inside.filter(([, cell]) => cell[field]).length;

  // Execution
  const model = new MapModel(grid, { columns: 135, rows: 196 });
  const counts = model.counts();

  // Assertion
  assert.equal(counts.unknown, 0);
  assert.equal(counts.outside, Object.keys(grid).length - inside.length);
  assert.equal(counts.rivers, saved("river"));
  assert.equal(counts.settlements, saved("settlement"));
  assert.equal(counts.resources, saved("resource"));
  assert.equal(counts.labels, saved("text"));
  assert.equal(counts.infrastructure, saved("infrastructure"));
  assert.match(describeMapModel(model), /^Loaded 26460 cells \(135 × 196\)/);
});
