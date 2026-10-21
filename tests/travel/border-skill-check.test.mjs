import assert from "node:assert/strict";
import test from "node:test";
import { getSkillAndTN } from "../../docs/scripts/travel/border-skill-check.js";
import { SkillCheck } from "../../docs/scripts/skill-check.js";

[
  ["different clans", { clan: 1, infrastructure: 1 }, { clan: 2, infrastructure: 1 }],
  ["neutral source", { infrastructure: 1 }, { clan: 2, infrastructure: 1 }],
  ["neutral destination", { clan: 1, infrastructure: 1 }, { infrastructure: 1 }],
].forEach(([name, cell, destination]) =>
  test(`checkpoint: ${name}`, () => {
    // Execution
    const result = getSkillAndTN(Object.freeze(cell), Object.freeze(destination));
    // Assertion
    assert.deepEqual(result, [new SkillCheck("Forgery", "Intelligence", 20), new SkillCheck("Stealth", "Agility", 20)]);
  }),
);

[
  ["same clan", { clan: 1, infrastructure: 1 }, { clan: 1, infrastructure: 1 }],
  ["both neutral", { infrastructure: 1 }, { infrastructure: 1 }],
  ["missing layers", {}, {}],
  ["no source road", { clan: 1 }, { clan: 2, infrastructure: 1 }],
  ["no destination road", { clan: 1, infrastructure: 1 }, { clan: 2 }],
  ["footpath", { clan: 1, infrastructure: 2 }, { clan: 2, infrastructure: 2 }],
].forEach(([name, cell, destination]) =>
  test(`no checkpoint: ${name}`, () => {
    // Assertion
    assert.equal(getSkillAndTN(cell, destination), null);
  }),
);

test("border checks do not need terrain, transport, papers, or character skills", () => {
  // Setup
  const cell = { clan: 1, infrastructure: 1, terrain: 99 };
  const destination = { clan: 2, infrastructure: 1, river: 1 };
  // Assertion
  assert.deepEqual(getSkillAndTN(cell, destination), [new SkillCheck("Forgery", "Intelligence", 20), new SkillCheck("Stealth", "Agility", 20)]);
});

[null, [], 1, { clan: 99 }, { clan: "1" }, { infrastructure: null }, { infrastructure: 99 }].forEach((cell, index) =>
  test(`rejects invalid border input ${index} at either endpoint`, () => {
    // Assertion
    assert.throws(() => getSkillAndTN(cell, {}), TypeError);
    assert.throws(() => getSkillAndTN({}, cell), TypeError);
  }),
);
