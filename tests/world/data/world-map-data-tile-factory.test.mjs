import assert from "node:assert/strict";
import test from "node:test";
import { createWorldMapTile } from "../../../docs/scripts/world/data/world-map-data-tile-factory.js";
import { ANIMAL, CLAN, CLIMATE, CRIME, INFRASTRUCTURE, RESOURCE, RESOURCE_LEVEL, RIVER, SETTLEMENT, SHADOWLAND, SPIRIT, TERRAIN, VEGETATION } from "../../../docs/scripts/world/data/world-map-data-layers.js";
import { WorldMapDataTile } from "../../../docs/scripts/world/data/world-map-data-tile.js";

test("a tile without a saved cell has the default values of all layers", () => {
  // Execution
  const tile = createWorldMapTile(3, 4);

  // Assertion
  assert.equal(tile.x, 3);
  assert.equal(tile.y, 4);
  assert.equal(tile.terrain, TERRAIN.FLAT);
  assert.equal(tile.climate, CLIMATE.TEMPERATE);
  assert.equal(tile.vegetation, VEGETATION.NONE);
  assert.equal(tile.river, RIVER.NONE);
  assert.equal(tile.infrastructure, INFRASTRUCTURE.NONE);
  assert.equal(tile.clan, CLAN.NONE);
  assert.equal(tile.settlement, SETTLEMENT.NONE);
  assert.equal(tile.resource, RESOURCE.NONE);
  assert.equal(tile.resourceLevel, RESOURCE_LEVEL.NONE);
  [tile.animal, tile.spirit, tile.shadowland, tile.crime].forEach((level) => assert.equal(level.value, 0));
  assert.equal(tile.elevation, 1);
  assert.deepEqual(tile.riverDirections, [false, false, false, false, false, false, false, false]);
  assert.equal(tile.englishName, "");
  assert.equal(tile.rokuganiName, "");
  assert.equal(tile.label, null);
});

test("a tile resolves the saved values of all layers", () => {
  // Setup
  const cell = {
    terrain: 1,
    climate: 1,
    vegetation: 1,
    river: 1,
    "river direction": { 0: 0, 1: 0, 2: 1, 3: 0, 4: 1, 5: 0, 6: 0, 7: 0 },
    infrastructure: 1,
    clan: 2,
    settlement: 5,
    englishName: "Son of the Crane",
    rokuganiName: "Daidoji",
    resource: 1,
    resourceLevel: 4,
    animal: 4,
    spirit: 3,
    shadowland: 2,
    crime: 5,
    elevation: 250,
    text: { text: "Fukou Lake", fontSize: 8 },
  };

  // Execution
  const tile = createWorldMapTile(0, 0, cell);

  // Assertion
  assert.equal(tile.terrain, TERRAIN.HILLS);
  assert.equal(tile.climate, CLIMATE.TROPICAL);
  assert.equal(tile.vegetation, VEGETATION.PRESENT);
  assert.equal(tile.river, RIVER.PRESENT);
  assert.deepEqual(tile.riverDirections, [false, false, true, false, true, false, false, false]);
  assert.equal(tile.infrastructure, INFRASTRUCTURE.ROAD);
  assert.equal(tile.clan, CLAN.CRANE);
  assert.equal(tile.settlement, SETTLEMENT.CASTLE);
  assert.equal(tile.englishName, "Son of the Crane");
  assert.equal(tile.rokuganiName, "Daidoji");
  assert.equal(tile.resource, RESOURCE.IRON_MINE);
  assert.equal(tile.resourceLevel, RESOURCE_LEVEL.HIGH);
  assert.equal(tile.animal, ANIMAL.HIGH);
  assert.equal(tile.spirit, SPIRIT.MEDIUM);
  assert.equal(tile.shadowland, SHADOWLAND.LOW);
  assert.equal(tile.crime, CRIME.VERY_HIGH);
  assert.equal(tile.elevation, 250);
  assert.deepEqual(tile.label, { englishText: "Fukou Lake", rokuganiText: "Fukou Lake", fontSize: 8 });
});

test("a tile reads all saved label forms", () => {
  // Execution
  const plain = createWorldMapTile(0, 0, { text: "Lake" }).label;
  const english = createWorldMapTile(0, 0, { text: { englishText: "Sorrow's Path", rokuganiText: "", fontSize: 8 } }).label;
  const both = createWorldMapTile(0, 0, { text: { englishText: "Path", rokuganiText: "Michi" } }).label;

  // Assertion
  assert.deepEqual(plain, { englishText: "Lake", rokuganiText: "Lake", fontSize: null });
  assert.deepEqual(english, { englishText: "Sorrow's Path", rokuganiText: "Sorrow's Path", fontSize: 8 });
  assert.deepEqual(both, { englishText: "Path", rokuganiText: "Michi", fontSize: null });
});

test("a tile is a read-only data-only class instance", () => {
  // Setup
  const tile = createWorldMapTile(0, 0, { "river direction": { 0: 1 } });

  // Assertion
  assert.ok(tile instanceof WorldMapDataTile);
  assert.equal(Object.getPrototypeOf(tile), WorldMapDataTile.prototype);
  assert.deepEqual(Object.getOwnPropertyNames(WorldMapDataTile.prototype), ["constructor"]);
  assert.ok(Object.isFrozen(tile));
  assert.ok(Object.isFrozen(tile.riverDirections));
});

test("a tile rejects unknown layer values and bad cells", () => {
  // Assertion
  assert.throws(() => createWorldMapTile(1, 2, { terrain: 99 }), /1,2 has an unknown terrain value/);
  assert.throws(() => createWorldMapTile(0, 0, { elevation: 1.5 }), TypeError);
  assert.throws(() => createWorldMapTile(0, 0, { englishName: 7 }), TypeError);
  assert.throws(() => createWorldMapTile(0, 0, { text: { fontSize: 8 } }), TypeError);
  assert.throws(() => createWorldMapTile(0, 0, []), TypeError);
  assert.throws(() => createWorldMapTile(0.5, 0), TypeError);
});

test("a tile and all its nested values reject mutation", () => {
  const tile = createWorldMapTile(3, 4, { text: "Lake" });

  Object.values(tile).forEach((value) => {
    if (value !== null && typeof value === "object") assert.ok(Object.isFrozen(value));
  });
  assert.throws(() => {
    tile.x = 9;
  }, TypeError);
  assert.throws(() => {
    tile.terrain.id = 9;
  }, TypeError);
  assert.throws(() => {
    tile.crime.value = 9;
  }, TypeError);
  assert.throws(() => {
    tile.settlement.englishType = "Changed";
  }, TypeError);
  assert.throws(() => {
    tile.riverDirections[0] = true;
  }, TypeError);
  assert.throws(() => {
    tile.label.englishText = "Changed";
  }, TypeError);
  assert.throws(() => {
    tile.extra = true;
  }, TypeError);
  assert.throws(() => {
    delete tile.elevation;
  }, TypeError);
  assert.equal(Object.getPrototypeOf(tile), WorldMapDataTile.prototype);
  Object.values(Object.getOwnPropertyDescriptors(tile)).forEach((descriptor) => {
    assert.equal(descriptor.writable, false);
    assert.equal(descriptor.configurable, false);
  });
  assert.ok(Object.values(tile).every((value) => typeof value !== "function"));
});

test("tile construction copies mutable tile data and preserves catalog identity", () => {
  const original = createWorldMapTile(0, 0, { text: "Lake" });
  const riverDirections = [...original.riverDirections];
  const label = { ...original.label };
  const values = { ...original, riverDirections, label };
  const tile = new WorldMapDataTile(values);

  assert.deepEqual(Object.keys(tile), Object.keys(values));
  assert.equal(JSON.stringify(tile), JSON.stringify(values));
  values.x = 9;
  riverDirections[0] = true;
  label.englishText = "Changed";
  assert.equal(tile.x, 0);
  assert.ok(tile instanceof WorldMapDataTile);
  assert.equal(tile.riverDirections[0], false);
  assert.equal(tile.label.englishText, "Lake");
  assert.equal(tile.terrain, TERRAIN.FLAT);
  assert.equal(tile.settlement, SETTLEMENT.NONE);
  assert.throws(() => new WorldMapDataTile({ ...original, terrain: { id: 0, name: "flat" } }), /frozen catalog values/);
});
