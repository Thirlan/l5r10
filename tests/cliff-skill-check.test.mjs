import assert from "node:assert/strict";
import test from "node:test";
import { getSkillAndTN } from "../docs/scripts/cliff-skill-check.js";
import { SkillCheck } from "../docs/scripts/skill-check.js";
import { CLIMATE, TERRAIN } from "../docs/scripts/world-map-layers.js";

function cliffNeighbors(direction) {
  const neighbors = Array.from({ length: 8 }, () => ({}));
  [(direction + 7) % 8, (direction + 1) % 8].forEach((index) => {
    neighbors[index] = { terrain: TERRAIN.CLIFF.id, "cliff direction": { [direction]: 1 } };
  });
  return neighbors;
}

[1, 3, 5, 7].forEach((direction) =>
  test(`diagonal cliff toward ${direction}`, () => {
    // Setup
    const neighbors = cliffNeighbors(direction);
    // Assertion
    assert.deepEqual(getSkillAndTN("foot", {}, neighbors, direction), [new SkillCheck("Athletics", "Strength", 9)]);
  }),
);

test("opposite cliff normals identify the same barrier", () => {
  // Setup
  const neighbors = cliffNeighbors(1);
  neighbors[0]["cliff direction"] = { 5: 1 };
  neighbors[2]["cliff direction"] = { 5: 1 };
  // Assertion
  assert.deepEqual(getSkillAndTN("foot", {}, neighbors, 1), [new SkillCheck("Athletics", "Strength", 9)]);
});

test("parallel cliffs, absent cliffs, missing flanks, and cardinal moves do not cross", () => {
  // Setup
  const neighbors = cliffNeighbors(1);
  neighbors[0]["cliff direction"] = { 3: 1 };
  // Assertion
  assert.deepEqual(getSkillAndTN("foot", {}, neighbors, 1), []);
  neighbors[0] = {};
  assert.deepEqual(getSkillAndTN("foot", {}, neighbors, 1), []);
  neighbors[0] = null;
  assert.deepEqual(getSkillAndTN("foot", {}, neighbors, 1), []);
  assert.deepEqual(getSkillAndTN("foot", {}, neighbors, 2), []);
});

test("within-cell cliffs cross toward the edge but not alongside or away", () => {
  // Setup
  const cell = { terrain: TERRAIN.CLIFF.id, "cliff direction": { 2: 1 } };
  const neighbors = Array.from({ length: 8 }, () => ({}));
  // Assertion
  assert.deepEqual(getSkillAndTN("foot", cell, neighbors, 2), [new SkillCheck("Athletics", "Strength", 9)]);
  assert.deepEqual(getSkillAndTN("foot", cell, neighbors, 0), []);
  assert.deepEqual(getSkillAndTN("foot", cell, neighbors, 6), []);
});

test("within-cell and diagonal cliffs return separate checks", () => {
  // Setup
  const cell = { terrain: TERRAIN.CLIFF.id, "cliff direction": { 1: 1 } };
  const neighbors = cliffNeighbors(1);
  const original = structuredClone({ cell, neighbors });
  // Execution
  const checks = getSkillAndTN("foot", cell, neighbors, 1);
  // Assertion
  assert.deepEqual(checks, [new SkillCheck("Athletics", "Strength", 9), new SkillCheck("Athletics", "Strength", 9)]);
  assert.notEqual(checks[0], checks[1]);
  assert.deepEqual({ cell, neighbors }, original);
});

test("roads bypass both cliff crossings", () => {
  // Setup
  const neighbors = cliffNeighbors(1);
  const cell = { terrain: TERRAIN.CLIFF.id, "cliff direction": { 1: 1 }, infrastructure: 1 };
  neighbors[1].infrastructure = 1;
  // Assertion
  assert.deepEqual(getSkillAndTN("horse", cell, neighbors, 1), []);
});

test("footpaths bypass cliff crossings only on foot", () => {
  // Setup
  const neighbors = cliffNeighbors(1);
  const cell = { terrain: TERRAIN.CLIFF.id, "cliff direction": { 1: 1 }, infrastructure: 2 };
  neighbors[1].infrastructure = 2;
  // Assertion
  assert.deepEqual(getSkillAndTN("foot", cell, neighbors, 1), []);
  assert.deepEqual(getSkillAndTN("horse", cell, neighbors, 1), [new SkillCheck("Athletics", "Strength", 7), new SkillCheck("Athletics", "Strength", 7)]);
});

test("incomplete bypasses leave diagonal checks independent of clan borders", () => {
  // Setup
  const neighbors = cliffNeighbors(1);
  neighbors[1].clan = 2;
  // Assertion
  assert.deepEqual(getSkillAndTN("foot", { clan: 1, infrastructure: 1 }, neighbors, 1), [new SkillCheck("Athletics", "Strength", 5)]);
});

[CLIMATE.TEMPERATE, CLIMATE.TROPICAL, CLIMATE.DESERT, CLIMATE.WASTE, CLIMATE.POLAR, CLIMATE.SHADOWLAND].forEach((climate, modifier) =>
  test(`${climate.name} cliff climate`, () => {
    // Setup
    const neighbors = cliffNeighbors(1);
    // Assertion
    assert.deepEqual(getSkillAndTN("foot", { climate: climate.id, vegetation: 1 }, neighbors, 1), [new SkillCheck("Athletics", "Strength", 10 + modifier)]);
  }),
);

test("invalid current cells, directions, neighbors, and destinations throw", () => {
  // Setup
  const neighbors = Array.from({ length: 8 }, () => ({}));
  // Assertion
  [[], Array(8), Array(8).fill(null), Array(8).fill({ terrain: 99 })].forEach((invalid) => assert.throws(() => getSkillAndTN("foot", {}, invalid, 0), TypeError));
  assert.throws(() => getSkillAndTN("foot", null, neighbors, 0), TypeError);
  assert.throws(() => getSkillAndTN("foot", {}, neighbors, 8), TypeError);
});
