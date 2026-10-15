import assert from "node:assert/strict";
import test from "node:test";
import { getSkillAndTN } from "../docs/scripts/terrain-skill-check.js";
import { TERRAIN, CLIMATE, VEGETATION, RIVER } from "../docs/scripts/world-map-layers.js";

test("clear land needs no check, regardless of current", () => {
  assert.deepEqual(getSkillAndTN(TERRAIN.FLAT, CLIMATE.TEMPERATE, VEGETATION.NONE, false, RIVER.NONE, true), []);
});

Object.entries({ hills: 10, mountains: 20, wetlands: 15, cliff: 25, water: 15, "coastal water": 20, ocean: 25 })
  .forEach(([terrain, tn]) => test(`${terrain} movement TN`, () => {
    assert.deepEqual(getSkillAndTN(terrain, 0, 0, false, 0), [{ skill: "Athletics", tn }]);
  }));

test("terrain, survival, and upstream checks remain separate", () => {
  assert.deepEqual(getSkillAndTN(" MOUNTAINS ", "polar", 1, true, 1, true), [
    { skill: "Athletics", tn: 20 }, { skill: "Hunting", tn: 25 }, { skill: "Athletics", tn: 20 },
  ]);
});

test("downstream rivers use TN 15", () => {
  assert.deepEqual(getSkillAndTN(0, 0, 0, false, 1), [{ skill: "Athletics", tn: 15 }]);
});

["tropical", "desert", "polar", "waste", "shadowland"].forEach((climate) =>
  test(`${climate} requires survival`, () => {
    assert.deepEqual(getSkillAndTN(0, climate, 0, false, 0), [{ skill: "Hunting", tn: 15 }]);
  }));

test("invalid layers, flags, and water combinations are rejected", () => {
  [[null, 0, 0, false, 0], [0, 99, 0, false, 0], [0, 0, 99, false, 0],
    [0, 0, 0, 1, 0], [0, 0, 0, false, 99], [0, 0, 0, false, 0, "yes"],
    [3, 0, 1, false, 0], [4, 0, 0, true, 0], [5, 0, 0, false, 1]]
    .forEach((args) => assert.throws(() => getSkillAndTN(...args), TypeError));
});
