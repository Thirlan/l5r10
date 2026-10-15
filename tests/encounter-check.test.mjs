import assert from "node:assert/strict";
import test from "node:test";
import { rollEncounter, getSkillAndTN, ENCOUNTER_CHANCES } from "../docs/scripts/encounter-check.js";
import { SPIRIT } from "../docs/scripts/world-map-layers.js";

test("each type gets exactly one independent roll", () => {
  const rolls = [0.19, 0.2, 0.01, 0.9];
  assert.deepEqual(rollEncounter(SPIRIT.MEDIUM, " Medium ", 3, 3, () => rolls.shift()), ["spirit", "animal"]);
  assert.equal(rolls.length, 0);
});

test("level zero never produces an encounter but still rolls four times", () => {
  let calls = 0;
  assert.deepEqual(rollEncounter(0, 0, 0, 0, () => { calls += 1; return 0; }), []);
  assert.equal(calls, 4);
});

ENCOUNTER_CHANCES.slice(1).forEach((chance, index) => test(`level ${index + 1} threshold is exclusive`, () => {
  assert.deepEqual(rollEncounter(index + 1, 0, 0, 0, () => chance), []);
  assert.deepEqual(rollEncounter(index + 1, 0, 0, 0, () => chance - 0.001), ["spirit"]);
}));

test("all encounters can occur together", () => {
  assert.deepEqual(rollEncounter(5, 5, 5, 5, () => 0), ["spirit", "shadowland", "animal", "criminal"]);
});

test("invalid levels are rejected before rolling", () => {
  [undefined, null, -1, 6, 1.5, NaN, true, "unknown", { value: 6 }].forEach((level) =>
    assert.throws(() => rollEncounter(0, 0, 0, level, () => assert.fail("Unexpected roll")), TypeError));
});

test("invalid random sources and results are rejected", () => {
  assert.throws(() => rollEncounter(0, 0, 0, 0, null), TypeError);
  [-1, 1, NaN, Infinity, "0"].forEach((roll) =>
    assert.throws(() => rollEncounter(0, 0, 0, 0, () => roll), TypeError));
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
