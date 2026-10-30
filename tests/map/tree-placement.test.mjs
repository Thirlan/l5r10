import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { CLIMATE, INFRASTRUCTURE, SETTLEMENT, TERRAIN, VEGETATION } from "../../docs/scripts/world/world-map-layers.js";
import { MapModel, createMapModel } from "../../docs/map/scripts/map-data.js";
import { ROAD_STYLES } from "../../docs/map/scripts/road-paths.js";
import { HeightField } from "../../docs/map/scripts/terrain-height.js";
import { chunkIndexAt } from "../../docs/map/scripts/terrain-chunks.js";
import { ROAD_MARGIN, SETTLEMENT_CLEARING, TREES_PER_CELL, TREE_KINDS, TREE_MIN_HEIGHT, TREE_MIN_NORMAL, buildTreeGroups, coniferShare, placeTrees, treeRandom } from "../../docs/map/scripts/tree-placement.js";

const COLUMNS = 6;
const ROWS = 6;
const ROAD_ROW = 2;
const VILLAGE = [4, 4];

/** A forest of 6 × 6 cells with a road along row 2 and a village at (4, 4). */
function forestModel() {
  const grid = Object.fromEntries(
    Array.from({ length: COLUMNS * ROWS }, (_, index) => {
      const [x, y] = [index % COLUMNS, Math.floor(index / COLUMNS)];
      const cell = { vegetation: VEGETATION.PRESENT.id };
      if (y === ROAD_ROW) cell.infrastructure = INFRASTRUCTURE.ROAD.id;
      if (x === VILLAGE[0] && y === VILLAGE[1]) cell.settlement = SETTLEMENT.VILLAGE.id;
      return [`${x},${y}`, cell];
    }),
  );
  return new MapModel(grid, { columns: COLUMNS, rows: ROWS });
}

const liveField = (() => {
  let field;
  return () => {
    if (!field) {
      field = new HeightField(createMapModel(JSON.parse(fs.readFileSync(new URL("../../docs/data/world-map-grid.json", import.meta.url)))));
    }
    return field;
  };
})();

test("treeRandom is deterministic and gives values from 0 to 1", () => {
  // Execution
  const values = Array.from({ length: 200 }, (_, salt) => treeRandom(17, 42, salt));

  // Assertion
  assert.deepEqual(
    values,
    Array.from({ length: 200 }, (_, salt) => treeRandom(17, 42, salt)),
  );
  assert.ok(values.every((value) => value >= 0 && value < 1));
  assert.ok(new Set(values).size > 190);
});

test("the conifer share follows the climate and the terrain", () => {
  // Assertion
  assert.equal(coniferShare(CLIMATE.POLAR.id, TERRAIN.FLAT.id), 1);
  assert.equal(coniferShare(CLIMATE.TEMPERATE.id, TERRAIN.FLAT.id), 0.25);
  assert.equal(coniferShare(CLIMATE.TEMPERATE.id, TERRAIN.MOUNTAINS.id), 0.75);
  assert.equal(coniferShare(CLIMATE.TEMPERATE.id, TERRAIN.WETLANDS.id), 0);
  assert.equal(coniferShare(CLIMATE.TROPICAL.id, TERRAIN.FLAT.id), 0);
});

test("trees stay on the surface, off the road, and out of the settlement clearing", () => {
  // Setup
  const field = new HeightField(forestModel());

  // Execution
  const trees = placeTrees(field);
  const roadDistance = (tree) => Math.hypot(Math.max(0, 0.5 - tree.x, tree.x - (COLUMNS - 0.5)), tree.y - (ROAD_ROW + 0.5));
  const villageDistance = (tree) => Math.hypot(tree.x - VILLAGE[0] - 0.5, tree.y - VILLAGE[1] - 0.5);

  // Assertion
  assert.ok(trees.length > COLUMNS * ROWS * TREES_PER_CELL * 0.5, `${trees.length} trees`);
  assert.ok(trees.every((tree) => tree.height === field.sample(tree.x, tree.y) && tree.height >= TREE_MIN_HEIGHT));
  assert.ok(trees.every((tree) => roadDistance(tree) >= ROAD_STYLES.get(INFRASTRUCTURE.ROAD.id).width / 2 + ROAD_MARGIN));
  assert.ok(trees.every((tree) => villageDistance(tree) >= SETTLEMENT_CLEARING));
  assert.ok(trees.every((tree) => Object.values(TREE_KINDS).includes(tree.kind) && tree.color.length === 3));
  assert.throws(() => placeTrees(forestModel()), TypeError);
});

test("water cells with vegetation get no trees", () => {
  // Setup
  const grid = { "1,1": { terrain: TERRAIN.WATER.id, vegetation: VEGETATION.PRESENT.id } };
  const field = new HeightField(new MapModel(grid, { columns: 3, rows: 3 }));

  // Execution
  const trees = placeTrees(field);

  // Assertion
  assert.deepEqual(trees, []);
});

test("every tree of the live map stands on low slopes above the water, and the placement is the same each time", () => {
  // Setup
  const field = liveField();
  const normalAt = (tree) => field.normals[(Math.round(tree.y * field.subdivisions) * field.width + Math.round(tree.x * field.subdivisions)) * 3 + 1];

  // Execution
  const trees = placeTrees(field);
  const again = placeTrees(field);

  // Assertion
  assert.ok(trees.length > 10000, `${trees.length} trees`);
  assert.ok(trees.every((tree) => tree.height >= TREE_MIN_HEIGHT && normalAt(tree) >= TREE_MIN_NORMAL));
  assert.deepEqual(again, trees);
});

test("tree groups join the chunk of each tree", () => {
  // Setup
  const field = new HeightField(forestModel());

  // Execution
  const groups = buildTreeGroups(field, 4);

  // Assertion
  const grouped = [...groups.values()].flatMap((group) => group.trees.map((tree) => ({ group, tree })));
  assert.equal(grouped.length, placeTrees(field).length);
  assert.ok(grouped.every(({ group, tree }) => group.chunk === chunkIndexAt(COLUMNS, 4, tree.x, tree.y) && group.kind === tree.kind));
});
