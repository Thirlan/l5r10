import assert from "node:assert/strict";
import test from "node:test";
import { SkillCheck } from "../docs/scripts/skill-check.js";

test("SkillCheck stores fields and is immutable", () => {
  const check = new SkillCheck("Athletics", "Strength", 15);
  assert.deepEqual({ ...check }, { skill: "Athletics", trait: "Strength", tn: 15 });
  assert.equal(Object.isFrozen(check), true);
});

test("SkillCheck accepts a raw trait check", () => {
  assert.equal(new SkillCheck("", "Stamina", 15).skill, "");
});

test("SkillCheck rejects invalid fields", () => {
  for (const values of [
    [null, "Strength", 15], [" ", "Strength", 15], ["Athletics", "", 15],
    ["Athletics", "Strength", 0], ["Athletics", "Strength", 1.5],
  ]) {
    assert.throws(() => new SkillCheck(...values), TypeError);
  }
});
