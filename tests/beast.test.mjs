import assert from "node:assert/strict";
import test from "node:test";
import { Beast } from "../docs/scripts/beast.js";
import { SkillCheck } from "../docs/scripts/skill-check.js";
import { CLIMATE, RIVER, TERRAIN, VEGETATION } from "../docs/scripts/world-map-layers.js";

const beastData = {
  name: "Test Beast",
  encounterType: "animal",
  rank: 1,
  weight: 10,
  terrain: [TERRAIN.FLAT.id],
  climate: [CLIMATE.TEMPERATE.id],
  vegetation: [VEGETATION.NONE.id],
  river: [RIVER.NONE.id],
  spotSkillCheck: [new SkillCheck("Hunting", "Perception", 10)],
  avoidSkillCheck: [],
  escapeSkillCheck: [new SkillCheck("Athletics", "Strength", 15)],
  impactSkillCheck: [],
  encounterDescription: "A test beast threatens travelers.",
};

test("Beast accepts valid data and freezes lists", () => {
  const beast = new Beast(beastData);
  assert.equal(Object.isFrozen(beast), true);
  assert.equal(Object.isFrozen(beast.terrain), true);
  assert.equal(Object.isFrozen(beast.spotSkillCheck), true);
  assert.equal(beast.terrain[0], TERRAIN.FLAT.id);
});

test("Beast rejects invalid identity, rank, weight, IDs, and checks", () => {
  const invalidData = [
    { name: " " }, { encounterType: "unknown" }, { rank: 0 }, { weight: 101 },
    { terrain: [999] }, { climate: [] }, { vegetation: [null] },
    { river: [RIVER.NONE.id, -1] }, { spotSkillCheck: [{}] },
    { escapeSkillCheck: [] }, { encounterDescription: "Two sentences. No." },
  ];
  for (const invalid of invalidData) {
    assert.throws(() => new Beast({ ...beastData, ...invalid }), TypeError);
  }
});
