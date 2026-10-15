import assert from "node:assert/strict";
import test from "node:test";
import { rollEncounter, getSkillAndTN, ENCOUNTER_CHANCES } from "../docs/scripts/encounter-check.js";
import { SPIRIT } from "../docs/scripts/world-map-layers.js";

test("each type gets exactly one independent roll", (context) => {
  const rolls = [0.09, ENCOUNTER_CHANCES[5], 0, ENCOUNTER_CHANCES[2]];
  const random = context.mock.method(Math, "random", () => rolls.shift());
  assert.deepEqual(rollEncounter(4, 5, 3, 2), ["spirit", "animal"]);
  assert.equal(rolls.length, 0);
  assert.equal(random.mock.callCount(), 4);
});

test("level zero threshold is exclusive and still rolls four times", (context) => {
  const random = context.mock.method(Math, "random", () => ENCOUNTER_CHANCES[0]);
  assert.deepEqual(rollEncounter(0, 0, 0, 0), []);
  assert.equal(random.mock.callCount(), 4);
});

ENCOUNTER_CHANCES.slice(1).forEach((chance, index) => test(`level ${index + 1} threshold is exclusive`, (context) => {
  const otherLevels = [ENCOUNTER_CHANCES[0], ENCOUNTER_CHANCES[0], ENCOUNTER_CHANCES[0]];
  const atThreshold = [chance, ...otherLevels];
  const belowThreshold = [chance / 2, ...otherLevels];
  const random = context.mock.method(Math, "random", () => atThreshold.shift());
  assert.deepEqual(rollEncounter(index + 1, 0, 0, 0), []);
  random.mock.mockImplementation(() => belowThreshold.shift());
  assert.deepEqual(rollEncounter(index + 1, 0, 0, 0), ["spirit"]);
}));

test("all encounters can occur together", (context) => {
  context.mock.method(Math, "random", () => 0);
  assert.deepEqual(rollEncounter(5, 5, 5, 5), ["spirit", "shadowland", "animal", "criminal"]);
});

test("invalid levels are rejected before rolling", (context) => {
  const random = context.mock.method(Math, "random", () => assert.fail("Unexpected roll"));
  [undefined, null, -1, 6, 1.5, NaN, true, "3", "Medium", SPIRIT.MEDIUM, { value: 3 }].forEach((level) =>
    assert.throws(() => rollEncounter(0, 0, 0, level), TypeError));
  assert.equal(random.mock.callCount(), 0);
});

Object.entries({ spirit: 20, shadowland: 25, animal: 15, criminal: 20 }).forEach(([type, tn]) =>
  test(`${type} offers three independent alternatives`, () => {
    const checks = getSkillAndTN(` ${type.toUpperCase()} `);
    assert.deepEqual(checks, ["Horsemanship", "Athletics", "Stealth"].map((skill) => ({ skill, tn })));
    checks[0].tn = 0;
    assert.equal(getSkillAndTN(type)[0].tn, tn);
  }));

test("unknown encounter types are rejected", () => {
  [null, 0, "unknown", "__proto__"].forEach((type) => assert.throws(() => getSkillAndTN(type), TypeError));
});
