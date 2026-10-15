import assert from "node:assert/strict";
import test from "node:test";
import { BEASTIARY } from "../docs/scripts/beastiary.js";
import { CLIMATE, TERRAIN } from "../docs/scripts/world-map-layers.js";

test("BEASTIARY is frozen and contains unique names", () => {
  assert.equal(Object.isFrozen(BEASTIARY), true);
  assert.equal(new Set(BEASTIARY.map(({ name }) => name)).size, BEASTIARY.length);
});

test("BEASTIARY contains the full planned roster", () => {
  assert.equal(BEASTIARY.length, 128);
  for (const [encounterType, expectedCount] of [
    ["animal", 35], ["criminal", 6], ["shadowland", 36], ["spirit", 51],
  ]) {
    assert.equal(BEASTIARY.filter((beast) => beast.encounterType === encounterType).length, expectedCount);
  }
});

test("criminals include at least one beast at every rank", () => {
  const ranks = new Set(BEASTIARY.filter(({ encounterType }) => encounterType === "criminal")
    .map(({ rank }) => rank));
  assert.deepEqual([...ranks].sort(), [1, 2, 3, 4, 5]);
});

test("desert Jinn use only the desert climate", () => {
  for (const beast of BEASTIARY.filter(({ name }) => name.endsWith("Jinn"))) {
    assert.deepEqual(beast.climate, [CLIMATE.DESERT.id]);
  }
});

test("existing swamp creatures include wetlands", () => {
  for (const name of [
    "Bog Hag", "Kumo", "Kappa", "Ningyo", "Yama-uba", "Oni-bi", "Gaki", "Mokumokuren",
  ]) {
    assert.ok(BEASTIARY.find((beast) => beast.name === name).terrain.includes(TERRAIN.WETLANDS.id));
  }
});

test("swamp creature concepts are not duplicated", () => {
  assert.equal(BEASTIARY.filter(({ name }) => name === "Giant Alligator").length, 1);
  assert.equal(BEASTIARY.filter(({ name }) => name === "Wani").length, 1);
  assert.equal(BEASTIARY.some(({ name }) => /goblin/i.test(name)), false);
});
