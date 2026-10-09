import assert from "node:assert/strict";
import test from "node:test";
import { L5RPathing } from "../docs/scripts/pathing.js";
import { TERRAIN, INFRASTRUCTURE, SETTLEMENT, CLAN } from "../docs/scripts/world-map-layers.js";

function createPather(terrain, infrastructure = null) {
  return Object.assign(Object.create(L5RPathing.prototype), {
    getTerrain: (x) => x === 0 ? TERRAIN.FLAT.name : terrain,
    getInfrastructure: () => infrastructure,
    getTileData: () => ({ terrain, cost: 100, costRoad: 50, zeni: 2, tn: null, prob: 1, hasRoad: false }),
    getClan: () => null,
    skillConfig: { swim: { allowed: true, tn: 20 } },
    travelPapers: {}, avoidClans: {},
  });
}

const from = { x: 0, y: 0 };
const to = { x: 1, y: 0 };

test("foot travel cannot enter water without a bridge", () => {
  // Setup
  const pather = createPather(TERRAIN.WATER.name);
  // Execution
  const transition = pather.transitionAs(from, "foot", to, "foot");
  // Assertion
  assert.equal(transition, null);
});

test("large ports add boarding time when entering a ship", () => {
  // Setup
  const pather = createPather(TERRAIN.OCEAN.name, INFRASTRUCTURE.LARGE_PORT.name);
  // Execution
  const transition = pather.transitionAs(from, "foot", to, "ship");
  // Assertion
  assert.equal(transition.cost, 400);
});

test("small ports cannot board ocean ships", () => {
  // Setup
  const pather = createPather(TERRAIN.OCEAN.name, INFRASTRUCTURE.SMALL_PORT.name);
  // Execution
  const transition = pather.transitionAs(from, "foot", to, "ship");
  // Assertion
  assert.equal(transition, null);
});

test("city travel requires papers for the destination clan", () => {
  // Setup
  const pather = createPather(SETTLEMENT.CITY.name);
  pather.getClan = () => CLAN.CRAB.name;
  // Execution
  const transition = pather.transitionAs(from, "foot", to, "foot");
  // Assertion
  assert.deepEqual(transition.checks[0].skills, ["sneak", "forgery"]);
});

test("existing lower-case water inputs retain their initial ship mode", () => {
  // Setup
  const pather = createPather(TERRAIN.WATER.name);
  // Execution
  const mode = pather.initialMode(to);
  // Assertion
  assert.equal(mode, "ship");
});

test("existing title-case water inputs retain river boat boarding", () => {
  // Setup
  const name = TERRAIN.WATER.name[0].toUpperCase() + TERRAIN.WATER.name.slice(1);
  const pather = createPather(name, INFRASTRUCTURE.SMALL_PORT.name);
  // Execution
  const transition = pather.transitionAs(from, "foot", to, "river boat");
  // Assertion
  assert.equal(transition.cost, 400);
});
