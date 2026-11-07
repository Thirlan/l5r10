import assert from "node:assert/strict";
import test from "node:test";
import { getSkillAndTN } from "../../../docs/scripts/world/game-rules/cliff-skill-check.js";
import { SkillCheck } from "../../../docs/scripts/skill-check.js";
import { TERRAIN } from "../../../docs/scripts/world/data/world-map-layers.js";

function neighbors(destination, direction = 0) {
  const cells = Array.from({ length: 8 }, () => ({}));
  cells[direction] = destination;
  return cells;
}

[0, 1, 2, 3, 4, 5, 6, 7].forEach((direction) => {
  test(`elevation crossing toward ${direction} works uphill and downhill`, () => {
    const high = { elevation: 100 };
    const expected = [new SkillCheck("Athletics", "Strength", 10)];
    assert.deepEqual(getSkillAndTN("foot", {}, neighbors(high, direction), direction), expected);
    assert.deepEqual(getSkillAndTN("foot", high, neighbors({}, direction), direction), expected);
  });
});

[
  [0, null],
  [74, null],
  [75, 10],
  [99, 10],
  [100, 15],
  [124, 15],
  [125, 20],
  [1000, 195],
].forEach(([difference, tn]) => {
  test(`a ${difference} metre difference gives TN ${tn}`, () => {
    const result = getSkillAndTN("foot", { elevation: 0 }, neighbors({ elevation: difference }), 0);
    assert.deepEqual(result, tn === null ? [] : [new SkillCheck("Athletics", "Strength", tn)]);
  });
});

test("roads and footpaths must continue across both cells to bypass climbing", () => {
  assert.deepEqual(getSkillAndTN("foot", { infrastructure: 1 }, neighbors({ elevation: 100, infrastructure: 2 }), 0), []);
  assert.deepEqual(getSkillAndTN("horse", { infrastructure: 1 }, neighbors({ elevation: 100, infrastructure: 1 }), 0), []);
  const expected = [new SkillCheck("Athletics", "Strength", 10)];
  assert.deepEqual(getSkillAndTN("horse", { infrastructure: 2 }, neighbors({ elevation: 100, infrastructure: 2 }), 0), expected);
  assert.deepEqual(getSkillAndTN("foot", { infrastructure: 1 }, neighbors({ elevation: 100 }), 0), expected);
});

test("water depth differences do not require climbing but sea cliffs do", () => {
  const coast = { terrain: TERRAIN.COASTAL_WATER.id, elevation: -20 };
  const ocean = { terrain: TERRAIN.OCEAN.id, elevation: -4000 };
  assert.deepEqual(getSkillAndTN("ship", coast, neighbors(ocean), 0), []);
  assert.deepEqual(getSkillAndTN("foot", { elevation: 55 }, neighbors(coast), 0), [new SkillCheck("Athletics", "Strength", 10)]);
});

test("the confirmed elevation TN is not changed by climate or vegetation", () => {
  const cell = { elevation: -25, climate: 5, vegetation: 1 };
  const adjacent = neighbors({ elevation: 100 });
  const original = structuredClone({ cell, adjacent });
  assert.deepEqual(getSkillAndTN("foot", cell, adjacent, 0), [new SkillCheck("Athletics", "Strength", 20)]);
  assert.deepEqual({ cell, adjacent }, original);
});

test("invalid current cells, elevations, directions, and destinations throw", () => {
  const adjacent = neighbors({});
  [[], Array(8), Array(8).fill(null), Array(8).fill({ elevation: 1.5 })].forEach((invalid) => {
    assert.throws(() => getSkillAndTN("foot", {}, invalid, 0), TypeError);
  });
  assert.throws(() => getSkillAndTN("foot", null, adjacent, 0), TypeError);
  assert.throws(() => getSkillAndTN("foot", { elevation: "100" }, adjacent, 0), TypeError);
  assert.throws(() => getSkillAndTN("foot", {}, adjacent, 8), TypeError);
});
