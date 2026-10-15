import assert from "node:assert/strict";
import test from "node:test";
import {
  BeastiaryLookUpTable,
  getLookUpTable,
  rollEncounter,
  ENCOUNTER_CHANCES,
} from "../docs/scripts/encounter-check.js";
import { BEASTIARY } from "../docs/scripts/beastiary.js";
import { CLIMATE, RIVER, TERRAIN, VEGETATION } from "../docs/scripts/world-map-layers.js";

const MAP_CELL = [
  TERRAIN.FLAT.id,
  CLIMATE.TEMPERATE.id,
  VEGETATION.NONE.id,
  RIVER.NONE.id,
];

function rollAt(...levels) {
  return rollEncounter(...levels, ...MAP_CELL);
}

test("each type gets one independent chance roll at its level", (context) => {
  const rolls = [ENCOUNTER_CHANCES[4], ENCOUNTER_CHANCES[5], ENCOUNTER_CHANCES[3], ENCOUNTER_CHANCES[2]];
  const random = context.mock.method(Math, "random", () => rolls.shift());
  assert.deepEqual(rollAt(4, 5, 3, 2), []);
  assert.equal(rolls.length, 0);
  assert.equal(random.mock.callCount(), 4);
});

test("level zero threshold is exclusive and still rolls four times", (context) => {
  const random = context.mock.method(Math, "random", () => ENCOUNTER_CHANCES[0]);
  assert.deepEqual(rollAt(0, 0, 0, 0), []);
  assert.equal(random.mock.callCount(), 4);
});

ENCOUNTER_CHANCES.slice(1).forEach((chance, index) => test(`level ${index + 1} threshold is exclusive`, (context) => {
  const rolls = [chance, ENCOUNTER_CHANCES[0], ENCOUNTER_CHANCES[0], ENCOUNTER_CHANCES[0]];
  const random = context.mock.method(Math, "random", () => rolls.shift());
  assert.deepEqual(rollAt(index + 1, 0, 0, 0), []);
  random.mock.mockImplementation(() => 0);
  const encounters = rollAt(index + 1, 0, 0, 0);
  assert.equal(encounters[0].encounterType, "criminal");
}));

test("all encounter types can occur together in argument order", (context) => {
  context.mock.method(Math, "random", () => 0);
  const encounters = rollAt(5, 5, 5, 5);
  assert.deepEqual(encounters.map(({ encounterType }) => encounterType), [
    "criminal", "animal", "spirit", "shadowland",
  ]);
  assert.ok(encounters.every((encounter) => encounter.constructor.name === "BeastSelection"));
});

test("invalid levels and map IDs are rejected before rolling", (context) => {
  const random = context.mock.method(Math, "random", () => assert.fail("Unexpected roll"));
  [undefined, null, -1, 6, 1.5, NaN, true, "3"].forEach((level) =>
    assert.throws(() => rollAt(0, 0, 0, level), TypeError));
  assert.throws(() => rollEncounter(0, 0, 0, 0, 999, ...MAP_CELL.slice(1)), TypeError);
  assert.throws(() => rollEncounter(0, 0, 0, 0, ...MAP_CELL.slice(0, 3), -1), TypeError);
  assert.equal(random.mock.callCount(), 0);
});

test("lookup table ranges are contiguous and total the matching weights", (context) => {
  const table = getLookUpTable("animal", ...MAP_CELL);
  const matchingBeasts = BEASTIARY.filter((beast) => beast.encounterType === "animal"
    && beast.terrain.includes(MAP_CELL[0])
    && beast.climate.includes(MAP_CELL[1])
    && beast.vegetation.includes(MAP_CELL[2])
    && beast.river.includes(MAP_CELL[3]));
  assert.equal(table.diceRollSize, matchingBeasts.reduce((sum, beast) => sum + beast.weight, 0));
  assert.deepEqual(table.beastList.map(({ selectionFrom, selectionTo }) => [selectionFrom, selectionTo]),
    matchingBeasts.reduce((ranges, beast) => {
      const from = ranges.length ? ranges.at(-1)[1] : 0;
      ranges.push([from, from + beast.weight]);
      return ranges;
    }, []));
  assert.equal(Object.isFrozen(table), true);
  assert.equal(Object.isFrozen(table.beastList), true);
  assert.throws(() => table.add(matchingBeasts[0]), TypeError);
  context.mock.method(Math, "random", () => 0);
  assert.equal(table.select().name, matchingBeasts[0].name);
});

test("weighted selection uses an exclusive upper boundary", (context) => {
  const table = getLookUpTable("animal", ...MAP_CELL);
  const boundary = table.beastList[0].selectionTo;
  context.mock.method(Math, "random", () => boundary / table.diceRollSize);
  assert.equal(table.select().name, table.beastList[1].name);
});

test("map encounter levels do not filter eligible beast ranks", (context) => {
  const mountainCell = [
    TERRAIN.CLIFF.id,
    CLIMATE.POLAR.id,
    VEGETATION.NONE.id,
    RIVER.NONE.id,
  ];
  const table = getLookUpTable("animal", ...mountainCell);
  const rolls = [
    ENCOUNTER_CHANCES[0],
    0,
    (table.diceRollSize - 1) / table.diceRollSize,
    ENCOUNTER_CHANCES[0],
    ENCOUNTER_CHANCES[0],
  ];
  context.mock.method(Math, "random", () => rolls.shift());
  const [encounter] = rollEncounter(0, 1, 0, 0, ...mountainCell);
  assert.equal(encounter.name, "Mountain Troll");
  assert.equal(encounter.rank, 4);
});

test("empty lookup tables skip triggered encounters", (context) => {
  const rolls = [0, ENCOUNTER_CHANCES[0], ENCOUNTER_CHANCES[0], ENCOUNTER_CHANCES[0]];
  context.mock.method(Math, "random", () => rolls.shift());
  const emptyCell = [TERRAIN.WATER.id, CLIMATE.SHADOWLAND.id, VEGETATION.NONE.id, RIVER.NONE.id];
  assert.equal(getLookUpTable("criminal", ...emptyCell).select(), undefined);
  assert.deepEqual(rollEncounter(5, 0, 0, 0, ...emptyCell), []);
});

test("lookup tables reject invalid types and map IDs", () => {
  assert.throws(() => getLookUpTable("unknown", ...MAP_CELL), TypeError);
  assert.throws(() => getLookUpTable("animal", 999, ...MAP_CELL.slice(1)), TypeError);
  assert.throws(() => new BeastiaryLookUpTable(999, ...MAP_CELL.slice(1)), TypeError);
});
