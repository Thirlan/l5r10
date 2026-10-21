import assert from "node:assert/strict";
import test from "node:test";
import { getSkillAndTN } from "../docs/scripts/river-skill-check.js";
import { SkillCheck } from "../docs/scripts/skill-check.js";
import { CLIMATE } from "../docs/scripts/world-map-layers.js";

function riverNeighbors(direction) {
  const neighbors = Array.from({ length: 8 }, () => ({}));
  [(direction + 7) % 8, (direction + 1) % 8].forEach((index) => {
    neighbors[index] = { river: 1, "river direction": { [(direction + 2) % 8]: 1 } };
  });
  return neighbors;
}

[1, 3, 5, 7].forEach((direction) =>
  test(`diagonal river toward ${direction}`, () => {
    // Setup
    const neighbors = riverNeighbors(direction);
    // Assertion
    assert.deepEqual(getSkillAndTN("foot", {}, neighbors, direction), [new SkillCheck("Athletics", "Strength", 9)]);
  }),
);

test("opposite flow also connects a diagonal river", () => {
  // Setup
  const neighbors = riverNeighbors(1);
  neighbors[0]["river direction"] = { 0: 1 };
  neighbors[2]["river direction"] = { 7: 1 };
  // Assertion
  assert.deepEqual(getSkillAndTN("foot", {}, neighbors, 1), [new SkillCheck("Athletics", "Strength", 9)]);
});

test("parallel rivers, missing flanks, and cardinal moves have no diagonal crossing", () => {
  // Setup
  const neighbors = riverNeighbors(1);
  neighbors[0]["river direction"] = { 1: 1 };
  neighbors[2]["river direction"] = { 1: 1 };
  // Assertion
  assert.deepEqual(getSkillAndTN("foot", {}, neighbors, 1), []);
  neighbors[0] = null;
  assert.deepEqual(getSkillAndTN("foot", {}, neighbors, 1), []);
  assert.deepEqual(getSkillAndTN("foot", {}, neighbors, 2), []);
});

test("two crossings return two distinct checks without changing inputs", () => {
  // Setup
  const cell = { river: 1, "river direction": { 0: 1 } };
  const neighbors = riverNeighbors(1);
  const original = structuredClone({ cell, neighbors });
  // Execution
  const checks = getSkillAndTN("foot", cell, neighbors, 1, true);
  // Assertion
  assert.deepEqual(checks, [new SkillCheck("Athletics", "Strength", 13), new SkillCheck("Athletics", "Strength", 13)]);
  assert.notEqual(checks[0], checks[1]);
  assert.deepEqual({ cell, neighbors }, original);
});

test("within-cell rivers use movement direction and current", () => {
  // Setup
  const neighbors = Array.from({ length: 8 }, () => ({}));
  const cell = { river: 1, "river direction": { 0: 1 } };
  // Assertion
  assert.deepEqual(getSkillAndTN("foot", cell, neighbors, 2), [new SkillCheck("Athletics", "Strength", 9)]);
  assert.deepEqual(getSkillAndTN("foot", cell, neighbors, 0), []);
  assert.deepEqual(getSkillAndTN("foot", cell, neighbors, 4), []);
});

[1, 2].forEach((infrastructure) =>
  test(`infrastructure ${infrastructure} bridges land crossings but not boats`, () => {
    // Setup
    const neighbors = riverNeighbors(1);
    const cell = { infrastructure, river: 1, "river direction": { 0: 1 } };
    neighbors[1].infrastructure = infrastructure;
    // Assertion
    assert.deepEqual(getSkillAndTN("foot", cell, neighbors, 1), []);
    assert.deepEqual(getSkillAndTN("ship", cell, neighbors, 1), [new SkillCheck("Sailing", "Intelligence", 9), new SkillCheck("Sailing", "Intelligence", 9)]);
  }),
);

test("incomplete bridges do not suppress diagonal river checks or inspect borders", () => {
  // Setup
  const neighbors = riverNeighbors(1);
  neighbors[1].clan = 2;
  // Assertion
  assert.deepEqual(getSkillAndTN("foot", { clan: 1, infrastructure: 1 }, neighbors, 1), [new SkillCheck("Athletics", "Strength", 5)]);
});

Object.values(CLIMATE).forEach((climate) =>
  ["foot", "ship"].forEach((mode) =>
    test(`${climate.name} river climate by ${mode}`, () => {
      // Setup
      const neighbors = riverNeighbors(1);
      const modifier = climate === CLIMATE.POLAR ? 4 : climate === CLIMATE.SHADOWLAND ? 5 : 0;
      // Assertion
      assert.deepEqual(getSkillAndTN(mode, { climate: climate.id, vegetation: 1 }, neighbors, 1, true), [new SkillCheck(mode === "ship" ? "Sailing" : "Athletics", mode === "ship" ? "Intelligence" : "Strength", 14 + modifier)]);
    }),
  ),
);

test("invalid cells, direction, neighbors, destination, and current throw", () => {
  // Setup
  const neighbors = Array.from({ length: 8 }, () => ({}));
  // Assertion
  [[], Array(8), Array(8).fill(null), Array(8).fill({ terrain: 99 })].forEach((invalid) => assert.throws(() => getSkillAndTN("foot", {}, invalid, 0), TypeError));
  assert.throws(() => getSkillAndTN("foot", null, neighbors, 0), TypeError);
  assert.throws(() => getSkillAndTN("foot", {}, neighbors, 8), TypeError);
  assert.throws(() => getSkillAndTN("foot", {}, neighbors, 0, "yes"), TypeError);
});
