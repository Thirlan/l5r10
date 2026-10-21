import assert from "node:assert/strict";
import test from "node:test";
import { getSkillAndTN } from "../docs/scripts/terrain-skill-check.js";
import { SkillCheck } from "../docs/scripts/skill-check.js";
import { CLIMATE, INFRASTRUCTURE, TERRAIN } from "../docs/scripts/world-map-layers.js";

// Setup
const river = { river: 1, "river direction": { 0: 1 } };
const cliff = { terrain: TERRAIN.CLIFF.id, "cliff direction": { 2: 1 } };

[
  ["flat", {}, "Survival", "Perception", 5],
  ["hills", { terrain: TERRAIN.HILLS.id }, "Athletics", "Stamina", 6],
  ["wetlands", { terrain: TERRAIN.WETLANDS.id }, "Athletics", "Stamina", 7],
  ["mountains", { terrain: TERRAIN.MOUNTAINS.id }, "Athletics", "Stamina", 8],
  ["equal environmental and terrain difficulty", { terrain: TERRAIN.HILLS.id, climate: CLIMATE.TROPICAL.id }, "Survival", "Perception", 7],
  ["vegetation", { vegetation: 1 }, "Survival", "Perception", 6],
  ["combined modifiers", { terrain: TERRAIN.MOUNTAINS.id, climate: CLIMATE.DESERT.id, vegetation: 1 }, "Survival", "Perception", 11],
  ["road reduction", { terrain: TERRAIN.MOUNTAINS.id, climate: CLIMATE.DESERT.id, vegetation: 1, infrastructure: INFRASTRUCTURE.ROAD.id }, "Survival", "Perception", 7],
  ["footpath reduction", { terrain: TERRAIN.MOUNTAINS.id, infrastructure: INFRASTRUCTURE.FOOTPATH.id }, "Athletics", "Stamina", 6],
  ["road minimum", { infrastructure: INFRASTRUCTURE.ROAD.id }, "Survival", "Perception", 5],
  ["small port", { infrastructure: INFRASTRUCTURE.SMALL_PORT.id }, "Survival", "Perception", 5],
  ["large port", { infrastructure: INFRASTRUCTURE.LARGE_PORT.id }, "Survival", "Perception", 5],
].forEach(([name, cell, skill, trait, tn]) =>
  test(name, () => {
    // Execution
    const result = getSkillAndTN("foot", cell, 2);
    // Assertion
    assert.deepEqual(result, new SkillCheck(skill, trait, tn));
  }),
);

[CLIMATE.TEMPERATE, CLIMATE.TROPICAL, CLIMATE.DESERT, CLIMATE.WASTE, CLIMATE.POLAR, CLIMATE.SHADOWLAND].forEach((climate, modifier) =>
  test(`${climate.name} climate modifier`, () => {
    // Execution
    const result = getSkillAndTN("foot", { climate: climate.id }, 0);
    // Assertion
    assert.deepEqual(result, new SkillCheck(modifier === 5 ? "Lore: Shadowlands" : "Survival", "Perception", 5 + modifier));
  }),
);

["foot", "horse", "caravan", "army"].forEach((mode) =>
  test(`${mode} uses the land check`, () => {
    // Execution
    const result = getSkillAndTN(mode, { climate: CLIMATE.DESERT.id }, 0);
    // Assertion
    assert.deepEqual(result, new SkillCheck("Survival", "Perception", 7));
  }),
);

[
  ["inland water", { terrain: TERRAIN.WATER.id }, false, 5],
  ["downstream river", river, false, 9],
  ["upstream river", river, true, 13],
  ["coast", { terrain: TERRAIN.COASTAL_WATER.id }, false, 17],
  ["ocean", { terrain: TERRAIN.OCEAN.id }, false, 21],
].forEach(([name, cell, current, tn]) =>
  test(`Sailing difficulty: ${name}`, () => {
    // Execution
    const results = ["river boat", "ship"].map((mode) => getSkillAndTN(mode, cell, 2, current));
    // Assertion
    results.forEach((result) => assert.deepEqual(result, new SkillCheck("Sailing", "Intelligence", tn)));
  }),
);

test("Sailing uses environment, not land terrain or road reductions", () => {
  // Execution
  const result = getSkillAndTN("ship", { ...river, terrain: TERRAIN.MOUNTAINS.id, climate: CLIMATE.SHADOWLAND.id, vegetation: 1, infrastructure: INFRASTRUCTURE.ROAD.id }, 0);
  // Assertion
  assert.deepEqual(result, new SkillCheck("Sailing", "Intelligence", 15));
});

[
  ["river swimming is handled separately", river, 2, false, "Survival", "Perception", 5],
  ["river current does not change land exposure", river, 2, true, "Survival", "Perception", 5],
  ["parallel river", river, 0, false, "Survival", "Perception", 5],
  ["antiparallel river", river, 4, false, "Survival", "Perception", 5],
  ["road bridge", { ...river, infrastructure: INFRASTRUCTURE.ROAD.id }, 2, false, "Survival", "Perception", 5],
  ["footpath bridge", { ...river, infrastructure: INFRASTRUCTURE.FOOTPATH.id }, 2, false, "Survival", "Perception", 5],
  ["cliff climbing is handled separately", cliff, 2, false, "Athletics", "Stamina", 9],
  ["along cliff", cliff, 0, false, "Athletics", "Stamina", 9],
  ["away from cliff edge", cliff, 6, false, "Athletics", "Stamina", 9],
  ["road bypasses cliff", { ...cliff, infrastructure: INFRASTRUCTURE.ROAD.id }, 2, false, "Athletics", "Stamina", 5],
  ["footpath bypasses cliff on foot", { ...cliff, infrastructure: INFRASTRUCTURE.FOOTPATH.id }, 2, false, "Athletics", "Stamina", 7],
  ["river presence does not suppress Shadowland lore", { ...river, climate: CLIMATE.SHADOWLAND.id }, 2, false, "Lore: Shadowlands", "Perception", 10],
  ["cliffs and rivers do not replace exposure checks", { ...cliff, ...river, climate: CLIMATE.POLAR.id }, 2, true, "Survival", "Perception", 13],
].forEach(([name, cell, direction, current, skill, trait, tn]) =>
  test(name, () => {
    // Execution
    const result = getSkillAndTN("foot", cell, direction, current);
    // Assertion
    assert.deepEqual(result, new SkillCheck(skill, trait, tn));
  }),
);

test("mounted travel retains its ordinary terrain check on cliffs", () => {
  // Execution
  const result = getSkillAndTN("horse", { ...cliff, infrastructure: INFRASTRUCTURE.FOOTPATH.id }, 2);
  // Assertion
  assert.deepEqual(result, new SkillCheck("Athletics", "Stamina", 7));
});

[TERRAIN.WATER, TERRAIN.COASTAL_WATER, TERRAIN.OCEAN].forEach((terrain, index) =>
  test(`swimming in ${terrain.name}`, () => {
    // Execution
    const result = getSkillAndTN("foot", { terrain: terrain.id }, 0);
    // Assertion
    assert.deepEqual(result, new SkillCheck("Athletics", "Strength", [5, 17, 21][index]));
  }),
);

test("a road bridges inland water, but not coastal water", () => {
  // Execution
  const inland = getSkillAndTN("foot", { terrain: TERRAIN.WATER.id, infrastructure: INFRASTRUCTURE.ROAD.id }, 0);
  const coast = getSkillAndTN("foot", { terrain: TERRAIN.COASTAL_WATER.id, infrastructure: INFRASTRUCTURE.ROAD.id }, 0);
  // Assertion
  assert.deepEqual(inland, new SkillCheck("Survival", "Perception", 5));
  assert.deepEqual(coast, new SkillCheck("Athletics", "Strength", 13));
});

test("invalid current and boats without water are rejected", () => {
  // Assertion
  assert.throws(() => getSkillAndTN("foot", {}, 0, 1), TypeError);
  assert.throws(() => getSkillAndTN("ship", {}, 0), TypeError);
});

[
  [CLIMATE.TEMPERATE, 0],
  [CLIMATE.TROPICAL, 0],
  [CLIMATE.DESERT, 0],
  [CLIMATE.WASTE, 0],
  [CLIMATE.POLAR, 4],
  [CLIMATE.SHADOWLAND, 5],
].forEach(([climate, modifier]) => {
  [
    ["inland water", { terrain: TERRAIN.WATER.id }, 5],
    ["coastal water", { terrain: TERRAIN.COASTAL_WATER.id }, 17],
    ["ocean", { terrain: TERRAIN.OCEAN.id }, 21],
    ["river", river, 9],
  ].forEach(([name, cell, baseTN]) => {
    (name === "river" ? ["ship"] : ["foot", "ship"]).forEach((mode) =>
      test(`${climate.name} climate on ${name} by ${mode}`, () => {
        // Execution
        const result = getSkillAndTN(mode, { ...cell, climate: climate.id }, 2);
        // Assertion
        assert.deepEqual(result, new SkillCheck(mode === "ship" ? "Sailing" : "Athletics", mode === "ship" ? "Intelligence" : "Strength", baseTN + modifier));
      }),
    );
  });
});

test("bridges and walking alongside rivers keep land climate modifiers", () => {
  // Execution
  const alongside = getSkillAndTN("foot", { ...river, climate: CLIMATE.DESERT.id }, 0);
  const bridge = getSkillAndTN("foot", { ...river, climate: CLIMATE.WASTE.id, vegetation: 1, infrastructure: INFRASTRUCTURE.ROAD.id }, 2);
  // Assertion
  assert.deepEqual(alongside, new SkillCheck("Survival", "Perception", 7));
  assert.deepEqual(bridge, new SkillCheck("Survival", "Perception", 5));
});
