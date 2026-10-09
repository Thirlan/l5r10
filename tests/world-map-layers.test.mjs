import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../docs/scripts/world-map-layers.js", import.meta.url), "utf8");
const layers = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);
const { LayerDefinition, LayerValue, SettlementValue } = layers;

test("layer values expose immutable IDs and names", () => {
  const value = new LayerValue(0, "flat");

  assert.deepEqual({ id: value.id, name: value.name }, { id: 0, name: "flat" });
  assert.ok(Object.isFrozen(value));
  assert.throws(() => { value.id = 2; }, TypeError);
});

test("settlement values expose immutable type labels", () => {
  const value = new SettlementValue(1, "Village", "Village", "Mura");

  assert.deepEqual(
    { id: value.id, name: value.name, englishType: value.englishType, rokuganiType: value.rokuganiType },
    { id: 1, name: "Village", englishType: "Village", rokuganiType: "Mura" },
  );
  assert.ok(Object.isFrozen(value));
  assert.throws(() => { value.englishType = "City"; }, TypeError);
});

test("layer definitions look up numeric IDs without coercion", () => {
  const flat = new LayerValue(0, "flat");
  const layer = new LayerDefinition("terrain", "Terrain Layer", [flat]);

  assert.equal(layer.getValue(0), flat);
  assert.equal(layer.getValue("0"), undefined);
  assert.equal(layer.getValue(1), undefined);
  assert.ok(Object.isFrozen(layer));
  assert.ok(Object.isFrozen(layer.values));
});

test("layer definitions reject duplicate IDs and non-value entries", () => {
  assert.throws(
    () => new LayerDefinition("terrain", "Terrain Layer", [new LayerValue(0, "flat"), new LayerValue(0, "water")]),
    TypeError,
  );
  assert.throws(() => new LayerDefinition("terrain", "Terrain Layer", [{}]), TypeError);
});

test("base layer catalogs preserve source IDs and names", () => {
  const expected = {
    TERRAIN: [[0, "flat"], [1, "hills"], [2, "mountains"], [3, "water"], [4, "coastal water"], [5, "ocean"], [7, "wetlands"], [8, "cliff"]],
    CLIMATE: [[0, "temperate"], [1, "tropical"], [2, "desert"], [3, "polar"], [4, "waste"], [5, "shadowland"]],
    VEGETATION: [[0, "none"], [1, "Vegetation"]],
    RIVER: [[0, "none"], [1, "River"]],
    INFRASTRUCTURE: [[0, "none"], [1, "Road"], [2, "Footpath"], [3, "Small Port"], [4, "Large Port"]],
  };

  for (const [name, entries] of Object.entries(expected)) {
    assert.deepEqual(
      Object.values(layers[name]).map(({ id, name: label }) => [id, label]),
      entries,
    );
    assert.ok(Object.isFrozen(layers[name]));
    for (const value of Object.values(layers[name])) assert.ok(Object.isFrozen(value));
  }
});

test("clan and settlement catalogs preserve source values and settlement labels", () => {
  assert.deepEqual(
    Object.values(layers.CLAN).map(({ id, name }) => [id, name]),
    [[0, "none"], [1, "Crab"], [2, "Crane"], [3, "Dragon"], [4, "Lion"], [5, "Phoenix"], [6, "Scorpion"], [7, "Unicorn"], [8, "Imperial"], [9, "Hare"], [10, "Centipede"], [11, "Fox"], [12, "Badger"], [13, "Dragonfly"], [14, "Falcon"], [15, "Sparrow"], [16, "Tortoise"], [17, "Mantis"], [18, "Shadowlands"]],
  );
  assert.deepEqual(
    Object.values(layers.SETTLEMENT).map(({ id, name, englishType, rokuganiType }) => [id, name, englishType, rokuganiType]),
    [[0, "none", "", ""], [1, "Village", "Village", "Mura"], [2, "City", "City", "Toshi"], [3, "Capital", "Capital", "Shuto"], [4, "Fortification", "Fortification", ""], [5, "Castle", "Castle", "Shiro"], [6, "Kyuden", "Palace", "Kyuden"], [10, "Small Shrine", "Small Shrine", "Shōsha"], [11, "Large Shrine", "Large Shrine", "Taisha"], [12, "Village Ruins", "Village Ruins", ""], [13, "Castle Ruins", "Castle Ruins", ""], [14, "Academy", "Academy", ""], [15, "Watchtower", "Watchtower", ""], [16, "Small Temple", "Small Temple", ""], [17, "Large Temple", "Large Temple", ""]],
  );
});

test("resources preserve IDs and names without type labels", () => {
  const names = ["none", "Iron Mine", "Lumber Mill", "Rice Paddy", "Grain Farm", "Silk Farm", "Tea Plantation", "Hemp Farm", "Cotton Farm", "Fruit Orchard", "Sheep Pasture", "Goat Pasture", "Horse Ranch", "Cattle Farm", "Salt Works", "Nut Grove", "Mushroom Farm", "Spice Farm", "Poultry Farm", "Poppy Farm", "Dye Crop Farm", "Jade Mine", "Copper Mine", "Gold Mine", "Silver Mine", "Coal Mine", "Clay Pit", "Gemstone Mine", "Stone Quarry", "Coastal Fish Boat", "Crab Boat", "Pearl Divers", "Shellfish Boat", "Squid Boat", "Ocean Fish Boat", "Kelp Farm", "Tropical Fruit Orchard", "Tropical Lumber Mill", "Utaku Ranch", "Vegetable Farm"];

  assert.deepEqual(
    Object.values(layers.RESOURCE).map(({ id, name }) => [id, name]),
    names.map((name, id) => [id, name]),
  );
  for (const value of Object.values(layers.RESOURCE)) {
    assert.deepEqual(Object.keys(value), ["id", "name"]);
  }
});

test("optional overlays and LAYERS preserve complete layer definitions", () => {
  for (const name of ["ANIMAL", "SPIRIT", "SHADOWLAND", "CRIME"]) {
    assert.deepEqual(
      Object.values(layers[name]).map(({ id, name: label }) => [id, label]),
      [[0, "none"], [1, "low"], [2, "medium"], [3, "high"], [4, "extreme"]],
    );
  }
  assert.deepEqual(
    Object.values(layers.FERTILITY).map(({ id, name }) => [id, name]),
    [[0, "none"], [1, "low"], [2, "medium"], [3, "high"]],
  );

  const expected = [
    ["TERRAIN", "terrain", "Terrain Layer"], ["CLIMATE", "climate", "Climate Layer"],
    ["VEGETATION", "vegetation", "Vegetation Layer"], ["RIVER", "river", "River Layer"],
    ["INFRASTRUCTURE", "infrastructure", "Infrastructure Layer"], ["CLAN", "clan", "Clan Layer"],
    ["SETTLEMENT", "settlement", "Settlement Layer"], ["RESOURCE", "resource", "Resource Layer"],
    ["ANIMAL", "animal", "Animal Layer"], ["SPIRIT", "spirit", "Spirit Layer"],
    ["SHADOWLAND", "shadowland", "Shadowland Layer"], ["CRIME", "crime", "Crime Layer"],
    ["FERTILITY", "fertility", "Land Fertility Layer"],
  ];
  assert.deepEqual(
    Object.values(layers.LAYERS).map(({ id, name }) => [id, name]),
    expected.map(([, id, name]) => [id, name]),
  );
  for (const [key] of expected) {
    const definition = layers.LAYERS[key];
    assert.ok(Object.isFrozen(definition));
    assert.deepEqual(definition.values, Object.values(layers[key]));
    assert.equal(definition.getValue(0), Object.values(layers[key])[0]);
  }
  assert.equal(layers.FERTILITY.EXTREME, undefined);
});
