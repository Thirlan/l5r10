import assert from "node:assert/strict";
import test from "node:test";
import { CLAN, CLIMATE, INFRASTRUCTURE, RESOURCE, SETTLEMENT, TERRAIN, VEGETATION } from "../../docs/scripts/world/world-map-layers.js";
import { cellAtWorld, describeCell } from "../../docs/map/scripts/cell-inspector.js";
import { MapModel } from "../../docs/map/scripts/map-data.js";
import { HeightField } from "../../docs/map/scripts/terrain-height.js";

const SIZE = Object.freeze({ columns: 4, rows: 3 });

/** A named castle on hills and an unnamed village, on a 4 × 3 grid. */
function inspectorModel() {
  const grid = {
    "1,1": {
      terrain: TERRAIN.HILLS.id,
      climate: CLIMATE.DESERT.id,
      vegetation: VEGETATION.PRESENT.id,
      infrastructure: INFRASTRUCTURE.ROAD.id,
      clan: CLAN.CRANE.id,
      resource: RESOURCE.IRON_MINE.id,
      settlement: SETTLEMENT.CASTLE.id,
      englishName: "Son of the Crane",
      rokuganiName: "Daidoji",
    },
    "2,0": { settlement: SETTLEMENT.VILLAGE.id },
  };
  return new MapModel(grid, SIZE);
}

test("a world position gives the cell that contains it, with rows counted from the north", () => {
  // Setup
  const points = [
    { x: 0, z: 3 },
    { x: 0.5, z: 2.5 },
    { x: 3.99, z: 0.01 },
    { x: 1.2, z: 1.7 },
  ];

  // Execution
  const cells = points.map((point) => cellAtWorld(point, SIZE));

  // Assertion
  assert.deepEqual(cells, [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 3, y: 2 },
    { x: 1, y: 1 },
  ]);
});

test("a world position outside the map gives null", () => {
  // Setup
  const points = [
    { x: -0.1, z: 1 },
    { x: 4, z: 1 },
    { x: 1, z: 0 },
    { x: 1, z: 3.5 },
  ];

  // Execution
  const cells = points.map((point) => cellAtWorld(point, SIZE));

  // Assertion
  assert.deepEqual(cells, [null, null, null, null]);
});

test("a world position that is not finite causes a TypeError", () => {
  // Setup
  const points = [null, { x: 1 }, { x: Number.NaN, z: 1 }];

  // Execution and Assertion
  points.forEach((point) => assert.throws(() => cellAtWorld(point, SIZE), TypeError));
});

test("the description has the coordinates, the height, each layer value, and the settlement names", () => {
  // Setup
  const field = new HeightField(inspectorModel());

  // Execution
  const rows = describeCell(field, 1, 1);

  // Assertion
  assert.deepEqual(rows, [
    ["Cell", "1, 1"],
    ["Height", field.sample(1.5, 1.5).toFixed(2)],
    ["Terrain", "hills"],
    ["Climate", "desert"],
    ["Vegetation", "Vegetation"],
    ["River", "none"],
    ["Infrastructure", "Road"],
    ["Clan", "Crane"],
    ["Resource", "Iron Mine"],
    ["Settlement", "Castle: Son of the Crane / Daidoji"],
  ]);
});

test("a settlement without a name and an empty cell show only the settlement type", () => {
  // Setup
  const field = new HeightField(inspectorModel());

  // Execution
  const [village, empty] = [describeCell(field, 2, 0), describeCell(field, 3, 2)];

  // Assertion
  assert.deepEqual(village.at(-1), ["Settlement", "Village"]);
  assert.deepEqual(empty.at(-1), ["Settlement", "none"]);
  assert.deepEqual(empty.slice(2, 4), [
    ["Terrain", "flat"],
    ["Climate", "temperate"],
  ]);
});

test("a cell outside the map causes a TypeError", () => {
  // Setup
  const field = new HeightField(inspectorModel());

  // Execution and Assertion
  assert.throws(() => describeCell(field, 4, 0), TypeError);
  assert.throws(() => describeCell(null, 0, 0), TypeError);
});
