import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { inferRiverDirections } from "../docs/scripts/river-directions.js";
import { RIVER_OFFSETS } from "../docs/scripts/world-map-img-river.js";

const flow = (grid, key) => Object.entries(grid[key]["river direction"])
  .filter(([, flag]) => flag === 1).map(([direction]) => Number(direction));

test("coastal BFS directs branches and diagonals to the coast before inland water", () => {
  const grid = {
    "0,0": { terrain: 4 }, "1,0": { river: 1 }, "2,0": { river: 1 },
    "3,1": { river: 1 }, "3,2": { terrain: 3 }, "2,-1": { river: 1 },
  };
  inferRiverDirections(grid);
  assert.deepEqual(flow(grid, "1,0"), [6]);
  assert.deepEqual(flow(grid, "2,0"), [6]);
  assert.deepEqual(flow(grid, "3,1"), [7]);
  assert.deepEqual(flow(grid, "2,-1"), [5]);
});

test("highland sources favor the farther inland water outlet", () => {
  const grid = {
    "-1,0": { terrain: 2 }, "0,0": { river: 1 }, "1,0": { river: 1 },
    "2,0": { river: 1 }, "3,0": { terrain: 3 }, "0,1": { terrain: 3 },
  };
  inferRiverDirections(grid);
  for (const key of ["0,0", "1,0", "2,0"]) assert.deepEqual(flow(grid, key), [2]);
});

test("remaining rivers use inland water BFS", () => {
  const grid = { "0,0": { terrain: 3 }, "0,1": { river: 1 }, "0,2": { river: 1 } };
  inferRiverDirections(grid);
  assert.deepEqual(flow(grid, "0,1"), [0]);
  assert.deepEqual(flow(grid, "0,2"), [0]);
});

test("disconnected rivers get directions and existing corrections stay unchanged", () => {
  const grid = { "0,0": { river: 1 }, "1,0": { river: 1, "river direction": { 3: 1 } } };
  inferRiverDirections(grid);
  assert.equal(flow(grid, "0,0").length, 1);
  assert.deepEqual(grid["1,0"]["river direction"], { 3: 1 });
  const original = structuredClone(grid);
  inferRiverDirections(grid);
  assert.deepEqual(grid, original);
});

test("coastal BFS respects a corrected flow toward an inland lake", () => {
  const grid = {
    "0,0": { terrain: 4 }, "1,0": { river: 1, "river direction": { 2: 1 } },
    "2,0": { river: 1 }, "3,0": { terrain: 3 },
  };
  inferRiverDirections(grid);
  assert.deepEqual(flow(grid, "1,0"), [2]);
  assert.deepEqual(flow(grid, "2,0"), [2]);
});

test("a disconnected river block uses a boundary exit instead of its interior", () => {
  const grid = { "1,1": { river: 1 } };
  for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) grid[`${x},${y}`] = { river: 1 };
  }
  inferRiverDirections(grid);
  for (const key of Object.keys(grid)) {
    const visited = new Set();
    let current = key;
    while (grid[current]?.river) {
      assert.equal(visited.has(current), false);
      visited.add(current);
      const [, dx, dy] = RIVER_OFFSETS[flow(grid, current)[0]];
      const [x, y] = current.split(",").map(Number);
      current = `${x + dx},${y + dy}`;
    }
  }
});

test("saved river directions reach water or a disconnected endpoint without cycles", () => {
  const grid = JSON.parse(readFileSync(new URL("../docs/data/world-map-grid.json", import.meta.url)));
  for (const [key, cell] of Object.entries(grid)) {
    if (!cell.river) continue;
    const visited = new Set();
    let current = key;
    while (grid[current]?.river) {
      assert.equal(visited.has(current), false, `Flow cycle from ${key}`);
      visited.add(current);
      const directions = flow(grid, current);
      assert.equal(directions.length, 1);
      assert.equal(Object.keys(grid[current]["river direction"]).length, 8);
      const [, dx, dy] = RIVER_OFFSETS[directions[0]];
      const [x, y] = current.split(",").map(Number);
      current = `${x + dx},${y + dy}`;
    }
  }
});
